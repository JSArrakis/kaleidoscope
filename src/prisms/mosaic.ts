import { BaseMedia } from '../models/mediaInterface';
import { SegmentedTags } from '../models/segmentedTags';
import { AgeGroups } from '../models/const/ageGroups';
import * as core from './core';
import { Mosaic } from '../models/mosaic';
import { createMosaicKey } from '../utils/utilities';
import { Holidays } from '../models/const/holidays';

export function getMediaByMosaicTags(
  media: BaseMedia[],
  alreadySelectedMedia: BaseMedia[],
  tags: SegmentedTags,
  mosaics: Mosaic[],
  requestedHolidayTags: string[],
  duration: number,
): BaseMedia[] {
  let selectedMedia: BaseMedia[] = [];
  let sumDuration: number = 0;

  let contextAlreadySelectedMedia: BaseMedia[] = alreadySelectedMedia.map(
    m => m,
  );

  const hasAgeGroupTags = tags.ageGroupTags.length > 0;
  const hasSpecialtyTags = tags.specialtyTags.length > 0;
  const hasGenreTags = tags.genreTags.length > 0;
  const hasEraTags = tags.eraTags.length > 0;
  const hasHolidayTags = requestedHolidayTags.length > 0;
  let holidayMedia: BaseMedia[] = [];
  let nonHolidayMedia: BaseMedia[] = [];

  ({ holidayMedia, nonHolidayMedia } = core.splitMediaByHoliday(
    media,
    requestedHolidayTags,
    Object.values(Holidays),
  ));

  if (hasAgeGroupTags) {
    let ageGroups = core.getAgeGroupAdjacencyTags(tags.ageGroupTags);
    if (hasHolidayTags) {
      ageGroups.forEach(age => {
        sumDuration = core.sumMediaDuration(selectedMedia);
        if (sumDuration < duration) {
          const mediaByTags = getMediaByMosaicTagsAndAgeGroup(
            holidayMedia,
            contextAlreadySelectedMedia,
            hasSpecialtyTags,
            hasGenreTags,
            hasEraTags,
            tags,
            age,
            mosaics,
            duration,
          );
          selectedMedia.push(...mediaByTags);
          contextAlreadySelectedMedia.push(...mediaByTags);
        }
      });
    } else {
      ageGroups.forEach(age => {
        sumDuration = core.sumMediaDuration(selectedMedia);
        if (sumDuration < duration) {
          const mediaByTags = getMediaByMosaicTagsAndAgeGroup(
            nonHolidayMedia,
            contextAlreadySelectedMedia,
            hasSpecialtyTags,
            hasGenreTags,
            hasEraTags,
            tags,
            age,
            mosaics,
            duration,
          );
          selectedMedia.push(...mediaByTags);
          contextAlreadySelectedMedia.push(...mediaByTags);
        }
      });
    }
  }

  if (hasHolidayTags) {
    sumDuration = core.sumMediaDuration(selectedMedia);
    if (sumDuration < duration) {
      const mediaByTags = getMediaByMosaicTagsAndAgeGroup(
        holidayMedia,
        contextAlreadySelectedMedia,
        hasSpecialtyTags,
        hasGenreTags,
        hasEraTags,
        tags,
        AgeGroups.AllAges,
        mosaics,
        duration,
      );
      selectedMedia.push(...mediaByTags);
      contextAlreadySelectedMedia.push(...mediaByTags);
    }
  } else {
    sumDuration = core.sumMediaDuration(selectedMedia);
    if (sumDuration < duration) {
      const mediaByTags = getMediaByMosaicTagsAndAgeGroup(
        nonHolidayMedia,
        contextAlreadySelectedMedia,
        hasSpecialtyTags,
        hasGenreTags,
        hasEraTags,
        tags,
        AgeGroups.AllAges,
        mosaics,
        duration,
      );
      selectedMedia.push(...mediaByTags);
      contextAlreadySelectedMedia.push(...mediaByTags);
    }
  }

  return selectedMedia;
}

