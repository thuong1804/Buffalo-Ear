import fs from "node:fs";
import assert from "node:assert/strict";
import { test } from "node:test";
import { levels, topics, lessonLines } from "../scripts/dialogue-curriculum.mjs";
import {
    assertDialogueDiversity,
    auditDialogueContent,
    contentWords,
} from "../scripts/dialogue-content-audit.mjs";

function publishedLessons() {
    return levels.flatMap((level) =>
        JSON.parse(
            fs.readFileSync(
                new URL(`../src/core/dialogue-data/${level}.json`, import.meta.url),
                "utf8",
            ),
        ),
    );
}

test("all 600 published conversations use their authored turns, retaining stable IDs", () => {
    const lessons = publishedLessons();
    const byId = new Map(lessons.map((lesson) => [lesson.id, lesson]));
    assert.equal(byId.size, 600);
    for (const level of levels) {
        for (const topic of topics) {
            for (const scenario of topic.scenarios) {
                const id = `${level}-${topic.id}-${scenario.number}`;
                const published = byId.get(id);
                assert.ok(published, id);
                assert.deepEqual(
                    published.lines.map((line) => line.text),
                    lessonLines(level, topic, scenario),
                    id,
                );
                assert.deepEqual(published.title, { vi: scenario.vi, en: scenario.en }, id);
            }
        }
    }
});

test("the full corpus contains no repeated long sentences, copied phrases or near-duplicate conversations", () => {
    const report = assertDialogueDiversity(publishedLessons());
    assert.deepEqual(report.duplicateDialogues, []);
    assert.deepEqual(report.repeatedSentences, []);
    assert.deepEqual(report.repeatedPhrases, []);
    assert.deepEqual(report.nearDuplicates, []);
});

test("changing a place name does not disguise repeated template replies", () => {
    const lessons = ["London", "York"].map((city, index) => ({
        id: "template-" + index,
        lines: [
            `Can you help me arrange a journey to ${city}?`,
            "Of course. We can help you with that today.",
            "I would like to consider a different option.",
            "Let us check the details before making a decision.",
        ],
    }));
    const report = auditDialogueContent(lessons);
    assert.ok(report.repeatedSentences.length);
    assert.ok(report.repeatedPhrases.length);
    assert.ok(report.nearDuplicates.length);
    assert.throws(() => assertDialogueDiversity(lessons), /editorial review/);
});

test("case, punctuation and replaced numbers do not hide copied sentences", () => {
    assert.deepEqual(contentWords("TRAIN 12, platform 4!"), contentWords("Train 99; platform 8."));
    const report = auditDialogueContent([
        {
            id: "first",
            lines: ["Please collect your train ticket from platform 12 before departure."],
        },
        {
            id: "second",
            lines: ["PLEASE collect your train ticket from platform 99 before departure!"],
        },
    ]);
    assert.equal(report.duplicateDialogues.length, 1);
    assert.equal(report.repeatedSentences.length, 1);
});

test("short conversational greetings can be shared without treating distinct conversations as duplicates", () => {
    assert.doesNotThrow(() =>
        assertDialogueDiversity([
            {
                id: "greeting-one",
                lines: ["Good morning.", "The parcel beside your desk arrived after lunch."],
            },
            {
                id: "greeting-two",
                lines: [
                    "Good morning.",
                    "Our neighbours are planting three trees in their garden.",
                ],
            },
        ]),
    );
});
