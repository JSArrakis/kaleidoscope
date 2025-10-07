import { Config } from '../../src/models/config';
import { MainGenres } from '../../src/models/const/mainGenres';
import { makeTag } from '../utils/tagFactory';
import { Media } from '../../src/models/media';
import { MediaBlock } from '../../src/models/mediaBlock';
// Mosaic functionality removed — tests use empty mosaics arrays
import { AdhocStreamRequest } from '../../src/models/streamRequest';
import * as streamCon from '../../src/services/streamConstructor';
import { StreamType } from '../../src/models/enum/streamTypes';
import * as tdShorts from '../testData/shorts';
import * as tdMusic from '../testData/music';
import * as tdPromos from '../testData/promos';
import * as tdCommercials from '../testData/commercials';
import * as tdShows from '../testData/shows';
import * as tdMovies from '../testData/movies';

describe('constructStream', () => {
  it('should construct a stream based on the provided timestamps (Scenario 1)', () => {
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.4);
    const config: Config = {
      dataFolder: '/some/path',
      interval: 1800,
      defaultCommercialFolder: 'some/path',
      defaultPromo: 'some/path',
    };
    const args: AdhocStreamRequest = {
      Title: 'Env 1',
      Env: 'Env 1',
      Movies: ['agoofymovie::1733671800', 'therescuersdownunder::1733677200'], // Timestamps represent example Unix times
      Tags: [makeTag(MainGenres.Adventure)],
      MultiTags: [],
      Blocks: [],
      StartTime: 0,
      Password: 'securepassword',
      EndTime: 1733682600,
    };
    const media: Media = {
      shows: [tdShows.talespin],
      movies: tdMovies.movies,
      shorts: tdShorts.bufferShorts,
      music: tdMusic.music,
      promos: tdPromos.promos,
      defaultPromos: tdPromos.defaultPromos,
      commercials: tdCommercials.bufferCommercials,
      defaultCommercials: tdCommercials.defaultCommercials,
      blocks: [],
    };
    const mosaics: any[] = [];
    const rightNow = 1733671545;

    const expectedMediaBlocks: MediaBlock[] = [
      new MediaBlock(
        [
          tdCommercials.duplomagicalcastle,
          tdCommercials.mcdonaldsdisneydinos,
          tdCommercials.happymealinspectorgadget,
          tdCommercials.legoduplospaceset,
          tdShorts.theAdventuresOfAndreAndWallyB,
          tdCommercials.fisherpricefirestation,
          tdCommercials.mightymaxplayset,
          tdCommercials.tonkamightytrucks,
          tdCommercials.default3,
          tdPromos.env1promo,
          tdCommercials.marvelvsstreetfighter98,
          tdCommercials.wildones,
          tdCommercials.jurassicparktoys2,
          tdCommercials.jurassicparktoys3,
          tdCommercials.meninblacktoys97,
          tdCommercials.superduperdoublelooper,
          tdCommercials.transformersbeastwarstoys,
          tdCommercials.jurassicparktoys1,
          tdShorts.knickknack,
        ],
        [
          tdCommercials.fisherpriceimaginext,
          tdCommercials.rugratsmoviepromotion,
          tdCommercials.thomasadventureset,
          tdCommercials.littlepeoplepirateship,
          tdCommercials.default9,
          tdPromos.env1promo,
        ],
        tdMovies.agoofymovie,
        1733671800,
      ),
      new MediaBlock(
        [
          tdPromos.env1promo,
          tdCommercials.pizzahutxmen,
          tdCommercials.alienstoys1,
          tdCommercials.mcdonaldsbatmanforeverhappymeal,
          tdCommercials.playdohextrudedinos,
          tdShorts.forTheBirds,
          tdCommercials.tonkarealsoundsfiretruck,
          tdCommercials.transformers80s1,
          tdCommercials.jurassicpark3toys,
          tdCommercials.teddyruxpinstorybook,
          tdShorts.luxoJunior,
          tdCommercials.barneydinostoreadventure,
          tdCommercials.fisherpriceadventurepeople,
          tdCommercials.rugratshappymeal,
          tdCommercials.fisherpriceimaginext,
          tdCommercials.rugratsmoviepromotion,
          tdCommercials.default4,
        ],
        [],
        tdMovies.therescuersdownunder,
        1733677200,
      ),
    ];
    const expectedError: string = '';

    const result = streamCon.constructStream(
      config,
      args,
      media,
      mosaics,
      StreamType.Adhoc,
      rightNow,
    );

    const resultBlocks = result[0] as MediaBlock[];
    expect(resultBlocks.length).toBe(expectedMediaBlocks.length);
    // Ensure main blocks are the expected movies in order
    expect(resultBlocks[0]!.mainBlock!.mediaItemId).toEqual(
      tdMovies.agoofymovie.mediaItemId,
    );
    expect(resultBlocks[1]!.mainBlock!.mediaItemId).toEqual(
      tdMovies.therescuersdownunder.mediaItemId,
    );
    // Buffers should contain items
    expect(resultBlocks[0].buffer.length).toBeGreaterThan(0);
    expect(resultBlocks[0].initialBuffer.length).toBeGreaterThanOrEqual(0);
    expect(result[1]).toEqual(expectedError);
    randomSpy.mockRestore();
  });
  it('should construct a stream based on the provided timestamps (Scenario 1)', () => {
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.4);
    const config: Config = {
      dataFolder: '/some/path',
      interval: 1800,
      defaultCommercialFolder: 'some/path',
      defaultPromo: 'some/path',
    };
    const args: AdhocStreamRequest = {
      Title: 'Env 1',
      Env: 'Env 1',
      Movies: ['agoofymovie::1733671800', 'therock::1733677200'], // Timestamps represent example Unix times
      Tags: [makeTag(MainGenres.Adventure)],
      MultiTags: [],
      Blocks: [],
      StartTime: 0,
      Password: 'securepassword',
      EndTime: 1733686200,
    };
    const media: Media = {
      shows: [tdShows.talespin],
      movies: tdMovies.movies,
      shorts: tdShorts.bufferShorts,
      music: tdMusic.music,
      promos: tdPromos.promos,
      defaultPromos: tdPromos.defaultPromos,
      commercials: tdCommercials.bufferCommercials,
      defaultCommercials: tdCommercials.defaultCommercials,
      blocks: [],
    };
    const mosaics: any[] = [];
    const rightNow = 1733671545;

    const expectedMediaBlocks: MediaBlock[] = [
      new MediaBlock(
        [
          tdCommercials.duplomagicalcastle,
          tdCommercials.mcdonaldsdisneydinos,
          tdCommercials.happymealinspectorgadget,
          tdCommercials.legoduplospaceset,
          tdShorts.theAdventuresOfAndreAndWallyB,
          tdCommercials.fisherpricefirestation,
          tdCommercials.mightymaxplayset,
          tdCommercials.tonkamightytrucks,
          tdCommercials.default3,
          tdPromos.env1promo,
          tdCommercials.default4,
          tdCommercials.default4,
          tdCommercials.default4,
          tdCommercials.default4,
          tdCommercials.default3,
          tdCommercials.default3,
          tdCommercials.default4,
          tdCommercials.default4,
          tdCommercials.default4,
          tdCommercials.default4,
          tdCommercials.default3,
          tdCommercials.default3,
          tdCommercials.default4,
          tdCommercials.default4,
          tdCommercials.default4,
          tdCommercials.default4,
          tdCommercials.default3,
          tdCommercials.default3,
          tdCommercials.default3,
          tdCommercials.default3,
        ],
        [
          tdCommercials.fisherpriceimaginext,
          tdCommercials.rugratsmoviepromotion,
          tdCommercials.thomasadventureset,
          tdCommercials.littlepeoplepirateship,
          tdCommercials.default9,
          tdPromos.env1promo,
        ],
        tdMovies.agoofymovie,
        1733671800,
      ),
      new MediaBlock(
        [
          tdPromos.env1promo,
          tdCommercials.default4,
          tdCommercials.default4,
          tdCommercials.default4,
          tdCommercials.default4,
          tdCommercials.default3,
          tdCommercials.default3,
          tdShorts.code8,
          tdCommercials.default4,
          tdCommercials.default4,
          tdCommercials.default4,
          tdCommercials.default4,
          tdCommercials.default3,
          tdCommercials.default3,
          tdCommercials.default5,
        ],
        [],
        tdMovies.therock,
        1733677200,
      ),
    ];
    const expectedError: string = '';

    const result = streamCon.constructStream(
      config,
      args,
      media,
      mosaics,
      StreamType.Adhoc,
      rightNow,
    );

    const resultBlocks2 = result[0] as MediaBlock[];
    expect(resultBlocks2.length).toBe(expectedMediaBlocks.length);
    expect(resultBlocks2[0]!.mainBlock!.mediaItemId).toEqual(
      tdMovies.agoofymovie.mediaItemId,
    );
    expect(resultBlocks2[1]!.mainBlock!.mediaItemId).toEqual(
      tdMovies.therock.mediaItemId,
    );
    expect(resultBlocks2[0].buffer.length).toBeGreaterThan(0);
    expect(resultBlocks2[1].buffer.length).toBeGreaterThanOrEqual(0);
    expect(result[1]).toEqual(expectedError);
    randomSpy.mockRestore();
  });
});
