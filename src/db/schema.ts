import {
    pgTable,
    text,
    timestamp,
    boolean,
    uuid,
    real,
    index,
    uniqueIndex,
    check,
    integer,
    bigint,
} from "drizzle-orm/pg-core";
// Auth fields verified against auth@1.7.13 generate; timestamptz stores absolute instants.
import { sql } from "drizzle-orm";

export const rateLimit = pgTable("rate_limit", {
    id: text("id").primaryKey(),
    key: text("key").notNull().unique(),
    count: integer("count").notNull(),
    lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});

export const user = pgTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});
export const session = pgTable(
    "session",
    {
        id: text("id").primaryKey(),
        expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
        token: text("token").notNull().unique(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
        ipAddress: text("ip_address"),
        userAgent: text("user_agent"),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
    },
    (t) => [index("session_user_idx").on(t.userId)],
);
export const account = pgTable(
    "account",
    {
        id: text("id").primaryKey(),
        accountId: text("account_id").notNull(),
        providerId: text("provider_id").notNull(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        accessToken: text("access_token"),
        refreshToken: text("refresh_token"),
        idToken: text("id_token"),
        accessTokenExpiresAt: timestamp("access_token_expires_at", {
            withTimezone: true,
        }),
        refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
            withTimezone: true,
        }),
        scope: text("scope"),
        password: text("password"),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (t) => [
        index("account_user_idx").on(t.userId),
        uniqueIndex("account_provider_unique").on(t.providerId, t.accountId),
    ],
);
export const verification = pgTable(
    "verification",
    {
        id: text("id").primaryKey(),
        identifier: text("identifier").notNull(),
        value: text("value").notNull(),
        expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (t) => [index("verification_identifier_idx").on(t.identifier)],
);
export const attempt = pgTable(
    "attempt",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        word: text("word").notNull(),
        answer: text("answer"), // Legacy guest history has no original answer.
        correct: boolean("correct").notNull(),
        matches: boolean("matches").notNull(),
        revealed: boolean("revealed").notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        clientId: text("client_id").notNull(),
    },
    (t) => [
        index("attempt_user_created_idx").on(t.userId, t.createdAt),
        uniqueIndex("attempt_user_client_unique").on(t.userId, t.clientId),
        check(
            "attempt_correct_check",
            sql`NOT ${t.correct} OR (${t.matches} AND NOT ${t.revealed})`,
        ),
    ],
);
export const userSettings = pgTable(
    "user_settings",
    {
        userId: text("user_id")
            .primaryKey()
            .references(() => user.id, { onDelete: "cascade" }),
        rate: real("rate").default(0.85).notNull(),
        auto: boolean("auto").default(true).notNull(),
        level: text("level").default("all").notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => [
        check("settings_rate_check", sql`${t.rate} IN (0.7, 0.85, 1)`),
        check("settings_level_check", sql`${t.level} IN ('all', 'A1', 'A2', 'B1', 'B2')`),
    ],
);
