import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, Linking } from 'react-native';
import { Search, X, Phone, ChevronRight, Share2, Calendar, LogOut, Check, Repeat } from 'lucide-react-native';
import { LanguageSwitcher, SectionTitle, Avatar, ListRow, initialsOf } from '@/components/ui';
import { type Student360Profile } from '@/types/database';
import { type BatchItemDisplay } from './TeacherBatchFocus';

interface TeacherProfile {
  fullName: string;
  qualification: string;
  teacherCode: string;
  monthlyFeeRate: number;
}

interface TeacherProfileTabProps {
  teacherProfile: TeacherProfile;
  teacherMode: 'solo' | 'coaching_faculty';
  batchesList: BatchItemDisplay[];
  selectedBatchId: string;
  studentsRoster: Student360Profile[];
  localFeeOverrides: Record<string, string>;
  onSelectBatch: (id: string) => void;
  onShareTeacherCode: () => void;
  onOpenDualMode: () => void;
  onOpenScheduleEditor: () => void;
  /** No longer used: fee status is read-only here (the old toggle only changed local state). */
  onUpdateFeeStatus?: (studentId: string, status: string) => void;
  onViewStudentDetail: (studentId: string) => void;
  onLogout: () => void;
}

type FeeFilter = 'all' | 'paid' | 'due';
const AVATAR_TONES = ['pink', 'sky', 'peach', 'mint', 'lilac', 'butter'] as const;

const isPaid = (status: string) => status.toLowerCase().includes('paid');

/** White grouped card, the same container the student and parent accounts use. */
const Group: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View className="bg-white rounded-3xl px-4 py-1">{children}</View>
);

const RowIcon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View className="w-9 h-9 rounded-full bg-paper items-center justify-center">{children}</View>
);

