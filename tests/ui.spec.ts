import { expect, test, type Page } from "@playwright/test";

const stage = (page: Page) => page.locator("#game-stage");
const position = async (page: Page, player: number, axis = "x") =>
  Number(await stage(page).getAttribute(`data-player${player}-${axis}`));

async function play(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Let’s play" }).click();
  await expect(stage(page)).toHaveAttribute("data-status", "playing");
}

async function moveTo(
  page: Page,
  player: number,
  key: string,
  target: number,
): Promise<void> {
  const movingRight = key === "d" || key === "ArrowRight";
  await page.keyboard.down(key);
  try {
    await expect
      .poll(() => position(page, player), {
        timeout: 8_000,
        intervals: [20, 30, 40],
      })
      [movingRight ? "toBeGreaterThanOrEqual" : "toBeLessThanOrEqual"](target);
  } finally {
    await page.keyboard.up(key);
  }
  // The visible position readout refreshes at 80 ms; let it reflect key release.
  await page.waitForTimeout(100);
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Better, together." }),
  ).toBeVisible();
});

test("keyboard movement, pause, resume, and restart affect the actual game", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1050 });
  await expect(
    page.getByLabel("Pocket Pals game", { exact: true }),
  ).toBeVisible();
  await expect(stage(page)).toHaveAttribute("data-status", "ready");
  await page.screenshot({
    path: "test-results/pocket-pals-desktop.png",
    fullPage: true,
  });
  const startingX = await position(page, 0);
  await play(page);
  await moveTo(page, 0, "d", startingX + 14);
  await page.getByRole("button", { name: "Pause game", exact: true }).click();
  await expect(stage(page)).toHaveAttribute("data-status", "paused");
  const pausedX = await position(page, 0);
  await page.keyboard.down("d");
  await page.waitForTimeout(250);
  await page.keyboard.up("d");
  expect(await position(page, 0)).toBe(pausedX);
  await page.getByRole("button", { name: "Keep going" }).click();
  await expect(stage(page)).toHaveAttribute("data-status", "playing");
  await page
    .getByRole("button", { name: "Restart level", exact: true })
    .click();
  await expect(stage(page)).toHaveAttribute("data-status", "playing");
  await expect.poll(() => position(page, 0)).toBe(startingX);
  await expect(page.locator("#timer")).toHaveText("00:00");
  await page.keyboard.press("Escape");
  await expect(stage(page)).toHaveAttribute("data-status", "paused");
  await page.keyboard.press("Escape");
  await expect(stage(page)).toHaveAttribute("data-status", "playing");
});

test("solo mode switches the controlled pal and saves the selected mode", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Solo practice", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Solo practice", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#solo-instructions")).toBeVisible();
  await play(page);
  await moveTo(page, 0, "ArrowRight", 109);
  await page.keyboard.press("q");
  const waitingX = await position(page, 0);
  const secondStartingX = await position(page, 1);
  await moveTo(page, 1, "d", secondStartingX + 30);
  expect(await position(page, 0)).toBe(waitingX);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Solo practice", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Local co-op", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Local co-op", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#solo-instructions")).toBeHidden();
});

test("every meadow level can be selected and has its own hint", async ({
  page,
}) => {
  const names = [
    "A little lift",
    "Hold the line",
    "A bridge between us",
    "Higher together",
    "Mind the gap",
    "The last little mile",
  ];
  for (const name of names) {
    const button = page
      .getByRole("navigation", { name: "Levels", exact: true })
      .getByRole("button", { name: new RegExp(name) });
    await button.click();
    await expect(button).toHaveAttribute("aria-current", "step");
    await expect(page.locator("#level-title")).toHaveText(name);
    await expect(stage(page)).toHaveAttribute("data-status", "ready");
    await page.getByRole("button", { name: "A little stuck?" }).click();
    await expect(page.locator("#game-toast")).toBeVisible();
    await expect(page.locator("#game-toast")).not.toHaveText("");
  }
});

test("help pauses play and Escape returns to the game", async ({ page }) => {
  await play(page);
  await page.getByRole("button", { name: "How to play", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(stage(page)).toHaveAttribute("data-status", "paused");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(stage(page)).toHaveAttribute("data-status", "playing");
  await expect(stage(page)).toBeFocused();
});

test("sound preference persists across a fresh page load", async ({ page }) => {
  await page.getByRole("button", { name: "Sound on", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Sound off", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Sound off", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sound off", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Sound on", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("two keyboard players can stack, collect a key, finish, and advance", async ({
  page,
}) => {
  test.setTimeout(30_000);
  await play(page);
  await moveTo(page, 1, "ArrowRight", 355);
  await moveTo(page, 0, "d", 301);
  await page.keyboard.down("w");
  await moveTo(page, 0, "d", 355);
  await page.keyboard.up("w");
  await expect
    .poll(() => position(page, 0, "y"), { intervals: [30, 50] })
    .toBe(424);
  await page.keyboard.down("w");
  await moveTo(page, 0, "d", 485);
  await page.keyboard.up("w");
  await expect(page.locator("#objective")).toContainText("Key collected!");
  await moveTo(page, 0, "d", 898);
  await page.keyboard.down("ArrowRight");
  try {
    await expect(stage(page)).toHaveAttribute("data-status", "won", {
      timeout: 8_000,
    });
  } finally {
    await page.keyboard.up("ArrowRight");
  }
  await expect(
    page.getByRole("heading", { name: "Better together. Proven." }),
  ).toBeVisible();
  await expect(page.locator("#progress-count")).toHaveText("1 / 6");
  await page.getByRole("button", { name: "Next level", exact: true }).click();
  await expect(page.locator("#level-title")).toHaveText("Hold the line");
  await expect(stage(page)).toHaveAttribute("data-status", "ready");
  await page.reload();
  await expect(page.locator("#progress-count")).toHaveText("1 / 6");
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test("fits the viewport and touch controls move either pal", async ({
    page,
  }) => {
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    const arenaBounds = (await page.locator("#arena").boundingBox())!;
    for (const surface of [
      stage(page),
      page.getByLabel("Pocket Pals game", { exact: true }),
    ]) {
      const bounds = (await surface.boundingBox())!;
      expect(bounds.x).toBeGreaterThanOrEqual(arenaBounds.x - 1);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(
        arenaBounds.x + arenaBounds.width + 1,
      );
    }
    await expect(
      page.getByRole("button", { name: "Move left", exact: true }),
    ).toBeVisible();
    await play(page);
    const right = page.getByRole("button", { name: "Move right", exact: true });
    await right.scrollIntoViewIfNeeded();
    const box = (await right.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await expect.poll(() => position(page, 0)).toBeGreaterThan(108);
    await page.mouse.up();
    await page
      .getByRole("button", {
        name: "Switch player. Currently player 1",
        exact: true,
      })
      .click();
    await expect(
      page.getByRole("button", {
        name: "Switch player. Currently player 2",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Solo practice", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await right.scrollIntoViewIfNeeded();
    const secondBox = (await right.boundingBox())!;
    await page.mouse.move(
      secondBox.x + secondBox.width / 2,
      secondBox.y + secondBox.height / 2,
    );
    await page.mouse.down();
    await expect.poll(() => position(page, 1)).toBeGreaterThan(177);
    await page.mouse.up();
    await page.screenshot({
      path: "test-results/pocket-pals-mobile.png",
      fullPage: true,
    });
  });
});
