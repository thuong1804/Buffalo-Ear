const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage({
            viewport: { width: 1440, height: 1100 },
        });
        const errors = [];
        const audioRequests = [];
        page.on("pageerror", (e) => errors.push(e.message));
        page.on("request", (request) => {
            if (request.url().includes("/audio/")) audioRequests.push(request.url());
        });
        await page.addInitScript(() => {
            if (!localStorage.getItem("voice-migration-tested")) {
                localStorage.setItem("buffalo-ear-voice", "retired-engine");
                localStorage.setItem("voice-migration-tested", "1");
            }
            window.spoken = [];
            window.cancels = 0;
            window.failVoice = false;
            window.availableVoices = [
                { name: "British test", lang: "en-GB", voiceURI: "british" },
                { name: "American test", lang: "en-US", voiceURI: "american" },
            ];
            window.audioInstances = [];
            window.samplePlays = 0;
            const NativeAudio = window.Audio;
            window.Audio = function (source) {
                const audio = new NativeAudio(source);
                window.audioInstances.push(audio);
                audio.addEventListener("play", () => window.samplePlays++);
                return audio;
            };
            window.SpeechSynthesisUtterance = class {
                constructor(text) {
                    this.text = text;
                }
            };
            Object.defineProperty(window, "speechSynthesis", {
                value: {
                    cancel() {
                        window.cancels++;
                    },
                    getVoices() {
                        return window.availableVoices;
                    },
                    addEventListener(name, callback) {
                        window.voicesChanged = callback;
                    },
                    removeEventListener() {},
                    speak(u) {
                        window.spoken.push({
                            text: u.text,
                            voice: u.voice?.voiceURI,
                            lang: u.lang,
                            rate: u.rate,
                        });
                        if (window.failVoice) u.onerror?.({ error: "synthesis-failed" });
                        else {
                            u.onstart?.();
                            u.onend?.();
                        }
                    },
                },
            });
        });
        await page.goto(process.env.APP_URL || "http://127.0.0.1:5175");
        await page.waitForLoadState("networkidle");
        const choices = page.getByTestId("voice-choice");
        assert.equal(await choices.inputValue(), "device");
        assert.equal(
            await page.evaluate(() => localStorage.getItem("buffalo-ear-voice")),
            "device",
        );
        assert.equal(await choices.locator("option").count(), 3);
        await page.getByTestId("listen-button").click();
        await page.waitForFunction(() => window.spoken.length === 1);
        const first = await page.evaluate(() => window.spoken[0]);
        assert.equal(first.voice, "british");
        await page.getByRole("button", { name: "Hiện đáp án", exact: true }).click();
        assert.equal(await page.getByTestId("secret-word").innerText(), first.text);
        assert.deepEqual(audioRequests, []);
        await page.getByLabel("Tốc độ").selectOption("0.7");
        await choices.selectOption("device:american");
        await page.getByTestId("listen-button").click();
        const second = await page.evaluate(() => window.spoken.at(-1));
        assert.equal(second.voice, "american");
        assert.equal(second.lang, "en-US");
        assert.equal(second.rate, 0.7);
        await page.reload();
        await page.waitForLoadState("networkidle");
        assert.equal(await choices.inputValue(), "device:american");
        await page.evaluate(() => {
            window.availableVoices = window.availableVoices.filter(
                (v) => v.voiceURI !== "american",
            );
            window.voicesChanged();
        });
        await choices
            .getByRole("option", { name: "Giọng đã lưu · dùng giọng dự phòng" })
            .waitFor({ state: "attached" });
        await page.getByTestId("listen-button").click();
        assert.equal(await page.evaluate(() => window.spoken.at(-1).voice), "british");
        await page.evaluate(() => (window.failVoice = true));
        await page.getByTestId("listen-button").click();
        await page
            .getByRole("alert")
            .filter({ hasText: "Chưa phát được giọng thiết bị" })
            .waitFor();
        await page.evaluate(() => (window.failVoice = false));
        await choices.selectOption("device");
        await page.getByTestId("listen-button").click();
        assert.equal(await page.getByRole("alert").count(), 0);
        await page.getByTestId("ipa-listen-button").click();
        await page.waitForFunction(() => window.samplePlays > 0);
        await page.getByTestId("listen-button").click();
        assert.equal(await page.evaluate(() => window.audioInstances.every((a) => a.paused)), true);
        const cancels = await page.evaluate(() => window.cancels);
        await page.getByRole("button", { name: "Thư viện", exact: true }).click();
        assert.ok((await page.evaluate(() => window.cancels)) > cancels);
        await page.getByRole("button", { name: "Trang tiếp theo", exact: true }).click();
        const pagination = await page.getByTestId("pagination").innerText();
        const libraryWord = (
            await page.getByTestId("word-card").first().locator("h3").innerText()
        ).trim();
        const libraryListen = page.getByRole("button", {
            name: `Nghe từ ${libraryWord}`,
            exact: true,
        });
        await libraryListen.click();
        assert.equal(new URL(page.url()).pathname, "/library");
        assert.equal(await page.getByTestId("pagination").innerText(), pagination);
        assert.equal(await page.evaluate(() => window.spoken.at(-1).text), libraryWord);
        assert.equal(await page.evaluate(() => window.spoken.at(-1).rate), 0.7);
        await page.evaluate(() => (window.failVoice = true));
        await libraryListen.click();
        await page
            .getByRole("alert")
            .filter({ hasText: "Chưa phát được giọng thiết bị" })
            .waitFor();
        assert.equal(new URL(page.url()).pathname, "/library");
        await page.evaluate(() => (window.failVoice = false));
        await libraryListen.click();
        assert.equal(await page.getByRole("alert").count(), 0);
        await page.getByRole("button", { name: "Luyện nghe", exact: true }).click();
        for (const width of [320, 375, 768, 1440]) {
            await page.setViewportSize({ width, height: 1100 });
            assert.equal(
                await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
                false,
            );
            if (width === 375 || width === 1440)
                await page
                    .getByTestId("practice-panel")
                    .screenshot({ path: `test-results/system-voice-${width}.png` });
        }
        assert.deepEqual(errors, []);
        console.log(
            "PASS: system voices only, migrate old preference, English default, voice/speed/persistence, unavailable voice fallback, error/retry, IPA/navigation cancellation, responsive",
        );
    } finally {
        await browser.close();
    }
})().catch((e) => {
    console.error(e);
    process.exit(1);
});
