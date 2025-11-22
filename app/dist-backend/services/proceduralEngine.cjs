"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProceduralBlock = getProceduralBlock;
exports.selectMovieUnderDuration = selectMovieUnderDuration;
exports.getEpisodesUnderDuration = getEpisodesUnderDuration;
exports.isMoviePreviouslySelected = isMoviePreviouslySelected;
exports.selectShowByDuration = selectShowByDuration;
const mediaTypes_1 = require("../models/enum/mediaTypes.cjs");
const selectedMedia_1 = require("../models/selectedMedia.cjs");
const progressionManager_1 = require("./progressionManager.cjs");
const core_1 = require("../prisms/core.cjs");
// Note: procedural engine expects Tag objects (MediaTag[]) in args.Tags and media.*.tags
async function getProceduralBlock(args, stagedMedia, media, prevMovies, duration, latestTimePoint, streamType) {
    let currDur = 0;
    let selectedMedia = [];
    let currentTimePoint = latestTimePoint;
    while (currDur < duration) {
        let durRemainder = duration - currDur;
        let injDurMovies = stagedMedia.injectedMovies.filter(inj => inj.duration <= durRemainder &&
            !isMoviePreviouslySelected(inj.media, prevMovies));
        let procDurMovies = media.movies.filter(mov => mov.duration <= durRemainder &&
            !isMoviePreviouslySelected(mov, prevMovies));
        if (injDurMovies.length > 0) {
            //TODO: Add logic to select injected movie based on genre walk (when designed and constructed)
            //separate movies that share tags with all scheduled movies that have gaps big enough to fit the duration
            //of the injected movies in the selection (so gaps that are 2 hours or more)
            //first match up all injected movies available with the adjacent tags into the appropriate gaps, then
            //the movies filling the gaps will be selected at random from the groupings by tag
            //now this will get complicated, but to make this intelligent, we will want to put anthologies in order through
            //the entire stream duration. So if we have multiple gaps that have tags where a movie that is part of an anthology
            //can be selected, we will want to select the movie that is next in the anthology. When an anthology movie is selected,
            //we will want to check against an anthology object array to see if this anthology has already been selected, and if so,
            //we will want to select the next movie in the anthology. If the anthology has not been selected,
            let injMovie = injDurMovies[Math.floor(Math.random() * injDurMovies.length)];
            let indexInInjectedMovies = stagedMedia.injectedMovies.indexOf(injMovie);
            injMovie.time = currentTimePoint;
            stagedMedia.injectedMovies.splice(indexInInjectedMovies, 1);
            selectedMedia.push(injMovie);
            prevMovies.push(injMovie.media);
            currentTimePoint = currentTimePoint + injMovie.duration;
            currDur = currDur + injMovie.duration;
        }
        else {
            if (durRemainder >= 5400) {
                //Movie or Show
                let selectedMovie = selectMovieUnderDuration(args, media.movies, prevMovies, durRemainder);
                if (Math.random() > 0.5 &&
                    procDurMovies.length > 0 &&
                    selectedMovie !== undefined) {
                    let selectedMediaItem = new selectedMedia_1.SelectedMedia(selectedMovie, '', mediaTypes_1.MediaType.Movie, currentTimePoint, selectedMovie.durationLimit, selectedMovie.tags);
                    selectedMedia.push(selectedMediaItem);
                    prevMovies.push(selectedMovie);
                    currDur = currDur + selectedMovie.durationLimit;
                    currentTimePoint = currentTimePoint + selectedMovie.durationLimit;
                }
                else {
                    let result = await getEpisodesUnderDuration(args, media.shows, durRemainder, streamType);
                    result[0].forEach(episode => {
                        selectedMedia.push(new selectedMedia_1.SelectedMedia(episode, result[1], mediaTypes_1.MediaType.Episode, currentTimePoint, episode.durationLimit, episode.tags));
                        currDur = currDur + episode.durationLimit;
                        currentTimePoint = currentTimePoint + episode.durationLimit;
                    });
                }
            }
            else {
                //Show
                let result = await getEpisodesUnderDuration(args, media.shows, durRemainder, streamType);
                result[0].forEach(episode => {
                    selectedMedia.push(new selectedMedia_1.SelectedMedia(episode, result[1], mediaTypes_1.MediaType.Episode, currentTimePoint, episode.durationLimit, episode.tags));
                    currDur = currDur + episode.durationLimit;
                    currentTimePoint = currentTimePoint + episode.durationLimit;
                });
            }
        }
    }
    return selectedMedia;
}
function selectMovieUnderDuration(options, movies, prevMovies, duration) {
    // options.Tags is MediaTag[]; compare by tag.name
    const optionTagNames = (options.Tags || []).map(t => (0, core_1.getTagName)(t));
    let filteredMovies = movies.filter(movie => (movie.tags || []).some(tag => optionTagNames.includes((0, core_1.getTagName)(tag))) && movie.durationLimit <= duration);
    let notRepeatMovies = filteredMovies.filter(item => !prevMovies.some(obj => obj.mediaItemId === item.mediaItemId));
    let selectedMovie = notRepeatMovies.length > 0
        ? notRepeatMovies[Math.floor(Math.random() * notRepeatMovies.length)]
        : filteredMovies[Math.floor(Math.random() * filteredMovies.length)];
    return selectedMovie;
}
async function getEpisodesUnderDuration(args, shows, duration, streamType) {
    let episodes = [];
    const argTagNames = (args.Tags || []).map(t => (0, core_1.getTagName)(t));
    let filteredShows = shows.filter(show => (show.tags || []).some(tag => argTagNames.includes((0, core_1.getTagName)(tag))) &&
        show.durationLimit <= duration);
    // Sometimes a show will have a duration that is longer than the duration limit. Since we use the duration limit as the number to compare against the
    // duration available, this could potentially yeild a show that would run longer than the time slot available. Thus we need to see which shows have a duration
    // that is longer than the duration available. The WatchRecord of a show will have a boolean value determining that the next episode of a show is over its normal
    // duration limit, this value will be used in determining if the show can be selected or not for the selected duration slot.
    // let showProgressions = GetFilteredShowProgressions(filteredShows, streamType);
    let [selectedShow, numberOfEpisodes] = await selectShowByDuration(args, duration, filteredShows, streamType);
    if (selectedShow === undefined) {
        // TODO - If no shows at all are found for the duration available, then the duration slot will be filled with buffer media.
        throw new Error('Something went wrong when selecting a show by Duration');
    }
    // So this part gets the correct indicies for the correct episode number assigned to each episode of a show in the list
    // of episodes. This is done by checking the progression of the show and selecting the next episode in the list, which
    // also updates the WatchRecord object for the show in the ProgressionContext object. This is done against a local copy
    // of the progression and the DB is only updated if the media has finished playing in the stream.
    let episodeIndicies = await (0, progressionManager_1.ManageShowProgression)(selectedShow, numberOfEpisodes, args, streamType);
    episodeIndicies.forEach(idx => {
        if (selectedShow !== undefined) {
            let episode = selectedShow.episodes[idx - 1];
            //add selectedShow tags to episode tags that dont already exist
            episode.tags = Array.from(new Set([...selectedShow.tags, ...episode.tags]));
            episodes.push(episode);
        }
    });
    return [episodes, selectedShow.title];
}
function isMoviePreviouslySelected(movie, prevMovies) {
    return prevMovies.some(prevMovie => prevMovie.title === movie.title);
}
async function selectShowByDuration(args, duration, shows, streamType) {
    let progressions = await (0, progressionManager_1.GetShowListProgressions)(shows, streamType);
    let selectedShows = [];
    let numberOfEpisodes = 0;
    if (duration < 3600) {
        // Find all shows that have a next episode duration limit of 1800 using the progressions
        let minProgressions = progressions.filter(prog => prog.nextEpisodeDurLimit === 1800);
        minProgressions.forEach(prog => {
            let show = shows.find(s => s.mediaItemId === prog.showMediaItemId);
            if (show !== undefined) {
                selectedShows.push(show);
            }
        });
        numberOfEpisodes = 1;
    }
    else {
        // Find all progressions that have a next episode duration limit of 1800
        let minProgressions = progressions.filter(prog => prog.nextEpisodeDurLimit === 1800);
        // Refine minProgressions to only include shows where the next two episodes have a duration limit of 1800
        minProgressions = minProgressions.filter(prog => {
            let show = shows.find(s => s.mediaItemId === prog.showMediaItemId);
            if (show !== undefined) {
                let episodeNumber = prog.currentEpisode + 2;
                if (episodeNumber > show.episodeCount) {
                    episodeNumber = episodeNumber - show.episodeCount;
                }
                let nextNextEpisode = show.episodes?.find(ep => ep.episodeNumber === episodeNumber);
                if (nextNextEpisode !== undefined) {
                    return nextNextEpisode.duration === 1800;
                }
            }
            return false;
        });
        // Find all progressions that have a next episode duration limit under the duration that are not in the minProgressions
        let allProgressions = progressions.filter(prog => prog.nextEpisodeDurLimit <= duration && prog.nextEpisodeDurLimit > 1800);
        let selectedProgressions = [];
        if (allProgressions.length > 0 && minProgressions.length > 0) {
            //Flip a coin to determine which set of progressions to use
            if (Math.random() < 0.5) {
                selectedProgressions = minProgressions;
                numberOfEpisodes = 2;
            }
            else {
                selectedProgressions = allProgressions;
                numberOfEpisodes = 1;
            }
        }
        else if (allProgressions.length === 0 && minProgressions.length === 0) {
            return [undefined, 0];
        }
        else if (allProgressions.length === 0) {
            selectedProgressions = minProgressions;
            numberOfEpisodes = 2;
        }
        else if (minProgressions.length === 0) {
            selectedProgressions = allProgressions;
            numberOfEpisodes = 1;
        }
        selectedProgressions.forEach(prog => {
            let show = shows.find(s => s.mediaItemId === prog.showMediaItemId);
            if (show !== undefined) {
                selectedShows.push(show);
            }
        });
    }
    if (selectedShows.length === 0) {
        return [undefined, 0];
    }
    const randomIndex = Math.floor(Math.random() * selectedShows.length);
    return [selectedShows[randomIndex], numberOfEpisodes];
}
