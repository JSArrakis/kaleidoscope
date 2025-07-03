import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { MusicGenreModel } from '../models/tag';

// ===========================================
//            MUSICAL TAG HANDLERS
// ===========================================

export async function createMusicGenreHandler(
  req: Request,
  res: Response,
): Promise<void> {
  // Check for validation errors
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const musicalGenre = await MusicGenreModel.findOne({
    tagId: req.body.tagId,
  });

  // If it exists, return error
  if (musicalGenre) {
    res.status(400).json({
      message: `Show with mediaItemId : ${req.body.tagId} already exists`,
    });
    return;
  }

  // Insert show into MongoDB
  await MusicGenreModel.create(req.body);

  res.status(200).json({ message: 'Musical Genre Created' });
  return;
}

export async function deleteMusicGenreHandler(
  req: Request,
  res: Response,
): Promise<void> {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  // Retrieve music genre from MongoDB using music load title if it exists
  const musicGenre = await MusicGenreModel.findOne({
    tagId: req.query.tagId,
  });

  // If it doesn't exist, return error
  if (!musicGenre) {
    res.status(400).json({ message: 'Music Genre does not exist' });
    return;
  }

  // If it exists, delete it
  await MusicGenreModel.deleteOne({ _id: musicGenre._id });

  res.status(200).json({ message: 'Music Genre Deleted' });
  return;
}

export async function getAllMusicGenresHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const musicGenres = await MusicGenreModel.find();

  res.status(200).json(musicGenres);
  return;
}
