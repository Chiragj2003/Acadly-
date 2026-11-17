import React, { useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Flame, MessageCircleQuestion, ChevronRight } from 'lucide-react-native';
import Svg, { Ellipse, Path, Rect } from 'react-native-svg';
import { useAttendanceTrend } from '@/hooks/queries/useAnalyticsQueries';
import { useBatchSchedule } from '@/hooks/queries/useScheduleQueries';
import { useAssignments } from '@/hooks/queries/useAssignmentQueries';
import { Avatar, DisplayTitle, Eyebrow, WeekDots, Chip, type DayDotState } from '@/components/ui/SoftDesk';
import { Card } from '@/components/ui/Card';
import { ListLoadingSkeleton } from '@/components/ui/ListLoadingSkeleton';

interface StudentTodayProps {
  firstName: string;
  initials: string;
  studentId?: string;
  batchId?: string;
  batchName: string;
  onOpenProfile: () => void;
  onOpenSchedule: () => void;
  onOpenPractice: () => void;
  onOpenDoubts: () => void;
  onJoinLive: () => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

const localDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Stacked-blocks illustration for the daily practice card (decorative). */
const PracticeArt = () => (
  <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
  <Svg width={170} height={120} viewBox="0 0 170 130">
    <Ellipse cx={85} cy={118} rx={62} ry={6} fill="#E9A9C7" />
    <Rect x={30} y={88} width={110} height={26} rx={8} fill="#F5B98F" stroke="#1C1C1E" strokeWidth={1.5} />
    <Rect x={44} y={60} width={84} height={26} rx={8} fill="#9FC3EE" stroke="#1C1C1E" strokeWidth={1.5} />
    <Rect x={58} y={32} width={58} height={26} rx={8} fill="#BFE3C9" stroke="#1C1C1E" strokeWidth={1.5} />
    <Path d="M78 22l6-12 6 12" fill="none" stroke="#1C1C1E" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
  </View>
);

/**
 * Student "Today": streak, this week's attendance dots, the next thing due as
 * the hero card, and the live / next class. Everything comes from real data;
 * pieces with no data are simply left out.
 */
export const StudentToday: React.FC<StudentTodayProps> = ({
  firstName,
  initials,
  studentId,
  batchId,
  batchName,
  onOpenProfile,
  onOpenSchedule,
  onOpenPractice,
  onOpenDoubts,
  onJoinLive,
}) => {
  const { t } = useTranslation();
  const { data: trend } = useAttendanceTrend(studentId, batchId);
  const { data: schedule = [] } = useBatchSchedule(batchId);
  const { data: assignments = [], isLoading: isAssignmentsLoading } = useAssignments(batchId);

  const now = new Date();
  const todayKey = localDateKey(now);

  // This week (Sun–Sat) from real attendance records.
  const weekDays = useMemo(() => {
    const byDate = new Map((trend?.recentRecords ?? []).map((r) => [r.date.slice(0, 10), r.status]));
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    return WEEKDAYS.map((name, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = localDateKey(d);
      const status = byDate.get(key);
      let state: DayDotState = 'upcoming';
      if (key === todayKey) state = status === 'P' || status === 'L' ? 'done' : 'today';
      else if (status === 'P' || status === 'L' || status === 'E') state = 'done';
      else if (status === 'A') state = 'missed';
      return { label: name[0].toLowerCase(), state };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trend, todayKey]);

  // Next thing due (soonest future due date).
  const upcoming = useMemo(
    () =>
      assignments
        .filter((a) => new Date(a.due_date).getTime() >= now.getTime() - 60 * 60 * 1000)
        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [assignments]
  );
  const next = upcoming[0];

  // Live or next class today.
  const todayName = WEEKDAYS[now.getDay()];
  const todaysClasses = schedule.filter((s) => s.weekday?.slice(0, 3) === todayName);
  const live = todaysClasses.find((s) => s.is_live);
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const nextClass = live ?? todaysClasses.find((s) => (s.start_time || '') >= hhmm);

  const streak = trend?.streak ?? 0;
  const dueLabel = (iso: string) => {
    const due = new Date(iso);
    const days = Math.round((new Date(localDateKey(due)).getTime() - new Date(todayKey).getTime()) / 86400000);
    if (days <= 0) return t('student.dueToday', 'Due today');
    if (days === 1) return t('student.dueTomorrow', 'Due tomorrow');
    return t('student.dueInDays', 'Due in {{count}} days', { count: days });
  };

  const headline =
    upcoming.length === 0
      ? t('student.todayCaughtUp', 'All caught up.\nNice work.')
      : upcoming.length === 1
        ? t('student.todayOneDue', 'One thing due.\nYou’ve got this.')
        : t('student.todayManyDue', '{{count}} things due\nthis week.', { count: upcoming.length });

  return (
    <View className="gap-5">
      <View className="flex-row items-center justify-between">
        {streak > 0 ? (
          <View
            accessibilityLabel={t('student.streakA11y', '{{count}} class streak', { count: streak })}
            className="h-11 pl-3 pr-4 rounded-full bg-white flex-row items-center gap-1.5"
          >
            <Flame size={19} color="#FF6A1A" fill="#FF6A1A" />
            <Text className="font-sans-bold text-ink text-base">{streak}</Text>
          </View>
        ) : (
          <Eyebrow>{batchName}</Eyebrow>
        )}
        <Avatar initials={initials} tone="pink" onPress={onOpenProfile} label={t('student.profile', 'Profile')} />
      </View>

      <View className="gap-1">
        <Eyebrow center>{t('student.hiName', 'Hi {{name}}', { name: firstName })}</Eyebrow>
        <DisplayTitle center>{headline}</DisplayTitle>
      </View>

      <WeekDots days={weekDays} onPress={onOpenSchedule} />

      {isAssignmentsLoading ? (
        <ListLoadingSkeleton />
      ) : next ? (
        <Card elevation="hero" tone="pink" onPress={onOpenPractice} accessibilityLabel={`${next.title}, ${dueLabel(next.due_date)}`}>
          <Chip label={dueLabel(next.due_date)} tone="pink" />
          <View className="items-center mt-1">
            <PracticeArt />
          </View>
          <Text className="font-display text-ink text-[22px] text-center mt-2">{next.title}</Text>
          <Text className="font-sans text-slate-700 text-[15px] text-center mt-1">
            {[next.subject, next.question_count ? t('student.questions', '{{count}} questions', { count: next.question_count }) : null]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </Card>
      ) : (
        <Card elevation="hero" tone="mint" onPress={onOpenPractice}>
          <Chip label={t('student.nothingDue', 'Nothing due')} tone="mint" />
          <Text className="font-display text-ink text-[22px] mt-3">
            {t('student.reviseTitle', 'Revise something you enjoyed')}
          </Text>
          <Text className="font-sans text-slate-700 text-[15px] mt-1">
            {t('student.reviseBody', 'New DPPs and homework from your teachers show up here first.')}
          </Text>
        </Card>
      )}

      {nextClass ? (
        <View className="bg-white rounded-3xl pl-4 pr-2.5 py-2.5 flex-row items-center gap-3">
          {live ? <View className="w-2.5 h-2.5 rounded-full bg-rose-600" /> : null}
          <View className="flex-1 min-w-0">
            <Text className="font-sans-bold text-ink text-[15px]" numberOfLines={1}>
              {live
                ? t('student.isLive', '{{subject}} is live', { subject: nextClass.subject_name || t('student.class', 'Class') })
                : t('student.nextAt', '{{subject}} at {{time}}', {
                    subject: nextClass.subject_name || t('student.class', 'Class'),
                    time: nextClass.start_time?.slice(0, 5),
                  })}
            </Text>
            <Text className="font-sans text-muted text-[13px]" numberOfLines={1}>
              {[nextClass.teacher_name, nextClass.room].filter(Boolean).join(' · ')}
            </Text>
          </View>
          {live ? (
            <Pressable
              accessibilityRole="button"
              onPress={onJoinLive}
              className="h-11 px-5 rounded-full bg-ink items-center justify-center active:opacity-80"
            >
              <Text className="font-sans-bold text-white text-[15px]">{t('student.join', 'Join')}</Text>
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('student.openTimetable', 'Open timetable')}
              onPress={onOpenSchedule}
              className="w-11 h-11 rounded-full bg-paper items-center justify-center"
            >
              <ChevronRight size={20} color="#1C1C1E" />
            </Pressable>
          )}
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={onOpenDoubts}
        className="bg-white rounded-3xl px-4 min-h-[60px] flex-row items-center gap-3 active:opacity-80"
      >
        <View className="w-10 h-10 rounded-full bg-pastel-lilac items-center justify-center">
          <MessageCircleQuestion size={20} color="#1C1C1E" />
        </View>
        <View className="flex-1">
          <Text className="font-sans-bold text-ink text-[15px]">{t('student.classDoubts', 'Class doubts')}</Text>
          <Text className="font-sans text-muted text-xs">{t('student.classDoubtsSub', 'Ask, or see what classmates asked')}</Text>
        </View>
        <ChevronRight size={18} color="#8C877E" />
      </Pressable>
    </View>
  );
};
