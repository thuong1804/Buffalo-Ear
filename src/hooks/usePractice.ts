import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { groups } from "../core/data";
import { getPool, makeDeck, summarize } from "../core/learning";
import type { Group, MatchMode, Outcome, Round, View } from "../core/types";
import { localDay } from "../components";
import useSpeech from "./useSpeech";
import { useLearning } from "./useLearning";

export function usePractice(view: string, onNavigate: (view: View, hash?: string) => void) {
    const learning = useLearning();
    const { history, settings, setSettings } = learning;
    const [group, setGroup] = useState<Group>("all");
    const [selected, setSelected] = useState<string[]>([]);
    const [mode, setMode] = useState<MatchMode>("any");
    const [review, setReview] = useState(false);
    const [round, setRound] = useState<Round>(() => ({
        deck: [],
        index: 0,
        id: 0,
    }));
    const [answer, setAnswer] = useState("");
    const [result, setResult] = useState<Outcome | null>(null);
    const [revealed, setRevealed] = useState(false);
    const [session, setSession] = useState({ attempted: 0, correct: 0 });
    const inputRef = useRef<HTMLInputElement>(null);
    const submitLock = useRef(false);
    const interacted = useRef(false);
    const speech = useSpeech(settings.rate);
    const summary = useMemo(() => summarize(history), [history]);
    const learned = useMemo(
        () =>
            new Set(
                [...new Map(history.map((h) => [h.word, h])).values()]
                    .filter((h) => h.correct)
                    .map((h) => h.word),
            ),
        [history],
    );
    const pool = useMemo(
        () => getPool(selected, group, mode, review ? summary.mistakes : null, settings.level),
        [selected, group, mode, review, summary.mistakes, settings.level],
    );
    const poolRef = useRef(pool);
    poolRef.current = pool;
    const autoRef = useRef<{
        auto: boolean;
        speak: (word: string) => void;
        view: string;
    }>(null!);
    autoRef.current = { auto: settings.auto, speak: speech.speak, view };
    const todayCount = history.filter((h) => localDay(h.date) === localDay(new Date())).length;

    useEffect(() => {
        setAnswer("");
        setResult(null);
        setRevealed(false);
        submitLock.current = false;
        const current = round.deck[round.index];
        if (
            round.autoplay &&
            autoRef.current.auto &&
            autoRef.current.view === "practice" &&
            current
        )
            autoRef.current.speak(current.word);
        if (interacted.current) inputRef.current?.focus({ preventScroll: true });
    }, [round]);
    function resetPool(
        nextSelected = selected,
        nextGroup = group,
        nextMode = mode,
        nextReview = review,
        nextLevel = settings.level,
    ) {
        if (learning.busy) return;
        speech.cancel();
        interacted.current = true;
        const nextPool = getPool(
            nextSelected,
            nextGroup,
            nextMode,
            nextReview ? summary.mistakes : null,
            nextLevel,
        );
        setRound((r) => ({
            deck: makeDeck(nextPool, r.deck[r.index]?.word),
            index: 0,
            id: r.id + 1,
        }));
    }
    function changeGroup(value: Group) {
        const available = groups
            .filter((g) => value === "all" || g.type === value)
            .flatMap((g) => g.sounds);
        const nextSelected = selected.filter((p) => available.includes(p));
        setGroup(value);
        setSelected(nextSelected);
        resetPool(nextSelected, value);
    }
    function selectSound(sound: string) {
        const next = selected.includes(sound)
            ? selected.filter((s) => s !== sound)
            : [...selected, sound];
        setSelected(next);
        resetPool(next);
    }
    function nextWord() {
        if (learning.busy) return;
        speech.cancel();
        interacted.current = true;
        setRound((r) => {
            const allowed = new Set(poolRef.current.map((w) => w.word));
            const remaining = r.deck.slice(r.index + 1).filter((w) => allowed.has(w.word));
            return {
                autoplay: true,
                deck: remaining.length
                    ? remaining
                    : makeDeck(poolRef.current, r.deck[r.index]?.word),
                index: 0,
                id: r.id + 1,
            };
        });
    }
    async function submit(event: FormEvent) {
        event.preventDefault();
        const current = round.deck[round.index];
        if (!current || submitLock.current || !answer.trim() || learning.busy) return;
        submitLock.current = true;
        try {
            const outcome = await learning.recordAnswer(
                current.word,
                answer,
                revealed,
                String(round.id),
            );
            setResult(outcome);
            setSession((s) => ({
                attempted: s.attempted + 1,
                correct: s.correct + Number(outcome.correct),
            }));
        } catch {
            submitLock.current = false;
        }
    }
    function start(word: string) {
        interacted.current = true;
        speech.speak(word);
        inputRef.current?.focus({ preventScroll: true });
    }
    function navigate(nextView: View, hash?: string) {
        speech.cancel();
        onNavigate(nextView, hash);
    }
    function toggleReview() {
        const next = !review;
        setReview(next);
        resetPool(selected, group, mode, next);
    }
    const nextRef = useRef(nextWord);
    nextRef.current = nextWord;
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.altKey && e.key === "ArrowRight" && view === "practice") {
                e.preventDefault();
                nextRef.current();
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [view]);
    const loadedAccount = useRef<string | null>(null);
    useEffect(() => {
        if (!learning.ready) return;
        const identity = learning.account?.id ?? "guest";
        if (loadedAccount.current === identity) return;
        loadedAccount.current = identity;
        setSession({ attempted: 0, correct: 0 });
        setGroup("all");
        setSelected([]);
        setReview(false);
        setRound((r) => ({
            deck: makeDeck(getPool([], "all", "any", null, settings.level)),
            index: 0,
            id: r.id + 1,
        }));
    }, [learning.ready, learning.account?.id, settings.level]);
    const previousLevel = useRef(settings.level);
    useEffect(() => {
        if (previousLevel.current === settings.level) return;
        previousLevel.current = settings.level;
        setRound((r) => ({
            deck: makeDeck(
                getPool(selected, group, mode, review ? summary.mistakes : null, settings.level),
            ),
            index: 0,
            id: r.id + 1,
        }));
    }, [settings.level, selected, group, mode, review, summary.mistakes]);
    return {
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
    };
}
