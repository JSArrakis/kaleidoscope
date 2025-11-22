"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaPlayerFactory = exports.MediaPlayerBackend = void 0;
exports.getMediaPlayer = getMediaPlayer;
const vlcMediaPlayer_1 = require("./vlcMediaPlayer");
const ffmpegMediaPlayer_1 = require("./ffmpegMediaPlayer");
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
    createPlayer(backend, options) {
        return __awaiter(this, void 0, void 0, function* () {
            // Clean up existing player if switching backends
            if (this.currentPlayer && this.currentBackend !== backend) {
                yield this.currentPlayer.cleanup();
            }
            let player;
            switch (backend) {
                case MediaPlayerBackend.FFMPEG:
                    player = new ffmpegMediaPlayer_1.FFmpegMediaPlayer(options === null || options === void 0 ? void 0 : options.streamUrl);
                    break;
                case MediaPlayerBackend.VLC:
                default:
                    player = new vlcMediaPlayer_1.VLCMediaPlayer();
            }
            // Initialize the player
            yield player.initialize(options === null || options === void 0 ? void 0 : options.password);
            this.currentPlayer = player;
            this.currentBackend = backend;
            console.log(`Media player backend switched to: ${backend}`);
            return player;
        });
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
    cleanup() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.currentPlayer) {
                yield this.currentPlayer.cleanup();
                this.currentPlayer = null;
                this.currentBackend = null;
            }
        });
    }
}
exports.MediaPlayerFactory = MediaPlayerFactory;
/**
 * Convenience function to get or create the default media player
 * Defaults to VLC if no player is active
 */
function getMediaPlayer(backend) {
    return __awaiter(this, void 0, void 0, function* () {
        const factory = MediaPlayerFactory.getInstance();
        let player = factory.getCurrentPlayer();
        if (!player) {
            player = yield factory.createPlayer(backend || MediaPlayerBackend.VLC);
        }
        return player;
    });
}
