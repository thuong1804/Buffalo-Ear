export type Level = "all" | "A1" | "A2" | "B1" | "B2";
export type Group = "all" | "vowels" | "consonants";
export type MatchMode = "any" | "all";
export type View = "practice" | "library" | "progress";
export interface Word {
  word: string;
  ipa: string;
  meaning: string;
  level: Exclude<Level, "all">;
  phonemes: string[];
}
export interface Outcome {
  matches: boolean;
  correct: boolean;
  revealed: boolean;
}
export interface Attempt extends Outcome {
  word: string;
  date: string;
  clientId?: string;
}
export interface Settings {
  rate: 0.7 | 0.85 | 1;
  auto: boolean;
  level: Level;
}
export interface Saved {
  history: Attempt[];
  settings: Settings;
}
export interface Round {
  autoplay?: boolean;
  deck: Word[];
  index: number;
  id: number;
}
export interface Summary {
  attempted: number;
  correct: number;
  learned: number;
  mistakes: string[];
}
export interface SessionCount {
  attempted: number;
  correct: number;
}
export interface AccountSession {
  user: { id: string; name: string; email: string; image?: string | null };
}
