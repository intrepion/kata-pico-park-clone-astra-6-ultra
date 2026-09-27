import type { GameState, Player, Rect } from "./game";

type RenderOptions = { activePlayer: number | null; reducedMotion: boolean };

const INK = "#294d42";
const TILE = 20;

function block(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function pixelCloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(scale, scale);
  block(ctx, 0, 12, 88, 12, "#f7faf3");
  block(ctx, 12, 4, 28, 16, "#f7faf3");
  block(ctx, 32, 0, 28, 20, "#f7faf3");
  block(ctx, 60, 8, 16, 12, "#f7faf3");
  block(ctx, 12, 24, 68, 4, "#ddecdc");
  ctx.restore();
}

function sparkle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
) {
  block(ctx, x - size / 2, y - size * 1.5, size, size * 3, color);
  block(ctx, x - size * 1.5, y - size / 2, size * 3, size, color);
}

function background(
  ctx: CanvasRenderingContext2D,
  levelIndex: number,
  time: number,
) {
  block(ctx, 0, 0, 1000, 560, "#eaf3e9");

  ctx.strokeStyle = "rgba(109, 150, 118, 0.065)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= 1000; x += 40) {
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, 560);
  }
  for (let y = 0; y <= 560; y += 40) {
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(1000, y + 0.5);
  }
  ctx.stroke();

  // A quiet, block-built landscape keeps the collision geometry easy to read.
  block(ctx, 826, 56, 40, 40, "#f4edca");
  block(ctx, 818, 64, 56, 24, "#f4edca");
  pixelCloud(ctx, 78 + Math.sin(time * 0.07) * 4, 64, 1.2);
  pixelCloud(ctx, 433 + Math.sin(time * 0.05 + 2) * 5, 105, 0.85);
  pixelCloud(ctx, 698 + Math.sin(time * 0.04 + 4) * 4, 160, 0.7);

  const hillA = [
    382, 382, 356, 332, 312, 292, 276, 284, 308, 326, 350, 376, 396, 410, 406,
    384, 366, 350, 364, 390,
  ];
  const hillB = [
    460, 436, 412, 402, 418, 440, 448, 426, 398, 376, 366, 358, 374, 398, 418,
    438, 446, 420, 410, 432,
  ];
  hillA.forEach((y, i) =>
    block(ctx, i * 50, y + (levelIndex % 2) * 18, 50, 560 - y, "#dceadb"),
  );
  hillB.forEach((y, i) => block(ctx, i * 50, y, 50, 560 - y, "#d1e3ce"));

  [
    [98, 242],
    [294, 126],
    [631, 71],
    [905, 214],
    [533, 271],
  ].forEach(([x, y], i) => {
    sparkle(ctx, x, y + Math.sin(time * 0.8 + i) * 2, 2, "#b9d1b4");
  });

  // Small ferns belong to the distant scenery, never the playable platforms.
  for (const [x, y] of [
    [42, 471],
    [338, 463],
    [626, 502],
    [937, 461],
  ]) {
    block(ctx, x, y, 3, 28, "#bdd5b8");
    block(ctx, x - 9, y + 8, 9, 4, "#bdd5b8");
    block(ctx, x + 3, y + 14, 9, 4, "#bdd5b8");
  }
}

function flower(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  pale: boolean,
) {
  block(ctx, x, y - 10, 2, 10, "#749774");
  block(ctx, x + 2, y - 5, 4, 2, "#749774");
  const color = pale ? "#f6ecc6" : "#e5b9a2";
  block(ctx, x - 2, y - 15, 6, 8, color);
  block(ctx, x - 4, y - 13, 10, 4, color);
  block(ctx, x, y - 12, 2, 2, "#b6924d");
}

