import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowUpRight, BookOpenText, Info, X } from "lucide-react";
import { tenses } from "../core/tenses";
import type { GrammarExample, GrammarForms, Tense, TenseGroup } from "../core/tenses";
import type { Locale } from "../i18n/locale";
import { GrammarTools } from "./tenses/GrammarTools";
import { useRouterState } from "@tanstack/react-router";

const groups = ["all", "present", "past", "future"] as const;

function Example({ value, locale }: { value: GrammarExample; locale: Locale }) {
    return (
        <div className="space-y-1 leading-relaxed">
            <p lang="en">{value.en}</p>
            {locale === "vi" && (
                <p className="text-muted" lang="vi">
                    {value.vi}
                </p>
            )}
        </div>
    );
}

function Forms({ value, locale }: { value: GrammarForms; locale: Locale }) {
    const { t } = useTranslation("tenses");
    return (
        <dl className="divide-y divide-line overflow-hidden rounded-xl border border-line">
            {(["affirmative", "negative", "question"] as const).map((kind) => (
                <div
                    key={kind}
                    className="grid gap-2 p-4 sm:grid-cols-[140px_minmax(0,1fr)] sm:gap-4"
                >
                    <dt className="font-semibold text-primary-ink">{t(kind)}</dt>
                    <dd className="min-w-0 space-y-2">
                        <p lang="en" className="leading-relaxed font-semibold">
                            {value[kind].formula}
                        </p>
                        <Example value={value[kind].example} locale={locale} />
                    </dd>
                </div>
            ))}
        </dl>
    );
}

