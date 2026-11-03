import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
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
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  tabs,
  activeTab,
  onTabChange,
  accentColor = '#2563EB', // Academic Indigo
}) => {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'ios' ? 14 : 10);

  return (
    <View
      style={{
        paddingBottom: bottomPadding,
        paddingTop: 8,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 8,
      }}
      className="px-2 flex-row items-center justify-around"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            activeOpacity={0.75}
            onPress={() => onTabChange(tab.key)}
            className="items-center justify-center py-1 px-2.5 rounded-2xl relative min-w-[56px]"
          >
            {/* Active Pill Glow */}
            <View
              className={`p-1.5 rounded-2xl items-center justify-center ${
                isActive ? 'bg-blue-50/90' : 'bg-transparent'
              }`}
            >
              {tab.icon(isActive ? accentColor : '#64748B', 20)}

              {/* Notification Badge Dot */}
              {tab.badgeCount !== undefined && tab.badgeCount > 0 && (
                <View className="absolute -top-1 -right-1 bg-rose-500 rounded-full min-w-[16px] h-4 px-1 items-center justify-center border-2 border-white">
                  <Text className="text-[9px] font-black text-white">
                    {tab.badgeCount > 9 ? '9+' : tab.badgeCount}
                  </Text>
                </View>
              )}
            </View>

            <Text
              style={{ color: isActive ? accentColor : '#64748B' }}
              className={`text-[11px] mt-0.5 tracking-tight ${
                isActive ? 'font-bold' : 'font-medium'
              }`}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};
