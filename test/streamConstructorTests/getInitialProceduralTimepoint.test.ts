import { MediaType } from '../../src/models/enum/mediaTypes';
import { SelectedMedia } from '../../src/models/selectedMedia';
import * as streamCon from '../../src/services/streamConstructor';
import { StagedMedia } from '../../src/models/stagedMedia';
import * as tdMovies from '../testData/movies';

describe('getInitialProceduralTimepoint', () => {
  it('should return the start time of the first scheduled media', () => {
    const rightNow = 1656546397;

    const selected = [
      new SelectedMedia(
        tdMovies.inception,
        '',
        MediaType.Movie,
        1656547200,
        9000,
        ['scifi'],
      ),
      new SelectedMedia(
        tdMovies.therock,
        '',
        MediaType.Movie,
        1656633600,
        10800,
        ['action'],
      ),
    ];

    const stagedMedia = new StagedMedia(selected, [], 1656633600 + 10800);

    const [result, error] = streamCon.getInitialProceduralTimepoint(
      rightNow,
      stagedMedia,
    );

    expect(result).toBe(1656547200);
    expect(error).toBe('');
  });

  it('should return the staged media end time if no media is scheduled', () => {
    const rightNow = 1656546397;

    const selected: SelectedMedia[] = [];

    const stagedMedia = new StagedMedia(selected, [], 1656633600);

    const [result, error] = streamCon.getInitialProceduralTimepoint(
      rightNow,
      stagedMedia,
    );

    expect(result).toBe(1656633600);
    expect(error).toBe('');
  });

  it('should return an error if the first scheduled media is in the past', () => {
    const rightNow = 1656547201;

    const selected = [
      new SelectedMedia(
        tdMovies.inception,
        '',
        MediaType.Movie,
        1656547200,
        9000,
        ['scifi'],
      ),
      new SelectedMedia(
        tdMovies.therock,
        '',
        MediaType.Movie,
        1656633600,
        10800,
        ['action'],
      ),
    ];

    const stagedMedia = new StagedMedia(selected, [], 1656633600 + 10800);

    const [result, error] = streamCon.getInitialProceduralTimepoint(
      rightNow,
      stagedMedia,
    );

    expect(result).toBe(0);
    expect(error).toBe(
      'Time of first scheduled movie, or block needs to be in the future.',
    );
  });
});
