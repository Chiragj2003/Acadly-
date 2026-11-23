import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Megaphone, Check, AlertCircle } from 'lucide-react-native';
import { useAnnouncements, useMarkAnnouncementRead } from '@/hooks/queries/useAnnouncementQueries';

interface StudentAnnouncementFeedProps {
  instituteId?: string;
  batchId?: string;
}

export const StudentAnnouncementFeed: React.FC<StudentAnnouncementFeedProps> = ({
  instituteId,
  batchId,
}) => {
  const { data: announcements = [] } = useAnnouncements(instituteId, batchId);
  const markReadMutation = useMarkAnnouncementRead();

  if (announcements.length === 0) return null;

  return (
    <View className="bg-white border border-hairline rounded-3xl p-5 gap-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Megaphone size={16} color="#1C1C1E" />
          <Text className="text-sm font-display text-slate-900">Institute & Batch Notices</Text>
        </View>
        <Text className="text-xs font-sans-bold text-slate-400">Broadcasts</Text>
      </View>

      <View className="gap-2.5">
        {announcements.slice(0, 3).map((item) => {
          const isUrgent = item.priority === 'urgent' || item.priority === 'high';

          return (
            <View
              key={item.id}
              className={`p-3.5 rounded-2xl border ${
                isUrgent ? 'bg-rose-50/70 border-rose-200' : 'bg-slate-50 border-slate-200/80'
              }`}
            >
              <View className="flex-row items-center justify-between mb-1">
                <View className="flex-row items-center gap-1.5 flex-1 pr-2">
                  {isUrgent && <AlertCircle size={13} color="#E11D48" />}
                  <Text
                    className={`text-xs font-display ${isUrgent ? 'text-rose-950' : 'text-slate-900'}`}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                </View>

                {item.is_read ? (
                  <View className="bg-slate-200/70 px-2 py-0.5 rounded-md">
                    <Text className="text-xs font-sans-bold text-slate-600">Read</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => markReadMutation.mutate(item.id)}
                    className="bg-blue-600 px-2 py-0.5 rounded-md flex-row items-center gap-0.5"
                  >
                    <Check size={10} color="#ffffff" />
                    <Text className="text-xs font-sans-bold text-white">Mark Read</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text
                className={`text-xs leading-relaxed ${isUrgent ? 'text-rose-800' : 'text-slate-600'}`}
              >
                {item.content}
              </Text>

              <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-hairline">
                <Text className="text-xs text-slate-500 font-sans">
                  {item.author_name || 'Faculty Mentor'}
                </Text>
                <Text className="text-xs text-slate-500 font-sans">
                  {new Date(item.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};
