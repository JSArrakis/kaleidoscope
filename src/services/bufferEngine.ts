import { Media } from '../models/media';
import { Promo } from '../models/promo';
import { Commercial } from '../models/commercial';
import { Short } from '../models/short';
import { Music } from '../models/music';
import { IStreamRequest } from '../models/streamRequest';
import { MediaTag } from '../models/const/tagTypes';
import { keyNormalizer } from '../utils/utilities';
import { SegmentedTags } from '../models/segmentedTags';
import { segmentTags } from './dataTransformer';
import { BaseMedia } from '../models/mediaInterface';
import { sumMediaDuration, tagNamesFrom, getTagName } from '../prisms/core';
import { getMediaByAgeGroupHierarchy } from '../prisms/spectrum';
// import { getMediaByMosaicTags } from '../prisms/mosaic';
import { Mosaic } from '../models/mosaic';

export function createBuffer(
  duration: number,
  args: IStreamRequest,
  media: Media,
  mosaics: Mosaic[],
  halfATags: MediaTag[],
  halfBTags: MediaTag[],
  prevBuff: Media,
  holidays: string[],
): {
  buffer: (Promo | Music | Short | Commercial)[];
  remainingDuration: number;
  newPrevBuffer: Media;
} {
  let buffer: (Promo | Music | Short | Commercial)[] = [];

  // Get the translated tags for the preceding show or movie and the subsequent
  // show or movie. These are used to get buffer content for the first half of the
  // buffer and the last half of the buffer respectively
  // The reason for this is to better transition from one genre of media to the next
  let segmentedPreTags: SegmentedTags = segmentTags(halfATags);
  let segmentedPostTags: SegmentedTags = segmentTags(halfBTags);

  // If the tagsOR array contains halloween or christmas, set the only main tag to be
  // halloween or christmas
  // This is to ensure that the buffer is themed for the holiday
  // We will do this for both the preceding and subsequent tags
  // TODO - This is a temporary solution to ensure that the buffer is themed for the holiday
  // We will need to make this configurable by the user and not hardcoded
  // And we will also need to make sure that other holidays or special events unique to
  // the user can be themed as such
  // TODO - not sure why Im even checking MainTags here, it might not be necessary

  //Get Holiday Tags from the options
  let selectedHolidayTags: MediaTag[] = getHolidayTags(args.Tags, holidays);

  // Get the promos for the environment
  let envPromos: Promo[] = media.promos.filter(promo =>
    tagNamesFrom(promo.tags).includes(keyNormalizer(args.Env)),
  );

  if (envPromos.length === 0) {
    // If there are no promos for the environment, get the default promos
    envPromos = media.defaultPromos;
  }

  // Get the promos that are less than or equal to the duration of the buffer, the
  // target duration of a promo is 15 seconds normally, however we need to allow for
  // users to upload promos that are longer than 15 seconds
  // 15 seconds is the ideal duration, however, if in the event there is a 0 duration
  // buffer, the background service would only need to correct
  // for the 15 second duration in the next buffer, and 15 seconds is usually enough
  // time to convey a splash, logo or other branding
  let selectedPromos: Promo[] = envPromos.filter(sp => sp.duration <= duration);
  let promo: Promo;

  // If there are no promos that are less than or equal to the duration of the buffer,
  // select a random promo from the environment promos
  if (selectedPromos.length < 1) {
    promo = envPromos[Math.floor(Math.random() * envPromos.length)];
  } else {
    // If there are promos that are less than or equal to the duration of the buffer,
    // select a random promo from the selected promos
    promo = selectedPromos[Math.floor(Math.random() * selectedPromos.length)];
  }

  // Sets the duration of the buffer to be the duration of the buffer minus the duration
  // of the promo
  let remDur: number = 0;
  if (promo) {
    remDur = duration - promo.duration;
  }

  // variables to hold the duration of the first half of the buffer and the second half
  // of the buffer
  let halfA: number = 0;
  let halfB: number = 0;

  // If the precedint tags are empty (such as when the stream is just launched and there is
  // no preceding show or movie and we are creating the the initial buffer)
  if (halfATags.length === 0) {
    // There is no Half A, so the entire buffer is Half B (themed to the show that is about to play)
    halfB = remDur;

    // If there is no subsequent show or movie (such as when the stream is ending and there is
    // no subsequent show or movie and we are creating the final buffer)
  } else if (halfBTags.length === 0) {
    // There is no Half B, so the entire buffer is Half A (themed to the show that just played)
    halfA = remDur;
  } else {
    // If there is a preceding show or movie and a subsequent show or movie,
    // split the buffer in half
    // If the remaining duration is greater than or equal to 30 seconds, split
    // he buffer in half
    // If the remaining duration is less than 30 seconds, the entire buffer is
    // Half B(themed to the show that is about to play)
    // The reason for 30 seconds is to assume the promo is 15 seconds and the
    // fact that there are many 15 second commercials
    // TODO - We might need a better way to do this
    if (remDur >= 30) {
      halfA = Math.ceil(remDur / 2);
    }
    halfB = remDur - halfA;
  }

  if (halfA === 0) {
    // Get list of commercials, music, and shorts that match the tags of the
    // subsequent show or movie and also gets the remaining duration of the
    // buffer after selecting the media to pass to the next buffer selection
    let selectedB = selectBufferMediaWithinDuration(
      media,
      mosaics,
      segmentedPostTags,
      remDur,
      prevBuff,
      selectedHolidayTags,
    );
    // Add the selected media to the buffer
    buffer.push(...selectedB.selectedMedia);
    // Add the promo to the buffer
    buffer.push(promo);
    // Set the previous buffer to the chosen media
    prevBuff = selectedB.segmentedSelectedMedia;

    return {
      buffer,
      remainingDuration: selectedB.remainingDuration,
      newPrevBuffer: prevBuff,
    };
  } else if (halfB === 0) {
    // Get list of commercials, music, and shorts that match the tags of the
    // preceding show or movie and also gets the remaining duration of the
    // buffer after selecting the media to pass to the next buffer selection
    let selectedA = selectBufferMediaWithinDuration(
      media,
      mosaics,
      segmentedPreTags,
      remDur,
      prevBuff,
      selectedHolidayTags,
    );
    // Add the promo to the buffer
    buffer.push(promo);
    // Add the selected media to the buffer
    buffer.push(...selectedA.selectedMedia);
    // Set the previous buffer to the chosen media
    prevBuff = selectedA.segmentedSelectedMedia;

    return {
      buffer,
      remainingDuration: selectedA.remainingDuration,
      newPrevBuffer: prevBuff,
    };
  } else {
    // Create a new previous buffer to pass to aggregate the buffer items
    // to then populate into the previous buffer
    let newPrevBuff: Media = new Media(
      [], // Shows
      [], // Movies
      [], // Shorts
      [], // Music
      [], // Promos
      [], // Default Promos
      [], // Commercials
      [], // Default Commercials
      [], // Collections
    );
    // Get list of commercials, music, and shorts that match the tags of the
    // preceding show or movie
    let selectedA = selectBufferMediaWithinDuration(
      media,
      mosaics,
      segmentedPreTags,
      halfA,
      prevBuff,
      selectedHolidayTags,
    );
    // Add the selected media to the buffer
    buffer.push(...selectedA.selectedMedia);
    // Add the promo to the buffer
    buffer.push(promo);
    // Populate the new previous buffer with the selected buffer items
    // TODO - It looks like Im being redundant here, I should be able to just
    // set the newPrevBuff to selectedA.chosenMedia
    newPrevBuff = selectedA.segmentedSelectedMedia;
    prevBuff.commercials.push(...selectedA.segmentedSelectedMedia.commercials);
    prevBuff.music.push(...selectedA.segmentedSelectedMedia.music);
    prevBuff.shorts.push(...selectedA.segmentedSelectedMedia.shorts);
    // Get list of commercials, music, and shorts that match the tags of the
    // subsequent show or movie
    let selectedB = selectBufferMediaWithinDuration(
      media,
      mosaics,
      segmentedPostTags,
      halfB + selectedA.remainingDuration,
      prevBuff,
      selectedHolidayTags,
    );
    // Add the selected media to the buffer
    buffer.push(...selectedB.selectedMedia);
    // Populate the new previous buffer with the selected buffer items
    newPrevBuff.commercials.push(
      ...selectedB.segmentedSelectedMedia.commercials,
    );
    newPrevBuff.music.push(...selectedB.segmentedSelectedMedia.music);
    newPrevBuff.shorts.push(...selectedB.segmentedSelectedMedia.shorts);

    return {
      buffer,
      remainingDuration: selectedB.remainingDuration,
      newPrevBuffer: newPrevBuff,
    };
  }
}

