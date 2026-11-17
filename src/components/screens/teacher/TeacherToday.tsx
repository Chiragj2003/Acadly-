import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PencilLine, FileUp, ChartLine, Megaphone, ChevronRight } from 'lucide-react-native';
import { useBatchSchedule } from '@/hooks/queries/useScheduleQueries';
import { Card } from '@/components/ui/Card';
import { Chip, CountPill, DisplayTitle, Eyebrow, ListRow } from '@/components/ui/SoftDesk';

interface TeacherTodayProps {
  firstName: string;
  batchId?: string;
  batchName: string;
  studentCount: number;
  papersToGrade: number;
  pendingJoinCount: number;
  onRollCall: () => void;
  onGoLive: () => void;
  onPostDpp: () => void;
  onUploadNotes: () => void;
  onEnterMarks: () => void;
  onAnnounce?: () => void;
  onGrade: () => void;
  onReviewRequests: () => void;
  onOpenDoubts: () => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

const greetingKey = (hour: number) => (hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening');

/** Teacher "Today": what's next, the four common actions, and what needs attention. */
export const TeacherToday: React.FC<TeacherTodayProps> = ({
  firstName,
  batchId,
  batchName,
  studentCount,
  papersToGrade,
  pendingJoinCount,
  onRollCall,
  onGoLive,
  onPostDpp,
  onUploadNotes,
  onEnterMarks,
  onAnnounce,
  onGrade,
  onReviewRequests,
  onOpenDoubts,
}) => {
  const { t } = useTranslation();
  const { data: schedule = [] } = useBatchSchedule(batchId);

  const now = new Date();
  const today = WEEKDAYS[now.getDay()];
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const todays = schedule.filter((s) => s.weekday?.slice(0, 3) === today);
  const next = todays.find((s) => s.is_live) ?? todays.find((s) => (s.end_time || '') >= hhmm);

  const greeting = {
    morning: t('teacher.goodMorning', 'Good morning, {{name}}', { name: firstName }),
    afternoon: t('teacher.goodAfternoon', 'Good afternoon, {{name}}', { name: firstName }),
    evening: t('teacher.goodEvening', 'Good evening, {{name}}', { name: firstName }),
  }[greetingKey(now.getHours())];

  const headline =
    todays.length === 0
      ? t('teacher.noClassesToday', 'No classes today.\nA good day to grade.')
      : t('teacher.classesToday', '{{count}} classes today,\n{{papers}} papers to grade.', {
          count: todays.length,
          papers: papersToGrade,
        });

  const actions = [
    { label: t('teacher.postDpp', 'Post DPP'), icon: PencilLine, onPress: onPostDpp },
    { label: t('teacher.notes', 'Notes'), icon: FileUp, onPress: onUploadNotes },
    { label: t('teacher.marks', 'Marks'), icon: ChartLine, onPress: onEnterMarks },
    ...(onAnnounce ? [{ label: t('teacher.announce', 'Announce'), icon: Megaphone, onPress: onAnnounce }] : []),
  ];

  const todo = [
    { count: papersToGrade, tone: 'pink' as const, title: t('teacher.papersToGrade', 'Papers to grade'), sub: batchName, onPress: onGrade },
    { count: pendingJoinCount, tone: 'butter' as const, title: t('teacher.joinRequests', 'Join requests'), sub: t('teacher.waitingApproval', 'Waiting for approval'), onPress: onReviewRequests },
  ].filter((row) => row.count > 0);

  return (
    <View className="gap-5">
      <View className="gap-1">
        <Eyebrow>{greeting}</Eyebrow>
        <DisplayTitle>{headline}</DisplayTitle>
      </View>

      <Card elevation="hero" tone="sky">
        <View className="flex-row items-center justify-between">
          <Chip
            tone="sky"
            label={
              next
                ? next.is_live
                  ? t('teacher.liveNow', 'Live now')
                  : [t('teacher.next', 'Next'), next.room].filter(Boolean).join(' · ')
                : t('teacher.noClassScheduled', 'No class scheduled')
            }
          />
          {next ? <Text className="font-serif text-ink text-[22px]">{next.start_time?.slice(0, 5)}</Text> : null}
        </View>
        <Text className="font-display text-ink text-2xl mt-3">
          {next?.subject_name || batchName}
        </Text>
        <Text className="font-sans text-slate-700 text-sm mt-1">
          {t('teacher.studentCount', '{{count}} students', { count: studentCount })}
        </Text>
        <View className="flex-row gap-2.5 mt-4">
          <Pressable
            accessibilityRole="button"
            onPress={onRollCall}
            className="flex-1 h-12 rounded-full bg-ink items-center justify-center active:opacity-90"
          >
            <Text className="font-sans-bold text-white text-[15px]">{t('teacher.takeRollCall', 'Take roll call')}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onGoLive}
            className="h-12 px-5 rounded-full bg-white items-center justify-center active:opacity-90"
          >
            <Text className="font-sans-bold text-ink text-[15px]">{t('teacher.goLive', 'Go live')}</Text>
          </Pressable>
        </View>
      </Card>

      <View className="flex-row justify-between">
        {actions.map(({ label, icon: Icon, onPress }) => (
          <Pressable key={label} accessibilityRole="button" onPress={onPress} className="w-[76px] items-center gap-2 active:opacity-80">
            <View className="w-[60px] h-[60px] rounded-full bg-white items-center justify-center">
              <Icon size={22} color="#1C1C1E" />
            </View>
            <Text className="font-sans-bold text-ink text-xs text-center">{label}</Text>
          </Pressable>
        ))}
      </View>

      <View className="bg-white rounded-3xl px-4 py-1">
        {todo.map((row) => (
          <ListRow
            key={row.title}
            title={row.title}
            subtitle={row.sub}
            leading={<CountPill count={row.count} tone={row.tone} />}
            trailing={<ChevronRight size={18} color="#8C877E" />}
            onPress={row.onPress}
          />
        ))}
        <ListRow
          title={t('teacher.openDoubts', 'Class doubts')}
          subtitle={t('teacher.openDoubtsSub', 'Answer questions from your students')}
          leading={
            <View className="min-w-[36px] h-[30px] rounded-full bg-pastel-lilac items-center justify-center px-2">
              <Text className="font-sans-bold text-ink text-sm">?</Text>
            </View>
          }
          trailing={<ChevronRight size={18} color="#8C877E" />}
          onPress={onOpenDoubts}
          last
        />
      </View>
    </View>
  );
};
