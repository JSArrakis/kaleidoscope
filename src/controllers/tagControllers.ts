import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import {
  AestheticTagModel,
  AgeGroupTagModel,
  EraTagModel,
  GenreTagModel,
  HolidayTagModel,
  SpecialtyTagModel,
} from '../models/tag';

// Aesthetic Tag Management

export async function createAestheticTagHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const tag = await AestheticTagModel.findOne({ tagId: req.body.tagId });

  if (tag) {
    res.status(400).json({ message: 'Tag already exists' });
    return;
  }

  await AestheticTagModel.create({
    tagId: req.body.tagId,
    name: req.body.name,
  });

  res.status(200).json({ message: 'Tag Created' });
  return;
}

export async function deleteAestheticTagHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const tag = await AestheticTagModel.findOne({ tagId: req.query.tagId });

  if (!tag) {
    res.status(400).json({ message: 'Tag does not exist' });
    return;
  }

  await AestheticTagModel.deleteOne({ tagId: req.query.tagId });

  res.status(200).json({ message: 'Tag Deleted' });
  return;
}

export async function getAllAestheticTagsHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const tags = await AestheticTagModel.find({});

  res.status(200).json(tags);
  return;
}

// Age Group Tag Management

export async function createAgeGroupTagHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const tag = await AgeGroupTagModel.findOne({ tagId: req.body.tagId });

  if (tag) {
    res.status(400).json({ message: 'Tag already exists' });
    return;
  }

  await AgeGroupTagModel.create({ tagId: req.body.tagId, name: req.body.name });

  res.status(200).json({ message: 'Tag Created' });
  return;
}

export async function deleteAgeGroupTagHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const tag = await AgeGroupTagModel.findOne({ tagId: req.query.tagId });

  if (!tag) {
    res.status(400).json({ message: 'Tag does not exist' });
    return;
  }

  await AgeGroupTagModel.deleteOne({ tagId: req.query.tagId });

  res.status(200).json({ message: 'Tag Deleted' });
  return;
}

export async function getAllAgeGroupTagsHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const tags = await AgeGroupTagModel.find({});

  res.status(200).json(tags);
  return;
}

// Era Tag Management

export async function createEraTagHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const tag = await EraTagModel.findOne({ tagId: req.body.tagId });

  if (tag) {
    res.status(400).json({ message: 'Tag already exists' });
    return;
  }

  await EraTagModel.create({ tagId: req.body.tagId, name: req.body.name });

  res.status(200).json({ message: 'Tag Created' });
  return;
}

export async function deleteEraTagHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const tag = await EraTagModel.findOne({ tagId: req.query.tagId });

  if (!tag) {
    res.status(400).json({ message: 'Tag does not exist' });
    return;
  }

  await EraTagModel.deleteOne({ tagId: req.query.tagId });

  res.status(200).json({ message: 'Tag Deleted' });
  return;
}

export async function getAllEraTagsHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const tags = await EraTagModel.find({});

  res.status(200).json(tags);
  return;
}

// Holiday Tag Management

export async function createHolidayTagHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const tag = await HolidayTagModel.findOne({ tagId: req.body.tagId });

  if (tag) {
    res.status(400).json({ message: 'Tag already exists' });
    return;
  }

  await HolidayTagModel.create({ tagId: req.body.tagId, name: req.body.name });

  res.status(200).json({ message: 'Tag Created' });
  return;
}

export async function deleteHolidayTagHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const tag = await HolidayTagModel.findOne({ tagId: req.query.tagId });

  if (!tag) {
    res.status(400).json({ message: 'Tag does not exist' });
    return;
  }

  await HolidayTagModel.deleteOne({ tagId: req.query.tagId });

  res.status(200).json({ message: 'Tag Deleted' });
  return;
}

export async function getAllHolidayTagsHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const tags = await HolidayTagModel.find({});

  res.status(200).json(tags);
  return;
}

// Genre Tag Management

export async function createGenreTagHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const tag = await GenreTagModel.findOne({ tagId: req.body.tagId });

  if (tag) {
    res.status(400).json({ message: 'Tag already exists' });
    return;
  }

  await GenreTagModel.create({ tagId: req.body.tagId, name: req.body.name });

  res.status(200).json({ message: 'Tag Created' });
  return;
}

export async function deleteGenreTagHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const tag = await GenreTagModel.findOne({ tagId: req.query.tagId });

  if (!tag) {
    res.status(400).json({ message: 'Tag does not exist' });
    return;
  }

  await GenreTagModel.deleteOne({ tagId: req.query.tagId });

  res.status(200).json({ message: 'Tag Deleted' });
  return;
}

export async function getAllGenreTagsHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const tags = await GenreTagModel.find({});

  res.status(200).json(tags);
  return;
}

// Specialty Tag Management

export async function createSpecialtyTagHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const tag = await SpecialtyTagModel.findOne({ tagId: req.body.tagId });

  if (tag) {
    res.status(400).json({ message: 'Tag already exists' });
    return;
  }

  await SpecialtyTagModel.create({ tagId: req.body.tagId, name: req.body.name });

  res.status(200).json({ message: 'Tag Created' });
  return;
}

export async function deleteSpecialtyTagHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const tag = await SpecialtyTagModel.findOne({ tagId: req.query.tagId });

  if (!tag) {
    res.status(400).json({ message: 'Tag does not exist' });
    return;
  }

  await SpecialtyTagModel.deleteOne({ tagId: req.query.tagId });

  res.status(200).json({ message: 'Tag Deleted' });
  return;
}

export async function getAllSpecialtyTagsHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const tags = await SpecialtyTagModel.find({});

  res.status(200).json(tags);
  return;
}
