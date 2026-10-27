import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, Dispatch, FormEvent, KeyboardEvent, SetStateAction } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, Headphones, RotateCcw, Square } from "lucide-react";
import {
    dialogueLevels,
    dialogueTopics,
    loadDialogueLevel,
    gradeDialogueLine,
} from "../core/dialogues";
import type { DialogueLevel, DialogueLesson } from "../core/dialogues";
import useSpeech from "../hooks/useSpeech";
import { DialogueTopicPicker } from "./dialogues/DialogueTopicPicker";
import { DialogueAudioSettings } from "./dialogues/DialogueAudioSettings";
import { DialogueTranscript } from "./dialogues/DialogueTranscript";
import { DialogueFeedback } from "./dialogues/DialogueFeedback";
import { DialogueTips } from "./dialogues/DialogueTips";
import { dialogueButtonClassName } from "./dialogues/shared";
import type { DialogueExercise } from "./dialogues/shared";

function createEmptyExercise(length: number): DialogueExercise {
    return {
        answers: Array(length).fill(""),
        checked: Array(length).fill(false),
        revealed: Array(length).fill(false),
        assisted: Array(length).fill(false),
        index: 0,
    };
}

function dialogueQueryOptions(level: DialogueLevel) {
    return {
        queryKey: ["dialogue-content", level],
        queryFn: () => loadDialogueLevel(level),
        staleTime: Infinity,
    };
}

export function Dialogues() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [level, setLevel] = useState<DialogueLevel>("A1");
    const [rate, setRate] = useState(0.85);
    const [exercises, setExercises] = useState<Record<string, DialogueExercise>>({});
    const content = useQuery({
        ...dialogueQueryOptions(level),
        placeholderData: keepPreviousData,
    });
    return (
        <section data-testid="dialogues-page" className="my-8 min-w-0">
            <p className="text-base text-primary-ink">{t("dialogues:nav")}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                {t("dialogues:title")}
            </h1>
            <p className="mt-3 max-w-2xl text-base text-muted">{t("dialogues:description")}</p>
            <fieldset className="mt-6 rounded-xl border border-line bg-surface p-4">
                <legend className="px-2 text-lg font-semibold">{t("dialogues:difficulty")}</legend>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                    {dialogueLevels.map((item) => (
                        <button
                            key={item}
                            type="button"
                            aria-pressed={level === item}
                            data-testid={"dialogue-level-" + item}
                            className="min-h-11 rounded-lg border border-line bg-background px-3 py-2 text-base aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:font-semibold aria-pressed:text-background"
                            onClick={() => setLevel(item)}
                            onMouseEnter={() =>
                                void queryClient.prefetchQuery(dialogueQueryOptions(item))
                            }
                            onFocus={() =>
                                void queryClient.prefetchQuery(dialogueQueryOptions(item))
                            }
                        >
                            {item}
                        </button>
                    ))}
                </div>
                <p className="mt-3 min-h-[6.6em] text-base text-ink sm:min-h-[3.3em] lg:min-h-[1.65em]">
                    {t("dialogues:level" + level)}
                </p>
                <p className="mt-2 text-base text-muted">
                    {t("dialogues:catalogCount", {
                        levels: 6,
                        topics: 10,
                        lessons: 10,
                        total: 600,
                    })}
                </p>
                <p className="mt-2 text-base text-muted">{t("dialogues:cefrNote")}</p>
            </fieldset>
            <span role="status" className="sr-only">
                {content.isFetching ? t("dialogues:loading") : ""}
            </span>
            {content.isError && (
                <div role="alert" className="my-6 rounded-lg border border-error p-4 text-error">
                    {t("dialogues:loadError")}{" "}
                    <button
                        type="button"
                        className="min-h-11 px-3 underline"
                        onClick={() => void content.refetch()}
                    >
                        {t("common:retry")}
                    </button>
                </div>
            )}
            {content.isPending && (
                <div
                    aria-hidden="true"
                    className="mt-7 min-h-[1100px] rounded-2xl border border-line bg-soft"
                />
            )}
            <div
                data-testid="dialogue-content-region"
                className="transition-opacity duration-100 aria-busy:opacity-60 motion-reduce:transition-none"
                aria-busy={content.isPending || content.isPlaceholderData}
                inert={content.isPlaceholderData}
            >
                {content.data && (
                    <DialogueWorkspace
                        lessons={content.data}
                        requestedLevel={level}
                        rate={rate}
                        setRate={setRate}
                        exercises={exercises}
                        setExercises={setExercises}
                    />
                )}
            </div>
        </section>
    );
}

