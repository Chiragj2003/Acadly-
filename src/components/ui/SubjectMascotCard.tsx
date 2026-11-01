import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ArrowRight, Play, BookOpen, Clock } from 'lucide-react-native';

export interface SubjectMascot {
  id: string;
  name: string;
  mascotName: string;
  mascotEmoji: string;
  tagline: string;
  topic: string;
  lessonCount: number;
  duration: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  badgeBg: string;
  badgeText: string;
  characterCatchphrase: string;
}

export const CUTE_SUBJECT_MASCOTS: SubjectMascot[] = [
  {
    id: 'subj-math',
    name: 'Mathematics',
    mascotName: 'Drino the Dino 🦖',
    mascotEmoji: '🦖',
    tagline: 'Math is a Puzzle Game!',
    topic: 'Calculus, Tangents & Shapes',
    lessonCount: 14,
    duration: '6 hrs left',
    bgColor: '#fff1ec',
    borderColor: '#ffcab8',
    textColor: '#a33b20',
    badgeBg: '#ffe0d6',
    badgeText: 'Geometry & Functions',
    characterCatchphrase: '“Every curve tells a story!”',
  },
  {
    id: 'subj-physics',
    name: 'Physics',
    mascotName: 'Tonot the Astro 🚀',
    mascotEmoji: '🚀',
    tagline: 'Explore the Universe 🌌',
    topic: 'Electromagnetism & Circuit Flow',
    lessonCount: 18,
    duration: '8 hrs left',
    bgColor: '#eef2ff',
    borderColor: '#c7d2fe',
    textColor: '#3730a3',
    badgeBg: '#e0e7ff',
    badgeText: 'Forces & Energy',
    characterCatchphrase: '“Gravity is just the beginning!”',
  },
  {
    id: 'subj-biology',
    name: 'Biology',
    mascotName: 'Petal the Sprout 🌱',
    mascotEmoji: '🌱',
    tagline: 'Discover Life Wonders 🌸',
    topic: 'Cell Biology & Photosynthesis',
    lessonCount: 12,
    duration: '4 hrs left',
    bgColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    textColor: '#166534',
    badgeBg: '#dcfce7',
    badgeText: 'Botany & Genetics',
    characterCatchphrase: '“Grow stronger every day!”',
  },
  {
    id: 'subj-chemistry',
    name: 'Chemistry',
    mascotName: 'Bredo the Alchemist 🍞',
    mascotEmoji: '🧪',
    tagline: 'Molecules & Magic 💥',
    topic: 'Carbonyl Compounds & Reactions',
    lessonCount: 16,
    duration: '7 hrs left',
    bgColor: '#fffbeb',
    borderColor: '#fde68a',
    textColor: '#854d0e',
    badgeBg: '#fef3c7',
    badgeText: 'Organic & Inorganic',
    characterCatchphrase: '“Mix curiosity with practice!”',
  },
];

interface SubjectMascotCardProps {
  subject: SubjectMascot;
  onPress?: () => void;
  onPlayPress?: () => void;
}

export const SubjectMascotCard: React.FC<SubjectMascotCardProps> = ({
  subject,
  onPress,
  onPlayPress,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={{ backgroundColor: subject.bgColor, borderColor: subject.borderColor }}
      className="p-4 rounded-[26px] border-2 shadow-xs mb-3"
    >
      {/* Top bar with Mascot Tag and Mini Eyes */}
      <View className="flex-row items-center justify-between mb-2.5">
        <View className="flex-row items-center gap-2">
          {/* Googly Eyes Badge from Aptivo Inspiration */}
          <View className="bg-white px-2 py-0.5 rounded-full border border-black/10 flex-row items-center gap-1">
            <Text className="text-xs">👀</Text>
            <Text className="text-[11px] font-bold text-cute-cocoa">{subject.mascotName}</Text>
          </View>
        </View>

        <View style={{ backgroundColor: subject.badgeBg }} className="px-2.5 py-1 rounded-full">
          <Text style={{ color: subject.textColor }} className="text-[10px] font-bold uppercase tracking-wider">
            {subject.name}
          </Text>
        </View>
      </View>

      {/* Main Title & Catchphrase */}
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-2">
          <Text className="text-base font-extrabold text-cute-cocoa leading-tight">
            {subject.topic}
          </Text>
          <Text className="text-xs text-cute-muted italic mt-1">
            {subject.characterCatchphrase}
          </Text>
        </View>

        {/* Big Cute Mascot Face */}
        <View className="w-14 h-14 bg-white/80 rounded-2xl items-center justify-center border border-black/5 shadow-xs">
          <Text className="text-3xl">{subject.mascotEmoji}</Text>
        </View>
      </View>

      {/* Bottom Action Footer */}
      <View className="flex-row items-center justify-between mt-3.5 pt-2.5 border-t border-black/5">
        <View className="flex-row items-center gap-3">
          <View className="flex-row items-center gap-1">
            <BookOpen size={12} color="#7d6f6a" />
            <Text className="text-[11px] font-semibold text-cute-muted">{subject.lessonCount} lessons</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Clock size={12} color="#7d6f6a" />
            <Text className="text-[11px] font-semibold text-cute-muted">{subject.duration}</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={onPlayPress || onPress}
          className="w-8 h-8 rounded-full bg-white border border-black/10 items-center justify-center shadow-xs"
        >
          <ArrowRight size={14} color="#2e2421" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};
