import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { CommercialModel, Commercial } from '../models/commercial';
import { LoadTitleError } from '../models/loadTitleError';
import { createMediaValidation } from '../middleware/validationMiddleware';
import { getMediaDuration } from '../utils/utilities';

// ===========================================
//            COMMERCIAL HANDLERS
// ===========================================

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

  let mediaItemId = req.body.path.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  // Retrieve commercial from MongoDB using commercial load title if it exists
  const commercial = await CommercialModel.findOne({ mediaItemId: mediaItemId });

  // If it exists, return error
  if (commercial) {
    res.status(400).json({ message: 'Commercial already exists' });
    return;
  }
  // If it doesn't exist, perform transformations
  let transformedComm = await transformCommercialFromRequest(
    req.body,
    mediaItemId,
  );

  // Insert commercial into MongoDB
  await CommercialModel.create(transformedComm);

  res.status(200).json({ message: 'Commercial Created' });
  return;
}

export async function bulkCreateCommercialHandler(
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
      .json({ message: 'Request body must be an array of commercial objects' });
    return;
  }
  let createdCommercials: string[] = [];
  let responseErrors: LoadTitleError[] = [];
  for (const commercialEntry of req.body) {
    let err = createMediaValidation(commercialEntry);
    if (err !== '') {
      responseErrors.push(new LoadTitleError(commercialEntry.mediaItemId, err));
      continue;
    }
    try {
      let mediaItemId = commercialEntry.path
        .replace(/[^a-zA-Z0-9]/g, '')
        .toLowerCase();
      const commercial = await CommercialModel.findOne({
        mediaItemId: mediaItemId,
      });
      if (commercial) {
        // If it exists, return error
        responseErrors.push(
          new LoadTitleError(
            commercialEntry.title,
            `Commercial ${commercialEntry.mediaItemId} already exists`,
          ),
        );
        continue;
      }

      let transformedComm = await transformCommercialFromRequest(
        commercialEntry,
        mediaItemId,
      );

      await CommercialModel.create(transformedComm);
      createdCommercials.push(transformedComm.mediaItemId);
    } catch (err) {
      responseErrors.push(
        new LoadTitleError(commercialEntry.mediaItemId, err as string),
      );
    }
  }

  if (responseErrors.length === req.body.length) {
    res.status(400).json({
      message: 'Commercials Not Created',
      createdCommercials: [],
      errors: responseErrors,
    });
    return;
  }

  res.status(200).json({
    message: 'Commercials Created',
    createdCommercials: createdCommercials,
    errors: responseErrors,
  });
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

  // Retrieve commercial from MongoDB using commercial load title if it exists
  const commercial = await CommercialModel.findOne({
    mediaItemId: req.query.mediaItemId,
  });

  // If it doesn't exist, return error
  if (!commercial) {
    res.status(400).json({ message: 'Commercial does not exist' });
    return;
  }

  // If it exists, delete it
  await CommercialModel.deleteOne({ _id: commercial._id });

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

  // Retrieve commercial from MongoDB using commercial load title if it exists
  const commercial = await CommercialModel.findOne({ path: req.body.path });

  // If it doesn't exist, return error
  if (!commercial) {
    res.status(400).json({ message: 'Commercial does not exist' });
    return;
  }

  // If it exists, perform transformations
  let updatedCommercial = await transformCommercialFromRequest(
    req.body,
    commercial.mediaItemId,
  );

  // Update commercial in MongoDB
  await CommercialModel.updateOne({ _id: commercial._id }, updatedCommercial);

  res.status(200).json({ message: 'Commercial Updated' });
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

  // Retrieve commercial from MongoDB using commercial load title if it exists using request params
  const commercial = await CommercialModel.findOne({
    mediaItemId: req.query.mediaItemId,
  });

  // If it doesn't exist, return error
  if (!commercial) {
    res.status(404).json({ message: 'Commercial does not exist' });
    return;
  }

  res.status(200).json(commercial);
  return;
}

export async function getAllCommercialsHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const commercials = await CommercialModel.find({});

  if (!commercials || commercials.length === 0) {
    res.status(404).json({ message: 'No Commercials Found' });
    return;
  }
  res.status(200).json(commercials);
  return;
}

// ===========================================
//        DEFAULT COMMERCIAL HANDLERS
// ===========================================

export async function getAllDefaultCommercialsHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const commercials = await CommercialModel.find({});

  if (!commercials || commercials.length === 0) {
    res.status(404).json({ message: 'No Default Commercials Found' });
    return;
  }
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
