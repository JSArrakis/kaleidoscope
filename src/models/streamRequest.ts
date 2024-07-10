import { keyNormalizer } from "../utils/utilities";

export interface IStreamRequest {
    Title: string;
    Env: string;
    Movies: string[];
    Tags: string[];
    MultiTags: string[][];
    Collections: string[];
    Password: string;
}

export class ContStreamRequest implements IStreamRequest {
    Title: string;
    Env: string;
    Movies: string[];
    Tags: string[];
    MultiTags: string[][];
    Collections: string[];
    StartTIme: number;
    EndTime: number;
    Password: string;

    constructor(password: string, title: string = "Default", env: string = "default", movies: string[] = [], tags: string[] = [], multiTags: string[][] = [], collections: string[] = [], startTime: number = 0, endTime: number = 0) {
        this.Title = title;
        this.Env = keyNormalizer(env);
        this.Movies = movies;
        this.Tags = tags;
        this.MultiTags = multiTags;
        this.Collections = collections;
        this.StartTIme = startTime;
        this.EndTime = endTime;
        this.Password = password
    }

    static fromRequestObject(requestObject: any): ContStreamRequest {
        return new ContStreamRequest(
            requestObject.title || "Default",
            requestObject.env || "default",
            requestObject.movies || [],
            requestObject.tags || [],
            requestObject.multiTags || [],
            requestObject.collections || [],
            requestObject.startTime || 0,
            requestObject.endTime || 0,
            requestObject.password
        );
    }
}

export class AdhocStreamRequest implements IStreamRequest {
    Title: string;
    Env: string;
    Movies: string[];
    Tags: string[];
    MultiTags: string[][];
    Collections: string[];
    EndTime?: number;
    Password: string;

    constructor(password: string, title: string = "Default", env: string = "default", movies: string[] = [], tags: string[] = [], multiTags: string[][] = [], collections: string[] = [], endtime: number = 0) {
        this.Title = title;
        this.Env = keyNormalizer(env);
        this.Movies = movies;
        this.Tags = tags;
        this.MultiTags = multiTags;
        this.Collections = collections;
        this.EndTime = endtime;
        this.Password = password
    }

    static fromRequestObject(requestObject: any): AdhocStreamRequest {
        return new AdhocStreamRequest(
            requestObject.title || "Default",
            requestObject.env || "default",
            requestObject.movies || [],
            requestObject.tags || [],
            requestObject.multiTags || [],
            requestObject.collections || [],
            requestObject.endtime || 0,
            requestObject.password
        );
    }
}