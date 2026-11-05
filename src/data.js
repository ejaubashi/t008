export const asset = (path) => `${import.meta.env.BASE_URL}${path}`;

export const artists = {
  wolfstein: {
    name: 'Jack Wolfstein', subtitle: 'British, b. 1968 · Seascape',
    description: 'Jack Wolfstein paints the North Sea coast, usually in bad weather. He has worked with the gallery since 2010.',
    born: '1968, Whitby', lives: 'Hastings', since: 'since 2010',
  },
  lindqvist: { name: 'Mira Lindqvist' },
  kern: { name: 'Tobias Kern' },
  osei: {
    name: 'Amara Osei', subtitle: 'British-Ghanaian, b. 1985 · Plein-air painting',
    description: 'Amara Osei paints streets and squares from life, returning to the same spot for weeks. She has shown with the gallery since 2018.',
  },
  cole: {
    name: 'River Cole', subtitle: 'American, b. 1990 · Portraiture',
    description: 'River Cole paints portraits in a single sitting, usually of friends and other artists. Cole has shown with the gallery since 2019.',
  },
};

const records = [
  [1,'Before the Squall','wolfstein','before-the-squall',904,585],
  [2,'Two Boats, Heavy Weather','wolfstein','heavy-weather',773,585],
  [3,'Approaching Weather','wolfstein','approaching-weather',351,222],
  [4,'The Heath under Storm','wolfstein','heath-under-storm',741,585],
  [5,'Rain over the Valley','wolfstein','rain-over-the-valley',276,184],
  [6,'Rocky Coast at Low Tide','wolfstein','rocky-coast',261,155],
  [7,'The Northern Coast','wolfstein','northern-coast'],
  [8,'Breakers','wolfstein','breakers'],
  [9,'Festival in the Square','lindqvist','festival-in-the-square'],
  [10,'Pastoral Gathering','lindqvist','pastoral-gathering'],
  [11,'The May Dance','lindqvist','may-dance'],
  [12,'An Afternoon Party','lindqvist','afternoon-party'],
  [13,'Figures in Costume','lindqvist','figures-in-costume'],
  [14,'Man in a Black Coat','kern','black-coat'],
  [15,'Old Man in a Fur Cap','kern','fur-cap'],
  [16,'Portrait with a Lace Collar','kern','lace-collar'],
  [17,'Woman in a White Cap','kern','white-cap'],
  [18,'The Young Heir','kern','young-heir'],
  [19,'The Square in the Rain','osei','square-in-the-rain',363,296],
  [20,'Street, Early Afternoon','osei','street-early-afternoon',435,358],
  [21,'The Road into Town','osei','road-into-town',330,264],
  [22,'Avenue, Winter','osei','avenue-winter',282,339],
  [23,'Jeanne','cole','jeanne',250,338],
  [24,'The Sculptor','cole','the-sculptor',345,344],
  [25,'Self-Portrait at Twenty-Five','cole','self-portrait-at-twenty-five',230,345],
  [26,'Self-Portrait, Studio Light','cole','studio-light',212,277],
  [27,'Woman in a Black Scarf','cole','black-scarf',611,747],
];
export const works = records.map(([number,title,artist,slug,width,height]) => ({
  number, title, artist, slug, width, height,
  image: width ? asset(`paintings/${String(number).padStart(2,'0')}.webp`) : null,
  route: `/work/${artist}/${slug}`,
}));
export const visibleWorks = works.filter(work => work.image);

// Coordinates are in a 1920px-wide field. The field scales with the viewport.
export const fieldLayout = [
  [1,1055,-80,380], [2,687,360,434], [3,1285,460,338], [4,297,270,241],
  [5,1326,920,276], [6,405,940,261],
  [20,1246,1450,435], [21,390,1650,330], [19,1041,2000,363], [22,593,2075,282],
  [23,1307,2720,250], [27,490,2860,216],
  [24,500,3290,345], [25,1593,3205,230], [26,1015,3490,212],
].map(([number,x,y,width])=>({work:works.find(w=>w.number===number),x,y,width}));

export const timeline = [
  ['2009','The gallery opens','The gallery opens in East London, representing painters from the UK and Europe.'],
  ['2010','Jack Wolfstein','Jack Wolfstein begins working with the gallery.'],
  ['2012','The ground floor','The new space opens in September after a four-month refit. The concrete floor and the two north-facing windows are kept.'],
  ['2013','Mira Lindqvist','Mira Lindqvist joins the gallery. Her first exhibition, Festival, needs temporary walls to hang the largest canvases.'],
  ['2014','Exhibition texts','Each exhibition now comes with a printed text written by the artist, free at the front desk.'],
  ['2015','Tobias Kern','Tobias Kern’s exhibition Restorations opens in April. Three works are later lent to a museum exhibition in Rotterdam.'],
];
