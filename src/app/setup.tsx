import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { type UserRole } from '@/types/database';
import { DisplayTitle, Eyebrow } from '@/components/ui';

const HOME: Record<UserRole, '/student' | '/teacher' | '/parent' | '/admin'> = {
  student: '/student',
  teacher: '/teacher',
  parent: '/parent',
  admin: '/admin',
};

const Field: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  caps?: boolean;
  last?: boolean;
}> = ({ label, value, onChange, placeholder, caps = false, last = false }) => (
  <View className={`py-2.5 ${last ? '' : 'border-b border-hairline'}`}>
    <Text className="font-sans-bold text-muted text-xs mb-0.5">{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor="#8C877E"
      autoCapitalize={caps ? 'characters' : 'words'}
      className="font-sans text-ink text-[17px] min-h-[30px]"
    />
  </View>
);

/**
 * In-app setup after the first sign-in. Sign-up only asks for name, email and
 * password; this is where a teacher joins an institute (or registers their own
 * tuition), an institute registers, and a parent links their child.
 */
export default function SetupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ role?: string }>();
  const role = (['teacher', 'admin', 'parent'].includes(params.role ?? '') ? params.role : 'teacher') as UserRole;
  const { completeRoleSetup, userRole, loading } = useAuth();

  const [ownTuition, setOwnTuition] = useState(role === 'admin');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isInstitute = role === 'admin' || (role === 'teacher' && ownTuition);

  const handleFinish = async () => {
    setError(null);
    const result = isInstitute
      ? await completeRoleSetup('admin', { instituteName: name, instituteCity: city })
      : role === 'teacher'
        ? await completeRoleSetup('teacher', { teacherInstituteCode: code })
        : await completeRoleSetup('parent', { parentStudentCode: code });
    if (result.success) router.replace(HOME[result.role ?? userRole]);
    else setError(result.error || 'Something went wrong. Please try again.');
  };

  const title = isInstitute ? 'Set up your tuition' : role === 'teacher' ? 'Join your institute' : 'Link your child';
  const subtitle = isInstitute
    ? 'Add your tuition or institute. You can invite students and teachers next.'
    : role === 'teacher'
      ? 'Enter the code your institute gave you.'
      : 'Enter the student code from your child’s institute.';

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-paper">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 16) + 24,
          paddingBottom: Math.max(insets.bottom, 24),
          paddingHorizontal: 20,
          flexGrow: 1,
        }}
      >
        <View className="mb-6 gap-2">
          <DisplayTitle center>{title}</DisplayTitle>
          <Eyebrow center className="text-[15px]">
            {subtitle}
          </Eyebrow>
        </View>

        <View className="bg-white rounded-3xl px-4 py-1">
          {isInstitute ? (
            <>
              <Field label="Tuition / institute name" value={name} onChange={setName} placeholder="e.g. Sharma Classes" />
              <Field label="City" value={city} onChange={setCity} placeholder="e.g. Kota" last />
            </>
          ) : (
            <Field
              label={role === 'teacher' ? 'Institute code' : 'Student code'}
              value={code}
              onChange={setCode}
              placeholder={role === 'teacher' ? 'e.g. APEX2026' : 'e.g. STU-ZOYA-204'}
              caps
              last
            />
          )}
        </View>

        {role === 'teacher' && (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setError(null);
              setOwnTuition((v) => !v);
            }}
            className="self-center min-h-[44px] justify-center mt-1"
          >
            <Text className="font-sans-bold text-ink text-[15px] underline">
              {ownTuition ? 'I have an institute code' : 'I teach on my own'}
            </Text>
          </Pressable>
        )}

        {error ? (
          <View accessibilityLiveRegion="polite" className="mt-4 bg-pastel-pink rounded-2xl px-4 py-3">
            <Text className="font-sans-semibold text-ink text-sm leading-5">{error}</Text>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: loading, busy: loading }}
          disabled={loading}
          onPress={handleFinish}
          className={`mt-4 min-h-[56px] rounded-full bg-ink items-center justify-center ${loading ? 'opacity-70' : 'active:opacity-90'}`}
        >
          {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text className="font-sans-bold text-white text-[17px]">Continue</Text>}
        </Pressable>

        <View className="flex-1" />
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace(HOME[userRole])}
          className="mt-6 min-h-[44px] items-center justify-center"
        >
          <Text className="font-sans-bold text-muted text-[15px]">Do this later</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
