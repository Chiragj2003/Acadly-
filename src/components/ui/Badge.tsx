import React from 'react';
import { View, Text } from 'react-native';

export type BadgeVariant =
  | 'pro'
  | 'live'
  | 'success'
  | 'active'
  | 'warning'
  | 'due'
  | 'info'
  | 'neutral'
  | 'admin';

export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  showDot?: boolean;
  className?: string;
}

const variantStyles: Record<
  BadgeVariant,
  { container: string; text: string; dotColor?: string }
> = {
  pro: {
    container: 'bg-tertiary-fixed',
    text: 'text-on-tertiary-fixed font-bold',
  },
  live: {
    container: 'bg-error',
    text: 'text-on-error font-bold',
    dotColor: 'bg-on-error',
  },
  success: {
    container: 'bg-tertiary-fixed/40',
    text: 'text-on-tertiary-container font-semibold',
    dotColor: 'bg-on-tertiary-container',
  },
  active: {
    container: 'bg-on-tertiary-container/10',
    text: 'text-on-tertiary-container font-semibold',
    dotColor: 'bg-on-tertiary-container',
  },
  warning: {
    container: 'bg-amber-100',
    text: 'text-amber-800 font-semibold',
    dotColor: 'bg-amber-600',
  },
  due: {
    container: 'bg-error-container',
    text: 'text-on-error-container font-semibold',
    dotColor: 'bg-error',
  },
  info: {
    container: 'bg-secondary-fixed',
    text: 'text-on-secondary-fixed font-semibold',
    dotColor: 'bg-secondary',
  },
  neutral: {
    container: 'bg-surface-container',
    text: 'text-on-surface-variant font-medium',
  },
  admin: {
    container: 'bg-surface-container-highest',
    text: 'text-on-surface font-semibold',
  },
};

const sizeStyles: Record<BadgeSize, { container: string; text: string; dot: string }> = {
  sm: {
    container: 'px-2 py-0.5 rounded-full gap-1',
    text: 'text-[11px] leading-tight',
    dot: 'w-1.5 h-1.5 rounded-full',
  },
  md: {
    container: 'px-2.5 py-1 rounded-full gap-1.5',
    text: 'text-xs leading-normal',
    dot: 'w-2 h-2 rounded-full',
  },
};

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  size = 'sm',
  icon,
  showDot = false,
  className = '',
}) => {
  const currentVariant = variantStyles[variant];
  const currentSize = sizeStyles[size];

  return (
    <View
      className={`flex-row items-center self-start ${currentSize.container} ${currentVariant.container} ${className}`}
    >
      {showDot && currentVariant.dotColor && (
        <View className={`${currentSize.dot} ${currentVariant.dotColor}`} />
      )}
      {icon && <View className="items-center justify-center">{icon}</View>}
      <Text className={`${currentSize.text} ${currentVariant.text}`}>{label}</Text>
    </View>
  );
};
