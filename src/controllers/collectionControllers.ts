import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import {
  Collection,
  CollectionItem,
  CollectionModel,
} from '../models/collection';
import { MovieModel } from '../models/movie';

// ===========================================
//            COLLECTION HANDLERS
// ===========================================

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

  if (!req.body.title) {
    res.status(400).json({ message: 'Title is required' });
    return;
  }

  if (!req.body.mediaItemId) {
    // create id from title
    req.body.mediaItemId = req.body.title
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase();
  }

  const collection = await CollectionModel.findOne({
    mediaItemId: req.body.mediaItemId,
  });

  if (collection) {
    res.status(400).json({ message: 'Collection already exists' });
    return;
  }

  const items = req.body.items.map((item: any) => {
    return CollectionItem.fromRequestObject(item);
  });

  const movies = await MovieModel.find({
    mediaItemId: { $in: items.map((item: any) => item.mediaItemId) },
  });

  if (movies.length !== items.length) {
    const missingMovies = items.filter((item: any) => {
      return !movies.some(
        (movie: any) => movie.mediaItemId === item.mediaItemId,
      );
    });
    res.status(400).json({ message: 'Movies not found', missingMovies });
    return;
  }

  await CollectionModel.create(Collection.fromRequestObject(req.body));

  items.forEach(async (item: any) => {
    await MovieModel.updateOne(
      { loadTitle: item.mediaItemId },
      {
        $push: {
          collections: {
            mediaItemId: item.mediaItemId,
            title: item.mediaItemTitle,
            sequence: item.sequence,
          },
        },
      },
    );
  });

  res.status(200).json({ message: 'Collection Created' });
  return;
}

export async function deleteCollectionHandler(
  req: Request,
  res: Response,
): Promise<void> {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  if (!req.query.mediaItemId) {
    res.status(400).json({ message: 'ID is required' });
    return;
  }

  const collection = await CollectionModel.findOne({
    mediaItemId: req.query.mediaItemId,
  });

  if (!collection) {
    res.status(400).json({ message: 'Collection does not exist' });
    return;
  }

  await CollectionModel.deleteOne({ _id: collection._id });

  res.status(200).json({ message: 'Collection Deleted' });
  return;
}

export async function updateCollectionHandler(
  req: Request,
  res: Response,
): Promise<void> {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  if (!req.body.mediaItemId) {
    res.status(400).json({ message: 'ID is required' });
    return;
  }

  const collection = await CollectionModel.findOne({
    mediaItemId: req.body.mediaItemId,
  });

  if (!collection) {
    res.status(400).json({ message: 'Collection does not exist' });
    return;
  }

  await CollectionModel.updateOne(
    { _id: collection._id },
    Collection.fromRequestObject(req.body),
  );

  res.status(200).json({ message: 'Collection Updated' });
  return;
}

export async function getCollectionHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  if (!req.query.mediaItemId) {
    req.body.mediaItemId = req.body.title
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase();
  }

  const collection = await CollectionModel.findOne({
    mediaItemId: req.query.mediaItemId,
  });

  if (!collection) {
    res.status(400).json({ message: 'Collection does not exist' });
    return;
  }

  res.status(200).json(collection);
  return;
}

export async function getAllCollectionsHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const collections = await CollectionModel.find();

  res.status(200).json(collections);
  return;
}
