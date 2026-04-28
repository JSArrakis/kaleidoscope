import { createMovie } from "../../../factories/movie.factory";
import {
  ageGroupTags,
  aestheticTags,
  eraTags,
  genreTags,
  specialtyTags,
} from "../tags";

export const inception = createMovie(
  "Inception",
  "inception",
  "inception",
  "tt1375666",
  "/path/inception.mp4",
  8880,
  9000,
  MediaType.Movie,
  [
    genreTags.scifi,
    genreTags.thriller,
    aestheticTags.nearFuture,
    aestheticTags.contemporary,
    ageGroupTags.mature,
    eraTags.twentytens,
  ],
);

export const therock = createMovie(
  "The Rock",
  "therock",
  "therock",
  "tt0117500",
  "/path/therock.mp4",
  8160,
  9000,
  MediaType.Movie,
  [
    genreTags.action,
    genreTags.thriller,
    aestheticTags.military,
    aestheticTags.contemporary,
    ageGroupTags.mature,
    eraTags.nineties,
  ],
);

export const thematrix = createMovie(
  "The Matrix",
  "thematrix",
  "matrix",
  "tt0133093",
  "/path/thematrix.mp4",
  8160,
  9000,
  MediaType.Movie,
  [
    genreTags.scifi,
    genreTags.action,
    aestheticTags.cyberpunk,
    aestheticTags.contemporary,
    ageGroupTags.youngAdult,
    eraTags.nineties,
  ],
);

export const interstellar = createMovie(
  "Interstellar",
  "interstellar",
  "interstellar",
  "tt0816692",
  "/path/interstellar.mp4",
  10140,
  10800,
  MediaType.Movie,
  [
    genreTags.scifi,
    genreTags.drama,
    aestheticTags.nearFuture,
    ageGroupTags.youngAdult,
    eraTags.twentytens,
  ],
);

export const dune = createMovie(
  "Dune",
  "dune",
  "dune",
  "tt1160419",
  "/path/dune.mp4",
  9120,
  10800,
  MediaType.Movie,
  [
    genreTags.scifi,
    genreTags.drama,
    aestheticTags.spaceOpera,
    ageGroupTags.youngAdult,
    eraTags.twentytwenties,
  ],
);

export const terminator2 = createMovie(
  "Terminator 2: Judgement Day",
  "terminator2",
  "terminator2",
  "tt0103064",
  "/path/terminator2.mp4",
  9300,
  10800,
  MediaType.Movie,
  [
    genreTags.action,
    genreTags.scifi,
    genreTags.horror,
    aestheticTags.contemporary,
    ageGroupTags.mature,
    eraTags.nineties,
  ],
);

export const therescuersdownunder = createMovie(
  "The Rescuers Down Under",
  "therescuersdownunder",
  "therescuersdownunder",
  "tt0100477",
  "/path/therescuersdownunder.mp4",
  4620,
  5400,
  MediaType.Movie,
  [
    genreTags.adventure,
    genreTags.drama,
    aestheticTags.animation,
    aestheticTags.contemporary,
    ageGroupTags.family,
    eraTags.nineties,
  ],
);

export const agoofymovie = createMovie(
  "A Goofy Movie",
  "agoofymovie",
  "agoofymovie",
  "tt0113198",
  "/path/agoofymovie.mp4",
  4680,
  5400,
  MediaType.Movie,
  [
    genreTags.comedy,
    genreTags.drama,
    aestheticTags.animation,
    aestheticTags.contemporary,
    ageGroupTags.family,
    eraTags.nineties,
  ],
);

export const movies = [
  inception,
  therock,
  thematrix,
  interstellar,
  dune,
  terminator2,
  therescuersdownunder,
  agoofymovie,
];

export const alien1979 = createMovie(
  "Alien",
  "alien1979",
  "alien",
  "tt0078748",
  "/path/movies/alien-1979.mp4",
  7020,
  7200,
  MediaType.Movie,
  [
    genreTags.scifi,
    genreTags.horror,
    genreTags.thriller,
    aestheticTags.spaceOpera,
    aestheticTags.military,
    ageGroupTags.mature,
    eraTags.seventies,
    specialtyTags.alien,
  ],
);

export const bladeRunner1982 = createMovie(
  "Blade Runner",
  "bladerunner1982",
  "blade-runner",
  "tt0083658",
  "/path/movies/blade-runner-1982.mp4",
  7020,
  7200,
  MediaType.Movie,
  [
    genreTags.scifi,
    genreTags.thriller,
    genreTags.drama,
    aestheticTags.cyberpunk,
    aestheticTags.noir,
    aestheticTags.dystopian,
    aestheticTags.urban,
    ageGroupTags.mature,
    eraTags.eighties,
  ],
);

export const whoFramedRogerRabbit1988 = createMovie(
  "Who Framed Roger Rabbit",
  "whoframedrogerrabbit1988",
  "who-framed-roger-rabbit",
  "tt0096438",
  "/path/movies/who-framed-roger-rabbit-1988.mp4",
  6240,
  7200,
  MediaType.Movie,
  [
    genreTags.comedy,
    genreTags.mystery,
    genreTags.crime,
    aestheticTags.animation,
    aestheticTags.noir,
    aestheticTags.urban,
    ageGroupTags.family,
    eraTags.eighties,
  ],
);

