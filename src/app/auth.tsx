import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Building,
  GraduationCap,
  Users,
  Home,
  UserCheck,
  Briefcase,
  BookOpen,
  Award,
  Hash,
  MapPin,
  Phone,
  DollarSign,
  KeyRound,
  X,
  Layers,
} from 'lucide-react-native';

import { useAuth } from '@/context/AuthContext';
import { useInstitute } from '@/context/InstituteContext';
import { useAcademic } from '@/context/AcademicContext';
import { useChild } from '@/context/ChildContext';
import { Mascot } from '@/components/ui/Mascot';
import { UserRole } from '@/types/database';

export default function CleanAuthScreen() {
  const router = useRouter();
  const { signIn, signInWithGoogle, signUp, switchRole, loading } = useAuth();
  const { currentInstitute } = useInstitute();
  const {
    teacherProfile,
    setTeacherProfile,
    coachingProfile,
    setCoachingProfile,
    setTeacherMode,
    linkToCoachingCenter,
  } = useAcademic();
  const { addChildByCodeOrPhone } = useChild();

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');

  // Common credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Forgot password modal state
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  // Teacher Dual Mode during signup
  const [teacherOption, setTeacherOption] = useState<'solo' | 'coaching_faculty'>('solo');
  const [facultyCoachingCode, setFacultyCoachingCode] = useState('BLOOM2026');
  const [teacherQualification, setTeacherQualification] = useState('M.Sc Physics (IIT Bombay)');
  const [teacherSubjects, setTeacherSubjects] = useState('Physics, Mechanics, Calculus');
  const [teacherExperience, setTeacherExperience] = useState('10');
  const [teacherBio, setTeacherBio] = useState('Passionate about conceptual problem solving & derivations.');
  const [teacherFeeRate, setTeacherFeeRate] = useState('3500');

  // Coaching Center / Admin specific fields
  const [instituteName, setInstituteName] = useState('Bloom Science Academy');
  const [instituteCity, setInstituteCity] = useState('Pune');
  const [instituteSubjects, setInstituteSubjects] = useState('Physics, Chemistry, Maths, Biology');
  const [directorPhone, setDirectorPhone] = useState('+91 98230 11223');

  // Student specific extended fields
  const [studentGrade, setStudentGrade] = useState('Class 11 Science');
  const [studentBoard, setStudentBoard] = useState('CBSE');
  const [studentTargetExam, setStudentTargetExam] = useState('IIT-JEE 2026');
  const [studentSchool, setStudentSchool] = useState('Delhi Public School (R.K. Puram)');
  const [studentPreviousPct, setStudentPreviousPct] = useState('96.2%');
  const [studentWeakTopics, setStudentWeakTopics] = useState('Rotational Dynamics, Wave Optics');
  const [studentGuardianPhone, setStudentGuardianPhone] = useState('+91 98230 44551');

  // Parent specific link code or phone
  const [parentChildCode, setParentChildCode] = useState('STU-AMELIA-902');

  // Direct role screen navigation
  const navigateToRoleScreen = (role: UserRole) => {
    switch (role) {
      case 'student':
        router.replace('/student');
        break;
      case 'teacher':
        router.replace('/teacher');
        break;
      case 'parent':
        router.replace('/parent');
        break;
      case 'admin':
        router.replace('/admin');
        break;
    }
  };

  // Google OAuth Login
  const handleGoogleAuth = async () => {
    const res = await signInWithGoogle(selectedRole);
    if (res.success) {
      navigateToRoleScreen(selectedRole);
    } else {
      Alert.alert('Google Sign-In', res.error || 'Could not authenticate with Google.');
    }
  };

  // 1-Click Demo Login (clearly separated at bottom)
  const handleQuickDemo = async (role: UserRole) => {
    setSelectedRole(role);
    await switchRole(role);
    navigateToRoleScreen(role);
  };

  // Submission handler for both Sign In and Sign Up
  const handleSubmit = async () => {
    // 1. Sign In Flow
    if (authMode === 'signin') {
      if (!email.trim()) {
        Alert.alert('Validation Error', 'Please enter your registered email or phone.');
        return;
      }
      if (!password.trim()) {
        Alert.alert('Validation Error', 'Please enter your password.');
        return;
      }

      const res = await signIn(email, selectedRole);
      if (res.success) {
        navigateToRoleScreen(selectedRole);
      } else {
        Alert.alert('Sign In Failed', res.error || 'Invalid credentials. Try our quick demo below!');
      }
      return;
    }

    // 2. Sign Up Flow
    if (!fullName.trim()) {
      Alert.alert('Validation Error', 'Please enter your full name.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Validation Error', 'Please enter a valid email address.');
      return;
    }

    if (!password.trim() || password.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters.');
      return;
    }

    // Teacher Sign Up (Solo Tutor vs Coaching Faculty)
    if (selectedRole === 'teacher') {
      if (teacherOption === 'solo') {
        const nameParts = fullName.trim().split(' ').filter(Boolean);
        const lastName = (nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0])
          .toUpperCase()
          .replace(/[^A-Z]/g, '') || 'TUTOR';
        const subjectPart = (teacherSubjects.split(',')[0].trim().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4)) || 'MATH';
        const generatedCode = `${lastName}-${subjectPart}-26`;
        setTeacherProfile({
          fullName,
          qualification: teacherQualification,
          specializationSubjects: teacherSubjects.split(',').map((s) => s.trim()),
          experienceYears: parseFloat(teacherExperience) || 5,
          bio: teacherBio,
          achievements: 'State & National Olympiad Mentorship',
          monthlyFeeRate: parseInt(teacherFeeRate, 10) || 3000,
          teacherCode: generatedCode,
        });
        setTeacherMode('solo');

        await signUp(fullName, email, 'teacher');
        Alert.alert(
          'Solo Teacher Account Ready! 🍎',
          `Your shareable Teacher Code is: ${generatedCode}\nStudents can join your batches directly with this code.`,
          [{ text: 'Open Teacher Desk', onPress: () => navigateToRoleScreen('teacher') }]
        );
      } else {
        // Faculty joining an institute
        setTeacherMode('coaching_faculty');
        await linkToCoachingCenter(facultyCoachingCode);
        await signUp(fullName, email, 'teacher');
        Alert.alert(
          'Coaching Faculty Account Connected! 🏫',
          `Linked to Institute Code: ${facultyCoachingCode.toUpperCase()}`,
          [{ text: 'Open Faculty Desk', onPress: () => navigateToRoleScreen('teacher') }]
        );
      }
      return;
    }

    // Coaching Center / Admin Sign Up
    if (selectedRole === 'admin') {
      const generatedInvite = `${instituteName.substring(0, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      setCoachingProfile({
        name: instituteName,
        city: instituteCity,
        subjectsOffered: instituteSubjects.split(',').map((s) => s.trim()),
        directorName: fullName,
        phone: directorPhone,
        inviteCode: generatedInvite,
      });

      await signUp(fullName, email, 'admin');
      Alert.alert(
        'Coaching Academy Created! 🏫',
        `Your Institute Invite Code is: ${generatedInvite}\nTeachers & Students can join under this code.`,
        [{ text: 'Open Admin Command', onPress: () => navigateToRoleScreen('admin') }]
      );
      return;
    }

    // Student Sign Up
    if (selectedRole === 'student') {
      const res = await signUp(fullName, email, 'student');
      if (res.success) {
        Alert.alert(
          'Student Account Created! 🌸',
          'Now enter your Teacher Code or Coaching Code to connect with your classes.',
          [{ text: 'Connect Teacher Code', onPress: () => router.push('/join-institute') }]
        );
      }
      return;
    }

    // Parent Sign Up
    if (selectedRole === 'parent') {
      const res = await signUp(fullName, email, 'parent');
      if (res.success) {
        if (parentChildCode.trim()) {
          await addChildByCodeOrPhone(parentChildCode);
        }
        Alert.alert('Parent Account Ready! 🏡', `Welcome, ${fullName}! Your child profile is linked.`);
        navigateToRoleScreen('parent');
      }
    }
  };

  const handleForgotPasswordSubmit = () => {
    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      Alert.alert('Validation Error', 'Please enter a valid email address.');
      return;
    }
    setIsForgotPasswordOpen(false);
    Alert.alert(
      'Reset Link Dispatched 📬',
      `A password reset link has been simulated to: ${forgotEmail}. You can also use password "Password123!" for demo accounts.`
    );
  };

  const roleOptions: {
    id: UserRole;
    title: string;
    subtitle: string;
    emoji: string;
    badge: string;
    bgColor: string;
    borderColor: string;
  }[] = [
    {
      id: 'student',
      title: 'Student 🌸',
      subtitle: 'Watch lectures, solve DPPs & access PDF notes',
      emoji: '🌱',
      badge: 'Learner',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-300',
    },
    {
      id: 'teacher',
      title: 'Tuition Teacher 🍎',
      subtitle: 'Solo Tutor or Institute Faculty',
      emoji: '👨‍🏫',
      badge: 'Educator',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-300',
    },
    {
      id: 'admin',
      title: 'Coaching Center / Academy 🏫',
      subtitle: 'Multi-teacher institute, branches, staff & admissions',
      emoji: '🏫',
      badge: 'Director',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-300',
    },
    {
      id: 'parent',
      title: 'Parent / Guardian 🏡',
      subtitle: 'Monitor attendance, report cards & pay fees via UPI',
      emoji: '🏡',
      badge: 'Family',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-300',
    },
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-cute-cream"
    >
      <ScrollView
        contentContainerClassName="p-5 pt-12 pb-24"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 1. Header with Mascot Pip */}
        <View className="items-center mb-5">
          <Mascot
            mood={authMode === 'signin' ? 'happy' : 'studying'}
            size="lg"
            showSpeechBubble
            speechText={
              authMode === 'signin'
                ? `Welcome back to ${currentInstitute?.name || 'Acadly'}! 🌸`
                : "Let's create your happy study account! 🚀"
            }
          />
          <Text className="text-3xl font-black text-cute-cocoa tracking-tight mt-3 text-center">
            Acadly
          </Text>
          <Text className="text-xs font-bold text-cute-muted text-center mt-1">
            Tuition & Coaching Made Beautiful 🌸
          </Text>
        </View>

        {/* 2. Top Segmented Mode Toggle: Sign In vs Create Account */}
        <View className="flex-row bg-white p-1.5 rounded-2xl border-2 border-cute-border mb-5 shadow-xs">
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setAuthMode('signin')}
            className={`flex-1 py-3 rounded-xl items-center flex-row justify-center gap-1.5 ${
              authMode === 'signin' ? 'bg-cute-peach shadow-xs' : 'bg-transparent'
            }`}
          >
            <Text
              className={`text-xs font-extrabold ${
                authMode === 'signin' ? 'text-white' : 'text-cute-muted'
              }`}
            >
              Sign In
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setAuthMode('signup')}
            className={`flex-1 py-3 rounded-xl items-center flex-row justify-center gap-1.5 ${
              authMode === 'signup' ? 'bg-cute-peach shadow-xs' : 'bg-transparent'
            }`}
          >
            <Text
              className={`text-xs font-extrabold ${
                authMode === 'signup' ? 'text-white' : 'text-cute-muted'
              }`}
            >
              Create Account
            </Text>
          </TouchableOpacity>
        </View>

        {/* ======================================================== */}
        {/* VIEW A: CLEAN SIGN IN PAGE (DEFAULT ON LAUNCH)           */}
        {/* ======================================================== */}
        {authMode === 'signin' ? (
          <View className="bg-white border-2 border-cute-border rounded-3xl p-5 mb-5 shadow-xs">
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-base font-black text-cute-cocoa">Welcome Back!</Text>
                <Text className="text-xs text-cute-muted">Sign in to your learning dashboard</Text>
              </View>
              <View className="bg-cute-peach-light px-2.5 py-1 rounded-full border border-cute-peach">
                <Text className="text-[10px] font-bold text-cute-peach uppercase">Secure Login</Text>
              </View>
            </View>

            {/* Role Switcher Pill Bar for Sign In */}
            <Text className="text-[11px] font-black text-cute-muted uppercase tracking-wider mb-2">
              Sign In As:
            </Text>
            <View className="flex-row gap-1.5 mb-4">
              {[
                { role: 'student', label: '🌸 Student' },
                { role: 'teacher', label: '🍎 Teacher' },
                { role: 'admin', label: '🏫 Admin' },
                { role: 'parent', label: '🏡 Parent' },
              ].map((item) => {
                const isSelected = selectedRole === item.role;
                return (
                  <TouchableOpacity
                    key={item.role}
                    onPress={() => setSelectedRole(item.role as UserRole)}
                    className={`flex-1 py-2 rounded-xl items-center border ${
                      isSelected
                        ? 'bg-cute-peach border-cute-peach shadow-xs'
                        : 'bg-cute-cream border-cute-border'
                    }`}
                  >
                    <Text
                      className={`text-[10px] font-black ${
                        isSelected ? 'text-white' : 'text-cute-cocoa'
                      }`}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Email / Username Input */}
            <View className="mb-3">
              <Text className="text-xs font-bold text-cute-cocoa mb-1">Email Address or Phone</Text>
              <TextInput
                placeholder="e.g. amelia@student.in or +91 98230..."
                placeholderTextColor="#a89993"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                className="bg-cute-cream border border-cute-border rounded-2xl px-4 py-3 text-xs text-cute-cocoa font-medium"
              />
            </View>

            {/* Password Input */}
            <View className="mb-2">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-xs font-bold text-cute-cocoa">Password</Text>
                <TouchableOpacity onPress={() => setIsForgotPasswordOpen(true)}>
                  <Text className="text-xs font-bold text-cute-peach">Forgot Password?</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                placeholder="••••••••"
                placeholderTextColor="#a89993"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                className="bg-cute-cream border border-cute-border rounded-2xl px-4 py-3 text-xs text-cute-cocoa font-medium"
              />
            </View>

            {/* Google OAuth Button */}
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleGoogleAuth}
              className="w-full bg-white border border-cute-border py-2.5 rounded-2xl flex-row items-center justify-center gap-2 mt-2 mb-3 active:scale-98"
            >
              <Text className="text-sm">🌐</Text>
              <Text className="text-xs font-bold text-cute-cocoa">Continue with Google</Text>
            </TouchableOpacity>

            {/* Primary Sign In Button */}
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleSubmit}
              disabled={loading}
              className="bg-cute-peach py-3.5 rounded-2xl items-center shadow-xs active:scale-98"
            >
              <Text className="text-xs font-extrabold text-white tracking-wide">
                {loading ? 'Authenticating...' : `Sign In as ${selectedRole.toUpperCase()} →`}
              </Text>
            </TouchableOpacity>

            {/* Bottom Toggle Link */}
            <View className="mt-4 pt-3 border-t border-cute-border items-center">
              <TouchableOpacity onPress={() => setAuthMode('signup')}>
                <Text className="text-xs text-cute-muted">
                  Don't have an account?{' '}
                  <Text className="font-extrabold text-cute-peach">Create an Account</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* ======================================================== */
          /* VIEW B: CLEAN SIGN UP FLOW                               */
          /* ======================================================== */
          <View className="gap-5">
            {/* Step 1: Select Your Role */}
            <View>
              <View className="flex-row items-center justify-between mb-2.5 px-1">
                <Text className="text-xs font-black text-cute-cocoa uppercase tracking-wider">
                  Step 1: Choose Account Role
                </Text>
                <View className="bg-cute-peach-light px-2.5 py-0.5 rounded-full border border-cute-peach">
                  <Text className="text-[10px] font-bold text-cute-peach">Select One</Text>
                </View>
              </View>

              <View className="gap-2.5">
                {roleOptions.map((role) => {
                  const isSelected = selectedRole === role.id;
                  return (
                    <TouchableOpacity
                      key={role.id}
                      activeOpacity={0.88}
                      onPress={() => setSelectedRole(role.id)}
                      className={`p-3.5 rounded-2xl border-2 flex-row items-center justify-between shadow-xs ${
                        isSelected
                          ? `${role.bgColor} ${role.borderColor} scale-[1.01]`
                          : 'bg-white border-cute-border'
                      }`}
                    >
                      <View className="flex-row items-center gap-3 flex-1 pr-2">
                        <View className="w-11 h-11 rounded-2xl bg-white border border-black/10 items-center justify-center shadow-xs">
                          <Text className="text-2xl">{role.emoji}</Text>
                        </View>
                        <View className="flex-1">
                          <View className="flex-row items-center gap-1.5">
                            <Text className="text-sm font-extrabold text-cute-cocoa">
                              {role.title}
                            </Text>
                            <View className="bg-white/80 px-1.5 py-0.5 rounded-md border border-black/5">
                              <Text className="text-[9px] font-bold text-cute-muted uppercase">
                                {role.badge}
                              </Text>
                            </View>
                          </View>
                          <Text className="text-xs text-cute-muted mt-0.5" numberOfLines={1}>
                            {role.subtitle}
                          </Text>
                        </View>
                      </View>

                      <View
                        className={`w-5 h-5 rounded-full items-center justify-center border ${
                          isSelected ? 'bg-cute-peach border-cute-peach' : 'bg-white border-cute-border'
                        }`}
                      >
                        {isSelected && <View className="w-2 h-2 rounded-full bg-white" />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Step 2: Role-Specific Details & Credentials */}
            <View className="bg-white border-2 border-cute-border rounded-3xl p-5 shadow-xs">
              <Text className="text-xs font-black text-cute-cocoa uppercase tracking-wider mb-3">
                Step 2: Account & Role Details
              </Text>

              {/* Common Credentials */}
              <View className="gap-3 mb-3">
                <View>
                  <Text className="text-xs font-bold text-cute-cocoa mb-1">Full Name</Text>
                  <TextInput
                    placeholder="e.g. Amelia Sharma or Prof. Vikram Joshi"
                    placeholderTextColor="#a89993"
                    value={fullName}
                    onChangeText={setFullName}
                    className="bg-cute-cream border border-cute-border rounded-2xl px-4 py-2.5 text-xs text-cute-cocoa font-medium"
                  />
                </View>

                <View>
                  <Text className="text-xs font-bold text-cute-cocoa mb-1">Email Address</Text>
                  <TextInput
                    placeholder="name@example.com"
                    placeholderTextColor="#a89993"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    className="bg-cute-cream border border-cute-border rounded-2xl px-4 py-2.5 text-xs text-cute-cocoa font-medium"
                  />
                </View>

                <View>
                  <Text className="text-xs font-bold text-cute-cocoa mb-1">Password</Text>
                  <TextInput
                    placeholder="At least 6 characters"
                    placeholderTextColor="#a89993"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    className="bg-cute-cream border border-cute-border rounded-2xl px-4 py-2.5 text-xs text-cute-cocoa font-medium"
                  />
                </View>
              </View>

              {/* TEACHER DUAL MODE OPTIONS */}
              {selectedRole === 'teacher' && (
                <View className="gap-3 bg-rose-50/60 p-3.5 rounded-2xl border border-rose-200 mb-3">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-1.5">
                      <Briefcase size={14} color="#e11d48" />
                      <Text className="text-xs font-black text-rose-900">Teaching Mode</Text>
                    </View>
                    <View className="bg-white px-2 py-0.5 rounded-full border border-rose-200">
                      <Text className="text-[10px] font-bold text-rose-600">Dual Track</Text>
                    </View>
                  </View>

                  {/* Dual Mode Switcher */}
                  <View className="flex-row bg-white p-1 rounded-xl border border-rose-200">
                    <TouchableOpacity
                      onPress={() => setTeacherOption('solo')}
                      className={`flex-1 py-1.5 rounded-lg items-center ${
                        teacherOption === 'solo' ? 'bg-rose-500' : ''
                      }`}
                    >
                      <Text
                        className={`text-[11px] font-bold ${
                          teacherOption === 'solo' ? 'text-white' : 'text-cute-cocoa'
                        }`}
                      >
                        🍎 Solo Tuition Tutor
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setTeacherOption('coaching_faculty')}
                      className={`flex-1 py-1.5 rounded-lg items-center ${
                        teacherOption === 'coaching_faculty' ? 'bg-rose-500' : ''
                      }`}
                    >
                      <Text
                        className={`text-[11px] font-bold ${
                          teacherOption === 'coaching_faculty' ? 'text-white' : 'text-cute-cocoa'
                        }`}
                      >
                        🏫 Institute Faculty
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {teacherOption === 'solo' ? (
                    <View className="gap-2.5">
                      <View>
                        <Text className="text-[11px] font-bold text-cute-cocoa mb-1">
                          Academic Qualification
                        </Text>
                        <TextInput
                          placeholder="e.g. M.Sc Physics (IIT Bombay)"
                          placeholderTextColor="#a89993"
                          value={teacherQualification}
                          onChangeText={setTeacherQualification}
                          className="bg-white border border-rose-200 rounded-xl px-3 py-2 text-xs text-cute-cocoa"
                        />
                      </View>
                      <View className="flex-row gap-2">
                        <View className="flex-1">
                          <Text className="text-[11px] font-bold text-cute-cocoa mb-1">
                            Experience (Yrs)
                          </Text>
                          <TextInput
                            placeholder="e.g. 8"
                            placeholderTextColor="#a89993"
                            keyboardType="numeric"
                            value={teacherExperience}
                            onChangeText={setTeacherExperience}
                            className="bg-white border border-rose-200 rounded-xl px-3 py-2 text-xs text-cute-cocoa"
                          />
                        </View>
                        <View className="flex-1">
                          <Text className="text-[11px] font-bold text-cute-cocoa mb-1">
                            Fee (₹/mo)
                          </Text>
                          <TextInput
                            placeholder="e.g. 3500"
                            placeholderTextColor="#a89993"
                            keyboardType="numeric"
                            value={teacherFeeRate}
                            onChangeText={setTeacherFeeRate}
                            className="bg-white border border-rose-200 rounded-xl px-3 py-2 text-xs text-cute-cocoa"
                          />
                        </View>
                      </View>
                      <View className="bg-rose-100/70 p-2 rounded-xl flex-row items-center gap-1.5">
                        <Hash size={13} color="#e11d48" />
                        <Text className="text-[10px] font-bold text-rose-900 flex-1">
                          A personal Teacher Code will be auto-generated for your students to join.
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View className="gap-2">
                      <Text className="text-[11px] font-bold text-cute-cocoa mb-1">
                        Coaching Center Invite Code
                      </Text>
                      <TextInput
                        placeholder="e.g. BLOOM2026 or APEX-KOTA"
                        placeholderTextColor="#a89993"
                        autoCapitalize="characters"
                        value={facultyCoachingCode}
                        onChangeText={setFacultyCoachingCode}
                        className="bg-white border border-rose-200 rounded-xl px-3 py-2 text-xs text-cute-cocoa font-bold"
                      />
                      <Text className="text-[10px] text-rose-700">
                        Enter the invite code given by your Coaching Director.
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* COACHING CENTER / ADMIN REGISTRATION DETAILS */}
              {selectedRole === 'admin' && (
                <View className="gap-3 bg-indigo-50/50 p-3.5 rounded-2xl border border-indigo-200 mb-3">
                  <View className="flex-row items-center gap-1.5 mb-0.5">
                    <Building size={14} color="#4f46e5" />
                    <Text className="text-xs font-black text-indigo-900">Coaching Academy Details</Text>
                  </View>
                  <View>
                    <Text className="text-[11px] font-bold text-cute-cocoa mb-1">Institute Name</Text>
                    <TextInput
                      placeholder="e.g. Bloom Science Academy"
                      placeholderTextColor="#a89993"
                      value={instituteName}
                      onChangeText={setInstituteName}
                      className="bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs text-cute-cocoa"
                    />
                  </View>
                  <View className="flex-row gap-2">
                    <View className="flex-1">
                      <Text className="text-[11px] font-bold text-cute-cocoa mb-1">City / Branch</Text>
                      <TextInput
                        placeholder="e.g. Pune, Kothrud"
                        placeholderTextColor="#a89993"
                        value={instituteCity}
                        onChangeText={setInstituteCity}
                        className="bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs text-cute-cocoa"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[11px] font-bold text-cute-cocoa mb-1">Director Phone</Text>
                      <TextInput
                        placeholder="+91 98230 11223"
                        placeholderTextColor="#a89993"
                        value={directorPhone}
                        onChangeText={setDirectorPhone}
                        className="bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs text-cute-cocoa"
                      />
                    </View>
                  </View>
                </View>
              )}

              {/* STUDENT EXTENDED DETAILS */}
              {selectedRole === 'student' && (
                <View className="gap-3 bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-200 mb-3">
                  <View className="flex-row items-center gap-1.5 mb-0.5">
                    <GraduationCap size={14} color="#059669" />
                    <Text className="text-xs font-black text-emerald-900">Student Academic Profile</Text>
                  </View>
                  <View className="flex-row gap-2">
                    <View className="flex-1">
                      <Text className="text-[11px] font-bold text-cute-cocoa mb-1">Grade / Class</Text>
                      <TextInput
                        placeholder="Class 11 Science"
                        placeholderTextColor="#a89993"
                        value={studentGrade}
                        onChangeText={setStudentGrade}
                        className="bg-white border border-emerald-200 rounded-xl px-3 py-2 text-xs text-cute-cocoa"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[11px] font-bold text-cute-cocoa mb-1">Target Exam</Text>
                      <TextInput
                        placeholder="IIT-JEE 2026"
                        placeholderTextColor="#a89993"
                        value={studentTargetExam}
                        onChangeText={setStudentTargetExam}
                        className="bg-white border border-emerald-200 rounded-xl px-3 py-2 text-xs text-cute-cocoa"
                      />
                    </View>
                  </View>
                  <View>
                    <Text className="text-[11px] font-bold text-cute-cocoa mb-1">Current School</Text>
                    <TextInput
                      placeholder="e.g. Delhi Public School"
                      placeholderTextColor="#a89993"
                      value={studentSchool}
                      onChangeText={setStudentSchool}
                      className="bg-white border border-emerald-200 rounded-xl px-3 py-2 text-xs text-cute-cocoa"
                    />
                  </View>
                  <View>
                    <Text className="text-[11px] font-bold text-cute-cocoa mb-1">
                      Parent / Guardian Phone
                    </Text>
                    <TextInput
                      placeholder="+91 98230 44551"
                      placeholderTextColor="#a89993"
                      value={studentGuardianPhone}
                      onChangeText={setStudentGuardianPhone}
                      className="bg-white border border-emerald-200 rounded-xl px-3 py-2 text-xs text-cute-cocoa"
                    />
                  </View>
                </View>
              )}

              {/* PARENT CHILD LINK CODE ENTRY */}
              {selectedRole === 'parent' && (
                <View className="gap-2.5 bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200 mb-3">
                  <View className="flex-row items-center gap-1.5">
                    <Home size={14} color="#d97706" />
                    <Text className="text-xs font-black text-amber-900">Child Linking</Text>
                  </View>
                  <Text className="text-[11px] text-cute-muted">
                    Enter your child's Parent Link Code (found on student profile) or registered parent phone.
                  </Text>
                  <TextInput
                    placeholder="e.g. STU-AMELIA-902 or +91 98230..."
                    placeholderTextColor="#a89993"
                    autoCapitalize="characters"
                    value={parentChildCode}
                    onChangeText={setParentChildCode}
                    className="bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs text-cute-cocoa font-bold"
                  />
                </View>
              )}

              {/* Submit Registration */}
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={handleSubmit}
                disabled={loading}
                className="bg-cute-peach py-3.5 rounded-2xl items-center shadow-xs active:scale-98"
              >
                <Text className="text-xs font-extrabold text-white tracking-wide">
                  {loading
                    ? 'Creating Account...'
                    : selectedRole === 'teacher'
                    ? teacherOption === 'solo'
                      ? 'Launch Solo Teacher Desk 🍎'
                      : 'Connect to Institute Faculty 🏫'
                    : selectedRole === 'admin'
                    ? 'Register Coaching Center 🏫'
                    : `Complete ${selectedRole.toUpperCase()} Registration 🌸`}
                </Text>
              </TouchableOpacity>

              <View className="mt-4 pt-3 border-t border-cute-border items-center">
                <TouchableOpacity onPress={() => setAuthMode('signin')}>
                  <Text className="text-xs text-cute-muted">
                    Already have an account?{' '}
                    <Text className="font-extrabold text-cute-peach">Sign In here</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* 3. Clearly Separated Instant Demo Mode (Bottom of Screen) */}
        <View className="mt-8 pt-5 border-t-2 border-cute-border/60">
          <View className="flex-row items-center justify-between mb-2 px-1">
            <View className="flex-row items-center gap-1.5">
              <Sparkles size={14} color="#ff7d6b" />
              <Text className="text-xs font-black text-cute-cocoa uppercase tracking-wider">
                1-Click Instant Demo Access
              </Text>
            </View>
            <View className="bg-cute-peach-light px-2 py-0.5 rounded-full border border-cute-peach">
              <Text className="text-[10px] font-bold text-cute-peach">Evaluation</Text>
            </View>
          </View>
          <Text className="text-[11px] text-cute-muted mb-3 px-1 leading-relaxed">
            Instantly evaluate any role with pre-loaded dummy data without typing credentials:
          </Text>

          <View className="gap-2">
            <TouchableOpacity
              onPress={() => handleQuickDemo('student')}
              className="bg-white border border-slate-200 py-2.5 px-3.5 rounded-2xl flex-row items-center justify-between active:scale-98 shadow-xs"
            >
              <View className="flex-row items-center gap-2.5">
                <Text className="text-lg">🎓</Text>
                <View>
                  <Text className="text-xs font-bold text-slate-900">Student: Amelia Sharma</Text>
                  <Text className="text-[10px] text-slate-500">Class 12 • JEE Advanced (Morning)</Text>
                </View>
              </View>
              <Text className="text-xs font-bold text-blue-600">→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleQuickDemo('teacher')}
              className="bg-white border border-slate-200 py-2.5 px-3.5 rounded-2xl flex-row items-center justify-between active:scale-98 shadow-xs"
            >
              <View className="flex-row items-center gap-2.5">
                <Text className="text-lg">👨‍🏫</Text>
                <View>
                  <Text className="text-xs font-bold text-slate-900">Teacher: Prof. Vikram Joshi</Text>
                  <Text className="text-[10px] text-slate-500">Code: JOSHI-MATH-89 • Grading & Roll Call</Text>
                </View>
              </View>
              <Text className="text-xs font-bold text-blue-600">→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleQuickDemo('admin')}
              className="bg-white border border-slate-200 py-2.5 px-3.5 rounded-2xl flex-row items-center justify-between active:scale-98 shadow-xs"
            >
              <View className="flex-row items-center gap-2.5">
                <Text className="text-lg">🏫</Text>
                <View>
                  <Text className="text-xs font-bold text-slate-900">Director: Apex Institute</Text>
                  <Text className="text-[10px] text-slate-500">Multi-Batch Roster • Admissions & Fees</Text>
                </View>
              </View>
              <Text className="text-xs font-bold text-blue-600">→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleQuickDemo('parent')}
              className="bg-white border-2 border-cute-border py-2.5 px-3.5 rounded-2xl flex-row items-center justify-between active:scale-98 shadow-xs"
            >
              <View className="flex-row items-center gap-2.5">
                <Text className="text-lg">🏡</Text>
                <View>
                  <Text className="text-xs font-bold text-cute-cocoa">Parent: Sunita Sharma</Text>
                  <Text className="text-[10px] text-cute-muted">Amelia & Aarav • Roll-Call & UPI Fee Pay</Text>
                </View>
              </View>
              <Text className="text-xs font-black text-cute-peach">→</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. Forgot Password Modal */}
        <Modal
          visible={isForgotPasswordOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsForgotPasswordOpen(false)}
        >
          <View className="flex-1 bg-black/60 items-center justify-center p-5">
            <View className="bg-white border-2 border-cute-border rounded-3xl p-5 w-full max-w-sm shadow-lg">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-2">
                  <KeyRound size={18} color="#ff7d6b" />
                  <Text className="text-base font-black text-cute-cocoa">Forgot Password</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setIsForgotPasswordOpen(false)}
                  className="w-8 h-8 rounded-full bg-cute-cream items-center justify-center"
                >
                  <X size={16} color="#7d6f6a" />
                </TouchableOpacity>
              </View>

              <Text className="text-xs text-cute-muted mb-4 leading-relaxed">
                Enter your registered email address and we'll send you instructions to reset your password.
              </Text>

              <TextInput
                placeholder="name@example.com"
                placeholderTextColor="#a89993"
                keyboardType="email-address"
                autoCapitalize="none"
                value={forgotEmail}
                onChangeText={setForgotEmail}
                className="bg-cute-cream border border-cute-border rounded-2xl px-4 py-3 text-xs text-cute-cocoa font-medium mb-4"
              />

              <TouchableOpacity
                onPress={handleForgotPasswordSubmit}
                className="bg-cute-peach py-3 rounded-2xl items-center shadow-xs active:scale-98"
              >
                <Text className="text-xs font-bold text-white">Send Reset Instructions</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
