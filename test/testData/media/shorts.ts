import { createShort } from "../../../factories/short.factory";
import { ageGroupTags, eraTags, genreTags } from "../tags";

export const code8 = createShort(
  "Code 8",
  "code8",
  600,
  "/path/code8.mp4",
  MediaType.Short,
  [
    genreTags.action,
    genreTags.scifi,
    ageGroupTags.youngAdult,
    eraTags.twothousands,
  ]
);
export const lightsout = createShort(
  "Lights Out",
  "lightsout",
  180,
  "/path/lightsout.mp4",
  MediaType.Short,
  [genreTags.horror, ageGroupTags.mature, eraTags.twothousands]
);
export const rakka = createShort(
  "Rakka",
  "rakka",
  480,
  "/path/rakka.mp4",
  MediaType.Short,
  [genreTags.scifi, ageGroupTags.mature, eraTags.twothousands]
);
export const theblackhole = createShort(
  "The Black Hole",
  "theblackhole",
  180,
  "/path/theblackhole.mp4",
  MediaType.Short,
  [
    genreTags.scifi,
    genreTags.horror,
    ageGroupTags.youngAdult,
    eraTags.twothousands,
  ]
);
export const cargo = createShort(
  "Cargo",
  "cargo",
  420,
  "/path/cargo.mp4",
  MediaType.Short,
  [genreTags.horror, ageGroupTags.mature, eraTags.twothousands]
);
export const dust = createShort(
  "Dust",
  "dust",
  600,
  "/path/dust.mp4",
  MediaType.Short,
  [
    genreTags.scifi,
    genreTags.action,
    ageGroupTags.youngAdult,
    eraTags.twothousands,
  ]
);
export const portal = createShort(
  "Portal",
  "portal",
  480,
  "/path/portal.mp4",
  MediaType.Short,
  [
    genreTags.scifi,
    genreTags.action,
    ageGroupTags.youngAdult,
    eraTags.twothousands,
  ]
);
export const thegate = createShort(
  "The Gate",
  "thegate",
  360,
  "/path/thegate.mp4",
  MediaType.Short,
  [
    genreTags.horror,
    genreTags.action,
    ageGroupTags.mature,
    eraTags.twothousands,
  ]
);
export const alienharvest = createShort(
  "Alien: Harvest",
  "alienharvest",
  540,
  "/path/alienharvest.mp4",
  MediaType.Short,
  [genreTags.scifi, genreTags.horror, ageGroupTags.mature, eraTags.twothousands]
);
export const adam = createShort(
  "Adam",
  "adam",
  540,
  "/path/adam.mp4",
  MediaType.Short,
  [genreTags.scifi, ageGroupTags.youngAdult, eraTags.twothousands]
);

export const gopherBroke = createShort(
  "Gopher Broke",
  "gopherbroke",
  300,
  "/path/gopherbroke.mp4",
  MediaType.Short,
  [genreTags.adventure, ageGroupTags.family, eraTags.twothousands]
);

export const forTheBirds = createShort(
  "For the Birds",
  "forthebirds",
  240,
  "/path/forthebirds.mp4",
  MediaType.Short,
  [genreTags.adventure, ageGroupTags.family, eraTags.nineties]
);

export const boundin = createShort(
  "Boundin’",
  "boundin",
  300,
  "/path/boundin.mp4",
  MediaType.Short,
  [genreTags.adventure, ageGroupTags.family, eraTags.twothousands]
);

export const tinToy = createShort(
  "Tin Toy",
  "tintoy",
  300,
  "/path/tintoy.mp4",
  MediaType.Short,
  [genreTags.adventure, genreTags.scifi, ageGroupTags.kids, eraTags.nineties]
);

export const theAdventuresOfAndreAndWallyB = createShort(
  "The Adventures of André and Wally B.",
  "andreandwallyb",
  120,
  "/path/andreandwallyb.mp4",
  MediaType.Short,
  [genreTags.adventure, genreTags.scifi, ageGroupTags.kids, eraTags.nineties]
);

export const luxoJunior = createShort(
  "Luxo Jr.",
  "luxojunior",
  120,
  "/path/luxojunior.mp4",
  MediaType.Short,
  [genreTags.adventure, ageGroupTags.kids, eraTags.nineties]
);

export const oneManBand = createShort(
  "One Man Band",
  "onemanband",
  300,
  "/path/onemanband.mp4",
  MediaType.Short,
  [genreTags.adventure, ageGroupTags.family, eraTags.twothousands]
);

export const lifted = createShort(
  "Lifted",
  "lifted",
  300,
  "/path/lifted.mp4",
  MediaType.Short,
  [genreTags.scifi, ageGroupTags.kids, eraTags.twothousands]
);

export const knickknack = createShort(
  "Knick Knack",
  "knickknack",
  240,
  "/path/knickknack.mp4",
  MediaType.Short,
  [genreTags.adventure, ageGroupTags.kids, eraTags.nineties]
);

export const partlyCloudy = createShort(
  "Partly Cloudy",
  "partlycloudy",
  300,
  "/path/partlycloudy.mp4",
  MediaType.Short,
  [genreTags.adventure, ageGroupTags.family, eraTags.twothousands]
);

export const presto = createShort(
  "Presto",
  "presto",
  300,
  "/path/presto.mp4",
  MediaType.Short,
  [genreTags.adventure, ageGroupTags.kids, eraTags.twothousands]
);

export const gerisGame = createShort(
  "Geri’s Game",
  "gerisgame",
  240,
  "/path/gerisgame.mp4",
  MediaType.Short,
  [genreTags.adventure, ageGroupTags.family, eraTags.nineties]
);

export const shorts = [
  code8,
  lightsout,
  rakka,
  theblackhole,
  cargo,
  dust,
  portal,
  thegate,
  alienharvest,
  adam,
  gopherBroke,
  forTheBirds,
  boundin,
  tinToy,
  theAdventuresOfAndreAndWallyB,
  luxoJunior,
  oneManBand,
  lifted,
  knickknack,
  partlyCloudy,
  presto,
  gerisGame,
];
