import { AgeGroups } from "../../src/models/const/ageGroups";
import { MusicGenres, MusicSubGenres } from "../../src/models/const/musicGenres";
import { MediaType } from "../../src/models/enum/mediaTypes";
import { Music } from "../../src/models/music";

export const sweetchildomine = new Music(
  'Sweet Child O Mine - Guns and Roses',
  'sweetchildomine-gunsandroses',
  293,
  '/path/sweetchildomine-gunsandroses.mp4',
  MediaType.Music,
  [MusicGenres.Rock, AgeGroups.AllAges],
);
export const hotelcalifornia = new Music(
  'Hotel California - Eagles',
  'hotelcalifornia-eagles',
  369,
  '/path/hotelcalifornia-eagles.mp4',
  MediaType.Music,
  [MusicGenres.Rock, AgeGroups.AllAges],
);
export const backinblack = new Music(
  'Back in Black - ACDC',
  'backinblack-acdc',
  255,
  '/path/backinblack-acdc.mp4',
  MediaType.Music,
  [MusicGenres.Rock, AgeGroups.AllAges, 'ironman', 'marvel'],
);
export const heyjude = new Music(
  'Hey Jude - The Beatles',
  'heyjude-thebeatles',
  431,
  '/path/heyjude-thebeatles.mp4',
  MediaType.Music,
  [MusicGenres.Rock, AgeGroups.AllAges],
);
export const alive = new Music(
  'Alive - Pearl Jam',
  'alive-pearljam',
  312,
  '/path/alive-pearljam.mp4',
  MediaType.Music,
  [MusicGenres.Rock, AgeGroups.AllAges],
);
export const paranoid = new Music(
  'Paranoid - Black Sabbath',
  'paranoid-blacksabbath',
  172,
  '/path/paranoid-blacksabbath.mp4',
  MediaType.Music,
  [MusicGenres.Metal, AgeGroups.AllAges],
);
export const one = new Music(
  'One - Metallica',
  'one-metallica',
  448,
  '/path/one-metallica.mp4',
  MediaType.Music,
  [MusicGenres.Metal, AgeGroups.AllAges],
);
export const aceofspades = new Music(
  'Ace of Spades - Motorhead',
  'aceofspades-motorhead',
  170,
  '/path/aceofspades-motorhead.mp4',
  MediaType.Music,
  [MusicGenres.Metal, AgeGroups.AllAges],
);
export const holydiver = new Music(
  'Holy Diver - Dio',
  'holydiver-dio',
  310,
  '/path/holydiver-dio.mp4',
  MediaType.Music,
  [MusicGenres.Metal, AgeGroups.AllAges],
);
export const painkiller = new Music(
  'Painkiller - Judas Priest',
  'painkiller-judaspriest',
  399,
  '/path/painkiller-judaspriest.mp4',
  MediaType.Music,
  [MusicGenres.Metal, AgeGroups.AllAges],
);
export const rapperdelight = new Music(
  'Rapper Delight - Sugarhill Gang',
  'rapperdelight-sugarhillgang',
  900,
  '/path/rapperdelight-sugarhillgang.mp4',
  MediaType.Music,
  [MusicGenres.HipHop, AgeGroups.AllAges],
);
export const loseyourself = new Music(
  'Lose Yourself - Eminem',
  'loseyourself-eminem',
  366,
  '/path/loseyourself-eminem.mp4',
  MediaType.Music,
  [MusicGenres.HipHop, AgeGroups.AllAges],
);
export const nystateofmind = new Music(
  'NY State of Mind - Nas',
  'nystateofmind-nas',
  241,
  '/path/nystateofmind-nas.mp4',
  MediaType.Music,
  [MusicGenres.HipHop, AgeGroups.AllAges],
);
export const blitzkriegbop = new Music(
  'Blitzkrieg Bop - The Ramones',
  'blitzkriegbop-theramones',
  144,
  '/path/blitzkriegbop-theramones.mp4',
  MediaType.Music,
  [MusicGenres.Punk, AgeGroups.AllAges],
);
export const anarchyintheuk = new Music(
  'Anarchy in the UK - Sex Pistols',
  'anarchyintheuk-sexpistols',
  210,
  '/path/anarchyintheuk-sexpistols.mp4',
  MediaType.Music,
  [MusicGenres.Punk, AgeGroups.AllAges],
);
export const londoncalling = new Music(
  'London Calling - The Clash',
  'londoncalling-theclash',
  199,
  '/path/londoncalling-theclash.mp4',
  MediaType.Music,
  [MusicGenres.Punk, AgeGroups.AllAges],
);
export const holidayincambodia = new Music(
  'Holiday in Cambodia - Dead Kennedys',
  'holidayincambodia-deadkennedys',
  211,
  '/path/holidayincambodia-deadkennedys.mp4',
  MediaType.Music,
  [MusicGenres.Punk, AgeGroups.AllAges],
);
export const louise = new Music(
  'Louise - Clan of Xymox',
  'louise-clanofxymox',
  292,
  '/path/louise-clanofxymox.mp4',
  MediaType.Music,
  [MusicSubGenres.DarkWave, AgeGroups.AllAges],
);
export const hostofseraphim = new Music(
  'Host of Seraphim - Dead Can Dance',
  'hostofseraphim-deadcandance',
  366,
  '/path/hostofseraphim-deadcandance.mp4',
  MediaType.Music,
  [MusicSubGenres.DarkWave, AgeGroups.AllAges],
);
export const duskislikeadagger = new Music(
  'Dusk is Like a Dagger - Attrition',
  'duskislikeadagger-attrition',
  292,
  '/path/duskislikeadagger-attrition.mp4',
  MediaType.Music,
  [MusicSubGenres.DarkWave, AgeGroups.AllAges],
);
export const thetimehascomeandgone = new Music(
  'The Time Has Come and Gone - The Frozen Autumn',
  'thetimehascomeandgone-thefrozenautumn',
  292,
  '/path/thetimehascomeandgone-thefrozenautumn.mp4',
  MediaType.Music,
  [MusicSubGenres.DarkWave, AgeGroups.AllAges],
);
export const ritüel = new Music(
  'Ritüel - She Past Away',
  'ritüel-shepastaway',
  292,
  '/path/ritüel-shepastaway.mp4',
  MediaType.Music,
  [MusicSubGenres.DarkWave, AgeGroups.AllAges],
);
export const headlikeahole = new Music(
  'Head Like a Hole - Nine Inch Nails',
  'headlikeahole-nineinchnails',
  292,
  '/path/headlikeahole-nineinchnails.mp4',
  MediaType.Music,
  [MusicSubGenres.IndustrialRock, AgeGroups.AllAges],
);
export const stigmata = new Music(
  'Stigmata - Ministry',
  'stigmata-ministry',
  292,
  '/path/stigmata-ministry.mp4',
  MediaType.Music,
  [MusicSubGenres.IndustrialRock, AgeGroups.AllAges],
);
export const adrugagainstwar = new Music(
  'A Drug Against War - KMFDM',
  'adrugagainstwar-kmfdm',
  292,
  '/path/adrugagainstwar-kmfdm.mp4',
  MediaType.Music,
  [MusicSubGenres.IndustrialRock, AgeGroups.AllAges],
);
export const dragula = new Music(
  'Dragula - Rob Zombie',
  'dragula-robzombie',
  292,
  '/path/dragula-robzombie.mp4',
  MediaType.Music,
  [MusicSubGenres.IndustrialRock, AgeGroups.AllAges],
);
export const thebeautifulpeople = new Music(
  'The Beautiful People - Marilyn Manson',
  'thebeautifulpeople-marilynmanson',
  292,
  '/path/thebeautifulpeople-marilynmanson.mp4',
  MediaType.Music,
  [MusicSubGenres.IndustrialRock, AgeGroups.AllAges],
);
export const nightcall = new Music(
  'Nightcall - Kavinsky',
  'nightcall-kavinsky',
  292,
  '/path/nightcall-kavinsky.mp4',
  MediaType.Music,
  [MusicSubGenres.Synthwave, AgeGroups.AllAges],
);
export const neotokyo = new Music(
  'Neotokyo - Purturbator',
  'neotokyo-purturbator',
  292,
  '/path/neotokyo-purturbator.mp4',
  MediaType.Music,
  [MusicSubGenres.Synthwave, AgeGroups.AllAges],
);
export const daysofthunder = new Music(
  'Days of Thunder - The Midnight',
  'daysofthunder-themidnight',
  292,
  '/path/daysofthunder-themidnight.mp4',
  MediaType.Music,
  [MusicSubGenres.Synthwave, AgeGroups.AllAges],
);
export const turbokiller = new Music(
  'Turbokiller - Carpenter Brut',
  'turbokiller-carpenterbrut',
  292,
  '/path/turbokiller-carpenterbrut.mp4',
  MediaType.Music,
  [MusicSubGenres.Synthwave, AgeGroups.AllAges],
);
export const technoir = new Music(
  'Technoir - Gunship',
  'technoir-gunship',
  292,
  '/path/technoir-gunship.mp4',
  MediaType.Music,
  [MusicSubGenres.Synthwave, AgeGroups.AllAges],
);
export const requiemiikyrie = new Music(
  'Requiem II. Kyrie - György Ligeti',
  'requiemiikyrie-gyorgyligeti',
  292,
  '/path/requiemiikyrie-gyorgyligeti.mp4',
  MediaType.Music,
  [MusicSubGenres.AvantGarde, AgeGroups.AllAges],
);
export const sonatasandinterludes = new Music(
  'Sonatas and Interludes - John Cage',
  'sonatasandinterludes-johncage',
  292,
  '/path/sonatasandinterludes-johncage.mp4',
  MediaType.Music,
  [MusicSubGenres.AvantGarde, AgeGroups.AllAges],
);
export const stimmung = new Music(
  'Stimmung - Karlheinz Stockhausen',
  'stimmung-karlheinzstockhausen',
  292,
  '/path/stimmung-karlheinzstockhausen.mp4',
  MediaType.Music,
  [MusicSubGenres.AvantGarde, AgeGroups.AllAges],
);
export const anendingascent = new Music(
  'An Ending, Ascent - Brian Eno',
  'anendingascent-brianeno',
  292,
  '/path/anendingascent-brianeno.mp4',
  MediaType.Music,
  [MusicSubGenres.Ambient, AgeGroups.AllAges],
);
export const no3 = new Music(
  '#3 - Aphex Twin',
  'no3-aphextwin',
  292,
  '/path/no3-aphextwin.mp4',
  MediaType.Music,
  [MusicSubGenres.Ambient, AgeGroups.AllAges],
);
export const deepstaria = new Music(
  'Deepstaria - Hello Meteor',
  'deepstaria-hellometeor',
  292,
  '/path/deepstaria-hellometeor.mp4',
  MediaType.Music,
  [MusicSubGenres.Ambient, AgeGroups.AllAges],
);
export const bluemoonstation = new Music(
  'Blue Moon Station - Solar Fields',
  'bluemoonstation-solarfields',
  292,
  '/path/bluemoonstation-solarfields.mp4',
  MediaType.Music,
  [MusicSubGenres.Ambient, AgeGroups.AllAges],
);
export const kobresia = new Music(
  'Kobresia - Biosphere',
  'kobresia-biosphere',
  292,
  '/path/kobresia-biosphere.mp4',
  MediaType.Music,
  [MusicSubGenres.Ambient, AgeGroups.AllAges],
);
export const onthenatureofdaylight = new Music(
  'On the Nature of Daylight - Max Richter',
  'onthenatureofdaylight-maxrichter',
  292,
  '/path/onthenatureofdaylight-maxrichter.mp4',
  MediaType.Music,
  [MusicSubGenres.NeoClassical, AgeGroups.AllAges],
);
export const re = new Music(
  'Re - Nil Frahm',
  're-nilfrahm',
  292,
  '/path/re-nilfrahm.mp4',
  MediaType.Music,
  [MusicSubGenres.NeoClassical, AgeGroups.AllAges],
);
export const nuvole = new Music(
  'Nuvole Bianche - Ludovico Einaudi',
  'nuvolebianche-ludovicoeinaudi',
  292,
  '/path/nuvolebianche-ludovicoeinaudi.mp4',
  MediaType.Music,
  [MusicSubGenres.NeoClassical, AgeGroups.AllAges],
);
export const saman = new Music(
  'Saman - Ólafur Arnalds',
  'saman-olafurarnalds',
  292,
  '/path/saman-olafurarnalds.mp4',
  MediaType.Music,
  [MusicSubGenres.NeoClassical, AgeGroups.AllAges],
);
export const abovo = new Music(
  'Abovo - Joep Beving',
  'abovo-joepbeving',
  292,
  '/path/abovo-joepbeving.mp4',
  MediaType.Music,
  [MusicSubGenres.NeoClassical, AgeGroups.AllAges],
);
export const xerroxisola = new Music(
  'Xerrox Isola - Alva Noto',
  'xerroxisola-alvanoto',
  292,
  '/path/xerroxisola-alvanoto.mp4',
  MediaType.Music,
  [MusicSubGenres.ElectronicMinimalist, AgeGroups.AllAges],
);
export const dexter = new Music(
  'Dexter - Ricardo Villalobos',
  'dexter-ricardovillalobos',
  292,
  '/path/dexter-ricardovillalobos.mp4',
  MediaType.Music,
  [MusicSubGenres.ElectronicMinimalist, AgeGroups.AllAges],
);
export const sticktomyside = new Music(
  'Stick to My Side - Pantha du Prince',
  'sticktomyside-panthaduprince',
  292,
  '/path/sticktomyside-panthaduprince.mp4',
  MediaType.Music,
  [MusicSubGenres.ElectronicMinimalist, AgeGroups.AllAges],
);
export const camino = new Music(
  'Camino - Murcof',
  'camino-murcof',
  292,
  '/path/camino-murcof.mp4',
  MediaType.Music,
  [MusicSubGenres.ElectronicMinimalist, AgeGroups.AllAges],
);
export const easthastings = new Music(
  'East Hastings - Godspeed You! Black Emperor',
  'easthastings-godspeedyoublackemperor',
  292,
  '/path/easthastings-godspeedyoublackemperor.mp4',
  MediaType.Music,
  [MusicSubGenres.PostRock, AgeGroups.AllAges],
);
export const yourhandinmine = new Music(
  'Your Hand in Mine - Explosions in the Sky',
  'yourhandinmine-explosionsinthesky',
  292,
  '/path/yourhandinmine-explosionsinthesky.mp4',
  MediaType.Music,
  [MusicSubGenres.PostRock, AgeGroups.AllAges],
);
export const mogwaifearsatan = new Music(
  'Mogwai Fear Satan - Mogwai',
  'mogwaifearsatan-mogwai',
  292,
  '/path/mogwaifearsatan-mogwai.mp4',
  MediaType.Music,
  [MusicSubGenres.PostRock, AgeGroups.AllAges],
);
export const untitledno3 = new Music(
  'Untitled #3 - Sigur Rós',
  'untitledno3-sigurros',
  292,
  '/path/untitledno3-sigurros.mp4',
  MediaType.Music,
  [MusicSubGenres.PostRock, AgeGroups.AllAges],
);
export const ashesinthesnow = new Music(
  'Ashes in the Snow - Mono',
  'ashesinthesnow-mono',
  292,
  '/path/ashesinthesnow-mono.mp4',
  MediaType.Music,
  [MusicSubGenres.PostRock, AgeGroups.AllAges],
);
export const thedarkplacesoftheearth = new Music(
  'The Dark Places of the Earth - Lustmord',
  'thedarkplacesoftheearth-lustmord',
  292,
  '/path/thedarkplacesoftheearth-lustmord.mp4',
  MediaType.Music,
  [MusicSubGenres.DarkAmbient, AgeGroups.AllAges],
);
export const endtitles = new Music(
  'End Titles - Atrium Carceri',
  'endtitles-atriumcarceri',
  292,
  '/path/endtitles-atriumcarceri.mp4',
  MediaType.Music,
  [MusicSubGenres.DarkAmbient, AgeGroups.AllAges],
);
export const reflectinginshadows = new Music(
  'Reflecting in Shadows - Kammarheit',
  'reflectinginshadows-kammarheit',
  292,
  '/path/reflectinginshadows-kammarheit.mp4',
  MediaType.Music,
  [MusicSubGenres.DarkAmbient, AgeGroups.AllAges],
);
export const hypnagogic = new Music(
  'Hypnagogic - Kammarheit',
  'hypnagogic-kammarheit',
  292,
  '/path/hypnagogic-kammarheit.mp4',
  MediaType.Music,
  [MusicSubGenres.DarkAmbient, AgeGroups.AllAges],
);
export const twoonefourfive = new Music(
  '2145 - Sabled Sun',
  '2145-sabledsun',
  292,
  '/path/2145-sabledsun.mp4',
  MediaType.Music,
  [MusicSubGenres.DarkAmbient, AgeGroups.AllAges],
);
export const hajnal = new Music(
  'Hajnal - Venetian Snares',
  'hajnal-venetiansnares',
  292,
  '/path/hajnal-venetiansnares.mp4',
  MediaType.Music,
  [MusicSubGenres.Breakcore, AgeGroups.AllAges],
);
export const nostep = new Music(
  'No Step - Bong-Ra',
  'nostep-bongra',
  292,
  '/path/nostep-bongra.mp4',
  MediaType.Music,
  [MusicSubGenres.Breakcore, AgeGroups.AllAges],
);
export const thesoundoftheunderground = new Music(
  'The Sound of the Underground - Shitmat',
  'thesoundoftheunderground-shitmat',
  292,
  '/path/thesoundoftheunderground-shitmat.mp4',
  MediaType.Music,
  [MusicSubGenres.Breakcore, AgeGroups.AllAges],
);
export const manicpanic = new Music(
  'Manic Panic - Otto Von Schirach',
  'manicpanic-ottovonschirach',
  292,
  '/path/manicpanic-ottovonschirach.mp4',
  MediaType.Music,
  [MusicSubGenres.Breakcore, AgeGroups.AllAges],
);
export const blackacid = new Music(
  'Black Acid - Enduser',
  'blackacid-enduser',
  292,
  '/path/blackacid-enduser.mp4',
  MediaType.Music,
  [MusicSubGenres.Breakcore, AgeGroups.AllAges],
);
export const hereitschristmastime = new Music(
  "Here It's Christmas Time - Kevin Bacon",
  'hereitschristmastime-kevinbacon',
  292,
  '/path/hereitschristmastime-kevinbacon.mp4',
  MediaType.Music,
  [MusicGenres.Pop, AgeGroups.AllAges, 'christmas', 'marvel'],
);
export const allIwantforchristmasisyou = new Music(
  'All I Want for Christmas is You - Mariah Carey',
  'alliwantforchristmasisyou-mariahcarey',
  292,
  '/path/alliwantforchristmasisyou-mariahcarey.mp4',
  MediaType.Music,
  [MusicGenres.Pop, AgeGroups.AllAges, 'christmas'],
);
export const kidnapthesandyclaws = new Music(
  'Kidnap the Sandy Claws - Korn',
  'kidnapthesandyclaws-korn',
  292,
  '/path/kidnapthesandyclaws-korn.mp4',
  MediaType.Music,
  [MusicGenres.Metal, AgeGroups.AllAges, 'christmas', 'halloween'],
);
export const monstermash = new Music(
  'Monster Mash - Bobby Pickett',
  'monstermash-bobbypickett',
  292,
  '/path/monstermash-bobbypickett.mp4',
  MediaType.Music,
  [MusicGenres.Pop, AgeGroups.AllAges, 'halloween'],
);
export const comeandgetyourlove = new Music(
  'Come and Get Your Love - Redbone',
  'comeandgetyourlove-redbone',
  292,
  '/path/comeandgetyourlove-redbone.mp4',
  MediaType.Music,
  [MusicGenres.Rock, AgeGroups.AllAges, 'guardiansofthegalaxy', 'marvel'],
);
export const ohhchild = new Music(
  'Ohh Child - The Five Stairsteps',
  'ohhchild-thefivestairsteps',
  292,
  '/path/ohhchild-thefivestairsteps.mp4',
  MediaType.Music,
  [MusicGenres.RnB, AgeGroups.AllAges, 'guardiansofthegalaxy', 'marvel'],
);

