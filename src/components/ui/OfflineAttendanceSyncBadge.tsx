import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CloudOff, RefreshCw } from 'lucide-react-native';
import {
  subscribeToOfflineSync,
  flushAttendanceQueue,
  getQueuedAttendanceCount,
} from '@/lib/offlineQueue';

export const OfflineAttendanceSyncBadge: React.FC = () => {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    getQueuedAttendanceCount().then(setPendingCount);
    const unsubscribe = subscribeToOfflineSync((count) => {
      setPendingCount(count);
    });
    return unsubscribe;
  }, []);

  if (pendingCount === 0) return null;

  const handleManualSync = async () => {
    try {
      setIsSyncing(true);
      await flushAttendanceQueue();
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <View className="bg-amber-500 border border-amber-600 rounded-2xl p-3 flex-row items-center justify-between shadow-xs mb-3">
      <View className="flex-row items-center gap-2 flex-1 mr-2">
        <CloudOff size={18} color="white" />
        <View className="flex-1">
          <Text className="text-xs font-display text-white">Offline Attendance Queued</Text>
          <Text className="text-[11px] text-amber-100">
            {pendingCount} {pendingCount === 1 ? 'batch' : 'batches'} pending automatic cloud sync
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={handleManualSync}
        disabled={isSyncing}
        className="bg-white/20 px-3 py-1.5 rounded-xl flex-row items-center gap-1.5 active:scale-95"
      >
        {isSyncing ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <RefreshCw size={13} color="white" />
        )}
        <Text className="text-xs font-sans-bold text-white">
          {isSyncing ? 'Syncing...' : 'Sync Now'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
