import { IVideoService, VideoUploadSessionParams, VideoUploadSessionResult } from './IVideoService';

export class BunnyStreamService implements IVideoService {
  readonly providerName = 'bunny_stream';
  private libraryId: string;
  private cdnHostname: string;

  constructor(libraryId: string = 'acadly-default-lib', cdnHostname: string = 'video.acadly.app') {
    this.libraryId = libraryId;
    this.cdnHostname = cdnHostname;
  }

  parseVideoId(urlOrId: string): string | null {
    if (!urlOrId) return null;
    const clean = urlOrId.trim();
    // Bunny Stream video GUID format (36 chars) or clean ID
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (guidRegex.test(clean)) {
      return clean;
    }
    const match = clean.match(/\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
    return match ? match[1] : clean;
  }

  async getPlaybackUrl(videoId: string): Promise<string> {
    const cleanId = this.parseVideoId(videoId);
    // Bunny Stream HLS playlist URL
    return `https://${this.cdnHostname}/${cleanId}/playlist.m3u8`;
  }

  getThumbnailUrl(videoId: string): string {
    const cleanId = this.parseVideoId(videoId);
    return `https://${this.cdnHostname}/${cleanId}/thumbnail.jpg`;
  }

  async initiateUploadSession(params: VideoUploadSessionParams): Promise<VideoUploadSessionResult> {
    // In production, this proxies through an edge function to obtain Bunny Video ID & TUS upload URL
    return {
      uploadUrl: `https://video.bunnycdn.com/library/${this.libraryId}/videos`,
      provider: 'bunny_stream',
      expiresInSeconds: 3600,
    };
  }

  async deleteVideo(_videoId: string): Promise<boolean> {
    return true;
  }
}
