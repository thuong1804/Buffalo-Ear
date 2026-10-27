const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const { readFile, readdir } = require("node:fs/promises");
const path = require("node:path");
const { parse } = require("dotenv");
const base = process.env.APP_URL || "http://127.0.0.1:5175";
const origin = "https://buffalo-ear.vercel.app";

(async () => {
    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
        const errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        await page.addInitScript(() => {
            window.cspViolations = [];
            document.addEventListener("securitypolicyviolation", (event) =>
                window.cspViolations.push(event.effectiveDirective),
            );
        });
        const nonces = new Set();
        const titles = new Set();
        for (const route of ["/", "/library", "/dialogues", "/tenses", "/progress", "/login"]) {
            const response = await page.request.get(base + route, {
                headers: { "x-buffalo-csp-nonce": "untrusted-client-value" },
            });
            assert.equal(response.status(), 200, route);
            const headers = response.headers();
            assert.equal(headers["x-content-type-options"], "nosniff");
            assert.equal(headers["x-frame-options"], "DENY");
            assert.equal(headers["referrer-policy"], "strict-origin-when-cross-origin");
            assert.ok(
                headers["cache-control"].includes("private") &&
                    headers["cache-control"].includes("no-store"),
            );
            const nonce = headers["content-security-policy"].match(/'nonce-([^']+)'/)[1];
            assert.notEqual(nonce, "untrusted-client-value");
            assert.ok(!nonces.has(nonce), "nonce must be unique per response");
            nonces.add(nonce);
            const html = await response.text();
            const tags = await page.evaluate((source) => {
                const document = new DOMParser().parseFromString(source, "text/html");
                return {
                    title: document.title,
                    titles: document.querySelectorAll("title").length,
                    descriptions: document.querySelectorAll('meta[name="description"]').length,
                    canonicals: document.querySelectorAll('link[rel="canonical"]').length,
                    canonical: document
                        .querySelector('link[rel="canonical"]')
                        ?.getAttribute("href"),
                    ogUrl: document.querySelector('meta[property="og:url"]')?.content,
                    image: document.querySelector('meta[property="og:image"]')?.content,
                    robots: document.querySelector('meta[name="robots"]')?.content,
                    nonce: document.querySelector('meta[name="csp-nonce"]')?.content,
                    scripts: [...document.querySelectorAll("script")].map((script) =>
                        script.getAttribute("nonce"),
                    ),
                    links: [
                        ...document.querySelectorAll('[data-testid="footer-navigation"] a'),
                    ].map((link) => link.getAttribute("href")),
                };
            }, html);
            assert.equal(tags.titles, 1, route);
            assert.equal(tags.descriptions, 1, route);
            assert.equal(tags.canonicals, 1, route);
            assert.equal(tags.canonical, origin + route);
            assert.equal(tags.ogUrl, tags.canonical);
            assert.equal(tags.image, origin + "/social-card.png");
            assert.equal(tags.nonce, nonce);
            assert.ok(
                tags.scripts.length && tags.scripts.every((value) => value === nonce),
                `SSR script nonces ${route}`,
            );
            assert.deepEqual(tags.links.sort(), ["/", "/library", "/dialogues", "/tenses"].sort());
            assert.ok(!titles.has(tags.title));
            titles.add(tags.title);
            if (["/login", "/progress"].includes(route))
                assert.equal(tags.robots, "noindex, follow");
        }
        const robots = await page.request.get(base + "/robots.txt");
        assert.equal(robots.status(), 200);
        assert.match(robots.headers()["content-type"], /text\/plain/);
        assert.ok((await robots.text()).includes("Sitemap: " + origin + "/sitemap.xml"));
        const sitemap = await page.request.get(base + "/sitemap.xml");
        assert.equal(sitemap.status(), 200);
        assert.match(sitemap.headers()["content-type"], /application\/xml/);
        const xml = await sitemap.text();
        assert.equal((xml.match(/<loc>/g) || []).length, 4);
        assert.ok(!xml.includes("/login") && !xml.includes("/progress"));
        const missing = await page.request.get(base + "/missing-security-audit-page");
        assert.equal(missing.status(), 404);
        assert.equal(missing.headers()["x-robots-tag"], "noindex, follow");
        const card = await page.request.get(base + "/social-card.png");
        assert.equal(card.status(), 200);
        const png = await card.body();
        assert.equal(png.readUInt32BE(16), 1200);
        assert.equal(png.readUInt32BE(20), 630);
        await page.goto(base);
        await page.getByTestId("learning-content").locator("[data-testid=listen-button]").waitFor();
        await page.waitForLoadState("networkidle");
        assert.deepEqual(await page.evaluate(() => window.cspViolations), []);
        await page
            .getByTestId("footer-navigation")
            .getByRole("link", { name: "Thư viện", exact: true })
            .click();
        await page.waitForURL("**/library");
        assert.match(await page.title(), /Thư viện/);
        await page.getByTestId("language-switcher").click();
        await page.waitForFunction(() => document.title.includes("dictionary"));
        assert.equal(await page.locator('link[rel="canonical"]').count(), 1);
        assert.equal(
            await page.locator('meta[property="og:locale"]').getAttribute("content"),
            "en_GB",
        );
        assert.deepEqual(
            await page.evaluate(() => window.cspViolations),
            [],
            "SSR hydration and navigation must work under CSP",
        );
        await page.evaluate(() => {
            const injected = document.createElement("script");
            injected.textContent = "window.unauthorizedScriptRan = true";
            document.body.append(injected);
        });
        await page.waitForFunction(() => window.cspViolations.length > 0);
        assert.equal(
            await page.evaluate(() => Boolean(window.unauthorizedScriptRan)),
            false,
            "CSP blocks injected inline script",
        );
        const env = parse(await readFile(".env"));
        const secrets = ["BETTER_AUTH_SECRET", "GOOGLE_CLIENT_SECRET", "DATABASE_URL"]
            .filter((key) => env[key]?.length >= 16)
            .map((key) => ({ key, value: env[key] }));
        const scan = async (directory) => {
            for (const entry of await readdir(directory, { withFileTypes: true })) {
                const file = path.join(directory, entry.name);
                if (entry.isDirectory()) await scan(file);
                else if (/\.(js|css|map|html)$/.test(entry.name)) {
                    const source = await readFile(file, "utf8");
                    for (const secret of secrets)
                        assert.ok(
                            !source.includes(secret.value),
                            `${secret.key} must stay out of public assets`,
                        );
                }
            }
        };
        await scan(".output/public");
        assert.deepEqual(errors, []);
        console.log(
            "Security/SEO passed: nonce rotation/tamper resistance, CSP blocks inline injection, security/cache headers, per-page SSR metadata, canonical/OG, live locale updates, robots/sitemap, private/404 noindex, share image, crawlable links, no environment secrets in client assets.",
        );
    } finally {
        await browser.close();
    }
})().catch((error) => {
    console.error(error);
    process.exit(1);
});
