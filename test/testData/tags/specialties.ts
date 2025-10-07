import { Tag } from '../../../src/models/tag';
import { TagType } from '../../../src/models/const/tagTypes';

/**
 * Specialty test tags for Kaleidoscope testing
 * Based on docs/taxonomies/specialties/index.md examples
 */

export const specialtyTags = {
  // Creator-based specialties
  miyazaki: new Tag('miyazaki', 'Hayao Miyazaki Films', TagType.Specialty),
  nolan: new Tag('nolan', 'Christopher Nolan Films', TagType.Specialty),
  tarantino: new Tag('tarantino', 'Quentin Tarantino Films', TagType.Specialty),
  pixar: new Tag('pixar', 'Pixar Studios', TagType.Specialty),
  ghibli: new Tag('ghibli', 'Studio Ghibli', TagType.Specialty),
  marvel: new Tag('marvel', 'Marvel Studios', TagType.Specialty),
  jurassicpark: new Tag(
    'jurassic-park',
    'Jurassic Park Franchise',
    TagType.Specialty,
  ),
  starWars: new Tag('star-wars', 'Star Wars Universe', TagType.Specialty),
  starTrek: new Tag('star-trek', 'Star Trek Universe', TagType.Specialty),
  jamesBond: new Tag('james-bond', 'James Bond Franchise', TagType.Specialty),
  godzilla: new Tag('godzilla', 'Godzilla Franchise', TagType.Specialty),
  stephenKing: new Tag(
    'stephen-king',
    'Stephen King Adaptations',
    TagType.Specialty,
  ),

  // Thematic/mood specialties
  comfortMedia: new Tag(
    'comfort-media',
    'Comfort Food Cinema',
    TagType.Specialty,
  ),
  practicalEffects: new Tag(
    'practical-effects',
    'Practical Effects Showcases',
    TagType.Specialty,
  ),
  socialCommentary: new Tag(
    'social-commentary',
    'Social Commentary Films',
    TagType.Specialty,
  ),
  environmentalThemes: new Tag(
    'environmental-themes',
    'Environmental Themes',
    TagType.Specialty,
  ),

  // Personal history specialties
  childhoodFavorites: new Tag(
    'childhood-favorites',
    'Childhood Favorites',
    TagType.Specialty,
  ),
  dateNight: new Tag('date-night', 'Date Night Movies', TagType.Specialty),
  familyGathering: new Tag(
    'family-gathering',
    'Family Gathering Films',
    TagType.Specialty,
  ),
  saturdayAfternoon: new Tag(
    'saturday-afternoon',
    'Saturday Afternoon Viewing',
    TagType.Specialty,
  ),

  // Technical achievement specialties
  cinematography: new Tag(
    'cinematography',
    'Cinematography Masters',
    TagType.Specialty,
  ),
  soundtrack: new Tag(
    'soundtrack',
    'Outstanding Soundtracks',
    TagType.Specialty,
  ),
  animationBreakthrough: new Tag(
    'animation-breakthrough',
    'Animation Breakthroughs',
    TagType.Specialty,
  ),
};

export const specialtyTagsList = Object.values(specialtyTags);