export function getHolidayTags(
  tags: MediaTag[] | string[],
  holidays: string[],
): MediaTag[] {
  let holidayTags: MediaTag[] = [];
  tags.forEach(tag => {
    const name = typeof tag === 'string' ? tag : tag.name;
    if (holidays.includes(name)) {
      holidayTags.push(tag as MediaTag);
    }
  });
  return holidayTags;
}

export function selectFullDurationMedia(
  media: BaseMedia[],
  currentlySelectedMedia: BaseMedia[],
  duration: number,
): BaseMedia[] {
  return media.filter(
    (media: BaseMedia) =>
      media.duration === duration && !currentlySelectedMedia.includes(media),
  );
}

export function selectUnderDuratonMedia(
  media: BaseMedia[],
  currentlySelectedMedia: BaseMedia[],
  duration: number,
  blockDuration: number,
): BaseMedia[] {
  return media.filter(
    media =>
      media.duration <= duration &&
      media.duration <= blockDuration &&
      !currentlySelectedMedia.includes(media),
  );
}

export function selectAvailableCommercials(
  commercials: Commercial[],
  defaultCommercials: Commercial[],
  selectedCommercials: Commercial[],
  duration: number,
  blockDuration: number,
): Commercial[] {
  let availableCommercials: Commercial[] = [];
  // Get the commercials that fit the remaining duration
  availableCommercials = selectFullDurationMedia(
    commercials,
    selectedCommercials,
    duration,
  ) as Commercial[];
  // Get the commercials that are less than or equal to both the
  // remaining duration and the commercial block
  if (availableCommercials.length === 0) {
    availableCommercials = selectUnderDuratonMedia(
      commercials,
      selectedCommercials,
      duration,
      blockDuration,
    ) as Commercial[];
  }
  // Get the default commercials that fit the remaining duration
  // Only add them to the available commercials instead of assigning them
  // this way it still is a higher chance of selecting a commercial that is
  // not a default commercial
  if (sumMediaDuration(availableCommercials) < duration) {
    availableCommercials.push(
      ...(selectFullDurationMedia(
        defaultCommercials,
        [],
        duration,
      ) as Commercial[]),
    );
  }
  // Get the default commercials that are less than or equal to both the remaining duration
  // and the commercial block
  let summedDuration = sumMediaDuration(availableCommercials);
  if (summedDuration < duration && summedDuration < blockDuration) {
    availableCommercials.push(
      ...(selectUnderDuratonMedia(
        defaultCommercials,
        [],
        duration,
        blockDuration,
      ) as Commercial[]),
    );
  }
  return availableCommercials;
}

