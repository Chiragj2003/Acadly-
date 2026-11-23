import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { X } from 'lucide-react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { ChildStudent } from '@/context/ChildContext';
import { DisplayTitle, Eyebrow } from '@/components/ui';

interface LinkChildModalProps {
  visible: boolean;
  onClose: () => void;
  onLinkChild: (code: string) => Promise<{ success: boolean; child?: ChildStudent; error?: string }>;
}

/** Decorative: two phones joined by a dotted line. */
const LinkArt = () => (
  <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="items-center my-3">
    <Svg width={200} height={150} viewBox="0 0 200 150">
      <Rect x={20} y={40} width={74} height={96} rx={18} fill="#F6C6DD" stroke="#1C1C1E" strokeWidth={1.5} />
      <Rect x={106} y={22} width={74} height={114} rx={18} fill="#C9DCF4" stroke="#1C1C1E" strokeWidth={1.5} />
      <Circle cx={57} cy={72} r={12} fill="#FFFFFF" stroke="#1C1C1E" strokeWidth={1.5} />
      <Circle cx={143} cy={58} r={14} fill="#FFFFFF" stroke="#1C1C1E" strokeWidth={1.5} />
      <Path d="M72 108h56" stroke="#1C1C1E" strokeWidth={1.5} strokeDasharray="4 5" strokeLinecap="round" />
      <Circle cx={100} cy={108} r={9} fill="#3DBE6B" stroke="#1C1C1E" strokeWidth={1.5} />
    </Svg>
  </View>
);

/** Soft Desk "Link a child": one code field and one black pill. */
export const LinkChildModal: React.FC<LinkChildModalProps> = ({ visible, onClose, onLinkChild }) => {
  const [code, setCode] = useState('');
  const [isLinking, setIsLinking] = useState(false);

  const handleSubmit = async () => {
    if (!code.trim()) {
      Alert.alert('Code needed', 'Enter the code from your child’s Acadly app.');
      return;
    }
    setIsLinking(true);
    const res = await onLinkChild(code.trim());
    setIsLinking(false);

    if (res.success && res.child) {
      onClose();
      setCode('');
      Alert.alert('Linked', `${res.child.full_name} is now on your Acadly.`);
    } else {
      Alert.alert('Couldn’t link', res.error || 'Check the code with your child or their teacher.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-paper">
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingTop: 48, flexGrow: 1 }}>
          <View className="flex-row justify-end">
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} className="w-11 h-11 items-end justify-center">
              <X size={24} color="#1C1C1E" />
            </TouchableOpacity>
          </View>

          <Eyebrow center className="mt-2">Add a child</Eyebrow>
          <DisplayTitle center className="mt-2">Enter the code{'\n'}from your child&apos;s app</DisplayTitle>
          <Text className="font-sans text-slate-600 text-[15px] leading-[21px] text-center mt-2.5 px-4">
            Your child finds it under Account → Invite a parent. Their institute may also link you automatically.
          </Text>

          <LinkArt />

          <Text className="font-sans-bold text-muted text-[13px] px-1.5 mb-2">Student code</Text>
          <TextInput
            accessibilityLabel="Student code"
            value={code}
            onChangeText={(v) => setCode(v.toUpperCase())}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder="STU-XXXX"
            placeholderTextColor="#8C877E"
            className="h-[62px] rounded-[22px] bg-white border-[1.5px] border-ink text-center font-serif text-ink text-[26px]"
          />

          <View className="flex-1 min-h-[24px]" />
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={{ disabled: isLinking, busy: isLinking }}
            disabled={isLinking}
            onPress={handleSubmit}
            className={`min-h-[56px] rounded-full bg-ink items-center justify-center ${isLinking ? 'opacity-60' : ''}`}
          >
            {isLinking ? <ActivityIndicator color="#FFFFFF" /> : <Text className="font-sans-bold text-white text-[17px]">Link child</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};
