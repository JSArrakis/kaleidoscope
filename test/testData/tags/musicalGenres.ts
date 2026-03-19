import { createTag } from "../../../factories/tag.factory";

/**
 * Musical Genre test tags for Kaleidoscope testing
 * Based on musical genres seen in mosaics and common music categories
 */

export const musicalGenreTags = {
  blues: createTag("blues", "Blues", TagType.MusicalGenre),
  classical: createTag("classical", "Classical", TagType.MusicalGenre),
  country: createTag("country", "Country", TagType.MusicalGenre),
  electronic: createTag("electronic", "Electronic", TagType.MusicalGenre),
  folk: createTag("folk", "Folk", TagType.MusicalGenre),
  hiphop: createTag("hiphop", "Hip Hop", TagType.MusicalGenre),
  jazz: createTag("jazz", "Jazz", TagType.MusicalGenre),
  metal: createTag("metal", "Metal", TagType.MusicalGenre),
  pop: createTag("pop", "Pop", TagType.MusicalGenre),
  punk: createTag("punk", "Punk", TagType.MusicalGenre),
  rnb: createTag("rnb", "R&B", TagType.MusicalGenre),
  rock: createTag("rock", "Rock", TagType.MusicalGenre),
  alternative: createTag("alternative", "Alternative", TagType.MusicalGenre),
  ambient: createTag("ambient", "Ambient", TagType.MusicalGenre),
  disco: createTag("disco", "Disco", TagType.MusicalGenre),
  funk: createTag("funk", "Funk", TagType.MusicalGenre),
  gospel: createTag("gospel", "Gospel", TagType.MusicalGenre),
  grunge: createTag("grunge", "Grunge", TagType.MusicalGenre),
  indie: createTag("indie", "Indie", TagType.MusicalGenre),
  orchestral: createTag("orchestral", "Orchestral", TagType.MusicalGenre),
  reggae: createTag("reggae", "Reggae", TagType.MusicalGenre),
  synthwave: createTag("synthwave", "Synthwave", TagType.MusicalGenre),
  darkwave: createTag("darkwave", "Darkwave", TagType.MusicalGenre),
  industrialrock: createTag(
    "industrialrock",
    "Industrial Rock",
    TagType.MusicalGenre
  ),
  avantgarde: createTag("avantgarde", "Avant-Garde", TagType.MusicalGenre),
  neoclassical: createTag("neoclassical", "Neo-Classical", TagType.MusicalGenre),
  electronicMinimalist: createTag(
    "electronicminimalist",
    "Electronic Minimalist",
    TagType.MusicalGenre
  ),
  postrock: createTag("postrock", "Post-Rock", TagType.MusicalGenre),
  darkambient: createTag("darkambient", "Dark Ambient", TagType.MusicalGenre),
  breakcore: createTag("breakcore", "Breakcore", TagType.MusicalGenre),
};

export const musicalGenreTagsList = Object.values(musicalGenreTags);
