import { Commercial } from '../../src/models/commercial';
import { AgeGroups } from '../../src/models/const/ageGroups';
import { MainGenres } from '../../src/models/const/mainGenres';
import { Media } from '../../src/models/media';
import { Music } from '../../src/models/music';
import { SegmentedTags } from '../../src/models/segmentedTags';
import { Short } from '../../src/models/short';
import * as buffEng from '../../src/services/bufferEngine';
import * as tdCommercials from '../testData/commercials';
import * as tdMusic from '../testData/music';
import * as tdShorts from '../testData/shorts';
// Mosaic functionality removed — use empty mosaics arrays in tests

describe('selectBufferMediaWithinDuration', () => {
  it('should return the media within the duration (scenario 1)', () => {
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.99);
    const media: Media = new Media([], [], [], [], [], [], [], [], []);
    const mosaics: any[] = [];
    const segmentedTags: SegmentedTags = new SegmentedTags([], [], [], [], []);
    const duration: number = 0;
    const alreadyUsedMedia: Media = new Media(
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
    );

    const expectedSelectedMedia: (Commercial | Short | Music)[] = [];
    const expectedSegmentedSelectedMedia: Media = new Media(
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
    );
    const expectedRemainingDuration: number = 0;
    const selectedHolidayTags: string[] = [];

    const result = buffEng.selectBufferMediaWithinDuration(
      media,
      mosaics,
      segmentedTags,
      duration,
      alreadyUsedMedia,
      selectedHolidayTags,
    );

    expect(result.selectedMedia).toEqual(expectedSelectedMedia);
    expect(result.segmentedSelectedMedia).toEqual(
      expectedSegmentedSelectedMedia,
    );
    expect(result.remainingDuration).toEqual(expectedRemainingDuration);

    randomSpy.mockRestore();
  });
  it('should return the media within the duration (scenario 2)', () => {
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.99);
    const media: Media = new Media(
      [],
      [],
      tdShorts.shorts,
      tdMusic.music,
      [],
      [],
      tdCommercials.commercials,
      tdCommercials.defaultCommercials,
      [],
    );
    const mosaics: any[] = [];
    const segmentedTags: SegmentedTags = new SegmentedTags([], [], [], [], []);
    const duration: number = 358;
    const alreadyUsedMedia: Media = new Media(
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
    );

    const expectedSelectedMedia: (Commercial | Short | Music)[] = [
      tdCommercials.default8,
      tdCommercials.default8,
      tdMusic.holidayincambodia,
      tdCommercials.default6,
    ];
    const expectedSegmentedSelectedMedia: Media = new Media(
      [],
      [],
      [],
      [tdMusic.holidayincambodia],
      [],
      [],
      [tdCommercials.default8, tdCommercials.default8, tdCommercials.default6],
      [],
      [],
    );
    const expectedRemainingDuration: number = 7;
    const selectedHolidayTags: string[] = [];

    const result = buffEng.selectBufferMediaWithinDuration(
      media,
      mosaics,
      segmentedTags,
      duration,
      alreadyUsedMedia,
      selectedHolidayTags,
    );

    expect(result.selectedMedia).toEqual(expectedSelectedMedia);
    expect(result.segmentedSelectedMedia).toEqual(
      expectedSegmentedSelectedMedia,
    );
    expect(result.remainingDuration).toEqual(expectedRemainingDuration);

    randomSpy.mockRestore();
  });
  it('should return the media within the duration (scenario 3)', () => {
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.99);
    const media: Media = new Media(
      [],
      [],
      tdShorts.shorts,
      tdMusic.music,
      [],
      [],
      tdCommercials.commercials,
      tdCommercials.defaultCommercials,
      [],
    );
    const mosaics: any[] = [];
    const segmentedTags: SegmentedTags = new SegmentedTags(
      [],
      [MainGenres.Action, MainGenres.SciFi],
      [],
      [AgeGroups.Kids],
      [],
    );
    const duration: number = 358;
    const alreadyUsedMedia: Media = new Media(
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
    );

    const expectedSelectedMedia: (Commercial | Short | Music)[] = [
      tdCommercials.superduperdoublelooper,
      tdCommercials.pizzahutxmen,
      tdCommercials.jurassicpark3toys,
      tdCommercials.starttrektoys,
      tdCommercials.jurassicparktoys3,
      tdCommercials.jurassicparktoys2,
      tdCommercials.wildones,
      tdCommercials.marvelvsstreetfighter98,
      tdCommercials.jurassicparktoys1,
      tdCommercials.alienstoys1,
      tdCommercials.transformers80s1,
      tdCommercials.default8,
      tdCommercials.default8,
    ];
    const expectedSegmentedSelectedMedia: Media = new Media(
      [],
      [],
      [],
      [],
      [],
      [],
      [
        tdCommercials.superduperdoublelooper,
        tdCommercials.pizzahutxmen,
        tdCommercials.jurassicpark3toys,
        tdCommercials.starttrektoys,
        tdCommercials.jurassicparktoys3,
        tdCommercials.jurassicparktoys2,
        tdCommercials.wildones,
        tdCommercials.marvelvsstreetfighter98,
        tdCommercials.jurassicparktoys1,
        tdCommercials.alienstoys1,
        tdCommercials.transformers80s1,
        tdCommercials.default8,
        tdCommercials.default8,
      ],
      [],
      [],
    );
    const expectedRemainingDuration: number = 3;
    const selectedHolidayTags: string[] = [];

    const result = buffEng.selectBufferMediaWithinDuration(
      media,
      mosaics,
      segmentedTags,
      duration,
      alreadyUsedMedia,
      selectedHolidayTags,
    );

    expect(result.selectedMedia).toEqual(expectedSelectedMedia);
    expect(result.segmentedSelectedMedia).toEqual(
      expectedSegmentedSelectedMedia,
    );
    expect(result.remainingDuration).toEqual(expectedRemainingDuration);

    randomSpy.mockRestore();
  });
  it('should return the media within the duration (scenario 4)', () => {
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.99);
    const media: Media = new Media(
      [],
      [],
      tdShorts.shorts,
      tdMusic.music,
      [],
      [],
      tdCommercials.commercials,
      tdCommercials.defaultCommercials,
      [],
    );
    const mosaics: any[] = [];
    const segmentedTags: SegmentedTags = new SegmentedTags(
      [],
      [MainGenres.Action, MainGenres.SciFi],
      [],
      [AgeGroups.Kids],
      [],
    );
    const duration: number = 172;
    const alreadyUsedMedia: Media = new Media(
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
    );

    const expectedSelectedMedia: (Commercial | Short | Music)[] = [
      tdCommercials.superduperdoublelooper,
      tdCommercials.pizzahutxmen,
      tdCommercials.jurassicpark3toys,
      tdCommercials.starttrektoys,
      tdCommercials.jurassicparktoys3,
      tdCommercials.jurassicparktoys2,
      tdCommercials.wildones,
      tdCommercials.marvelvsstreetfighter98,
    ];
    const expectedSegmentedSelectedMedia: Media = new Media(
      [],
      [],
      [],
      [],
      [],
      [],
      [
        tdCommercials.superduperdoublelooper,
        tdCommercials.pizzahutxmen,
        tdCommercials.jurassicpark3toys,
        tdCommercials.starttrektoys,
        tdCommercials.jurassicparktoys3,
        tdCommercials.jurassicparktoys2,
        tdCommercials.wildones,
        tdCommercials.marvelvsstreetfighter98,
      ],
      [],
      [],
    );
    const expectedRemainingDuration: number = 7;
    const selectedHolidayTags: string[] = [];

    const result = buffEng.selectBufferMediaWithinDuration(
      media,
      mosaics,
      segmentedTags,
      duration,
      alreadyUsedMedia,
      selectedHolidayTags,
    );

    expect(result.selectedMedia).toEqual(expectedSelectedMedia);
    expect(result.segmentedSelectedMedia).toEqual(
      expectedSegmentedSelectedMedia,
    );
    expect(result.remainingDuration).toEqual(expectedRemainingDuration);

    randomSpy.mockRestore();
  });
  it('should return the media within the duration (scenario 5)', () => {
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.99);
    const media: Media = new Media(
      [],
      [],
      tdShorts.shorts,
      tdMusic.music,
      [],
      [],
      tdCommercials.commercials,
      tdCommercials.defaultCommercials,
      [],
    );
    const mosaics: any[] = [];
    const segmentedTags: SegmentedTags = new SegmentedTags(
      [],
      [MainGenres.Action, MainGenres.Horror, MainGenres.SciFi],
      [],
      [AgeGroups.Kids],
      [],
    );
    const duration: number = 1620;
    const alreadyUsedMedia: Media = new Media(
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
    );

    const expectedSelectedMedia: (Commercial | Short | Music)[] = [
      tdCommercials.superduperdoublelooper,
      tdCommercials.pizzahutxmen,
      tdCommercials.jurassicpark3toys,
      tdCommercials.starttrektoys,
      tdCommercials.jurassicparktoys3,
      tdMusic.thebeautifulpeople,
      tdCommercials.jurassicparktoys2,
      tdCommercials.wildones,
      tdCommercials.marvelvsstreetfighter98,
      tdCommercials.jurassicparktoys1,
      tdCommercials.transformers80s1,
      tdCommercials.transformersbeastwarstoys,
      tdCommercials.default6,
      tdMusic.thedarkplacesoftheearth,
      tdCommercials.default8,
      tdCommercials.default8,
      tdMusic.endtitles,
      tdCommercials.default8,
      tdCommercials.default8,
      tdMusic.aceofspades,
      tdCommercials.default8,
      tdCommercials.meninblacktoys97,
      tdCommercials.default5,
    ];
    const expectedSegmentedSelectedMedia: Media = new Media(
      [],
      [],
      [],
      [
        tdMusic.thebeautifulpeople,
        tdMusic.thedarkplacesoftheearth,
        tdMusic.endtitles,
        tdMusic.aceofspades,
      ],
      [],
      [],
      [
        tdCommercials.superduperdoublelooper,
        tdCommercials.pizzahutxmen,
        tdCommercials.jurassicpark3toys,
        tdCommercials.starttrektoys,
        tdCommercials.jurassicparktoys3,
        tdCommercials.jurassicparktoys2,
        tdCommercials.wildones,
        tdCommercials.marvelvsstreetfighter98,
        tdCommercials.jurassicparktoys1,
        tdCommercials.transformers80s1,
        tdCommercials.transformersbeastwarstoys,
        tdCommercials.default6,
        tdCommercials.default8,
        tdCommercials.default8,
        tdCommercials.default8,
        tdCommercials.default8,
        tdCommercials.default8,
        tdCommercials.meninblacktoys97,
        tdCommercials.default5,
      ],
      [],
      [],
    );
    const expectedRemainingDuration: number = 0;
    const selectedHolidayTags: string[] = [];

    const result = buffEng.selectBufferMediaWithinDuration(
      media,
      mosaics,
      segmentedTags,
      duration,
      alreadyUsedMedia,
      selectedHolidayTags,
    );

    expect(result.selectedMedia).toEqual(expectedSelectedMedia);
    expect(result.segmentedSelectedMedia).toEqual(
      expectedSegmentedSelectedMedia,
    );
    expect(result.remainingDuration).toEqual(expectedRemainingDuration);

    randomSpy.mockRestore();
  });
});
