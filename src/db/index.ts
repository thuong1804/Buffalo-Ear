import "@tanstack/react-start/server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let instance: ReturnType<typeof connect> | undefined;
function connect() {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
    const client = postgres(process.env.DATABASE_URL, {
        // Each Vercel instance shares Neon's pooler rather than opening ten sessions.
        max: process.env.VERCEL ? 1 : 10,
        prepare: false,
        idle_timeout: 20,
        connect_timeout: 10,
    });
    return drizzle(client, { schema });
}
export function getDb() {
    return (instance ??= connect());
}
