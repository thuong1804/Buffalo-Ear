import { test } from "node:test";
import assert from "node:assert/strict";
import { tenses } from "../src/core/tenses";

test("the reference covers all twelve forms with bilingual explanations and examples", () => {
    assert.equal(tenses.length, 12);
    assert.equal(new Set(tenses.map((tense) => tense.id)).size, 12);
    for (const group of ["present", "past", "future"]) {
        assert.equal(tenses.filter((tense) => tense.group === group).length, 4);
    }
    const checkContent = (value: unknown): void => {
        if (typeof value === "string") assert.ok(value.trim(), "No empty content");
        else if (Array.isArray(value)) {
            assert.ok(value.length);
            value.forEach(checkContent);
        } else if (value && typeof value === "object") {
            const record = value as Record<string, unknown>;
            if ("vi" in record || "en" in record) {
                assert.equal(typeof record.vi, "string");
                assert.equal(typeof record.en, "string");
            }
            Object.values(record).forEach(checkContent);
        }
    };
    checkContent(tenses);
    for (const tense of tenses) {
        assert.ok(tense.uses.length >= 2, tense.id);
        assert.ok(tense.markers.length >= 3, tense.id);
        assert.ok(tense.mistakes.length >= 2, tense.id);
        assert.match(tense.active.question.example.en, /\?$/);
    }
});

test("simple questions and negatives preserve base verbs and distinguish main-verb be", () => {
    const present = tenses.find((tense) => tense.id === "present-simple")!;
    const past = tenses.find((tense) => tense.id === "past-simple")!;
    assert.equal(present.active.question.formula, "Do/Does + S + V?");
    assert.equal(past.active.negative.formula, "S + did + not + V");
    assert.equal(present.be.forms?.question.formula, "Am/Is/Are + S + C?");
    assert.equal(past.be.forms?.negative.formula, "S + was/were + not + C");
});

test("uncommon passives are explicitly marked with alternatives instead of everyday examples", () => {
    const rare = tenses.filter((tense) => tense.passive.kind === "rare");
    assert.deepEqual(
        rare.map((tense) => tense.id),
        [
            "present-perfect-continuous",
            "past-perfect-continuous",
            "future-continuous",
            "future-perfect-continuous",
        ],
    );
    for (const tense of rare) {
        if (tense.passive.kind !== "rare") continue;
        assert.match(tense.passive.formula, /being \+ V3/);
        assert.match(tense.passive.note.en, /rare|uncommon/i);
        assert.ok(tense.passive.alternative.en);
        assert.ok(tense.passive.alternative.vi);
    }
});
