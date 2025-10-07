import { BaseMedia } from '../models/mediaInterface';
import { AgeGroups } from '../models/const/ageGroups';
import { MediaTag } from '../models/const/tagTypes';

export function tagNamesFrom(tags: MediaTag[]): string[] {
  return tags
    .map(t => (typeof t === 'string' ? t : (t as any)?.name))
    .filter(Boolean) as string[];
}

export function getTagName(tag: MediaTag | string): string | undefined {
  if (tag === null || tag === undefined) return undefined;
  if (typeof tag === 'string') return tag;
  return (tag as any).name;
}

export function getMediaByAgeAndEra(
  media: BaseMedia[],
  eras: MediaTag[],
  age: string,
): BaseMedia[] {
  let selectedMedia: BaseMedia[] = [];
  const eraNames = tagNamesFrom(eras);

  eraNames.forEach(era => {
    selectedMedia.push(
      ...media.filter(m => {
        return (
          m.tags.some(tag => getTagName(tag) === era) &&
          m.tags.some(tag => getTagName(tag) === age)
        );
      }),
    );
  });

  return selectedMedia;
}

export function getMediaByAge(media: BaseMedia[], age: string): BaseMedia[] {
  return media.filter(m => m.tags.some(tag => getTagName(tag) === age));
}

export function sumMediaDuration(media: BaseMedia[]): number {
  return media.reduce((acc, val) => acc + val.duration, 0);
}

export function createTagGroups(tags: string[] | MediaTag[]): string[][] {
  // Return pairs of tag NAMES (string[][]) so tests that pass string[] still work.
  let biGenreGroups: string[][] = [];
  // Create groups of 2 genre tags
  const names = Array.isArray(tags)
    ? tagNamesFrom(tags as MediaTag[])
    : (tags as string[]);
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      biGenreGroups.push([names[i], names[j]]);
    }
  }
  return biGenreGroups;
}

export function getInEraMedia(
  media: BaseMedia[],
  eraTags: MediaTag[],
  tags: MediaTag[],
): BaseMedia[] {
  let inEra: BaseMedia[] = [];
  const eraNames = tagNamesFrom(eraTags);
  const tagNames = tagNamesFrom(tags);
  eraNames.forEach(era => {
    // Get all media that contains all of the tags and the era tag
    let inEraMedia = media.filter(m => {
      return (
        tagNames.every(tag =>
          m.tags.some(mediaTag => getTagName(mediaTag) === tag),
        ) && m.tags.some(mediaTag => getTagName(mediaTag) === era)
      );
    });
    inEra.push(...inEraMedia);
  });
  return inEra;
}

export function getOutOfEraMedia(
  media: BaseMedia[],
  eraTags: MediaTag[],
  tags: MediaTag[],
): BaseMedia[] {
  const eraNames = tagNamesFrom(eraTags);
  const tagNames = tagNamesFrom(tags);
  // Get all media that contains all of the tags and does not contain any of the era tags
  return media.filter(m => {
    return (
      tagNames.every(tag =>
        m.tags.some(mediaTag => getTagName(mediaTag) === tag),
      ) &&
      !eraNames.some(tag =>
        m.tags.some(mediaTag => getTagName(mediaTag) === tag),
      )
    );
  });
}

export function getMediaWithEraConsiderations(
  alreadySelectedMedia: BaseMedia[],
  allTagMediaInEra: BaseMedia[],
  allTagMediaOutOfEra: BaseMedia[],
  eraTags: MediaTag[],
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
  tags: MediaTag[],
): BaseMedia[] {
  const tagNames = tagNamesFrom(tags);
  return media.filter(m => {
    return tagNames.every(tag =>
      m.tags.some(mediaTag => getTagName(mediaTag) === tag),
    );
  });
}

export function getAllTagMedia(
  media: BaseMedia[],
  eraTags: MediaTag[],
  tags: MediaTag[],
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
  tags: MediaTag[],
  eraTags: MediaTag[],
  age: string,
  duration: number,
): BaseMedia[] {
  let selectedMedia: BaseMedia[] = [];
  let allTagMediaInEra: BaseMedia[] = [];
  let allTagMediaOutOfEra: BaseMedia[] = [];
  // contextTags is a combination of the tag names and the age group (string)
  const contextTags: MediaTag[] = [...tags];
  // Use getAllTagMedia which accepts MediaTag[]
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

export function getAgeGroupAdjacencyTags(tags: MediaTag[]): string[] {
  let adjacencyTags: string[] = [];
  const tagNames = tagNamesFrom(tags);
  tagNames.forEach(tag => {
    if (tag === AgeGroups.Kids) {
      adjacencyTags.push(AgeGroups.Kids);
      adjacencyTags.push(AgeGroups.Family);
    }
    if (tag === AgeGroups.Family) {
      adjacencyTags.push(AgeGroups.Family);
      adjacencyTags.push(AgeGroups.Kids);
      if (!tagNames.includes(AgeGroups.Kids)) {
        adjacencyTags.push(AgeGroups.YoungAdult);
      }
    }
    if (tag === AgeGroups.YoungAdult) {
      adjacencyTags.push(AgeGroups.YoungAdult);
      adjacencyTags.push(AgeGroups.Family);
      if (!tagNames.includes(AgeGroups.Family)) {
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

export function getHighestAgeGroupTag(tags: MediaTag[]): string {
  // Mature > Young Adult > Family > Kids
  const tagNames = tagNamesFrom(tags);
  if (tagNames.includes(AgeGroups.Mature)) {
    return AgeGroups.Mature;
  } else if (tagNames.includes(AgeGroups.YoungAdult)) {
    return AgeGroups.YoungAdult;
  } else if (tagNames.includes(AgeGroups.Family)) {
    return AgeGroups.Family;
  } else {
    return AgeGroups.Kids;
  }
}

export function getMediaByTagGroupHeirarchy(
  alreadySelectedMedia: BaseMedia[],
  media: BaseMedia[],
  selectedTags: MediaTag[],
  eraTags: MediaTag[],
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
    ...media.filter(m =>
      selectedHolidays.some(tag =>
        m.tags.some(mediaTag => getTagName(mediaTag) === tag),
      ),
    ),
  );

  // Get all media that does not contain any of the holiday tags from Holidays
  notHoliday.push(
    ...media.filter(
      m =>
        !holidays.some(tag =>
          m.tags.some(mediaTag => getTagName(mediaTag) === tag),
        ),
    ),
  );

  return { holidayMedia: inHoliday, nonHolidayMedia: notHoliday };
}
