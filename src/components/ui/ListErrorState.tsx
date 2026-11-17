import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AlertCircle, RefreshCw } from 'lucide-react-native';

export interface ListErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ListErrorState: React.FC<ListErrorStateProps> = ({
  title = 'Unable to load data',
  message = 'Failed to load data. Please check your connection and retry.',
  onRetry,
  className = '',
}) => {
  return (
    <View className={`bg-pastel-pink border-[1.5px] border-ink rounded-3xl p-5 gap-2.5 ${className}`}>
      <View className="flex-row items-center gap-2">
        <AlertCircle size={20} color="#1C1C1E" />
        <Text className="text-xl font-display text-ink">{title}</Text>
      </View>
      <Text className="text-sm font-sans text-slate-700 leading-5">{message}</Text>
      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          className="bg-ink self-start px-5 min-h-[44px] rounded-full flex-row items-center gap-2 active:opacity-80 mt-1"
        >
          <RefreshCw size={14} color="white" />
          <Text className="text-[15px] font-sans-bold text-white">Try again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
