import * as VLC from 'vlc-client';
import { execSync } from 'child_process';
import { MediaBlock } from '../models/mediaBlock';

let vlcClient: VLC.Client | null = null;

/**
 * VLC Service - Centralized management of VLC client operations
 * Handles client initialization, process management, playlist operations, and status monitoring
 */

// ===== CLIENT INITIALIZATION AND MANAGEMENT =====

function initializeVLCClient(password: string): VLC.Client {
  return new VLC.Client({
    ip: 'localhost',
    port: 8080,
    username: '',
    password: password,
  });
}

function isVLCRunning(processesList: string[]): boolean {
  for (const processInfo of processesList) {
    if (processInfo.toLowerCase().includes('vlc.exe')) {
      return true;
    }
  }
  return false;
}

async function startVLC(): Promise<void> {
  // Start VLC using the command line
  execSync('start vlc');
  // Wait for VLC to complete its startup process
  // TODO - This is a race condition, and we need a better way to ensure VLC is fully started before returning
  await delay(2);
}

async function createVLCClient(password: string): Promise<VLC.Client> {
  // Created the VLC client using the password provided in the request
  // The VLC client requires a password to connect to the media player's web interface
  // Further Reading: https://wiki.videolan.org/Documentation:Modules/http_intf/#VLC_2.0.0_and_later
  const client = initializeVLCClient(password);
  // Get a list of all running processes
  const currentProcesses = listRunningProcesses();

  // Checks if VLC is running, if it is not it will start VLC
  if (!isVLCRunning(currentProcesses)) {
    await startVLC();
  }

  return client;
}

function listRunningProcesses(): string[] {
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

async function delay(seconds: number): Promise<void> {
  return new Promise<void>(resolve => {
    setTimeout(() => {
      resolve();
    }, seconds * 1000); // Convert seconds to milliseconds
  });
}

// ===== VLC SERVICE OPERATIONS =====

/**
 * Set the VLC client instance for the service to use
 */
function setVLCClient(client: VLC.Client): void {
  vlcClient = client;
}

/**
 * Get the current VLC client instance
 */
function getVLCClient(): VLC.Client | null {
  return vlcClient;
}

/**
 * Initialize VLC client with password and set it as the active client
 */
async function initializeVLCService(password: string): Promise<void> {
  const client = await createVLCClient(password);
  setVLCClient(client);
}

/**
 * Start playing the VLC stream
 */
async function playVLC(): Promise<void> {
  if (!vlcClient) {
    throw new Error(
      'VLC client not initialized. Call setVLCClient or initializeVLCService first.',
    );
  }

  try {
    // vlc.next() plays the next item in the playlist, which is the first item in the playlist as it is not already playing
    await vlcClient.next();
  } catch (error) {
    console.error('An error occurred when playing stream:', error);
    throw error;
  }
}

/**
 * Add a single media file to the VLC playlist
 */
async function addToPlaylist(filePath: string): Promise<void> {
  if (!vlcClient) {
    throw new Error(
      'VLC client not initialized. Call setVLCClient or initializeVLCService first.',
    );
  }

  try {
    await vlcClient.addToPlaylist(filePath);
  } catch (error) {
    console.error('An error occurred when adding file to playlist:', error);
    throw error;
  }
}

/**
 * Add a media block (feature media + buffers) to the VLC playlist
 */
async function addMediaBlockToPlaylist(
  mediaBlock: MediaBlock | undefined,
): Promise<void> {
  if (!mediaBlock) {
    console.log('Media block was null or undefined');
    return;
  }

  if (!vlcClient) {
    throw new Error(
      'VLC client not initialized. Call setVLCClient or initializeVLCService first.',
    );
  }

  try {
    // Add the main media item to the vlc playlist
    if (mediaBlock.featureMedia?.path) {
      console.log('Adding ' + mediaBlock.featureMedia.title + ' to playlist');
      await vlcClient.addToPlaylist(mediaBlock.featureMedia.path);
    }

    // Add buffer items (post-media buffer)
    if (mediaBlock.buffer && mediaBlock.buffer.length > 0) {
      for (const bufferItem of mediaBlock.buffer) {
        console.log('Adding buffer ' + bufferItem.title + ' to playlist');
        await vlcClient.addToPlaylist(bufferItem.path);
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

/**
 * Get the current status of the VLC service
 */
function getVLCStatus(): {
  connected: boolean;
  client: boolean;
  error: string | null;
} {
  if (!vlcClient) {
    return {
      connected: false,
      client: false,
      error: 'VLC client not initialized',
    };
  }

  try {
    return {
      connected: true,
      client: !!vlcClient,
      error: null,
    };
  } catch (error) {
    return {
      connected: false,
      client: !!vlcClient,
      error: error instanceof Error ? error.message : 'Unknown VLC error',
    };
  }
}

/**
 * Stop VLC playback
 */
async function stopVLC(): Promise<void> {
  if (!vlcClient) {
    throw new Error('VLC client not initialized');
  }

  try {
    await vlcClient.stop();
  } catch (error) {
    console.error('An error occurred when stopping VLC:', error);
    throw error;
  }
}

/**
 * Pause VLC playback
 */
async function pauseVLC(): Promise<void> {
  if (!vlcClient) {
    throw new Error('VLC client not initialized');
  }

  try {
    await vlcClient.pause();
  } catch (error) {
    console.error('An error occurred when pausing VLC:', error);
    throw error;
  }
}

/**
 * Resume VLC playback (same as play for VLC client)
 */
async function resumeVLC(): Promise<void> {
  if (!vlcClient) {
    throw new Error('VLC client not initialized');
  }

  try {
    // VLC client doesn't have a separate resume method, use play
    await vlcClient.play();
  } catch (error) {
    console.error('An error occurred when resuming VLC:', error);
    throw error;
  }
}

/**
 * Get VLC playlist information
 */
async function getPlaylistInfo(): Promise<any> {
  if (!vlcClient) {
    throw new Error('VLC client not initialized');
  }

  try {
    return await vlcClient.getPlaylist();
  } catch (error) {
    console.error('An error occurred when getting playlist info:', error);
    throw error;
  }
}

/**
 * Cleanup VLC client resources
 */
function cleanupVLCClient(): void {
  vlcClient = null;
}

// ===== EXPORTS =====

export {
  // Client management
  createVLCClient,
  isVLCRunning,
  listRunningProcesses,
  setVLCClient,
  getVLCClient,
  initializeVLCService,
  cleanupVLCClient,

  // Playback control
  playVLC,
  stopVLC,
  pauseVLC,
  resumeVLC,

  // Playlist management
  addToPlaylist,
  addMediaBlockToPlaylist,
  getPlaylistInfo,

  // Status and monitoring
  getVLCStatus,
};
