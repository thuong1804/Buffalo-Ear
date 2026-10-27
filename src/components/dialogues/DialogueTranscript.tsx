import { useTranslation } from "react-i18next";
import { Headphones, Square } from "lucide-react";
import type { DialogueLesson } from "../../core/dialogues";
import { dialogueButtonClassName } from "./shared";
import type { DialogueSpeech } from "./shared";

interface DialogueTranscriptProps {
    lesson: DialogueLesson;
    speech: DialogueSpeech;
}

export function DialogueTranscript({ lesson, speech }: DialogueTranscriptProps) {
    const { t } = useTranslation();
    return (
        <div>
            <button
                type="button"
                data-testid="dialogue-listen-all"
                className={dialogueButtonClassName}
                onClick={() => speech.speak(lesson.lines.map((item) => item.text).join(" "))}
            >
                <Headphones size={18} />
                {t("dialogues:listenAll")}
            </button>
            {speech.speaking && (
                <button
                    type="button"
                    className={dialogueButtonClassName + " ml-2"}
                    onClick={speech.cancel}
                >
                    <Square size={16} />
                    {t("dialogues:stop")}
                </button>
            )}
            <ol className="mt-5 space-y-4">
                {lesson.lines.map((item, i) => (
                    <li key={i} className="rounded-xl border border-line bg-background p-4">
                        <p className="text-base font-semibold">
                            {t("dialogues:answerLabel", {
                                number: i + 1,
                                speaker: item.speaker,
                            })}
                        </p>
                        <p lang="en" className="mt-2 text-lg">
                            {item.text}
                        </p>
                        <p
                            lang="en-GB"
                            className="mt-2 font-ipa text-base leading-relaxed break-words text-primary-ink"
                        >
                            {item.ipa}
                        </p>
                        <button
                            type="button"
                            className={dialogueButtonClassName + " mt-3"}
                            onClick={() => speech.speak(item.text)}
                        >
                            <Headphones size={16} />
                            {t("dialogues:listenLine", {
                                number: i + 1,
                                speaker: item.speaker,
                            })}
                        </button>
                    </li>
                ))}
            </ol>
        </div>
    );
}