export const sevenSamurai1954 = createMovie(
  "Seven Samurai",
  "sevensamurai1954",
  "seven-samurai",
  "tt0047478",
  "/path/movies/seven-samurai-1954.mp4",
  12420,
  12600,
  MediaType.Movie,
  [
    genreTags.action,
    genreTags.adventure,
    genreTags.drama,
    aestheticTags.jidaigeki,
    aestheticTags.historical,
    aestheticTags.medieval,
    ageGroupTags.youngAdult,
    eraTags.fifties,
  ],
);

export const piratesOfTheCaribbean2003 = createMovie(
  "Pirates of the Caribbean: The Curse of the Black Pearl",
  "piratesofthecaribbean2003",
  "pirates-of-the-caribbean",
  "tt0325980",
  "/path/movies/pirates-of-the-caribbean-2003.mp4",
  8580,
  9000,
  MediaType.Movie,
  [
    genreTags.adventure,
    genreTags.action,
    aestheticTags.fantasy,
    aestheticTags.pirate,
    aestheticTags.supernatural,
    aestheticTags.historical,
    ageGroupTags.family,
    eraTags.twothousands,
  ] as Tag[],
);

export const airBud1997 = createMovie(
  "Air Bud",
  "airbud1997",
  "air-bud",
  "tt0118570",
  "/path/movies/air-bud-1997.mp4",
  5880,
  6300,
  MediaType.Movie,
  [
    genreTags.comedy,
    genreTags.drama,
    aestheticTags.sports,
    ageGroupTags.kids,
    eraTags.nineties,
  ],
);

export const oBrotherWhereArtThou2000 = createMovie(
  "O Brother, Where Art Thou?",
  "obrotherwhereartthou2000",
  "o-brother-where-art-thou",
  "tt0190590",
  "/path/movies/o-brother-where-art-thou-2000.mp4",
  6420,
  7200,
  MediaType.Movie,
  [
    genreTags.comedy,
    genreTags.adventure,
    genreTags.crime,
    aestheticTags.historical,
    aestheticTags.urban,
    ageGroupTags.youngAdult,
    eraTags.twothousands,
  ],
);

export const jurassicPark1993 = createMovie(
  "Jurassic Park",
  "jurassicpark1993",
  "jurassic-park",
  "tt0107290",
  "/path/movies/jurassic-park-1993.mp4",
  7620,
  8100,
  MediaType.Movie,
  [
    genreTags.adventure,
    genreTags.scifi,
    genreTags.thriller,
    aestheticTags.prehistoric,
    aestheticTags.contemporary,
    ageGroupTags.family,
    eraTags.nineties,
    specialtyTags.jurassicpark,
  ],
);

export const darkKnight2008 = createMovie(
  "The Dark Knight",
  "darkknight2008",
  "dark-knight",
  "tt0468569",
  "/path/movies/the-dark-knight-2008.mp4",
  9120,
  9300,
  MediaType.Movie,
  [
    genreTags.action,
    genreTags.crime,
    genreTags.drama,
    aestheticTags.superhero,
    aestheticTags.noir,
    aestheticTags.crime,
    ageGroupTags.youngAdult,
    eraTags.twothousands,
  ],
);

export const breakfastAtTiffanys1961 = createMovie(
  "Breakfast at Tiffany's",
  "breakfastattiffanys1961",
  "breakfast-at-tiffanys",
  "tt0054698",
  "/path/movies/breakfast-at-tiffanys-1961.mp4",
  6900,
  7200,
  MediaType.Movie,
  [
    genreTags.romance,
    genreTags.drama,
    aestheticTags.victorian,
    aestheticTags.urban,
    ageGroupTags.youngAdult,
    eraTags.sixties,
  ],
);

export const madMaxFuryRoad2015 = createMovie(
  "Mad Max: Fury Road",
  "madmaxfuryroad2015",
  "mad-max-fury-road",
  "tt1392190",
  "/path/movies/mad-max-fury-road-2015.mp4",
  7200,
  7500,
  MediaType.Movie,
  [
    genreTags.action,
    genreTags.adventure,
    genreTags.scifi,
    aestheticTags.postApocalyptic,
    aestheticTags.dystopian,
    ageGroupTags.mature,
    eraTags.twentytens,
  ],
);

export const hundredLeagueSea1954 = createMovie(
  "20,000 Leagues Under the Sea",
  "twentythousandleaguesunderthesea1954",
  "20000-leagues-under-the-sea",
  "tt0046672",
  "/path/movies/20000-leagues-under-the-sea-1954.mp4",
  7620,
  8100,
  MediaType.Movie,
  [
    genreTags.adventure,
    genreTags.scifi,
    genreTags.drama,
    aestheticTags.steampunk,
    aestheticTags.victorian,
    aestheticTags.historical,
    ageGroupTags.family,
    eraTags.fifties,
  ],
);

export const educationalMarchOfThePenguins = createMovie(
  "March of the Penguins",
  "marchofthepenguins2005",
  "march-of-the-penguins",
  "tt0428803",
  "/path/movies/march-of-the-penguins-2005.mp4",
  4800,
  5400,
  MediaType.Movie,
  [
    genreTags.educational,
    genreTags.drama,
    aestheticTags.contemporary,
    ageGroupTags.family,
    eraTags.twothousands,
  ],
);

export const realisticMovies = [
  alien1979,
  bladeRunner1982,
  whoFramedRogerRabbit1988,
  sevenSamurai1954,
  piratesOfTheCaribbean2003,
  airBud1997,
  oBrotherWhereArtThou2000,
  jurassicPark1993,
  darkKnight2008,
  breakfastAtTiffanys1961,
  madMaxFuryRoad2015,
  hundredLeagueSea1954,
  educationalMarchOfThePenguins,
];
