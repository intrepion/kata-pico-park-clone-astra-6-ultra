import { LEVELS, type Level } from "./levels";

export const WIDTH = 1000;
export const HEIGHT = 560;
export const PLAYER_W = 30;
export const PLAYER_H = 38;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface Player extends Rect {
  id: 0 | 1;
  vx: number;
  vy: number;
  grounded: boolean;
  facing: -1 | 1;
}
export type GameEvent = "jump" | "key" | "star" | "death" | "win" | "switch";
export interface GameState {
  players: Player[];
  level: Level;
  levelIndex: number;
  status: "ready" | "playing" | "paused" | "won";
  elapsed: number;
  deaths: number;
  hasKey: boolean;
  plates: boolean[];
  gateOpen: boolean[];
  stars: boolean[];
  events: GameEvent[];
  time: number;
}
export type Controls = { left: boolean; right: boolean; jump: boolean }[];

const SPEED = 245;
const GRAVITY = 1750;
const JUMP_SPEED = 600;
const COYOTE_TIME = 0.1;
const JUMP_BUFFER = 0.12;
const EPSILON = 0.01;
const NONE = { left: false, right: false, jump: false };

interface Runtime {
  jumpHeld: boolean[];
  coyote: number[];
  buffer: number[];
  latched: boolean[];
}

const internals = new WeakMap<GameState, Runtime>();

function runtime(state: GameState): Runtime {
  let result = internals.get(state);
  if (!result) {
    result = {
      jumpHeld: [false, false],
      coyote: [0, 0],
      buffer: [0, 0],
      latched: state.level.gates.map(() => false),
    };
    internals.set(state, result);
  }
  return result;
}

export function overlaps(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.w - EPSILON &&
    a.x + a.w > b.x + EPSILON &&
    a.y < b.y + b.h - EPSILON &&
    a.y + a.h > b.y + EPSILON
  );
}

function horizontalOverlap(a: Rect, b: Rect): boolean {
  return a.x + a.w > b.x + EPSILON && a.x < b.x + b.w - EPSILON;
}

function standsOn(player: Rect, platform: Rect): boolean {
  return (
    horizontalOverlap(player, platform) &&
    Math.abs(player.y + player.h - platform.y) < 1.1
  );
}

function spawnPlayers(level: Level): Player[] {
  return level.spawns.map((spawn, index) => ({
    ...spawn,
    w: PLAYER_W,
    h: PLAYER_H,
    id: index as 0 | 1,
    vx: 0,
    vy: 0,
    grounded: true,
    facing: 1,
  }));
}

export function createGame(levelIndex = 0): GameState {
  const safeIndex = Math.max(
    0,
    Math.min(
      LEVELS.length - 1,
      Math.trunc(Number.isFinite(levelIndex) ? levelIndex : 0),
    ),
  );
  const level = LEVELS[safeIndex]!;
  return {
    players: spawnPlayers(level),
    level,
    levelIndex: safeIndex,
    status: "ready",
    elapsed: 0,
    deaths: 0,
    hasKey: false,
    plates: level.plates.map(() => false),
    gateOpen: level.gates.map(() => false),
    stars: level.stars.map(() => false),
    events: [],
    time: 0,
  };
}

export function startGame(state: GameState): void {
  if (state.status === "ready") state.status = "playing";
}

export function pauseGame(state: GameState): void {
  if (state.status === "playing") state.status = "paused";
}

export function resumeGame(state: GameState): void {
  if (state.status === "paused") {
    state.status = "playing";
    runtime(state).jumpHeld = [false, false];
  }
}

export function restartGame(state: GameState): GameState {
  const fresh = createGame(state.levelIndex);
  fresh.status = state.status === "ready" ? "ready" : "playing";
  return fresh;
}

function respawn(state: GameState): void {
  state.players = spawnPlayers(state.level);
  state.hasKey = false;
  state.stars.fill(false);
  state.plates.fill(false);
  state.gateOpen.fill(false);
  state.deaths += 1;
  const oldHeld = runtime(state).jumpHeld;
  internals.delete(state);
  runtime(state).jumpHeld = oldHeld;
  state.events.push("death");
}

