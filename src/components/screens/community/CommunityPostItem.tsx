import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ThumbsUp, MessageSquare, Paperclip, CheckCircle2, User } from 'lucide-react-native';
import { type CommunityPost } from '@/services/communityService';

interface CommunityPostItemProps {
  post: CommunityPost;
  onUpvote: (postId: string) => void;
  onOpenComments: (post: CommunityPost) => void;
  onOpenAttachment?: (url: string) => void;
}

export const CommunityPostItem: React.FC<CommunityPostItemProps> = ({
  post,
  onUpvote,
  onOpenComments,
  onOpenAttachment,
}) => {
  return (
    <View className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs gap-2.5 mb-3">
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View className="w-7 h-7 rounded-full bg-blue-100 items-center justify-center">
            <Text className="text-xs">{post.avatarEmoji || '👤'}</Text>
          </View>
          <View>
            <Text className="text-xs font-sans-bold text-slate-800">{post.author}</Text>
            <Text className="text-[10px] text-slate-400">{post.timeAgo}</Text>
          </View>
        </View>

        {post.hasTeacherAnswer && (
          <View className="flex-row items-center gap-1 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            <CheckCircle2 size={11} color="#059669" />
            <Text className="text-[10px] font-sans-bold text-emerald-700">Teacher Verified</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View className="gap-1">
        <Text className="text-sm font-display text-slate-900 leading-snug">{post.title}</Text>
        <Text className="text-xs text-slate-600 leading-relaxed">{post.content}</Text>
      </View>

      {/* Attachment Pill if present */}
      {post.attachmentUri && onOpenAttachment && (
        <TouchableOpacity
          onPress={() => onOpenAttachment(post.attachmentUri!)}
          className="flex-row items-center gap-1.5 self-start bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200"
        >
          <Paperclip size={12} color="#6E6A63" />
          <Text className="text-[11px] font-sans-semibold text-slate-700">
            {post.attachmentName || 'View Attachment'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Actions */}
      <View className="flex-row items-center justify-between pt-2 border-t border-slate-100">
        <TouchableOpacity
          onPress={() => onUpvote(post.id)}
          className="flex-row items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl active:scale-95"
        >
          <ThumbsUp size={13} color="#1C1C1E" />
          <Text className="text-xs font-sans-bold text-slate-700">{post.upvotes || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onOpenComments(post)}
          className="flex-row items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl active:scale-95"
        >
          <MessageSquare size={13} color="#6E6A63" />
          <Text className="text-xs font-sans-bold text-slate-700">
            {post.comments ? post.comments.length : 0} Replies
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
