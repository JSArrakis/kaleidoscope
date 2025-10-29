import { BaseMedia } from './mediaInterface';
import { Tag } from './tag';
import { MediaType } from './enum/mediaTypes';
import { tagRepository } from '../repositories/tagsRepository';

export interface IEpisode {
  season: string;
  episode: string;
  episodeNumber: number;
  path: string;
  title: string;
  mediaItemId: string;
  showItemId: string;
  duration: number;
  durationLimit: number;
  overDuration: boolean;
  type: MediaType;
  tags: Tag[];
}

export interface IShow extends BaseMedia {
  alias: string;
  imdb: string;
  durationLimit: number;
  firstEpisodeOverDuration: boolean;
  secondaryTags: Tag[];
  episodeCount: number;
  episodes: IEpisode[];
  type: MediaType;
}

export class Episode {
  public season: string;
  public episode: string;
  public episodeNumber: number;
  public path: string;
  public title: string;
  public mediaItemId: string;
  public showItemId: string;
  public duration: number;
  public durationLimit: number;
  public overDuration: boolean;
  public type: MediaType;
  public tags: Tag[];

  constructor(
    season: string,
    episode: string,
    episodeNumber: number,
    path: string,
    title: string,
    mediaItemId: string,
    showItemId: string,
    duration: number,
    durationLimit: number,
    overDuration: boolean,
    type: MediaType,
    tags: Tag[],
  ) {
    this.season = season;
    this.episode = episode;
    this.episodeNumber = episodeNumber;
    this.path = path;
    this.title = title;
    this.mediaItemId = mediaItemId;
    this.showItemId = showItemId;
    this.duration = duration;
    this.durationLimit = durationLimit;
    this.overDuration = overDuration;
    this.type = type;
    this.tags = tags;
  }

  static fromRequestObject(requestObject: any): Episode {
    // Handle tag names - convert tag names (strings) to Tag objects
    const tags: Tag[] = [];
    for (const tagName of requestObject.tags || []) {
      if (typeof tagName === 'string') {
        // Look up the tag by name in the database (try exact match first, then case-insensitive)
        let foundTag = tagRepository.findByName(tagName);
        if (!foundTag) {
          foundTag = tagRepository.findByNameIgnoreCase(tagName);
        }

        if (foundTag) {
          tags.push(foundTag);
        } else {
          console.warn(`Tag with name "${tagName}" not found`);
        }
      }
    }

    return new Episode(
      requestObject.season,
      requestObject.episode,
      requestObject.episodeNumber,
      requestObject.path,
      requestObject.title,
      requestObject.mediaItemId,
      requestObject.showItemId,
      requestObject.duration,
      requestObject.durationLimit,
      requestObject.overDuration,
      MediaType.Episode,
      tags,
    );
  }
}

export class Show {
  public title: string;
  public mediaItemId: string;
  public alias: string;
  public imdb: string;
  public durationLimit: number;
  public firstEpisodeOverDuration: boolean;
  public tags: Tag[];
  public secondaryTags: Tag[];
  public type: MediaType;
  public episodeCount: number;
  public episodes: Episode[];

  constructor(
    title: string,
    mediaItemId: string,
    alias: string,
    imdb: string,
    durationLimit: number,
    firstEpisodeOverDuration: boolean,
    tags: Tag[],
    secondaryTags: Tag[],
    type: MediaType,
    episodeCount: number,
    episodes: Episode[],
  ) {
    this.title = title;
    this.mediaItemId = mediaItemId;
    this.alias = alias;
    this.imdb = imdb;
    this.durationLimit = durationLimit;
    this.firstEpisodeOverDuration = firstEpisodeOverDuration;
    this.tags = tags;
    this.secondaryTags = secondaryTags;
    this.type = type;
    this.episodeCount = episodeCount;
    this.episodes = episodes;
  }

  static fromRequestObject(requestObject: any): Show {
    // Handle tag names - convert tag names (strings) to Tag objects
    const tags: Tag[] = [];
    for (const tagName of requestObject.tags || []) {
      if (typeof tagName === 'string') {
        // Look up the tag by name in the database (try exact match first, then case-insensitive)
        let foundTag = tagRepository.findByName(tagName);
        if (!foundTag) {
          foundTag = tagRepository.findByNameIgnoreCase(tagName);
        }

        if (foundTag) {
          tags.push(foundTag);
        } else {
          console.warn(`Tag with name "${tagName}" not found`);
        }
      }
    }

    // Handle secondary tags (initially empty, will be populated during transformation)
    const secondaryTags: Tag[] = [];

    return new Show(
      requestObject.title,
      requestObject.mediaItemId,
      requestObject.alias,
      requestObject.imdb,
      requestObject.durationLimit,
      requestObject.firstEpisodeOverDuration,
      tags,
      secondaryTags,
      MediaType.Show,
      requestObject.episodeCount,
      requestObject.episodes?.map((episode: any) =>
        Episode.fromRequestObject(episode),
      ) || [],
    );
  }
}
