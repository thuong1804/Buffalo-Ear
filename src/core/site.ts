export const publicPaths = ["/", "/library", "/dialogues", "/tenses"] as const;
export interface SiteConfig {
    origin: string;
    indexable: boolean;
}

export function getSiteConfig(env: Record<string, string | undefined>): SiteConfig {
    const url = new URL(env.SITE_URL || "https://buffalo-ear.vercel.app");
    if (
        url.username ||
        url.password ||
        url.search ||
        url.hash ||
        url.pathname !== "/" ||
        !["https:", "http:"].includes(url.protocol) ||
        (url.protocol === "http:" && !["localhost", "127.0.0.1"].includes(url.hostname))
    )
        throw new Error(
            "SITE_URL must be a public HTTPS origin without credentials, path or query",
        );
    return {
        origin: url.origin,
        indexable:
            env.VERCEL_ENV !== "preview" &&
            (env.VERCEL_ENV === "production" || env.SITE_INDEXABLE === "true"),
    };
}

export function robotsText(site: SiteConfig) {
    return site.indexable
        ? `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /_serverFn/\nSitemap: ${site.origin}/sitemap.xml\n`
        : "User-agent: *\nDisallow: /\n";
}

export function sitemapXml(site: SiteConfig) {
    const escape = (value: string) =>
        value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
    const entries = site.indexable
        ? publicPaths.map((path) => `<url><loc>${escape(site.origin + path)}</loc></url>`).join("")
        : "";
    return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`;
}
