import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { BumperModel, Bumper } from '../models/bumper';
import { LoadTitleError } from '../models/loadTitleError';
import { createMediaValidation } from '../middleware/validationMiddleware';
import { getMediaDuration } from '../utils/utilities';

// ===========================================
//               BUMPER HANDLERS
// ===========================================

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

  // Retrieve bumper from MongoDB using bumper load title if it exists
  const bumper = await BumperModel.findOne({ mediaItemId: mediaItemId });

  // If it exists, return error
  if (bumper) {
    res.status(400).json({ message: 'Bumper already exists' });
    return;
  }
  // If it doesn't exist, perform transformations
  let transformedComm = await transformBumperFromRequest(req.body, mediaItemId);

  // Insert bumper into MongoDB
  await BumperModel.create(transformedComm);

  res.status(200).json({ message: 'Bumper Created' });
  return;
}

export async function bulkCreateBumperHandler(
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
      .json({ message: 'Request body must be an array of bumper objects' });
    return;
  }
  let createdBumpers: string[] = [];
  let responseErrors: LoadTitleError[] = [];
  for (const bumperEntry of req.body) {
    let err = createMediaValidation(bumperEntry);
    if (err !== '') {
      responseErrors.push(new LoadTitleError(bumperEntry.mediaItemId, err));
      continue;
    }
    try {
      let mediaItemId = bumperEntry.path
        .replace(/[^a-zA-Z0-9]/g, '')
        .toLowerCase();
      const bumper = await BumperModel.findOne({ mediaItemId: mediaItemId });
      if (bumper) {
        // If it exists, return error
        responseErrors.push(
          new LoadTitleError(
            bumperEntry.title,
            `Bumper ${bumperEntry.mediaItemId} already exists`,
          ),
        );
        continue;
      }

      let transformedComm = await transformBumperFromRequest(
        bumperEntry,
        mediaItemId,
      );

      await BumperModel.create(transformedComm);
      createdBumpers.push(transformedComm.mediaItemId);
    } catch (err) {
      responseErrors.push(
        new LoadTitleError(bumperEntry.mediaItemId, err as string),
      );
    }
  }

  if (responseErrors.length === req.body.length) {
    res.status(400).json({
      message: 'Bumpers Not Created',
      createdBumpers: [],
      errors: responseErrors,
    });
    return;
  }

  res.status(200).json({
    message: 'Bumpers Created',
    createdBumpers: createdBumpers,
    errors: responseErrors,
  });
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

  // Retrieve bumper from MongoDB using bumper load title if it exists
  const bumper = await BumperModel.findOne({
    mediaItemId: req.query.mediaItemId,
  });

  // If it doesn't exist, return error
  if (!bumper) {
    res.status(400).json({ message: 'Bumper does not exist' });
    return;
  }

  // If it exists, delete it
  await BumperModel.deleteOne({ _id: bumper._id });

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

  // Retrieve bumper from MongoDB using bumper load title if it exists
  const bumper = await BumperModel.findOne({ mediaItemId: req.body.mediaItemId });

  // If it doesn't exist, return error
  if (!bumper) {
    res.status(400).json({ message: 'Bumper does not exist' });
    return;
  }

  // If it exists, perform transformations
  let updatedBumper = await transformBumperFromRequest(
    req.body,
    bumper.mediaItemId,
  );

  // Update bumper in MongoDB
  await BumperModel.updateOne({ _id: bumper._id }, updatedBumper);

  res.status(200).json({ message: 'Bumper Updated' });
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

  // Retrieve bumper from MongoDB using bumper load title if it exists using request params
  const bumper = await BumperModel.findOne({
    mediaItemId: req.query.mediaItemId,
  });

  // If it doesn't exist, return error
  if (!bumper) {
    res.status(404).json({ message: 'Bumper does not exist' });
    return;
  }

  res.status(200).json(bumper);
  return;
}

export async function getAllBumpersHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const bumpers = await BumperModel.find();

  res.status(200).json(bumpers);
  return;
}

// ===========================================
//          DEFAULT PROMO HANDLERS
// ===========================================

export async function getAllDefaultBumpersHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const bumpers = await BumperModel.find({});

  if (!bumpers || bumpers.length === 0) {
    res.status(404).json({ message: 'Default No Bumpers Found' });
    return;
  }
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
