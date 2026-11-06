import React from 'react';
import { View, Text, Pressable } from 'react-native';

export type AttendanceStatus = 'P' | 'A' | 'L';

export interface AttendanceToggleProps {
  value?: AttendanceStatus;
  onChange: (status: AttendanceStatus) => void;
  disabled?: boolean;
  className?: string;
}

export const AttendanceToggle: React.FC<AttendanceToggleProps> = ({
  value,
  onChange,
  disabled = false,
  className = '',
}) => {
  const getButtonStyles = (status: AttendanceStatus) => {
    const isSelected = value === status;

    if (!isSelected) {
      return {
        container: 'bg-cute-cream border border-cute-border',
        text: 'text-cute-muted font-bold',
      };
    }

    switch (status) {
      case 'P':
        return {
          container: 'bg-emerald-100 border-2 border-emerald-500 shadow-xs',
          text: 'text-emerald-900 font-black',
        };
      case 'A':
        return {
          container: 'bg-rose-100 border-2 border-rose-500 shadow-xs',
          text: 'text-rose-900 font-black',
        };
      case 'L':
        return {
          container: 'bg-amber-100 border-2 border-amber-500 shadow-xs',
          text: 'text-amber-900 font-black',
        };
    }
  };

  const statuses: AttendanceStatus[] = ['P', 'A', 'L'];

  return (
    <View className={`flex-row items-center gap-1.5 ${className}`}>
      {statuses.map((status) => {
        const style = getButtonStyles(status);
        const isSelected = value === status;

        return (
          <Pressable
            key={status}
            accessibilityRole="button"
            accessibilityLabel={`Mark ${
              status === 'P' ? 'Present' : status === 'A' ? 'Absent' : 'Late'
            }`}
            accessibilityState={{ selected: isSelected, disabled }}
            disabled={disabled}
            onPress={() => onChange(status)}
            className={`min-w-[34px] h-8 items-center justify-center px-2.5 rounded-xl ${
              style.container
            } ${disabled ? 'opacity-50' : 'active:scale-95'}`}
          >
            <Text className={`text-xs ${style.text}`}>{status}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};
