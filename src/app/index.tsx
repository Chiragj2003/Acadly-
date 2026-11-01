import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import {
  Users,
  CalendarCheck,
  TrendingUp,
  Wallet,
  Play,
  MessageSquare,
  ArrowRight,
  Sparkles,
} from 'lucide-react-native';

import {
  ScreenWrapper,
  MetricCard,
  RoleCard,
  AttendanceToggle,
  Button,
  Input,
  Badge,
  Card,
  type UserRoleType,
  type AttendanceStatus,
} from '@/components/ui';
import { useAcademic } from '@/context/AcademicContext';
import { VideoPlayerModal } from '@/components/academic';

export default function HomeScreen() {
  const { lectures, openPlayer } = useAcademic();
  const [selectedRole, setSelectedRole] = useState<UserRoleType>('student');
  const [attendance, setAttendance] = useState<AttendanceStatus>('P');
  const [mobileNumber, setMobileNumber] = useState('98290 41208');

  const liveLecture = lectures[0];

  return (
    <ScreenWrapper
      headerProps={{
        title: 'Acadly Hub',
        instituteName: 'Apex IIT-JEE Academy (Kota)',
        onInstitutePress: () => Alert.alert('Institute Switcher', 'Switch active institute campus'),
        onNotificationPress: () => Alert.alert('Notifications', 'No unread notifications'),
        onProfilePress: () => Alert.alert('Profile', `Signed in as ${selectedRole.toUpperCase()}`),
      }}
    >
      {/* Hero Live Class Banner (from Stitch Student Hub) */}
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

        <View className="mt-4 pt-2 flex-row items-center justify-between border-t border-white/10">
          <View className="flex-row items-center gap-1.5">
            <Sparkles size={16} color="#85f8c4" />
            <Text className="text-xs text-surface-container-high">Broadcast Synced</Text>
          </View>
          <Button
            size="sm"
            variant="secondaryContainer"
            title="Join Lecture"
            rightIcon={<Play size={14} color="#ffffff" fill="#ffffff" />}
            onPress={() => liveLecture && openPlayer(liveLecture)}
          />
        </View>
      </Card>

      {/* Academic Vitals Mosaic (from Stitch Admin & Student designs) */}
      <View className="gap-2">
        <View className="flex-row items-center justify-between px-1">
          <Text className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
            Live Academic Vitals
          </Text>
          <Badge label="Kota Campus" variant="success" />
        </View>

        <View className="flex-row gap-2.5">
          <View className="flex-1">
            <MetricCard
              title="Students"
              value="842"
              trendText="+12% this mo"
              trendDirection="positive"
              icon={<Users size={16} color="#0051d5" />}
            />
          </View>
          <View className="flex-1">
            <MetricCard
              title="Roll Call"
              value="96.4%"
              trendText="793 P • 49 A"
              trendDirection="info"
              icon={<CalendarCheck size={16} color="#0051d5" />}
            />
          </View>
        </View>

        <View className="flex-row gap-2.5">
          <View className="flex-1">
            <MetricCard
              title="Avg Mock Score"
              value="248"
              subValue="/300"
              trendText="Top 0.8% • AIR 142"
              trendDirection="positive"
              icon={<TrendingUp size={16} color="#069669" />}
            />
          </View>
          <View className="flex-1">
            <MetricCard
              title="Pending Dues"
              value="₹4.85L"
              trendText="34 Students"
              trendDirection="negative"
              icon={<Wallet size={16} color="#ba1a1a" />}
            />
          </View>
        </View>
      </View>

      {/* Role Workspace Switcher (from Stitch Onboarding) */}
      <View className="gap-2">
        <View className="flex-row items-center justify-between px-1">
          <Text className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
            Switch Role Workspace
          </Text>
          <Badge label={`Current: ${selectedRole.toUpperCase()}`} variant="admin" />
        </View>

        <View className="flex-row gap-2">
          <View className="flex-1">
            <RoleCard
              role="admin"
              isSelected={selectedRole === 'admin'}
              onSelect={setSelectedRole}
            />
          </View>
          <View className="flex-1">
            <RoleCard
              role="teacher"
              isSelected={selectedRole === 'teacher'}
              onSelect={setSelectedRole}
            />
          </View>
        </View>

        <View className="flex-row gap-2">
          <View className="flex-1">
            <RoleCard
              role="student"
              isSelected={selectedRole === 'student'}
              onSelect={setSelectedRole}
            />
          </View>
          <View className="flex-1">
            <RoleCard
              role="parent"
              isSelected={selectedRole === 'parent'}
              onSelect={setSelectedRole}
            />
          </View>
        </View>
      </View>

      {/* Interactive Roll Call Widget (from Stitch Teacher Hub) */}
      <Card elevation="lowest" className="gap-3">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-xs font-semibold text-secondary">In-Session Roll Call</Text>
            <Text className="text-base font-bold text-on-surface">Aditya Sharma (#01)</Text>
          </View>
          <AttendanceToggle
            value={attendance}
            onChange={(status) => {
              setAttendance(status);
              Alert.alert('Status Updated', `Aditya marked as ${status === 'P' ? 'Present' : status === 'A' ? 'Absent' : 'Late'}`);
            }}
          />
        </View>
        <Text className="text-xs text-on-surface-variant">
          Auto WhatsApp broadcast enabled for unexcused absence
        </Text>
      </Card>

      {/* Quick Input & WhatsApp Nudge CTA */}
      <View className="gap-3">
        <Input
          label="Registered Mobile Identifier"
          rightLabel="India (+91)"
          showPhonePrefix
          value={mobileNumber}
          onChangeText={setMobileNumber}
          placeholder="Enter 10-digit number"
        />

        <View className="flex-row gap-2">
          <View className="flex-1">
            <Button
              variant="primary"
              title="Launch Portal"
              rightIcon={<ArrowRight size={16} color="#ffffff" />}
              fullWidth
              onPress={() => Alert.alert('Launch Portal', `Launching ${selectedRole} portal`)}
            />
          </View>
          <View className="flex-1">
            <Button
              variant="surface"
              title="WhatsApp Nudge"
              leftIcon={<MessageSquare size={16} color="#069669" />}
              fullWidth
              onPress={() => Alert.alert('WhatsApp Nudge', 'Dispatched reminder to 34 parents')}
            />
          </View>
        </View>
      </View>

      <VideoPlayerModal />
    </ScreenWrapper>
  );
}
