import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Sparkles,
  QrCode,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Clock,
  CheckCircle2,
  BookOpen,
  User,
  Phone,
  Heart,
  School,
  Award,
  Layers,
  ArrowLeft,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper, Mascot } from '@/components/ui';
import { useAcademic, StudentExtraDetails } from '@/context/AcademicContext';
import { useAuth } from '@/context/AuthContext';

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
  const { user } = useAuth();
  const {
    submitJoinRequest,
    studentJoinStatus,
    activeJoinRequest,
    simulateTeacherApproval,
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
    setSelectedWeakSubjects(prev =>
      prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]
    );
  };

  // Determine matched target for preview
  const getMatchedTarget = () => {
    const trimmed = teacherCode.trim().toUpperCase();
    if (trimmed === teacherProfile.teacherCode.toUpperCase()) {
      return {
        name: teacherProfile.fullName,
        type: 'Individual Solo Teacher',
        detail: `${teacherProfile.qualification} • ${teacherProfile.specializationSubjects.join(', ')}`,
        rate: `₹${teacherProfile.monthlyFeeRate}/mo`,
        isMatch: true,
      };
    }
    if (trimmed === coachingProfile.inviteCode.toUpperCase()) {
      return {
        name: coachingProfile.name,
        type: 'Coaching Institute',
        detail: `${coachingProfile.city} • ${coachingProfile.subjectsOffered.join(', ')}`,
        rate: 'Comprehensive Batch',
        isMatch: true,
      };
    }
    if (trimmed.length > 3) {
      return {
        name: `Educator (${trimmed})`,
        type: 'Verified Teacher',
        detail: 'Physics & Mathematics Classroom',
        rate: 'Standard Plan',
        isMatch: true,
      };
    }
    return null;
  };

  const matchedTarget = getMatchedTarget();

  // Submit Handler
  const handleSubmit = async () => {
    if (!fullName.trim()) {
      Alert.alert('Required', 'Please enter your Full Name.');
      return;
    }
    if (!teacherCode.trim()) {
      Alert.alert('Required', 'Please enter your Teacher or Coaching Code.');
      return;
    }
    if (!guardianPhone.trim()) {
      Alert.alert('Required', 'Please provide a Guardian Contact Number.');
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
      Alert.alert('Request Submitted! 🌸', `Sent to ${res.targetName} for verification.`);
    } else {
      Alert.alert('Error', res.error || 'Could not submit join request.');
    }
  };

  // Instant Demo Simulation
  const handleSimulateApproval = async () => {
    await simulateTeacherApproval();
    Alert.alert(
      'Teacher Approved! 🎉',
      'Prof. Vikram Joshi has approved your admission into Class 12 • JEE Advanced (Morning). Welcome aboard!',
      [
        {
          text: 'Open Student Hub →',
          onPress: () => router.replace('/student'),
        },
      ]
    );
  };

  return (
    <ScreenWrapper
      headerProps={{
        title: 'Join Coaching or Teacher 🌸',
        onBackPress: () => router.back(),
      }}
    >
      {step === 'waiting' ? (
        /* ================= WAITING FOR APPROVAL SCREEN ================= */
        <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-12">
          <View className="bg-white border-2 border-cute-border rounded-[32px] p-6 items-center shadow-xs">
            <Mascot mood="curious" size="lg" />

            <View className="bg-amber-50 border border-amber-200 px-3 py-1 rounded-full mt-3">
              <Text className="text-[11px] font-extrabold text-amber-800">
                ⏳ Verification Pending
              </Text>
            </View>

            <Text className="text-xl font-black text-cute-cocoa mt-3 text-center">
              Request Sent to Teacher! 🌸
            </Text>
            <Text className="text-xs text-cute-muted text-center mt-1.5 leading-relaxed px-2">
              Your profile has been submitted to{' '}
              <Text className="font-extrabold text-cute-peach">
                {activeJoinRequest?.matchedTargetName || teacherProfile.fullName}
              </Text>{' '}
              under code{' '}
              <Text className="font-extrabold text-cute-cocoa">
                {activeJoinRequest?.codeUsed || teacherCode.toUpperCase()}
              </Text>
              .
            </Text>

            {/* Profile Summary Card */}
            <View className="bg-cute-cream rounded-2xl p-4 border border-cute-border my-4 w-full">
              <Text className="text-[10px] font-black text-cute-muted uppercase tracking-wider mb-2">
                Submitted Student Profile
              </Text>
              <View className="gap-1.5">
                <View className="flex-row justify-between">
                  <Text className="text-xs text-cute-muted">Student:</Text>
                  <Text className="text-xs font-bold text-cute-cocoa">
                    {activeJoinRequest?.studentDetails.fullName || fullName}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-cute-muted">Target Exam:</Text>
                  <Text className="text-xs font-bold text-cute-cocoa">
                    {activeJoinRequest?.studentDetails.targetExam || targetExam}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-cute-muted">School & Board:</Text>
                  <Text className="text-xs font-bold text-cute-cocoa">
                    {activeJoinRequest?.studentDetails.board || board} •{' '}
                    {activeJoinRequest?.studentDetails.grade || grade}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-cute-muted">Guardian Phone:</Text>
                  <Text className="text-xs font-bold text-cute-cocoa">
                    {activeJoinRequest?.studentDetails.guardianPhone || guardianPhone}
                  </Text>
                </View>
              </View>

              {/* Weak Subject Tags */}
              <View className="mt-2.5 pt-2.5 border-t border-cute-border">
                <Text className="text-[10px] font-bold text-cute-muted mb-1.5">
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

            {/* Instant Demo Simulation Button */}
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleSimulateApproval}
              className="w-full bg-emerald-500 py-3.5 rounded-2xl items-center shadow-xs flex-row justify-center gap-2 mb-2.5 active:scale-98"
            >
              <Sparkles size={16} color="#ffffff" />
              <Text className="text-xs font-black text-white tracking-wide">
                ⚡ Simulate Teacher Approval (Instant Demo)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => router.push('/verify-students')}
              className="w-full bg-cute-peach-light border border-cute-peach py-2.5 rounded-2xl items-center mb-2.5 active:scale-98"
            >
              <Text className="text-xs font-bold text-cute-peach">
                Open Teacher Verification Desk 🍎
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setStep('form')}
              className="py-2"
            >
              <Text className="text-xs font-bold text-cute-muted underline">
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
          <View className="bg-white border-2 border-cute-border rounded-3xl p-5 shadow-xs">
            <View className="flex-row items-center gap-2.5 mb-2">
              <View className="w-10 h-10 rounded-2xl bg-cute-peach-light border border-cute-peach items-center justify-center">
                <QrCode size={18} color="#ff7d6b" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-black text-cute-cocoa">
                  Enter Teacher / Coaching Code
                </Text>
                <Text className="text-xs text-cute-muted">
                  Share code provided by your teacher
                </Text>
              </View>
            </View>

            <TextInput
              placeholder="e.g. JOSHI-MATH-89 or APEX2026"
              placeholderTextColor="#a89993"
              autoCapitalize="characters"
              value={teacherCode}
              onChangeText={setTeacherCode}
              className="bg-cute-cream border border-cute-border rounded-2xl px-4 py-2.5 text-sm font-black text-cute-cocoa tracking-wider mt-2 uppercase"
            />

            {/* Live Matched Teacher Preview Card */}
            {matchedTarget && (
              <View className="bg-cute-peach-light border border-cute-peach rounded-2xl p-3.5 mt-3">
                <View className="flex-row items-center justify-between mb-1">
                  <View className="flex-row items-center gap-1.5">
                    <CheckCircle2 size={14} color="#ff7d6b" />
                    <Text className="text-xs font-black text-cute-cocoa">
                      {matchedTarget.name}
                    </Text>
                  </View>
                  <View className="bg-white/90 px-2 py-0.5 rounded-md border border-cute-peach/30">
                    <Text className="text-[10px] font-bold text-cute-peach">
                      {matchedTarget.type}
                    </Text>
                  </View>
                </View>
                <Text className="text-[11px] text-cute-cocoa/80 leading-snug">
                  {matchedTarget.detail}
                </Text>
                <Text className="text-[10px] font-bold text-cute-peach mt-1">
                  Fee: {matchedTarget.rate}
                </Text>
              </View>
            )}
          </View>

          {/* 2. Student Academic Details */}
          <View className="bg-white border-2 border-cute-border rounded-3xl p-5 shadow-xs gap-3">
            <View className="flex-row items-center gap-2 mb-1">
              <GraduationCap size={16} color="#ff7d6b" />
              <Text className="text-sm font-black text-cute-cocoa">
                Student Academic Profile
              </Text>
            </View>

            <View>
              <Text className="text-xs font-bold text-cute-cocoa mb-1">Student Full Name</Text>
              <TextInput
                placeholder="e.g. Amelia Sharma"
                placeholderTextColor="#a89993"
                value={fullName}
                onChangeText={setFullName}
                className="bg-cute-cream border border-cute-border rounded-2xl px-3.5 py-2 text-xs text-cute-cocoa"
              />
            </View>

            <View>
              <Text className="text-xs font-bold text-cute-cocoa mb-1.5">Class / Grade</Text>
              <View className="flex-row flex-wrap gap-1.5">
                {GRADE_OPTIONS.map(g => (
                  <TouchableOpacity
                    key={g}
                    onPress={() => setGrade(g)}
                    className={`px-3 py-1.5 rounded-xl border ${
                      grade === g
                        ? 'bg-cute-peach border-cute-peach'
                        : 'bg-cute-cream border-cute-border'
                    }`}
                  >
                    <Text
                      className={`text-[11px] font-bold ${
                        grade === g ? 'text-white' : 'text-cute-cocoa'
                      }`}
                    >
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View>
              <Text className="text-xs font-bold text-cute-cocoa mb-1.5">Board of Education</Text>
              <View className="flex-row flex-wrap gap-1.5">
                {BOARD_OPTIONS.map(b => (
                  <TouchableOpacity
                    key={b}
                    onPress={() => setBoard(b)}
                    className={`px-3 py-1.5 rounded-xl border ${
                      board === b
                        ? 'bg-cute-peach border-cute-peach'
                        : 'bg-cute-cream border-cute-border'
                    }`}
                  >
                    <Text
                      className={`text-[11px] font-bold ${
                        board === b ? 'text-white' : 'text-cute-cocoa'
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
                <Text className="text-xs font-bold text-cute-cocoa mb-1">Target Exam</Text>
                <TextInput
                  placeholder="e.g. IIT-JEE 2026"
                  placeholderTextColor="#a89993"
                  value={targetExam}
                  onChangeText={setTargetExam}
                  className="bg-cute-cream border border-cute-border rounded-2xl px-3.5 py-2 text-xs text-cute-cocoa"
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-cute-cocoa mb-1">Class 10 %</Text>
                <TextInput
                  placeholder="e.g. 96.2%"
                  placeholderTextColor="#a89993"
                  value={previousScore}
                  onChangeText={setPreviousScore}
                  className="bg-cute-cream border border-cute-border rounded-2xl px-3.5 py-2 text-xs text-cute-cocoa"
                />
              </View>
            </View>

            <View>
              <Text className="text-xs font-bold text-cute-cocoa mb-1">Current School Name</Text>
              <TextInput
                placeholder="e.g. Delhi Public School (R.K. Puram)"
                placeholderTextColor="#a89993"
                value={school}
                onChangeText={setSchool}
                className="bg-cute-cream border border-cute-border rounded-2xl px-3.5 py-2 text-xs text-cute-cocoa"
              />
            </View>

            {/* Weak Subjects Multi-Select */}
            <View className="mt-1">
              <Text className="text-xs font-bold text-cute-cocoa mb-1.5">
                Focus Areas / Weak Subjects (Select chips)
              </Text>
              <View className="flex-row flex-wrap gap-1.5">
                {WEAK_SUBJECT_OPTIONS.map(sub => {
                  const isSelected = selectedWeakSubjects.includes(sub);
                  return (
                    <TouchableOpacity
                      key={sub}
                      onPress={() => toggleWeakSubject(sub)}
                      className={`px-2.5 py-1.5 rounded-xl border ${
                        isSelected
                          ? 'bg-rose-100 border-rose-300'
                          : 'bg-cute-cream border-cute-border'
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-bold ${
                          isSelected ? 'text-rose-800' : 'text-cute-muted'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {sub}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* 3. Guardian & Emergency Contact */}
          <View className="bg-white border-2 border-cute-border rounded-3xl p-5 shadow-xs gap-3">
            <View className="flex-row items-center gap-2 mb-1">
              <Phone size={16} color="#ff7d6b" />
              <Text className="text-sm font-black text-cute-cocoa">
                Guardian Contact & Bio
              </Text>
            </View>

            <View>
              <Text className="text-xs font-bold text-cute-cocoa mb-1">Guardian Full Name</Text>
              <TextInput
                placeholder="e.g. Sunita Sharma"
                placeholderTextColor="#a89993"
                value={guardianName}
                onChangeText={setGuardianName}
                className="bg-cute-cream border border-cute-border rounded-2xl px-3.5 py-2 text-xs text-cute-cocoa"
              />
            </View>

            <View className="flex-row gap-2">
              <View className="flex-1">
                <Text className="text-xs font-bold text-cute-cocoa mb-1">Guardian Phone (UPI/SMS)</Text>
                <TextInput
                  placeholder="+91 98230 44551"
                  placeholderTextColor="#a89993"
                  keyboardType="phone-pad"
                  value={guardianPhone}
                  onChangeText={setGuardianPhone}
                  className="bg-cute-cream border border-cute-border rounded-2xl px-3.5 py-2 text-xs text-cute-cocoa"
                />
              </View>
              <View className="w-24">
                <Text className="text-xs font-bold text-cute-cocoa mb-1">Blood Grp</Text>
                <TextInput
                  placeholder="e.g. B+"
                  placeholderTextColor="#a89993"
                  value={bloodGroup}
                  onChangeText={setBloodGroup}
                  className="bg-cute-cream border border-cute-border rounded-2xl px-3.5 py-2 text-xs text-cute-cocoa"
                />
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleSubmit}
            className="w-full bg-cute-peach py-3.5 rounded-2xl items-center shadow-xs flex-row justify-center gap-2 active:scale-98"
          >
            <Text className="text-xs font-black text-white tracking-wide">
              Send Join Request to Teacher 🌸
            </Text>
            <ArrowRight size={14} color="#ffffff" />
          </TouchableOpacity>
        </ScrollView>
      )}
    </ScreenWrapper>
  );
}
