import React from 'react';
import { View, Text } from 'react-native';
import { Mascot } from '@/components/ui';

interface AuthHeaderProps {
  title?: string;
  subtitle?: string;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({
  title = 'Welcome to Acadly',
  subtitle = 'Tuition & Coaching Management Platform',
}) => {
  return (
    <View className="items-center py-4">
      <Mascot size="lg" mood="happy" />
      <Text className="text-2xl font-black text-slate-900 mt-2">{title}</Text>
      <Text className="text-xs text-slate-500 font-medium text-center max-w-[260px] mt-0.5">
        {subtitle}
      </Text>
    </View>
  );
};
