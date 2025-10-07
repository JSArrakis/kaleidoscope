import { keyNormalizer } from '../utils/utilities';
import { MediaTag } from './const/tagTypes';

export interface IStreamRequest {
  Title: string;
  Env: string;
  Movies: string[];
  Tags: MediaTag[];
  MultiTags: string[][];
  Blocks: string[];
  StartTime: number;
  Password: string;
  EndTime?: number;
}

export class ContStreamRequest implements IStreamRequest {
  Title: string;
  Env: string;
  Movies: string[];
  Tags: MediaTag[];
  MultiTags: string[][];
  Blocks: string[];
  StartTime: number;
  Password: string;

  constructor(
    password: string,
    title: string = 'Default',
    env: string = 'default',
    movies: string[] = [],
    tags: MediaTag[] = [],
    multiTags: string[][] = [],
    blocks: string[] = [],
    startTime: number = 0,
  ) {
    this.Title = title;
    this.Env = keyNormalizer(env);
    this.Movies = movies;
    this.Tags = tags;
    this.MultiTags = multiTags;
    this.Blocks = blocks;
    this.StartTime = startTime;
    this.Password = password;
  }

  static fromRequestObject(requestObject: any): ContStreamRequest {
    return new ContStreamRequest(
      requestObject.password,
      requestObject.title || 'Default',
      requestObject.env || 'default',
      requestObject.movies || [],
      requestObject.tags || [],
      requestObject.multiTags || [],
      requestObject.blocks || [],
      requestObject.startTime || 0,
    );
  }
}

export class AdhocStreamRequest implements IStreamRequest {
  Title: string;
  Env: string;
  Movies: string[];
  Tags: MediaTag[];
  MultiTags: string[][];
  Blocks: string[];
  StartTime: number;
  EndTime?: number;
  Password: string;

  constructor(
    password: string,
    title: string = 'Default',
    env: string = 'default',
    movies: string[] = [],
    tags: MediaTag[] = [],
    multiTags: string[][] = [],
    collections: string[] = [],
    startTime: number = 0,
    endtime: number = 0,
  ) {
    this.Title = title;
    this.Env = keyNormalizer(env);
    this.Movies = movies;
    this.Tags = tags;
    this.MultiTags = multiTags;
    this.Blocks = collections;
    this.StartTime = startTime;
    this.EndTime = endtime;
    this.Password = password;
  }

  static fromRequestObject(requestObject: any): AdhocStreamRequest {
    return new AdhocStreamRequest(
      requestObject.password,
      requestObject.title || 'Default',
      requestObject.env || 'default',
      requestObject.movies || [],
      requestObject.tags || [],
      requestObject.multiTags || [],
      requestObject.collections || [],
      requestObject.startTime || 0,
      requestObject.endtime || 0,
    );
  }
}
