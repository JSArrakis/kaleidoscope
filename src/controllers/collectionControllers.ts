import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import {
  Collection,
  CollectionItem,
  CollectionModel,
} from '../models/collection';
import { Movie, MovieModel } from '../models/movie';

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

  if (!req.body.id) {
    // create id from title
    req.body.id = req.body.title.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  }

  const collection = await CollectionModel.findOne({ ID: req.body.id });

  if (collection) {
    res.status(400).json({ message: 'Collection already exists' });
    return;
  }

  const items = req.body.items.map((item: any) => {
    return CollectionItem.fromRequestObject(item);
  });

  const movies = await MovieModel.find({
    LoadTitle: { $in: items.map((item: any) => item.MediaItemId) },
  });

  if (movies.length !== items.length) {
    const missingMovies = items.filter((item: any) => {
      return !movies.some((movie: any) => movie.LoadTitle === item.MediaItemId);
    });
    res.status(400).json({ message: 'Movies not found', missingMovies });
    return;
  }
    
    await CollectionModel.create(Collection.fromRequestObject(req.body));
    
    //TODO: update all movies by adding a CollectionReference Object to the movie Collections array

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

  if (!req.body.id) {
    res.status(400).json({ message: 'ID is required' });
    return;
  }

  const collection = await CollectionModel.findOne({ ID: req.body.id });

  if (!collection) {
    res.status(400).json({ message: 'Collection does not exist' });
    return;
  }

  await CollectionModel.deleteOne({ ID: req.body.id });

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

  if (!req.body.id) {
    res.status(400).json({ message: 'ID is required' });
    return;
  }

  const collection = await CollectionModel.findOne({ ID: req.body.id });

  if (!collection) {
    res.status(400).json({ message: 'Collection does not exist' });
    return;
  }

  await CollectionModel.updateOne(
    { ID: req.body.id },
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

  if (!req.query.id) {
    req.body.id = req.body.title.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  }

  const collection = await CollectionModel.findOne({
    ID: req.query.id,
  });

  if (!collection) {
    res.status(400).json({ message: 'Collection does not exist' });
    return;
  }

  res.status(200).json(collection);
  return;
}
