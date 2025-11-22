"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBuffer = createBuffer;
exports.getBufferVarietyStats = getBufferVarietyStats;
exports.selectFullDurationMedia = selectFullDurationMedia;
exports.selectUnderDuratonMedia = selectUnderDuratonMedia;
exports.selectAvailableCommercials = selectAvailableCommercials;
exports.selectWeightedMedia = selectWeightedMedia;
exports.selectCommercials = selectCommercials;
exports.selectShortOrMusic = selectShortOrMusic;
exports.selectBufferMediaWithinDuration = selectBufferMediaWithinDuration;
const media_1 = require("../models/media");
const tagTypes_1 = require("../models/const/tagTypes");
const tag_1 = require("../models/tag");
const dataTransformer_1 = require("./dataTransformer");
const core_1 = require("../prisms/core");
const core = __importStar(require("../prisms/core"));
// TODO: Import mosaic functions when implemented
// import { getMediaByMosaicTags } from '../prisms/mosaic';
const recentlyUsedMediaRepository_1 = require("../repositories/recentlyUsedMediaRepository");
const spectrum_1 = require("../prisms/spectrum");
const holidayService_1 = require("./holidayService");
const promoService_1 = require("./promoService");
// Note: Music selection will eventually use mosaic system instead of spectrum
function createBuffer(duration, halfATags, halfBTags, activeHolidayTags) {
    let buffer = [];
    // Periodically clean up expired usage records (every ~10th call)
    if (Math.random() < 0.1) {
        try {
            recentlyUsedMediaRepository_1.recentlyUsedMediaRepository.cleanupExpiredRecords();
        }
        catch (error) {
            console.warn('Failed to cleanup expired usage records:', error);
        }
    }
    // transform holidayTags into Tag objects
    const holidayMediaTags = activeHolidayTags.map(holiday => {
        return new tag_1.Tag(holiday.tagId, holiday.name, tagTypes_1.TagType.Holiday, holiday.holidayDates, holiday.exclusionTags, holiday.seasonStartDate, holiday.seasonEndDate, false);
    });
    // Get the translated tags for the preceding show or movie and the subsequent
    // show or movie. These are used to get buffer content for the first half of the
    // buffer and the last half of the buffer respectively
    // The reason for this is to better transition from one genre of media to the next
    let segmentedPreTags = (0, dataTransformer_1.segmentTags)(halfATags);
    let segmentedPostTags = (0, dataTransformer_1.segmentTags)(halfBTags);
    // Get active holiday tags from the centralized holiday service
    let selectedHolidayTags = (0, holidayService_1.getActiveHolidayTags)();
    // Select a random promo - promos are always 15 seconds
    // Promos are like channel idents (NBC, ABC markers) not show/movie promotions
    let promo = (0, promoService_1.selectRandomPromo)(duration);
    // Sets the duration of the buffer to be the duration of the buffer minus the duration
    // of the promo (if we have one), otherwise use full duration
    let remDur = promo ? duration - promo.duration : duration;
    // variables to hold the duration of the first half of the buffer and the second half
    // of the buffer
    let halfA = 0;
    let halfB = 0;
    // If the precedint tags are empty (such as when the stream is just launched and there is
    // no preceding show or movie and we are creating the the initial buffer)
    if (halfATags.length === 0) {
        // There is no Half A, so the entire buffer is Half B (themed to the show that is about to play)
        halfB = remDur;
        // If there is no subsequent show or movie (such as when the stream is ending and there is
        // no subsequent show or movie and we are creating the final buffer)
    }
    else if (halfBTags.length === 0) {
        // There is no Half B, so the entire buffer is Half A (themed to the show that just played)
        halfA = remDur;
    }
    else {
        // If there is a preceding show or movie and a subsequent show or movie,
        // split the buffer in half
        // If the remaining duration is greater than or equal to 30 seconds, split
        // he buffer in half
        // If the remaining duration is less than 30 seconds, the entire buffer is
        // Half B(themed to the show that is about to play)
        // The reason for 30 seconds is to assume the promo is 15 seconds and the
        // fact that there are many 15 second commercials
        // TODO - We might need a better way to do this
        if (remDur >= 30) {
            halfA = Math.ceil(remDur / 2);
        }
        halfB = remDur - halfA;
    }
    // Handle case where there are no tags at all (both halfATags and halfBTags are empty)
    if (halfATags.length === 0 && halfBTags.length === 0) {
        // Only promo in buffer (if available)
        return {
            buffer: promo ? [promo] : [],
            remainingDuration: promo ? 0 : duration,
        };
    }
    if (halfA === 0) {
        // Get list of commercials, music, and shorts that match the tags of the
        // subsequent show or movie and also gets the remaining duration of the
        // buffer after selecting the media to pass to the next buffer selection
        let selectedB = selectBufferMediaWithinDuration(segmentedPostTags, remDur);
        // Add the selected media to the buffer
        buffer.push(...selectedB.selectedMedia);
        // Add the promo to the buffer (if available)
        if (promo) {
            buffer.push(promo);
        }
        return {
            buffer,
            remainingDuration: selectedB.remainingDuration,
        };
    }
    else if (halfB === 0) {
        // Get list of commercials, music, and shorts that match the tags of the
        // preceding show or movie and also gets the remaining duration of the
        // buffer after selecting the media to pass to the next buffer selection
        let selectedA = selectBufferMediaWithinDuration(segmentedPreTags, remDur);
        // Add the promo to the buffer (if available)
        if (promo) {
            buffer.push(promo);
        }
        // Add the selected media to the buffer
        buffer.push(...selectedA.selectedMedia);
        return {
            buffer,
            remainingDuration: selectedA.remainingDuration,
        };
    }
    else {
        // Get list of commercials, music, and shorts that match the tags of the
        // preceding show or movie
        let selectedA = selectBufferMediaWithinDuration(segmentedPreTags, halfA);
        // Add the selected media to the buffer
        buffer.push(...selectedA.selectedMedia);
        // Add the promo to the buffer (if available)
        if (promo) {
            buffer.push(promo);
        }
        // Get list of commercials, music, and shorts that match the tags of the
        // subsequent show or movie
        let selectedB = selectBufferMediaWithinDuration(segmentedPostTags, halfB + selectedA.remainingDuration);
        // Add the selected media to the buffer
        buffer.push(...selectedB.selectedMedia);
        return {
            buffer,
            remainingDuration: selectedB.remainingDuration,
        };
    }
}
function getBufferVarietyStats(availableCommercials, availableShorts, availableMusic) {
    const breakdown = {
        commercials: availableCommercials.length,
        shorts: availableShorts.length,
        music: availableMusic.length,
    };
    const totalVariety = breakdown.commercials + breakdown.shorts + breakdown.music;
    let varietyLevel;
    if (totalVariety >= 20) {
        varietyLevel = 'high';
    }
    else if (totalVariety >= 10) {
        varietyLevel = 'medium';
    }
    else if (totalVariety >= 5) {
        varietyLevel = 'low';
    }
    else {
        varietyLevel = 'critical';
    }
    return {
        totalVariety,
        varietyLevel,
        breakdown,
    };
}
function selectFullDurationMedia(media, duration) {
    return media.filter((media) => media.duration === duration);
}
function selectUnderDuratonMedia(media, duration, blockDuration) {
    return media.filter(media => media.duration <= duration && media.duration <= blockDuration);
}
function selectAvailableCommercials(commercials, defaultCommercials, duration, blockDuration) {
    let availableCommercials = [];
    // Get the commercials that fit the remaining duration
    availableCommercials = selectFullDurationMedia(commercials, duration);
    // Get the commercials that are less than or equal to both the
    // remaining duration and the commercial block
    if (availableCommercials.length === 0) {
        availableCommercials = selectUnderDuratonMedia(commercials, duration, blockDuration);
    }
    // Get the default commercials that fit the remaining duration
    // Only add them to the available commercials instead of assigning them
    // this way it still is a higher chance of selecting a commercial that is
    // not a default commercial
    if ((0, core_1.sumMediaDuration)(availableCommercials) < duration) {
        const defaultFull = selectFullDurationMedia(defaultCommercials, duration);
        availableCommercials.push(...defaultFull);
    }
    // Get the default commercials that are less than or equal to both the remaining duration
    // and the commercial block
    let summedDuration = (0, core_1.sumMediaDuration)(availableCommercials);
    if (summedDuration < duration && summedDuration < blockDuration) {
        const defaultUnder = selectUnderDuratonMedia(defaultCommercials, duration, blockDuration);
        availableCommercials.push(...defaultUnder);
    }
    return availableCommercials;
}
function selectWeightedMedia(media) {
    // Get the first 10 commercials from media, this is because the incoming
    // commercials are ordered from most relevant to least relevant in the
    // media list. We are selecting 10 commercials because we want to give
    // a little bit of variety in the commercials that are selected
    let weightedMedia = media.slice(0, 10);
    // Select a random commercial from the first 10 commercials
    return weightedMedia[Math.floor(Math.random() * weightedMedia.length)];
}
function selectCommercials(commercials, defaultCommercials, remainingDuration) {
    let selectedCommercials = [];
    // In normal TV broadcast, a single commercial is rarely longer than 120 seconds
    // However they do exist, and as such we account for that for giving a small
    // chance of selecting a commercial that is longer than 120 seconds
    // by looking for commercials that are equal to the entire remaining duration
    // The variableness of this duration is what makes the possiblity of a full
    // remaining duration commercial being selected possible but low.
    // Set the commercial block to 120 seconds
    let commercialBlock = 120;
    // Remaining duration for the buffer might be less than 120 seconds
    while (remainingDuration > 0) {
        const availableCommercials = selectAvailableCommercials(commercials, defaultCommercials, remainingDuration, commercialBlock);
        if (availableCommercials.length > 0) {
            // Select random commercial from available commercials
            const selectedCommercial = selectWeightedMedia(availableCommercials);
            // Add the selected commercial to the selected commercials list and remove the
            // duration of the commercial from the remaining duration
            selectedCommercials.push(selectedCommercial);
            remainingDuration -= selectedCommercial.duration;
            // Add the title of the selected commercial to the used commercial titles list
            commercialBlock -= selectedCommercial.duration; // Reduce commercialBlock
        }
        else {
            // If there are no commercials that fit the remaining duration or commercial block
            // remaining duration, break the loop
            break;
        }
    }
    // Return the selected commercials and the remaining duration to be used in the next buffer
    return [selectedCommercials, remainingDuration];
}
// Select Shorts or Music
function selectShortOrMusic(filteredShorts, filteredMusic, remainingDuration) {
    // Get the available shorts that fit the remaining duration
    let availableShorts = filteredShorts.filter(short => short.duration <= remainingDuration);
    // Get the available music that fits the remaining duration
    let availableMusic = filteredMusic.filter(music => music.duration <= remainingDuration);
    if (availableShorts.length === 0 && availableMusic.length === 0) {
        return null; // No suitable shorts or music available
    }
    const useShort = Math.random() < 0.5; // 50% chance of selecting a short
    if (useShort && availableShorts.length > 0) {
        // Select a random short from the available shorts
        return selectWeightedMedia(availableShorts);
    }
    else if (availableMusic.length > 0) {
        // Select a random music video from the available music
        return selectWeightedMedia(availableMusic);
    }
    return null; // No suitable shorts or music available
}
// Define the main function
function selectBufferMediaWithinDuration(tags, duration) {
    // Use new intelligent hierarchical spectrum selection
    // Note: Music selection will be handled by mosaic system when implemented
    /*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*/
    const spectrumResult = (0, spectrum_1.selectBufferMedia)(tags, duration);
    // Log spectrum selection results
    console.log(`[Buffer Engine] Spectrum selected ${spectrumResult.selectionStats.totalFound} items filling ${spectrumResult.selectionStats.durationFilled}/${spectrumResult.selectionStats.targetDuration}s`);
    console.log(`[Buffer Engine] Selection breakdown - Perfect: ${spectrumResult.selectionStats.perfectMatches}, Good: ${spectrumResult.selectionStats.goodMatches}, Decent: ${spectrumResult.selectionStats.decentMatches}, Fallback: ${spectrumResult.selectionStats.fallbackMatches}, Emergency: ${spectrumResult.selectionStats.emergencyMatches}`);
    if (spectrumResult.selectionStats.reusageApplied) {
        console.log(`[Buffer Engine] Reusage applied: ${spectrumResult.selectionStats.reusageReason}`);
    }
    // The spectrum system has already selected and filtered media intelligently
    let selectedMedia = [
        ...spectrumResult.commercials,
        ...spectrumResult.shorts,
        ...spectrumResult.music,
    ];
    let segmentedSelectedMedia = new media_1.Media([], [], [], [], [], [], [], [], []);
    segmentedSelectedMedia.commercials.push(...spectrumResult.commercials);
    segmentedSelectedMedia.shorts.push(...spectrumResult.shorts);
    segmentedSelectedMedia.music.push(...spectrumResult.music);
    // Calculate remaining duration after spectrum selection (for timing correction)
    const actualDuration = core.sumMediaDuration(selectedMedia);
    const remainingDuration = duration - actualDuration;
    /*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*/
    // Record usage of all selected buffer media to prevent repetition
    const mediaUsageRecords = [
        ...spectrumResult.commercials.map((c) => ({
            mediaItemId: c.mediaItemId,
            mediaType: 'commercial',
            usageContext: 'buffer',
        })),
        ...spectrumResult.shorts.map((s) => ({
            mediaItemId: s.mediaItemId,
            mediaType: 'short',
            usageContext: 'buffer',
        })),
        ...spectrumResult.music.map((m) => ({
            mediaItemId: m.mediaItemId,
            mediaType: 'music',
            usageContext: 'buffer',
        })),
    ];
    if (mediaUsageRecords.length > 0) {
        recentlyUsedMediaRepository_1.recentlyUsedMediaRepository.recordBatchUsage(mediaUsageRecords);
        // Log buffer creation summary
        console.log(`[Buffer Engine] Created buffer with ${spectrumResult.commercials.length} commercials, ${spectrumResult.shorts.length} shorts, ${spectrumResult.music.length} music tracks`);
    }
    return {
        selectedMedia,
        segmentedSelectedMedia,
        remainingDuration,
    };
}
