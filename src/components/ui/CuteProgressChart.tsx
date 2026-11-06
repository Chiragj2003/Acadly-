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
    <View className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs mb-4">
      {/* Header with Streak */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-2">
          <View className="w-9 h-9 rounded-2xl bg-amber-100 items-center justify-center border border-amber-200">
            <Flame size={18} color="#f59e0b" fill="#f59e0b" />
          </View>
          <View>
            <Text className="text-base font-extrabold text-slate-900">Study Streak: 6 Days!</Text>
            <Text className="text-xs text-slate-500">You are on fire this week 🔥</Text>
          </View>
        </View>

        <View className="bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
          <Text className="text-[11px] font-bold text-blue-700">Level 4 Scholar ⭐</Text>
        </View>
      </View>

      {/* Metric Cards Mosaic (from Jacob's dashboard) */}
      <View className="flex-row gap-2.5 mb-5">
        <View className="flex-1 bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 items-center">
          <Text className="text-xs font-semibold text-slate-500">Completed</Text>
          <Text className="text-2xl font-black text-slate-900 mt-0.5">48</Text>
          <Text className="text-[10px] font-bold text-emerald-600 mt-0.5">Lessons 📖</Text>
        </View>

        <View className="flex-1 bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 items-center">
          <Text className="text-xs font-semibold text-slate-500">Time Invested</Text>
          <Text className="text-2xl font-black text-slate-900 mt-0.5">14.5</Text>
          <Text className="text-[10px] font-bold text-blue-600 mt-0.5">Hours Studied ⏳</Text>
        </View>

        <View className="flex-1 bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 items-center">
          <Text className="text-xs font-semibold text-slate-500">Accuracy</Text>
          <Text className="text-2xl font-black text-slate-900 mt-0.5">94%</Text>
          <Text className="text-[10px] font-bold text-purple-600 mt-0.5">Quiz Score 🎯</Text>
        </View>
      </View>

      {/* Pill Bar Chart inspired by Jacob's dashboard */}
      <View className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Daily Study Rhythm
          </Text>
          <Text className="text-[11px] font-semibold text-slate-500">Weekly Avg: 3.5h</Text>
        </View>

        <View className="flex-row items-end justify-between h-28 pt-2 px-1">
          {weekData.map((item, idx) => (
            <View key={idx} className="items-center gap-1.5 flex-1">
              <Text className={`text-[10px] font-bold ${item.active ? 'text-blue-600' : 'text-slate-500'}`}>
                {item.hours}h
              </Text>
              <View
                className={`w-7 ${item.height} rounded-full ${
                  item.active
                    ? 'bg-blue-600 shadow-xs'
                    : 'bg-slate-200'
                }`}
              />
              <Text className={`text-[11px] font-bold ${item.active ? 'text-slate-900' : 'text-slate-500'}`}>
                {item.day}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Stamp Card inspired by JuJuly Cafe */}
      <View className="mt-4 pt-3 border-t border-slate-200/80 flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5">
          <Sparkles size={14} color="#2563EB" />
          <Text className="text-xs font-bold text-slate-800">Attendance Passport:</Text>
        </View>
        <View className="flex-row gap-1.5">
          {['🐾', '🐾', '🐾', '🐾', '⭐'].map((stamp, i) => (
            <View
              key={i}
              className="w-7 h-7 rounded-xl bg-white border border-slate-200 items-center justify-center"
            >
              <Text className="text-xs">{stamp}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};
