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
  // Soft Desk roll call: a paper track with round P / A / L chips.
  // Present = green, Absent = ink, Late = butter (they differ in lightness, not only hue).
  const getButtonStyles = (status: AttendanceStatus) => {
    if (value !== status) {
      return { container: 'bg-transparent', text: 'text-muted font-sans-bold' };
    }
    switch (status) {
      case 'P':
        return { container: 'bg-go', text: 'text-ink font-display' };
      case 'A':
        return { container: 'bg-ink', text: 'text-white font-display' };
      case 'L':
        return { container: 'bg-[#F2C14E]', text: 'text-ink font-display' };
    }
  };

  const statuses: AttendanceStatus[] = ['P', 'A', 'L'];

  return (
    <View className={`flex-row items-center gap-1 p-[3px] rounded-full bg-paper ${className}`}>
      {statuses.map((status) => {
        const style = getButtonStyles(status);
        const isSelected = value === status;

        return (
          <Pressable
            key={status}
            accessibilityRole="radio"
            accessibilityLabel={`Mark ${
              status === 'P' ? 'Present' : status === 'A' ? 'Absent' : 'Late'
            }`}
            accessibilityState={{ checked: isSelected, disabled }}
            disabled={disabled}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            onPress={() => onChange(status)}
            className={`w-11 h-11 items-center justify-center rounded-full ${
              style.container
            } ${disabled ? 'opacity-50' : 'active:opacity-80'}`}
          >
            <Text className={`text-sm ${style.text}`}>{status}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};
