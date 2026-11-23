import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Plus } from 'lucide-react-native';
import { ChildStudent } from '@/context/ChildContext';

interface ParentChildSelectorProps {
  childrenList: ChildStudent[];
  selectedChild: ChildStudent | null;
  onSelectChild: (id: string) => void;
  onOpenLinkModal: () => void;
}

export const ParentChildSelector: React.FC<ParentChildSelectorProps> = ({
  childrenList,
  selectedChild,
  onSelectChild,
  onOpenLinkModal,
}) => {
  return (
    <View className="bg-white border border-hairline rounded-3xl p-4">
      <View className="flex-row items-center justify-between mb-2.5">
        <Text className="text-xs font-sans-bold text-slate-500">
          Enrolled Children ({childrenList.length})
        </Text>
        <TouchableOpacity
          onPress={onOpenLinkModal}
          className="flex-row items-center gap-1 active:scale-95"
        >
          <Plus size={13} color="#1C1C1E" />
          <Text className="text-xs font-sans-bold text-blue-600">Link Child</Text>
        </TouchableOpacity>
      </View>

      {childrenList.length === 0 ? (
        <TouchableOpacity
          onPress={onOpenLinkModal}
          className="p-5 rounded-2xl bg-slate-50 border border-dashed border-slate-300 items-center justify-center gap-1.5 active:scale-98"
        >
          <Text className="text-xs font-sans-bold text-slate-800">No children linked yet</Text>
          <Text className="text-[11px] text-blue-600 font-sans-semibold">
            Enter a student link code to view your ward's attendance, marks & timetable
          </Text>
        </TouchableOpacity>
      ) : (
        <View className="flex-row gap-2">
          {childrenList.map((c) => {
            const isSelected = selectedChild?.id === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                onPress={() => onSelectChild(c.id)}
                className={`flex-1 p-3 rounded-2xl flex-row items-center gap-2.5 border-2 ${
                  isSelected
                    ? 'bg-blue-50/80 border-blue-600 shadow-xs'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <View className="w-9 h-9 rounded-full bg-white border border-slate-200 items-center justify-center">
                  <Text className="text-base">{c.emoji || '🎓'}</Text>
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-xs font-sans-bold text-slate-900" numberOfLines={1}>
                    {c.full_name}
                  </Text>
                  <Text className="text-xs text-slate-500" numberOfLines={1}>
                    {c.batch_name}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};
