import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  View,
  type PressableProps,
} from 'react-native';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'secondaryContainer'
  | 'outline'
  | 'ghost'
  | 'surface'
  | 'destructive';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  children?: React.ReactNode;
  title?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
}

const variantStyles: Record<ButtonVariant, { container: string; text: string; spinner: string }> = {
  primary: {
    container: 'bg-blue-600 active:bg-blue-700 shadow-xs',
    text: 'text-white font-bold',
    spinner: '#ffffff',
  },
  secondary: {
    container: 'bg-slate-900 active:bg-slate-800 shadow-xs',
    text: 'text-white font-bold',
    spinner: '#ffffff',
  },
  secondaryContainer: {
    container: 'bg-blue-50 border border-blue-200 active:bg-blue-100',
    text: 'text-blue-900 font-bold',
    spinner: '#2563EB',
  },
  outline: {
    container: 'bg-white border border-slate-200 active:bg-slate-50',
    text: 'text-slate-800 font-bold',
    spinner: '#2563EB',
  },
  ghost: {
    container: 'bg-transparent active:bg-slate-100',
    text: 'text-blue-600 font-bold',
    spinner: '#2563EB',
  },
  surface: {
    container: 'bg-slate-100 border border-slate-200 active:bg-slate-200',
    text: 'text-slate-800 font-bold',
    spinner: '#0F172A',
  },
  destructive: {
    container: 'bg-rose-600 active:bg-rose-700 shadow-xs',
    text: 'text-white font-bold',
    spinner: '#ffffff',
  },
};

const sizeStyles: Record<ButtonSize, { container: string; text: string; iconGap: string }> = {
  sm: {
    container: 'px-3 py-1.5 rounded-lg',
    text: 'text-xs',
    iconGap: 'gap-1',
  },
  md: {
    container: 'px-4 py-2.5 rounded-lg',
    text: 'text-sm',
    iconGap: 'gap-2',
  },
  lg: {
    container: 'px-5 py-3.5 rounded-xl',
    text: 'text-base',
    iconGap: 'gap-2.5',
  },
};

export const Button: React.FC<ButtonProps> = ({
  children,
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  ...pressableProps
}) => {
  const currentVariant = variantStyles[variant];
  const currentSize = sizeStyles[size];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      className={`flex-row items-center justify-center ${currentSize.container} ${currentVariant.container} ${
        currentSize.iconGap
      } ${fullWidth ? 'w-full' : 'self-start'} ${
        isDisabled ? 'opacity-50' : 'active:scale-[0.99]'
      } ${className}`}
      {...pressableProps}
    >
      {loading ? (
        <ActivityIndicator size="small" color={currentVariant.spinner} />
      ) : (
        <>
          {leftIcon && <View className="items-center justify-center">{leftIcon}</View>}
          {title ? (
            <Text className={`${currentSize.text} ${currentVariant.text}`}>{title}</Text>
          ) : (
            children
          )}
          {rightIcon && <View className="items-center justify-center">{rightIcon}</View>}
        </>
      )}
    </Pressable>
  );
};
