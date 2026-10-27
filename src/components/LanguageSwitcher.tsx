import { useTranslation } from "react-i18next";
import { localeCookie } from "../i18n/locale";
export function LanguageSwitcher() {
    const { t, i18n } = useTranslation();
    const locale = i18n.resolvedLanguage === "en" ? "en" : "vi";
    const nextLocale = locale === "vi" ? "en" : "vi";
    const label = t(nextLocale === "en" ? "common:switchToEnglish" : "common:switchToVietnamese");
    return (
        <button
            type="button"
            data-testid="language-switcher"
            data-locale={locale}
            aria-label={label}
            title={label}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg border border-line bg-background transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            onClick={async () => {
                document.cookie = `${localeCookie}=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
                await i18n.changeLanguage(nextLocale);
            }}
        >
            <svg
                viewBox="0 0 60 40"
                className="h-5 w-[30px] overflow-hidden rounded-[3px]"
                aria-hidden="true"
            >
                {locale === "vi" ? (
                    <>
                        <path fill="#DA251D" d="M0 0h60v40H0z" />
                        <path
                            fill="#FF0"
                            d="m30 8 2.8 8.6h9l-7.3 5.3 2.8 8.6-7.3-5.3-7.3 5.3 2.8-8.6-7.3-5.3h9z"
                        />
                    </>
                ) : (
                    <>
                        <path fill="#012169" d="M0 0h60v40H0z" />
                        <path stroke="#FFF" strokeWidth="8" d="m0 0 60 40M60 0 0 40" />
                        <path stroke="#C8102E" strokeWidth="3" d="m0 0 60 40M60 0 0 40" />
                        <path stroke="#FFF" strokeWidth="13" d="M30 0v40M0 20h60" />
                        <path stroke="#C8102E" strokeWidth="8" d="M30 0v40M0 20h60" />
                    </>
                )}
            </svg>
        </button>
    );
}
