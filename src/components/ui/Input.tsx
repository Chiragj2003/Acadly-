import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  type TextInputProps,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

export interface InputProps extends TextInputProps {
  label?: string;
  rightLabel?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPhonePrefix?: boolean;
  isPassword?: boolean;
  containerClassName?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  rightLabel,
  error,
  helperText,
  leftIcon,
  rightIcon,
  showPhonePrefix = false,
  isPassword = false,
  containerClassName = '',
  secureTextEntry,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const shouldSecureText = isPassword ? !isPasswordVisible : secureTextEntry;

  return (
    <View className={`flex-col gap-1.5 ${containerClassName}`}>
      {(label || rightLabel) && (
        <View className="flex-row items-center justify-between">
          {label && (
            <Text className="text-sm font-bold text-slate-800 dark:text-slate-200">{label}</Text>
          )}
          {rightLabel && (
            <Text className="text-xs text-slate-500 dark:text-slate-400 font-medium">{rightLabel}</Text>
          )}
        </View>
      )}

      <View
        className={`flex-row items-center rounded-xl overflow-hidden min-h-[44px] ${
          error
            ? 'bg-rose-50 border border-rose-300 dark:bg-rose-950/40 dark:border-rose-800'
            : isFocused
            ? 'bg-white dark:bg-slate-900 border-2 border-blue-600 shadow-xs'
            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs'
        }`}
      >
        {showPhonePrefix && (
          <View className="flex-row items-center px-3 py-3 bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700">
            <Text className="text-sm font-bold text-slate-900 dark:text-slate-100">🇮🇳 +91</Text>
          </View>
        )}

        {leftIcon && !showPhonePrefix && (
          <View className="pl-3.5 pr-1 items-center justify-center">
            {leftIcon}
          </View>
        )}

        <TextInput
          placeholderTextColor="#64748b"
          accessibilityLabel={textInputProps.accessibilityLabel || label || 'Input field'}
          className="flex-1 py-3 px-3.5 text-sm text-slate-900 dark:text-slate-100 font-medium min-h-[44px]"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={shouldSecureText}
          {...textInputProps}
        />

        {isPassword && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            className="p-3 min-w-[44px] min-h-[44px] items-center justify-center"
          >
            {isPasswordVisible ? (
              <EyeOff size={18} color="#64748B" />
            ) : (
              <Eye size={18} color="#64748B" />
            )}
          </Pressable>
        )}

        {!isPassword && rightIcon && (
          <View className="pr-3.5 pl-1 items-center justify-center">
            {rightIcon}
          </View>
        )}
      </View>

      {error ? (
        <Text className="text-xs text-rose-600 font-semibold px-1">{error}</Text>
      ) : helperText ? (
        <Text className="text-xs text-slate-500 font-medium px-1">{helperText}</Text>
      ) : null}
    </View>
  );
};
