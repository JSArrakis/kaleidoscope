import { body } from 'express-validator';
import path from 'path';
import fs from 'fs';

// ===========================================
//             MOVIE VALIDATION
// ===========================================

export const createMovieValidationRules = [
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

export const bulkCreateMoviesValidationRules = [];

export const updateMovieValidationRules = [
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

export const deleteMovieValidationRules = [];

export const getMovieValidationRules = [];

// ===========================================
//              SHOW VALIDATION
// ===========================================

export const createShowValidationRules = [
  body('title').isString().notEmpty(),

  body('mediaItemId').isString(),

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
  body('episodes.*.season').isNumeric().notEmpty(),

  body('episodes.*.episode').isNumeric().notEmpty(),

  body('episodes.*.path').isString().notEmpty(),

  body('episodes.*.title').isString(),

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

  body('mediaItemId').isString(),

  body('imdb').isString(),
  //body.tags must be an array of strings but can be empty
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
  body('episodes.*.season').isNumeric().notEmpty(),

  body('episodes.*.episode').isNumeric().notEmpty(),

  body('episodes.*.path').isString().notEmpty(),

  body('episodes.*.title').isString(),

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

        if (!item.MediaItemId || typeof item.MediaItemId !== 'string') {
          throw new Error(
            'items must have a "MediaItemId" field that is a string',
          );
        }

        if (!item.MediaItemTitle || typeof item.MediaItemTitle !== 'string') {
          throw new Error(
            'items must have a "MediaItemTitle" field that is a string',
          );
        }

        if (!item.Sequence || typeof item.Sequence !== 'number') {
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

        if (!item.MediaItemId || typeof item.MediaItemId !== 'string') {
          throw new Error(
            'items must have a "MediaItemId" field that is a string',
          );
        }

        if (!item.MediaItemTitle || typeof item.MediaItemTitle !== 'string') {
          throw new Error(
            'items must have a "MediaItemTitle" field that is a string',
          );
        }

        if (!item.Sequence || typeof item.Sequence !== 'number') {
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

export const createTagValidationRules = [body('name').isString().notEmpty()];

export const deleteTagValidationRules = [];

export const getTagsValidationRules = [];
