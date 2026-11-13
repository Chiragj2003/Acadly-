import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { type Announcement } from '@/types/database';

export interface PostAnnouncementInput {
  instituteId: string;
  batchId?: string | null;
  title: string;
  content: string;
  priority?: 'normal' | 'urgent' | 'high';
}

/**
 * Fetch announcements for an institute and optionally filtered by batch.
 * Also checks whether the current user has marked each announcement as read.
 */
export const fetchAnnouncements = async (
  instituteId: string,
  batchId?: string
): Promise<Announcement[]> => {
  if (!isSupabaseConfigured || !instituteId) {
    return [];
  }

  let query = supabase
    .from('announcements')
    .select(`
      *,
      author:profiles!announcements_author_id_fkey(full_name),
      reads:announcement_reads(user_id)
    `)
    .eq('institute_id', instituteId)
    .order('created_at', { ascending: false });

  if (batchId) {
    query = query.or(`batch_id.eq.${batchId},batch_id.is.null`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch announcements: ${error.message}`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const currentUid = user?.id;

  return (data || []).map((item: any) => {
    const readUsers: { user_id: string }[] = item.reads || [];
    const isRead = currentUid ? readUsers.some((r) => r.user_id === currentUid) : false;

    return {
      id: item.id,
      institute_id: item.institute_id,
      batch_id: item.batch_id,
      author_id: item.author_id,
      title: item.title,
      content: item.content,
      priority: item.priority || 'normal',
      created_at: item.created_at,
      updated_at: item.updated_at,
      author_name: item.author?.full_name || 'Tuition Faculty',
      read_count: readUsers.length,
      is_read: isRead,
    } as Announcement;
  });
};

/**
 * Publish a new announcement to an entire institute or specific batch.
 * Calls atomic SECURITY DEFINER RPC post_announcement.
 */
export const postAnnouncement = async (
  input: PostAnnouncementInput
): Promise<{ success: boolean; announcementId: string; title: string }> => {
  const { instituteId, batchId, title, content, priority = 'normal' } = input;

  if (!isSupabaseConfigured) {
    return {
      success: true,
      announcementId: 'mock-announcement-id',
      title,
    };
  }

  const { data, error } = await supabase.rpc('post_announcement', {
    p_institute_id: instituteId,
    p_batch_id: batchId || null,
    p_title: title.trim(),
    p_content: content.trim(),
    p_priority: priority,
  });

  if (error) {
    throw new Error(`Failed to post announcement: ${error.message}`);
  }

  const res = data as any;
  return {
    success: true,
    announcementId: res.announcement_id,
    title: res.title,
  };
};

/**
 * Mark an announcement as read by the current user.
 */
export const markAnnouncementRead = async (
  announcementId: string
): Promise<{ success: boolean }> => {
  if (!isSupabaseConfigured || !announcementId) {
    return { success: true };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false };
  }

  const { error } = await supabase
    .from('announcement_reads')
    .upsert({
      announcement_id: announcementId,
      user_id: user.id,
      read_at: new Date().toISOString(),
    });

  if (error) {
    console.warn('Could not record announcement read:', error.message);
  }

  return { success: !error };
};
