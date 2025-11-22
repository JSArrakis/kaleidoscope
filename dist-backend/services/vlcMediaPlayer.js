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
exports.VLCMediaPlayer = void 0;
const VLC = __importStar(require("vlc-client"));
const child_process_1 = require("child_process");
/**
 * VLC Media Player Implementation
 * Implements IMediaPlayer interface for VLC streaming backend
 */
class VLCMediaPlayer {
    constructor() {
        this.vlcClient = null;
    }
    // ===== CLIENT INITIALIZATION AND MANAGEMENT =====
    initializeVLCClient(password) {
        return new VLC.Client({
            ip: 'localhost',
            port: 8080,
            username: '',
            password: password,
        });
    }
    isVLCRunning(processesList) {
        for (const processInfo of processesList) {
            if (processInfo.toLowerCase().includes('vlc.exe')) {
                return true;
            }
        }
        return false;
    }
    startVLC() {
        return __awaiter(this, void 0, void 0, function* () {
            // Start VLC using the command line
            (0, child_process_1.execSync)('start vlc');
            // Wait for VLC to complete its startup process
            // TODO - This is a race condition, and we need a better way to ensure VLC is fully started before returning
            yield this.delay(2);
        });
    }
    listRunningProcesses() {
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
    delay(seconds) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => {
                setTimeout(() => {
                    resolve();
                }, seconds * 1000); // Convert seconds to milliseconds
            });
        });
    }
    initialize() {
        return __awaiter(this, arguments, void 0, function* (password = '') {
            // Clean up existing client before creating a new one
            if (this.vlcClient) {
                try {
                    yield this.cleanup();
                }
                catch (error) {
                    console.warn('Error cleaning up previous VLC client:', error);
                }
            }
            const client = this.initializeVLCClient(password);
            const currentProcesses = this.listRunningProcesses();
            if (!this.isVLCRunning(currentProcesses)) {
                yield this.startVLC();
            }
            this.vlcClient = client;
        });
    }
    isConnected() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.vlcClient) {
                return false;
            }
            try {
                yield this.vlcClient.getPlaylist();
                return true;
            }
            catch (_a) {
                return false;
            }
        });
    }
    cleanup() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.vlcClient) {
                try {
                    // VLC client may have internal connection pools that need to be cleaned
                    // Set to null to allow garbage collection
                    this.vlcClient = null;
                }
                catch (error) {
                    console.error('Error during VLC client cleanup:', error);
                    this.vlcClient = null;
                }
            }
        });
    }
    // ===== PLAYBACK CONTROL =====
    play() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.vlcClient) {
                throw new Error('VLC client not initialized. Call initialize() first.');
            }
            try {
                // vlc.next() plays the next item in the playlist, which is the first item as it is not already playing
                yield this.vlcClient.next();
            }
            catch (error) {
                console.error('An error occurred when playing stream:', error);
                throw error;
            }
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.vlcClient) {
                throw new Error('VLC client not initialized');
            }
            try {
                yield this.vlcClient.stop();
            }
            catch (error) {
                console.error('An error occurred when stopping VLC:', error);
                throw error;
            }
        });
    }
    pause() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.vlcClient) {
                throw new Error('VLC client not initialized');
            }
            try {
                yield this.vlcClient.pause();
            }
            catch (error) {
                console.error('An error occurred when pausing VLC:', error);
                throw error;
            }
        });
    }
    resume() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.vlcClient) {
                throw new Error('VLC client not initialized');
            }
            try {
                yield this.vlcClient.play();
            }
            catch (error) {
                console.error('An error occurred when resuming VLC:', error);
                throw error;
            }
        });
    }
    // ===== PLAYLIST/QUEUE MANAGEMENT =====
    addToQueue(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.vlcClient) {
                throw new Error('VLC client not initialized. Call initialize() first.');
            }
            try {
                yield this.vlcClient.addToPlaylist(filePath);
            }
            catch (error) {
                console.error('An error occurred when adding file to playlist:', error);
                throw error;
            }
        });
    }
    addMediaBlockToQueue(mediaBlock) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!mediaBlock) {
                console.log('Media block was null or undefined');
                return;
            }
            if (!this.vlcClient) {
                throw new Error('VLC client not initialized. Call initialize() first.');
            }
            try {
                // Add the main media item to the vlc playlist
                if ((_a = mediaBlock.featureMedia) === null || _a === void 0 ? void 0 : _a.path) {
                    console.log('Adding ' + mediaBlock.featureMedia.title + ' to playlist');
                    yield this.vlcClient.addToPlaylist(mediaBlock.featureMedia.path);
                }
                // Add buffer items (post-media buffer)
                if (mediaBlock.buffer && mediaBlock.buffer.length > 0) {
                    for (const bufferItem of mediaBlock.buffer) {
                        console.log('Adding buffer ' + bufferItem.title + ' to playlist');
                        yield this.vlcClient.addToPlaylist(bufferItem.path);
                    }
                }
            }
            catch (error) {
                console.error('An error occurred when adding media block to playlist:', error);
                throw error;
            }
        });
    }
    getQueueInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.vlcClient) {
                throw new Error('VLC client not initialized');
            }
            try {
                return yield this.vlcClient.getPlaylist();
            }
            catch (error) {
                console.error('An error occurred when getting playlist info:', error);
                throw error;
            }
        });
    }
    clearQueue() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.vlcClient) {
                throw new Error('VLC client not initialized');
            }
            try {
                // VLC client may not have a direct clear playlist method
                // This would need to be implemented based on VLC client capabilities
                console.warn('Clear queue not fully implemented for VLC');
            }
            catch (error) {
                console.error('An error occurred when clearing playlist:', error);
                throw error;
            }
        });
    }
    // ===== STATUS AND MONITORING =====
    getStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            if (!this.vlcClient) {
                throw new Error('VLC client not initialized');
            }
            try {
                const status = yield this.vlcClient.status();
                return {
                    isPlaying: status.state === 'playing',
                    isPaused: status.state === 'paused',
                    isStopped: status.state === 'stopped',
                    currentTime: status.time,
                    totalTime: status.length,
                    currentMediaTitle: (_c = (_b = (_a = status.information) === null || _a === void 0 ? void 0 : _a.category) === null || _b === void 0 ? void 0 : _b.meta) === null || _c === void 0 ? void 0 : _c.title,
                };
            }
            catch (error) {
                console.error('An error occurred when getting VLC status:', error);
                throw error;
            }
        });
    }
    getInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const connected = yield this.isConnected();
                const queueInfo = connected ? yield this.getQueueInfo() : null;
                return {
                    connected,
                    running: connected,
                    queueSize: ((_a = queueInfo === null || queueInfo === void 0 ? void 0 : queueInfo.items) === null || _a === void 0 ? void 0 : _a.length) || 0,
                    currentMediaIndex: queueInfo === null || queueInfo === void 0 ? void 0 : queueInfo.currentItem,
                    error: undefined,
                };
            }
            catch (error) {
                return {
                    connected: false,
                    running: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                };
            }
        });
    }
}
exports.VLCMediaPlayer = VLCMediaPlayer;
