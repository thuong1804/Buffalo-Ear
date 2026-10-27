import { randomBytes } from "node:crypto";
import handler, { createServerEntry } from "@tanstack/react-start/server-entry";
import { getSiteConfig, publicPaths, robotsText, sitemapXml } from "./core/site";
import { securityHeaders } from "./server/security-headers";

export default createServerEntry({
    async fetch(request, options) {
        const url = new URL(request.url);
        const site = getSiteConfig(process.env);
        const nonce = randomBytes(24).toString("base64");
        // Always overwrite a caller-supplied value; a nonce belongs to this response only.
        request.headers.set("x-buffalo-csp-nonce", nonce);
        const response =
            url.pathname === "/robots.txt"
                ? new Response(robotsText(site), {
                      headers: { "Content-Type": "text/plain; charset=utf-8" },
                  })
                : url.pathname === "/sitemap.xml"
                  ? new Response(sitemapXml(site), {
                        headers: { "Content-Type": "application/xml; charset=utf-8" },
                    })
                  : await handler.fetch(request, options);
        const headers = new Headers(response.headers);
        for (const [name, value] of Object.entries(
            securityHeaders(nonce, url.protocol === "https:"),
        )) {
            headers.set(name, value);
        }
        headers.append("Vary", "Cookie");
        if (
            !site.indexable ||
            !publicPaths.includes(url.pathname as (typeof publicPaths)[number]) ||
            response.status >= 400
        ) {
            headers.set("X-Robots-Tag", "noindex, follow");
        }
        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers,
        });
    },
});
