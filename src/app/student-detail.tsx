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
  Heart,
  MessageSquare,
  DollarSign,
  Plus,
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenWrapper, Badge, Mascot } from '@/components/ui';
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
          <Text className="text-sm font-bold text-cute-cocoa">Student record not found.</Text>
        </View>
      </ScreenWrapper>
    );
  }

  // Handle calling parent
  const handleCallGuardian = () => {
    Linking.openURL(`tel:${student.guardianPhone}`).catch(() => {
      Alert.alert('Calling Guardian', `Dialing ${student.guardianPhone}`);
    });
  };

  // Add teacher remark
  const handleAddRemark = () => {
    if (!newRemarkText.trim()) return;
    updateStudentRemarks(student.id, newRemarkText.trim());
    setNewRemarkText('');
    Alert.alert('Remark Added 🌸', 'Observation recorded in student 360 profile.');
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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-4 pb-16">
        {/* 1. 360 Profile Header Card */}
        <View className="bg-white border-2 border-cute-border rounded-3xl p-5 shadow-xs">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-3">
              <Mascot mood="studying" size="sm" />
              <View>
                <Text className="text-base font-black text-cute-cocoa">{student.name}</Text>
                <Text className="text-xs text-cute-muted">
                  {student.rollNumber} • {student.grade}
                </Text>
              </View>
            </View>

            <View className="bg-cute-peach-light px-2.5 py-1 rounded-full border border-cute-peach">
              <Text className="text-[10px] font-extrabold text-cute-peach">
                Rank #{student.rank} 🏆 ({student.percentile}%ile)
              </Text>
            </View>
          </View>

          {/* Quick Guardian Action Buttons */}
          <View className="flex-row gap-2 mt-2 pt-3 border-t border-cute-border">
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleCallGuardian}
              className="flex-1 py-2.5 rounded-xl bg-cute-peach flex-row items-center justify-center gap-1.5 shadow-xs active:scale-98"
            >
              <Phone size={13} color="#ffffff" />
              <Text className="text-xs font-bold text-white">
                Call Guardian ({student.guardianName.split(' ')[0]})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() =>
                Alert.alert(
                  'Guardian Contact Info',
                  `Name: ${student.guardianName}\nPhone: ${student.guardianPhone}\nAddress: ${student.address}`
                )
              }
              className="px-3.5 py-2.5 rounded-xl bg-cute-cream border border-cute-border items-center justify-center active:scale-98"
            >
              <Mail size={13} color="#7d6f6a" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Sub-Tabs Selector */}
        <View className="flex-row bg-white p-1 rounded-2xl border-2 border-cute-border shadow-xs">
          <TouchableOpacity
            onPress={() => setActiveTab('analytics')}
            className={`flex-1 py-2 rounded-xl items-center ${
              activeTab === 'analytics' ? 'bg-cute-peach' : ''
            }`}
          >
            <Text
              className={`text-xs font-extrabold ${
                activeTab === 'analytics' ? 'text-white' : 'text-cute-muted'
              }`}
            >
              Analytics 📊
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('attendance')}
            className={`flex-1 py-2 rounded-xl items-center ${
              activeTab === 'attendance' ? 'bg-cute-peach' : ''
            }`}
          >
            <Text
              className={`text-xs font-extrabold ${
                activeTab === 'attendance' ? 'text-white' : 'text-cute-muted'
              }`}
            >
              Attendance 📅
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('bio')}
            className={`flex-1 py-2 rounded-xl items-center ${
              activeTab === 'bio' ? 'bg-cute-peach' : ''
            }`}
          >
            <Text
              className={`text-xs font-extrabold ${
                activeTab === 'bio' ? 'text-white' : 'text-cute-muted'
              }`}
            >
              Bio & Remarks 📝
            </Text>
          </TouchableOpacity>
        </View>

        {/* ================= TAB 1: ANALYTICS ================= */}
        {activeTab === 'analytics' && (
          <View className="gap-4">
            <PerformanceComparisonChart />
            <SubjectRadarOrBarChart />
          </View>
        )}

        {/* ================= TAB 2: ATTENDANCE ================= */}
        {activeTab === 'attendance' && (
          <View className="gap-4">
            <AttendanceRingAndTrendChart percentage={student.overallAttendance} />

            <View className="bg-white border-2 border-cute-border rounded-3xl p-5 shadow-xs">
              <Text className="text-sm font-black text-cute-cocoa mb-3">
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
                    className="flex-row items-center justify-between p-2.5 rounded-xl bg-cute-cream border border-cute-border"
                  >
                    <View>
                      <Text className="text-xs font-bold text-cute-cocoa">{item.subject}</Text>
                      <Text className="text-[10px] text-cute-muted">{item.date}</Text>
                    </View>
                    <View
                      className={`px-2 py-0.5 rounded-full ${
                        item.status === 'P'
                          ? 'bg-emerald-100 border border-emerald-300'
                          : 'bg-amber-100 border border-amber-300'
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-black ${
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
          <View className="gap-4">
            {/* Student Extra Details */}
            <View className="bg-white border-2 border-cute-border rounded-3xl p-5 shadow-xs gap-2.5">
              <Text className="text-sm font-black text-cute-cocoa mb-1">
                Student Background & Identity
              </Text>

              <View className="bg-cute-cream rounded-2xl p-3 border border-cute-border gap-1.5">
                <View className="flex-row justify-between">
                  <Text className="text-xs text-cute-muted">Board & School:</Text>
                  <Text className="text-xs font-bold text-cute-cocoa">
                    {student.board} • {student.school}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-cute-muted">Target Exam:</Text>
                  <Text className="text-xs font-bold text-cute-cocoa">{student.targetExam}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-cute-muted">Class 10 Score:</Text>
                  <Text className="text-xs font-bold text-cute-peach">
                    {student.previousPercentage}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-cute-muted">Blood Group:</Text>
                  <Text className="text-xs font-bold text-cute-cocoa">{student.bloodGroup}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-cute-muted">Residential Address:</Text>
                  <Text className="text-xs font-bold text-cute-cocoa max-w-[180px] text-right">
                    {student.address}
                  </Text>
                </View>
              </View>

              {/* Weak Subjects Tags */}
              <View className="mt-1">
                <Text className="text-xs font-black text-cute-muted uppercase tracking-wider mb-1.5">
                  Focus / Weak Subject Areas:
                </Text>
                <View className="flex-row flex-wrap gap-1.5">
                  {student.weakSubjects.map((sub, i) => (
                    <View
                      key={i}
                      className="bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-xl"
                    >
                      <Text className="text-xs font-bold text-rose-800">{sub}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Fee Collection Status Card */}
            <View className="bg-white border-2 border-cute-border rounded-3xl p-5 shadow-xs">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-1.5">
                  <DollarSign size={16} color="#ff7d6b" />
                  <Text className="text-sm font-black text-cute-cocoa">Tuition Fee Status</Text>
                </View>
                <TouchableOpacity
                  onPress={handleCycleFeeStatus}
                  className="bg-cute-peach-light px-2.5 py-1 rounded-full border border-cute-peach active:scale-98"
                >
                  <Text className="text-[10px] font-bold text-cute-peach">Tap to Update ↺</Text>
                </TouchableOpacity>
              </View>
              <View className="bg-cute-cream p-3 rounded-2xl border border-cute-border">
                <Text className="text-xs font-extrabold text-cute-cocoa">{student.feeStatus}</Text>
                <Text className="text-[10px] text-cute-muted mt-0.5">
                  UPI payments automatically reconcile via parent notifications.
                </Text>
              </View>
            </View>

            {/* Teacher Remarks & Observations */}
            <View className="bg-white border-2 border-cute-border rounded-3xl p-5 shadow-xs gap-3">
              <View className="flex-row items-center gap-1.5">
                <MessageSquare size={16} color="#ff7d6b" />
                <Text className="text-sm font-black text-cute-cocoa">
                  Teacher Remarks & Notes
                </Text>
              </View>

              <View className="gap-2">
                {student.teacherRemarks.map((remark, idx) => (
                  <View
                    key={idx}
                    className="p-3 rounded-2xl bg-cute-cream border border-cute-border flex-row items-start gap-2"
                  >
                    <Text className="text-xs">📌</Text>
                    <Text className="text-xs text-cute-cocoa flex-1 leading-relaxed">
                      {remark}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Add New Remark Input */}
              <View className="flex-row gap-2 mt-1">
                <TextInput
                  placeholder="Add a mentor observation..."
                  placeholderTextColor="#a89993"
                  value={newRemarkText}
                  onChangeText={setNewRemarkText}
                  className="flex-1 bg-cute-cream border border-cute-border rounded-2xl px-3.5 py-2 text-xs text-cute-cocoa"
                />
                <TouchableOpacity
                  onPress={handleAddRemark}
                  className="bg-cute-peach px-3.5 py-2 rounded-2xl items-center justify-center active:scale-98 shadow-xs"
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
