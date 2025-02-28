import { Request, Response } from 'express';
import { validationResult } from 'express-validator';

export async function createCollectionHandler(
  req: Request,
  res: Response,
): Promise<void> {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  // Insert collection into MongoDB
  // await CollectionModel.create(req.body);

  res.status(200).json({ message: 'Collection Created' });
  return;
}
