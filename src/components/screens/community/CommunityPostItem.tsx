import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ThumbsUp, MessageSquare, Paperclip } from 'lucide-react-native';
import { type CommunityPost } from '@/services/communityService';

interface CommunityPostItemProps {
  post: CommunityPost;
  /** Highlight as the outlined pastel lead card (first open doubt). */
  hero?: boolean;
  onUpvote: (postId: string) => void;
  onOpenComments: (post: CommunityPost) => void;
  onOpenAttachment?: (url: string) => void;
}

const initialsOf = (name: string) =>
  (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

/** Soft Desk doubt card: who asked, the question in serif, and replies / "same doubt". */
export const CommunityPostItem: React.FC<CommunityPostItemProps> = ({ post, hero = false, onUpvote, onOpenComments, onOpenAttachment }) => {
  const replies = post.comments ? post.comments.length : 0;
  return (
    <View className={`rounded-3xl p-4 gap-2.5 mb-3 ${hero ? 'bg-pastel-pink border-[1.5px] border-ink' : 'bg-white'}`}>
      <View className="flex-row items-center gap-2.5">
        <View className={`w-[34px] h-[34px] rounded-full items-center justify-center ${hero ? 'bg-white' : 'bg-pastel-sky'}`}>
          <Text className="font-display text-ink text-xs">{initialsOf(post.author)}</Text>
        </View>
        <View className="flex-1 min-w-0">
          <Text className="font-sans-bold text-ink text-sm" numberOfLines={1}>
            {post.author}
          </Text>
          <Text className="font-sans text-slate-600 text-xs">{post.timeAgo}</Text>
        </View>
        <View className={`px-2.5 py-1 rounded-xl ${post.hasTeacherAnswer ? 'bg-pastel-mint' : hero ? 'bg-white' : 'bg-paper'}`}>
          <Text className="font-sans-bold text-ink text-xs">{post.hasTeacherAnswer ? 'Answered' : 'Open'}</Text>
        </View>
      </View>

      <Text className="font-serif-medium text-ink text-[19px] leading-[25px]">{post.title}</Text>
      {post.content ? (
        <Text className="font-sans text-slate-700 text-sm leading-5" numberOfLines={4}>
          {post.content}
        </Text>
      ) : null}

      {post.attachmentUri && onOpenAttachment ? (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => onOpenAttachment(post.attachmentUri!)}
          className={`self-start h-8 px-3 rounded-full flex-row items-center gap-1.5 ${hero ? 'bg-white' : 'bg-paper'}`}
        >
          <Paperclip size={13} color="#1C1C1E" />
          <Text className="font-sans-semibold text-ink text-xs">{post.attachmentName || 'Attachment'}</Text>
        </TouchableOpacity>
      ) : null}

      <View className="flex-row items-center gap-2">
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`I have this doubt too, ${post.upvotes || 0}`}
          onPress={() => onUpvote(post.id)}
          className={`h-10 px-3.5 rounded-full flex-row items-center gap-1.5 ${hero ? 'bg-white' : 'bg-paper'}`}
        >
          <ThumbsUp size={14} color="#1C1C1E" />
          <Text className="font-sans-bold text-ink text-[13px]">Same doubt · {post.upvotes || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => onOpenComments(post)}
          className={`h-10 px-3.5 rounded-full flex-row items-center gap-1.5 ${hero ? 'bg-white' : 'bg-paper'}`}
        >
          <MessageSquare size={14} color="#1C1C1E" />
          <Text className="font-sans-bold text-ink text-[13px]">
            {replies} {replies === 1 ? 'reply' : 'replies'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
