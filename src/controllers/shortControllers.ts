import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { ShortModel, Short } from '../models/short';
import { LoadTitleError } from '../models/loadTitleError';
import { createMediaValidation } from '../middleware/validationMiddleware';
import { getMediaDuration } from '../utils/utilities';

// ===========================================
//               SHORT HANDLERS
// ===========================================

export async function createShortHandler(
  req: Request,
  res: Response,
): Promise<void> {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  let mediaItemId = req.body.mediaItemId;

  // Retrieve short from MongoDB using short load title if it exists
  const short = await ShortModel.findOne({ mediaItemId: mediaItemId });

  // If it exists, return error
  if (short) {
    res.status(400).json({
      message: `Short with mediaItemId ${mediaItemId} already exists`,
    });
    return;
  }
  // If it doesn't exist, perform transformations
  let transformedComm = await transformShortFromRequest(req.body, mediaItemId);

  // Insert short into MongoDB
  await ShortModel.create(transformedComm);

  res.status(200).json({ message: 'Short Created' });
  return;
}

export async function bulkCreateShortHandler(
  req: Request,
  res: Response,
): Promise<void> {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  // Validate request body is an array
  if (!Array.isArray(req.body)) {
    res.status(400).json({ message: 'Request body must be an array' });
    return;
  }
  // Validate request body is an array of objects
  if (!req.body.every((item: any) => typeof item === 'object')) {
    res
      .status(400)
      .json({ message: 'Request body must be an array of short objects' });
    return;
  }
  let createdShorts: string[] = [];
  let responseErrors: LoadTitleError[] = [];
  for (const shortEntry of req.body) {
    let err = createMediaValidation(shortEntry);
    if (err !== '') {
      responseErrors.push(new LoadTitleError(shortEntry.mediaItemId, err));
      continue;
    }
    try {
      let mediaItemId = shortEntry.path
        .replace(/[^a-zA-Z0-9]/g, '')
        .toLowerCase();
      const short = await ShortModel.findOne({ mediaItemId: mediaItemId });
      if (short) {
        // If it exists, return error
        responseErrors.push(
          new LoadTitleError(
            shortEntry.title,
            `Short ${shortEntry.mediaItemId} already exists`,
          ),
        );
        continue;
      }

      let transformedComm = await transformShortFromRequest(
        shortEntry,
        mediaItemId,
      );

      await ShortModel.create(transformedComm);
      createdShorts.push(transformedComm.mediaItemId);
    } catch (err) {
      responseErrors.push(
        new LoadTitleError(shortEntry.mediaItemId, err as string),
      );
    }
  }

  if (responseErrors.length === req.body.length) {
    res.status(400).json({
      message: 'Shorts Not Created',
      createdShorts: [],
      errors: responseErrors,
    });
    return;
  }

  res.status(200).json({
    message: 'Shorts Created',
    createdShorts: createdShorts,
    errors: responseErrors,
  });
  return;
}

export async function deleteShortHandler(
  req: Request,
  res: Response,
): Promise<void> {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  let mediaItemId = req.query.mediaItemId;

  // Retrieve short from MongoDB using short load title if it exists
  const short = await ShortModel.findOne({
    mediaItemId: mediaItemId,
  });

  // If it doesn't exist, return error
  if (!short) {
    res.status(400).json({
      message: `Short with mediaItemId ${mediaItemId} does not exist`,
    });
    return;
  }

  // If it exists, delete it
  await ShortModel.deleteOne({ _id: short._id });

  res.status(200).json({ message: 'Short Deleted' });
  return;
}

export async function updateShortHandler(
  req: Request,
  res: Response,
): Promise<void> {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  // Retrieve short from MongoDB using short load title if it exists
  const short = await ShortModel.findOne({ path: req.body.path });

  // If it doesn't exist, return error
  if (!short) {
    res.status(400).json({ message: 'Short does not exist' });
    return;
  }

  // If it exists, perform transformations
  let updatedShort = await transformShortFromRequest(
    req.body,
    short.mediaItemId,
  );

  // Update short in MongoDB
  await ShortModel.updateOne({ _id: short._id }, updatedShort);

  res.status(200).json({ message: 'Short Updated' });
  return;
}

export async function getShortHandler(
  req: Request,
  res: Response,
): Promise<void> {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  // Retrieve short from MongoDB using short load title if it exists using request params
  const short = await ShortModel.findOne({
    mediaItemId: req.query.mediaItemId,
  });

  // If it doesn't exist, return error
  if (!short) {
    res.status(404).json({ message: 'Short does not exist' });
    return;
  }

  res.status(200).json(short);
  return;
}

export async function getAllShortsHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const shorts = await ShortModel.find({});

  res.status(200).json(shorts);
  return;
}

export async function transformShortFromRequest(
  short: any,
  mediaItemId: string,
): Promise<Short> {
  let parsedShort: Short = Short.fromRequestObject(short);

  parsedShort.mediaItemId = mediaItemId;

  if (parsedShort.duration > 0) {
    return parsedShort;
  }
  console.log(`Getting duration for ${parsedShort.path}`);
  let durationInSeconds = await getMediaDuration(parsedShort.path);
  parsedShort.duration = durationInSeconds; // Update duration value

  return parsedShort;
}
