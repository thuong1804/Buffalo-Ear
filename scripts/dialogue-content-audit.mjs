import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export function contentWords(text) {
    return (
        text
            .normalize("NFKC")
            .toLowerCase()
            .replace(/[’‘]/g, "'")
            .match(/[a-z]+(?:'[a-z]+)*|\d+/g) ?? []
    ).map((word) => (/^\d+$/.test(word) ? "<number>" : word));
}

function phrases(words, length) {
    return new Set(
        Array.from({ length: Math.max(0, words.length - length + 1) }, (_, index) =>
            words.slice(index, index + length).join(" "),
        ),
    );
}

function recordOccurrence(occurrences, text, id) {
    if (!occurrences.has(text)) occurrences.set(text, new Set());
    occurrences.get(text).add(id);
}

function repeatedEntries(occurrences) {
    return [...occurrences]
        .filter(([, ids]) => ids.size > 1)
        .map(([text, ids]) => ({ text, ids: [...ids] }));
}

export function auditDialogueContent(lessons) {
    const dialogueOccurrences = new Map();
    const sentenceOccurrences = new Map();
    const phraseOccurrences = new Map();
    const fingerprints = [];

    for (const lesson of lessons) {
        const text = lesson.lines
            .map((line) => (typeof line === "string" ? line : line.text))
            .join(" ");
        const words = contentWords(text);
        recordOccurrence(dialogueOccurrences, words.join(" "), lesson.id);
        fingerprints.push({ id: lesson.id, phrases: phrases(words, 4) });
        for (const sentence of text.split(/[.!?]+/)) {
            const sentenceWords = contentWords(sentence);
            if (sentenceWords.length >= 6) {
                recordOccurrence(sentenceOccurrences, sentenceWords.join(" "), lesson.id);
            }
        }
        for (const phrase of phrases(words, 8)) {
            recordOccurrence(phraseOccurrences, phrase, lesson.id);
        }
    }

    const nearDuplicates = [];
    let closestPair = null;
    for (let first = 0; first < fingerprints.length; first++) {
        for (let second = first + 1; second < fingerprints.length; second++) {
            const left = fingerprints[first],
                right = fingerprints[second];
            let overlap = 0;
            for (const phrase of left.phrases) {
                if (right.phrases.has(phrase)) overlap++;
            }
            const union = left.phrases.size + right.phrases.size - overlap;
            const similarity = union ? overlap / union : 0;
            const pair = { ids: [left.id, right.id], similarity };
            if (!closestPair || similarity > closestPair.similarity) closestPair = pair;
            if (similarity >= 0.55) nearDuplicates.push(pair);
        }
    }

    return {
        duplicateDialogues: repeatedEntries(dialogueOccurrences),
        repeatedSentences: repeatedEntries(sentenceOccurrences),
        repeatedPhrases: repeatedEntries(phraseOccurrences),
        nearDuplicates,
        closestPair,
    };
}

export function assertDialogueDiversity(lessons) {
    const result = auditDialogueContent(lessons);
    const failures = [
        "duplicateDialogues",
        "repeatedSentences",
        "repeatedPhrases",
        "nearDuplicates",
    ].filter((key) => result[key].length);
    if (failures.length) {
        const sample = Object.fromEntries(failures.map((key) => [key, result[key].slice(0, 8)]));
        throw new Error(
            "Dialogue content needs editorial review:\n" + JSON.stringify(sample, null, 4),
        );
    }
    return result;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
    const directory = process.argv[2] ?? "src/core/dialogue-data";
    const lessons = ["A1", "A2", "B1", "B2", "C1", "C2"].flatMap((level) =>
        JSON.parse(fs.readFileSync(path.join(directory, level + ".json"), "utf8")),
    );
    console.log(JSON.stringify(auditDialogueContent(lessons), null, 4));
}
