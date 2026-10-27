import { test } from "node:test";
import assert from "node:assert/strict";
import { groups, words, tokenize } from "../src/core/data.ts";
import { readFileSync } from "node:fs";
import { getPool, shuffle, makeDeck, grade, readSaved, summarize } from "../src/core/learning.ts";

test("3000 unique leveled words have complete data and cover all 44 sounds", () => {
    const phonemes = groups.flatMap((g) => g.sounds);
    assert.equal(words.length, 3000);
    assert.equal(new Set(words.map((w) => w.word)).size, 3000);
    assert.equal(new Set(phonemes).size, 44);
    for (const w of words) {
        assert.match(w.word, /^[a-z]+(?:[-' ][a-z]+)*$/);
        assert.ok(["A1", "A2", "B1", "B2"].includes(w.level));
        assert.ok(w.meaning.trim());
        assert.ok(w.phonemes.length);
        w.phonemes.forEach((p) => assert.ok(phonemes.includes(p), `${w.word}: ${p}`));
    }
    phonemes.forEach((p) => assert.ok(getPool([p]).length, p));
});
test("filters full phonemes, multiple sounds, groups and mistakes", () => {
    assert.equal(getPool().length, 3000);
    assert.ok(!getPool(["ɪ"]).some((w) => w.word === "ear"));
    assert.ok(!getPool(["ʃ"]).some((w) => w.word === "chair"));
    assert.ok(getPool(["iː", "æ"]).some((w) => w.word === "cat"));
    assert.ok(getPool(["k", "æ"], "all", "all").some((w) => w.word === "cat"));
    assert.ok(
        getPool(["k", "æ"], "all", "all").every(
            (w) => w.phonemes.includes("k") && w.phonemes.includes("æ"),
        ),
    );
    assert.equal(
        getPool(
            groups.flatMap((g) => g.sounds),
            "all",
            "all",
        ).length,
        0,
    );
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
    assert.equal(new Set(deck.map((w) => w.word)).size, 3000);
    assert.notEqual(deck[0].word, "see");
    assert.equal(makeDeck([words[0]], "see")[0].word, "see");
    assert.deepEqual(makeDeck([]), []);
});

test("all legacy words remain available with their meanings", () => {
    const legacy: { word: string; meaning: string }[] = JSON.parse(
        readFileSync(new URL("../data/legacy.json", import.meta.url), "utf-8"),
    );
    for (const old of legacy) {
        const current = words.find((w) => w.word === old.word);
        assert.ok(current, old.word);
        assert.equal(current!.meaning, old.meaning);
    }
});

test("CEFR combines with sounds and review, and each level is nonempty", () => {
    let total = 0;
    for (const level of ["A1", "A2", "B1", "B2"] as const) {
        const pool = getPool([], "all", "any", null, level);
        assert.ok(pool.length > 0);
        assert.ok(pool.every((w) => w.level === level));
        assert.ok(
            getPool(["æ"], "all", "any", null, level).every(
                (w) => w.level === level && w.phonemes.includes("æ"),
            ),
        );
        total += pool.length;
    }
    assert.equal(total, 3000);
    assert.deepEqual(
        getPool([], "all", "any", ["cat"], "A1").map((w) => w.word),
        ["cat"],
    );
    assert.deepEqual(getPool([], "all", "any", ["cat"], "B2"), []);
    assert.deepEqual(tokenize("tʃeə"), ["tʃ", "eə"]);
    assert.throws(() => tokenize("???"), /Unsupported IPA/);
});

test("saved level migrates old settings and rejects invalid levels", () => {
    for (const level of ["A1", "A2", "B1", "B2", "all"]) {
        assert.equal(
            readSaved({
                getItem: () => JSON.stringify({ history: [], settings: { level } }),
            }).settings.level,
            level,
        );
    }
    for (const level of ["C9", null, undefined]) {
        assert.equal(
            readSaved({
                getItem: () => JSON.stringify({ history: [], settings: { level } }),
            }).settings.level,
            "all",
        );
    }
});
test("grading normalizes case and spaces, and does not reward revealed answers", () => {
    assert.equal(grade(" CAT ", "cat", false).correct, true);
    assert.equal(grade("cat", "cat", true).correct, false);
    assert.equal(grade("dog", "cat", false).matches, false);
});

test("everyday meanings use the corrected senses rather than obsolete first glosses", () => {
    const byWord = new Map(words.map((w) => [w.word, w]));
    for (const [word, meaning] of [
        ["want", "muốn"],
        ["bye", "tạm biệt"],
        ["essay", "bài tiểu luận"],
        ["weigh", "cân"],
        ["mean", "có nghĩa"],
    ]) {
        assert.ok(byWord.get(word)!.meaning.includes(meaning), word);
    }
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