function updateMechanisms(state: GameState): void {
  const rt = runtime(state);
  const before = state.plates.slice();
  state.plates = state.level.plates.map(
    (plate, index) =>
      state.players.some(
        (player) =>
          horizontalOverlap(player, plate) &&
          player.y + player.h >= plate.y &&
          player.y + player.h <= plate.y + plate.h + 2,
      ) ||
      (Boolean(before[index]) &&
        state.level.bridges.some(
          (bridge) =>
            bridge.plate === index &&
            state.players.some((player) => standsOn(player, bridge)),
        )),
  );
  if (state.plates.some((active, index) => active && !before[index]))
    state.events.push("switch");
  state.gateOpen = state.level.gates.map((gate, index) => {
    if (
      state.gateOpen[index] &&
      state.players.some((player) => player.x >= gate.x + gate.w)
    )
      rt.latched[index] = true;
    return (
      rt.latched[index] ||
      Boolean(state.plates[gate.plate]) ||
      (Boolean(state.gateOpen[index]) &&
        state.players.some((player) => overlaps(player, gate)))
    );
  });
}

function solids(state: GameState): Rect[] {
  return [
    ...state.level.platforms,
    ...state.level.gates.filter((_, index) => !state.gateOpen[index]),
    ...state.level.bridges.filter((bridge) => state.plates[bridge.plate]),
  ];
}

function moveHorizontal(
  player: Player,
  amount: number,
  platforms: Rect[],
): void {
  player.x += amount;
  for (const platform of platforms) {
    if (!overlaps(player, platform)) continue;
    if (amount > 0) player.x = Math.min(player.x, platform.x - player.w);
    else if (amount < 0) player.x = Math.max(player.x, platform.x + platform.w);
    player.vx = 0;
  }
  player.x = Math.max(0, Math.min(WIDTH - player.w, player.x));
}