export const music = [
  sweetchildomine,
  hotelcalifornia,
  backinblack,
  heyjude,
  alive,
  paranoid,
  one,
  aceofspades,
  holydiver,
  painkiller,
  rapperdelight,
  loseyourself,
  nystateofmind,
  blitzkriegbop,
  anarchyintheuk,
  londoncalling,
  holidayincambodia,
  louise,
  hostofseraphim,
  duskislikeadagger,
  thetimehascomeandgone,
  ritüel,
  headlikeahole,
  stigmata,
  adrugagainstwar,
  dragula,
  thebeautifulpeople,
  nightcall,
  neotokyo,
  daysofthunder,
  turbokiller,
  technoir,
  requiemiikyrie,
  sonatasandinterludes,
  stimmung,
  anendingascent,
  no3,
  deepstaria,
  bluemoonstation,
  kobresia,
  onthenatureofdaylight,
  re,
  nuvole,
  saman,
  abovo,
  xerroxisola,
  dexter,
  sticktomyside,
  camino,
  easthastings,
  yourhandinmine,
  mogwaifearsatan,
  untitledno3,
  ashesinthesnow,
  thedarkplacesoftheearth,
  endtitles,
  reflectinginshadows,
  hypnagogic,
  twoonefourfive,
  hajnal,
  nostep,
  thesoundoftheunderground,
  manicpanic,
  blackacid,
  hereitschristmastime,
  allIwantforchristmasisyou,
  kidnapthesandyclaws,
  monstermash,
  comeandgetyourlove,
  ohhchild,
];

