import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Movie, CollectionReference } from '../models/movie';
import { getMediaDuration } from '../utils/utilities';
import { Collection } from '../models/collection';
import { movieRepository } from '../repositories/movieRepository';
import { collectionRepository } from '../repositories/collectionRepository';

export async function createMovieHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  let mediaItemId = req.body.mediaItemId;

  if (!mediaItemId) {
    res.status(400).json({ message: 'Media Item ID is required' });
    return;
  }

  const movie = movieRepository.findByMediaItemId(mediaItemId);

  if (movie) {
    res.status(400).json({
      message: `The Media Item ID '${mediaItemId}' already exists.`,
    });
    return;
  }
  let createdMovie = await transformMovieFromRequest(req.body, mediaItemId);

  movieRepository.create(createdMovie);

  res.status(200).json({ message: `Movie ${createdMovie.title} Created` });
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

  const movie = movieRepository.findByMediaItemId(
    req.query.mediaItemId as string,
  );

  if (!movie) {
    res.status(400).json({ message: 'Movie does not exist' });
    return;
  }

  const items = Array.isArray(movie.collections) ? movie.collections : [];

  if (items.length > 0) {
    const mappedItems: CollectionReference[] = items.map((item: any) =>
      CollectionReference.fromRequestObject(item),
    );

    // Get collections that contain this movie
    const collections: Collection[] = [];
    for (const item of mappedItems) {
      const collection = collectionRepository.findByMediaItemId(
        item.mediaItemId,
      );
      if (collection) {
        collections.push(collection);
      }
    }

    if (collections.length !== mappedItems.length) {
      const missingCollections = mappedItems.filter((item: any) => {
        return !collections.some(
          (collection: any) => collection.mediaItemId === item.mediaItemId,
        );
      });
      res
        .status(400)
        .json({ message: 'Collections not found', missingCollections });
      return;
    }

    // Update each collection to remove this movie
    for (const collection of collections) {
      let newCollectionItems = [...collection.items];

      newCollectionItems = newCollectionItems.filter(
        collectionItem => collectionItem.mediaItemId !== req.query.mediaItemId,
      );

      const updatedCollection = new Collection(
        collection.mediaItemId,
        collection.title,
        collection.description,
        newCollectionItems,
      );

      collectionRepository.update(collection.mediaItemId, updatedCollection);
    }
  }

  movieRepository.delete(req.query.mediaItemId as string);

  res.status(200).json({ message: `Movie ${movie.title} Deleted` });
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
  let mediaItemId = req.body.mediaItemId;

  if (!mediaItemId) {
    res.status(400).json({ message: 'Media Item ID is required' });
    return;
  }

  const movie = movieRepository.findByMediaItemId(mediaItemId);
  if (!movie) {
    res.status(400).json({ message: 'Movie does not exist' });
    return;
  }
  const updatedMovie = await updateMovie(movie, req.body);

  movieRepository.update(req.body.mediaItemId, updatedMovie);

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

  let mediaItemId = req.query.mediaItemId as string;

  if (!mediaItemId) {
    res.status(400).json({ message: 'Media Item ID is required' });
    return;
  }

  const movie = movieRepository.findByMediaItemId(mediaItemId);

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
  const movies = movieRepository.findAll();

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

async function updateMovie(
  originalMovie: Movie,
  newMovieValues: any,
): Promise<Movie> {
  if (newMovieValues.title) {
    originalMovie.title = newMovieValues.title;
  }
  if (newMovieValues.alias) {
    originalMovie.alias = newMovieValues.alias;
  }
  if (newMovieValues.imdb) {
    originalMovie.imdb = newMovieValues.imdb;
  }
  if (newMovieValues.tags) {
    // Convert tag names to Tag objects using Movie.fromRequestObject logic
    const tempMovie = Movie.fromRequestObject({ tags: newMovieValues.tags });
    originalMovie.tags = tempMovie.tags;
  }
  if (newMovieValues.collections) {
    originalMovie.collections = newMovieValues.collections;
  }
  return originalMovie;
}
