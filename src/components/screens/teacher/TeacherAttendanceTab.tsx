import React, { useMemo } from 'react';
import { View, Text, Pressable, Switch, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PencilLine } from 'lucide-react-native';
import { AttendanceToggle, type AttendanceStatus } from '@/components/ui';
import { OfflineAttendanceSyncBadge } from '@/components/ui/OfflineAttendanceSyncBadge';
import { ListLoadingSkeleton } from '@/components/ui/ListLoadingSkeleton';
import { ListEmptyState } from '@/components/ui/ListEmptyState';
import { type AttendanceRecord, type Student360Profile } from '@/types/database';

const AVATAR_TONES = ['bg-pastel-pink', 'bg-pastel-sky', 'bg-pastel-lilac', 'bg-pastel-mint', 'bg-pastel-butter', 'bg-pastel-peach'];

interface AttendanceRosterRowProps {
  student: Student360Profile;
  index: number;
  status?: AttendanceStatus;
  savedRecord?: AttendanceRecord;
  last: boolean;
  onStatusChange: (studentId: string, status: AttendanceStatus) => void;
  onCorrect: (record: AttendanceRecord) => void;
  onViewDetail: (studentId: string) => void;
}

const AttendanceRosterRow = React.memo(function AttendanceRosterRow({
  student,
  index,
  status,
  savedRecord,
  last,
  onStatusChange,
  onCorrect,
  onViewDetail,
}: AttendanceRosterRowProps) {
  const initials = student.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  return (
    <View className={`flex-row items-center gap-3 min-h-[64px] ${last ? '' : 'border-b border-hairline'}`}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${student.name}`}
        onPress={() => onViewDetail(student.id)}
        className="flex-row items-center gap-3 flex-1 min-w-0"
      >
        <View className={`w-10 h-10 rounded-full items-center justify-center ${AVATAR_TONES[index % AVATAR_TONES.length]}`}>
          <Text className="font-display text-ink text-[13px]">{initials}</Text>
        </View>
        <View className="flex-1 min-w-0">
          <Text className="font-sans-bold text-ink text-[15px]" numberOfLines={1}>
            {student.name}
          </Text>
          {student.rollNumber ? <Text className="font-sans text-muted text-xs">Roll {student.rollNumber}</Text> : null}
        </View>
      </Pressable>
      {savedRecord ? (
        // Corrections need the saved database record (it carries the real id and audit trail).
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Correct saved attendance for ${student.name}`}
          onPress={() => onCorrect(savedRecord)}
          className="w-9 h-9 items-center justify-center"
        >
          <PencilLine size={16} color="#6E6A63" />
        </Pressable>
      ) : null}
      <AttendanceToggle value={status} onChange={(newStatus) => onStatusChange(student.id, newStatus)} />
    </View>
  );
});

interface TeacherAttendanceTabProps {
  batchName: string;
  batchId: string;
  students: Student360Profile[];
  localAttendance: Record<string, AttendanceStatus>;
  /** Records already saved for today; enables corrections. */
  savedRecords?: AttendanceRecord[];
  isLoading: boolean;
  isSyncing: boolean;
  waParentPing: boolean;
  onWaParentPingChange: (val: boolean) => void;
  onStatusChange: (studentId: string, status: AttendanceStatus) => void;
  onCorrect: (record: AttendanceRecord) => void;
  onViewDetail: (studentId: string) => void;
  onCommit: () => void;
}

