import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { KeyRound, Lock, ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleResetPassword = async () => {
    setErrorMsg(null);

    const cleanPass = password.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanPass || cleanPass.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (cleanPass !== cleanConfirm) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    if (!isSupabaseConfigured) {
      setErrorMsg('Authentication service is unavailable. Please check your configuration.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: cleanPass,
      });

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      setIsSuccess(true);
      Alert.alert(
        'Password Updated Successfully',
        'Your account password has been updated. Please sign in with your new credentials.',
        [{ text: 'Sign In Now', onPress: () => router.replace('/auth') }]
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to update password';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: 24,
        }}
        keyboardShouldPersistTaps="handled"
        className="flex-1"
      >
        <TouchableOpacity
          onPress={() => router.replace('/auth')}
          className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center mb-6"
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color="#3B372F" />
        </TouchableOpacity>

        <View className="items-center mb-8">
          <View className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 items-center justify-center mb-4">
            <KeyRound size={32} color="#1C1C1E" />
          </View>
          <Text className="text-2xl font-display text-slate-900 tracking-tight">
            Create New Password
          </Text>
          <Text className="text-sm text-slate-500 mt-2 text-center max-w-xs">
            Enter a strong, secure password for your Acadly account.
          </Text>
        </View>

        {errorMsg && (
          <View className="p-3.5 rounded-xl bg-pastel-pink-soft border border-pastel-pink mb-5">
            <Text className="text-xs font-sans-bold text-red-700">{errorMsg}</Text>
          </View>
        )}

        {isSuccess && (
          <View className="p-3.5 rounded-xl bg-pastel-mint-soft border border-pastel-mint mb-5 flex-row items-center gap-2">
            <CheckCircle2 size={16} color="#059669" />
            <Text className="text-xs font-sans-bold text-emerald-800">
              Password successfully updated! Redirecting...
            </Text>
          </View>
        )}

        <View className="gap-4 mb-6">
          <View>
            <Text className="text-xs font-sans-bold text-slate-700 mb-1.5">
              New Password
            </Text>
            <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3">
              <Lock size={18} color="#6E6A63" />
              <TextInput
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  setErrorMsg(null);
                }}
                placeholder="At least 6 characters"
                placeholderTextColor="#8C877E"
                secureTextEntry
                autoCapitalize="none"
                className="flex-1 ml-2.5 text-sm font-sans-semibold text-slate-900"
              />
            </View>
          </View>

          <View>
            <Text className="text-xs font-sans-bold text-slate-700 mb-1.5">
              Confirm New Password
            </Text>
            <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3">
              <ShieldCheck size={18} color="#6E6A63" />
              <TextInput
                value={confirmPassword}
                onChangeText={(t) => {
                  setConfirmPassword(t);
                  setErrorMsg(null);
                }}
                placeholder="Re-enter your password"
                placeholderTextColor="#8C877E"
                secureTextEntry
                autoCapitalize="none"
                className="flex-1 ml-2.5 text-sm font-sans-semibold text-slate-900"
              />
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleResetPassword}
          disabled={loading || isSuccess}
          activeOpacity={0.85}
          className={`w-full py-4 rounded-xl items-center justify-center bg-blue-600 ${
            loading || isSuccess ? 'opacity-60' : ''
          }`}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-base font-display text-white">Save New Password</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.replace('/auth')}
          activeOpacity={0.7}
          className="mt-6 items-center"
        >
          <Text className="text-sm font-sans-bold text-slate-600">
            Cancel & Return to <Text className="text-blue-600 font-display">Sign In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
