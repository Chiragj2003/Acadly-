import React from 'react';
import { View } from 'react-native';

interface ListLoadingSkeletonProps {
  count?: number;
  height?: number;
  className?: string;
}

export const ListLoadingSkeleton: React.FC<ListLoadingSkeletonProps> = ({
  count = 4,
  height = 72,
  className = '',
}) => {
  return (
    <View className={`gap-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          className="bg-slate-100 rounded-2xl animate-pulse"
          style={{ height }}
        />
      ))}
    </View>
  );
};
