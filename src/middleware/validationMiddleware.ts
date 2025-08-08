import { body } from 'express-validator';
import path from 'path';
import fs from 'fs';
import { CollectionReference } from '../models/movie';
import { tagRepository } from '../repositories/tagsRepository';

// Helper function to validate tag names exist in database
function validateTagNamesExist(tagNames: string[]): boolean {
  for (const tagName of tagNames) {
    const tag = tagRepository.findByName(tagName);
    if (!tag) {
      throw new Error(`Tag "${tagName}" does not exist in the database`);
    }
  }
  return true;
}

export const createMovieValidationRules = [
  body('mediaItemId').isString().notEmpty(),
  body('title').isString().notEmpty(),
  body('tags')
    .isArray()
    .custom((value: string[]) => {
      for (const item of value) {
        if (typeof item !== 'string') {
          throw new Error('Tags must be an array of tag names (strings)');
        }
      }
      // Validate that all tag names exist in the database
      return validateTagNamesExist(value);
    }),
  body('path')
    .isString()
    .notEmpty()
    .custom(value => {
      if (!path.isAbsolute(value)) {
        throw new Error(
          'Path must be a full PC, Mac, Linux, or network path that Kaleidoscope can access.',
        );
      }
      try {
        fs.accessSync(value, fs.constants.R_OK);
      } catch (err) {
        throw new Error('Path is not accessible by Kaleidoscope.');
      }
      return true;
    }),
];

export const updateMovieValidationRules = [
  body('mediaItemId').isString().notEmpty(),
  body('title').isString(),
  body('alias').isString(),
  body('imdb').isString(),
  body('tags')
    .isArray()
    .custom((value: string[]) => {
      for (const item of value) {
        if (typeof item !== 'string') {
          throw new Error('Tags must be an array of tag names (strings)');
        }
      }
      // Validate that all tag names exist in the database
      return validateTagNamesExist(value);
    }),
  body('collections')
    .isArray()
    .custom((value: CollectionReference[]) => {
      for (const item of value) {
        if (!(item instanceof CollectionReference)) {
          throw new Error(
            'collections must be an array of Collection Reference objects',
          );
        }
      }
      return true;
    }),
];

export const deleteMovieValidationRules = [];

export const getMovieValidationRules = [];

// ===========================================
//              SHOW VALIDATION
// ===========================================

export const createShowValidationRules = [
  body('title').isString().notEmpty(),

  body('mediaItemId').isString().notEmpty(),

  body('tags')
    .isArray()
    .custom((value: string[]) => {
      for (const item of value) {
        if (typeof item !== 'string') {
          throw new Error('Tags must be an array of tag names (strings)');
        }
      }
      // Validate that all tag names exist in the database
      return validateTagNamesExist(value);
    }),

  // episodes must be an array of Episode objects
  body('episodes')
    .isArray()
    .custom((value: any[]) => {
      for (const item of value) {
        if (typeof item !== 'object') {
          throw new Error('episodes must be an array of Episode objects');
        }
      }
      return true;
    }),

  // Each episode must have the following fields

  body('episodes.*.mediaItemId').isString().notEmpty(),

  body('episodes.*.path').isString().notEmpty(),

  body('episodes.*.episodeNumber').isNumeric().notEmpty(),

  body('episodes.*.episodeNumber').custom((value: number, { req }) => {
    const episodeNumbers = req.body.episodes.map(
      (episode: any) => episode.episodeNumber,
    );
    if (episodeNumbers.indexOf(value) !== episodeNumbers.lastIndexOf(value)) {
      throw new Error('Episode number must be unique in the episodes array');
    }
    return true;
  }),

  body('episodes.*.tags')
    .isArray()
    .custom((value: string[]) => {
      for (const item of value) {
        if (typeof item !== 'string') {
          throw new Error(
            'Episode tags must be an array of tag names (strings)',
          );
        }
      }
      // Validate that all tag names exist in the database
      return validateTagNamesExist(value);
    }),
];