interface DialogueWorkspaceProps {
    lessons: DialogueLesson[];
    requestedLevel: DialogueLevel;
    rate: number;
    setRate: Dispatch<SetStateAction<number>>;
    exercises: Record<string, DialogueExercise>;
    setExercises: Dispatch<SetStateAction<Record<string, DialogueExercise>>>;
}

function DialogueWorkspace({
    lessons,
    requestedLevel,
    rate,
    setRate,
    exercises,
    setExercises,
}: DialogueWorkspaceProps) {
    const { t, i18n } = useTranslation();
    const [selection, setSelection] = useState({
        topicId: lessons[0].topicId,
        number: lessons[0].number,
    });
    const [loadedLevel, setLoadedLevel] = useState(lessons[0].level);
    const [emptyError, setEmptyError] = useState(false);
    const [fullTranscript, setFullTranscript] = useState(false);
    const answerInputRef = useRef<HTMLTextAreaElement>(null);
    const speech = useSpeech(rate);
    const lesson =
        lessons.find(
            (item) => item.topicId === selection.topicId && item.number === selection.number,
        ) ?? lessons[0];
    const selectedLessonId = lesson.id;
    const topic = dialogueTopics.find((item) => item.id === lesson.topicId)!;
    const locale = i18n.resolvedLanguage === "en" ? "en" : "vi";
    const topicLessons = useMemo(
        () => lessons.filter((item) => item.topicId === lesson.topicId),
        [lessons, lesson.topicId],
    );
    const cancelSpeech = speech.cancel;
    useEffect(() => {
        cancelSpeech();
    }, [requestedLevel, cancelSpeech]);

    // Reset transient panels before committing the new level, preserving the workspace DOM.
    if (loadedLevel !== lesson.level) {
        setLoadedLevel(lesson.level);
        setEmptyError(false);
        setFullTranscript(false);
    }

    const selectLesson = useCallback(
        (id: string) => {
            const nextLesson = lessons.find((item) => item.id === id);
            if (!nextLesson) return;
            cancelSpeech();
            setSelection({ topicId: nextLesson.topicId, number: nextLesson.number });
            setEmptyError(false);
            setFullTranscript(false);
        },
        [lessons, cancelSpeech],
    );
    const selectTopic = useCallback(
        (id: string) => {
            const firstLesson = lessons.find((item) => item.topicId === id);
            if (firstLesson) selectLesson(firstLesson.id);
        },
        [lessons, selectLesson],
    );
    const exercise = exercises[selectedLessonId] ?? createEmptyExercise(lesson.lines.length);
    const index = exercise.index;
    const line = lesson.lines[index];
    const answer = exercise.answers[index];
    const grade = useMemo(() => gradeDialogueLine(line.text, answer), [line.text, answer]);
    const showAnswer = exercise.revealed[index] || exercise.checked[index];
    const complete = exercise.checked.every(Boolean);
    const { correct, total } = useMemo(() => {
        if (!complete) return { correct: 0, total: 0 };
        const grades = lesson.lines.map((item, i) =>
            gradeDialogueLine(item.text, exercise.answers[i]),
        );
        return {
            correct: grades.reduce((sum, result) => sum + result.correct, 0),
            total: grades.reduce((sum, result) => sum + result.total, 0),
        };
    }, [complete, lesson.lines, exercise.answers]);
    function updateExercise(changes: Partial<DialogueExercise>) {
        setExercises((current) => ({
            ...current,
            [selectedLessonId]: {
                ...(current[selectedLessonId] ?? createEmptyExercise(lesson.lines.length)),
                ...changes,
            },
        }));
    }
    function withCurrentFlag(field: "checked" | "revealed" | "assisted", value: boolean) {
        return exercise[field].map((previous, i) => (i === index ? value : previous));
    }
    function moveToSentence(next: number) {
        if (next < 0 || next >= lesson.lines.length) return;
        speech.cancel();
        setEmptyError(false);
        updateExercise({ index: next });
        answerInputRef.current?.focus({ preventScroll: true });
    }
    function checkAnswer(event?: FormEvent) {
        event?.preventDefault();
        if (!exercise.answers[index].trim()) {
            setEmptyError(true);
            return;
        }
        setEmptyError(false);
        updateExercise({ checked: withCurrentFlag("checked", true) });
    }

    function handleAnswerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
        if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
        event.preventDefault();
        if (event.repeat) return;
        if (exercise.checked[index] && grade.perfect) moveToSentence(index + 1);
        else checkAnswer();
    }

    function handleAnswerChange(event: ChangeEvent<HTMLTextAreaElement>): void {
        const answers = [...exercise.answers];
        answers[index] = event.target.value;
        updateExercise({
            answers,
            checked: withCurrentFlag("checked", false),
            assisted: withCurrentFlag("assisted", exercise.assisted[index] || showAnswer),
        });
        setEmptyError(false);
    }

    function toggleAnswer(): void {
        updateExercise({
            revealed: withCurrentFlag("revealed", !showAnswer),
            checked: withCurrentFlag("checked", false),
            assisted: withCurrentFlag("assisted", true),
        });
    }

    function resetExercise(): void {
        speech.cancel();
        updateExercise(createEmptyExercise(lesson.lines.length));
        setEmptyError(false);
        setFullTranscript(false);
    }

    const resetControls = (
        <>
            <button type="button" className={dialogueButtonClassName} onClick={resetExercise}>
                <RotateCcw size={16} />
                {t("dialogues:reset")}
            </button>
            <DialogueTips />
        </>
    );

    return (
        <div data-testid="dialogue-workspace" className="min-w-0">
            <div className="mt-7 grid min-w-0 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
                <DialogueTopicPicker
                    level={lesson.level}
                    topicId={lesson.topicId}
                    locale={locale}
                    onSelect={selectTopic}
                />
                <div className="min-w-0 rounded-2xl border border-line bg-paper p-4 sm:p-6">
                    <h2 className="min-h-16 text-2xl font-semibold sm:min-h-8">
                        {topic.title[locale]}
                    </h2>
                    <label className="mt-4 block text-base font-semibold">
                        {t("dialogues:chooseLesson")}
                        <select
                            data-testid="dialogue-lesson"
                            aria-label={t("dialogues:chooseLesson")}
                            className="mt-2 block min-h-11 w-full min-w-0 rounded-lg border border-line bg-background px-3 py-2 text-base font-normal"
                            value={selectedLessonId}
                            onChange={(event) => selectLesson(event.target.value)}
                        >
                            {topicLessons.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {t("dialogues:lessonNumber", { number: item.number })} ·{" "}
                                    {item.title[locale]}
                                </option>
                            ))}
                        </select>
                    </label>
                    <p className="mt-3 min-h-[3.3em] text-base text-muted sm:min-h-[1.65em]">
                        {t("dialogues:lessonDetail", {
                            level: lesson.level,
                            number: lesson.number,
                            count: lesson.lines.length,
                        })}
                    </p>
                    <p className="mt-2 text-base text-muted">{t("dialogues:instructions")}</p>
                    <div className="mt-5 flex flex-wrap gap-2 border-b border-line pb-3">
                        <button
                            type="button"
                            aria-pressed={!fullTranscript}
                            className={
                                dialogueButtonClassName +
                                " aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:font-semibold aria-pressed:text-background"
                            }
                            onClick={() => {
                                speech.cancel();
                                setFullTranscript(false);
                            }}
                        >
                            {t("dialogues:dictation")}
                        </button>
                        <button
                            type="button"
                            data-testid="dialogue-full-transcript"
                            aria-pressed={fullTranscript}
                            className={
                                dialogueButtonClassName +
                                " aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:font-semibold aria-pressed:text-background"
                            }
                            onClick={() => {
                                speech.cancel();
                                setFullTranscript(true);
                                updateExercise({
                                    assisted: exercise.assisted.map(
                                        (value, i) => value || !exercise.checked[i],
                                    ),
                                });
                            }}
                        >
                            {t("dialogues:fullTranscript")}
                        </button>
                    </div>
                    <DialogueAudioSettings rate={rate} onRateChange={setRate} speech={speech} />
                    {fullTranscript ? (
                        <>
                            <DialogueTranscript lesson={lesson} speech={speech} />
                            <div className="mt-5 flex flex-wrap gap-3">{resetControls}</div>
                        </>
                    ) : (
                        <>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <button
                                    type="button"
                                    className={dialogueButtonClassName}
                                    aria-label={t("dialogues:previous")}
                                    disabled={index === 0}
                                    onClick={() => moveToSentence(index - 1)}
                                >
                                    <ArrowLeft size={18} />
                                </button>
                                <label className="min-w-0 text-base">
                                    <span className="sr-only">{t("dialogues:sentence")}</span>
                                    <select
                                        aria-label={t("dialogues:sentence")}
                                        className="min-h-11 max-w-full rounded-lg border border-line bg-background px-3 text-base"
                                        value={index}
                                        onChange={(event) =>
                                            moveToSentence(Number(event.target.value))
                                        }
                                    >
                                        {lesson.lines.map((_, i) => (
                                            <option key={i} value={i}>
                                                {t("dialogues:position", {
                                                    current: i + 1,
                                                    total: lesson.lines.length,
                                                })}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <button
                                    type="button"
                                    className={dialogueButtonClassName}
                                    aria-label={t("dialogues:next")}
                                    disabled={index === lesson.lines.length - 1}
                                    onClick={() => moveToSentence(index + 1)}
                                >
                                    <ArrowRight size={18} />
                                </button>
                            </div>
                            <div className="my-5 rounded-xl border border-line bg-surface p-5 text-center">
                                <p className="mb-3 text-base text-muted">
                                    {t("dialogues:answerLabel", {
                                        number: index + 1,
                                        speaker: line.speaker,
                                    })}
                                </p>
                                <button
                                    type="button"
                                    data-testid="dialogue-listen"
                                    className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-primary px-6 py-3 text-lg font-semibold text-background hover:bg-primary-ink"
                                    onClick={() => speech.speak(line.text)}
                                >
                                    <Headphones size={22} />
                                    {t("dialogues:listen")}
                                </button>
                                {speech.speaking && (
                                    <button
                                        type="button"
                                        className={dialogueButtonClassName + " mt-3 ml-2"}
                                        onClick={speech.cancel}
                                    >
                                        <Square size={16} />
                                        {t("dialogues:stop")}
                                    </button>
                                )}
                            </div>
                            <form onSubmit={checkAnswer}>
                                <label
                                    htmlFor="dialogue-answer"
                                    className="mb-2 block text-base font-semibold"
                                >
                                    {t("dialogues:write")}
                                </label>
                                <textarea
                                    ref={answerInputRef}
                                    id="dialogue-answer"
                                    data-testid="dialogue-answer"
                                    className="block min-h-36 w-full resize-y rounded-xl border border-line bg-background p-4 text-lg leading-relaxed placeholder:text-muted"
                                    lang="en"
                                    rows={3}
                                    maxLength={500}
                                    autoComplete="off"
                                    autoCapitalize="off"
                                    spellCheck={false}
                                    placeholder={t("dialogues:placeholder")}
                                    value={exercise.answers[index]}
                                    onKeyDown={handleAnswerKeyDown}
                                    onChange={handleAnswerChange}
                                />
                                <p className="mt-2 text-base text-muted">
                                    {t("dialogues:keyboard")}
                                </p>
                                {emptyError && (
                                    <p role="alert" className="mt-3 text-error">
                                        {t("dialogues:blank")}
                                    </p>
                                )}
                                {exercise.checked[index] && (
                                    <DialogueFeedback
                                        grade={grade}
                                        assisted={exercise.assisted[index]}
                                        sentenceNumber={index + 1}
                                    />
                                )}
                                {showAnswer && (
                                    <div
                                        data-testid="dialogue-transcript"
                                        className="mt-4 rounded-xl border border-line bg-background p-4"
                                    >
                                        <p className="text-base text-muted">
                                            {t("dialogues:transcript")}
                                        </p>
                                        <p lang="en" className="mt-2 text-lg">
                                            {line.text}
                                        </p>
                                        <p
                                            lang="en-GB"
                                            className="mt-2 font-ipa text-base leading-relaxed break-words text-primary-ink"
                                        >
                                            {line.ipa}
                                        </p>
                                    </div>
                                )}
                                <div
                                    data-testid="dialogue-actions"
                                    className="mt-5 flex flex-wrap gap-3"
                                >
                                    <button
                                        type="submit"
                                        className="min-h-11 rounded-lg bg-ink px-4 py-2 text-base font-semibold text-background"
                                    >
                                        {t("dialogues:check")}
                                    </button>
                                    <button
                                        type="button"
                                        className={dialogueButtonClassName}
                                        onClick={toggleAnswer}
                                    >
                                        {t(showAnswer ? "dialogues:hide" : "dialogues:reveal")}
                                    </button>
                                    <button
                                        type="button"
                                        className={dialogueButtonClassName}
                                        disabled={index === lesson.lines.length - 1}
                                        onClick={() => moveToSentence(index + 1)}
                                    >
                                        {t(
                                            exercise.checked[index] && grade.perfect
                                                ? "dialogues:next"
                                                : "dialogues:skip",
                                        )}
                                        <ArrowRight size={16} />
                                    </button>
                                    {resetControls}
                                </div>
                            </form>
                        </>
                    )}
                    {complete && (
                        <p
                            data-testid="dialogue-summary"
                            role="status"
                            className="mt-5 rounded-xl bg-surface p-4 font-semibold"
                        >
                            {t("dialogues:summary")}{" "}
                            {t("dialogues:result", {
                                correct,
                                total,
                                score: Math.round((correct / total) * 100),
                            })}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
