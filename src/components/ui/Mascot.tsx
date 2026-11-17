import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';

export type MascotMood = 'happy' | 'studying' | 'celebrating' | 'curious' | 'streak' | 'sleepy' | 'waving';

interface MascotProps {
  mood?: MascotMood;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSpeechBubble?: boolean;
  speechText?: string;
  name?: string;
}

const SIZES = { sm: 48, md: 76, lg: 112, xl: 160 } as const;
const INK = '#1C1C1E';

/** Face strokes for each mood, drawn in a 100×100 box over the orb. */
const Face: React.FC<{ mood: MascotMood }> = ({ mood }) => {
  switch (mood) {
    case 'celebrating':
    case 'streak':
      // Happy closed eyes + open smile
      return (
        <>
          <Path d="M36 58c2-5 8-5 10 0M58 58c2-5 8-5 10 0" stroke={INK} strokeWidth={3.2} strokeLinecap="round" fill="none" />
          <Path d="M44 66c4 6 12 6 16 0" stroke={INK} strokeWidth={3} strokeLinecap="round" fill="none" />
        </>
      );
    case 'sleepy':
      return (
        <>
          <Path d="M36 58h10M58 58h10" stroke={INK} strokeWidth={3.2} strokeLinecap="round" />
          <Circle cx={52} cy={68} r={2.6} fill={INK} />
        </>
      );
    case 'curious':
      return (
        <>
          <Circle cx={41} cy={57} r={4.2} fill={INK} />
          <Circle cx={63} cy={55} r={5} fill={INK} />
          <Path d="M47 68h10" stroke={INK} strokeWidth={3} strokeLinecap="round" />
        </>
      );
    case 'studying':
      return (
        <>
          <Circle cx={41} cy={58} r={4.2} fill={INK} />
          <Circle cx={63} cy={58} r={4.2} fill={INK} />
          <Path d="M47 67c3 3 7 3 10 0" stroke={INK} strokeWidth={3} strokeLinecap="round" fill="none" />
        </>
      );
    case 'happy':
    case 'waving':
    default:
      return (
        <>
          <Circle cx={41} cy={57} r={4.4} fill={INK} />
          <Circle cx={63} cy={57} r={4.4} fill={INK} />
          <Circle cx={42.4} cy={55.6} r={1.4} fill="#FFFFFF" />
          <Circle cx={64.4} cy={55.6} r={1.4} fill="#FFFFFF" />
          <Path d="M46 66c3 4 9 4 12 0" stroke={INK} strokeWidth={3} strokeLinecap="round" fill="none" />
        </>
      );
  }
};

/**
 * Acadly's helper: a soft mint orb with a simple face ("Soft Desk" mascot).
 * Keeps the old Mascot API so every existing caller keeps working.
 */
export const Mascot: React.FC<MascotProps> = ({ mood = 'happy', size = 'md', showSpeechBubble = false, speechText }) => {
  const dim = SIZES[size];
  const gradientId = `orb-${size}`;

  return (
    <View className="items-center justify-center">
      {showSpeechBubble && speechText ? (
        <View className="bg-white px-4 py-2.5 rounded-3xl mb-2 max-w-[260px]">
          <Text className="text-sm font-sans-semibold text-ink text-center leading-5">{speechText}</Text>
        </View>
      ) : null}

      <View
        accessibilityRole="image"
        accessibilityLabel="Acadly helper"
        style={{
          width: dim,
          height: dim,
          shadowColor: '#506E78',
          shadowOffset: { width: 0, height: dim * 0.12 },
          shadowOpacity: 0.18,
          shadowRadius: dim * 0.2,
          elevation: 6,
          borderRadius: dim / 2,
        }}
      >
        <Svg width={dim} height={dim} viewBox="0 0 100 100">
          <Defs>
            <RadialGradient id={gradientId} cx="32%" cy="28%" r="78%">
              <Stop offset="0%" stopColor="#FFFFFF" />
              <Stop offset="34%" stopColor="#E3F2F1" />
              <Stop offset="100%" stopColor="#AFCFD1" />
            </RadialGradient>
          </Defs>
          <Circle cx={50} cy={50} r={50} fill={`url(#${gradientId})`} />
          <Face mood={mood} />
        </Svg>
      </View>
    </View>
  );
};
