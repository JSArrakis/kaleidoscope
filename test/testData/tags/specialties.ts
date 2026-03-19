import { createTag } from "../../../factories/tag.factory";

/**
 * Specialty test tags for Kaleidoscope testing
 * Based on docs/taxonomies/specialties/index.md examples
 */

export const specialtyTags = {
  marvel: createTag("mcu", "MCU", TagType.Specialty),
  jurassicpark: createTag("jurassicpark", "Jurassic Park", TagType.Specialty),
  starwars: createTag("starwars", "Star Wars", TagType.Specialty),
  startrek: createTag("startrek", "Star Trek", TagType.Specialty),
  jamesbond: createTag("jamesbond", "James Bond", TagType.Specialty),
  streetfighter: createTag(
    "streetfighter",
    "Street Fighter",
    TagType.Specialty
  ),
  meninblack: createTag("meninblack", "Men in Black", TagType.Specialty),
  transformers: createTag("transformers", "Transformers", TagType.Specialty),
  alien: createTag("alien", "Alien", TagType.Specialty),
  lego: createTag("lego", "LEGO", TagType.Specialty),
  xmen: createTag("xmen", "X-Men", TagType.Specialty),
};

export const specialtyTagsList = Object.values(specialtyTags);
