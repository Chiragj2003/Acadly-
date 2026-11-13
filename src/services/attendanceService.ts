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
    const { data: rpcData, error } = await supabase.rpc('commit_attendance', {
      p_batch_id: batchId,
      p_date: date,
      p_rows: records,
    });

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

    return {
      success: true,
      count:
        rpcData && typeof rpcData === 'object' && 'count' in rpcData
          ? Number((rpcData as { count: number }).count)
          : records.length,
    };
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
 * Correct an attendance entry atomically in ONE transaction via correct_attendance RPC.
 * - Updates attendance row
 * - Writes to attendance_audit_log
 * - Dispatches notification in public.notifications
 */
export const correctAttendanceEntry = async (
  input: AttendanceAuditCorrectionInput
): Promise<{ success: boolean }> => {
  const { attendanceId, newStatus, reason } = input;

  if (!isSupabaseConfigured) {
    return { success: true };
  }

  const { error } = await supabase.rpc('correct_attendance', {
    p_attendance_id: attendanceId,
    p_new_status: newStatus,
    p_reason: reason.trim(),
  });

  if (error) {
    throw new Error(`Failed to correct attendance: ${error.message}`);
  }

  return { success: true };
};

/**
 * Batch dispatch notifications to parents of absent students for a given batch & date.
 * Sends one batched push payload rather than individual pushes per student.
 */
export const batchNotifyAbsentParents = async (
  batchId: string,
  date: string,
  instituteId: string
): Promise<{ success: boolean; notifiedCount: number }> => {
  if (!isSupabaseConfigured || !batchId || !date) {
    return { success: true, notifiedCount: 0 };
  }

  // 1. Fetch absent records for this batch and date
  const { data: absentRecords, error: attError } = await supabase
    .from('attendance')
    .select('student_id')
    .eq('batch_id', batchId)
    .eq('date', date)
    .eq('status', 'A');

  if (attError || !absentRecords || absentRecords.length === 0) {
    return { success: true, notifiedCount: 0 };
  }

  const absentStudentIds = absentRecords.map((r) => r.student_id);

  // 2. Fetch parent user IDs mapped to these students
  const { data: parentMappings } = await supabase
    .from('parent_students')
    .select('parent:parents(user_id)')
    .in('student_id', absentStudentIds);

  const parentUserIds = Array.from(
    new Set(
      (parentMappings || [])
        .map((pm: any) => pm.parent?.user_id)
        .filter(Boolean)
    )
  );

  if (parentUserIds.length === 0) {
    return { success: true, notifiedCount: 0 };
  }

  // 3. Batch invoke send-push-notifications edge function
  try {
    await supabase.functions.invoke('send-push-notifications', {
      body: {
        instituteId,
        userIds: parentUserIds,
        title: 'Attendance Alert: Absent',
        body: `Your ward was marked absent today (${date}). Please review attendance in your parent portal.`,
        type: 'attendance_alert',
        data: { batchId, date, status: 'A' },
      },
    });
  } catch (err) {
    console.warn('Batched parent push notification dispatch note:', err);
  }

  return { success: true, notifiedCount: parentUserIds.length };
};
