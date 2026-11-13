import { AppState, type AppStateStatus } from 'react-native';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
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
  retryCount?: number;
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
    const updated = [...filtered, { ...batch, retryCount: 0 }];
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updated));
    notifyListeners(updated.length);
  } catch (e) {
    console.warn('[OfflineQueue] Failed to enqueue attendance batch:', e);
  }
};

/**
 * Deterministic exponential backoff calculation:
 * Attempt 0 -> 1000ms
 * Attempt 1 -> 2000ms
 * Attempt 2 -> 4000ms
 * Max cap -> 30000ms
 */
export const calculateBackoffDelay = (retryCount: number): number => {
  const base = 1000;
  return Math.min(base * Math.pow(2, retryCount), 30000);
};

let isFlushing = false;

/**
 * Flush attendance queue with atomic RPC commit_attendance and exponential backoff retry.
 */
export const flushAttendanceQueue = async (): Promise<{ synced: number; failed: number }> => {
  if (!isSupabaseConfigured || isFlushing) return { synced: 0, failed: 0 };

  isFlushing = true;
  try {
    const queue = await getQueuedAttendanceBatches();
    if (queue.length === 0) {
      isFlushing = false;
      return { synced: 0, failed: 0 };
    }

    let synced = 0;
    const remaining: QueuedAttendanceBatch[] = [];

    for (const item of queue) {
      try {
        const { error } = await supabase.rpc('commit_attendance', {
          p_batch_id: item.batchId,
          p_date: item.date,
          p_rows: item.records,
        });

        if (error) {
          const retries = (item.retryCount || 0) + 1;
          remaining.push({ ...item, retryCount: retries });
        } else {
          synced++;
        }
      } catch {
        const retries = (item.retryCount || 0) + 1;
        remaining.push({ ...item, retryCount: retries });
      }
    }

    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
    notifyListeners(remaining.length);
    return { synced, failed: remaining.length };
  } finally {
    isFlushing = false;
  }
};

/**
 * Fixed Timezone Rule:
 * Formats a Date deterministically into YYYY-MM-DD using the fixed institute timezone
 * (Default: 'Asia/Kolkata' for Indian coaching/institutes).
 * Avoids UTC date-shifting issues where late-evening attendance rolls over to the next day.
 */
export function formatInstituteDate(date: Date = new Date(), timeZone: string = 'Asia/Kolkata'): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date);
  } catch {
    // Fallback ISO slice if timezone is unsupported
    return date.toISOString().split('T')[0];
  }
}

/**
 * Initialize automatic listeners for NetInfo reconnect and AppState active.
 */
let isListenerInitialized = false;

export const initOfflineSyncListeners = (): (() => void) => {
  if (isListenerInitialized) return () => {};
  isListenerInitialized = true;

  // 1. NetInfo Reconnect listener
  const unsubscribeNetInfo = NetInfo.addEventListener((state: NetInfoState) => {
    if (state.isConnected && state.isInternetReachable !== false) {
      flushAttendanceQueue().catch(() => {});
    }
  });

  // 2. AppState active listener
  const appStateSubscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
    if (nextState === 'active') {
      flushAttendanceQueue().catch(() => {});
    }
  });

  return () => {
    unsubscribeNetInfo();
    appStateSubscription.remove();
    isListenerInitialized = false;
  };
};
