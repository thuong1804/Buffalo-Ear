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
        await page.goto(process.env.APP_URL || "http://127.0.0.1:5175/");
        await page.getByLabel("Bạn nghe được từ gì?").waitFor();
        const expectColor = async (selector, property, color) => {
            await page.waitForFunction(
                ({ selector, property, color }) =>
                    getComputedStyle(document.querySelector(selector))[property] === color,
                { selector, property, color },
            );
        };
        const tokenColor = (token) =>
            page.evaluate((name) => {
                const probe = document.createElement("span");
                probe.style.color = `var(${name})`;
                document.body.append(probe);
                const color = getComputedStyle(probe).color;
                probe.remove();
                return color;
            }, token);
        await page.getByRole("button", { name: "Cấp độ A1", exact: true }).click();
        await expectColor(
            "[data-testid=level-option][aria-pressed=true]",
            "backgroundColor",
            await tokenColor("--color-primary"),
        );
        await page.getByRole("button", { name: "Chọn âm /æ/", exact: true }).click();
        await expectColor(
            "[data-testid=sound][aria-pressed=true]",
            "backgroundColor",
            await tokenColor("--color-primary"),
        );
        await expectColor(
            "[data-testid=sound][aria-pressed=true]",
            "color",
            await tokenColor("--color-background"),
        );
        assert.equal(
            await page
                .getByTestId("sound-check")
                .evaluate((node) => getComputedStyle(node).animationName),
            "choice-check",
        );
        const contrast = await page.evaluate(() => {
            const canvas = document.createElement("canvas");
            canvas.width = canvas.height = 1;
            const context = canvas.getContext("2d", { willReadFrequently: true });
            const rgba = (value) => {
                context.clearRect(0, 0, 1, 1);
                context.fillStyle = value;
                context.fillRect(0, 0, 1, 1);
                return [...context.getImageData(0, 0, 1, 1).data];
            };
            const luminance = (color) =>
                color.reduce((sum, channel, i) => {
                    const value = channel / 255;
                    return (
                        sum +
                        (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4) *
                            [0.2126, 0.7152, 0.0722][i]
                    );
                }, 0);
            return [
                "[data-testid=intro] p",
                "[data-testid=level-option][aria-pressed=true] small",
                "[data-testid=level-option][aria-pressed=false] small",
                "[data-testid=sound][aria-pressed=true]",
                "[data-testid=sound][aria-pressed=false]",
                "[data-testid=group-label]",
                "[data-testid=nav-link][aria-current=page]",
            ].map((selector) => {
                const node = document.querySelector(selector);
                const ancestors = [];
                for (let parent = node; parent; parent = parent.parentElement)
                    ancestors.unshift(parent);
                let background = [255, 255, 255];
                for (const ancestor of ancestors) {
                    const [r, g, b, a] = rgba(getComputedStyle(ancestor).backgroundColor);
                    background = [r, g, b].map(
                        (channel, i) => (channel * a) / 255 + background[i] * (1 - a / 255),
                    );
                }
                const foreground = rgba(getComputedStyle(node).color).slice(0, 3);
                const values = [luminance(foreground), luminance(background)].sort((a, b) => a - b);
                return { selector, ratio: (values[1] + 0.05) / (values[0] + 0.05) };
            });
        });
        for (const item of contrast)
            assert.ok(item.ratio >= 4.5, `${item.selector}: contrast ${item.ratio.toFixed(2)}`);
        await page.emulateMedia({ reducedMotion: "reduce" });
        assert.equal(
            await page
                .getByTestId("sound-check")
                .evaluate((node) => getComputedStyle(node).animationName),
            "none",
        );
        assert.equal(
            await page
                .getByTestId("sound-check")
                .evaluate((node) => getComputedStyle(node.closest("button")).transitionProperty),
            "none",
        );
        await page.emulateMedia({ reducedMotion: "no-preference" });
        const selectedSound = page.locator("[data-testid=sound][aria-pressed=true]");
        await selectedSound.hover();
        const normalTop = (await selectedSound.boundingBox()).y;
        await page.mouse.down();
        await page.waitForFunction(
            () =>
                parseFloat(
                    getComputedStyle(
                        document.querySelector("[data-testid=sound][aria-pressed=true]"),
                    )
                        .translate.split(" ")
                        .at(-1),
                ) >= 0.9,
        );
        assert.ok(Math.abs((await selectedSound.boundingBox()).y - normalTop - 1) < 0.2);
        await page.mouse.up();
        // A press toggles the sound off; select it again for the remaining grading checks.
        await selectedSound.waitFor({ state: "detached" });
        await page.getByRole("button", { name: "Chọn âm /æ/", exact: true }).click();
        await page.evaluate(() => {
            document.activeElement?.blur();
            scrollTo(0, 0);
        });
        await page.screenshot({ path: "test-results/interaction-practice.png", fullPage: true });
        await page.getByRole("button", { name: "Hiện đáp án", exact: true }).click();
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
        const goal = await page.locator("[data-testid=goal-track]").evaluate((e) => ({
            track: e.getBoundingClientRect().width,
            fill: e.firstElementChild.getBoundingClientRect().width,
        }));
        assert.ok(Math.abs(goal.fill / goal.track - 0.05) < 0.005, JSON.stringify(goal));
        const toggle = page.getByRole("checkbox", { name: "Tự động đọc" });
        await toggle.uncheck();
        await expectColor(
            "[data-testid=switch]",
            "backgroundColor",
            await tokenColor("--color-muted"),
        );
        await toggle.check();
        await expectColor(
            "[data-testid=switch]",
            "backgroundColor",
            await tokenColor("--color-primary"),
        );
        await page.getByRole("button", { name: "Từ tiếp theo", exact: true }).click();
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
                today && Math.abs(today.firstElementChild.getBoundingClientRect().height - 15) < 1
            );
        });
        const last = await page
            .locator("[data-testid=bar-track]")
            .last()
            .evaluate((e) => e.firstElementChild.getBoundingClientRect().height);
        assert.ok(Math.abs(last - 15) < 1, `Expected a 15px bar for two attempts, got ${last}`);
        console.log(
            "PASS: selected contrast ≥4.5:1, press motion, check animation, reduced motion, feedback colors, checkbox state, goal and chart dimensions.",
        );
    } finally {
        await browser.close();
    }
})().catch((e) => {
    console.error(e);
    process.exitCode = 1;
});
