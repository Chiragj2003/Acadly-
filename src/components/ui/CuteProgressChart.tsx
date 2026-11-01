import React from 'react';
import { View, Text } from 'react-native';
import { Flame, Star, Trophy, Sparkles } from 'lucide-react-native';

export const CuteProgressChart: React.FC = () => {
  const weekData = [
    { day: 'Mon', hours: 3.5, height: 'h-16', active: false },
    { day: 'Tue', hours: 2.0, height: 'h-10', active: false },
    { day: 'Wed', hours: 4.8, height: 'h-24', active: true },
    { day: 'Thu', hours: 2.8, height: 'h-14', active: false },
    { day: 'Fri', hours: 3.9, height: 'h-20', active: false },
    { day: 'Sat', hours: 4.2, height: 'h-22', active: false },
  ];

  return (
    <View className="bg-white border-2 border-cute-border rounded-[28px] p-5 shadow-xs mb-4">
      {/* Header with Streak */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-2">
          <View className="w-9 h-9 rounded-2xl bg-amber-100 items-center justify-center border border-amber-200">
            <Flame size={18} color="#f59e0b" fill="#f59e0b" />
          </View>
          <View>
            <Text className="text-base font-extrabold text-cute-cocoa">Study Streak: 6 Days!</Text>
            <Text className="text-xs text-cute-muted">You are on fire this week 🔥</Text>
          </View>
        </View>

        <View className="bg-cute-peach-light px-2.5 py-1 rounded-full border border-cute-peach">
          <Text className="text-[11px] font-bold text-cute-peach">Level 4 Scholar ⭐</Text>
        </View>
      </View>

      {/* Metric Cards Mosaic (from Jacob's dashboard) */}
      <View className="flex-row gap-2.5 mb-5">
        <View className="flex-1 bg-cute-cream border border-cute-border rounded-2xl p-3.5 items-center">
          <Text className="text-xs font-semibold text-cute-muted">Completed</Text>
          <Text className="text-2xl font-black text-cute-cocoa mt-0.5">48</Text>
          <Text className="text-[10px] font-bold text-cute-mint mt-0.5">Lessons 📖</Text>
        </View>

        <View className="flex-1 bg-cute-cream border border-cute-border rounded-2xl p-3.5 items-center">
          <Text className="text-xs font-semibold text-cute-muted">Time Invested</Text>
          <Text className="text-2xl font-black text-cute-cocoa mt-0.5">14.5</Text>
          <Text className="text-[10px] font-bold text-cute-peach mt-0.5">Hours Studied ⏳</Text>
        </View>

        <View className="flex-1 bg-cute-cream border border-cute-border rounded-2xl p-3.5 items-center">
          <Text className="text-xs font-semibold text-cute-muted">Accuracy</Text>
          <Text className="text-2xl font-black text-cute-cocoa mt-0.5">94%</Text>
          <Text className="text-[10px] font-bold text-cute-lavender mt-0.5">Quiz Score 🎯</Text>
        </View>
      </View>

      {/* Pill Bar Chart inspired by Jacob's dashboard */}
      <View className="bg-cute-cream/70 rounded-2xl p-4 border border-cute-border">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-xs font-bold text-cute-cocoa uppercase tracking-wider">
            Daily Study Rhythm
          </Text>
          <Text className="text-[11px] font-semibold text-cute-muted">Weekly Avg: 3.5h</Text>
        </View>

        <View className="flex-row items-end justify-between h-28 pt-2 px-1">
          {weekData.map((item, idx) => (
            <View key={idx} className="items-center gap-1.5 flex-1">
              <Text className={`text-[10px] font-bold ${item.active ? 'text-cute-peach' : 'text-cute-muted'}`}>
                {item.hours}h
              </Text>
              <View
                className={`w-7 ${item.height} rounded-full ${
                  item.active
                    ? 'bg-cute-peach border-2 border-cute-cocoa/20 shadow-xs'
                    : 'bg-cute-blush/60'
                }`}
              />
              <Text className={`text-[11px] font-bold ${item.active ? 'text-cute-cocoa' : 'text-cute-muted'}`}>
                {item.day}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Stamp Card inspired by JuJuly Cafe */}
      <View className="mt-4 pt-3 border-t border-cute-border flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5">
          <Sparkles size={14} color="#ff7d6b" />
          <Text className="text-xs font-bold text-cute-cocoa">Attendance Passport:</Text>
        </View>
        <View className="flex-row gap-1.5">
          {['🐾', '🐾', '🐾', '🐾', '⭐'].map((stamp, i) => (
            <View
              key={i}
              className="w-7 h-7 rounded-xl bg-cute-cream border border-cute-border items-center justify-center"
            >
              <Text className="text-xs">{stamp}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};
