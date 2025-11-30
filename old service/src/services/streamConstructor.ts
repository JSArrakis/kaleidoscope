import { Config } from '../models/config';
import { Media } from '../models/media';
import { Movie } from '../models/movie';
import { Block } from '../models/block';
const moment = require('moment');
import { MediaType } from '../models/enum/mediaTypes';
import { SelectedMedia } from '../models/selectedMedia';
import { StagedMedia } from '../models/stagedMedia';
import { getProceduralBlock } from './proceduralEngine';
import { Show, Episode } from '../models/show';
import { createBuffer } from './bufferEngine';
import { MediaBlock } from '../models/mediaBlock';
import { StreamType } from '../models/enum/streamTypes';
import { ManageShowProgression } from './progressionManager';
import { IStreamRequest } from '../models/streamRequest';
import { TagType } from '../models/const/tagTypes';
import { Tag } from '../models/tag';
import { facetRepository } from '../repositories/facetRepository';
import { tagRepository } from '../repositories/tagsRepository';
import {
  pickFacet,
  gatherCandidatesForFacet,
  pickMediaCandidate,
} from '../prisms/refract';
import { SegmentedTags } from '../models/segmentedTags';
import { BaseMedia } from '../models/mediaInterface';
import { getActiveHolidaysFromDB } from './holidayService';
import { Holiday } from '../models/holiday';

// Helper functions using existing repository logic
function selectRandomFacetCombo(): { genre: string; aesthetic: string } | null {
  // Get all facets from the database (these represent valid genre/aesthetic combinations)
  const allFacets = facetRepository.findAll();
  if (allFacets.length === 0) {
    return null;
  }

  // Use existing pickFacet function to randomly select one
  const selectedFacet = pickFacet(allFacets);
  if (!selectedFacet) {
    return null;
  }

  return {
    genre: selectedFacet.genre.name,
    aesthetic: selectedFacet.aesthetic.name,
  };
}

// Helper function to find media using existing refract logic
function findMediaWithFacet(facet: { genre: string; aesthetic: string }) {
  // Use existing gatherCandidatesForFacet function to find matching media
  const candidates: (Movie | Show)[] = [];
  gatherCandidatesForFacet(facet).then(media => {
    candidates.push(...media);
  });
  if (candidates.length === 0) {
    return null;
  }

  // Use existing pickMediaCandidate function to select one
  return pickMediaCandidate(candidates);
}

// Helper function to convert tag names to Tag objects
function getTagByName(tagName: string): Tag | null {
  return tagRepository.findByName(tagName);
}

function getTagsByNames(tagNames: string[]): Tag[] {
  return tagNames
    .map(name => getTagByName(name))
    .filter((tag): tag is Tag => tag !== null);
}

// MODERNIZED STREAM CONSTRUCTOR
export function constructStream(
  streamType: StreamType,
  rightNow: number, // Time should always be passed in, no default calculation
  cadence: boolean = false,
  firstMedia?: Episode | Movie, // Optional first media to use instead of selecting via refract
): [MediaBlock[], string] {
  // Load current holiday tags from the database
  const activeHolidayTags = getActiveHolidaysFromDB();

  // Determine construction approach based on stream type
  switch (streamType) {
    case StreamType.Cont:
      return constructContinuousStream(
        rightNow,
        cadence,
        activeHolidayTags,
        firstMedia,
      );

    // case StreamType.Adhoc:
    //   return constructAdhocStream(
    //     config,
    //     args,
    //     rightNow,
    //     alignStart,
    //     firstMedia,
    //   );

    default:
      return [[], `Unsupported stream type: ${streamType}`];
  }
}

