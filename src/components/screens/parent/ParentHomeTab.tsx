import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MessageSquare, Plus } from 'lucide-react-native';
import { BigNumber, InsightCard, Mascot, StatTile, DisplayTitle } from '@/components/ui';
import { useAttendanceTrend } from '@/hooks/queries/useAnalyticsQueries';
import { StudentScheduleSection } from '@/components/screens/student/StudentScheduleSection';
import { StudentResultsCard } from '@/components/academic/StudentResultsCard';
import { StudentAnnouncementFeed } from '@/components/academic/StudentAnnouncementFeed';
import { ChildStudent } from '@/context/ChildContext';

interface ParentHomeTabProps {
  selectedChild: ChildStudent | null;
  onOpenLinkChild: () => void;
  onOpenChat: () => void;
}

export const ParentHomeTab: React.FC<ParentHomeTabProps> = ({
  selectedChild,
  onOpenLinkChild,
  onOpenChat,
}) => {
  const { data: trend } = useAttendanceTrend(selectedChild?.id, selectedChild?.batch_id);

  if (!selectedChild) {
    return (
      <View className="bg-white rounded-3xl p-8 items-center justify-center gap-3">
        <Mascot mood="curious" size="lg" />
        <DisplayTitle center>Link your child to get started</DisplayTitle>
        <Text className="text-xs text-slate-500 text-center leading-relaxed">
          Ask your tuition teacher for your ward's unique Student Link Code to view real-time attendance, test performance, and batch schedule.
        </Text>
        <TouchableOpacity
          onPress={onOpenLinkChild}
          className="bg-ink px-6 min-h-[56px] rounded-full flex-row items-center gap-2 active:opacity-90 mt-2"
        >
          <Plus size={18} color="#ffffff" />
          <Text className="text-[17px] font-sans-bold text-white">Enter student code</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="gap-3.5">
      {/* 0. Institute & Batch Announcements */}
      <StudentAnnouncementFeed
        batchId={selectedChild.batch_id}
      />

      {/* 1. Attendance at a glance — one number, one sentence (real data only) */}
      {(() => {
        const firstName = selectedChild.full_name.split(' ')[0];
        const hasData = (trend?.totalClasses ?? 0) > 0;
        const now = new Date();
        const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const todayStatus = trend?.recentRecords.find((r) => r.date.slice(0, 10) === todayKey)?.status;
        const todayMessage =
          todayStatus === 'P'
            ? `${firstName} was marked present today.`
            : todayStatus === 'L'
              ? `${firstName} was marked late today.`
              : todayStatus === 'A'
                ? `${firstName} was marked absent today.`
                : todayStatus === 'E'
                  ? `${firstName} is on approved leave today.`
                  : `No roll call for ${firstName} yet today.`;
        return (
          <View className="gap-4">
            <BigNumber
              label={`${firstName}'s attendance`}
              value={hasData ? String(Math.round(trend!.attendanceRate)) : '—'}
              unit={hasData ? '%' : undefined}
            />
            {hasData && (
              <View className="flex-row gap-2.5">
                <StatTile value={String(trend!.presentCount)} label="Present" />
                <StatTile value={String(trend!.absentCount)} label="Absent" />
                <StatTile value={String(trend!.streak)} unit=" days" label="Streak" />
              </View>
            )}
            <InsightCard
              eyebrow={selectedChild.batch_name || 'Today'}
              message={todayMessage}
              tone={todayStatus === 'A' ? 'pink' : 'mint'}
              onPress={onOpenChat}
              actionLabel="Message the teacher"
            />
          </View>
        );
      })()}

      {/* 2. Batch Schedule (Real DB Queries) */}
      <StudentScheduleSection batchId={selectedChild.batch_id} />

      {/* 3. Academic Results & Subject Mastery (Real DB Queries) */}
      <StudentResultsCard
        studentId={selectedChild.id}
        studentName={selectedChild.full_name}
      />

      {/* 4. Connect with Tuition Teacher */}
      <View className="bg-white rounded-3xl p-5 gap-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <MessageSquare size={16} color="#1C1C1E" />
            <Text className="text-sm font-sans-bold text-slate-900">Connect with Teacher</Text>
          </View>
        </View>

        <Text className="text-xs text-slate-600 leading-relaxed">
          Direct in-app messaging channel with {selectedChild.batch_name} faculty. Inquire about test corrections, homework, and attendance.
        </Text>

        <TouchableOpacity
          onPress={onOpenChat}
          className="bg-ink min-h-[52px] rounded-full items-center flex-row justify-center gap-2 active:opacity-90"
        >
          <MessageSquare size={16} color="#ffffff" />
          <Text className="text-[15px] font-sans-bold text-white">Message the teacher</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
