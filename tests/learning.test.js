import { test } from "node:test";
import assert from "node:assert/strict";
import { groups, words } from "../data.js";
import {
  getPool,
  shuffle,
  makeDeck,
  grade,
  readSaved,
  summarize,
} from "../src/learning.js";

test("507 unique words have complete data, valid phonemes and cover all 44 sounds", () => {
  const phonemes = groups.flatMap((g) => g.sounds);
  assert.equal(words.length, 507);
  assert.equal(new Set(words.map((w) => w.word)).size, 507);
  assert.equal(new Set(phonemes).size, 44);
  for (const w of words) {
    assert.match(w.word, /^[a-z]+$/);
    assert.ok(w.meaning.trim());
    assert.ok(w.phonemes.length);
    w.phonemes.forEach((p) =>
      assert.ok(phonemes.includes(p), `${w.word}: ${p}`),
    );
  }
  phonemes.forEach((p) => assert.ok(getPool([p]).length, p));
});
test("filters full phonemes, multiple sounds, groups and mistakes", () => {
  assert.equal(getPool().length, 507);
  assert.ok(!getPool(["ɪ"]).some((w) => w.word === "ear"));
  assert.ok(!getPool(["ʃ"]).some((w) => w.word === "chair"));
  assert.ok(getPool(["iː", "æ"]).some((w) => w.word === "cat"));
  assert.ok(getPool(["k", "æ"], "all", "all").some((w) => w.word === "cat"));
  assert.ok(
    getPool(["k", "æ"], "all", "all").every(
      (w) => w.phonemes.includes("k") && w.phonemes.includes("æ"),
    ),
  );
  assert.equal(getPool(["ɪə", "ʊə"], "all", "all").length, 0);
  assert.ok(!getPool([], "consonants").some((w) => w.word === "ear"));
  assert.deepEqual(
    getPool([], "all", "any", ["cat"]).map((w) => w.word),
    ["cat"],
  );
});
test("shuffling keeps every word once and avoids an immediate repeat", () => {
  assert.deepEqual(
    shuffle([1, 2, 3], () => 0),
    [2, 3, 1],
  );
  const deck = makeDeck(words, "see");
  assert.equal(new Set(deck.map((w) => w.word)).size, 507);
  assert.notEqual(deck[0].word, "see");
  assert.equal(makeDeck([words[0]], "see")[0].word, "see");
  assert.deepEqual(makeDeck([]), []);
});
test("grading normalizes case and spaces, and does not reward revealed answers", () => {
  assert.equal(grade(" CAT ", "cat", false).correct, true);
  assert.equal(grade("cat", "cat", true).correct, false);
  assert.equal(grade("dog", "cat", false).matches, false);
});
test("latest result determines review status without counting duplicate learned words", () => {
  const history = [
    { word: "cat", correct: false },
    { word: "cat", correct: true },
    { word: "dog", correct: false },
  ];
  assert.deepEqual(summarize(history), {
    attempted: 3,
    correct: 1,
    learned: 1,
    mistakes: ["dog"],
  });
});
test("corrupt or unavailable storage gracefully falls back; invalid entries are discarded", () => {
  assert.equal(readSaved({ getItem: () => "{broken" }).history.length, 0);
  assert.equal(
    readSaved({
      getItem: () => {
        throw Error("blocked");
      },
    }).settings.rate,
    0.85,
  );
  const result = readSaved({
    getItem: () =>
      JSON.stringify({
        history: [
          null,
          { word: "made-up", correct: true },
          {
            word: "cat",
            correct: true,
            matches: true,
            date: "2026-10-23T00:00:00Z",
          },
        ],
        settings: { rate: 99, auto: false },
      }),
  });
  assert.equal(result.history.length, 1);
  assert.equal(result.settings.rate, 0.85);
  assert.equal(result.settings.auto, false);
});
