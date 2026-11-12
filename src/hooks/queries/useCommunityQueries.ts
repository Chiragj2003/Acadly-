import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCommunityPosts,
  createCommunityPost,
  upvoteCommunityPost,
  addCommunityComment,
  verifyCommunityAnswer,
  CreatePostInput,
  CommunityPost,
} from '@/services/communityService';
import { type UserRole } from '@/types/database';

export const COMMUNITY_QUERY_KEY = 'community';

export function useCommunityPosts(instituteId?: string, cursorCreatedAt?: string) {
  return useQuery<CommunityPost[]>({
    queryKey: [COMMUNITY_QUERY_KEY, instituteId, cursorCreatedAt],
    queryFn: async () => {
      const res = await getCommunityPosts(instituteId!, cursorCreatedAt);
      if (res.posts && res.posts.length > 0) {
        return res.posts.map((p) => ({
          id: p.id,
          author: p.author_name,
          role: p.author_role === 'teacher' ? 'teacher' : 'student',
          avatarEmoji: p.author_role === 'teacher' ? '👨‍🏫' : '🌸',
          timeAgo: 'Recently',
          subject: p.subject,
          title: p.title,
          content: p.content,
          upvotes: p.upvotes_count || 0,
          hasTeacherAnswer: p.has_teacher_verified_answer || false,
          teacherName: p.verified_by,
          teacherVerifiedText: p.verified_answer_text,
          attachmentName: p.attachment_name,
          attachmentUri: p.attachment_url,
          comments: (p.comments || []).map((c) => ({
            id: c.id,
            author: c.author_name,
            role: c.author_role === 'teacher' ? 'teacher' : 'student',
            text: c.content,
            createdAt: 'Recently',
            isTeacherVerified: c.is_teacher_verified || false,
          })),
        }));
      }
      return [];
    },
    enabled: Boolean(instituteId),
  });
}

export function useCreateCommunityPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePostInput) => createCommunityPost(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [COMMUNITY_QUERY_KEY, variables.instituteId],
      });
    },
  });
}

export function useUpvoteCommunityPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { postId: string; userId: string; instituteId?: string }) =>
      upvoteCommunityPost(params.postId, params.userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COMMUNITY_QUERY_KEY] });
    },
  });
}

export function useAddCommunityComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      postId: string;
      authorId: string;
      authorName: string;
      authorRole: UserRole;
      content: string;
      isTeacherVerified?: boolean;
    }) =>
      addCommunityComment(
        params.postId,
        params.authorId,
        params.authorName,
        params.authorRole,
        params.content,
        params.isTeacherVerified
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COMMUNITY_QUERY_KEY] });
    },
  });
}

export function useVerifyCommunityAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      commentId: string;
      postId: string;
      verifiedBy: string;
      answerText: string;
      isVerified?: boolean;
    }) =>
      verifyCommunityAnswer(
        params.commentId,
        params.postId,
        params.verifiedBy,
        params.answerText,
        params.isVerified
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COMMUNITY_QUERY_KEY] });
    },
  });
}
