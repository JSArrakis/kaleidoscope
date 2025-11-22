"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCollectionHandler = createCollectionHandler;
exports.deleteCollectionHandler = deleteCollectionHandler;
exports.updateCollectionHandler = updateCollectionHandler;
exports.getCollectionHandler = getCollectionHandler;
exports.getAllCollectionsHandler = getAllCollectionsHandler;
const express_validator_1 = require("express-validator");
const collection_1 = require("../models/collection");
const collectionRepository_1 = require("../repositories/collectionRepository");
const movieRepository_1 = require("../repositories/movieRepository");
async function createCollectionHandler(req, res) {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
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
        const existingCollection = collectionRepository_1.collectionRepository.findByMediaItemId(mediaItemId);
        if (existingCollection) {
            res.status(400).json({ message: 'Collection already exists' });
            return;
        }
        const items = Array.isArray(req.body.items) ? req.body.items : [];
        if (items.length > 0) {
            const collectionItems = items.map((item) => collection_1.CollectionItem.fromRequestObject(item));
            let movies = [];
            for (const item of collectionItems) {
                const movie = movieRepository_1.movieRepository.findByMediaItemId(item.mediaItemId);
                if (movie) {
                    movies.push(movie);
                }
            }
            if (movies.length !== collectionItems.length) {
                const missingMovies = collectionItems.filter((item) => {
                    return !movies.some((movie) => movie.mediaItemId === item.mediaItemId);
                });
                res.status(400).json({ message: 'Movies not found', missingMovies });
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
                movieCollections = movieCollections.filter(collection => collection.mediaItemId !== req.body.mediaItemId);
                movieCollections.push({
                    mediaItemId: req.body.mediaItemId,
                    title: req.body.title,
                    sequence: item.sequence,
                });
                movie.collections = movieCollections;
                movieRepository_1.movieRepository.update(movie.mediaItemId, movie);
            }
        }
        const newCollection = await transformCollectionFromRequest(req.body, mediaItemId);
        collectionRepository_1.collectionRepository.create(newCollection);
        res
            .status(200)
            .json({ message: `Collection ${newCollection.title} Created` });
    }
    catch (error) {
        console.error('Operation failed:', error);
        res.status(500).json({ message: 'Failed to create collection', error });
    }
}
async function deleteCollectionHandler(req, res) {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        let mediaItemId = req.query.mediaItemId;
        if (!mediaItemId) {
            res.status(400).json({ message: 'ID is required' });
            return;
        }
        const collection = collectionRepository_1.collectionRepository.findByMediaItemId(mediaItemId);
        if (!collection) {
            res.status(400).json({ message: 'Collection does not exist' });
            return;
        }
        const collectionItems = collection.items.map((item) => collection_1.CollectionItem.fromRequestObject(item));
        let movies = [];
        for (const item of collectionItems) {
            const movie = movieRepository_1.movieRepository.findByMediaItemId(item.mediaItemId);
            if (movie) {
                movies.push(movie);
            }
        }
        if (movies.length !== collectionItems.length) {
            const missingMovies = collectionItems.filter((item) => {
                return !movies.some((movie) => movie.mediaItemId === item.mediaItemId);
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
            movieCollections = movieCollections.filter(collection => collection.mediaItemId !== mediaItemId);
            movie.collections = movieCollections;
            movieRepository_1.movieRepository.update(movie.mediaItemId, movie);
        }
        collectionRepository_1.collectionRepository.delete(mediaItemId);
        res.status(200).json({ message: `Collection ${collection.title} Deleted` });
    }
    catch (error) {
        console.error('Operation failed:', error);
        res.status(500).json({ message: 'Failed to delete collection', error });
    }
}
async function updateCollectionHandler(req, res) {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        let mediaItemId = req.body.mediaItemId;
        if (!mediaItemId) {
            res.status(400).json({ message: 'ID is required' });
            return;
        }
        let collection = collectionRepository_1.collectionRepository.findByMediaItemId(mediaItemId);
        if (!collection) {
            res
                .status(400)
                .json({ message: `Collection with ID ${mediaItemId} does not exist` });
            return;
        }
        const items = Array.isArray(req.body.items) ? req.body.items : [];
        if (items.length > 0) {
            const collectionItems = items.map((item) => collection_1.CollectionItem.fromRequestObject(item));
            let movies = [];
            for (const item of collectionItems) {
                const movie = movieRepository_1.movieRepository.findByMediaItemId(item.mediaItemId);
                if (movie) {
                    movies.push(movie);
                }
            }
            if (movies.length !== collectionItems.length) {
                const missingMovies = collectionItems.filter((item) => {
                    return !movies.some((movie) => movie.mediaItemId === item.mediaItemId);
                });
                res.status(400).json({ message: 'Movies not found', missingMovies });
                return;
            }
            for (const item of collectionItems) {
                let movie = movies.find(movie => movie.mediaItemId === item.mediaItemId);
                if (!movie) {
                    res.status(400).json({ message: 'Movie not found' });
                    return;
                }
                let movieCollections = [...movie.collections];
                movieCollections = movieCollections.filter(collection => collection.mediaItemId !== req.body.mediaItemId);
                movieCollections.push({
                    mediaItemId: req.body.mediaItemId,
                    title: req.body.title,
                    sequence: item.sequence,
                });
                movie.collections = movieCollections;
                movieRepository_1.movieRepository.update(movie.mediaItemId, movie);
            }
        }
        collection.items = items;
        console.log('Updating collection with items:', collection);
        collectionRepository_1.collectionRepository.update(mediaItemId, collection);
        res.status(200).json({ message: `Collection ${collection.title} Updated` });
    }
    catch (error) {
        console.error('Operation failed:', error);
        res.status(500).json({ message: 'Failed to update collection', error });
    }
}
async function getCollectionHandler(req, res) {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    let mediaItemId = req.query.mediaItemId;
    if (!mediaItemId) {
        res.status(400).json({ message: 'ID is required' });
        return;
    }
    const collection = collectionRepository_1.collectionRepository.findByMediaItemId(mediaItemId);
    if (!collection) {
        res
            .status(400)
            .json({ message: `Collection with ID ${mediaItemId} does not exist` });
        return;
    }
    res.status(200).json(collection);
    return;
}
async function getAllCollectionsHandler(req, res) {
    const collections = collectionRepository_1.collectionRepository.findAll();
    res.status(200).json(collections);
    return;
}
async function transformCollectionFromRequest(collection, mediaItemId) {
    let parsedCollection = collection_1.Collection.fromRequestObject(collection);
    parsedCollection.mediaItemId = mediaItemId;
    if (Array.isArray(parsedCollection.items)) {
        parsedCollection.items = parsedCollection.items.map((item) => collection_1.CollectionItem.fromRequestObject(item));
        console.log('PARSED COLLECTION ITEMS:', parsedCollection.items);
    }
    else {
        parsedCollection.items = [];
    }
    console.log('PARSED COLLECTION:', parsedCollection);
    return parsedCollection;
}