export const updateShowValidationRules = [
  body('title').isString().notEmpty(),

  body('mediaItemId').isString().notEmpty(),

  body('tags')
    .isArray()
    .custom((value: string[]) => {
      for (const item of value) {
        if (typeof item !== 'string') {
          throw new Error('Tags must be an array of tag names (strings)');
        }
      }
      // Validate that all tag names exist in the database
      return validateTagNamesExist(value);
    }),

  // episodes must be an array of Episode objects
  body('episodes')
    .isArray()
    .custom((value: any[]) => {
      for (const item of value) {
        if (typeof item !== 'object') {
          throw new Error('episodes must be an array of Episode objects');
        }
      }
      return true;
    }),

  // Each episode must have the following fields

  body('episodes.*.mediaItemId').isString().notEmpty(),

  body('episodes.*.path').isString().notEmpty(),

  body('episodes.*.episodeNumber').isNumeric().notEmpty(),

  body('episodes.*.episodeNumber').custom((value: number, { req }) => {
    const episodeNumbers = req.body.episodes.map(
      (episode: any) => episode.episodeNumber,
    );
    if (episodeNumbers.indexOf(value) !== episodeNumbers.lastIndexOf(value)) {
      throw new Error('Episode number must be unique in the episodes array');
    }
    return true;
  }),

  body('episodes.*.tags')
    .isArray()
    .custom((value: string[]) => {
      for (const item of value) {
        if (typeof item !== 'string') {
          throw new Error(
            'Episode tags must be an array of tag names (strings)',
          );
        }
      }
      // Validate that all tag names exist in the database
      return validateTagNamesExist(value);
    }),
];

export const deleteShowValidationRules = [];

export const getShowValidationRules = [];

// ===========================================
//          BUFFER MEDIA VALIDATION
// ===========================================

export function createMediaValidation(media: any): string {
  if (!media.title || typeof media.title !== 'string') {
    return 'Media must have a "title" field that is a string';
  }
  if (!media.path || typeof media.path !== 'string') {
    return 'Media must have a "path" field that is the file path of the target media file a string';
  }
  if (
    !media.tags ||
    !Array.isArray(media.tags) ||
    media.tags.length < 1 ||
    !media.tags.every((tag: any) => typeof tag === 'string')
  ) {
    return 'Media must have a "tags" field that must provided as a non-empty array of strings for each buffer media';
  }
  return '';
}

export const createBufferValidationRules = [
  body('mediaItemId').isString().notEmpty(),
  body('tags')
    .isArray({ min: 1 })
    .custom((value: string[]) => {
      for (const item of value) {
        if (typeof item !== 'string') {
          throw new Error('tags must be an array of strings');
        }
      }
      return true;
    }),
  body('path').isString().notEmpty(),
];

export const bulkCreateBufferValidationRules = [];

export const updateBufferValidationRules = [
  body('title').isString().notEmpty(),
  body('tags')
    .isArray({ min: 1 })
    .custom((value: string[]) => {
      for (const item of value) {
        if (typeof item !== 'string') {
          throw new Error('tags must be an array of strings');
        }
      }
      return true;
    }),
  body('path').isString().notEmpty(),
];

export const deleteBufferValidationRules = [];

export const getBufferValidationRules = [];

// ===========================================
//          COLLECTION VALIDATION
// ===========================================
export const createCollectionValidationRules = [
  body('mediaItemId').isString().notEmpty(),

  body('title').isString().notEmpty(),

  // if there are items in the request body, they must be an array
  body('items')
    .isArray()
    .custom((value: any[]) => {
      for (const item of value) {
        if (typeof item !== 'object') {
          throw new Error('items must be an array of objects');
        }

        if (!item.mediaItemId || typeof item.mediaItemId !== 'string') {
          throw new Error(
            'items must have a "MediaItemId" field that is a string',
          );
        }

        if (!item.mediaItemTitle || typeof item.mediaItemTitle !== 'string') {
          throw new Error(
            'items must have a "MediaItemTitle" field that is a string',
          );
        }

        if (!item.sequence || typeof item.sequence !== 'number') {
          throw new Error(
            'items must have a "Sequence" field that is a number',
          );
        }
      }
      return true;
    }),
];

export const updateCollectionValidationRules = [
  body('mediaItemId').isString().notEmpty(),

  body('title').isString().notEmpty(),

  // if there are items in the request body, they must be an array
  body('items')
    .isArray()
    .custom((value: any[]) => {
      for (const item of value) {
        if (typeof item !== 'object') {
          throw new Error('items must be an array of objects');
        }

        if (!item.mediaItemId || typeof item.mediaItemId !== 'string') {
          throw new Error(
            'items must have a "MediaItemId" field that is a string',
          );
        }

        if (!item.mediaItemTitle || typeof item.mediaItemTitle !== 'string') {
          throw new Error(
            'items must have a "MediaItemTitle" field that is a string',
          );
        }

        if (!item.sequence || typeof item.sequence !== 'number') {
          throw new Error(
            'items must have a "Sequence" field that is a number',
          );
        }
      }
      return true;
    }),
];

