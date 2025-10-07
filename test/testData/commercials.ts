import { Commercial } from '../../src/models/commercial';
import { AgeGroups } from '../../src/models/const/ageGroups';
import { Eras } from '../../src/models/const/eras';
import { MediaType } from '../../src/models/enum/mediaTypes';

export const jurassicparktoys1 = new Commercial(
  'Jurassic Park Toys 1',
  'jurassicparktoys1',
  10,
  '/path/jurassicparktoys1.mp4',
  MediaType.Commercial,
  [
    makeTag('jurassicpark'),
    makeTag(MainGenres.Action),
    makeTag(AgeGroups.Kids, 'AgeGroup'),
    makeTag(Eras.nnineties, 'Era'),
  ],
);
export const marvelvsstreetfighter98 = new Commercial(
  '98 Marvel vs StreetFighter',
  '98marvelvsstreetfighter',
  15,
  '/path/98marvelvsstreetfighter.mp4',
  MediaType.Commercial,
  [
    makeTag('marvel'),
    makeTag('streetfighter'),
    makeTag(MainGenres.Action),
    makeTag(AgeGroups.Kids, 'AgeGroup'),
    makeTag(Eras.nnineties, 'Era'),
  ],
);
export const wildones = new Commercial(
  'Wild Ones',
  'wildones',
  15,
  '/path/wildones.mp4',
  MediaType.Commercial,
  [
    makeTag(MainGenres.Action),
    makeTag(AgeGroups.Kids, 'AgeGroup'),
    makeTag(Eras.nnineties, 'Era'),
  ],
);
export const dreambuilders = new Commercial(
  'Dream Builders',
  'dreambuilders',
  15,
  '/path/dreambuilders.mp4',
  MediaType.Commercial,
  [makeTag(AgeGroups.Kids, 'AgeGroup'), makeTag(Eras.nnineties, 'Era')],
);
export const jurassicparktoys2 = new Commercial(
  '93 Jurassic Park Toys 2',
  '93 jurassicparktoys2',
  15,
  '/path/jurassicparktoys2.mp4',
  MediaType.Commercial,
  [
    makeTag('jurassicpark'),
    makeTag(MainGenres.Action),
    makeTag(AgeGroups.Kids, 'AgeGroup'),
    makeTag(Eras.nnineties, 'Era'),
  ],
);
export const jurassicparktoys3 = new Commercial(
  '93 Jurassic Park Toys 3',
  '93 jurassicparktoys3',
  15,
  '/path/jurassicparktoys3.mp4',
  MediaType.Commercial,
  [
    makeTag('jurassicpark'),
    makeTag(MainGenres.Action),
    makeTag(AgeGroups.Kids, 'AgeGroup'),
    makeTag(Eras.nnineties, 'Era'),
  ],
);
export const littleoopsiedaisy = new Commercial(
  'Little Oopsie Daisy',
  'littleoopsiedaisy',
  15,
  '/path/littleoopsiedaisy.mp4',
  MediaType.Commercial,
  [makeTag(AgeGroups.Kids, 'AgeGroup'), makeTag(Eras.nnineties, 'Era')],
);
export const meninblacktoys97 = new Commercial(
  '97 Men in Black Toys',
  '97meninblacktoys',
  15,
  '/path/97meninblacktoys.mp4',
  MediaType.Commercial,
  [
    makeTag('meninblack'),
    makeTag(MainGenres.SciFi),
    makeTag(MainGenres.Action),
    makeTag(AgeGroups.Kids, 'AgeGroup'),
    makeTag(Eras.nnineties, 'Era'),
  ],
);
export const monsterfacetoy = new Commercial(
  'Monster Face Toy',
  'monsterfacetoy',
  15,
  '/path/monsterfacetoy.mp4',
  MediaType.Commercial,
  [
    makeTag('halloween'),
    makeTag(MainGenres.Horror),
    makeTag(AgeGroups.Kids, 'AgeGroup'),
    makeTag(Eras.nnineties, 'Era'),
  ],
);
export const newbluemms = new Commercial(
  'New Blue M&Ms',
  'newbluemms',
  15,
  '/path/newbluemms.mp4',
  MediaType.Commercial,
  [makeTag(AgeGroups.AllAges, 'AgeGroup'), makeTag(Eras.nnineties, 'Era')],
);
export const superduperdoublelooper = new Commercial(
  'Super Duper Double Looper',
  'superduperdoublelooper',
  15,
  '/path/superduperdoublelooper.mp4',
  MediaType.Commercial,
  [
    makeTag(MainGenres.Action),
    makeTag(AgeGroups.Kids, 'AgeGroup'),
    makeTag(Eras.nnineties, 'Era'),
  ],
);
export const transformersbeastwarstoys = new Commercial(
  'Transformers Beast Wars Toys',
  'transformersbeastwarstoys',
  15,
  '/path/transformersbeastwarstoys.mp4',
  MediaType.Commercial,
  [
    makeTag('transformers'),
    makeTag(MainGenres.SciFi),
    makeTag(MainGenres.Action),
    makeTag(AgeGroups.Kids, 'AgeGroup'),
    makeTag(Eras.nnineties, 'Era'),
  ],
);
export const gamegear1 = new Commercial(
  'Game Gear 1',
  'gamegear1',
  26,
  '/path/gamegear1.mp4',
  MediaType.Commercial,
  [makeTag(AgeGroups.Kids, 'AgeGroup'), makeTag(Eras.nnineties, 'Era')],
);
export const sonicandknuckles1 = new Commercial(
  'Sonic and Knuckles 1',
  'sonicandknuckles1',
  30,
  '/path/sonicandknuckles1.mp4',
  MediaType.Commercial,
  [makeTag(AgeGroups.Kids, 'AgeGroup'), makeTag(Eras.nnineties, 'Era')],
);
export const banjokazooie1 = new Commercial(
  'Banjo Kazooie 1',
  'banjokazooie1',
  30,
  '/path/banjokazooie1.mp4',
  MediaType.Commercial,
  [makeTag(AgeGroups.Kids, 'AgeGroup'), makeTag(Eras.nnineties, 'Era')],
);
export const fzero1 = new Commercial(
  'F-Zero 1',
  'fzero1',
  30,
  '/path/fzero1.mp4',
  MediaType.Commercial,
  [makeTag(AgeGroups.Kids, 'AgeGroup'), makeTag(Eras.nnineties, 'Era')],
);
export const gauntletlegends1 = new Commercial(
  'Gauntlet Legends 1',
  'gauntletlegends1',
  30,
  '/path/gauntletlegends1.mp4',
  MediaType.Commercial,
  [makeTag(AgeGroups.Kids, 'AgeGroup'), makeTag(Eras.nnineties, 'Era')],
);
export const halloween711 = new Commercial(
  'Halloween 7-11',
  'halloween711',
  30,
  '/path/halloween711.mp4',
  MediaType.Commercial,
  [
    makeTag('halloween'),
    makeTag(AgeGroups.AllAges, 'AgeGroup'),
    makeTag(Eras.nnineties, 'Era'),
  ],
);
export const alientrailer1 = new Commercial(
  'Alien Trailer 1',
  'alientrailer1',
  30,
  '/path/alientrailer1.mp4',
  MediaType.Commercial,
  [
    makeTag('alien'),
    makeTag(MainGenres.SciFi),
    makeTag(MainGenres.Horror),
    makeTag(AgeGroups.Mature, 'AgeGroup'),
    makeTag(Eras.nseventies, 'Era'),
  ],
);
export const americanwerewolfinlondontrailer1 = new Commercial(
  'American Werewolf in London Trailer 1',
  'americanwerewolfinlondontrailer1',
  30,
  '/path/americanwerewolfinlondontrailer1.mp4',
  MediaType.Commercial,
  [
    makeTag(MainGenres.Horror),
    makeTag(AgeGroups.Mature, 'AgeGroup'),
    makeTag(Eras.neighties, 'Era'),
  ],
);
export const beetlejuicetrailer1 = new Commercial(
  'Beetlejuice Trailer 1',
  'beetlejuicetrailer1',
  30,
  '/path/beetlejuicetrailer1.mp4',
  MediaType.Commercial,
  [
    makeTag(MainGenres.Horror),
    makeTag(MainGenres.Comedy),
    makeTag(AgeGroups.YoungAdult, 'AgeGroup'),
    makeTag(Eras.neighties, 'Era'),
  ],
);
export const ocarinaoftimetrailer1 = new Commercial(
  'Ocarina of Time Trailer 1',
  'ocarinaoftimetrailer1',
  62,
  '/path/ocarinaoftimetrailer1.mp4',
  MediaType.Commercial,
  [makeTag(AgeGroups.Kids, 'AgeGroup'), makeTag(Eras.nnineties, 'Era')],
);
export const ijustshippedmybed = new Commercial(
  'I Just Shipped My Bed',
  'ijustshippedmybed',
  69,
  '/path/ijustshippedmybed.mp4',
  MediaType.Commercial,
  [
    makeTag(MainGenres.Comedy),
    makeTag(AgeGroups.AllAges, 'AgeGroup'),
    makeTag(Eras.ttens, 'Era'),
  ],
);
export const cornpopsgolf = new Commercial(
  'Corn Pops Golf',
  'cornpopsgolf',
  30,
  '/path/cornpopsgolf.mp4',
  MediaType.Commercial,
  [makeTag(AgeGroups.Kids, 'AgeGroup'), makeTag(Eras.nnineties, 'Era')],
);
export const blacktronlegomaniac = new Commercial(
  'Blacktron Lego Maniac',
  'blacktronlegomaniac',
  30,
  '/path/blacktronlegomaniac.mp4',
  MediaType.Commercial,
  [
    makeTag('lego'),
    makeTag(AgeGroups.Kids, 'AgeGroup'),
    makeTag(Eras.nnineties, 'Era'),
  ],
);
export const starttrektoys = new Commercial(
  'Star Trek Toys',
  'starttrektoys',
  30,
  '/path/starttrektoys.mp4',
  MediaType.Commercial,
  [
    makeTag('startrek'),
    makeTag(MainGenres.SciFi),
    makeTag(AgeGroups.Kids, 'AgeGroup'),
    makeTag(Eras.nnineties, 'Era'),
  ],
);
export const sharkbitesfruitsnacks = new Commercial(
  'Shark Bites Fruit Snacks',
  'sharkbitesfruitsnacks',
  30,
  '/path/sharkbitesfruitsnacks.mp4',
  MediaType.Commercial,
  [makeTag(AgeGroups.Kids, 'AgeGroup'), makeTag(Eras.nnineties, 'Era')],
);
export const ricecrispiescerealtalks = new Commercial(
  'Rice Crispies Cereal Talks',
  'ricecrispiescerealtalks',
  30,
  '/path/ricecrispiescerealtalks.mp4',
  MediaType.Commercial,
  [makeTag(AgeGroups.Kids, 'AgeGroup'), makeTag(Eras.nnineties, 'Era')],
);
export const pizzahutxmen = new Commercial(
  'Pizza Hut X-Men',
  'pizzahutxmen',
  30,
  '/path/pizzahutxmen.mp4',
  MediaType.Commercial,
  [
    makeTag('xmen'),
    makeTag('marvel'),
    makeTag(MainGenres.Action),
    makeTag(AgeGroups.Kids, 'AgeGroup'),
    makeTag(Eras.nnineties, 'Era'),
  ],
);
export const mcdonaldscrush = new Commercial(
  'McDonalds Crush',
  'mcdonaldscrush',
  30,
  '/path/mcdonaldscrush.mp4',
  MediaType.Commercial,
  [makeTag(AgeGroups.Kids, 'AgeGroup'), makeTag(Eras.nnineties, 'Era')],
);
export const transformers80s1 = new Commercial(
  'Transformers 80s 1',
  'transformers80s1',
  30,
  '/path/transformers80s1.mp4',
  MediaType.Commercial,
  [
    makeTag('transformers'),
    makeTag(MainGenres.Action),
    makeTag(MainGenres.SciFi),
    makeTag(AgeGroups.Kids, 'AgeGroup'),
    makeTag(Eras.neighties, 'Era'),
  ],
);
export const alienstoys1 = new Commercial(
  'Aliens Toys 1',
  'alienstoys1',
  30,
  '/path/alienstoys1.mp4',
  MediaType.Commercial,
  [
    makeTag('alien'),
    makeTag(MainGenres.Horror),
    makeTag(MainGenres.Action),
    makeTag(MainGenres.SciFi),
    makeTag(AgeGroups.Kids, 'AgeGroup'),
    makeTag(Eras.nnineties, 'Era'),
  ],
);
export const jurassicpark3toys = new Commercial(
  'Jurassic Park 3 Toys',
  'jurassicpark3toys',
  30,
  '/path/jurassicpark3toys.mp4',
  MediaType.Commercial,
  [
    makeTag('jurassicpark'),
    makeTag(MainGenres.Action),
    makeTag(AgeGroups.Kids, 'AgeGroup'),
    makeTag(Eras.twothousands, 'Era'),
  ],
);

