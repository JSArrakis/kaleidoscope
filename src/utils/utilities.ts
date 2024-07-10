import { MediaProgression, ShowProgression } from "../models/mediaProgression";
import { SelectedMedia } from "../models/selectedMedia";
import { Show } from "../models/show";

export function getRandomMedia(objects: SelectedMedia[]): SelectedMedia {
    const randomIndex = Math.floor(Math.random() * objects.length);
    return objects[randomIndex];
}

export function ManageProgression(title: string, type: string, progression: MediaProgression[], show: Show, numOfEpsRequested: number): number[] {
    let episodeNumbers: number[] = []

    // To give better context, each MediaProgression object keeps the state of progression of shows in the siloed context of each collection (that contains shows) or for the main stream based on environment

    // Add progression if it doesnt already exist, or if the any shows present in the MediaProgression object are not present, add them
    addProgression(title, type, progression, show)

    // Theres a potential that multiple episodes played back to back in a block under certain circumstances, so we need to increment the progression for each episode requested
    for (let i = 0; i < numOfEpsRequested; i++) {
        // Get the contexual progression
        let progContext: MediaProgression = progression
            .filter(prog => prog.Title === title)[0];
        // Get the episode number for the show that is being selected to be played
        let episode = progContext.Shows.filter(item => item.LoadTitle === show.LoadTitle)[0].Episode;
        // Add the episode number to the array of episodes to be played. Subsequent episodes might not necessarily be just the next number. If the first episode in the array is the 
        // last episode of available episodes, the next episode will be the first episode of the show
        episodeNumbers.push(episode);
        // Increment the progression for the show that was just played
        // This makes the next episode available as the next episode to be played or restarts the series if the last episode is what is currently listed in the progression
        incrementProgression(progression, title, show);
    }
    return episodeNumbers;
}

export function ReduceProgression(title: string, showLoadTitle: string, progression: MediaProgression[]) {
    progression.filter(pitem => pitem.Title === title)[0].Shows
        .filter(fshow => fshow.LoadTitle === showLoadTitle)
        .forEach(sitem => {
            sitem.Episode = sitem.Episode - 1;
        });
}

export function incrementProgression(progression: MediaProgression[], title: string, show: Show) {
    progression.filter(pitem => pitem.Title === title)[0].Shows
        // Find matching show title in the progression object
        .filter(fshow => fshow.LoadTitle === show.LoadTitle)
        // Increment the episode number for each show that shares the load title (there should only be one)
        .forEach(sitem => {
            //Increment the episode number for the show
            sitem.Episode++;
            // If after incrementing the epsiode number, the episode number is greater than the total number of episodes, reset the episode number to 1 to restart the series
            if (sitem.Episode > show.EpisodeCount) {
                sitem.Episode = 1;
            }
        });
}

export function addProgression(title: string, type: string, progression: MediaProgression[], show: Show) {
    // Show progression is the object that will be added to the MediaProgression object it contains the show title and the episode number to be played next
    // The the first episode is always 1
    let showProg = new ShowProgression(show.LoadTitle, 1)
    // MediaProgression is an object that contains the progression of shows based on context. Each collection, or the main stream for an environment will have a MediaProgression object
    let progItem = new MediaProgression(title, type, [showProg])

    // Check if the title is already in the progression array
    let progressionItem: MediaProgression[] = progression
        .filter(prog => prog.Title === title)

    // If the MediaProgression (collection, or main stream) is not in the progression array, add it to the array
    if (progressionItem.length === 0) {
        progression.push(progItem)
    }


    // Check if the show is already in the listed shows for the target MediaProgression object that we just added.
    // The reason we do this instead of adding the show to the just created MediaProgression object is because there is a chance the show did not exist in the collection 
    // or main stream when the MediaProgression object originally was created.
    let selectedShowProgression: ShowProgression[] = progression
        .filter(prog => prog.Title === title)[0].Shows
        .filter(selShow => selShow.LoadTitle == show.LoadTitle);

    // If the show isnt present, add it to the MediaProgression object
    if (selectedShowProgression.length === 0) {
        progression.filter(pitem => pitem.Title === title)[0].Shows
            .push(showProg);
    }
}

export function keyNormalizer(key: string): string {
    return key.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
}

export function deepCopy<T>(obj: T): T {
    if (typeof obj !== 'object' || obj === null) {
        return obj; // primitive value or null
    }

    if (Array.isArray(obj)) {
        return obj.map(deepCopy) as T; // array
    }

    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
        result[key] = deepCopy(value); // object
    }

    return result as T;
}

