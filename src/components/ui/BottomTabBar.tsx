import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface TabItem {
  key: string;
  label: string;
  icon: (color: string, size: number) => React.ReactNode;
  badgeCount?: number;
}

export interface TabBarTrailingAction {
  /** Accessible name, e.g. "Messages". */
  label: string;
  icon: (color: string, size: number) => React.ReactNode;
  onPress: () => void;
  badgeCount?: number;
}

interface BottomTabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (key: string) => void;
  /** Kept for API compatibility; the Soft Desk bar is always ink on white. */
  accentColor?: string;
  variant?: 'student' | 'calm' | 'default';
  /** Optional round button to the right of the bar (chat / helper). */
  trailingAction?: TabBarTrailingAction;
}

const INK = '#1C1C1E';
const MUTED = '#6E6A63';

const floatingShadow = {
  shadowColor: INK,
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.1,
  shadowRadius: 24,
  elevation: 10,
};

const CountBadge: React.FC<{ count: number }> = ({ count }) => (
  <View className="absolute -top-1 -right-2.5 bg-rose-600 rounded-full min-w-[16px] h-4 px-1 items-center justify-center border-2 border-white">
    <Text className="text-[9px] font-sans-bold text-white leading-none">{count > 9 ? '9+' : count}</Text>
  </View>
);

/**
 * "Soft Desk" floating tab bar: a white pill with icon + label for every tab,
 * the active tab on a paper chip, and an optional round action beside it.
 */
export const BottomTabBar: React.FC<BottomTabBarProps> = ({ tabs, activeTab, onTabChange, trailingAction }) => {
  const insets = useSafeAreaInsets();
  const bottomMargin = insets.bottom > 0 ? insets.bottom + 4 : 18;

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', bottom: bottomMargin, left: 0, right: 0, zIndex: 50 }}
      className="px-4 items-center"
    >
      <View className="flex-row items-center gap-2.5 w-full max-w-md">
        <View
          accessibilityRole="tablist"
          style={floatingShadow}
          className="flex-1 flex-row bg-white rounded-full p-1.5 gap-0.5"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => onTabChange(tab.key)}
                accessibilityRole="tab"
                accessibilityLabel={tab.label}
                accessibilityState={{ selected: isActive }}
                className={`flex-1 items-center justify-center min-h-[54px] rounded-full gap-0.5 ${
                  isActive ? 'bg-paper' : 'bg-transparent'
                }`}
              >
                <View>
                  {tab.icon(isActive ? INK : MUTED, 21)}
                  {tab.badgeCount !== undefined && tab.badgeCount > 0 && <CountBadge count={tab.badgeCount} />}
                </View>
                <Text
                  numberOfLines={1}
                  className={`text-[11px] leading-[14px] ${isActive ? 'font-sans-bold text-ink' : 'font-sans-semibold text-muted'}`}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {trailingAction && (
          <Pressable
            onPress={trailingAction.onPress}
            accessibilityRole="button"
            accessibilityLabel={trailingAction.label}
            style={floatingShadow}
            className="w-[66px] h-[66px] rounded-full bg-white items-center justify-center active:opacity-90"
          >
            <View>
              {trailingAction.icon(INK, 24)}
              {trailingAction.badgeCount !== undefined && trailingAction.badgeCount > 0 && (
                <CountBadge count={trailingAction.badgeCount} />
              )}
            </View>
          </Pressable>
        )}
      </View>
    </View>
  );
};
