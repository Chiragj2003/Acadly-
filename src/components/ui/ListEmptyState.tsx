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
      className={`bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-8 items-center justify-center gap-2 ${className}`}
    >
      {icon || <Inbox size={32} color="#94a3b8" />}
      <Text className="text-sm font-bold text-slate-800 text-center mt-1">{title}</Text>
      {bodyText && (
        <Text className="text-xs text-slate-500 text-center max-w-[280px] leading-relaxed">
          {bodyText}
        </Text>
      )}
      {actionLabel && onAction && (
        <TouchableOpacity
          onPress={onAction}
          className="mt-3 bg-blue-600 px-4 py-2 rounded-xl active:scale-95"
        >
          <Text className="text-xs font-bold text-white">{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
