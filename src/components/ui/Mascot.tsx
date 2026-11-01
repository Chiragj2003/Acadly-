import React from 'react';
import { View, Text } from 'react-native';

export type MascotMood = 'happy' | 'studying' | 'celebrating' | 'curious' | 'waving';

interface MascotProps {
  mood?: MascotMood;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSpeechBubble?: boolean;
  speechText?: string;
  name?: string;
}

export const Mascot: React.FC<MascotProps> = ({
  mood = 'happy',
  size = 'md',
  showSpeechBubble = false,
  speechText = "Let's learn something fun today! 🌸",
  name = "Pip",
}) => {
  const sizeMap = {
    sm: { box: 'w-10 h-10', face: 'text-2xl', eyes: 'text-xs' },
    md: { box: 'w-16 h-16', face: 'text-4xl', eyes: 'text-sm' },
    lg: { box: 'w-24 h-24', face: 'text-6xl', eyes: 'text-base' },
    xl: { box: 'w-32 h-32', face: 'text-7xl', eyes: 'text-lg' },
  };

  const getMoodVisual = () => {
    switch (mood) {
      case 'studying':
        return {
          emoji: '🦉',
          accessory: '🎓',
          badgeText: 'Study Mode',
          bgColor: 'bg-amber-100',
          borderColor: 'border-amber-300',
        };
      case 'celebrating':
        return {
          emoji: '🦊',
          accessory: '✨',
          badgeText: 'Yay! Streak +1',
          bgColor: 'bg-rose-100',
          borderColor: 'border-rose-300',
        };
      case 'curious':
        return {
          emoji: '🐣',
          accessory: '💡',
          badgeText: 'Curious',
          bgColor: 'bg-sky-100',
          borderColor: 'border-sky-300',
        };
      case 'waving':
        return {
          emoji: '🐻',
          accessory: '👋',
          badgeText: 'Welcome!',
          bgColor: 'bg-orange-100',
          borderColor: 'border-orange-300',
        };
      default:
        return {
          emoji: '🌸',
          accessory: '✨',
          badgeText: 'Happy Learning',
          bgColor: 'bg-rose-100',
          borderColor: 'border-rose-300',
        };
    }
  };

  const visual = getMoodVisual();

  return (
    <View className="items-center">
      {showSpeechBubble && (
        <View className="bg-white border-2 border-cute-cocoa/15 px-3.5 py-2 rounded-2xl mb-2 shadow-sm max-w-[240px]">
          <Text className="text-xs font-semibold text-cute-cocoa text-center leading-snug">
            {speechText}
          </Text>
          <View className="w-2.5 h-2.5 bg-white border-r-2 border-b-2 border-cute-cocoa/15 rotate-45 self-center -mb-3 mt-1" />
        </View>
      )}

      <View
        className={`${sizeMap[size].box} ${visual.bgColor} ${visual.borderColor} border-2 rounded-3xl items-center justify-center shadow-sm relative`}
      >
        <Text className={sizeMap[size].face}>{visual.emoji}</Text>
        <View className="absolute -top-1.5 -right-1.5 bg-white rounded-full p-0.5 border border-cute-border shadow-xs">
          <Text className="text-xs">{visual.accessory}</Text>
        </View>
      </View>
    </View>
  );
};
