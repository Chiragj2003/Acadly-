import React from 'react';
import { View, Pressable, type ViewProps, type PressableProps } from 'react-native';

export type CardElevation = 'lowest' | 'low' | 'container' | 'high' | 'hero';
export type CardTone = 'pink' | 'sky' | 'peach' | 'mint' | 'lilac' | 'butter';

export interface CardProps extends ViewProps {
  elevation?: CardElevation;
  /** Pastel for the outlined "hero" card (one per screen). Defaults to sky. */
  tone?: CardTone;
  onPress?: PressableProps['onPress'];
  className?: string;
  children: React.ReactNode;
}

// "Soft Desk": soft white cards on paper, no borders. "hero" is the single
// outlined pastel card that leads a screen.
const elevationClasses: Record<CardElevation, string> = {
  lowest: 'bg-white rounded-3xl p-4',
  low: 'bg-white rounded-3xl p-4',
  container: 'bg-paper rounded-3xl p-4',
  high: 'bg-white rounded-3xl p-4',
  hero: 'rounded-4xl p-5 border-[1.5px] border-ink',
};

const toneClasses: Record<CardTone, string> = {
  pink: 'bg-pastel-pink',
  sky: 'bg-pastel-sky',
  peach: 'bg-pastel-peach',
  mint: 'bg-pastel-mint',
  lilac: 'bg-pastel-lilac',
  butter: 'bg-pastel-butter',
};

export const Card: React.FC<CardProps> = ({
  elevation = 'lowest',
  tone = 'sky',
  onPress,
  className = '',
  children,
  ...rest
}) => {
  const baseClasses = `${elevationClasses[elevation]} ${elevation === 'hero' ? toneClasses[tone] : ''} ${className}`;

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
