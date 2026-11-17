/**
 * "Soft Desk" building blocks — the small set of pieces every redesigned
 * screen is made from (see the Foundations board in the design canvas).
 */
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ArrowRight } from 'lucide-react-native';
import { type CardTone } from './Card';

const INK = '#1C1C1E';

const toneBg: Record<CardTone, string> = {
  pink: 'bg-pastel-pink',
  sky: 'bg-pastel-sky',
  peach: 'bg-pastel-peach',
  mint: 'bg-pastel-mint',
  lilac: 'bg-pastel-lilac',
  butter: 'bg-pastel-butter',
};

const toneSoftBg: Record<CardTone, string> = {
  pink: 'bg-pastel-pink-soft',
  sky: 'bg-pastel-sky-soft',
  peach: 'bg-pastel-peach-soft',
  mint: 'bg-pastel-mint-soft',
  lilac: 'bg-pastel-lilac-soft',
  butter: 'bg-pastel-butter-soft',
};

/** Large, chunky screen headline. */
export const DisplayTitle: React.FC<{ children: React.ReactNode; center?: boolean; className?: string }> = ({
  children,
  center = false,
  className = '',
}) => (
  <Text
    accessibilityRole="header"
    className={`font-display text-ink text-[30px] leading-[34px] ${center ? 'text-center' : ''} ${className}`}
  >
    {children}
  </Text>
);

/** Small muted line above a title ("Good morning, Ravi"). */
export const Eyebrow: React.FC<{ children: React.ReactNode; center?: boolean; className?: string }> = ({
  children,
  center = false,
  className = '',
}) => (
  <Text className={`font-sans-semibold text-muted text-sm ${center ? 'text-center' : ''} ${className}`}>{children}</Text>
);

/** Section heading inside a screen. */
export const SectionTitle: React.FC<{ children: React.ReactNode; action?: React.ReactNode }> = ({ children, action }) => (
  <View className="flex-row items-center justify-between">
    <Text accessibilityRole="header" className="font-display text-ink text-xl">
      {children}
    </Text>
    {action}
  </View>
);

/** Rounded label chip, e.g. "Daily practice" on a hero card. */
export const Chip: React.FC<{ label: string; tone?: CardTone | 'white' | 'paper'; className?: string }> = ({
  label,
  tone = 'white',
  className = '',
}) => {
  const bg = tone === 'white' ? 'bg-white' : tone === 'paper' ? 'bg-paper' : toneSoftBg[tone];
  return (
    <View className={`self-start px-3 py-1.5 rounded-xl ${bg} ${className}`}>
      <Text className="font-sans-bold text-ink text-[13px]">{label}</Text>
    </View>
  );
};

/** Circular initials avatar on a role pastel. */
export const Avatar: React.FC<{ initials: string; tone?: CardTone; size?: number; onPress?: () => void; label?: string }> = ({
  initials,
  tone = 'pink',
  size = 48,
  onPress,
  label,
}) => {
  const body = (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className={`${toneBg[tone]} border-2 border-white items-center justify-center`}
    >
      <Text className="font-display text-ink" style={{ fontSize: size * 0.34 }}>
        {initials.slice(0, 2).toUpperCase()}
      </Text>
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label ?? 'Profile'} onPress={onPress} hitSlop={6}>
      {body}
    </Pressable>
  );
};

