import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useBatchSchedule } from '@/hooks/queries/useScheduleQueries';
import { type Weekday } from '@/services/scheduleService';
import { type BatchSchedule } from '@/types/database';
import { ListEmptyState, ListErrorState, ListLoadingSkeleton } from '@/components/ui';

const WEEKDAYS: Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const JS_DAYS: Weekday[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface StudentScheduleSectionProps {
  batchId?: string;
  onJoinLiveStream?: (slot: BatchSchedule) => void;
}

/** Splits "08:00" / "14:30:00" into a 12-hour clock and AM/PM. */
const clock = (hhmm?: string) => {
  const [h = '0', m = '00'] = (hhmm || '').split(':');
  const hour = Number(h);
  return { time: `${hour % 12 || 12}:${m.slice(0, 2)}`, ampm: hour < 12 ? 'AM' : 'PM' };
};

/** Soft Desk timetable: a week of day pills, then one card per class. */
export const StudentScheduleSection: React.FC<StudentScheduleSectionProps> = ({ batchId, onJoinLiveStream }) => {
  const today = new Date();
  const todayName = JS_DAYS[today.getDay()];
  const [selectedDay, setSelectedDay] = useState<Weekday>(todayName);

  const { data: schedule = [], isLoading, error, refetch } = useBatchSchedule(batchId);
  const daySlots = schedule.filter((s) => s.weekday?.slice(0, 3) === selectedDay);

  // Dates for this week (Mon–Sun) so the pills show real day numbers.
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));

  return (
    <View className="gap-4">
      <View accessibilityRole="tablist" className="flex-row gap-1.5">
        {WEEKDAYS.map((day, i) => {
          const date = new Date(monday);
          date.setDate(monday.getDate() + i);
          const isSelected = selectedDay === day;
          const hasClasses = schedule.some((s) => s.weekday?.slice(0, 3) === day);
          return (
            <Pressable
              key={day}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${day} ${date.getDate()}${hasClasses ? ', has classes' : ''}`}
              onPress={() => setSelectedDay(day)}
              className={`flex-1 h-[66px] rounded-[22px] items-center justify-center ${isSelected ? 'bg-ink' : 'bg-white'}`}
            >
              <Text className={`text-xs font-sans-semibold ${isSelected ? 'text-white' : 'text-ink'}`}>{day[0]}</Text>
              <Text className={`text-xl font-serif ${isSelected ? 'text-white' : 'text-ink'}`}>{date.getDate()}</Text>
              {hasClasses && !isSelected ? <View className="w-1 h-1 rounded-full bg-ink mt-0.5" /> : null}
            </Pressable>
          );
        })}
      </View>

      {isLoading ? (
        <ListLoadingSkeleton />
      ) : error ? (
        <ListErrorState title="Couldn't load the timetable" message="Check your connection and try again." onRetry={() => refetch()} />
      ) : daySlots.length === 0 ? (
        <ListEmptyState title={`No classes on ${selectedDay}`} message="A good day to revise or catch up on practice." />
      ) : (
        <View className="gap-2.5">
          {daySlots.map((slot) => {
            const { time, ampm } = clock(slot.start_time);
            const live = Boolean(slot.is_live);
            return (
              <View
                key={slot.id}
                className={`flex-row items-center gap-3 px-4 py-3.5 rounded-3xl ${
                  live ? 'bg-pastel-sky border-[1.5px] border-ink' : 'bg-white'
                }`}
              >
                <View className="w-14">
                  <Text className="font-serif text-ink text-[22px]">{time}</Text>
                  <Text className="font-sans-semibold text-slate-600 text-xs">{ampm}</Text>
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="font-sans-bold text-ink text-base" numberOfLines={1}>
                    {slot.subject_name || 'Class'}
                  </Text>
                  <Text className="font-sans text-slate-600 text-[13px]" numberOfLines={1}>
                    {[slot.teacher_name, slot.room].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                {live && onJoinLiveStream ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => onJoinLiveStream(slot)}
                    className="h-11 px-4 rounded-full bg-ink items-center justify-center active:opacity-90"
                  >
                    <Text className="font-sans-bold text-white text-sm">Join</Text>
                  </Pressable>
                ) : (
                  <View className={`px-2.5 py-1 rounded-xl ${live ? 'bg-white' : 'bg-paper'}`}>
                    <Text className="font-sans-bold text-ink text-xs">{live ? 'Live' : slot.tag || 'Class'}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};
