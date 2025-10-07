import { Tag } from '../../../src/models/tag';
import { TagType } from '../../../src/models/const/tagTypes';

/**
 * Genre test tags for Kaleidoscope testing
 * Based on docs/taxonomies/genres/index.md and singles/*.md
 */

export const genreTags = {
  // Core genres from documentation
  action: new Tag('action', 'Action', TagType.Genre),
  adventure: new Tag('adventure', 'Adventure', TagType.Genre),
  comedy: new Tag('comedy', 'Comedy', TagType.Genre),
  crime: new Tag('crime', 'Crime', TagType.Genre),
  drama: new Tag('drama', 'Drama', TagType.Genre),
  horror: new Tag('horror', 'Horror', TagType.Genre),
  mystery: new Tag('mystery', 'Mystery', TagType.Genre),
  romance: new Tag('romance', 'Romance', TagType.Genre),
  scifi: new Tag('scifi', 'Science Fiction', TagType.Genre),
  thriller: new Tag('thriller', 'Thriller', TagType.Genre),

  // Additional genres seen in code
  educational: new Tag('educational', 'Educational', TagType.Genre),
};

export const genreTagsList = Object.values(genreTags);
