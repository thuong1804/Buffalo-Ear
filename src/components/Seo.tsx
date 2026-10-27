import { useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { getPageSeo } from "../core/seo";
import type { SiteConfig } from "../core/site";

export function Seo({ site }: { site: SiteConfig }) {
    const { i18n } = useTranslation();
    const pathname = useRouterState({ select: (state) => state.location.pathname });
    const seo = getPageSeo(pathname, i18n.resolvedLanguage === "en" ? "en" : "vi", site);
    return (
        <>
            <title>{seo.title}</title>
            <meta name="description" content={seo.description} />
            <meta name="robots" content={seo.robots} />
            {seo.canonical && <link rel="canonical" href={seo.canonical} />}
            <meta property="og:type" content="website" />
            <meta property="og:site_name" content="Buffalo Ear" />
            <meta property="og:title" content={seo.title} />
            <meta property="og:description" content={seo.description} />
            {seo.canonical && <meta property="og:url" content={seo.canonical} />}
            <meta property="og:locale" content={seo.locale} />
            <meta property="og:image" content={seo.image} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta
                property="og:image:alt"
                content="Buffalo Ear — English listening, dictation and grammar"
            />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={seo.title} />
            <meta name="twitter:description" content={seo.description} />
            <meta name="twitter:image" content={seo.image} />
        </>
    );
}