export function getMediaByMosaicTagsAndAgeGroup(
  media: BaseMedia[],
  alreadySelectedMedia: BaseMedia[],
  hasSpecialtyTags: boolean,
  hasGenreTags: boolean,
  hasEraTags: boolean,
  tags: SegmentedTags,
  age: string,
  mosaics: Mosaic[],
  duration: number,
): BaseMedia[] {
  let selectedMedia: BaseMedia[] = [];
  let contextAlreadySelectedMedia: BaseMedia[] = alreadySelectedMedia.map(
    m => m,
  );

  if (hasSpecialtyTags || hasGenreTags) {
    const mediaByTags = getMediaBySpecialtyOrMosaicHeriarchy(
      contextAlreadySelectedMedia,
      age,
      media,
      tags,
      mosaics,
      duration,
    );
    selectedMedia.push(...mediaByTags);
    contextAlreadySelectedMedia.push(...mediaByTags);
  } else if (hasEraTags) {
    const mediaByEra = core.getMediaByAgeAndEra(media, tags.eraTags, age);
    selectedMedia.push(...mediaByEra);
    contextAlreadySelectedMedia.push(...mediaByEra);
  } else {
    const mediaByAge = core.getMediaByAge(media, age);
    selectedMedia.push(...mediaByAge);
    contextAlreadySelectedMedia.push(...mediaByAge);
  }
  return selectedMedia;
}

export function getMediaBySpecialtyOrMosaicHeriarchy(
  alreadySelectedMedia: BaseMedia[],
  age: string,
  media: BaseMedia[],
  segmentedTags: SegmentedTags,
  mosaics: Mosaic[],
  duration: number,
): BaseMedia[] {
  let selectedMedia: BaseMedia[] = [];
  let sumDuration: number = 0;
  let contextAlreadySelectedMedia: BaseMedia[] = alreadySelectedMedia.map(
    m => m,
  );
  // The reason order Specialty Tags + Genre Tags, Genre Tags, then Specialty Tags
  // is due to the nature of moasic tags which are musical signatures based on cinematic genre
  // to musical genre mappings.

  // A thing to consider about certain movies is that they might share a specialty tag but not necessarily
  // share genre tags, for instance the movie Alien is a scifi horror movie, but the movie
  // Aliens is a scifi action horror movie. The differences in genre tags, even if some tags are shared,
  // can change the appropriate musical vibe for the adjacent media.

  // Read more about mosaics here.
  // Link to mosaics docs ../docs/mosaics.md
  if (
    segmentedTags.specialtyTags.length > 0 &&
    segmentedTags.genreTags.length > 0
  ) {
    const tagGroupMedia = getMediaByMosaicCombination(
      contextAlreadySelectedMedia,
      media,
      segmentedTags.specialtyTags,
      segmentedTags.genreTags,
      segmentedTags.eraTags,
      mosaics,
      age,
      duration,
    );
    selectedMedia.push(...tagGroupMedia);
    contextAlreadySelectedMedia.push(...tagGroupMedia);
  }

  if (segmentedTags.genreTags.length > 0) {
    sumDuration = core.sumMediaDuration(selectedMedia);
    if (sumDuration < duration) {
      const tagGroupMedia = getMediaByMosaicCombination(
        contextAlreadySelectedMedia,
        media,
        segmentedTags.specialtyTags,
        segmentedTags.genreTags,
        segmentedTags.eraTags,
        mosaics,
        age,
        duration,
      );
      selectedMedia.push(...tagGroupMedia);
      contextAlreadySelectedMedia.push(...tagGroupMedia);
    }
  }

  if (segmentedTags.specialtyTags.length > 0) {
    if (sumDuration < duration) {
      sumDuration = core.sumMediaDuration(selectedMedia);
      const tagGroupMedia = core.getMediaByTagGroupHeirarchy(
        contextAlreadySelectedMedia,
        media,
        segmentedTags.specialtyTags,
        segmentedTags.eraTags,
        age,
        duration,
      );
      selectedMedia.push(...tagGroupMedia);
      contextAlreadySelectedMedia.push(...tagGroupMedia);
    }
  }

  return selectedMedia;
}

