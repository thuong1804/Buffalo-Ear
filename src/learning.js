import { words, groups } from "../data.js";
import { levels } from "./levels.js";
const knownWords = new Set(words.map((w) => w.word));

export function getPool(
  selected = [],
  group = "all",
  mode = "any",
  mistakes = null,
  level = "all",
) {
  const sounds = groups
    .filter((g) => group === "all" || g.type === group)
    .flatMap((g) => g.sounds);
  const active = selected.filter((p) => sounds.includes(p));
  const reviewWords = mistakes ? new Set(mistakes) : null;
  return words.filter(
    (w) =>
      (level === "all" || w.level === level) &&
      (!reviewWords || reviewWords.has(w.word)) &&
      (active.length
        ? mode === "all"
          ? active.every((p) => w.phonemes.includes(p))
          : active.some((p) => w.phonemes.includes(p))
        : w.phonemes.some((p) => sounds.includes(p))),
  );
}

export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function makeDeck(pool, previous) {
  const deck = shuffle(pool);
  if (deck.length > 1 && deck[0].word === previous)
    [deck[0], deck[1]] = [deck[1], deck[0]];
  return deck;
}

export function grade(answer, word, revealed) {
  const matches = answer.trim().toLowerCase() === word.toLowerCase();
  return { matches, correct: matches && !revealed, revealed };
}

export const storageKey = "buffalo-ear-v2";
export function readSaved(storage) {
  try {
    const saved = JSON.parse(storage.getItem(storageKey));
    if (!saved || !Array.isArray(saved.history))
      return {
        history: [],
        settings: { rate: 0.85, auto: true, level: "all" },
      };
    const history = saved.history
      .filter(
        (h) =>
          h &&
          knownWords.has(h.word) &&
          typeof h.correct === "boolean" &&
          typeof h.matches === "boolean" &&
          typeof h.date === "string" &&
          Number.isFinite(Date.parse(h.date)),
      )
      .slice(-5000);
    return {
      history,
      settings: {
        level: levels.some((l) => l.id === saved.settings?.level)
          ? saved.settings.level
          : "all",
        rate: [0.7, 0.85, 1].includes(saved.settings?.rate)
          ? saved.settings.rate
          : 0.85,
        auto:
          typeof saved.settings?.auto === "boolean"
            ? saved.settings.auto
            : true,
      },
    };
  } catch {
    return { history: [], settings: { rate: 0.85, auto: true, level: "all" } };
  }
}

export function summarize(history) {
  const latest = new Map(history.map((h) => [h.word, h]));
  return {
    attempted: history.length,
    correct: history.filter((h) => h.correct).length,
    learned: [...latest.values()].filter((h) => h.correct).length,
    mistakes: [...latest.values()].filter((h) => !h.correct).map((h) => h.word),
  };
}
