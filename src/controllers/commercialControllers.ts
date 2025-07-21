import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Commercial } from '../models/commercial';
import { getMediaDuration } from '../utils/utilities';
import { commercialRepository } from '../repositories/commercialRepository';

export async function createCommercialHandler(
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

  const commercial = commercialRepository.findByMediaItemId(mediaItemId);

  // If it exists, return error
  if (commercial) {
    res
      .status(400)
      .json({ message: `Commercial with Id ${mediaItemId} already exists` });
    return;
  }
  // If it doesn't exist, perform transformations
  let transformedComm = await transformCommercialFromRequest(
    req.body,
    mediaItemId,
  );

  // Insert commercial into MongoDB
  await commercialRepository.create(transformedComm);

  res
    .status(200)
    .json({ message: `Commercial ${transformedComm.title} Created` });
  return;
}

export async function deleteCommercialHandler(
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

  // Retrieve commercial from MongoDB using commercial load title if it exists
  const commercial = commercialRepository.findByMediaItemId(mediaItemId);

  // If it doesn't exist, return error
  if (!commercial) {
    res.status(400).json({ message: 'Commercial does not exist' });
    return;
  }

  // If it exists, delete it
  commercialRepository.delete(mediaItemId);

  res.status(200).json({ message: 'Commercial Deleted' });
  return;
}

export async function updateCommercialHandler(
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

  // Retrieve commercial from MongoDB using commercial load title if it exists
  const commercial = commercialRepository.findByMediaItemId(mediaItemId);

  // If it doesn't exist, return error
  if (!commercial) {
    res
      .status(400)
      .json({ message: `Commercial with ID ${mediaItemId} does not exist` });
    return;
  }

  // If it exists, perform transformations
  let updatedCommercial = await transformCommercialFromRequest(
    req.body,
    commercial.mediaItemId,
  );

  // Update commercial in MongoDB
  commercialRepository.update(commercial.mediaItemId, updatedCommercial);

  res
    .status(200)
    .json({ message: `Commercial ${updatedCommercial.title} Updated` });
  return;
}

export async function getCommercialHandler(
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

  // Retrieve commercial from MongoDB using commercial load title if it exists using request params
  const commercial = commercialRepository.findByMediaItemId(mediaItemId);

  // If it doesn't exist, return error
  if (!commercial) {
    res
      .status(404)
      .json({ message: `Commercial with ID ${mediaItemId} does not exist` });
    return;
  }

  res.status(200).json(commercial);
  return;
}

export async function getAllCommercialsHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const commercials = commercialRepository.findAll();

  res.status(200).json(commercials);
  return;
}

export async function transformCommercialFromRequest(
  commercial: any,
  mediaItemId: string,
): Promise<Commercial> {
  let parsedCommercial: Commercial = Commercial.fromRequestObject(commercial);

  parsedCommercial.mediaItemId = mediaItemId;

  if (parsedCommercial.duration > 0) {
    return parsedCommercial;
  }
  console.log(`Getting duration for ${parsedCommercial.path}`);
  let durationInSeconds = await getMediaDuration(parsedCommercial.path);
  parsedCommercial.duration = durationInSeconds; // Update duration value

  return parsedCommercial;
}
