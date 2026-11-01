import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import {
  Trophy,
  Play,
  FileCheck,
  CalendarCheck,
  CheckCircle2,
  Clock,
  DownloadCloud,
  Flame,
  ArrowRight,
  BookOpen,
  Sparkles,
  Smile,
  MessageSquare,
  BarChart3,
  QrCode,
  Calendar,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useInstitute } from '@/context/InstituteContext';
import { useAcademic } from '@/context/AcademicContext';
import { useFeeNotification } from '@/context/FeeNotificationContext';
import {
  ScreenWrapper,
  Badge,
  Mascot,
  SubjectMascotCard,
  CuteProgressChart,
} from '@/components/ui';
import {
  PerformanceComparisonChart,
  SubjectRadarOrBarChart,
  AttendanceRingAndTrendChart,
} from '@/components/charts';
import {
  VideoPlayerModal,
  StudyMaterialsViewer,
  AssignmentsModule,
} from '@/components/academic';
import {
  FeeReceiptModal,
  NotificationDrawer,
} from '@/components/finance';
import { CUTE_SUBJECT_MASCOTS } from '@/components/ui/SubjectMascotCard';

export default function CuteStudentScreen() {
  const router = useRouter();
  const { currentInstitute } = useInstitute();
  const { lectures, openPlayer, teacherProfile, comparisonChartData } = useAcademic();
  const { openNotificationDrawer, unreadCount } = useFeeNotification();

  const [activeTab, setActiveTab] = useState<'courses' | 'chat' | 'progress' | 'notes' | 'assignments'>('courses');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const liveLecture = lectures.find((l) => l.is_live) || lectures[0];
  const categories = ['All', 'Math 📐', 'Physics ⚡', 'Biology 🌿', 'Chemistry 🧪'];

  return (
    <ScreenWrapper
      headerProps={{
        title: 'Student Hub 🌸',
        instituteName: currentInstitute?.name || 'Bloom Academy',
        onNotificationPress: openNotificationDrawer,
        onProfilePress: () => Alert.alert('Amelia Sharma 🌸', 'Class 11 Science • Batch Sakura • Roll #07'),
        hasUnreadNotifications: unreadCount > 0,
      }}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-4 pb-16">
        {/* 1. Student Header Card */}
        <View className="bg-white border-2 border-cute-border rounded-[28px] p-4 flex-row items-center justify-between shadow-xs">
          <View className="flex-row items-center gap-3">
            <Mascot mood="happy" size="sm" />
            <View>
              <View className="flex-row items-center gap-1.5">
                <Text className="text-base font-black text-cute-cocoa">Hello, Amelia! 🌸</Text>
                <View className="bg-cute-peach-light px-2 py-0.5 rounded-full border border-cute-peach">
                  <Text className="text-[10px] font-bold text-cute-peach">AIR #14 ⭐</Text>
                </View>
              </View>
              <Text className="text-xs text-cute-muted mt-0.5">
                Batch Sakura • Class 11 Science • JEE 2026
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => Alert.alert('Attendance Status 🌸', 'You have 96.4% attendance across all subjects!')}
            className="bg-cute-mint-light px-3 py-1.5 rounded-2xl border border-cute-mint items-center"
          >
            <Text className="text-[10px] font-bold text-cute-mint uppercase">Attendance</Text>
            <Text className="text-xs font-black text-cute-cocoa">96.4%</Text>
          </TouchableOpacity>
        </View>

        {/* 2. Connected Tuition / Solo Teacher Card */}
        <View className="bg-white border-2 border-cute-border rounded-3xl p-4 shadow-xs">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2">
              <View className="w-9 h-9 rounded-2xl bg-cute-peach-light border border-cute-peach items-center justify-center">
                <Text className="text-base">🍎</Text>
              </View>
              <View>
                <Text className="text-xs font-black text-cute-cocoa">{teacherProfile.fullName}</Text>
                <Text className="text-[10px] text-cute-muted">
                  Batch Code: <Text className="font-bold text-cute-peach">{teacherProfile.teacherCode}</Text>
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => router.push('/join-institute')}
              className="bg-cute-cream px-2.5 py-1 rounded-xl border border-cute-border active:scale-95"
            >
              <Text className="text-[10px] font-bold text-cute-cocoa">Change Teacher ↺</Text>
            </TouchableOpacity>
          </View>

          <View className="bg-cute-cream p-2.5 rounded-xl border border-cute-border flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5">
              <Clock size={12} color="#ff7d6b" />
              <Text className="text-[11px] font-bold text-cute-cocoa">
                Today: Rotational Dynamics @ 04:30 PM
              </Text>
            </View>
            <Text className="text-[10px] font-bold text-cute-peach">Room 204</Text>
          </View>

          {/* Quick Action Navigation Strip */}
          <View className="flex-row gap-2 mt-3 pt-2.5 border-t border-cute-border">
            <TouchableOpacity
              onPress={() => router.push('/chat')}
              className="flex-1 bg-cute-peach-light border border-cute-peach py-2 rounded-xl flex-row items-center justify-center gap-1.5 active:scale-95 shadow-xs"
            >
              <MessageSquare size={12} color="#ff7d6b" />
              <Text className="text-[11px] font-black text-cute-peach">Class Chat & Doubts 💬</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/community')}
              className="flex-1 bg-cute-cream border border-cute-border py-2 rounded-xl flex-row items-center justify-center gap-1.5 active:scale-95"
            >
              <Text className="text-xs">📚</Text>
              <Text className="text-[11px] font-bold text-cute-cocoa">Resources</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/student-detail')}
              className="flex-1 bg-cute-cream border border-cute-border py-2 rounded-xl flex-row items-center justify-center gap-1.5 active:scale-95"
            >
              <BarChart3 size={12} color="#ff7d6b" />
              <Text className="text-[11px] font-bold text-cute-cocoa">360° Stats</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. Horizontal Pill Tab Navigator */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1 px-1">
          <View className="flex-row gap-1.5">
            {[
              { key: 'courses', label: 'My Subjects 📚' },
              { key: 'chat', label: 'Chat & Doubts 💬' },
              { key: 'progress', label: 'Analytics 📈' },
              { key: 'notes', label: 'PDF Notes 🌸' },
              { key: 'assignments', label: 'Daily DPP ✏️' },
            ].map((tab) => {
              const isSelected = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key as any)}
                  className={`px-3 py-2 rounded-2xl items-center border ${
                    isSelected
                      ? 'bg-cute-peach border-cute-cocoa/20 shadow-xs'
                      : 'bg-white border-cute-border'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      isSelected ? 'text-white' : 'text-cute-muted'
                    }`}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* ================= TAB 1: COURSES ================= */}
        {activeTab === 'courses' && (
          <View className="gap-4">
            {/* Live Masterclass Hero Card */}
            <View className="bg-cute-peach-light border-2 border-cute-peach rounded-[28px] p-5 shadow-xs">
              <View className="flex-row items-center justify-between mb-2">
                <View className="bg-white px-2.5 py-1 rounded-full border border-cute-peach flex-row items-center gap-1.5">
                  <View className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <Text className="text-[11px] font-bold text-rose-500">LIVE AT 04:30 PM</Text>
                </View>
                <Text className="text-xs font-bold text-cute-cocoa">Room 204 • Hybrid 🏫</Text>
              </View>

              <Text className="text-lg font-black text-cute-cocoa leading-tight mt-1">
                Electromagnetism & Circuit Flow
              </Text>
              <Text className="text-xs text-cute-muted mt-1">
                With Prof. Vikram Joshi • 45 mins of live problem solving
              </Text>

              <View className="mt-4 pt-3 border-t border-cute-peach/30 flex-row items-center justify-between">
                <View className="flex-row items-center gap-1.5">
                  <Sparkles size={14} color="#ff7d6b" />
                  <Text className="text-xs font-semibold text-cute-cocoa">Includes DPP & Notes</Text>
                </View>

                <TouchableOpacity
                  onPress={() => liveLecture && openPlayer(liveLecture)}
                  className="bg-cute-peach px-4 py-2 rounded-2xl flex-row items-center gap-1.5 shadow-xs active:scale-95"
                >
                  <Play size={13} color="#ffffff" fill="#ffffff" />
                  <Text className="text-xs font-bold text-white">Join Lecture</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Subject Mascot Cards */}
            <View>
              {CUTE_SUBJECT_MASCOTS.map((subject) => (
                <SubjectMascotCard
                  key={subject.id}
                  subject={subject}
                  onPress={() => Alert.alert(subject.name, `Opening ${subject.topic} lessons with ${subject.mascotName}`)}
                  onPlayPress={() => liveLecture && openPlayer(liveLecture)}
                />
              ))}
            </View>
          </View>
        )}

        {/* ================= TAB 2: LIVE CHAT & DOUBTS ================= */}
        {activeTab === 'chat' && (
          <View className="gap-4">
            {/* Batch Sakura Group Card */}
            <View className="bg-white border-2 border-cute-border rounded-3xl p-5 shadow-xs gap-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2.5">
                  <View className="w-10 h-10 rounded-2xl bg-cute-peach-light border border-cute-peach items-center justify-center">
                    <Text className="text-lg">🌸</Text>
                  </View>
                  <View>
                    <Text className="text-sm font-black text-cute-cocoa">Batch Sakura 🌸 Group</Text>
                    <Text className="text-xs text-cute-muted">Teacher & 28 Verified Classmates</Text>
                  </View>
                </View>

                <View className="bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  <Text className="text-[10px] font-bold text-emerald-800">Live Realtime ⚡</Text>
                </View>
              </View>

              <View className="bg-cute-cream p-3 rounded-2xl border border-cute-border gap-1">
                <Text className="text-[10px] font-black text-cute-muted uppercase tracking-wider">
                  Pinned Announcement:
                </Text>
                <Text className="text-xs text-cute-cocoa font-bold">
                  📌 Physics masterclass on Rotational Dynamics is live at 04:30 PM. Keep your formula cheat-sheets ready!
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => router.push('/chat')}
                className="w-full bg-cute-peach py-3 rounded-2xl items-center flex-row justify-center gap-2 shadow-xs active:scale-98"
              >
                <MessageSquare size={14} color="#ffffff" />
                <Text className="text-xs font-black text-white">
                  Open Batch Group Chat (Live Room) →
                </Text>
              </TouchableOpacity>
            </View>

            {/* Direct Teacher Chat Card */}
            <View className="bg-white border-2 border-cute-border rounded-3xl p-5 shadow-xs gap-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2.5">
                  <View className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 items-center justify-center">
                    <Text className="text-lg">🍎</Text>
                  </View>
                  <View>
                    <Text className="text-sm font-black text-cute-cocoa">Prof. Vikram Joshi ⚡</Text>
                    <Text className="text-xs text-cute-muted">Physics Faculty • 1-on-1 Direct</Text>
                  </View>
                </View>

                <View className="bg-cute-peach-light border border-cute-peach px-2 py-0.5 rounded-full">
                  <Text className="text-[10px] font-bold text-cute-peach">Direct</Text>
                </View>
              </View>

              <Text className="text-xs text-cute-muted leading-relaxed">
                Have private questions about test marks, doubt clarification, or attendance excuses? Message your teacher directly.
              </Text>

              <TouchableOpacity
                onPress={() => router.push('/chat')}
                className="w-full bg-cute-cream border border-cute-border py-2.5 rounded-2xl items-center flex-row justify-center gap-1.5 active:scale-98"
              >
                <Text className="text-xs font-bold text-cute-cocoa">Message Prof. Vikram Privately ✉️</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ================= TAB 3: PROGRESS & CHARTS ================= */}
        {activeTab === 'progress' && (
          <View className="gap-4">
            <PerformanceComparisonChart data={comparisonChartData} />
            <SubjectRadarOrBarChart />
            <AttendanceRingAndTrendChart percentage={96.4} />

            {/* Hall of Stars Ranking */}
            <View className="bg-white border-2 border-cute-border rounded-[28px] p-5 shadow-xs">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-2">
                  <Trophy size={18} color="#f59e0b" />
                  <Text className="text-base font-extrabold text-cute-cocoa">Hall of Stars 🌟</Text>
                </View>
                <Text className="text-xs font-bold text-cute-peach">Batch Sakura</Text>
              </View>

              {[
                { rank: '1', name: 'Amelia Sharma (You!) 🌸', score: '294/300', tag: 'Top 1% 🔥' },
                { rank: '2', name: 'Rohan Mehra 🚀', score: '288/300', tag: 'Fast Solver ⚡' },
                { rank: '3', name: 'Tanvi Patel 🍀', score: '282/300', tag: '100% Attendance ⭐' },
              ].map((st, i) => (
                <View
                  key={i}
                  className={`flex-row items-center justify-between p-3 rounded-2xl mb-2 ${
                    i === 0 ? 'bg-amber-50 border border-amber-200' : 'bg-cute-cream border border-cute-border'
                  }`}
                >
                  <View className="flex-row items-center gap-2.5">
                    <View className="w-6 h-6 rounded-full bg-white items-center justify-center border border-black/10">
                      <Text className="text-xs font-black text-cute-cocoa">{st.rank}</Text>
                    </View>
                    <View>
                      <Text className="text-xs font-bold text-cute-cocoa">{st.name}</Text>
                      <Text className="text-[10px] text-cute-muted">{st.tag}</Text>
                    </View>
                  </View>
                  <Text className="text-xs font-black text-cute-cocoa">{st.score}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ================= TAB 3: NOTES & PDFS ================= */}
        {activeTab === 'notes' && (
          <View>
            <StudyMaterialsViewer />
          </View>
        )}

        {/* ================= TAB 4: ASSIGNMENTS & DPP ================= */}
        {activeTab === 'assignments' && (
          <View>
            <AssignmentsModule />
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      <VideoPlayerModal />
      <NotificationDrawer />
      <FeeReceiptModal />
    </ScreenWrapper>
  );
}