export const deleteCollectionValidationRules = [];

export const getCollectionValidationRules = [];

// ===========================================
//          COMMERCIAL VALIDATION
// ===========================================

export const createCommercialValidationRules = [
  body('mediaItemId').isString().notEmpty(),
  body('title').isString().notEmpty(),
  body('type').isNumeric().notEmpty(),
  body('tags')
    .isArray()
    .custom((value: string[]) => {
      for (const item of value) {
        if (typeof item !== 'string') {
          throw new Error('Tags must be an array of strings');
        }
      }
      // Validate that all tag names exist in the database
      return validateTagNamesExist(value);
    }),
  body('path')
    .isString()
    .notEmpty()
    .custom(value => {
      if (!path.isAbsolute(value)) {
        throw new Error('Path must be an absolute path');
      }
      try {
        fs.accessSync(value, fs.constants.F_OK);
      } catch (err) {
        throw new Error('Path does not exist');
      }
      return true;
    }),
];

export const updateCommercialValidationRules = [
  body('mediaItemId').isString().notEmpty(),
  body('title').isString(),
  body('type').isNumeric(),
  body('tags')
    .isArray()
    .custom((value: string[]) => {
      for (const item of value) {
        if (typeof item !== 'string') {
          throw new Error('Tags must be an array of strings');
        }
      }
      // Validate that all tag names exist in the database
      return validateTagNamesExist(value);
    }),
  body('path')
    .isString()
    .custom(value => {
      if (value && !path.isAbsolute(value)) {
        throw new Error('Path must be an absolute path');
      }
      if (value) {
        try {
          fs.accessSync(value, fs.constants.F_OK);
        } catch (err) {
          throw new Error('Path does not exist');
        }
      }
      return true;
    }),
];

export const deleteCommercialValidationRules = [];

export const getCommercialValidationRules = [];

// ===========================================
//          SHORT VALIDATION
// ===========================================

export const createShortValidationRules = [
  body('mediaItemId').isString().notEmpty(),
  body('title').isString().notEmpty(),
  body('type').isNumeric().notEmpty(),
  body('tags')
    .isArray()
    .custom((value: string[]) => {
      for (const item of value) {
        if (typeof item !== 'string') {
          throw new Error('Tags must be an array of strings');
        }
      }
      // Validate that all tag names exist in the database
      return validateTagNamesExist(value);
    }),
  body('path')
    .isString()
    .notEmpty()
    .custom(value => {
      if (!path.isAbsolute(value)) {
        throw new Error('Path must be an absolute path');
      }
      try {
        fs.accessSync(value, fs.constants.F_OK);
      } catch (err) {
        throw new Error('Path does not exist');
      }
      return true;
    }),
];

export const updateShortValidationRules = [
  body('mediaItemId').isString().notEmpty(),
  body('title').isString(),
  body('type').isNumeric(),
  body('tags')
    .isArray()
    .custom((value: string[]) => {
      for (const item of value) {
        if (typeof item !== 'string') {
          throw new Error('Tags must be an array of strings');
        }
      }
      // Validate that all tag names exist in the database
      return validateTagNamesExist(value);
    }),
  body('path')
    .isString()
    .custom(value => {
      if (value && !path.isAbsolute(value)) {
        throw new Error('Path must be an absolute path');
      }
      if (value) {
        try {
          fs.accessSync(value, fs.constants.F_OK);
        } catch (err) {
          throw new Error('Path does not exist');
        }
      }
      return true;
    }),
];

export const deleteShortValidationRules = [];

export const getShortValidationRules = [];

// ===========================================
//          TAG VALIDATION
// ===========================================

export const createTagValidationRules = [
  body('name')
    .isString()
    .notEmpty()
    .custom((value: string) => {
      // Check if tag name already exists
      if (tagRepository.isNameTaken(value)) {
        throw new Error(`Tag name "${value}" already exists`);
      }
      return true;
    }),
  body('tagId').isString().notEmpty(),
];

export const updateTagValidationRules = [
  body('name')
    .isString()
    .notEmpty()
    .custom((value: string, { req }) => {
      // Check if tag name already exists (excluding current tag)
      const currentTagId = req.params?.tagId || req.body?.tagId;
      if (tagRepository.isNameTaken(value, currentTagId)) {
        throw new Error(`Tag name "${value}" already exists`);
      }
      return true;
    }),
  body('tagId').isString().notEmpty(),
];

