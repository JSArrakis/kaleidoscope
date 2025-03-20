import { BaseMedia } from '../models/mediaInterface';
import { AgeGroups } from '../models/const/ageGroups';

export function getMediaByAgeAndEra(
  media: BaseMedia[],
  eras: string[],
  age: string,
): BaseMedia[] {
  let selectedMedia: BaseMedia[] = [];

  eras.forEach(era => {
    selectedMedia.push(
      ...media.filter(m => {
        return m.tags.includes(era) && m.tags.includes(age);
      }),
    );
  });

  return selectedMedia;
}

export function getMediaByAge(media: BaseMedia[], age: string): BaseMedia[] {
  return media.filter(m => m.tags.includes(age));
}

export function sumMediaDuration(media: BaseMedia[]): number {
  return media.reduce((acc, val) => acc + val.duration, 0);
}

export function createTagGroups(tags: string[]): string[][] {
  let biGenreGroups: string[][] = [];
  // Create groups of 2 genre tags
  for (let i = 0; i < tags.length; i++) {
    for (let j = i + 1; j < tags.length; j++) {
      biGenreGroups.push([tags[i], tags[j]]);
    }
  }
  return biGenreGroups;
}

export function getInEraMedia(
  media: BaseMedia[],
  eraTags: string[],
  tags: string[],
): BaseMedia[] {
  let inEra: BaseMedia[] = [];
  eraTags.forEach(era => {
    // Get all media that contains all of the tags and the era tag
    let inEraMedia = media.filter(m => {
      return tags.every(tag => m.tags.includes(tag)) && m.tags.includes(era);
    });
    inEra.push(...inEraMedia);
  });
  return inEra;
}

export function getOutOfEraMedia(
  media: BaseMedia[],
  eraTags: string[],
  tags: string[],
): BaseMedia[] {
  // Get all media that contains all of the tags and does not contain any of the era tags
  return media.filter(m => {
    return (
      tags.every(tag => m.tags.includes(tag)) &&
      !eraTags.some(tag => m.tags.includes(tag))
    );
  });
}

export function getMediaWithEraConsiderations(
  alreadySelectedMedia: BaseMedia[],
  allTagMediaInEra: BaseMedia[],
  allTagMediaOutOfEra: BaseMedia[],
  eraTags: string[],
  duration: number,
): BaseMedia[] {
  let selectedMedia: BaseMedia[] = [];
  if (eraTags.length > 0) {
    selectedMedia.push(
      ...fillMediaByEra(
        alreadySelectedMedia,
        allTagMediaInEra,
        allTagMediaOutOfEra,
        duration,
      ),
    );
  } else {
    selectedMedia.push(
      ...allTagMediaInEra.filter(m => !alreadySelectedMedia.includes(m)),
    );
  }

  return selectedMedia;
}

export function fillMediaByEra(
  alreadySelectedMedia: BaseMedia[],
  eraMedia: BaseMedia[],
  nonEraMedia: BaseMedia[],
  duration: number,
): BaseMedia[] {
  let selectedMedia: BaseMedia[] = eraMedia.filter(
    m => !alreadySelectedMedia.includes(m),
  );

  // If there is not enough media to fill the duration: Get all media that matches any era tags
  const sumDuration = sumMediaDuration(selectedMedia);
  if (sumDuration < duration) {
    selectedMedia.push(
      ...nonEraMedia.filter(m => !alreadySelectedMedia.includes(m)),
    );
  }

  return selectedMedia;
}

export function getMediaByTags(
  media: BaseMedia[],
  tags: string[],
): BaseMedia[] {
  return media.filter(m => {
    return tags.every(tag => m.tags.includes(tag));
  });
}

export function getAllTagMedia(
  media: BaseMedia[],
  eraTags: string[],
  tags: string[],
): { allTagMediaInEra: BaseMedia[]; allTagMediaOutOfEra: BaseMedia[] } {
  let inEra: BaseMedia[] = [];
  let outOfEra: BaseMedia[] = [];
  if (eraTags.length > 0) {
    inEra.push(...getInEraMedia(media, eraTags, tags));
    outOfEra.push(...getOutOfEraMedia(media, eraTags, tags));
  } else {
    inEra.push(...getMediaByTags(media, tags));
  }
  return { allTagMediaInEra: inEra, allTagMediaOutOfEra: outOfEra };
}

export function getContextMedia(
  alreadySelectedMedia: BaseMedia[],
  media: BaseMedia[],
  tags: string[],
  eraTags: string[],
  age: string,
  duration: number,
): BaseMedia[] {
  let selectedMedia: BaseMedia[] = [];
  let allTagMediaInEra: BaseMedia[] = [];
  let allTagMediaOutOfEra: BaseMedia[] = [];
  let contextTags = [...tags, age];
  ({ allTagMediaInEra, allTagMediaOutOfEra } = getAllTagMedia(
    media,
    eraTags,
    contextTags,
  ));
  selectedMedia.push(
    ...getMediaWithEraConsiderations(
      alreadySelectedMedia,
      allTagMediaInEra,
      allTagMediaOutOfEra,
      eraTags,
      duration,
    ),
  );
  return selectedMedia;
}

