import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../db";
import { attempt, userSettings } from "../db/schema";
import { grade } from "../core/learning";
import type { Attempt } from "../core/types";
import { requireUser } from "./session";
import {
    answerSchema,
    historyClientId,
    importSchema,
    normalizeImport,
    settingsSchema,
} from "./validation";

export const submitAnswer = createServerFn({ method: "POST" })
    .middleware([requireUser])
    .validator(answerSchema)
    .handler(async ({ data, context }) => {
        const db = getDb();
        const outcome = grade(data.answer, data.word, data.revealed);
        const clientId = `answer:${data.clientId}`;
        const [inserted] = await db
            .insert(attempt)
            .values({
                userId: context.userId,
                word: data.word,
                answer: data.answer,
                ...outcome,
                clientId,
            })
            .onConflictDoNothing({ target: [attempt.userId, attempt.clientId] })
            .returning();
        const row =
            inserted ??
            (
                await db
                    .select()
                    .from(attempt)
                    .where(and(eq(attempt.userId, context.userId), eq(attempt.clientId, clientId)))
                    .limit(1)
            )[0];
        if (
            !row ||
            row.word !== data.word ||
            row.answer !== data.answer ||
            row.revealed !== data.revealed
        )
            throw new Error("Mã lượt luyện đã được dùng cho đáp án khác.");
        return {
            word: row.word,
            matches: row.matches,
            correct: row.correct,
            revealed: row.revealed,
            date: row.createdAt.toISOString(),
            clientId: data.clientId,
        } satisfies Attempt;
    });
export const getProgress = createServerFn({ method: "GET" })
    .middleware([requireUser])
    .handler(async ({ context }) => {
        const rows = await getDb()
            .select()
            .from(attempt)
            .where(eq(attempt.userId, context.userId))
            .orderBy(desc(attempt.createdAt), desc(attempt.id))
            .limit(5000);
        return rows.reverse().map((row) => ({
            word: row.word,
            matches: row.matches,
            correct: row.correct,
            revealed: row.revealed,
            date: row.createdAt.toISOString(),
        }));
    });
export const getSettings = createServerFn({ method: "GET" })
    .middleware([requireUser])
    .handler(async ({ context }) => {
        const [row] = await getDb()
            .select()
            .from(userSettings)
            .where(eq(userSettings.userId, context.userId))
            .limit(1);
        return row ? settingsSchema.parse(row) : { rate: 0.85, auto: true, level: "all" as const };
    });
export const updateSettings = createServerFn({ method: "POST" })
    .middleware([requireUser])
    .validator(settingsSchema)
    .handler(async ({ data, context }) => {
        await getDb()
            .insert(userSettings)
            .values({ ...data, userId: context.userId })
            .onConflictDoUpdate({
                target: userSettings.userId,
                set: { ...data, updatedAt: new Date() },
            });
        return data;
    });
export const importLocalHistory = createServerFn({ method: "POST" })
    .middleware([requireUser])
    .validator(importSchema)
    .handler(async ({ data, context }) => {
        const history = data.history.map(normalizeImport).filter((h): h is Attempt => h !== null);
        const result = await getDb().transaction(async (tx) => {
            let imported = 0;
            // Bounded chunks avoid PostgreSQL's parameter limit for 5,000 entries.
            for (let i = 0; i < history.length; i += 250) {
                const rows = await tx
                    .insert(attempt)
                    .values(
                        history.slice(i, i + 250).map((h) => ({
                            userId: context.userId,
                            word: h.word,
                            correct: h.correct,
                            matches: h.matches,
                            revealed: h.revealed,
                            createdAt: new Date(h.date),
                            clientId: historyClientId(h),
                        })),
                    )
                    .onConflictDoNothing({ target: [attempt.userId, attempt.clientId] })
                    .returning({ id: attempt.id });
                imported += rows.length;
            }
            await tx
                .insert(userSettings)
                .values({ userId: context.userId, ...data.settings })
                .onConflictDoNothing();
            return {
                imported,
                acknowledged: history.map(historyClientId),
                skipped: data.history.length - history.length,
            };
        });
        return result;
    });
export const clearProgress = createServerFn({ method: "POST" })
    .middleware([requireUser])
    .handler(async ({ context }) => {
        await getDb().delete(attempt).where(eq(attempt.userId, context.userId));
        return { success: true };
    });
