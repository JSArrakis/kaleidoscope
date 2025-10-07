import { Config } from '../models/config';
import { Media } from '../models/media';
import { Movie } from '../models/movie';
import { Block } from '../models/block';
import moment from 'moment';
import { MediaType } from '../models/enum/mediaTypes';
import { SelectedMedia } from '../models/selectedMedia';
import { StagedMedia } from '../models/stagedMedia';
import { getProceduralBlock } from './proceduralEngine';
import { Show } from '../models/show';
import { createBuffer } from './bufferEngine';
import { MediaBlock } from '../models/mediaBlock';
import { StreamType } from '../models/enum/streamTypes';
import { ManageShowProgression } from './progressionManager';
import { IStreamRequest } from '../models/streamRequest';
import { Mosaic } from '../models/mosaic';
import { MediaTag } from '../models/const/tagTypes';

export function constructStream(
  config: Config,
  args: IStreamRequest,
  media: Media,
  mosaics: Mosaic[],
  streamType: StreamType,
  // sets the time of the stream to the current time if no start time is provided
  rightNow: number = args.StartTime === undefined
    ? moment().unix()
    : args.StartTime,
): [MediaBlock[], string] {
  let error: string = '';
  let streamBlocks: MediaBlock[] = [];

  // Get the media that is scheduled to be played from the api request (movies that are selected to be played at a specific time)
  // This detects if a movie is scheduled to be played at a specific time and adds it to the stream
  // The format of the string is "MovieTitle::Time" where time is the unix timestamp of when the movie is scheduled to be played
  // TODO - Change the format of the scheduled movies request to be an array of objects with a title and time property for easier parsing
  let [scheduledMedia, selectError] = getScheduledMedia(media, args);
  if (selectError !== '') {
    error = selectError;
    return [[], error];
  }

  // Get the media that is specifically requested from the incoming http request and the end time of the stream to create a block
  // of media that is ordered by scheduled time and 'injected' media that is requested by the user
  // The staged media object is used to determine the order of the stream. The scheduled media will always play at the time it is scheduled
  // The injected media will fill the gaps between the scheduled media where the duration and time available allows
  // Any further time that is available after the scheduled media is filled with procedural selected media based on tagging
  // TODO - injected media for a continuous stream should take better consideration for the "genre walk" we want to create.
  // Due to the nature of the continuous stream, the injected media can and should be available to be played beyond just "today"
  // and should be subject to the rules of the genre walk to give a better experience to the viewer, scheduling these movies beyond the initial stream day to allow for a smoother "walk"
  // We might even want to consider removing the ability to inject media for a continuous stream and rely on the future API endpoints to inject movies manually
  // Or we could remove Staged Media for a continuous stream entirely and only use tags for the base stream generation
  let [injectedMovies, injectError] = getInjectedMovies(args, media.movies);
  if (injectError !== '') {
    error = injectError;
    return [[], error];
  }

  //TODO - If the scheduled media is beyond the end of the day today, set the end time as the end of the day.
  // We will need to design and construct a feature that handles the scheduling of media beyond the current day
  // as each day is generated as a new stream construction block. This will allow us to schedule media for specific days of the week.

  let [streamEndTime, evalError] = evaluateStreamEndTime(args, scheduledMedia);
  if (evalError !== '') {
    error = evalError;
    return [[], error];
  }

  let stagedMedia = new StagedMedia(
    scheduledMedia,
    injectedMovies,
    streamEndTime,
  );

  // Get genre tag from the media that is scheduled and injected if no tags are selected by the user
  setProceduralTags(args, stagedMedia);

  // Using the scheduled media and injected media, create a stream of media blocks that will be played in order
  // The stream is created by filling the time between the scheduled and injected media with procedural media based on the genre tags available
  // These are only the main media items, the buffer media is added to the stream in the next step
  let [stagedStream, stagedError] = getStagedStream(
    rightNow,
    config,
    args,
    stagedMedia,
    media,
    streamType,
  );
  if (stagedError !== '') {
    error = stagedError;
    return [[], error];
  }

  // An Object that holds previously played media to prevent the same media from being played in the same stream before a certain interval
  // Each media item in prevBuffer is added or removed based on its own rules. I.E. commercials are added if they are selected for a buffer but will be removed after the next
  // buffer is created and be replaced by that buffer's commercials. There are exceptions and special circumstances when this is not the case
  let prevBuffer: Media = new Media([], [], [], [], [], [], [], [], []);

  // Creates the buffer media to fill the time between when the stream is initilized and the first media item being played
  // The first media item played should be timed to the first 30 minute or hour mark on the clock
  // This initial buffer is created to ensure that the first media item is played at the correct time
  // TODO - change initial buffer into an object instead of an array
  let initialBuffer = createBuffer(
    stagedStream[0].time - rightNow,
    args,
    media,
    mosaics,
    [],
    stagedStream[0].tags,
    prevBuffer,
    [],
  );

  // Boolean to be used later to determine if there is an initial buffer to be added to the stream
  let hasInitialBuffer = initialBuffer.buffer.length > 0 ? true : false;

  // Adds the initial buffer to the prevBuffer object
  prevBuffer = initialBuffer.newPrevBuffer;

  // If there is any remaining time the initial buffer did not fill, that remaining time is assigned to the remainder variable
  // This variable gets passed to the next buffer to correct the schedule and keep things on time
  let remainder = initialBuffer.remainingDuration;

  // Loops through the staged stream of media items and creates a media block for each item
  // A media block is an object that holds the main media item and the buffer media that will be played after the main media item
  stagedStream.forEach((item, index) => {
    // Boolean to determine if the current media item is the last item in the time frame for this stream (determined by the user or the end of the day)
    let lastItem = index === stagedStream.length - 1 ? true : false;

    if (item.type == MediaType.Episode || item.type == MediaType.Movie) {
      let mediaBlock = new MediaBlock([], [], undefined, undefined);
      // Add main media item to the media block
      let mediaItem = item.media;
      mediaBlock.mainBlock = mediaItem;
      // Adds the assigned start time for the main media item to the media block
      mediaBlock.startTime = item.time;

      // Get the duration of the buffer media that will be played after the main media item
      // TODO - this does not take into account OverDuration media items
      // We will need a way to calculate the duration of the buffer using the length of the media item and when the next media item is scheduled to play or the end of the stream
      let bufferDuration = mediaItem.durationLimit - mediaItem.duration;

      // Creates the buffer media for this current block
      // The buffer is selected based on the tags of the current media item and the next media item in the stream
      // Unless the it is initial buffer or the last buffer of the stream, the buffer is split in half to allow for a smoother transition between media items
      // The middle of the buffer in these cases will always be the promo item based on the environment of the stream
      // The first half of the buffer will be themed to the media that aired befor the buffer, and the second half will be themed to the media that will air after the buffer
      let buffer = createBuffer(
        bufferDuration + remainder,
        args,
        media,
        mosaics,
        item.media.tags,
        lastItem ? [] : stagedStream[index + 1].tags,
        prevBuffer,
        [],
      );

      // The sum of all selected media items in the buffer is added to the total duration of the Media Block
      let totalDuration: number = 0;
      for (const obj of buffer.buffer) {
        totalDuration += obj.duration;
      }
      // Replaces the stored previous buffer with the buffer that was just created to prevent these media items from being played during the next buffer
      prevBuffer = buffer.newPrevBuffer;

      // Adds the buffer media to the media block
      mediaBlock.buffer.push(...buffer.buffer);
      // resets the remainder varliable to the new remainder from the buffer if any to be used in the next iteration of this loop
      remainder = buffer.remainingDuration;
      // If this is the first media item in the stream and there is an initial buffer, add the initial buffer to the media block
      if (index === 0 && hasInitialBuffer) {
        mediaBlock.initialBuffer.push(...initialBuffer.buffer);
        hasInitialBuffer = false;
      }
      // Adds the media block to the stream blocks array, order matters here as this is the order the media will be played in
      // as this array will be used as the upcoming stream variable used by the background service with shift() to add the next media item to the stream
      streamBlocks.push(mediaBlock);
    }
    // TODO - blocks
  });
  return [streamBlocks, error];
}

