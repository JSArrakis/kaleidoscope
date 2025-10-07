import { MediaType } from '../../src/models/enum/mediaTypes';
import { IStreamRequest } from '../../src/models/streamRequest';
import { SelectedMedia } from '../../src/models/selectedMedia';
import { StagedMedia } from '../../src/models/stagedMedia';
import * as streamCon from '../../src/services/streamConstructor';
import * as tdMovies from '../testData/movies';
import { MainGenres } from '../../src/models/const/mainGenres';
import { AgeGroups } from '../../src/models/const/ageGroups';
import { Eras } from '../../src/models/const/eras';

describe('setProceduralTags', () => {
  it('should populate the tags array of the args object with the tags of the selected media if the args tags array is empty', () => {
    let args: IStreamRequest = {
      Title: 'Example Title',
      Env: 'production',
      Movies: ['inception::1656547200', 'interstellar::1656633600'],
      Tags: [],
      MultiTags: [],
      Blocks: [],
      StartTime: 1656547200,
      Password: 'securepassword',
    };

    const selected = [
      new SelectedMedia(
        tdMovies.inception,
        '',
        MediaType.Movie,
        1656547200,
        9000,
        tdMovies.inception.tags,
      ),
      new SelectedMedia(
        tdMovies.therock,
        '',
        MediaType.Movie,
        1656633600,
        10800,
        tdMovies.therock.tags,
      ),
    ];

    const stagedMedia = new StagedMedia(selected, [], 1656633600 + 10800);
    streamCon.setProceduralTags(args, stagedMedia);

    // Expect args.Tags to include the tags from the selected media (deduped)
    expect(args.Tags).toEqual([
      ...tdMovies.inception.tags,
      ...tdMovies.therock.tags.filter(
        t =>
          !tdMovies.inception.tags.some(
            it => (it as any).name === (t as any).name,
          ),
      ),
    ]);
  });
});