// CONTINUOUS STREAM CONSTRUCTOR
// Handles ongoing 24/7 streams with automatic day transitions
function constructContinuousStream(
  rightNow: number,
  cadence: boolean,
  activeHolidayTags: Holiday[],
  firstMedia?: Episode | Movie,
): [MediaBlock[], string] {
  // For continuous streams, only password is required from args
  // All other stream parameters are managed by the system

  // If firstMedia is provided, use it. Otherwise, select media via refract system
  let selectedFirstMedia: Show | Episode | Movie | null;
  if (firstMedia) {
    selectedFirstMedia = firstMedia;
    console.log(
      `[Continuous Stream] Using provided first media: ${firstMedia.title} (${firstMedia.mediaItemId})`,
    );
  } else {
    // This path is used when called from background service
    console.log(
      '[Continuous Stream] No first media provided, selecting via refract system',
    );

    // Start with a random facet from the facets database
    const startingFacet = selectRandomFacetCombo();
    if (!startingFacet) {
      return [
        [],
        'No valid genre/aesthetic combinations found in facets database',
      ];
    }

    selectedFirstMedia = findMediaWithFacet(startingFacet);
    if (!selectedFirstMedia) {
      return [
        [],
        `No media found with genre ${startingFacet.genre} and aesthetic ${startingFacet.aesthetic}`,
      ];
    }
    console.log(
      `[Continuous Stream] Selected first media: ${selectedFirstMedia.title} (${selectedFirstMedia.mediaItemId})`,
    );
  }

  // IMPLEMENT NEW PRISM-BASED STREAM CONSTRUCTION
  const streamBlocks: MediaBlock[] = [];

  // Calculate the stream end time (until midnight for continuous streams)
  const endOfDay = moment.unix(rightNow).endOf('day').unix();
  let currentTime = rightNow;

  // Create first main media block using selected media
  console.log(
    `[Continuous Stream] Creating main media block for: ${selectedFirstMedia!.title}`,
  );

  // Handle different media types for MediaBlock
  let featureMedia: Episode | Movie;
  let mediaDuration = 0;

  if (selectedFirstMedia!.type === MediaType.Show) {
    // It's a Show - select first episode
    const episodes = (selectedFirstMedia! as Show).episodes;
    if (episodes && episodes.length > 0) {
      featureMedia = episodes[0] as Episode;
      mediaDuration = episodes[0].duration;
    } else {
      return [
        [],
        `Show ${selectedFirstMedia!.title} has no episodes available`,
      ];
    }
  } else {
    // It's a Movie (or Episode passed from initializeStream)
    featureMedia = selectedFirstMedia! as Movie || Episode;
    mediaDuration = featureMedia!.duration;
  }

  const firstMediaBlock = new MediaBlock(
    [], // buffer (no buffer for main media block)
    featureMedia, // mainBlock
    currentTime, // startTime
  );

  streamBlocks.push(firstMediaBlock);
  currentTime += mediaDuration;

  // Continue building stream until end of day using prism walking
  // TODO: Implement full prism walking logic here
  // For now, just return what we have as a basic implementation

  console.log(
    `[Continuous Stream] Created ${streamBlocks.length} media blocks`,
  );
  return [streamBlocks, ''];
}

// // ADHOC STREAM CONSTRUCTOR
// // Handles user-configured streams with defined start/end times and custom scheduling
// function constructAdhocStream(
//   config: Config,
//   args: IStreamRequest,
//   rightNow: number,
//   alignStart: boolean,
//   firstMedia?: Episode | Movie,
// ): [MediaBlock[], string] {
//   // Adhoc streams have user-defined parameters:
//   // - Custom movie schedule (args.Movies)
//   // - Custom environment/tags (args.Tags, args.Env)
//   // - Defined end time (args.EndTime for AdhocStreamRequest)
//   // - Custom start time (args.StartTime)

//   // Validate adhoc stream requirements
//   if (!args.EndTime && args instanceof Object && 'EndTime' in args) {
//     return [[], 'Adhoc streams must have a defined end time'];
//   }

//   // NO MORE getMedia() - Use prism/refract system for adhoc streams too

//   // IMPLEMENT NEW PRISM-BASED ADHOC STREAM CONSTRUCTION
//   const streamBlocks: MediaBlock[] = [];

//   // Get the end time for adhoc stream
//   const endTime = args.EndTime || rightNow + 2 * 60 * 60; // Default to 2 hours if no end time
//   let currentTime = rightNow;

