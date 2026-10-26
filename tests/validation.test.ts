import { test } from "node:test";
import assert from "node:assert/strict";
import {
  answerSchema,
  historyClientId,
  importSchema,
  normalizeImport,
  settingsSchema,
} from "../src/server/validation.ts";
import { readSaved } from "../src/core/learning.ts";
const date = "2026-01-01T00:00:00.000Z";
test("answer validation rejects unknown vocabulary, empty and oversized answers, invalid IDs", () => {
  const valid = {
    word: "cat",
    answer: " CAT ",
    revealed: false,
    clientId: "8131ebbd-d64f-489c-a005-847557f95ca8",
  };
  assert.equal(answerSchema.parse(valid).answer, "CAT");
  for (const patch of [
    { word: "invented-word" },
    { answer: " " },
    { answer: "a".repeat(101) },
    { clientId: "invalid" },
    { revealed: "false" },
  ]) {
    assert.equal(answerSchema.safeParse({ ...valid, ...patch }).success, false);
  }
});
test("import normalizes legacy hints, prevents contradictory correct results, and skips invalid entries", () => {
  const entry = { word: "cat", date, correct: false, matches: true };
  assert.equal(normalizeImport(entry)?.revealed, true);
  assert.equal(
    normalizeImport({ ...entry, correct: true, revealed: true })?.correct,
    false,
  );
  assert.equal(
    normalizeImport({ ...entry, correct: true, matches: false })?.correct,
    false,
  );
  for (const value of [
    null,
    { ...entry, word: "unknown-word" },
    { ...entry, date: "invalid" },
    { ...entry, date: "2099-01-01T00:00:00.000Z" },
  ])
    assert.equal(normalizeImport(value), null);
  assert.equal(
    historyClientId({ word: "cat", date }),
    historyClientId({ word: "cat", date: "2026-01-01T07:00:00+07:00" }),
  );
});
test("settings reject unsupported options and imports are bounded at 5000 entries", () => {
  const settings = { rate: 0.85, auto: true, level: "B2" };
  assert.equal(settingsSchema.safeParse(settings).success, true);
  assert.equal(
    settingsSchema.safeParse({ ...settings, rate: 99 }).success,
    false,
  );
  assert.equal(
    settingsSchema.safeParse({ ...settings, level: "C9" }).success,
    false,
  );
  assert.equal(
    importSchema.safeParse({ history: Array(5001).fill(null), settings })
      .success,
    false,
  );
});
test("local history remains bounded and cannot mark mismatches or revealed answers correct", () => {
  const saved = readSaved({
    getItem: () =>
      JSON.stringify({
        history: Array(5001).fill({
          word: "cat",
          date,
          correct: true,
          matches: false,
        }),
      }),
  });
  assert.equal(saved.history.length, 5000);
  assert.equal(saved.history[0].correct, false);
});
