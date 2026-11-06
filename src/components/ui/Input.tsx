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
            <Text className="text-sm font-semibold text-on-surface">{label}</Text>
          )}
          {rightLabel && (
            <Text className="text-xs text-on-surface-variant">{rightLabel}</Text>
          )}
        </View>
      )}

      <View
        className={`flex-row items-center rounded-xl overflow-hidden ${
          error
            ? 'bg-error-container/30 border border-error'
            : isFocused
            ? 'bg-surface-container-lowest border border-secondary shadow-sm'
            : 'bg-surface-container-low border border-transparent'
        }`}
      >
        {showPhonePrefix && (
          <View className="flex-row items-center px-3 py-3 bg-surface-container border-r border-outline-variant/30">
            <Text className="text-sm font-semibold text-on-surface">🇮🇳 +91</Text>
          </View>
        )}

        {leftIcon && !showPhonePrefix && (
          <View className="pl-3.5 pr-1 items-center justify-center">
            {leftIcon}
          </View>
        )}

        <TextInput
          placeholderTextColor="#76777d"
          className="flex-1 py-3 px-3.5 text-sm text-on-surface"
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
            className="p-3 items-center justify-center"
          >
            {isPasswordVisible ? (
              <EyeOff size={18} color="#76777d" />
            ) : (
              <Eye size={18} color="#76777d" />
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
        <Text className="text-xs text-error font-medium px-1">{error}</Text>
      ) : helperText ? (
        <Text className="text-xs text-on-surface-variant px-1">{helperText}</Text>
      ) : null}
    </View>
  );
};
