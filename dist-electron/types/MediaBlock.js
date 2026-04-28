// Movie and Episode types are defined globally in types.d.ts
export class MediaBlock {
    buffer;
    anchorMedia;
    startTime;
    sourceContext;
    constructor(buffer, mainBlock, startTime, sourceContext) {
        this.buffer = buffer;
        this.anchorMedia = mainBlock;
        this.startTime = startTime;
        this.sourceContext = sourceContext;
    }
}
