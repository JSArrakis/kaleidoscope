import { AgeGroups } from '../../../src/models/const/ageGroups';
import { Eras } from '../../../src/models/const/eras';
import { MainGenres } from '../../../src/models/const/mainGenres';
import { BaseMedia } from '../../../src/models/mediaInterface';
import * as core from '../../../src/prisms/core';
import * as tdCommercials from '../../testData/commercials';

describe('getMediaByTagGroupHeirarchy', () => {
  it('should return the media that have the tags (scenario 1)', () => {
    const alreadySelectedMedia: BaseMedia[] = [];
    const media: BaseMedia[] = [];
    const tags: string[] = [];
    const eraTags: string[] = [];
    const age: string = AgeGroups.Kids;
    const duration: number = 0;

    const expectedMedia: BaseMedia[] = [];

    const result: BaseMedia[] = core.getMediaByTagGroupHeirarchy(
      alreadySelectedMedia,
      media,
      tags,
      eraTags,
      age,
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
    ];
    const tags: string[] = [];
    const eraTags: string[] = [];
    const age: string = AgeGroups.Kids;
    const duration: number = 0;

    const expectedMedia: BaseMedia[] = [
      tdCommercials.littleoopsiedaisy,
      tdCommercials.jurassicparktoys1,
      tdCommercials.superduperdoublelooper,
      tdCommercials.transformers80s1,
      tdCommercials.jurassicparktoys2,
      tdCommercials.meninblacktoys97,
      tdCommercials.jurassicparktoys3,
      tdCommercials.pizzahutxmen,
      tdCommercials.transformersbeastwarstoys,
      tdCommercials.alienstoys1,
    ];

    const result: BaseMedia[] = core.getMediaByTagGroupHeirarchy(
      alreadySelectedMedia,
      media,
      tags,
      eraTags,
      age,
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
    ];
    const tags: string[] = [];
    const eraTags: string[] = [Eras.nnineties];
    const age: string = AgeGroups.Kids;
    const duration: number = 0;

    const expectedMedia: BaseMedia[] = [
      tdCommercials.littleoopsiedaisy,
      tdCommercials.jurassicparktoys1,
      tdCommercials.superduperdoublelooper,
      tdCommercials.jurassicparktoys2,
      tdCommercials.meninblacktoys97,
      tdCommercials.jurassicparktoys3,
      tdCommercials.pizzahutxmen,
      tdCommercials.transformersbeastwarstoys,
      tdCommercials.alienstoys1,
    ];

    const result: BaseMedia[] = core.getMediaByTagGroupHeirarchy(
      alreadySelectedMedia,
      media,
      tags,
      eraTags,
      age,
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
    ];
    const tags: string[] = ['jurassicpark'];
    const eraTags: string[] = [Eras.nnineties];
    const age: string = AgeGroups.Kids;
    const duration: number = 0;

    const expectedMedia: BaseMedia[] = [
      tdCommercials.jurassicparktoys1,
      tdCommercials.jurassicparktoys2,
      tdCommercials.jurassicparktoys3,
    ];

    const result: BaseMedia[] = core.getMediaByTagGroupHeirarchy(
      alreadySelectedMedia,
      media,
      tags,
      eraTags,
      age,
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
    ];
    const tags: string[] = ['jurassicpark', 'transformers'];
    const eraTags: string[] = [Eras.nnineties];
    const age: string = AgeGroups.Kids;
    const duration: number = 30;

    const expectedMedia: BaseMedia[] = [
      tdCommercials.jurassicparktoys1,
      tdCommercials.jurassicparktoys2,
      tdCommercials.jurassicparktoys3,
      tdCommercials.transformersbeastwarstoys,
      tdCommercials.transformers80s1,
    ];

    const result: BaseMedia[] = core.getMediaByTagGroupHeirarchy(
      alreadySelectedMedia,
      media,
      tags,
      eraTags,
      age,
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
    const tags: string[] = [
      MainGenres.SciFi,
      MainGenres.Action,
      MainGenres.Horror,
    ];
    const eraTags: string[] = [Eras.nnineties];
    const age: string = AgeGroups.Kids;
    const duration: number = 500;

    const expectedMedia: BaseMedia[] = [
      tdCommercials.alienstoys1,
      tdCommercials.meninblacktoys97,
      tdCommercials.transformersbeastwarstoys,
      tdCommercials.transformers80s1,
      tdCommercials.jurassicparktoys1,
      tdCommercials.superduperdoublelooper,
      tdCommercials.jurassicparktoys2,
      tdCommercials.jurassicparktoys3,
      tdCommercials.pizzahutxmen,
      tdCommercials.jurassicpark3toys,
    ];
    const result: BaseMedia[] = core.getMediaByTagGroupHeirarchy(
      alreadySelectedMedia,
      media,
      tags,
      eraTags,
      age,
      duration,
    );
    expect(result).toEqual(expectedMedia);
  });
});
