import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { tagRepository } from '../repositories/tagsRepository';
import { isValidTagType } from '../models/const/tagTypes';
import { Tag } from '../models/tag';

export async function createTagHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  let tagId = req.body.tagId;
  if (!tagId) {
    res.status(400).json({ message: 'tagId is required' });
    return;
  }

  let type = req.body.type;
  if (!type) {
    res.status(400).json({ message: 'type is required' });
    return;
  }

  // Validate type against known tag types
  if (!isValidTagType(type)) {
    res.status(400).json({ message: `Invalid tag type: ${type}` });
    return;
  }

  const tag = tagRepository.findByTagId(tagId);

  if (tag) {
    res.status(400).json({ message: `Tag with ID ${tagId} already exists` });
    return;
  }

  try {
    const tagObject = Tag.fromRequestObject(req.body);
    tagRepository.create(tagObject);
    res.status(200).json({ message: `Tag ${req.body.name} Created` });
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      res.status(400).json({ message: error.message });
    } else {
      console.error('Error creating tag:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
  return;
}

export async function deleteTagHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  let tagId = req.query.tagId as string;
  if (!tagId) {
    res.status(400).json({ message: 'tagId is required' });
    return;
  }

  const tag = tagRepository.findByTagId(tagId);

  if (!tag) {
    res.status(400).json({ message: `Tag with ID ${tagId} does not exist` });
    return;
  }

  tagRepository.delete(tagId);

  res.status(200).json({ message: `Tag ${tag.name} Deleted` });
  return;
}

export async function getTagHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  let tagId = req.query.tagId as string;
  if (!tagId) {
    res.status(400).json({ message: 'tagId is required' });
    return;
  }

  const tag = tagRepository.findByTagId(tagId);

  if (!tag) {
    res.status(404).json({ message: `Tag with ID ${tagId} does not exist` });
    return;
  }

  res.status(200).json(tag);
  return;
}

export async function getAllTagsByTypeHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  let type = req.query.type as string;
  if (!type) {
    res.status(400).json({ message: 'type is required' });
    return;
  }

  // Validate type against known tag types
  if (!isValidTagType(type)) {
    res.status(400).json({ message: `Invalid tag type: ${type}` });
    return;
  }

  const tags = await tagRepository.findByType(type);

  if (tags.length === 0) {
    res.status(404).json({ message: `No tags found for type ${type}` });
    return;
  }

  res.status(200).json(tags);
  return;
}

export async function getAllTagsHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const tags = await tagRepository.findAll();

  res.status(200).json(tags);
  return;
}
