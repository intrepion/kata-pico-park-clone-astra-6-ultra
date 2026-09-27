import assert from "node:assert/strict";
import test from "node:test";
import {
  createGame,
  startGame,
  stepGame,
  pauseGame,
  resumeGame,
  restartGame,
  PLAYER_H,
  WIDTH,
  type Controls,
  type GameState,
} from "../src/game";
import { LEVELS } from "../src/levels";

const idle = { left: false, right: false, jump: false };
type Input = Partial<typeof idle>;
const input = (value: Input = {}) => ({ ...idle, ...value });
const controls = (first: Input = {}, second: Input = {}): Controls => [
  input(first),
  input(second),
];

function play(level = 0): GameState {
  const state = createGame(level);
  startGame(state);
  return state;
}

function frames(
  state: GameState,
  count: number,
  first: Input = {},
  second: Input = {},
): void {
  for (let frame = 0; frame < count; frame += 1)
    stepGame(state, controls(first, second), 1 / 120);
}

function walkTo(
  state: GameState,
  cat: 0 | 1,
  target: number,
  limit = 1100,
): void {
  for (let frame = 0; frame < limit; frame += 1) {
    const player = state.players[cat]!;
    if (Math.abs(player.x - target) < 2.5 || state.status === "won") return;
    const action = { left: player.x > target, right: player.x < target };
    stepGame(
      state,
      cat === 0 ? controls(action) : controls({}, action),
      1 / 120,
    );
  }
  assert.fail(
    `Level ${state.level.id}: cat ${cat} could not walk to ${target}; at ${JSON.stringify(state.players[cat])}`,
  );
}

function jumpTo(state: GameState, cat: 0 | 1, target: number): void {
  for (let frame = 0; frame < 105; frame += 1) {
    const player = state.players[cat]!;
    const action = {
      jump: frame < 10,
      left: player.x > target + 2.5,
      right: player.x < target - 2.5,
    };
    stepGame(
      state,
      cat === 0 ? controls(action) : controls({}, action),
      1 / 120,
    );
  }
}

function stackAt(state: GameState, x: number): void {
  walkTo(state, 1, x);
  walkTo(state, 0, x - 44);
  jumpTo(state, 0, x);
  assert.ok(
    Math.abs(state.players[0]!.y + PLAYER_H - state.players[1]!.y) < 1,
    "A jump lands on the other cat",
  );
}

test("ready, pause, resume, invalid dt, and restart preserve their intended boundaries", () => {
  const state = createGame(0);
  const initial = structuredClone(state.players);
  frames(state, 30, { right: true });
  assert.deepEqual(state.players, initial);
  startGame(state);
  frames(state, 10, { right: true });
  assert.ok(state.players[0]!.x > initial[0]!.x);
  pauseGame(state);
  const paused = JSON.stringify(state.players);
  const elapsed = state.elapsed;
  frames(state, 30, { right: true });
  assert.equal(JSON.stringify(state.players), paused);
  assert.equal(state.elapsed, elapsed);
  resumeGame(state);
  stepGame(state, controls({ right: true }), Number.NaN);
  stepGame(state, controls({ right: true }), -1);
  assert.equal(JSON.stringify(state.players), paused);
  frames(state, 2, { right: true });
  assert.ok(state.elapsed > elapsed);
  const fresh = restartGame(state);
  assert.equal(fresh.status, "playing");
  assert.equal(fresh.elapsed, 0);
  assert.deepEqual(fresh.players, initial);
  assert.equal(createGame(-3).levelIndex, 0);
  assert.equal(createGame(200).levelIndex, LEVELS.length - 1);
});

