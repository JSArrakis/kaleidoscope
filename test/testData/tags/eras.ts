import { createTag } from "../../../factories/tag.factory";

/**
 * Era test tags for Kaleidoscope testing
 * Based on docs/taxonomies/eras/index.md
 */

export const eraTags = {
  // Production era paradigms from documentation
  seventies: createTag("1970s", "1970s", TagType.Era),
  eighties: createTag("1980s", "1980s", TagType.Era),
  nineties: createTag("1990s", "1990s", TagType.Era),
  twothousands: createTag("2000s", "2000s", TagType.Era),
  twentytens: createTag("2010s", "2010s", TagType.Era),

  // Additional decades for broader coverage
  sixties: createTag("1960s", "1960s", TagType.Era),
  fifties: createTag("1950s", "1950s", TagType.Era),
  twentytwenties: createTag("2020s", "2020s", TagType.Era),
};

export const eraTagsList = Object.values(eraTags);
