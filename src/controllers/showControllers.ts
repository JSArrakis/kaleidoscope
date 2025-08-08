import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Show } from '../models/show';
import { getMediaDuration } from '../utils/utilities';
import { showRepository } from '../repositories/showRepository';

export async function createShowHandler(
  req: Request,
  res: Response,
): Promise<void> {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  let mediaItemId = req.body.mediaItemId;

  if (!mediaItemId) {
    res.status(400).json({ message: 'mediaItemId is required' });
    return;
  }

  const show = showRepository.findByMediaItemId(mediaItemId);

  if (show) {
    res.status(400).json({
      message: `Show with mediaItemId: ${req.body.mediaItemId} already exists`,
    });
    return;
  }
  // If it doesn't exist, perform transformations
  let createdShow = await transformShowFromRequest(req.body);
  // TODO: Check for duplicate episode paths on this show
  // If there are duplicate episode paths, return error
  const episodePaths = createdShow.episodes.map(episode => episode.path);
  const uniqueEpisodePaths = new Set(episodePaths);
  if (uniqueEpisodePaths.size !== episodePaths.length) {
    res.status(400).json({
      message: 'Show contains duplicate episode paths',
      duplicatePaths: episodePaths.filter(
        (path, index) => episodePaths.indexOf(path) !== index,
      ),
    });
    return;
  }

  // Insert show into MongoDB
  showRepository.create(createdShow);

  res.status(200).json({ message: 'Show  Created' });
  return;
}

// Delete Show by Load Title
export async function deleteShowHandler(
  req: Request,
  res: Response,
): Promise<void> {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  let mediaItemId = req.query.mediaItemId as string;

  if (!mediaItemId) {
    res.status(400).json({ message: 'mediaItemId is required' });
    return;
  }

  // Retrieve show from MongoDB using show load title if it exists
  const show = showRepository.findByMediaItemId(mediaItemId);

  // If it doesn't exist, return error
  if (!show) {
    res.status(400).json({ message: 'Show does not exist' });
    return;
  }

  // If it exists, delete it
  showRepository.delete(mediaItemId);

  res.status(200).json({ message: `Show ${show.title} Deleted` });
  return;
}

export async function updateShowHandler(
  req: Request,
  res: Response,
): Promise<void> {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  let mediaItemId = req.body.mediaItemId;
  if (!mediaItemId) {
    res.status(400).json({ message: 'MediaItemId is required' });
    return;
  }

  // Retrieve show from MongoDB using show load title if it exists
  const show = showRepository.findByMediaItemId(mediaItemId);

  // If it doesn't exist, return error
  if (!show) {
    res
      .status(400)
      .json({ message: `Show with ID ${mediaItemId} does not exist` });
    return;
  }

  // If it exists, perform transformations
  let updatedShow = await transformShowFromRequest(req.body);
  const episodePaths = updatedShow.episodes.map(episode => episode.path);
  const uniqueEpisodePaths = new Set(episodePaths);
  if (uniqueEpisodePaths.size !== episodePaths.length) {
    res.status(400).json({
      message: 'Show contains duplicate episode paths',
      duplicatePaths: episodePaths.filter(
        (path, index) => episodePaths.indexOf(path) !== index,
      ),
    });
    return;
  }

  // Update show in MongoDB
  showRepository.update(mediaItemId, updatedShow);

  res.status(200).json({ message: `Show ${updatedShow.title} Updated` });
  return;
}

export async function getShowHandler(
  req: Request,
  res: Response,
): Promise<void> {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  let mediaItemId = req.query.mediaItemId as string;

  if (!mediaItemId) {
    res.status(400).json({ message: 'mediaItemId is required' });
    return;
  }

  const show = showRepository.findByMediaItemId(mediaItemId);

  // If it doesn't exist, return error
  if (!show) {
    res
      .status(404)
      .json({ message: `Show with ID ${mediaItemId} does not exist` });
    return;
  }

  res.status(200).json(show);
  return;
}

export async function getAllShowsHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const shows = showRepository.findAll();

  res.status(200).json(shows);
  return;
}

export async function transformShowFromRequest(show: Show): Promise<Show> {
  for (const episode of show.episodes) {
    if (episode.duration > 0) continue; // Skip if duration is already set
    episode.showItemId = show.mediaItemId; // Set showItemId for the episode
    console.log(`Getting duration for ${episode.path}`);
    let durationInSeconds = await getMediaDuration(episode.path);
    episode.duration = durationInSeconds; // Update duration value
    episode.durationLimit =
      Math.floor(episode.duration / 1800) * 1800 +
      (episode.duration % 1800 > 0 ? 1800 : 0);
    // set episode load title using show load title and episode number
  }

  //create an accounting of how many different duration limits there are and create a map of it
  let durationLimitsMap = new Map();
  show.episodes.forEach(episode => {
    if (durationLimitsMap.has(episode.durationLimit)) {
      durationLimitsMap.set(
        episode.durationLimit,
        durationLimitsMap.get(episode.durationLimit) + 1,
      );
    } else {
      durationLimitsMap.set(episode.durationLimit, 1);
    }
  });

  //use the map to determine which duration limit is the most common and use that as the show duration limit
  let maxCount = 0;
  let maxDurationLimit = 0;
  durationLimitsMap.forEach((value, key) => {
    if (value > maxCount) {
      maxCount = value;
      maxDurationLimit = key;
    }
  });
  show.durationLimit = maxDurationLimit;

  //if there are episodes with durations over the duration limit, set the show to over duration
  show.overDuration = show.episodes.some(
    episode => episode.duration > show.durationLimit,
  );

  //set the episode count to the length of the episodes array
  show.episodeCount = show.episodes.length;

  //specific epdiode tags that are not presenting in the show tags are added as secondary tags
  const showTagIds = new Set(show.tags.map(tag => tag.tagId));
  const secondaryTagsSet = new Set<string>();
  
  show.episodes.forEach(episode => {
    episode.tags.forEach(tag => {
      if (!showTagIds.has(tag.tagId)) {
        secondaryTagsSet.add(tag.tagId);
      }
    });
  });

  // Convert secondary tag IDs back to Tag objects
  show.secondaryTags = Array.from(secondaryTagsSet).map(tagId => {
    // Find the tag object from any episode that has it
    for (const episode of show.episodes) {
      const foundTag = episode.tags.find(tag => tag.tagId === tagId);
      if (foundTag) return foundTag;
    }
    return null;
  }).filter(tag => tag !== null) as any[];

  //create a list of episodes that is sorted by episode.episode disregarding the fields episodeNumber and season
  const sortedEpisodes = show.episodes.sort((a, b) => {
    if (a.episode < b.episode) return -1;
    if (a.episode > b.episode) return 1;
    return 0;
  });

  // If the first episode is over the duration limit, set the show to first episode over duration
  if (sortedEpisodes.length > 0) {
    show.firstEpisodeOverDuration =
      sortedEpisodes[0].duration > show.durationLimit;
  } else {
    show.firstEpisodeOverDuration = false;
  }
  return show;
}