export const commercials = [
  jurassicparktoys1,
  marvelvsstreetfighter98,
  wildones,
  dreambuilders,
  jurassicparktoys2,
  jurassicparktoys3,
  littleoopsiedaisy,
  meninblacktoys97,
  monsterfacetoy,
  newbluemms,
  superduperdoublelooper,
  transformersbeastwarstoys,
  gamegear1,
  sonicandknuckles1,
  banjokazooie1,
  fzero1,
  gauntletlegends1,
  halloween711,
  alientrailer1,
  americanwerewolfinlondontrailer1,
  beetlejuicetrailer1,
  ocarinaoftimetrailer1,
  ijustshippedmybed,
  cornpopsgolf,
  blacktronlegomaniac,
  starttrektoys,
  sharkbitesfruitsnacks,
  ricecrispiescerealtalks,
  pizzahutxmen,
  mcdonaldscrush,
  transformers80s1,
  alienstoys1,
  jurassicpark3toys,
];

export const default1 = new Commercial(
  'Default 1',
  'default1',
  15,
  '/path/default1.mp4',
  MediaType.Commercial,
  [makeTag(AgeGroups.AllAges, 'AgeGroup')],
);
export const default2 = new Commercial(
  'Default 2',
  'default2',
  16,
  '/path/default2.mp4',
  MediaType.Commercial,
  [makeTag(AgeGroups.AllAges, 'AgeGroup')],
);
export const default3 = new Commercial(
  'Default 3',
  'default3',
  17,
  '/path/default3.mp4',
  MediaType.Commercial,
  [makeTag(AgeGroups.AllAges, 'AgeGroup')],
);
export const default4 = new Commercial(
  'Default 4',
  'default4',
  18,
  '/path/default4.mp4',
  MediaType.Commercial,
  [makeTag(AgeGroups.AllAges, 'AgeGroup')],
);
export const default5 = new Commercial(
  'Default 5',
  'default5',
  19,
  '/path/default5.mp4',
  MediaType.Commercial,
  [makeTag(AgeGroups.AllAges, 'AgeGroup')],
);
export const default6 = new Commercial(
  'Default 6',
  'default6',
  20,
  '/path/default6.mp4',
  MediaType.Commercial,
  [makeTag(AgeGroups.AllAges, 'AgeGroup')],
);
export const default7 = new Commercial(
  'Default 7',
  'default7',
  30,
  '/path/default7.mp4',
  MediaType.Commercial,
  [makeTag(AgeGroups.AllAges, 'AgeGroup')],
);
export const default8 = new Commercial(
  'Default 8',
  'default8',
  60,
  '/path/default8.mp4',
  MediaType.Commercial,
  [makeTag(AgeGroups.AllAges, 'AgeGroup')],
);
export const default9 = new Commercial(
  'Default 9',
  'default9',
  120,
  '/path/default9.mp4',
  MediaType.Commercial,
  [makeTag(AgeGroups.AllAges, 'AgeGroup')],
);

