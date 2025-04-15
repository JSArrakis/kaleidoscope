import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { ShowModel, Show } from '../models/show';
import { getMediaDuration } from '../utils/utilities';

// ===========================================
//               SHOW HANDLERS
// ===========================================

export async function createShowHandler(
  req: Request,
  res: Response,
): Promise<void> {
  console.log('Incoming request to create show', req.body);
  // Check for validation errors
  const errors = validationResult(req);

  console.log('Show Creation Errors', errors.array());
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  // Retrieve show from MongoDB using show load title if it exists
  const show = await ShowModel.findOne({ mediaItemId: req.body.mediaItemId });

  // If it exists, return error
  if (show) {
    res.status(400).json({
      message: `Show with mediaItemId : ${req.body.mediaItemId} already exists`,
    });
    return;
  }
  // If it doesn't exist, perform transformations
  let createdShow = await transformShowFromRequest(req.body);

  // Insert show into MongoDB
  await ShowModel.create(createdShow);

  res.status(200).json({ message: 'Show Created' });
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

  // Retrieve show from MongoDB using show load title if it exists
  const show = await ShowModel.findOne({ mediaItemId: req.query.mediaItemId });

  // If it doesn't exist, return error
  if (!show) {
    res.status(400).json({ message: 'Show does not exist' });
    return;
  }

  // If it exists, delete it
  await ShowModel.deleteOne({ _id: show._id });

  res.status(200).json({ message: 'Show Deleted' });
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

  // Retrieve show from MongoDB using show load title if it exists
  const show = await ShowModel.findOne({ mediaItemId: req.body.mediaItemId });

  // If it doesn't exist, return error
  if (!show) {
    res.status(400).json({ message: 'Show does not exist' });
    return;
  }

  // If it exists, perform transformations
  let updatedShow = await transformShowFromRequest(req.body);

  // Update show in MongoDB
  await ShowModel.updateOne({ _id: show._id }, updatedShow);

  res.status(200).json({ message: 'Show Updated' });
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

  // Retrieve show from MongoDB using show load title if it exists using request params
  const show = await ShowModel.findOne({ mediaItemId: req.query.mediaItemId });

  // If it doesn't exist, return error
  if (!show) {
    res.status(404).json({ message: 'Show does not exist' });
    return;
  }

  res.status(200).json(show);
  return;
}

export async function getAllShowsHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const shows = await ShowModel.find();

  res.status(200).json(shows);
  return;
}

export async function getAllShowsDataHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const shows = await ShowModel.find();

  if (!shows || shows.length === 0) {
    res.status(404).json({ message: 'No Shows Found' });
    return;
  }
  let showsData = shows.map((show: any) => {
    return {
      title: show.title,
      mediaItemId: show.mediaItemId,
      alias: show.alias,
      imdb: show.imdb,
      durationLimit: show.durationLimit,
      overDuration: show.overDuration,
      firstEpisodeOverDuration: show.firstEpisodeOverDuration,
      tags: show.tags,
      secondaryTags: show.secondaryTags,
      episodeCount: show.episodeCount,
    };
  });

  res.status(200).json(showsData);
  return;
}

export async function transformShowFromRequest(show: Show): Promise<Show> {
  for (const episode of show.episodes) {
    if (episode.duration > 0) continue; // Skip if duration is already set
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
  show.secondaryTags = show.episodes.reduce((acc: string[], episode) => {
    episode.tags.forEach((tag: string) => {
      if (!show.tags.includes(tag)) {
        acc.push(tag);
      }
    });
    return acc;
  }, []);

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
