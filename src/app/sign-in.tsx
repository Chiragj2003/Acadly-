import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { checkRateLimit } from '@/lib/rateLimiter';
import { type UserRole } from '@/types/database';
import { DisplayTitle, Eyebrow } from '@/components/ui';
import { ForgotPasswordModal } from '@/components/screens/auth/ForgotPasswordModal';

const ROLES: UserRole[] = ['student', 'teacher', 'parent', 'admin'];
const HOME: Record<UserRole, '/student' | '/teacher' | '/parent' | '/admin'> = {
  student: '/student',
  teacher: '/teacher',
  parent: '/parent',
  admin: '/admin',
};

type Mode = 'signin' | 'signup' | 'otp';

/** One labelled field inside the white grouped card. */
const Field: React.FC<{ label: string; last?: boolean; children: React.ReactNode }> = ({ label, last = false, children }) => (
  <View className={`py-2.5 ${last ? '' : 'border-b border-hairline'}`}>
    <Text className="font-sans-bold text-muted text-xs mb-0.5">{label}</Text>
    {children}
  </View>
);

const inputClass = 'font-sans text-ink text-[17px] min-h-[30px]';

/**
 * Screen 2 of 2: email + password.
 * Sign up = name, email, password, then the 6-digit code from the email.
 * Teacher / institute / parent details are filled in later inside the app (/setup).
 */
