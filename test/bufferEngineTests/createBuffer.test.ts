import { Commercial } from '../../src/models/commercial';
import { Media } from '../../src/models/media';
import { Mosaic } from '../../src/models/mosaic';
import { Music } from '../../src/models/music';
import { Promo } from '../../src/models/promo';
import { Short } from '../../src/models/short';
import { IStreamRequest } from '../../src/models/streamRequest';
import { createBuffer } from '../../src/services/bufferEngine';
import * as tdShorts from '../testData/shorts';
import * as tdMusic from '../testData/music';
import * as tdPromos from '../testData/promos';
import * as tdCommercials from '../testData/commercials';
import * as tdMosaics from '../testData/mosaics';
import { MainGenres } from '../../src/models/const/mainGenres';
import { AgeGroups } from '../../src/models/const/ageGroups';

describe('createBuffer', () => {
  it('should return the correct buffer for selected tags (Smoke Test)', () => {
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.99);
    const duration: number = 0;
    const args: IStreamRequest = {
      Title: '',
      Env: '',
      Movies: [],
      Tags: [],
      MultiTags: [],
      Blocks: [],
      StartTime: 0,
      Password: '',
    };
    const media: Media = {
      shows: [],
      movies: [],
      shorts: [],
      music: [],
      promos: [],
      defaultPromos: [],
      commercials: [],
      defaultCommercials: [],
      blocks: [],
    };
    const mosaics: Mosaic[] = [];
    const halfATags: string[] = [];
    const halfBTags: string[] = [];
    const prevBuff: Media = {
      shows: [],
      movies: [],
      shorts: [],
      music: [],
      promos: [],
      defaultPromos: [],
      commercials: [],
      defaultCommercials: [],
      blocks: [],
    };
    const holidays: string[] = [];

    const expectedBuffer: (Promo | Music | Short | Commercial)[] = [];
    const expectedRemainingDuration: number = 0;
    const expectedNewPrevBuff: Media = {
      shows: [],
      movies: [],
      shorts: [],
      music: [],
      promos: [],
      defaultPromos: [],
      commercials: [],
      defaultCommercials: [],
      blocks: [],
    };

    const result = createBuffer(
      duration,
      args,
      media,
      mosaics,
      halfATags,
      halfBTags,
      prevBuff,
      holidays,
    );

    expect(result.buffer).toEqual(expectedBuffer);
    expect(result.remainingDuration).toEqual(expectedRemainingDuration);
    expect(result.newPrevBuffer).toEqual(expectedNewPrevBuff);
    randomSpy.mockRestore();
  });
  it('should return the correct buffer for selected tags (Scenario 1)', () => {
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.99);
    const duration: number = 0;
    const args: IStreamRequest = {
      Title: 'Default',
      Env: 'Default',
      Movies: [],
      Tags: [],
      MultiTags: [],
      Blocks: [],
      StartTime: 0,
      Password: '',
    };
    const media: Media = {
      shows: [],
      movies: [],
      shorts: tdShorts.shorts,
      music: tdMusic.music,
      promos: tdPromos.promos,
      defaultPromos: tdPromos.defaultPromos,
      commercials: tdCommercials.commercials,
      defaultCommercials: tdCommercials.defaultCommercials,
      blocks: [],
    };
    const mosaics: Mosaic[] = tdMosaics.mosaics;
    const halfATags: string[] = [MainGenres.Action, AgeGroups.Kids];
    const halfBTags: string[] = [MainGenres.Action, AgeGroups.Kids];
    const prevBuff: Media = {
      shows: [],
      movies: [],
      shorts: [],
      music: [],
      promos: [],
      defaultPromos: [],
      commercials: [],
      defaultCommercials: [],
      blocks: [],
    };
    const holidays: string[] = [];

    const expectedBuffer: (Promo | Music | Short | Commercial)[] = [
      tdPromos.defaultPromo,
    ];
    const expectedRemainingDuration: number = -15;
    const expectedNewPrevBuff: Media = {
      shows: [],
      movies: [],
      shorts: [],
      music: [],
      promos: [],
      defaultPromos: [],
      commercials: [],
      defaultCommercials: [],
      blocks: [],
    };

    const result = createBuffer(
      duration,
      args,
      media,
      mosaics,
      halfATags,
      halfBTags,
      prevBuff,
      holidays,
    );

    expect(result.buffer).toEqual(expectedBuffer);
    expect(result.remainingDuration).toEqual(expectedRemainingDuration);
    expect(result.newPrevBuffer).toEqual(expectedNewPrevBuff);
    randomSpy.mockRestore();
  });
  it('should return the correct buffer for selected tags (Scenario 2)', () => {
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.99);
    const duration: number = 255;
    const args: IStreamRequest = {
      Title: 'Env 1',
      Env: 'Env 1',
      Movies: [],
      Tags: [],
      MultiTags: [],
      Blocks: [],
      StartTime: 0,
      Password: '',
    };
    const media: Media = {
      shows: [],
      movies: [],
      shorts: [],
      music: [],
      promos: [],
      defaultPromos: tdPromos.defaultPromos,
      commercials: [],
      defaultCommercials: tdCommercials.defaultCommercials,
      blocks: [],
    };
    const mosaics: Mosaic[] = tdMosaics.mosaics;
    const halfATags: string[] = [MainGenres.Action, AgeGroups.Kids];
    const halfBTags: string[] = [MainGenres.Action, AgeGroups.Kids];
    const prevBuff: Media = {
      shows: [],
      movies: [],
      shorts: [],
      music: [],
      promos: [],
      defaultPromos: [],
      commercials: [],
      defaultCommercials: [],
      blocks: [],
    };
    const holidays: string[] = [];

    const expectedBuffer: (Promo | Music | Short | Commercial)[] = [
      tdCommercials.default9,
      tdPromos.defaultPromo,
      tdCommercials.default9,
    ];
    const expectedRemainingDuration: number = 0;
    const expectedNewPrevBuff: Media = {
      shows: [],
      movies: [],
      shorts: [],
      music: [],
      promos: [],
      defaultPromos: [],
      commercials: [tdCommercials.default9, tdCommercials.default9],
      defaultCommercials: [],
      blocks: [],
    };

    const result = createBuffer(
      duration,
      args,
      media,
      mosaics,
      halfATags,
      halfBTags,
      prevBuff,
      holidays,
    );

    expect(result.buffer).toEqual(expectedBuffer);
    expect(result.remainingDuration).toEqual(expectedRemainingDuration);
    expect(result.newPrevBuffer).toEqual(expectedNewPrevBuff);
    randomSpy.mockRestore();
  });
  it('should return the correct buffer for selected tags (Scenario 3)', () => {
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.99);
    const duration: number = 255;
    const args: IStreamRequest = {
      Title: 'Env 1',
      Env: 'Env 1',
      Movies: [],
      Tags: [],
      MultiTags: [],
      Blocks: [],
      StartTime: 0,
      Password: '',
    };
    const media: Media = {
      shows: [],
      movies: [],
      shorts: tdShorts.shorts,
      music: tdMusic.music,
      promos: tdPromos.promos,
      defaultPromos: tdPromos.defaultPromos,
      commercials: tdCommercials.bufferCommercials,
      defaultCommercials: tdCommercials.defaultCommercials,
      blocks: [],
    };
    const mosaics: Mosaic[] = tdMosaics.mosaics;
    const halfATags: string[] = [MainGenres.Action, AgeGroups.Kids];
    const halfBTags: string[] = [MainGenres.Action, AgeGroups.Kids];
    const prevBuff: Media = {
      shows: [],
      movies: [],
      shorts: [],
      music: [],
      promos: [],
      defaultPromos: [],
      commercials: [],
      defaultCommercials: [],
      blocks: [],
    };
    const holidays: string[] = [];

    const expectedBuffer: (Promo | Music | Short | Commercial)[] = [
      tdCommercials.transformers80s1,
      tdCommercials.alienstoys1,
      tdCommercials.jurassicpark3toys,
      tdCommercials.tonkamightytrucks,
      tdPromos.env1promo,
      tdCommercials.mcdonaldsbatmanforeverhappymeal,
      tdCommercials.playdohextrudedinos,
      tdCommercials.tonkarealsoundsfiretruck,
      tdCommercials.nerfblastershowdown,
    ];
    const expectedRemainingDuration: number = 0;
    const expectedNewPrevBuff: Media = {
      shows: [],
      movies: [],
      shorts: [],
      music: [],
      promos: [],
      defaultPromos: [],
      commercials: [
        tdCommercials.transformers80s1,
        tdCommercials.alienstoys1,
        tdCommercials.jurassicpark3toys,
        tdCommercials.tonkamightytrucks,
        tdCommercials.mcdonaldsbatmanforeverhappymeal,
        tdCommercials.playdohextrudedinos,
        tdCommercials.tonkarealsoundsfiretruck,
        tdCommercials.nerfblastershowdown,
      ],
      defaultCommercials: [],
      blocks: [],
    };

    const result = createBuffer(
      duration,
      args,
      media,
      mosaics,
      halfATags,
      halfBTags,
      prevBuff,
      holidays,
    );

    expect(result.buffer).toEqual(expectedBuffer);
    expect(result.remainingDuration).toEqual(expectedRemainingDuration);
    expect(result.newPrevBuffer).toEqual(expectedNewPrevBuff);
    randomSpy.mockRestore();
  });
  it('should return the correct buffer for selected tags (Scenario 4)', () => {
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.4);
    const duration: number = 857;
    const args: IStreamRequest = {
      Title: 'Env 1',
      Env: 'Env 1',
      Movies: [],
      Tags: [],
      MultiTags: [],
      Blocks: [],
      StartTime: 0,
      Password: '',
    };
    const media: Media = {
      shows: [],
      movies: [],
      shorts: tdShorts.bufferShorts,
      music: tdMusic.music,
      promos: tdPromos.promos,
      defaultPromos: tdPromos.defaultPromos,
      commercials: tdCommercials.bufferCommercials,
      defaultCommercials: tdCommercials.defaultCommercials,
      blocks: [],
    };
    const mosaics: Mosaic[] = tdMosaics.mosaics;
    const halfATags: string[] = [MainGenres.Adventure, AgeGroups.Kids];
    const halfBTags: string[] = [MainGenres.Adventure, AgeGroups.Kids];
    const prevBuff: Media = {
      shows: [],
      movies: [],
      shorts: [],
      music: [],
      promos: [],
      defaultPromos: [],
      commercials: [],
      defaultCommercials: [],
      blocks: [],
    };
    const holidays: string[] = [];

    const expectedBuffer: (Promo | Music | Short | Commercial)[] = [
      tdCommercials.fisherpriceimaginext,
      tdCommercials.rugratsmoviepromotion,
      tdCommercials.thomasadventureset,
      tdCommercials.littlepeoplepirateship,
      tdShorts.presto,
      tdPromos.env1promo,
      tdCommercials.duplomagicalcastle,
      tdCommercials.mcdonaldsdisneydinos,
      tdCommercials.happymealinspectorgadget,
      tdCommercials.legoduplospaceset,
      tdShorts.gopherBroke,
    ];
    const expectedRemainingDuration: number = 2;
    const expectedNewPrevBuff: Media = {
      shows: [],
      movies: [],
      shorts: [tdShorts.presto, tdShorts.gopherBroke],
      music: [],
      promos: [],
      defaultPromos: [],
      commercials: [
        tdCommercials.fisherpriceimaginext,
        tdCommercials.rugratsmoviepromotion,
        tdCommercials.thomasadventureset,
        tdCommercials.littlepeoplepirateship,
        tdCommercials.duplomagicalcastle,
        tdCommercials.mcdonaldsdisneydinos,
        tdCommercials.happymealinspectorgadget,
        tdCommercials.legoduplospaceset,
      ],
      defaultCommercials: [],
      blocks: [],
    };

    const result = createBuffer(
      duration,
      args,
      media,
      mosaics,
      halfATags,
      halfBTags,
      prevBuff,
      holidays,
    );

    expect(result.buffer).toEqual(expectedBuffer);
    expect(result.remainingDuration).toEqual(expectedRemainingDuration);
    expect(result.newPrevBuffer).toEqual(expectedNewPrevBuff);
    randomSpy.mockRestore();
  });
  it('should return the correct buffer for selected tags (Scenario 5)', () => {
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.4);
    const duration: number = 857;
    const args: IStreamRequest = {
      Title: 'Env 1',
      Env: 'Env 1',
      Movies: [],
      Tags: [],
      MultiTags: [],
      Blocks: [],
      StartTime: 0,
      Password: '',
    };
    const media: Media = {
      shows: [],
      movies: [],
      shorts: tdShorts.bufferShorts,
      music: tdMusic.music,
      promos: tdPromos.promos,
      defaultPromos: tdPromos.defaultPromos,
      commercials: tdCommercials.bufferCommercials,
      defaultCommercials: tdCommercials.defaultCommercials,
      blocks: [],
    };
    const mosaics: Mosaic[] = tdMosaics.mosaics;
    const halfATags: string[] = [];
    const halfBTags: string[] = [MainGenres.Adventure, AgeGroups.Kids];
    const prevBuff: Media = {
      shows: [],
      movies: [],
      shorts: [],
      music: [],
      promos: [],
      defaultPromos: [],
      commercials: [],
      defaultCommercials: [],
      blocks: [],
    };
    const holidays: string[] = [];

    const expectedBuffer: (Promo | Music | Short | Commercial)[] = [
      tdCommercials.fisherpriceimaginext,
      tdCommercials.rugratsmoviepromotion,
      tdCommercials.thomasadventureset,
      tdCommercials.littlepeoplepirateship,
      tdShorts.presto,
      tdCommercials.duplomagicalcastle,
      tdCommercials.mcdonaldsdisneydinos,
      tdCommercials.happymealinspectorgadget,
      tdCommercials.legoduplospaceset,
      tdShorts.gopherBroke,
      tdPromos.env1promo,
    ];
    const expectedRemainingDuration: number = 2;
    const expectedNewPrevBuff: Media = {
      shows: [],
      movies: [],
      shorts: [tdShorts.presto, tdShorts.gopherBroke],
      music: [],
      promos: [],
      defaultPromos: [],
      commercials: [
        tdCommercials.fisherpriceimaginext,
        tdCommercials.rugratsmoviepromotion,
        tdCommercials.thomasadventureset,
        tdCommercials.littlepeoplepirateship,
        tdCommercials.duplomagicalcastle,
        tdCommercials.mcdonaldsdisneydinos,
        tdCommercials.happymealinspectorgadget,
        tdCommercials.legoduplospaceset,
      ],
      defaultCommercials: [],
      blocks: [],
    };

    const result = createBuffer(
      duration,
      args,
      media,
      mosaics,
      halfATags,
      halfBTags,
      prevBuff,
      holidays,
    );

    expect(result.buffer).toEqual(expectedBuffer);
    expect(result.remainingDuration).toEqual(expectedRemainingDuration);
    expect(result.newPrevBuffer).toEqual(expectedNewPrevBuff);
    randomSpy.mockRestore();
  });
  it('should return the correct buffer for selected tags (Scenario 6)', () => {
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.4);
    const duration: number = 857;
    const args: IStreamRequest = {
      Title: 'Env 1',
      Env: 'Env 1',
      Movies: [],
      Tags: [],
      MultiTags: [],
      Blocks: [],
      StartTime: 0,
      Password: '',
    };
    const media: Media = {
      shows: [],
      movies: [],
      shorts: tdShorts.bufferShorts,
      music: tdMusic.music,
      promos: tdPromos.promos,
      defaultPromos: tdPromos.defaultPromos,
      commercials: tdCommercials.bufferCommercials,
      defaultCommercials: tdCommercials.defaultCommercials,
      blocks: [],
    };
    const mosaics: Mosaic[] = tdMosaics.mosaics;
    const halfATags: string[] = [MainGenres.Adventure, AgeGroups.Kids];
    const halfBTags: string[] = [];
    const prevBuff: Media = {
      shows: [],
      movies: [],
      shorts: [],
      music: [],
      promos: [],
      defaultPromos: [],
      commercials: [],
      defaultCommercials: [],
      blocks: [],
    };
    const holidays: string[] = [];

    const expectedBuffer: (Promo | Music | Short | Commercial)[] = [
      tdPromos.env1promo,
      tdCommercials.fisherpriceimaginext,
      tdCommercials.rugratsmoviepromotion,
      tdCommercials.thomasadventureset,
      tdCommercials.littlepeoplepirateship,
      tdShorts.presto,
      tdCommercials.duplomagicalcastle,
      tdCommercials.mcdonaldsdisneydinos,
      tdCommercials.happymealinspectorgadget,
      tdCommercials.legoduplospaceset,
      tdShorts.gopherBroke,
    ];
    const expectedRemainingDuration: number = 2;
    const expectedNewPrevBuff: Media = {
      shows: [],
      movies: [],
      shorts: [tdShorts.presto, tdShorts.gopherBroke],
      music: [],
      promos: [],
      defaultPromos: [],
      commercials: [
        tdCommercials.fisherpriceimaginext,
        tdCommercials.rugratsmoviepromotion,
        tdCommercials.thomasadventureset,
        tdCommercials.littlepeoplepirateship,
        tdCommercials.duplomagicalcastle,
        tdCommercials.mcdonaldsdisneydinos,
        tdCommercials.happymealinspectorgadget,
        tdCommercials.legoduplospaceset,
      ],
      defaultCommercials: [],
      blocks: [],
    };

    const result = createBuffer(
      duration,
      args,
      media,
      mosaics,
      halfATags,
      halfBTags,
      prevBuff,
      holidays,
    );

    expect(result.buffer).toEqual(expectedBuffer);
    expect(result.remainingDuration).toEqual(expectedRemainingDuration);
    expect(result.newPrevBuffer).toEqual(expectedNewPrevBuff);
    randomSpy.mockRestore();
  });
});
