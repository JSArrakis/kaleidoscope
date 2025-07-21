import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Bumper } from '../models/bumper';
import { getMediaDuration } from '../utils/utilities';
import { bumperRepository } from '../repositories/bumperRepository';

export async function createBumperHandler(
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
    res.status(400).json({ message: 'Media Item ID is required' });
    return;
  }

  const bumper = bumperRepository.findByMediaItemId(mediaItemId);

  // If it exists, return error
  if (bumper) {
    res
      .status(400)
      .json({ message: `Bumper with Id ${mediaItemId} already exists` });
    return;
  }
  // If it doesn't exist, perform transformations
  let transformedBumper = await transformBumperFromRequest(
    req.body,
    mediaItemId,
  );

  // Insert bumper into MongoDB
  await bumperRepository.create(transformedBumper);

  res
    .status(200)
    .json({ message: `Bumper ${transformedBumper.title} Created` });
  return;
}

export async function deleteBumperHandler(
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
    res.status(400).json({ message: 'Media Item ID is required' });
    return;
  }

  // Retrieve bumper from MongoDB using bumper load title if it exists
  const bumper = bumperRepository.findByMediaItemId(mediaItemId);

  // If it doesn't exist, return error
  if (!bumper) {
    res.status(400).json({ message: 'Bumper does not exist' });
    return;
  }

  // If it exists, delete it
  bumperRepository.delete(mediaItemId);

  res.status(200).json({ message: 'Bumper Deleted' });
  return;
}

export async function updateBumperHandler(
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
    res.status(400).json({ message: 'Media Item ID is required' });
    return;
  }

  // Retrieve bumper from MongoDB using bumper load title if it exists
  const bumper = bumperRepository.findByMediaItemId(mediaItemId);

  // If it doesn't exist, return error
  if (!bumper) {
    res
      .status(400)
      .json({ message: `Bumper with ID ${mediaItemId} does not exist` });
    return;
  }

  // If it exists, perform transformations
  let updatedBumper = await transformBumperFromRequest(
    req.body,
    bumper.mediaItemId,
  );

  // Update bumper in MongoDB
  bumperRepository.update(bumper.mediaItemId, updatedBumper);

  res
    .status(200)
    .json({ message: `Bumper ${updatedBumper.title} Updated` });
  return;
}

export async function getBumperHandler(
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
    res.status(400).json({ message: 'Media Item ID is required' });
    return;
  }

  // Retrieve bumper from MongoDB using bumper load title if it exists using request params
  const bumper = bumperRepository.findByMediaItemId(mediaItemId);

  // If it doesn't exist, return error
  if (!bumper) {
    res
      .status(404)
      .json({ message: `Bumper with ID ${mediaItemId} does not exist` });
    return;
  }

  res.status(200).json(bumper);
  return;
}

export async function getAllBumpersHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const bumpers = bumperRepository.findAll();

  res.status(200).json(bumpers);
  return;
}

export async function transformBumperFromRequest(
  bumper: any,
  mediaItemId: string,
): Promise<Bumper> {
  let parsedBumper: Bumper = Bumper.fromRequestObject(bumper);

  parsedBumper.mediaItemId = mediaItemId;

  if (parsedBumper.duration > 0) {
    return parsedBumper;
  }
  console.log(`Getting duration for ${parsedBumper.path}`);
  let durationInSeconds = await getMediaDuration(parsedBumper.path);
  parsedBumper.duration = durationInSeconds; // Update duration value

  return parsedBumper;
}