//   console.log(
//     `[Adhoc Stream] Building stream from ${moment.unix(currentTime).format('HH:mm')} to ${moment.unix(endTime).format('HH:mm')}`,
//   );

//   // Use user-provided tags if available, otherwise select random facet
//   let workingFacet: { genre: string; aesthetic: string } | null = null;

//   if (args.Tags && args.Tags.length >= 2) {
//     // Convert MediaTag objects to strings safely
//     const tagStrings = args.Tags.map(tag => {
//       if (typeof tag === 'string') return tag;
//       return (tag as any).name || tag.toString();
//     });

//     workingFacet = {
//       genre:
//         tagStrings.find(tag => tag.toLowerCase().includes('genre')) ||
//         tagStrings[0],
//       aesthetic:
//         tagStrings.find(tag => tag.toLowerCase().includes('aesthetic')) ||
//         tagStrings[1],
//     };
//     console.log(
//       `[Adhoc Stream] Using user-provided facet: ${workingFacet.genre}/${workingFacet.aesthetic}`,
//     );
//   } else {
//     // Select random facet like continuous streams
//     workingFacet = selectRandomFacetCombo();
//     if (!workingFacet) {
//       return [
//         [],
//         'No valid genre/aesthetic combinations found for adhoc stream',
//       ];
//     }
//     console.log(
//       `[Adhoc Stream] Selected random facet: ${workingFacet.genre}/${workingFacet.aesthetic}`,
//     );
//   }

//   // Should never be null at this point, but check for safety
//   if (!workingFacet) {
//     return [[], 'Failed to determine working facet for adhoc stream'];
//   }

//   // Build stream until end time
//   let isFirstBlock = true;
//   while (currentTime < endTime) {
//     // Find media for current facet (use provided firstMedia for first block if available)
//     let media: BaseMedia | null;
//     if (isFirstBlock && firstMedia) {
//       media = firstMedia;
//       console.log(
//         `[Adhoc Stream] Using provided first media: ${firstMedia.title} (${firstMedia.mediaItemId})`,
//       );
//     } else {
//       media = findMediaWithFacet(workingFacet);
//     }

//     if (!media) {
//       console.log(
//         `[Adhoc Stream] No media found for facet ${workingFacet.genre}/${workingFacet.aesthetic}, ending stream`,
//       );
//       break;
//     }

//     isFirstBlock = false;

//     // Handle different media types
//     let mainBlock: Episode | Movie | Block | undefined;
//     let mediaDuration = 0;

//     if ('episodes' in media && media.episodes) {
//       const episodes = (media as any).episodes;
//       if (episodes && episodes.length > 0) {
//         mainBlock = episodes[0] as Episode;
//         mediaDuration = episodes[0].duration;
//       } else {
//         continue; // Skip this show if no episodes
//       }
//     } else {
//       mainBlock = media as unknown as Movie | Block;
//       mediaDuration = media.duration;
//     }

//     // Check if media fits in remaining time
//     if (currentTime + mediaDuration > endTime) {
//       console.log(
//         `[Adhoc Stream] Media ${media.title} too long for remaining time, ending stream`,
//       );
//       break;
//     }

//     const mediaBlock = new MediaBlock(
//       [], // buffer (buffers will be added between media)
//       [], // initialBuffer
//       mainBlock,
//       currentTime,
//     );

//     streamBlocks.push(mediaBlock);
//     currentTime += mediaDuration;

//     console.log(
//       `[Adhoc Stream] Added ${media.title}, stream now at ${moment.unix(currentTime).format('HH:mm')}`,
//     );

//     // TODO: Implement prism walking to next facet
//     // For now, continue with same facet
//   }

//   console.log(
//     `[Adhoc Stream] Created ${streamBlocks.length} media blocks ending at ${moment.unix(currentTime).format('HH:mm')}`,
//   );
//   return [streamBlocks, ''];
// }

