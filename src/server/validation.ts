import { z } from "zod";
import { words } from "../core/data";
import type { Attempt } from "../core/types";
const knownWords = new Set(words.map((w) => w.word));
export const settingsSchema = z.object({
    rate: z.union([z.literal(0.7), z.literal(0.85), z.literal(1)]),
    auto: z.boolean(),
    level: z.enum(["all", "A1", "A2", "B1", "B2"]),
});
export const answerSchema = z.object({
    word: z
        .string()
        .max(100)
        .refine((word) => knownWords.has(word), "Unknown word"),
    answer: z.string().trim().min(1).max(100),
    revealed: z.boolean(),
    clientId: z.string().uuid(),
});
export const importEntrySchema = z.object({
    word: z
        .string()
        .max(100)
        .refine((word) => knownWords.has(word)),
    date: z.iso
        .datetime({ offset: true })
        .refine((date) => Date.parse(date) <= Date.now() + 300_000),
    correct: z.boolean(),
    matches: z.boolean(),
    revealed: z.boolean().optional(),
    clientId: z.string().max(100).optional(),
});
export const importSchema = z.object({
    history: z.array(z.unknown()).max(5000),
    settings: settingsSchema,
});
export function normalizeImport(value: unknown): Attempt | null {
    const result = importEntrySchema.safeParse(value);
    if (!result.success) return null;
    const h = result.data;
    const revealed = h.revealed ?? (h.matches && !h.correct);
    return {
        ...h,
        date: new Date(h.date).toISOString(),
        revealed,
        correct: h.correct && h.matches && !revealed,
    };
}
export function historyClientId(h: Pick<Attempt, "word" | "date" | "clientId">) {
    return `guest:${h.clientId ?? `${h.word}:${new Date(h.date).toISOString()}`}`;
}
