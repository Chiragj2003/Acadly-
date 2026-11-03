import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  TextInput,
} from 'react-native';
import {
  Phone,
  Mail,
  Calendar,
  Trophy,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  GraduationCap,
  Sparkles,
  MapPin,
  Clock,
  MessageSquare,
  DollarSign,
  Plus,
  Send,
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenWrapper, Badge } from '@/components/ui';
import {
  PerformanceComparisonChart,
  SubjectRadarOrBarChart,
  AttendanceRingAndTrendChart,
} from '@/components/charts';
import { useAcademic } from '@/context/AcademicContext';

export default function StudentDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ studentId?: string }>();
  const {
    studentsRoster,
    getStudentById,
    updateStudentRemarks,
    updateStudentFeeStatus,
    comparisonChartData,
  } = useAcademic();

  const [activeTab, setActiveTab] = useState<'analytics' | 'attendance' | 'bio'>('analytics');
  const [newRemarkText, setNewRemarkText] = useState('');

  // Find student by ID param or default to first in roster
  const student =
    (params.studentId ? getStudentById(params.studentId) : null) ||
    studentsRoster[0];

  if (!student) {
    return (
      <ScreenWrapper headerProps={{ title: 'Student Profile', onBackPress: () => router.back() }}>
        <View className="items-center justify-center p-8">
          <Text className="text-sm font-bold text-slate-700">Student record not found.</Text>
        </View>
      </ScreenWrapper>
    );
  }

  // Handle calling guardian
  const handleCallGuardian = () => {
    Linking.openURL(`tel:${student.guardianPhone}`).catch(() => {
      Alert.alert('Calling Guardian', `Dialing ${student.guardianPhone}`);
    });
  };

  // Handle direct in-app message/notice to guardian
  const handleMessageGuardianInApp = () => {
    Alert.alert(
      'In-App Parent Notice',
      `Dispatch progress and attendance update directly to ${student.guardianName}'s parent portal?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dispatch In-App Notice',
          onPress: () => {
            Alert.alert(
              'Notice Dispatched',
              `Update sent to ${student.guardianName}'s portal for ${student.name}.`
            );
          },
        },
      ]
    );
  };

  // Add teacher remark
  const handleAddRemark = () => {
    if (!newRemarkText.trim()) return;
    updateStudentRemarks(student.id, newRemarkText.trim());
    setNewRemarkText('');
    Alert.alert('Observation Saved 📝', 'Teacher remark recorded in student 360 diagnostic profile.');
  };

  // Cycle fee status
  const handleCycleFeeStatus = () => {
    const statuses = [
      'Paid in Full (₹42,000)',
      'Partially Paid (₹15,000 remaining)',
      'Pending Installment (Due in 5 days)',
    ];
    const currentIndex = statuses.indexOf(student.feeStatus);
    const nextIndex = (currentIndex + 1) % statuses.length;
    updateStudentFeeStatus(student.id, statuses[nextIndex]);
  };

  return (
    <ScreenWrapper
      headerProps={{
        title: student.name,
        instituteName: student.batchName,
        onBackPress: () => router.back(),
      }}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }} contentContainerClassName="gap-3.5">
        {/* 1. 360 Profile Diagnostic Header Card */}
        <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-3">
              <View className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 items-center justify-center">
                <Text className="text-2xl">🎓</Text>
              </View>
              <View>
                <Text className="text-base font-extrabold text-slate-900">{student.name}</Text>
                <Text className="text-xs text-slate-500">
                  {student.rollNumber} • {student.grade}
                </Text>
              </View>
            </View>

            <View className="bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              <Text className="text-[11px] font-bold text-amber-800">
                Rank #{student.rank} 🏆 ({student.percentile}%ile)
              </Text>
            </View>
          </View>

          {/* Parent Link Code Strip */}
          <View className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 mb-3 flex-row items-center justify-between">
            <Text className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Parent Link Code:
            </Text>
            <Text className="text-xs font-mono font-bold text-blue-600">
              {student.parentLinkCode || 'STU-AMELIA-902'}
            </Text>
          </View>

          {/* Quick Guardian Action Buttons */}
          <View className="flex-row gap-2 pt-2 border-t border-slate-100">
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleCallGuardian}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 flex-row items-center justify-center gap-1.5 shadow-xs active:scale-98"
            >
              <Phone size={13} color="#ffffff" />
              <Text className="text-xs font-bold text-white">
                Call Guardian ({student.guardianName.split(' ')[0]})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleMessageGuardianInApp}
              className="px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 flex-row items-center justify-center gap-1.5 active:scale-98"
            >
              <MessageSquare size={13} color="#2563EB" />
              <Text className="text-xs font-bold text-blue-700">In-App Notice</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Sub-Tabs Selector */}
        <View className="flex-row bg-white p-1 rounded-2xl border border-slate-200/90 shadow-xs">
          <TouchableOpacity
            onPress={() => setActiveTab('analytics')}
            className={`flex-1 py-2 rounded-xl items-center ${
              activeTab === 'analytics' ? 'bg-blue-600' : ''
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                activeTab === 'analytics' ? 'text-white' : 'text-slate-500'
              }`}
            >
              Analytics 📊
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('attendance')}
            className={`flex-1 py-2 rounded-xl items-center ${
              activeTab === 'attendance' ? 'bg-blue-600' : ''
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                activeTab === 'attendance' ? 'text-white' : 'text-slate-500'
              }`}
            >
              Attendance 📅
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('bio')}
            className={`flex-1 py-2 rounded-xl items-center ${
              activeTab === 'bio' ? 'bg-blue-600' : ''
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                activeTab === 'bio' ? 'text-white' : 'text-slate-500'
              }`}
            >
              Bio & Remarks 📝
            </Text>
          </TouchableOpacity>
        </View>

        {/* ================= TAB 1: ANALYTICS ================= */}
        {activeTab === 'analytics' && (
          <View className="gap-3.5">
            <PerformanceComparisonChart data={comparisonChartData} />
            <SubjectRadarOrBarChart />
          </View>
        )}

        {/* ================= TAB 2: ATTENDANCE ================= */}
        {activeTab === 'attendance' && (
          <View className="gap-3.5">
            <AttendanceRingAndTrendChart percentage={student.overallAttendance} />

            <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs">
              <Text className="text-sm font-bold text-slate-900 mb-3">
                Recent Roll Call History
              </Text>
              <View className="gap-2">
                {[
                  { date: 'Today, 09:30 AM', subject: 'Physics (Mechanics)', status: 'P' },
                  { date: 'Yesterday, 10:00 AM', subject: 'Mathematics (Calculus)', status: 'P' },
                  { date: '30 Oct, 09:30 AM', subject: 'Chemistry (Organic)', status: 'P' },
                  { date: '29 Oct, 11:30 AM', subject: 'Weekly Mock Test', status: 'L' },
                  { date: '28 Oct, 09:30 AM', subject: 'Physics (Optics)', status: 'P' },
                ].map((item, idx) => (
                  <View
                    key={idx}
                    className="flex-row items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80"
                  >
                    <View>
                      <Text className="text-xs font-bold text-slate-800">{item.subject}</Text>
                      <Text className="text-[10px] text-slate-500">{item.date}</Text>
                    </View>
                    <View
                      className={`px-2 py-0.5 rounded-full ${
                        item.status === 'P'
                          ? 'bg-emerald-100 border border-emerald-300'
                          : 'bg-amber-100 border border-amber-300'
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-bold ${
                          item.status === 'P' ? 'text-emerald-800' : 'text-amber-800'
                        }`}
                      >
                        {item.status === 'P' ? 'PRESENT' : 'LATE'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ================= TAB 3: BIO, REMARKS & FEES ================= */}
        {activeTab === 'bio' && (
          <View className="gap-3.5">
            {/* Student Background Details */}
            <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs gap-3">
              <Text className="text-sm font-bold text-slate-900">
                Student Profile & Identity
              </Text>

              <View className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 gap-2">
                <View className="flex-row justify-between">
                  <Text className="text-xs text-slate-500">Board & School:</Text>
                  <Text className="text-xs font-bold text-slate-800">
                    {student.board} • {student.school}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-slate-500">Target Exam:</Text>
                  <Text className="text-xs font-bold text-slate-800">{student.targetExam}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-slate-500">Previous Exam Score:</Text>
                  <Text className="text-xs font-bold text-blue-600">
                    {student.previousPercentage}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-slate-500">Blood Group:</Text>
                  <Text className="text-xs font-bold text-slate-800">{student.bloodGroup}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-slate-500">Residential Address:</Text>
                  <Text className="text-xs font-bold text-slate-800 max-w-[200px] text-right">
                    {student.address}
                  </Text>
                </View>
              </View>

              {/* Weak Subjects Tags */}
              <View>
                <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Focus / Revision Priority:
                </Text>
                <View className="flex-row flex-wrap gap-1.5">
                  {student.weakSubjects.map((sub, i) => (
                    <View
                      key={i}
                      className="bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-xl"
                    >
                      <Text className="text-xs font-bold text-rose-700">{sub}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Fee Collection Status Card */}
            <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-1.5">
                  <DollarSign size={16} color="#2563EB" />
                  <Text className="text-sm font-bold text-slate-900">Tuition Fee Status</Text>
                </View>
                <TouchableOpacity
                  onPress={handleCycleFeeStatus}
                  className="bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 active:scale-98"
                >
                  <Text className="text-[10px] font-bold text-blue-700">Update Status ↺</Text>
                </TouchableOpacity>
              </View>
              <View className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                <Text className="text-xs font-bold text-slate-800">{student.feeStatus}</Text>
                <Text className="text-[10px] text-slate-500 mt-0.5">
                  UPI payments automatically reconcile via parent notifications.
                </Text>
              </View>
            </View>

            {/* Teacher Remarks & Observations */}
            <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs gap-3">
              <View className="flex-row items-center gap-1.5">
                <MessageSquare size={16} color="#2563EB" />
                <Text className="text-sm font-bold text-slate-900">
                  Teacher Observations & Remarks
                </Text>
              </View>

              <View className="gap-2">
                {student.teacherRemarks.map((remark, idx) => (
                  <View
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex-row items-start gap-2"
                  >
                    <Text className="text-xs">📌</Text>
                    <Text className="text-xs text-slate-700 flex-1 leading-relaxed">
                      {remark}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Add New Remark Input */}
              <View className="flex-row gap-2 mt-1">
                <TextInput
                  placeholder="Record mentor note..."
                  placeholderTextColor="#94a3b8"
                  value={newRemarkText}
                  onChangeText={setNewRemarkText}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs text-slate-800"
                />
                <TouchableOpacity
                  onPress={handleAddRemark}
                  className="bg-blue-600 px-3.5 py-2 rounded-2xl items-center justify-center active:scale-98 shadow-xs"
                >
                  <Plus size={16} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}