export const defaultCommercials = [
  default1,
  default2,
  default3,
  default4,
  default5,
  default6,
  default7,
  default8,
  default9,
];

export const starwarstoylightsabers = new Commercial(
  'Star Wars Toy Lightsabers',
  'starwarstoylightsabers',
  30,
  '/path/starwarstoylightsabers.mp4',
  MediaType.Commercial,
  [MainGenres.SpaceOpera, AgeGroups.Family, Eras.twothousands],
);

export const nerfblastershowdown = new Commercial(
  'Nerf Blaster Showdown',
  'nerfblastershowdown',
  30,
  '/path/nerfblastershowdown.mp4',
  MediaType.Commercial,
  [MainGenres.Action, AgeGroups.Family, Eras.nnineties],
);

export const transformersbeastwars = new Commercial(
  'Transformers Beast Wars Toys',
  'transformersbeastwars',
  30,
  '/path/transformersbeastwars.mp4',
  MediaType.Commercial,
  [MainGenres.Action, MainGenres.SciFi, AgeGroups.Family, Eras.nnineties],
);

export const digimontoys = new Commercial(
  'Digimon Digital Monsters Action Figures',
  'digimontoys',
  30,
  '/path/digimontoys.mp4',
  MediaType.Commercial,
  [MainGenres.Adventure, MainGenres.Fantasy, AgeGroups.Family, Eras.nnineties],
);

