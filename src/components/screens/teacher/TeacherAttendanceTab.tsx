import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, Switch, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Save, Edit2, CheckCheck } from 'lucide-react-native';
import { FlashList } from '@shopify/flash-list';
import { AttendanceToggle, type AttendanceStatus } from '@/components/ui';
import { OfflineAttendanceSyncBadge } from '@/components/ui/OfflineAttendanceSyncBadge';
import { ListLoadingSkeleton } from '@/components/ui/ListLoadingSkeleton';
import { ListEmptyState } from '@/components/ui/ListEmptyState';
import { type AttendanceRecord, type Student360Profile } from '@/types/database';

interface AttendanceRosterRowProps {
  student: Student360Profile;
  status?: AttendanceStatus;
  batchId: string;
  onStatusChange: (studentId: string, status: AttendanceStatus) => void;
  onCorrect: (record: AttendanceRecord) => void;
  onViewDetail: (studentId: string) => void;
}

const AttendanceRosterRow = React.memo(function AttendanceRosterRow({
  student,
  status,
  batchId,
  onStatusChange,
  onCorrect,
  onViewDetail,
}: AttendanceRosterRowProps) {
  const roll = student.rollNumber
    ? student.rollNumber.replace('ROLL-', '#').replace('STU-', '#')
    : '#--';

  return (
    <View className="p-3 mb-2 rounded-2xl bg-slate-50 border border-slate-200/80 flex-row items-center justify-between gap-2">
      <TouchableOpacity
        onPress={() => onViewDetail(student.id)}
        className="flex-row items-center gap-2.5 flex-1 min-w-0"
      >
        <View className="min-w-[36px] h-8 px-1.5 rounded-xl bg-white border border-slate-200 items-center justify-center shrink-0">
          <Text className="text-[11px] font-sans-bold text-blue-600 font-mono" numberOfLines={1}>
            {roll}
          </Text>
        </View>
        <View className="flex-1 min-w-0">
          <View className="flex-row items-center gap-1.5">
            <Text className="text-xs font-sans-bold text-slate-900" numberOfLines={1}>
              {student.name}
            </Text>
            <TouchableOpacity
              onPress={() =>
                onCorrect({
                  id: `att-${student.id}`,
                  institute_id: 'a0000000-0000-0000-0000-000000000001',
                  student_id: student.id,
                  student_name: student.name,
                  roll_number: student.rollNumber,
                  status: status || 'P',
                  batch_id: batchId,
                  date: new Date().toISOString().split('T')[0],
                  created_at: new Date().toISOString(),
                })
              }
              hitSlop={8}
            >
              <Edit2 size={12} color="#6E6A63" />
            </TouchableOpacity>
          </View>
          <Text className="text-[11px] text-slate-500" numberOfLines={1}>
            {student.teacherRemarks?.[0] || 'Tap to inspect diagnostic report & marks'}
          </Text>
        </View>
      </TouchableOpacity>

      <AttendanceToggle
        value={status}
        onChange={(newStatus) => onStatusChange(student.id, newStatus)}
      />
    </View>
  );
});

interface TeacherAttendanceTabProps {
  batchName: string;
  batchId: string;
  students: Student360Profile[];
  localAttendance: Record<string, AttendanceStatus>;
  isLoading: boolean;
  isSyncing: boolean;
  waParentPing: boolean;
  onWaParentPingChange: (val: boolean) => void;
  onStatusChange: (studentId: string, status: AttendanceStatus) => void;
  onCorrect: (record: AttendanceRecord) => void;
  onViewDetail: (studentId: string) => void;
  onCommit: () => void;
}