export function selectWeightedMedia(media: BaseMedia[]): BaseMedia {
  // Get the first 10 commercials from media, this is because the incoming
  // commercials are ordered from most relevant to least relevant in the
  // media list. We are selecting 10 commercials because we want to give
  // a little bit of variety in the commercials that are selected
  let weightedMedia: BaseMedia[] = media.slice(0, 10);
  // Select a random commercial from the first 10 commercials
  return weightedMedia[Math.floor(Math.random() * weightedMedia.length)];
}

export function selectCommercials(
  commercials: Commercial[],
  defaultCommercials: Commercial[],
  usedCommercials: Commercial[],
  remainingDuration: number,
): [Commercial[], number] {
  let alreadySelectedMedia: Commercial[] = usedCommercials.map(m => m);
  let selectedCommercials: Commercial[] = [];

  // In normal TV broadcast, a single commercial is rarely longer than 120 seconds
  // However they do exist, and as such we account for that for giving a small
  // chance of selecting a commercial that is longer than 120 seconds
  // by looking for commercials that are equal to the entire remaining duration
  // The variableness of this duration is what makes the possiblity of a full
  // remaining duration commercial being selected possible but low.
  // Set the commercial block to 120 seconds
  let commercialBlock = 120;

  // Remaining duration for the buffer might be less than 120 seconds
  while (remainingDuration > 0) {
    let availableCommercials: Commercial[] = selectAvailableCommercials(
      commercials,
      defaultCommercials,
      alreadySelectedMedia,
      remainingDuration,
      commercialBlock,
    );

    if (availableCommercials.length > 0) {
      // Select random commercial from available commercials
      const selectedCommercial = selectWeightedMedia(
        availableCommercials,
      ) as Commercial;
      // Add the selected commercial to the selected commercials list and remove the
      // duration of the commercial from the remaining duration
      selectedCommercials.push(selectedCommercial);
      alreadySelectedMedia.push(selectedCommercial);
      remainingDuration -= selectedCommercial.duration;
      // Add the title of the selected commercial to the used commercial titles list
      commercialBlock -= selectedCommercial.duration; // Reduce commercialBlock
    } else {
      // If there are no commercials that fit the remaining duration or commercial block
      // remaining duration, break the loop
      break;
    }
  }

  // Return the selected commercials and the remaining duration to be used in the next buffer
  return [selectedCommercials, remainingDuration];
}

