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
        container: 'bg-surface-container active:bg-surface-container-high',
        text: 'text-on-surface-variant font-semibold',
      };
    }

    switch (status) {
      case 'P':
        return {
          container: 'bg-tertiary-fixed shadow-xs',
          text: 'text-on-tertiary-fixed font-bold',
        };
      case 'A':
        return {
          container: 'bg-error-container shadow-xs',
          text: 'text-on-error-container font-bold',
        };
      case 'L':
        return {
          container: 'bg-secondary-fixed shadow-xs',
          text: 'text-on-secondary-fixed font-bold',
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
            className={`min-w-[32px] h-8 items-center justify-center px-2.5 rounded-lg ${
              style.container
            } ${disabled ? 'opacity-50' : 'active:scale-95 transition-transform'}`}
          >
            <Text className={`text-xs ${style.text}`}>{status}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};
