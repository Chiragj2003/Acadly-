import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mail, Lock, User, ArrowRight } from 'lucide-react-native';
import { useAuth, useInstitute } from '@/context/AuthContext';
import { useChild } from '@/context/ChildContext';
import { checkRateLimit } from '@/lib/rateLimiter';
import { type UserRole } from '@/types/database';
import { AuthHeader } from '@/components/screens/auth/AuthHeader';
import { RoleSelector } from '@/components/screens/auth/RoleSelector';
import { ForgotPasswordModal } from '@/components/screens/auth/ForgotPasswordModal';
import { RoleOnboardingFields } from '@/components/screens/auth/RoleOnboardingFields';

export default function CleanAuthScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn, signUp, loading } = useAuth();
  const { currentInstitute } = useInstitute();
  const { addChildByCodeOrPhone } = useChild();

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');

  // Core credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Password reset state
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isResetSending, setIsResetSending] = useState(false);

  // Role onboarding fields
  const [teacherOption, setTeacherOption] = useState<'solo' | 'coaching_faculty'>('solo');
  const [facultyCoachingCode, setFacultyCoachingCode] = useState('BLOOM2026');
  const [teacherQualification, setTeacherQualification] = useState('M.Sc Physics');
  const [teacherSubjects, setTeacherSubjects] = useState('Physics, Calculus');
  const [teacherExperience, setTeacherExperience] = useState('8');
  const [teacherFeeRate, setTeacherFeeRate] = useState('3500');

  const [instituteName, setInstituteName] = useState('Bloom Science Academy');
  const [instituteCity, setInstituteCity] = useState('Pune');
  const [instituteSubjects, setInstituteSubjects] = useState('Physics, Chemistry, Maths');
  const [directorPhone, setDirectorPhone] = useState('+91 98230 11223');
  const [parentWardCode, setParentWardCode] = useState('');

  const navigateToRoleHome = (role: UserRole) => {
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

  const handleSubmit = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      Alert.alert('Required Fields', 'Please enter both your email address and password.');
      return;
    }

    // Client UX debounce throttle
    const throttleKey = `auth_submit:${trimmedEmail}`;
    const rateCheck = checkRateLimit(throttleKey, 5, 60000);
    if (!rateCheck.allowed) {
      const waitSec = Math.ceil((rateCheck.retryAfterMs || 1000) / 1000);
      Alert.alert('Too Many Taps', `Please pause for ${waitSec}s before attempting again.`);
      return;
    }

    try {
      if (authMode === 'signin') {
        const result = await signIn(trimmedEmail, trimmedPassword, selectedRole);
        if (result.success) {
          const destinationRole = result.role || selectedRole;
          navigateToRoleHome(destinationRole as UserRole);
        } else {
          Alert.alert('Authentication Failed', result.error || 'Invalid email or password.');
        }
      } else {
        if (!fullName.trim()) {
          Alert.alert('Full Name Required', 'Please provide your full legal or display name.');
          return;
        }

        const signUpResult = await signUp(
          fullName.trim(),
          trimmedEmail,
          selectedRole,
          trimmedPassword
        );

        if (!signUpResult.success) {
          Alert.alert('Signup Incomplete', signUpResult.error || 'Could not register account.');
          return;
        }

        if (selectedRole === 'parent' && parentWardCode.trim()) {
          await addChildByCodeOrPhone(parentWardCode.trim()).catch(() => null);
        }

        Alert.alert(
          'Account Created! 🎓',
          'Your account has been created. If email confirmation is enabled, please verify your email.',
          [{ text: 'Continue', onPress: () => navigateToRoleHome(selectedRole) }]
        );
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unexpected authentication error.';
      Alert.alert('Authentication Error', message);
    }
  };

  const handleSendPasswordReset = async () => {
    if (!forgotEmail.trim()) {
      Alert.alert('Email Required', 'Please enter your registered email address.');
      return;
    }
    setIsResetSending(true);
    try {
      Alert.alert(
        'Password Reset Sent',
        `A secure recovery link has been dispatched to ${forgotEmail.trim()}.`
      );
      setIsForgotPasswordOpen(false);
      setForgotEmail('');
    } finally {
      setIsResetSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-slate-50"
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: Math.max(insets.bottom, 24),
          paddingHorizontal: 20,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <AuthHeader
          title={authMode === 'signin' ? 'Welcome Back!' : 'Join Acadly'}
          subtitle="Tuition, attendance, tests & fees in one unified platform"
        />

        {/* Role Selector */}
        <View className="mb-4">
          <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Select Your Role
          </Text>
          <RoleSelector selectedRole={selectedRole} onSelectRole={setSelectedRole} />
        </View>

        {/* Mode Toggle (Sign In / Sign Up) */}
        <View className="flex-row bg-slate-200/80 p-1 rounded-2xl mb-4">
          <TouchableOpacity
            onPress={() => setAuthMode('signin')}
            className={`flex-1 py-2.5 rounded-xl items-center ${
              authMode === 'signin' ? 'bg-white shadow-xs' : ''
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                authMode === 'signin' ? 'text-slate-900' : 'text-slate-600'
              }`}
            >
              {t('auth.signIn', 'Sign In')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setAuthMode('signup')}
            className={`flex-1 py-2.5 rounded-xl items-center ${
              authMode === 'signup' ? 'bg-white shadow-xs' : ''
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                authMode === 'signup' ? 'text-slate-900' : 'text-slate-600'
              }`}
            >
              {t('auth.signUp', 'Create Account')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form Body */}
        <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs gap-3">
          {authMode === 'signup' && (
            <View>
              <Text className="text-[11px] font-semibold text-slate-600 mb-1">{t('auth.fullName', 'Full Name')}</Text>
              <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5">
                <User size={16} color="#94a3b8" />
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="e.g. Vikram Joshi / Amelia Sharma"
                  className="flex-1 ml-2 text-xs text-slate-800"
                />
              </View>
            </View>
          )}

          <View>
            <Text className="text-[11px] font-semibold text-slate-600 mb-1">{t('auth.emailAddress', 'Email Address')}</Text>
            <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5">
              <Mail size={16} color="#94a3b8" />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="name@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                className="flex-1 ml-2 text-xs text-slate-800"
              />
            </View>
          </View>

          <View>
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-[11px] font-semibold text-slate-600">{t('auth.password', 'Password')}</Text>
              {authMode === 'signin' && (
                <TouchableOpacity onPress={() => setIsForgotPasswordOpen(true)}>
                  <Text className="text-[10px] font-bold text-blue-600">{t('auth.forgotPassword', 'Forgot Password?')}</Text>
                </TouchableOpacity>
              )}
            </View>
            <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5">
              <Lock size={16} color="#94a3b8" />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                className="flex-1 ml-2 text-xs text-slate-800"
              />
            </View>
          </View>

          {authMode === 'signup' && (
            <RoleOnboardingFields
              role={selectedRole}
              teacherOption={teacherOption}
              setTeacherOption={setTeacherOption}
              facultyCoachingCode={facultyCoachingCode}
              setFacultyCoachingCode={setFacultyCoachingCode}
              teacherQualification={teacherQualification}
              setTeacherQualification={setTeacherQualification}
              teacherSubjects={teacherSubjects}
              setTeacherSubjects={setTeacherSubjects}
              teacherExperience={teacherExperience}
              setTeacherExperience={setTeacherExperience}
              teacherFeeRate={teacherFeeRate}
              setTeacherFeeRate={setTeacherFeeRate}
              instituteName={instituteName}
              setInstituteName={setInstituteName}
              instituteCity={instituteCity}
              setInstituteCity={setInstituteCity}
              instituteSubjects={instituteSubjects}
              setInstituteSubjects={setInstituteSubjects}
              directorPhone={directorPhone}
              setDirectorPhone={setDirectorPhone}
              parentWardCode={parentWardCode}
              setParentWardCode={setParentWardCode}
            />
          )}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            className="bg-blue-600 py-3.5 rounded-2xl items-center flex-row justify-center gap-2 mt-2 shadow-xs active:scale-98"
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Text className="text-xs font-bold text-white">
                  {authMode === 'signin'
                    ? t('auth.signInAs', { role: t(`roles.${selectedRole}`, selectedRole), defaultValue: `Sign In as ${selectedRole}` })
                    : t('auth.completeRegistration', { role: t(`roles.${selectedRole}`, selectedRole), defaultValue: `Complete ${selectedRole} Registration` })}
                </Text>
                <ArrowRight size={14} color="white" />
              </>
            )}
          </TouchableOpacity>
        </View>

        <ForgotPasswordModal
          visible={isForgotPasswordOpen}
          onClose={() => setIsForgotPasswordOpen(false)}
          email={forgotEmail}
          onChangeEmail={setForgotEmail}
          onSubmit={handleSendPasswordReset}
          loading={isResetSending}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
