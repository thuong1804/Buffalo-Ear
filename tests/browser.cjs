const { createRequire } = require("node:module");
const { chromium } = createRequire(__filename)(
  process.env.PLAYWRIGHT_PACKAGE || "playwright",
);
const assert = require("node:assert/strict");
const fs = require("node:fs");

(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : {}),
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1100 },
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    // Deterministic voice adapter checks which hidden word is sent to speech,
    // without depending on voices or audio hardware in headless Chromium.
    await page.addInitScript(() => {
      window.spoken = [];
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
            window.spoken.push(utterance.text);
            utterance.onstart?.();
            utterance.onend?.();
          },
        },
      });
    });
    await page.goto(process.env.APP_URL || "http://127.0.0.1:5174");
    await page.waitForLoadState("networkidle");
    assert.equal(await page.locator(".sound").count(), 44);
    assert.equal(await page.locator(".secret-word").innerText(), "••••••");
    await page
      .getByRole("button", { name: "Nghe từ vựng", exact: true })
      .click();
    const word = await page.evaluate(() => window.spoken.at(-1));
    assert.ok(word);
    await page
      .getByLabel("Bạn nghe được từ gì?")
      .fill(` ${word.toUpperCase()} `);
    await page.getByLabel("Bạn nghe được từ gì?").press("Enter");
    assert.match(
      await page.locator("#answer-feedback").innerText(),
      /Chính xác/,
    );
    await page.getByLabel("Bạn nghe được từ gì?").press("Enter");
    assert.equal(
      await page.locator(".session-stats strong").first().innerText(),
      "1",
    );
    await page
      .getByRole("button", { name: "Từ tiếp theo", exact: true })
      .click();
    assert.notEqual(await page.evaluate(() => window.spoken.at(-1)), word);
    await page.getByLabel("Bạn nghe được từ gì?").fill("incorrect");
    await page.getByLabel("Bạn nghe được từ gì?").press("Enter");
    assert.match(
      await page.locator("#answer-feedback").innerText(),
      /Chưa đúng/,
    );
    await page
      .getByRole("button", { name: "Từ tiếp theo", exact: true })
      .click();
    const revealed = await page.evaluate(() => window.spoken.at(-1));
    await page
      .getByRole("button", { name: "Hiện đáp án", exact: true })
      .click();
    await page.getByLabel("Bạn nghe được từ gì?").fill(revealed);
    await page.getByLabel("Bạn nghe được từ gì?").press("Enter");
    assert.match(
      await page.locator("#answer-feedback").innerText(),
      /đã xem đáp án/,
    );
    assert.equal(
      await page.locator(".session-stats strong").nth(1).innerText(),
      "1",
    );
    await page
      .getByRole("button", { name: "Chọn âm /iː/", exact: true })
      .click();
    assert.equal(
      await page
        .getByRole("button", { name: "Chọn âm /iː/", exact: true })
        .getAttribute("aria-pressed"),
      "true",
    );
    await page
      .getByRole("button", { name: "Chọn âm /uː/", exact: true })
      .click();
    await page.getByLabel("Từ chứa").selectOption("all");
    assert.match(await page.locator(".empty-state").innerText(), /Chưa có từ/);
    await page.getByRole("button", { name: "Bỏ chọn", exact: true }).click();
    await page.getByLabel("Từ chứa").selectOption("any");
    await page.getByRole("button", { name: "Phụ âm", exact: true }).click();
    assert.equal(await page.locator(".sound").count(), 24);
    await page
      .getByRole("button", { name: "Tất cả", exact: false })
      .first()
      .click();
    await page.getByRole("button", { name: "Thư viện", exact: true }).click();
    await page
      .getByRole("textbox", { name: "Tìm từ hoặc nghĩa tiếng Việt" })
      .fill("cheese");
    assert.equal(await page.locator(".word-card").count(), 1);
    await page
      .getByRole("button", { name: "Luyện từ cheese", exact: true })
      .click();
    assert.equal(await page.evaluate(() => window.spoken.at(-1)), "cheese");
    assert.equal(await page.locator(".secret-word").innerText(), "••••••");
    await page.getByLabel("Tốc độ").selectOption("0.7");
    await page.reload();
    await page.waitForLoadState("networkidle");
    assert.equal(await page.getByLabel("Tốc độ").inputValue(), "0.7");
    await page.getByRole("button", { name: "Tiến độ", exact: true }).click();
    assert.equal(await page.locator(".history-list li").count(), 3);
    await page
      .getByRole("button", { name: "Ôn 2 từ cần luyện lại", exact: true })
      .click();
    assert.match(await page.locator(".live-badge").innerText(), /ÔN TẬP/);
    await page
      .getByRole("button", { name: "Quay lại toàn bộ từ", exact: true })
      .click();
    await page.getByRole("button", { name: "Tiến độ", exact: true }).click();
    await page
      .getByRole("button", { name: "Xóa tiến độ", exact: true })
      .click();
    await page.getByRole("button", { name: "Hủy", exact: true }).click();
    assert.equal(await page.locator(".history-list li").count(), 3);
    await page.getByRole("button", { name: "Luyện nghe", exact: true }).click();
    fs.mkdirSync("test-results", { recursive: true });
    await page.screenshot({ path: "test-results/desktop.png", fullPage: true });
    for (const width of [375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const view of ["Luyện nghe", "Thư viện", "Tiến độ"]) {
        await page.getByRole("button", { name: view, exact: true }).click();
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
          `Overflow at ${width}: ${view}`,
        );
      }
    }
    await page.setViewportSize({ width: 375, height: 900 });
    await page.getByRole("button", { name: "Luyện nghe", exact: true }).click();
    await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
    assert.deepEqual(errors, []);
    console.log(
      "PASS: grading with Enter, duplicate submit, reveal scoring, random next, speech adapter, IPA filters, empty state, library, review, persistence, navigation, 4 responsive widths.",
    );
    console.log(
      "Screenshots: test-results/desktop.png, test-results/mobile.png",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
