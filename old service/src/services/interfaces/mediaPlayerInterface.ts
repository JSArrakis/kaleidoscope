import { MediaBlock } from '../../models/mediaBlock';

/**
 * MediaPlayerInterface defines the common contract for media streaming backends
 * Both VLC and FFmpeg implementations must conform to this interface
 * VLC's constraints are the baseline - all implementations must work within VLC's limitations
 */
export interface IMediaPlayer {
  // ===== CLIENT INITIALIZATION AND MANAGEMENT =====

  /**
   * Initialize the media player client
   * @param password Optional password for authentication
   */
  initialize(password?: string): Promise<void>;

  /**
   * Check if the media player is running/connected
   */
  isConnected(): Promise<boolean>;

  /**
   * Clean up resources and disconnect
   */
  cleanup(): Promise<void>;

  // ===== PLAYBACK CONTROL =====

  /**
   * Start playback of the current queue
   */
  play(): Promise<void>;

  /**
   * Stop playback
   */
  stop(): Promise<void>;

  /**
   * Pause playback
   */
  pause(): Promise<void>;

  /**
   * Resume playback from pause
   */
  resume(): Promise<void>;

  // ===== PLAYLIST/QUEUE MANAGEMENT =====

  /**
   * Add a single media file to the queue
   * @param filePath Path to the media file
   */
  addToQueue(filePath: string): Promise<void>;

  /**
   * Add a media block (feature + buffers) to the queue
   * Maintains the same structure as VLC - adds feature media followed by buffer items
   * @param mediaBlock The media block to add
   */
  addMediaBlockToQueue(mediaBlock: MediaBlock): Promise<void>;

  /**
   * Get current queue/playlist information
   */
  getQueueInfo(): Promise<any>;

  /**
   * Clear the entire queue
   */
  clearQueue(): Promise<void>;

  // ===== STATUS AND MONITORING =====

  /**
   * Get the current playback status
   */
  getStatus(): Promise<MediaPlayerStatus>;

  /**
   * Get detailed player information
   */
  getInfo(): Promise<MediaPlayerInfo>;
}

export interface MediaPlayerStatus {
  isPlaying: boolean;
  isPaused: boolean;
  isStopped: boolean;
  currentTime?: number; // seconds
  totalTime?: number; // seconds
  currentMediaTitle?: string;
}

export interface MediaPlayerInfo {
  connected: boolean;
  running: boolean;
  queueSize?: number;
  currentMediaIndex?: number;
  error?: string;
}