export const yugiohcardgame = new Commercial(
  'Yu-Gi-Oh! Trading Card Game',
  'yugiohcardgame',
  30,
  '/path/yugiohcardgame.mp4',
  MediaType.Commercial,
  [MainGenres.Fantasy, AgeGroups.Family, Eras.twothousands],
);

export const hotwheelscrashzone = new Commercial(
  'Hot Wheels - Crash Zone Track Set',
  'hotwheelscrashzone',
  30,
  '/path/hotwheelscrashzone.mp4',
  MediaType.Commercial,
  [MainGenres.Action, AgeGroups.Family, Eras.nnineties],
);

export const pokemonredblue = new Commercial(
  'Pokémon Red & Blue Game Boy',
  'pokemonredblue',
  30,
  '/path/pokemonredblue.mp4',
  MediaType.Commercial,
  [MainGenres.Adventure, MainGenres.Fantasy, AgeGroups.Family, Eras.nnineties],
);

export const jurassicparkinflatabletrex = new Commercial(
  'Jurassic Park Inflatable T-Rex Toy',
  'jurassicparkinflatabletrex',
  30,
  '/path/jurassicparkinflatabletrex.mp4',
  MediaType.Commercial,
  [MainGenres.Action, AgeGroups.Family, Eras.nnineties],
);

export const goosebumpsboardgame = new Commercial(
  'Goosebumps Board Game',
  'goosebumpsboardgame',
  30,
  '/path/goosebumpsboardgame.mp4',
  MediaType.Commercial,
  [MainGenres.Horror, AgeGroups.Family, Eras.nnineties],
);

export const legoexploriens = new Commercial(
  'LEGO Exploriens',
  'legoexploriens',
  30,
  '/path/legoexploriens.mp4',
  MediaType.Commercial,
  [
    MainGenres.Action,
    MainGenres.SciFi,
    MainGenres.Adventure,
    AgeGroups.Family,
    Eras.nnineties,
  ],
);