function TenseDetail({
    tense,
    locale,
    onClose,
}: {
    tense: Tense;
    locale: Locale;
    onClose: () => void;
}) {
    const { t } = useTranslation("tenses");
    const dialogRef = useRef<HTMLDialogElement>(null);
    const closeDetail = () => {
        dialogRef.current?.close();
        onClose();
    };
    useEffect(() => {
        const dialog = dialogRef.current!;
        const body = document.body;
        const overflow = body.style.overflow;
        const padding = body.style.paddingRight;
        const scrollbar = window.innerWidth - document.documentElement.clientWidth;
        if (scrollbar > 0) {
            body.style.paddingRight = `${parseFloat(getComputedStyle(body).paddingRight) + scrollbar}px`;
        }
        body.style.overflow = "hidden";
        dialog.showModal();
        return () => {
            dialog.close();
            body.style.overflow = overflow;
            body.style.paddingRight = padding;
        };
    }, []);

    return (
        <dialog
            ref={dialogRef}
            data-testid="tense-detail"
            aria-labelledby="tense-detail-title"
            onCancel={(event) => {
                event.preventDefault();
                closeDetail();
            }}
            className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-4xl overflow-y-auto overscroll-contain rounded-2xl border border-line bg-background p-0 text-base text-ink shadow-xl backdrop:bg-ink/40"
        >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-line bg-background p-5 sm:px-8">
                <div>
                    <p className="mb-1 text-primary-ink">{t(tense.group)}</p>
                    <h2 id="tense-detail-title" className="text-2xl font-semibold">
                        {tense.name[locale]}
                    </h2>
                    {locale === "vi" && (
                        <p className="mt-1 text-muted" lang="en">
                            {tense.name.en}
                        </p>
                    )}
                </div>
                <button
                    type="button"
                    autoFocus
                    onClick={closeDetail}
                    aria-label={t("close")}
                    className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-lg border border-line hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                    <X size={22} aria-hidden="true" />
                </button>
            </div>
            <div className="space-y-8 p-5 leading-relaxed sm:p-8 [&_h3]:mb-3 [&_h3]:text-xl [&_h3]:font-semibold">
                <section aria-labelledby="tense-uses-title">
                    <h3 id="tense-uses-title">{t("uses")}</h3>
                    <ul className="list-disc space-y-2 pl-5 marker:text-primary">
                        {tense.uses.map((use) => (
                            <li key={use.en}>{use[locale]}</li>
                        ))}
                    </ul>
                </section>
                <section aria-labelledby="tense-active-title">
                    <h3 id="tense-active-title">{t("active")}</h3>
                    <Forms value={tense.active} locale={locale} />
                </section>
                <section aria-labelledby="tense-be-title">
                    <h3 id="tense-be-title">{t("be")}</h3>
                    <p className="mb-4 text-muted">{tense.be.note[locale]}</p>
                    {tense.be.forms && <Forms value={tense.be.forms} locale={locale} />}
                    {tense.be.example && (
                        <div className="rounded-xl bg-soft p-4">
                            <Example value={tense.be.example} locale={locale} />
                        </div>
                    )}
                </section>
                <section aria-labelledby="tense-passive-title">
                    <h3 id="tense-passive-title">{t("passive")}</h3>
                    <p className="mb-4 text-muted">{t("passiveNote")}</p>
                    {tense.passive.kind === "common" ? (
                        <Forms value={tense.passive.forms} locale={locale} />
                    ) : (
                        <div
                            className="space-y-3 rounded-xl border border-line bg-soft p-4"
                            data-testid="rare-passive"
                        >
                            <p className="flex items-center gap-2 font-semibold">
                                <Info size={18} className="shrink-0" aria-hidden="true" />
                                {t("rare")}
                            </p>
                            <p>{tense.passive.note[locale]}</p>
                            <p className="text-muted">{t("referenceFormula")}</p>
                            <p lang="en" className="font-semibold">
                                {tense.passive.formula}
                            </p>
                            <p className="font-semibold">{t("alternative")}</p>
                            <Example value={tense.passive.alternative} locale={locale} />
                        </div>
                    )}
                </section>
                <section aria-labelledby="tense-markers-title">
                    <h3 id="tense-markers-title">{t("markers")}</h3>
                    <ul className="mb-3 flex flex-wrap gap-2" lang="en">
                        {tense.markers.map((marker) => (
                            <li key={marker} className="rounded-lg bg-surface px-3 py-1.5">
                                {marker}
                            </li>
                        ))}
                    </ul>
                    <p className="text-muted">{t("markersNote")}</p>
                </section>
                <section aria-labelledby="tense-mistakes-title">
                    <h3 id="tense-mistakes-title">{t("mistakes")}</h3>
                    <ul className="list-disc space-y-2 pl-5 marker:text-primary">
                        {tense.mistakes.map((mistake) => (
                            <li key={mistake.en}>{mistake[locale]}</li>
                        ))}
                    </ul>
                    <p className="mt-4 text-muted">{t("questionNote")}</p>
                </section>
                <aside className="rounded-xl bg-soft p-4 text-muted">
                    <p className="mb-2 font-semibold text-ink">{t("legendTitle")}</p>
                    <p>{t("legend")}</p>
                </aside>
                <button
                    type="button"
                    onClick={closeDetail}
                    className="min-h-11 cursor-pointer rounded-lg bg-ink px-5 py-2 text-background hover:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                    {t("backToCards")}
                </button>
            </div>
        </dialog>
    );
}

