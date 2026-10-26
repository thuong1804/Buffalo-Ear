import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { grade, readSaved, storageKey } from "../core/learning";
import type { AccountSession, Attempt, Saved, Settings } from "../core/types";
import {
  clearProgress,
  getProgress,
  getSettings,
  importLocalHistory,
  submitAnswer,
  updateSettings,
} from "../server/learning";

const empty = (): Saved => ({
  history: [],
  settings: { rate: 0.85, auto: true, level: "all" },
});
const guestId = (h: Attempt) =>
  `guest:${h.clientId ?? `${h.word}:${new Date(h.date).toISOString()}`}`;
function useLearningState(
  session: AccountSession | null,
  configured: boolean,
  googleEnabled: boolean,
) {
  const queryClient = useQueryClient();
  const [guest, setGuest] = useState<Saved>(empty);
  const [hydrated, setHydrated] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState<{
    imported: number;
    skipped: number;
  } | null>(null);
  const userId = session?.user.id;
  const queryKey = ["learning", userId] as const;
  const guestRef = useRef(guest);
  guestRef.current = guest;
  const pendingAnswer = useRef<{
    word: string;
    answer: string;
    revealed: boolean;
    clientId: string;
    roundId: string;
  } | null>(null);

  useEffect(() => {
    setError("");
    setMessage(null);
    pendingAnswer.current = null;
  }, [userId]);
  useEffect(() => {
    try {
      setGuest(readSaved(window.localStorage));
    } catch {
      setStorageError(true);
    }
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(guest));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [guest, hydrated]);
  // A new account has its own query key. Never display another account's cache.
  const accountData = useQuery({
    queryKey,
    enabled: Boolean(userId && hydrated),
    retry: false,
    staleTime: Infinity,
    queryFn: async (): Promise<Saved> => {
      const local = guestRef.current;
      const response = await importLocalHistory({ data: local });
      const acknowledged = new Set(response.acknowledged);
      // Re-read storage so another tab's newly added entries are retained.
      let current = guestRef.current;
      try {
        current = readSaved(window.localStorage);
      } catch {
        setStorageError(true);
      }
      const retained = {
        ...current,
        history: current.history.filter((h) => !acknowledged.has(guestId(h))),
      };
      try {
        localStorage.setItem(storageKey, JSON.stringify(retained));
        setGuest(retained);
      } catch {
        setStorageError(true); // Idempotent import makes a future retry safe.
      }
      if (local.history.length)
        setMessage({ imported: response.imported, skipped: response.skipped });
      const [history, settings] = await Promise.all([
        getProgress(),
        getSettings(),
      ]);
      return { history, settings };
    },
  });
  const answerMutation = useMutation({
    mutationFn: (input: {
      word: string;
      answer: string;
      revealed: boolean;
      clientId: string;
    }) => submitAnswer({ data: input }),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Saved>(queryKey);
      if (previous)
        queryClient.setQueryData<Saved>(queryKey, {
          ...previous,
          history: [
            ...previous.history,
            {
              word: input.word,
              ...grade(input.answer, input.word, input.revealed),
              date: new Date().toISOString(),
              clientId: input.clientId,
            },
          ].slice(-5000),
        });
      return previous;
    },
    onSuccess: (attempt) => {
      queryClient.setQueryData<Saved>(
        queryKey,
        (old) =>
          old && {
            ...old,
            history: old.history
              .map((h) => (h.clientId === attempt.clientId ? attempt : h))
              .sort((a, b) => Date.parse(a.date) - Date.parse(b.date)),
          },
      );
      pendingAnswer.current = null;
      setError("");
    },
    onError: (_err, _input, previous) => {
      if (previous) queryClient.setQueryData(queryKey, previous);
      setError("errors:saveAnswer");
    },
  });
  const settingsMutation = useMutation({
    mutationFn: (settings: Settings) => updateSettings({ data: settings }),
    onError: () => {
      setError("errors:saveSettings");
    },
    onSuccess: () => setError(""),
  });
  const clearMutation = useMutation({
    mutationFn: () => clearProgress(),
    onSuccess: () => {
      queryClient.setQueryData<Saved>(
        queryKey,
        (old) => old && { ...old, history: [] },
      );
      setError("");
    },
    onError: () => setError("errors:clearProgress"),
  });
  const data = userId ? (accountData.data ?? empty()) : guest;
  const busy =
    Boolean(userId && accountData.isFetching) ||
    answerMutation.isPending ||
    settingsMutation.isPending ||
    clearMutation.isPending;
  const setSettings: Dispatch<SetStateAction<Settings>> = (update) => {
    if (busy) return;
    const settings =
      typeof update === "function" ? update(data.settings) : update;
    if (!userId) setGuest((old) => ({ ...old, settings }));
    else {
      queryClient.setQueryData<Saved>(
        queryKey,
        (old) => old && { ...old, settings },
      );
      settingsMutation.mutate(settings);
    }
  };
  async function recordAnswer(
    word: string,
    answer: string,
    revealed: boolean,
    roundId: string,
  ) {
    if (!userId) {
      const attempt = {
        word,
        ...grade(answer, word, revealed),
        date: new Date().toISOString(),
        clientId: crypto.randomUUID(),
      };
      setGuest((old) => ({
        ...old,
        history: [...old.history, attempt].slice(-5000),
      }));
      return attempt;
    }
    if (
      !pendingAnswer.current ||
      pendingAnswer.current.word !== word ||
      pendingAnswer.current.answer !== answer ||
      pendingAnswer.current.revealed !== revealed ||
      pendingAnswer.current.roundId !== roundId
    ) {
      pendingAnswer.current = {
        word,
        answer,
        revealed,
        clientId: crypto.randomUUID(),
        roundId,
      };
    }
    return answerMutation.mutateAsync(pendingAnswer.current);
  }
  async function resetHistory() {
    if (!userId) setGuest((old) => ({ ...old, history: [] }));
    else {
      try {
        await clearMutation.mutateAsync();
      } catch {
        /* visible error */
      }
    }
  }
  function retry() {
    setError("");
    if (settingsMutation.isError) settingsMutation.mutate(data.settings);
    else if (clearMutation.isError) clearMutation.mutate();
    else if (userId && !answerMutation.isError) void accountData.refetch();
  }
  return {
    ...data,
    setSettings,
    recordAnswer,
    resetHistory,
    account: session?.user ?? null,
    configured,
    googleEnabled,
    storageError,
    error: error || (accountData.isError ? "errors:loadProgress" : ""),
    message,
    retryable:
      accountData.isError || settingsMutation.isError || clearMutation.isError,
    busy,
    ready: hydrated && (!userId || Boolean(accountData.data)),
    retry,
  };
}
const LearningContext = createContext<ReturnType<
  typeof useLearningState
> | null>(null);
export function LearningProvider({
  session,
  configured,
  googleEnabled,
  children,
}: {
  session: AccountSession | null;
  configured: boolean;
  googleEnabled: boolean;
  children: ReactNode;
}) {
  const state = useLearningState(session, configured, googleEnabled);
  return (
    <LearningContext.Provider value={state}>
      {children}
    </LearningContext.Provider>
  );
}
export function useLearning() {
  const state = useContext(LearningContext);
  if (!state) throw new Error("LearningProvider missing");
  return state;
}
