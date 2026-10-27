import { useState } from "react";
import { I18nextProvider, useTranslation } from "react-i18next";
import { createLocaleI18n } from "../i18n/instance";
import { createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { getSessionFn } from "../server/session";
import { LearningProvider } from "../hooks/useLearning";
import App from "../App";
import stylesheet from "../styles.css?url";
import { Seo } from "../components/Seo";
import { getCspNonce } from "../lib/csp-nonce";
export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
    beforeLoad: () => getSessionFn(),
    head: () => {
        return {
            meta: [
                { charSet: "utf-8" },
                { name: "viewport", content: "width=device-width, initial-scale=1" },
                { name: "csp-nonce", content: getCspNonce() ?? "" },
                { name: "theme-color", content: "#f2f8f7" },
            ],
            links: [
                { rel: "stylesheet", href: stylesheet },
                { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
                { rel: "stylesheet", href: "/fonts/nunito-sans.css" },
                { rel: "stylesheet", href: "/fonts/noto-sans-ipa.css" },
                {
                    rel: "preload",
                    href: "/fonts/nunito-sans-4.woff2",
                    as: "font",
                    type: "font/woff2",
                    crossOrigin: "anonymous",
                },
            ],
        };
    },
    component: Root,
    notFoundComponent: NotFound,
});
function NotFound() {
    const { t } = useTranslation();
    return (
        <p>
            {t("app:notFound")} <a href="/">{t("app:returnHome")}</a>
        </p>
    );
}
function Root() {
    const { locale } = Route.useRouteContext();
    const [instance] = useState(() => createLocaleI18n(locale));
    return (
        <I18nextProvider i18n={instance}>
            <Document />
        </I18nextProvider>
    );
}
function Document() {
    const { i18n } = useTranslation();
    const { queryClient, session, configured, googleEnabled, site } = Route.useRouteContext();
    return (
        <html lang={i18n.resolvedLanguage ?? "vi"}>
            <head>
                <HeadContent />
                <Seo site={site} />
            </head>
            <body className="bg-background font-sans text-base leading-[1.65] font-normal text-ink [font-synthesis:none] motion-reduce:[&_*]:animate-none! motion-reduce:[&_*]:scroll-auto! motion-reduce:[&_*]:transition-none! [&_:focus-visible]:outline-2 [&_:focus-visible]:outline-offset-4 [&_:focus-visible]:outline-primary-ink [&_button]:cursor-pointer [&_button]:transition-[color,background-color,border-color,transform] [&_button]:duration-160 [&_button_svg]:shrink-0 [&_button:disabled]:cursor-not-allowed [&_button:disabled]:opacity-55 motion-safe:[&_button:not(:disabled):active]:translate-y-px [&_h1]:text-balance [&_h2]:text-pretty [&_strong]:tabular-nums [&_svg]:inline-block [&_svg]:align-middle">
                <QueryClientProvider client={queryClient}>
                    <LearningProvider
                        session={session}
                        configured={configured}
                        googleEnabled={googleEnabled}
                    >
                        <App />
                    </LearningProvider>
                </QueryClientProvider>
                <Scripts />
            </body>
        </html>
    );
}
