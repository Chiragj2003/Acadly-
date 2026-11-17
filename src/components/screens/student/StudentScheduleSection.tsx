import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Clock, MapPin, Radio, Calendar } from 'lucide-react-native';
import { useBatchSchedule } from '@/hooks/queries/useScheduleQueries';
import { type Weekday } from '@/services/scheduleService';

const WEEKDAYS: Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface StudentScheduleSectionProps {
  batchId?: string;
  onJoinLiveStream?: (slot: any) => void;
}

export const StudentScheduleSection: React.FC<StudentScheduleSectionProps> = ({
  batchId,
  onJoinLiveStream,
}) => {
  // Current weekday prefix: e.g. "Thu"
  const currentDayPrefix = (new Date().toLocaleDateString('en-US', { weekday: 'short' }) as Weekday) || 'Mon';
  const [selectedDay, setSelectedDay] = useState<Weekday>(currentDayPrefix);

  const { data: schedule = [], isLoading, error } = useBatchSchedule(batchId);

  const daySlots = schedule.filter((s) => s.weekday === selectedDay);

  return (
    <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs gap-3.5">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Calendar size={18} color="#1C1C1E" />
          <Text className="text-sm font-sans-bold text-slate-900">Weekly Timetable & Live Classes</Text>
        </View>
        <Text className="text-[10px] font-sans-bold text-slate-400">Fixed Institute Schedule</Text>
      </View>

      {/* Weekday Switcher */}
      <View className="flex-row justify-between bg-slate-50 p-1 rounded-2xl border border-slate-200/80">
        {WEEKDAYS.map((day) => {
          const isSelected = selectedDay === day;
          const isToday = currentDayPrefix === day;
          const hasClasses = schedule.some((s) => s.weekday === day);

          return (
            <TouchableOpacity
              key={day}
              onPress={() => setSelectedDay(day)}
              className={`flex-1 py-2 items-center rounded-xl ${
                isSelected ? 'bg-blue-600 shadow-xs' : ''
              }`}
            >
              <Text
                className={`text-[11px] font-sans-bold ${
                  isSelected ? 'text-white' : isToday ? 'text-blue-600' : 'text-slate-600'
                }`}
              >
                {day}
              </Text>
              {hasClasses && !isSelected && (
                <View className="w-1 h-1 rounded-full bg-blue-500 mt-0.5" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Slot Content */}
      {isLoading ? (
        <View className="p-6 items-center">
          <ActivityIndicator size="small" color="#1C1C1E" />
          <Text className="text-xs text-slate-400 mt-2">Loading timetable...</Text>
        </View>
      ) : error ? (
        <View className="p-4 bg-rose-50 rounded-2xl border border-rose-200">
          <Text className="text-xs text-rose-700">Unable to load schedule.</Text>
        </View>
      ) : daySlots.length === 0 ? (
        <View className="p-6 items-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <Text className="text-xs font-sans-bold text-slate-600">No classes scheduled for {selectedDay}</Text>
          <Text className="text-[11px] text-slate-400 mt-0.5">Enjoy your self-study time or revise past DPPs.</Text>
        </View>
      ) : (
        <View className="gap-2.5">
          {daySlots.map((slot) => (
            <View
              key={slot.id}
              className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 gap-2"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Text className="text-xs font-display text-slate-900">{slot.subject_name}</Text>
                  {slot.is_live && (
                    <View className="bg-red-100 px-2 py-0.5 rounded-full flex-row items-center gap-1">
                      <Radio size={10} color="#dc2626" />
                      <Text className="text-[9px] font-display text-red-600">LIVE NOW</Text>
                    </View>
                  )}
                </View>
                <View className="bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  <Text className="text-[10px] font-sans-bold text-blue-700">{slot.tag || 'Class'}</Text>
                </View>
              </View>

              <View className="flex-row items-center gap-4 text-slate-500">
                <View className="flex-row items-center gap-1">
                  <Clock size={12} color="#6E6A63" />
                  <Text className="text-[11px] font-sans-semibold text-slate-600">
                    {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                  </Text>
                </View>
                {slot.room && (
                  <View className="flex-row items-center gap-1">
                    <MapPin size={12} color="#6E6A63" />
                    <Text className="text-[11px] font-sans-semibold text-slate-600">{slot.room}</Text>
                  </View>
                )}
              </View>

              {slot.teacher_name && (
                <Text className="text-[11px] text-slate-500 font-sans">
                  Faculty: <Text className="font-sans-bold text-slate-800">{slot.teacher_name}</Text>
                </Text>
              )}

              {slot.is_live && onJoinLiveStream && (
                <TouchableOpacity
                  onPress={() => onJoinLiveStream(slot)}
                  className="bg-red-600 py-2.5 rounded-xl items-center flex-row justify-center gap-1.5 mt-1 active:scale-98"
                >
                  <Radio size={14} color="white" />
                  <Text className="text-xs font-sans-bold text-white">Join Live Stream</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
};
