import fs from "node:fs";

export const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];
export const topics = readContent("catalog");
const authoredLevels = new Map();

function readContent(name) {
    const file = new URL(`./dialogue-content/${name}.json`, import.meta.url);
    return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function lessonLines(level, topic, scenario) {
    if (!levels.includes(level)) throw new Error(`Unsupported dialogue level: ${level}`);
    if (!authoredLevels.has(level)) {
        const content = readContent(level);
        if (Object.keys(content).length !== topics.length) {
            throw new Error(`${level}: expected exactly ${topics.length} authored topics`);
        }
        authoredLevels.set(level, content);
    }

    const lessons = authoredLevels.get(level)[topic.id];
    if (!Array.isArray(lessons) || lessons.length !== 10) {
        throw new Error(`${level}/${topic.id}: expected ten authored conversations`);
    }

    const lines = lessons[scenario.number - 1];
    if (!Array.isArray(lines) || lines.length !== 4) {
        throw new Error(`${level}/${topic.id}/${scenario.number}: expected four turns`);
    }
    for (const line of lines) {
        if (typeof line !== "string" || !line.trim() || line.length > 500) {
            throw new Error(`${level}/${topic.id}/${scenario.number}: invalid dialogue turn`);
        }
    }
    return lines;
}
