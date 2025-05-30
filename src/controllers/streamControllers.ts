// src/controllers/streamController.ts

import { NextFunction, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import * as streamMan from '../services/streamManager';
import { createVLCClient } from '../services/vlcClient';
import { playVLC, setVLCClient } from '../services/backgroundService';
import { StreamType } from '../models/enum/streamTypes';
import * as envMan from '../services/environmentManager';
import { AdhocStreamRequest, ContStreamRequest } from '../models/streamRequest';
import { keyNormalizer } from '../utils/utilities';
import { getConfig } from '../config/configService';
import {
  getMedia,
  getMosaics,
  getStreamType,
  setStreamType,
} from '../services/mediaService';
import { getEnvConfig } from '../db/envConfig';

export async function continuousStreamHandler(
  req: Request,
  res: Response,
): Promise<void> {
  let streamError: string = '';
  // Check for errors in request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  //Convert request to ContiniousStreamRequest
  const contRequest = mapRequestToContinuousStreamRequest(req);

  // Get environment config from DB and set it in the environment manager
  let env = await getEnvConfig(keyNormalizer(contRequest.Env));
  if (env[1] !== '') {
    res.status(400).json({ message: env[1] });
    return;
  }
  envMan.SetEnvConfig(env[0]);

  setStreamType(StreamType.Cont);
  // TODO - Check if Continuous stream is already running, if so return error
  // Important until I can rewrite module of vlc client to include the ability to close the client
  // Currently the only way to close the client is to stop the Stream Assistant service

  // Set the continuous stream args to the values from the request
  // These values are stored in the stream service and used to determine the stream while it is running continuously
  // TODO - remove endtime from map
  streamMan.setContinuousStreamArgs(contRequest);

  // Set the VLC client to the client created with the password from the request
  // If VLC isnt already running, it will start VLC
  setVLCClient(
    await createVLCClient(streamMan.getContinuousStreamArgs().Password),
  );

  // Creates today's span of the stream filling the time until 12:00am using params from config, continuous stream args and available media
  streamError = streamMan.initializeStream(
    getConfig(),
    contRequest,
    getMedia(),
    getMosaics(),
    getStreamType(),
  );
  if (streamError !== '') {
    console.log('Error initializing stream: ' + streamError);
    res.status(400).json({ message: streamError });
    return;
  }

  // Pulls the first two items from the initialized stream and adds them to the on deck stream, the on deck stream array is used to load vlc with the next media block
  // This is done to for a future feature which will function in tandem with a user being able to change or rearrange an upcoming stream's media items.
  // To prevent a user from creating an issue which could cause the stream to desync with its original schedule, the schedule of the ondeck stream is locked in place
  streamMan.initializeOnDeckStream();

  // Adds the first two media blocks to the VLC client and playlist
  await streamMan.addInitialMediaBlocks();

  // Starts the VLC client playing the stream
  await playVLC();

  res.status(200).json({ message: 'Stream Starting' });
  return;
}

export async function adHocStreamHandler(
  req: Request,
  res: Response,
): Promise<void> {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  //Convert request to AdhocStreamRequest
  const adhocRequest = mapRequestToAdhocStreamRequest(req);

  // Get environment config from DB and set it in the environment manager
  let env = await getEnvConfig(keyNormalizer(adhocRequest.Env));
  if (env[1] !== '') {
    res.status(400).json({ message: env[1] });
    return;
  }

  envMan.SetEnvConfig(env[0]);

  setStreamType(StreamType.Adhoc);

  streamMan.setContinuousStreamArgs(adhocRequest);

  setVLCClient(
    await createVLCClient(streamMan.getContinuousStreamArgs().Password),
  );

  streamMan.initializeStream(
    getConfig(),
    adhocRequest,
    getMedia(),
    getMosaics(),
    getStreamType(),
  );
  streamMan.initializeOnDeckStream();

  await streamMan.addInitialMediaBlocks();
  await playVLC();

  res.status(200).json({ message: 'Stream Starting' });
  return;
}

export const contStreamValidationRules = [
  (req: Request, res: Response, next: Function) => {
    // Ensure only allowed fields are present
    const streamAllowedFields = [
      'env',
      'movies',
      'tags',
      'multiTags',
      'password',
    ];
    const requestBody: Record<string, any> = req.body;

    const extraFields = Object.keys(requestBody).filter(
      field => !streamAllowedFields.includes(field),
    );
    if (extraFields.length > 0) {
      return res
        .status(400)
        .json({ error: `Invalid fields: ${extraFields.join(', ')}` });
    }
    next();
  },

  // Validate the 'env' field
  body('env').optional().isString(),

  // Validate the 'movies' field
  body('movies')
    .optional()
    .isArray()
    .custom((value: string[]) => {
      for (const item of value) {
        if (typeof item !== 'string') {
          throw new Error('movies must be an array of strings');
        }
        if (item.includes('::')) {
          const [firstPart, secondPart] = item.split('::');
          // Check the first part for only letters and numbers
          if (!/^[a-zA-Z0-9]+$/.test(firstPart)) {
            throw new Error(
              'The first part of movies must contain only letters and numbers',
            );
          }

          // Check the second part for ISO 8601 date format with 30-minute increments
          const isoDateRegex =
            /^(\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):(?:00|30))$/;
          if (!isoDateRegex.test(secondPart)) {
            throw new Error(
              'The second part of movies must be in the format YYYY-MM-DDTHH:MM with 30-minute increments in 24-hour time',
            );
          }
        } else {
          // If no "::" found, check for only letters and numbers
          if (!/^[a-zA-Z0-9]+$/.test(item)) {
            throw new Error(
              'movies must be in the format "string" or "string::ISO8601 date" with allowed characters',
            );
          }
        }
      }
      return true;
    }),

  // Validate the 'tagsOR' field
  body('tags')
    .optional()
    .isArray()
    .withMessage('tags must be an array')
    .custom((value: string[]) => {
      // Check if all elements in the array are strings
      for (const item of value) {
        if (typeof item !== 'string') {
          throw new Error('tags must be an array of strings');
        }
      }
      return true;
    }),
  // Validate the 'startTime' field
  // isOptional() allows the field to be omitted from the request
  // Must be in the format YYYY-MM-DDTHH:MM
  // Must be at least the next 30 minute or 1 hour mark on the global clock
  body('startTime')
    .optional()
    .isString()
    .custom((value: string) => {
      const isoDateRegex = /^(\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):(?:00|30))$/;
      if (!isoDateRegex.test(value)) {
        throw new Error(
          'startTime must be in the format YYYY-MM-DDTHH:MM with 30-minute increments in 24-hour time',
        );
      }
      const startTime = new Date(value).getTime();
      const currentTime = new Date().getTime();
      const timeDifference = startTime - currentTime;
      if (timeDifference < 0) {
        throw new Error(
          'startTime must be at least the next 30 minute or 1 hour mark on the global clock',
        );
      }
      return true;
    }),
  // Validate the 'password' field
  body('password').isString(),
];

