import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';

interface AttendanceRingAndTrendChartProps {
  presentRate?: number;
  percentage?: number;
  totalClasses?: number;
  presentCount?: number;
  absentCount?: number;
  lateCount?: number;
}

export const AttendanceRingAndTrendChart: React.FC<AttendanceRingAndTrendChartProps> = ({
  presentRate,
  percentage,
  totalClasses = 96,
  presentCount = 92,
  absentCount = 1,
  lateCount = 3,
}) => {
  const rawRate = percentage ?? presentRate ?? (totalClasses > 0 ? (presentCount / totalClasses) * 100 : 96.4);
  const effectiveRate = Math.min(100, Math.max(0, Number(rawRate.toFixed(1))));
  const radius = 42;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (effectiveRate / 100) * circumference;

  const trendPoints = "10,50 35,45 60,30 85,38 110,22 135,15";

  return (
    <View className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs mb-4">
      <View className="flex-row items-center justify-between mb-4">
        <View>
          <Text className="text-base font-black text-slate-900">Attendance Consistency</Text>
          <Text className="text-xs text-slate-600">Monthly ring + 6-month trend</Text>
        </View>
        <View className="bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          <Text className="text-[10px] font-bold text-emerald-700">
            {effectiveRate >= 90 ? 'Target 90%+ Met 🎯' : `${effectiveRate}% Current`}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between gap-4 mb-4">
        {/* SVG Circular Ring Chart */}
        <View className="items-center justify-center">
          <Svg width={110} height={110} viewBox="0 0 110 110">
            {/* Background Ring */}
            <Circle
              cx="55"
              cy="55"
              r={radius}
              stroke="#E2E8F0"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Progress Ring */}
            <Circle
              cx="55"
              cy="55"
              r={radius}
              stroke="#10B981"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              transform="rotate(-90 55 55)"
            />
          </Svg>
          <View className="absolute items-center">
            <Text className="text-xl font-black text-slate-900">{effectiveRate}%</Text>
            <Text className="text-[9px] font-bold text-slate-600 uppercase">Rate</Text>
          </View>
        </View>

        {/* 6-Month Trend Curve */}
        <View className="flex-1 bg-slate-50 rounded-2xl p-3 border border-slate-200/80">
          <Text className="text-[10px] font-bold text-slate-600 uppercase mb-1">
            6-Month Attendance Streak
          </Text>
          <Svg width="100%" height={60} viewBox="0 0 145 60">
            <Line x1="10" y1="55" x2="140" y2="55" stroke="#CBD5E1" strokeWidth="1" />
            <Polyline
              points={trendPoints}
              fill="none"
              stroke="#2563EB"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <SvgText x="10" y="58" fontSize="8" fill="#64748B">Jun</SvgText>
            <SvgText x="70" y="58" fontSize="8" fill="#64748B">Aug</SvgText>
            <SvgText x="130" y="58" fontSize="8" fill="#64748B">Nov</SvgText>
          </Svg>
        </View>
      </View>

      {/* Stats Counter Trio */}
      <View className="flex-row gap-2">
        <View className="flex-1 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 items-center">
          <Text className="text-xs font-bold text-emerald-800">Present</Text>
          <Text className="text-base font-black text-emerald-900">{presentCount} Days</Text>
        </View>

        <View className="flex-1 bg-amber-50 border border-amber-200 rounded-xl p-2.5 items-center">
          <Text className="text-xs font-bold text-amber-800">Late</Text>
          <Text className="text-base font-black text-amber-900">{lateCount} Days</Text>
        </View>

        <View className="flex-1 bg-rose-50 border border-rose-200 rounded-xl p-2.5 items-center">
          <Text className="text-xs font-bold text-rose-800">Absent</Text>
          <Text className="text-base font-black text-rose-900">{absentCount} Day</Text>
        </View>
      </View>
    </View>
  );
};