test("holding jump makes one jump, lands on the floor, and world walls remain solid", () => {
  const state = play();
  let jumps = 0;
  let highest = state.players[0]!.y;
  for (let frame = 0; frame < 200; frame += 1) {
    stepGame(state, controls({ jump: true, left: true }), 1 / 120);
    jumps += state.events.filter((event) => event === "jump").length;
    highest = Math.min(highest, state.players[0]!.y);
  }
  assert.equal(jumps, 1);
  assert.ok(highest < 370 && highest > 350);
  assert.equal(state.players[0]!.y, 462);
  assert.equal(state.players[0]!.grounded, true);
  assert.equal(state.players[0]!.x, 0);
  frames(state, 1000, {}, { right: true });
  assert.equal(state.players[1]!.x, WIDTH - 30);
});

test("real jumps stack cats and a rider follows the base horizontally and vertically", () => {
  const state = play();
  stackAt(state, 310);
  const offset = state.players[0]!.x - state.players[1]!.x;
  frames(state, 20, {}, { right: true });
  assert.ok(
    Math.abs(state.players[0]!.x - state.players[1]!.x - offset) < 0.001,
  );
  frames(state, 10, {}, { jump: true });
  assert.ok(state.players[1]!.y < 462);
  assert.ok(
    Math.abs(state.players[0]!.y + PLAYER_H - state.players[1]!.y) < 0.001,
  );
});

test("coyote time forgives a late edge jump and a buffered jump fires on landing", () => {
  const edge = play(4);
  edge.players[0]!.x = 270;
  frames(edge, 10, { right: true });
  assert.equal(edge.players[0]!.grounded, false);
  frames(edge, 1, { right: true, jump: true });
  assert.ok(edge.players[0]!.vy < -500);
  assert.ok(edge.events.includes("jump"));

  const landing = play();
  Object.assign(landing.players[0]!, { y: 430, vy: 300, grounded: false });
  let jumps = 0;
  for (let frame = 0; frame < 25; frame += 1) {
    stepGame(landing, controls({ jump: frame < 4 }), 1 / 120);
    jumps += landing.events.filter((event) => event === "jump").length;
  }
  assert.equal(jumps, 1);
  assert.ok(landing.players[0]!.y < 420);
});

test("a stacked pair cannot jump through a platform ceiling", () => {
  const state = play();
  state.players[1]!.x = 463;
  state.players[0]!.x = 463;
  state.players[0]!.y = 424;
  frames(state, 12, {}, { jump: true });
  assert.ok(state.players[0]!.y >= 414);
  assert.ok(state.players[1]!.y >= 452);
  assert.ok(state.players[0]!.y + PLAYER_H <= state.players[1]!.y + 0.001);
});

test("one cat and an unopened door cannot complete a level", () => {
  const state = play();
  state.players[0]!.x = 900;
  state.players[1]!.x = 940;
  frames(state, 1);
  assert.equal(state.status, "playing");
  state.hasKey = true;
  state.players[1]!.x = 300;
  frames(state, 1);
  assert.equal(state.status, "playing");
  state.players[1]!.x = 940;
  frames(state, 1);
  assert.equal(state.status, "won");
  assert.ok(state.events.includes("win"));
  const finished = state.elapsed;
  frames(state, 30, { right: true });
  assert.equal(state.elapsed, finished);
});

test("a fall resets both teammates and collectibles but keeps attempts and elapsed time", () => {
  const state = play(2);
  state.hasKey = true;
  state.stars.fill(true);
  state.players[0]!.x = 520;
  state.players[0]!.y = 510;
  frames(state, 3);
  assert.equal(state.deaths, 1);
  assert.equal(state.hasKey, false);
  assert.ok(state.stars.every((value) => !value));
  assert.deepEqual(
    state.players.map(({ x, y }) => ({ x, y })),
    state.level.spawns,
  );
  assert.ok(state.elapsed > 0);
  assert.equal(state.status, "playing");
});

test("a gate stays open while a cat occupies it, then latches after crossing", () => {
  const state = play(1);
  walkTo(state, 0, 249);
  assert.equal(state.plates[0], true);
  walkTo(state, 1, 620);
  state.players[0]!.x = 200;
  frames(state, 1);
  assert.equal(state.plates[0], false);
  assert.equal(state.gateOpen[0], true);
  walkTo(state, 1, 670);
  frames(state, 1);
  assert.equal(state.gateOpen[0], true);
  walkTo(state, 1, 730);
  assert.equal(state.gateOpen[0], true);
});

