import { Trans, useTranslation } from "react-i18next";
import type { Dispatch, FormEvent, RefObject, SetStateAction } from "react";
import {
    ArrowRight,
    Check,
    Eye,
    Headphones,
    Keyboard,
    RotateCcw,
    Search,
    Volume2,
} from "lucide-react";
import type { Outcome, Round, SessionCount, Settings } from "../core/types";
import type useSpeech from "../hooks/useSpeech";
import { SectionTitle } from "./index";

export function Practice({
    round,
    answer,
    setAnswer,
    result,
    revealed,
    reveal,
    submit,
    next,
    speech,
    settings,
    setSettings,
    inputRef,
    count,
    session,
    start,
    review,
    onReview,
    mistakeCount,
    busy = false,
}: {
    round: Round;
    answer: string;
    setAnswer: (answer: string) => void;
    result: Outcome | null;
    revealed: boolean;
    reveal: () => void;
    submit: (e: FormEvent) => void;
    next: () => void;
    speech: ReturnType<typeof useSpeech>;
    settings: Settings;
    setSettings: Dispatch<SetStateAction<Settings>>;
    inputRef: RefObject<HTMLInputElement | null>;
    count: number;
    session: SessionCount;
    start: (word: string) => void;
    review: boolean;
    onReview: () => void;
    mistakeCount: number;
    busy?: boolean;
}) {
    const { t } = useTranslation();

    const current = round.deck[round.index];
    const visible = revealed || result;
    return (
        <section
            data-testid="practice-panel"
            className="flex min-w-0 flex-col rounded-2xl border border-line bg-practice p-5 shadow-panel min-[901px]:p-7 min-[1500px]:p-8"
            aria-labelledby="practice-heading"
        >
            <SectionTitle
                number={t("practice:step")}
                title={<span id="practice-heading">{t("practice:title")}</span>}
            >
                <span
                    data-testid="live-badge"
                    className="inline-flex items-center gap-1 rounded-full border border-line bg-background px-2 py-1.5 text-base font-normal whitespace-nowrap text-primary [&>i]:inline-block [&>i]:size-1 [&>i]:rounded-full [&>i]:bg-primary"
                >
                    <i /> {review ? t("practice:reviewMode") : t("common:practice")}
                </span>
            </SectionTitle>
            <div
                data-testid="practice-controls"
                className="flex flex-wrap items-center justify-between gap-2 gap-y-3 border-b border-line pt-5 pb-3 text-base font-normal text-primary-ink [&_select]:min-h-11 [&_select]:border-0 [&_select]:bg-transparent [&_select]:text-base [&_select]:text-primary-ink [&>label]:inline-flex [&>label]:items-center [&>label]:gap-1.5 [&>span]:flex [&>span]:items-center [&>span]:gap-2"
            >
                <span>
                    <Headphones size={14} /> {t("practice:poolCount", { count })}
                </span>
                <label htmlFor="rate">
                    {t("practice:speed")}{" "}
                    <select
                        id="rate"
                        value={settings.rate}
                        onChange={(e) =>
                            setSettings((s) => ({
                                ...s,
                                rate: Number(e.target.value) as Settings["rate"],
                            }))
                        }
                    >
                        <option value="0.7">{t("practice:rateValue", { value: 0.7 })}</option>
                        <option value="0.85">{t("practice:rateValue", { value: 0.85 })}</option>
                        <option value="1">{t("practice:rateValue", { value: 1 })}</option>
                    </select>
                </label>
            </div>
            <label
                htmlFor="voice-choice"
                className="mt-3 flex min-w-0 flex-wrap items-center gap-2 text-base text-muted max-[600px]:flex-col max-[600px]:items-start"
            >
                {t("practice:voice")}
                <select
                    id="voice-choice"
                    data-testid="voice-choice"
                    className="min-h-11 max-w-full min-w-0 flex-1 rounded-lg border border-line bg-background px-3 text-base text-ink"
                    value={speech.voiceChoice}
                    onChange={(event) => speech.changeVoice(event.target.value)}
                >
                    <option value="device">{t("practice:automaticVoice")}</option>
                    {speech.deviceVoices.length > 0 && (
                        <optgroup label={t("practice:deviceVoices")}>
                            {speech.deviceVoices.map((voice) => (
                                <option key={voice.voiceURI} value={`device:${voice.voiceURI}`}>
                                    {voice.name} · {voice.lang}
                                </option>
                            ))}
                        </optgroup>
                    )}
                    {speech.voiceChoice.startsWith("device:") &&
                        !speech.deviceVoices.some(
                            (voice) => `device:${voice.voiceURI}` === speech.voiceChoice,
                        ) && (
                            <option value={speech.voiceChoice}>{t("practice:missingVoice")}</option>
                        )}
                </select>
            </label>
            {current ? (
                <>
                    <div
                        data-testid="listen-stage"
                        className="flex flex-1 flex-col items-center justify-center pt-8 pb-6"
                    >
                        <span
                            data-testid="eyebrow"
                            className="flex flex-wrap items-center gap-2 text-base leading-relaxed font-normal tracking-normal text-muted"
                        >
                            {visible ? t("practice:answerTitle") : t("practice:hiddenTitle")}
                        </span>
                        <div
                            data-testid="secret-word"
                            lang="en"
                            data-revealed={Boolean(visible)}
                            className="min-h-[59px] max-w-full pt-2 text-center text-4xl font-normal tracking-[8px] wrap-anywhere data-[revealed=true]:tracking-normal max-[600px]:text-[38px]"
                            aria-live="polite"
                        >
                            {visible ? current.word : "••••••"}
                        </div>
                        <div
                            data-testid="pronunciation"
                            className="min-h-5.5 text-center font-pronunciation text-base leading-[1.7] text-muted"
                        >
                            {visible ? (
                                <>
                                    /{current.ipa}/ · <span lang="vi">{current.meaning}</span>
                                </>
                            ) : (
                                t("practice:listenPrompt")
                            )}
                        </div>
                        <button
                            data-testid="listen-button"
                            data-speaking={speech.speaking && !speech.sampleSound}
                            className="my-4 inline-flex size-19 shrink-0 items-center justify-center rounded-full border-6 border-accent bg-primary text-background shadow-listen hover:bg-accent hover:text-ink data-[speaking=true]:animate-speaking motion-reduce:animate-none max-[600px]:mt-5 max-[600px]:mb-4 max-[600px]:size-[86px]"
                            onClick={() => start(current.word)}
                            aria-label={t("practice:listenLabel")}
                        >
                            <Volume2 size={30} strokeWidth={1.6} />
                        </button>
                        <span
                            data-testid="listen-caption"
                            className="text-base leading-[1.7] text-muted"
                        >
                            {speech.speaking && !speech.sampleSound
                                ? t("practice:speaking")
                                : t("practice:listenCaption")}
                        </span>
                        <button
                            data-testid="text-button"
                            className="mt-1 inline-flex min-h-11 items-center justify-center gap-2 border-0 bg-transparent px-1 py-1.5 text-base font-normal whitespace-nowrap text-primary-ink hover:text-primary-ink"
                            disabled={Boolean(visible) || busy}
                            onClick={reveal}
                        >
                            <Eye size={14} />
                            {visible ? t("practice:revealed") : t("practice:reveal")}
                        </button>
                    </div>
                    {speech.error && (
                        <p
                            data-testid="audio-error"
                            className="rounded-lg border border-error bg-error-soft p-3 text-base text-error"
                            role="alert"
                        >
                            {t(speech.error)}
                        </p>
                    )}
                    <form
                        onSubmit={submit}
                        data-testid="answer-form"
                        className="[&>label]:mb-2.5 [&>label]:block [&>label]:text-base [&>label]:font-normal"
                    >
                        <label htmlFor="answer">{t("practice:answerLabel")}</label>
                        <div
                            data-testid="answer-row"
                            data-result={
                                result ? (result.correct ? "correct" : "incorrect") : undefined
                            }
                            className="group/answer flex gap-2 max-[800px]:flex-wrap [&>button]:inline-flex [&>button]:items-center [&>button]:justify-center [&>button]:gap-2 [&>button]:rounded-[7px] [&>button]:border-0 [&>button]:bg-primary [&>button]:px-4 [&>button]:py-2.5 [&>button]:text-base [&>button]:font-medium [&>button]:whitespace-nowrap [&>button]:text-background [&>button]:hover:bg-ink max-[600px]:[&>button]:min-h-12 max-[600px]:[&>button]:w-full min-[601px]:max-[800px]:[&>button]:w-full [&>button_span]:text-line [&>input]:min-h-12 [&>input]:w-full [&>input]:min-w-0 [&>input]:flex-1 [&>input]:rounded-[7px] [&>input]:border [&>input]:border-line [&>input]:bg-background [&>input]:px-3 [&>input]:py-3 [&>input]:text-base [&>input]:group-data-[result=correct]/answer:border-success [&>input]:group-data-[result=incorrect]/answer:border-error [&>input]:placeholder:text-muted max-[600px]:[&>input]:basis-full"
                        >
                            <input
                                ref={inputRef}
                                id="answer"
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key !== "Enter") return;
                                    if (e.repeat || e.nativeEvent.isComposing) {
                                        e.preventDefault();
                                        return;
                                    }
                                    if (result?.correct && !busy) {
                                        e.preventDefault();
                                        next();
                                    }
                                }}
                                placeholder={t("practice:answerPlaceholder")}
                                autoComplete="off"
                                autoCapitalize="none"
                                spellCheck={false}
                                required
                                maxLength={100}
                                readOnly={Boolean(result) || busy}
                                aria-describedby="answer-feedback"
                            />
                            <button type="submit" disabled={Boolean(result) || busy}>
                                {busy ? t("practice:saving") : t("practice:check")} <span>↵</span>
                            </button>
                        </div>
                        <div
                            id="answer-feedback"
                            data-testid="feedback"
                            data-result={
                                result ? (result.correct ? "correct" : "incorrect") : undefined
                            }
                            className="flex min-h-10 flex-wrap items-start gap-1 pt-2.5 text-base leading-[1.7] text-muted data-[result=correct]:text-success data-[result=incorrect]:text-error max-[600px]:min-h-[59px] max-[600px]:pt-3 [&>svg]:mt-0.5"
                            role="status"
                        >
                            {result ? (
                                result.correct ? (
                                    <>
                                        <Check
                                            size={16}
                                            className="motion-safe:animate-choice-check"
                                        />{" "}
                                        {t("practice:correct")}
                                    </>
                                ) : result.matches ? (
                                    t("practice:hinted")
                                ) : (
                                    <>
                                        <Trans
                                            ns="practice"
                                            i18nKey="incorrect"
                                            values={{ word: current.word }}
                                            components={{ strong: <strong lang="en" /> }}
                                        />
                                    </>
                                )
                            ) : (
                                <>
                                    <Keyboard size={13} /> {t("practice:enterHint")}
                                </>
                            )}
                        </div>
                    </form>
                    <div
                        data-testid="practice-actions"
                        className="flex flex-wrap items-center justify-between gap-2 gap-y-3 max-[600px]:items-stretch max-[600px]:gap-3"
                    >
                        <label
                            data-testid="switch-label"
                            className="relative flex min-h-11 cursor-pointer flex-wrap items-center gap-2 text-base font-normal text-muted [&>input]:absolute [&>input]:left-0 [&>input]:h-6 [&>input]:w-7.5 [&>input]:opacity-0"
                        >
                            <input
                                type="checkbox"
                                className="peer"
                                checked={settings.auto}
                                onChange={(e) =>
                                    setSettings((s) => ({ ...s, auto: e.target.checked }))
                                }
                            />
                            <span
                                data-testid="switch"
                                className="pointer-events-none block h-[17px] w-[29px] rounded-full bg-muted p-[3px] peer-checked:bg-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-primary-ink after:block after:size-[11px] after:rounded-full after:bg-background after:transition-transform after:duration-200 after:content-[''] peer-checked:after:translate-x-3 motion-reduce:after:transition-none"
                            />
                            {t("practice:auto")}
                        </label>
                        <button
                            data-testid="next-button"
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border-0 bg-primary px-4 py-2.5 text-base font-medium text-background hover:bg-ink"
                            onClick={next}
                            disabled={busy}
                        >
                            {t("practice:next")}
                            <ArrowRight size={16} />
                        </button>
                    </div>
                    <div
                        data-testid="session-stats"
                        className="mt-5 grid grid-cols-3 gap-2 border-t border-line pt-5 [&_span]:mt-1 [&_span]:block [&_span]:text-base [&_span]:leading-normal [&_span]:font-normal [&_span]:tracking-normal [&_span]:text-muted [&_strong]:block [&_strong]:text-[25px] [&_strong]:font-normal [&_strong]:tabular-nums max-[600px]:[&_strong]:text-[28px] [&>div]:border-r [&>div]:border-line [&>div]:text-center [&>div:last-child]:border-0"
                    >
                        <div>
                            <strong>{t("common:number", { value: session.attempted })}</strong>
                            <span>{t("practice:attempted")}</span>
                        </div>
                        <div>
                            <strong>{t("common:number", { value: session.correct })}</strong>
                            <span>{t("common:correct")}</span>
                        </div>
                        <div>
                            <strong>
                                {session.attempted
                                    ? Math.round((session.correct / session.attempted) * 100) + "%"
                                    : "—"}
                            </strong>
                            <span>{t("practice:accuracy")}</span>
                        </div>
                    </div>
                </>
            ) : (
                <div
                    data-testid="empty-state"
                    className="flex min-h-[300px] flex-col items-center justify-center gap-3 px-2.5 py-7.5 text-center text-primary-ink [&>h3]:text-lg [&>h3]:font-medium [&>p]:max-w-80 [&>p]:text-base [&>p]:text-muted"
                >
                    <Search size={32} />
                    <h3>{review ? t("practice:reviewDone") : t("practice:emptyTitle")}</h3>
                    <p>
                        {review
                            ? t("practice:reviewDoneDescription")
                            : t("practice:emptyDescription")}
                    </p>
                </div>
            )}
            <button
                data-testid="review-link"
                className="mx-auto mt-2.5 -mb-3 inline-flex min-h-11 items-center justify-center gap-2 border-0 bg-transparent text-center text-base whitespace-normal text-primary-ink"
                disabled={!review && !mistakeCount}
                onClick={onReview}
            >
                <RotateCcw size={13} />
                {review
                    ? t("practice:allWords")
                    : t("practice:reviewCount", { count: mistakeCount })}
            </button>
        </section>
    );
}
