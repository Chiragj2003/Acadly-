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
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import {
  ScreenWrapper,
  MetricCard,
  Button,
  Badge,
  Card,
} from '@/components/ui';

export default function StudentScreen() {
  const { activeInstitute } = useAuth();
  const [downloadedIds, setDownloadedIds] = useState<string[]>([]);

  const handleDownloadOffline = (id: string, title: string) => {
    if (downloadedIds.includes(id)) {
      Alert.alert('Offline Access', `"${title}" is already saved for offline viewing.`);
      return;
    }
    Alert.alert('Downloading', `Caching "${title}" for offline video playback...`);
    setTimeout(() => {
      setDownloadedIds((prev) => [...prev, id]);
      Alert.alert('Download Complete', `"${title}" saved locally (128 MB).`);
    }, 1200);
  };

  return (
    <ScreenWrapper
      headerProps={{
        title: 'Student Hub',
        instituteName: activeInstitute?.name,
        onNotificationPress: () => Alert.alert('Student Notices', 'Rotational Dynamics DPP due tomorrow!'),
        onProfilePress: () => Alert.alert('Student Profile', 'Aryan Kapoor • Class 12 Science'),
      }}
    >
      {/* Student Profile Snapshot Card (from Stitch Student design) */}
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

      {/* Hero Next Live Class Banner */}
      <Card elevation="hero" className="border-0">
        <View className="flex-row items-center justify-between mb-2">
          <Badge label="LIVE IN 35 MINS" variant="live" showDot />
          <Badge label="Room 204 & Hybrid" variant="info" />
        </View>

        <View className="mt-1">
          <Text className="text-xl font-bold text-surface-bright leading-tight">
            JEE Adv. Masterclass: Electromagnetism
          </Text>
          <Text className="text-xs text-primary-fixed-dim mt-1">
            Er. Rakesh Verma • Starts at 02:00 PM
          </Text>
        </View>

        <View className="mt-4 pt-2.5 flex-row items-center justify-between border-t border-white/10">
          <Text className="text-xs text-surface-container-high font-medium">Broadcast Synced</Text>
          <Button
            size="sm"
            variant="secondaryContainer"
            title="Join Lecture"
            rightIcon={<ArrowRight size={14} color="#ffffff" />}
            onPress={() => Alert.alert('Live Lecture', 'Connecting to interactive live classroom...')}
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
          onPress={() => Alert.alert('Fee Receipt', 'Receipt #APX-REC-892 downloaded as PDF')}
        />
      </Card>

      {/* Pending Assignments / DPPs */}
      <View className="gap-2">
        <View className="flex-row items-center justify-between px-1">
          <Text className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
            Pending Assignments
          </Text>
          <Text className="text-xs font-semibold text-secondary">2 Due This Week</Text>
        </View>

        <Card elevation="lowest" className="p-3 flex-row items-center justify-between gap-2">
          <View className="flex-1 min-w-0">
            <View className="flex-row items-center gap-1.5 mb-0.5">
              <Badge label="Due Tomorrow" variant="due" />
              <Text className="text-xs text-on-surface-variant">25 Questions</Text>
            </View>
            <Text className="text-xs font-bold text-on-surface" numberOfLines={1}>
              Rotational Dynamics DPP-04
            </Text>
          </View>
          <Button
            size="sm"
            variant="surface"
            title="Upload"
            onPress={() => Alert.alert('Upload Solution', 'Select PDF or camera snapshot...')}
          />
        </Card>

        <Card elevation="lowest" className="p-3 flex-row items-center justify-between gap-2">
          <View className="flex-1 min-w-0">
            <View className="flex-row items-center gap-1.5 mb-0.5">
              <Badge label="Due in 4 Days" variant="neutral" />
              <Text className="text-xs text-on-surface-variant">Chemistry</Text>
            </View>
            <Text className="text-xs font-bold text-on-surface" numberOfLines={1}>
              Thermodynamics Practice Sheet B
            </Text>
          </View>
          <Button
            size="sm"
            variant="surface"
            title="Upload"
            onPress={() => Alert.alert('Upload Solution', 'Select PDF or camera snapshot...')}
          />
        </Card>
      </View>

      {/* Recent Video Lectures */}
      <View className="gap-2">
        <View className="flex-row items-center justify-between px-1">
          <Text className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
            Recent Video Lectures
          </Text>
          <Text className="text-xs font-semibold text-secondary">View Library</Text>
        </View>

        <Card elevation="lowest" className="p-3 gap-2.5">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5">
              <Badge label="Organic Chemistry" variant="info" />
              <Text className="text-xs text-on-surface-variant">• Lecture 14</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Clock size={12} color="#76777d" />
              <Text className="text-xs text-on-surface-variant">1h 14m</Text>
            </View>
          </View>

          <Text className="text-sm font-bold text-on-surface">
            Reaction Mechanisms: Nucleophilic Attack
          </Text>
          <Text className="text-xs text-on-surface-variant">
            Prof. Arvind Swaminathan (IIT Bombay Alum)
          </Text>

          <View className="flex-row gap-2 pt-1 border-t border-black/5">
            <View className="flex-1">
              <Button
                size="sm"
                variant="primary"
                title="Play Video"
                rightIcon={<Play size={14} color="#ffffff" fill="#ffffff" />}
                fullWidth
                onPress={() => Alert.alert('Playing Lecture', 'Opening video stream...')}
              />
            </View>
            <Button
              size="sm"
              variant="surface"
              title={downloadedIds.includes('v1') ? 'Saved' : 'Offline'}
              leftIcon={
                downloadedIds.includes('v1') ? (
                  <Check size={14} color="#069669" />
                ) : (
                  <DownloadCloud size={14} color="#0051d5" />
                )
              }
              onPress={() => handleDownloadOffline('v1', 'Reaction Mechanisms: Nucleophilic Attack')}
            />
          </View>
        </Card>
      </View>

      {/* Motivational Delight Card */}
      <Card elevation="high" className="p-3.5 flex-row items-center gap-3">
        <View className="w-10 h-10 rounded-full bg-secondary items-center justify-center shrink-0">
          <Flame size={20} color="#ffffff" />
        </View>
        <View className="flex-1 min-w-0">
          <Text className="text-xs font-bold text-on-surface">Streak on fire: 14 Days Active!</Text>
          <Text className="text-[11px] text-on-surface-variant" numberOfLines={1}>
            Solve 2 more questions to top today's batch leaderboard.
          </Text>
        </View>
      </Card>
    </ScreenWrapper>
  );
}
