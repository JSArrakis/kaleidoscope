"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createVLCClient = createVLCClient;
exports.isVLCRunning = isVLCRunning;
exports.listRunningProcesses = listRunningProcesses;
exports.setVLCClient = setVLCClient;
exports.getVLCClient = getVLCClient;
exports.initializeVLCService = initializeVLCService;
exports.cleanupVLCClient = cleanupVLCClient;
exports.playVLC = playVLC;
exports.stopVLC = stopVLC;
exports.pauseVLC = pauseVLC;
exports.resumeVLC = resumeVLC;
exports.addToPlaylist = addToPlaylist;
exports.addMediaBlockToPlaylist = addMediaBlockToPlaylist;
exports.getPlaylistInfo = getPlaylistInfo;
exports.getVLCStatus = getVLCStatus;
const VLC = __importStar(require("vlc-client"));
const child_process_1 = require("child_process");
let vlcClient = null;
/**
 * VLC Service - Centralized management of VLC client operations
 * Handles client initialization, process management, playlist operations, and status monitoring
 */
// ===== CLIENT INITIALIZATION AND MANAGEMENT =====
function initializeVLCClient(password) {
    return new VLC.Client({
        ip: 'localhost',
        port: 8080,
        username: '',
        password: password,
    });
}
function isVLCRunning(processesList) {
    for (const processInfo of processesList) {
        if (processInfo.toLowerCase().includes('vlc.exe')) {
            return true;
        }
    }
    return false;
}
async function startVLC() {
    // Start VLC using the command line
    (0, child_process_1.execSync)('start vlc');
    // Wait for VLC to complete its startup process
    // TODO - This is a race condition, and we need a better way to ensure VLC is fully started before returning
    await delay(2);
}
async function createVLCClient(password) {
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
function listRunningProcesses() {
    try {
        const stdout = (0, child_process_1.execSync)('tasklist', { encoding: 'utf-8' });
        const processesList = stdout
            .split('\n')
            .filter(line => line.trim() !== '') // Remove empty lines
            .map(line => line.trim()); // Trim whitespace
        return processesList;
    }
    catch (error) {
        console.error('Error:', error.message);
        return [];
    }
}
async function delay(seconds) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, seconds * 1000); // Convert seconds to milliseconds
    });
}
// ===== VLC SERVICE OPERATIONS =====
/**
 * Set the VLC client instance for the service to use
 */
function setVLCClient(client) {
    vlcClient = client;
}
/**
 * Get the current VLC client instance
 */
function getVLCClient() {
    return vlcClient;
}
/**
 * Initialize VLC client with password and set it as the active client
 */
async function initializeVLCService(password) {
    const client = await createVLCClient(password);
    setVLCClient(client);
}
/**
 * Start playing the VLC stream
 */
async function playVLC() {
    if (!vlcClient) {
        throw new Error('VLC client not initialized. Call setVLCClient or initializeVLCService first.');
    }
    try {
        // vlc.next() plays the next item in the playlist, which is the first item in the playlist as it is not already playing
        await vlcClient.next();
    }
    catch (error) {
        console.error('An error occurred when playing stream:', error);
        throw error;
    }
}
/**
 * Add a single media file to the VLC playlist
 */
async function addToPlaylist(filePath) {
    if (!vlcClient) {
        throw new Error('VLC client not initialized. Call setVLCClient or initializeVLCService first.');
    }
    try {
        await vlcClient.addToPlaylist(filePath);
    }
    catch (error) {
        console.error('An error occurred when adding file to playlist:', error);
        throw error;
    }
}
/**
 * Add a media block (feature media + buffers) to the VLC playlist
 */
async function addMediaBlockToPlaylist(mediaBlock) {
    if (!mediaBlock) {
        console.log('Media block was null or undefined');
        return;
    }
    if (!vlcClient) {
        throw new Error('VLC client not initialized. Call setVLCClient or initializeVLCService first.');
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
    }
    catch (error) {
        console.error('An error occurred when adding media block to playlist:', error);
        throw error;
    }
}
/**
 * Get the current status of the VLC service
 */
function getVLCStatus() {
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
    }
    catch (error) {
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
async function stopVLC() {
    if (!vlcClient) {
        throw new Error('VLC client not initialized');
    }
    try {
        await vlcClient.stop();
    }
    catch (error) {
        console.error('An error occurred when stopping VLC:', error);
        throw error;
    }
}
/**
 * Pause VLC playback
 */
async function pauseVLC() {
    if (!vlcClient) {
        throw new Error('VLC client not initialized');
    }
    try {
        await vlcClient.pause();
    }
    catch (error) {
        console.error('An error occurred when pausing VLC:', error);
        throw error;
    }
}
/**
 * Resume VLC playback (same as play for VLC client)
 */
async function resumeVLC() {
    if (!vlcClient) {
        throw new Error('VLC client not initialized');
    }
    try {
        // VLC client doesn't have a separate resume method, use play
        await vlcClient.play();
    }
    catch (error) {
        console.error('An error occurred when resuming VLC:', error);
        throw error;
    }
}
/**
 * Get VLC playlist information
 */
async function getPlaylistInfo() {
    if (!vlcClient) {
        throw new Error('VLC client not initialized');
    }
    try {
        return await vlcClient.getPlaylist();
    }
    catch (error) {
        console.error('An error occurred when getting playlist info:', error);
        throw error;
    }
}
/**
 * Cleanup VLC client resources
 */
function cleanupVLCClient() {
    vlcClient = null;
}
