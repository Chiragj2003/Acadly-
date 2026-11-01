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
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Building,
  GraduationCap,
  Users,
  Home,
  UserCheck,
} from 'lucide-react-native';

import { useAuth } from '@/context/AuthContext';
import { useInstitute } from '@/context/InstituteContext';
import { Mascot } from '@/components/ui/Mascot';
import { UserRole } from '@/types/database';

export default function CleanAuthScreen() {
  const router = useRouter();
  const { signIn, signInWithGoogle, signUp, switchRole, loading } = useAuth();
  const { currentInstitute } = useInstitute();

  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Handle direct navigation to the role's screen
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

  // Email / Password submission
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
      const res = await signUp(fullName, email, selectedRole);
      if (res.success) {
        Alert.alert('Account Created! 🌸', `Welcome to Acadly, ${fullName}!`);
        navigateToRoleScreen(selectedRole);
      } else {
        Alert.alert('Registration Failed', res.error || 'Please try again.');
      }
    } else {
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
      subtitle: 'Watch lectures, solve daily DPPs & view notes',
      emoji: '🌱',
      badge: 'Learner',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-300',
    },
    {
      id: 'teacher',
      title: 'Teacher / Faculty 🍎',
      subtitle: 'Mark roll call, publish video classes & grade homework',
      emoji: '👨‍🏫',
      badge: 'Faculty',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-300',
    },
    {
      id: 'parent',
      title: 'Parent / Guardian 🏡',
      subtitle: 'Monitor child attendance, report cards & pay fees via UPI',
      emoji: '🏡',
      badge: 'Family',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-300',
    },
    {
      id: 'admin',
      title: 'Director / Admin 🏫',
      subtitle: 'Manage academy batches, faculty schedules & admissions',
      emoji: '🏫',
      badge: 'Director',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-300',
    },
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-cute-cream"
    >
      <ScrollView
        contentContainerClassName="p-5 pt-12 pb-16"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 1. Header with Mascot Pip */}
        <View className="items-center mb-6">
          <Mascot
            mood="happy"
            size="md"
            showSpeechBubble
            speechText={`Hi! Welcome to ${currentInstitute?.name || 'Acadly'} 🌸`}
          />
          <Text className="text-3xl font-black text-cute-cocoa tracking-tight mt-2 text-center">
            Acadly Learning
          </Text>
          <Text className="text-xs font-semibold text-cute-muted text-center mt-1">
            Tuition & Coaching Management Hub
          </Text>
        </View>

        {/* 2. Step 1: Select Your Role */}
        <View className="mb-5">
          <View className="flex-row items-center justify-between mb-2.5 px-1">
            <Text className="text-xs font-extrabold text-cute-cocoa uppercase tracking-wider">
              Step 1: Who are you joining as?
            </Text>
            <View className="bg-cute-peach-light px-2 py-0.5 rounded-full border border-cute-peach">
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
                <Text className="text-xs font-bold text-cute-cocoa mb-1">Full Name</Text>
                <TextInput
                  placeholder="e.g. Amelia Sharma"
                  placeholderTextColor="#a89993"
                  value={fullName}
                  onChangeText={setFullName}
                  className="bg-cute-cream border border-cute-border rounded-2xl px-4 py-2.5 text-xs text-cute-cocoa font-medium"
                />
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
              className="bg-cute-peach py-3 rounded-2xl items-center mt-2 shadow-xs active:scale-98"
            >
              <Text className="text-xs font-extrabold text-white">
                {loading
                  ? 'Please wait...'
                  : authMode === 'signup'
                  ? `Create ${selectedRole.toUpperCase()} Account 🌸`
                  : `Sign In as ${selectedRole.toUpperCase()} →`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. Instant 1-Tap Quick Test Logins */}
        <View className="bg-cute-cream border-2 border-cute-border rounded-3xl p-4 shadow-xs">
          <View className="flex-row items-center gap-1.5 mb-2.5">
            <Sparkles size={16} color="#ff7d6b" />
            <Text className="text-xs font-extrabold text-cute-cocoa uppercase tracking-wider">
              Instant 1-Click Testing (Demo Mode)
            </Text>
          </View>
          <Text className="text-[11px] text-cute-muted mb-3 leading-snug">
            Jump straight into each role's distinct mobile experience without typing passwords:
          </Text>

          <View className="gap-2">
            <TouchableOpacity
              onPress={() => handleQuickDemo('student')}
              className="bg-white border border-cute-border py-2.5 px-3 rounded-2xl flex-row items-center justify-between"
            >
              <View className="flex-row items-center gap-2">
                <Text className="text-lg">🌱</Text>
                <Text className="text-xs font-bold text-cute-cocoa">Enter as Student (Amelia Sharma)</Text>
              </View>
              <Text className="text-xs font-bold text-cute-peach">→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleQuickDemo('teacher')}
              className="bg-white border border-cute-border py-2.5 px-3 rounded-2xl flex-row items-center justify-between"
            >
              <View className="flex-row items-center gap-2">
                <Text className="text-lg">🍎</Text>
                <Text className="text-xs font-bold text-cute-cocoa">Enter as Teacher (Prof. Vikram)</Text>
              </View>
              <Text className="text-xs font-bold text-cute-peach">→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleQuickDemo('parent')}
              className="bg-white border border-cute-border py-2.5 px-3 rounded-2xl flex-row items-center justify-between"
            >
              <View className="flex-row items-center gap-2">
                <Text className="text-lg">🏡</Text>
                <Text className="text-xs font-bold text-cute-cocoa">Enter as Parent (Sunita Sharma)</Text>
              </View>
              <Text className="text-xs font-bold text-cute-peach">→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleQuickDemo('admin')}
              className="bg-white border border-cute-border py-2.5 px-3 rounded-2xl flex-row items-center justify-between"
            >
              <View className="flex-row items-center gap-2">
                <Text className="text-lg">🏫</Text>
                <Text className="text-xs font-bold text-cute-cocoa">Enter as Director (Dr. Sharma)</Text>
              </View>
              <Text className="text-xs font-bold text-cute-peach">→</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
