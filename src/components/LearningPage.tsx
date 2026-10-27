import { useTranslation } from "react-i18next";
import type { CSSProperties } from "react";
import { ArrowUpRight, AudioLines, BookOpen, Check, Headphones, Target } from "lucide-react";
import { words } from "../core/data";
import { LevelFilter, SoundPicker, Stat } from "./index";
import { Practice } from "./Practice";
import { Library } from "./Library";
import { Progress } from "./Progress";
import { usePracticeContext } from "../hooks/practice-context";
import { useLearning } from "../hooks/useLearning";
export function LearningPage() {
    const { t } = useTranslation();

    const learning = useLearning();
    const {
        setMode,
        setSelected,
        setReview,
        setGroup,
        history,
        settings,
        setSettings,
        view,
        group,
        selected,
        mode,
        review,
        round,
        answer,
        setAnswer,
        result,
        revealed,
        setRevealed,
        session,
        setSession,
        inputRef,
        speech,
        summary,
        learned,
        pool,
        todayCount,
        resetPool,
        changeGroup,
        selectSound,
        nextWord,
        submit,
        start,
        navigate,
        toggleReview,
    } = usePracticeContext();
    return (
        <>
            <section
                data-testid="intro"
                className="flex items-center justify-between gap-7.5 pt-12 pb-9 max-[800px]:pt-9 max-[800px]:pb-7.5 max-[600px]:px-1 max-[600px]:pt-7 max-[600px]:pb-7 min-[1500px]:pt-15.5 min-[1500px]:pb-11 [&_h1]:my-4 [&_h1]:text-[clamp(38px,4.4vw,58px)] [&_h1]:leading-[1.2] [&_h1]:font-semibold [&_h1]:tracking-[-0.025em] max-[800px]:[&_h1]:text-[46px] max-[600px]:[&_h1]:mt-3 max-[600px]:[&_h1]:mb-2.5 max-[600px]:[&_h1]:text-4xl max-[600px]:[&_h1]:leading-[1.4] [&_h1_em]:font-medium [&_h1_em]:text-primary [&_h1_em]:not-italic [&>div>p]:text-base [&>div>p]:leading-[1.9] [&>div>p]:text-muted"
            >
                <div>
                    <div
                        data-testid="eyebrow"
                        className="flex flex-wrap items-center gap-2 text-base leading-relaxed font-normal tracking-normal text-muted"
                    >
                        <i
                            data-testid="green-dot"
                            className="inline-block size-1.5 shrink-0 rounded-full bg-primary"
                        />{" "}
                        {t("intro:tagline")}
                    </div>
                    <h1>
                        {view === "practice" ? (
                            <>
                                {t("intro:listenTitle")} <em>{t("intro:rememberTitle")}</em>
                            </>
                        ) : view === "library" ? (
                            <>
                                {t("intro:wordsTitle")} <em>{t("intro:stepTitle")}</em>
                            </>
                        ) : (
                            <>
                                {t("intro:consistentTitle")} <em>{t("intro:growTitle")}</em>
                            </>
                        )}
                    </h1>
                    <p>
                        {view === "practice"
                            ? t("intro:practiceDescription")
                            : view === "library"
                              ? t("intro:libraryDescription")
                              : t("intro:progressDescription")}
                        <br />
                        {view === "practice"
                            ? t("intro:practiceSubtitle")
                            : view === "library"
                              ? t("intro:librarySubtitle", { count: words.length })
                              : t("intro:progressSubtitle")}
                    </p>
                </div>
                <div
                    data-testid="daily-card"
                    className="flex min-w-[274px] items-start gap-3.5 rounded-xl border border-line bg-paper px-6 py-5.5 max-[1100px]:min-w-[245px] max-[1100px]:p-5 max-[800px]:hidden [&_p]:mt-2.5 [&_p]:text-base [&_p]:text-muted [&_small]:text-base [&_small]:font-normal [&_small]:text-muted [&_strong]:mt-2 [&_strong]:mb-3 [&_strong]:block [&_strong]:text-[29px] [&_strong]:font-semibold [&_strong]:text-primary-ink [&>div:last-child]:flex-1"
                >
                    <div
                        data-testid="daily-icon"
                        className="grid size-9 shrink-0 place-items-center rounded-full bg-line text-primary-ink"
                    >
                        <Target size={22} />
                    </div>
                    <div>
                        <span>{t("intro:dailyGoal")}</span>
                        <strong>
                            {Math.min(todayCount, 20)} <small>{t("intro:goalTotal")}</small>
                        </strong>
                        <div
                            data-testid="goal-track"
                            className="h-1 overflow-hidden rounded-sm bg-line [&>span]:block [&>span]:h-full [&>span]:w-(--goal) [&>span]:bg-primary [&>span]:transition-[width] [&>span]:duration-250 motion-reduce:[&>span]:transition-none"
                            role="progressbar"
                            aria-label={t("intro:dailyGoal")}
                            aria-valuenow={Math.min(todayCount, 20)}
                            aria-valuemin={0}
                            aria-valuemax={20}
                        >
                            <span
                                style={
                                    {
                                        "--goal": `${Math.min(todayCount / 20, 1) * 100}%`,
                                    } as CSSProperties
                                }
                            />
                        </div>
                        <p>{todayCount >= 20 ? t("intro:goalDone") : t("intro:habit")}</p>
                    </div>
                </div>
            </section>
            {view !== "progress" && (
                <LevelFilter
                    level={settings.level}
                    onChange={(level) => {
                        setSettings((s) => ({ ...s, level }));
                        resetPool(selected, group, mode, review, level);
                    }}
                />
            )}
            {view === "practice" ? (
                <>
                    <div
                        data-testid="workspace"
                        className="grid grid-cols-[1.12fr_1fr] items-stretch gap-6 max-[900px]:grid-cols-1 max-[800px]:gap-4 max-[600px]:gap-4.5"
                    >
                        <SoundPicker
                            selected={selected}
                            speech={speech}
                            group={group}
                            mode={mode}
                            onSelect={selectSound}
                            onGroup={changeGroup}
                            onMode={(value) => {
                                setMode(value);
                                resetPool(selected, group, value);
                            }}
                            onClear={() => {
                                setSelected([]);
                                resetPool([]);
                            }}
                            count={pool.length}
                        />
                        <Practice
                            busy={learning.busy}
                            round={round}
                            answer={answer}
                            setAnswer={setAnswer}
                            result={result}
                            revealed={revealed}
                            reveal={() => setRevealed(true)}
                            submit={submit}
                            next={nextWord}
                            speech={speech}
                            settings={settings}
                            setSettings={setSettings}
                            inputRef={inputRef}
                            count={pool.length}
                            session={session}
                            start={start}
                            review={review}
                            onReview={toggleReview}
                            mistakeCount={summary.mistakes.length}
                        />
                    </div>
                    <div
                        data-testid="practice-note"
                        className="flex items-center gap-3 py-6.5 max-[600px]:gap-2.5 max-[600px]:py-6 [&_p]:text-base [&_p]:leading-[1.9] [&_p>span]:block [&_p>span]:text-muted [&_strong]:block [&_strong]:font-medium"
                    >
                        <span
                            data-testid="note-icon"
                            className="grid size-[38px] shrink-0 place-items-center rounded-full bg-surface text-primary-ink"
                        >
                            <Headphones size={20} />
                        </span>
                        <p>
                            <strong>{t("intro:takeTime")}</strong>
                            <span>{t("intro:practiceNote")}</span>
                        </p>
                        <span
                            data-testid="keyboard-note"
                            className="ml-auto flex items-center gap-2 text-base text-muted max-[1100px]:hidden [&>kbd]:rounded-sm [&>kbd]:border [&>kbd]:border-line [&>kbd]:bg-background [&>kbd]:px-1 [&>kbd]:py-1 [&>kbd]:text-base"
                        >
                            <kbd>Enter</kbd> {t("intro:enterHint")}
                            <span>·</span> <kbd>Alt →</kbd> {t("intro:nextHint")}
                        </span>
                    </div>
                    <div
                        data-testid="overview-strip"
                        className="grid grid-cols-3 gap-4.5 rounded-xl border border-line bg-soft px-6 py-6 max-[600px]:grid-cols-1 max-[600px]:gap-5 max-[600px]:px-3.5 max-[600px]:py-4.5 [&>button]:col-span-full [&>button]:inline-flex [&>button]:min-h-11 [&>button]:items-center [&>button]:justify-center [&>button]:gap-2 [&>button]:border-t [&>button]:border-line [&>button]:pt-4 [&>button]:text-base [&>button]:text-primary-ink [&>button]:hover:text-ink"
                    >
                        <Stat icon={AudioLines} value="44" label={t("intro:soundStat")} />
                        <Stat icon={BookOpen} value={words.length} label={t("intro:wordStat")} />
                        <Stat icon={Check} value={summary.learned} label={t("intro:learnedStat")} />
                        <button onClick={() => navigate("progress")}>
                            {t("intro:viewProgress")}
                            <ArrowUpRight size={18} />
                        </button>
                    </div>
                </>
            ) : view === "library" ? (
                <Library
                    selected={selected}
                    group={group}
                    mode={mode}
                    level={settings.level}
                    learned={learned}
                    onListen={speech.speak}
                    audioError={speech.error}
                />
            ) : (
                <Progress
                    remote={Boolean(learning.account)}
                    busy={learning.busy}
                    history={history}
                    summary={summary}
                    onReset={() => {
                        void learning.resetHistory();
                        setSession({ attempted: 0, correct: 0 });
                    }}
                    onReview={() => {
                        navigate("practice");
                        setReview(true);
                        setGroup("all");
                        setSelected([]);
                        setSettings((s) => ({ ...s, level: "all" }));
                        resetPool([], "all", mode, true, "all");
                    }}
                />
            )}
        </>
    );
}
