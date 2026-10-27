import { useTranslation } from "react-i18next";
import type { gradeDialogueLine } from "../../core/dialogues";

interface DialogueFeedbackProps {
    grade: ReturnType<typeof gradeDialogueLine>;
    assisted: boolean;
    sentenceNumber: number;
}

export function DialogueFeedback({ grade, assisted, sentenceNumber }: DialogueFeedbackProps) {
    const { t, i18n } = useTranslation();
    return (
        <div
            role="status"
            data-testid="dialogue-result"
            className="mt-4 rounded-xl border border-line bg-background p-4 motion-safe:animate-feedback-in"
        >
            <p className="text-lg font-semibold">
                {t(grade.perfect ? "dialogues:linePerfect" : "dialogues:lineRetry")}
            </p>
            <p>
                {t("dialogues:result", {
                    correct: grade.correct,
                    total: grade.total,
                    score: Math.round((grade.correct / grade.total) * 100),
                })}
            </p>
            {assisted && <p className="mt-2 text-muted">{t("dialogues:assisted")}</p>}
            <div
                aria-label={t("dialogues:comparison", {
                    number: sentenceNumber,
                })}
                className="mt-3 flex flex-wrap gap-2 text-base"
            >
                {grade.words.map((word, position) => (
                    <span
                        key={position}
                        className={
                            word.type === "correct"
                                ? "max-w-full rounded bg-soft px-2 py-1 break-words text-success"
                                : "max-w-full rounded border border-error/30 bg-error-soft px-2 py-1 break-words text-error"
                        }
                    >
                        <span lang={i18n.resolvedLanguage}>{t(`dialogues:${word.type}`)}: </span>
                        <span lang="en">
                            {word.type === "wrong" ? (
                                <>
                                    <s>{word.actual}</s> → {word.expected}
                                </>
                            ) : (
                                (word.expected ?? word.actual)
                            )}
                        </span>
                    </span>
                ))}
            </div>
        </div>
    );
}