export const mybuddykidsister = new Commercial(
  'My Buddy / Kid Sister',
  'mybuddykidsister',
  30,
  '/path/mybuddykidsister.mp4',
  MediaType.Commercial,
  [MainGenres.None, AgeGroups.Kids, Eras.nnineties],
);

export const teddyruxpinstorybook = new Commercial(
  'Teddy Ruxpin Storybook',
  'teddyruxpinstorybook',
  30,
  '/path/teddyruxpinstorybook.mp4',
  MediaType.Commercial,
  [MainGenres.Adventure, AgeGroups.Kids, Eras.nnineties],
);

export const mcdonaldsbatmanforeverhappymeal = new Commercial(
  'McDonald’s Batman Forever Happy Meal',
  'mcdonaldsbatmanforeverhappymeal',
  30,
  '/path/mcdonaldsbatmanforeverhappymeal.mp4',
  MediaType.Commercial,
  [MainGenres.Action, AgeGroups.Kids, Eras.nnineties],
);

export const barneydinostoreadventure = new Commercial(
  'Barney Dinosaur Store Adventure',
  'barneydinostoreadventure',
  30,
  '/path/barneydinostoreadventure.mp4',
  MediaType.Commercial,
  [MainGenres.Adventure, AgeGroups.Kids, Eras.nnineties],
);

export const fisherpriceadventurepeople = new Commercial(
  'Fisher-Price Adventure People',
  'fisherpriceadventurepeople',
  30,
  '/path/fisherpriceadventurepeople.mp4',
  MediaType.Commercial,
  [MainGenres.Adventure, AgeGroups.Kids, Eras.nnineties],
);

export const playdohextrudedinos = new Commercial(
  'Play-Doh Dinosaur Set',
  'playdohextrudedinos',
  30,
  '/path/playdohextrudedinos.mp4',
  MediaType.Commercial,
  [MainGenres.Action, AgeGroups.Kids, Eras.nnineties],
);

export const tonkarealsoundsfiretruck = new Commercial(
  'Tonka Real Sounds Fire Truck',
  'tonkarealsoundsfiretruck',
  30,
  '/path/tonkarealsoundsfiretruck.mp4',
  MediaType.Commercial,
  [MainGenres.Action, AgeGroups.Kids, Eras.nnineties],
);

export const mcdonaldshappymealspacejam = new Commercial(
  'McDonald’s Space Jam Happy Meal',
  'mcdonaldshappymealspacejam',
  30,
  '/path/mcdonaldshappymealspacejam.mp4',
  MediaType.Commercial,
  [MainGenres.Sports, MainGenres.Fantasy, AgeGroups.Kids, Eras.nnineties],
);

export const fisherpricewildwesttown = new Commercial(
  'Fisher-Price Wild West Town',
  'fisherpricewildwesttown',
  30,
  '/path/fisherpricewildwesttown.mp4',
  MediaType.Commercial,
  [MainGenres.Western, AgeGroups.Kids, Eras.nnineties],
);

export const rugratshappymeal = new Commercial(
  'McDonald’s Rugrats Happy Meal',
  'rugratshappymeal',
  30,
  '/path/rugratshappymeal.mp4',
  MediaType.Commercial,
  [MainGenres.Adventure, AgeGroups.Kids, Eras.nnineties],
);

export const batmananimatedseriesfigures = new Commercial(
  'Batman: The Animated Series Action Figures',
  'batmananimatedseriesfigures',
  30,
  '/path/batmananimatedseriesfigures.mp4',
  MediaType.Commercial,
  [MainGenres.Action, MainGenres.SuperHero, AgeGroups.Family, Eras.nnineties],
);

export const spidermanactionset = new Commercial(
  'Spider-Man Web Shooter Action Set',
  'spidermanactionset',
  30,
  '/path/spidermanactionset.mp4',
  MediaType.Commercial,
  [MainGenres.Action, MainGenres.SuperHero, AgeGroups.Family, Eras.nnineties],
);

export const legoaquazone = new Commercial(
  'LEGO Aquazone',
  'legoaquazone',
  30,
  '/path/legoaquazone.mp4',
  MediaType.Commercial,
  [MainGenres.Action, MainGenres.Adventure, AgeGroups.Family, Eras.nnineties],
);

export const starwarsactionfleet = new Commercial(
  'Star Wars Action Fleet Micro Machines',
  'starwarsactionfleet',
  30,
  '/path/starwarsactionfleet.mp4',
  MediaType.Commercial,
  [MainGenres.SpaceOpera, MainGenres.Fantasy, AgeGroups.Family, Eras.nnineties],
);

