import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Inbox } from 'lucide-react-native';

export interface ListEmptyStateProps {
  title: string;
  description?: string;
  message?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const ListEmptyState: React.FC<ListEmptyStateProps> = ({
  title,
  description,
  message,
  icon,
  actionLabel,
  onAction,
  className = '',
}) => {
  const bodyText = description || message;
  return (
    <View
      className={`bg-white rounded-3xl p-8 items-center justify-center gap-2 ${className}`}
    >
      {icon || <Inbox size={32} color="#8C877E" />}
      <Text className="text-xl font-display text-ink text-center mt-1">{title}</Text>
      {bodyText && (
        <Text className="text-sm font-sans text-slate-600 text-center max-w-[280px] leading-5">
          {bodyText}
        </Text>
      )}
      {actionLabel && onAction && (
        <TouchableOpacity
          onPress={onAction}
          className="mt-3 bg-paper px-5 min-h-[44px] justify-center rounded-full active:opacity-80"
        >
          <Text className="text-[15px] font-sans-bold text-ink">{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
