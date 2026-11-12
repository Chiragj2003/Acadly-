import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { type UserRole } from '@/types/database';

export interface CommunityComment {
  id: string;
  author: string;
  role: 'student' | 'teacher';
  text: string;
  createdAt: string;
  isTeacherVerified: boolean;
}

export interface CommunityPost {
  id: string;
  author: string;
  role: 'student' | 'teacher';
  avatarEmoji: string;
  timeAgo: string;
  subject: string;
  title: string;
  content: string;
  upvotes: number;
  hasTeacherAnswer: boolean;
  teacherName?: string;
  teacherVerifiedText?: string;
  attachmentName?: string;
  attachmentUri?: string;
  comments: CommunityComment[];
}

export interface CommunityCommentRow {
  id: string;
  post_id: string;
  author_id: string;
  author_name: string;
  author_role: UserRole;
  content: string;
  is_teacher_verified: boolean;
  created_at: string;
}

export interface CommunityPostRow {
  id: string;
  institute_id: string;
  author_id: string;
  author_name: string;
  author_role: UserRole;
  title: string;
  content: string;
  subject: string;
  upvotes_count: number;
  comments_count: number;
  has_teacher_verified_answer: boolean;
  verified_answer_text?: string;
  verified_by?: string;
  attachment_url?: string;
  attachment_name?: string;
  created_at: string;
  comments?: CommunityCommentRow[];
}

export interface CreatePostInput {
  instituteId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  title: string;
  content: string;
  subject: string;
  attachmentUrl?: string;
  attachmentName?: string;
}

/**
 * Fetch community posts for an institute with cursor-based pagination (limit 30).
 */
export const getCommunityPosts = async (
  instituteId: string,
  cursorCreatedAt?: string,
  limit = 30
): Promise<{ posts: CommunityPostRow[]; nextCursor: string | null }> => {
  if (!isSupabaseConfigured || !instituteId) {
    return { posts: [], nextCursor: null };
  }

  let query = supabase
    .from('community_posts')
    .select(`
      *,
      comments:community_comments(*)
    `)
    .eq('institute_id', instituteId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (cursorCreatedAt) {
    query = query.lt('created_at', cursorCreatedAt);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load community posts: ${error.message}`);
  }

  const rows = (data || []) as CommunityPostRow[];
  const nextCursor = rows.length === limit ? rows[rows.length - 1].created_at : null;

  return { posts: rows, nextCursor };
};

/**
 * Create a new question/post in the community forum.
 */
export const createCommunityPost = async (
  input: CreatePostInput
): Promise<CommunityPostRow> => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }

  const {
    instituteId,
    authorId,
    authorName,
    authorRole,
    title,
    content,
    subject,
    attachmentUrl,
    attachmentName,
  } = input;

  const { data, error } = await supabase
    .from('community_posts')
    .insert({
      institute_id: instituteId,
      author_id: authorId,
      author_name: authorName,
      author_role: authorRole,
      title: title.trim(),
      content: content.trim(),
      subject: subject.trim(),
      attachment_url: attachmentUrl || null,
      attachment_name: attachmentName || null,
      upvotes_count: 0,
      comments_count: 0,
      has_teacher_verified_answer: false,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to create post: ${error.message}`);
  }

  return { ...data, comments: [] } as CommunityPostRow;
};

/**
 * Upvote a community question/post.
 * Uses community_upvotes table with UNIQUE(post_id, user_id).
 * Toggles upvote if already present and updates exact count on community_posts.
 */
export const upvoteCommunityPost = async (
  postId: string,
  userId: string
): Promise<{ success: boolean; upvotesCount: number; hasUpvoted: boolean }> => {
  if (!isSupabaseConfigured) return { success: true, upvotesCount: 1, hasUpvoted: true };

  // 1. Check if user already upvoted this post
  const { data: existing } = await supabase
    .from('community_upvotes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  let hasUpvoted = false;

  if (existing) {
    // Already upvoted -> toggle remove
    await supabase
      .from('community_upvotes')
      .delete()
      .eq('id', existing.id);
    hasUpvoted = false;
  } else {
    // New upvote -> insert
    await supabase
      .from('community_upvotes')
      .insert({ post_id: postId, user_id: userId });
    hasUpvoted = true;
  }

  // 2. Count exact upvotes
  const { count } = await supabase
    .from('community_upvotes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId);

  const exactCount = count ?? 0;

  // 3. Update community_posts upvotes_count
  await supabase
    .from('community_posts')
    .update({ upvotes_count: exactCount })
    .eq('id', postId);

  return { success: true, upvotesCount: exactCount, hasUpvoted };
};

/**
 * Add a comment or solution to a community post.
 */
export const addCommunityComment = async (
  postId: string,
  authorId: string,
  authorName: string,
  authorRole: UserRole,
  content: string,
  isTeacherVerified = false
): Promise<CommunityCommentRow> => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }

  const { data, error } = await supabase
    .from('community_comments')
    .insert({
      post_id: postId,
      author_id: authorId,
      author_name: authorName,
      author_role: authorRole,
      content: content.trim(),
      is_teacher_verified: isTeacherVerified,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to add comment: ${error.message}`);
  }

  // Increment post comments count
  const { data: post } = await supabase
    .from('community_posts')
    .select('comments_count')
    .eq('id', postId)
    .single();

  await supabase
    .from('community_posts')
    .update({ comments_count: (post?.comments_count ?? 0) + 1 })
    .eq('id', postId);

  return data as CommunityCommentRow;
};

/**
 * Teacher verifies an answer as official.
 */
export const verifyCommunityAnswer = async (
  commentId: string,
  postId: string,
  verifiedBy: string,
  answerText: string,
  isVerified = true
): Promise<{ success: boolean }> => {
  if (!isSupabaseConfigured) return { success: true };

  // 1. Mark comment verified or unverified
  await supabase
    .from('community_comments')
    .update({ is_teacher_verified: isVerified })
    .eq('id', commentId);

  // 2. Mark post with verified teacher answer
  await supabase
    .from('community_posts')
    .update({
      has_teacher_verified_answer: isVerified,
      verified_answer_text: isVerified ? answerText : null,
      verified_by: isVerified ? verifiedBy : null,
    })
    .eq('id', postId);

  return { success: true };
};
