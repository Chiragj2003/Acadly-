import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { X } from 'lucide-react-native';
import { ChildStudent } from '@/context/ChildContext';

interface LinkChildModalProps {
  visible: boolean;
  onClose: () => void;
  onLinkChild: (code: string) => Promise<{ success: boolean; child?: ChildStudent; error?: string }>;
}

export const LinkChildModal: React.FC<LinkChildModalProps> = ({
  visible,
  onClose,
  onLinkChild,
}) => {
  const [childCodeInput, setChildCodeInput] = useState('');
  const [isLinkingChild, setIsLinkingChild] = useState(false);

  const handleSubmit = async () => {
    if (!childCodeInput.trim()) {
      Alert.alert('Required', 'Please enter a Student Link Code or registered phone number.');
      return;
    }
    setIsLinkingChild(true);
    const res = await onLinkChild(childCodeInput.trim());
    setIsLinkingChild(false);

    if (res.success && res.child) {
      onClose();
      setChildCodeInput('');
      Alert.alert('Child Linked', `Successfully connected ${res.child.full_name} to your parent portal.`);
    } else {
      Alert.alert('Not Found', res.error || 'Could not verify student code. Please check with the tuition teacher.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
        className="flex-1 justify-end bg-black/50"
      >
        <View className="bg-white rounded-t-3xl p-6 gap-3.5 max-h-[85%] border-t border-slate-200">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-display text-slate-900">Link Another Child</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color="#6E6A63" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ gap: 14, paddingBottom: 36 }}
          >
            <Text className="text-xs text-slate-500 leading-relaxed">
              Enter your ward's unique Student Link Code (provided by their tuition teacher, e.g. STU-AMELIA-902) or the student's registered mobile number.
            </Text>

            <TextInput
              placeholder="e.g. STU-AMELIA-902 or 9823044551"
              placeholderTextColor="#8C877E"
              value={childCodeInput}
              onChangeText={setChildCodeInput}
              autoCapitalize="characters"
              className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-sans-bold"
            />

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isLinkingChild}
              className="bg-blue-600 py-3 rounded-2xl items-center shadow-xs mt-1 active:scale-98"
            >
              <Text className="text-xs font-sans-bold text-white">
                {isLinkingChild ? 'Verifying Student Code...' : 'Verify & Link Child'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
