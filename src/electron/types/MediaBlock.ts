// Movie and Episode types are defined globally in types.d.ts
// Movie and Episode types are defined globally in types.d.ts

export interface MediaBlockData {
  buffer: any[]; // Array of buffer/filler media
  mainBlock?: Movie | Episode; // Primary media content
  startTime: number; // Unix timestamp when block starts
}

export class MediaBlock implements MediaBlockData {
  buffer: (Promo | Music | Short | Commercial | Bumper)[];
  mainBlock?: Movie | Episode;
  startTime: number;
  duration: number; // Calculated duration in seconds

  constructor(
    buffer: (Promo | Music | Short | Commercial | Bumper)[],
    mainBlock: Movie | Episode | undefined,
    startTime: number
  ) {
    this.buffer = buffer;
    this.mainBlock = mainBlock;
    this.startTime = startTime;

    // Calculate duration: buffer duration + main media duration
    const bufferDuration = this.buffer.reduce(
      (sum, item) => sum + (item.duration || 0),
      0
    );
    const mainDuration = this.mainBlock?.duration || 0;
    this.duration = bufferDuration + mainDuration;
  }

  /**
   * Gets the end time of this media block (startTime + duration)
   */
  getEndTime(): number {
    return this.startTime + this.duration;
  }

  /**
   * Serializes to database-compatible format
   */
  toDB() {
    return {
      buffer: JSON.stringify(this.buffer),
      mainBlockId: this.mainBlock?.mediaItemId,
      startTime: this.startTime,
      duration: this.duration,
    };
  }
}

/**
 * Reconstruct MediaBlock from database row
 */
export function mediaBlockFromDB(row: any): MediaBlock {
  let buffer = [];
  try {
    buffer = JSON.parse(row.buffer || "[]");
  } catch {
    buffer = [];
  }

  return new MediaBlock(buffer, undefined, row.startTime);
}
