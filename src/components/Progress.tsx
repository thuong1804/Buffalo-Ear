import { useTranslation } from "react-i18next";
import type { CSSProperties } from "react";
import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  Ear,
  Headphones,
  RotateCcw,
} from "lucide-react";
import type { Attempt, Summary } from "../core/types";
import { words } from "../core/data";
import { SectionTitle, Stat, localDay } from "./index";

export function Progress({
  history,
  summary,
  onReview,
  onReset,
  remote = false,
  busy = false,
}: {
  history: Attempt[];
  summary: Summary;
  onReview: () => void;
  onReset: () => void;
  remote?: boolean;
  busy?: boolean;
}) {
  const { t, i18n } = useTranslation();

  const [confirm, setConfirm] = useState(false);
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - 6 + i);
    return {
      date,
      label: date.toLocaleDateString(
        i18n.resolvedLanguage === "en" ? "en-GB" : "vi-VN",
        { weekday: "short" },
      ),
      count: history.filter((h) => localDay(h.date) === localDay(date)).length,
    };
  });
  return (
    <section data-testid="progress-page" className="min-w-0">
      <div
        data-testid="progress-stats"
        className="mb-6 grid grid-cols-3 gap-5 max-[900px]:grid-cols-1 max-[800px]:gap-3 [&_strong]:text-3xl [&>div]:rounded-xl [&>div]:border [&>div]:border-line [&>div]:bg-surface [&>div]:p-6 max-[800px]:[&>div]:p-4.5"
      >
        <Stat
          icon={BookOpen}
          value={t("progress:learnedCount", {
            learned: summary.learned,
            total: words.length,
          })}
          label={t("progress:learned")}
        />
        <Stat
          icon={Headphones}
          value={summary.attempted}
          label={t("progress:attempts")}
        />
        <Stat
          icon={Check}
          value={
            summary.attempted
              ? Math.round((summary.correct / summary.attempted) * 100) + "%"
              : "—"
          }
          label={t("progress:accuracy")}
        />
      </div>
      <div
        data-testid="progress-columns"
        className="grid grid-cols-[1.1fr_1fr] gap-6 max-[900px]:grid-cols-1 max-[800px]:gap-4"
      >
        <section
          data-testid="panel"
          className="min-w-0 rounded-2xl border border-line bg-surface p-5 shadow-panel min-[901px]:p-7 min-[1500px]:p-8"
        >
          <SectionTitle
            number={t("progress:daily")}
            title={t("progress:rhythm")}
          />
          <p
            data-testid="section-description"
            className="mt-2.5 text-base leading-[1.8] text-muted"
          >
            {t("progress:chartDescription")}
          </p>
          <div
            data-testid="activity-chart"
            className="mt-7.5 grid grid-cols-7 gap-4 max-[600px]:gap-1.5"
          >
            {days.map((d) => (
              <div
                key={d.label}
                data-testid="activity-day"
                className="flex min-w-0 flex-col items-center gap-2.5 text-base text-muted [&>span]:whitespace-nowrap [&>strong]:font-medium [&>strong]:text-primary-ink"
              >
                <strong>{t("common:number", { value: d.count })}</strong>
                <div
                  data-testid="bar-track"
                  className="flex h-[150px] w-full max-w-[35px] items-end overflow-hidden rounded-md bg-soft [&>span]:h-(--activity) [&>span]:w-full [&>span]:rounded-md [&>span]:bg-primary"
                >
                  <span
                    style={
                      {
                        "--activity": `${d.count ? Math.max(5, (d.count / Math.max(20, ...days.map((x) => x.count))) * 100) : 0}%`,
                      } as CSSProperties
                    }
                  />
                </div>
                <span>{d.label}</span>
              </div>
            ))}
          </div>
          <p data-testid="chart-note" className="mt-6 text-base text-muted">
            {t("progress:goalHint")}
          </p>
        </section>
        <section
          data-testid="recent-panel"
          className="min-w-0 rounded-2xl border border-line bg-surface p-5 shadow-panel min-[901px]:p-7 min-[1500px]:p-8"
        >
          <SectionTitle
            number={t("progress:reflect")}
            title={t("progress:history")}
          />
          {history.length ? (
            <ul
              data-testid="history-list"
              className="my-5 list-none p-0 [&_strong]:font-medium [&>li]:flex [&>li]:items-center [&>li]:gap-2.5 [&>li]:border-b [&>li]:border-line [&>li]:py-3 [&>li]:text-base max-[600px]:[&>li]:flex-wrap [&>li>span:last-child]:ml-auto [&>li>span:last-child]:text-base [&>li>span:last-child]:text-muted max-[600px]:[&>li>span:last-child]:ml-[35px] max-[600px]:[&>li>span:last-child]:basis-full"
            >
              {history
                .slice(-8)
                .reverse()
                .map((h, i) => (
                  <li key={i}>
                    <span
                      data-testid="history-dot"
                      data-correct={h.correct}
                      className="grid size-6.5 shrink-0 place-items-center rounded-full bg-error-soft text-error data-[correct=true]:bg-success/10 data-[correct=true]:text-success"
                    >
                      {h.correct ? (
                        <Check size={13} />
                      ) : (
                        <RotateCcw size={13} />
                      )}
                    </span>
                    <strong>{h.word}</strong>
                    <span>
                      {h.correct
                        ? t("common:correct")
                        : h.matches
                          ? t("progress:hinted")
                          : t("progress:needsReview")}
                    </span>
                  </li>
                ))}
            </ul>
          ) : (
            <div
              data-testid="empty-state"
              className="flex min-h-[300px] flex-col items-center justify-center gap-3 px-2.5 py-7.5 text-center text-primary-ink [&>h3]:text-lg [&>h3]:font-medium [&>p]:max-w-80 [&>p]:text-base [&>p]:text-muted"
            >
              <Ear size={32} />
              <h3>{t("progress:emptyTitle")}</h3>
              <p>{t("progress:emptyDescription")}</p>
            </div>
          )}
          <button
            data-testid="secondary-button"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line bg-background px-4 py-2.5 text-base font-medium text-primary-ink hover:bg-surface max-[600px]:w-full"
            disabled={!summary.mistakes.length}
            onClick={onReview}
          >
            {t("progress:reviewCount", { count: summary.mistakes.length })}{" "}
            <ArrowRight size={16} />
          </button>
        </section>
      </div>
      <div
        data-testid="storage-note"
        className="flex flex-wrap items-center justify-between gap-4 gap-y-3 px-0.5 py-5 text-base text-muted"
      >
        <span>
          {remote ? t("progress:accountStorage") : t("progress:browserStorage")}
        </span>
        {!confirm ? (
          <button
            data-testid="text-button"
            className="inline-flex min-h-11 items-center justify-center gap-2 border-0 bg-transparent px-1 py-1.5 text-base font-normal whitespace-nowrap text-muted hover:text-primary-ink"
            onClick={() => setConfirm(true)}
          >
            {t("progress:reset")}
          </button>
        ) : (
          <span
            data-testid="reset-confirm"
            className="flex flex-wrap items-center gap-3 gap-y-3 whitespace-normal max-[600px]:gap-2"
          >
            {t("progress:resetConfirm")}{" "}
            <button
              data-testid="text-button"
              className="inline-flex min-h-11 items-center justify-center gap-2 border-0 bg-transparent px-1 py-1.5 text-base font-normal whitespace-nowrap text-error hover:text-primary-ink"
              disabled={busy}
              onClick={() => {
                onReset();
                setConfirm(false);
              }}
            >
              {t("common:delete")}
            </button>
            <button
              data-testid="text-button"
              className="inline-flex min-h-11 items-center justify-center gap-2 border-0 bg-transparent px-1 py-1.5 text-base font-normal whitespace-nowrap text-muted hover:text-primary-ink"
              onClick={() => setConfirm(false)}
            >
              {t("common:cancel")}
            </button>
          </span>
        )}
      </div>
    </section>
  );
}
