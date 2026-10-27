import type useSpeech from "../../hooks/useSpeech";

export interface DialogueExercise {
    answers: string[];
    checked: boolean[];
    revealed: boolean[];
    assisted: boolean[];
    index: number;
}

export type DialogueSpeech = ReturnType<typeof useSpeech>;

export const dialogueButtonClassName =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line bg-background px-4 py-2 text-base hover:bg-surface";
