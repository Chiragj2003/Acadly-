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
  VideoPlayerModal,
  StudyMaterialsViewer,
  AssignmentsModule,
} from '@/components/academic';
import {
  FeeReceiptModal,
  NotificationDrawer,
} from '@/components/finance';
import { CUTE_SUBJECT_MASCOTS, SubjectMascot } from '@/components/ui/SubjectMascotCard';
import { CUTE_STUDY_NOTES } from '@/data/dummyAcademicData';

export default function CuteStudentScreen() {
  const router = useRouter();
  const { currentInstitute } = useInstitute();
  const { lectures, openPlayer } = useAcademic();
  const { openNotificationDrawer, unreadCount } = useFeeNotification();

  const [activeTab, setActiveTab] = useState<'courses' | 'progress' | 'notes' | 'assignments'>('courses');
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
      {/* 1. Student Profile Header inspired by Jacob's Dashboard */}
      <View className="bg-white border-2 border-cute-border rounded-[28px] p-4 flex-row items-center justify-between mb-4 shadow-xs">
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
              Batch Sakura • Class 11 Science • Kota
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

      {/* Quick Action Navigation Strip (Community, 360 Analytics, Teacher Code) */}
      <View className="flex-row gap-2 mb-4">
        <TouchableOpacity
          onPress={() => router.push('/community')}
          className="flex-1 bg-white border border-cute-border p-2.5 rounded-2xl flex-row items-center justify-center gap-1.5 shadow-xs"
        >
          <Text className="text-xs">💬</Text>
          <Text className="text-[11px] font-bold text-cute-cocoa">Community</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/student-detail')}
          className="flex-1 bg-white border border-cute-border p-2.5 rounded-2xl flex-row items-center justify-center gap-1.5 shadow-xs"
        >
          <Text className="text-xs">📊</Text>
          <Text className="text-[11px] font-bold text-cute-cocoa">My 360° Stats</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/join-institute')}
          className="flex-1 bg-cute-peach-light border border-cute-peach p-2.5 rounded-2xl flex-row items-center justify-center gap-1.5 shadow-xs"
        >
          <Text className="text-xs">🔑</Text>
          <Text className="text-[11px] font-bold text-cute-peach">Teacher Code</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Horizontal Pill Tab Navigator inspired by Aptivo & Mind&Me */}
      <View className="flex-row gap-2 mb-4">
        {[
          { key: 'courses', label: 'My Subjects 📚' },
          { key: 'progress', label: 'Rhythm & Stats 📈' },
          { key: 'notes', label: 'Cute Notes 🌸' },
          { key: 'assignments', label: 'Daily DPP ✏️' },
        ].map((tab) => {
          const isSelected = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key as any)}
              className={`flex-1 py-2.5 rounded-2xl items-center border ${
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

      {/* Tab 1: Courses & Mascots */}
      {activeTab === 'courses' && (
        <View>
          {/* Live Masterclass Hero Card from Stitch & Jacob's Banner */}
          <View className="bg-cute-peach-light border-2 border-cute-peach rounded-[28px] p-5 mb-4 shadow-xs">
            <View className="flex-row items-center justify-between mb-2">
              <View className="bg-white px-2.5 py-1 rounded-full border border-cute-peach flex-row items-center gap-1.5">
                <View className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <Text className="text-[11px] font-bold text-rose-500">LIVE AT 04:00 PM</Text>
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

          {/* Category Filter Pills from Moodpress */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3 -mx-1 px-1">
            <View className="flex-row gap-2">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full border ${
                      isSelected
                        ? 'bg-cute-cocoa border-cute-cocoa'
                        : 'bg-white border-cute-border'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        isSelected ? 'text-white' : 'text-cute-muted'
                      }`}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Subject Mascot Cards (Drino, Tonot, Petal, Bredo) */}
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

      {/* Tab 2: Progress & Stats */}
      {activeTab === 'progress' && (
        <View>
          <CuteProgressChart />

          {/* Ranking & Hall of Stars */}
          <View className="bg-white border-2 border-cute-border rounded-[28px] p-5 shadow-xs mb-4">
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

      {/* Tab 3: Study Notes & PDFs */}
      {activeTab === 'notes' && (
        <View>
          <StudyMaterialsViewer />
        </View>
      )}

      {/* Tab 4: Assignments & DPP Module */}
      {activeTab === 'assignments' && (
        <View>
          <AssignmentsModule />
        </View>
      )}

      {/* Modals */}
      <VideoPlayerModal />
      <NotificationDrawer />
      <FeeReceiptModal />
    </ScreenWrapper>
  );
}
