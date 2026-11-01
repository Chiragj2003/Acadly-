import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import {
  Sparkles,
  QrCode,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Clock,
  CheckCircle2,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper, Mascot } from '@/components/ui';
import { useInstitute } from '@/context/InstituteContext';

export default function JoinInstituteScreen() {
  const router = useRouter();
  const { joinInstituteByCode } = useInstitute();

  const [step, setStep] = useState<'details' | 'code' | 'waiting'>('code');
  const [teacherCode, setTeacherCode] = useState('');
  const [grade, setGrade] = useState('Class 11 Science');
  const [targetExam, setTargetExam] = useState('IIT-JEE 2026');
  const [school, setSchool] = useState('');
  const [previousScore, setPreviousScore] = useState('');
  const [weakSubjects, setWeakSubjects] = useState('');

  const handleJoinSubmit = async () => {
    if (!teacherCode.trim()) {
      Alert.alert('Validation Error', 'Please enter your Teacher or Coaching Code.');
      return;
    }

    const res = await joinInstituteByCode(teacherCode);
    if (res.success) {
      setStep('waiting');
    } else {
      Alert.alert('Invalid Code', res.error || 'Could not find a teacher or coaching center with this code.');
    }
  };

  return (
    <ScreenWrapper
      headerProps={{
        title: 'Join Coaching or Teacher 🌸',
        onBackPress: () => router.back(),
      }}
    >
      {/* WAITING SCREEN */}
      {step === 'waiting' ? (
        <View className="bg-white border-2 border-cute-border rounded-[28px] p-6 items-center my-6 shadow-xs">
          <Mascot mood="curious" size="lg" />
          <Text className="text-xl font-black text-cute-cocoa mt-4 text-center">
            Request Sent to Teacher! 🌸
          </Text>
          <Text className="text-xs text-cute-muted text-center mt-1.5 leading-relaxed">
            Your join request with Teacher Code <Text className="font-bold text-cute-peach">{teacherCode.toUpperCase()}</Text> is now pending verification.
          </Text>

          <View className="bg-cute-peach-light rounded-2xl p-4 border border-cute-peach my-5 w-full">
            <View className="flex-row items-center gap-2 mb-1">
              <Clock size={14} color="#ff7d6b" />
              <Text className="text-xs font-bold text-cute-peach">What happens next?</Text>
            </View>
            <Text className="text-[11px] text-cute-cocoa leading-relaxed">
              Your teacher will review your profile, approve your request, and assign you to your batch and DPP materials. You will receive an instant notification!
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.replace('/student')}
            className="w-full bg-cute-peach py-3 rounded-2xl items-center shadow-xs"
          >
            <Text className="text-xs font-bold text-white">Go to Student Hub (Preview) →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* CODE ENTRY & DETAILS FORM */
        <ScrollView showsVerticalScrollIndicator={false} className="gap-4">
          <View className="bg-cute-peach-light border-2 border-cute-peach rounded-[28px] p-5 shadow-xs">
            <View className="flex-row items-center gap-2.5 mb-2">
              <View className="w-10 h-10 rounded-2xl bg-white border border-cute-peach items-center justify-center">
                <QrCode size={18} color="#ff7d6b" />
              </View>
              <View>
                <Text className="text-base font-black text-cute-cocoa">Enter Teacher Code</Text>
                <Text className="text-xs text-cute-muted">Get your code from your teacher or institute</Text>
              </View>
            </View>

            <View className="bg-white rounded-2xl p-3 border border-cute-border mt-2">
              <Text className="text-[10px] font-bold text-cute-muted uppercase mb-1">Teacher / Coaching Code</Text>
              <TextInput
                placeholder="e.g. SHARMA-MATH-89 or BLOOM2026"
                placeholderTextColor="#a89993"
                autoCapitalize="characters"
                value={teacherCode}
                onChangeText={setTeacherCode}
                className="text-base font-black text-cute-cocoa tracking-wider uppercase"
              />
            </View>
          </View>

          {/* Extended Profile Details */}
          <View className="bg-white border-2 border-cute-border rounded-[28px] p-5 shadow-xs gap-3">
            <Text className="text-xs font-black text-cute-cocoa uppercase tracking-wider">
              Student Extended Profile Details
            </Text>

            <View>
              <Text className="text-xs font-bold text-cute-cocoa mb-1">Class / Grade</Text>
              <TextInput
                value={grade}
                onChangeText={setGrade}
                className="bg-cute-cream border border-cute-border rounded-xl px-3 py-2 text-xs text-cute-cocoa font-medium"
              />
            </View>

            <View>
              <Text className="text-xs font-bold text-cute-cocoa mb-1">Target Exam / Stream</Text>
              <TextInput
                value={targetExam}
                onChangeText={setTargetExam}
                className="bg-cute-cream border border-cute-border rounded-xl px-3 py-2 text-xs text-cute-cocoa font-medium"
              />
            </View>

            <View>
              <Text className="text-xs font-bold text-cute-cocoa mb-1">Current School / College</Text>
              <TextInput
                placeholder="e.g. Delhi Public School"
                placeholderTextColor="#a89993"
                value={school}
                onChangeText={setSchool}
                className="bg-cute-cream border border-cute-border rounded-xl px-3 py-2 text-xs text-cute-cocoa font-medium"
              />
            </View>

            <View>
              <Text className="text-xs font-bold text-cute-cocoa mb-1">Class 10 Percentage / GPA</Text>
              <TextInput
                placeholder="e.g. 94.5%"
                placeholderTextColor="#a89993"
                value={previousScore}
                onChangeText={setPreviousScore}
                className="bg-cute-cream border border-cute-border rounded-xl px-3 py-2 text-xs text-cute-cocoa font-medium"
              />
            </View>

            <TouchableOpacity
              onPress={handleJoinSubmit}
              className="bg-cute-peach py-3 rounded-2xl items-center mt-2 shadow-xs active:scale-98"
            >
              <Text className="text-xs font-extrabold text-white">Send Join Request to Teacher 🌸</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </ScreenWrapper>
  );
}
