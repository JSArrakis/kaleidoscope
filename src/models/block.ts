import { Bumper } from './bumper';
import { Promo } from './promo';
import { Episode } from './show';
import { MediaTag } from './const/tagTypes';

export class Block {
  title: string;
  mediaItemId: string;
  type: string;
  duration: number;
  durationLimit: number;
  tags: MediaTag[];
  startBumper: Bumper;
  endBumper: Bumper;
  promos: Promo[];
  shows: BlockShow[];
  path: string;

  constructor(
    title: string,
    mediaItemId: string,
    type: string,
    duration: number,
    durationLimit: number,
    tags: MediaTag[],
    startBumper: Bumper,
    endBumper: Bumper,
    promos: Promo[],
    shows: BlockShow[],
    path: string,
  ) {
    this.title = title;
    this.mediaItemId = mediaItemId;
    this.type = type;
    this.duration = duration;
    this.durationLimit = durationLimit;
    this.tags = tags;
    this.startBumper = startBumper;
    this.endBumper = endBumper;
    this.promos = promos;
    this.shows = shows;
    this.path = path;
  }
}

export class BlockShow {
  mediaItemId: string;
  sequence: number;
  subsequence: number;
  durationLimit: number;
  bumperStart?: Bumper;
  bumperEnd?: Bumper;
  episode?: Episode;

  constructor(
    mediaItemId: string,
    sequence: number,
    subsequence: number,
    durationLimit: number,
    bumperStart?: Bumper,
    bumperEnd?: Bumper,
    episode?: Episode,
  ) {
    this.mediaItemId = mediaItemId;
    this.sequence = sequence;
    this.subsequence = subsequence;
    this.durationLimit = durationLimit;
    this.bumperStart = bumperStart;
    this.bumperEnd = bumperEnd;
    this.episode = episode;
  }
}
