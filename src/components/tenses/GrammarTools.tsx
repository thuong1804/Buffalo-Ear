import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BookA, ChevronDown, List, Search, X } from "lucide-react";
import { irregularVerbs, searchIrregularVerbs } from "../../core/irregular-verbs";
import type { Locale } from "../../i18n/locale";

function VerbGuide() {
    const { t } = useTranslation("tenses");
    return (
        <div
            data-testid="verb-guide-content"
            className="space-y-5 border-t border-line p-5 leading-relaxed sm:p-6"
        >
            <p className="text-muted">{t("verbGuideIntro")}</p>
            <div className="grid gap-4 md:grid-cols-2">
                {(["mainBe", "otherVerb"] as const).map((kind) => (
                    <section key={kind} className="space-y-3 rounded-xl bg-soft p-4">
                        <h3 className="text-xl font-semibold">{t(`${kind}Title`)}</h3>
                        <p>{t(`${kind}Text`)}</p>
                        <p className="border-l-2 border-accent pl-3 text-primary-ink">
                            {t(`${kind}Examples`)}
                        </p>
                    </section>
                ))}
            </div>
            <section aria-labelledby="verb-comparison-title">
                <h3 id="verb-comparison-title" className="mb-3 text-xl font-semibold">
                    {t("comparisonTitle")}
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                    {(["Be", "Other"] as const).map((kind) => (
                        <div key={kind} className="rounded-xl border border-line p-4">
                            <h4 className="mb-2 font-semibold text-primary-ink">
                                {t(`comparison${kind}`)}
                            </h4>
                            <p>{t(`comparison${kind}Examples`)}</p>
                        </div>
                    ))}
                </div>
                <p className="mt-3 text-muted">{t("comparisonNote")}</p>
            </section>
            <section className="space-y-3 rounded-xl bg-soft p-4">
                <h3 className="text-xl font-semibold">{t("auxiliaryBeTitle")}</h3>
                <p>{t("auxiliaryBeText")}</p>
                <p className="border-l-2 border-accent pl-3 text-primary-ink">
                    {t("auxiliaryBeExamples")}
                </p>
            </section>
            <p>{t("verbGuideMistakes")}</p>
            <p className="text-muted">{t("verbGuideNuance")}</p>
        </div>
    );
}

function IrregularVerbs() {
    const { t, i18n } = useTranslation("tenses");
    const locale: Locale = i18n.resolvedLanguage === "en" ? "en" : "vi";
    const [query, setQuery] = useState("");
    const tableRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const results = searchIrregularVerbs(query);
    const updateQuery = (value: string) => {
        setQuery(value);
        tableRef.current?.scrollTo({ top: 0 });
    };

    return (
        <div className="space-y-4 border-t border-line p-5 leading-relaxed sm:p-6">
            <p>{t("irregularIntro")}</p>
            <p className="text-muted">{t("irregularVariants")}</p>
            <div>
                <label htmlFor="irregular-search" className="mb-2 block font-semibold">
                    {t("verbSearchLabel")}
                </label>
                <div className="flex items-center gap-2 rounded-lg border border-line bg-background px-3 focus-within:outline-2 focus-within:outline-primary">
                    <Search size={20} className="shrink-0 text-muted" aria-hidden="true" />
                    <input
                        ref={inputRef}
                        id="irregular-search"
                        type="search"
                        value={query}
                        onChange={(event) => updateQuery(event.target.value)}
                        placeholder={t("verbSearchPlaceholder")}
                        className="min-h-12 min-w-0 flex-1 bg-transparent py-2 outline-none [&::-webkit-search-cancel-button]:appearance-none"
                        aria-controls="irregular-verb-table"
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={() => {
                                updateQuery("");
                                inputRef.current?.focus();
                            }}
                            aria-label={t("verbSearchClear")}
                            className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-lg hover:bg-surface focus-visible:outline-2 focus-visible:outline-primary"
                        >
                            <X size={18} aria-hidden="true" />
                        </button>
                    )}
                </div>
            </div>
            <p role="status" data-testid="irregular-count" className="text-muted">
                {t("verbResultCount", { count: results.length, total: irregularVerbs.length })}
            </p>
            <p id="verb-table-hint" className="text-muted">
                {t("verbTableHint")}
            </p>
            <div
                ref={tableRef}
                role="region"
                aria-label={t("irregularTitle")}
                aria-describedby="verb-table-hint"
                tabIndex={0}
                data-testid="irregular-scroll"
                className="h-96 overflow-auto overscroll-contain rounded-xl border border-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
                <table
                    id="irregular-verb-table"
                    className="w-full min-w-[560px] border-collapse text-left"
                >
                    <caption className="sr-only">{t("irregularTitle")}</caption>
                    <thead className="sticky top-0 z-10 bg-surface">
                        <tr>
                            {["verbBase", "verbPast", "verbParticiple", "verbMeaning"].map(
                                (key) => (
                                    <th
                                        key={key}
                                        scope="col"
                                        className="border-b border-line px-4 py-3 font-semibold"
                                    >
                                        {t(key)}
                                    </th>
                                ),
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {results.map((verb) => (
                            <tr
                                key={verb.base}
                                data-testid="irregular-row"
                                className="border-b border-line last:border-0 hover:bg-soft"
                            >
                                <th
                                    scope="row"
                                    lang="en"
                                    className="px-4 py-3 align-top font-semibold text-primary-ink"
                                >
                                    {verb.base}
                                </th>
                                <td lang="en" className="px-4 py-3 align-top">
                                    {verb.past}
                                </td>
                                <td lang="en" className="px-4 py-3 align-top">
                                    {verb.participle}
                                </td>
                                <td lang={locale} className="max-w-sm min-w-40 px-4 py-3 align-top">
                                    {verb.meaning[locale]}
                                    {verb.note && (
                                        <p className="mt-1 text-muted">{verb.note[locale]}</p>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {!results.length && (
                            <tr>
                                <td colSpan={4} className="px-4 py-8 text-muted">
                                    {t("verbEmpty")}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <a
                href="https://dictionary.cambridge.org/grammar/british-grammar/table-of-irregular-verbs"
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center text-primary-ink underline underline-offset-4"
            >
                {t("verbSource")}
            </a>
        </div>
    );
}

export function GrammarTools() {
    const { t } = useTranslation("tenses");
    return (
        <div className="mb-8 space-y-3">
            {(
                [
                    {
                        id: "verb-guide",
                        title: "verbGuideTitle",
                        preview: "verbGuidePreview",
                        Icon: BookA,
                        Content: VerbGuide,
                    },
                    {
                        id: "irregular-verbs",
                        title: "irregularTitle",
                        preview: "irregularPreview",
                        Icon: List,
                        Content: IrregularVerbs,
                    },
                ] as const
            ).map(({ id, title, preview, Icon, Content }) => (
                <details
                    key={id}
                    id={id}
                    data-testid={id}
                    className="group rounded-xl border border-line bg-background"
                >
                    <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 rounded-xl p-4 hover:bg-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
                        <Icon size={22} className="shrink-0 text-primary-ink" aria-hidden="true" />
                        <div className="min-w-0 flex-1">
                            <h2 className="text-lg font-semibold">{t(title)}</h2>
                            <p className="mt-1 text-muted">{t(preview)}</p>
                        </div>
                        <ChevronDown
                            size={20}
                            className="shrink-0 text-muted group-open:rotate-180"
                            aria-hidden="true"
                        />
                    </summary>
                    <Content />
                </details>
            ))}
        </div>
    );
}
