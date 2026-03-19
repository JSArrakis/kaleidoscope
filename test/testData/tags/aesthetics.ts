import { createTag } from "../../../factories/tag.factory";
/**
 * Aesthetic test tags for Kaleidoscope testing
 * Based on docs/taxonomies/aesthetics/index.md examples and common aesthetic frameworks
 */

export const aestheticTags = {
  // Visual/Cultural presentation frameworks
  animation: createTag("animation", "Animation", TagType.Aesthetic),
  anime: createTag("anime", "Anime", TagType.Aesthetic),
  contemporary: createTag("contemporary", "Contemporary", TagType.Aesthetic),
  cyberpunk: createTag("cyberpunk", "Cyberpunk", TagType.Aesthetic),
  cgi: createTag("cgi", "CGI", TagType.Aesthetic),
  dystopian: createTag("dystopian", "Dystopian", TagType.Aesthetic),
  fantasy: createTag("fantasy", "Fantasy", TagType.Aesthetic),
  gothic: createTag("gothic", "Gothic", TagType.Aesthetic),
  historical: createTag("historical", "Historical", TagType.Aesthetic),
  mecha: createTag("mecha", "Mecha", TagType.Aesthetic),
  military: createTag("military", "Military", TagType.Aesthetic),
  nearFuture: createTag("near-future", "Near-Future", TagType.Aesthetic),
  noir: createTag("noir", "Noir", TagType.Aesthetic),
  postApocalyptic: createTag(
    "post-apocalyptic",
    "Post-Apocalyptic",
    TagType.Aesthetic
  ),
  pulp: createTag("pulp", "Pulp", TagType.Aesthetic),
  spaceOpera: createTag("space-opera", "Space Opera", TagType.Aesthetic),
  steampunk: createTag("steampunk", "Steampunk", TagType.Aesthetic),
  superhero: createTag("superhero", "Superhero", TagType.Aesthetic),
  supernatural: createTag("supernatural", "Supernatural", TagType.Aesthetic),
  urban: createTag("urban", "Urban", TagType.Aesthetic),
  western: createTag("western", "Western", TagType.Aesthetic),

  // Cultural/Setting aesthetics
  jidaigeki: createTag("jidaigeki", "Jidaigeki (Samurai)", TagType.Aesthetic),
  medieval: createTag("medieval", "Medieval", TagType.Aesthetic),
  pirate: createTag("pirate", "Pirate", TagType.Aesthetic),
  prehistoric: createTag("prehistoric", "Prehistoric", TagType.Aesthetic),
  victorian: createTag("victorian", "Victorian", TagType.Aesthetic),
  sports: createTag("sports", "Sports", TagType.Aesthetic),
  crime: createTag("crime", "Crime", TagType.Aesthetic),
};

export const aestheticTagsList = Object.values(aestheticTags);
