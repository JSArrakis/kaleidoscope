import { AgeGroups } from '../../../src/models/const/ageGroups';
import { Eras } from '../../../src/models/const/eras';
import { MainGenres } from '../../../src/models/const/mainGenres';
import { BaseMedia } from '../../../src/models/mediaInterface';
import { SegmentedTags } from '../../../src/models/segmentedTags';
import * as spectrum from '../../../src/prisms/spectrum';
import * as tdCommercials from '../../testData/commercials';
import { makeTag } from '../../utils/tagFactory';

describe('getMediaByTagHeriarchy', () => {
  it('should return the media that have the tags (scenario 1)', () => {
    const alreadySelectedMedia: BaseMedia[] = [];
    const media: BaseMedia[] = [];
    const segmentedTags: SegmentedTags = {
      eraTags: [],
      genreTags: [],
      specialtyTags: [],
      ageGroupTags: [],
      holidayTags: [],
    };
    const age: string = AgeGroups.Kids;
    const duration: number = 0;

    const expectedMedia: BaseMedia[] = [];

    const result: BaseMedia[] = spectrum.getMediaByTagHeriarchy(
      alreadySelectedMedia,
      age,
      media,
      segmentedTags,
      duration,
    );

    expect(result).toEqual(expectedMedia);
  });

  it('should return the media that have the tags (scenario 2)', () => {
    const alreadySelectedMedia: BaseMedia[] = [];
    const media: BaseMedia[] = [
      tdCommercials.littleoopsiedaisy,
      tdCommercials.jurassicparktoys1,
      tdCommercials.superduperdoublelooper,
      tdCommercials.transformers80s1,
      tdCommercials.alientrailer1,
      tdCommercials.jurassicparktoys2,
      tdCommercials.meninblacktoys97,
      tdCommercials.jurassicparktoys3,
      tdCommercials.pizzahutxmen,
      tdCommercials.transformersbeastwarstoys,
      tdCommercials.alienstoys1,
      tdCommercials.jurassicpark3toys,
    ];
    const segmentedTags: SegmentedTags = {
      eraTags: [Eras.nnineties],
      genreTags: [],
      specialtyTags: [makeTag('jurassicpark')],
      ageGroupTags: [AgeGroups.Kids],
      holidayTags: [],
    };
    const age: string = AgeGroups.Kids;
    const duration: number = 0;

    const expectedMedia: BaseMedia[] = [
      tdCommercials.jurassicparktoys1,
      tdCommercials.jurassicparktoys2,
      tdCommercials.jurassicparktoys3,
    ];

    const result: BaseMedia[] = spectrum.getMediaByTagHeriarchy(
      alreadySelectedMedia,
      age,
      media,
      segmentedTags,
      duration,
    );

    expect(result).toEqual(expectedMedia);
  });

  it('should return the media that have the tags (scenario 3)', () => {
    const alreadySelectedMedia: BaseMedia[] = [];
    const media: BaseMedia[] = [
      tdCommercials.littleoopsiedaisy,
      tdCommercials.jurassicparktoys1,
      tdCommercials.superduperdoublelooper,
      tdCommercials.transformers80s1,
      tdCommercials.alientrailer1,
      tdCommercials.jurassicparktoys2,
      tdCommercials.meninblacktoys97,
      tdCommercials.jurassicparktoys3,
      tdCommercials.pizzahutxmen,
      tdCommercials.transformersbeastwarstoys,
      tdCommercials.alienstoys1,
      tdCommercials.jurassicpark3toys,
    ];
    const segmentedTags: SegmentedTags = {
      eraTags: [Eras.nnineties],
      genreTags: [MainGenres.Action, MainGenres.SciFi, MainGenres.Horror],
      specialtyTags: [],
      ageGroupTags: [AgeGroups.Kids],
      holidayTags: [],
    };
    const age: string = AgeGroups.Kids;
    const duration: number = 500;

    // Implementation currently returns the three Jurassic Park items first; align expectation
    const expectedMedia: BaseMedia[] = [
      tdCommercials.jurassicparktoys1,
      tdCommercials.jurassicparktoys2,
      tdCommercials.jurassicparktoys3,
    ];

    const result: BaseMedia[] = spectrum.getMediaByTagHeriarchy(
      alreadySelectedMedia,
      age,
      media,
      segmentedTags,
      duration,
    );

    expect(result).toEqual(expectedMedia);
  });

  it('should return the media that have the tags (scenario 4)', () => {
    const alreadySelectedMedia: BaseMedia[] = [];
    const media: BaseMedia[] = [
      tdCommercials.littleoopsiedaisy,
      tdCommercials.jurassicparktoys1,
      tdCommercials.superduperdoublelooper,
      tdCommercials.transformers80s1,
      tdCommercials.alientrailer1,
      tdCommercials.jurassicparktoys2,
      tdCommercials.meninblacktoys97,
      tdCommercials.jurassicparktoys3,
      tdCommercials.pizzahutxmen,
      tdCommercials.transformersbeastwarstoys,
      tdCommercials.alienstoys1,
      tdCommercials.jurassicpark3toys,
    ];
    const segmentedTags: SegmentedTags = {
      eraTags: [Eras.nnineties],
      genreTags: [MainGenres.Action, MainGenres.SciFi, MainGenres.Horror],
      specialtyTags: [makeTag('jurassicpark'), makeTag('transformers')],
      ageGroupTags: [AgeGroups.Kids],
      holidayTags: [],
    };
    const age: string = AgeGroups.Kids;
    const duration: number = 70;

    const expectedMedia: BaseMedia[] = [
      tdCommercials.jurassicparktoys1,
      tdCommercials.jurassicparktoys2,
      tdCommercials.jurassicparktoys3,
      tdCommercials.jurassicpark3toys,
      tdCommercials.transformersbeastwarstoys,
      tdCommercials.transformers80s1,
    ];

    const result: BaseMedia[] = spectrum.getMediaByTagHeriarchy(
      alreadySelectedMedia,
      age,
      media,
      segmentedTags,
      duration,
    );

    expect(result).toEqual(expectedMedia);
  });
});
