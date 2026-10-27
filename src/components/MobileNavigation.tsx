import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ChevronDown, CircleHelp, Menu, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { View } from "../core/types";
import { AccountMenu } from "./AccountMenu";
import { LanguageSwitcher } from "./LanguageSwitcher";

export interface NavigationItem {
    id: View;
    label: string;
    Icon: LucideIcon;
}

interface NavigationProps {
    items: readonly NavigationItem[];
    view: View | "login";
    onNavigate: (view: View, hash?: string) => void;
    onHelp: () => void;
}

function NavigationDrawer({
    items,
    view,
    onNavigate,
    onHelp,
    onDismiss,
}: NavigationProps & { onDismiss: () => void }) {
    const { t } = useTranslation();
    const hash = useRouterState({ select: (state) => state.location.hash });
    const dialogRef = useRef<HTMLDialogElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const closing = useRef(false);
    const [tensesExpanded, setTensesExpanded] = useState(view === "tenses");

    useEffect(() => {
        const dialog = dialogRef.current!;
        const panel = panelRef.current!;
        const body = document.body;
        const previousOverflow = body.style.overflow;
        const previousPadding = body.style.paddingRight;
        const scrollbar = window.innerWidth - document.documentElement.clientWidth;
        if (scrollbar > 0)
            body.style.paddingRight = `${parseFloat(getComputedStyle(body).paddingRight) + scrollbar}px`;
        body.style.overflow = "hidden";
        dialog.showModal();
        const animation = panel.animate(
            [{ transform: "translateX(100%)" }, { transform: "translateX(0)" }],
            {
                duration: matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 220,
                easing: "ease-out",
            },
        );
        const desktop = matchMedia("(min-width: 768px)");
        const onResize = () => {
            if (desktop.matches) {
                dialog.close();
                onDismiss();
            }
        };
        desktop.addEventListener("change", onResize);
        return () => {
            animation.cancel();
            panel.getAnimations().forEach((running) => running.cancel());
            desktop.removeEventListener("change", onResize);
            dialog.close();
            body.style.overflow = previousOverflow;
            body.style.paddingRight = previousPadding;
        };
    }, []);

    const close = async (afterClose?: () => void) => {
        if (closing.current) return;
        closing.current = true;
        const dialog = dialogRef.current!;
        const animation = panelRef.current!.animate(
            [
                { transform: getComputedStyle(panelRef.current!).transform },
                { transform: "translateX(100%)" },
            ],
            {
                duration: matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 180,
                easing: "ease-in",
                fill: "forwards",
            },
        );
        try {
            await animation.finished;
        } catch {
            return;
        }
        if (!dialog.isConnected) return;
        dialog.close();
        onDismiss();
        afterClose?.();
    };

    return (
        <dialog
            ref={dialogRef}
            id="mobile-navigation"
            data-testid="mobile-navigation"
            aria-labelledby="mobile-menu-title"
            onCancel={(event) => {
                event.preventDefault();
                void close();
            }}
            onClick={(event) => {
                if (event.target === event.currentTarget) void close();
            }}
            onKeyDown={(event) => {
                if (event.key !== "Tab") return;
                const controls = Array.from(
                    event.currentTarget.querySelectorAll<HTMLElement>(
                        "button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])",
                    ),
                ).filter((control) => control.getClientRects().length > 0);
                const first = controls[0];
                const last = controls.at(-1);
                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last?.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first?.focus();
                }
            }}
            className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-transparent p-0 text-base text-ink backdrop:bg-ink/40"
        >
            <div
                ref={panelRef}
                data-testid="mobile-menu-panel"
                className="ml-auto flex h-full w-[min(88vw,360px)] flex-col border-l border-line bg-background shadow-xl"
            >
                <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-5 py-4">
                    <h2 id="mobile-menu-title" className="text-xl font-semibold">
                        {t("app:menu")}
                    </h2>
                    <button
                        type="button"
                        autoFocus
                        aria-label={t("app:closeMenu")}
                        onClick={() => void close()}
                        className="grid size-11 cursor-pointer place-items-center rounded-lg border border-line hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                        <X size={22} aria-hidden="true" />
                    </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
                    <nav aria-label={t("app:navigation")} className="space-y-1">
                        {items.map(({ id, label, Icon }) => (
                            <div key={id}>
                                <div className="flex gap-1">
                                    <button
                                        type="button"
                                        aria-current={view === id ? "page" : undefined}
                                        onClick={() => void close(() => onNavigate(id))}
                                        className="flex min-h-12 min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-muted hover:bg-soft focus-visible:outline-2 focus-visible:outline-primary aria-[current=page]:bg-ink aria-[current=page]:font-semibold aria-[current=page]:text-background"
                                    >
                                        <Icon size={20} className="shrink-0" aria-hidden="true" />
                                        {label}
                                    </button>
                                    {id === "tenses" && (
                                        <button
                                            type="button"
                                            aria-label={t("app:tenseSubmenu")}
                                            aria-expanded={tensesExpanded}
                                            aria-controls="mobile-tense-children"
                                            onClick={() => setTensesExpanded((value) => !value)}
                                            className="grid size-12 shrink-0 cursor-pointer place-items-center rounded-lg text-muted hover:bg-surface focus-visible:outline-2 focus-visible:outline-primary"
                                        >
                                            <ChevronDown
                                                size={20}
                                                className={tensesExpanded ? "rotate-180" : ""}
                                                aria-hidden="true"
                                            />
                                        </button>
                                    )}
                                </div>
                                {id === "tenses" && tensesExpanded && (
                                    <ul
                                        id="mobile-tense-children"
                                        className="my-2 ml-5 space-y-1 border-l border-line pl-3"
                                    >
                                        {[
                                            { hash: "tense-cards", label: "tenses:cardsTitle" },
                                            { hash: "verb-guide", label: "tenses:verbGuideTitle" },
                                            {
                                                hash: "irregular-verbs",
                                                label: "tenses:irregularTitle",
                                            },
                                        ].map((child) => (
                                            <li key={child.hash}>
                                                <button
                                                    type="button"
                                                    data-testid={`mobile-child-${child.hash}`}
                                                    aria-current={
                                                        view === "tenses" && hash === child.hash
                                                            ? "location"
                                                            : undefined
                                                    }
                                                    onClick={() =>
                                                        void close(() =>
                                                            onNavigate("tenses", child.hash),
                                                        )
                                                    }
                                                    className="flex min-h-11 w-full cursor-pointer items-center rounded-lg px-3 py-2 text-left leading-relaxed text-muted hover:bg-surface focus-visible:outline-2 focus-visible:outline-primary aria-[current=location]:bg-surface aria-[current=location]:text-primary-ink"
                                                >
                                                    {t(child.label)}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </nav>
                    <div className="mt-5 border-t border-line px-3 pt-4 [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center">
                        <AccountMenu />
                    </div>
                </div>
                <div className="flex shrink-0 items-center justify-between gap-3 border-t border-line px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                    <button
                        type="button"
                        onClick={() => void close(onHelp)}
                        className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-muted hover:bg-surface focus-visible:outline-2 focus-visible:outline-primary"
                    >
                        <CircleHelp size={20} aria-hidden="true" />
                        {t("app:help")}
                    </button>
                    <LanguageSwitcher />
                </div>
            </div>
        </dialog>
    );
}

export function MobileNavigation(props: NavigationProps) {
    const { t } = useTranslation();
    const pathname = useRouterState({ select: (state) => state.location.pathname });
    const [open, setOpen] = useState(false);
    useEffect(() => {
        setOpen(false);
    }, [pathname]);

    return (
        <>
            <button
                type="button"
                data-testid="mobile-menu-trigger"
                aria-label={t("app:openMenu")}
                aria-expanded={open}
                aria-controls="mobile-navigation"
                aria-haspopup="dialog"
                onClick={() => setOpen(true)}
                className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-lg border border-line text-ink hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:hidden"
            >
                <Menu size={23} aria-hidden="true" />
            </button>
            {open && <NavigationDrawer {...props} onDismiss={() => setOpen(false)} />}
        </>
    );
}
