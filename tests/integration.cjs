const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE || "playwright");
const assert = require("node:assert/strict");
const postgres = require("postgres");
const { randomUUID } = require("node:crypto");
const baseURL = process.env.APP_URL || "http://127.0.0.1:5174";
const password = "Buffalo-test-2026!";
const runId = randomUUID();
const emails = [`buffalo-test-${runId}@example.com`, `buffalo-other-${runId}@example.com`];
const initialHistory = [
    {
        word: "cat",
        correct: true,
        matches: true,
        revealed: false,
        date: "2026-01-01T01:00:00.000Z",
    },
    {
        word: "dog",
        correct: false,
        matches: false,
        revealed: false,
        date: "2026-01-01T01:00:01.000Z",
    },
    {
        word: "cheese",
        correct: false,
        matches: true,
        revealed: true,
        date: "2026-01-01T01:00:02.000Z",
    },
];
let browser;
(async () => {
    assert.ok(
        ["localhost", "127.0.0.1"].includes(new URL(baseURL).hostname),
        "Integration tests must target a local app",
    );
    assert.ok(
        process.env.DATABASE_URL &&
            ["localhost", "127.0.0.1"].includes(new URL(process.env.DATABASE_URL).hostname),
        "Integration tests must use a local test database",
    );
    browser = await chromium.launch({
        headless: true,
        ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
    });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 1000 },
    });
    const page = await context.newPage();
    async function expectHistory(count) {
        await page.locator("[data-testid=progress-page]").waitFor();
        await page.waitForFunction(
            (expected) =>
                document.querySelectorAll("[data-testid=history-list] li").length === expected,
            count,
        );
        assert.equal(await page.locator("[data-testid=history-list] li").count(), count);
    }
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const posts = [];
    const gets = [];
    page.on("request", (request) => {
        if (!request.url().includes("_serverFn")) return;
        if (request.method() === "POST")
            posts.push({
                url: request.url(),
                body: request.postData(),
                headers: request.headers(),
            });
        else gets.push(request.url());
    });
    await page.addInitScript(() => {
        window.spoken = [];
        localStorage.setItem("buffalo-ear-voice", "device");
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
    await page.goto(baseURL);
    await page.getByLabel("Bạn nghe được từ gì?").waitFor();
    await page.locator("[data-testid=learning-content][aria-busy=false]").waitFor();
    await page.evaluate(
        (history) =>
            localStorage.setItem(
                "buffalo-ear-v2",
                JSON.stringify({
                    history,
                    settings: { rate: 0.7, auto: false, level: "all" },
                }),
            ),
        initialHistory,
    );
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.getByLabel("Bạn nghe được từ gì?").waitFor();
    await page.locator("[data-testid=learning-content][aria-busy=false]").waitFor();
    await page.getByRole("button", { name: "Tiến độ", exact: true }).click();
    await expectHistory(3);
    async function register(email, name, waitForPractice = true) {
        await page.getByRole("link", { name: "Đăng nhập", exact: true }).click();
        await page.waitForURL("**/login");
        await page.waitForLoadState("networkidle");
        const google = page.getByRole("button", {
            name: "Tiếp tục với Google",
            exact: true,
        });
        if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
            await google.waitFor();
        else assert.equal(await google.count(), 0);
        await page.getByRole("button", { name: "Đăng ký", exact: true }).click();
        await page.getByLabel("Tên của bạn").fill(name);
        await page.getByLabel("Email", { exact: true }).fill(email);
        await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
        await page.getByRole("button", { name: "Tạo tài khoản", exact: true }).click();
        await page.getByRole("button", { name: "Đăng xuất", exact: true }).waitFor();
        const sessionCookie = (await context.cookies()).find((cookie) =>
            cookie.name.includes("better-auth.session_token"),
        );
        assert.ok(sessionCookie?.httpOnly, "Session cookie must be HttpOnly");
        assert.equal(sessionCookie.sameSite, "Lax");
        assert.ok(sessionCookie.value.includes("."), "Session cookie is signed");
        const securityDb = postgres(process.env.DATABASE_URL);
        try {
            const [credential] =
                await securityDb`select a.password from account a inner join "user" u on u.id = a.user_id where u.email = ${email} and a.provider_id = 'credential' limit 1`;
            assert.ok(
                credential?.password && credential.password !== password,
                "Password must be hashed in database",
            );
        } finally {
            await securityDb.end();
        }
        if (waitForPractice) {
            await page.getByLabel("Bạn nghe được từ gì?").waitFor();
            await page.locator("[data-testid=learning-content][aria-busy=false]").waitFor();
        }
    }
    const blockWrites = (route) =>
        route.request().method() === "POST" ? route.abort("failed") : route.continue();
    await page.route("**/_serverFn/**", blockWrites);
    await register(emails[0], "Buffalo Test", false);
    await page.getByText("Chưa tải được tiến độ tài khoản.", { exact: false }).waitFor();
    assert.equal(await page.getByTestId("sync-notice").count(), 0);
    assert.equal(await page.getByTestId("intro").isVisible(), true);
    assert.equal(await page.getByTestId("learning-content").getAttribute("inert"), "");
    assert.equal(
        await page.evaluate(
            () => JSON.parse(localStorage.getItem("buffalo-ear-v2")).history.length,
        ),
        3,
        "failed import must preserve guest history",
    );
    await page.unroute("**/_serverFn/**", blockWrites);
    await page.getByRole("button", { name: "Thử lại", exact: true }).click();
    await page.getByLabel("Bạn nghe được từ gì?").waitFor();
    await page.locator("[data-testid=learning-content][aria-busy=false]").waitFor();
    await page.getByText("Đã đồng bộ 3 lượt.", { exact: true }).waitFor();
    assert.equal(
        await page.evaluate(
            () => JSON.parse(localStorage.getItem("buffalo-ear-v2")).history.length,
        ),
        0,
    );
    assert.equal(await page.getByLabel("Tốc độ").inputValue(), "0.7");
    assert.equal(
        await page.getByRole("button", { name: "Tiếp tục với Google", exact: true }).count(),
        0,
    );
    await page.getByRole("button", { name: "Tiến độ", exact: true }).click();
    await expectHistory(3);
    await page.getByTestId("language-switcher").click();
    await page.waitForFunction(() => document.documentElement.lang === "en");
    await page.getByRole("button", { name: "Log out", exact: true }).waitFor();
    const accountHtml = await (await page.request.get(baseURL)).text();
    assert.ok(accountHtml.includes('<html lang="en"'));
    assert.ok(accountHtml.includes("Buffalo Test"));
    for (const width of [320, 375, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        assert.equal(
            await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
            false,
        );
    }
    await page.getByTestId("language-switcher").click();
    await page.waitForFunction(() => document.documentElement.lang === "vi");
    await expectHistory(3);
    // Reintroduce the original entries: importing the same guest history must be idempotent.
    await page.evaluate(
        (history) =>
            localStorage.setItem(
                "buffalo-ear-v2",
                JSON.stringify({
                    history,
                    settings: { rate: 0.7, auto: false, level: "all" },
                }),
            ),
        initialHistory,
    );
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.getByText("Đã đồng bộ 0 lượt.", { exact: true }).waitFor();
    await expectHistory(3);
    const progressURL = gets.at(-2); // getProgress then getSettings, order is stable at dispatch.
    assert.ok(progressURL);
    await page.getByRole("button", { name: "Luyện nghe", exact: true }).click();
    await page.getByRole("button", { name: "Nghe từ vựng", exact: true }).click();
    const word = await page.evaluate(() => window.spoken.at(-1));
    await page.getByLabel("Bạn nghe được từ gì?").fill(word);
    await page.getByLabel("Bạn nghe được từ gì?").press("Enter");
    await page
        .getByText("Chính xác! Nhấn Enter lần nữa để sang từ tiếp theo.", {
            exact: false,
        })
        .waitFor();
    const answerRequest = posts.at(-1);
    // A different word with the same request ID is not a valid replay.
    const malformed = await page.request.post(answerRequest.url, {
        data: answerRequest.body.replace(JSON.stringify(word), JSON.stringify("not-in-vocabulary")),
        headers: {
            "content-type": answerRequest.headers["content-type"],
            origin: baseURL,
        },
    });
    assert.match(
        await malformed.text(),
        /Unknown word/,
        "server validation must reject unknown words",
    );
    // Replaying the exact network request must not insert another row.
    const replay = await page.request.post(answerRequest.url, {
        data: answerRequest.body,
        headers: {
            "content-type": answerRequest.headers["content-type"],
            origin: baseURL,
        },
    });
    assert.equal(replay.status(), 200);
    const crossOrigin = await page.request.post(answerRequest.url, {
        data: answerRequest.body,
        headers: {
            "content-type": answerRequest.headers["content-type"],
            origin: "https://example.invalid",
        },
    });
    assert.equal(crossOrigin.status(), 403, "cross-origin writes must be rejected");
    const crossOriginAuth = await page.request.post(baseURL + "/api/auth/sign-in/email", {
        headers: { origin: "https://untrusted.invalid" },
        data: { email: emails[0], password },
    });
    assert.equal(crossOriginAuth.status(), 403, "Auth API rejects cross-origin writes");
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Tiến độ", exact: true }).click();
    await expectHistory(4);
    await page.getByRole("button", { name: "Luyện nghe", exact: true }).click();
    await page.getByRole("button", { name: "Hiện đáp án", exact: true }).click();
    const revealedWord = await page.locator("[data-testid=secret-word]").innerText();
    await page.getByLabel("Bạn nghe được từ gì?").fill(revealedWord);
    await page.getByLabel("Bạn nghe được từ gì?").press("Enter");
    await page
        .getByText("Bạn đã xem đáp án. Thử tự nghe ở từ tiếp theo nhé.", {
            exact: true,
        })
        .waitFor();
    await page.getByRole("button", { name: "Từ tiếp theo", exact: true }).click();
    await page.getByRole("button", { name: "Nghe từ vựng", exact: true }).click();
    const retryWord = await page.evaluate(() => window.spoken.at(-1));
    await page.getByLabel("Bạn nghe được từ gì?").fill(retryWord);
    // Save on the server but drop the response; retry must reuse the same client ID.
    const dropResponse = async (route) => {
        if (route.request().method() !== "POST") return route.continue();
        await route.fetch();
        await route.abort("failed");
    };
    await page.route("**/_serverFn/**", dropResponse);
    await page.getByLabel("Bạn nghe được từ gì?").press("Enter");
    await page.getByText("Chưa lưu được đáp án.", { exact: false }).waitFor();
    await page.unroute("**/_serverFn/**", dropResponse);
    await page.getByLabel("Bạn nghe được từ gì?").press("Enter");
    await page
        .getByText("Chính xác! Nhấn Enter lần nữa để sang từ tiếp theo.", {
            exact: false,
        })
        .waitFor();
    await page.getByLabel("Tốc độ").selectOption("1");
    await page.getByRole("button", { name: "Cấp độ B2", exact: true }).click();
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.getByLabel("Bạn nghe được từ gì?").waitFor();
    await page.locator("[data-testid=learning-content][aria-busy=false]").waitFor();
    assert.equal(await page.getByLabel("Tốc độ").inputValue(), "1");
    assert.equal(
        await page
            .getByRole("button", { name: "Cấp độ B2", exact: true })
            .getAttribute("aria-pressed"),
        "true",
    );
    await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
    await page.getByRole("link", { name: "Đăng nhập", exact: true }).waitFor();
    await page.getByRole("button", { name: "Tiến độ", exact: true }).click();
    await expectHistory(0);
    const untrustedName = 'Other Account <img src=x onerror="window.profileXss=1">';
    await register(emails[1], untrustedName);
    assert.equal(await page.getByTestId("account-name").innerText(), untrustedName);
    assert.equal(await page.locator('img[src="x"]').count(), 0, "Account names render as text");
    assert.equal(await page.evaluate(() => Boolean(window.profileXss)), false);
    await page.getByRole("button", { name: "Tiến độ", exact: true }).click();
    await expectHistory(0);
    await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
    await page.getByRole("link", { name: "Đăng nhập", exact: true }).click();
    await page.getByLabel("Email", { exact: true }).fill(emails[0]);
    await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Đăng nhập bằng email", exact: true }).click();
    await page.getByLabel("Bạn nghe được từ gì?").waitFor();
    await page.locator("[data-testid=learning-content][aria-busy=false]").waitFor();
    await page.getByRole("button", { name: "Tiến độ", exact: true }).click();
    await expectHistory(6);
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.locator("[data-testid=history-list] li").first().waitFor();
    await expectHistory(6);
    const anonymous = await browser.newContext();
    const denied = await anonymous.request.get(progressURL, {
        headers: { origin: baseURL },
    });
    assert.equal(denied.status(), 401, "private server functions must reject anonymous requests");
    await anonymous.close();
    await page.getByRole("button", { name: "Xóa tiến độ", exact: true }).click();
    await page.getByRole("button", { name: "Xóa", exact: true }).click();
    await page.getByText("Tiến bộ bắt đầu từ một từ.", { exact: true }).waitFor();
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.getByText("Tiến bộ bắt đầu từ một từ.", { exact: true }).waitFor();
    assert.deepEqual(errors, []);
    console.log(
        "PASS: signup, import failure recovery, lost-response answer retry, validation, guest history import and replay, server grading, reveal scoring, persistent settings, reload, logout/login, account isolation, unauthorized RPC, remote history deletion.",
    );
})()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        if (browser) await browser.close();
        // Remove only accounts created by this exact test run, on an explicitly local test database.
        if (process.env.DATABASE_URL) {
            const url = new URL(process.env.DATABASE_URL);
            if (["127.0.0.1", "localhost"].includes(url.hostname)) {
                const sql = postgres(process.env.DATABASE_URL);
                try {
                    await sql`delete from "user" where email in ${sql(emails)}`;
                } finally {
                    await sql.end();
                }
            }
        }
    });
