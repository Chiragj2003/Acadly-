import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '@/context/AuthContext';
import { checkRateLimit } from '@/lib/rateLimiter';
import { type UserRole } from '@/types/database';
import { DisplayTitle, Eyebrow } from '@/components/ui';
import { ForgotPasswordModal } from '@/components/screens/auth/ForgotPasswordModal';
import { RoleOnboardingFields } from '@/components/screens/auth/RoleOnboardingFields';

const ROLES: UserRole[] = ['student', 'teacher', 'parent', 'admin'];
const HOME: Record<UserRole, '/student' | '/teacher' | '/parent' | '/admin'> = {
  student: '/student',
  teacher: '/teacher',
  parent: '/parent',
  admin: '/admin',
};

const splitList = (value: string) =>
  value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

/** One labelled field inside the white grouped card. */
const Field: React.FC<{
  label: string;
  last?: boolean;
  children: React.ReactNode;
}> = ({ label, last = false, children }) => (
  <View className={`py-2.5 ${last ? '' : 'border-b border-hairline'}`}>
    <Text className="font-sans-bold text-muted text-xs mb-0.5">{label}</Text>
    {children}
  </View>
);

/**
 * Sign-in, screen 2 of 2: email + password (or create an account), forgot
 * password and Google. Routing after success uses the server-granted role.
 */
