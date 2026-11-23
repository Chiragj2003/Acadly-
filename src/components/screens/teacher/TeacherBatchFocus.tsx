import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';

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
  /** Kept for API compatibility. */
  currentBatch?: BatchItemDisplay;
}

/**
 * Batch switcher: one horizontal row of pills (black = the batch every tab is showing).
 * Bleeds to the screen edges so long batch names scroll instead of wrapping.
 */
export const TeacherBatchFocus: React.FC<TeacherBatchFocusProps> = ({ batches, selectedBatchId, onSelectBatch }) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    className="-mx-5"
    contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
    accessibilityRole="tablist"
  >
    {batches.map((b) => {
      const selected = selectedBatchId === b.id;
      return (
        <Pressable
          key={b.id}
          accessibilityRole="tab"
          accessibilityState={{ selected }}
          accessibilityLabel={`${b.name}, ${b.count} students`}
          onPress={() => onSelectBatch(b.id)}
          className={`h-11 px-4 rounded-full flex-row items-center gap-2 ${selected ? 'bg-ink' : 'bg-white'}`}
        >
          <Text className={`font-sans-bold text-sm ${selected ? 'text-white' : 'text-ink'}`} numberOfLines={1}>
            {b.name.split(' • ')[0]}
          </Text>
          <View className={`min-w-[24px] h-6 px-1.5 rounded-full items-center justify-center ${selected ? 'bg-white/20' : 'bg-paper'}`}>
            <Text className={`font-sans-bold text-xs ${selected ? 'text-white' : 'text-ink'}`}>{b.count}</Text>
          </View>
        </Pressable>
      );
    })}
  </ScrollView>
);
