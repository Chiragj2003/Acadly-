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
import { DAILY_AFFIRMATIONS, DAILY_MOODS } from '@/data/dummyAcademicData';

export default function CuteStudentScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { currentInstitute } = useInstitute();
  const { lectures, openPlayer, teacherProfile, comparisonChartData } = useAcademic();
  const { openNotificationDrawer, unreadCount } = useFeeNotification();

  const [activeTab, setActiveTab] = useState<'courses' | 'chat' | 'progress' | 'notes' | 'assignments'>('courses');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeDayIndex, setActiveDayIndex] = useState(2); // Tuesday default
  const [selectedMood, setSelectedMood] = useState('focus');

  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const liveLecture = lectures.find((l) => l.is_live) || lectures[0];
  const categories = ['All', 'Math 📐', 'Physics ⚡', 'Biology 🌿', 'Chemistry 🧪'];

  const handleProfilePress = () => {
    Alert.alert(
      user?.full_name || 'Amelia Sharma 🌸',
      'Batch Sakura • Class 11 Science • JEE 2026\nRoll No: #07\nAttendance: 96.4%',
      [
        {
          text: 'Sign Out 🚪',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/auth');
          },
        },
        { text: 'Close', style: 'cancel' },
      ]
    );
  };

  return (
    <ScreenWrapper
      headerProps={{
        title: 'Student Hub 🌸',
        instituteName: currentInstitute?.name || 'Bloom Academy',
        onNotificationPress: openNotificationDrawer,
        onProfilePress: handleProfilePress,
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
                <Text className="text-base font-black text-cute-cocoa">{user?.full_name || 'Amelia Sharma'} 🌸</Text>
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

        {/* 2. 6-Day Streak Banner (Aptivo & Moodpress Inspired) */}
        <View className="bg-cute-peach-light border-2 border-cute-peach rounded-3xl p-3.5 flex-row items-center justify-between shadow-xs">
          <View className="flex-row items-center gap-2.5 flex-1 pr-2">
            <Mascot mood="streak" size="sm" />
            <View className="flex-1">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-xs font-black text-cute-cocoa">6 Day Study Streak! 🔥</Text>
                <View className="bg-amber-100 px-1.5 py-0.5 rounded-full border border-amber-300">
                  <Text className="text-[9px] font-bold text-amber-700">+100 XP</Text>
                </View>
              </View>
              <Text className="text-[11px] text-cute-muted mt-0.5">
                {DAILY_AFFIRMATIONS[activeDayIndex % DAILY_AFFIRMATIONS.length]}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => Alert.alert('Streak Rewards 🏆', 'You are on a 6-day consistency streak! Maintain 7 days to unlock the Grand Topper Badge.')}
            className="bg-cute-peach px-3 py-1.5 rounded-xl active:scale-95 shadow-xs"
          >
            <Text className="text-[10px] font-extrabold text-white">Details</Text>
          </TouchableOpacity>
        </View>

        {/* 3. Study Rhythm Weekday Strip & Mood Check-in (Mind&Me Inspired) */}
        <View className="bg-white border-2 border-cute-border rounded-3xl p-4 shadow-xs">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xs font-black text-cute-cocoa uppercase tracking-wider">
              Study Rhythm ({dayNames[activeDayIndex]})
            </Text>
            <Text className="text-xs text-cute-muted font-bold">Week 14</Text>
          </View>

          {/* Days Strip */}
          <View className="flex-row justify-between mb-3">
            {daysOfWeek.map((day, idx) => {
              const isSelected = activeDayIndex === idx;
              return (
                <TouchableOpacity
                  key={`day-${idx}`}
                  activeOpacity={0.8}
                  onPress={() => setActiveDayIndex(idx)}
                  className={`w-10 h-12 rounded-2xl items-center justify-center border ${
                    isSelected
                      ? 'bg-cute-peach border-cute-peach shadow-xs'
                      : 'bg-cute-cream border-cute-border'
                  }`}
                >
                  <Text className={`text-[11px] font-black ${isSelected ? 'text-white' : 'text-cute-cocoa'}`}>
                    {day}
                  </Text>
                  <View className={`w-1.5 h-1.5 rounded-full mt-1 ${isSelected ? 'bg-white' : 'bg-cute-muted/40'}`} />
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Daily Feeling Check-in */}
          <View className="pt-2.5 border-t border-cute-border">
            <Text className="text-[11px] font-bold text-cute-muted mb-2">
              How are you feeling today?
            </Text>
            <View className="flex-row justify-between gap-1.5">
              {[
                { id: 'happy', emoji: '🌸', label: 'Ready' },
                { id: 'focus', emoji: '☕', label: 'Focused' },
                { id: 'neutral', emoji: '☁️', label: 'Steady' },
                { id: 'tired', emoji: '🌙', label: 'Relaxed' },
              ].map((m) => {
                const isSelected = selectedMood === m.id;
                return (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() => setSelectedMood(m.id)}
                    className={`flex-1 py-1.5 px-1 rounded-xl items-center border ${
                      isSelected
                        ? 'bg-cute-peach-light border-cute-peach'
                        : 'bg-cute-cream border-cute-border'
                    }`}
                  >
                    <Text className="text-base">{m.emoji}</Text>
                    <Text className={`text-[10px] font-bold mt-0.5 ${isSelected ? 'text-cute-peach' : 'text-cute-muted'}`}>
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* 4. Dual Stat Squircles (Image 4 Olympiad Dashboard Inspired) */}
        <View className="flex-row gap-3">
          <View className="flex-1 bg-white border-2 border-cute-border rounded-3xl p-3.5 shadow-xs">
            <View className="w-8 h-8 rounded-xl bg-cute-peach-light border border-cute-peach items-center justify-center mb-1.5">
              <BookOpen size={16} color="#ff7d6b" />
            </View>
            <Text className="text-[11px] font-bold text-cute-muted">Completed</Text>
            <Text className="text-2xl font-black text-cute-cocoa mt-0.5">78</Text>
            <Text className="text-[10px] text-cute-peach font-bold mt-0.5">Lessons mastered 🎓</Text>
          </View>

          <View className="flex-1 bg-white border-2 border-cute-border rounded-3xl p-3.5 shadow-xs">
            <View className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 items-center justify-center mb-1.5">
              <Clock size={16} color="#6366f1" />
            </View>
            <Text className="text-[11px] font-bold text-cute-muted">Active Time</Text>
            <Text className="text-2xl font-black text-cute-cocoa mt-0.5">12h</Text>
            <Text className="text-[10px] text-indigo-600 font-bold mt-0.5">Study hours this week ⚡</Text>
          </View>
        </View>

        {/* 5. Connected Tuition / Solo Teacher Card */}
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
