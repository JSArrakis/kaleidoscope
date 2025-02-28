import { AgeGroups } from '../../src/models/const/ageGroups';
import { Eras } from '../../src/models/const/eras';
import { MainGenres } from '../../src/models/const/mainGenres';
import { MediaType } from '../../src/models/enum/mediaTypes';
import { Movie } from '../../src/models/movie';
import { SelectedMedia } from '../../src/models/selectedMedia';
import * as streamCon from '../../src/services/streamConstructor';
import * as tdMovies from '../testData/movies';

describe('getMovie', () => {
  let movieList: Movie[];

  beforeEach(() => {
    movieList = [tdMovies.inception, tdMovies.therock];
  });

  it('should return an error if the loadTitle is empty', () => {
    let movie = streamCon.getMovie('', movieList, 1609459200);
    expect(movie[0]).toBeInstanceOf(SelectedMedia);
    expect(movie[0].Media.LoadTitle).toBe('');
    expect(movie[1]).toBe('Empty movie titles are not a valid input');
  });

  it('should return an error if the loadTitle is undefined', () => {
    let movie = streamCon.getMovie(
      undefined as unknown as string,
      movieList,
      1609459200,
    );
    expect(movie[0]).toBeInstanceOf(SelectedMedia);
    expect(movie[0].Media.LoadTitle).toBe('');
    expect(movie[1]).toBe('Empty movie titles are not a valid input');
  });

  it('should return an error if the loadTitle is not found in the movie list', () => {
    let movie = streamCon.getMovie('unknownmovie', movieList, 1609459200);
    expect(movie[0]).toBeInstanceOf(SelectedMedia);
    expect(movie[0].Media.LoadTitle).toBe('');
    expect(movie[1]).toBe('unknownmovie load title, not found.');
  });

  it('should return a SelectedMedia object for a valid loadTitle', () => {
    const time = 1609459200;
    const selectedMedia = streamCon.getMovie(
      movieList[0].LoadTitle,
      movieList,
      time,
    );
    expect(selectedMedia[1]).toBe('');
    expect(selectedMedia[0]).toBeInstanceOf(SelectedMedia);
    expect(selectedMedia[0].Media.LoadTitle).toBe(movieList[0].LoadTitle);
    expect(selectedMedia[0].Type).toBe(MediaType.Movie);
    expect(selectedMedia[0].Time).toBe(time);
    expect(selectedMedia[0].Duration).toBe(9000);
    expect(selectedMedia[0].Tags).toEqual([
      MainGenres.Action,
      MainGenres.SciFi,
      MainGenres.Adventure,
      AgeGroups.Mature,
      Eras.ttens,
    ]);
  });
});
