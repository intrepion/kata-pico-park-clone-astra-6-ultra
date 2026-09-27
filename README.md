# Pocket Pals

A complete, original-art cooperative puzzle platformer inspired by Pico Park. Two little cats share a key, give each other a boost, and solve six handmade levels together. Built with TypeScript, Canvas 2D, and Vite, with no game-engine dependency or backend.

## Play locally

Requires Node.js 22.12+ or 24+ and npm.

```sh
npm ci
npm run dev
```

Open the localhost address printed by Vite. Choose **Let’s play**. Every level is available from the level picker, so you can explore at your own pace.

| Action | Peach (player 1) | Mint (player 2)     |
| ------ | ---------------- | ------------------- |
| Move   | A / D            | Left / Right arrows |
| Jump   | W                | Up arrow            |

**Solo practice:** either set of controls moves the selected pal; Q switches to the other. Space also jumps in solo mode. The other pal waits where you leave them. Touch controls are available on phones and tablets; the player button switches the controlled pal.

**R** restarts the level. **Escape** or **P** pauses/resumes. The toolbar also provides restart, pause, sound, and fullscreen controls. Opening the instructions, switching tabs, or leaving the browser pauses play.

## How the puzzles work

- Either pal can collect the shared key; **both** must reach the exit to finish.
- Jump onto your friend's head to reach higher platforms. A moving pal can carry a rider.
- A pressure switch opens its gate. Once a pal crosses, the gate stays open.
- A bridge activates from its switch, then stays up while either the switch or the bridge supports a pal. Transfer your weight between pals to get everyone across.
- Falling or touching spikes resets both pals, the key, stars, and switches. The level timer and retry count continue.
- Three optional stars per level add an extra challenge. Best times, most stars, completed levels, play mode, and sound preference save in this browser's local storage. Play still works when storage is unavailable.

The six levels progress from head-stacking to switches, bridge handoffs, elevated teamwork, running jumps, and a final combination puzzle. **A little stuck?** reveals a hint for the current level.

This is local two-player co-op with a solo practice option. Online multiplayer and gamepads are outside this version. The name, artwork, characters, sounds, and level layouts are original; no Pico Park assets are included.

## Verify and build

```sh
npx playwright install chromium
npm run check
```

`check` runs formatting verification, engine tests, TypeScript checking, a production build, and Chromium browser tests. Engine tests complete all six levels using movement and jump inputs, and cover collision, carry/stack behavior, coyote time, jump buffering, keys, gates, bridges, hazards, pause, and resets. Browser tests exercise real keyboard completion and progression, controls, dialogs, preference persistence, and phone touch controls.

```sh
npm run build
npm run preview
```

The static production app is written to `dist/`; serve it with any static web server. Fonts are bundled, so play does not depend on a font CDN. CI runs the same check on pushes and pull requests.

## Code map

| File                 | Responsibility                                                   |
| -------------------- | ---------------------------------------------------------------- |
| `src/game.ts`        | Deterministic simulation, collisions, and shared puzzle state    |
| `src/levels.ts`      | Six declarative level layouts and hints                          |
| `src/render.ts`      | Original Canvas pixel art and animation                          |
| `src/main.ts`        | Accessible interface, input, fixed-step game loop, and lifecycle |
| `src/storage.ts`     | Validated, failure-tolerant local progress                       |
| `src/audio.ts`       | Small synthesized Web Audio effects                              |
| `tests/game.test.ts` | Simulation regression tests and complete solution routes         |
| `tests/ui.spec.ts`   | Browser-level gameplay and interface verification                |

The simulation runs at 120 fixed steps per second, independently of rendering. It clamps delayed frames and pauses when focus is lost to prevent background progress. Art is drawn with code; UI fonts are DM Sans and Space Grotesk, distributed by Fontsource under the SIL Open Font License.

MIT licensed; see [LICENSE](LICENSE).
