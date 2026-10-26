process.env.HOST ||= "127.0.0.1";
process.env.PORT ||= "5174";
await import("../.output/server/index.mjs");
