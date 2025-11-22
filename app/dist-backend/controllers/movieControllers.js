"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMovieHandler = createMovieHandler;
exports.deleteMovieHandler = deleteMovieHandler;
exports.updateMovieHandler = updateMovieHandler;
exports.getMovieHandler = getMovieHandler;
exports.getAllMoviesHandler = getAllMoviesHandler;
const express_validator_1 = require("express-validator");
const movie_1 = require("../models/movie");
const utilities_1 = require("../utils/utilities");
const collection_1 = require("../models/collection");
const movieRepository_1 = require("../repositories/movieRepository");
const collectionRepository_1 = require("../repositories/collectionRepository");
async function createMovieHandler(req, res) {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    let mediaItemId = req.body.mediaItemId;
    if (!mediaItemId) {
        res.status(400).json({ message: 'Media Item ID is required' });
        return;
    }
    const movie = movieRepository_1.movieRepository.findByMediaItemId(mediaItemId);
    if (movie) {
        res.status(400).json({
            message: `The Media Item ID '${mediaItemId}' already exists.`,
        });
        return;
    }
    try {
        let createdMovie = await transformMovieFromRequest(req.body, mediaItemId);
        movieRepository_1.movieRepository.create(createdMovie);
        res.status(200).json({ message: `Movie ${createdMovie.title} Created` });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        res.status(400).json({ message: errorMessage });
    }
    return;
}
async function deleteMovieHandler(req, res) {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const movie = movieRepository_1.movieRepository.findByMediaItemId(req.query.mediaItemId);
    if (!movie) {
        res.status(400).json({ message: 'Movie does not exist' });
        return;
    }
    const items = Array.isArray(movie.collections) ? movie.collections : [];
    if (items.length > 0) {
        const mappedItems = items.map((item) => movie_1.CollectionReference.fromRequestObject(item));
        // Get collections that contain this movie
        const collections = [];
        for (const item of mappedItems) {
            const collection = collectionRepository_1.collectionRepository.findByMediaItemId(item.mediaItemId);
            if (collection) {
                collections.push(collection);
            }
        }
        if (collections.length !== mappedItems.length) {
            const missingCollections = mappedItems.filter((item) => {
                return !collections.some((collection) => collection.mediaItemId === item.mediaItemId);
            });
            res
                .status(400)
                .json({ message: 'Collections not found', missingCollections });
            return;
        }
        // Update each collection to remove this movie
        for (const collection of collections) {
            let newCollectionItems = [...collection.items];
            newCollectionItems = newCollectionItems.filter(collectionItem => collectionItem.mediaItemId !== req.query.mediaItemId);
            const updatedCollection = new collection_1.Collection(collection.mediaItemId, collection.title, collection.description, newCollectionItems);
            collectionRepository_1.collectionRepository.update(collection.mediaItemId, updatedCollection);
        }
    }
    movieRepository_1.movieRepository.delete(req.query.mediaItemId);
    res.status(200).json({ message: `Movie ${movie.title} Deleted` });
    return;
}
async function updateMovieHandler(req, res) {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    let mediaItemId = req.body.mediaItemId;
    if (!mediaItemId) {
        res.status(400).json({ message: 'Media Item ID is required' });
        return;
    }
    const movie = movieRepository_1.movieRepository.findByMediaItemId(mediaItemId);
    if (!movie) {
        res.status(400).json({ message: 'Movie does not exist' });
        return;
    }
    const updatedMovie = await updateMovie(movie, req.body);
    movieRepository_1.movieRepository.update(req.body.mediaItemId, updatedMovie);
    res.status(200).json({ message: 'Movie Updated' });
    return;
}
async function getMovieHandler(req, res) {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    let mediaItemId = req.query.mediaItemId;
    if (!mediaItemId) {
        res.status(400).json({ message: 'Media Item ID is required' });
        return;
    }
    const movie = movieRepository_1.movieRepository.findByMediaItemId(mediaItemId);
    if (!movie) {
        res.status(404).json({ message: 'Movie does not exist' });
        return;
    }
    res.status(200).json(movie);
    return;
}
async function getAllMoviesHandler(req, res) {
    const movies = movieRepository_1.movieRepository.findAll();
    res.status(200).json(movies);
    return;
}
async function transformMovieFromRequest(movie, mediaItemId) {
    let parsedMovie = movie_1.Movie.fromRequestObject(movie);
    parsedMovie.mediaItemId = mediaItemId;
    parsedMovie.alias =
        parsedMovie.alias ?? parsedMovie.title.replace(/[^a-zA-Z0-9]/g, '');
    if (parsedMovie.duration > 0) {
        return parsedMovie;
    }
    try {
        let durationInSeconds = await (0, utilities_1.getMediaDuration)(parsedMovie.path);
        parsedMovie.duration = durationInSeconds;
        parsedMovie.durationLimit =
            Math.floor(parsedMovie.duration / 1800) * 1800 +
                (parsedMovie.duration % 1800 > 0 ? 1800 : 0);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Cannot process movie "${parsedMovie.title}": ${errorMessage}`);
    }
    return parsedMovie;
}
async function updateMovie(originalMovie, newMovieValues) {
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
        const tempMovie = movie_1.Movie.fromRequestObject({ tags: newMovieValues.tags });
        originalMovie.tags = tempMovie.tags;
    }
    if (newMovieValues.collections) {
        originalMovie.collections = newMovieValues.collections;
    }
    return originalMovie;
}