export const powerangersmegazord = new Commercial(
  'Power Rangers Mega Zord Playset',
  'powerrangersmegazord',
  30,
  '/path/powerrangersmegazord.mp4',
  MediaType.Commercial,
  [MainGenres.SuperHero, MainGenres.Fantasy, AgeGroups.Family, Eras.nnineties],
);

export const tomagotchipet = new Commercial(
  'Tamagotchi Virtual Pet',
  'tomagotchipet',
  30,
  '/path/tomagotchipet.mp4',
  MediaType.Commercial,
  [MainGenres.None, AgeGroups.Family, Eras.nnineties],
);

export const bioniclemaskoflight = new Commercial(
  'Bionicle: Mask of Light',
  'bioniclemaskoflight',
  30,
  '/path/bioniclemaskoflight.mp4',
  MediaType.Commercial,
  [
    MainGenres.Action,
    MainGenres.Adventure,
    MainGenres.Fantasy,
    AgeGroups.Family,
    Eras.twothousands,
  ],
);

export const nintendogameboypokemon = new Commercial(
  'Nintendo Game Boy: Pokémon Yellow',
  'nintendogameboypokemon',
  30,
  '/path/nintendogameboypokemon.mp4',
  MediaType.Commercial,
  [MainGenres.Adventure, MainGenres.Fantasy, AgeGroups.Family, Eras.nnineties],
);

export const yugiohdueldisk = new Commercial(
  'Yu-Gi-Oh! Duel Disk Accessory',
  'yugiohdueldisk',
  30,
  '/path/yugiohdueldisk.mp4',
  MediaType.Commercial,
  [MainGenres.Action, MainGenres.Fantasy, AgeGroups.Family, Eras.twothousands],
);

export const fisherpriceimaginext = new Commercial(
  'Fisher-Price Imaginext Space Adventures',
  'fisherpriceimaginext',
  30,
  '/path/fisherpriceimaginext.mp4',
  MediaType.Commercial,
  [MainGenres.Adventure, MainGenres.SciFi, AgeGroups.Kids, Eras.nnineties],
);

export const rugratsmoviepromotion = new Commercial(
  'Rugrats Movie Promotion',
  'rugratsmoviepromotion',
  30,
  '/path/rugratsmoviepromotion.mp4',
  MediaType.Commercial,
  [MainGenres.Adventure, AgeGroups.Kids, Eras.nnineties],
);

export const thomasadventureset = new Commercial(
  'Thomas the Tank Engine Adventure Set',
  'thomasadventureset',
  30,
  '/path/thomasadventureset.mp4',
  MediaType.Commercial,
  [MainGenres.Adventure, AgeGroups.Kids, Eras.nnineties],
);

export const littlepeoplepirateship = new Commercial(
  'Little People Pirate Ship',
  'littlepeoplepirateship',
  30,
  '/path/littlepeoplepirateship.mp4',
  MediaType.Commercial,
  [MainGenres.Action, MainGenres.Adventure, AgeGroups.Kids, Eras.nnineties],
);

export const duplomagicalcastle = new Commercial(
  'Duplo Magical Castle Playset',
  'duplomagicalcastle',
  30,
  '/path/duplomagicalcastle.mp4',
  MediaType.Commercial,
  [MainGenres.Adventure, MainGenres.Fantasy, AgeGroups.Kids, Eras.nnineties],
);

export const mcdonaldsdisneydinos = new Commercial(
  'McDonald’s Dinosaur Happy Meal (Disney)',
  'mcdonaldsdisneydinos',
  30,
  '/path/mcdonaldsdisneydinos.mp4',
  MediaType.Commercial,
  [MainGenres.Action, MainGenres.Adventure, AgeGroups.Kids, Eras.nnineties],
);

export const happymealinspectorgadget = new Commercial(
  'McDonald’s Inspector Gadget Happy Meal',
  'happymealinspectorGadget',
  30,
  '/path/happymealinspectorGadget.mp4',
  MediaType.Commercial,
  [
    'gadgets',
    'food',
    MainGenres.Action,
    MainGenres.Adventure,
    MainGenres.Crime,
    AgeGroups.Kids,
    Eras.nnineties,
  ],
);

export const legoduplospaceset = new Commercial(
  'LEGO Duplo Space Set',
  'legoduplospaceset',
  30,
  '/path/legoduplospaceset.mp4',
  MediaType.Commercial,
  [MainGenres.Adventure, MainGenres.SciFi, AgeGroups.Kids, Eras.nnineties],
);

export const fisherpricefirestation = new Commercial(
  'Fisher-Price Fire Station Rescue Set',
  'fisherpricefirestation',
  30,
  '/path/fisherpricefirestation.mp4',
  MediaType.Commercial,
  ['rescue', 'adventure', MainGenres.Action, AgeGroups.Kids, Eras.nnineties],
);

