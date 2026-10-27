import catalog from "./dialogue-data/catalog.json";
export const dialogueLevels = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type DialogueLevel = (typeof dialogueLevels)[number];
export interface DialogueLine {
    speaker: "A" | "B";
    text: string;
    ipa: string;
}
export interface DialogueLesson {
    id: string;
    level: DialogueLevel;
    topicId: string;
    number: number;
    title: { vi: string; en: string };
    lines: DialogueLine[];
}
export const dialogueTopics = catalog;
const levelLoaders = {
    A1: () => import("./dialogue-data/A1.json"),
    A2: () => import("./dialogue-data/A2.json"),
    B1: () => import("./dialogue-data/B1.json"),
    B2: () => import("./dialogue-data/B2.json"),
    C1: () => import("./dialogue-data/C1.json"),
    C2: () => import("./dialogue-data/C2.json"),
};
export async function loadDialogueLevel(level: DialogueLevel): Promise<DialogueLesson[]> {
    return (await levelLoaders[level]()).default as DialogueLesson[];
}

export type WordComparison = {
    type: "correct" | "missing" | "extra" | "wrong";
    expected?: string;
    actual?: string;
};

export function dialogueWords(text: string) {
    return (
        text
            .normalize("NFKC")
            .toLowerCase()
            .replace(/[’‘]/g, "'")
            .match(/[a-z0-9]+(?:'[a-z0-9]+)*/g) ?? []
    );
}

// Edit-distance alignment keeps a missing word from marking every later word wrong.
export function gradeDialogueLine(expectedText: string, actualText: string) {
    const expected = dialogueWords(expectedText);
    const actual = dialogueWords(actualText);
    const costs = Array.from({ length: expected.length + 1 }, (_, i) =>
        Array.from({ length: actual.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
    );
    for (let i = 1; i <= expected.length; i++) {
        for (let j = 1; j <= actual.length; j++) {
            costs[i][j] = Math.min(
                costs[i - 1][j] + 1,
                costs[i][j - 1] + 1,
                costs[i - 1][j - 1] + (expected[i - 1] === actual[j - 1] ? 0 : 1),
            );
        }
    }
    const words: WordComparison[] = [];
    let i = expected.length,
        j = actual.length;
    while (i || j) {
        if (i && j && expected[i - 1] === actual[j - 1] && costs[i][j] === costs[i - 1][j - 1]) {
            words.push({
                type: "correct",
                expected: expected[--i],
                actual: actual[--j],
            });
        } else if (i && j && costs[i][j] === costs[i - 1][j - 1] + 1) {
            words.push({
                type: "wrong",
                expected: expected[--i],
                actual: actual[--j],
            });
        } else if (i && costs[i][j] === costs[i - 1][j] + 1) {
            words.push({ type: "missing", expected: expected[--i] });
        } else {
            words.push({ type: "extra", actual: actual[--j] });
        }
    }
    words.reverse();
    const correct = words.filter((word) => word.type === "correct").length;
    const total = Math.max(expected.length, actual.length);
    return {
        words,
        correct,
        total,
        perfect: costs[expected.length][actual.length] === 0,
    };
}