test("bridge weight transfers from switch to a teammate, and releases when empty", () => {
  const state = play(2);
  walkTo(state, 0, 255);
  walkTo(state, 1, 517);
  walkTo(state, 0, 331);
  assert.equal(state.plates[0], true);
  assert.equal(state.players[1]!.grounded, true);
  walkTo(state, 0, 714);
  assert.ok(state.players.every((player) => player.x >= 674));
  frames(state, 1);
  assert.equal(state.plates[0], false);
  assert.equal(state.deaths, 0);
});

test("level 1 can be completed through movement and stacking inputs", () => {
  const state = play();
  stackAt(state, 377);
  jumpTo(state, 0, 486);
  assert.equal(state.hasKey, true);
  frames(state, 420, { right: true }, { right: true });
  assert.equal(state.status, "won");
  assert.equal(state.deaths, 0);
});

test("level 2 can be completed with a switch handoff", () => {
  const state = play(1);
  walkTo(state, 0, 249);
  walkTo(state, 1, 780);
  assert.equal(state.hasKey, true);
  assert.equal(state.gateOpen[0], true);
  frames(state, 430, { right: true }, { right: true });
  assert.equal(state.status, "won");
  assert.equal(state.deaths, 0);
});

test("level 3 can be completed with sequential solo inputs", () => {
  const state = play(2);
  walkTo(state, 0, 255);
  walkTo(state, 1, 517);
  walkTo(state, 0, 789);
  walkTo(state, 1, 930);
  walkTo(state, 0, 896);
  assert.equal(state.status, "won");
  assert.equal(state.deaths, 0);
});

test("level 4 can be completed by splitting upper and lower routes", () => {
  const state = play(3);
  stackAt(state, 294);
  jumpTo(state, 0, 466);
  assert.equal(state.players[0]!.y, 352);
  walkTo(state, 0, 482);
  jumpTo(state, 0, 675);
  assert.equal(state.players[0]!.y, 262);
  assert.equal(state.hasKey, true);
  walkTo(state, 0, 687);
  walkTo(state, 1, 513);
  jumpTo(state, 1, 675);
  walkTo(state, 1, 909);
  assert.equal(state.gateOpen[0], true);
  walkTo(state, 0, 884);
  assert.equal(state.status, "won");
  assert.equal(state.deaths, 0);
});

test("level 5 can be completed with a running jump and gate handoff", () => {
  const state = play(4);
  walkTo(state, 0, 180);
  walkTo(state, 1, 337);
  walkTo(state, 0, 484);
  walkTo(state, 1, 600);
  jumpTo(state, 1, 789);
  walkTo(state, 1, 905);
  walkTo(state, 0, 600);
  jumpTo(state, 0, 789);
  walkTo(state, 0, 916);
  assert.equal(state.status, "won");
  assert.equal(state.deaths, 0);
});

test("level 6 can be completed with two weight transfers and a boost", () => {
  const state = play(5);
  walkTo(state, 0, 175);
  walkTo(state, 1, 375);
  walkTo(state, 0, 510);
  assert.ok(state.players.every((player) => player.x >= 500));
  assert.equal(state.plates[0], false);
  jumpTo(state, 0, 535);
  assert.ok(Math.abs(state.players[0]!.y + PLAYER_H - state.players[1]!.y) < 1);
  jumpTo(state, 0, 585);
  assert.equal(state.hasKey, true);
  assert.equal(state.plates[1], true);
  walkTo(state, 1, 744);
  jumpTo(state, 0, 746);
  assert.equal(state.deaths, 0);
  walkTo(state, 1, 930);
  walkTo(state, 0, 896);
  assert.equal(state.status, "won");
  assert.equal(state.deaths, 0);
});
