const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const viTenses = require("../src/i18n/locales/vi/tenses.json");
const base = process.env.APP_URL || "http://127.0.0.1:5175";

(async () => {
    const browser = await chromium.launch({ headless: true });
    try {
        const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
        const page = await context.newPage();
        const errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        page.on("console", (message) => {
            if (message.type() === "error" && /hydrat|did not match/i.test(message.text()))
                errors.push(message.text());
        });
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
                        return [];
                    },
                    addEventListener() {},
                    removeEventListener() {},
                    speak(utterance) {
                        window.spoken.push(utterance.text);
                    },
                },
            });
        });
        for (const locale of ["vi", "en"]) {
            const response = await context.request.get(base + "/tenses", {
                headers: { cookie: `buffalo-ear-locale=${locale}` },
            });
            assert.ok(response.ok());
            const html = await response.text();
            assert.ok(html.includes(`<html lang="${locale}"`));
            assert.ok(
                html.includes(
                    locale === "vi" ? "Nắm chắc các thì tiếng Anh" : "Make sense of English tenses",
                ),
            );
        }
        await page.goto(base);
        await page.getByTestId("learning-content").locator("[data-testid=listen-button]").waitFor();
        await page.getByRole("button", { name: viTenses.nav, exact: true }).click();
        await page.getByTestId("tenses-page").waitFor();
        assert.equal(new URL(page.url()).pathname, "/tenses");
        assert.equal(await page.getByTestId("tense-card").count(), 12);
        assert.equal(await page.locator('[aria-current="page"]').innerText(), viTenses.nav);

        const guide = page.getByTestId("verb-guide");
        const verbs = page.getByTestId("irregular-verbs");
        assert.equal(await guide.getAttribute("open"), null);
        assert.equal(await verbs.getAttribute("open"), null);
        await guide.locator("summary").focus();
        await guide.locator("summary").press("Enter");
        assert.equal(await guide.getAttribute("open"), "");
        assert.ok(
            (await page.getByTestId("verb-guide-content").innerText()).includes(
                "I know the answer.",
            ),
        );
        assert.ok(
            (await page.getByTestId("verb-guide-content").innerText()).includes("I am working."),
        );
        await verbs.locator("summary").click();
        const search = page.getByRole("searchbox");
        const rows = page.getByTestId("irregular-row");
        const totalVerbs = await rows.count();
        assert.ok(totalVerbs >= 90);
        const scrollRegion = page.getByTestId("irregular-scroll");
        const tableHeight = (await scrollRegion.boundingBox()).height;
        await search.fill(" WENT ");
        assert.equal(await rows.count(), 1);
        assert.match(await rows.first().innerText(), /go\s+went\s+gone/);
        await search.fill("ĐỌC");
        assert.equal(await rows.count(), 1);
        assert.match(await rows.first().innerText(), /read\s+read\s+read/);
        assert.ok((await rows.first().innerText()).includes("/red/"));
        await search.fill("tro thanh");
        assert.ok((await rows.allTextContents()).some((value) => value.includes("become")));
        await search.fill("khongcotu123");
        assert.equal(await rows.count(), 0);
        assert.ok((await scrollRegion.innerText()).includes("Không tìm thấy"));
        assert.match(
            await page.getByTestId("irregular-count").innerText(),
            new RegExp(`0 / ${totalVerbs}`),
        );
        assert.equal(
            (await scrollRegion.boundingBox()).height,
            tableHeight,
            "search keeps table height stable",
        );
        await page.getByRole("button", { name: "Xóa tìm kiếm", exact: true }).click();
        assert.equal(await search.evaluate((node) => node === document.activeElement), true);
        assert.equal(await rows.count(), totalVerbs);
        await scrollRegion.focus();
        await scrollRegion.press("End");
        await page.waitForFunction(
            () => document.querySelector('[data-testid="irregular-scroll"]').scrollTop > 0,
        );
        await search.fill("written");
        assert.equal(await scrollRegion.evaluate((node) => node.scrollTop), 0);
        await page.getByTestId("language-switcher").click();
        await page.getByRole("heading", { name: "Be or another main verb?" }).waitFor();
        assert.equal(await search.inputValue(), "written");
        assert.equal(await guide.getAttribute("open"), "");
        assert.equal(await verbs.getAttribute("open"), "");
        assert.equal(await rows.count(), 1);
        assert.equal(await rows.locator('td[lang="en"]').last().innerText(), "write");
        assert.equal(await page.locator('[aria-current="page"]').innerText(), "Tenses");
        await page.getByRole("button", { name: "Clear search", exact: true }).click();
        for (const width of [320, 375, 768, 1440]) {
            await page.setViewportSize({ width, height: 900 });
            assert.equal(
                await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
                false,
                `open grammar tools at ${width}`,
            );
            const regionBounds = await scrollRegion.boundingBox();
            assert.ok(regionBounds.x >= 0 && regionBounds.x + regionBounds.width <= width);
            if (width < 560)
                assert.equal(
                    await scrollRegion.evaluate((node) => node.scrollWidth > node.clientWidth),
                    true,
                );
            await scrollRegion.scrollIntoViewIfNeeded();
            await page.screenshot({ path: `test-results/grammar-tools-${width}.png` });
        }
        await page.setViewportSize({ width: 1440, height: 1000 });
        await guide.locator("summary").click();
        await verbs.locator("summary").click();
        await page.getByTestId("language-switcher").click();
        await page.getByRole("heading", { name: "Nắm chắc các thì tiếng Anh" }).waitFor();

        const ids = await page
            .locator('[data-testid^="tense-"][aria-haspopup=dialog]')
            .evaluateAll((nodes) => nodes.map((node) => node.dataset.testid));
        for (const id of ids) {
            const card = page.getByTestId(id);
            await card.focus();
            await card.press("Enter");
            const dialog = page.getByRole("dialog");
            await dialog.waitFor();
            assert.equal(await dialog.locator("h3").count(), 6);
            assert.equal(await dialog.locator("dl").first().locator("dt").count(), 3);
            assert.ok(await dialog.locator("p[lang=vi]").count());
            const expectedRare = /perfect-continuous|future-continuous/.test(id);
            assert.equal(await page.getByTestId("rare-passive").count(), expectedRare ? 1 : 0);
            assert.equal(await dialog.evaluate((node) => node.scrollTop), 0);
            await page.keyboard.press("Tab");
            assert.equal(
                await dialog.evaluate((node) => node.contains(document.activeElement)),
                true,
            );
            await page.keyboard.press("Escape");
            await dialog.waitFor({ state: "detached" });
            assert.equal(
                await card.evaluate((node) => node === document.activeElement),
                true,
                `restore focus ${id}`,
            );
            assert.equal(await page.evaluate(() => document.body.style.overflow), "");
        }
        for (const group of ["present", "past", "future"]) {
            await page.getByTestId(`tense-filter-${group}`).click();
            assert.equal(await page.getByTestId("tense-card").count(), 4);
            assert.equal(
                await page.getByTestId(`tense-filter-${group}`).getAttribute("aria-pressed"),
                "true",
            );
        }
        await page.getByTestId("language-switcher").click();
        await page.getByRole("heading", { name: "Make sense of English tenses" }).waitFor();
        assert.equal(
            await page.getByTestId("tense-filter-future").getAttribute("aria-pressed"),
            "true",
        );
        assert.equal(await page.getByTestId("tense-card").count(), 4);
        for (const locale of ["en", "vi"]) {
            if (
                (await page.getByTestId("language-switcher").getAttribute("data-locale")) !== locale
            ) {
                await page.getByTestId("language-switcher").click();
            }
            await page.waitForFunction((value) => document.documentElement.lang === value, locale);
            for (const width of [320, 375, 768, 1280, 1440, 1920]) {
                await page.setViewportSize({ width, height: 900 });
                await page.getByTestId("tense-filter-all").click();
                assert.equal(
                    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
                    false,
                    `page ${locale} ${width}`,
                );
                const card = page.getByTestId("tense-future-perfect-continuous");
                await card.click();
                const dialog = page.getByRole("dialog");
                const bounds = await dialog.boundingBox();
                assert.ok(
                    bounds.x >= 0 && bounds.x + bounds.width <= width,
                    `dialog width ${locale} ${width}`,
                );
                assert.equal(
                    await dialog.evaluate((node) => node.scrollWidth > node.clientWidth),
                    false,
                    `dialog overflow ${locale} ${width}`,
                );
                assert.equal((await dialog.locator("p[lang=vi]").count()) > 0, locale === "vi");
                const smallestText = await dialog
                    .locator("p, dt, li")
                    .evaluateAll((nodes) =>
                        Math.min(
                            ...nodes.map((node) => parseFloat(getComputedStyle(node).fontSize)),
                        ),
                    );
                assert.ok(smallestText >= 16);
                await dialog.evaluate((node) => {
                    node.scrollTop = node.scrollHeight;
                });
                await page.screenshot({ path: `test-results/tenses-${locale}-${width}.png` });
                await dialog.getByRole("button").first().click();
                await dialog.waitFor({ state: "detached" });
            }
        }
        await page.setViewportSize({ width: 1440, height: 1000 });
        await page.evaluate(() => scrollTo(0, 0));
        await page.screenshot({ path: "test-results/tenses-overview.png", fullPage: true });
        await page.reload();
        await page.getByTestId("tense-card").first().waitFor();
        assert.equal(await page.getByTestId("tense-card").count(), 12);
        assert.equal(await page.evaluate(() => window.spoken.length), 0);
        assert.deepEqual(errors, []);
        console.log(
            "Tenses passed: be/main-verb guide, irregular verb lookup (all forms and unaccented Vietnamese), stable table, locale persistence, keyboard scrolling, direct SSR route, 12 cards, filters, modal focus, silent browsing and six viewport widths.",
        );
    } finally {
        await browser.close();
    }
})().catch((error) => {
    console.error(error);
    process.exit(1);
});
