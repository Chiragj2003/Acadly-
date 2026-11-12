import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { type AttendanceRecord } from '@/types/database';
import {
  enqueueAttendanceBatch,
  flushAttendanceQueue,
  QueuedAttendanceBatch,
} from '@/lib/offlineQueue';

export interface BatchAttendanceCommitInput {
  batchId: string;
  date: string;
  instituteId: string;
  records: {
    studentId: string;
    status: 'P' | 'A' | 'L';
    remarks?: string;
  }[];
}

export interface AttendanceAuditCorrectionInput {
  attendanceId: string;
  oldStatus: 'P' | 'A' | 'L';
  newStatus: 'P' | 'A' | 'L';
  reason: string;
  correctedBy: string;
  studentId?: string;
  studentName?: string;
  parentPushToken?: string;
}

/**
 * Fetch attendance records for a batch on a given date.
 */
export const getAttendanceByBatchAndDate = async (
  batchId: string,
  date: string
): Promise<AttendanceRecord[]> => {
  if (!isSupabaseConfigured || !batchId || !date) return [];

  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('batch_id', batchId)
    .eq('date', date);

  if (error) {
    throw new Error(`Failed to load attendance: ${error.message}`);
  }

  return (data || []) as AttendanceRecord[];
};

/**
 * Commit batch attendance in ONE upsert call for (batch_id, date).
 * On offline or network failure, automatically queues for background sync.
 */
export const commitBatchAttendance = async (
  input: BatchAttendanceCommitInput
): Promise<{ success: boolean; queuedOffline?: boolean; count: number }> => {
  const { batchId, date, instituteId, records } = input;

  if (!records || records.length === 0) {
    return { success: true, count: 0 };
  }

  const rows = records.map((r) => ({
    institute_id: instituteId,
    batch_id: batchId,
    student_id: r.studentId,
    date,
    status: r.status,
    remarks: r.remarks || null,
    marked_at: new Date().toISOString(),
  }));

  if (!isSupabaseConfigured) {
    const queueItem: QueuedAttendanceBatch = {
      id: `${batchId}-${date}-${Date.now()}`,
      batchId,
      date,
      instituteId,
      records,
      queuedAt: new Date().toISOString(),
    };
    await enqueueAttendanceBatch(queueItem);
    return { success: true, queuedOffline: true, count: records.length };
  }

  try {
    const { error } = await supabase
      .from('attendance')
      .upsert(rows, { onConflict: 'student_id,batch_id,date' });

    if (error) {
      // If network failure, queue offline
      const msg = error.message.toLowerCase();
      if (msg.includes('fetch') || msg.includes('network') || msg.includes('timeout')) {
        const queueItem: QueuedAttendanceBatch = {
          id: `${batchId}-${date}-${Date.now()}`,
          batchId,
          date,
          instituteId,
          records,
          queuedAt: new Date().toISOString(),
        };
        await enqueueAttendanceBatch(queueItem);
        return { success: true, queuedOffline: true, count: records.length };
      }
      throw new Error(`Failed to commit attendance: ${error.message}`);
    }

    // Try flushing any previously queued offline attendance
    flushAttendanceQueue().catch(() => {});

    return { success: true, count: rows.length };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('network') || msg.includes('fetch') || msg.includes('Failed to fetch')) {
      const queueItem: QueuedAttendanceBatch = {
        id: `${batchId}-${date}-${Date.now()}`,
        batchId,
        date,
        instituteId,
        records,
        queuedAt: new Date().toISOString(),
      };
      await enqueueAttendanceBatch(queueItem);
      return { success: true, queuedOffline: true, count: records.length };
    }
    throw err;
  }
};

/**
 * Correct an attendance entry, write to attendance_audit_log,
 * and dispatch push notification to parent via edge function.
 */
export const correctAttendanceEntry = async (
  input: AttendanceAuditCorrectionInput
): Promise<{ success: boolean }> => {
  const {
    attendanceId,
    oldStatus,
    newStatus,
    reason,
    correctedBy,
    studentId,
    studentName,
  } = input;

  if (!isSupabaseConfigured) {
    return { success: true };
  }

  // 1. Update attendance status
  const { error: updateError } = await supabase
    .from('attendance')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', attendanceId);

  if (updateError) {
    throw new Error(`Failed to update attendance status: ${updateError.message}`);
  }

  // 2. Insert into attendance_audit_log
  const { error: auditError } = await supabase.from('attendance_audit_log').insert({
    attendance_id: attendanceId,
    old_status: oldStatus,
    new_status: newStatus,
    reason: reason.trim(),
    corrected_by: correctedBy,
    corrected_at: new Date().toISOString(),
  });

  if (auditError) {
    console.warn('[AttendanceAudit] Failed to log audit record:', auditError.message);
  }

  // 3. Dispatch notification to parent via edge function or notifications table
  if (studentId) {
    try {
      // Find parent of student
      const { data: parentLink } = await supabase
        .from('parent_students')
        .select('parent:parents(user_id)')
        .eq('student_id', studentId)
        .maybeSingle();

      const parentUserId = (parentLink as any)?.parent?.user_id;

      if (parentUserId) {
        // Insert in-app notification
        await supabase.from('notifications').insert({
          user_id: parentUserId,
          title: 'Attendance Corrected',
          body: `Attendance for ${studentName || 'your child'} was corrected from ${oldStatus} to ${newStatus}. Reason: ${reason}`,
          data: { student_id: studentId, attendance_id: attendanceId, reason },
        });

        // Trigger edge function for push notification
        supabase.functions
          .invoke('send-push-notifications', {
            body: {
              userIds: [parentUserId],
              title: 'Attendance Updated',
              body: `Attendance for ${studentName || 'your child'} updated to ${newStatus}. Reason: ${reason}`,
              data: { studentId, attendanceId },
            },
          })
          .catch(() => {});
      }
    } catch (e) {
      console.warn('[AttendanceNotification] Failed to notify parent:', e);
    }
  }

  return { success: true };
};
