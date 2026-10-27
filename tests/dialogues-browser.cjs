const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const lessons = require("../src/core/dialogue-data/A1.json");
const topics = require("../src/core/dialogue-data/catalog.json");
const base = process.env.APP_URL || "http://127.0.0.1:5175";
(async () => {
    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage({
            viewport: { width: 1440, height: 1000 },
        });
        const errors = [],
            chunks = new Set();
        page.on("pageerror", (error) => errors.push(error.message));
        page.on("console", (message) => {
            if (
                message.type() === "error" &&
                /hydration|hydrating|did not match/i.test(message.text())
            )
                errors.push(message.text());
        });
        page.on("request", (request) => {
            const match = request.url().match(/\/assets\/(A1|A2|B1|B2|C1|C2)-/);
            if (match) chunks.add(match[1]);
        });
        await page.addInitScript(() => {
            window.spoken = [];
            window.cancelCount = 0;
            window.SpeechSynthesisUtterance = class {
                constructor(text) {
                    this.text = text;
                }
            };
            Object.defineProperty(window, "speechSynthesis", {
                value: {
                    cancel() {
                        window.cancelCount++;
                    },
                    getVoices() {
                        return [{ name: "British test", voiceURI: "british", lang: "en-GB" }];
                    },
                    addEventListener() {},
                    removeEventListener() {},
                    speak(utterance) {
                        window.spoken.push({ text: utterance.text, rate: utterance.rate });
                        utterance.onstart?.();
                    },
                },
            });
        });
        await page.goto(base);
        await page.getByRole("button", { name: "Hội thoại", exact: true }).click();
        await page.waitForURL("**/dialogues");
        await page.getByTestId("dialogue-lesson").waitFor();
        const answer = page.getByTestId("dialogue-answer"),
            choice = page.getByTestId("dialogue-lesson");
        assert.equal(await choice.locator("option").count(), 10);
        assert.equal(await page.getByTestId("dialogue-transcript").count(), 0);
        assert.equal(await page.evaluate(() => window.spoken.length), 0);
        assert.deepEqual([...chunks], ["A1"]);
        await answer.fill("draft for A1 cafe one");
        for (const level of ["A1", "A2", "B1", "B2", "C1", "C2"]) {
            await page.getByTestId("dialogue-level-" + level).click();
            await page.waitForFunction(
                (expected) =>
                    document
                        .querySelector("[data-testid=dialogue-lesson]")
                        ?.value.startsWith(expected + "-"),
                level,
            );
            for (const topic of topics) {
                await page.getByTestId("topic-" + topic.id).click();
                assert.equal(await choice.locator("option").count(), 10, level + " " + topic.id);
                assert.equal(await choice.inputValue(), level + "-" + topic.id + "-1");
                await choice.selectOption(level + "-" + topic.id + "-10");
                assert.equal(await choice.inputValue(), level + "-" + topic.id + "-10");
            }
        }
        assert.equal(chunks.size, 6);
        assert.equal(
            await page.evaluate(() => window.spoken.length),
            0,
            "all 60 topic filters and 120 lesson selections must stay silent",
        );
        await page.getByTestId("dialogue-level-A1").click();
        await page.waitForFunction(() =>
            document.querySelector("[data-testid=dialogue-lesson]")?.value.startsWith("A1-"),
        );
        await page.getByTestId("topic-cafe").click();
        assert.equal(await answer.inputValue(), "draft for A1 cafe one");
        await choice.selectOption("A1-cafe-2");
        await answer.fill("draft for lesson two");
        await choice.selectOption("A1-cafe-1");
        assert.equal(await answer.inputValue(), "draft for A1 cafe one");
        await page.getByTestId("dialogue-listen").click();
        const first = lessons.find((lesson) => lesson.id === "A1-cafe-1"),
            lines = first.lines.map((line) => line.text);
        assert.equal((await page.evaluate(() => window.spoken.at(-1))).text, lines[0]);
        await page.getByRole("button", { name: "Dừng đọc", exact: true }).click();
        await page.getByLabel("Tốc độ", { exact: true }).selectOption("0.7");
        await page.getByTestId("dialogue-listen").click();
        assert.equal((await page.evaluate(() => window.spoken.at(-1))).rate, 0.7);
        await answer.fill("");
        await page.getByRole("button", { name: "Kiểm tra", exact: true }).click();
        await page.getByText("Nhập câu trả lời trước khi kiểm tra.", { exact: true }).waitFor();
        await answer.fill(lines[0].replace(/\ba\s+/i, ""));
        await answer.press("Enter");
        await page.getByTestId("dialogue-result").getByText("Thiếu: a", { exact: true }).waitFor();
        await page.getByTestId("dialogue-transcript").waitFor();
        await answer.fill(lines[0].toUpperCase());
        await answer.press("Enter");
        await page
            .getByText("Chính xác! Bạn có thể sang câu tiếp theo.", { exact: true })
            .waitFor();
        await answer.dispatchEvent("keydown", { key: "Enter", repeat: true });
        assert.equal(await page.getByLabel("Chọn câu", { exact: true }).inputValue(), "0");
        const spoken = await page.evaluate(() => window.spoken.length);
        await answer.press("Enter");
        assert.equal(await page.getByLabel("Chọn câu", { exact: true }).inputValue(), "1");
        assert.equal(await page.evaluate(() => window.spoken.length), spoken);
        await page.getByTestId("dialogue-full-transcript").click();
        await page.getByTestId("dialogue-listen-all").click();
        assert.equal((await page.evaluate(() => window.spoken.at(-1))).text, lines.join(" "));
        await page.getByRole("button", { name: "Nghe và chép", exact: true }).click();
        for (let i = 0; i < lines.length; i++) {
            await page.getByLabel("Chọn câu", { exact: true }).selectOption(String(i));
            await answer.fill(lines[i]);
            await answer.press("Enter");
        }
        await page.getByTestId("dialogue-summary").getByText("100%", { exact: false }).waitFor();
        await page.getByTestId("language-switcher").click();
        await page.getByRole("button", { name: "Listen and type", exact: true }).waitFor();
        assert.equal(await answer.inputValue(), lines[3]);
        await page.getByRole("button", { name: "Start again", exact: true }).click();
        assert.equal(await answer.inputValue(), "");
        assert.equal(await page.getByTestId("dialogue-summary").count(), 0);
        await choice.selectOption("A1-cafe-2");
        assert.equal(
            await answer.inputValue(),
            "draft for lesson two",
            "reset clears only the selected lesson",
        );
        for (const locale of ["en", "vi"]) {
            if ((await page.locator("html").getAttribute("lang")) !== locale)
                await page.getByTestId("language-switcher").click();
            for (const width of [320, 375, 768, 1024, 1440]) {
                await page.setViewportSize({ width, height: 1000 });
                assert.equal(
                    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
                    true,
                    locale + " overflow " + width,
                );
                if (width === 375 || width === 1440)
                    await page.screenshot({
                        path: "test-results/dialogues-" + locale + "-" + width + ".png",
                        fullPage: true,
                    });
            }
        }
        await page.getByTestId("dialogue-level-C2").click();
        await page.waitForFunction(() =>
            document.querySelector("[data-testid=dialogue-lesson]")?.value.startsWith("C2-"),
        );
        assert.equal(
            await page.getByLabel("Tốc độ", { exact: true }).inputValue(),
            "0.7",
            "speed stays unchanged across levels",
        );
        await answer.fill("a".repeat(500));
        await answer.press("Enter");
        await page.setViewportSize({ width: 320, height: 1000 });
        assert.equal(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
            true,
            "long incorrect input must wrap",
        );
        await page.getByTestId("dialogue-full-transcript").click();
        for (const width of [320, 375, 768, 1440]) {
            await page.setViewportSize({ width, height: 1000 });
            assert.equal(
                await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
                true,
                "C2 transcript and IPA must wrap",
            );
        }
        await page.getByRole("button", { name: "Nghe và chép", exact: true }).click();
        await page.getByTestId("dialogue-listen").click();
        const cancelled = await page.evaluate(() => window.cancelCount);
        await page.getByRole("button", { name: "Thư viện", exact: true }).click();
        await page.waitForURL("**/library");
        assert.ok((await page.evaluate(() => window.cancelCount)) > cancelled);
        await page.goto(base + "/dialogues");
        await choice.waitFor();
        assert.deepEqual(errors, []);
        console.log(
            "PASS: six lazy-loaded levels × ten topics × ten lesson options, IDs/draft isolation, silent filters, speech/rate/stop, grading/IPA/Enter, full transcript/summary/reset, vi/en five widths, direct route and audio cleanup",
        );
    } finally {
        await browser.close();
    }
})().catch((error) => {
    console.error(error);
    process.exit(1);
});
