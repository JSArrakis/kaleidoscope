import { createPromo } from "../../../factories/promo.factory";
import { ageGroupTags, eraTags, genreTags, specialtyTags } from "../tags";

export const promo1 = createPromo(
  "Promo 1",
  "promo1",
  15,
  "/path/promo1.mp4",
  MediaType.Promo,
  [],
);

export const defaultPromo = createPromo(
  "Default Promo",
  "defaultpromo",
  15,
  "/path/defaultpromo.mp4",
  MediaType.Promo,
  [],
);

export const promos = [promo1, defaultPromo];

export const scifiNightPromo = createPromo(
  "Sci-Fi Friday Night Promo",
  "scifi-friday-night-promo",
  20,
  "/path/promos/scifi-friday-night-promo.mp4",
  MediaType.Promo,
  [
    genreTags.scifi,
    genreTags.thriller,
    ageGroupTags.youngAdult,
    eraTags.twentytens,
  ],
);

export const familyAdventurePromo = createPromo(
  "Family Adventure Hour Promo",
  "family-adventure-hour-promo",
  15,
  "/path/promos/family-adventure-hour-promo.mp4",
  MediaType.Promo,
  [genreTags.adventure, ageGroupTags.family, eraTags.twothousands],
);

export const starWarsWeekendPromo = createPromo(
  "Star Wars Weekend Programming Promo",
  "star-wars-weekend-programming-promo",
  30,
  "/path/promos/star-wars-weekend-programming-promo.mp4",
  MediaType.Promo,
  [
    genreTags.scifi,
    genreTags.action,
    ageGroupTags.family,
    eraTags.twentytwenties,
    specialtyTags.starwars,
  ],
);

export const horrorMidnightPromo = createPromo(
  "Midnight Horror Block Promo",
  "midnight-horror-block-promo",
  20,
  "/path/promos/midnight-horror-block-promo.mp4",
  MediaType.Promo,
  [
    genreTags.horror,
    genreTags.mystery,
    ageGroupTags.mature,
    eraTags.twothousands,
  ],
);

export const retroCinemaVaultPromo = createPromo(
  "Retro Cinema Vault Promo",
  "retro-cinema-vault-promo",
  27,
  "/path/promos/retro-cinema-vault-promo.mp4",
  MediaType.Promo,
  [
    genreTags.drama,
    genreTags.mystery,
    ageGroupTags.family,
    eraTags.twothousands,
  ],
);

export const mechaMarathonPromo = createPromo(
  "Mecha Marathon Promo",
  "mecha-marathon-promo",
  33,
  "/path/promos/mecha-marathon-promo.mp4",
  MediaType.Promo,
  [
    genreTags.action,
    genreTags.scifi,
    ageGroupTags.youngAdult,
    eraTags.twothousands,
  ],
);

export const detectiveWeekendPromo = createPromo(
  "Detective Weekend Promo",
  "detective-weekend-promo",
  24,
  "/path/promos/detective-weekend-promo.mp4",
  MediaType.Promo,
  [
    genreTags.mystery,
    genreTags.crime,
    ageGroupTags.youngAdult,
    eraTags.twentytens,
  ],
);

export const romanceMatineePromo = createPromo(
  "Romance Matinee Promo",
  "romance-matinee-promo",
  19,
  "/path/promos/romance-matinee-promo.mp4",
  MediaType.Promo,
  [
    genreTags.romance,
    genreTags.drama,
    ageGroupTags.family,
    eraTags.twothousands,
  ],
);

export const summerActionStackPromo = createPromo(
  "Summer Action Stack Promo",
  "summer-action-stack-promo",
  42,
  "/path/promos/summer-action-stack-promo.mp4",
  MediaType.Promo,
  [
    genreTags.action,
    genreTags.adventure,
    ageGroupTags.youngAdult,
    eraTags.twentytens,
  ],
);

export const educationalSpotlightPromo = createPromo(
  "Educational Spotlight Promo",
  "educational-spotlight-promo",
  22,
  "/path/promos/educational-spotlight-promo.mp4",
  MediaType.Promo,
  [genreTags.educational, ageGroupTags.kids, eraTags.twentytens],
);

export const cultClassicsAfterDarkPromo = createPromo(
  "Cult Classics After Dark Promo",
  "cult-classics-after-dark-promo",
  37,
  "/path/promos/cult-classics-after-dark-promo.mp4",
  MediaType.Promo,
  [
    genreTags.horror,
    genreTags.thriller,
    ageGroupTags.mature,
    eraTags.twentytens,
  ],
);

export const saturdayScifiKidsPromo = createPromo(
  "Saturday Sci-Fi Kids Promo",
  "saturday-scifi-kids-promo",
  18,
  "/path/promos/saturday-scifi-kids-promo.mp4",
  MediaType.Promo,
  [
    genreTags.scifi,
    genreTags.adventure,
    ageGroupTags.kids,
    eraTags.twothousands,
  ],
);

export const starTrekFederationNightPromo = createPromo(
  "Star Trek Federation Night Promo",
  "star-trek-federation-night-promo",
  35,
  "/path/promos/star-trek-federation-night-promo.mp4",
  MediaType.Promo,
  [
    genreTags.scifi,
    genreTags.drama,
    ageGroupTags.family,
    eraTags.twentytens,
    specialtyTags.startrek,
  ],
);

export const marvelHeroHourPromo = createPromo(
  "Marvel Hero Hour Promo",
  "marvel-hero-hour-promo",
  29,
  "/path/promos/marvel-hero-hour-promo.mp4",
  MediaType.Promo,
  [
    genreTags.action,
    genreTags.adventure,
    ageGroupTags.family,
    eraTags.twentytens,
    specialtyTags.marvel,
  ],
);

export const alienSignalInterceptPromo = createPromo(
  "Alien Signal Intercept Promo",
  "alien-signal-intercept-promo",
  31,
  "/path/promos/alien-signal-intercept-promo.mp4",
  MediaType.Promo,
  [
    genreTags.scifi,
    genreTags.horror,
    ageGroupTags.mature,
    eraTags.twentytens,
    specialtyTags.alien,
  ],
);

export const realisticPromos = [
  scifiNightPromo,
  familyAdventurePromo,
  starWarsWeekendPromo,
  horrorMidnightPromo,
  retroCinemaVaultPromo,
  mechaMarathonPromo,
  detectiveWeekendPromo,
  romanceMatineePromo,
  summerActionStackPromo,
  educationalSpotlightPromo,
  cultClassicsAfterDarkPromo,
  saturdayScifiKidsPromo,
  starTrekFederationNightPromo,
  marvelHeroHourPromo,
  alienSignalInterceptPromo,
];