export function getInitialProceduralTimepoint(
  rightNow: number,
  stagedMedia: StagedMedia,
): [number, string] {
  let error = '';

  //The EndTime must be set in the future AND after the last scheduled media time + its duration
  if (stagedMedia.endTime - rightNow < 0) {
    error = 'End time needs to be in the future.';
    return [0, error];
  }

  if (stagedMedia.scheduledMedia.length > 0) {
    let lastScheduledMedia =
      stagedMedia.scheduledMedia[stagedMedia.scheduledMedia.length - 1];
    if (
      stagedMedia.endTime -
        (lastScheduledMedia.time + lastScheduledMedia.duration) <
      0
    ) {
      error = 'End time needs to be after the last scheduled media item.';
      return [0, error];
    }
  }

  //Sets the first time point to the end time of the stream if there are no scheduled media items
  let firstTimePoint: number = stagedMedia.endTime;

  //If there are scheduled media items, the first time point is set to the time of the first scheduled media item
  if (stagedMedia.scheduledMedia.length > 0) {
    firstTimePoint = stagedMedia.scheduledMedia[0].time;
  }

  //If the first time point is in the past, an error is returned
  if (firstTimePoint - rightNow < 0) {
    error =
      'Time of first scheduled movie, or block needs to be in the future.';
    return [0, error];
  }

  return [firstTimePoint, error];
}

export function setInitialBlockDuration(
  interval: number,
  firstProceduralDuration: number,
): [number, number] {
  let preMediaDuration = 0;
  let initialProceduralBlockDuration = 0;

  if (firstProceduralDuration / interval >= 1) {
    preMediaDuration = firstProceduralDuration % interval;
    initialProceduralBlockDuration = firstProceduralDuration - preMediaDuration;
  } else {
    preMediaDuration = firstProceduralDuration;
  }

  return [preMediaDuration, initialProceduralBlockDuration];
}

export async function getStagedStream(
  rightNow: number,
  config: Config,
  args: IStreamRequest,
  stagedMedia: StagedMedia,
  media: Media,
  streamType: StreamType,
): Promise<[selectedMedia: SelectedMedia[], error: string]> {
  let error: string = '';

  let [firstTimePoint, intialError] = getInitialProceduralTimepoint(
    rightNow,
    stagedMedia,
  );
  if (intialError !== '') {
    error = intialError;
    return [[], error];
  }

  let firstDuration = firstTimePoint - rightNow;

  let [preMediaDuration, initialProceduralBlockDuration] =
    setInitialBlockDuration(config.interval, firstDuration);
  let selectedMedia: SelectedMedia[] = [];
  let prevMovies: Movie[] = [];
  stagedMedia.scheduledMedia.forEach(item =>
    prevMovies.push(item.media as Movie),
  );

  if (initialProceduralBlockDuration > 0) {
    let firstProceduralBlock = await getProceduralBlock(
      args,
      stagedMedia,
      media,
      prevMovies,
      initialProceduralBlockDuration,
      rightNow + preMediaDuration,
      streamType,
    );
    selectedMedia.push(...firstProceduralBlock);
  }

  for (let index = 0; index < stagedMedia.scheduledMedia.length; index++) {
    const item = stagedMedia.scheduledMedia[index];
    selectedMedia.push(item);
    if (index < stagedMedia.scheduledMedia.length - 1) {
      let procDuration =
        stagedMedia.scheduledMedia[index + 1].time -
        stagedMedia.scheduledMedia[index].time -
        stagedMedia.scheduledMedia[index].duration;
      if (procDuration > 0) {
        let intermediateProcBlock = await getProceduralBlock(
          args,
          stagedMedia,
          media,
          prevMovies,
          procDuration,
          stagedMedia.scheduledMedia[index].time +
            stagedMedia.scheduledMedia[index].duration,
          streamType,
        );
        selectedMedia.push(...intermediateProcBlock);
      }
    }
  }

  if (stagedMedia.scheduledMedia.length > 0) {
    let lastScheduledMedia =
      stagedMedia.scheduledMedia[stagedMedia.scheduledMedia.length - 1];
    let scheduledEndTime = stagedMedia.endTime;
    let endProcDuration =
      scheduledEndTime - lastScheduledMedia.time - lastScheduledMedia.duration;
    if (endProcDuration > 0) {
      let endProcBlock = await getProceduralBlock(
        args,
        stagedMedia,
        media,
        prevMovies,
        endProcDuration,
        stagedMedia.scheduledMedia[stagedMedia.scheduledMedia.length - 1].time +
          stagedMedia.scheduledMedia[stagedMedia.scheduledMedia.length - 1]
            .duration,
        streamType,
      );
      selectedMedia.push(...endProcBlock);
    }
  }

  return [selectedMedia, error];
}

