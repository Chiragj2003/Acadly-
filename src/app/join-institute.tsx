import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  QrCode,
  ArrowRight,
  GraduationCap,
  Clock,
  CheckCircle2,
  Phone,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper, Mascot } from '@/components/ui';
import { useAcademic, StudentExtraDetails } from '@/context/AcademicContext';
import { useAuth } from '@/context/AuthContext';
import { useRoleGuard } from '@/hooks/useRoleGuard';

const WEAK_SUBJECT_OPTIONS = [
  'Rotational Mechanics',
  'Calculus & Limits',
  'Ionic Equilibrium',
  'Organic Chemistry',
  'Electromagnetism',
  'Genetics & Biotech',
  'Coordinate Geometry',
  'Wave Optics',
];

const GRADE_OPTIONS = [
  'Class 10 (Board)',
  'Class 11 Science',
  'Class 12 Science',
  'Dropper / Repeater',
];

const BOARD_OPTIONS = ['CBSE', 'ICSE', 'State Board', 'IB / Cambridge'];

export default function JoinInstituteScreen() {
  const router = useRouter();
  const { isAuthorized, isLoading } = useRoleGuard(['student']);
  const { user } = useAuth();
  const {
    submitJoinRequest,
    studentJoinStatus,
    activeJoinRequest,
    teacherProfile,
    coachingProfile,
  } = useAcademic();

  // Steps: 'form' | 'waiting'
  const [step, setStep] = useState<'form' | 'waiting'>(
    studentJoinStatus === 'pending' ? 'waiting' : 'form'
  );

  // Form State
  const [fullName, setFullName] = useState(user?.full_name || 'Amelia Sharma');
  const [grade, setGrade] = useState('Class 11 Science');
  const [board, setBoard] = useState('CBSE');
  const [targetExam, setTargetExam] = useState('IIT-JEE 2026');
  const [school, setSchool] = useState('Delhi Public School (R.K. Puram)');
  const [previousScore, setPreviousScore] = useState('96.2%');
  const [selectedWeakSubjects, setSelectedWeakSubjects] = useState<string[]>([
    'Rotational Mechanics',
    'Ionic Equilibrium',
  ]);
  const [guardianName, setGuardianName] = useState('Sunita Sharma');
  const [guardianPhone, setGuardianPhone] = useState('+91 98230 44551');
  const [bloodGroup, setBloodGroup] = useState('B+');
  const [teacherCode, setTeacherCode] = useState('JOSHI-MATH-89');

  // Toggle Weak Subject Chip
  const toggleWeakSubject = (sub: string) => {
    setSelectedWeakSubjects((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
    );
  };

  // Matched target resolution
  const cleanCode = teacherCode.trim().toUpperCase();
  let matchedTarget: { name: string; type: string; detail: string; rate: string } | null = null;
  if (cleanCode === teacherProfile.teacherCode.toUpperCase()) {
    matchedTarget = {
      name: teacherProfile.fullName,
      type: 'Solo Faculty Desk',
      detail: `${teacherProfile.qualification} • ${teacherProfile.specializationSubjects.join(', ')}`,
      rate: `₹${teacherProfile.monthlyFeeRate.toLocaleString('en-IN')}/month`,
    };
  } else if (cleanCode === (coachingProfile?.inviteCode || '').toUpperCase()) {
    matchedTarget = {
      name: coachingProfile?.name || 'Bloom Science Academy',
      type: 'Coaching Center',
      detail: `${coachingProfile?.city} Campus • ${coachingProfile?.subjectsOffered.join(', ')}`,
      rate: 'Comprehensive Tier Plan',
    };
  } else if (cleanCode.length >= 4) {
    matchedTarget = {
      name: `Teacher / Institute (${cleanCode})`,
      type: 'Verified Provider',
      detail: 'Curriculum & Live Batches',
      rate: 'Standard Batch Rate',
    };
  }

  if (isLoading || !isAuthorized) {
    return (
      <ScreenWrapper headerProps={{ title: 'Join Classes', onBackPress: () => router.back() }}>
        <View className="flex-1 items-center justify-center p-8">
          <ActivityIndicator size="small" color="#2563EB" />
          <Text className="text-xs text-slate-500 mt-2 font-medium">Verifying authorization...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  // Handle Join Submission
  const handleSubmit = async () => {
    if (!teacherCode.trim()) {
      Alert.alert('Validation Error', 'Please enter your Teacher Code or Coaching Code.');
      return;
    }
    if (!fullName.trim()) {
      Alert.alert('Validation Error', 'Please enter your full name.');
      return;
    }

    const details: StudentExtraDetails = {
      fullName,
      grade,
      board,
      targetExam,
      school,
      previousPercentage: previousScore,
      weakSubjects: selectedWeakSubjects,
      guardianName,
      guardianPhone,
      bloodGroup,
    };

    const res = await submitJoinRequest(details, teacherCode.trim().toUpperCase());
    if (res.success) {
      setStep('waiting');
      Alert.alert('Request Submitted', `Sent to ${res.targetName} for verification.`);
    } else {
      Alert.alert('Error', res.error || 'Could not submit join request.');
    }
  };

  return (
    <ScreenWrapper
      headerProps={{
        title: 'Join Coaching or Teacher',
        onBackPress: () => router.back(),
      }}
    >
      {step === 'waiting' ? (
        /* ================= WAITING FOR APPROVAL SCREEN ================= */
        <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-12">
          <View className="bg-white border border-slate-200 rounded-[32px] p-6 items-center shadow-xs">
            <Mascot mood="curious" size="lg" />

            <View className="bg-amber-50 border border-amber-200 px-3 py-1 rounded-full mt-3 flex-row items-center gap-1.5">
              <Clock size={12} color="#D97706" />
              <Text className="text-[11px] font-extrabold text-amber-800">
                Verification Pending
              </Text>
            </View>

            <Text className="text-xl font-black text-slate-800 mt-3 text-center">
              Request Sent to Teacher
            </Text>
            <Text className="text-xs text-slate-500 text-center mt-1 max-w-[280px] leading-relaxed">
              Your application has been received. Your teacher will review your background and assign your batch shortly.
            </Text>

            {/* Target Card */}
            <View className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 my-4">
              <View className="flex-row items-center justify-between pb-2 mb-2 border-b border-slate-200">
                <Text className="text-xs font-black text-slate-800">
                  {activeJoinRequest?.matchedTargetName || matchedTarget?.name || 'Prof. Vikram Joshi'}
                </Text>
                <View className="bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                  <Text className="text-[10px] font-bold text-blue-600">
                    Code: {activeJoinRequest?.codeUsed || cleanCode}
                  </Text>
                </View>
              </View>

              <View className="gap-1">
                <View className="flex-row justify-between">
                  <Text className="text-xs text-slate-500">Target Exam:</Text>
                  <Text className="text-xs font-bold text-slate-800">
                    {activeJoinRequest?.studentDetails.targetExam || targetExam}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-slate-500">School & Board:</Text>
                  <Text className="text-xs font-bold text-slate-800">
                    {activeJoinRequest?.studentDetails.board || board} •{' '}
                    {activeJoinRequest?.studentDetails.grade || grade}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-slate-500">Guardian Phone:</Text>
                  <Text className="text-xs font-bold text-slate-800">
                    {activeJoinRequest?.studentDetails.guardianPhone || guardianPhone}
                  </Text>
                </View>
              </View>

              {/* Weak Subject Tags */}
              <View className="mt-2.5 pt-2.5 border-t border-slate-200">
                <Text className="text-[10px] font-bold text-slate-500 mb-1.5">
                  Focus / Weak Areas:
                </Text>
                <View className="flex-row flex-wrap gap-1.5">
                  {(activeJoinRequest?.studentDetails.weakSubjects || selectedWeakSubjects).map(
                    (ws, idx) => (
                      <View
                        key={idx}
                        className="bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md"
                      >
                        <Text className="text-[10px] font-bold text-rose-800">{ws}</Text>
                      </View>
                    )
                  )}
                </View>
              </View>
            </View>

            {/* Clean Action Buttons */}
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => router.replace('/student')}
              className="w-full bg-blue-600 py-3.5 rounded-2xl items-center shadow-xs flex-row justify-center gap-2 mb-2.5 active:scale-98"
            >
              <GraduationCap size={16} color="#ffffff" />
              <Text className="text-xs font-black text-white tracking-wide">
                Return to Student Desk
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setStep('form')}
              className="py-2 items-center"
            >
              <Text className="text-xs font-bold text-slate-500 underline">
                Edit Details or Change Code
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        /* ================= STUDENT PROFILE & CODE INPUT FORM ================= */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="gap-4 pb-16"
          keyboardShouldPersistTaps="handled"
        >
          {/* 1. Teacher Code & Live Preview */}
          <View className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
            <View className="flex-row items-center gap-2.5 mb-2">
              <View className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 items-center justify-center">
                <QrCode size={18} color="#2563EB" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-black text-slate-800">
                  Enter Teacher / Coaching Code
                </Text>
                <Text className="text-xs text-slate-500">
                  Share code provided by your teacher
                </Text>
              </View>
            </View>

            <TextInput
              placeholder="e.g. JOSHI-MATH-89 or APEX2026"
              placeholderTextColor="#94A3B8"
              autoCapitalize="characters"
              value={teacherCode}
              onChangeText={setTeacherCode}
              className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-black text-slate-800 tracking-wider mt-2 uppercase"
            />

            {/* Live Matched Teacher Preview Card */}
            {matchedTarget && (
              <View className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 mt-3">
                <View className="flex-row items-center justify-between mb-1">
                  <View className="flex-row items-center gap-1.5">
                    <CheckCircle2 size={14} color="#2563EB" />
                    <Text className="text-xs font-black text-slate-800">
                      {matchedTarget.name}
                    </Text>
                  </View>
                  <View className="bg-white/90 px-2 py-0.5 rounded-md border border-blue-200/30">
                    <Text className="text-[10px] font-bold text-blue-600">
                      {matchedTarget.type}
                    </Text>
                  </View>
                </View>
                <Text className="text-[11px] text-slate-800/80 leading-snug">
                  {matchedTarget.detail}
                </Text>
                <Text className="text-[10px] font-bold text-blue-600 mt-1">
                  Fee: {matchedTarget.rate}
                </Text>
              </View>
            )}
          </View>

          {/* 2. Student Academic Details */}
          <View className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs gap-3">
            <View className="flex-row items-center gap-2 mb-1">
              <GraduationCap size={16} color="#2563EB" />
              <Text className="text-sm font-black text-slate-800">
                Student Academic Profile
              </Text>
            </View>

            <View>
              <Text className="text-xs font-bold text-slate-800 mb-1">Student Full Name</Text>
              <TextInput
                placeholder="e.g. Amelia Sharma"
                placeholderTextColor="#94A3B8"
                value={fullName}
                onChangeText={setFullName}
                className="bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs text-slate-800"
              />
            </View>

            <View>
              <Text className="text-xs font-bold text-slate-800 mb-1.5">Class / Grade</Text>
              <View className="flex-row flex-wrap gap-1.5">
                {GRADE_OPTIONS.map((g) => (
                  <TouchableOpacity
                    key={g}
                    onPress={() => setGrade(g)}
                    className={`px-3 py-1.5 rounded-xl border ${
                      grade === g
                        ? 'bg-blue-600 border-blue-600'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        grade === g ? 'text-white' : 'text-slate-700'
                      }`}
                    >
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View>
              <Text className="text-xs font-bold text-slate-800 mb-1.5">Affiliated Board</Text>
              <View className="flex-row flex-wrap gap-1.5">
                {BOARD_OPTIONS.map((b) => (
                  <TouchableOpacity
                    key={b}
                    onPress={() => setBoard(b)}
                    className={`px-3 py-1.5 rounded-xl border ${
                      board === b
                        ? 'bg-blue-600 border-blue-600'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        board === b ? 'text-white' : 'text-slate-700'
                      }`}
                    >
                      {b}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View className="flex-row gap-2">
              <View className="flex-1">
                <Text className="text-xs font-bold text-slate-800 mb-1">Target Exam</Text>
                <TextInput
                  placeholder="e.g. IIT-JEE 2026"
                  placeholderTextColor="#94A3B8"
                  value={targetExam}
                  onChangeText={setTargetExam}
                  className="bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs text-slate-800"
                />
              </View>
              <View className="w-28">
                <Text className="text-xs font-bold text-slate-800 mb-1">Previous %</Text>
                <TextInput
                  placeholder="e.g. 96.2%"
                  placeholderTextColor="#94A3B8"
                  value={previousScore}
                  onChangeText={setPreviousScore}
                  className="bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs text-slate-800"
                />
              </View>
            </View>

            <View>
              <Text className="text-xs font-bold text-slate-800 mb-1">School / College Name</Text>
              <TextInput
                placeholder="e.g. Delhi Public School"
                placeholderTextColor="#94A3B8"
                value={school}
                onChangeText={setSchool}
                className="bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs text-slate-800"
              />
            </View>

            {/* Weak Subject Checkboxes */}
            <View>
              <Text className="text-xs font-bold text-slate-800 mb-1.5">
                Focus Subject Areas (Select areas where you need guidance)
              </Text>
              <View className="flex-row flex-wrap gap-1.5">
                {WEAK_SUBJECT_OPTIONS.map((sub) => {
                  const isSel = selectedWeakSubjects.includes(sub);
                  return (
                    <TouchableOpacity
                      key={sub}
                      onPress={() => toggleWeakSubject(sub)}
                      className={`px-2.5 py-1.5 rounded-xl border ${
                        isSel
                          ? 'bg-rose-50 border-rose-300'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <Text
                        className={`text-[11px] font-bold ${
                          isSel ? 'text-rose-700' : 'text-slate-600'
                        }`}
                      >
                        {isSel ? '✓ ' : '+ '}
                        {sub}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* 3. Guardian & Emergency Contact */}
          <View className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs gap-3">
            <View className="flex-row items-center gap-2 mb-1">
              <Phone size={16} color="#2563EB" />
              <Text className="text-sm font-black text-slate-800">
                Guardian Contact & Bio
              </Text>
            </View>

            <View>
              <Text className="text-xs font-bold text-slate-800 mb-1">Guardian Full Name</Text>
              <TextInput
                placeholder="e.g. Sunita Sharma"
                placeholderTextColor="#94A3B8"
                value={guardianName}
                onChangeText={setGuardianName}
                className="bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs text-slate-800"
              />
            </View>

            <View className="flex-row gap-2">
              <View className="flex-1">
                <Text className="text-xs font-bold text-slate-800 mb-1">Guardian Phone (SMS Alerts)</Text>
                <TextInput
                  placeholder="+91 98230 44551"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  value={guardianPhone}
                  onChangeText={setGuardianPhone}
                  className="bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs text-slate-800"
                />
              </View>
              <View className="w-24">
                <Text className="text-xs font-bold text-slate-800 mb-1">Blood Grp</Text>
                <TextInput
                  placeholder="e.g. B+"
                  placeholderTextColor="#94A3B8"
                  value={bloodGroup}
                  onChangeText={setBloodGroup}
                  className="bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs text-slate-800"
                />
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleSubmit}
            className="w-full bg-blue-600 py-3.5 rounded-2xl items-center shadow-xs flex-row justify-center gap-2 active:scale-98"
          >
            <Text className="text-xs font-black text-white tracking-wide">
              Send Join Request to Teacher
            </Text>
            <ArrowRight size={14} color="#ffffff" />
          </TouchableOpacity>
        </ScrollView>
      )}
    </ScreenWrapper>
  );
}
