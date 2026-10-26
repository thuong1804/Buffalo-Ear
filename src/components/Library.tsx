import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Search,
  X,
} from "lucide-react";
import type { Group, Level, MatchMode } from "../core/types";
import { words } from "../core/data";
import { getPool } from "../core/learning";
import { SectionTitle } from "./index";

export function Library({
  selected,
  group,
  mode,
  level,
  learned,
  onListen,
  audioError,
}: {
  selected: string[];
  group: Group;
  mode: MatchMode;
  level: Level;
  learned: Set<string>;
  onListen: (word: string) => void;
  audioError: string;
}) {
  const { t } = useTranslation();

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  useEffect(() => setPage(0), [level, selected, group, mode]);
  const pool = useMemo(
    () =>
      getPool(selected, group, mode, null, level).filter((w) =>
        `${w.word} ${w.meaning}`
          .toLocaleLowerCase("vi")
          .includes(query.toLocaleLowerCase("vi").trim()),
      ),
    [selected, group, mode, query, level],
  );
  const pages = Math.max(1, Math.ceil(pool.length / 24));
  const safePage = Math.min(page, pages - 1);
  return (
    <section
      data-testid="library-panel"
      className="min-w-0 rounded-2xl border border-line bg-surface p-5 shadow-panel min-[901px]:p-7 min-[1500px]:p-8"
    >
      <SectionTitle number={t("library:eyebrow")} title={t("library:title")}>
        <span
          data-testid="count-pill"
          className="rounded-full bg-surface px-3 py-2 text-base whitespace-nowrap text-primary-ink"
        >
          {t("common:wordCount", { count: words.length })}
        </span>
      </SectionTitle>
      <p
        data-testid="section-description"
        className="mt-2.5 text-base leading-[1.8] text-muted"
      >
        {t("library:description")}
      </p>
      {audioError && (
        <p
          role="alert"
          className="mt-3 rounded-lg border border-error bg-error-soft p-3 text-base text-error"
        >
          {t(audioError)}
        </p>
      )}
      <label
        data-testid="search-field"
        className="mt-6 mb-4.5 flex max-w-[580px] items-center gap-3 rounded-lg border border-line bg-background px-3.5 text-muted [&>button]:inline-flex [&>button]:min-h-11 [&>button]:min-w-8 [&>button]:items-center [&>button]:justify-center [&>input]:min-w-0 [&>input]:flex-1 [&>input]:border-0 [&>input]:bg-transparent [&>input]:py-4 [&>input]:text-base"
      >
        <Search size={18} />
        <span className="sr-only">{t("library:searchLabel")}</span>
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
          placeholder={t("library:searchPlaceholder")}
        />
        {query && (
          <button
            aria-label={t("library:clearSearch")}
            onClick={() => {
              setQuery("");
              setPage(0);
            }}
          >
            <X size={16} />
          </button>
        )}
      </label>
      <div
        data-testid="library-meta"
        className="mb-4 flex justify-between gap-4 text-base text-muted max-[600px]:flex-col max-[600px]:gap-2"
      >
        <span>{t("library:results", { count: pool.length })}</span>
        <span>{t("library:transcriptionNote")}</span>
      </div>
      <div
        data-testid="word-cards"
        className="grid grid-cols-4 gap-3 max-[1100px]:grid-cols-3 max-[800px]:grid-cols-2 max-[600px]:grid-cols-1 max-[600px]:gap-2.5"
      >
        {pool.slice(safePage * 24, safePage * 24 + 24).map((w) => (
          <article
            data-testid="word-card"
            className="relative flex items-center justify-between gap-2 rounded-[9px] border border-line bg-background p-4 max-[600px]:min-h-[150px] max-[600px]:items-start max-[600px]:p-4.5 [&_h3]:flex [&_h3]:items-center [&_h3]:gap-2 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:wrap-anywhere [&_h3_svg]:text-primary-ink [&_p]:mt-1.5 [&_p]:text-base [&_p]:wrap-anywhere [&_p]:text-muted max-[600px]:[&_p]:pb-8.5 [&>button]:inline-flex [&>button]:size-11 [&>button]:shrink-0 [&>button]:items-center [&>button]:justify-center [&>button]:rounded-full [&>button]:bg-surface [&>button]:text-primary-ink [&>button]:hover:bg-line max-[600px]:[&>button]:absolute max-[600px]:[&>button]:right-2 max-[600px]:[&>button]:bottom-2 [&>div]:min-w-0 max-[600px]:[&>div]:w-full"
            key={w.word}
          >
            <div>
              <h3 lang="en">
                {w.word}
                {learned.has(w.word) && (
                  <Check size={14} aria-label={t("library:learned")} />
                )}
              </h3>
              <span
                data-testid="ipa"
                className="font-ipa text-base wrap-anywhere text-primary-ink"
              >
                /{w.ipa}/
              </span>
              <span
                data-testid="word-level"
                className="ml-2 inline-block rounded-sm border border-line bg-surface px-1 text-base text-primary-ink"
                aria-label={t("filters:levelLabel", { level: w.level })}
              >
                {w.level}
              </span>
              <p lang="vi">{w.meaning}</p>
            </div>
            <button
              aria-label={t("library:listenLabel", { word: w.word })}
              title={t("library:listenTitle")}
              onClick={() => onListen(w.word)}
            >
              <Headphones size={19} />
            </button>
          </article>
        ))}
      </div>
      {!pool.length && (
        <div
          data-testid="empty-state"
          className="flex min-h-[300px] flex-col items-center justify-center gap-3 px-2.5 py-7.5 text-center text-primary-ink [&>h3]:text-lg [&>h3]:font-medium [&>p]:max-w-80 [&>p]:text-base [&>p]:text-muted"
        >
          <Search size={28} />
          <h3 lang="en">{t("library:emptyTitle")}</h3>
          <p>{t("library:emptyDescription")}</p>
        </div>
      )}
      <div
        data-testid="pagination"
        className="mt-6 flex items-center justify-center gap-5 text-base text-muted [&>button]:inline-flex [&>button]:size-11 [&>button]:items-center [&>button]:justify-center [&>button]:rounded-[7px] [&>button]:border [&>button]:border-line [&>button]:bg-background [&>button]:hover:bg-surface"
      >
        <button
          aria-label={t("library:previousPage")}
          disabled={safePage === 0}
          onClick={() => setPage(safePage - 1)}
        >
          <ChevronLeft size={18} />
        </button>
        <span>{t("library:pagination", { page: safePage + 1, pages })}</span>
        <button
          aria-label={t("library:nextPage")}
          disabled={safePage === pages - 1}
          onClick={() => setPage(safePage + 1)}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </section>
  );
}