/** Soft Desk roll call: big counts, one tap per student, one black pill to submit. */
export const TeacherAttendanceTab: React.FC<TeacherAttendanceTabProps> = ({
  batchName,
  students,
  localAttendance,
  savedRecords = [],
  isLoading,
  isSyncing,
  waParentPing,
  onWaParentPingChange,
  onStatusChange,
  onCorrect,
  onViewDetail,
  onCommit,
}) => {
  const { t } = useTranslation();
  const counts = useMemo(() => {
    const c = { P: 0, A: 0, L: 0, unmarked: 0 };
    for (const st of students) {
      const s = localAttendance[st.id];
      if (s === 'P' || s === 'A' || s === 'L') c[s]++;
      else c.unmarked++;
    }
    return c;
  }, [students, localAttendance]);

  const savedByStudent = useMemo(() => new Map(savedRecords.map((r) => [r.student_id, r])), [savedRecords]);
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return (
    <View className="gap-4">
      <Text className="font-sans-semibold text-muted text-sm text-center">
        {batchName} · {today}
      </Text>

      <View className="flex-row justify-center items-end gap-6" accessibilityLabel={`${counts.P} present, ${counts.A} absent, ${counts.L} late, ${counts.unmarked} not marked`}>
        {(
          [
            [counts.P, t('teacher.present', 'present'), 'text-[#1D6B3E]'],
            [counts.A, t('teacher.absent', 'absent'), 'text-[#9A2A16]'],
            [counts.L, t('teacher.late', 'late'), 'text-[#7A5200]'],
          ] as const
        ).map(([n, label, color]) => (
          <View key={label} className="items-center">
            <Text className="font-serif text-ink" style={{ fontSize: 52, lineHeight: 56 }}>
              {n}
            </Text>
            <Text className={`font-sans-bold text-[13px] ${color}`}>{label}</Text>
          </View>
        ))}
      </View>

      <View className="flex-row items-center justify-between">
        <OfflineAttendanceSyncBadge />
        <Pressable
          accessibilityRole="button"
          onPress={() => students.forEach((st) => onStatusChange(st.id, 'P'))}
          className="h-10 px-4 rounded-full bg-pastel-mint justify-center active:opacity-80"
        >
          <Text className="font-sans-bold text-ink text-sm">{t('teacher.allPresent', 'All present')}</Text>
        </Pressable>
      </View>

      {isLoading && students.length === 0 ? (
        <ListLoadingSkeleton count={5} height={64} />
      ) : students.length === 0 ? (
        <ListEmptyState
          title={t('teacher.noStudentsTitle', 'No students in this batch yet')}
          message={t('teacher.noStudentsBody', 'Share the batch join code so students can request to join.')}
        />
      ) : (
        <View className="bg-white rounded-3xl px-3.5 py-1">
          {students.map((st, i) => (
            <AttendanceRosterRow
              key={st.id}
              student={st}
              index={i}
              status={localAttendance[st.id]}
              savedRecord={savedByStudent.get(st.id)}
              last={i === students.length - 1}
              onStatusChange={onStatusChange}
              onCorrect={onCorrect}
              onViewDetail={onViewDetail}
            />
          ))}
        </View>
      )}

      <View className="flex-row items-center justify-between min-h-[44px]">
        <Text className="font-sans-semibold text-ink text-sm flex-1 pr-3">
          {t('teacher.tellParents', 'Tell parents of absent students')}
        </Text>
        <Switch
          accessibilityLabel={t('teacher.tellParents', 'Tell parents of absent students')}
          value={waParentPing}
          onValueChange={onWaParentPingChange}
          trackColor={{ false: '#D8D3CA', true: '#1C1C1E' }}
        />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: isSyncing || students.length === 0, busy: isSyncing }}
        onPress={onCommit}
        disabled={isSyncing || students.length === 0}
        className={`min-h-[56px] rounded-full bg-ink items-center justify-center ${isSyncing || students.length === 0 ? 'opacity-60' : 'active:opacity-90'}`}
      >
        {isSyncing ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text className="font-sans-bold text-white text-[17px]">
            {counts.unmarked > 0
              ? t('teacher.submitWithUnmarked', 'Submit roll call ({{n}} unmarked = present)', { n: counts.unmarked })
              : t('teacher.submitRollCall', 'Submit roll call')}
          </Text>
        )}
      </Pressable>
    </View>
  );
};