function platform(ctx: CanvasRenderingContext2D, r: Rect, index: number) {
  const { x, y, w, h } = r;
  block(ctx, x + 4, y + 7, w, h, "rgba(74, 106, 74, 0.12)");
  block(ctx, x, y + 7, w, h - 7, "#a2b99a");
  block(ctx, x, y, w, Math.min(h, 9), "#75996e");
  block(ctx, x, y, w, 3, "#90b081");
  block(ctx, x, y + 9, w, Math.min(4, h - 9), "#8ba781");
  if (h > 22) {
    block(ctx, x, y + h - 4, w, 4, "#8ba580");
    block(ctx, x + w - 4, y + 13, 4, h - 13, "#93ac89");
    for (let tx = x + 9; tx < x + w - 8; tx += TILE) {
      const n = Math.floor(tx / TILE) + index * 7;
      const offset = n % 3 === 0 ? 7 : 15;
      if (offset + 17 < h)
        block(ctx, tx, y + offset + 9, n % 2 ? 5 : 8, 3, "#91ac88");
      if (h > 50 && n % 2 === 0) block(ctx, tx + 4, y + 46, 5, 3, "#b7c8a9");
      if (h > 90 && n % 3 === 0) block(ctx, tx, y + 77, 6, 3, "#91ac88");
    }
  }
  for (let gx = x + 18; gx < x + w - 12; gx += 47) {
    if ((Math.floor(gx) + index) % 3 === 0) {
      block(ctx, gx, y - 4, 2, 4, "#90ad7d");
      block(ctx, gx + 3, y - 2, 2, 2, "#90ad7d");
    }
  }
  if (w > 125 && y > 170) {
    flower(
      ctx,
      x + 24 + ((index * 37) % Math.max(1, w - 70)),
      y,
      index % 2 === 0,
    );
  }
}

function key(ctx: CanvasRenderingContext2D, r: Rect, time: number) {
  const x = Math.round(r.x + r.w / 2);
  const y = Math.round(r.y + r.h / 2 + Math.sin(time * 3) * 3);
  block(ctx, x - 11, y - 7, 13, 13, "#ba9743");
  block(ctx, x - 9, y - 9, 9, 17, "#ba9743");
  block(ctx, x - 9, y - 6, 10, 10, "#efce70");
  block(ctx, x - 7, y - 7, 6, 12, "#efce70");
  block(ctx, x - 5, y - 3, 3, 4, "#eaf3e9");
  block(ctx, x, y - 2, 15, 5, "#ba9743");
  block(ctx, x, y - 3, 15, 4, "#f3d47e");
  block(ctx, x + 8, y + 1, 3, 6, "#d5ac50");
  block(ctx, x + 13, y + 1, 3, 4, "#d5ac50");
  sparkle(ctx, x - 13, y - 16, 1.5, "#d5b866");
}

