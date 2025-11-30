export interface IRecentlyUsedMedia {
  id?: number;
  mediaItemId: string;
  mediaType: 'commercial' | 'short' | 'music' | 'movie' | 'show';
  usageContext: 'buffer' | 'main_content' | 'promo' | 'initial_buffer';
  streamSessionId?: string;
  usedAt: Date;
  expiresAt?: Date;
}

export class RecentlyUsedMedia implements IRecentlyUsedMedia {
  public id?: number;
  public mediaItemId: string;
  public mediaType: 'commercial' | 'short' | 'music' | 'movie' | 'show';
  public usageContext: 'buffer' | 'main_content' | 'promo' | 'initial_buffer';
  public streamSessionId?: string;
  public usedAt: Date;
  public expiresAt?: Date;

  constructor(
    mediaItemId: string,
    mediaType: 'commercial' | 'short' | 'music' | 'movie' | 'show',
    usageContext: 'buffer' | 'main_content' | 'promo' | 'initial_buffer',
    streamSessionId?: string,
    usedAt?: Date,
    expiresAt?: Date,
    id?: number,
  ) {
    this.id = id;
    this.mediaItemId = mediaItemId;
    this.mediaType = mediaType;
    this.usageContext = usageContext;
    this.streamSessionId = streamSessionId;
    this.usedAt = usedAt || new Date();
    this.expiresAt = expiresAt;
  }

  // Helper method to check if this usage record is expired
  public isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  }

  // Helper method to create expiration date based on usage context
  public static getDefaultExpirationDate(usageContext: string): Date {
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