/** Initials from a full name ("Ravi Verma" → "RV"). */
export const initialsOf = (name?: string | null): string =>
  (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

/** A big serif number with an optional delta bubble — the screen's headline metric. */
export const BigNumber: React.FC<{
  value: string;
  label: string;
  delta?: string;
  deltaPositive?: boolean;
  unit?: string;
}> = ({ value, label, delta, deltaPositive = true, unit }) => (
  <View className="items-center">
    <Text className="font-sans-bold text-ink text-[15px]">{label}</Text>
    <View className="flex-row items-start">
      <Text
        accessibilityLabel={`${label}: ${value}${unit ?? ''}`}
        className="font-serif text-ink"
        style={{ fontSize: 112, lineHeight: 120, letterSpacing: -3 }}
      >
        {value}
        {unit ? <Text style={{ fontSize: 40 }}>{unit}</Text> : null}
      </Text>
      {delta ? (
        <View
          className={`w-11 h-11 rounded-full items-center justify-center mt-3 -ml-1 ${deltaPositive ? 'bg-go' : 'bg-pastel-pink'}`}
        >
          <Text className="font-sans-bold text-ink text-[15px]">{delta}</Text>
        </View>
      ) : null}
    </View>
  </View>
);

/** Tiny line chart used inside stat tiles. Safe with 0, 1 or many points. */
export const Sparkline: React.FC<{ points: number[]; width?: number; height?: number }> = ({
  points,
  width = 76,
  height = 24,
}) => {
  if (points.length < 2) return <View style={{ width, height }} />;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const step = (width - 8) / (points.length - 1);
  const d = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${(4 + i * step).toFixed(1)},${(height - 4 - ((p - min) / span) * (height - 8)).toFixed(1)}`)
    .join(' ');
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={width} height={height}>
        <Path d={d} stroke={INK} strokeWidth={1.6} fill="none" strokeLinejoin="round" />
      </Svg>
    </View>
  );
};

/** White stat tile: serif value, small unit, label, optional sparkline. */
export const StatTile: React.FC<{ value: string; unit?: string; label: string; trend?: number[] }> = ({
  value,
  unit,
  label,
  trend,
}) => (
  <View className="flex-1 bg-white/80 rounded-3xl px-2.5 pt-3.5 pb-3 items-center gap-0.5">
    {trend ? <Sparkline points={trend} /> : null}
    <Text className="font-serif-medium text-ink text-[30px] leading-[34px]">
      {value}
      {unit ? <Text className="text-[13px]">{unit}</Text> : null}
    </Text>
    <Text className="font-sans text-slate-600 text-[13px] text-center" numberOfLines={1}>
      {label}
    </Text>
  </View>
);

/** Pastel card with one serif sentence and a round ink arrow — "This week…" insights. */
export const InsightCard: React.FC<{
  eyebrow: string;
  message: string;
  tone?: CardTone;
  onPress?: () => void;
  actionLabel?: string;
}> = ({ eyebrow, message, tone = 'sky', onPress, actionLabel }) => (
  <View className={`${toneBg[tone]} rounded-[26px] px-5 py-5 items-center gap-2.5`}>
    <Text className="font-sans-semibold text-slate-700 text-sm">{eyebrow}</Text>
    <Text className="font-serif-medium text-ink text-[22px] leading-[28px] text-center">{message}</Text>
    {onPress ? (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={actionLabel ?? eyebrow}
        onPress={onPress}
        className="w-11 h-11 rounded-full bg-ink items-center justify-center active:opacity-80"
      >
        <ArrowRight size={20} color="#FFFFFF" />
      </Pressable>
    ) : null}
  </View>
);

export type DayDotState = 'done' | 'missed' | 'today' | 'upcoming';

/** Week strip of dots (attendance / practice days). */
export const WeekDots: React.FC<{ days: { label: string; state: DayDotState }[]; onPress?: () => void }> = ({
  days,
  onPress,
}) => {
  const summary = days.filter((d) => d.state === 'done').length;
  const content = (
    <View className="flex-row gap-3.5 justify-center">
      {days.map((d, i) => (
        <View key={`${d.label}-${i}`} className="items-center gap-1.5">
          <View
            className={`w-[22px] h-[22px] rounded-full ${
              d.state === 'done'
                ? 'bg-go'
                : d.state === 'missed'
                  ? 'bg-slate-300'
                  : d.state === 'today'
                    ? 'bg-white border-[3px] border-go'
                    : 'border-2 border-slate-300'
            }`}
          />
          <Text className="font-sans-semibold text-slate-600 text-[13px]">{d.label}</Text>
        </View>
      ))}
    </View>
  );
  if (!onPress) return <View accessibilityLabel={`${summary} days done this week`}>{content}</View>;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${summary} days done this week. Open timetable`} onPress={onPress}>
      {content}
    </Pressable>
  );
};

/** List row inside a white grouped card. */
export const ListRow: React.FC<{
  title: string;
  subtitle?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  onPress?: () => void;
  last?: boolean;
}> = ({ title, subtitle, leading, trailing, onPress, last = false }) => {
  const inner = (
    <View className={`flex-row items-center gap-3 min-h-[60px] py-2 ${last ? '' : 'border-b border-hairline'}`}>
      {leading}
      <View className="flex-1 min-w-0">
        <Text className="font-sans-bold text-ink text-[15px]" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text className="font-sans text-muted text-xs" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
    </View>
  );
  if (!onPress) return inner;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} className="active:opacity-70">
      {inner}
    </Pressable>
  );
};

/** Count pill used in "Needs you" rows. */
export const CountPill: React.FC<{ count: number; tone?: CardTone }> = ({ count, tone = 'pink' }) => (
  <View className={`min-w-[36px] h-[30px] px-2 rounded-full items-center justify-center ${toneBg[tone]}`}>
    <Text className="font-sans-bold text-ink text-sm">{count}</Text>
  </View>
);
