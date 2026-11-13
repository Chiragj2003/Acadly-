import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAnnouncements,
  postAnnouncement,
  markAnnouncementRead,
  type PostAnnouncementInput,
} from '@/services/announcementService';

export const ANNOUNCEMENTS_QUERY_KEY = 'announcements';

export function useAnnouncements(instituteId?: string, batchId?: string) {
  return useQuery({
    queryKey: [ANNOUNCEMENTS_QUERY_KEY, instituteId, batchId],
    queryFn: () => fetchAnnouncements(instituteId!, batchId),
    enabled: Boolean(instituteId),
  });
}

export function usePostAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: PostAnnouncementInput) => postAnnouncement(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [ANNOUNCEMENTS_QUERY_KEY, variables.instituteId],
      });
    },
  });
}

export function useMarkAnnouncementRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (announcementId: string) => markAnnouncementRead(announcementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ANNOUNCEMENTS_QUERY_KEY] });
    },
  });
}
