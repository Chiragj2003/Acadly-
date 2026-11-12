import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const OFFLINE_QUEUE_KEY = '@acadly_offline_attendance_queue';

export interface QueuedAttendanceBatch {
  id: string;
  batchId: string;
  date: string;
  instituteId: string;
  records: {
    studentId: string;
    status: 'P' | 'A' | 'L';
    remarks?: string;
  }[];
  queuedAt: string;
}

type SyncListener = (pendingCount: number) => void;
const listeners = new Set<SyncListener>();

const notifyListeners = (count: number) => {
  listeners.forEach((fn) => fn(count));
};

export const subscribeToOfflineSync = (listener: SyncListener) => {
  listeners.add(listener);
  getQueuedAttendanceCount().then(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getQueuedAttendanceBatches = async (): Promise<QueuedAttendanceBatch[]> => {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const getQueuedAttendanceCount = async (): Promise<number> => {
  const items = await getQueuedAttendanceBatches();
  return items.length;
};

export const enqueueAttendanceBatch = async (batch: QueuedAttendanceBatch): Promise<void> => {
  try {
    const existing = await getQueuedAttendanceBatches();
    // Replace if same batch and date is already pending
    const filtered = existing.filter(
      (b) => !(b.batchId === batch.batchId && b.date === batch.date)
    );
    const updated = [...filtered, batch];
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updated));
    notifyListeners(updated.length);
  } catch (e) {
    console.warn('[OfflineQueue] Failed to enqueue attendance batch:', e);
  }
};

export const flushAttendanceQueue = async (): Promise<{ synced: number; failed: number }> => {
  if (!isSupabaseConfigured) return { synced: 0, failed: 0 };

  const queue = await getQueuedAttendanceBatches();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  const remaining: QueuedAttendanceBatch[] = [];

  for (const item of queue) {
    try {
      const rows = item.records.map((r) => ({
        institute_id: item.instituteId,
        batch_id: item.batchId,
        student_id: r.studentId,
        date: item.date,
        status: r.status,
        remarks: r.remarks || null,
        marked_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('attendance')
        .upsert(rows, { onConflict: 'student_id,batch_id,date' });

      if (error) {
        remaining.push(item);
      } else {
        synced++;
      }
    } catch {
      remaining.push(item);
    }
  }

  await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
  notifyListeners(remaining.length);
  return { synced, failed: remaining.length };
};
