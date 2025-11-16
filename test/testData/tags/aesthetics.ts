import { Tag } from '../../../src/models/tag';
import { TagType } from '../../../src/models/const/tagTypes';

/**
 * Aesthetic test tags for Kaleidoscope testing
 * Based on docs/taxonomies/aesthetics/index.md examples and common aesthetic frameworks
 */

export const aestheticTags = {
  // Visual/Cultural presentation frameworks
  animation: new Tag('animation', 'Animation', TagType.Aesthetic),
  anime: new Tag('anime', 'Anime', TagType.Aesthetic),
  contemporary: new Tag('contemporary', 'Contemporary', TagType.Aesthetic),
  cyberpunk: new Tag('cyberpunk', 'Cyberpunk', TagType.Aesthetic),
  cgi: new Tag('cgi', 'CGI', TagType.Aesthetic),
  dystopian: new Tag('dystopian', 'Dystopian', TagType.Aesthetic),
  fantasy: new Tag('fantasy', 'Fantasy', TagType.Aesthetic),
  gothic: new Tag('gothic', 'Gothic', TagType.Aesthetic),
  historical: new Tag('historical', 'Historical', TagType.Aesthetic),
  mecha: new Tag('mecha', 'Mecha', TagType.Aesthetic),
  military: new Tag('military', 'Military', TagType.Aesthetic),
  nearFuture: new Tag('near-future', 'Near-Future', TagType.Aesthetic),
  noir: new Tag('noir', 'Noir', TagType.Aesthetic),
  postApocalyptic: new Tag(
    'post-apocalyptic',
    'Post-Apocalyptic',
    TagType.Aesthetic,
  ),
  pulp: new Tag('pulp', 'Pulp', TagType.Aesthetic),
  spaceOpera: new Tag('space-opera', 'Space Opera', TagType.Aesthetic),
  steampunk: new Tag('steampunk', 'Steampunk', TagType.Aesthetic),
  superhero: new Tag('superhero', 'Superhero', TagType.Aesthetic),
  supernatural: new Tag('supernatural', 'Supernatural', TagType.Aesthetic),
  urban: new Tag('urban', 'Urban', TagType.Aesthetic),
  western: new Tag('western', 'Western', TagType.Aesthetic),

  // Cultural/Setting aesthetics
  jidaigeki: new Tag('jidaigeki', 'Jidaigeki (Samurai)', TagType.Aesthetic),
  medieval: new Tag('medieval', 'Medieval', TagType.Aesthetic),
  pirate: new Tag('pirate', 'Pirate', TagType.Aesthetic),
  prehistoric: new Tag('prehistoric', 'Prehistoric', TagType.Aesthetic),
  victorian: new Tag('victorian', 'Victorian', TagType.Aesthetic),
  sports: new Tag('sports', 'Sports', TagType.Aesthetic),
  crime: new Tag('crime', 'Crime', TagType.Aesthetic),
};

export const aestheticTagsList = Object.values(aestheticTags);
