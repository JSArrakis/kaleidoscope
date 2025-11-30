import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { tagRepository } from '../repositories/tagsRepository';
import { isValidTagType, TagType } from '../models/const/tagTypes';
import { Tag } from '../models/tag';
import { parseToISODateTime } from '../utils/utilities';

/**
 * Convert MM-DD format to ISO datetime format for holiday season dates
 */
function convertHolidayDatesForDatabase(requestBody: any): any {
  const processedBody = { ...requestBody };

  // Only process if this is a Holiday tag
  if (processedBody.type === TagType.Holiday) {
    // Convert seasonStartDate from MM-DD to YYYY-MM-DD HH:MM:SS
    if (
      processedBody.seasonStartDate &&
      typeof processedBody.seasonStartDate === 'string'
    ) {
      processedBody.seasonStartDate = parseToISODateTime(
        processedBody.seasonStartDate,
        '00:00:00',
      );
    }

    // Convert seasonEndDate from MM-DD to YYYY-MM-DD HH:MM:SS
    if (
      processedBody.seasonEndDate &&
      typeof processedBody.seasonEndDate === 'string'
    ) {
      processedBody.seasonEndDate = parseToISODateTime(
        processedBody.seasonEndDate,
        '23:59:59',
      );
    }
  }

  return processedBody;
}

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
    // Convert MM-DD dates to ISO datetime format for Holiday tags
    const processedBody = convertHolidayDatesForDatabase(req.body);

    const tagObject = Tag.fromRequestObject(processedBody);
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
