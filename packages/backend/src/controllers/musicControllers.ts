import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Music } from '../models/music';
import { getMediaDuration } from '../utils/utilities';
import { musicRepository } from '../repositories/musicRepository';

export async function createMusicHandler(
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

  // Retrieve music from MongoDB using music load title if it exists
  const music = musicRepository.findByMediaItemId(mediaItemId);

  // If it exists, return error
  if (music) {
    res
      .status(400)
      .json({ message: `Music Video with ID ${mediaItemId} already exists` });
    return;
  }
  // If it doesn't exist, perform transformations
  try {
    let transformedMusic = await transformMusicFromRequest(
      req.body,
      mediaItemId,
    );
    // Insert music into database
    musicRepository.create(transformedMusic);
    res
      .status(200)
      .json({ message: `Music Video ${transformedMusic.title} Created` });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(400).json({ message: errorMessage });
  }
  return;
}

export async function deleteMusicHandler(
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

  // Retrieve music from MongoDB using music load title if it exists
  const music = musicRepository.findByMediaItemId(mediaItemId);

  // If it doesn't exist, return error
  if (!music) {
    res
      .status(400)
      .json({ message: `Music Video with ID ${mediaItemId} does not exist` });
    return;
  }

  // If it exists, delete it
  musicRepository.delete(mediaItemId);

  res.status(200).json({ message: 'Music Deleted' });
  return;
}

export async function updateMusicHandler(
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

  // Retrieve music from MongoDB using music load title if it exists
  const music = musicRepository.findByMediaItemId(mediaItemId);

  // If it doesn't exist, return error
  if (!music) {
    res
      .status(400)
      .json({ message: `Music Video with ID ${mediaItemId} does not exist` });
    return;
  }

  // If it exists, perform transformations
  try {
    let updatedMusic = await transformMusicFromRequest(
      req.body,
      music.mediaItemId,
    );
    // Update music in database
    musicRepository.update(mediaItemId, updatedMusic);
    res
      .status(200)
      .json({ message: `Music Video ${updatedMusic.title} Updated` });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(400).json({ message: errorMessage });
  }
  return;
}

export async function getMusicHandler(
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

  // Retrieve music from MongoDB using music load title if it exists using request params
  const music = musicRepository.findByMediaItemId(mediaItemId);

  // If it doesn't exist, return error
  if (!music) {
    res
      .status(404)
      .json({ message: `Music Video with ID ${mediaItemId} does not exist` });
    return;
  }

  res.status(200).json(music);
  return;
}

export async function getAllMusicHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const music = musicRepository.findAll();

  res.status(200).json(music);
  return;
}

export async function transformMusicFromRequest(
  music: any,
  mediaItemId: string,
): Promise<Music> {
  let parsedMusic: Music = await Music.fromRequestObject(music);

  parsedMusic.mediaItemId = mediaItemId;

  if (parsedMusic.duration > 0) {
    return parsedMusic;
  }

  try {
    console.log(`Getting duration for ${parsedMusic.path}`);
    let durationInSeconds = await getMediaDuration(parsedMusic.path);
    parsedMusic.duration = durationInSeconds; // Update duration value
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Cannot process music "${parsedMusic.title}": ${errorMessage}`,
    );
  }

  return parsedMusic;
}
