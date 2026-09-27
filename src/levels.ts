import type { Rect } from "./game";

export interface Level {
  id: number;
  name: string;
  subtitle: string;
  hint: string;
  mechanic: string;
  difficulty: 1 | 2 | 3;
  platforms: Rect[];
  spawns: { x: number; y: number }[];
  key: Rect;
  exit: Rect;
  hazards: Rect[];
  stars: Rect[];
  plates: Rect[];
  gates: (Rect & { plate: number })[];
  bridges: (Rect & { plate: number })[];
}

const floor = (x = 0, w = 1000): Rect => ({ x, y: 500, w, h: 60 });
const star = (x: number, y = 449): Rect => ({ x, y, w: 22, h: 22 });
const key = (x: number, y = 447): Rect => ({ x, y, w: 28, h: 28 });
const exit: Rect = { x: 896, y: 414, w: 66, h: 86 };
const spawns = [
  { x: 94, y: 462 },
  { x: 154, y: 462 },
];
const abyss = (x: number, w: number): Rect => ({ x, y: 548, w, h: 30 });

export const LEVELS: Level[] = [
  {
    id: 1,
    name: "A little lift",
    subtitle: "Great things start with a small boost.",
    hint: "Jump onto your friend, then jump again to reach the key. Bring both cats to the door.",
    mechanic: "STACK TOGETHER",
    difficulty: 1,
    platforms: [floor(), { x: 420, y: 390, w: 164, h: 24 }],
    spawns,
    key: key(483, 343),
    exit,
    hazards: [],
    stars: [star(276), star(546, 346), star(751)],
    plates: [],
    gates: [],
    bridges: [],
  },
  {
    id: 2,
    name: "Hold the line",
    subtitle: "A good friend opens doors.",
    hint: "Hold the gold switch while your friend crosses the gate. Once they are through, it stays open.",
    mechanic: "HOLD & GO",
    difficulty: 1,
    platforms: [floor(), { x: 384, y: 420, w: 114, h: 22 }],
    spawns,
    key: key(773),
    exit,
    hazards: [],
    stars: [star(310), star(430, 375), star(839)],
    plates: [{ x: 237, y: 492, w: 58, h: 8 }],
    gates: [{ x: 617, y: 326, w: 24, h: 174, plate: 0 }],
    bridges: [],
  },
  {
    id: 3,
    name: "A bridge between us",
    subtitle: "Share the weight. Find your way.",
    hint: "The switch creates a bridge. A cat standing on the bridge keeps it there. Trade places to get across.",
    mechanic: "PASS IT ON",
    difficulty: 2,
    platforms: [floor(0, 370), floor(674, 326)],
    spawns,
    key: key(769),
    exit,
    hazards: [abyss(370, 304)],
    stars: [star(398), star(513), star(628)],
    plates: [{ x: 243, y: 492, w: 58, h: 8 }],
    gates: [],
    bridges: [{ x: 370, y: 500, w: 304, h: 22, plate: 0 }],
  },
  {
    id: 4,
    name: "Higher together",
    subtitle: "One goes high. One goes ahead.",
    hint: "Give a boost to the first ledge. The switch at the top opens the gate below; send your friend through.",
    mechanic: "DIVIDE & CONQUER",
    difficulty: 2,
    platforms: [
      floor(),
      { x: 339, y: 390, w: 178, h: 24 },
      { x: 587, y: 300, w: 177, h: 24 },
    ],
    spawns,
    key: key(629, 254),
    exit,
    hazards: [{ x: 552, y: 482, w: 88, h: 18 }],
    stars: [star(394, 347), star(725, 257), star(783)],
    plates: [{ x: 670, y: 292, w: 58, h: 8 }],
    gates: [{ x: 844, y: 337, w: 24, h: 163, plate: 0 }],
    bridges: [],
  },
  {
    id: 5,
    name: "Mind the gap",
    subtitle: "A little trust. A running start.",
    hint: "Share the first bridge, then hold the middle switch while your friend jumps the gap. Jump near the edge!",
    mechanic: "TAKE THE LEAP",
    difficulty: 3,
    platforms: [floor(0, 285), floor(438, 175), floor(775, 225)],
    spawns: [
      { x: 68, y: 462 },
      { x: 116, y: 462 },
    ],
    key: key(864),
    exit: { x: 923, y: 414, w: 62, h: 86 },
    hazards: [abyss(285, 153), abyss(613, 162)],
    stars: [star(344), star(684, 386), star(812)],
    plates: [
      { x: 164, y: 492, w: 58, h: 8 },
      { x: 478, y: 492, w: 58, h: 8 },
    ],
    gates: [{ x: 823, y: 330, w: 24, h: 170, plate: 1 }],
    bridges: [{ x: 285, y: 500, w: 153, h: 22, plate: 0 }],
  },
  {
    id: 6,
    name: "The last little mile",
    subtitle: "Every step is better with you.",
    hint: "Get both cats to the middle island. Boost one onto the high switch, then keep the last bridge alive for them.",
    mechanic: "ALL TOGETHER NOW",
    difficulty: 3,
    platforms: [
      floor(0, 260),
      floor(500, 154),
      floor(844, 156),
      { x: 574, y: 390, w: 80, h: 24 },
    ],
    spawns: [
      { x: 64, y: 462 },
      { x: 114, y: 462 },
    ],
    key: key(577, 343),
    exit,
    hazards: [abyss(260, 240), abyss(654, 190)],
    stars: [star(390), star(624, 346), star(734)],
    plates: [
      { x: 159, y: 492, w: 58, h: 8 },
      { x: 578, y: 382, w: 58, h: 8 },
    ],
    gates: [],
    bridges: [
      { x: 260, y: 500, w: 240, h: 22, plate: 0 },
      { x: 654, y: 500, w: 190, h: 22, plate: 1 },
    ],
  },
];