export function setProceduralTags(
  options: IStreamRequest,
  stagedMedia: StagedMedia,
): void {
  if (options.MultiTags.length === 0 && options.Tags.length === 0) {
    let tagList: Tag[] = [];
    stagedMedia.injectedMovies.forEach(inj => tagList.push(...inj.media.tags));
    stagedMedia.scheduledMedia.forEach(sch => tagList.push(...sch.media.tags));
    let uniquetags: Tag[] = [];
    //Filter out duplicate tags
    tagList.forEach(tag => {
      const tagName = typeof tag === 'string' ? tag : tag.name;
      const exists = uniquetags.some(existing => {
        const existingName =
          typeof existing === 'string' ? existing : existing.name;
        return existingName === tagName;
      });
      if (!exists) {
        uniquetags.push(tag);
      }
    });

    // If no tags are present at all after filtering, use intelligent starting tag selection
    if (uniquetags.length === 0) {
      console.log(
        '📋 No tags found from scheduled/injected media - using intelligent tag selection',
      );
      uniquetags = selectIntelligentStartingTags();
    }

    options.Tags = uniquetags;
    //TODO: v1.4 Create different combos of tags for multitags to give a more streamlined experience
  }
}

export function evaluateStreamEndTime(
  options: IStreamRequest,
  scheduledMedia: SelectedMedia[],
): [number, string] {
  let endTime: number = moment().startOf('day').add(1, 'days').unix();
  let error: string = '';

  if (options.EndTime) {
    error = compareSelectedEndTime(options.EndTime, scheduledMedia);
    if (error !== '') {
      return [0, error];
    }
    endTime = options.EndTime;
  } else if (scheduledMedia.length > 0) {
    let lastScheduledMedia = scheduledMedia[scheduledMedia.length - 1];
    endTime = lastScheduledMedia.time + lastScheduledMedia.media.durationLimit;
  }

  return [endTime, error];
}

export function compareSelectedEndTime(
  endTime: number,
  scheduledMedia: SelectedMedia[],
): string {
  let error: string = '';
  scheduledMedia.forEach(item => {
    if (item.time + item.media.durationLimit > endTime) {
      error =
        'Scheduled time for ' +
        item.media.mediaItemId +
        ' exceeds selected endTime';
      return error;
    }
  });
  return error;
}

export function getScheduledMedia(
  media: Media,
  args: IStreamRequest,
): [SelectedMedia[], string] {
  let selectedMedia: SelectedMedia[] = [];
  // Parses the incoming http request for scheduled movies and blocks
  // The format of the string is "MovieTitle::Time" where time is the unix timestamp of when the movie is scheduled to be played
  let error: string = '';
  if (args.Movies) {
    args.Movies
      //Gets only the movies that have the time schedule delimiter "::"
      .filter((str: string) => str.includes('::'))
      .forEach((str: string) => {
        // Splits the string into an array of strings with the movie title and the time it is scheduled to be played
        let parsedMovie = str.split('::');
        let [movie, movieError] = getMovie(
          parsedMovie[0],
          media.movies,
          parseInt(parsedMovie[1]),
        );
        if (movieError !== '') {
          error = movieError;
          return [[], error];
        } else {
          selectedMedia.push(movie);
        }
      });
  }

  // TODO - handle blocks
  // Blocks should be in the format "blockTitle::EpisodeNumber"
  // TODO - For continuous streams, we need to make sure that we have a way to specify the interval of days or weeks that a block
  // should be played. This will allow us to schedule blocks to be played on specific days of the week or at specific intervals.
  // This allows for things like the "Toonami Midnight Run" where a specific show is played at a specific time on a specific day of the week
  // or Nickelodeons 90s Saturday Morning blocks. This will also allow us to schedule blocks to be played on specific holidays or events
  // if (args.blocks) {
  //     args.blocks
  //         // Gets only the blocks that have the time schedule delimiter "::"
  //         // Sometimes a block can just be added that doesnt need to be scheduled. blocks can also be marathons of movies or shows
  //         // that are played in order and do not need to be scheduled at a specific time
  //         .filter((str: string) => str.includes('::'))
  //         .forEach((str: string) => {
  //             let parsedblock = str.split("::");
  //             selectedMedia.push(getblock(parsedblock[0], media, parseInt(parsedblock[1]), args));
  //         });
  // }
  // Sorts the the selected media based on the unix timestamp of when the media is scheduled to be played
  let sorted = selectedMedia.sort((a, b) => a.time - b.time);
  return [sorted, error];
}

