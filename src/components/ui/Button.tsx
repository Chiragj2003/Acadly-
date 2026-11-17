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

// "Soft Desk": primary actions are ink pills; secondary actions are white pills on paper.
const variantStyles: Record<ButtonVariant, { container: string; text: string; spinner: string }> = {
  primary: {
    container: 'bg-ink active:opacity-90',
    text: 'text-white font-sans-bold',
    spinner: '#ffffff',
  },
  secondary: {
    container: 'bg-ink active:opacity-90',
    text: 'text-white font-sans-bold',
    spinner: '#ffffff',
  },
  secondaryContainer: {
    container: 'bg-pastel-sky active:opacity-90',
    text: 'text-ink font-sans-bold',
    spinner: '#1C1C1E',
  },
  outline: {
    container: 'bg-white border border-hairline active:bg-paper',
    text: 'text-ink font-sans-bold',
    spinner: '#1C1C1E',
  },
  ghost: {
    container: 'bg-transparent active:bg-hairline',
    text: 'text-ink font-sans-bold',
    spinner: '#1C1C1E',
  },
  surface: {
    container: 'bg-white active:bg-hairline',
    text: 'text-ink font-sans-bold',
    spinner: '#1C1C1E',
  },
  destructive: {
    container: 'bg-rose-700 active:opacity-90',
    text: 'text-white font-sans-bold',
    spinner: '#ffffff',
  },
};

const sizeStyles: Record<ButtonSize, { container: string; text: string; iconGap: string }> = {
  sm: {
    container: 'px-4 py-2 min-h-[44px] min-w-[44px] rounded-full',
    text: 'text-sm',
    iconGap: 'gap-1.5',
  },
  md: {
    container: 'px-5 py-3 min-h-[48px] min-w-[48px] rounded-full',
    text: 'text-[15px]',
    iconGap: 'gap-2',
  },
  lg: {
    container: 'px-6 py-4 min-h-[56px] min-w-[56px] rounded-full',
    text: 'text-[17px]',
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
      accessibilityLabel={pressableProps.accessibilityLabel || title || undefined}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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
