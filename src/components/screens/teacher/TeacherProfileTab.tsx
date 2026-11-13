import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Linking,
} from 'react-native';
import {
  Users,
  Search,
  X,
  ShieldCheck,
  AlertTriangle,
  Phone,
  ChevronRight,
  Share2,
  Clock,
  Check,
  Calendar,
  LogOut,
} from 'lucide-react-native';
import { FlashList } from '@shopify/flash-list';
import { Badge, LanguageSwitcher } from '@/components/ui';
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
  onUpdateFeeStatus: (studentId: string, status: string) => void;
  onViewStudentDetail: (studentId: string) => void;
  onLogout: () => void;
}

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
  onUpdateFeeStatus,
  onViewStudentDetail,
  onLogout,
}) => {
  const [directorySearchQuery, setDirectorySearchQuery] = useState('');
  const [directoryFeeFilter, setDirectoryFeeFilter] = useState<'all' | 'paid' | 'pending'>('all');

  const filteredStudents = studentsRoster.filter((st) => {
    const matchesSearch =
      st.name.toLowerCase().includes(directorySearchQuery.toLowerCase()) ||
      st.rollNumber.toLowerCase().includes(directorySearchQuery.toLowerCase()) ||
      st.batchName.toLowerCase().includes(directorySearchQuery.toLowerCase());

    const effectiveFee = localFeeOverrides[st.id] || st.feeStatus;
    const isPaid = effectiveFee.toLowerCase().includes('paid');
    if (directoryFeeFilter === 'paid') return matchesSearch && isPaid;
    if (directoryFeeFilter === 'pending') return matchesSearch && !isPaid;
    return matchesSearch;
  });

  const paidCount = studentsRoster.filter((st) =>
    (localFeeOverrides[st.id] || st.feeStatus).toLowerCase().includes('paid')
  ).length;
  const pendingCount = studentsRoster.filter(
    (st) => !(localFeeOverrides[st.id] || st.feeStatus).toLowerCase().includes('paid')
  ).length;

  return (
    <View className="gap-4">
      {/* Teacher Identity & Profile Card */}
      <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs gap-3.5">
        <View className="flex-row items-center gap-3.5">
          <View className="w-14 h-14 rounded-2xl bg-blue-600 items-center justify-center shadow-xs">
            <Text className="text-xl font-black text-white">
              {teacherProfile.fullName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)}
            </Text>
          </View>
          <View className="flex-1 min-w-0">
            <Text className="text-base font-extrabold text-slate-900" numberOfLines={1}>
              {teacherProfile.fullName}
            </Text>
            <Text className="text-xs text-slate-500 font-medium">{teacherProfile.qualification}</Text>
            <View className="flex-row items-center gap-2 mt-1">
              <View className="bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                <Text className="text-[10px] font-bold text-blue-700">
                  {teacherMode === 'solo' ? 'Solo Tutor' : 'Institute Faculty'}
                </Text>
              </View>
              <View className="bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                <Text className="text-[10px] font-bold text-emerald-700">
                  ₹{teacherProfile.monthlyFeeRate.toLocaleString()}/mo per pupil
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Teacher Code Card */}
        <View className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex-row items-center justify-between">
          <View>
            <Text className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
              Batch Enrollment Code
            </Text>
            <Text className="text-sm font-extrabold text-blue-600 font-mono">
              {teacherProfile.teacherCode}
            </Text>
          </View>
          <View className="flex-row gap-1.5">
            <TouchableOpacity
              onPress={onShareTeacherCode}
              className="bg-blue-600 px-3 py-1.5 rounded-xl active:scale-95 flex-row items-center gap-1.5 shadow-xs"
            >
              <Share2 size={13} color="#ffffff" />
              <Text className="text-xs font-bold text-white">Share Code</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Active Batch & Timing Settings */}
      <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs gap-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Clock size={16} color="#2563EB" />
            <Text className="text-sm font-bold text-slate-900">Active Batch & Schedule</Text>
          </View>
          <Badge label={`${batchesList.length} Batches`} variant="info" />
        </View>
        <Text className="text-xs text-slate-500 leading-relaxed">
          Select which batch you want to manage, or manage recurring timetable schedules.
        </Text>

        <TouchableOpacity
          onPress={onOpenScheduleEditor}
          className="bg-blue-50 border border-blue-200 p-3 rounded-2xl flex-row items-center justify-between active:scale-98"
        >
          <View className="flex-row items-center gap-2">
            <Calendar size={15} color="#2563EB" />
            <Text className="text-xs font-bold text-blue-900">Manage Batch Timetable / Schedule</Text>
          </View>
          <ChevronRight size={15} color="#2563EB" />
        </TouchableOpacity>

        <View className="gap-2 mt-1">
          {batchesList.map((batch) => {
            const isSelected = selectedBatchId === batch.id;
            return (
              <TouchableOpacity
                key={batch.id}
                onPress={() => onSelectBatch(batch.id)}
                className={`p-3.5 rounded-2xl border flex-row items-center justify-between ${
                  isSelected
                    ? 'bg-blue-50/70 border-blue-600'
                    : 'bg-slate-50 border-slate-200/80'
                } active:scale-98`}
              >
                <View className="flex-1 pr-2">
                  <View className="flex-row items-center gap-2 mb-0.5">
                    <Text className={`text-xs font-bold ${isSelected ? 'text-blue-950' : 'text-slate-900'}`}>
                      {batch.name}
                    </Text>
                    {isSelected && (
                      <View className="bg-blue-600 px-1.5 py-0.2 rounded">
                        <Text className="text-[9px] font-bold text-white">Active Focus</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-[11px] text-slate-500">{batch.subject} • {batch.room}</Text>
                  <Text className="text-[10px] font-semibold text-slate-600 mt-1">
                    🕒 {batch.time} • {batch.count} Pupils
                  </Text>
                </View>

                <View
                  className={`w-6 h-6 rounded-full border items-center justify-center ${
                    isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'
                  }`}
                >
                  {isSelected && <Check size={13} color="#ffffff" strokeWidth={3} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Searchable Student Directory with Fee Status & Contact */}
      <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs gap-3.5">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Users size={16} color="#2563EB" />
            <Text className="text-sm font-bold text-slate-900">Student Directory & Fee Tracker</Text>
          </View>
          <Text className="text-xs font-bold text-slate-500">{filteredStudents.length} Students</Text>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 gap-2">
          <Search size={15} color="#94A3B8" />
          <TextInput
            placeholder="Search pupil by name or roll number..."
            placeholderTextColor="#94a3b8"
            value={directorySearchQuery}
            onChangeText={setDirectorySearchQuery}
            className="flex-1 text-xs text-slate-800 font-medium p-0"
          />
          {directorySearchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setDirectorySearchQuery('')}>
              <X size={14} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Fee Status Filter Tabs */}
        <View className="flex-row gap-1.5">
          {[
            { id: 'all', label: `All (${studentsRoster.length})` },
            { id: 'paid', label: `Paid (${paidCount})` },
            { id: 'pending', label: `Pending (${pendingCount})` },
          ].map((tab) => {
            const isActive = directoryFeeFilter === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setDirectoryFeeFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl border ${
                  isActive
                    ? 'bg-slate-900 border-slate-900'
                    : 'bg-slate-50 border-slate-200'
                } active:scale-95`}
              >
                <Text className={`text-xs font-bold ${isActive ? 'text-white' : 'text-slate-600'}`}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Student Cards List with FlashList */}
        {filteredStudents.length === 0 ? (
          <View className="py-8 items-center justify-center">
            <Text className="text-xs text-slate-500 font-semibold">No students match your filter.</Text>
          </View>
        ) : (
          <View style={{ minHeight: Math.min(filteredStudents.length * 110, 480) }}>
            <FlashList
              data={filteredStudents}
              keyExtractor={(st) => st.id}
              scrollEnabled={filteredStudents.length > 4}
              renderItem={({ item: st }) => {
                const effectiveStatus = localFeeOverrides[st.id] || st.feeStatus;
                const isFeePaid = effectiveStatus.toLowerCase().includes('paid');
                const roll = st.rollNumber
                  ? st.rollNumber.replace('ROLL-', '#').replace('STU-', '#')
                  : '#--';

                return (
                  <View className="p-3.5 mb-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 gap-2.5">
                    <View className="flex-row items-start justify-between">
                      <TouchableOpacity
                        onPress={() => onViewStudentDetail(st.id)}
                        className="flex-row items-center gap-2.5 flex-1 min-w-0"
                      >
                        <View className="min-w-[36px] h-8 px-1.5 rounded-xl bg-white border border-slate-200 items-center justify-center shrink-0">
                          <Text className="text-[11px] font-bold text-blue-600 font-mono" numberOfLines={1}>
                            {roll}
                          </Text>
                        </View>
                        <View className="flex-1 min-w-0">
                          <Text className="text-xs font-bold text-slate-900" numberOfLines={1}>
                            {st.name}
                          </Text>
                          <Text className="text-[11px] text-slate-500" numberOfLines={1}>
                            {st.batchName} • {st.grade}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      {/* Fee Status Badge */}
                      <TouchableOpacity
                        onPress={() => {
                          const newStatus = isFeePaid ? 'Fee Pending (₹3,500)' : 'Fee Paid (Verified)';
                          onUpdateFeeStatus(st.id, newStatus);
                        }}
                        className={`px-2.5 py-1 rounded-xl border flex-row items-center gap-1 active:scale-95 ${
                          isFeePaid
                            ? 'bg-emerald-50 border-emerald-200'
                            : 'bg-amber-50 border-amber-200'
                        }`}
                      >
                        {isFeePaid ? (
                          <ShieldCheck size={12} color="#059669" />
                        ) : (
                          <AlertTriangle size={12} color="#d97706" />
                        )}
                        <Text
                          className={`text-[10px] font-bold ${
                            isFeePaid ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          {isFeePaid ? 'Fee Paid' : 'Pending ₹3,500'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Chips: Attendance & Rank & Action */}
                    <View className="flex-row items-center justify-between pt-1 border-t border-slate-200/60">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                          {st.overallAttendance}% Attendance
                        </Text>
                        <Text className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                          Rank #{st.rank}
                        </Text>
                      </View>

                      <View className="flex-row items-center gap-1.5">
                        {st.guardianPhone && (
                          <TouchableOpacity
                            onPress={() => Linking.openURL(`tel:${st.guardianPhone}`)}
                            className="w-7 h-7 rounded-xl bg-white border border-slate-200 items-center justify-center active:scale-90"
                          >
                            <Phone size={12} color="#2563EB" />
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          onPress={() => onViewStudentDetail(st.id)}
                          className="bg-white border border-slate-200 px-2.5 py-1 rounded-xl flex-row items-center gap-1 active:scale-95"
                        >
                          <Text className="text-[11px] font-bold text-slate-700">360° Profile</Text>
                          <ChevronRight size={12} color="#64748B" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              }}
            />
          </View>
        )}
      </View>

      {/* Mode Switch Card */}
      <TouchableOpacity
        onPress={onOpenDualMode}
        className="bg-blue-50/70 border border-blue-200 p-4 rounded-3xl flex-row items-center justify-between active:scale-98"
      >
        <View className="flex-1 pr-2">
          <Text className="text-xs font-bold text-blue-900">Switch Account Mode</Text>
          <Text className="text-[11px] text-blue-700 mt-0.5">
            Currently: {teacherMode === 'solo' ? 'Independent Solo Tutor' : 'Connected to Coaching Center'}
          </Text>
        </View>
        <ChevronRight size={16} color="#2563EB" />
      </TouchableOpacity>

      {/* Language Selector */}
      <LanguageSwitcher className="mb-4" />

      {/* Sign Out Button */}
      <TouchableOpacity
        onPress={onLogout}
        className="bg-rose-50 border border-rose-200 p-4 rounded-3xl flex-row items-center justify-center gap-2 active:scale-98 mb-6"
      >
        <LogOut size={16} color="#e11d48" />
        <Text className="text-xs font-bold text-rose-700">Sign Out of Teacher Desk</Text>
      </TouchableOpacity>
    </View>
  );
};
