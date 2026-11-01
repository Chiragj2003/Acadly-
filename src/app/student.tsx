import React, { useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import {
  Trophy,
  Play,
  FileCheck,
  CalendarCheck,
  CheckCircle2,
  Clock,
  DownloadCloud,
  Check,
  Flame,
  ArrowRight,
  BookOpen,
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useAcademic } from '@/context/AcademicContext';
import { useFeeNotification } from '@/context/FeeNotificationContext';
import {
  ScreenWrapper,
  MetricCard,
  Button,
  Badge,
  Card,
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

export default function StudentScreen() {
  const { activeInstitute } = useAuth();
  const { lectures, openPlayer, offlineLectureIds, toggleOfflineDownload } = useAcademic();
  const { payments, openReceipt, openNotificationDrawer, unreadCount } = useFeeNotification();
  const [activeSection, setActiveSection] = useState<'hub' | 'notes' | 'assignments'>('hub');

  const liveLecture = lectures.find((l) => l.is_live) || lectures[0];
  const lastPayment = payments[0];

  return (
    <ScreenWrapper
      headerProps={{
        title: 'Student Hub',
        instituteName: activeInstitute?.name,
        onNotificationPress: openNotificationDrawer,
        onProfilePress: () => Alert.alert('Student Profile', 'Aryan Kapoor • Class 12 Science'),
        hasUnreadNotifications: unreadCount > 0,
      }}
    >
      {/* Student Profile Snapshot Card */}
      <Card elevation="low" className="p-3.5 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3 flex-1 min-w-0">
          <View className="w-12 h-12 rounded-full bg-secondary items-center justify-center">
            <Text className="text-base font-bold text-white">AK</Text>
          </View>
          <View className="flex-1 min-w-0">
            <View className="flex-row items-center gap-1.5">
              <Text className="text-base font-bold text-on-surface" numberOfLines={1}>
                Aryan Kapoor
              </Text>
              <Badge label="Pro" variant="pro" />
            </View>
            <Text className="text-xs text-on-surface-variant mt-0.5" numberOfLines={1}>
              Roll #JEE-2025-104 • Class 12 Science
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => Alert.alert('Target Exam', 'Target: JEE Advanced 2025 • AIR Top 100')}
          className="w-9 h-9 rounded-full bg-surface-container-highest items-center justify-center active:scale-95"
        >
          <Trophy size={18} color="#0051d5" />
        </Pressable>
      </Card>

      {/* Navigation Sub-Tabs */}
      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={() => setActiveSection('hub')}
          className={`flex-1 py-2 rounded-xl items-center ${
            activeSection === 'hub' ? 'bg-primary' : 'bg-surface-container'
          }`}
        >
          <Text
            className={`text-xs font-semibold ${
              activeSection === 'hub' ? 'text-on-primary' : 'text-on-surface-variant'
            }`}
          >
            Overview & Videos
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveSection('assignments')}
          className={`flex-1 py-2 rounded-xl items-center ${
            activeSection === 'assignments' ? 'bg-primary' : 'bg-surface-container'
          }`}
        >
          <Text
            className={`text-xs font-semibold ${
              activeSection === 'assignments' ? 'text-on-primary' : 'text-on-surface-variant'
            }`}
          >
            Assignments & DPP
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveSection('notes')}
          className={`flex-1 py-2 rounded-xl items-center ${
            activeSection === 'notes' ? 'bg-primary' : 'bg-surface-container'
          }`}
        >
          <Text
            className={`text-xs font-semibold ${
              activeSection === 'notes' ? 'text-on-primary' : 'text-on-surface-variant'
            }`}
          >
            PDF Notes
          </Text>
        </Pressable>
      </View>

      {/* SECTION 1: OVERVIEW & VIDEOS */}
      {activeSection === 'hub' && (
        <View className="gap-4">
          {/* Hero Live Class Banner */}
          <Card elevation="hero" className="border-0">
            <View className="flex-row items-center justify-between mb-2">
              <Badge label="LIVE IN 35 MINS" variant="live" showDot />
              <Badge label="Room 204 & Hybrid" variant="info" />
            </View>

            <View className="mt-1">
              <Text className="text-xl font-bold text-surface-bright leading-tight">
                {liveLecture.title}
              </Text>
              <Text className="text-xs text-primary-fixed-dim mt-1">
                {liveLecture.faculty_name} • Starts at 02:00 PM
              </Text>
            </View>

            <View className="mt-4 pt-2.5 flex-row items-center justify-between border-t border-white/10">
              <Text className="text-xs text-surface-container-high font-medium">Broadcast Synced</Text>
              <Button
                size="sm"
                variant="secondaryContainer"
                title="Join Lecture"
                rightIcon={<Play size={14} color="#ffffff" fill="#ffffff" />}
                onPress={() => openPlayer(liveLecture)}
              />
            </View>
          </Card>

          {/* Academic Vitals Mosaic */}
          <View className="gap-2">
            <View className="flex-row items-center justify-between px-1">
              <Text className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                Academic Vitals
              </Text>
              <Text className="text-xs font-semibold text-secondary">Target: AIR Top 100</Text>
            </View>

            <View className="flex-row gap-2">
              <View className="flex-1">
                <MetricCard
                  title="Attendance"
                  value="96.4%"
                  trendText="Excellent"
                  trendDirection="positive"
                  icon={<CalendarCheck size={16} color="#069669" />}
                />
              </View>
              <View className="flex-1">
                <MetricCard
                  title="DPPs & Sheets"
                  value="28"
                  subValue="/30"
                  trendText="On Schedule"
                  trendDirection="info"
                  icon={<FileCheck size={16} color="#0051d5" />}
                />
              </View>
              <View className="flex-1">
                <MetricCard
                  title="Mock AIR"
                  value="142"
                  trendText="Top 0.8%"
                  trendDirection="positive"
                  icon={<Trophy size={16} color="#0051d5" />}
                />
              </View>
            </View>
          </View>

          {/* Fee Status Snapshot */}
          <Card elevation="container" className="p-3 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2.5 flex-1 min-w-0 mr-2">
              <View className="w-8 h-8 rounded-lg bg-surface-container-lowest items-center justify-center shrink-0">
                <CheckCircle2 size={18} color="#069669" />
              </View>
              <View className="flex-1 min-w-0">
                <Text className="text-xs font-bold text-on-surface">₹0 Overdue Balance</Text>
                <Text className="text-[11px] text-on-surface-variant" numberOfLines={1}>
                  Next instalment ₹15,000 due 15th Nov
                </Text>
              </View>
            </View>

            <Button
              size="sm"
              variant="surface"
              title="Receipt"
              onPress={() => lastPayment && openReceipt(lastPayment)}
            />
          </Card>

          {/* Recorded Video Lectures List */}
          <View className="gap-2">
            <View className="flex-row items-center justify-between px-1">
              <Text className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                Recent Video Lectures
              </Text>
              <Badge label={`${lectures.length} Available`} variant="info" />
            </View>

            {lectures.map((lec) => (
              <Card key={lec.id} elevation="lowest" className="p-3 gap-2.5">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-1.5">
                    <Badge label={lec.subject} variant="info" />
                    <Text className="text-xs text-on-surface-variant">• Lecture {lec.lecture_number || 1}</Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <Clock size={12} color="#76777d" />
                    <Text className="text-xs text-on-surface-variant">{lec.duration_formatted}</Text>
                  </View>
                </View>

                <Text className="text-sm font-bold text-on-surface">{lec.title}</Text>
                <Text className="text-xs text-on-surface-variant">{lec.faculty_name}</Text>

                <View className="flex-row gap-2 pt-1 border-t border-black/5">
                  <View className="flex-1">
                    <Button
                      size="sm"
                      variant="primary"
                      title="Play Lecture"
                      rightIcon={<Play size={14} color="#ffffff" fill="#ffffff" />}
                      fullWidth
                      onPress={() => openPlayer(lec)}
                    />
                  </View>
                  <Button
                    size="sm"
                    variant="surface"
                    title={offlineLectureIds.includes(lec.id) ? 'Saved' : 'Offline'}
                    leftIcon={
                      offlineLectureIds.includes(lec.id) ? (
                        <Check size={14} color="#069669" />
                      ) : (
                        <DownloadCloud size={14} color="#0051d5" />
                      )
                    }
                    onPress={() => toggleOfflineDownload(lec.id)}
                  />
                </View>
              </Card>
            ))}
          </View>
        </View>
      )}

      {/* SECTION 2: ASSIGNMENTS & DPPs */}
      {activeSection === 'assignments' && <AssignmentsModule />}

      {/* SECTION 3: STUDY MATERIALS & NOTES */}
      {activeSection === 'notes' && <StudyMaterialsViewer />}

      {/* Modal Video Player */}
      <VideoPlayerModal />
      <FeeReceiptModal />
      <NotificationDrawer />
    </ScreenWrapper>
  );
}
