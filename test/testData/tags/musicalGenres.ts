import { Tag } from '../../../src/models/tag';
import { TagType } from '../../../src/models/const/tagTypes';

/**
 * Musical Genre test tags for Kaleidoscope testing
 * Based on musical genres seen in mosaics and common music categories
 */

export const musicalGenreTags = {
  // Core musical genres
  blues: new Tag('blues', 'Blues', TagType.MusicalGenre),
  classical: new Tag('classical', 'Classical', TagType.MusicalGenre),
  country: new Tag('country', 'Country', TagType.MusicalGenre),
  electronic: new Tag('electronic', 'Electronic', TagType.MusicalGenre),
  folk: new Tag('folk', 'Folk', TagType.MusicalGenre),
  hiphop: new Tag('hiphop', 'Hip Hop', TagType.MusicalGenre),
  jazz: new Tag('jazz', 'Jazz', TagType.MusicalGenre),
  metal: new Tag('metal', 'Metal', TagType.MusicalGenre),
  pop: new Tag('pop', 'Pop', TagType.MusicalGenre),
  punk: new Tag('punk', 'Punk', TagType.MusicalGenre),
  rnb: new Tag('rnb', 'R&B', TagType.MusicalGenre),
  rock: new Tag('rock', 'Rock', TagType.MusicalGenre),

  // Additional genres for diversity
  alternative: new Tag('alternative', 'Alternative', TagType.MusicalGenre),
  ambient: new Tag('ambient', 'Ambient', TagType.MusicalGenre),
  disco: new Tag('disco', 'Disco', TagType.MusicalGenre),
  funk: new Tag('funk', 'Funk', TagType.MusicalGenre),
  gospel: new Tag('gospel', 'Gospel', TagType.MusicalGenre),
  grunge: new Tag('grunge', 'Grunge', TagType.MusicalGenre),
  indie: new Tag('indie', 'Indie', TagType.MusicalGenre),
  orchestral: new Tag('orchestral', 'Orchestral', TagType.MusicalGenre),
  reggae: new Tag('reggae', 'Reggae', TagType.MusicalGenre),
  synthwave: new Tag('synthwave', 'Synthwave', TagType.MusicalGenre),
};

export const musicalGenreTagsList = Object.values(musicalGenreTags);
