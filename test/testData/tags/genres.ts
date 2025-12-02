import { createTag } from "../../../factories/tag.factory";

/**
 * Genre test tags for Kaleidoscope testing
 * Based on docs/taxonomies/genres/index.md and singles/*.md
 */

export const genreTags = {
  // Core genres from documentation
  action: createTag("Action", "action", TagType.Genre),
  adventure: createTag("Adventure", "adventure", TagType.Genre),
  comedy: createTag("Comedy", "comedy", TagType.Genre),
  crime: createTag("Crime", "crime", TagType.Genre),
  drama: createTag("Drama", "drama", TagType.Genre),
  horror: createTag("Horror", "horror", TagType.Genre),
  mystery: createTag("Mystery", "mystery", TagType.Genre),
  romance: createTag("Romance", "romance", TagType.Genre),
  scifi: createTag("Science Fiction", "scifi", TagType.Genre),
  thriller: createTag("Thriller", "thriller", TagType.Genre),

  // Additional genres seen in code
  educational: createTag("Educational", "educational", TagType.Genre),
};

export const genreTagsList = Object.values(genreTags);
