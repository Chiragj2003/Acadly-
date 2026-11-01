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
} from 'lucide-react-native';

import { useAuth } from '@/context/AuthContext';
import { useInstitute } from '@/context/InstituteContext';
import { useAcademic } from '@/context/AcademicContext';
import { Mascot } from '@/components/ui/Mascot';
import { UserRole } from '@/types/database';

export default function CleanAuthScreen() {
  const router = useRouter();
  const { signIn, signInWithGoogle, signUp, switchRole, loading } = useAuth();
  const { currentInstitute } = useInstitute();
  const { teacherProfile, setTeacherProfile, coachingProfile, setCoachingProfile } = useAcademic();

  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  // Common credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Solo Teacher specific fields
  const [teacherQualification, setTeacherQualification] = useState('M.Sc Physics (IIT Bombay)');
  const [teacherSubjects, setTeacherSubjects] = useState('Physics, Mechanics, Calculus');
  const [teacherExperience, setTeacherExperience] = useState('10');
  const [teacherBio, setTeacherBio] = useState('Passionate about simplified conceptual problem solving.');
  const [teacherFeeRate, setTeacherFeeRate] = useState('3500');

  // Coaching Center / Admin specific fields
  const [instituteName, setInstituteName] = useState('Bloom Science Academy');
  const [instituteCity, setInstituteCity] = useState('Pune');
  const [instituteSubjects, setInstituteSubjects] = useState('Physics, Chemistry, Maths, Biology');
  const [directorPhone, setDirectorPhone] = useState('+91 98230 11223');

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

  // Submission handler
  const handleSubmit = async () => {
    if (authMode === 'signup' && !fullName.trim()) {
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

    if (authMode === 'signup') {
      // If Individual Tuition Teacher, configure the solo teacher profile & code
      if (selectedRole === 'teacher') {
        const generatedCode = `${fullName.split(' ')[0].toUpperCase()}-TUTOR-${Math.floor(10 + Math.random() * 90)}`;
        setTeacherProfile({
          fullName,
          qualification: teacherQualification,
          specializationSubjects: teacherSubjects.split(',').map(s => s.trim()),
          experienceYears: parseFloat(teacherExperience) || 5,
          bio: teacherBio,
          achievements: 'State & National Olympiad Mentorship',
          monthlyFeeRate: parseInt(teacherFeeRate, 10) || 3000,
          teacherCode: generatedCode,
        });

        Alert.alert(
          'Solo Teacher Account Ready! 🍎',
          `Your shareable Teacher Code is: ${generatedCode}\nStudents can join your batches with this code.`,
          [{ text: 'Open Teacher Desk', onPress: () => navigateToRoleScreen('teacher') }]
        );
        return;
      }

      // If Coaching Center / Admin
      if (selectedRole === 'admin') {
        const generatedInvite = `${instituteName.substring(0, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
        setCoachingProfile({
          name: instituteName,
          city: instituteCity,
          subjectsOffered: instituteSubjects.split(',').map(s => s.trim()),
          directorName: fullName,
          phone: directorPhone,
          inviteCode: generatedInvite,
        });

        Alert.alert(
          'Coaching Center Created! 🏫',
          `Your Institute Invite Code is: ${generatedInvite}\nTeachers & Students can join under this code.`,
          [{ text: 'Open Admin Command', onPress: () => navigateToRoleScreen('admin') }]
        );
        return;
      }

      // If Student
      if (selectedRole === 'student') {
        const res = await signUp(fullName, email, selectedRole);
        if (res.success) {
          Alert.alert(
            'Student Account Created! 🌸',
            'Now enter your Teacher Code to connect with your tuition or coaching batch.',
            [{ text: 'Connect Code', onPress: () => router.push('/join-institute') }]
          );
        }
        return;
      }

      // Parent
      const res = await signUp(fullName, email, selectedRole);
      if (res.success) {
        Alert.alert('Parent Account Ready! 🏡', `Welcome, ${fullName}!`);
        navigateToRoleScreen('parent');
      }
    } else {
      // Sign-in
      const res = await signIn(email, selectedRole);
      if (res.success) {
        navigateToRoleScreen(selectedRole);
      } else {
        Alert.alert('Sign In Failed', res.error || 'Invalid credentials.');
      }
    }
  };

  // 1-Click Demo Login
  const handleQuickDemo = async (role: UserRole) => {
    setSelectedRole(role);
    await switchRole(role);
    navigateToRoleScreen(role);
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
      title: 'Solo Tuition Teacher 🍎',
      subtitle: 'Teach individual batches, verify students & collect fees',
      emoji: '👨‍🏫',
      badge: 'Solo Educator',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-300',
    },
    {
      id: 'admin',
      title: 'Coaching Center / Academy 🏫',
      subtitle: 'Multi-teacher institute, branches, staff & admissions',
      emoji: '🏫',
      badge: 'Institute Director',
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
        contentContainerClassName="p-5 pt-12 pb-20"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 1. Header with Cute SVG Pip Mascot */}
        <View className="items-center mb-5">
          <Mascot
            mood="happy"
            size="lg"
            showSpeechBubble
            speechText={`Hi! Welcome to ${currentInstitute?.name || 'Acadly'} 🌸`}
          />
          <Text className="text-3xl font-black text-cute-cocoa tracking-tight mt-3 text-center">
            Acadly
          </Text>
          <Text className="text-xs font-bold text-cute-muted text-center mt-1">
            Tuition & Coaching Made Adorable 🌸
          </Text>
        </View>

        {/* Quick 1-Tap Demo Jump for Instant Review */}
        <View className="bg-white border-2 border-cute-border rounded-2xl p-2.5 mb-5 flex-row items-center justify-between shadow-xs">
          <View className="flex-row items-center gap-1.5 pl-1">
            <Sparkles size={13} color="#ff7d6b" />
            <Text className="text-[11px] font-black text-cute-cocoa">Demo Mode:</Text>
          </View>
          <View className="flex-row gap-1.5">
            {[
              { role: 'student', label: '🌸 Student' },
              { role: 'teacher', label: '🍎 Teacher' },
              { role: 'admin', label: '🏫 Admin' },
              { role: 'parent', label: '🏡 Parent' },
            ].map((item) => (
              <TouchableOpacity
                key={item.role}
                onPress={() => handleQuickDemo(item.role as UserRole)}
                className="bg-cute-peach-light border border-cute-peach px-2 py-1 rounded-xl active:scale-95"
              >
                <Text className="text-[10px] font-black text-cute-peach">{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 2. Step 1: Select Your Role */}
        <View className="mb-5">
          <View className="flex-row items-center justify-between mb-2.5 px-1">
            <Text className="text-xs font-black text-cute-cocoa uppercase tracking-wider">
              Step 1: Choose Your Account Mode
            </Text>
            <View className="bg-cute-peach-light px-2.5 py-0.5 rounded-full border border-cute-peach">
              <Text className="text-[10px] font-bold text-cute-peach">Required</Text>
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
                      isSelected
                        ? 'bg-cute-peach border-cute-peach'
                        : 'bg-white border-cute-border'
                    }`}
                  >
                    {isSelected && <View className="w-2 h-2 rounded-full bg-white" />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 3. Step 2: Sign-In / Sign-Up Form */}
        <View className="bg-white border-2 border-cute-border rounded-3xl p-5 mb-5 shadow-xs">
          {/* Toggle Tab */}
          <View className="flex-row bg-cute-cream p-1 rounded-2xl border border-cute-border mb-4">
            <TouchableOpacity
              onPress={() => setAuthMode('signin')}
              className={`flex-1 py-2 rounded-xl items-center ${
                authMode === 'signin' ? 'bg-white shadow-xs' : ''
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  authMode === 'signin' ? 'text-cute-cocoa' : 'text-cute-muted'
                }`}
              >
                Sign In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setAuthMode('signup')}
              className={`flex-1 py-2 rounded-xl items-center ${
                authMode === 'signup' ? 'bg-white shadow-xs' : ''
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  authMode === 'signup' ? 'text-cute-cocoa' : 'text-cute-muted'
                }`}
              >
                Create Account
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quick Connect link for Students */}
          {selectedRole === 'student' && authMode === 'signup' && (
            <TouchableOpacity
              onPress={() => router.push('/join-institute')}
              className="bg-cute-peach-light border border-cute-peach p-3 rounded-2xl flex-row items-center justify-between mb-4 shadow-xs"
            >
              <View className="flex-row items-center gap-2">
                <Text className="text-base">🎫</Text>
                <View>
                  <Text className="text-xs font-bold text-cute-cocoa">Have a Teacher Code?</Text>
                  <Text className="text-[10px] text-cute-muted">Join your teacher or coaching center directly</Text>
                </View>
              </View>
              <ArrowRight size={14} color="#ff7d6b" />
            </TouchableOpacity>
          )}

          {/* Google OAuth Button */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleGoogleAuth}
            className="w-full bg-white border-2 border-cute-border py-3 rounded-2xl flex-row items-center justify-center gap-2 mb-3 shadow-xs"
          >
            <Text className="text-base">🌐</Text>
            <Text className="text-xs font-extrabold text-cute-cocoa">
              Continue with Google
            </Text>
          </TouchableOpacity>

          <View className="flex-row items-center my-2">
            <View className="flex-1 h-[1px] bg-cute-border" />
            <Text className="mx-3 text-[11px] font-bold text-cute-muted uppercase">or with email</Text>
            <View className="flex-1 h-[1px] bg-cute-border" />
          </View>

          {/* Form Fields */}
          <View className="gap-3 mt-1">
            {authMode === 'signup' && (
              <View>
                <Text className="text-xs font-bold text-cute-cocoa mb-1">
                  {selectedRole === 'admin' ? 'Director / Head Name' : 'Full Name'}
                </Text>
                <TextInput
                  placeholder={selectedRole === 'teacher' ? 'e.g. Prof. Vikram Joshi' : 'e.g. Amelia Sharma'}
                  placeholderTextColor="#a89993"
                  value={fullName}
                  onChangeText={setFullName}
                  className="bg-cute-cream border border-cute-border rounded-2xl px-4 py-2.5 text-xs text-cute-cocoa font-medium"
                />
              </View>
            )}

            {/* Solo Teacher Specific Registration Details */}
            {authMode === 'signup' && selectedRole === 'teacher' && (
              <View className="gap-3 bg-rose-50/50 p-3.5 rounded-2xl border border-rose-200">
                <View className="flex-row items-center gap-1.5 mb-0.5">
                  <Briefcase size={14} color="#e11d48" />
                  <Text className="text-xs font-black text-rose-800">Solo Teacher Profile Details</Text>
                </View>

                <View>
                  <Text className="text-[11px] font-bold text-cute-cocoa mb-1">Qualification & Background</Text>
                  <TextInput
                    placeholder="e.g. M.Sc Math (IIT Delhi), B.Ed"
                    placeholderTextColor="#a89993"
                    value={teacherQualification}
                    onChangeText={setTeacherQualification}
                    className="bg-white border border-rose-200 rounded-xl px-3 py-2 text-xs text-cute-cocoa"
                  />
                </View>

                <View>
                  <Text className="text-[11px] font-bold text-cute-cocoa mb-1">Subjects & Specialization</Text>
                  <TextInput
                    placeholder="e.g. Advanced Calculus, Physics, Vectors"
                    placeholderTextColor="#a89993"
                    value={teacherSubjects}
                    onChangeText={setTeacherSubjects}
                    className="bg-white border border-rose-200 rounded-xl px-3 py-2 text-xs text-cute-cocoa"
                  />
                </View>

                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <Text className="text-[11px] font-bold text-cute-cocoa mb-1">Experience (Years)</Text>
                    <TextInput
                      placeholder="e.g. 10"
                      placeholderTextColor="#a89993"
                      keyboardType="numeric"
                      value={teacherExperience}
                      onChangeText={setTeacherExperience}
                      className="bg-white border border-rose-200 rounded-xl px-3 py-2 text-xs text-cute-cocoa"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[11px] font-bold text-cute-cocoa mb-1">Monthly Fee (₹/mo)</Text>
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

                <View>
                  <Text className="text-[11px] font-bold text-cute-cocoa mb-1">Teaching Bio / Philosophy</Text>
                  <TextInput
                    placeholder="Short bio shown to students..."
                    placeholderTextColor="#a89993"
                    multiline
                    value={teacherBio}
                    onChangeText={setTeacherBio}
                    className="bg-white border border-rose-200 rounded-xl px-3 py-2 text-xs text-cute-cocoa min-h-[50px]"
                  />
                </View>

                <View className="bg-rose-100/70 p-2.5 rounded-xl flex-row items-center gap-2">
                  <Hash size={14} color="#e11d48" />
                  <Text className="text-[10px] font-bold text-rose-900 flex-1">
                    A unique Teacher Code will be generated automatically for your students to join.
                  </Text>
                </View>
              </View>
            )}

            {/* Coaching Center Specific Registration Details */}
            {authMode === 'signup' && selectedRole === 'admin' && (
              <View className="gap-3 bg-indigo-50/50 p-3.5 rounded-2xl border border-indigo-200">
                <View className="flex-row items-center gap-1.5 mb-0.5">
                  <Building size={14} color="#4f46e5" />
                  <Text className="text-xs font-black text-indigo-900">Coaching Center Details</Text>
                </View>

                <View>
                  <Text className="text-[11px] font-bold text-cute-cocoa mb-1">Institute / Coaching Name</Text>
                  <TextInput
                    placeholder="e.g. Apex Science Academy"
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
                    <Text className="text-[11px] font-bold text-cute-cocoa mb-1">Phone Number</Text>
                    <TextInput
                      placeholder="e.g. +91 98230 11223"
                      placeholderTextColor="#a89993"
                      value={directorPhone}
                      onChangeText={setDirectorPhone}
                      className="bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs text-cute-cocoa"
                    />
                  </View>
                </View>

                <View>
                  <Text className="text-[11px] font-bold text-cute-cocoa mb-1">Subjects & Courses Offered</Text>
                  <TextInput
                    placeholder="e.g. Physics, Chemistry, Maths, NEET"
                    placeholderTextColor="#a89993"
                    value={instituteSubjects}
                    onChangeText={setInstituteSubjects}
                    className="bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs text-cute-cocoa"
                  />
                </View>
              </View>
            )}

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
                placeholder="••••••••"
                placeholderTextColor="#a89993"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                className="bg-cute-cream border border-cute-border rounded-2xl px-4 py-2.5 text-xs text-cute-cocoa font-medium"
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleSubmit}
              disabled={loading}
              className="bg-cute-peach py-3.5 rounded-2xl items-center mt-2 shadow-xs active:scale-98"
            >
              <Text className="text-xs font-extrabold text-white tracking-wide">
                {loading
                  ? 'Please wait...'
                  : authMode === 'signup'
                  ? selectedRole === 'teacher'
                    ? 'Launch Solo Teacher Desk 🍎'
                    : selectedRole === 'admin'
                    ? 'Register Coaching Center 🏫'
                    : `Create ${selectedRole.toUpperCase()} Account 🌸`
                  : `Sign In as ${selectedRole.toUpperCase()} →`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. Instant 1-Tap Quick Test Logins */}
        <View className="bg-white border-2 border-cute-border rounded-3xl p-5 shadow-xs">
          <View className="flex-row items-center gap-1.5 mb-1.5">
            <Sparkles size={16} color="#ff7d6b" />
            <Text className="text-xs font-black text-cute-cocoa uppercase tracking-wider">
              Instant 1-Click Testing (Demo Mode)
            </Text>
          </View>
          <Text className="text-[11px] text-cute-muted mb-3 leading-snug">
            Jump straight into each role's tailored mobile experience instantly:
          </Text>

          <View className="gap-2">
            <TouchableOpacity
              onPress={() => handleQuickDemo('student')}
              className="bg-cute-cream border border-cute-border py-2.5 px-3.5 rounded-2xl flex-row items-center justify-between active:scale-98"
            >
              <View className="flex-row items-center gap-2.5">
                <Text className="text-lg">🌸</Text>
                <View>
                  <Text className="text-xs font-bold text-cute-cocoa">Student: Amelia Sharma</Text>
                  <Text className="text-[10px] text-cute-muted">Batch Sakura • JEE & Board Prep</Text>
                </View>
              </View>
              <Text className="text-xs font-bold text-cute-peach">→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleQuickDemo('teacher')}
              className="bg-cute-cream border border-cute-border py-2.5 px-3.5 rounded-2xl flex-row items-center justify-between active:scale-98"
            >
              <View className="flex-row items-center gap-2.5">
                <Text className="text-lg">🍎</Text>
                <View>
                  <Text className="text-xs font-bold text-cute-cocoa">Solo Teacher: Prof. Vikram Joshi</Text>
                  <Text className="text-[10px] text-cute-muted">Code: SHARMA-MATH-89 • Attendance & Notes</Text>
                </View>
              </View>
              <Text className="text-xs font-bold text-cute-peach">→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleQuickDemo('admin')}
              className="bg-cute-cream border border-cute-border py-2.5 px-3.5 rounded-2xl flex-row items-center justify-between active:scale-98"
            >
              <View className="flex-row items-center gap-2.5">
                <Text className="text-lg">🏫</Text>
                <View>
                  <Text className="text-xs font-bold text-cute-cocoa">Coaching Director: Bloom Academy</Text>
                  <Text className="text-[10px] text-cute-muted">Multi-Teacher Roster • Admissions & Fees</Text>
                </View>
              </View>
              <Text className="text-xs font-bold text-cute-peach">→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleQuickDemo('parent')}
              className="bg-cute-cream border border-cute-border py-2.5 px-3.5 rounded-2xl flex-row items-center justify-between active:scale-98"
            >
              <View className="flex-row items-center gap-2.5">
                <Text className="text-lg">🏡</Text>
                <View>
                  <Text className="text-xs font-bold text-cute-cocoa">Parent: Sunita Sharma</Text>
                  <Text className="text-[10px] text-cute-muted">Child Attendance • Report Card & Fee Pay</Text>
                </View>
              </View>
              <Text className="text-xs font-bold text-cute-peach">→</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
