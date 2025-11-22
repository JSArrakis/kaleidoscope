"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecentlyUsedMedia = void 0;
class RecentlyUsedMedia {
    constructor(mediaItemId, mediaType, usageContext, streamSessionId, usedAt, expiresAt, id) {
        this.id = id;
        this.mediaItemId = mediaItemId;
        this.mediaType = mediaType;
        this.usageContext = usageContext;
        this.streamSessionId = streamSessionId;
        this.usedAt = usedAt || new Date();
        this.expiresAt = expiresAt;
    }
    // Helper method to check if this usage record is expired
    isExpired() {
        if (!this.expiresAt)
            return false;
        return new Date() > this.expiresAt;
    }
    // Helper method to create expiration date based on usage context
    static getDefaultExpirationDate(usageContext) {
        const now = new Date();
        switch (usageContext) {
            case 'buffer':
                // Buffer media expires after 2 hours to prevent immediate repetition
                return new Date(now.getTime() + 2 * 60 * 60 * 1000);
            case 'main_content':
                // Main content expires after 24 hours
                return new Date(now.getTime() + 24 * 60 * 60 * 1000);
            case 'promo':
                // Promos expire after 30 minutes
                return new Date(now.getTime() + 30 * 60 * 1000);
            case 'initial_buffer':
                // Initial buffer media expires after 1 hour
                return new Date(now.getTime() + 60 * 60 * 1000);
            default:
                // Default to 2 hours
                return new Date(now.getTime() + 2 * 60 * 60 * 1000);
        }
    }
}
exports.RecentlyUsedMedia = RecentlyUsedMedia;
