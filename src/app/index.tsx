import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Mascot } from '@/components/ui/Mascot';

export default function RootIndex() {
  const { user, userRole, loading } = useAuth();

  // Show cute splash state while determining authentication status
  if (loading) {
    return (
      <View className="flex-1 bg-[#F8FAFC] items-center justify-center p-6">
        <Mascot mood="happy" size="lg" />
        <View className="mt-5 items-center">
          <Text className="text-2xl font-black text-slate-900 tracking-tight">
            Acadly
          </Text>
          <Text className="text-sm font-semibold text-slate-600 mt-1 text-center">
            Empowering students, educators & parents
          </Text>
        </View>
        <ActivityIndicator size="small" color="#2563EB" style={{ marginTop: 24 }} />
      </View>
    );
  }

  // If user is not authenticated (e.g. first time opening the app), always route to /auth
  if (!user) {
    return <Redirect href="/auth" />;
  }

  // If authenticated, route to the user's role-specific portal
  switch (userRole) {
    case 'teacher':
      return <Redirect href="/teacher" />;
    case 'admin':
      return <Redirect href="/admin" />;
    case 'parent':
      return <Redirect href="/parent" />;
    case 'student':
    default:
      return <Redirect href="/student" />;
  }
}