export function getAgeGroupAdjacencyTags(tags: string[]): string[] {
  let adjacencyTags: string[] = [];
  tags.forEach(tag => {
    if (tag === AgeGroups.Kids) {
      adjacencyTags.push(AgeGroups.Kids);
      adjacencyTags.push(AgeGroups.Family);
    }
    if (tag === AgeGroups.Family) {
      adjacencyTags.push(AgeGroups.Family);
      adjacencyTags.push(AgeGroups.Kids);
      if (!tags.includes(AgeGroups.Kids)) {
        adjacencyTags.push(AgeGroups.YoungAdult);
      }
    }
    if (tag === AgeGroups.YoungAdult) {
      adjacencyTags.push(AgeGroups.YoungAdult);
      adjacencyTags.push(AgeGroups.Family);
      if (!tags.includes(AgeGroups.Family)) {
        adjacencyTags.push(AgeGroups.Mature);
      }
    }
    if (tag === AgeGroups.Mature) {
      adjacencyTags.push(AgeGroups.Mature);
      adjacencyTags.push(AgeGroups.YoungAdult);
    }
  });
  return adjacencyTags.filter(
    (tag, index) => adjacencyTags.indexOf(tag) === index,
  );
}

export function getHighestAgeGroupTag(tags: string[]): string {
  // Mature > Young Adult > Family > Kids
  if (tags.includes(AgeGroups.Mature)) {
    return AgeGroups.Mature;
  } else if (tags.includes(AgeGroups.YoungAdult)) {
    return AgeGroups.YoungAdult;
  } else if (tags.includes(AgeGroups.Family)) {
    return AgeGroups.Family;
  } else {
    return AgeGroups.Kids;
  }
}

export function getMediaByTagGroupHeirarchy(
  alreadySelectedMedia: BaseMedia[],
  media: BaseMedia[],
  selectedTags: string[],
  eraTags: string[],
  age: string,
  duration: number,
): BaseMedia[] {
  //Create a list of base media to put already selected media in and make it so when the list is added to it doesnt modify the original list
  let contextAlreadySelectedMedia: BaseMedia[] = alreadySelectedMedia.map(
    m => m,
  );

  let selectedMedia: BaseMedia[] = [];
  let sumDuration: number = duration;
  // If there are 3 or less genre tags, create groups of genre tags in combinations of 2
  if (selectedTags.length <= 3) {
    // Create groups of 2 genre tags
    // a. Try to get media that matches all genre tags first
    const contextMedia = getContextMedia(
      contextAlreadySelectedMedia,
      media,
      selectedTags,
      eraTags,
      age,
      duration,
    );
    selectedMedia.push(...contextMedia);
    contextAlreadySelectedMedia.push(...contextMedia);
    // b. If summed duration is still less than the duration, get media that matches all tags in each of the biGenreGroups
    // If there are only 2 genre tags, it is the same as the previous attempt to get media with all tags
    sumDuration = sumMediaDuration(selectedMedia);
    if (sumDuration < duration && selectedTags.length === 3) {
      let biTagGroups = createTagGroups(selectedTags);
      biTagGroups.forEach(tagGroup => {
        const contextMedia = getContextMedia(
          contextAlreadySelectedMedia,
          media,
          tagGroup,
          eraTags,
          age,
          duration - sumDuration,
        );
        selectedMedia.push(...contextMedia);
        contextAlreadySelectedMedia.push(...contextMedia);
      });
    }

    sumDuration = sumMediaDuration(selectedMedia);
    // c. If summed duration is still less than the duration, get media that matches any of the genre tags that have not already been added to the selected media list
    if (sumDuration < duration) {
      // We dont update the duration here for each loop because we want
      // and equal chance of selecting media that matches any of the tags
      // Including out of era media
      selectedTags.forEach(tag => {
        const contextMedia = getContextMedia(
          contextAlreadySelectedMedia,
          media,
          [tag],
          eraTags,
          age,
          duration - sumDuration,
        );
        selectedMedia.push(...contextMedia);
        contextAlreadySelectedMedia.push(...contextMedia);
      });
    }
  } else {
    // If there are more than 3 genre tags, get media that matches any of the genre tags
    selectedTags.forEach(tag => {
      const contextMedia = getContextMedia(
        contextAlreadySelectedMedia,
        media,
        [tag],
        eraTags,
        age,
        duration - sumDuration,
      );
      selectedMedia.push(...contextMedia);
      contextAlreadySelectedMedia.push(...contextMedia);
    });
  }
  return selectedMedia;
}

export function splitMediaByHoliday(
  media: BaseMedia[],
  selectedHolidays: string[],
  holidays: string[],
): { holidayMedia: BaseMedia[]; nonHolidayMedia: BaseMedia[] } {
  let inHoliday: BaseMedia[] = [];
  let notHoliday: BaseMedia[] = [];

  // Get all media that contains any of the holiday tags from selectedHolidays
  inHoliday.push(
    ...media.filter(m => selectedHolidays.some(tag => m.tags.includes(tag))),
  );

  // Get all media that does not contain any of the holiday tags from Holidays
  notHoliday.push(
    ...media.filter(m => !holidays.some(tag => m.tags.includes(tag))),
  );

  return { holidayMedia: inHoliday, nonHolidayMedia: notHoliday };
}
