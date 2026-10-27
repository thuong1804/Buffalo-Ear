import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { levels, topics, lessonLines } from "./dialogue-curriculum.mjs";
import { assertDialogueDiversity } from "./dialogue-content-audit.mjs";

const enginePath = process.argv[2];
if (!enginePath) {
    throw new Error(
        "Pass path to @echogarden/espeak-ng-emscripten 0.3.5 espeak-ng.js (offline build tool only).",
    );
}

const lessons = levels.flatMap((level) =>
    topics.flatMap((topic) =>
        topic.scenarios.map((scenario) => ({
            id: `${level}-${topic.id}-${scenario.number}`,
            level,
            topicId: topic.id,
            number: scenario.number,
            title: { vi: scenario.vi, en: scenario.en },
            lines: lessonLines(level, topic, scenario).map((text, index) => ({
                speaker: index % 2 === 0 ? "A" : "B",
                text,
            })),
        })),
    ),
);
if (topics.length !== 10 || lessons.length !== 600) {
    throw new Error("Expected six levels with ten topics and ten conversations per topic");
}
const diversity = assertDialogueDiversity(lessons);
console.log(
    "Content audit passed: no duplicate conversations, repeated long sentences/phrases or near duplicates.",
);

const { default: init } = await import(pathToFileURL(path.resolve(enginePath)).href);
const engine = await init();
const voice = new engine.eSpeakNGWorker();
voice.set_voice("en-gb");
const ipaByText = new Map();

function generateIpa(text) {
    if (ipaByText.has(text)) return ipaByText.get(text);
    const result = voice.synthesize_ipa(text);
    if (result.code !== 0) throw new Error(`IPA conversion failed: ${text}`);
    const value = `/${result.ipa.replaceAll("_", "").replace(/\s+/g, " ").trim()}/`;
    if (value.length < 3) throw new Error(`Empty IPA: ${text}`);
    ipaByText.set(text, value);
    return value;
}

// Finish validation and conversion before replacing any published level.
for (const lesson of lessons) {
    lesson.lines = lesson.lines.map((line) => ({ ...line, ipa: generateIpa(line.text) }));
}
const outputDirectory = "src/core/dialogue-data";
fs.mkdirSync(outputDirectory, { recursive: true });
for (const level of levels) {
    const levelLessons = lessons.filter((lesson) => lesson.level === level);
    if (levelLessons.length !== 100) throw new Error(`${level}: expected 100 lessons`);
    fs.writeFileSync(
        `${outputDirectory}/${level}.json`,
        JSON.stringify(levelLessons, null, 4) + "\n",
    );
}
fs.writeFileSync(
    `${outputDirectory}/catalog.json`,
    JSON.stringify(
        topics.map((topic) => ({
            id: topic.id,
            title: { vi: topic.vi, en: topic.en },
            lessonCount: topic.scenarios.length,
        })),
        null,
        4,
    ) + "\n",
);
console.log(
    `Published ${lessons.length} authored conversations; ${ipaByText.size} IPA turns. Closest 4-gram similarity: ${(diversity.closestPair.similarity * 100).toFixed(2)}%. No speech engine is shipped to the browser.`,
);
