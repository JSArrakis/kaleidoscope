"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaPlayerFactory = exports.MediaPlayerBackend = void 0;
exports.getMediaPlayer = getMediaPlayer;
const vlcMediaPlayer_1 = require("./vlcMediaPlayer.cjs");
const ffmpegMediaPlayer_1 = require("./ffmpegMediaPlayer.cjs");
/**
 * Media player backend types
 */
var MediaPlayerBackend;
(function (MediaPlayerBackend) {
    MediaPlayerBackend["VLC"] = "vlc";
    MediaPlayerBackend["FFMPEG"] = "ffmpeg";
})(MediaPlayerBackend || (exports.MediaPlayerBackend = MediaPlayerBackend = {}));
/**
 * MediaPlayerFactory creates and manages media player instances
 * Provides abstraction for switching between different streaming backends
 */
class MediaPlayerFactory {
    constructor() {
        this.currentPlayer = null;
        this.currentBackend = null;
    }
    /**
     * Get singleton instance of the factory
     */
    static getInstance() {
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
    async createPlayer(backend, options) {
        // Clean up existing player if switching backends
        if (this.currentPlayer && this.currentBackend !== backend) {
            await this.currentPlayer.cleanup();
        }
        let player;
        switch (backend) {
            case MediaPlayerBackend.FFMPEG:
                player = new ffmpegMediaPlayer_1.FFmpegMediaPlayer(options?.streamUrl);
                break;
            case MediaPlayerBackend.VLC:
            default:
                player = new vlcMediaPlayer_1.VLCMediaPlayer();
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
    getCurrentPlayer() {
        return this.currentPlayer;
    }
    /**
     * Get the current backend type
     */
    getCurrentBackend() {
        return this.currentBackend;
    }
    /**
     * Cleanup and reset the factory
     */
    async cleanup() {
        if (this.currentPlayer) {
            await this.currentPlayer.cleanup();
            this.currentPlayer = null;
            this.currentBackend = null;
        }
    }
}
exports.MediaPlayerFactory = MediaPlayerFactory;
/**
 * Convenience function to get or create the default media player
 * Defaults to VLC if no player is active
 */
async function getMediaPlayer(backend) {
    const factory = MediaPlayerFactory.getInstance();
    let player = factory.getCurrentPlayer();
    if (!player) {
        player = await factory.createPlayer(backend || MediaPlayerBackend.VLC);
    }
    return player;
}
