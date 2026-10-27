import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
    BookOpen,
    BookOpenText,
    ChartNoAxesCombined,
    CircleHelp,
    Ear,
    Headphones,
    MessagesSquare,
    X,
} from "lucide-react";
import type { View } from "./core/types";
import { usePractice } from "./hooks/usePractice";
import { PracticeContext } from "./hooks/practice-context";
import { useLearning } from "./hooks/useLearning";
import { AccountMenu } from "./components/AccountMenu";
import { MobileNavigation } from "./components/MobileNavigation";

const viewPaths = {
    practice: "/",
    library: "/library",
    progress: "/progress",
    dialogues: "/dialogues",
    tenses: "/tenses",
} as const satisfies Record<View, string>;

function getCurrentView(pathname: string): View | "login" {
    switch (pathname) {
        case "/library":
            return "library";
        case "/progress":
            return "progress";
        case "/dialogues":
            return "dialogues";
        case "/tenses":
            return "tenses";
        case "/login":
            return "login";
        default:
            return "practice";
    }
}

export default function App() {
    const { t } = useTranslation();

    const pathname = useRouterState({
        select: (state) => state.location.pathname,
    });
    const view = getCurrentView(pathname);
    const routeNavigate = useNavigate();
    const practice = usePractice(view, (next: View, hash?: string) => {
        if (hash && next === "tenses" && view === "tenses") {
            const target = document.getElementById(hash);
            if (target instanceof HTMLDetailsElement) target.open = true;
        }
        void routeNavigate({
            to: viewPaths[next],
            hash: hash ?? "",
        });
    });
    const { navigate } = practice;
    const [showHelp, setShowHelp] = useState(false);
    const learning = useLearning();
    const nav = [
        { id: "practice", label: t("common:practice"), Icon: Headphones },
        { id: "dialogues", label: t("dialogues:nav"), Icon: MessagesSquare },
        { id: "library", label: t("common:library"), Icon: BookOpen },
        { id: "progress", label: t("common:progress"), Icon: ChartNoAxesCombined },
        { id: "tenses", label: t("tenses:nav"), Icon: BookOpenText },
    ] as const;

    let loadingMessage = "";
    if (!learning.ready) loadingMessage = t("app:loadingProgress");
    else if (learning.busy) loadingMessage = t("app:syncing");

    return (
        <PracticeContext.Provider value={practice}>
            <a
                data-testid="skip-link"
                className="fixed -top-20 left-5 z-50 bg-ink p-3 text-background focus:top-2"
                href="#main"
            >
                {t("app:skipContent")}
            </a>
            <header data-testid="site-header" className="border-b border-line bg-background">
                <div
                    data-testid="header-inner"
                    className="mx-auto flex min-h-22 max-w-[1536px] flex-wrap items-center justify-between gap-6 px-8 py-4 max-[1535px]:gap-3 max-md:min-h-18 max-md:flex-nowrap max-md:px-4 max-md:py-3"
                >
                    <a
                        data-testid="brand"
                        className="flex items-center gap-2.5 font-sans text-[25px] font-semibold tracking-[-0.035em] whitespace-nowrap no-underline max-[600px]:gap-2 max-[600px]:text-[20px]"
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            navigate("practice");
                        }}
                        aria-label={t("app:homeLabel")}
                    >
                        <span
                            data-testid="brand-mark"
                            className="grid size-[38px] -rotate-7 place-items-center rounded-xl bg-ink text-accent max-[600px]:size-[34px]"
                        >
                            <Ear size={26} />
                        </span>
                        <span>
                            BUFFALO EAR
                            <span
                                data-testid="brand-dot"
                                className="ml-1 align-super text-base tracking-normal"
                            >
                                ®
                            </span>
                        </span>
                    </a>
                    <nav
                        className="hidden gap-2 max-[1535px]:order-3 max-[1535px]:w-full max-[1535px]:justify-center md:flex"
                        aria-label={t("app:navigation")}
                    >
                        {nav.map(({ id, label, Icon }) => (
                            <button
                                key={id}
                                aria-current={view === id ? "page" : undefined}
                                data-testid="nav-link"
                                className="relative inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 py-2 text-base whitespace-nowrap text-muted after:pointer-events-none after:absolute after:inset-x-3 after:bottom-1 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-primary after:transition-transform after:duration-160 hover:bg-soft aria-[current=page]:bg-surface aria-[current=page]:font-semibold aria-[current=page]:text-primary-ink aria-[current=page]:after:scale-x-100 motion-reduce:after:transition-none"
                                onClick={() => navigate(id)}
                            >
                                <Icon size={16} />
                                {label}
                            </button>
                        ))}
                    </nav>
                    <div
                        data-testid="header-actions"
                        className="hidden max-w-full flex-wrap items-center justify-end gap-5 max-[1535px]:ml-auto md:flex"
                    >
                        <AccountMenu />
                        <button
                            data-testid="help-button"
                            className="inline-flex min-h-11 items-center justify-center gap-2 border-0 bg-transparent p-2 text-base text-muted hover:text-primary-ink max-[600px]:min-w-8 max-[600px]:p-0 max-[600px]:[&>span]:hidden"
                            onClick={() => setShowHelp((h) => !h)}
                            aria-expanded={showHelp}
                            aria-label={t("app:help")}
                            aria-controls="help"
                        >
                            <CircleHelp size={18} />
                            <span>{t("app:help")}</span>
                        </button>
                        <LanguageSwitcher />
                    </div>
                    <MobileNavigation
                        items={nav}
                        view={view}
                        onNavigate={navigate}
                        onHelp={() => setShowHelp(true)}
                    />
                </div>
            </header>
            <main id="main" className="mx-auto max-w-7xl px-8 max-[600px]:px-4">
                {showHelp && (
                    <aside
                        data-testid="help-panel"
                        className="mt-6 flex justify-between gap-5 rounded-xl border border-line bg-surface p-5 max-[600px]:gap-2.5 max-[600px]:p-4 [&_p]:mt-2 [&_p]:max-w-[900px] [&_p]:leading-[1.9] [&_strong]:font-medium [&>button]:inline-flex [&>button]:size-11 [&>button]:shrink-0 [&>button]:items-center [&>button]:justify-center [&>button]:self-start"
                        id="help"
                    >
                        <div>
                            <strong>{t("app:helpTitle")}</strong>
                            <p>{t("app:helpInstructions")}</p>
                            <p>{t("app:helpVoice")}</p>
                        </div>
                        <button aria-label={t("app:closeHelp")} onClick={() => setShowHelp(false)}>
                            <X size={18} />
                        </button>
                    </aside>
                )}
                {learning.storageError && (
                    <p
                        data-testid="audio-error"
                        className="rounded-lg border border-error bg-error-soft p-3 text-base text-error"
                        role="alert"
                    >
                        {t("errors:storage")}
                    </p>
                )}
                {learning.message && (
                    <p
                        data-testid="sync-notice"
                        className="mb-4 rounded-xl bg-soft px-4 py-3 text-ink"
                        role="status"
                    >
                        {t("app:syncCount", { count: learning.message.imported })}
                        {learning.message.skipped > 0 && (
                            <> {t("app:syncSkipped", { count: learning.message.skipped })}</>
                        )}
                    </p>
                )}
                {learning.error && (
                    <p
                        data-testid="audio-error"
                        className="rounded-lg border border-error bg-error-soft p-3 text-base text-error"
                        role="alert"
                    >
                        {t(learning.error)}{" "}
                        {learning.retryable && (
                            <button
                                data-testid="text-button"
                                className="inline-flex min-h-11 items-center justify-center gap-2 border-0 bg-transparent px-1 py-1.5 text-base font-normal whitespace-nowrap text-muted hover:text-primary-ink"
                                onClick={() => learning.retry()}
                            >
                                {t("common:retry")}
                            </button>
                        )}
                    </p>
                )}
                <span className="sr-only" role="status">
                    {loadingMessage}
                </span>
                <div
                    data-testid="learning-content"
                    inert={!learning.ready || learning.busy}
                    aria-busy={!learning.ready || learning.busy}
                >
                    <Outlet />
                </div>
            </main>
            <details
                data-testid="data-credits"
                className="mx-auto mt-6 max-w-[1216px] pb-3 text-base leading-[1.8] text-muted max-[1279px]:mx-8 max-[600px]:mx-4 [&_a]:text-primary-ink [&_a]:underline-offset-4 [&>p]:mt-2 [&>p]:max-w-[900px] [&>summary]:flex [&>summary]:min-h-9 [&>summary]:cursor-pointer [&>summary]:items-center [&>summary]:gap-1.5"
            >
                <summary>
                    {t("app:sources")}
                    <BookOpen size={12} />
                </summary>
                <p>{t("app:datasetNote")}</p>
                <p>
                    {t("app:meaningSource")}{" "}
                    <a
                        href="https://github.com/skypediacode/english-vietnamese-dictionary"
                        target="_blank"
                        rel="noreferrer"
                    >
                        Skypedia / MinhQND
                    </a>
                    {t("app:sourceLicense")}{" "}
                    <a
                        href="/licenses/dictionary-CC-BY-SA-4.0.txt"
                        target="_blank"
                        rel="noreferrer"
                    >
                        CC BY-SA 4.0
                    </a>
                    {t("app:levelSource")}{" "}
                    <a
                        href="https://github.com/chihyungchang/3000MostCommonEnglishWords"
                        target="_blank"
                        rel="noreferrer"
                    >
                        3000MostCommonEnglishWords
                    </a>
                    , theo{" "}
                    <a href="/licenses/cefr-Apache-2.0.txt" target="_blank" rel="noreferrer">
                        Apache 2.0
                    </a>
                    {t("app:extraEntries")}{" "}
                    <a href="/licenses/ATTRIBUTION.txt" target="_blank" rel="noreferrer">
                        {t("app:fullCredits")}
                    </a>
                    .
                </p>
            </details>
            <footer className="mx-auto mt-9 flex max-w-[1216px] flex-wrap items-center justify-between gap-4 border-t border-line pt-6 pb-7 text-base text-muted max-[1279px]:mx-8 max-[600px]:mx-4 max-[600px]:mt-7 max-[600px]:[&>span:last-child]:hidden">
                <span
                    data-testid="footer-brand"
                    className="flex flex-wrap items-center gap-2.5 font-sans text-base font-semibold tracking-normal text-ink max-[600px]:gap-2 [&>i]:size-1 [&>i]:rounded-full [&>i]:bg-primary [&>span]:font-normal [&>span]:text-muted"
                >
                    buffalo ear <i /> <span>{t("app:footerCredit")}</span>
                </span>
                <span>{t("app:footerTagline")}</span>
            </footer>
        </PracticeContext.Provider>
    );
}
