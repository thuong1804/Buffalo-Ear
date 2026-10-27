import type { Level } from "./types";
export const levels: { id: Level; label: string; description: string }[] = [
    { id: "all", label: "common:all", description: "filters:allLevels" },
    { id: "A1", label: "A1", description: "filters:beginner" },
    { id: "A2", label: "A2", description: "filters:elementary" },
    { id: "B1", label: "B1", description: "filters:intermediate" },
    { id: "B2", label: "B2", description: "filters:upperIntermediate" },
];
