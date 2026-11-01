export interface VideoUploadSessionParams {
  title: string;
  description: string;
  fileSizeBytes: number;
  mimeType: string;
  instituteId: string;
  batchId: string;
}

export interface VideoUploadSessionResult {
  uploadUrl: string;
  provider: 'youtube' | 'bunny_stream' | 'vimeo';
  expiresInSeconds?: number;
}

export interface IVideoService {
  readonly providerName: string;
  
  /**
   * Resolves the secure playback URL or embed URL for the player component
   */
  getPlaybackUrl(videoId: string): Promise<string>;
  
  /**
   * Generates a preview thumbnail URL
   */
  getThumbnailUrl(videoId: string): string;

  /**
   * Initiates a resumable or direct video upload session
   */
  initiateUploadSession(params: VideoUploadSessionParams): Promise<VideoUploadSessionResult>;

  /**
   * Extracts or normalizes the video identifier from a full URL or ID
   */
  parseVideoId(urlOrId: string): string | null;

  /**
   * Deletes a video from the provider
   */
  deleteVideo(videoId: string): Promise<boolean>;
}
