import React, { useState } from 'react';
import { View, Text, Pressable, Alert, Modal } from 'react-native';
import {
  Building2,
  Lock,
  ArrowRight,
  Fingerprint,
  PlusCircle,
  HelpCircle,
  ShieldCheck,
  Check,
  KeyRound,
  X,
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import {
  ScreenWrapper,
  RoleCard,
  Input,
  Button,
  Badge,
  Card,
  type UserRoleType,
} from '@/components/ui';

export default function AuthScreen() {
  const {
    userRole,
    activeInstitute,
    institutes,
    switchRole,
    switchInstitute,
    signIn,
    createInstitute,
    joinInstituteWithCode,
    loading,
  } = useAuth();

  const [identifier, setIdentifier] = useState('98290 41208');
  const [password, setPassword] = useState('password123');
  const [rememberMe, setRememberMe] = useState(true);

  // Modals state
  const [isInstituteModalOpen, setIsInstituteModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isRegisterInstituteOpen, setIsRegisterInstituteOpen] = useState(false);

  // New institute form
  const [newInstName, setNewInstName] = useState('');
  const [newInstCode, setNewInstCode] = useState('');
  const [newInstCity, setNewInstCity] = useState('');

  // Join code form
  const [joinCodeInput, setJoinCodeInput] = useState('');

  const handleSignIn = async () => {
    const res = await signIn(identifier, userRole);
    if (res.success) {
      Alert.alert('Signed In', `Welcome to the ${userRole.toUpperCase()} Workspace!`);
    } else {
      Alert.alert('Sign In Error', res.error);
    }
  };

  const handleBiometricLogin = () => {
    Alert.alert('Biometric Verified', `FaceID / Fingerprint recognized. Signed into ${activeInstitute?.name}`);
  };

  const handleCreateInstitute = async () => {
    if (!newInstName || !newInstCode || !newInstCity) {
      Alert.alert('Validation Error', 'Please fill in all institute fields.');
      return;
    }
    await createInstitute(newInstName, newInstCode, newInstCity);
    setIsRegisterInstituteOpen(false);
    setNewInstName('');
    setNewInstCode('');
    setNewInstCity('');
    Alert.alert('Institute Registered', `Created and activated ${newInstName}!`);
  };

  const handleJoinWithCode = async () => {
    if (!joinCodeInput.trim()) {
      Alert.alert('Validation Error', 'Please enter a valid center code.');
      return;
    }
    const res = await joinInstituteWithCode(joinCodeInput);
    if (res.success) {
      setIsJoinModalOpen(false);
      setJoinCodeInput('');
      Alert.alert('Institute Joined', `Connected to ${res.institute?.name}`);
    } else {
      Alert.alert('Join Error', res.error);
    }
  };

  return (
    <ScreenWrapper
      headerProps={{
        title: 'Authentication & Access',
        instituteName: activeInstitute?.name,
        onInstitutePress: () => setIsInstituteModalOpen(true),
        hasUnreadNotifications: false,
      }}
    >
      {/* Brand Header */}
      <View className="items-center text-center gap-1 my-1">
        <View className="w-14 h-14 rounded-2xl bg-secondary/10 items-center justify-center shadow-sm">
          <Building2 size={28} color="#0051d5" />
        </View>
        <View className="flex-row items-center gap-1.5 mt-1">
          <Text className="text-xl font-bold text-on-surface">Acadly OS</Text>
          <Badge label="v3.4" variant="info" />
        </View>
        <Text className="text-xs text-on-surface-variant text-center max-w-xs">
          Multi-institute academic operating system & coaching ERP
        </Text>
      </View>

      {/* Institute Pill Switcher (from Stitch Auth design) */}
      <Card elevation="low" className="p-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2.5 flex-1 min-w-0 mr-2">
            <View className="w-8 h-8 rounded-lg bg-secondary items-center justify-center shrink-0">
              <Building2 size={16} color="#ffffff" />
            </View>
            <View className="flex-col flex-1 min-w-0">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-sm font-semibold text-on-surface" numberOfLines={1}>
                  {activeInstitute?.name}
                </Text>
                <View className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container" />
              </View>
              <Text className="text-xs text-on-surface-variant" numberOfLines={1}>
                Center Code: <Text className="font-bold text-secondary">{activeInstitute?.center_code}</Text>
              </Text>
            </View>
          </View>

          <Button
            size="sm"
            variant="surface"
            title="Switch"
            onPress={() => setIsInstituteModalOpen(true)}
          />
        </View>
      </Card>

      {/* Role Switcher Section (4-Role Cards from Stitch) */}
      <View className="gap-2">
        <View className="flex-row items-center justify-between px-1">
          <Text className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
            Select Access Workspace
          </Text>
          <Badge
            label={
              userRole === 'admin'
                ? 'Super-Admin'
                : userRole === 'teacher'
                ? 'Faculty Portal'
                : userRole === 'student'
                ? 'Scholar Pass'
                : 'Guardian Desk'
            }
            variant="admin"
          />
        </View>

        <View className="flex-row gap-2">
          <View className="flex-1">
            <RoleCard
              role="admin"
              isSelected={userRole === 'admin'}
              onSelect={(r) => switchRole(r as UserRoleType)}
            />
          </View>
          <View className="flex-1">
            <RoleCard
              role="teacher"
              isSelected={userRole === 'teacher'}
              onSelect={(r) => switchRole(r as UserRoleType)}
            />
          </View>
        </View>

        <View className="flex-row gap-2">
          <View className="flex-1">
            <RoleCard
              role="student"
              isSelected={userRole === 'student'}
              onSelect={(r) => switchRole(r as UserRoleType)}
            />
          </View>
          <View className="flex-1">
            <RoleCard
              role="parent"
              isSelected={userRole === 'parent'}
              onSelect={(r) => switchRole(r as UserRoleType)}
            />
          </View>
        </View>
      </View>

      {/* Credential Sign In Form */}
      <Card elevation="lowest" className="gap-3.5">
        <Input
          label="Registered Identifier"
          rightLabel="Email or Mobile"
          showPhonePrefix
          value={identifier}
          onChangeText={setIdentifier}
          placeholder="e.g. 98290 41208"
        />

        <Input
          label="Portal Password / Security PIN"
          isPassword
          value={password}
          onChangeText={setPassword}
          placeholder="Enter security key"
          leftIcon={<Lock size={16} color="#76777d" />}
        />

        <View className="flex-row items-center justify-between pt-0.5">
          <Pressable
            onPress={() => setRememberMe(!rememberMe)}
            className="flex-row items-center gap-2"
          >
            <View
              className={`w-4 h-4 rounded items-center justify-center border ${
                rememberMe ? 'bg-secondary border-secondary' : 'border-outline-variant bg-transparent'
              }`}
            >
              {rememberMe && <Check size={12} color="#ffffff" strokeWidth={3} />}
            </View>
            <Text className="text-xs text-on-surface-variant font-medium">Keep signed in</Text>
          </Pressable>

          <Pressable onPress={() => Alert.alert('Password Reset', 'Password recovery link sent to registered email.')}>
            <Text className="text-xs font-semibold text-secondary">Forgot password?</Text>
          </Pressable>
        </View>

        <View className="gap-2 pt-1">
          <Button
            variant="primary"
            title={`Sign In to ${userRole.charAt(0).toUpperCase() + userRole.slice(1)} Portal`}
            rightIcon={<ArrowRight size={16} color="#ffffff" />}
            fullWidth
            loading={loading}
            onPress={handleSignIn}
          />

          <Button
            variant="surface"
            title="Instant Biometric Key Pass"
            leftIcon={<Fingerprint size={18} color="#0051d5" />}
            fullWidth
            onPress={handleBiometricLogin}
          />
        </View>
      </Card>

      {/* Institute Registration & Join Code Actions */}
      <View className="gap-2.5 pt-2">
        <View className="flex-row items-center gap-2">
          <View className="h-[1px] bg-outline-variant/30 flex-1" />
          <Text className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
            Institute Management
          </Text>
          <View className="h-[1px] bg-outline-variant/30 flex-1" />
        </View>

        <Button
          variant="secondary"
          title="Join Institute via Center Code"
          leftIcon={<KeyRound size={16} color="#ffffff" />}
          fullWidth
          onPress={() => setIsJoinModalOpen(true)}
        />

        <Button
          variant="outline"
          title="Register New Institute / Academy"
          leftIcon={<PlusCircle size={16} color="#0b1c30" />}
          fullWidth
          onPress={() => setIsRegisterInstituteOpen(true)}
        />

        <View className="flex-row items-center justify-center gap-4 mt-2">
          <Pressable
            onPress={() => Alert.alert('Support Desk', 'Acadly 24/7 Support: support@acadly.app')}
            className="flex-row items-center gap-1"
          >
            <HelpCircle size={14} color="#76777d" />
            <Text className="text-xs text-on-surface-variant">Support Desk</Text>
          </Pressable>
          <Text className="text-xs text-outline-variant">•</Text>
          <View className="flex-row items-center gap-1">
            <ShieldCheck size={14} color="#76777d" />
            <Text className="text-xs text-on-surface-variant">ISO 27001 Data Privacy</Text>
          </View>
        </View>
      </View>

      {/* MODAL 1: Switch Institute */}
      <Modal visible={isInstituteModalOpen} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-surface rounded-t-3xl p-5 gap-3.5 max-h-[80%]">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold text-on-surface">Switch Institute</Text>
              <Pressable onPress={() => setIsInstituteModalOpen(false)}>
                <X size={20} color="#0b1c30" />
              </Pressable>
            </View>

            {institutes.map((inst) => (
              <Pressable
                key={inst.id}
                onPress={() => {
                  switchInstitute(inst.id);
                  setIsInstituteModalOpen(false);
                }}
                className={`p-3.5 rounded-xl border flex-row items-center justify-between ${
                  activeInstitute?.id === inst.id
                    ? 'bg-secondary/10 border-secondary'
                    : 'bg-surface-container-low border-transparent'
                }`}
              >
                <View className="flex-1 pr-2">
                  <Text className="text-sm font-bold text-on-surface">{inst.name}</Text>
                  <Text className="text-xs text-on-surface-variant">
                    {inst.city} Campus • Code: <Text className="font-semibold text-secondary">{inst.center_code}</Text>
                  </Text>
                </View>
                {activeInstitute?.id === inst.id && <Check size={18} color="#0051d5" />}
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>

      {/* MODAL 2: Join with Code */}
      <Modal visible={isJoinModalOpen} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-surface rounded-t-3xl p-5 gap-3.5">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold text-on-surface">Join Institute by Code</Text>
              <Pressable onPress={() => setIsJoinModalOpen(false)}>
                <X size={20} color="#0b1c30" />
              </Pressable>
            </View>

            <Input
              label="Institute Center Code"
              placeholder="e.g. APX-9021 or PIN-4410"
              value={joinCodeInput}
              onChangeText={setJoinCodeInput}
              autoCapitalize="characters"
            />

            <Button
              variant="secondary"
              title="Verify & Join"
              fullWidth
              onPress={handleJoinWithCode}
            />
          </View>
        </View>
      </Modal>

      {/* MODAL 3: Register New Institute */}
      <Modal visible={isRegisterInstituteOpen} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-surface rounded-t-3xl p-5 gap-3 max-h-[85%]">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold text-on-surface">Register New Institute</Text>
              <Pressable onPress={() => setIsRegisterInstituteOpen(false)}>
                <X size={20} color="#0b1c30" />
              </Pressable>
            </View>

            <Input
              label="Institute / Coaching Name"
              placeholder="e.g. Resonance Academy"
              value={newInstName}
              onChangeText={setNewInstName}
            />

            <Input
              label="Unique Center Code"
              placeholder="e.g. RES-101"
              value={newInstCode}
              onChangeText={setNewInstCode}
              autoCapitalize="characters"
            />

            <Input
              label="City / Campus Location"
              placeholder="e.g. Jaipur"
              value={newInstCity}
              onChangeText={setNewInstCity}
            />

            <Button
              variant="primary"
              title="Create Institute Workspace"
              fullWidth
              onPress={handleCreateInstitute}
            />
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}
