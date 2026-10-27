const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const viApp = require("../src/i18n/locales/vi/app.json");
const enApp = require("../src/i18n/locales/en/app.json");
const base = process.env.APP_URL || "http://127.0.0.1:5175";
(async () => {
    const browser = await chromium.launch({ headless: true });
    try {
        const context = await browser.newContext({
            viewport: { width: 1440, height: 1100 },
        });
        const page = await context.newPage();
        const errors = [];
        page.on("pageerror", (e) => errors.push(e.message));
        page.on("console", (message) => {
            if (
                message.type() === "error" &&
                /hydration|hydrating|did not match/i.test(message.text())
            )
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
                        return [{ name: "British test", voiceURI: "british", lang: "en-GB" }];
                    },
                    addEventListener() {},
                    removeEventListener() {},
                    speak(u) {
                        window.spoken.push({
                            text: u.text,
                            lang: u.lang,
                            voice: u.voice?.voiceURI,
                        });
                        u.onstart?.();
                        u.onend?.();
                    },
                },
            });
        });
        const results = await Promise.all(
            Array.from({ length: 12 }, async (_, i) => {
                const locale = i % 2 ? "en" : "vi";
                const response = await context.request.get(
                    base + (i % 3 === 0 ? "/login" : "/library"),
                    { headers: { cookie: `buffalo-ear-locale=${locale}` } },
                );
                assert.ok(response.ok());
                const html = await response.text();
                assert.ok(html.includes(`<html lang="${locale}"`), `SSR lang ${locale}`);
                assert.ok(
                    html.includes(
                        (locale === "en" ? enApp : viApp)[
                            i % 3 === 0 ? "seoLoginTitle" : "seoLibraryTitle"
                        ],
                    ),
                );
                assert.ok(html.includes(locale === "en" ? "Main navigation" : "Điều hướng chính"));
                return locale;
            }),
        );
        assert.equal(results.length, 12);
        await context.clearCookies();
        await page.goto(base);
        await page.waitForLoadState("networkidle");
        await page.locator("#answer").fill("kept-answer");
        await page.getByTestId("voice-choice").selectOption("device:british");
        const switchLanguage = async (locale) => {
            const toggle = page.getByTestId("language-switcher");
            if ((await toggle.getAttribute("data-locale")) !== locale) await toggle.click();
            await page.waitForFunction(
                (expected) =>
                    document.documentElement.lang === expected &&
                    !document.querySelector("[data-testid=language-switcher]").disabled,
                locale,
            );
        };
        await context.setOffline(true);
        await switchLanguage("en");
        await context.setOffline(false);
        assert.equal(await page.locator("#answer").inputValue(), "kept-answer");
        assert.equal(await page.getByTestId("voice-choice").inputValue(), "device:british");
        assert.equal(await page.evaluate(() => window.spoken.length), 0);
        assert.match(await page.title(), /Listen closely/);
        assert.equal(
            (await context.cookies()).find((c) => c.name === "buffalo-ear-locale").value,
            "en",
        );
        await page.getByTestId("listen-button").click();
        assert.equal(await page.evaluate(() => window.spoken.at(-1).lang), "en-GB");
        const answerWord = await page.evaluate(() => window.spoken.at(-1).text);
        await page.getByLabel("What word did you hear?", { exact: true }).fill(answerWord);
        await page.getByLabel("What word did you hear?", { exact: true }).press("Enter");
        await page
            .getByRole("status")
            .filter({ hasText: "Correct! Press Enter again for the next word." })
            .waitFor();
        await page.getByLabel("What word did you hear?", { exact: true }).press("Enter");
        await page.waitForFunction(() => document.querySelector("#answer").value === "");
        await page.getByRole("button", { name: "Library", exact: true }).click();
        await page
            .getByRole("textbox", {
                name: "Search words or Vietnamese meanings",
                exact: true,
            })
            .fill("cheese");
        await page.getByRole("button", { name: "Listen to cheese", exact: true }).click();
        assert.equal(new URL(page.url()).pathname, "/library");
        assert.equal(await page.evaluate(() => window.spoken.at(-1).text), "cheese");
        assert.equal(
            await page.locator("[data-testid=word-card] p[lang=vi]").innerText(),
            "phô mai",
        );
        const spoken = await page.evaluate(() => window.spoken.length);
        await switchLanguage("vi");
        assert.equal(
            await page.getByRole("textbox", { name: "Tìm từ hoặc nghĩa tiếng Việt" }).inputValue(),
            "cheese",
        );
        assert.equal(await page.evaluate(() => window.spoken.length), spoken);
        await switchLanguage("en");
        await page.reload();
        await page.waitForLoadState("networkidle");
        assert.equal(await page.getByTestId("language-switcher").getAttribute("data-locale"), "en");
        assert.equal(await page.locator("html").getAttribute("lang"), "en");
        await page.getByRole("button", { name: "Progress", exact: true }).click();
        assert.ok(
            (await page.locator("[data-testid=activity-day] > span").allTextContents()).every(
                (day) => /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/.test(day),
            ),
        );
        await page.getByTestId("account-link").click();
        await page.route("**/api/auth/sign-in/email", (route) =>
            route.fulfill({
                status: 401,
                contentType: "application/json",
                body: JSON.stringify({
                    code: "INVALID_EMAIL_OR_PASSWORD",
                    message: "Invalid email or password",
                }),
            }),
        );
        await page.getByLabel("Email", { exact: true }).fill("invalid@example.com");
        await page.getByLabel("Password", { exact: true }).fill("password1");
        await page.getByRole("button", { name: "Log in with email", exact: true }).click();
        await page
            .getByRole("alert")
            .filter({ hasText: "Unable to log in. Check your email and password." })
            .waitFor();
        await switchLanguage("vi");
        await page
            .getByRole("alert")
            .filter({ hasText: "Không đăng nhập được. Kiểm tra email và mật khẩu." })
            .waitFor();
        for (const locale of ["vi", "en"]) {
            await switchLanguage(locale);
            for (const width of [320, 375, 768, 1024, 1440]) {
                await page.setViewportSize({ width, height: 1000 });
                for (const route of ["/", "/library", "/progress", "/login"]) {
                    await page.goto(base + route);
                    await page.waitForLoadState("networkidle");
                    assert.equal(await page.locator("html").getAttribute("lang"), locale);
                    assert.equal(
                        await page.evaluate(
                            () => document.documentElement.scrollWidth > innerWidth,
                        ),
                        false,
                        `${locale} ${width} ${route}`,
                    );
                    assert.equal(
                        await page
                            .locator("[data-testid=level-options]")
                            .filter({ hasText: "common:" })
                            .count(),
                        0,
                    );
                    if (width === 375 || width === 1440)
                        await page.screenshot({
                            path: `test-results/i18n-${locale}-${width}-${route.slice(1) || "practice"}.png`,
                            fullPage: true,
                        });
                }
            }
        }
        assert.deepEqual(errors, []);
        console.log(
            "PASS: concurrent vi/en SSR isolation, title/lang/cookie, language switch preserves answer/filter/voice, English audio, Vietnamese word meanings, locale dates, auth error switches, reload, 4 routes × 5 widths × 2 locales",
        );
    } finally {
        await browser.close();
    }
})().catch((e) => {
    console.error(e);
    process.exit(1);
});