export function getMediaByMosaicCombination(
  alreadySelectedMedia: BaseMedia[],
  media: BaseMedia[],
  specialtyTags: string[],
  genreTags: string[],
  eraTags: string[],
  mosaics: Mosaic[],
  age: string,
  duration: number,
): BaseMedia[] {
  let selectedMedia: BaseMedia[] = [];
  let sumDuration: number = duration;
  let contextAlreadySelectedMedia: BaseMedia[] = alreadySelectedMedia.map(
    m => m,
  );

  if (specialtyTags.length <= 2) {
    const tagGroupMedia = getMosaicMedia(
      contextAlreadySelectedMedia,
      media,
      specialtyTags,
      genreTags,
      mosaics,
      eraTags,
      age,
      duration,
    );
    selectedMedia.push(...tagGroupMedia);
    contextAlreadySelectedMedia.push(...tagGroupMedia);
    sumDuration = core.sumMediaDuration(selectedMedia);
    if (sumDuration < duration) {
      specialtyTags.forEach(tag => {
        const tagGroupMedia = getMosaicMedia(
          contextAlreadySelectedMedia,
          media,
          [tag],
          genreTags,
          mosaics,
          eraTags,
          age,
          duration - sumDuration,
        );
        selectedMedia.push(...tagGroupMedia);
        contextAlreadySelectedMedia.push(...tagGroupMedia);
      });
    }
  } else {
    specialtyTags.forEach(tag => {
      const tagGroupMedia = getMosaicMedia(
        contextAlreadySelectedMedia,
        media,
        [tag],
        genreTags,
        mosaics,
        eraTags,
        age,
        duration,
      );
      selectedMedia.push(...tagGroupMedia);
      contextAlreadySelectedMedia.push(...tagGroupMedia);
    });
  }

  return selectedMedia;
}

export function getMosaicMedia(
  alreadySelectedMedia: BaseMedia[],
  media: BaseMedia[],
  specialtyTags: string[],
  genreTags: string[],
  mosaics: Mosaic[],
  eraTags: string[],
  age: string,
  duration: number,
): BaseMedia[] {
  let selectedMedia: BaseMedia[] = [];
  let aggregateMediaInEra: BaseMedia[] = [];
  let aggregateMediaOutOfEra: BaseMedia[] = [];
  let contextMedia: BaseMedia[] = [];

  if (specialtyTags.length > 0) {
    let specialtyMedia = core.getMediaByTags(media, specialtyTags);
    if (specialtyMedia.length > 0) {
      contextMedia.push(
        ...specialtyMedia.filter(m => !alreadySelectedMedia.includes(m)),
      );
    } else {
      contextMedia = media;
    }
  }

  if (contextMedia.length === 0) {
    contextMedia = media;
  }

  let mosaic = getMosaic(genreTags, mosaics);
  if (mosaic) {
    const tags = [...mosaic.musicGenres, ...mosaic.musicSubGenres];
    tags.forEach(tag => {
      let contextTags = [tag, age];
      const { allTagMediaInEra, allTagMediaOutOfEra } = core.getAllTagMedia(
        contextMedia,
        eraTags,
        contextTags,
      );
      aggregateMediaInEra.push(...allTagMediaInEra);
      aggregateMediaOutOfEra.push(...allTagMediaOutOfEra);
    });

    selectedMedia.push(
      ...core.getMediaWithEraConsiderations(
        alreadySelectedMedia,
        aggregateMediaInEra,
        aggregateMediaOutOfEra,
        eraTags,
        duration,
      ),
    );
  }
  return selectedMedia;
}

export function getMosaic(
  genres: string[],
  mosaics: Mosaic[],
): Mosaic | undefined {
  let key = createMosaicKey(genres);
  return mosaics.find(m => m.key === key);
}