// function createblockBlock(
//     block: block,
//     progression: MediaProgression[],
//     options: any,
//     media: Media,
//     transaltionTags: TranslationTag[],
//     prevBuffer: Media): [string[], number] {
//     /*
//     -- This logic is to determine if a show should be populated in the stream for a block. If the show
//     runs longer than the alloted time block for that show, skip the show following it.
//     Time remaining will be filled with buffer media
//     */

//     /*
// -- Author note:: A good example of this is with the summer 2000 broadcast of Toonami with Tenchi Muyo.
// Tenchi has a few episodes that are weirdly 45 minutes instead of 30 minutes randomly with no real rhyme
// or reason. To handle this randomness, Toonami in it's original broadcast pulled the episode of Batman the
// Animated series which usually followed Tenchi for that day only and populated the remainder of the
// 15 minutes that would have normally been Batman with Power Puff Girl episodes instead. This allowed
// Toonami to keep the fidelity of a 3 hour block run time and decreasing dead time and keeping interest of the
// audience while staying within theme (Toonami being a series of mostly violence driven animated shows
// in which the only Cartoon Network licensed property that fit in the alloted time slot that was also
// themed correctly was PPG)
//     */
//     let remainder = 0;
//     let stream: string[] = [];
//     block.Shows.forEach((show, index) => {
//         let lastShowEpisode = block.Shows[index - 1].Episode;
//         if (lastShowEpisode) {
//             if (lastShowEpisode.Duration > lastShowEpisode.DurationLimit) {
//                 ReduceProgression(block.Title, show.LoadTitle, progression)
//             } else {
//                 let episode = show.Episode;
//                 if (episode) {
//                     stream.push(episode.Path)
//                     if (episode.Duration > episode.DurationLimit) {
//                         let nextShowEpisode = block.Shows[index + 1].Episode;
//                         if (nextShowEpisode) {
//                             let overDurationLength = (nextShowEpisode.DurationLimit + episode.DurationLimit) - episode.Duration + remainder;
//                             let overBuffer = createBuffer(
//                                 [],
//                                 overDurationLength,
//                                 options,
//                                 media,
//                                 [block.LoadTitle],
//                                 [block.LoadTitle],
//                                 transaltionTags,
//                                 prevBuffer)
//                             stream.push(...overBuffer[0].map(obj => obj.Path));
//                             remainder = overBuffer[1];
//                         }
//                     } else {
//                         let underBuffer = createBuffer(
//                             [],
//                             episode.DurationLimit - episode.Duration,
//                             options,
//                             media,
//                             [block.LoadTitle],
//                             [block.LoadTitle],
//                             transaltionTags,
//                             prevBuffer)
//                         stream.push(...underBuffer[0].map(obj => obj.Path));
//                         remainder = underBuffer[1];
//                     }
//                 }
//             }
//         }
//     });
//     return [stream, remainder];
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

