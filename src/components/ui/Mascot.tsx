import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, Circle, Rect, G, Ellipse } from 'react-native-svg';

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
  name = 'Pip',
}) => {
  // Dimensions for SVG container
  const dimensionMap = {
    sm: { width: 48, height: 48, viewBox: '0 0 100 100' },
    md: { width: 72, height: 72, viewBox: '0 0 100 100' },
    lg: { width: 104, height: 104, viewBox: '0 0 100 100' },
    xl: { width: 140, height: 140, viewBox: '0 0 100 100' },
  };

  const dim = dimensionMap[size];

  // Render SVG elements according to mood
  const renderMascotArt = () => {
    switch (mood) {
      case 'studying':
        return (
          <Svg width={dim.width} height={dim.height} viewBox="0 0 100 100">
            {/* Coral Petal Body */}
            <Path
              d="M50 18 C62 18 72 26 76 36 C86 38 92 48 90 58 C88 68 80 76 70 78 C65 88 54 90 44 88 C32 86 24 78 20 68 C10 64 8 50 14 40 C18 32 28 26 38 24 C42 20 46 18 50 18 Z"
              fill="#FF7D6B"
              stroke="#2D1F1D"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            {/* Rosy Cheeks */}
            <Circle cx="30" cy="58" r="6" fill="#FFAAA6" opacity={0.8} />
            <Circle cx="70" cy="58" r="6" fill="#FFAAA6" opacity={0.8} />
            {/* Big Round Glasses */}
            <Circle cx="38" cy="48" r="12" fill="#FFFFFF" stroke="#2D1F1D" strokeWidth="3.5" />
            <Circle cx="62" cy="48" r="12" fill="#FFFFFF" stroke="#2D1F1D" strokeWidth="3.5" />
            <Path d="M50 48 L50 48" stroke="#2D1F1D" strokeWidth="3.5" strokeLinecap="round" />
            {/* Focused Pupils */}
            <Circle cx="39" cy="48" r="5.5" fill="#2D1F1D" />
            <Circle cx="41" cy="46" r="2" fill="#FFFFFF" />
            <Circle cx="63" cy="48" r="5.5" fill="#2D1F1D" />
            <Circle cx="65" cy="46" r="2" fill="#FFFFFF" />
            {/* Studious Determined Mouth */}
            <Path d="M46 64 Q50 67 54 64" stroke="#2D1F1D" strokeWidth="3" strokeLinecap="round" fill="none" />
            {/* Tiny Graduation Cap */}
            <Path d="M36 18 L50 10 L64 18 L50 24 Z" fill="#2D1F1D" stroke="#2D1F1D" strokeWidth="2" />
            <Path d="M64 18 L68 28" stroke="#FFA826" strokeWidth="2.5" strokeLinecap="round" />
            <Circle cx="68" cy="29" r="2" fill="#FFA826" />
          </Svg>
        );

      case 'celebrating':
        return (
          <Svg width={dim.width} height={dim.height} viewBox="0 0 100 100">
            {/* Coral Petal Body */}
            <Path
              d="M50 18 C62 18 72 26 76 36 C86 38 92 48 90 58 C88 68 80 76 70 78 C65 88 54 90 44 88 C32 86 24 78 20 68 C10 64 8 50 14 40 C18 32 28 26 38 24 C42 20 46 18 50 18 Z"
              fill="#FF7D6B"
              stroke="#2D1F1D"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            {/* Rosy Cheeks */}
            <Circle cx="28" cy="58" r="7" fill="#FFAAA6" opacity={0.9} />
            <Circle cx="72" cy="58" r="7" fill="#FFAAA6" opacity={0.9} />
            {/* Happy Closed Crescent Eyes (^_^) */}
            <Path d="M30 46 Q37 38 44 46" stroke="#2D1F1D" strokeWidth="4" strokeLinecap="round" fill="none" />
            <Path d="M56 46 Q63 38 70 46" stroke="#2D1F1D" strokeWidth="4" strokeLinecap="round" fill="none" />
            {/* Joyful Open Mouth with Tooth/Tongue */}
            <Path d="M42 60 Q50 74 58 60 Z" fill="#D63031" stroke="#2D1F1D" strokeWidth="3" strokeLinejoin="round" />
            <Path d="M45 60 Q50 63 55 60" fill="#FFFFFF" stroke="#2D1F1D" strokeWidth="2" />
            {/* Party Cone Hat */}
            <Path d="M42 18 L50 2 L58 18 Z" fill="#FFA826" stroke="#2D1F1D" strokeWidth="3" />
            <Circle cx="50" cy="2" r="3" fill="#FF477E" />
            {/* Confetti Sparkles */}
            <Circle cx="16" cy="26" r="3" fill="#FFA826" />
            <Circle cx="84" cy="28" r="3" fill="#6BCB77" />
            <Circle cx="82" cy="72" r="2.5" fill="#4D96FF" />
          </Svg>
        );

      case 'curious':
        return (
          <Svg width={dim.width} height={dim.height} viewBox="0 0 100 100">
            {/* Tilted Petal Body */}
            <Path
              d="M50 18 C62 18 72 26 76 36 C86 38 92 48 90 58 C88 68 80 76 70 78 C65 88 54 90 44 88 C32 86 24 78 20 68 C10 64 8 50 14 40 C18 32 28 26 38 24 C42 20 46 18 50 18 Z"
              fill="#FF8A78"
              stroke="#2D1F1D"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            {/* Rosy Cheeks */}
            <Circle cx="29" cy="60" r="6" fill="#FFAAA6" opacity={0.8} />
            <Circle cx="71" cy="60" r="6" fill="#FFAAA6" opacity={0.8} />
            {/* One Large Eye, One Raised Eye */}
            <Circle cx="36" cy="46" r="9" fill="#FFFFFF" stroke="#2D1F1D" strokeWidth="3" />
            <Circle cx="37" cy="45" r="5" fill="#2D1F1D" />
            <Circle cx="38" cy="43" r="2" fill="#FFFFFF" />
            <Circle cx="64" cy="44" r="11" fill="#FFFFFF" stroke="#2D1F1D" strokeWidth="3" />
            <Circle cx="65" cy="43" r="6" fill="#2D1F1D" />
            <Circle cx="67" cy="41" r="2.5" fill="#FFFFFF" />
            {/* Raised Eyebrow */}
            <Path d="M60 28 Q67 24 74 30" stroke="#2D1F1D" strokeWidth="3" strokeLinecap="round" fill="none" />
            {/* Inquisitive O-Mouth */}
            <Circle cx="50" cy="63" r="4.5" fill="#2D1F1D" />
            <Circle cx="50" cy="63" r="2" fill="#FF8A78" />
            {/* Idea Sparkle above Head */}
            <Path d="M50 4 L50 12 M44 8 L56 8" stroke="#FFA826" strokeWidth="3" strokeLinecap="round" />
          </Svg>
        );

      case 'waving':
        return (
          <Svg width={dim.width} height={dim.height} viewBox="0 0 100 100">
            {/* Coral Petal Body */}
            <Path
              d="M50 18 C62 18 72 26 76 36 C86 38 92 48 90 58 C88 68 80 76 70 78 C65 88 54 90 44 88 C32 86 24 78 20 68 C10 64 8 50 14 40 C18 32 28 26 38 24 C42 20 46 18 50 18 Z"
              fill="#FF7D6B"
              stroke="#2D1F1D"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            {/* Waving Hand/Petal */}
            <Path
              d="M82 46 C92 40 98 44 96 52 C94 58 86 60 82 56 Z"
              fill="#FF7D6B"
              stroke="#2D1F1D"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
            {/* Motion Wave Lines */}
            <Path d="M96 36 C100 40 100 44 98 48" stroke="#FFA826" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            {/* Cheeks */}
            <Circle cx="30" cy="58" r="6" fill="#FFAAA6" opacity={0.8} />
            <Circle cx="70" cy="58" r="6" fill="#FFAAA6" opacity={0.8} />
            {/* Big Expressive Cartoon Eyes */}
            <Circle cx="37" cy="46" r="10" fill="#FFFFFF" stroke="#2D1F1D" strokeWidth="3" />
            <Circle cx="38" cy="46" r="6" fill="#2D1F1D" />
            <Circle cx="40" cy="44" r="2.5" fill="#FFFFFF" />
            <Circle cx="63" cy="46" r="10" fill="#FFFFFF" stroke="#2D1F1D" strokeWidth="3" />
            <Circle cx="64" cy="46" r="6" fill="#2D1F1D" />
            <Circle cx="66" cy="44" r="2.5" fill="#FFFFFF" />
            {/* Sweet Happy Smile */}
            <Path d="M44 60 Q50 68 56 60" stroke="#2D1F1D" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            {/* Green Sprout Leaf */}
            <Path d="M50 18 C50 8 42 6 42 14 C42 18 48 18 50 18 Z" fill="#6BCB77" stroke="#2D1F1D" strokeWidth="2" />
            <Path d="M50 18 C50 8 58 6 58 14 C58 18 52 18 50 18 Z" fill="#8CE096" stroke="#2D1F1D" strokeWidth="2" />
          </Svg>
        );

      case 'happy':
      default:
        return (
          <Svg width={dim.width} height={dim.height} viewBox="0 0 100 100">
            {/* Warm Coral Blossom Body with 5 Bouncy Lobes */}
            <Path
              d="M50 18 C62 18 72 26 76 36 C86 38 92 48 90 58 C88 68 80 76 70 78 C65 88 54 90 44 88 C32 86 24 78 20 68 C10 64 8 50 14 40 C18 32 28 26 38 24 C42 20 46 18 50 18 Z"
              fill="#FF7D6B"
              stroke="#2D1F1D"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            {/* Rosy Pastel Blush Patches */}
            <Circle cx="29" cy="58" r="7" fill="#FFAAA6" opacity={0.85} />
            <Circle cx="71" cy="58" r="7" fill="#FFAAA6" opacity={0.85} />
            {/* Left Big Eye */}
            <Circle cx="37" cy="46" r="11" fill="#FFFFFF" stroke="#2D1F1D" strokeWidth="3.5" />
            <Circle cx="38" cy="46" r="6.5" fill="#2D1F1D" />
            <Circle cx="40.5" cy="43.5" r="2.8" fill="#FFFFFF" />
            <Circle cx="36" cy="48" r="1.2" fill="#FFFFFF" />
            {/* Right Big Eye */}
            <Circle cx="63" cy="46" r="11" fill="#FFFFFF" stroke="#2D1F1D" strokeWidth="3.5" />
            <Circle cx="64" cy="46" r="6.5" fill="#2D1F1D" />
            <Circle cx="66.5" cy="43.5" r="2.8" fill="#FFFFFF" />
            <Circle cx="62" cy="48" r="1.2" fill="#FFFFFF" />
            {/* Cute Buck Tooth / Joyful Smile */}
            <Path
              d="M44 59 Q50 69 56 59 Z"
              fill="#2D1F1D"
              stroke="#2D1F1D"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Cute White Buck Tooth */}
            <Rect x="48" y="59" width="4" height="4" rx="1" fill="#FFFFFF" />
            {/* Little Green Sprout on Top */}
            <Path
              d="M50 18 C50 8 42 6 42 13 C42 17 48 18 50 18 Z"
              fill="#6BCB77"
              stroke="#2D1F1D"
              strokeWidth="2.2"
            />
            <Path
              d="M50 18 C50 8 58 6 58 13 C58 17 52 18 50 18 Z"
              fill="#8DE097"
              stroke="#2D1F1D"
              strokeWidth="2.2"
            />
          </Svg>
        );
    }
  };

  return (
    <View className="items-center">
      {showSpeechBubble && (
        <View className="bg-white border-2 border-cute-cocoa/15 px-4 py-2.5 rounded-2xl mb-2 shadow-sm max-w-[260px]">
          <Text className="text-xs font-bold text-cute-cocoa text-center leading-snug">
            {speechText}
          </Text>
          <View className="w-3 h-3 bg-white border-r-2 border-b-2 border-cute-cocoa/15 rotate-45 self-center -mb-3.5 mt-1" />
        </View>
      )}

      <View className="items-center justify-center relative">
        {renderMascotArt()}
      </View>
    </View>
  );
};