function substep(state: GameState, controls: Controls, dt: number): boolean {
  const rt = runtime(state);
  const previous = state.players.map((player) => ({ ...player }));
  const rides = state.players.map((player, index) =>
    state.players.findIndex(
      (other, otherIndex) => index !== otherIndex && standsOn(player, other),
    ),
  );
  const jumped = [false, false];
  updateMechanisms(state);
  const terrain = solids(state);

  for (const player of state.players) {
    const index = player.id;
    const input = controls[index] ?? NONE;
    rt.coyote[index] = player.grounded
      ? COYOTE_TIME
      : Math.max(0, rt.coyote[index]! - dt);
    rt.buffer[index] = Math.max(0, rt.buffer[index]! - dt);
    if (input.jump && !rt.jumpHeld[index]) rt.buffer[index] = JUMP_BUFFER;
    rt.jumpHeld[index] = input.jump;
    if (rt.buffer[index]! > 0 && rt.coyote[index]! > 0) {
      player.vy = -JUMP_SPEED;
      player.grounded = false;
      rt.buffer[index] = 0;
      rt.coyote[index] = 0;
      jumped[index] = true;
      state.events.push("jump");
    }
    player.vx = (Number(input.right) - Number(input.left)) * SPEED;
    if (player.vx !== 0) player.facing = player.vx > 0 ? 1 : -1;
    moveHorizontal(player, player.vx * dt, terrain);
  }

  // A passenger inherits their friend's actual movement, including wall stops.
  for (const player of state.players) {
    const baseIndex = rides[player.id]!;
    if (baseIndex >= 0 && !jumped[player.id]) {
      const base = state.players[baseIndex]!;
      moveHorizontal(player, base.x - previous[baseIndex]!.x, terrain);
    }
  }

  const [a, b] = state.players as [Player, Player];
  if (overlaps(a, b)) {
    const left = previous[0]!.x < previous[1]!.x ? a : b;
    const right = left === a ? b : a;
    const penetration = left.x + left.w - right.x;
    // Side contact shares the push. Rechecking walls keeps both cats outside them.
    moveHorizontal(left, -penetration / 2, terrain);
    moveHorizontal(right, penetration / 2, terrain);
    if (overlaps(left, right)) {
      if (left.x <= EPSILON) right.x = left.x + left.w;
      else left.x = right.x - left.w;
    }
  }

  const verticalOrder = state.players
    .slice()
    .sort((first, second) => previous[second.id]!.y - previous[first.id]!.y);
  for (const player of verticalOrder) {
    const old = previous[player.id]!;
    const baseIndex = rides[player.id]!;
    const base = baseIndex >= 0 ? state.players[baseIndex] : undefined;
    player.grounded = false;
    if (base && !jumped[player.id] && horizontalOverlap(player, base)) {
      player.y = base.y - player.h;
      player.vy = base.vy;
      player.grounded = true;
      for (const platform of terrain) {
        if (!overlaps(player, platform)) continue;
        if (player.vy < 0 && old.y >= platform.y + platform.h - 1) {
          player.y = platform.y + platform.h;
          player.vy = 0;
          base.y = player.y + player.h;
          base.vy = 0;
        } else if (player.vy >= 0 && old.y + old.h <= platform.y + 1) {
          player.y = platform.y - player.h;
          player.vy = 0;
        }
      }
    } else {
      player.vy = Math.min(1000, player.vy + GRAVITY * dt);
      player.y += player.vy * dt;
      for (const platform of terrain) {
        if (!overlaps(player, platform)) continue;
        if (player.vy >= 0 && old.y + old.h <= platform.y + 1) {
          player.y = platform.y - player.h;
          player.vy = 0;
          player.grounded = true;
        } else if (player.vy < 0 && old.y >= platform.y + platform.h - 1) {
          player.y = platform.y + platform.h;
          player.vy = 0;
        }
      }
      const other = state.players[1 - player.id]!;
      const oldOther = previous[other.id]!;
      if (
        horizontalOverlap(player, other) &&
        old.y + old.h <= oldOther.y + 1 &&
        player.y + player.h >= other.y &&
        player.vy >= other.vy
      ) {
        player.y = other.y - player.h;
        player.vy = other.vy;
        player.grounded = true;
      } else if (
        horizontalOverlap(player, other) &&
        rides[other.id] !== player.id &&
        old.y >= oldOther.y + oldOther.h - 1 &&
        player.y < other.y + other.h &&
        player.vy < other.vy
      ) {
        player.y = other.y + other.h;
        player.vy = 0;
      }
    }
    // Keep the canvas ceiling solid without an invisible jump-through boundary.
    if (player.y < 0) {
      player.y = 0;
      player.vy = Math.max(0, player.vy);
    }
  }

  if (
    state.players.some(
      (player) =>
        player.y > HEIGHT + 50 ||
        state.level.hazards.some((hazard) => overlaps(player, hazard)),
    )
  ) {
    respawn(state);
    return false;
  }
  updateMechanisms(state);
  if (
    !state.hasKey &&
    state.players.some((player) => overlaps(player, state.level.key))
  ) {
    state.hasKey = true;
    state.events.push("key");
  }
  state.level.stars.forEach((star, index) => {
    if (
      !state.stars[index] &&
      state.players.some((player) => overlaps(player, star))
    ) {
      state.stars[index] = true;
      state.events.push("star");
    }
  });
  const door = state.level.exit;
  const doorway = {
    x: door.x - 22,
    y: door.y - 8,
    w: door.w + 44,
    h: door.h + 16,
  };
  if (
    state.hasKey &&
    state.players.every((player) => overlaps(player, doorway))
  ) {
    state.status = "won";
    state.events.push("win");
    return false;
  }
  return true;
}

/** Advance at a bounded fixed timestep, even if a tab wakes after a long frame. */
export function stepGame(
  state: GameState,
  controls: Controls,
  dtSeconds: number,
): void {
  state.events = [];
  if (
    state.status !== "playing" ||
    !Number.isFinite(dtSeconds) ||
    dtSeconds <= 0
  )
    return;
  let remaining = Math.min(dtSeconds, 0.1);
  while (remaining > 0.000001) {
    const dt = Math.min(remaining, 1 / 120);
    state.elapsed += dt;
    state.time += dt;
    remaining -= dt;
    if (!substep(state, controls, dt)) break;
  }
}
