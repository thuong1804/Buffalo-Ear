const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1100 },
    });
    await page.addInitScript(() => {
      window.lastSpoken = "";
      window.SpeechSynthesisUtterance = class {
        constructor(text) {
          this.text = text;
        }
      };
      Object.defineProperty(window, "speechSynthesis", {
        value: {
          cancel() {},
          getVoices() {
            return [{ lang: "en-GB" }];
          },
          addEventListener() {},
          removeEventListener() {},
          speak(utterance) {
            window.lastSpoken = utterance.text;
            utterance.onstart?.();
            utterance.onend?.();
          },
        },
      });
    });
    await page.goto(process.env.APP_URL || "http://127.0.0.1:5174/");
    await page.getByLabel("Bạn nghe được từ gì?").waitFor();
    const expectColor = async (selector, property, color) => {
      await page.waitForFunction(
        ({ selector, property, color }) =>
          getComputedStyle(document.querySelector(selector))[property] ===
          color,
        { selector, property, color },
      );
    };
    await page.getByRole("button", { name: "Cấp độ A1", exact: true }).click();
    await expectColor(
      "[data-testid=level-option][aria-pressed=true]",
      "backgroundColor",
      "rgb(128, 191, 176)",
    );
    await page
      .getByRole("button", { name: "Chọn âm /æ/", exact: true })
      .click();
    await expectColor(
      "[data-testid=sound][aria-pressed=true]",
      "backgroundColor",
      "rgb(128, 191, 176)",
    );
    await page
      .getByRole("button", { name: "Hiện đáp án", exact: true })
      .click();
    const word = await page.locator("[data-testid=secret-word]").innerText();
    await page.getByLabel("Bạn nghe được từ gì?").fill(word);
    await page.getByLabel("Bạn nghe được từ gì?").press("Enter");
    await page
      .getByText("Bạn đã xem đáp án. Thử tự nghe ở từ tiếp theo nhé.", {
        exact: true,
      })
      .waitFor();
    await expectColor("#answer", "borderTopColor", "rgb(161, 61, 61)");
    await expectColor("#answer-feedback", "color", "rgb(161, 61, 61)");
    await page.waitForFunction(() => {
      const e = document.querySelector("[data-testid=goal-track]");
      return (
        Math.abs(
          e.firstElementChild.getBoundingClientRect().width /
            e.getBoundingClientRect().width -
            0.05,
        ) < 0.005
      );
    });
    const goal = await page
      .locator("[data-testid=goal-track]")
      .evaluate((e) => ({
        track: e.getBoundingClientRect().width,
        fill: e.firstElementChild.getBoundingClientRect().width,
      }));
    assert.ok(
      Math.abs(goal.fill / goal.track - 0.05) < 0.005,
      JSON.stringify(goal),
    );
    const toggle = page.getByRole("checkbox", { name: "Tự động đọc" });
    await toggle.uncheck();
    await expectColor(
      "[data-testid=switch]",
      "backgroundColor",
      "rgb(71, 106, 100)",
    );
    await toggle.check();
    await expectColor(
      "[data-testid=switch]",
      "backgroundColor",
      "rgb(36, 117, 104)",
    );
    await page
      .getByRole("button", { name: "Từ tiếp theo", exact: true })
      .click();
    await page.waitForFunction(() => Boolean(window.lastSpoken));
    const nextWord = await page.evaluate(() => window.lastSpoken);
    await page.getByLabel("Bạn nghe được từ gì?").fill(nextWord);
    await page.getByLabel("Bạn nghe được từ gì?").press("Enter");
    await page
      .getByText("Chính xác! Nhấn Enter lần nữa để sang từ tiếp theo.", {
        exact: false,
      })
      .waitFor();
    await expectColor("#answer", "borderTopColor", "rgb(40, 110, 83)");
    await expectColor("#answer-feedback", "color", "rgb(40, 110, 83)");
    await page.getByRole("button", { name: "Tiến độ", exact: true }).click();
    await page.waitForFunction(() => {
      const tracks = document.querySelectorAll("[data-testid=bar-track]");
      const today = tracks[tracks.length - 1];
      return (
        today &&
        Math.abs(today.firstElementChild.getBoundingClientRect().height - 15) <
          1
      );
    });
    const last = await page
      .locator("[data-testid=bar-track]")
      .last()
      .evaluate((e) => e.firstElementChild.getBoundingClientRect().height);
    assert.ok(
      Math.abs(last - 15) < 1,
      `Expected a 15px bar for two attempts, got ${last}`,
    );
    console.log(
      "PASS: Tailwind selection, correct/error border and feedback, checkbox peer state, goal width and chart height.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
