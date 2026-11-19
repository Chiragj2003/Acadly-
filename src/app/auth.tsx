import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type UserRole } from '@/types/database';
import { RoleSelector } from '@/components/screens/auth/RoleSelector';
import { DisplayTitle, Eyebrow } from '@/components/ui';

/**
 * Sign-in, screen 1 of 2: "Who's using Acadly today?"
 * The chosen role shapes sign-up (what we ask for); where a user lands after
 * signing in always comes from their server-granted role.
 */
export default function ChooseRoleScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [role, setRole] = useState<UserRole>('student');

  const roleLabel: Record<UserRole, string> = {
    student: t('roles.student', 'student'),
    teacher: t('roles.teacher', 'teacher'),
    parent: t('roles.parent', 'parent'),
    admin: t('roles.institute', 'institute'),
  };

  return (
    <View className="flex-1 bg-paper" style={{ paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 20) }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}>
        <View className="h-12 items-center justify-center" accessibilityLabel="Step 1 of 2">
          <View className="flex-row gap-1.5">
            <View className="w-[22px] h-2 rounded-full bg-ink" />
            <View className="w-2 h-2 rounded-full bg-slate-300" />
          </View>
        </View>

        <View className="mt-6 mb-6 gap-2">
          <DisplayTitle center>{t('auth.whoTitle', 'Who’s using\nAcadly today?')}</DisplayTitle>
          <Eyebrow center className="text-[15px] leading-[21px] px-4">
            {t('auth.whoSubtitle', 'You can add more roles later — a teacher can also run their own tuition.')}
          </Eyebrow>
        </View>

        <RoleSelector selectedRole={role} onSelectRole={setRole} />
      </ScrollView>

      <View className="px-5 gap-2">
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/sign-in', params: { role, mode: 'signup' } })}
          className="min-h-[56px] rounded-full bg-ink items-center justify-center active:opacity-90"
        >
          <Text className="font-sans-bold text-white text-[17px]">
            {t('auth.continueAs', 'Continue as {{role}}', { role: roleLabel[role] })}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/sign-in', params: { role, mode: 'signin' } })}
          className="min-h-[48px] items-center justify-center"
        >
          <Text className="font-sans-bold text-ink text-[15px]">
            {t('auth.haveAccount', 'I already have an account')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
