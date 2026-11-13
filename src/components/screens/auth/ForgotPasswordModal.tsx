import React from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { X, Mail } from 'lucide-react-native';

interface ForgotPasswordModalProps {
  visible: boolean;
  onClose: () => void;
  email: string;
  onChangeEmail: (email: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  visible,
  onClose,
  email,
  onChangeEmail,
  onSubmit,
  loading,
}) => {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end bg-black/60"
      >
        <View className="bg-white rounded-t-3xl p-6 border-t border-slate-200 gap-4">
          <View className="flex-row items-center justify-between pb-2 border-b border-slate-100">
            <Text className="text-base font-bold text-slate-900">Reset Password</Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
            >
              <X size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          <Text className="text-xs text-slate-600 leading-relaxed">
            Enter your registered email address and we will send you a secure one-click link to reset your account password.
          </Text>

          <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-3">
            <Mail size={16} color="#94a3b8" />
            <TextInput
              value={email}
              onChangeText={onChangeEmail}
              placeholder="Registered email address"
              keyboardType="email-address"
              autoCapitalize="none"
              className="flex-1 ml-2.5 text-xs text-slate-800 font-medium"
            />
          </View>

          <TouchableOpacity
            onPress={onSubmit}
            disabled={loading || !email.trim()}
            className="bg-blue-600 py-3.5 rounded-2xl items-center shadow-xs active:scale-98"
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-xs font-bold text-white">Send Password Reset Link</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
