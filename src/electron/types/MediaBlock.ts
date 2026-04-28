// Movie and Episode types are defined globally in types.d.ts

export interface MediaBlockData {
  buffer: any[]; // Array of buffer/filler media
  anchorMedia?: Movie | Episode; // Primary media content
  startTime: number; // Unix timestamp when block starts
  sourceContext?: MediaBlockSourceContext;
}

export class MediaBlock implements MediaBlockData {
  buffer: (Promo | Music | Short | Commercial | Bumper)[];
  anchorMedia?: Movie | Episode;
  startTime: number;
  sourceContext?: MediaBlockSourceContext;

  constructor(
    buffer: (Promo | Music | Short | Commercial | Bumper)[],
    mainBlock: Movie | Episode | undefined,
    startTime: number,
    sourceContext?: MediaBlockSourceContext,
  ) {
    this.buffer = buffer;
    this.anchorMedia = mainBlock;
    this.startTime = startTime;
    this.sourceContext = sourceContext;
  }
}