export const nonHolidayMusic = [
  sweetchildomine,
  hotelcalifornia,
  backinblack,
  heyjude,
  alive,
  paranoid,
  one,
  aceofspades,
  holydiver,
  painkiller,
  rapperdelight,
  loseyourself,
  nystateofmind,
  blitzkriegbop,
  anarchyintheuk,
  londoncalling,
  holidayincambodia,
  louise,
  hostofseraphim,
  duskislikeadagger,
  thetimehascomeandgone,
  ritüel,
  headlikeahole,
  stigmata,
  adrugagainstwar,
  dragula,
  thebeautifulpeople,
  nightcall,
  neotokyo,
  daysofthunder,
  turbokiller,
  technoir,
  requiemiikyrie,
  sonatasandinterludes,
  stimmung,
  anendingascent,
  no3,
  deepstaria,
  bluemoonstation,
  kobresia,
  onthenatureofdaylight,
  re,
  nuvole,
  saman,
  abovo,
  xerroxisola,
  dexter,
  sticktomyside,
  camino,
  easthastings,
  yourhandinmine,
  mogwaifearsatan,
  untitledno3,
  ashesinthesnow,
  thedarkplacesoftheearth,
  endtitles,
  reflectinginshadows,
  hypnagogic,
  twoonefourfive,
  hajnal,
  nostep,
  thesoundoftheunderground,
  manicpanic,
  blackacid,
  comeandgetyourlove,
  ohhchild,
];