export const mightymaxplayset = new Commercial(
  'Mighty Max Playset',
  'mightymaxplayset',
  30,
  '/path/mightymaxplayset.mp4',
  MediaType.Commercial,
  [
    'adventure',
    'toys',
    MainGenres.Action,
    MainGenres.Adventure,
    MainGenres.Fantasy,
    AgeGroups.Kids,
    Eras.nnineties,
  ],
);

export const hotwheelscrashers = new Commercial(
  'Hot Wheels Crashers',
  'hotwheelscrashers',
  30,
  '/path/hotwheelscrashers.mp4',
  MediaType.Commercial,
  [MainGenres.Action, AgeGroups.Family, Eras.nnineties],
);

export const nerfballzooka = new Commercial(
  'Nerf Ballzooka',
  'nerfballzooka',
  30,
  '/path/nerfballzooka.mp4',
  MediaType.Commercial,
  [MainGenres.Action, AgeGroups.Family, Eras.nnineties],
);

export const beastwarsactionfigures = new Commercial(
  'Beast Wars Transformers',
  'beastwarsactionfigures',
  30,
  '/path/beastwarsactionfigures.mp4',
  MediaType.Commercial,
  [MainGenres.Action, MainGenres.SciFi, AgeGroups.Family, Eras.nnineties],
);

export const digivice = new Commercial(
  'Digivice Virtual Pet (Digimon)',
  'digivice',
  30,
  '/path/digivice.mp4',
  MediaType.Commercial,
  [
    MainGenres.Fantasy,
    MainGenres.Adventure,
    AgeGroups.Family,
    Eras.twothousands,
  ],
);

export const legorockraiders = new Commercial(
  'LEGO Rock Raiders',
  'legorockraiders',
  30,
  '/path/legorockraiders.mp4',
  MediaType.Commercial,
  [MainGenres.Action, MainGenres.Adventure, AgeGroups.Family, Eras.nnineties],
);

export const starwarsthephantommenacepromotion = new Commercial(
  'Star Wars Episode I: The Phantom Menace Promo',
  'starwarsthephantommenacepromotion',
  30,
  '/path/starwarsthephantommenacepromotion.mp4',
  MediaType.Commercial,
  [MainGenres.SpaceOpera, MainGenres.Fantasy, AgeGroups.Family, Eras.nnineties],
);

export const actionmanspyline = new Commercial(
  'Action Man: Spy Line',
  'actionmanspyline',
  30,
  '/path/actionmanspyline.mp4',
  MediaType.Commercial,
  [MainGenres.Action, AgeGroups.Family, Eras.nnineties],
);

export const pokemontcgcommercial = new Commercial(
  'Pokémon Trading Card Game',
  'pokemontcgcommercial',
  30,
  '/path/pokemontcgcommercial.mp4',
  MediaType.Commercial,
  [MainGenres.Fantasy, MainGenres.Adventure, AgeGroups.Family, Eras.nnineties],
);

export const yugiohpromotion = new Commercial(
  'Yu-Gi-Oh! TV Show Promo',
  'yugiohpromotion',
  30,
  '/path/yugiohpromotion.mp4',
  MediaType.Commercial,
  [MainGenres.Action, MainGenres.Fantasy, AgeGroups.Family, Eras.twothousands],
);

export const gijoefighterjets = new Commercial(
  'G.I. Joe Fighter Jets',
  'gijoefighterjets',
  30,
  '/path/gijoefighterjets.mp4',
  MediaType.Commercial,
  [MainGenres.Action, AgeGroups.Family, Eras.nnineties],
);

export const tonkamightytrucks = new Commercial(
  'Tonka Mighty Trucks',
  'tonkamightytrucks',
  30,
  '/path/tonkamightytrucks.mp4',
  MediaType.Commercial,
  [MainGenres.Action, MainGenres.Adventure, AgeGroups.Kids, Eras.nnineties],
);

export const fisherpriceadventurecastle = new Commercial(
  'Fisher-Price Adventure Castle',
  'fisherpriceadventurecastle',
  30,
  '/path/fisherpriceadventurecastle.mp4',
  MediaType.Commercial,
  [
    MainGenres.Action,
    MainGenres.Adventure,
    MainGenres.Fantasy,
    AgeGroups.Kids,
    Eras.nnineties,
  ],
);

export const playmobilpirates = new Commercial(
  'Playmobil Pirates',
  'playmobilpirates',
  30,
  '/path/playmobilpirates.mp4',
  MediaType.Commercial,
  [
    MainGenres.Action,
    MainGenres.Adventure,
    MainGenres.Fantasy,
    AgeGroups.Kids,
    Eras.nnineties,
  ],
);

export const mcdonaldslegoexplorers = new Commercial(
  'McDonald’s LEGO Explorers Happy Meal',
  'mcdonaldslegoexplorers',
  30,
  '/path/mcdonaldslegoexplorers.mp4',
  MediaType.Commercial,
  [MainGenres.Action, MainGenres.Adventure, AgeGroups.Kids, Eras.nnineties],
);