export default function SignInScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ role?: string; mode?: string }>();
  const role: UserRole = ROLES.includes(params.role as UserRole) ? (params.role as UserRole) : 'student';

  const { signIn, signUp, signInWithGoogle, sendPasswordReset, loading } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>(params.mode === 'signup' ? 'signup' : 'signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isResetSending, setIsResetSending] = useState(false);

  // Role onboarding (start empty — no invented institute names or codes).
  const [teacherOption, setTeacherOption] = useState<'solo' | 'coaching_faculty'>('coaching_faculty');
  const [facultyCoachingCode, setFacultyCoachingCode] = useState('');
  const [teacherQualification, setTeacherQualification] = useState('');
  const [teacherSubjects, setTeacherSubjects] = useState('');
  const [teacherExperience, setTeacherExperience] = useState('');
  const [teacherFeeRate, setTeacherFeeRate] = useState('');
  const [instituteName, setInstituteName] = useState('');
  const [instituteCity, setInstituteCity] = useState('');
  const [instituteSubjects, setInstituteSubjects] = useState('');
  const [directorPhone, setDirectorPhone] = useState('');
  const [parentWardCode, setParentWardCode] = useState('');

  const isSignup = mode === 'signup';

  const goHome = (granted: UserRole) => router.replace(HOME[granted]);

  const handleSubmit = async () => {
    setFormError(null);
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setFormError(t('auth.needEmailPassword', 'Enter your email and password.'));
      return;
    }
    const rate = checkRateLimit(`auth_submit:${cleanEmail}`, 5, 60000);
    if (!rate.allowed) {
      setFormError(
        t('auth.tooManyTries', 'Too many tries. Wait {{s}} seconds and try again.', {
          s: Math.ceil((rate.retryAfterMs || 1000) / 1000),
        })
      );
      return;
    }

    if (!isSignup) {
      const result = await signIn(cleanEmail, password);
      if (result.success && result.role) goHome(result.role);
      else setFormError(result.error || t('auth.signInFailed', 'Could not sign you in.'));
      return;
    }

    if (!fullName.trim()) {
      setFormError(t('auth.needName', 'Enter your full name.'));
      return;
    }
    const isSoloTutor = role === 'teacher' && teacherOption === 'solo';
    if ((role === 'admin' || isSoloTutor) && !instituteName.trim()) {
      setFormError(t('auth.needInstitute', 'Enter the name of your school, coaching or tuition.'));
      return;
    }
    if (role === 'teacher' && !isSoloTutor && !facultyCoachingCode.trim()) {
      setFormError(t('auth.needTeacherCode', 'Enter the teacher code your institute gave you.'));
      return;
    }

    // A solo tutor owns their own tuition, so they register it like an institute.
    const requestedRole: UserRole = isSoloTutor ? 'admin' : role;
    const result = await signUp(fullName.trim(), cleanEmail, requestedRole, password, {
      instituteName: instituteName.trim() || undefined,
      instituteCity: instituteCity.trim() || undefined,
      institutePhone: directorPhone.trim() || undefined,
      instituteSubjects: splitList(instituteSubjects || teacherSubjects),
      teacherInstituteCode: facultyCoachingCode.trim() || undefined,
      teacherQualification: teacherQualification.trim() || undefined,
      teacherSubjects: splitList(teacherSubjects),
      teacherExperienceYears: Number(teacherExperience) || 0,
      parentStudentCode: parentWardCode.trim() || undefined,
    });

    if (!result.success) {
      setFormError(result.error || t('auth.signUpFailed', 'Could not create your account.'));
      return;
    }
    if (result.needsEmailConfirmation) {
      Alert.alert(
        t('auth.checkEmailTitle', 'Check your email'),
        t('auth.checkEmailBody', 'We sent a confirmation link to {{email}}. Open it, then sign in.', { email: cleanEmail })
      );
      setMode('signin');
      return;
    }
    if (result.error) {
      // Account exists but the role step (code / institute) failed — say so, then continue.
      Alert.alert(t('auth.almostThere', 'Account created'), result.error);
    }
    goHome(result.role ?? 'student');
  };

  const handleGoogle = async () => {
    setFormError(null);
    const result = await signInWithGoogle(role);
    if (result.success) router.replace('/');
    else if (result.error) setFormError(result.error);
  };

  const handleSendReset = async () => {
    setIsResetSending(true);
    try {
      const result = await sendPasswordReset(forgotEmail);
      if (result.success) {
        setIsForgotOpen(false);
        Alert.alert(
          t('auth.resetSentTitle', 'Check your email'),
          t('auth.resetSentBody', 'If an account exists for {{email}}, a reset link is on its way.', { email: forgotEmail.trim() })
        );
        setForgotEmail('');
      } else {
        Alert.alert(t('auth.resetFailedTitle', 'Couldn’t send the link'), result.error);
      }
    } finally {
      setIsResetSending(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-paper">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: Math.max(insets.bottom, 24),
          paddingHorizontal: 20,
          flexGrow: 1,
        }}
      >
        <View className="flex-row items-center justify-between h-12">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.back', 'Back')}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/auth'))}
            className="w-12 h-12 rounded-full bg-white items-center justify-center"
          >
            <ChevronLeft size={22} color="#1C1C1E" />
          </Pressable>
          <View className="flex-row gap-1.5" accessibilityLabel="Step 2 of 2">
            <View className="w-2 h-2 rounded-full bg-slate-300" />
            <View className="w-[22px] h-2 rounded-full bg-ink" />
          </View>
          <View className="w-12" />
        </View>

        <View className="mt-7 mb-6 gap-2">
          <DisplayTitle center>
            {isSignup ? t('auth.createTitle', 'Create your account') : t('auth.welcomeBack', 'Good to see you.')}
          </DisplayTitle>
          <Eyebrow center className="text-[15px]">
            {isSignup
              ? t('auth.createSubtitle', 'It takes a minute. Your institute approves new members.')
              : t('auth.signInSubtitle', 'Sign in with the email your institute has on file.')}
          </Eyebrow>
        </View>

        <View className="bg-white rounded-3xl px-4 py-1">
          {isSignup && (
            <Field label={t('auth.fullName', 'Full name')}>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                autoComplete="name"
                textContentType="name"
                placeholder={t('auth.fullNamePlaceholder', 'Your name')}
                placeholderTextColor="#8C877E"
                className="font-sans text-ink text-[17px] min-h-[30px]"
              />
            </Field>
          )}
          <Field label={t('auth.email', 'Email')}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              placeholder="name@example.com"
              placeholderTextColor="#8C877E"
              className="font-sans text-ink text-[17px] min-h-[30px]"
            />
          </Field>
          <Field label={t('auth.password', 'Password')} last>
            <View className="flex-row items-center">
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                textContentType={isSignup ? 'newPassword' : 'password'}
                placeholder={isSignup ? t('auth.passwordHint', 'At least 8 characters') : '••••••••'}
                placeholderTextColor="#8C877E"
                className="flex-1 font-sans text-ink text-[17px] min-h-[30px]"
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={showPassword ? t('auth.hidePassword', 'Hide password') : t('auth.showPassword', 'Show password')}
                onPress={() => setShowPassword((v) => !v)}
                className="w-11 h-11 items-center justify-center"
              >
                {showPassword ? <EyeOff size={20} color="#6E6A63" /> : <Eye size={20} color="#6E6A63" />}
              </Pressable>
            </View>
          </Field>
        </View>

        {!isSignup && (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setForgotEmail(email);
              setIsForgotOpen(true);
            }}
            className="self-end min-h-[44px] justify-center"
          >
            <Text className="font-sans-bold text-ink text-[15px]">{t('auth.forgotPassword', 'Forgot password?')}</Text>
          </Pressable>
        )}

        {isSignup && role !== 'student' && (
          <View className="mt-4 bg-white rounded-3xl p-4">
            <RoleOnboardingFields
              role={role}
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
          </View>
        )}

        {formError ? (
          <View accessibilityLiveRegion="polite" className="mt-4 bg-pastel-pink rounded-2xl px-4 py-3">
            <Text className="font-sans-semibold text-ink text-sm leading-5">{formError}</Text>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: loading, busy: loading }}
          disabled={loading}
          onPress={handleSubmit}
          className={`mt-4 min-h-[56px] rounded-full bg-ink items-center justify-center ${loading ? 'opacity-70' : 'active:opacity-90'}`}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="font-sans-bold text-white text-[17px]">
              {isSignup ? t('auth.createAccount', 'Create account') : t('auth.signIn', 'Sign in')}
            </Text>
          )}
        </Pressable>

        <View className="flex-row items-center gap-3 my-5">
          <View className="flex-1 h-px bg-slate-300" />
          <Text className="text-[13px] font-sans-semibold text-muted">{t('common.or', 'or')}</Text>
          <View className="flex-1 h-px bg-slate-300" />
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={loading}
          onPress={handleGoogle}
          className="min-h-[56px] rounded-full bg-white flex-row items-center justify-center gap-2.5 active:opacity-90"
        >
          <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <Svg width={20} height={20} viewBox="0 0 24 24">
              <Path fill="#4285F4" d="M22.6 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8.1z" />
              <Path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23z" />
              <Path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 0 1 0-4.3V7H2.1a11 11 0 0 0 0 9.9z" />
              <Path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7l3.7 2.9C6.7 7.3 9.1 5.4 12 5.4z" />
            </Svg>
          </View>
          <Text className="font-sans-bold text-ink text-base">{t('auth.continueGoogle', 'Continue with Google')}</Text>
        </Pressable>

        <View className="flex-1" />
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setFormError(null);
            setMode(isSignup ? 'signin' : 'signup');
          }}
          className="mt-6 min-h-[44px] items-center justify-center"
        >
          <Text className="font-sans-bold text-ink text-[15px]">
            {isSignup ? t('auth.haveAccountSignIn', 'Already have an account? Sign in') : t('auth.newHere', 'New here? Create an account')}
          </Text>
        </Pressable>
      </ScrollView>

      <ForgotPasswordModal
        visible={isForgotOpen}
        onClose={() => setIsForgotOpen(false)}
        email={forgotEmail}
        onChangeEmail={setForgotEmail}
        onSubmit={handleSendReset}
        loading={isResetSending}
      />
    </KeyboardAvoidingView>
  );
}