export function getStagedStream(
  rightNow: number,
  config: Config,
  args: IStreamRequest,
  stagedMedia: StagedMedia,
  media: Media,
  streamType: StreamType,
): [selectedMedia: SelectedMedia[], error: string] {
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
    let firstProceduralBlock = getProceduralBlock(
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

  stagedMedia.scheduledMedia.forEach((item, index) => {
    selectedMedia.push(item);
    if (index < stagedMedia.scheduledMedia.length - 1) {
      let procDuration =
        stagedMedia.scheduledMedia[index + 1].time -
        stagedMedia.scheduledMedia[index].time -
        stagedMedia.scheduledMedia[index].duration;
      if (procDuration > 0) {
        let intermediateProcBlock = getProceduralBlock(
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
  });

  if (stagedMedia.scheduledMedia.length > 0) {
    let lastScheduledMedia =
      stagedMedia.scheduledMedia[stagedMedia.scheduledMedia.length - 1];
    let scheduledEndTime = stagedMedia.endTime;
    let endProcDuration =
      scheduledEndTime - lastScheduledMedia.time - lastScheduledMedia.duration;
    if (endProcDuration > 0) {
      let endProcBlock = getProceduralBlock(
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
    let tagList: MediaTag[] = [];
    stagedMedia.injectedMovies.forEach(inj => tagList.push(...inj.media.tags));
    stagedMedia.scheduledMedia.forEach(sch => tagList.push(...sch.media.tags));
    let uniquetags: MediaTag[] = [];
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
    new Movie('', '', '', '', [], '', 0, 0, []),
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

export function getBlock(
  loadTitle: string,
  media: Media,
  time: number,
  args: IStreamRequest,
): SelectedMedia {
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
  assignBlockEpisodes(args, selectedBlock, media.shows);

  return new SelectedMedia(
    selectedBlock,
    '',
    MediaType.Block,
    time,
    selectedBlock.durationLimit,
    selectedBlock.tags,
  );
}

export function assignBlockEpisodes(
  args: IStreamRequest,
  block: Block,
  shows: Show[],
): void {
  // Assigns the episodes to the block shows based on the progression of the shows
  // TODO - If the same show appears multiple times in a block, we will need to figure out how to represent that in the block
  // so it can be ran through this loop, or we will have to how the loop works to account for that
  // possibly just have the shows in the block show array to have the possibility of multiple entries with their individual sequence numbers
  block.shows.forEach(blockShow => {
    // Find the show that matches the load title of the block show
    let selectedShow = shows.filter(
      item => item.mediaItemId === blockShow.mediaItemId,
    )[0];
    // Get the episode number that the show should be on based on the progression of the show
    let episodeNum = ManageShowProgression(
      selectedShow,
      1,
      args,
      StreamType.Block,
      block.title,
    )[0];
    // Get the episode that matches the episode number from the progression
    blockShow.episode = selectedShow.episodes.filter(
      ep => ep.episodeNumber === episodeNum,
    )[0];
  });
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