/** Teacher account: share code, batches, student directory, settings. */
export const TeacherProfileTab: React.FC<TeacherProfileTabProps> = ({
  teacherProfile,
  teacherMode,
  batchesList,
  selectedBatchId,
  studentsRoster,
  localFeeOverrides,
  onSelectBatch,
  onShareTeacherCode,
  onOpenDualMode,
  onOpenScheduleEditor,
  onViewStudentDetail,
  onLogout,
}) => {
  const [query, setQuery] = useState('');
  const [feeFilter, setFeeFilter] = useState<FeeFilter>('all');

  const feeOf = (st: Student360Profile) => localFeeOverrides[st.id] || st.feeStatus || '';
  // feeStatus is 'paid' | 'due' from the roster stats view, or '' when there is no fee record.
  const isDue = (status: string) => status === 'due' || /pending|overdue|due/i.test(status);
  const paidCount = studentsRoster.filter((st) => isPaid(feeOf(st))).length;
  const dueCount = studentsRoster.filter((st) => isDue(feeOf(st))).length;

  const q = query.trim().toLowerCase();
  const students = studentsRoster.filter((st) => {
    const matches =
      !q ||
      st.name.toLowerCase().includes(q) ||
      (st.rollNumber || '').toLowerCase().includes(q) ||
      (st.batchName || '').toLowerCase().includes(q);
    if (!matches) return false;
    if (feeFilter === 'paid') return isPaid(feeOf(st));
    if (feeFilter === 'due') return isDue(feeOf(st));
    return true;
  });

  const filters: { id: FeeFilter; label: string }[] = [
    { id: 'all', label: `All ${studentsRoster.length}` },
    { id: 'paid', label: `Paid ${paidCount}` },
    { id: 'due', label: `Fee due ${dueCount}` },
  ];

  return (
    <View className="gap-6 pb-6">
      {/* Who you are */}
      <View className="flex-row items-center gap-3.5">
        <Avatar initials={initialsOf(teacherProfile.fullName) || 'T'} tone="sky" size={60} />
        <View className="flex-1 min-w-0">
          <Text className="font-display text-ink text-[24px] leading-[28px]" numberOfLines={1}>
            {teacherProfile.fullName}
          </Text>
          <Text className="font-sans text-muted text-sm" numberOfLines={1}>
            {[teacherMode === 'solo' ? 'Teaches on their own' : 'Teaches at an institute', teacherProfile.qualification]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </View>
      </View>

      {/* Signature: the code students use to join you, set large like a ticket */}
      <View className="bg-pastel-sky border-[1.5px] border-ink rounded-[30px] p-5 gap-4">
        <View className="gap-1">
          <Text className="font-sans-bold text-ink text-[13px]">Your join code</Text>
          <Text
            selectable
            accessibilityLabel={`Join code ${teacherProfile.teacherCode.split('').join(' ')}`}
            className="font-display text-ink text-[34px] leading-[38px] tracking-[2px]"
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {teacherProfile.teacherCode || '—'}
          </Text>
          <Text className="font-sans text-ink/70 text-[13px] leading-[18px]">
            Students enter this in Acadly to send you a join request.
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={onShareTeacherCode}
          className="self-start h-12 px-5 rounded-full bg-ink flex-row items-center gap-2 active:opacity-90"
        >
          <Share2 size={16} color="#FFFFFF" />
          <Text className="font-sans-bold text-white text-[15px]">Share code</Text>
        </Pressable>
      </View>

      {/* Batches */}
      <View className="gap-3">
        <SectionTitle>Your batches</SectionTitle>
        <Group>
          {batchesList.map((batch) => {
            const selected = batch.id === selectedBatchId;
            return (
              <ListRow
                key={batch.id}
                title={batch.name}
                subtitle={[batch.time, `${batch.count} students`, batch.room].filter(Boolean).join(' · ')}
                onPress={() => onSelectBatch(batch.id)}
                trailing={
                  <View
                    accessibilityLabel={selected ? 'Selected batch' : undefined}
                    className={`w-7 h-7 rounded-full items-center justify-center ${selected ? 'bg-ink' : 'border-[1.5px] border-slate-300'}`}
                  >
                    {selected ? <Check size={14} color="#FFFFFF" strokeWidth={3} /> : null}
                  </View>
                }
              />
            );
          })}
          <ListRow
            title="Edit timetable"
            subtitle="Days, times and rooms for each batch"
            leading={
              <RowIcon>
                <Calendar size={17} color="#1C1C1E" />
              </RowIcon>
            }
            trailing={<ChevronRight size={18} color="#6E6A63" />}
            onPress={onOpenScheduleEditor}
            last
          />
        </Group>
      </View>

      {/* Students */}
      <View className="gap-3">
        <SectionTitle>Students</SectionTitle>

        <View className="flex-row items-center bg-white rounded-full px-4 h-12 gap-2">
          <Search size={17} color="#6E6A63" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name, roll no. or batch"
            placeholderTextColor="#8C877E"
            accessibilityLabel="Search students"
            className="flex-1 font-sans text-ink text-[15px] p-0"
          />
          {query ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQuery('')} hitSlop={8}>
              <X size={16} color="#6E6A63" />
            </Pressable>
          ) : null}
        </View>

        <View className="flex-row gap-2">
          {filters.map((f) => {
            const active = feeFilter === f.id;
            return (
              <Pressable
                key={f.id}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setFeeFilter(f.id)}
                className={`h-10 px-4 rounded-full items-center justify-center ${active ? 'bg-ink' : 'bg-white'}`}
              >
                <Text className={`font-sans-bold text-sm ${active ? 'text-white' : 'text-ink'}`}>{f.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {students.length === 0 ? (
          <View className="bg-white rounded-3xl px-5 py-6 items-center gap-1">
            <Text className="font-sans-bold text-ink text-[15px]">
              {studentsRoster.length === 0 ? 'No students in this batch yet' : 'No students match'}
            </Text>
            <Text className="font-sans text-muted text-[13px] text-center">
              {studentsRoster.length === 0
                ? 'Share your join code. Approved students show up here.'
                : 'Try another name or clear the filter.'}
            </Text>
          </View>
        ) : (
          <Group>
            {students.map((st, i) => {
              const fee = feeOf(st);
              const paid = isPaid(fee);
              const due = isDue(fee);
              const meta = [
                st.rollNumber,
                st.overallAttendance > 0 ? `${st.overallAttendance}% attendance` : null,
                st.rank > 0 ? `rank ${st.rank}` : null,
              ]
                .filter(Boolean)
                .join(' · ');
              return (
                <View key={st.id} className={`flex-row items-center gap-3 min-h-[64px] ${i === students.length - 1 ? '' : 'border-b border-hairline'}`}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${st.name}`}
                    onPress={() => onViewStudentDetail(st.id)}
                    className="flex-1 min-w-0 flex-row items-center gap-3 py-2 active:opacity-70"
                  >
                    <Avatar initials={initialsOf(st.name)} tone={AVATAR_TONES[i % AVATAR_TONES.length]} size={40} />
                    <View className="flex-1 min-w-0">
                      <Text className="font-sans-bold text-ink text-[15px]" numberOfLines={1}>
                        {st.name}
                      </Text>
                      <Text className="font-sans text-muted text-xs" numberOfLines={1}>
                        {meta || st.batchName}
                      </Text>
                    </View>
                  </Pressable>
                  {paid || due ? (
                    <View className={`px-2.5 py-1 rounded-xl ${paid ? 'bg-pastel-mint' : 'bg-pastel-butter'}`}>
                      <Text className="font-sans-bold text-ink text-xs">{paid ? 'Paid' : 'Fee due'}</Text>
                    </View>
                  ) : null}
                  {st.guardianPhone ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Call ${st.name}'s parent`}
                      onPress={() => Linking.openURL(`tel:${st.guardianPhone}`)}
                      className="w-10 h-10 rounded-full bg-paper items-center justify-center active:opacity-70"
                    >
                      <Phone size={16} color="#1C1C1E" />
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
          </Group>
        )}
      </View>

      {/* Settings */}
      <View className="gap-3">
        <SectionTitle>Settings</SectionTitle>
        <Group>
          <ListRow
            title="Teaching mode"
            subtitle={teacherMode === 'solo' ? 'On my own' : 'At an institute'}
            leading={
              <RowIcon>
                <Repeat size={17} color="#1C1C1E" />
              </RowIcon>
            }
            trailing={<ChevronRight size={18} color="#6E6A63" />}
            onPress={onOpenDualMode}
            last
          />
        </Group>
        <LanguageSwitcher />
      </View>

      <Pressable accessibilityRole="button" onPress={onLogout} className="self-center min-h-[44px] flex-row items-center gap-2 px-4">
        <LogOut size={16} color="#B42318" />
        <Text className="font-sans-bold text-rose-700 text-[15px]">Sign out</Text>
      </Pressable>
    </View>
  );
};
