import "./style.css";
import {
  createGame,
  startGame,
  stepGame,
  pauseGame,
  resumeGame,
  WIDTH,
  HEIGHT,
  type Controls,
} from "./game";
import { LEVELS } from "./levels";
import { renderGame } from "./render";
import { icon, cat } from "./icons";
import { readProgress, saveProgress } from "./storage";
import { GameAudio } from "./audio";

const progress = readProgress();
let state = createGame(0);
let activePlayer = 0;
let wonRecorded = false;
let lastOverlay = "";
let hintUntil = 0;
let announcement = "";
let helpWasPlaying = false;
const keys = new Set<string>();
const touch = new Set<string>();
const sound = new GameAudio();
sound.muted = progress.muted;
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const app = document.querySelector<HTMLDivElement>("#app")!;

app.innerHTML = `
  <header class="site-header">
    <a class="brand" href="./" aria-label="Pocket Pals home"><span class="brand-icon">${cat("#263e35")}</span><span>pocket<span class="brand-light">pals</span><span class="brand-period">.</span></span></a>
    <span class="header-note">A little teamwork goes a long way.</span>
    <button class="help-button" id="help-button">${icon("help")}<span>How to play</span></button>
  </header>
  <main class="page">
    <section class="intro" aria-labelledby="page-title">
      <div><div class="eyebrow"><span></span> SMALL GAME. BIG FRIENDSHIP.</div><h1 id="page-title">Better, <span>together.</span></h1><p>Two little pals. One big adventure. No friend left behind.</p></div>
      <div class="intro-sticker"><span class="sticker-cats">${cat("#ef997f")}${cat("#7abbb0")}</span><span>Made for your<br><strong>favorite teammate.</strong></span><span class="sticker-spark">✳</span></div>
    </section>
    <div class="game-layout">
      <aside class="world-panel" aria-label="Choose a level">
        <div class="world-heading"><span class="world-icon">${icon("leaf")}</span><span><span class="eyebrow">WORLD 01</span><h2>The Meadow</h2></span><span class="world-count">6 levels</span></div>
        <div class="progress-row"><span>Your little adventure</span><span id="progress-count">0 / 6</span></div><div class="progress-track"><span id="progress-fill"></span></div>
        <nav id="level-list" class="level-list" aria-label="Levels"></nav>
        <div class="world-bottom"><span class="tiny-spark">✳</span><p>Every great adventure<br>starts with a little hop.</p></div>
      </aside>
      <section class="play-column" aria-label="Game">
        <div class="arena" id="arena">
          <div class="arena-header"><div class="level-title"><span id="level-number">01</span><div><h2 id="level-title"></h2><span id="level-subtitle"></span></div></div><div class="game-tools"><span class="timer">${icon("clock")}<span id="timer">00:00</span></span><span class="tool-separator"></span><button class="icon-button" id="restart-button" aria-label="Restart level" title="Restart (R)">${icon("restart")}</button><button class="icon-button" id="pause-button" aria-label="Pause game" title="Pause (Esc)">${icon("pause")}</button><button class="icon-button" id="sound-button" title="Toggle sound"></button><button class="icon-button fullscreen-button" id="fullscreen-button" aria-label="Enter fullscreen" title="Fullscreen">${icon("expand")}</button></div></div>
          <div class="game-stage" id="game-stage" tabindex="0" aria-label="Game controls. Player one uses A, D, W. Player two uses arrow keys. Escape pauses.">
            <canvas id="game-canvas" width="1000" height="560" aria-label="Pocket Pals game">A cooperative platform game. Player one: A/D to move, W to jump. Player two: arrow keys. Collect the key and bring both pals to the door.</canvas>
            <div class="scene-label"><span class="live-dot"></span> A LITTLE HELP GOES A LONG WAY</div>
            <div class="game-overlay" id="game-overlay"></div>
            <div class="game-toast" id="game-toast" role="status"></div>
          </div>
          <div class="arena-footer"><div class="objective" id="objective">${icon("key")}<span>Find the key. Reach the door. <strong>Together.</strong></span></div><div class="star-counter" aria-label="Stars collected"><span id="star-count">0 / 3</span>${icon("star")}</div></div>
        </div>
        <div class="touch-controls" aria-label="Touch controls"><button class="touch-switch" id="touch-switch" aria-label="Switch player">${cat("#ef997f")}<span>P1</span>${icon("restart")}</button><div><button data-touch="left" aria-label="Move left">←</button><button data-touch="right" aria-label="Move right">→</button><button data-touch="jump" aria-label="Jump">↑ <span>JUMP</span></button></div></div>
        <div class="below-game"><div class="mode-switch" role="group" aria-label="Play mode"><button id="coop-mode">${icon("people")} Local co-op</button><button id="solo-mode">Solo practice</button></div><span class="mode-note" id="mode-note"><span class="live-dot"></span> 2 players · 1 keyboard · endless teamwork</span></div>
        <div class="controls-grid" id="controls-grid">
          <div class="control-card player-one"><span class="control-cat">${cat("#ef997f")}</span><div><div class="player-label">PLAYER 1 <span>Peach</span></div><div class="key-row"><kbd>A</kbd><kbd>D</kbd><span>move</span><kbd>W</kbd><span>jump</span></div></div></div>
          <div class="control-card player-two"><span class="control-cat">${cat("#7abbb0")}</span><div><div class="player-label">PLAYER 2 <span>Mint</span></div><div class="key-row"><kbd>←</kbd><kbd>→</kbd><span>move</span><kbd>↑</kbd><span>jump</span></div></div></div>
          <button class="tip-card" id="hint-button"><span class="tip-icon">${icon("spark")}</span><span><strong>A little stuck?</strong><span>Good pals help each other.</span></span>${icon("arrow")}</button>
        </div>
        <p class="solo-instructions" id="solo-instructions" hidden>Move with <kbd>A</kbd> <kbd>D</kbd> or <kbd>←</kbd> <kbd>→</kbd>. Jump with <kbd>W</kbd> or <kbd>↑</kbd>. Press <kbd>Q</kbd> to switch pals. Your other pal waits for you.</p>
      </section>
    </div>
    <footer class="page-footer"><span>Little paws. Big possibilities.</span><span>Built for the joy of figuring it out ${icon("heart")}</span><span>Take your time. Take your friend.</span></footer>
  </main>
  <dialog id="help-dialog" aria-labelledby="help-title"><button class="dialog-close icon-button" id="help-close" aria-label="Close how to play">${icon("close")}</button><span class="dialog-art">${cat("#ef997f")}${cat("#7abbb0")}</span><div class="eyebrow">A QUICK FIELD GUIDE</div><h2 id="help-title">A friend makes all the difference.</h2><p>Reach the exit with both pals. You’ll need one key, a little coordination, and the occasional piggyback.</p><div class="help-rules"><div>${icon("key")}<span><strong>One key, shared by everyone.</strong>Either pal can collect it. Then bring both pals to the door.</span></div><div>${icon("people")}<span><strong>Give your friend a boost.</strong>Jump on a pal’s head to reach high places. They can carry you, too.</span></div><div>${icon("spark")}<span><strong>Keep your weight on it.</strong>Stand on a switch to open a route. Gates stay open after a pal crosses. Bridges stay up while a pal stands on them.</span></div></div><div class="help-keyboard"><span><b>Peach</b><kbd>A</kbd><kbd>D</kbd> move <kbd>W</kbd> jump</span><span><b>Mint</b><kbd>←</kbd><kbd>→</kbd> move <kbd>↑</kbd> jump</span></div><p class="help-small">Solo? Choose Solo practice and press Q to switch pals. Touch controls move the selected pal. R restarts; Escape pauses. Stars are optional. Your best times and stars save on this device.</p><button class="primary-button" id="help-done">Got it, let’s go ${icon("arrow")}</button></dialog>
  <div class="sr-only" id="announcer" role="status" aria-live="polite"></div>
`;

