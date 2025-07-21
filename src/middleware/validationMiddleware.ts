import { body } from 'express-validator';
import path from 'path';
import fs from 'fs';
import { CollectionReference } from '../models/movie';
import { CollectionItem } from '../models/collection';

export const createMovieValidationRules = [
  body('mediaItemId').isString().notEmpty(),
  body('title').isString().notEmpty(),
  body('tags')
    .isArray({ min: 1 })
    .withMessage('Tags must be an array with at least 1 item')
    .custom((value: string[]) => {
      for (const item of value) {
        if (typeof item !== 'string') {
          throw new Error('Tags must be an array of strings');
        }
      }
      return true;
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
          throw new Error('tags must be an array of strings');
        }
      }
      return true;
    }),
  body('collections')
    .isArray()
    .custom((value: CollectionReference[]) => {
      for (const item of value) {
        if (!(item instanceof CollectionReference)) {
          throw new Error('collections must be an array of Collection Reference objects');
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
          throw new Error('tags must be an array of strings');
        }
      }
      return true;
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
          throw new Error('tags must be an array of strings');
        }
      }
      return true;
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
          throw new Error('tags must be an array of strings');
        }
      }
      return true;
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
          throw new Error('tags must be an array of strings');
        }
      }
      return true;
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
    .custom((value: CollectionItem[]) => {
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
//          TAG VALIDATION
// ===========================================

export const createTagValidationRules = [
  body('name').isString().notEmpty(),
  body('tagId').isString().notEmpty(),
];

export const updateTagValidationRules = [
  body('name').isString().notEmpty(),
  body('tagId').isString().notEmpty(),
];

export const deleteTagValidationRules = [];

export const getTagsValidationRules = [];

export const createAgeGroupValidationRules = [
  body('name').isString().notEmpty(),
  body('tagId').isString().notEmpty(),
  body('sequence').isNumeric().notEmpty(),
];

export const updateAgeGroupValidationRules = [
  body('name').isString().notEmpty(),
  body('tagId').isString().notEmpty(),
  body('sequence').isNumeric().notEmpty(),
];

export const deleteAgeGroupValidationRules = [];
export const getAgeGroupsValidationRules = [];

export const createMusicGenreValidationRules = [
  body('title').isString().notEmpty(),
  body('tagId').isString().notEmpty(),
  // for each sub-genre, check if it is an object and has a title and tagId

  body('subGenres')
    .isArray()
    .custom((value: any[]) => {
      for (const item of value) {
        if (typeof item !== 'object') {
          throw new Error('subGenres must be an array of objects');
        }
        if (!item.title || typeof item.title !== 'string') {
          throw new Error(
            'subGenres must have a "title" field that is a string',
          );
        }
        if (!item.tagId || typeof item.tagId !== 'string') {
          throw new Error(
            'subGenres must have a "tagId" field that is a string',
          );
        }
      }
      return true;
    }),
];

export const updateMusicGenreValidationRules = [
  body('title').isString().notEmpty(),
  body('tagId').isString().notEmpty(),
  // for each sub-genre, check if it is an object and has a title and tagId

  body('subGenres')
    .isArray()
    .custom((value: any[]) => {
      for (const item of value) {
        if (typeof item !== 'object') {
          throw new Error('subGenres must be an array of objects');
        }
        if (!item.title || typeof item.title !== 'string') {
          throw new Error(
            'subGenres must have a "title" field that is a string',
          );
        }
        if (!item.tagId || typeof item.tagId !== 'string') {
          throw new Error(
            'subGenres must have a "tagId" field that is a string',
          );
        }
      }
      return true;
    }),
];

export const deleteMusicGenreValidationRules = [];
export const getMusicGenresValidationRules = [];
