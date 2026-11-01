import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import {
  Sparkles,
  BookOpen,
  Calendar,
  Heart,
  ChevronRight,
  Smile,
  Coffee,
  Sun,
  Shield,
  GraduationCap,
  Users,
  Building,
  CheckCircle2,
  FileText,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { ScreenWrapper, Badge } from '@/components/ui';
import { useInstitute } from '@/context/InstituteContext';
import { useAcademic } from '@/context/AcademicContext';
import { useFeeNotification } from '@/context/FeeNotificationContext';
import { VideoPlayerModal } from '@/components/academic';
import { NotificationDrawer, RazorpayCheckoutModal, FeeReceiptModal } from '@/components/finance';
import { CUTE_STUDY_NOTES, DAILY_MOODS, DAILY_AFFIRMATIONS, StudyNote } from '@/data/dummyAcademicData';

export default function CuteHomeScreen() {
  const router = useRouter();
  const { currentInstitute, availableInstitutes, switchInstitute, joinInstituteByCode } = useInstitute();
  const { lectures, openPlayer } = useAcademic();
  const { openNotificationDrawer, unreadCount } = useFeeNotification();

  const [selectedMood, setSelectedMood] = useState('happy');
  const [activeDayIndex, setActiveDayIndex] = useState(1); // Monday default
  const [selectedNote, setSelectedNote] = useState<StudyNote | null>(null);

  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleJoinCode = () => {
    Alert.prompt
      ? Alert.prompt(
          'Join an Academy 🌸',
          'Enter the Academy Join Code (e.g., BLOOM2026 or STAR2026):',
          async (code) => {
            if (code) {
              const res = await joinInstituteByCode(code);
              if (res.success) {
                Alert.alert('Welcome aboard! 🎉', 'You have joined the academy successfully.');
              } else {
                Alert.alert('Oops!', res.error || 'Could not find that academy.');
              }
            }
          }
        )
      : Alert.alert('Join Academy', 'Use join code: BLOOM2026');
  };

  return (
    <ScreenWrapper
      headerProps={{
        title: currentInstitute?.name || 'Bloom Academy 🌸',
        instituteName: currentInstitute?.tagline || 'Where learning is a joy ✨',
        onInstitutePress: () => {
          Alert.alert(
            'Switch Academy 🏫',
            'Select your active learning campus:',
            [
              ...availableInstitutes.map((inst) => ({
                text: inst.name,
                onPress: () => switchInstitute(inst.id),
              })),
              { text: '+ Join with Code 🌸', onPress: handleJoinCode },
              { text: 'Cancel', style: 'cancel' },
            ]
          );
        },
        onNotificationPress: openNotificationDrawer,
        hasUnreadNotifications: unreadCount > 0,
      }}
    >
      {/* 1. Mind&Me Warm Greeting Banner */}
      <View className="bg-cute-peach-light border border-cute-blush rounded-3xl p-5 mb-4 shadow-sm">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center gap-1.5 bg-white px-3 py-1 rounded-full border border-cute-blush">
            <Sparkles size={14} color="#ff7d6b" />
            <Text className="text-xs font-semibold text-cute-cocoa">Daily Study Vibe</Text>
          </View>
          <Text className="text-xl">🌸 ✨</Text>
        </View>

        <Text className="text-2xl font-bold text-cute-cocoa leading-tight mt-1">
          Hi, Star Learner! 👋
        </Text>
        <Text className="text-sm text-cute-muted mt-1 leading-relaxed">
          {DAILY_AFFIRMATIONS[activeDayIndex % DAILY_AFFIRMATIONS.length]}
        </Text>

        {/* Weekday Selector inspired by Mind&Me */}
        <View className="mt-4 pt-3 border-t border-cute-blush/40">
          <Text className="text-xs font-semibold text-cute-muted mb-2 uppercase tracking-wider">
            Your Study Rhythm this week
          </Text>
          <View className="flex-row justify-between">
            {daysOfWeek.map((day, idx) => {
              const isSelected = activeDayIndex === idx;
              return (
                <TouchableOpacity
                  key={`${day}-${idx}`}
                  onPress={() => setActiveDayIndex(idx)}
                  className={`w-10 h-12 rounded-2xl items-center justify-center ${
                    isSelected ? 'bg-cute-peach shadow-sm' : 'bg-white border border-cute-border'
                  }`}
                >
                  <Text
                    className={`text-[11px] font-medium ${
                      isSelected ? 'text-white' : 'text-cute-muted'
                    }`}
                  >
                    {day}
                  </Text>
                  <Text
                    className={`text-xs font-bold mt-0.5 ${
                      isSelected ? 'text-white' : 'text-cute-cocoa'
                    }`}
                  >
                    {12 + idx}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* 2. Mood & Mindset Check-in inspired by Moodpress */}
      <View className="bg-white border border-cute-border rounded-3xl p-4 mb-4 shadow-sm">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <Smile size={18} color="#ff7d6b" />
            <Text className="text-base font-bold text-cute-cocoa">How are you feeling today?</Text>
          </View>
          <Badge label="Daily Check-in" variant="warning" />
        </View>

        <View className="flex-row gap-2.5">
          {DAILY_MOODS.map((mood) => {
            const isChosen = selectedMood === mood.id;
            return (
              <TouchableOpacity
                key={mood.id}
                onPress={() => setSelectedMood(mood.id)}
                className={`flex-1 py-3 px-2 rounded-2xl items-center border ${
                  isChosen
                    ? 'bg-cute-peach-light border-cute-peach'
                    : 'bg-cute-cream border-cute-border'
                }`}
              >
                <Text className="text-2xl mb-1">{mood.emoji}</Text>
                <Text
                  className={`text-[11px] font-semibold text-center ${
                    isChosen ? 'text-cute-cocoa' : 'text-cute-muted'
                  }`}
                  numberOfLines={1}
                >
                  {mood.label.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 3. Four Role Spaces (Cute & Welcoming Squircles) */}
      <View className="mb-4">
        <View className="flex-row items-center justify-between px-1 mb-2.5">
          <Text className="text-sm font-bold text-cute-cocoa uppercase tracking-wider">
            Explore Your Role Spaces 🌸
          </Text>
          <Text className="text-xs text-cute-peach font-semibold">Touch to enter</Text>
        </View>

        <View className="gap-2.5">
          {/* Student Hub */}
          <TouchableOpacity
            onPress={() => router.push('/student')}
            className="bg-white border border-cute-border rounded-3xl p-4 flex-row items-center justify-between shadow-sm active:opacity-80"
          >
            <View className="flex-row items-center gap-3.5">
              <View className="w-12 h-12 rounded-2xl bg-cute-mint-light items-center justify-center border border-cute-mint">
                <Text className="text-2xl">🌱</Text>
              </View>
              <View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-base font-bold text-cute-cocoa">Student Learning Hub</Text>
                  <View className="bg-cute-mint-light px-2 py-0.5 rounded-full">
                    <Text className="text-[10px] font-bold text-cute-mint">Active</Text>
                  </View>
                </View>
                <Text className="text-xs text-cute-muted mt-0.5">
                  Handwritten notes, daily lectures, assignments & quizzes
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color="#a89993" />
          </TouchableOpacity>

          {/* Teacher Studio */}
          <TouchableOpacity
            onPress={() => router.push('/teacher')}
            className="bg-white border border-cute-border rounded-3xl p-4 flex-row items-center justify-between shadow-sm active:opacity-80"
          >
            <View className="flex-row items-center gap-3.5">
              <View className="w-12 h-12 rounded-2xl bg-cute-peach-light items-center justify-center border border-cute-peach">
                <Text className="text-2xl">🍎</Text>
              </View>
              <View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-base font-bold text-cute-cocoa">Teacher Faculty Studio</Text>
                  <View className="bg-cute-peach-light px-2 py-0.5 rounded-full">
                    <Text className="text-[10px] font-bold text-cute-peach">Faculty</Text>
                  </View>
                </View>
                <Text className="text-xs text-cute-muted mt-0.5">
                  Attendance rosters, lecture publishing & assignment grading
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color="#a89993" />
          </TouchableOpacity>

          {/* Parent Corner */}
          <TouchableOpacity
            onPress={() => router.push('/parent')}
            className="bg-white border border-cute-border rounded-3xl p-4 flex-row items-center justify-between shadow-sm active:opacity-80"
          >
            <View className="flex-row items-center gap-3.5">
              <View className="w-12 h-12 rounded-2xl bg-cute-butter-light items-center justify-center border border-cute-butter">
                <Text className="text-2xl">🏡</Text>
              </View>
              <View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-base font-bold text-cute-cocoa">Parent & Guardian Portal</Text>
                  <View className="bg-cute-butter-light px-2 py-0.5 rounded-full">
                    <Text className="text-[10px] font-bold text-cute-cocoa">Family</Text>
                  </View>
                </View>
                <Text className="text-xs text-cute-muted mt-0.5">
                  Attendance tracking, fee ledger & Razorpay UPI receipts
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color="#a89993" />
          </TouchableOpacity>

          {/* Admin Command */}
          <TouchableOpacity
            onPress={() => router.push('/admin')}
            className="bg-white border border-cute-border rounded-3xl p-4 flex-row items-center justify-between shadow-sm active:opacity-80"
          >
            <View className="flex-row items-center gap-3.5">
              <View className="w-12 h-12 rounded-2xl bg-cute-lavender-light items-center justify-center border border-cute-lavender">
                <Text className="text-2xl">🏫</Text>
              </View>
              <View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-base font-bold text-cute-cocoa">Director & Admin Desk</Text>
                  <View className="bg-cute-lavender-light px-2 py-0.5 rounded-full">
                    <Text className="text-[10px] font-bold text-cute-lavender">Command</Text>
                  </View>
                </View>
                <Text className="text-xs text-cute-muted mt-0.5">
                  Batch admissions, revenue analytics & faculty schedules
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color="#a89993" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 4. Cute Study Materials & Human Notes Carousel */}
      <View className="bg-white border border-cute-border rounded-3xl p-5 mb-4 shadow-sm">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <BookOpen size={18} color="#ff7d6b" />
            <Text className="text-base font-bold text-cute-cocoa">Handwritten Study Notes 🌸</Text>
          </View>
          <Text className="text-xs text-cute-muted">{CUTE_STUDY_NOTES.length} documents</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-2 px-2">
          <View className="flex-row gap-3">
            {CUTE_STUDY_NOTES.map((note) => (
              <TouchableOpacity
                key={note.id}
                onPress={() => setSelectedNote(note)}
                style={{ backgroundColor: note.colorBg, borderColor: note.colorBorder }}
                className="w-64 p-4 rounded-3xl border shadow-sm"
              >
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-2xl">{note.emoji}</Text>
                  <View
                    style={{ backgroundColor: note.badgeColor }}
                    className="px-2.5 py-0.5 rounded-full"
                  >
                    <Text className="text-[10px] font-bold text-cute-cocoa">{note.badge}</Text>
                  </View>
                </View>

                <Text className="text-sm font-bold text-cute-cocoa" numberOfLines={1}>
                  {note.title}
                </Text>
                <Text className="text-xs text-cute-muted mt-1" numberOfLines={2}>
                  {note.subtitle}
                </Text>

                <View className="mt-3 pt-2.5 border-t border-black/5 flex-row items-center justify-between">
                  <Text className="text-[11px] font-medium text-cute-muted">
                    {note.fileSizeBytes}
                  </Text>
                  <Text className="text-[11px] font-bold text-cute-peach">Read Summary →</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Note Reader Modal (Human & relishing reading experience) */}
      {selectedNote && (
        <View className="bg-cute-cream border border-cute-peach rounded-3xl p-5 mb-6 shadow-md">
          <View className="flex-row items-center justify-between mb-3 pb-2 border-b border-cute-border">
            <View className="flex-row items-center gap-2">
              <Text className="text-2xl">{selectedNote.emoji}</Text>
              <View>
                <Text className="text-base font-bold text-cute-cocoa">{selectedNote.title}</Text>
                <Text className="text-xs text-cute-muted">{selectedNote.author} • {selectedNote.chapter}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setSelectedNote(null)}
              className="bg-white w-8 h-8 rounded-full items-center justify-center border border-cute-border"
            >
              <Text className="text-xs font-bold text-cute-muted">✕</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-xs font-bold text-cute-peach uppercase tracking-wider mb-1.5">
            Key Concepts to Remember:
          </Text>
          <View className="gap-1 mb-3">
            {selectedNote.keyTakeaways.map((point, i) => (
              <View key={i} className="flex-row items-start gap-1.5">
                <CheckCircle2 size={13} color="#52b788" className="mt-0.5" />
                <Text className="text-xs text-cute-cocoa flex-1">{point}</Text>
              </View>
            ))}
          </View>

          <View className="bg-white p-3 rounded-2xl border border-cute-border mb-3">
            <Text className="text-xs font-mono text-cute-cocoa leading-relaxed whitespace-pre-line">
              {selectedNote.sampleContent}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => Alert.alert('Downloaded 🌸', `Saved ${selectedNote.title} to your offline documents.`)}
            className="bg-cute-peach py-2.5 rounded-2xl items-center shadow-sm"
          >
            <Text className="text-xs font-bold text-white">Save PDF Offline (Free) 📥</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Live Video Modal & Drawer Providers */}
      <VideoPlayerModal />
      <NotificationDrawer />
      <RazorpayCheckoutModal />
      <FeeReceiptModal />
    </ScreenWrapper>
  );
}