export default function SignInScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ role?: string; mode?: string }>();
  const role: UserRole = ROLES.includes(params.role as UserRole) ? (params.role as UserRole) : 'student';

  const { signIn, signUp, verifySignUpOtp, resendSignUpOtp, sendPasswordReset, loading } = useAuth();

  const [mode, setMode] = useState<Mode>(params.mode === 'signup' ? 'signup' : 'signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isResetSending, setIsResetSending] = useState(false);

  const switchMode = (next: Mode) => {
    setFormError(null);
    setNotice(null);
    setMode(next);
  };

  /** Land on the right home. A new teacher / institute / parent finishes setup inside the app first. */
  const afterAuth = (granted: UserRole) => {
    if (role !== 'student' && granted === 'student') {
      router.replace({ pathname: '/setup', params: { role } });
    } else {
      router.replace(HOME[granted]);
    }
  };

  const handleSubmit = async () => {
    setFormError(null);
    setNotice(null);
    const cleanEmail = email.trim().toLowerCase();

    if (mode === 'otp') {
      const result = await verifySignUpOtp(cleanEmail, otp);
      if (result.success) afterAuth(result.role ?? 'student');
      else setFormError(result.error || t('auth.otpFailed', 'Could not verify the code.'));
      return;
    }

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

    if (mode === 'signin') {
      const result = await signIn(cleanEmail, password);
      if (result.success && result.role) afterAuth(result.role);
      else setFormError(result.error || t('auth.signInFailed', 'Could not sign you in.'));
      return;
    }

    const result = await signUp(fullName, cleanEmail, password);
    if (!result.success) {
      setFormError(result.error || t('auth.signUpFailed', 'Could not create your account.'));
      return;
    }
    if (result.needsOtp) {
      setOtp('');
      setMode('otp');
      return;
    }
    afterAuth(result.role ?? 'student');
  };

  const handleResend = async () => {
    setFormError(null);
    const result = await resendSignUpOtp(email);
    if (result.success) setNotice(t('auth.otpResent', 'New code sent. Check your inbox and spam folder.'));
    else setFormError(result.error || null);
  };

  const handleSendReset = async () => {
    setIsResetSending(true);
    try {
      const result = await sendPasswordReset(forgotEmail);
      // Inline messages, not Alert.alert: Alert does nothing on web.
      setIsForgotOpen(false);
      if (result.success) {
        setFormError(null);
        setNotice(
          t('auth.resetSentBody', 'If an account exists for {{email}}, a reset link is on its way.', { email: forgotEmail.trim() })
        );
        setForgotEmail('');
      } else {
        setFormError(result.error || t('auth.resetFailedTitle', 'Couldn’t send the link'));
      }
    } finally {
      setIsResetSending(false);
    }
  };

  const title =
    mode === 'otp'
      ? t('auth.otpTitle', 'Check your email')
      : mode === 'signup'
        ? t('auth.createTitle', 'Create your account')
        : t('auth.welcomeBack', 'Welcome back');
  const subtitle =
    mode === 'otp'
      ? t('auth.otpSubtitle', 'Enter the 6-digit code we sent to {{email}}', { email: email.trim().toLowerCase() })
      : mode === 'signup'
        ? t('auth.createSubtitle', 'Just your name, email and a password.')
        : t('auth.signInSubtitle', 'Sign in with your email and password.');
  const buttonLabel =
    mode === 'otp' ? t('auth.verify', 'Verify') : mode === 'signup' ? t('auth.createAccount', 'Create account') : t('auth.signIn', 'Sign in');

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
            onPress={() => {
              if (mode === 'otp') return switchMode('signup');
              if (router.canGoBack()) router.back();
              else router.replace('/auth');
            }}
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
          <DisplayTitle center>{title}</DisplayTitle>
          <Eyebrow center className="text-[15px]">
            {subtitle}
          </Eyebrow>
        </View>

        {mode === 'otp' ? (
          <View className="bg-white rounded-3xl px-4 py-4">
            <TextInput
              value={otp}
              onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              maxLength={6}
              autoFocus
              placeholder="••••••"
              placeholderTextColor="#C9C4BA"
              accessibilityLabel={t('auth.otpLabel', '6-digit code')}
              className="font-display text-ink text-[34px] text-center tracking-[12px] min-h-[52px]"
            />
          </View>
        ) : (
          <View className="bg-white rounded-3xl px-4 py-1">
            {mode === 'signup' && (
              <Field label={t('auth.fullName', 'Full name')}>
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  autoComplete="name"
                  textContentType="name"
                  placeholder={t('auth.fullNamePlaceholder', 'Your name')}
                  placeholderTextColor="#8C877E"
                  className={inputClass}
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
                className={inputClass}
              />
            </Field>
            <Field label={t('auth.password', 'Password')} last>
              <View className="flex-row items-center">
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  onSubmitEditing={handleSubmit}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  textContentType={mode === 'signup' ? 'newPassword' : 'password'}
                  placeholder={mode === 'signup' ? t('auth.passwordHint', 'At least 8 characters') : '••••••••'}
                  placeholderTextColor="#8C877E"
                  className={`flex-1 ${inputClass}`}
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
        )}

        {mode === 'signin' && (
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

        {formError ? (
          <View accessibilityLiveRegion="polite" className="mt-4 bg-pastel-pink rounded-2xl px-4 py-3">
            <Text className="font-sans-semibold text-ink text-sm leading-5">{formError}</Text>
          </View>
        ) : null}
        {notice ? (
          <View accessibilityLiveRegion="polite" className="mt-4 bg-pastel-mint rounded-2xl px-4 py-3">
            <Text className="font-sans-semibold text-ink text-sm leading-5">{notice}</Text>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: loading, busy: loading }}
          disabled={loading}
          onPress={handleSubmit}
          className={`mt-4 min-h-[56px] rounded-full bg-ink items-center justify-center ${loading ? 'opacity-70' : 'active:opacity-90'}`}
        >
          {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text className="font-sans-bold text-white text-[17px]">{buttonLabel}</Text>}
        </Pressable>

        {mode === 'otp' && (
          <Pressable accessibilityRole="button" onPress={handleResend} className="mt-2 min-h-[44px] items-center justify-center">
            <Text className="font-sans-bold text-ink text-[15px]">{t('auth.resendCode', 'Send a new code')}</Text>
          </Pressable>
        )}

        <View className="flex-1" />
        {mode !== 'otp' && (
          <Pressable
            accessibilityRole="button"
            onPress={() => switchMode(mode === 'signup' ? 'signin' : 'signup')}
            className="mt-6 min-h-[44px] items-center justify-center"
          >
            <Text className="font-sans-bold text-ink text-[15px]">
              {mode === 'signup'
                ? t('auth.haveAccountSignIn', 'Already have an account? Sign in')
                : t('auth.newHere', 'New here? Create an account')}
            </Text>
          </Pressable>
        )}
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
