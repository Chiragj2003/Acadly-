import { IVideoService } from './IVideoService';
import { YouTubeVideoService } from './YouTubeVideoService';
import { BunnyStreamService } from './BunnyStreamService';

export * from './IVideoService';
export * from './YouTubeVideoService';
export * from './BunnyStreamService';

let activeVideoService: IVideoService = new YouTubeVideoService();

export function getVideoService(provider: 'youtube' | 'bunny_stream' = 'youtube'): IVideoService {
  if (provider === 'bunny_stream') {
    return new BunnyStreamService();
  }
  return activeVideoService;
}

export function setGlobalVideoService(service: IVideoService) {
  activeVideoService = service;
}
