import { MediaType } from '../../src/models/enum/mediaTypes';
import {
  AdhocStreamRequest,
  ContStreamRequest,
} from '../../src/models/streamRequest';
import { SelectedMedia } from '../../src/models/selectedMedia';
import * as streamCon from '../../src/services/streamConstructor';
import * as tdMovies from '../testData/movies';
import moment from 'moment';

describe('evaluateStreamEndTime', () => {
  it('should return the scheduled end time if it exceeds the last media schedule time and its duration', () => {
    const adhocArgs = new AdhocStreamRequest(
      'securepassword',
      'Adhoc Stream',
      'production',
      ['interstellar::1656633600', 'inception::1656547200'],
      ['tag1', 'tag2'],
      [['multiTag1'], ['multiTag2']],
      ['Blocks1'],
      0,
      1656647200,
    );
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
        tdMovies.interstellar,
        '',
        MediaType.Movie,
        1656633600,
        10800,
        ['scifi'],
      ),
    ];

    const result = streamCon.evaluateStreamEndTime(adhocArgs, selected);

    expect(result[0]).toBe(1656647200);
    expect(result[1]).toBe('');
  });

  it('should return the scheduled time plus the duration of the last scheduled media if no endTime was submitted', () => {
    const adhocArgs = new AdhocStreamRequest(
      'securepassword',
      'AdHoc Stream',
      'production',
      ['inception::1656547200', 'thematrix::1656633600'],
      ['tag1', 'tag2'],
      [['multiTag1'], ['multiTag2']],
      ['Blocks1'],
      0,
    );
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
        9000,
        ['action'],
      ),
    ];

    const result = streamCon.evaluateStreamEndTime(adhocArgs, selected);

    expect(result[0]).toBe(1656633600 + 9000);
    expect(result[1]).toBe('');
  });

  it('should return the end of the day today if no endTime was submitted and no media was scheduled', () => {
    const adhocArgs = new AdhocStreamRequest(
      'securepassword',
      'Adhoc Stream',
      'production',
      [],
      ['tag1', 'tag2'],
      [['multiTag1'], ['multiTag2']],
      ['Blocks1'],
      0,
    );
    const selected: SelectedMedia[] = [];

    const result = streamCon.evaluateStreamEndTime(adhocArgs, selected);

    expect(result[0]).toBe(moment().startOf('day').add(1, 'days').unix());
    expect(result[1]).toBe('');
  });

  it('should return the end of the day today if it is a continuous stream', () => {
    const contArgs = new ContStreamRequest(
      'securepassword',
      'Continuous Stream',
      'production',
      ['inception::1656547200', 'thematrix::1656633600'],
      ['tag1', 'tag2'],
      [['multiTag1'], ['multiTag2']],
      ['Blocks1'],
      0,
    );

    const result = streamCon.evaluateStreamEndTime(contArgs, []);

    expect(result[0]).toBe(moment().startOf('day').add(1, 'days').unix());
    expect(result[1]).toBe('');
  });
});
