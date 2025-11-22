"use strict";
// src/controllers/streamController.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adHocStreamValidationRules = exports.validate = exports.contStreamValidationRules = void 0;
exports.continuousStreamHandler = continuousStreamHandler;
exports.adHocStreamHandler = adHocStreamHandler;
exports.streamStatusHandler = streamStatusHandler;
exports.stopStreamHandler = stopStreamHandler;
const express_validator_1 = require("express-validator");
const streamMan = __importStar(require("../services/streamManager"));
const vlcService = __importStar(require("../services/vlcService"));
const streamTypes_1 = require("../models/enum/streamTypes");
const envMan = __importStar(require("../services/environmentManager"));
const streamRequest_1 = require("../models/streamRequest");
const utilities_1 = require("../utils/utilities");
const configService_1 = require("../config/configService");
const mediaService_1 = require("../services/mediaService");
const envConfig_1 = require("../db/envConfig");
function continuousStreamHandler(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let streamError = '';
            // Check for errors in request
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            //Convert request to ContiniousStreamRequest
            const contRequest = mapRequestToContinuousStreamRequest(req);
            // Get environment config from DB and set it in the environment manager
            // For now we only accept a password for the continuous stream. Other fields
            // (env, movies, tags, etc.) are ignored at this time. Environment config
            // will be handled later if/when those fields are reintroduced.
            // Check if Continuous stream is already running, if so return error
            if (streamMan.isContinuousStream()) {
                res.status(409).json({
                    error: 'Continuous stream is already running. Stop the current stream before starting a new one.',
                });
                return;
            }
            (0, mediaService_1.setStreamType)(streamTypes_1.StreamType.Cont);
            streamMan.setContinuousStream(true);
            // Set the continuous stream args to the values from the request
            // These values are stored in the stream service and used to determine the stream while it is running continuously
            streamMan.setContinuousStreamArgs(contRequest);
            // Creates today's span of the stream filling the time until 12:00am using params from config, continuous stream args and available media
            streamError = yield streamMan.initializeStream((0, configService_1.getConfig)(), contRequest, (0, mediaService_1.getStreamType)(), true);
            if (streamError !== '') {
                console.log('Error initializing stream: ' + streamError);
                // Reset the continuous stream flag since initialization failed
                streamMan.setContinuousStream(false);
                res.status(400).json({ message: streamError });
                return;
            }
            res.status(200).json({ message: 'Stream Started' });
            return;
        }
        catch (error) {
            console.error('Error during stream startup:', error);
            // Reset the continuous stream flag since startup failed
            streamMan.setContinuousStream(false);
            res.status(500).json({
                error: 'Failed to start continuous stream',
                details: error instanceof Error ? error.message : String(error),
            });
            return;
        }
    });
}
function adHocStreamHandler(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        // Check for validation errors
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        //Convert request to AdhocStreamRequest
        const adhocRequest = mapRequestToAdhocStreamRequest(req);
        // Get environment config from DB and set it in the environment manager
        let env = yield (0, envConfig_1.getEnvConfig)((0, utilities_1.keyNormalizer)(adhocRequest.Env));
        if (env[1] !== '') {
            res.status(400).json({ message: env[1] });
            return;
        }
        envMan.SetEnvConfig(env[0]);
        (0, mediaService_1.setStreamType)(streamTypes_1.StreamType.Adhoc);
        streamMan.setContinuousStreamArgs(adhocRequest);
        yield vlcService.initializeVLCService(streamMan.getContinuousStreamArgs().Password);
        yield streamMan.initializeStream((0, configService_1.getConfig)(), adhocRequest, (0, mediaService_1.getStreamType)());
        streamMan.initializeOnDeckStream();
        yield streamMan.addInitialMediaBlocks();
        yield vlcService.playVLC();
        res.status(200).json({ message: 'Stream Starting' });
        return;
    });
}
exports.contStreamValidationRules = [
    (req, res, next) => {
        // Only 'password' is allowed in the continuous stream request for now
        const streamAllowedFields = ['password'];
        const requestBody = req.body;
        const extraFields = Object.keys(requestBody).filter(field => !streamAllowedFields.includes(field));
        if (extraFields.length > 0) {
            return res
                .status(400)
                .json({ error: `Invalid fields: ${extraFields.join(', ')}` });
        }
        next();
    },
    // Only require a password string
    (0, express_validator_1.body)('password').isString(),
];
const validate = (req, res, next) => {
    // Run validation
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};
exports.validate = validate;
exports.adHocStreamValidationRules = [
    (req, res, next) => {
        // Ensure only allowed fields are present
        const streamAllowedFields = [
            'env',
            'movies',
            'tags',
            'multiTags',
            'password',
        ];
        const requestBody = req.body;
        const extraFields = Object.keys(requestBody).filter(field => !streamAllowedFields.includes(field));
        if (extraFields.length > 0) {
            return res
                .status(400)
                .json({ error: `Invalid fields: ${extraFields.join(', ')}` });
        }
        next();
    },
    // Validate the 'env' field
    (0, express_validator_1.body)('env').optional().isString(),
    // Validate the 'movies' field
    (0, express_validator_1.body)('movies')
        .optional()
        .isArray()
        .custom((value) => {
        for (const item of value) {
            if (typeof item !== 'string') {
                throw new Error('movies must be an array of strings');
            }
            if (item.includes('::')) {
                const [firstPart, secondPart] = item.split('::');
                // Check the first part for only letters and numbers
                if (!/^[a-zA-Z0-9]+$/.test(firstPart)) {
                    throw new Error('The first part of movies must contain only letters and numbers');
                }
                // Check the second part for ISO 8601 date format with 30-minute increments
                const isoDateRegex = /^(\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):(?:00|30))$/;
                if (!isoDateRegex.test(secondPart)) {
                    throw new Error('The second part of movies must be in the format YYYY-MM-DDTHH:MM with 30-minute increments in 24-hour time');
                }
            }
            else {
                // If no "::" found, check for only letters and numbers
                if (!/^[a-zA-Z0-9]+$/.test(item)) {
                    throw new Error('movies must be in the format "string" or "string::ISO8601 date" with allowed characters');
                }
            }
        }
        return true;
    }),
    // Validate the 'tagsOR' field
    (0, express_validator_1.body)('tags')
        .optional()
        .isArray()
        .withMessage('tags must be an array')
        .custom((value) => {
        // Check if all elements in the array are strings
        for (const item of value) {
            if (typeof item !== 'string') {
                throw new Error('tags must be an array of strings');
            }
        }
        return true;
    }),
    // Validate the 'password' field
    (0, express_validator_1.body)('password').isString(),
    // Validate the 'startTime' field
    // isOptional() allows the field to be omitted from the request
    // Must be in the format YYYY-MM-DDTHH:MM
    // Must be at least the next 30 minute or 1 hour mark on the global clock
    (0, express_validator_1.body)('startTime')
        .optional()
        .isString()
        .custom((value) => {
        const isoDateRegex = /^(\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):(?:00|30))$/;
        if (!isoDateRegex.test(value)) {
            throw new Error('startTime must be in the format YYYY-MM-DDTHH:MM with 30-minute increments in 24-hour time');
        }
        const startTime = new Date(value).getTime();
        const currentTime = new Date().getTime();
        const timeDifference = startTime - currentTime;
        if (timeDifference < 0) {
            throw new Error('startTime must be at least the next 30 minute or 1 hour mark on the global clock');
        }
        return true;
    }),
    // Validate the 'endTime' field
    // Must be in the format YYYY-MM-DDTHH:MM
    // Must be at least 1 hour in the future
    // Must be at the 30 minute or 1 hour mark on the global clock
    (0, express_validator_1.body)('endTime')
        .isString()
        .custom((value) => {
        const isoDateRegex = /^(\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):(?:00|30))$/;
        if (!isoDateRegex.test(value)) {
            throw new Error('endTime must be in the format YYYY-MM-DDTHH:MM with 30-minute increments in 24-hour time');
        }
        const endTime = new Date(value).getTime();
        const currentTime = new Date().getTime();
        const timeDifference = endTime - currentTime;
        if (timeDifference < 3600000) {
            throw new Error('endTime must be at least 1 hour in the future');
        }
        return true;
    }),
];
function mapRequestToContinuousStreamRequest(req) {
    return new streamRequest_1.ContStreamRequest(req.body.password);
}
function mapRequestToAdhocStreamRequest(req) {
    const adhocRequest = new streamRequest_1.AdhocStreamRequest(req.body.password);
    if (req.body.env) {
        adhocRequest.Env = req.body.env;
    }
    if (req.body.movies) {
        adhocRequest.Movies = req.body.movies;
    }
    if (req.body.tags) {
        adhocRequest.Tags = req.body.tags;
    }
    if (req.body.multiTags) {
        adhocRequest.MultiTags = req.body.multiTags;
    }
    if (req.body.blocks) {
        adhocRequest.Blocks = req.body.blocks;
    }
    if (req.body.startTime) {
        adhocRequest.StartTime = convertISOToUnix(req.body.startTime);
    }
    if (req.body.endTime) {
        adhocRequest.EndTime = convertISOToUnix(req.body.endTime);
    }
    return adhocRequest;
}
function streamStatusHandler(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const status = streamMan.getStreamStatus();
            res.status(200).json({
                status: 'success',
                data: {
                    streamActive: status.isContinuous,
                    streamType: status.isContinuous ? 'continuous' : 'none',
                    hasUpcomingMedia: status.hasUpcomingStream,
                    onDeckCount: status.onDeckLength,
                    upcomingCount: status.upcomingLength,
                    currentStream: status.streamArgs,
                },
            });
        }
        catch (error) {
            console.error('Error getting stream status:', error);
            res.status(500).json({
                error: 'Failed to retrieve stream status',
            });
        }
    });
}
function stopStreamHandler(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!streamMan.isContinuousStream()) {
                res.status(400).json({
                    error: 'No continuous stream is currently running',
                });
                return;
            }
            // Stop the continuous stream
            streamMan.stopContinuousStream();
            // Note: VLC client cleanup should be handled here in the future
            // For now, this clears the stream state but VLC may still be running
            res.status(200).json({
                status: 'success',
                message: 'Continuous stream stopped successfully',
            });
        }
        catch (error) {
            console.error('Error stopping stream:', error);
            res.status(500).json({
                error: 'Failed to stop stream',
            });
        }
    });
}
function convertISOToUnix(isoDateTime) {
    // Convert ISO 8601 date-time to Unix timestamp in seconds
    return Math.floor(new Date(isoDateTime).getTime() / 1000);
}