export const bluescluesmailtime = new Commercial(
  'Blue’s Clues Mail Time Song Promo',
  'bluescluesmailtime',
  30,
  '/path/bluescluesmailtime.mp4',
  MediaType.Commercial,
  [
    MainGenres.Adventure,
    MainGenres.Educational,
    AgeGroups.Kids,
    Eras.nnineties,
  ],
);

export const bobthebuilderpromotion = new Commercial(
  'Bob the Builder Promo',
  'bobthebuilderpromotion',
  30,
  '/path/bobthebuilderpromotion.mp4',
  MediaType.Commercial,
  [
    MainGenres.Adventure,
    MainGenres.Educational,
    AgeGroups.Kids,
    Eras.nnineties,
  ],
);

export const barneyadventurebus = new Commercial(
  'Barney’s Adventure Bus VHS Promo',
  'barneyadventurebus',
  30,
  '/path/barneyadventurebus.mp4',
  MediaType.Commercial,
  [MainGenres.Adventure, AgeGroups.Kids, Eras.nnineties],
);

export const kidospacecenter = new Commercial(
  'Kido Space Center Playset',
  'kidospacecenter',
  30,
  '/path/kidospacecenter.mp4',
  MediaType.Commercial,
  [MainGenres.SciFi, MainGenres.Adventure, AgeGroups.Kids, Eras.nnineties],
);

export const rugratsvhscollection = new Commercial(
  'Rugrats VHS Collection Promo',
  'rugratsvhscollection',
  30,
  '/path/rugratsvhscollection.mp4',
  MediaType.Commercial,
  [MainGenres.Adventure, AgeGroups.Kids, Eras.nnineties],
);

export const mcdonaldsdisneytoys = new Commercial(
  'McDonald’s Disney Toys Happy Meal',
  'mcdonaldsdisneytoys',
  30,
  '/path/mcdonaldsdisneytoys.mp4',
  MediaType.Commercial,
  [MainGenres.Adventure, AgeGroups.Kids, Eras.nnineties],
);

export const bufferCommercials = [
  jurassicparktoys1,
  marvelvsstreetfighter98,
  wildones,
  dreambuilders,
  jurassicparktoys2,
  jurassicparktoys3,
  littleoopsiedaisy,
  meninblacktoys97,
  monsterfacetoy,
  newbluemms,
  superduperdoublelooper,
  transformersbeastwarstoys,
  gamegear1,
  sonicandknuckles1,
  banjokazooie1,
  fzero1,
  gauntletlegends1,
  halloween711,
  alientrailer1,
  americanwerewolfinlondontrailer1,
  beetlejuicetrailer1,
  ocarinaoftimetrailer1,
  ijustshippedmybed,
  cornpopsgolf,
  blacktronlegomaniac,
  starttrektoys,
  sharkbitesfruitsnacks,
  ricecrispiescerealtalks,
  pizzahutxmen,
  mcdonaldscrush,
  transformers80s1,
  alienstoys1,
  jurassicpark3toys,
  starwarstoylightsabers,
  nerfblastershowdown,
  transformersbeastwars,
  digimontoys,
  yugiohcardgame,
  hotwheelscrashzone,
  pokemonredblue,
  jurassicparkinflatabletrex,
  goosebumpsboardgame,
  legoexploriens,
  mybuddykidsister,
  teddyruxpinstorybook,
  mcdonaldsbatmanforeverhappymeal,
  barneydinostoreadventure,
  fisherpriceadventurepeople,
  playdohextrudedinos,
  tonkarealsoundsfiretruck,
  mcdonaldshappymealspacejam,
  fisherpricewildwesttown,
  rugratshappymeal,
  batmananimatedseriesfigures,
  spidermanactionset,
  legoaquazone,
  starwarsactionfleet,
  powerangersmegazord,
  tomagotchipet,
  bioniclemaskoflight,
  nintendogameboypokemon,
  yugiohdueldisk,
  fisherpriceimaginext,
  rugratsmoviepromotion,
  thomasadventureset,
  littlepeoplepirateship,
  duplomagicalcastle,
  mcdonaldsdisneydinos,
  happymealinspectorgadget,
  legoduplospaceset,
  fisherpricefirestation,
  mightymaxplayset,
  hotwheelscrashers,
  nerfballzooka,
  beastwarsactionfigures,
  digivice,
  legorockraiders,
  starwarsthephantommenacepromotion,
  actionmanspyline,
  pokemontcgcommercial,
  yugiohpromotion,
  gijoefighterjets,
  tonkamightytrucks,
  fisherpriceadventurecastle,
  playmobilpirates,
  mcdonaldslegoexplorers,
  bluescluesmailtime,
  bobthebuilderpromotion,
  barneyadventurebus,
  kidospacecenter,
  rugratsvhscollection,
  mcdonaldsdisneytoys,
];
