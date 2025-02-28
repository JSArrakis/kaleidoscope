import { MediaType } from '../../src/models/enum/mediaTypes';
import { Media } from '../../src/models/media';
import { IStreamRequest } from '../../src/models/streamRequest';
import { SelectedMedia } from '../../src/models/selectedMedia';
import * as streamCon from '../../src/services/streamConstructor';
import * as tdMovies from '../testData/movies';
import { MainGenres } from '../../src/models/const/mainGenres';
import { AgeGroups } from '../../src/models/const/ageGroups';
import { Eras } from '../../src/models/const/eras';

describe('getInjectedMovies', () => {
  const media = new Media(
    [], // Shows
    [tdMovies.inception, tdMovies.therock, tdMovies.interstellar],
    [], // Shorts
    [], // Music
    [], // Promos
    [], // Default Promos
    [], // Commercials
    [], // Default Commercials
    [], // Collections
  );

  it('should return an empty array when no movies are provided', () => {
    const args: IStreamRequest = {
      Title: 'Example Title',
      Env: 'production',
      Movies: [],
      Tags: [],
      MultiTags: [],
      Collections: [],
      StartTime: 1656547200,
      Password: 'securepassword',
    };

    const result = streamCon.getInjectedMovies(args, media.Movies);

    expect(result[0]).toEqual([]);
  });

  it('should return an error when any loadtitle provided does is not found', () => {
    const args: IStreamRequest = {
      Title: 'Example Title',
      Env: 'production',
      Movies: ['unknownmovie'],
      Tags: [],
      MultiTags: [],
      Collections: [],
      StartTime: 1656547200,
      Password: 'securepassword',
    };

    const result = streamCon.getInjectedMovies(args, media.Movies);

    expect(result[0]).toEqual([]);
    expect(result[1]).toBe('unknownmovie load title, not found.');
  });

  it('should return an empty array when no movies are provided without the "::" delimiter', () => {
    const args: IStreamRequest = {
      Title: 'Example Title',
      Env: 'production',
      Movies: ['inception::1656547200'],
      Tags: [],
      MultiTags: [],
      Collections: [],
      StartTime: 1656547200,
      Password: 'securepassword',
    };

    const result = streamCon.getInjectedMovies(args, media.Movies);

    expect(result[0]).toEqual([]);
    expect(result[1]).toBe('');
  });

  it('should return the movies that match the provided load titles', () => {
    const args: IStreamRequest = {
      Title: 'Example Title',
      Env: 'production',
      Movies: ['inception', 'interstellar'],
      Tags: [],
      MultiTags: [],
      Collections: [],
      StartTime: 1656547200,
      Password: 'securepassword',
    };

    const expected = [
      new SelectedMedia(tdMovies.inception, '', MediaType.Movie, 0, 9000, [
        MainGenres.Action,
        MainGenres.SciFi,
        MainGenres.Adventure,
        AgeGroups.Mature,
        Eras.ttens,
      ]),
      new SelectedMedia(tdMovies.interstellar, '', MediaType.Movie, 0, 10800, [
        MainGenres.SciFi,
        AgeGroups.YoungAdult,
        Eras.ttens,
      ]),
    ];

    const result = streamCon.getInjectedMovies(args, media.Movies);

    expect(result[0]).toEqual(expected);
    expect(result[1]).toBe('');
  });
});
