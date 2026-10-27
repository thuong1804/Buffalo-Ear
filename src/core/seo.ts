import type { Locale } from "../i18n/locale";
import type { SiteConfig } from "./site";
import { publicPaths } from "./site";
import viApp from "../i18n/locales/vi/app.json";
import enApp from "../i18n/locales/en/app.json";

const pages = {
    "/": { title: "pageTitle", description: "pageDescription" },
    "/library": { title: "seoLibraryTitle", description: "seoLibraryDescription" },
    "/dialogues": { title: "seoDialoguesTitle", description: "seoDialoguesDescription" },
    "/tenses": { title: "seoGrammarTitle", description: "seoGrammarDescription" },
    "/progress": { title: "seoProgressTitle", description: "seoProgressDescription" },
    "/login": { title: "seoLoginTitle", description: "seoLoginDescription" },
} as const;

export function getPageSeo(pathname: string, locale: Locale, site: SiteConfig) {
    const page = pages[pathname as keyof typeof pages];
    const strings: Record<string, string> = locale === "vi" ? viApp : enApp;
    return {
        title: strings[page?.title ?? "notFound"] + (page ? "" : " · Buffalo Ear"),
        description: strings[page?.description ?? "pageDescription"],
        canonical: page ? site.origin + pathname : undefined,
        robots:
            site.indexable && publicPaths.includes(pathname as (typeof publicPaths)[number])
                ? "index, follow"
                : "noindex, follow",
        image: site.origin + "/social-card.png",
        locale: locale === "vi" ? "vi_VN" : "en_GB",
    };
}
