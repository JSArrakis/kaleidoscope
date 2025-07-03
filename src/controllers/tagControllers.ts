import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import {
  AestheticTagModel,
  EraTagModel,
  GenreTagModel,
  SpecialtyTagModel,
} from '../models/tag';
import { AgeGroupModel } from '../models/ageGroup';
import { HolidayModel } from '../models/holiday';

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

export async function createAgeGroupHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const tag = await AgeGroupModel.findOne({ tagId: req.body.tagId });

  if (tag) {
    res.status(400).json({ message: 'Tag already exists' });
    return;
  }

  await AgeGroupModel.create(req.body);

  res.status(200).json({ message: 'Tag Created' });
  return;
}

export async function updateAgeGroupHandler(
  req: Request,
  res: Response,
): Promise<void> {2
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  // Retrieve promo from MongoDB using promo load title if it exists
  const ageGroup = await AgeGroupModel.findOne({
    tagId: req.body.tagId,
  });

  // If it doesn't exist, return error
  if (!ageGroup) {
    res.status(400).json({ message: 'Promo does not exist' });
    return;
  }

  // Update promo in MongoDB
  await AgeGroupModel.updateOne({ _id: ageGroup._id }, req.body);

  res.status(200).json({ message: 'Promo Updated' });
  return;
}

export async function deleteAgeGroupHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const tag = await AgeGroupModel.findOne({ tagId: req.query.tagId });

  if (!tag) {
    res.status(400).json({ message: 'Tag does not exist' });
    return;
  }

  await AgeGroupModel.deleteOne({ tagId: req.query.tagId });

  res.status(200).json({ message: 'Tag Deleted' });
  return;
}

export async function getAllAgeGroupsHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const tags = await AgeGroupModel.find();

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

  const tag = await HolidayModel.findOne({ tagId: req.body.tagId });

  if (tag) {
    res.status(400).json({ message: 'Tag already exists' });
    return;
  }

  await HolidayModel.create(req.body);

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

  const tag = await HolidayModel.findOne({ tagId: req.query.tagId });

  if (!tag) {
    res.status(400).json({ message: 'Tag does not exist' });
    return;
  }

  await HolidayModel.deleteOne({ tagId: req.query.tagId });

  res.status(200).json({ message: 'Tag Deleted' });
  return;
}

export async function getAllHolidayTagsHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const tags = await HolidayModel.find();

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

  await SpecialtyTagModel.create({
    tagId: req.body.tagId,
    name: req.body.name,
  });

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
