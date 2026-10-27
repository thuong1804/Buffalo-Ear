import { memo } from "react";
import { useTranslation } from "react-i18next";
import { dialogueTopics } from "../../core/dialogues";
import type { DialogueLevel } from "../../core/dialogues";
import type { Locale } from "../../i18n/locale";
import { Check } from "lucide-react";

interface DialogueTopicPickerProps {
    level: DialogueLevel;
    topicId: string;
    locale: Locale;
    onSelect: (topicId: string) => void;
}

export const DialogueTopicPicker = memo(function DialogueTopicPicker({
    level,
    topicId,
    locale,
    onSelect,
}: DialogueTopicPickerProps) {
    const { t } = useTranslation();
    return (
        <aside aria-label={t("dialogues:topics")} className="min-w-0">
            <h2 className="mb-3 text-lg font-semibold">{t("dialogues:topics")}</h2>
            <select
                aria-label={t("dialogues:topics")}
                className="min-h-11 w-full rounded-lg border border-line bg-background px-3 text-base sm:hidden"
                value={topicId}
                onChange={(event) => onSelect(event.target.value)}
            >
                {dialogueTopics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                        {topic.title[locale]}
                    </option>
                ))}
            </select>
            <div className="hidden gap-3 sm:grid sm:grid-cols-2 lg:max-h-[680px] lg:grid-cols-1 lg:overflow-y-auto lg:pr-1">
                {dialogueTopics.map((topic) => (
                    <button
                        key={topic.id}
                        type="button"
                        aria-pressed={topicId === topic.id}
                        data-testid={`topic-${topic.id}`}
                        className="relative min-h-20 rounded-xl border border-line bg-paper p-4 pr-10 text-left hover:border-primary hover:bg-soft aria-pressed:border-primary aria-pressed:bg-surface aria-pressed:shadow-[inset_3px_0_0_var(--color-primary)]"
                        onClick={() => onSelect(topic.id)}
                    >
                        <span className="block text-base text-muted">
                            {level} · {t("dialogues:lessonCount", { count: topic.lessonCount })}
                        </span>
                        <span className="mt-1 block text-lg font-semibold">
                            {topic.title[locale]}
                        </span>
                        {topicId === topic.id && (
                            <Check
                                size={17}
                                className="absolute top-4 right-3 text-primary motion-safe:animate-choice-check"
                                aria-hidden="true"
                            />
                        )}
                    </button>
                ))}
            </div>
        </aside>
    );
});
