import { promoRepository } from "../repositories/promoRepository.js";
import { selectBufferMedia } from "../prisms/spectrum.js";
import { commercialRepository } from "../repositories/commercialRepository.js";
import { segmentTags } from "../utils/common.js";
// Buffer duration thresholds for media selection strategy
const COMMERCIALS_ONLY_THRESHOLD = 420; // 7 minutes in seconds
const MEDIUM_BUFFER_THRESHOLD = 900; // 15 minutes in seconds
// Reusage window durations
const COMMERCIAL_REUSAGE_WINDOW = 2 * 60 * 60; // 2 hours in seconds
const SHORTS_MUSIC_REUSAGE_WINDOW = 4 * 60 * 60; // 4 hours in seconds
function determineBufferStrategy(duration) {
    if (duration <= COMMERCIALS_ONLY_THRESHOLD) {
        return "short";
    }
    else if (duration <= MEDIUM_BUFFER_THRESHOLD) {
        return "medium";
    }
    else {
        return "large";
    }
}
function randomizeShortsMusicCount(strategy) {
    switch (strategy) {
        case "short":
            return 0; // Commercials only
        case "medium":
            return Math.floor(Math.random() * 3); // 0-2
        case "large":
            return Math.floor(Math.random() * 3) + 1; // 1-3
    }
}
function splitCountBetweenHalves(totalCount) {
    if (totalCount === 0) {
        return { halfA: 0, halfB: 0 };
    }
    const baseCount = Math.floor(totalCount / 2);
    const hasExtraItem = totalCount % 2 === 1;
    if (!hasExtraItem) {
        return { halfA: baseCount, halfB: baseCount };
    }
    const extraGoesToHalfA = Math.random() < 0.5;
    return extraGoesToHalfA
        ? { halfA: baseCount + 1, halfB: baseCount }
        : { halfA: baseCount, halfB: baseCount + 1 };
}
export function createBuffer(duration, halfATags, halfBTags, activeHolidayTags, timepoint) {
    let buffer = [];
    // Select a random promo - promos are always 15 seconds
    // Promos are like channel idents (NBC, ABC markers) not show/movie promotions
    let promo = promoRepository.findRandomPromo();
    // Sets the duration of the buffer to be the duration of the buffer minus the duration
    // of the promo (if we have one), otherwise use full duration
    let remDur = promo && promo.duration ? duration - promo.duration : duration;
    // variables to hold the duration of the first half of the buffer and the second half
    // of the buffer
    let halfADuration = 0;
    let halfBDuration = 0;
    // If the precedint tags are empty (such as when the stream is just launched and there is
    // no preceding show or movie and we are creating the the initial buffer)
    if (halfATags.length === 0) {
        // There is no Half A, so the entire buffer is Half B (themed to the show that is about to play)
        halfBDuration = remDur;
        // If there is no subsequent show or movie (such as when the stream is ending and there is
        // no subsequent show or movie and we are creating the final buffer)
    }
    else if (halfBTags.length === 0) {
        // There is no Half B, so the entire buffer is Half A (themed to the show that just played)
        halfADuration = remDur;
    }
    else {
        // If there is a preceding show or movie and a subsequent show or movie,
        // split the buffer in half
        // If the remaining duration is greater than or equal to 30 seconds, split
        // the buffer in half
        // If the remaining duration is less than 30 seconds, the entire buffer is
        // Half B(themed to the show that is about to play)
        // The reason for 30 seconds is to assume the promo is 15 seconds and the
        // fact that there are many 15 second commercials
        if (remDur >= 30) {
            halfADuration = Math.ceil(remDur / 2);
        }
        halfBDuration = remDur - halfADuration;
    }
    // Handle case where there are no tags at all (both halfATags and halfBTags are empty)
    if (halfATags.length === 0 && halfBTags.length === 0) {
        // Only promo in buffer (if available)
        return {
            buffer: promo ? [promo] : [],
            remainingDuration: promo ? 0 : duration,
        };
    }
    // Determine buffer strategy and randomize shorts/music count
    const strategy = determineBufferStrategy(remDur); // VERIFIED
    const shortsMusicsCount = randomizeShortsMusicCount(strategy); // VERIFIED
    const { halfA: halfAShortsMusics, halfB: halfBShortsMusics } = splitCountBetweenHalves(shortsMusicsCount); // VERIFIED
    if (halfADuration === 0) {
        // Get list of commercials, music, and shorts that match the tags of the
        // subsequent show or movie and also gets the remaining duration of the
        // buffer after selecting the media to pass to the next buffer selection
        let selectedB = constructBufferHalf(halfBTags, activeHolidayTags, remDur, strategy, halfBShortsMusics, timepoint);
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
    else if (halfBDuration === 0) {
        // Get list of commercials, music, and shorts that match the tags of the
        // preceding show or movie and also gets the remaining duration of the
        // buffer after selecting the media to pass to the next buffer selection
        let selectedA = constructBufferHalf(halfATags, activeHolidayTags, remDur, strategy, halfAShortsMusics, timepoint);
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
        let selectedA = constructBufferHalf(halfATags, activeHolidayTags, halfADuration, strategy, halfAShortsMusics, timepoint);
        // Add the selected media to the buffer
        buffer.push(...selectedA.selectedMedia);
        // Add the promo to the buffer (if available)
        if (promo) {
            buffer.push(promo);
        }
        // Get list of commercials, music, and shorts that match the tags of the
        // subsequent show or movie
        let selectedB = constructBufferHalf(halfBTags, activeHolidayTags, halfBDuration + selectedA.remainingDuration, strategy, halfBShortsMusics, timepoint);
        // Add the selected media to the buffer
        buffer.push(...selectedB.selectedMedia);
        return {
            buffer,
            remainingDuration: selectedB.remainingDuration,
        };
    }
}
// Define the main function
export function constructBufferHalf(tags, activeHolidayTags, duration, strategy, targetShortsMusicCount, timepoint) {
    let selectedMedia = [];
    let remainingDuration = duration;
    // Segment Tags for spectrum processing and buffer creation
    const segmentedTags = segmentTags(tags); // VERIFIED
    // Get default commercials to use as fallback
    const defaultCommercials = commercialRepository.findByDefaultSpecialtyTag(duration); // VERIFIED
    // Use the spectrum prism to select buffer media based on tags and duration
    const spectrumResult = selectBufferMedia(segmentedTags, activeHolidayTags, duration, targetShortsMusicCount, timepoint); // TODO
    let usedCommercials = [];
    let usedShorts = [];
    let usedMusic = [];
    if (strategy === "short") {
        const result = selectCommercials(segmentedTags.eraTags, spectrumResult.commercials, defaultCommercials, duration); // VERIFIED
        usedCommercials = result.selectedCommercials;
        selectedMedia.push(...result.selectedCommercials);
        remainingDuration = result.remainingDuration;
    }
    else if (strategy === "medium") {
        // combine music videos and shorts, shuffle them, and then select 0-2 at random from the list
        const selectedShortsOrMusic = selectShortsAndMusic(spectrumResult.music, spectrumResult.shorts, targetShortsMusicCount, duration);
        usedShorts = selectedShortsOrMusic.selectedShorts;
        usedMusic = selectedShortsOrMusic.selectedMusic;
        selectedMedia.push(...selectedShortsOrMusic.selected);
        // Fill the remaining duration with commercials
        const commercialsSelection = selectCommercials(segmentedTags.eraTags, spectrumResult.commercials, defaultCommercials, selectedShortsOrMusic.remainingDuration); // VERIFIED
        usedCommercials = commercialsSelection.selectedCommercials;
        selectedMedia.push(...usedCommercials);
    }
    else {
        // strategy === "large"
        const selectedShortsOrMusic = selectShortsAndMusic(spectrumResult.music, spectrumResult.shorts, targetShortsMusicCount, duration);
        usedShorts = selectedShortsOrMusic.selectedShorts;
        usedMusic = selectedShortsOrMusic.selectedMusic;
        selectedMedia.push(...selectedShortsOrMusic.selected);
        // Fill the remaining duration with commercials
        const commercialsSelection = selectCommercials(segmentedTags.eraTags, spectrumResult.commercials, defaultCommercials, selectedShortsOrMusic.remainingDuration); // VERIFIED
        usedCommercials = commercialsSelection.selectedCommercials;
        selectedMedia.push(...usedCommercials);
    }
    // Shuffle selectedMedia before returning
    selectedMedia = selectedMedia.sort(() => 0.5 - Math.random());
    return {
        selectedMedia,
        remainingDuration,
    };
}
export function selectCommercials(eraTags, commercials, defaultCommercials, duration) {
    let selectedCommercials = [];
    let candidateCommercials = [...commercials];
    let remainingDuration = duration;
    // Build a set of era tag IDs for quick lookup
    const eraTagIds = new Set(eraTags.map((t) => t.tagId));
    // Helper to get the era-matched subset of current candidates
    const getEraMatched = () => eraTagIds.size > 0
        ? candidateCommercials.filter((c) => c.tags.some((t) => eraTagIds.has(t.tagId)))
        : [];
    // Helper function to check if there are commercials that could potentially fill remaining duration
    const hasViableCommercials = (commercials) => {
        return commercials.some((c) => (c.duration || 0) <= remainingDuration);
    };
    // Fill the buffer by picking commercials one at a time
    while (remainingDuration > 0 &&
        (hasViableCommercials(candidateCommercials) ||
            hasViableCommercials(defaultCommercials))) {
        let selected = false;
        // Try to find a single commercial that exactly fills remaining duration
        // Prefer era-matched candidates first, then fall back to all candidates
        const eraMatchedForExact = getEraMatched(); // VERIFIED
        let exactMatch = eraMatchedForExact.find((c) => c.duration === remainingDuration) ??
            candidateCommercials.find((c) => c.duration === remainingDuration);
        if (exactMatch) {
            selectedCommercials.push(exactMatch);
            remainingDuration -= exactMatch.duration || 0;
            candidateCommercials = candidateCommercials.filter((c) => c.mediaItemId !== exactMatch.mediaItemId);
            selected = true;
        }
        // Try to find two commercials that together fill remaining duration
        // Try era-matched candidates first, then fall back to all candidates
        if (!selected) {
            const eraMatchedForPair = getEraMatched(); // VERIFIED
            const poolsToTry = eraMatchedForPair.length > 0
                ? [eraMatchedForPair, candidateCommercials]
                : [candidateCommercials];
            for (const pool of poolsToTry) {
                if (selected)
                    break;
                // Create a map: duration -> array of commercials (handle duplicates)
                const durationMap = new Map();
                for (const c of pool) {
                    const dur = c.duration || 0;
                    if (!durationMap.has(dur)) {
                        durationMap.set(dur, []);
                    }
                    durationMap.get(dur).push(c);
                }
                // O(n) search: for each commercial, check if complement exists
                for (const c1 of pool) {
                    if (selected)
                        break;
                    const dur1 = c1.duration || 0;
                    const needed = remainingDuration - dur1;
                    if (needed > 0 && durationMap.has(needed)) {
                        const complements = durationMap.get(needed);
                        // Find a complement that's not the same commercial
                        for (const c2 of complements) {
                            if (c1.mediaItemId !== c2.mediaItemId) {
                                selectedCommercials.push(c1);
                                selectedCommercials.push(c2);
                                remainingDuration -= dur1 + needed;
                                candidateCommercials = candidateCommercials.filter((c) => c.mediaItemId !== c1.mediaItemId &&
                                    c.mediaItemId !== c2.mediaItemId);
                                selected = true;
                                break;
                            }
                        }
                    }
                }
            }
        }
        // Pick a random commercial from candidates
        // Prefer era-matched candidates first, then fall back to all candidates
        // Only consider commercials that fit within remaining duration
        if (!selected && candidateCommercials.length > 0) {
            const eraMatchedForRandom = getEraMatched().filter((c) => (c.duration || 0) <= remainingDuration); // VERIFIED
            const viableCandidates = candidateCommercials.filter((c) => (c.duration || 0) <= remainingDuration);
            const randomPool = eraMatchedForRandom.length > 0 ? eraMatchedForRandom : viableCandidates;
            if (randomPool.length === 0) {
                // No viable candidates — fall through to try defaults
            }
            else {
                const randomIndex = Math.floor(Math.random() * randomPool.length);
                const randomCommercial = randomPool[randomIndex];
                selectedCommercials.push(randomCommercial);
                remainingDuration -= randomCommercial.duration || 0;
                candidateCommercials = candidateCommercials.filter((c) => c.mediaItemId !== randomCommercial.mediaItemId);
                selected = true;
            }
        }
        // If no viable candidates were selected, try default commercials
        if (!selected) {
            // Try to find a single default commercial that exactly fills remaining duration
            let exactMatchDefault = defaultCommercials.find((c) => c.duration === remainingDuration);
            if (exactMatchDefault) {
                selectedCommercials.push(exactMatchDefault);
                remainingDuration -= exactMatchDefault.duration || 0;
                selected = true;
            }
            // Try to find two default commercials that together fill remaining duration
            if (!selected) {
                // Create a map: duration -> array of commercials (handle duplicates)
                const durationMap = new Map();
                for (const c of defaultCommercials) {
                    const dur = c.duration || 0;
                    if (!durationMap.has(dur)) {
                        durationMap.set(dur, []);
                    }
                    durationMap.get(dur).push(c);
                }
                // O(n) search: for each commercial, check if complement exists
                for (const c1 of defaultCommercials) {
                    if (selected)
                        break;
                    const dur1 = c1.duration || 0;
                    const needed = remainingDuration - dur1;
                    if (needed > 0 && durationMap.has(needed)) {
                        const complements = durationMap.get(needed);
                        // Find a complement that's not the same commercial
                        for (const c2 of complements) {
                            if (c1.mediaItemId !== c2.mediaItemId) {
                                selectedCommercials.push(c1);
                                selectedCommercials.push(c2);
                                remainingDuration -= dur1 + needed;
                                selected = true;
                                break;
                            }
                        }
                    }
                }
            }
            // Pick a random default commercial that fits within remaining duration
            if (!selected && defaultCommercials.length > 0) {
                const viableDefaults = defaultCommercials.filter((c) => (c.duration || 0) <= remainingDuration);
                if (viableDefaults.length === 0) {
                    // No viable defaults either — loop will exit via hasViableCommercials check
                    break;
                }
                const randomIndex = Math.floor(Math.random() * viableDefaults.length);
                const randomCommercial = viableDefaults[randomIndex];
                selectedCommercials.push(randomCommercial);
                remainingDuration -= randomCommercial.duration || 0;
                selected = true;
            }
        }
        // If nothing was selected, we can't fill more, so break
        if (!selected) {
            break;
        }
    }
    return {
        selectedCommercials,
        remainingDuration,
    };
}
export function selectShortsAndMusic(music, shorts, targetCount, maxDuration) {
    // Combine and shuffle shorts and music
    const combined = [...shorts, ...music];
    const shuffled = combined.sort(() => 0.5 - Math.random());
    let selected = [];
    let selectedShorts = [];
    let selectedMusic = [];
    let totalDuration = 0;
    // Try to select the target amount while staying under maxDuration
    for (const item of shuffled) {
        if (selected.length >= targetCount) {
            break;
        }
        const itemDuration = item.duration || 0;
        if (totalDuration + itemDuration <= maxDuration) {
            selected.push(item);
            totalDuration += itemDuration;
            // Track which type it is by checking the item's type field
            if (item.type === MediaType.Short) {
                selectedShorts.push(item);
            }
            else {
                selectedMusic.push(item);
            }
        }
    }
    return {
        selected,
        selectedShorts,
        selectedMusic,
        remainingDuration: maxDuration - totalDuration,
    };
}
