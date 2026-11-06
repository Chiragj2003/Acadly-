import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, Circle, Rect, G, Ellipse, Polygon } from 'react-native-svg';

export type MascotMood = 'happy' | 'studying' | 'celebrating' | 'curious' | 'streak' | 'sleepy' | 'waving';

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
  const dimensionMap = {
    sm: { width: 48, height: 48 },
    md: { width: 76, height: 76 },
    lg: { width: 112, height: 112 },
    xl: { width: 150, height: 150 },
  };

  const dim = dimensionMap[size];

  // Render SVG art based on mood
  const renderMascotArt = () => {
    switch (mood) {
      case 'studying':
        return (
          <Svg width={dim.width} height={dim.height} viewBox="0 0 120 120">
            {/* Cute Petal / Cloud Body */}
            <Path
              d="M60 22 C78 22 92 32 96 46 C108 50 114 64 110 78 C106 92 92 102 78 104 C70 114 54 116 42 112 C26 108 14 96 12 82 C4 74 4 58 12 46 C18 34 32 26 46 24 C50 22 55 22 60 22 Z"
              fill="#FF7D6B"
              stroke="#2D1F1D"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            {/* Rosy Cheeks */}
            <Circle cx="32" cy="74" r="8" fill="#FFAAA6" opacity={0.85} />
            <Circle cx="88" cy="74" r="8" fill="#FFAAA6" opacity={0.85} />
            {/* Round Studying Glasses */}
            <Circle cx="44" cy="60" r="15" fill="#FFFFFF" stroke="#2D1F1D" strokeWidth="4" />
            <Circle cx="76" cy="60" r="15" fill="#FFFFFF" stroke="#2D1F1D" strokeWidth="4" />
            <Path d="M59 60 L61 60" stroke="#2D1F1D" strokeWidth="4" strokeLinecap="round" />
            {/* Focused Pupils with Specular Glow */}
            <Circle cx="45" cy="60" r="6.5" fill="#2D1F1D" />
            <Circle cx="48" cy="57" r="2.5" fill="#FFFFFF" />
            <Circle cx="77" cy="60" r="6.5" fill="#2D1F1D" />
            <Circle cx="80" cy="57" r="2.5" fill="#FFFFFF" />
            {/* Studious Smile */}
            <Path d="M54 80 Q60 84 66 80" stroke="#2D1F1D" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            {/* Tiny Graduation Mortarboard */}
            <Polygon points="40,24 60,12 80,24 60,32" fill="#2D1F1D" stroke="#2D1F1D" strokeWidth="2.5" />
            <Path d="M80 24 L85 36" stroke="#FFA826" strokeWidth="3" strokeLinecap="round" />
            <Circle cx="85" cy="38" r="3" fill="#FFA826" />
            {/* Little Pencil */}
            <Rect x="88" y="78" width="8" height="22" rx="3" fill="#FFA826" stroke="#2D1F1D" strokeWidth="2" transform="rotate(-30 88 78)" />
          </Svg>
        );

      case 'celebrating':
        return (
          <Svg width={dim.width} height={dim.height} viewBox="0 0 120 120">
            {/* Squishy Bouncy Body */}
            <Path
              d="M60 22 C78 22 92 32 96 46 C108 50 114 64 110 78 C106 92 92 102 78 104 C70 114 54 116 42 112 C26 108 14 96 12 82 C4 74 4 58 12 46 C18 34 32 26 46 24 C50 22 55 22 60 22 Z"
              fill="#FF7D6B"
              stroke="#2D1F1D"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            {/* Rosy Cheeks */}
            <Circle cx="30" cy="72" r="9" fill="#FFAAA6" opacity={0.9} />
            <Circle cx="90" cy="72" r="9" fill="#FFAAA6" opacity={0.9} />
            {/* Happy Closed Crescent Eyes (^_^) */}
            <Path d="M36 58 Q46 46 56 58" stroke="#2D1F1D" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            <Path d="M64 58 Q74 46 84 58" stroke="#2D1F1D" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            {/* Big Joyful Open Mouth with Tooth! */}
            <Path d="M48 76 Q60 94 72 76 Z" fill="#D63031" stroke="#2D1F1D" strokeWidth="3.5" strokeLinejoin="round" />
            <Path d="M52 76 Q60 80 68 76" fill="#FFFFFF" stroke="#2D1F1D" strokeWidth="2.5" />
            {/* Party Cone Hat */}
            <Polygon points="50,22 60,2 70,22" fill="#FFA826" stroke="#2D1F1D" strokeWidth="3" />
            <Circle cx="60" cy="2" r="4" fill="#FF477E" />
            {/* Confetti & Stars */}
            <Circle cx="18" cy="30" r="3.5" fill="#FFA826" />
            <Circle cx="102" cy="34" r="3.5" fill="#4D96FF" />
            <Circle cx="104" cy="88" r="3" fill="#6BCB77" />
            <Circle cx="14" cy="84" r="3" fill="#FF477E" />
          </Svg>
        );

      case 'streak':
        return (
          <Svg width={dim.width} height={dim.height} viewBox="0 0 120 120">
            {/* Squishy Body */}
            <Path
              d="M60 22 C78 22 92 32 96 46 C108 50 114 64 110 78 C106 92 92 102 78 104 C70 114 54 116 42 112 C26 108 14 96 12 82 C4 74 4 58 12 46 C18 34 32 26 46 24 C50 22 55 22 60 22 Z"
              fill="#FF7D6B"
              stroke="#2D1F1D"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            {/* Rosy Cheeks */}
            <Circle cx="30" cy="72" r="8" fill="#FFAAA6" opacity={0.85} />
            <Circle cx="90" cy="72" r="8" fill="#FFAAA6" opacity={0.85} />
            {/* Determined / Focused Eyes with Shine */}
            <Circle cx="44" cy="58" r="8" fill="#2D1F1D" />
            <Circle cx="47" cy="55" r="3" fill="#FFFFFF" />
            <Circle cx="76" cy="58" r="8" fill="#2D1F1D" />
            <Circle cx="79" cy="55" r="3" fill="#FFFFFF" />
            {/* Confident Smile */}
            <Path d="M52 76 Q60 82 68 76" stroke="#2D1F1D" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            {/* Floating Golden Fire Streak Icon at Chest */}
            <Path
              d="M60 88 C54 94 52 100 56 106 C60 110 66 108 68 104 C70 100 66 96 64 92 C68 94 72 98 72 102 C74 100 74 96 70 92 C68 90 64 86 60 88 Z"
              fill="#FFA826"
              stroke="#2D1F1D"
              strokeWidth="2.5"
            />
            {/* Sparkles */}
            <Circle cx="18" cy="40" r="3" fill="#FFA826" />
            <Circle cx="102" cy="48" r="3" fill="#FFA826" />
          </Svg>
        );

      case 'curious':
        return (
          <Svg width={dim.width} height={dim.height} viewBox="0 0 120 120">
            {/* Tilted Squishy Body */}
            <Path
              d="M60 22 C78 22 92 32 96 46 C108 50 114 64 110 78 C106 92 92 102 78 104 C70 114 54 116 42 112 C26 108 14 96 12 82 C4 74 4 58 12 46 C18 34 32 26 46 24 C50 22 55 22 60 22 Z"
              fill="#FF7D6B"
              stroke="#2D1F1D"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            {/* Rosy Cheeks */}
            <Circle cx="32" cy="74" r="8" fill="#FFAAA6" opacity={0.85} />
            <Circle cx="88" cy="74" r="8" fill="#FFAAA6" opacity={0.85} />
            {/* One Wide Eye, One Squinting Eye */}
            <Circle cx="44" cy="58" r="9" fill="#2D1F1D" />
            <Circle cx="47" cy="54" r="3.5" fill="#FFFFFF" />
            <Path d="M72 58 Q78 52 84 58" stroke="#2D1F1D" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            {/* Small 'o' Curious Mouth */}
            <Circle cx="60" cy="78" r="4.5" fill="#2D1F1D" />
            {/* Floating Cute Question Mark */}
            <Path d="M88 24 Q96 16 94 30 Q90 36 90 40" stroke="#FFA826" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <Circle cx="90" cy="46" r="2.5" fill="#FFA826" />
          </Svg>
        );

      case 'sleepy':
        return (
          <Svg width={dim.width} height={dim.height} viewBox="0 0 120 120">
            {/* Squishy Body */}
            <Path
              d="M60 22 C78 22 92 32 96 46 C108 50 114 64 110 78 C106 92 92 102 78 104 C70 114 54 116 42 112 C26 108 14 96 12 82 C4 74 4 58 12 46 C18 34 32 26 46 24 C50 22 55 22 60 22 Z"
              fill="#FF7D6B"
              stroke="#2D1F1D"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            {/* Rosy Cheeks */}
            <Circle cx="30" cy="72" r="8" fill="#FFAAA6" opacity={0.85} />
            <Circle cx="90" cy="72" r="8" fill="#FFAAA6" opacity={0.85} />
            {/* Relaxed Sleepy Closed Eyes (- . -) */}
            <Path d="M38 60 L52 60" stroke="#2D1F1D" strokeWidth="4" strokeLinecap="round" />
            <Path d="M68 60 L82 60" stroke="#2D1F1D" strokeWidth="4" strokeLinecap="round" />
            {/* Sweet Resting Smile */}
            <Path d="M54 74 Q60 78 66 74" stroke="#2D1F1D" strokeWidth="3" strokeLinecap="round" fill="none" />
            {/* Floating zZz */}
            <Path d="M88 26 L96 26 L88 34 L96 34" stroke="#8C7A78" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <Path d="M98 16 L104 16 L98 22 L104 22" stroke="#8C7A78" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </Svg>
        );

      case 'happy':
      case 'waving':
      default:
        return (
          <Svg width={dim.width} height={dim.height} viewBox="0 0 120 120">
            {/* Squishy Flower/Cloud Coral Body (Aptivo & Moodpress Inspired) */}
            <Path
              d="M60 22 C78 22 92 32 96 46 C108 50 114 64 110 78 C106 92 92 102 78 104 C70 114 54 116 42 112 C26 108 14 96 12 82 C4 74 4 58 12 46 C18 34 32 26 46 24 C50 22 55 22 60 22 Z"
              fill="#FF7D6B"
              stroke="#2D1F1D"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            {/* Rosy Soft Blush Cheeks */}
            <Circle cx="30" cy="72" r="9" fill="#FFAAA6" opacity={0.9} />
            <Circle cx="90" cy="72" r="9" fill="#FFAAA6" opacity={0.9} />
            {/* Huge Sparkling Kawaii Eyes with Dual Reflections */}
            <Circle cx="44" cy="58" r="9.5" fill="#2D1F1D" />
            <Circle cx="47" cy="54" r="3.8" fill="#FFFFFF" />
            <Circle cx="42" cy="62" r="1.8" fill="#FFFFFF" />

            <Circle cx="76" cy="58" r="9.5" fill="#2D1F1D" />
            <Circle cx="79" cy="54" r="3.8" fill="#FFFFFF" />
            <Circle cx="74" cy="62" r="1.8" fill="#FFFFFF" />

            {/* Cute Cartoon Eyelashes on top of eyes */}
            <Path d="M40 47 L37 43" stroke="#2D1F1D" strokeWidth="2.5" strokeLinecap="round" />
            <Path d="M46 45 L46 41" stroke="#2D1F1D" strokeWidth="2.5" strokeLinecap="round" />
            <Path d="M74 45 L74 41" stroke="#2D1F1D" strokeWidth="2.5" strokeLinecap="round" />
            <Path d="M80 47 L83 43" stroke="#2D1F1D" strokeWidth="2.5" strokeLinecap="round" />

            {/* Lovable Big Smile with Two Cute Front Teeth (Moodpress style) */}
            <Path d="M48 74 Q60 90 72 74 Z" fill="#D63031" stroke="#2D1F1D" strokeWidth="3.5" strokeLinejoin="round" />
            <Rect x="54" y="74" width="5" height="5" rx="1.5" fill="#FFFFFF" stroke="#2D1F1D" strokeWidth="1.5" />
            <Rect x="61" y="74" width="5" height="5" rx="1.5" fill="#FFFFFF" stroke="#2D1F1D" strokeWidth="1.5" />

            {/* Waving Hand / Cute Sparkle */}
            <Path d="M96 50 Q108 42 104 32" stroke="#2D1F1D" strokeWidth="4" strokeLinecap="round" fill="none" />
            <Circle cx="104" cy="32" r="4.5" fill="#FF7D6B" stroke="#2D1F1D" strokeWidth="2.5" />
            <Circle cx="16" cy="34" r="3" fill="#FFA826" />
          </Svg>
        );
    }
  };

  return (
    <View className="items-center justify-center">
      {/* Optional Speech Bubble */}
      {showSpeechBubble && (
        <View className="bg-white border border-slate-900 px-4 py-2.5 rounded-2xl mb-2 max-w-[260px] shadow-sm relative">
          <Text className="text-xs font-bold text-slate-900 text-center leading-relaxed">
            {speechText}
          </Text>
          {/* Downward triangle arrow */}
          <View
            style={{
              position: 'absolute',
              bottom: -8,
              left: '50%',
              marginLeft: -6,
              width: 0,
              height: 0,
              borderLeftWidth: 6,
              borderRightWidth: 6,
              borderTopWidth: 8,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderTopColor: '#2D1F1D',
            }}
          />
        </View>
      )}

      {/* Mascot Vector */}
      {renderMascotArt()}
    </View>
  );
};
