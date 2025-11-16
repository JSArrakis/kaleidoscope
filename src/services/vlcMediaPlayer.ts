import * as VLC from 'vlc-client';
import { execSync } from 'child_process';
import { MediaBlock } from '../models/mediaBlock';
import {
  IMediaPlayer,
  MediaPlayerStatus,
  MediaPlayerInfo,
} from './interfaces/mediaPlayerInterface';

/**
 * VLC Media Player Implementation
 * Implements IMediaPlayer interface for VLC streaming backend
 */
export class VLCMediaPlayer implements IMediaPlayer {
  private vlcClient: VLC.Client | null = null;

  // ===== CLIENT INITIALIZATION AND MANAGEMENT =====

  private initializeVLCClient(password: string): VLC.Client {
    return new VLC.Client({
      ip: 'localhost',
      port: 8080,
      username: '',
      password: password,
    });
  }

  private isVLCRunning(processesList: string[]): boolean {
    for (const processInfo of processesList) {
      if (processInfo.toLowerCase().includes('vlc.exe')) {
        return true;
      }
    }
    return false;
  }

  private async startVLC(): Promise<void> {
    // Start VLC using the command line
    execSync('start vlc');
    // Wait for VLC to complete its startup process
    // TODO - This is a race condition, and we need a better way to ensure VLC is fully started before returning
    await this.delay(2);
  }

  private listRunningProcesses(): string[] {
    try {
      const stdout = execSync('tasklist', { encoding: 'utf-8' });
      const processesList = stdout
        .split('\n')
        .filter(line => line.trim() !== '') // Remove empty lines
        .map(line => line.trim()); // Trim whitespace

      return processesList;
    } catch (error: any) {
      console.error('Error:', error.message);
      return [];
    }
  }

  private async delay(seconds: number): Promise<void> {
    return new Promise<void>(resolve => {
      setTimeout(() => {
        resolve();
      }, seconds * 1000); // Convert seconds to milliseconds
    });
  }

  async initialize(password: string = ''): Promise<void> {
    // Clean up existing client before creating a new one
    if (this.vlcClient) {
      try {
        await this.cleanup();
      } catch (error) {
        console.warn('Error cleaning up previous VLC client:', error);
      }
    }

    const client = this.initializeVLCClient(password);
    const currentProcesses = this.listRunningProcesses();

    if (!this.isVLCRunning(currentProcesses)) {
      await this.startVLC();
    }

    this.vlcClient = client;
  }

  async isConnected(): Promise<boolean> {
    if (!this.vlcClient) {
      return false;
    }

    try {
      await this.vlcClient.getPlaylist();
      return true;
    } catch {
      return false;
    }
  }

  async cleanup(): Promise<void> {
    if (this.vlcClient) {
      try {
        // VLC client may have internal connection pools that need to be cleaned
        // Set to null to allow garbage collection
        this.vlcClient = null;
      } catch (error) {
        console.error('Error during VLC client cleanup:', error);
        this.vlcClient = null;
      }
    }
  }

  // ===== PLAYBACK CONTROL =====

  async play(): Promise<void> {
    if (!this.vlcClient) {
      throw new Error('VLC client not initialized. Call initialize() first.');
    }

    try {
      // vlc.next() plays the next item in the playlist, which is the first item as it is not already playing
      await this.vlcClient.next();
    } catch (error) {
      console.error('An error occurred when playing stream:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.vlcClient) {
      throw new Error('VLC client not initialized');
    }

    try {
      await this.vlcClient.stop();
    } catch (error) {
      console.error('An error occurred when stopping VLC:', error);
      throw error;
    }
  }

  async pause(): Promise<void> {
    if (!this.vlcClient) {
      throw new Error('VLC client not initialized');
    }

    try {
      await this.vlcClient.pause();
    } catch (error) {
      console.error('An error occurred when pausing VLC:', error);
      throw error;
    }
  }

  async resume(): Promise<void> {
    if (!this.vlcClient) {
      throw new Error('VLC client not initialized');
    }

    try {
      await this.vlcClient.play();
    } catch (error) {
      console.error('An error occurred when resuming VLC:', error);
      throw error;
    }
  }

  // ===== PLAYLIST/QUEUE MANAGEMENT =====

  async addToQueue(filePath: string): Promise<void> {
    if (!this.vlcClient) {
      throw new Error('VLC client not initialized. Call initialize() first.');
    }

    try {
      await this.vlcClient.addToPlaylist(filePath);
    } catch (error) {
      console.error('An error occurred when adding file to playlist:', error);
      throw error;
    }
  }

  async addMediaBlockToQueue(mediaBlock: MediaBlock): Promise<void> {
    if (!mediaBlock) {
      console.log('Media block was null or undefined');
      return;
    }

    if (!this.vlcClient) {
      throw new Error('VLC client not initialized. Call initialize() first.');
    }

    try {
      // Add the main media item to the vlc playlist
      if (mediaBlock.featureMedia?.path) {
        console.log('Adding ' + mediaBlock.featureMedia.title + ' to playlist');
        await this.vlcClient.addToPlaylist(mediaBlock.featureMedia.path);
      }

      // Add buffer items (post-media buffer)
      if (mediaBlock.buffer && mediaBlock.buffer.length > 0) {
        for (const bufferItem of mediaBlock.buffer) {
          console.log('Adding buffer ' + bufferItem.title + ' to playlist');
          await this.vlcClient.addToPlaylist(bufferItem.path);
        }
      }
    } catch (error) {
      console.error(
        'An error occurred when adding media block to playlist:',
        error,
      );
      throw error;
    }
  }

  async getQueueInfo(): Promise<any> {
    if (!this.vlcClient) {
      throw new Error('VLC client not initialized');
    }

    try {
      return await this.vlcClient.getPlaylist();
    } catch (error) {
      console.error('An error occurred when getting playlist info:', error);
      throw error;
    }
  }

  async clearQueue(): Promise<void> {
    if (!this.vlcClient) {
      throw new Error('VLC client not initialized');
    }

    try {
      // VLC client may not have a direct clear playlist method
      // This would need to be implemented based on VLC client capabilities
      console.warn('Clear queue not fully implemented for VLC');
    } catch (error) {
      console.error('An error occurred when clearing playlist:', error);
      throw error;
    }
  }

  // ===== STATUS AND MONITORING =====

  async getStatus(): Promise<MediaPlayerStatus> {
    if (!this.vlcClient) {
      throw new Error('VLC client not initialized');
    }

    try {
      const status = await this.vlcClient.status();
      return {
        isPlaying: status.state === 'playing',
        isPaused: status.state === 'paused',
        isStopped: status.state === 'stopped',
        currentTime: status.time,
        totalTime: status.length,
        currentMediaTitle: status.information?.category?.meta?.title,
      };
    } catch (error) {
      console.error('An error occurred when getting VLC status:', error);
      throw error;
    }
  }

  async getInfo(): Promise<MediaPlayerInfo> {
    try {
      const connected = await this.isConnected();
      const queueInfo = connected ? await this.getQueueInfo() : null;

      return {
        connected,
        running: connected,
        queueSize: queueInfo?.items?.length || 0,
        currentMediaIndex: queueInfo?.currentItem,
        error: undefined,
      };
    } catch (error) {
      return {
        connected: false,
        running: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
