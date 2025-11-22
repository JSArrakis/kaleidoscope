import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Short } from '../models/short';
import { getMediaDuration } from '../utils/utilities';
import { shortRepository } from '../repositories/shortRepository';

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

  if (!mediaItemId) {
    res.status(400).json({ message: 'mediaItemId is required' });
    return;
  }

  // Retrieve short from MongoDB using short load title if it exists
  const short = shortRepository.findByMediaItemId(mediaItemId);

  // If it exists, return error
  if (short) {
    res.status(400).json({
      message: `Short with mediaItemId ${mediaItemId} already exists`,
    });
    return;
  }
  // If it doesn't exist, perform transformations
  try {
    let transformedShort = await transformShortFromRequest(
      req.body,
      mediaItemId,
    );
    // Insert short into database
    shortRepository.create(transformedShort);
    res
      .status(200)
      .json({ message: `Short ${transformedShort.title} Created` });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(400).json({ message: errorMessage });
  }
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

  let mediaItemId = req.query.mediaItemId as string;

  if (!mediaItemId) {
    res.status(400).json({ message: 'mediaItemId is required' });
    return;
  }

  // Retrieve short from MongoDB using short load title if it exists
  const short = shortRepository.findByMediaItemId(mediaItemId);
  // If it doesn't exist, return error
  if (!short) {
    res.status(400).json({
      message: `Short with mediaItemId ${mediaItemId} does not exist`,
    });
    return;
  }

  // If it exists, delete it
  shortRepository.delete(mediaItemId);

  res.status(200).json({ message: `Short ${short.title} Deleted` });
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

  let mediaItemId = req.body.mediaItemId;

  if (!mediaItemId) {
    res.status(400).json({ message: 'mediaItemId is required' });
    return;
  }

  // Retrieve short from MongoDB using short load title if it exists
  const short = shortRepository.findByMediaItemId(mediaItemId);
  // If it doesn't exist, return error
  if (!short) {
    res.status(400).json({ message: 'Short does not exist' });
    return;
  }

  // If it exists, perform transformations
  try {
    let updatedShort = await transformShortFromRequest(
      req.body,
      short.mediaItemId,
    );
    // Update short in database
    await shortRepository.update(mediaItemId, updatedShort);
    res.status(200).json({ message: `Short ${updatedShort.title} Updated` });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(400).json({ message: errorMessage });
  }
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

  let mediaItemId = req.query.mediaItemId as string;

  if (!mediaItemId) {
    res.status(400).json({ message: 'mediaItemId is required' });
    return;
  }

  // Retrieve short from MongoDB using short load title if it exists using request params
  const short = shortRepository.findByMediaItemId(mediaItemId);

  // If it doesn't exist, return error
  if (!short) {
    res
      .status(404)
      .json({ message: `Short with ID ${mediaItemId} does not exist` });
    return;
  }

  res.status(200).json(short);
  return;
}

export async function getAllShortsHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const shorts = shortRepository.findAll();

  res.status(200).json(shorts);
  return;
}

export async function transformShortFromRequest(
  short: any,
  mediaItemId: string,
): Promise<Short> {
  let parsedShort: Short = await Short.fromRequestObject(short);

  parsedShort.mediaItemId = mediaItemId;

  if (parsedShort.duration > 0) {
    return parsedShort;
  }

  try {
    console.log(`Getting duration for ${parsedShort.path}`);
    let durationInSeconds = await getMediaDuration(parsedShort.path);
    parsedShort.duration = durationInSeconds; // Update duration value
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Cannot process short "${parsedShort.title}": ${errorMessage}`,
    );
  }

  return parsedShort;
}
