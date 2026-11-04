import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';

export interface MonthlyFeeData {
  month: string;
  collectedAmount: number; // in thousands (₹K)
  pendingAmount: number;   // in thousands (₹K)
}

const DEFAULT_FEES: MonthlyFeeData[] = [
  { month: 'Jul', collectedAmount: 180, pendingAmount: 20 },
  { month: 'Aug', collectedAmount: 240, pendingAmount: 35 },
  { month: 'Sep', collectedAmount: 210, pendingAmount: 40 },
  { month: 'Oct', collectedAmount: 290, pendingAmount: 25 },
  { month: 'Nov', collectedAmount: 310, pendingAmount: 15 },
];

export const FeeCollectionBarChart: React.FC = () => {
  const chartHeight = 120;
  const barGroupWidth = 50;
  const barWidth = 14;
  const maxVal = 350;
  const svgWidth = DEFAULT_FEES.length * barGroupWidth + 40;

  return (
    <View className="bg-white border-2 border-cute-border rounded-[28px] p-5 shadow-xs mb-4">
      <View className="flex-row items-center justify-between mb-3">
        <View>
          <Text className="text-base font-black text-cute-cocoa">Fee Recovery & Dues Trend</Text>
          <Text className="text-xs text-cute-muted">Monthly collection vs. outstanding balance</Text>
        </View>
        <View className="bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          <Text className="text-[10px] font-bold text-emerald-800">88.4% Recovery</Text>
        </View>
      </View>

      {/* Legend */}
      <View className="flex-row items-center gap-4 mb-3">
        <View className="flex-row items-center gap-1.5">
          <View className="w-3 h-3 rounded-full bg-emerald-500" />
          <Text className="text-[11px] font-bold text-cute-cocoa">Collected (₹K)</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="w-3 h-3 rounded-full bg-rose-400" />
          <Text className="text-[11px] font-bold text-cute-muted">Pending Dues (₹K)</Text>
        </View>
      </View>

      {/* SVG Bar Chart */}
      <View className="items-center bg-cute-cream/50 rounded-2xl p-2 border border-cute-border">
        <Svg height={chartHeight + 35} width={svgWidth}>
          {[0, 100, 200, 300].map((val) => {
            const y = chartHeight - (val / maxVal) * chartHeight + 10;
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
                <SvgText x="5" y={y + 3} fontSize="9" fill="#a89993" fontWeight="600">
                  {val}k
                </SvgText>
              </React.Fragment>
            );
          })}

          {DEFAULT_FEES.map((item, idx) => {
            const groupX = 35 + idx * barGroupWidth;
            const collectedH = (item.collectedAmount / maxVal) * chartHeight;
            const pendingH = (item.pendingAmount / maxVal) * chartHeight;

            return (
              <React.Fragment key={item.month}>
                {/* Collected Bar */}
                <Rect
                  x={groupX}
                  y={chartHeight - collectedH + 10}
                  width={barWidth}
                  height={collectedH}
                  rx={4}
                  fill="#52b788"
                />

                {/* Pending Bar */}
                <Rect
                  x={groupX + barWidth + 3}
                  y={chartHeight - pendingH + 10}
                  width={barWidth}
                  height={pendingH}
                  rx={4}
                  fill="#ff7d6b"
                />

                {/* Month Label */}
                <SvgText
                  x={groupX + 15}
                  y={chartHeight + 26}
                  fontSize="10"
                  fill="#7d6f6a"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {item.month}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      </View>
    </View>
  );
};
