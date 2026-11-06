import React from 'react';
import { View, Text } from 'react-native';

export interface SubjectMasteryData {
  subject: string;
  emoji: string;
  percentage: number;
  grade: string;
  color: string;
  bgLight: string;
  status: 'Strong' | 'Improving' | 'Focus Needed';
}

const DEFAULT_SUBJECTS: SubjectMasteryData[] = [
  { subject: 'Mathematics', emoji: '📐', percentage: 94, grade: 'A+', color: '#ff7d6b', bgLight: '#fff0ec', status: 'Strong' },
  { subject: 'Physics', emoji: '⚡', percentage: 88, grade: 'A', color: '#9e86f8', bgLight: '#f3efff', status: 'Strong' },
  { subject: 'Biology', emoji: '🌿', percentage: 82, grade: 'B+', color: '#52b788', bgLight: '#e8f8f0', status: 'Improving' },
  { subject: 'Chemistry', emoji: '🧪', percentage: 68, grade: 'B', color: '#ffc93c', bgLight: '#fff9e6', status: 'Focus Needed' },
];

interface SubjectRadarOrBarChartProps {
  data?: SubjectMasteryData[];
  title?: string;
}

export const SubjectRadarOrBarChart: React.FC<SubjectRadarOrBarChartProps> = ({
  data = DEFAULT_SUBJECTS,
  title = 'Subject-Wise Mastery Breakdown',
}) => {
  const safeData = data && data.length > 0 ? data : DEFAULT_SUBJECTS;
  const avg = Math.round(safeData.reduce((acc, curr) => acc + curr.percentage, 0) / safeData.length);

  return (
    <View className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs mb-4">
      <View className="flex-row items-center justify-between mb-3">
        <View>
          <Text className="text-base font-black text-slate-900">{title}</Text>
          <Text className="text-xs text-slate-600">Based on quizzes, assignments & unit tests</Text>
        </View>
        <View className="bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
          <Text className="text-[10px] font-bold text-blue-700">Avg {avg}% ⭐</Text>
        </View>
      </View>

      <View className="gap-3 mt-1">
        {safeData.map((item) => (
          <View key={item.subject} className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
            <View className="flex-row items-center justify-between mb-1.5">
              <View className="flex-row items-center gap-2">
                <Text className="text-lg">{item.emoji}</Text>
                <Text className="text-xs font-black text-slate-900">{item.subject}</Text>
              </View>

              <View className="flex-row items-center gap-2">
                <Text className="text-xs font-black text-slate-900">{item.percentage}%</Text>
                <View
                  style={{ backgroundColor: item.bgLight, borderColor: item.color }}
                  className="px-2 py-0.5 rounded-md border"
                >
                  <Text style={{ color: item.color }} className="text-[9px] font-bold uppercase">
                    {item.status}
                  </Text>
                </View>
              </View>
            </View>

            {/* Custom rounded progress bar */}
            <View className="h-2.5 bg-slate-200/70 rounded-full overflow-hidden">
              <View
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: item.color,
                }}
                className="h-full rounded-full"
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};
