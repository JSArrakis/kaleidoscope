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
  try {
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
      req.body.mediaItemId = req.body.title
        .replace(/[^a-zA-Z0-9]/g, '')
        .toLowerCase();
    }

    const existingCollection = await CollectionModel.findOne({
      mediaItemId: req.body.mediaItemId,
    });

    if (existingCollection) {
      res.status(400).json({ message: 'Collection already exists' });
      return;
    }

    const items = Array.isArray(req.body.items) ? req.body.items : [];

    if (items.length > 0) {
      const mappedItems: CollectionItem[] = items.map((item: any) =>
        CollectionItem.fromRequestObject(item),
      );

      const movies = await MovieModel.find({
        mediaItemId: { $in: mappedItems.map((item: any) => item.mediaItemId) },
      });

      if (movies.length !== mappedItems.length) {
        const missingMovies = mappedItems.filter((item: any) => {
          return !movies.some(
            (movie: any) => movie.mediaItemId === item.mediaItemId,
          );
        });
        res.status(400).json({ message: 'Movies not found', missingMovies });
        return;
      }

      for (const item of mappedItems) {
        const movie = await MovieModel.findOne({
          mediaItemId: item.mediaItemId,
        });

        if (!movie) {
          res.status(400).json({ message: 'Movie not found' });
          return;
        }
        let newCollections = [...movie.collections];

        newCollections = newCollections.filter(
          collection => collection.mediaItemId !== req.body.mediaItemId,
        );
        newCollections.push({
          mediaItemId: req.body.mediaItemId,
          title: req.body.title,
          sequence: item.sequence,
        });

        await MovieModel.updateOne(
          { mediaItemId: item.mediaItemId },
          {
            collections: newCollections,
          },
        );
      }
    }

    await CollectionModel.create([Collection.fromRequestObject(req.body)]);

    res.status(200).json({ message: 'Collection Created' });
  } catch (error) {
    console.error('Operation failed:', error);
    res.status(500).json({ message: 'Failed to create collection', error });
  }
}

export async function deleteCollectionHandler(
  req: Request,
  res: Response,
): Promise<void> {
  try {
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

    const mappedItems: CollectionItem[] = collection.items.map((item: any) =>
      CollectionItem.fromRequestObject(item),
    );

    const movies = await MovieModel.find({
      mediaItemId: { $in: mappedItems.map((item: any) => item.mediaItemId) },
    });

    if (movies.length !== mappedItems.length) {
      const missingMovies = mappedItems.filter((item: any) => {
        return !movies.some(
          (movie: any) => movie.mediaItemId === item.mediaItemId,
        );
      });
      res.status(400).json({ message: 'Movies not found', missingMovies });
      return;
    }

    for (const item of mappedItems) {
      const movie = await MovieModel.findOne({
        mediaItemId: item.mediaItemId,
      });

      if (!movie) {
        res.status(400).json({ message: 'Movie not found' });
        return;
      }
      let newCollections = [...movie.collections];

      newCollections = newCollections.filter(
        collection => collection.mediaItemId !== req.query.mediaItemId,
      );

      await MovieModel.updateOne(
        { mediaItemId: item.mediaItemId },
        {
          collections: newCollections,
        },
      );
    }

    await CollectionModel.deleteOne({ _id: collection._id });

    res.status(200).json({ message: 'Collection Deleted' });
  } catch (error) {
    console.error('Operation failed:', error);
    res.status(500).json({ message: 'Failed to delete collection', error });
  }
}

export async function updateCollectionHandler(
  req: Request,
  res: Response,
): Promise<void> {
  try {
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

    const items = Array.isArray(req.body.items) ? req.body.items : [];

    if (items.length > 0) {
      const mappedItems: CollectionItem[] = items.map((item: any) =>
        CollectionItem.fromRequestObject(item),
      );

      const movies = await MovieModel.find({
        mediaItemId: { $in: mappedItems.map((item: any) => item.mediaItemId) },
      });

      if (movies.length !== mappedItems.length) {
        const missingMovies = mappedItems.filter((item: any) => {
          return !movies.some(
            (movie: any) => movie.mediaItemId === item.mediaItemId,
          );
        });
        res.status(400).json({ message: 'Movies not found', missingMovies });
        return;
      }

      for (const item of mappedItems) {
        const movie = await MovieModel.findOne({
          mediaItemId: item.mediaItemId,
        });

        if (!movie) {
          res.status(400).json({ message: 'Movie not found' });
          return;
        }
        let newCollections = [...movie.collections];

        newCollections = newCollections.filter(
          collection => collection.mediaItemId !== req.body.mediaItemId,
        );
        newCollections.push({
          mediaItemId: req.body.mediaItemId,
          title: req.body.title,
          sequence: item.sequence,
        });

        await MovieModel.updateOne(
          { mediaItemId: item.mediaItemId },
          {
            collections: newCollections,
          },
        );
      }
    }

    await CollectionModel.updateOne(
      { _id: collection._id },
      Collection.fromRequestObject(req.body),
    );

    res.status(200).json({ message: 'Collection Updated' });
  } catch (error) {
    console.error('Operation failed:', error);
    res.status(500).json({ message: 'Failed to update collection', error });
  }
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
