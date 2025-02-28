import * as proEng from '../../src/services/proceduralEngine';
import { Movie } from '../../src/models/movie';
import { ContStreamRequest } from '../../src/models/streamRequest';
import * as tdMovies from '../testData/movies';

describe('isMovieSelected', () => {
  it('should return true if the movie is in the list of previous movies', () => {
    let prevMovies: Movie[] = [
      tdMovies.inception,
      tdMovies.therock,
      tdMovies.interstellar,
    ];

    let result = proEng.isMoviePreviouslySelected(
      tdMovies.inception,
      prevMovies,
    );

    expect(result).toBeTrue;
  });

  it('should return false if the movie is not in the list of previous movies', () => {
    let prevMovies: Movie[] = [tdMovies.inception, tdMovies.therock];

    let result = proEng.isMoviePreviouslySelected(
      tdMovies.interstellar,
      prevMovies,
    );

    expect(result).toBeFalse;
  });
});

describe('selectMovieUnderDuration', () => {
  it('should return a movie that is under the duration limit that has the tags in the request object', () => {
    let movies: Movie[] = [
      tdMovies.inception,
      tdMovies.therock,
      tdMovies.interstellar,
      tdMovies.dune,
    ];
    let prevMovies: Movie[] = [];
    let args: ContStreamRequest = new ContStreamRequest(
      'password',
      'title',
      'env',
      [],
      ['scifi'],
    );

    let result = proEng.selectMovieUnderDuration(
      args,
      movies,
      prevMovies,
      9000,
    );

    expect(result).toEqual(tdMovies.inception);
  });

  it('should return a movie that is under the duration limit that has the tags in the request object and has not been selected before', () => {
    let movies: Movie[] = [
      tdMovies.inception,
      tdMovies.therock,
      tdMovies.interstellar,
      tdMovies.dune,
    ];
    let prevMovies: Movie[] = [
      tdMovies.inception,
      tdMovies.therock,
      tdMovies.dune,
    ];
    let args: ContStreamRequest = new ContStreamRequest(
      'password',
      'title',
      'env',
      [],
      ['scifi', 'action'],
    );

    let result = proEng.selectMovieUnderDuration(
      args,
      movies,
      prevMovies,
      10800,
    );

    expect(result).toEqual(tdMovies.interstellar);
  });

  it('should return any movie that is under the duration limit that has the correct tags, when all movies with the criteria have been selected before (result scenario 1)', () => {
    let movies: Movie[] = [
      tdMovies.inception,
      tdMovies.therock,
      tdMovies.interstellar,
      tdMovies.dune,
    ];
    let prevMovies: Movie[] = [
      tdMovies.inception,
      tdMovies.therock,
      tdMovies.interstellar,
      tdMovies.dune,
    ];
    let args: ContStreamRequest = new ContStreamRequest(
      'password',
      'title',
      'env',
      [],
      ['scifi', 'action'],
    );
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.4);

    let result = proEng.selectMovieUnderDuration(
      args,
      movies,
      prevMovies,
      9000,
    );

    expect(result).toEqual(tdMovies.inception);

    randomSpy.mockRestore();
  });

  it('should return any movie that is under the duration limit that has the correct tags, when all movies with the criteria have been selected before (result scenario 2)', () => {
    let movies: Movie[] = [
      tdMovies.inception,
      tdMovies.therock,
      tdMovies.interstellar,
      tdMovies.dune,
    ];
    let prevMovies: Movie[] = [
      tdMovies.inception,
      tdMovies.therock,
      tdMovies.interstellar,
      tdMovies.dune,
    ];
    let args: ContStreamRequest = new ContStreamRequest(
      'password',
      'title',
      'env',
      [],
      ['scifi', 'action'],
    );
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.5);

    let result = proEng.selectMovieUnderDuration(
      args,
      movies,
      prevMovies,
      9000,
    );

    expect(result).toEqual(tdMovies.therock);

    randomSpy.mockRestore();
  });
});
