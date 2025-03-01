import { Bumper } from './bumper';
import { Promo } from './promo';
import { Episode } from './show';

export class Block {
  Title: string;
  LoadTitle: string;
  Type: string;
  Duration: number;
  DurationLimit: number;
  Tags: string[];
  StartBumper: Bumper;
  EndBumper: Bumper;
  Promos: Promo[];
  Shows: BlockShow[];
  Path: string;

  constructor(
    title: string,
    loadTitle: string,
    type: string,
    duration: number,
    durationLimit: number,
    tags: string[],
    startBumper: Bumper,
    endBumper: Bumper,
    promos: Promo[],
    shows: BlockShow[],
    path: string,
  ) {
    this.Title = title;
    this.LoadTitle = loadTitle;
    this.Type = type;
    this.Duration = duration;
    this.DurationLimit = durationLimit;
    this.Tags = tags;
    this.StartBumper = startBumper;
    this.EndBumper = endBumper;
    this.Promos = promos;
    this.Shows = shows;
    this.Path = path;
  }
}

export class BlockShow {
  LoadTitle: string;
  Sequence: number;
  Subsequence: number;
  DurationLimit: number;
  BumperStart?: Bumper;
  BumperEnd?: Bumper;
  Episode?: Episode;

  constructor(
    loadTitle: string,
    sequence: number,
    subsequence: number,
    durationLimit: number,
    bumperStart?: Bumper,
    bumperEnd?: Bumper,
    episode?: Episode,
  ) {
    this.LoadTitle = loadTitle;
    this.Sequence = sequence;
    this.Subsequence = subsequence;
    this.DurationLimit = durationLimit;
    this.BumperStart = bumperStart;
    this.BumperEnd = bumperEnd;
    this.Episode = episode;
  }
}
