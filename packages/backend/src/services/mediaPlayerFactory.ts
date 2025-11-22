import {
  IMediaPlayer,
  MediaPlayerStatus,
  MediaPlayerInfo,
} from './interfaces/mediaPlayerInterface';
import { VLCMediaPlayer } from './vlcMediaPlayer';
import { FFmpegMediaPlayer } from './ffmpegMediaPlayer';

/**
 * Media player backend types
 */
export enum MediaPlayerBackend {
  VLC = 'vlc',
  FFMPEG = 'ffmpeg',
}

/**
 * MediaPlayerFactory creates and manages media player instances
 * Provides abstraction for switching between different streaming backends
 */
export class MediaPlayerFactory {
  private static instance: MediaPlayerFactory;
  private currentPlayer: IMediaPlayer | null = null;
  private currentBackend: MediaPlayerBackend | null = null;

  private constructor() {}

  /**
   * Get singleton instance of the factory
   */
  static getInstance(): MediaPlayerFactory {
    if (!MediaPlayerFactory.instance) {
      MediaPlayerFactory.instance = new MediaPlayerFactory();
    }
    return MediaPlayerFactory.instance;
  }

  /**
   * Create or switch to a specific media player backend
   * @param backend The backend type (VLC or FFMPEG)
   * @param options Optional configuration (e.g., stream URL for FFmpeg)
   */
  async createPlayer(
    backend: MediaPlayerBackend,
    options?: { password?: string; streamUrl?: string },
  ): Promise<IMediaPlayer> {
    // Clean up existing player if switching backends
    if (this.currentPlayer && this.currentBackend !== backend) {
      await this.currentPlayer.cleanup();
    }

    let player: IMediaPlayer;

    switch (backend) {
      case MediaPlayerBackend.FFMPEG:
        player = new FFmpegMediaPlayer(options?.streamUrl);
        break;
      case MediaPlayerBackend.VLC:
      default:
        player = new VLCMediaPlayer();
    }

    // Initialize the player
    await player.initialize(options?.password);

    this.currentPlayer = player;
    this.currentBackend = backend;

    console.log(`Media player backend switched to: ${backend}`);
    return player;
  }

  /**
   * Get the currently active media player
   */
  getCurrentPlayer(): IMediaPlayer | null {
    return this.currentPlayer;
  }

  /**
   * Get the current backend type
   */
  getCurrentBackend(): MediaPlayerBackend | null {
    return this.currentBackend;
  }

  /**
   * Cleanup and reset the factory
   */
  async cleanup(): Promise<void> {
    if (this.currentPlayer) {
      await this.currentPlayer.cleanup();
      this.currentPlayer = null;
      this.currentBackend = null;
    }
  }
}

/**
 * Convenience function to get or create the default media player
 * Defaults to VLC if no player is active
 */
export async function getMediaPlayer(
  backend?: MediaPlayerBackend,
): Promise<IMediaPlayer> {
  const factory = MediaPlayerFactory.getInstance();
  let player = factory.getCurrentPlayer();

  if (!player) {
    player = await factory.createPlayer(backend || MediaPlayerBackend.VLC);
  }

  return player;
}
