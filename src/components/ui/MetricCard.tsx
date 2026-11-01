import React from 'react';
import { View, Text, Pressable } from 'react-native';

export type TrendDirection = 'positive' | 'negative' | 'neutral' | 'info';

export interface MetricCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  trendText?: string;
  trendDirection?: TrendDirection;
  icon?: React.ReactNode;
  onPress?: () => void;
  className?: string;
}

const trendStyles: Record<TrendDirection, { text: string; bg?: string }> = {
  positive: {
    text: 'text-on-tertiary-container font-semibold',
    bg: 'bg-tertiary-fixed/30',
  },
  negative: {
    text: 'text-error font-semibold',
    bg: 'bg-error-container',
  },
  info: {
    text: 'text-secondary font-semibold',
    bg: 'bg-secondary-fixed/40',
  },
  neutral: {
    text: 'text-on-surface-variant font-medium',
    bg: 'bg-surface-container',
  },
};

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subValue,
  trendText,
  trendDirection = 'neutral',
  icon,
  onPress,
  className = '',
}) => {
  const trend = trendStyles[trendDirection];

  const content = (
    <View className="flex-col justify-between">
      <View className="flex-row items-start justify-between">
        <Text
          className="text-xs text-on-surface-variant font-medium flex-1 mr-2"
          numberOfLines={1}
        >
          {title}
        </Text>
        {icon && (
          <View className="w-8 h-8 rounded-xl bg-surface-container items-center justify-center">
            {icon}
          </View>
        )}
      </View>

      <View className="mt-2.5">
        <View className="flex-row items-baseline gap-1">
          <Text
            className="text-2xl font-bold text-on-surface tracking-tight"
            numberOfLines={1}
          >
            {value}
          </Text>
          {subValue && (
            <Text className="text-xs text-on-surface-variant font-medium">
              {subValue}
            </Text>
          )}
        </View>

        {trendText && (
          <View className="flex-row items-center gap-1 mt-1">
            <Text
              className={`text-xs ${trend.text}`}
              numberOfLines={1}
            >
              {trendText}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const containerStyle = `bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-black/5 ${className}`;

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className={`${containerStyle} active:scale-[0.99]`}
      >
        {content}
      </Pressable>
    );
  }

  return <View className={containerStyle}>{content}</View>;
};
