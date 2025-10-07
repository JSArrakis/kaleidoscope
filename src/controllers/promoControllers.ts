import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Promo } from '../models/promo';
import { getMediaDuration } from '../utils/utilities';
import { promoRepository } from '../repositories/promoRepository';

export async function createPromoHandler(
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

  // Retrieve promo from MongoDB using promo load title if it exists
  const promo = promoRepository.findByMediaItemId(mediaItemId);

  // If it exists, return error
  if (promo) {
    res
      .status(400)
      .json({ message: `Promo with ID ${mediaItemId} already exists` });
    return;
  }
  // If it doesn't exist, perform transformations
  try {
    let transformedPromo = await transformPromoFromRequest(
      req.body,
      mediaItemId,
    );
    // Insert promo into database
    promoRepository.create(transformedPromo);
    res
      .status(200)
      .json({ message: `Promo ${transformedPromo.title} Created` });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(400).json({ message: errorMessage });
  }
  return;
}

export async function deletePromoHandler(
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

  // Retrieve promo from MongoDB using promo load title if it exists
  const promo = promoRepository.findByMediaItemId(mediaItemId);

  // If it doesn't exist, return error
  if (!promo) {
    res
      .status(400)
      .json({ message: `Promo with ID ${mediaItemId} does not exist` });
    return;
  }

  // If it exists, delete it
  promoRepository.delete(mediaItemId);

  res.status(200).json({ message: `Promo ${promo.title} Deleted` });
  return;
}

export async function updatePromoHandler(
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

  // Retrieve promo from MongoDB using promo load title if it exists
  const promo = promoRepository.findByMediaItemId(mediaItemId);

  // If it doesn't exist, return error
  if (!promo) {
    res
      .status(400)
      .json({ message: `Promo with ID ${mediaItemId} does not exist` });
    return;
  }

  // If it exists, perform transformations
  try {
    let updatedPromo = await transformPromoFromRequest(
      req.body,
      promo.mediaItemId,
    );
    // Update promo in database
    promoRepository.update(mediaItemId, updatedPromo);
    res.status(200).json({ message: `Promo ${updatedPromo.title} Updated` });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(400).json({ message: errorMessage });
  }
  return;
}

export async function getPromoHandler(
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

  // Retrieve promo from MongoDB using promo load title if it exists using request params
  const promo = promoRepository.findByMediaItemId(mediaItemId);

  // If it doesn't exist, return error
  if (!promo) {
    res
      .status(404)
      .json({ message: `Promo with ID ${mediaItemId} does not exist` });
    return;
  }

  res.status(200).json(promo);
  return;
}

export async function getAllPromosHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const promos = promoRepository.findAll();

  res.status(200).json(promos);
  return;
}

export async function transformPromoFromRequest(
  promo: any,
  mediaItemId: string,
): Promise<Promo> {
  let parsedPromo: Promo = await Promo.fromRequestObject(promo);

  parsedPromo.mediaItemId = mediaItemId;

  if (parsedPromo.duration > 0) {
    return parsedPromo;
  }

  try {
    console.log(`Getting duration for ${parsedPromo.path}`);
    let durationInSeconds = await getMediaDuration(parsedPromo.path);
    parsedPromo.duration = durationInSeconds; // Update duration value
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Cannot process promo "${parsedPromo.title}": ${errorMessage}`,
    );
  }

  return parsedPromo;
}