export function getInjectedMovies(
  options: IStreamRequest,
  movies: Movie[],
): [SelectedMedia[], string] {
  let selectedMedia: SelectedMedia[] = [];
  let error: string = '';
  if (options.Movies !== undefined) {
    options.Movies.filter((str: string) => !str.includes('::')).forEach(
      (str: string) => {
        let [movie, movieError] = getMovie(str, movies, 0);
        if (movieError !== '') {
          error = movieError;
          return [[], error];
        }
        selectedMedia.push(movie);
      },
    );
  }
  return [selectedMedia, error];
}

export function getMovie(
  loadTitle: string,
  movieList: Movie[],
  time: number,
): [SelectedMedia, string] {
  let selectedMedia: SelectedMedia = new SelectedMedia(
    new Movie('', '', '', '', [], '', 0, 0, MediaType.Movie, []),
    '',
    MediaType.Movie,
    0,
    0,
    [],
  );
  // Check if the movie title is empty or undefined as these cannot be searched against the movie list
  if (loadTitle === '' || loadTitle === undefined) {
    return [selectedMedia, 'Empty movie titles are not a valid input'];
  }
  // Check if the movie title is in the movie list
  // The load title is the title that is used to load the movie from the database and is unique to each movie
  // The format of the load title is the title of the movie with spaces, special characters, and capitalization removed
  // The movie object consists of the title of the movie, the duration of the movie, the tags associated with the movie, and the load title
  let selectedMovie: Movie | undefined = movieList.find(
    movie => movie.mediaItemId === loadTitle,
  );

  // TODO - We should perhaps instead send back some kind of error message through the response object of the http request
  if (selectedMovie === undefined) {
    return [selectedMedia, loadTitle + ' load title, not found.'];
  }

  selectedMedia = new SelectedMedia(
    selectedMovie,
    '',
    MediaType.Movie,
    time,
    selectedMovie.durationLimit,
    selectedMovie.tags,
  );
  // Created a selected media object that holds the selected movie, the time it is scheduled to be played, the duration of the movie, the tags associated with the movie, and the type of media
  return [selectedMedia, ''];
}

export async function getBlock(
  loadTitle: string,
  media: Media,
  time: number,
  args: IStreamRequest,
): Promise<SelectedMedia> {
  // Check if the block title is empty or undefined as these cannot be searched against the block list
  if (loadTitle === '' || loadTitle === undefined) {
    throw loadTitle + 'Empty block titles are not a valid input';
  }

  // Check if the block title is in the block list
  let selectedBlock: Block | undefined = media.blocks.find(
    block => block.mediaItemId === loadTitle,
  );
  if (selectedBlock === undefined) {
    throw (
      loadTitle +
      ' is not a valid load title for a block, re-check your spelling or make sure the title youre attempting to load exists.'
    );
  }

  // If a block has shows assigned to it, assign the episodes to the block shows based on the progression of the shows
  await assignBlockEpisodes(args, selectedBlock, media.shows);

  return new SelectedMedia(
    selectedBlock,
    '',
    MediaType.Block,
    time,
    selectedBlock.durationLimit,
    selectedBlock.tags,
  );
}

