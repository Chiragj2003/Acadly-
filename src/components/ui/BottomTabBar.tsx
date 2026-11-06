import React from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface TabItem {
  key: string;
  label: string;
  icon: (color: string, size: number) => React.ReactNode;
  badgeCount?: number;
}

interface BottomTabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (key: string) => void;
  accentColor?: string;
  variant?: 'student' | 'calm' | 'default';
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  tabs,
  activeTab,
  onTabChange,
  accentColor = '#2563EB', // Academic Indigo / Blue
  variant = 'default',
}) => {
  const insets = useSafeAreaInsets();
  // Safe bottom padding for modern iOS home indicator (~34pt) and Android gesture bar (~16-24pt)
  const bottomPadding = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'ios' ? 14 : 10);

  return (
    <View
      style={{
        paddingTop: 6,
        paddingBottom: bottomPadding,
        backgroundColor: '#FFFFFF',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#E2E8F0',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 8,
      }}
      className="flex-row items-center w-full px-1"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        const tint = isActive ? accentColor : '#64748B';

        return (
          <TouchableOpacity
            key={tab.key}
            activeOpacity={0.7}
            onPress={() => onTabChange(tab.key)}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            className="flex-1 items-center justify-center py-1 relative"
          >
            {/* Active Pill / Icon Container */}
            <View className="items-center justify-center relative">
              <View
                className={`px-3 py-1 rounded-full items-center justify-center ${
                  isActive ? 'bg-blue-50/90' : 'bg-transparent'
                }`}
              >
                {tab.icon(tint, 21)}
              </View>

              {/* Notification Badge Dot */}
              {tab.badgeCount !== undefined && tab.badgeCount > 0 && (
                <View className="absolute -top-1 -right-1 bg-rose-500 rounded-full min-w-[16px] h-4 px-1 items-center justify-center border-2 border-white shadow-xs">
                  <Text className="text-[9px] font-black text-white leading-none">
                    {tab.badgeCount > 9 ? '9+' : tab.badgeCount}
                  </Text>
                </View>
              )}
            </View>

            {/* Tab Label */}
            <Text
              style={{ color: tint }}
              className={`text-[10px] mt-0.5 tracking-tight ${
                isActive ? 'font-extrabold' : 'font-semibold'
              }`}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};
