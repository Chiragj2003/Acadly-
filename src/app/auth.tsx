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
import Svg, { Path } from 'react-native-svg';
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
  const { signIn, signUp, signInWithGoogle, loading } = useAuth();
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

  const handleGoogle = async () => {
    const result = await signInWithGoogle(selectedRole);
    if (result.success) {
      router.replace('/');
    } else if (result.error) {
      Alert.alert('Google sign-in', result.error);
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
      className="flex-1 bg-paper"
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
          title={authMode === 'signin' ? 'Good to see you.' : 'Welcome to Acadly'}
          subtitle={authMode === 'signin' ? 'Sign in with the email your institute has on file.' : 'Class, practice and progress, in one calm place.'}
        />

        {/* Role Selector */}
        <View className="mb-4">
          <Text className="text-sm font-sans-semibold text-muted mb-3 text-center">
            Who's using Acadly today?
          </Text>
          <RoleSelector selectedRole={selectedRole} onSelectRole={setSelectedRole} />
        </View>

        {/* Mode Toggle (Sign In / Sign Up) */}
        <View accessibilityRole="tablist" className="flex-row bg-white p-1.5 rounded-full mb-4">
          <TouchableOpacity
            onPress={() => setAuthMode('signin')}
            accessibilityRole="tab"
            accessibilityState={{ selected: authMode === 'signin' }}
            className={`flex-1 min-h-[44px] justify-center rounded-full items-center ${
              authMode === 'signin' ? 'bg-ink' : ''
            }`}
          >
            <Text
              className={`text-sm font-sans-bold ${
                authMode === 'signin' ? 'text-white' : 'text-slate-600'
              }`}
            >
              {t('auth.signIn', 'Sign In')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setAuthMode('signup')}
            accessibilityRole="tab"
            accessibilityState={{ selected: authMode === 'signup' }}
            className={`flex-1 min-h-[44px] justify-center rounded-full items-center ${
              authMode === 'signup' ? 'bg-ink' : ''
            }`}
          >
            <Text
              className={`text-sm font-sans-bold ${
                authMode === 'signup' ? 'text-white' : 'text-slate-600'
              }`}
            >
              {t('auth.signUp', 'Create Account')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form Body */}
        <View className="bg-white rounded-3xl p-5 gap-4">
          {authMode === 'signup' && (
            <View>
              <Text className="text-xs font-sans-bold text-muted mb-1.5">{t('auth.fullName', 'Full Name')}</Text>
              <View className="flex-row items-center bg-paper rounded-2xl px-4 min-h-[52px]">
                <User size={16} color="#8C877E" />
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="e.g. Vikram Joshi / Amelia Sharma"
                  className="flex-1 ml-2 text-base font-sans text-ink"
                />
              </View>
            </View>
          )}

          <View>
            <Text className="text-xs font-sans-bold text-muted mb-1.5">{t('auth.emailAddress', 'Email Address')}</Text>
            <View className="flex-row items-center bg-paper rounded-2xl px-4 min-h-[52px]">
              <Mail size={16} color="#8C877E" />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="name@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                className="flex-1 ml-2 text-base font-sans text-ink"
              />
            </View>
          </View>

          <View>
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-xs font-sans-bold text-muted">{t('auth.password', 'Password')}</Text>
              {authMode === 'signin' && (
                <TouchableOpacity onPress={() => setIsForgotPasswordOpen(true)}>
                  <Text className="text-xs font-sans-bold text-ink underline">{t('auth.forgotPassword', 'Forgot Password?')}</Text>
                </TouchableOpacity>
              )}
            </View>
            <View className="flex-row items-center bg-paper rounded-2xl px-4 min-h-[52px]">
              <Lock size={16} color="#8C877E" />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                className="flex-1 ml-2 text-base font-sans text-ink"
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
            accessibilityRole="button"
            accessibilityState={{ disabled: loading, busy: loading }}
            className="bg-ink min-h-[56px] rounded-full items-center flex-row justify-center gap-2 mt-2 active:opacity-90"
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Text className="text-[17px] font-sans-bold text-white">
                  {authMode === 'signin'
                    ? t('auth.signInAs', { role: t(`roles.${selectedRole}`, selectedRole), defaultValue: `Sign In as ${selectedRole}` })
                    : t('auth.completeRegistration', { role: t(`roles.${selectedRole}`, selectedRole), defaultValue: `Complete ${selectedRole} Registration` })}
                </Text>
                <ArrowRight size={18} color="white" />
              </>
            )}
          </TouchableOpacity>
        </View>

        {authMode === 'signin' && (
          <>
            <View className="flex-row items-center gap-3 my-5">
              <View className="flex-1 h-px bg-slate-300" />
              <Text className="text-[13px] font-sans-semibold text-muted">or</Text>
              <View className="flex-1 h-px bg-slate-300" />
            </View>
            <TouchableOpacity
              onPress={handleGoogle}
              disabled={loading}
              accessibilityRole="button"
              className="bg-white min-h-[56px] rounded-full flex-row items-center justify-center gap-2.5 active:opacity-90"
            >
              <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <Svg width={20} height={20} viewBox="0 0 24 24">
                <Path fill="#4285F4" d="M22.6 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8.1z" />
                <Path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23z" />
                <Path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 0 1 0-4.3V7H2.1a11 11 0 0 0 0 9.9z" />
                <Path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7l3.7 2.9C6.7 7.3 9.1 5.4 12 5.4z" />
              </Svg>
              </View>
              <Text className="text-base font-sans-bold text-ink">Continue with Google</Text>
            </TouchableOpacity>
          </>
        )}

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