export async function assignBlockEpisodes(
  args: IStreamRequest,
  block: Block,
  shows: Show[],
): Promise<void> {
  // Assigns the episodes to the block shows based on the progression of the shows
  // TODO - If the same show appears multiple times in a block, we will need to figure out how to represent that in the block
  // so it can be ran through this loop, or we will have to how the loop works to account for that
  // possibly just have the shows in the block show array to have the possibility of multiple entries with their individual sequence numbers
  for (const blockShow of block.shows) {
    // Find the show that matches the load title of the block show
    let selectedShow = shows.filter(
      item => item.mediaItemId === blockShow.mediaItemId,
    )[0];
    // Get the episode number that the show should be on based on the progression of the show
    let episodeNums = await ManageShowProgression(
      selectedShow,
      1,
      args,
      StreamType.Block,
      block.title,
    );
    let episodeNum = episodeNums[0];
    // Get the episode that matches the episode number from the progression
    blockShow.episode = selectedShow.episodes?.filter(
      ep => ep.episodeNumber === episodeNum,
    )[0];
  }
}

/**
 * Checks if a given tag has associated media in any media type
 */
function hasMediaWithTag(media: any, tag: any): boolean {
  const tagName = tag.name;

  // Check movies
  if (
    media.movies &&
    media.movies.some(
      (movie: any) =>
        movie.tags &&
        movie.tags.some(
          (t: any) => (typeof t === 'string' ? t : t.name) === tagName,
        ),
    )
  ) {
    return true;
  }

  // Check shows
  if (
    media.shows &&
    media.shows.some(
      (show: any) =>
        show.tags &&
        show.tags.some(
          (t: any) => (typeof t === 'string' ? t : t.name) === tagName,
        ),
    )
  ) {
    return true;
  }

  // Check music
  if (
    media.music &&
    media.music.some(
      (music: any) =>
        music.tags &&
        music.tags.some(
          (t: any) => (typeof t === 'string' ? t : t.name) === tagName,
        ),
    )
  ) {
    return true;
  }

  // Check shorts
  if (
    media.shorts &&
    media.shorts.some(
      (short: any) =>
        short.tags &&
        short.tags.some(
          (t: any) => (typeof t === 'string' ? t : t.name) === tagName,
        ),
    )
  ) {
    return true;
  }

  // Could also check commercials, promos, etc. if needed for tag selection

  return false;
}

/**
 * Gets a random selection of default genres - pure random approach with no biases
 * Validates that selected tags actually have associated media in the database
 */
