const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const base = process.env.APP_URL || "http://127.0.0.1:5175";

(async () => {
    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
        const errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        await page.addInitScript(() => {
            window.filterShifts = [];
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
                        return [];
                    },
                    addEventListener() {},
                    removeEventListener() {},
                    speak(utterance) {
                        window.spoken.push(utterance.text);
                    },
                },
            });
            new PerformanceObserver((list) =>
                window.filterShifts.push(...list.getEntries().map((entry) => entry.value)),
            ).observe({ type: "layout-shift", buffered: true });
        });
        await page.route("**/assets/C2-*.js", async (route) => {
            await new Promise((resolve) => setTimeout(resolve, 900));
            await route.continue();
        });
        await page.goto(base + "/dialogues");
        await page.getByTestId("dialogue-lesson").waitFor();
        await page.waitForLoadState("networkidle");
        await page.getByTestId("dialogue-answer").fill("keep my draft");
        await page.evaluate(() => {
            scrollTo(0, 180);
            window.filterShifts = [];
            window.originalWorkspace = document.querySelector("[data-testid=dialogue-workspace]");
            window.originalSidebar = document.querySelector(
                "[data-testid=topic-cafe]",
            ).parentElement;
            window.originalSidebar.scrollTop = 200;
        });
        const before = await page.evaluate(() => ({
            scrollY,
            height: document.documentElement.scrollHeight,
            sidebarScroll: window.originalSidebar.scrollTop,
        }));
        await page.getByTestId("dialogue-level-C2").click();
        const region = page.getByTestId("dialogue-content-region");
        await page.waitForFunction(
            () =>
                document
                    .querySelector("[data-testid=dialogue-content-region]")
                    ?.getAttribute("aria-busy") === "true",
        );
        assert.equal(await region.getAttribute("inert"), "");
        const during = await page.evaluate(() => ({
            scrollY,
            height: document.documentElement.scrollHeight,
            sameWorkspace:
                window.originalWorkspace ===
                document.querySelector("[data-testid=dialogue-workspace]"),
        }));
        assert.equal(during.scrollY, before.scrollY);
        assert.equal(during.height, before.height);
        assert.equal(during.sameWorkspace, true);
        await page.waitForFunction(() =>
            document.querySelector("[data-testid=dialogue-lesson]")?.value.startsWith("C2-"),
        );
        assert.equal(await page.evaluate(() => scrollY), before.scrollY);
        assert.equal(
            await page.evaluate(() => window.originalSidebar.scrollTop),
            before.sidebarScroll,
        );
        assert.equal(await page.evaluate(() => window.filterShifts.reduce((a, b) => a + b, 0)), 0);

        await page.route("**/assets/B1-*.js", async (route) => {
            await new Promise((resolve) => setTimeout(resolve, 500));
            await route.continue();
        });
        await page.getByTestId("dialogue-level-B1").click();
        await page.getByTestId("dialogue-level-B2").click();
        await page.waitForFunction(() =>
            document.querySelector("[data-testid=dialogue-lesson]")?.value.startsWith("B2-"),
        );
        await page.waitForTimeout(650);
        assert.ok((await page.getByTestId("dialogue-lesson").inputValue()).startsWith("B2-"));
        await page.getByTestId("topic-technology").click();
        await page.getByTestId("dialogue-lesson").selectOption("B2-technology-7");
        await page.getByTestId("dialogue-level-C2").click();
        await page.waitForFunction(
            () =>
                document.querySelector("[data-testid=dialogue-lesson]")?.value ===
                "C2-technology-7",
        );

        for (const locale of ["vi", "en"]) {
            if ((await page.locator("html").getAttribute("lang")) !== locale) {
                await page.getByTestId("language-switcher").click();
            }
            for (const width of [320, 375, 768, 1440]) {
                await page.setViewportSize({ width, height: 900 });
                const lessonSuffix = (await page.getByTestId("dialogue-lesson").inputValue())
                    .split("-")
                    .slice(1)
                    .join("-");
                const inputPosition = async () =>
                    page
                        .getByTestId("dialogue-answer")
                        .evaluate((element) => element.getBoundingClientRect().top + scrollY);
                const initialPosition = await inputPosition();
                for (const level of ["A1", "A2", "B1", "B2", "C1", "C2"]) {
                    await page.getByTestId("dialogue-level-" + level).click();
                    await page.waitForFunction(
                        (expected) =>
                            document.querySelector("[data-testid=dialogue-lesson]")?.value ===
                            expected,
                        level + "-" + lessonSuffix,
                    );
                    assert.ok(
                        Math.abs((await inputPosition()) - initialPosition) < 2,
                        locale + " " + width + " " + level,
                    );
                }
                for (const topic of ["cafe", "environment", "technology"]) {
                    if (width < 640) {
                        await page
                            .getByRole("combobox", {
                                name: locale === "vi" ? "Chủ đề hội thoại" : "Conversation topics",
                                exact: true,
                            })
                            .selectOption(topic);
                    } else {
                        await page.getByTestId("topic-" + topic).click();
                    }
                    assert.ok(
                        Math.abs((await inputPosition()) - initialPosition) < 2,
                        locale + " topic " + width + " " + topic,
                    );
                }
            }
        }
        await page.getByTestId("dialogue-level-A1").click();
        await page.waitForFunction(() =>
            document.querySelector("[data-testid=dialogue-lesson]")?.value.startsWith("A1-"),
        );
        await page.getByTestId("topic-cafe").click();
        assert.equal(await page.getByTestId("dialogue-answer").inputValue(), "keep my draft");
        assert.equal(await page.evaluate(() => window.spoken.length), 0);
        assert.deepEqual(errors, []);
        console.log(
            "PASS: 900ms cold load preserves DOM/scroll/sidebar with zero measured layout shift; rapid requests keep the latest level; topic/lesson/draft preserved; stable input position across six levels and topics, vi/en and 320–1440px",
        );
    } finally {
        await browser.close();
    }
})().catch((error) => {
    console.error(error);
    process.exit(1);
});
