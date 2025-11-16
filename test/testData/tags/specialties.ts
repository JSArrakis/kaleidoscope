import { Tag } from '../../../src/models/tag';
import { TagType } from '../../../src/models/const/tagTypes';

/**
 * Specialty test tags for Kaleidoscope testing
 * Based on docs/taxonomies/specialties/index.md examples
 */

export const specialtyTags = {
  marvel: new Tag('mcu', 'MCU', TagType.Specialty),
  jurassicpark: new Tag('jurassicpark', 'Jurassic Park', TagType.Specialty),
  starwars: new Tag('starwars', 'Star Wars', TagType.Specialty),
  startrek: new Tag('startrek', 'Star Trek', TagType.Specialty),
  jamesbond: new Tag('jamesbond', 'James Bond', TagType.Specialty),
  streetfighter: new Tag('streetfighter', 'Street Fighter', TagType.Specialty),
  meninblack: new Tag('meninblack', 'Men in Black', TagType.Specialty),
  transformers: new Tag('transformers', 'Transformers', TagType.Specialty),
  alien: new Tag('alien', 'Alien', TagType.Specialty),
  lego: new Tag('lego', 'LEGO', TagType.Specialty),
  xmen: new Tag('xmen', 'X-Men', TagType.Specialty),
};

export const specialtyTagsList = Object.values(specialtyTags);
