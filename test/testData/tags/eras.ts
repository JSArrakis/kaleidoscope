import { Tag } from '../../../src/models/tag';
import { TagType } from '../../../src/models/const/tagTypes';

/**
 * Era test tags for Kaleidoscope testing
 * Based on docs/taxonomies/eras/index.md
 */

export const eraTags = {
  // Production era paradigms from documentation
  seventies: new Tag(
    '1970s',
    '1970s',
    TagType.Era,
  ),
  eighties: new Tag(
    '1980s',
    '1980s',
    TagType.Era,
  ),
  nineties: new Tag(
    '1990s',
    '1990s',
    TagType.Era,
  ),
  twothousands: new Tag(
    '2000s',
    '2000s',
    TagType.Era,
  ),
  twentytens: new Tag(
    '2010s',
    '2010s',
    TagType.Era,
  ),

  // Additional decades for broader coverage
  sixties: new Tag(
    '1960s',
    '1960s',
    TagType.Era,
  ),
  fifties: new Tag(
    '1950s',
    '1950s',
    TagType.Era,
  ),
  twentytwenties: new Tag(
    '2020s',
    '2020s',
    TagType.Era,
  ),
};

export const eraTagsList = Object.values(eraTags);
