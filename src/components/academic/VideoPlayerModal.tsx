import React from 'react';
import { View, Text, Modal, Pressable, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { X, Play, Clock, User, Download, Check } from 'lucide-react-native';
import { useAcademic } from '@/context/AcademicContext';
import { Badge, Button } from '@/components/ui';

export const VideoPlayerModal: React.FC = () => {
  const { activeLecture, closePlayer, offlineLectureIds, toggleOfflineDownload } = useAcademic();

  if (!activeLecture) return null;

  const isOffline = offlineLectureIds.includes(activeLecture.id);
  const videoId = activeLecture.video_id_or_url || 'dQw4w9WgXcQ';
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0`;

  return (
    <Modal visible={Boolean(activeLecture)} transparent animationType="slide">
      <View className="flex-1 bg-black/85 justify-end">
        <View className="bg-surface rounded-t-3xl overflow-hidden max-h-[92%] flex-col">
          {/* Header */}
          <View className="h-14 px-4 flex-row items-center justify-between border-b border-black/5 bg-surface-container-low">
            <View className="flex-row items-center gap-2 flex-1 min-w-0 mr-2">
              <Badge label={activeLecture.subject} variant="info" />
              <Text className="text-sm font-bold text-on-surface flex-1" numberOfLines={1}>
                {activeLecture.title}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close Player"
              onPress={closePlayer}
              className="w-8 h-8 rounded-full bg-surface-container-highest items-center justify-center active:scale-95"
            >
              <X size={18} color="#0b1c30" />
            </Pressable>
          </View>

          {/* Embedded Video Player */}
          <View className="w-full aspect-video bg-black">
            {Platform.OS === 'web' ? (
              // Web iframe
              <iframe
                src={embedUrl}
                title={activeLecture.title}
                style={{ width: '100%', height: '100%', border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              // Native WebView
              <WebView
                source={{ uri: embedUrl }}
                allowsFullscreenVideo
                javaScriptEnabled
                domStorageEnabled
                startInLoadingState
                className="flex-1"
              />
            )}
          </View>

          {/* Video Metadata & Offline Action */}
          <View className="p-4 gap-3 bg-surface">
            <View className="flex-row items-start justify-between gap-2">
              <View className="flex-1 min-w-0">
                <Text className="text-base font-bold text-on-surface">
                  {activeLecture.title}
                </Text>
                <View className="flex-row items-center gap-3 mt-1 text-on-surface-variant">
                  <View className="flex-row items-center gap-1">
                    <User size={13} color="#76777d" />
                    <Text className="text-xs text-on-surface-variant font-medium">
                      {activeLecture.faculty_name}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <Clock size={13} color="#76777d" />
                    <Text className="text-xs text-on-surface-variant font-medium">
                      {activeLecture.duration_formatted}
                    </Text>
                  </View>
                </View>
              </View>

              <Button
                size="sm"
                variant={isOffline ? 'surface' : 'outline'}
                title={isOffline ? 'Cached' : 'Save Offline'}
                leftIcon={
                  isOffline ? (
                    <Check size={14} color="#069669" />
                  ) : (
                    <Download size={14} color="#0051d5" />
                  )
                }
                onPress={() => toggleOfflineDownload(activeLecture.id)}
              />
            </View>

            <View className="p-3 rounded-xl bg-surface-container-low flex-row items-center justify-between">
              <Text className="text-xs text-on-surface-variant">
                Provider: <Text className="font-semibold text-secondary">YouTube Unlisted (Private CDN)</Text>
              </Text>
              <Badge label="1080p HD" variant="neutral" />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};