function collectible(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  time: number,
  index: number,
) {
  const x = Math.round(r.x + r.w / 2);
  const y = Math.round(r.y + r.h / 2 + Math.sin(time * 2.6 + index) * 2);
  ctx.fillStyle = "#b99d53";
  ctx.beginPath();
  ctx.moveTo(x, y - 12);
  ctx.lineTo(x + 4, y - 4);
  ctx.lineTo(x + 12, y - 3);
  ctx.lineTo(x + 6, y + 3);
  ctx.lineTo(x + 7, y + 11);
  ctx.lineTo(x, y + 7);
  ctx.lineTo(x - 7, y + 11);
  ctx.lineTo(x - 6, y + 3);
  ctx.lineTo(x - 12, y - 3);
  ctx.lineTo(x - 4, y - 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#efd380";
  ctx.beginPath();
  ctx.moveTo(x, y - 9);
  ctx.lineTo(x + 3, y - 2);
  ctx.lineTo(x + 9, y - 2);
  ctx.lineTo(x + 4, y + 3);
  ctx.lineTo(x + 5, y + 8);
  ctx.lineTo(x, y + 5);
  ctx.lineTo(x - 5, y + 8);
  ctx.lineTo(x - 4, y + 3);
  ctx.lineTo(x - 9, y - 2);
  ctx.lineTo(x - 3, y - 2);
  ctx.closePath();
  ctx.fill();
  block(ctx, x - 2, y - 3, 2, 3, "#fff1b9");
}

function door(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  unlocked: boolean,
  time: number,
) {
  const x = Math.round(r.x);
  const y = Math.round(r.y);
  const w = Math.round(r.w);
  const h = Math.round(r.h);
  if (unlocked) {
    block(ctx, x - 9, y - 8, w + 18, h + 8, "rgba(202, 216, 137, 0.32)");
    if (Math.sin(time * 3) > -0.4) {
      sparkle(ctx, x - 11, y + h * 0.3, 2, "#d0b666");
      sparkle(ctx, x + w + 10, y + h * 0.6, 1.5, "#d0b666");
    }
  }
  block(ctx, x - 4, y + 4, w + 8, h - 4, "#71916e");
  block(ctx, x, y - 4, w, 8, "#71916e");
  block(ctx, x + 3, y + 3, w - 6, h - 3, "#3d6254");
  block(ctx, x + 8, y + 8, w - 16, h - 8, unlocked ? "#294d43" : "#4a705d");
  block(ctx, x + 8, y + 8, w - 16, 4, "#2e5548");
  block(ctx, x + w / 2 - 1, y + 14, 2, h - 14, "#365b4b");
  block(
    ctx,
    x + 13,
    y + 16,
    Math.max(1, w / 2 - 19),
    Math.max(1, h - 33),
    unlocked ? "#31564a" : "#517663",
  );
  block(
    ctx,
    x + w / 2 + 6,
    y + 16,
    Math.max(1, w / 2 - 19),
    Math.max(1, h - 33),
    unlocked ? "#31564a" : "#517663",
  );
  block(ctx, x + w / 2 - 8, y + h * 0.58, 4, 6, "#e2c071");
  block(ctx, x + w / 2 + 4, y + h * 0.58, 4, 6, "#e2c071");
  block(ctx, x - 6, y + h - 3, w + 12, 5, "#668361");

  const signY = y - 27;
  block(ctx, x + w / 2 - 23, signY, 46, 17, "#d7e4cf");
  block(ctx, x + w / 2 - 23, signY + 15, 46, 2, "#bdcfb5");
  ctx.fillStyle = "#577553";
  ctx.font = "bold 10px monospace";
  ctx.textAlign = "center";
  ctx.fillText("EXIT", Math.round(x + w / 2), signY + 12);
  if (!unlocked) {
    block(ctx, x + w / 2 - 4, y + 23, 8, 7, "#263f36");
    block(ctx, x + w / 2 - 2, y + 19, 4, 7, "#263f36");
    block(ctx, x + w / 2 - 1, y + 25, 2, 3, "#bfc99a");
  }
}

function pressurePlate(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  pressed: boolean,
  index: number,
) {
  block(ctx, r.x - 3, r.y + r.h - 5, r.w + 6, 5, "#6b8275");
  block(
    ctx,
    r.x,
    r.y + (pressed ? 4 : 0),
    r.w,
    Math.max(3, r.h - (pressed ? 4 : 0)),
    pressed ? "#d5be72" : "#c6a1a2",
  );
  block(
    ctx,
    r.x + 3,
    r.y + (pressed ? 4 : 0),
    r.w - 6,
    3,
    pressed ? "#ead58c" : "#dfbfc0",
  );
  for (let i = 0; i <= index; i++)
    block(
      ctx,
      r.x + r.w / 2 - index * 4 + i * 8 - 2,
      r.y + (pressed ? 5 : 3),
      4,
      3,
      pressed ? "#95834b" : "#8e7176",
    );
}

function gate(ctx: CanvasRenderingContext2D, r: Rect, open: boolean) {
  block(ctx, r.x - 4, r.y - 5, r.w + 8, 7, "#799585");
  block(ctx, r.x - 4, r.y + r.h - 3, r.w + 8, 5, "#799585");
  if (open) {
    block(ctx, r.x, r.y + 2, r.w, 5, "#b7c9b2");
    block(ctx, r.x + r.w / 2 - 2, r.y - 4, 4, 3, "#e2c873");
    ctx.save();
    ctx.strokeStyle = "rgba(91, 124, 102, 0.15)";
    ctx.setLineDash([4, 7]);
    ctx.strokeRect(r.x + 0.5, r.y + 8.5, r.w - 1, r.h - 11);
    ctx.restore();
    return;
  }
  block(ctx, r.x, r.y + 2, r.w, r.h - 5, "rgba(132, 161, 139, 0.2)");
  for (let x = r.x + 3; x < r.x + r.w; x += 10) {
    block(ctx, x, r.y + 2, 4, r.h - 5, "#799585");
    block(ctx, x, r.y + 2, 1, r.h - 5, "#a8bea3");
  }
  block(ctx, r.x, r.y + r.h / 2 - 2, r.w, 5, "#799585");
}

function bridge(ctx: CanvasRenderingContext2D, r: Rect, active: boolean) {
  if (active) {
    for (let x = r.x; x < r.x + r.w; x += 20) {
      block(ctx, x, r.y, Math.min(18, r.x + r.w - x), r.h, "#af975e");
      block(ctx, x, r.y, Math.min(18, r.x + r.w - x), 4, "#d1ba7e");
      block(
        ctx,
        x + 3,
        r.y + r.h - 4,
        Math.min(12, r.x + r.w - x - 3),
        2,
        "#96834f",
      );
    }
    return;
  }
  ctx.save();
  ctx.strokeStyle = "#afbf9f";
  ctx.lineWidth = 2;
  ctx.setLineDash([7, 7]);
  ctx.strokeRect(r.x + 1, r.y + 1, r.w - 2, Math.max(2, r.h - 2));
  ctx.restore();
}

function hazard(ctx: CanvasRenderingContext2D, r: Rect, time: number) {
  block(ctx, r.x, r.y + r.h - 4, r.w, 4, "#c59d94");
  for (let x = r.x; x < r.x + r.w; x += 18) {
    const width = Math.min(18, r.x + r.w - x);
    ctx.fillStyle = "#bd8a82";
    ctx.beginPath();
    ctx.moveTo(x, r.y + r.h - 4);
    ctx.lineTo(x + width / 2, r.y);
    ctx.lineTo(x + width, r.y + r.h - 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#dfb7aa";
    ctx.beginPath();
    ctx.moveTo(x + 3, r.y + r.h - 5);
    ctx.lineTo(x + width / 2, r.y + 5);
    ctx.lineTo(x + width / 2, r.y + r.h - 5);
    ctx.closePath();
    ctx.fill();
  }
  if (r.w > 45 && Math.sin(time * 1.8) > 0)
    block(ctx, r.x + 7, r.y + 3, 2, 2, "#fff0dd");
}

function cat(
  ctx: CanvasRenderingContext2D,
  p: Player,
  selected: boolean,
  time: number,
) {
  const x = Math.round(p.x);
  const y = Math.round(p.y);
  const w = Math.round(p.w);
  const h = Math.round(p.h);
  const coral = p.id === 0;
  const base = coral ? "#e9a58d" : "#77b8ad";
  const shade = coral ? "#cb866f" : "#559a90";
  const light = coral ? "#f5bea7" : "#a2d0c4";
  const moving = Math.abs(p.vx) > 12;
  const stride = moving && p.grounded ? Math.sin(time * 19) : 0;
  const eyeShift = p.facing * 2;
  const blink = Math.sin(time * 1.7 + p.id * 2) > 0.993;

  if (p.grounded)
    block(ctx, x + 1, y + h - 2, w + 2, 5, "rgba(56, 81, 56, 0.13)");
  // Little squared-off ears and feet are part of each character's silhouette.
  block(ctx, x, y + 1, 9, 10, shade);
  block(ctx, x + w - 9, y + 1, 9, 10, shade);
  block(ctx, x + 1, y, 7, 10, base);
  block(ctx, x + w - 8, y, 7, 10, base);
  block(ctx, x + 3, y + 3, 3, 4, light);
  block(ctx, x + w - 6, y + 3, 3, 4, light);
  block(ctx, x - 1, y + 8, w + 2, h - 15, shade);
  block(ctx, x, y + 7, w, h - 15, base);
  block(ctx, x + 2, y + 7, w - 4, 3, light);
  block(ctx, x + 2, y + h - 9, w - 4, 4, shade);
  block(ctx, x + 3, y + h - 7, 8, 7 - Math.max(0, stride * 3), base);
  block(ctx, x + w - 11, y + h - 7, 8, 7 - Math.max(0, -stride * 3), base);
  block(ctx, x + 4, y + h - 2 - Math.max(0, stride * 3), 7, 2, shade);
  block(ctx, x + w - 11, y + h - 2 - Math.max(0, -stride * 3), 7, 2, shade);
  const eyeY = y + Math.round(h * 0.42);
  block(ctx, x + 7 + eyeShift, eyeY + (blink ? 2 : 0), 3, blink ? 1 : 5, INK);
  block(
    ctx,
    x + w - 10 + eyeShift,
    eyeY + (blink ? 2 : 0),
    3,
    blink ? 1 : 5,
    INK,
  );
  if (!blink) {
    block(ctx, x + 7 + eyeShift, eyeY, 1, 1, "#f7f8e8");
    block(ctx, x + w - 10 + eyeShift, eyeY, 1, 1, "#f7f8e8");
  }
  block(ctx, x + w / 2 - 1 + eyeShift, eyeY + 6, 2, 2, shade);
  block(ctx, x + 3, eyeY + 6, 4, 2, coral ? "#df967e" : "#67a89c");
  block(ctx, x + w - 7, eyeY + 6, 4, 2, coral ? "#df967e" : "#67a89c");

  const markerX = x + w / 2;
  block(ctx, markerX - 12, y - 22, 24, 14, "rgba(255, 255, 247, 0.87)");
  block(ctx, markerX - 2, y - 8, 4, 3, "rgba(255, 255, 247, 0.87)");
  ctx.font = "bold 9px monospace";
  ctx.textAlign = "center";
  ctx.fillStyle = coral ? "#a56651" : "#387b6e";
  ctx.fillText(`P${p.id + 1}`, Math.round(markerX), y - 12);
  if (selected) {
    const arrowY = y - 31 + Math.round(Math.sin(time * 4) * 2);
    block(ctx, markerX - 5, arrowY - 3, 10, 3, INK);
    block(ctx, markerX - 3, arrowY, 6, 2, INK);
    block(ctx, markerX - 1, arrowY + 2, 2, 2, INK);
  }
}

/** Render the complete scene without changing simulation state. */
export function renderGame(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  options: RenderOptions,
): void {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const time = options.reducedMotion ? 0 : state.time;
  const level = state.level;
  background(ctx, state.levelIndex, time);
  level.platforms.forEach((r, i) => platform(ctx, r, i));
  level.bridges.forEach((r) => bridge(ctx, r, Boolean(state.plates[r.plate])));
  level.hazards.forEach((r) => hazard(ctx, r, time));
  door(ctx, level.exit, state.hasKey, time);
  level.plates.forEach((r, i) =>
    pressurePlate(ctx, r, Boolean(state.plates[i]), i),
  );
  level.gates.forEach((r, i) => gate(ctx, r, Boolean(state.gateOpen[i])));
  level.stars.forEach((r, i) => {
    if (!state.stars[i]) collectible(ctx, r, time, i);
  });
  if (!state.hasKey) key(ctx, level.key, time);
  // Drawing the higher character last keeps a stacked pair's faces visible.
  [...state.players]
    .sort((a, b) => b.y - a.y)
    .forEach((p) => cat(ctx, p, options.activePlayer === p.id, time));
  ctx.restore();
}
