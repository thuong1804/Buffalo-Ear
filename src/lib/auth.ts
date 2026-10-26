import "@tanstack/react-start/server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { getDb } from "../db";
import * as schema from "../db/schema";

export function authConfigured() {
  return Boolean(
    process.env.DATABASE_URL &&
    process.env.BETTER_AUTH_SECRET &&
    process.env.BETTER_AUTH_SECRET.length >= 32 &&
    process.env.BETTER_AUTH_URL,
  );
}
export function googleConfigured() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );
}
let instance: ReturnType<typeof createAuth> | undefined;
function createAuth() {
  if (!authConfigured())
    throw new Error(
      "Configure DATABASE_URL, BETTER_AUTH_URL and BETTER_AUTH_SECRET (32+ characters)",
    );
  return betterAuth({
    baseURL: process.env.BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(getDb(), { provider: "pg", schema }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
    },
    socialProviders: googleConfigured()
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          },
        }
      : {},
    rateLimit: { enabled: true },
    plugins: [tanstackStartCookies()],
  });
}
export function getAuth() {
  return (instance ??= createAuth());
}