export const TeacherAttendanceTab: React.FC<TeacherAttendanceTabProps> = ({
  batchName,
  batchId,
  students,
  localAttendance,
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
  const { presentCount, absentCount, lateCount, unmarkedCount } = useMemo(() => {
    let p = 0;
    let a = 0;
    let l = 0;
    let u = 0;
    for (const st of students) {
      const stStatus = localAttendance[st.id];
      if (stStatus === 'P') p++;
      else if (stStatus === 'A') a++;
      else if (stStatus === 'L') l++;
      else u++;
    }
    return { presentCount: p, absentCount: a, lateCount: l, unmarkedCount: u };
  }, [students, localAttendance]);

  const handleMarkAllPresent = () => {
    students.forEach((st) => {
      onStatusChange(st.id, 'P');
    });
  };

  return (
    <View className="gap-3.5">
      {/* Offline Pending Sync Badge */}
      <OfflineAttendanceSyncBadge />

      {/* Roll Call Hub Card */}
      <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs gap-3.5">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-2">
            <Text className="text-xs font-sans-bold text-slate-600 uppercase tracking-wider">
              Classroom Roll Call
            </Text>
            <Text className="text-base font-display text-slate-900" numberOfLines={1}>
              {batchName}
            </Text>
          </View>

          {/* Optional Shortcut Convenience: Mark All Present */}
          <TouchableOpacity
            onPress={handleMarkAllPresent}
            className="bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-xl flex-row items-center gap-1 active:scale-98"
          >
            <CheckCheck size={12} color="#059669" />
            <Text className="text-[10px] font-sans-bold text-emerald-800">Mark All Present</Text>
          </TouchableOpacity>
        </View>

        {/* Live Attendance Counter Badges */}
        <View className="flex-row items-center gap-1.5 flex-wrap">
          {presentCount > 0 && (
            <View className="bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-lg">
              <Text className="text-[10px] font-display text-emerald-800">
                {presentCount} Present
              </Text>
            </View>
          )}
          {absentCount > 0 && (
            <View className="bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded-lg">
              <Text className="text-[10px] font-display text-rose-800">
                {absentCount} Absent
              </Text>
            </View>
          )}
          {lateCount > 0 && (
            <View className="bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-lg">
              <Text className="text-[10px] font-display text-amber-800">
                {lateCount} Late
              </Text>
            </View>
          )}
          {unmarkedCount > 0 && (
            <View className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg">
              <Text className="text-[10px] font-sans-bold text-slate-600">
                {unmarkedCount} Unmarked
              </Text>
            </View>
          )}
        </View>

        {/* In-App Absence Notification Toggle */}
        <View className="flex-row items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
          <View className="flex-row items-center gap-2.5 flex-1 mr-2">
            <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center">
              <MessageSquare size={14} color="#1C1C1E" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-sans-bold text-slate-800">Batched Parent Absence Alerts</Text>
              <Text className="text-[11px] text-slate-500">
                Dispatches a single batched notification to parents of absent students
              </Text>
            </View>
          </View>
          <Switch
            value={waParentPing}
            onValueChange={onWaParentPingChange}
            trackColor={{ false: '#D8D3CA', true: '#1C1C1E' }}
          />
        </View>

        {/* Student Roll List using FlashList */}
        <View className="gap-2">
          <View className="flex-row items-center justify-between px-1">
            <Text className="text-xs font-sans-bold text-slate-600 uppercase tracking-wider">
              Enrolled Students ({students.length})
            </Text>
            <Text className="text-[11px] text-slate-500 font-sans">
              Tap P / A / L to mark
            </Text>
          </View>

          {isLoading && students.length === 0 ? (
            <ListLoadingSkeleton count={4} />
          ) : students.length === 0 ? (
            <ListEmptyState
              title="No Students in Batch"
              description="Share your batch invite code to enroll students."
            />
          ) : (
            <View style={{ minHeight: Math.min(students.length * 68, 480) }}>
              <FlashList
                data={students}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <AttendanceRosterRow
                    student={item}
                    status={localAttendance[item.id]}
                    batchId={batchId}
                    onStatusChange={onStatusChange}
                    onCorrect={onCorrect}
                    onViewDetail={onViewDetail}
                  />
                )}
                scrollEnabled={students.length > 7}
              />
            </View>
          )}
        </View>

        {/* Commit & Broadcast Roll Call */}
        <TouchableOpacity
          onPress={onCommit}
          disabled={isSyncing}
          className="bg-blue-600 py-3 rounded-2xl items-center flex-row justify-center gap-2 shadow-xs active:scale-98"
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Save size={16} color="#ffffff" />
          )}
          <Text className="text-sm font-sans-bold text-white">
            {isSyncing
              ? t('teacher.savingToDatabase', 'Saving to Database...')
              : t('teacher.commitAndDispatch', 'Commit & Dispatch Roll Call')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
