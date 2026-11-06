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
  accentColor = '#2563EB',
  variant = 'default',
}) => {
  const insets = useSafeAreaInsets();
  // Safe floating bottom margin accounting for Home Indicator
  const bottomMargin = insets.bottom > 0 ? insets.bottom + 6 : 18;

  return (
    <View
      style={{
        position: 'absolute',
        bottom: bottomMargin,
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'box-none',
        zIndex: 50,
      }}
      className="px-4"
    >
      <View
        style={{
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.22,
          shadowRadius: 20,
          elevation: 16,
        }}
        className="bg-slate-950/95 border border-white/10 rounded-full p-1.5 flex-row items-center justify-between gap-1 max-w-sm w-full"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.8}
              onPress={() => onTabChange(tab.key)}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              className={`flex-1 items-center justify-center py-2 px-2 rounded-full flex-row gap-1.5 ${
                isActive ? 'bg-white shadow-sm' : 'bg-transparent'
              }`}
            >
              <View className="relative">
                {tab.icon(isActive ? '#0F172A' : '#94A3B8', 19)}
                {tab.badgeCount !== undefined && tab.badgeCount > 0 && (
                  <View className="absolute -top-1.5 -right-2 bg-rose-500 rounded-full min-w-[14px] h-3.5 px-0.5 items-center justify-center border border-slate-950">
                    <Text className="text-[8px] font-black text-white leading-none">
                      {tab.badgeCount > 9 ? '9+' : tab.badgeCount}
                    </Text>
                  </View>
                )}
              </View>
              {isActive && (
                <Text
                  className="text-[11px] font-black text-slate-900 leading-none"
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};
