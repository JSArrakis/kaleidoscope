import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { MovieModel, Movie, CollectionReference } from '../models/movie';
import { LoadTitleError } from '../models/loadTitleError';
import { createMediaValidation } from '../middleware/validationMiddleware';
import { getMediaDuration } from '../utils/utilities';
import { Collection, CollectionModel } from '../models/collection';

// ===========================================
//               MOVIE HANDLERS
// ===========================================

export async function createMovieHandler(
  req: Request,
  res: Response,
): Promise<void> {
  console.log('NEW CREATE MOVIE REQUEST');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  let mediaItemId = req.body.path.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  const movie = await MovieModel.findOne({ mediaItemId: mediaItemId });

  if (movie) {
    res.status(400).json({
      message: `The Media Item ID you selected for '${req.body.title}' already exists.`,
    });
    return;
  }
  let createdMovie = await transformMovieFromRequest(req.body, mediaItemId);

  await MovieModel.create(createdMovie);

  res.status(200).json({ message: 'Movie Created' });
  return;
}

export async function bulkCreateMovieHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  if (!Array.isArray(req.body)) {
    res.status(400).json({ message: 'Request body must be an array' });
    return;
  }
  if (!req.body.every((item: any) => typeof item === 'object')) {
    res
      .status(400)
      .json({ message: 'Request body must be an array of movie objects' });
    return;
  }
  let createdMovies: string[] = [];
  let responseErrors: LoadTitleError[] = [];
  for (const movieEntry of req.body) {
    let err = createMediaValidation(movieEntry);
    if (err !== '') {
      responseErrors.push(new LoadTitleError(movieEntry.title, err));
      continue;
    }
    let mediaItemId = movieEntry.path
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase();
    try {
      const movie = await MovieModel.findOne({ mediaItemId: mediaItemId });
      if (movie) {
        responseErrors.push(
          new LoadTitleError(
            mediaItemId,
            `Movie ${movieEntry.title} already exists`,
          ),
        );
        continue;
      }

      let createdMovie = await transformMovieFromRequest(
        movieEntry,
        mediaItemId,
      );

      await MovieModel.create(createdMovie);
      createdMovies.push(createdMovie.mediaItemId);
    } catch (err) {
      responseErrors.push(new LoadTitleError(mediaItemId, err as string));
    }
  }

  if (responseErrors.length === req.body.length) {
    res.status(400).json({
      message: 'Movies Not Created',
      createdMovies: [],
      errors: responseErrors,
    });
    return;
  }

  res.status(200).json({
    message: 'Movies Created',
    createdMovies: createdMovies,
    errors: responseErrors,
  });
  return;
}

export async function deleteMovieHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const movie = await MovieModel.findOne({
    mediaItemId: req.query.mediaItemId,
  });

  if (!movie) {
    res.status(400).json({ message: 'Movie does not exist' });
    return;
  }

  const items = Array.isArray(movie.collections) ? movie.collections : [];

  if (items.length > 0) {
    const mappedItems: CollectionReference[] = items.map((item: any) =>
      CollectionReference.fromRequestObject(item),
    );

    const collections: Collection[] = await CollectionModel.find({
      mediaItemId: { $in: mappedItems.map((item: any) => item.mediaItemId) },
    });
    if (collections.length !== mappedItems.length) {
      const missingCollections = mappedItems.filter((item: any) => {
        return !collections.some(
          (movie: any) => movie.mediaItemId === item.mediaItemId,
        );
      });
      res
        .status(400)
        .json({ message: 'Collections not found', missingCollections });
      return;
    }

    // Update each movie to include the collection
    for (const collection of collections) {
      let newCollectionItems = [...collection.items];

      newCollectionItems = newCollectionItems.filter(
        collectionItem => collectionItem.mediaItemId !== req.query.mediaItemId,
      );
      await CollectionModel.updateOne(
        { mediaItemId: collection.mediaItemId },
        {
          items: newCollectionItems,
        },
      );
    }
  }

  await MovieModel.deleteOne({ _id: movie._id });

  res.status(200).json({ message: 'Movie Deleted' });
  return;
}

export async function updateMovieHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const movie = await MovieModel.findOne({
    mediaItemId: req.body.mediaItemId,
  });
  if (!movie) {
    res.status(400).json({ message: 'Movie does not exist' });
    return;
  }
  const items = Array.isArray(movie.collections) ? movie.collections : [];

  if (items.length > 0) {
    const mappedItems: CollectionReference[] = items.map((item: any) =>
      CollectionReference.fromRequestObject(item),
    );

    const collections = await CollectionModel.find({
      mediaItemId: { $in: mappedItems.map((item: any) => item.mediaItemId) },
    });

    if (collections.length !== mappedItems.length) {
      const missingCollections = mappedItems.filter((item: any) => {
        return !collections.some(
          (movie: any) => movie.mediaItemId === item.mediaItemId,
        );
      });
      res
        .status(400)
        .json({ message: 'Collections not found', missingCollections });
      return;
    }

    for (const collection of collections) {
      let newCollectionItems = [...collection.items];

      const collectionItem = newCollectionItems.find(
        item => item.mediaItemId === req.body.mediaItemId,
      );
      if (!collectionItem) {
        res.status(400).json({ message: 'Collection Item not found' });
        return;
      }

      newCollectionItems = newCollectionItems.filter(
        collectionItem => collectionItem.mediaItemId !== req.body.mediaItemId,
      );

      newCollectionItems.push({
        mediaItemId: req.body.mediaItemId,
        mediaItemTitle: req.body.title,
        sequence: collectionItem.sequence,
      });

      await CollectionModel.updateOne(
        { mediaItemId: collection.mediaItemId },
        {
          items: newCollectionItems,
        },
      );
    }
  }

  await MovieModel.updateOne(
    { _id: movie._id },
    Movie.fromRequestObject(req.body),
  );

  res.status(200).json({ message: 'Movie Updated' });
  return;
}

export async function getMovieHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const movie = await MovieModel.findOne({
    mediaItemId: req.query.mediaItemId,
  });

  if (!movie) {
    res.status(404).json({ message: 'Movie does not exist' });
    return;
  }

  res.status(200).json(movie);
  return;
}

export async function getAllMoviesHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const movies = await MovieModel.find();

  res.status(200).json(movies);
  return;
}

async function transformMovieFromRequest(
  movie: any,
  mediaItemId: string,
): Promise<Movie> {
  let parsedMovie: Movie = Movie.fromRequestObject(movie);

  parsedMovie.mediaItemId = mediaItemId;

  parsedMovie.alias =
    parsedMovie.alias ?? parsedMovie.title.replace(/[^a-zA-Z0-9]/g, '');

  if (parsedMovie.duration > 0) {
    return parsedMovie;
  }
  let durationInSeconds = await getMediaDuration(parsedMovie.path);
  parsedMovie.duration = durationInSeconds;
  parsedMovie.durationLimit =
    Math.floor(parsedMovie.duration / 1800) * 1800 +
    (parsedMovie.duration % 1800 > 0 ? 1800 : 0);

  return parsedMovie;
}