function $<T extends HTMLElement = HTMLElement>(selector: string): T {
  return document.querySelector<T>(selector)!;
}
const canvas = $<HTMLCanvasElement>("#game-canvas");
const ctx = canvas.getContext("2d")!;
const stage = $("#game-stage");
const overlay = $("#game-overlay");
const dialog = $<HTMLDialogElement>("#help-dialog");

function formatTime(seconds: number): string {
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)
    .toString()
    .padStart(2, "0")}:${(whole % 60).toString().padStart(2, "0")}`;
}

function renderLevels(): void {
  $("#level-list").innerHTML = LEVELS.map(
    (level, index) =>
      `<button class="level-button ${index === state.levelIndex ? "selected" : ""} ${progress.scores[index] ? "completed" : ""}" data-level="${index}" aria-label="${String(index + 1).padStart(2, "0")} ${level.name}" aria-current="${index === state.levelIndex ? "step" : "false"}"><span class="level-index">${progress.scores[index] ? icon("check") : String(index + 1).padStart(2, "0")}</span><span class="level-text"><strong>${level.name}</strong><span>${progress.scores[index] ? `BEST ${formatTime(progress.scores[index].seconds)} · ${progress.scores[index].stars}/3 ★` : level.mechanic}</span></span><span class="level-indicator">${index === state.levelIndex ? icon("arrow") : '<span class="difficulty-dots">' + [1, 2, 3].map((n) => `<i class="${n <= level.difficulty ? "filled" : ""}"></i>`).join("") + "</span>"}</span></button>`,
  ).join("");
  const completed = Object.keys(progress.scores).length;
  $("#progress-count").textContent = `${completed} / ${LEVELS.length}`;
  $("#progress-fill").style.width = `${(completed / LEVELS.length) * 100}%`;
}

function refreshMode(): void {
  const solo = progress.mode === "solo";
  $("#coop-mode").classList.toggle("active", !solo);
  $("#solo-mode").classList.toggle("active", solo);
  $("#coop-mode").setAttribute("aria-pressed", String(!solo));
  $("#solo-mode").setAttribute("aria-pressed", String(solo));
  $("#mode-note").innerHTML = solo
    ? `<span class="live-dot"></span> One player, two pals · Q to switch`
    : `<span class="live-dot"></span> 2 players · 1 keyboard · endless teamwork`;
  $("#solo-instructions").hidden = !solo;
  $("#touch-switch").innerHTML =
    `${cat(activePlayer === 0 ? "#ef997f" : "#7abbb0")}<span>P${activePlayer + 1}</span>${icon("restart")}`;
  $("#touch-switch").setAttribute(
    "aria-label",
    `Switch player. Currently player ${activePlayer + 1}`,
  );
}

function refreshSound(): void {
  $("#sound-button").innerHTML = icon(progress.muted ? "mute" : "sound");
  $("#sound-button").setAttribute(
    "aria-label",
    progress.muted ? "Sound off" : "Sound on",
  );
  $("#sound-button").setAttribute("aria-pressed", String(!progress.muted));
}

function clearInput(): void {
  keys.clear();
  touch.clear();
}

function selectLevel(index: number, play = false): void {
  clearInput();
  state = createGame(index);
  wonRecorded = false;
  activePlayer = 0;
  lastOverlay = "";
  $("#level-title").textContent = state.level.name;
  $("#level-subtitle").textContent = state.level.subtitle;
  $("#level-number").textContent = String(index + 1).padStart(2, "0");
  $("#game-toast").classList.remove("visible");
  hintUntil = 0;
  renderLevels();
  refreshMode();
  if (play) begin();
  updateHUD();
}

function announce(message: string): void {
  if (message === announcement) return;
  announcement = message;
  $("#announcer").textContent = message;
}

function showToast(message: string, duration = 4500): void {
  $("#game-toast").textContent = message;
  $("#game-toast").classList.add("visible");
  hintUntil = performance.now() + duration;
  announce(message);
}

function begin(): void {
  sound.unlock();
  clearInput();
  startGame(state);
  stage.focus({ preventScroll: true });
  updateHUD();
}

function togglePause(): void {
  clearInput();
  if (state.status === "playing") pauseGame(state);
  else if (state.status === "paused") {
    resumeGame(state);
    stage.focus({ preventScroll: true });
  }
  updateHUD();
}

function updateHUD(): void {
  $("#timer").textContent = formatTime(state.elapsed);
  $("#star-count").textContent =
    `${state.stars.filter(Boolean).length} / ${state.level.stars.length}`;
  stage.dataset.status = state.status;
  state.players.forEach((player, index) => {
    stage.dataset[`player${index}X`] = player.x.toFixed(1);
    stage.dataset[`player${index}Y`] = player.y.toFixed(1);
  });
  $("#objective").innerHTML = state.hasKey
    ? `${icon("door")}<span>Key collected! <strong>Both pals to the door.</strong></span>`
    : `${icon("key")}<span>Find the key. Reach the door. <strong>Together.</strong></span>`;
  const pause = $<HTMLButtonElement>("#pause-button");
  pause.disabled = state.status === "ready" || state.status === "won";
  pause.setAttribute(
    "aria-label",
    state.status === "paused" ? "Resume game" : "Pause game",
  );
  pause.innerHTML = icon(state.status === "paused" ? "play" : "pause");
  if (state.status === "won" && !wonRecorded) {
    wonRecorded = true;
    const previous = progress.scores[state.levelIndex];
    progress.scores[state.levelIndex] = {
      seconds: Math.min(previous?.seconds ?? Infinity, state.elapsed),
      stars: Math.max(previous?.stars ?? 0, state.stars.filter(Boolean).length),
    };
    saveProgress(progress);
    renderLevels();
    announce(
      `Level complete! ${state.level.name}, ${formatTime(state.elapsed)}. Both pals made it.`,
    );
  }
  if (state.status === lastOverlay) return;
  lastOverlay = state.status;
  overlay.className = `game-overlay ${state.status === "playing" ? "hidden" : ""} overlay-${state.status}`;
  if (state.status === "ready") {
    overlay.innerHTML = `<div class="start-card"><div class="ready-icon">${icon("people")}</div><div class="start-copy"><strong>A little adventure for two.</strong><span>Grab a friend. Share a keyboard. Let’s go.</span></div><button class="primary-button" data-action="start">Let’s play ${icon("arrow")}</button></div>`;
  } else if (state.status === "paused") {
    overlay.innerHTML = `<div class="pause-card"><span class="eyebrow">TAKE A BREATHER</span><h3>Your pal will wait.</h3><p>The adventure resumes when you do.</p><button class="primary-button" data-action="resume">Keep going ${icon("play")}</button></div>`;
    announce("Game paused.");
  } else if (state.status === "won") {
    const last = state.levelIndex === LEVELS.length - 1;
    overlay.innerHTML = `<div class="win-card"><div class="win-stars">${[0, 1, 2].map((i) => icon("star", state.stars[i] ? "collected" : "")).join("")}</div><span class="eyebrow">${last ? "THE MEADOW, MASTERED" : "TEAMWORK LOOKS GOOD ON YOU"}</span><h3>${last ? "What a little adventure." : "Better together. Proven."}</h3><p>Both pals made it. ${formatTime(state.elapsed)} · ${state.deaths} ${state.deaths === 1 ? "retry" : "retries"}</p><div class="win-actions"><button class="secondary-button" data-action="replay">Play again</button><button class="primary-button" data-action="next">${last ? "Back to the meadow" : "Next level"} ${icon("arrow")}</button></div></div>`;
    overlay
      .querySelector<HTMLButtonElement>('[data-action="next"]')
      ?.focus({ preventScroll: true });
  } else overlay.innerHTML = "";
}

overlay.addEventListener("click", (event) => {
  const action = (event.target as HTMLElement).closest<HTMLButtonElement>(
    "[data-action]",
  )?.dataset.action;
  if (action === "start") begin();
  if (action === "resume") togglePause();
  if (action === "replay") selectLevel(state.levelIndex, true);
  if (action === "next") selectLevel((state.levelIndex + 1) % LEVELS.length);
});

$("#level-list").addEventListener("click", (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
    "[data-level]",
  );
  if (button) selectLevel(Number(button.dataset.level));
});
$("#restart-button").addEventListener("click", () =>
  selectLevel(state.levelIndex, state.status !== "ready"),
);
$("#pause-button").addEventListener("click", togglePause);
$("#sound-button").addEventListener("click", () => {
  progress.muted = !progress.muted;
  sound.muted = progress.muted;
  sound.unlock();
  if (!progress.muted) sound.play("star");
  saveProgress(progress);
  refreshSound();
});
$("#fullscreen-button").addEventListener("click", async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await $("#arena").requestFullscreen();
  } catch {
    showToast(
      "Fullscreen isn’t available in this browser. You can still play here.",
    );
  }
});
document.addEventListener("fullscreenchange", () => {
  $("#fullscreen-button").setAttribute(
    "aria-label",
    document.fullscreenElement ? "Exit fullscreen" : "Enter fullscreen",
  );
  resizeCanvas();
});

function setMode(mode: "coop" | "solo"): void {
  clearInput();
  progress.mode = mode;
  activePlayer = 0;
  refreshMode();
  saveProgress(progress);
  if (state.status === "playing")
    showToast(
      mode === "solo"
        ? "You’re Peach. Press Q to switch to Mint."
        : "Peach: A / D / W. Mint: arrow keys.",
    );
}
$("#coop-mode").addEventListener("click", () => setMode("coop"));
$("#solo-mode").addEventListener("click", () => setMode("solo"));
function switchPlayer(): void {
  activePlayer = 1 - activePlayer;
  clearInput();
  refreshMode();
  showToast(
    `You’re ${activePlayer === 0 ? "Peach" : "Mint"}. Your pal is waiting.`,
    1800,
  );
}
$("#touch-switch").addEventListener("click", () => {
  if (progress.mode !== "solo") setMode("solo");
  switchPlayer();
});
$("#hint-button").addEventListener("click", () =>
  showToast(state.level.hint, 8500),
);

function openHelp(): void {
  helpWasPlaying = state.status === "playing";
  if (helpWasPlaying) togglePause();
  clearInput();
  dialog.showModal();
}
function closeHelp(): void {
  dialog.close();
  if (helpWasPlaying && state.status === "paused") togglePause();
  helpWasPlaying = false;
}
$("#help-button").addEventListener("click", openHelp);
$("#help-close").addEventListener("click", closeHelp);
$("#help-done").addEventListener("click", closeHelp);
dialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeHelp();
});
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) {
    const rect = dialog.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    )
      closeHelp();
  }
});

const movementKeys = new Set([
  "KeyA",
  "KeyD",
  "KeyW",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "Space",
]);
window.addEventListener("keydown", (event) => {
  if (dialog.open || event.metaKey || event.ctrlKey || event.altKey) return;
  if (event.code === "Escape" || event.code === "KeyP") {
    if (state.status === "playing" || state.status === "paused") {
      event.preventDefault();
      if (!event.repeat) togglePause();
    }
    return;
  }
  if (event.code === "KeyR" && state.status !== "ready") {
    event.preventDefault();
    if (!event.repeat) selectLevel(state.levelIndex, true);
    return;
  }
  if (
    event.code === "KeyQ" &&
    progress.mode === "solo" &&
    state.status === "playing"
  ) {
    event.preventDefault();
    if (!event.repeat) switchPlayer();
    return;
  }
  if (state.status === "playing" && movementKeys.has(event.code)) {
    if (event.code === "Space" && event.target instanceof HTMLButtonElement)
      return;
    event.preventDefault();
    keys.add(event.code);
    sound.unlock();
  }
});
window.addEventListener("keyup", (event) => keys.delete(event.code));
function autoPause(): void {
  clearInput();
  if (state.status === "playing") {
    pauseGame(state);
    updateHUD();
  }
}
window.addEventListener("blur", autoPause);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) autoPause();
});

document
  .querySelectorAll<HTMLButtonElement>("[data-touch]")
  .forEach((button) => {
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      sound.unlock();
      button.setPointerCapture(event.pointerId);
      touch.add(button.dataset.touch!);
      button.classList.add("pressed");
    });
    const release = () => {
      touch.delete(button.dataset.touch!);
      button.classList.remove("pressed");
    };
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", release);
  });

function controls(): Controls {
  const first = {
    left: keys.has("KeyA"),
    right: keys.has("KeyD"),
    jump: keys.has("KeyW"),
  };
  const second = {
    left: keys.has("ArrowLeft"),
    right: keys.has("ArrowRight"),
    jump: keys.has("ArrowUp"),
  };
  const result =
    progress.mode === "solo"
      ? [
          { left: false, right: false, jump: false },
          { left: false, right: false, jump: false },
        ]
      : [first, second];
  if (progress.mode === "solo")
    result[activePlayer] = {
      left: first.left || second.left,
      right: first.right || second.right,
      jump: first.jump || second.jump || keys.has("Space"),
    };
  result[activePlayer].left ||= touch.has("left");
  result[activePlayer].right ||= touch.has("right");
  result[activePlayer].jump ||= touch.has("jump");
  return result;
}

function resizeCanvas(): void {
  const ratio = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(WIDTH * ratio);
  canvas.height = Math.round(HEIGHT * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.imageSmoothingEnabled = false;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();
refreshSound();
selectLevel(0);

let previousTime = performance.now();
let accumulator = 0;
let hudTime = 0;
function frame(now: number): void {
  const delta = Math.min((now - previousTime) / 1000, 0.08);
  previousTime = now;
  accumulator += delta;
  while (accumulator >= 1 / 120) {
    stepGame(state, controls(), 1 / 120);
    for (const event of state.events) {
      sound.play(event);
      if (event === "key")
        showToast("Found it! Now bring both pals to the door.", 3500);
      if (event === "death")
        showToast("Oops! No pal left behind. Try that again.", 2800);
    }
    state.events.length = 0;
    accumulator -= 1 / 120;
  }
  renderGame(ctx, state, {
    activePlayer: progress.mode === "solo" ? activePlayer : null,
    reducedMotion,
  });
  if (now - hudTime > 80 || state.status !== lastOverlay) {
    updateHUD();
    hudTime = now;
  }
  if (hintUntil && now >= hintUntil) {
    $("#game-toast").classList.remove("visible");
    hintUntil = 0;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
