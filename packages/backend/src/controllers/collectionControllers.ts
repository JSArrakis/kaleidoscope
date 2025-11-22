import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Collection, CollectionItem } from '../models/collection';
import { collectionRepository } from '../repositories/collectionRepository';
import { movieRepository } from '../repositories/movieRepository';
import { Movie } from '../models/movie';

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

    let mediaItemId = req.body.mediaItemId;

    if (!mediaItemId) {
      mediaItemId = req.body.title.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    }

    const existingCollection =
      collectionRepository.findByMediaItemId(mediaItemId);

    if (existingCollection) {
      res.status(400).json({ message: 'Collection already exists' });
      return;
    }

    const items = Array.isArray(req.body.items) ? req.body.items : [];

    if (items.length > 0) {
      const collectionItems: CollectionItem[] = items.map((item: any) =>
        CollectionItem.fromRequestObject(item),
      );

      let movies: Movie[] = [];
      for (const item of collectionItems) {
        const movie = movieRepository.findByMediaItemId(item.mediaItemId);
        if (movie) {
          movies.push(movie);
        }
      }

      if (movies.length !== collectionItems.length) {
        const missingMovies = collectionItems.filter((item: any) => {
          return !movies.some(
            (movie: any) => movie.mediaItemId === item.mediaItemId,
          );
        });
        res.status(400).json({ message: 'Movies not found', missingMovies });
        return;
      }

      for (const item of collectionItems) {
        let movie = movies.find(
          movie => movie.mediaItemId === item.mediaItemId,
        );

        if (!movie) {
          res
            .status(400)
            .json({ message: `Movie with ID ${item.mediaItemId} not found` });
          return;
        }
        let movieCollections = [...movie.collections];

        movieCollections = movieCollections.filter(
          collection => collection.mediaItemId !== req.body.mediaItemId,
        );
        movieCollections.push({
          mediaItemId: req.body.mediaItemId,
          title: req.body.title,
          sequence: item.sequence,
        });

        movie.collections = movieCollections;

        movieRepository.update(movie.mediaItemId, movie);
      }
    }

    const newCollection = await transformCollectionFromRequest(
      req.body,
      mediaItemId,
    );

    collectionRepository.create(newCollection);

    res
      .status(200)
      .json({ message: `Collection ${newCollection.title} Created` });
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

    let mediaItemId = req.query.mediaItemId as string;

    if (!mediaItemId) {
      res.status(400).json({ message: 'ID is required' });
      return;
    }

    const collection = collectionRepository.findByMediaItemId(mediaItemId);

    if (!collection) {
      res.status(400).json({ message: 'Collection does not exist' });
      return;
    }

    const collectionItems: CollectionItem[] = collection.items.map(
      (item: any) => CollectionItem.fromRequestObject(item),
    );

    let movies: Movie[] = [];
    for (const item of collectionItems) {
      const movie = movieRepository.findByMediaItemId(item.mediaItemId);
      if (movie) {
        movies.push(movie);
      }
    }

    if (movies.length !== collectionItems.length) {
      const missingMovies = collectionItems.filter((item: any) => {
        return !movies.some(
          (movie: any) => movie.mediaItemId === item.mediaItemId,
        );
      });
      res.status(400).json({ message: 'Movies not found:', missingMovies });
      return;
    }

    for (const item of collectionItems) {
      let movie = movies.find(movie => movie.mediaItemId === item.mediaItemId);

      if (!movie) {
        res
          .status(400)
          .json({ message: `Movie with ID ${item.mediaItemId} not found` });
        return;
      }
      let movieCollections = [...movie.collections];

      movieCollections = movieCollections.filter(
        collection => collection.mediaItemId !== mediaItemId,
      );

      movie.collections = movieCollections;

      movieRepository.update(movie.mediaItemId, movie);
    }

    collectionRepository.delete(mediaItemId);

    res.status(200).json({ message: `Collection ${collection.title} Deleted` });
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

    let mediaItemId = req.body.mediaItemId;

    if (!mediaItemId) {
      res.status(400).json({ message: 'ID is required' });
      return;
    }

    let collection = collectionRepository.findByMediaItemId(mediaItemId);

    if (!collection) {
      res
        .status(400)
        .json({ message: `Collection with ID ${mediaItemId} does not exist` });
      return;
    }

    const items = Array.isArray(req.body.items) ? req.body.items : [];

    if (items.length > 0) {
      const collectionItems: CollectionItem[] = items.map((item: any) =>
        CollectionItem.fromRequestObject(item),
      );

      let movies: Movie[] = [];
      for (const item of collectionItems) {
        const movie = movieRepository.findByMediaItemId(item.mediaItemId);
        if (movie) {
          movies.push(movie);
        }
      }

      if (movies.length !== collectionItems.length) {
        const missingMovies = collectionItems.filter((item: any) => {
          return !movies.some(
            (movie: any) => movie.mediaItemId === item.mediaItemId,
          );
        });
        res.status(400).json({ message: 'Movies not found', missingMovies });
        return;
      }

      for (const item of collectionItems) {
        let movie = movies.find(
          movie => movie.mediaItemId === item.mediaItemId,
        );

        if (!movie) {
          res.status(400).json({ message: 'Movie not found' });
          return;
        }
        let movieCollections = [...movie.collections];

        movieCollections = movieCollections.filter(
          collection => collection.mediaItemId !== req.body.mediaItemId,
        );
        movieCollections.push({
          mediaItemId: req.body.mediaItemId,
          title: req.body.title,
          sequence: item.sequence,
        });

        movie.collections = movieCollections;

        movieRepository.update(movie.mediaItemId, movie);
      }
    }
    collection.items = items;
    console.log('Updating collection with items:', collection);
    collectionRepository.update(mediaItemId, collection);

    res.status(200).json({ message: `Collection ${collection.title} Updated` });
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

  let mediaItemId = req.query.mediaItemId as string;

  if (!mediaItemId) {
    res.status(400).json({ message: 'ID is required' });
    return;
  }

  const collection = collectionRepository.findByMediaItemId(mediaItemId);

  if (!collection) {
    res
      .status(400)
      .json({ message: `Collection with ID ${mediaItemId} does not exist` });
    return;
  }

  res.status(200).json(collection);
  return;
}

export async function getAllCollectionsHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const collections = collectionRepository.findAll();

  res.status(200).json(collections);
  return;
}

async function transformCollectionFromRequest(
  collection: any,
  mediaItemId: string,
): Promise<Collection> {
  let parsedCollection: Collection = Collection.fromRequestObject(collection);
  parsedCollection.mediaItemId = mediaItemId;

  if (Array.isArray(parsedCollection.items)) {
    parsedCollection.items = parsedCollection.items.map((item: any) =>
      CollectionItem.fromRequestObject(item),
    );
    console.log('PARSED COLLECTION ITEMS:', parsedCollection.items);
  } else {
    parsedCollection.items = [];
  }
  console.log('PARSED COLLECTION:', parsedCollection);
  return parsedCollection;
}