export const deleteTagValidationRules = [];

export const getTagsValidationRules = [];

// ===========================================
//          AGE GROUP VALIDATION
// ===========================================

export const createAgeGroupValidationRules = [
  body('name')
    .isString()
    .notEmpty()
    .custom((value: string) => {
      // Check if tag name already exists
      if (tagRepository.isNameTaken(value)) {
        throw new Error(`Tag name "${value}" already exists`);
      }
      return true;
    }),
  body('tagId').isString().notEmpty(),
  body('sequence').isNumeric().notEmpty(),
];

export const updateAgeGroupValidationRules = [
  body('name')
    .isString()
    .notEmpty()
    .custom((value: string, { req }) => {
      // Check if tag name already exists (excluding current tag)
      const currentTagId = req.params?.tagId || req.body?.tagId;
      if (tagRepository.isNameTaken(value, currentTagId)) {
        throw new Error(`Tag name "${value}" already exists`);
      }
      return true;
    }),
  body('tagId').isString().notEmpty(),
  body('sequence').isNumeric().notEmpty(),
];

export const deleteAgeGroupValidationRules = [];
export const getAgeGroupsValidationRules = [];

// ===========================================
//           HOLIDAY VALIDATION
// ===========================================

export const createHolidayValidationRules = [
  body('tagId').isString().notEmpty(),
  body('name')
    .isString()
    .notEmpty()
    .custom((value: string) => {
      // Check if tag name already exists
      if (tagRepository.isNameTaken(value)) {
        throw new Error(`Tag name "${value}" already exists`);
      }
      return true;
    }),
  body('holidayDates')
    .isArray({ min: 1 })
    .custom((value: string[]) => {
      for (const item of value) {
        // strings must to be in MM-DD format
        if (typeof item !== 'string' || !/^\d{2}-\d{2}$/.test(item)) {
          throw new Error(
            'holidayDates must be an array of strings in MM-DD format',
          );
        }
      }
      return true;
    }),
  body('exclusionGenres')
    .isArray()
    .custom((value: string[]) => {
      for (const item of value) {
        if (typeof item !== 'string') {
          throw new Error('exclusionGenres must be an array of strings');
        }
      }
      return true;
    }),
  body('seasonStartDate')
    .isString()
    .matches(/^\d{2}-\d{2}$/),
  body('seasonEndDate')
    .isString()
    .matches(/^\d{2}-\d{2}$/),
];

export const updateHolidayValidationRules = [
  body('tagId').isString().notEmpty(),
  body('name')
    .isString()
    .notEmpty()
    .custom((value: string, { req }) => {
      // Check if tag name already exists (excluding current tag)
      const currentTagId = req.params?.tagId || req.body?.tagId;
      if (tagRepository.isNameTaken(value, currentTagId)) {
        throw new Error(`Tag name "${value}" already exists`);
      }
      return true;
    }),
  body('holidayDates')
    .isArray({ min: 1 })
    .custom((value: string[]) => {
      for (const item of value) {
        // strings must to be in MM-DD format
        if (typeof item !== 'string' || !/^\d{2}-\d{2}$/.test(item)) {
          throw new Error(
            'holidayDates must be an array of strings in MM-DD format',
          );
        }
      }
      return true;
    }),
  body('exclusionGenres')
    .isArray()
    .custom((value: string[]) => {
      for (const item of value) {
        if (typeof item !== 'string') {
          throw new Error('exclusionGenres must be an array of strings');
        }
      }
      return true;
    }),
  body('seasonStartDate')
    .isString()
    .matches(/^\d{2}-\d{2}$/),
  body('seasonEndDate')
    .isString()
    .matches(/^\d{2}-\d{2}$/),
];

export const deleteHolidayValidationRules = [];
export const getHolidayValidationRules = [];

export const createPromoValidationRules = [
  body('mediaItemId').isString().notEmpty(),
  body('title').isString().notEmpty(),
  body('type').isNumeric().notEmpty(),
  body('tags')
    .isArray()
    .custom((value: string[]) => {
      for (const item of value) {
        if (typeof item !== 'string') {
          throw new Error('Tags must be an array of strings');
        }
      }
      // Validate that all tag names exist in the database
      return validateTagNamesExist(value);
    }),
  body('path')
    .isString()
    .notEmpty()
    .custom(value => {
      if (!path.isAbsolute(value)) {
        throw new Error('Path must be an absolute path');
      }
      try {
        fs.accessSync(value, fs.constants.F_OK);
      } catch (err) {
        throw new Error('Path does not exist');
      }
      return true;
    }),
];

