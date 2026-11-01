import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import {
  UserCheck,
  Check,
  X,
  Clock,
  GraduationCap,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  Shield,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper, Badge } from '@/components/ui';
import { useInstitute } from '@/context/InstituteContext';

export interface PendingStudentRequest {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  targetExam: string;
  grade: string;
  school: string;
  board: string;
  previousScore: string;
  weakSubjects: string[];
  appliedTime: string;
  codeUsed: string;
}

const DEFAULT_PENDING: PendingStudentRequest[] = [
  {
    id: 'req-01',
    name: 'Kabir Singhania 🌸',
    email: 'kabir.s@gmail.com',
    rollNumber: 'ADM-2026-118',
    targetExam: 'IIT-JEE 2026',
    grade: 'Class 11 Science',
    school: 'Delhi Public School (R.K. Puram)',
    board: 'CBSE',
    previousScore: '94.2% in Class 10',
    weakSubjects: ['Organic Chemistry', 'Rotational Mechanics'],
    appliedTime: '15 mins ago',
    codeUsed: 'SHARMA-MATH-89',
  },
  {
    id: 'req-02',
    name: 'Zoya Khan 🌿',
    email: 'zoya.k@gmail.com',
    rollNumber: 'ADM-2026-124',
    targetExam: 'NEET Medical 2026',
    grade: 'Class 11 Science',
    school: 'St. Xavier High School',
    board: 'ICSE',
    previousScore: '91.8% in Class 10',
    weakSubjects: ['Physics Numerical Problems'],
    appliedTime: '1 hour ago',
    codeUsed: 'BLOOM2026',
  },
];

export default function VerifyStudentsScreen() {
  const router = useRouter();
  const { currentInstitute } = useInstitute();
  const [requests, setRequests] = useState<PendingStudentRequest[]>(DEFAULT_PENDING);

  const handleApprove = (req: PendingStudentRequest) => {
    Alert.alert(
      'Approve & Assign Batch 🌸',
      `Approve ${req.name} and enroll into Batch Sakura?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve & Enroll',
          onPress: () => {
            setRequests(prev => prev.filter(r => r.id !== req.id));
            Alert.alert('Student Verified! 🎉', `${req.name} has been approved and notified.`);
          },
        },
      ]
    );
  };

  const handleReject = (req: PendingStudentRequest) => {
    Alert.alert(
      'Decline Request',
      `Are you sure you want to decline ${req.name}'s request?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () => {
            setRequests(prev => prev.filter(r => r.id !== req.id));
          },
        },
      ]
    );
  };

  return (
    <ScreenWrapper
      headerProps={{
        title: 'Verify Student Requests 📋',
        instituteName: currentInstitute?.name || 'Bloom Academy',
        onBackPress: () => router.back(),
      }}
    >
      {/* Overview Banner */}
      <View className="bg-cute-peach-light border-2 border-cute-peach rounded-[28px] p-5 mb-4 shadow-xs">
        <View className="flex-row items-center justify-between mb-2">
          <View className="bg-white px-2.5 py-0.5 rounded-full border border-cute-peach flex-row items-center gap-1.5">
            <Clock size={12} color="#ff7d6b" />
            <Text className="text-[10px] font-bold text-cute-peach uppercase">Verification Queue</Text>
          </View>
          <Text className="text-xs font-bold text-cute-cocoa">{requests.length} Pending</Text>
        </View>

        <Text className="text-base font-black text-cute-cocoa leading-tight">
          Teacher Code Gatekeeper 🛡️
        </Text>
        <Text className="text-xs text-cute-muted mt-1">
          Review student extended bios before granting access to batch lectures, DPPs, and attendance rosters.
        </Text>
      </View>

      {/* Empty State */}
      {requests.length === 0 && (
        <View className="bg-white border-2 border-cute-border rounded-[28px] p-8 items-center text-center my-6">
          <Text className="text-4xl mb-2">🎉</Text>
          <Text className="text-base font-black text-cute-cocoa">All Caught Up!</Text>
          <Text className="text-xs text-cute-muted mt-1 text-center">
            No pending student join requests at this moment.
          </Text>
        </View>
      )}

      {/* Requests Feed */}
      <View className="gap-3.5 mb-6">
        {requests.map((req) => (
          <View
            key={req.id}
            className="bg-white border-2 border-cute-border rounded-[28px] p-5 shadow-xs"
          >
            {/* Header */}
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2.5">
                <View className="w-10 h-10 rounded-2xl bg-cute-cream border border-cute-border items-center justify-center">
                  <GraduationCap size={18} color="#ff7d6b" />
                </View>
                <View>
                  <Text className="text-sm font-black text-cute-cocoa">{req.name}</Text>
                  <Text className="text-[10px] text-cute-muted">{req.email} • {req.appliedTime}</Text>
                </View>
              </View>

              <View className="bg-cute-peach-light px-2.5 py-0.5 rounded-full border border-cute-peach">
                <Text className="text-[10px] font-bold text-cute-peach">{req.targetExam}</Text>
              </View>
            </View>

            {/* Extended Student Bio Details */}
            <View className="bg-cute-cream/70 rounded-2xl p-3 border border-cute-border mb-3.5 gap-1.5">
              <View className="flex-row justify-between">
                <Text className="text-[11px] text-cute-muted">Class & Board:</Text>
                <Text className="text-[11px] font-bold text-cute-cocoa">{req.grade} • {req.board}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-[11px] text-cute-muted">Current School:</Text>
                <Text className="text-[11px] font-bold text-cute-cocoa">{req.school}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-[11px] text-cute-muted">Past Academic Percentage:</Text>
                <Text className="text-[11px] font-bold text-cute-mint">{req.previousScore}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-[11px] text-cute-muted">Code Entered:</Text>
                <Text className="text-[11px] font-bold text-cute-peach font-mono">{req.codeUsed}</Text>
              </View>

              {/* Weak Subjects Tags */}
              <View className="mt-1 pt-1.5 border-t border-cute-border">
                <Text className="text-[10px] font-bold text-cute-muted mb-1">Focus / Weak Areas:</Text>
                <View className="flex-row flex-wrap gap-1">
                  {req.weakSubjects.map((sub, i) => (
                    <View key={i} className="bg-white px-2 py-0.5 rounded-md border border-cute-border">
                      <Text className="text-[9px] font-bold text-cute-cocoa">{sub}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Approval / Rejection Action Buttons */}
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => handleReject(req)}
                className="flex-1 py-2.5 rounded-xl border border-rose-300 bg-rose-50 items-center flex-row justify-center gap-1 active:scale-98"
              >
                <X size={14} color="#e11d48" />
                <Text className="text-xs font-bold text-rose-700">Decline</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleApprove(req)}
                className="flex-2 py-2.5 rounded-xl bg-cute-peach items-center flex-row justify-center gap-1.5 shadow-xs active:scale-98"
              >
                <Check size={14} color="#ffffff" />
                <Text className="text-xs font-bold text-white">Approve & Assign Batch 🌸</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScreenWrapper>
  );
}
