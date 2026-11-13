import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Clock, Check } from 'lucide-react-native';

export interface BatchItemDisplay {
  id: string;
  name: string;
  time: string;
  subject: string;
  room: string;
  count: number;
}

interface TeacherBatchFocusProps {
  batches: BatchItemDisplay[];
  selectedBatchId: string;
  onSelectBatch: (id: string) => void;
  currentBatch: BatchItemDisplay;
}

export const TeacherBatchFocus: React.FC<TeacherBatchFocusProps> = ({
  batches,
  selectedBatchId,
  onSelectBatch,
  currentBatch,
}) => {
  const { t } = useTranslation();
  return (
    <View className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-xs">
      <View className="flex-row items-center justify-between mb-2 px-1">
        <View className="flex-row items-center gap-1.5">
          <Clock size={13} color="#2563EB" />
          <Text className="text-xs font-black text-slate-800 uppercase tracking-wider">
            {t('teacher.activeBatches', 'Active Batches')} • {t('teacher.batchFocus', 'Batch & Schedule Focus')}
          </Text>
        </View>
        <View className="bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
          <Text className="text-[10px] font-bold text-blue-700">
            {currentBatch.time}
          </Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2">
          {batches.map((b) => {
            const isSelected = selectedBatchId === b.id;
            return (
              <TouchableOpacity
                key={b.id}
                activeOpacity={0.85}
                onPress={() => onSelectBatch(b.id)}
                className={`px-3 py-2 rounded-xl border flex-row items-center gap-2 ${
                  isSelected
                    ? 'bg-blue-600 border-blue-600 shadow-xs'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <View className="items-start">
                  <Text
                    className={`text-xs font-extrabold ${
                      isSelected ? 'text-white' : 'text-slate-800'
                    }`}
                    numberOfLines={1}
                  >
                    {b.name.split(' • ')[0]}
                  </Text>
                  <Text
                    className={`text-[10px] ${
                      isSelected ? 'text-blue-100 font-medium' : 'text-slate-500'
                    }`}
                  >
                    {b.time.split(' - ')[0]} • {b.count} Students
                  </Text>
                </View>
                {isSelected && <Check size={14} color="#FFFFFF" />}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};
