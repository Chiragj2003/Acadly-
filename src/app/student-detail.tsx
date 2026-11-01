import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
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
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper, Badge, Mascot } from '@/components/ui';
import {
  PerformanceComparisonChart,
  SubjectRadarOrBarChart,
  AttendanceRingAndTrendChart,
} from '@/components/charts';
import { useInstitute } from '@/context/InstituteContext';

export default function StudentDetailScreen() {
  const router = useRouter();
  const { currentInstitute } = useInstitute();
  const [activeTab, setActiveTab] = useState<'analytics' | 'attendance' | 'bio'>('analytics');

  const student = {
    name: 'Amelia Sharma 🌸',
    rollNumber: 'ADM-2026-088',
    grade: 'Class 11 Science',
    board: 'CBSE',
    school: 'Delhi Public School (R.K. Puram)',
    targetExam: 'IIT-JEE 2026',
    batchName: 'Batch Sakura 🌸 (Medical & Adv)',
    guardianName: 'Sunita Sharma (Mother)',
    guardianPhone: '+91 98230 44551',
    address: 'Flat 402, Lotus Towers, Pune, Maharashtra',
    bloodGroup: 'B+',
    previousPercentage: '96.2% in Class 10',
    weakSubjects: ['Rotational Mechanics', 'Ionic Equilibrium'],
    overallAttendance: 96.4,
    feeStatus: 'Partially Paid (₹15,000 remaining)',
  };

  const handleCallGuardian = () => {
    Linking.openURL(`tel:${student.guardianPhone}`).catch(() => {
      Alert.alert('Call Guardian', `Dialing ${student.guardianPhone}`);
    });
  };

  return (
    <ScreenWrapper
      headerProps={{
        title: student.name,
        instituteName: student.batchName,
        onBackPress: () => router.back(),
      }}
    >
      {/* 360 Profile Header Card */}
      <View className="bg-white border-2 border-cute-border rounded-[28px] p-5 mb-4 shadow-xs">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-3">
            <Mascot mood="happy" size="sm" />
            <View>
              <Text className="text-base font-black text-cute-cocoa">{student.name}</Text>
              <Text className="text-xs text-cute-muted">{student.rollNumber} • {student.grade}</Text>
            </View>
          </View>

          <View className="bg-cute-peach-light px-2.5 py-1 rounded-full border border-cute-peach">
            <Text className="text-[10px] font-bold text-cute-peach">Batch Rank #02 🏆</Text>
          </View>
        </View>

        {/* Quick Guardian Action Call Button */}
        <View className="flex-row gap-2 mt-2 pt-3 border-t border-cute-border">
          <TouchableOpacity
            onPress={handleCallGuardian}
            className="flex-1 py-2 rounded-xl bg-cute-peach flex-row items-center justify-center gap-1.5 shadow-xs active:scale-98"
          >
            <Phone size={13} color="#ffffff" />
            <Text className="text-xs font-bold text-white">Call Guardian ({student.guardianName.split(' ')[0]})</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => Alert.alert('Parent Portal Link', `Linked with guardian Sunita Sharma.`)}
            className="px-3.5 py-2 rounded-xl bg-cute-cream border border-cute-border items-center justify-center active:scale-98"
          >
            <Mail size={13} color="#7d6f6a" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sub-Tabs Navigator */}
      <View className="flex-row bg-white p-1 rounded-2xl border-2 border-cute-border mb-4 shadow-xs">
        <TouchableOpacity
          onPress={() => setActiveTab('analytics')}
          className={`flex-1 py-2 rounded-xl items-center ${activeTab === 'analytics' ? 'bg-cute-peach' : ''}`}
        >
          <Text className={`text-xs font-bold ${activeTab === 'analytics' ? 'text-white' : 'text-cute-muted'}`}>
            Marks & Trends 📈
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('attendance')}
          className={`flex-1 py-2 rounded-xl items-center ${activeTab === 'attendance' ? 'bg-cute-peach' : ''}`}
        >
          <Text className={`text-xs font-bold ${activeTab === 'attendance' ? 'text-white' : 'text-cute-muted'}`}>
            Attendance 📋
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('bio')}
          className={`flex-1 py-2 rounded-xl items-center ${activeTab === 'bio' ? 'bg-cute-peach' : ''}`}
        >
          <Text className={`text-xs font-bold ${activeTab === 'bio' ? 'text-white' : 'text-cute-muted'}`}>
            Full Bio & Dues 📄
          </Text>
        </TouchableOpacity>
      </View>

      {/* TAB 1: ANALYTICS & CHARTS */}
      {activeTab === 'analytics' && (
        <View>
          <PerformanceComparisonChart />
          <SubjectRadarOrBarChart />
        </View>
      )}

      {/* TAB 2: ATTENDANCE */}
      {activeTab === 'attendance' && (
        <View>
          <AttendanceRingAndTrendChart />
        </View>
      )}

      {/* TAB 3: EXTENDED BIO */}
      {activeTab === 'bio' && (
        <View className="bg-white border-2 border-cute-border rounded-[28px] p-5 shadow-xs mb-6 gap-3">
          <Text className="text-sm font-black text-cute-cocoa uppercase tracking-wider">
            Student Extended Profile
          </Text>

          <View className="bg-cute-cream/70 rounded-2xl p-4 border border-cute-border gap-2">
            <View className="flex-row justify-between">
              <Text className="text-xs text-cute-muted">Target Exam:</Text>
              <Text className="text-xs font-bold text-cute-cocoa">{student.targetExam}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs text-cute-muted">School / College:</Text>
              <Text className="text-xs font-bold text-cute-cocoa">{student.school}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs text-cute-muted">Class 10 Percentage:</Text>
              <Text className="text-xs font-bold text-cute-mint">{student.previousPercentage}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs text-cute-muted">Blood Group:</Text>
              <Text className="text-xs font-bold text-cute-cocoa">{student.bloodGroup}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs text-cute-muted">Residential Address:</Text>
              <Text className="text-xs font-bold text-cute-cocoa text-right flex-1 ml-2">{student.address}</Text>
            </View>
          </View>

          {/* Fee Status Card */}
          <View className="bg-cute-peach-light rounded-2xl p-3.5 border border-cute-peach">
            <Text className="text-xs font-bold text-cute-peach uppercase">Tuition Fee Status</Text>
            <Text className="text-sm font-black text-cute-cocoa mt-0.5">{student.feeStatus}</Text>
          </View>
        </View>
      )}
    </ScreenWrapper>
  );
}
