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
  lowest: 'bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-black/5',
  low: 'bg-surface-container-low rounded-2xl p-4 shadow-sm',
  container: 'bg-surface-container rounded-2xl p-4',
  high: 'bg-surface-container-high rounded-2xl p-4',
  hero: 'bg-primary-container rounded-2xl p-4 shadow-md overflow-hidden',
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
