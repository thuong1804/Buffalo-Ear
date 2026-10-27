import { test } from "node:test";
import assert from "node:assert/strict";
import { getSiteConfig, publicPaths, robotsText, sitemapXml } from "../src/core/site";
import { getPageSeo } from "../src/core/seo";
import { securityHeaders } from "../src/server/security-headers";

test("only public production pages are indexable; previews and local are excluded", () => {
    const production = getSiteConfig({ VERCEL_ENV: "production" });
    assert.equal(production.origin, "https://buffalo-ear.vercel.app");
    assert.equal(production.indexable, true);
    for (const env of [
        {},
        { NODE_ENV: "development" },
        { VERCEL_ENV: "preview", SITE_INDEXABLE: "true" },
    ]) {
        const site = getSiteConfig(env);
        assert.equal(site.indexable, false);
        assert.equal(robotsText(site), "User-agent: *\nDisallow: /\n");
        assert.ok(!sitemapXml(site).includes("<loc>"));
    }
    assert.ok(
        robotsText(production).includes("Sitemap: https://buffalo-ear.vercel.app/sitemap.xml"),
    );
    for (const locale of ["vi", "en"] as const) {
        const titles = publicPaths.map((path) => getPageSeo(path, locale, production).title);
        assert.equal(new Set(titles).size, publicPaths.length);
        for (const path of publicPaths) {
            const seo = getPageSeo(path, locale, production);
            assert.equal(seo.canonical, production.origin + path);
            assert.equal(seo.robots, "index, follow");
            assert.ok(sitemapXml(production).includes(`<loc>${seo.canonical}</loc>`));
            assert.ok(seo.description.length > 50);
        }
        for (const path of ["/login", "/progress", "/missing"]) {
            assert.equal(getPageSeo(path, locale, production).robots, "noindex, follow");
            assert.ok(!sitemapXml(production).includes(production.origin + path));
        }
        assert.equal(getPageSeo("/missing", locale, production).canonical, undefined);
    }
});

test("canonical origin cannot contain credentials, query parameters or an insecure public host", () => {
    for (const value of [
        "https://user:password@example.com",
        "https://example.com/path",
        "https://example.com/?token=secret",
        "https://example.com/#x",
        "http://example.com",
        "javascript:alert(1)",
    ]) {
        assert.throws(() => getSiteConfig({ SITE_URL: value }));
    }
    assert.equal(
        getSiteConfig({ SITE_URL: "https://learn.example.com/" }).origin,
        "https://learn.example.com",
    );
});

test("CSP requires script nonces and blocks framing while dynamic responses cannot be shared", () => {
    const headers = securityHeaders("random-test-nonce", true);
    const scriptPolicy = headers["Content-Security-Policy"]
        .split(";")
        .find((value) => value.trim().startsWith("script-src "))!;
    assert.ok(scriptPolicy.includes("'nonce-random-test-nonce'"));
    assert.ok(!scriptPolicy.includes("unsafe-inline"));
    assert.ok(!scriptPolicy.includes("unsafe-eval"));
    assert.ok(headers["Content-Security-Policy"].includes("frame-ancestors 'none'"));
    assert.equal(headers["Cache-Control"], "private, no-store");
    assert.equal(headers["Vercel-CDN-Cache-Control"], "no-store");
    assert.ok(headers["Strict-Transport-Security"]);
    assert.equal(securityHeaders("test", false)["Strict-Transport-Security"], undefined);
});