export const validate = (req: Request, res: Response, next: NextFunction) => {
  // Run validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const adHocStreamValidationRules = [
  (req: Request, res: Response, next: Function) => {
    // Ensure only allowed fields are present
    const streamAllowedFields = [
      'env',
      'movies',
      'tags',
      'multiTags',
      'password',
    ];
    const requestBody: Record<string, any> = req.body;

    const extraFields = Object.keys(requestBody).filter(
      field => !streamAllowedFields.includes(field),
    );
    if (extraFields.length > 0) {
      return res
        .status(400)
        .json({ error: `Invalid fields: ${extraFields.join(', ')}` });
    }
    next();
  },

  // Validate the 'env' field
  body('env').optional().isString(),

  // Validate the 'movies' field
  body('movies')
    .optional()
    .isArray()
    .custom((value: string[]) => {
      for (const item of value) {
        if (typeof item !== 'string') {
          throw new Error('movies must be an array of strings');
        }
        if (item.includes('::')) {
          const [firstPart, secondPart] = item.split('::');
          // Check the first part for only letters and numbers
          if (!/^[a-zA-Z0-9]+$/.test(firstPart)) {
            throw new Error(
              'The first part of movies must contain only letters and numbers',
            );
          }

          // Check the second part for ISO 8601 date format with 30-minute increments
          const isoDateRegex =
            /^(\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):(?:00|30))$/;
          if (!isoDateRegex.test(secondPart)) {
            throw new Error(
              'The second part of movies must be in the format YYYY-MM-DDTHH:MM with 30-minute increments in 24-hour time',
            );
          }
        } else {
          // If no "::" found, check for only letters and numbers
          if (!/^[a-zA-Z0-9]+$/.test(item)) {
            throw new Error(
              'movies must be in the format "string" or "string::ISO8601 date" with allowed characters',
            );
          }
        }
      }
      return true;
    }),

  // Validate the 'tagsOR' field
  body('tags')
    .optional()
    .isArray()
    .withMessage('tags must be an array')
    .custom((value: string[]) => {
      // Check if all elements in the array are strings
      for (const item of value) {
        if (typeof item !== 'string') {
          throw new Error('tags must be an array of strings');
        }
      }
      return true;
    }),
  // Validate the 'password' field
  body('password').isString(),
  // Validate the 'startTime' field
  // isOptional() allows the field to be omitted from the request
  // Must be in the format YYYY-MM-DDTHH:MM
  // Must be at least the next 30 minute or 1 hour mark on the global clock
  body('startTime')
    .optional()
    .isString()
    .custom((value: string) => {
      const isoDateRegex = /^(\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):(?:00|30))$/;
      if (!isoDateRegex.test(value)) {
        throw new Error(
          'startTime must be in the format YYYY-MM-DDTHH:MM with 30-minute increments in 24-hour time',
        );
      }
      const startTime = new Date(value).getTime();
      const currentTime = new Date().getTime();
      const timeDifference = startTime - currentTime;
      if (timeDifference < 0) {
        throw new Error(
          'startTime must be at least the next 30 minute or 1 hour mark on the global clock',
        );
      }
      return true;
    }),

  // Validate the 'endTime' field
  // Must be in the format YYYY-MM-DDTHH:MM
  // Must be at least 1 hour in the future
  // Must be at the 30 minute or 1 hour mark on the global clock
  body('endTime')
    .isString()
    .custom((value: string) => {
      const isoDateRegex = /^(\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):(?:00|30))$/;
      if (!isoDateRegex.test(value)) {
        throw new Error(
          'endTime must be in the format YYYY-MM-DDTHH:MM with 30-minute increments in 24-hour time',
        );
      }
      const endTime = new Date(value).getTime();
      const currentTime = new Date().getTime();
      const timeDifference = endTime - currentTime;
      if (timeDifference < 3600000) {
        throw new Error('endTime must be at least 1 hour in the future');
      }
      return true;
    }),
];

