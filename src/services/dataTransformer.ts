import * as ffmpeg from 'fluent-ffmpeg';
import { Show } from '../models/show';
import { Movie } from '../models/movie';
import { Commercial } from '../models/commercial';
import { Music } from '../models/music';
import { Promo } from '../models/promo';
import { Short } from '../models/short';
import { SegmentedTags } from '../models/segmentedTags';
import { Eras } from '../models/const/eras';
import { MainGenres } from '../models/const/mainGenres';
import { AgeGroups } from '../models/const/ageGroups';

export async function transformShowFromRequest(
  show: any,
  loadTitle: string,
): Promise<Show> {
  let parsedShow: Show = Show.fromRequestObject(show);

  parsedShow.mediaItemId = loadTitle;

  parsedShow.alias = parsedShow.mediaItemId;

  for (const episode of parsedShow.episodes) {
    if (episode.duration > 0) continue; // Skip if duration is already set
    console.log(`Getting duration for ${episode.path}`);
    let durationInSeconds = await getMediaDuration(episode.path);
    episode.duration = durationInSeconds; // Update duration value
    episode.durationLimit =
      Math.floor(episode.duration / 1800) * 1800 +
      (episode.duration % 1800 > 0 ? 1800 : 0);
    // set episode load title using show load title and episode number
  }

  //create an accounting of how many different duration limits there are and create a map of it
  let durationLimitsMap = new Map();
  parsedShow.episodes.forEach(episode => {
    if (durationLimitsMap.has(episode.durationLimit)) {
      durationLimitsMap.set(
        episode.durationLimit,
        durationLimitsMap.get(episode.durationLimit) + 1,
      );
    } else {
      durationLimitsMap.set(episode.durationLimit, 1);
    }
  });

  //use the map to determine which duration limit is the most common and use that as the show duration limit
  let maxCount = 0;
  let maxDurationLimit = 0;
  durationLimitsMap.forEach((value, key) => {
    if (value > maxCount) {
      maxCount = value;
      maxDurationLimit = key;
    }
  });
  parsedShow.durationLimit = maxDurationLimit;

  //if there are episodes with durations over the duration limit, set the show to over duration
  parsedShow.overDuration = parsedShow.episodes.some(
    episode => episode.duration > parsedShow.durationLimit,
  );

  //assume the episodes of the show are in order and set the episode number to the index of the episode in the array + 1
  parsedShow.episodes.forEach((episode, index) => {
    episode.episodeNumber = index + 1;
    episode.mediaItemId = `${parsedShow.mediaItemId}-${episode.episodeNumber}`;
  });

  //set the episode count to the length of the episodes array
  parsedShow.episodeCount = parsedShow.episodes.length;

  return parsedShow;
}

export async function transformMovieFromRequest(
  movie: any,
  loadTitle: string,
): Promise<Movie> {
  let parsedMovie: Movie = Movie.fromRequestObject(movie);

  parsedMovie.mediaItemId = loadTitle;

  parsedMovie.alias = parsedMovie.mediaItemId;
  if (parsedMovie.duration > 0) {
    return parsedMovie;
  }
  console.log(`Getting duration for ${parsedMovie.path}`);
  let durationInSeconds = await getMediaDuration(parsedMovie.path);
  parsedMovie.duration = durationInSeconds; // Update duration value
  parsedMovie.durationLimit =
    Math.floor(parsedMovie.duration / 1800) * 1800 +
    (parsedMovie.duration % 1800 > 0 ? 1800 : 0);

  return parsedMovie;
}

export async function updateMovieFromRequest(
  update: any,
  movie: any,
): Promise<Movie> {
  let parsedMovie: Movie = Movie.fromRequestObject(update);

  movie.Tags = parsedMovie.tags;

  return movie;
}

export async function transformCommercialFromRequest(
  buffer: any,
): Promise<Commercial> {
  let parsedCommercial: Commercial = Commercial.fromRequestObject(buffer);

  if (parsedCommercial.duration > 0) {
    return parsedCommercial;
  }
  console.log(`Getting duration for ${parsedCommercial.path}`);
  let durationInSeconds = await getMediaDuration(parsedCommercial.path);
  parsedCommercial.duration = durationInSeconds; // Update duration value

  return parsedCommercial;
}

export async function transformMusicFromRequest(buffer: any): Promise<Music> {
  let parsedMusic: Music = Music.fromRequestObject(buffer);

  if (parsedMusic.duration > 0) {
    return parsedMusic;
  }
  console.log(`Getting duration for ${parsedMusic.path}`);
  let durationInSeconds = await getMediaDuration(parsedMusic.path);
  parsedMusic.duration = durationInSeconds; // Update duration value

  return parsedMusic;
}

export async function transformPromoFromRequest(buffer: any): Promise<Promo> {
  let parsedPromo: Promo = Promo.fromRequestObject(buffer);

  if (parsedPromo.duration > 0) {
    return parsedPromo;
  }
  console.log(`Getting duration for ${parsedPromo.path}`);
  let durationInSeconds = await getMediaDuration(parsedPromo.path);
  parsedPromo.duration = durationInSeconds; // Update duration value

  return parsedPromo;
}

export async function transformShortFromRequest(buffer: any): Promise<Short> {
  let parsedShort: Short = Short.fromRequestObject(buffer);

  if (parsedShort.duration > 0) {
    return parsedShort;
  }
  console.log(`Getting duration for ${parsedShort.path}`);
  let durationInSeconds = await getMediaDuration(parsedShort.path);
  parsedShort.duration = durationInSeconds; // Update duration value

  return parsedShort;
}

export async function getMediaDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (!err) {
        const durationInSeconds: number =
          Math.round(Number(metadata.format.duration)) || 0;
        resolve(durationInSeconds);
      } else {
        reject(err);
      }
    });
  });
}

export function segmentTags(tags: string[]): SegmentedTags {
  let segmentedTags: SegmentedTags = new SegmentedTags([], [], [], [], []);

  tags.forEach(tag => {
    if (Object.values(Eras).includes(tag)) {
      segmentedTags.eraTags.push(tag);
    } else if (Object.values(MainGenres).includes(tag)) {
      segmentedTags.genreTags.push(tag);
    } else if (Object.values(AgeGroups).includes(tag)) {
      segmentedTags.ageGroupTags.push(tag);
    } else {
      segmentedTags.specialtyTags.push(tag);
    }
  });

  segmentedTags.eraTags = [...new Set(segmentedTags.eraTags)];
  segmentedTags.genreTags = [...new Set(segmentedTags.genreTags)];
  segmentedTags.specialtyTags = [...new Set(segmentedTags.specialtyTags)];
  segmentedTags.ageGroupTags = [...new Set(segmentedTags.ageGroupTags)];
  segmentedTags.holidayTags = [...new Set(segmentedTags.holidayTags)];

  return segmentedTags;
}
