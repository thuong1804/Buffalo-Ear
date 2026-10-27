import { test } from "node:test";
import assert from "node:assert/strict";
import {
    dialogueLevels,
    dialogueTopics,
    loadDialogueLevel,
    dialogueWords,
    gradeDialogueLine,
} from "../src/core/dialogues";

test("dialogue grading ignores case, punctuation and spacing without accepting different contractions", () => {
    assert.equal(
        gradeDialogueLine("Hello! How are you?", "  HELLO, how   are you. ").perfect,
        true,
    );
    assert.deepEqual(dialogueWords("It’s fine."), ["it's", "fine"]);
    assert.equal(gradeDialogueLine("It's fine.", "It is fine.").perfect, false);
    assert.equal(gradeDialogueLine("It is fine.", "It was fine.").perfect, false);
});

test("a missing or extra word does not misalign the rest of a sentence", () => {
    const missing = gradeDialogueLine("Can I have a coffee please", "Can I have coffee please");
    assert.equal(missing.correct, 5);
    assert.deepEqual(
        missing.words.filter((word) => word.type === "missing"),
        [{ type: "missing", expected: "a" }],
    );
    const extra = gradeDialogueLine("I have a room", "I have a nice room");
    assert.equal(extra.correct, 4);
    assert.equal(extra.total, 5);
    assert.deepEqual(
        extra.words.filter((word) => word.type === "extra"),
        [{ type: "extra", actual: "nice" }],
    );
    assert.equal(gradeDialogueLine("a a", "a").correct, 1);
});

test("all six CEFR levels contain exactly ten topics and ten unique complete lessons per topic", async () => {
    assert.equal(dialogueLevels.length, 6);
    assert.equal(dialogueTopics.length, 10);
    assert.equal(new Set(dialogueTopics.map((topic) => topic.id)).size, 10);
    const all = await Promise.all(dialogueLevels.map(loadDialogueLevel));
    const dialogues = all.flat();
    assert.equal(dialogues.length, 600);
    assert.equal(new Set(dialogues.map((lesson) => lesson.id)).size, 600);
    assert.equal(
        new Set(dialogues.map((lesson) => lesson.lines.map((line) => line.text).join(" "))).size,
        600,
    );
    for (let i = 0; i < dialogueLevels.length; i++) {
        const level = dialogueLevels[i],
            lessons = all[i];
        assert.equal(lessons.length, 100);
        for (const topic of dialogueTopics) {
            assert.ok(topic.title.vi && topic.title.en);
            const selected = lessons.filter((lesson) => lesson.topicId === topic.id);
            assert.equal(selected.length, 10, level + " " + topic.id);
            assert.deepEqual(
                selected.map((lesson) => lesson.number),
                [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            );
            for (const lesson of selected) {
                assert.equal(lesson.level, level);
                assert.equal(lesson.id, level + "-" + topic.id + "-" + lesson.number);
                assert.ok(lesson.title.vi && lesson.title.en);
            }
        }
    }
    for (const lesson of dialogues) {
        assert.equal(lesson.lines.length, 4);
        for (const line of lesson.lines) {
            assert.ok(["A", "B"].includes(line.speaker));
            assert.ok(line.ipa.startsWith("/") && line.ipa.endsWith("/"));
            assert.ok(line.text.length <= 500);
            assert.ok(!line.ipa.includes("_"));
            assert.ok(!line.ipa.includes("(en)"));
            const blank = gradeDialogueLine(line.text, "");
            assert.equal(blank.correct, 0);
            assert.equal(blank.perfect, false);
            assert.ok(blank.total > 0);
            assert.equal(gradeDialogueLine(line.text, line.text).perfect, true);
        }
    }
});
