import React from 'react';
import { View, Pressable, type ViewProps, type PressableProps } from 'react-native';

export type CardElevation = 'lowest' | 'low' | 'container' | 'high' | 'hero';

export interface CardProps extends ViewProps {
  elevation?: CardElevation;
  onPress?: PressableProps['onPress'];
  className?: string;
  children: React.ReactNode;
}

const elevationClasses: Record<CardElevation, string> = {
  lowest: 'bg-white rounded-2xl p-4 shadow-xs border border-slate-200/90',
  low: 'bg-white rounded-2xl p-4 shadow-xs border border-slate-200',
  container: 'bg-slate-50 rounded-2xl p-4 border border-slate-200/80',
  high: 'bg-white rounded-2xl p-4 shadow-sm border border-slate-200',
  hero: 'bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-5 shadow-sm',
};

export const Card: React.FC<CardProps> = ({
  elevation = 'lowest',
  onPress,
  className = '',
  children,
  ...rest
}) => {
  const baseClasses = `${elevationClasses[elevation]} ${className}`;

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className={`${baseClasses} active:scale-[0.99]`}
        {...(rest as PressableProps)}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View className={baseClasses} {...rest}>
      {children}
    </View>
  );
};
