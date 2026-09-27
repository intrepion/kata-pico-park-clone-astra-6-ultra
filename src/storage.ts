export type RecordScore = { seconds: number; stars: number };
export type Progress = {
  scores: Record<string, RecordScore>;
  muted: boolean;
  mode: "coop" | "solo";
};
const KEY = "pocket-pals:v1";
export function readProgress(): Progress {
  const fallback: Progress = { scores: {}, muted: false, mode: "coop" };
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!raw || typeof raw !== "object") return fallback;
    const parsed = raw as Partial<Progress>;
    const scores: Progress["scores"] = {};
    if (parsed.scores && typeof parsed.scores === "object") {
      for (const [level, score] of Object.entries(parsed.scores)) {
        if (
          /^[0-5]$/.test(level) &&
          score &&
          Number.isFinite(score.seconds) &&
          score.seconds >= 0 &&
          Number.isInteger(score.stars) &&
          score.stars >= 0 &&
          score.stars <= 3
        )
          scores[level] = score;
      }
    }
    return {
      scores,
      muted: parsed.muted === true,
      mode: parsed.mode === "solo" ? "solo" : "coop",
    };
  } catch {
    return fallback;
  }
}
export function saveProgress(progress: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress));
  } catch {
    /* Play remains available when browser storage is disabled. */
  }
}
