const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const manifest = require("../src/core/ipa-audio.json");
(async () => {
    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage({
            viewport: { width: 1440, height: 1100 },
        });
        await page.addInitScript(() => {
            window.samplePlays = [];
            window.spoken = [];
            localStorage.setItem("buffalo-ear-voice", "device");
            const NativeAudio = window.Audio;
            window.Audio = function (source) {
                const audio = new NativeAudio(source);
                audio.addEventListener("play", () => window.samplePlays.push(audio.src));
                return audio;
            };
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
                    speak(u) {
                        window.spoken.push(u.text);
                        u.onstart?.();
                        u.onend?.();
                    },
                },
            });
        });
        await page.goto(process.env.APP_URL || "http://127.0.0.1:5175");
        await page.waitForLoadState("networkidle");
        assert.equal(await page.locator("#ipa-sample option").count(), 44);
        const decoded = await page.evaluate(async (sources) => {
            const context = new AudioContext();
            try {
                const results = [];
                for (const source of sources) {
                    const response = await fetch(source);
                    if (!response.ok) throw Error(source);
                    const data = await context.decodeAudioData(await response.arrayBuffer());
                    results.push({
                        source,
                        duration: data.duration,
                        nonzero: data.getChannelData(0).some((v) => Math.abs(v) > 0.01),
                    });
                }
                return results;
            } finally {
                await context.close();
            }
        }, Object.values(manifest));
        assert.equal(decoded.length, 44);
        assert.ok(decoded.every((a) => a.duration > 0.02 && a.nonzero));
        await page.getByRole("button", { name: "Nghe từ vựng", exact: true }).click();
        const word = await page.evaluate(() => window.spoken.at(-1));
        for (const sound of ["iː", "aɪ", "θ", "dʒ"]) {
            await page.locator("#ipa-sample").selectOption(sound);
            await page.getByTestId("ipa-listen-button").click();
            await page.waitForFunction(
                (source) => window.samplePlays.some((url) => url.endsWith(source)),
                manifest[sound],
            );
            assert.equal(await page.evaluate(() => window.spoken.at(-1)), word);
            assert.equal(await page.locator("[data-testid=sound][aria-pressed=true]").count(), 0);
        }
        const input = page.getByLabel("Bạn nghe được từ gì?");
        await input.fill(word);
        await input.press("Enter");
        await page.waitForFunction(
            () => document.querySelector("[data-testid=feedback]").dataset.result === "correct",
        );
        await input.dispatchEvent("keydown", { key: "Enter", repeat: true });
        assert.equal(await input.inputValue(), word);
        await input.press("Enter");
        await page.waitForFunction(() => document.querySelector("#answer").value === "");
        assert.equal(
            await page.locator("[data-testid=session-stats] strong").first().innerText(),
            "1",
        );
        await input.fill("wrong-answer");
        await input.press("Enter");
        await page.waitForFunction(
            () => document.querySelector("[data-testid=feedback]").dataset.result === "incorrect",
        );
        await input.press("Enter");
        assert.equal(await input.inputValue(), "wrong-answer");
        await page.route("**/audio/ipa/1.wav", (route) => route.abort());
        await page.locator("#ipa-sample").selectOption("iː");
        await page.getByTestId("ipa-listen-button").click();
        await page.getByRole("alert").filter({ hasText: "Chưa phát được âm mẫu" }).waitFor();
        await page.unroute("**/audio/ipa/1.wav");
        await page.getByTestId("ipa-listen-button").click();
        await page.waitForFunction(() => !document.querySelector("[role=alert]"));
        for (const width of [320, 375, 768, 1440]) {
            await page.setViewportSize({ width, height: 1100 });
            assert.equal(
                await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
                false,
            );
            if (width === 375 || width === 1440)
                await page
                    .getByTestId("sounds-panel")
                    .screenshot({ path: `test-results/ipa-${width}.png` });
        }
        console.log(
            "PASS: 44 non-silent decodable WAVs, isolated sample playback, unchanged filters/word, repeat Enter guarded, correct Enter advances once, wrong Enter stays, audio failure/retry, responsive",
        );
    } finally {
        await browser.close();
    }
})().catch((e) => {
    console.error(e);
    process.exit(1);
});