export function Tenses() {
    const { t, i18n } = useTranslation("tenses");
    const location = useRouterState({ select: (state) => state.location });
    useEffect(() => {
        if (!["tense-cards", "verb-guide", "irregular-verbs"].includes(location.hash)) return;
        const target = document.getElementById(location.hash);
        if (target instanceof HTMLDetailsElement) target.open = true;
        target?.scrollIntoView({ block: "start" });
    }, [location]);
    const locale: Locale = i18n.resolvedLanguage === "en" ? "en" : "vi";
    const [group, setGroup] = useState<TenseGroup | "all">("all");
    const [selected, setSelected] = useState<Tense | null>(null);
    const cards = group === "all" ? tenses : tenses.filter((tense) => tense.group === group);

    return (
        <div data-testid="tenses-page" className="py-10 sm:py-14">
            <div className="mb-8 max-w-2xl">
                <p className="mb-3 flex items-center gap-2 text-primary-ink">
                    <BookOpenText size={20} aria-hidden="true" />
                    {t("eyebrow")}
                </p>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("title")}</h1>
                <p className="mt-4 leading-relaxed text-muted">{t("intro")}</p>
            </div>
            <GrammarTools />
            <div
                id="tense-cards"
                className="mb-6 flex flex-wrap items-center justify-between gap-4"
            >
                <div
                    role="group"
                    aria-label={t("filterLabel")}
                    className="grid w-full grid-cols-2 gap-1 rounded-xl border border-line bg-soft p-1 sm:flex sm:w-auto"
                >
                    {groups.map((id) => (
                        <button
                            type="button"
                            key={id}
                            data-testid={`tense-filter-${id}`}
                            aria-pressed={group === id}
                            onClick={() => setGroup(id)}
                            className="min-h-11 cursor-pointer rounded-lg px-5 py-2 text-muted transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary aria-pressed:bg-ink aria-pressed:text-background"
                        >
                            {t(id)}
                        </button>
                    ))}
                </div>
                <p role="status" className="text-muted">
                    {t("count", { count: cards.length })}
                </p>
            </div>
            <div
                data-testid="tense-grid"
                className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3"
            >
                {cards.map((tense) => (
                    <article key={tense.id} data-testid="tense-card" className="min-w-0">
                        <button
                            type="button"
                            data-testid={`tense-${tense.id}`}
                            aria-haspopup="dialog"
                            onClick={() => setSelected(tense)}
                            className="group flex h-full w-full cursor-pointer flex-col items-start rounded-2xl border border-line bg-paper p-5 text-left hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:p-6"
                        >
                            <span className="mb-4 rounded-md bg-surface px-2.5 py-1 text-primary-ink">
                                {t(tense.group)}
                            </span>
                            <h2 className="text-xl leading-snug font-semibold group-hover:text-primary-ink">
                                {tense.name[locale]}
                            </h2>
                            {locale === "vi" && (
                                <p className="mt-1 text-muted" lang="en">
                                    {tense.name.en}
                                </p>
                            )}
                            <p className="mt-3 mb-5 leading-relaxed text-muted">
                                {tense.summary[locale]}
                            </p>
                            <p
                                lang="en"
                                className="mb-5 border-l-2 border-accent pl-3 leading-relaxed"
                            >
                                {tense.active.affirmative.example.en}
                            </p>
                            <span className="mt-auto flex w-full items-center justify-between gap-2 font-semibold text-primary-ink">
                                {t("open")}
                                <ArrowUpRight
                                    size={20}
                                    className="transition-transform duration-160 motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5"
                                    aria-hidden="true"
                                />
                            </span>
                        </button>
                    </article>
                ))}
            </div>
            <aside className="mt-8 rounded-xl border border-line p-5 leading-relaxed text-muted">
                <p>{t("overviewNote")}</p>
                <details className="mt-3">
                    <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-primary-ink">
                        {t("legendTitle")} +
                    </summary>
                    <p className="pt-2">{t("legend")}</p>
                </details>
            </aside>
            <div className="mt-6 text-muted">
                <p>{t("sources")}</p>
                <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-2 [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center [&_a]:text-primary-ink [&_a]:underline [&_a]:underline-offset-4">
                    <li>
                        <a
                            href="https://dictionary.cambridge.org/grammar/british-grammar/passive-forms"
                            target="_blank"
                            rel="noreferrer"
                        >
                            {t("sourcePassive")}
                        </a>
                    </li>
                    <li>
                        <a
                            href="https://dictionary.cambridge.org/grammar/british-grammar/be-"
                            target="_blank"
                            rel="noreferrer"
                        >
                            {t("sourceBe")}
                        </a>
                    </li>
                    <li>
                        <a
                            href="https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/future-continuous-future-perfect"
                            target="_blank"
                            rel="noreferrer"
                        >
                            {t("sourceFuture")}
                        </a>
                    </li>
                </ul>
            </div>
            {selected && (
                <TenseDetail tense={selected} locale={locale} onClose={() => setSelected(null)} />
            )}
        </div>
    );
}