export const updatePromoValidationRules = [
  body('mediaItemId').isString().notEmpty(),
  body('title').isString(),
  body('type').isNumeric(),
  body('tags')
    .isArray()
    .custom((value: string[]) => {
      for (const item of value) {
        if (typeof item !== 'string') {
          throw new Error('Tags must be an array of strings');
        }
      }
      // Validate that all tag names exist in the database
      return validateTagNamesExist(value);
    }),
  body('path')
    .isString()
    .custom(value => {
      if (!path.isAbsolute(value)) {
        throw new Error('Path must be an absolute path');
      }
      try {
        fs.accessSync(value, fs.constants.F_OK);
      } catch (err) {
        throw new Error('Path does not exist');
      }
      return true;
    }),
];

export const deletePromoValidationRules = [];
export const getPromoValidationRules = [];

export const createBumperValidationRules = [
  body('mediaItemId').isString().notEmpty(),
  body('title').isString().notEmpty(),
  body('type').isNumeric().notEmpty(),
  body('tags')
    .isArray()
    .custom((value: string[]) => {
      for (const item of value) {
        if (typeof item !== 'string') {
          throw new Error('Tags must be an array of strings');
        }
      }
      // Validate that all tag names exist in the database
      return validateTagNamesExist(value);
    }),
  body('path')
    .isString()
    .notEmpty()
    .custom(value => {
      if (!path.isAbsolute(value)) {
        throw new Error('Path must be an absolute path');
      }
      try {
        fs.accessSync(value, fs.constants.F_OK);
      } catch (err) {
        throw new Error('Path does not exist');
      }
      return true;
    }),
];

export const updateBumperValidationRules = [
  body('mediaItemId').isString().notEmpty(),
  body('title').isString(),
  body('type').isNumeric(),
  body('tags')
    .isArray()
    .custom((value: string[]) => {
      for (const item of value) {
        if (typeof item !== 'string') {
          throw new Error('Tags must be an array of strings');
        }
      }
      // Validate that all tag names exist in the database
      return validateTagNamesExist(value);
    }),
  body('path')
    .isString()
    .custom(value => {
      if (!path.isAbsolute(value)) {
        throw new Error('Path must be an absolute path');
      }
      try {
        fs.accessSync(value, fs.constants.F_OK);
      } catch (err) {
        throw new Error('Path does not exist');
      }
      return true;
    }),
];

export const deleteBumperValidationRules = [];
export const getBumperValidationRules = [];

export const createMusicValidationRules = [
  body('mediaItemId').isString().notEmpty(),
  body('title').isString().notEmpty(),
  body('artist').isString(),
  body('type').isNumeric().notEmpty(),
  body('tags')
    .isArray()
    .custom((value: string[]) => {
      for (const item of value) {
        if (typeof item !== 'string') {
          throw new Error('Tags must be an array of strings');
        }
      }
      // Validate that all tag names exist in the database
      return validateTagNamesExist(value);
    }),
  body('path')
    .isString()
    .notEmpty()
    .custom(value => {
      if (!path.isAbsolute(value)) {
        throw new Error('Path must be an absolute path');
      }
      try {
        fs.accessSync(value, fs.constants.F_OK);
      } catch (err) {
        throw new Error('Path does not exist');
      }
      return true;
    }),
];

export const updateMusicValidationRules = [
  body('mediaItemId').isString().notEmpty(),
  body('title').isString(),
  body('artist').isString(),
  body('type').isNumeric(),
  body('tags')
    .isArray()
    .custom((value: string[]) => {
      for (const item of value) {
        if (typeof item !== 'string') {
          throw new Error('Tags must be an array of strings');
        }
      }
      // Validate that all tag names exist in the database
      return validateTagNamesExist(value);
    }),
  body('path')
    .isString()
    .custom(value => {
      if (!path.isAbsolute(value)) {
        throw new Error('Path must be an absolute path');
      }
      try {
        fs.accessSync(value, fs.constants.F_OK);
      } catch (err) {
        throw new Error('Path does not exist');
      }
      return true;
    }),
];

export const deleteMusicValidationRules = [];
export const getMusicValidationRules = [];