function mapRequestToContinuousStreamRequest(req: Request): ContStreamRequest {
  const contRequest = new ContStreamRequest(req.body.password);

  if (req.body.env) {
    contRequest.Env = req.body.env;
  }

  if (req.body.movies) {
    contRequest.Movies = req.body.movies;
  }

  if (req.body.tags) {
    contRequest.Tags = req.body.tags;
  }

  if (req.body.multiTags) {
    contRequest.MultiTags = req.body.multiTags;
  }

  if (req.body.startTime) {
    contRequest.StartTime = convertISOToUnix(req.body.startTime);
  }

  return contRequest;
}

function mapRequestToAdhocStreamRequest(req: Request): AdhocStreamRequest {
  const adhocRequest = new AdhocStreamRequest(req.body.password);

  if (req.body.env) {
    adhocRequest.Env = req.body.env;
  }

  if (req.body.movies) {
    adhocRequest.Movies = req.body.movies;
  }

  if (req.body.tags) {
    adhocRequest.Tags = req.body.tags;
  }

  if (req.body.multiTags) {
    adhocRequest.MultiTags = req.body.multiTags;
  }

  if (req.body.blocks) {
    adhocRequest.Blocks = req.body.blocks;
  }

  if (req.body.startTime) {
    adhocRequest.StartTime = convertISOToUnix(req.body.startTime);
  }

  if (req.body.endTime) {
    adhocRequest.EndTime = convertISOToUnix(req.body.endTime);
  }

  return adhocRequest;
}

function convertISOToUnix(isoDateTime: string): number {
  // Convert ISO 8601 date-time to Unix timestamp in seconds
  return Math.floor(new Date(isoDateTime).getTime() / 1000);
}
