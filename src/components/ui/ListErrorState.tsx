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
    <View className={`bg-rose-50 border border-rose-200 rounded-2xl p-4 gap-2.5 ${className}`}>
      <View className="flex-row items-center gap-2">
        <AlertCircle size={18} color="#e11d48" />
        <Text className="text-xs font-bold text-rose-800">{title}</Text>
      </View>
      <Text className="text-xs text-rose-600 leading-relaxed">{message}</Text>
      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          className="bg-rose-600 self-start px-3 py-1.5 rounded-lg flex-row items-center gap-1.5 active:scale-95 mt-1"
        >
          <RefreshCw size={12} color="white" />
          <Text className="text-xs font-bold text-white">Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
