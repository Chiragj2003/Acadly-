import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';

export interface TestComparisonData {
  testName: string;
  studentScore: number;
  batchAvg: number;
  batchTopper: number;
  maxScore: number;
}

interface PerformanceComparisonChartProps {
  data?: TestComparisonData[];
  title?: string;
  subtitle?: string;
}

const DEFAULT_DATA: TestComparisonData[] = [
  { testName: 'Unit 1', studentScore: 88, batchAvg: 68, batchTopper: 96, maxScore: 100 },
  { testName: 'Mock 1', studentScore: 78, batchAvg: 64, batchTopper: 94, maxScore: 100 },
  { testName: 'Unit 2', studentScore: 92, batchAvg: 74, batchTopper: 98, maxScore: 100 },
  { testName: 'Midterm', studentScore: 85, batchAvg: 70, batchTopper: 97, maxScore: 100 },
];

export const PerformanceComparisonChart: React.FC<PerformanceComparisonChartProps> = ({
  data = DEFAULT_DATA,
  title = 'Student vs. Batch Topper vs. Average',
  subtitle = 'Performance benchmark across recent assessments',
}) => {
  const chartHeight = 150;
  const barGroupWidth = 55;
  const barWidth = 12;
  const safeData = data && data.length > 0 ? data : DEFAULT_DATA;
  const svgWidth = Math.max(260, safeData.length * barGroupWidth + 40);

  return (
    <View className="bg-white border-2 border-cute-border rounded-[28px] p-5 shadow-xs mb-4">
      {/* Title & Legend */}
      <View className="mb-3">
        <Text className="text-base font-black text-cute-cocoa">{title}</Text>
        <Text className="text-xs text-cute-muted">{subtitle}</Text>
      </View>

      {/* Legend Indicator Pills */}
      <View className="flex-row items-center gap-3 mb-4">
        <View className="flex-row items-center gap-1.5">
          <View className="w-3 h-3 rounded-full bg-cute-peach" />
          <Text className="text-[11px] font-bold text-cute-cocoa">You / Student</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="w-3 h-3 rounded-full bg-cute-lavender" />
          <Text className="text-[11px] font-bold text-cute-muted">Batch Avg</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="w-3 h-3 rounded-full bg-cute-mint" />
          <Text className="text-[11px] font-bold text-cute-mint">Batch Topper</Text>
        </View>
      </View>

      {/* Interactive SVG Bar Group */}
      <View className="items-center bg-cute-cream/50 rounded-2xl p-2 border border-cute-border overflow-hidden">
        <Svg height={chartHeight + 35} width="100%" viewBox={`0 0 ${svgWidth} ${chartHeight + 35}`}>
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((val) => {
            const y = chartHeight - (val / 100) * chartHeight + 10;
            return (
              <React.Fragment key={val}>
                <Line
                  x1="25"
                  y1={y}
                  x2={svgWidth}
                  y2={y}
                  stroke="#f1ebe4"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />
                <SvgText
                  x="5"
                  y={y + 3}
                  fontSize="9"
                  fill="#a89993"
                  fontWeight="600"
                >
                  {val}
                </SvgText>
              </React.Fragment>
            );
          })}

          {/* Grouped Bars */}
          {data.map((item, idx) => {
            const groupX = 35 + idx * barGroupWidth;
            const max = item.maxScore && item.maxScore > 0 ? item.maxScore : 100;
            const studentBarH = Math.max(2, Math.min(chartHeight, ((item.studentScore || 0) / max) * chartHeight));
            const avgBarH = Math.max(2, Math.min(chartHeight, ((item.batchAvg || 0) / max) * chartHeight));
            const topperBarH = Math.max(2, Math.min(chartHeight, ((item.batchTopper || 0) / max) * chartHeight));

            return (
              <React.Fragment key={item.testName}>
                {/* Student Bar */}
                <Rect
                  x={groupX}
                  y={chartHeight - studentBarH + 10}
                  width={barWidth}
                  height={studentBarH}
                  rx={4}
                  fill="#ff7d6b"
                />

                {/* Avg Bar */}
                <Rect
                  x={groupX + barWidth + 2}
                  y={chartHeight - avgBarH + 10}
                  width={barWidth}
                  height={avgBarH}
                  rx={4}
                  fill="#9e86f8"
                />

                {/* Topper Bar */}
                <Rect
                  x={groupX + (barWidth + 2) * 2}
                  y={chartHeight - topperBarH + 10}
                  width={barWidth}
                  height={topperBarH}
                  rx={4}
                  fill="#52b788"
                />

                {/* X-axis Label */}
                <SvgText
                  x={groupX + 16}
                  y={chartHeight + 26}
                  fontSize="10"
                  fill="#7d6f6a"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {item.testName}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      </View>

      {/* Snapshot Vitals Footer */}
      <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-cute-border">
        <View className="items-center flex-1">
          <Text className="text-[10px] font-semibold text-cute-muted">Latest Rank</Text>
          <Text className="text-sm font-black text-cute-peach">#02 in Batch 🏆</Text>
        </View>
        <View className="w-[1px] h-6 bg-cute-border" />
        <View className="items-center flex-1">
          <Text className="text-[10px] font-semibold text-cute-muted">Percentile</Text>
          <Text className="text-sm font-black text-cute-mint">94.8% 🔥</Text>
        </View>
        <View className="w-[1px] h-6 bg-cute-border" />
        <View className="items-center flex-1">
          <Text className="text-[10px] font-semibold text-cute-muted">Topper Gap</Text>
          <Text className="text-sm font-black text-cute-lavender">-6 Marks</Text>
        </View>
      </View>
    </View>
  );
};