// Select Shorts or Music
export function selectShortOrMusic(
  filteredShorts: Short[],
  filteredMusic: Music[],
  remainingDuration: number,
  usedShorts: Short[],
  usedMusic: Music[],
): (Short | Music) | null {
  // Get the available shorts that fit the remaining duration and have not been used
  const availableShorts = filteredShorts.filter(
    short => short.duration <= remainingDuration && !usedShorts.includes(short),
  );

  // Get the available music that fits the remaining duration and have not been used
  const availableMusic = filteredMusic.filter(
    music => music.duration <= remainingDuration && !usedMusic.includes(music),
  );

  if (availableShorts.length === 0 && availableMusic.length === 0) {
    return null; // No suitable shorts or music available
    // We dont want to reuse the same short or music video in the same buffer or one
    // from the previous buffer because the experience gets repetitive and boring
  }

  const useShort = Math.random() < 0.5; // 50% chance of selecting a short
  if (useShort && availableShorts.length > 0) {
    // Select a random short from the available shorts
    const selectedShort = selectWeightedMedia(availableShorts) as Short;
    return selectedShort;
  } else if (availableMusic.length > 0) {
    // Select a random music video from the available music
    const selectedMusic = selectWeightedMedia(availableMusic) as Music;

    return selectedMusic;
  }

  return null; // No suitable shorts or music available
}

// Define the main function
export function selectBufferMediaWithinDuration(
  media: Media,
  mosaics: Mosaic[],
  tags: SegmentedTags,
  duration: number,
  alreadyUsedMedia: Media,
  selectedHolidayTags: MediaTag[],
): {
  selectedMedia: (Commercial | Short | Music)[];
  segmentedSelectedMedia: Media;
  remainingDuration: number;
} {
  // Set the remaining duration to the total duration
  let remainingDuration = duration;

  let usedCommercials: Commercial[] = [];
  alreadyUsedMedia.commercials.forEach(commercial => {
    usedCommercials.push(commercial);
  });

  let usedMusic: Music[] = [];
  alreadyUsedMedia.music.forEach(music => {
    usedMusic.push(music);
  });

  let usedShorts: Short[] = [];
  alreadyUsedMedia.shorts.forEach(short => {
    usedShorts.push(short);
  });

  // Get media filtered by tags that match using Kaleidoscope Buffer Media Selection Algorithm(tm)
  /*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*/
  const filteredCommercials = getMediaByAgeGroupHierarchy(
    media.commercials,
    usedCommercials,
    tags,
    selectedHolidayTags,
    remainingDuration,
  );
  const filteredMusic = [] as Music[];
  //TODO
  // const filteredMusic = getMediaByMosaicTags(
  //   media.music,
  //   usedMusic,
  //   tags,
  //   mosaics,
  //   [],
  //   remainingDuration,
  // );
  const filteredShorts = getMediaByAgeGroupHierarchy(
    media.shorts,
    usedShorts,
    tags,
    selectedHolidayTags,
    remainingDuration,
  );
  /*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*/

  // Create a list of used commercial, music, and short titles
  let selectedMedia: (Commercial | Short | Music)[] = [];
  let segmentedSelectedMedia = new Media([], [], [], [], [], [], [], [], []);

  while (remainingDuration > 0) {
    // Get ~>= 120 seconds of commercials
    const chosenCommercials = selectCommercials(
      filteredCommercials as Commercial[],
      media.defaultCommercials,
      usedCommercials,
      remainingDuration,
    );
    // Add the selected commercials to the commercial list to be passed back and the
    // commercials for the previous buffer
    usedCommercials.push(...chosenCommercials[0]);
    selectedMedia.push(...chosenCommercials[0]);
    segmentedSelectedMedia.commercials.push(...chosenCommercials[0]);
    remainingDuration = chosenCommercials[1];

    // Get a short or music video
    const selectedShortOrMusic = selectShortOrMusic(
      filteredShorts as Short[],
      filteredMusic as Music[],
      remainingDuration,
      usedShorts,
      usedMusic,
    );

    // If there was a short or music video (if there wasnt the loop will continue until
    // the remaining duration is 0, or there are no more commercials that fit the remaining duration)
    if (selectedShortOrMusic) {
      selectedMedia.push(selectedShortOrMusic);
      if (selectedShortOrMusic instanceof Short) {
        usedShorts.push(selectedShortOrMusic);
        segmentedSelectedMedia.shorts.push(selectedShortOrMusic);
      } else {
        usedMusic.push(selectedShortOrMusic);
        segmentedSelectedMedia.music.push(selectedShortOrMusic);
      }
      remainingDuration -= selectedShortOrMusic.duration;
    }

    // If there are no commercials or shorts/music that fit the remaining duration, break the loop
    // The final remaining duration will get passed to the next buffer for timing correction
    if (chosenCommercials[0].length === 0 && !selectedShortOrMusic) {
      break;
    }
  }

  return {
    selectedMedia,
    segmentedSelectedMedia,
    remainingDuration,
  };
}
