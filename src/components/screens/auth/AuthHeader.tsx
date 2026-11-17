import React from 'react';
import { View, Text } from 'react-native';
import { Mascot } from '@/components/ui';

interface AuthHeaderProps {
  title?: string;
  subtitle?: string;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({
  title = 'Good to see you.',
  subtitle = 'Class, practice and progress, in one calm place.',
}) => {
  return (
    <View className="items-center pt-2 pb-4 gap-2">
      <Mascot size="lg" mood="happy" />
      <Text accessibilityRole="header" className="text-[30px] leading-[34px] font-display text-ink text-center mt-3">
        {title}
      </Text>
      <Text className="text-[15px] text-slate-600 font-sans text-center max-w-[290px]">
        {subtitle}
      </Text>
    </View>
  );
};
