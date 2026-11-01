import { IVideoService, VideoUploadSessionParams, VideoUploadSessionResult } from './IVideoService';
import { supabase } from '../../lib/supabase';

export class YouTubeVideoService implements IVideoService {
  readonly providerName = 'youtube';

  parseVideoId(urlOrId: string): string | null {
    if (!urlOrId) return null;
    const clean = urlOrId.trim();

    // Standard YouTube ID (11 chars)
    if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) {
      return clean;
    }

    // Full URLs: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
    const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/;
    const match = clean.match(regExp);
    return match ? match[1] : null;
  }

  async getPlaybackUrl(videoId: string): Promise<string> {
    const cleanId = this.parseVideoId(videoId);
    if (!cleanId) {
      throw new Error(`Invalid YouTube video ID or URL: ${videoId}`);
    }
    // Return standard embed format optimized for mobile WebView / iframe
    return `https://www.youtube.com/embed/${cleanId}?playsinline=1&modestbranding=1&rel=0`;
  }

  getThumbnailUrl(videoId: string): string {
    const cleanId = this.parseVideoId(videoId);
    if (!cleanId) {
      return 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800';
    }
    return `https://img.youtube.com/vi/${cleanId}/hqdefault.jpg`;
  }

  async initiateUploadSession(params: VideoUploadSessionParams): Promise<VideoUploadSessionResult> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('User must be authenticated to upload videos');
    }

    const { data, error } = await supabase.functions.invoke('youtube-resumable-upload', {
      body: params,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error || !data?.uploadUrl) {
      throw new Error(error?.message || data?.error || 'Failed to initiate YouTube upload session');
    }

    return {
      uploadUrl: data.uploadUrl,
      provider: 'youtube',
      expiresInSeconds: data.expiresInSeconds || 3600,
    };
  }

  async deleteVideo(_videoId: string): Promise<boolean> {
    // Video deletion should be executed through backend service role or Edge Function
    return true;
  }
}