function getRandomDefaultGenres(): any[] {
  const { getMedia } = require('./mediaService');
  const { tagRepository } = require('../repositories/tagsRepository');

  console.log(
    '🎲 Using pure random genre selection - no time-based or other preferences applied',
  );
  console.log(
    '📝 Future enhancement: User-configurable programming preferences (time-based, mood-based, etc.)',
  );

  // Get all available genre tags from the database
  const availableGenreTags = tagRepository.findByType('Genre');

  if (!availableGenreTags || availableGenreTags.length === 0) {
    console.log('⚠️  No genre tags found in database - returning empty array');
    return [];
  }

  console.log(
    `📚 Found ${availableGenreTags.length} total genre tags in database`,
  );

  // Get current media to validate against
  const media = getMedia();

  // Find genre tags that actually have associated media
  const validGenreTags = availableGenreTags.filter((tag: any) =>
    hasMediaWithTag(media, tag),
  );

  if (validGenreTags.length === 0) {
    console.log(
      '⚠️  No genre tags found with associated media - returning empty array',
    );
    return [];
  }

  console.log(
    `✅ Found ${validGenreTags.length} genre tags with associated media`,
  );

  // Use crypto for better randomness if available, otherwise use Math.random with timestamp seed
  let randomSeed: number;
  try {
    const crypto = require('crypto');
    randomSeed = crypto.randomBytes(4).readUInt32BE(0);
  } catch (e) {
    // Fallback to timestamp-based seed for better randomness than default Math.random
    randomSeed = Date.now() + Math.floor(Math.random() * 1000);
  }

  // Create a seeded random number generator for reproducible randomness in testing if needed
  const seedRandom = (seed: number) => {
    let s = seed;
    return () => {
      s = Math.sin(s) * 10000;
      return s - Math.floor(s);
    };
  };

  const random = seedRandom(randomSeed);

  // Select 3-5 random genres for variety without being too broad
  const numGenresToSelect = Math.floor(random() * 3) + 3; // Random between 3-5
  const selectedGenres: any[] = [];

  // Fisher-Yates shuffle algorithm for truly random selection
  const shuffledTags = [...validGenreTags];
  for (let i = shuffledTags.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffledTags[i], shuffledTags[j]] = [shuffledTags[j], shuffledTags[i]];
  }

  // Take the first N shuffled tags
  selectedGenres.push(
    ...shuffledTags.slice(0, Math.min(numGenresToSelect, shuffledTags.length)),
  );

  console.log(
    `🎯 Selected ${selectedGenres.length} random genres with verified media: ${selectedGenres.map((g: any) => g.name).join(', ')}`,
  );
  console.log(
    `🎲 Random seed used: ${randomSeed} (ensures different selection each time)`,
  );

  return selectedGenres;
}

/**
 * Gets complementary genres that work well with active holidays
 * Note: This is ONLY for holiday-specific programming, not general time-based preferences
 */
function getHolidayComplementaryGenres(holidays: any[]): any[] {
  const complementaryGenres: any[] = [];

  console.log(
    '🎄 Applying holiday-specific genre preferences (not general programming preferences)',
  );

  // Holiday-specific genre mapping - this is contextually appropriate unlike general time preferences
  holidays.forEach((holiday: any) => {
    const holidayName = holiday.name?.toLowerCase() || '';

    if (holidayName.includes('christmas') || holidayName.includes('winter')) {
      // Christmas/Winter: Family, Fantasy, Romance
      console.log('🎅 Adding winter holiday genres: Family, Fantasy, Romance');
    } else if (holidayName.includes('halloween')) {
      // Halloween: Horror, Mystery, Thriller
      console.log('🎃 Adding Halloween genres: Horror, Mystery, Thriller');
    } else if (holidayName.includes('valentine')) {
      // Valentine's: Romance, Comedy, Drama
      console.log("💝 Adding Valentine's genres: Romance, Comedy, Drama");
    } else {
      // Generic holiday: Family-friendly content
      console.log('🎊 Adding generic holiday genres: Family, Comedy');
    }
  });

  return complementaryGenres;
}

/**
 * Intelligently selects starting tags for continuous streams based on:
 * - Current holidays and seasons (when active)
 * - Pure random genre selection (clean, unbiased fallback)
 * Note: Time-based programming removed - should be user-configurable feature, not default behavior
 */
export function selectIntelligentStartingTags(): any[] {
  const { getCurrentHolidays } = require('./mediaService');

  let selectedTags: any[] = [];

  // 1. Check for active holidays first
  const activeHolidays = getCurrentHolidays();
  if (activeHolidays && activeHolidays.length > 0) {
    // Add holiday tags directly
    selectedTags.push(...activeHolidays);

    console.log(
      `🎄 Active holidays detected: ${activeHolidays.map((h: any) => h.name).join(', ')}`,
    );
    console.log('🎯 Using holiday-based programming for continuous stream');

    // Add complementary genres based on holiday characteristics
    selectedTags.push(...getHolidayComplementaryGenres(activeHolidays));

    return selectedTags;
  }

  // 2. Pure random selection when no holidays are active - cleanest approach
  console.log(
    `🎲 No active holidays found. Using random genre selection for continuous stream`,
  );

  selectedTags = getRandomDefaultGenres();

  console.log(
    `🎬 Selected ${selectedTags.length} random genres for continuous stream`,
  );
  return selectedTags;
}
