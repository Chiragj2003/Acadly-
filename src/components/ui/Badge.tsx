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
  | 'admin'
  | 'primary'
  | 'negative'
  | 'error';

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
    container: 'bg-indigo-50 border border-indigo-200/80',
    text: 'text-indigo-900 font-bold',
    dotColor: 'bg-indigo-600',
  },
  live: {
    container: 'bg-rose-50 border border-rose-200/80',
    text: 'text-rose-900 font-bold',
    dotColor: 'bg-rose-600',
  },
  success: {
    container: 'bg-emerald-50 border border-emerald-200/80',
    text: 'text-emerald-900 font-bold',
    dotColor: 'bg-emerald-600',
  },
  active: {
    container: 'bg-emerald-50 border border-emerald-200/80',
    text: 'text-emerald-900 font-bold',
    dotColor: 'bg-emerald-600',
  },
  warning: {
    container: 'bg-amber-50 border border-amber-200/80',
    text: 'text-amber-900 font-bold',
    dotColor: 'bg-amber-600',
  },
  due: {
    container: 'bg-rose-50 border border-rose-200/80',
    text: 'text-rose-900 font-bold',
    dotColor: 'bg-rose-600',
  },
  info: {
    container: 'bg-blue-50 border border-blue-200/80',
    text: 'text-blue-900 font-bold',
    dotColor: 'bg-blue-600',
  },
  neutral: {
    container: 'bg-slate-100 border border-slate-200/90',
    text: 'text-slate-800 font-semibold',
    dotColor: 'bg-slate-500',
  },
  admin: {
    container: 'bg-slate-900 border border-slate-950',
    text: 'text-white font-bold',
    dotColor: 'bg-slate-400',
  },
  primary: {
    container: 'bg-blue-50 border border-blue-200/80',
    text: 'text-blue-900 font-bold',
    dotColor: 'bg-blue-600',
  },
  negative: {
    container: 'bg-rose-50 border border-rose-200/80',
    text: 'text-rose-900 font-bold',
    dotColor: 'bg-rose-600',
  },
  error: {
    container: 'bg-rose-50 border border-rose-200/80',
    text: 'text-rose-900 font-bold',
    dotColor: 'bg-rose-600',
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
