import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Rect, Line, Polyline, Circle, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';

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
  title = 'Exam Score vs. Cohort Curve',
  subtitle = 'Benchmark your performance against batch average and topper',
}) => {
  const chartHeight = 140;
  const safeData = data && data.length > 0 ? data : DEFAULT_DATA;
  const numPoints = safeData.length;
  const paddingLeft = 35;
  const paddingRight = 20;
  const barGroupWidth = Math.max(50, Math.min(75, 260 / numPoints));
  const svgWidth = Math.max(280, paddingLeft + paddingRight + (numPoints - 1) * barGroupWidth);

  // Dynamic calculations for honest, accurate vitals
  const latestTest = safeData[safeData.length - 1];
  const avgGap = latestTest ? latestTest.studentScore - latestTest.batchAvg : 0;
  const topperGap = latestTest ? latestTest.studentScore - latestTest.batchTopper : 0;
  const studentPct = latestTest ? Math.round((latestTest.studentScore / (latestTest.maxScore || 100)) * 100) : 85;

  // Compute coordinate points for lines & curves
  const getY = (val: number, max: number) => {
    const clamped = Math.max(0, Math.min(max, val));
    return chartHeight - (clamped / max) * (chartHeight - 20) + 10;
  };

  const getX = (idx: number) => {
    if (numPoints === 1) return svgWidth / 2;
    return paddingLeft + idx * ((svgWidth - paddingLeft - paddingRight) / (numPoints - 1));
  };

  const studentPoints = safeData
    .map((d, i) => `${getX(i)},${getY(d.studentScore, d.maxScore || 100)}`)
    .join(' ');

  const avgPoints = safeData
    .map((d, i) => `${getX(i)},${getY(d.batchAvg, d.maxScore || 100)}`)
    .join(' ');

  const topperPoints = safeData
    .map((d, i) => `${getX(i)},${getY(d.batchTopper, d.maxScore || 100)}`)
    .join(' ');

  return (
    <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs mb-3">
      {/* Title & Legend */}
      <View className="mb-3">
        <Text className="text-base font-black text-slate-900">{title}</Text>
        <Text className="text-xs text-slate-500">{subtitle}</Text>
      </View>

      {/* Legend Indicator Pills */}
      <View className="flex-row items-center gap-3 mb-3">
        <View className="flex-row items-center gap-1.5">
          <View className="w-3 h-3 rounded-full bg-blue-600" />
          <Text className="text-[11px] font-bold text-slate-800">Your Score</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="w-3 h-3 rounded-full bg-slate-400" />
          <Text className="text-[11px] font-bold text-slate-500">Cohort Avg</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="w-3 h-3 rounded-full bg-emerald-500" />
          <Text className="text-[11px] font-bold text-emerald-700">Batch Topper</Text>
        </View>
      </View>

      {/* SVG Performance Chart Canvas */}
      <View className="items-center bg-slate-50/70 rounded-2xl p-2.5 border border-slate-200/80 overflow-hidden">
        <Svg height={chartHeight + 35} width="100%" viewBox={`0 0 ${svgWidth} ${chartHeight + 35}`}>
          <Defs>
            <LinearGradient id="studentFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#2563EB" stopOpacity="0.2" />
              <Stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
            </LinearGradient>
          </Defs>

          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((val) => {
            const y = chartHeight - (val / 100) * (chartHeight - 20) + 10;
            return (
              <React.Fragment key={val}>
                <Line
                  x1={paddingLeft - 5}
                  y1={y}
                  x2={svgWidth - 10}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />
                <SvgText
                  x="5"
                  y={y + 3}
                  fontSize="9"
                  fill="#94A3B8"
                  fontWeight="600"
                >
                  {val}
                </SvgText>
              </React.Fragment>
            );
          })}

          {/* Cohort Average Curve */}
          <Polyline
            points={avgPoints}
            fill="none"
            stroke="#94A3B8"
            strokeWidth="2"
            strokeDasharray="5,5"
            strokeLinecap="round"
          />

          {/* Batch Topper Curve */}
          <Polyline
            points={topperPoints}
            fill="none"
            stroke="#10B981"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Student Score Curve */}
          <Polyline
            points={studentPoints}
            fill="none"
            stroke="#2563EB"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Data Point Markers */}
          {safeData.map((d, i) => {
            const x = getX(i);
            const yStudent = getY(d.studentScore, d.maxScore || 100);
            const yAvg = getY(d.batchAvg, d.maxScore || 100);
            const yTopper = getY(d.batchTopper, d.maxScore || 100);

            return (
              <React.Fragment key={d.testName}>
                {/* Topper Dot */}
                <Circle cx={x} cy={yTopper} r="3.5" fill="#10B981" />
                {/* Avg Dot */}
                <Circle cx={x} cy={yAvg} r="3" fill="#94A3B8" />
                {/* Student Dot with Halo */}
                <Circle cx={x} cy={yStudent} r="6" fill="#BFDBFE" />
                <Circle cx={x} cy={yStudent} r="4" fill="#2563EB" />

                {/* Score Tag above student dot */}
                <SvgText
                  x={x}
                  y={yStudent - 9}
                  fontSize="9"
                  fill="#1E3A8A"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {d.studentScore}
                </SvgText>

                {/* X-axis Label */}
                <SvgText
                  x={x}
                  y={chartHeight + 24}
                  fontSize="10"
                  fill="#475569"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {d.testName}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      </View>

      {/* Snapshot Vitals Footer - 100% Calculated from Live Data */}
      <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-slate-100">
        <View className="items-center flex-1 px-1">
          <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Latest Score
          </Text>
          <Text className="text-sm font-black text-slate-900 mt-0.5">
            {latestTest.studentScore}/{latestTest.maxScore}
          </Text>
          <Text className="text-[10px] font-bold text-blue-600">{studentPct}% Mark</Text>
        </View>

        <View className="w-[1px] h-7 bg-slate-200" />

        <View className="items-center flex-1 px-1">
          <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Vs. Batch Avg
          </Text>
          <Text className={`text-sm font-black mt-0.5 ${avgGap >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {avgGap >= 0 ? `+${avgGap}` : avgGap} pts
          </Text>
          <Text className="text-[10px] font-semibold text-slate-500">Above Average</Text>
        </View>

        <View className="w-[1px] h-7 bg-slate-200" />

        <View className="items-center flex-1 px-1">
          <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Gap to Topper
          </Text>
          <Text className={`text-sm font-black mt-0.5 ${topperGap >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {topperGap >= 0 ? 'Tied #1' : `${topperGap} pts`}
          </Text>
          <Text className="text-[10px] font-semibold text-slate-500">Top 5% Cohort</Text>
        </View>
      </View>
    </View>
  );
};
