const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const base = process.env.APP_URL || "http://127.0.0.1:5175";

(async () => {
    const browser = await chromium.launch({ headless: true });
    try {
        const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
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
        await page.goto(base + "/dialogues");
        await page.getByTestId("dialogue-answer").waitFor();
        await page.getByTestId("dialogue-answer").fill("keep this draft");
        const trigger = page.getByTestId("mobile-menu-trigger");
        const drawer = page.getByTestId("mobile-navigation");
        const panel = page.getByTestId("mobile-menu-panel");
        const open = async () => {
            await trigger.click();
            await drawer.waitFor();
            await page.waitForFunction(() =>
                document
                    .querySelector("[data-testid=mobile-menu-panel]")
                    .getAnimations()
                    .every((animation) => animation.playState === "finished"),
            );
        };
        const closed = async () => {
            await drawer.waitFor({ state: "detached" });
            assert.equal(await page.evaluate(() => document.body.style.overflow), "");
            assert.equal(await trigger.getAttribute("aria-expanded"), "false");
        };
        assert.ok(
            (await page.getByTestId("site-header").boundingBox()).height <= 90,
            "compact mobile header",
        );
        assert.equal(await page.getByTestId("header-actions").isVisible(), false);
        assert.equal(await page.getByRole("navigation").count(), 0);
        await page.evaluate(() => scrollTo(0, 0));
        const beforeScroll = await page.evaluate(() => scrollY);
        await open();
        assert.equal(await trigger.getAttribute("aria-expanded"), "true");
        assert.equal(await drawer.getByRole("navigation").count(), 1);
        assert.equal(
            await drawer
                .getByRole("button", { name: "Hội thoại", exact: true })
                .getAttribute("aria-current"),
            "page",
        );
        assert.equal(await page.evaluate(() => document.body.style.overflow), "hidden");
        for (let i = 0; i < 16; i++) {
            await page.keyboard.press("Tab");
            assert.equal(
                await drawer.evaluate((node) => node.contains(document.activeElement)),
                true,
                "focus stays inside drawer",
            );
        }
        await page.keyboard.press("Escape");
        await closed();
        assert.equal(await trigger.evaluate((node) => node === document.activeElement), true);
        assert.equal(await page.getByTestId("dialogue-answer").inputValue(), "keep this draft");
        assert.equal(await page.evaluate(() => scrollY), beforeScroll);
        await open();
        await page.mouse.click(5, 160);
        await closed();
        await open();
        await drawer.getByRole("button", { name: "Các mục con của Các thì", exact: true }).click();
        assert.equal(await drawer.locator("#mobile-tense-children li").count(), 3);
        await drawer.getByTestId("mobile-child-irregular-verbs").click();
        await closed();
        await page.waitForURL("**/tenses#irregular-verbs");
        assert.equal(await page.getByTestId("irregular-verbs").getAttribute("open"), "");
        assert.ok((await page.getByTestId("irregular-verbs").boundingBox()).y < 10);
        await page.getByTestId("irregular-verbs").locator("summary").click();
        await open();
        assert.equal(
            await drawer.getByTestId("mobile-child-irregular-verbs").getAttribute("aria-current"),
            "location",
        );
        await drawer.getByTestId("mobile-child-irregular-verbs").click();
        await closed();
        assert.equal(
            await page.getByTestId("irregular-verbs").getAttribute("open"),
            "",
            "reopen current hash",
        );
        await open();
        await drawer.getByTestId("mobile-child-verb-guide").click();
        await closed();
        await page.waitForURL("**/tenses#verb-guide");
        assert.equal(await page.getByTestId("verb-guide").getAttribute("open"), "");
        await open();
        await drawer.getByTestId("language-switcher").click();
        await drawer
            .getByRole("button", { name: "Be or another main verb?", exact: true })
            .waitFor();
        assert.equal(await drawer.isVisible(), true, "locale does not close drawer");
        for (const [locale, submenu] of [
            ["en", "Tenses submenu"],
            ["vi", "Các mục con của Các thì"],
        ]) {
            if (
                (await drawer.getByTestId("language-switcher").getAttribute("data-locale")) !==
                locale
            )
                await drawer.getByTestId("language-switcher").click();
            await drawer.getByRole("button", { name: submenu, exact: true }).waitFor();
            for (const [width, height] of [
                [320, 568],
                [375, 812],
                [600, 700],
                [767, 900],
            ]) {
                await page.setViewportSize({ width, height });
                const bounds = await panel.boundingBox();
                assert.ok(
                    bounds.x >= 0 && Math.abs(bounds.x + bounds.width - width) < 2,
                    `${locale} drawer edge ${width}`,
                );
                assert.equal(
                    await panel.evaluate((node) => node.scrollWidth > node.clientWidth),
                    false,
                    `${locale} panel overflow ${width}`,
                );
                assert.equal(
                    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
                    false,
                );
                const flag = await drawer.getByTestId("language-switcher").boundingBox();
                assert.ok(flag.y + flag.height <= height, "footer remains visible");
                if (width === 375)
                    await page.screenshot({ path: `test-results/mobile-menu-${locale}.png` });
            }
        }
        await drawer.getByRole("button", { name: "Hướng dẫn", exact: true }).click();
        await closed();
        await page.getByTestId("help-panel").waitFor();
        await open();
        await drawer.getByRole("link", { name: "Đăng nhập", exact: true }).click();
        await page.waitForURL("**/login");
        await closed();
        await open();
        await page.setViewportSize({ width: 768, height: 900 });
        await closed();
        assert.equal(await trigger.isVisible(), false);
        assert.equal(await page.getByTestId("header-actions").isVisible(), true);
        await page.getByRole("button", { name: "Thư viện", exact: true }).click();
        await page.waitForURL("**/library");
        await page.setViewportSize({ width: 375, height: 812 });
        await page.emulateMedia({ reducedMotion: "reduce" });
        await open();
        assert.ok(
            await panel.evaluate((node) =>
                node
                    .getAnimations()
                    .every((animation) => animation.effect.getTiming().duration === 0),
            ),
        );
        await drawer.getByRole("button", { name: "Luyện nghe", exact: true }).click();
        await closed();
        await page.waitForURL(base + "/");
        assert.equal(await page.evaluate(() => window.spoken.length), 0);
        await context.close();
        assert.deepEqual(errors, []);
        console.log(
            "Mobile navigation passed: compact header, right drawer, focus/scroll restoration, overlay/Escape, nested anchors and reopening, locale, account/help, four mobile widths, desktop resize and reduced motion.",
        );
    } finally {
        await browser.close();
    }
})().catch((error) => {
    console.error(error);
    process.exit(1);
});
