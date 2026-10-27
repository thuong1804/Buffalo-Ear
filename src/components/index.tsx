import { useTranslation } from "react-i18next";
import { useState } from "react";
import type useSpeech from "../hooks/useSpeech";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Check, SlidersHorizontal, Volume2, Square } from "lucide-react";
import type { Group, Level, MatchMode } from "../core/types";
import { groups, words } from "../core/data";
import { levels } from "../core/levels";

const levelCounts = Object.fromEntries(
    levels.map((level) => [
        level.id,
        level.id === "all" ? words.length : words.filter((w) => w.level === level.id).length,
    ]),
);

export function LevelFilter({
    level,
    onChange,
}: {
    level: Level;
    onChange: (level: Level) => void;
}) {
    const { t } = useTranslation();

    return (
        <section
            data-testid="level-filter"
            className="mb-6 flex items-stretch gap-7 rounded-[14px] border border-line bg-surface px-6 py-5.5 max-[1100px]:flex-col max-[1100px]:gap-4.5 max-[800px]:gap-4 max-[800px]:p-5 max-[600px]:mb-4.5"
            aria-labelledby="level-heading"
        >
            <div
                data-testid="level-filter-heading"
                className="max-w-[250px] shrink-0 max-[1100px]:max-w-none [&>h2]:mt-1 [&>h2]:text-[22px] [&>h2]:font-semibold [&>h2]:tracking-[-0.015em] [&>p]:mt-1 [&>p]:text-base [&>p]:leading-[1.7] [&>p]:text-muted"
            >
                <span
                    data-testid="eyebrow"
                    className="flex flex-wrap items-center gap-2 text-base leading-relaxed font-normal tracking-normal text-muted"
                >
                    {t("filters:journey")}
                </span>
                <h2 id="level-heading">{t("filters:chooseLevel")}</h2>
                <p>{t("filters:levelDescription")}</p>
            </div>
            <div
                data-testid="level-options"
                className="grid min-w-0 flex-1 grid-cols-5 gap-2 max-[1100px]:w-full max-[600px]:grid-cols-2"
                role="group"
                aria-label={t("filters:levelGroup")}
            >
                {levels.map((item) => (
                    <button
                        key={item.id}
                        data-testid="level-option"
                        className="flex min-h-[114px] flex-col items-stretch gap-1 rounded-[9px] border border-line bg-paper px-3 py-2.5 text-left hover:not-aria-pressed:border-primary hover:not-aria-pressed:bg-soft aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-background max-[600px]:min-h-[108px] max-[600px]:px-3.5 max-[600px]:py-3 max-[600px]:first:col-span-full max-[600px]:first:grid max-[600px]:first:min-h-16 max-[600px]:first:grid-cols-[1fr_auto] max-[600px]:first:items-center [&_strong]:text-xl [&_strong]:font-semibold [&>small]:text-base [&>span]:text-base max-[600px]:first:[&>span:first-child]:justify-start max-[600px]:first:[&>span:first-child]:gap-2.5 max-[600px]:first:[&>span:nth-child(2)]:hidden"
                        aria-label={t("filters:levelLabel", {
                            level: item.id === "all" ? t("common:all") : item.label,
                        })}
                        aria-pressed={level === item.id}
                        onClick={() => onChange(item.id)}
                    >
                        <span
                            data-testid="level-option-top"
                            className="flex items-center justify-between gap-1"
                        >
                            <strong>{item.id === "all" ? t("common:all") : item.label}</strong>
                            {level === item.id && (
                                <Check
                                    size={16}
                                    className="motion-safe:animate-choice-check"
                                    aria-hidden="true"
                                />
                            )}
                        </span>
                        <span>{t(item.description)}</span>
                        <small>{t("common:wordCount", { count: levelCounts[item.id] })}</small>
                    </button>
                ))}
            </div>
        </section>
    );
}

export const localDay = (date: string | Date) => new Date(date).toLocaleDateString("en-CA");
const tabs: { id: Group; name: string }[] = [
    { id: "all", name: "common:all" },
    { id: "vowels", name: "filters:vowels" },
    { id: "consonants", name: "filters:consonants" },
];
const examples = Object.fromEntries(
    groups
        .flatMap((g) => g.sounds)
        .map((p) => [p, words.find((w) => w.phonemes.includes(p))?.word]),
);
export function Stat({
    value,
    label,
    icon: Icon,
}: {
    value: string | number;
    label: string;
    icon: LucideIcon;
}) {
    const { i18n } = useTranslation();
    const formattedValue =
        typeof value === "number"
            ? new Intl.NumberFormat(i18n.resolvedLanguage === "en" ? "en-GB" : "vi-VN").format(
                  value,
              )
            : value;
    return (
        <div
            data-testid="stat"
            className="flex min-w-0 items-center gap-3 max-[600px]:gap-2 [&_span]:text-base [&_strong]:block [&_strong]:text-[21px] [&_strong]:font-semibold [&_strong]:text-primary-ink [&_strong]:tabular-nums max-[600px]:[&_strong]:text-[26px] [&>div]:min-w-0 [&>div>span]:mt-0.5 [&>div>span]:block [&>div>span]:text-muted"
        >
            <span
                data-testid="stat-icon"
                className="grid size-[34px] shrink-0 place-items-center rounded-[9px] bg-surface text-primary-ink"
            >
                <Icon size={18} />
            </span>
            <div>
                <strong>{formattedValue}</strong>
                <span>{label}</span>
            </div>
        </div>
    );
}
export function SectionTitle({
    number,
    title,
    children,
}: {
    number: string;
    title: ReactNode;
    children?: ReactNode;
}) {
    return (
        <div
            data-testid="section-heading"
            className="flex flex-wrap items-start justify-between gap-3 max-[800px]:gap-1.5 [&_h2]:mt-2 [&_h2]:text-[22px] [&_h2]:leading-normal [&_h2]:font-semibold [&_h2]:tracking-[-0.015em] [&>div]:min-w-0 [&>div]:flex-[1_1_240px] max-[600px]:[&>div]:basis-full"
        >
            <div>
                <span
                    data-testid="eyebrow"
                    className="flex flex-wrap items-center gap-2 text-base leading-relaxed font-normal tracking-normal text-muted"
                >
                    {number}
                </span>
                <h2>{title}</h2>
            </div>
            {children}
        </div>
    );
}

export function SoundPicker({
    selected,
    speech,
    group,
    mode,
    onSelect,
    onGroup,
    onMode,
    onClear,
    count,
}: {
    selected: string[];
    speech: ReturnType<typeof useSpeech>;
    group: Group;
    mode: MatchMode;
    onSelect: (sound: string) => void;
    onGroup: (group: Group) => void;
    onMode: (mode: MatchMode) => void;
    onClear: () => void;
    count: number;
}) {
    const { t } = useTranslation();

    const [previewSound, setPreviewSound] = useState("iː");
    const playingSample = speech.speaking && speech.sampleSound === previewSound;
    return (
        <section
            data-testid="sounds-panel"
            className="min-w-0 rounded-2xl border border-line bg-paper p-5 shadow-panel min-[901px]:p-7 min-[1500px]:p-8"
            aria-labelledby="sounds-heading"
        >
            <SectionTitle
                number={t("filters:step")}
                title={<span id="sounds-heading">{t("filters:title")}</span>}
            >
                <button
                    data-testid="text-button"
                    className="inline-flex min-h-11 items-center justify-center gap-2 border-0 bg-transparent px-1 py-1.5 text-base font-normal whitespace-nowrap text-muted hover:text-primary-ink"
                    onClick={onClear}
                    disabled={!selected.length}
                >
                    {t("filters:clear")}
                </button>
            </SectionTitle>
            <p
                data-testid="section-description"
                className="mt-2.5 text-base leading-[1.8] text-muted"
            >
                {t("filters:description")}
            </p>
            <div
                data-testid="ipa-preview"
                className="mt-4 rounded-xl border border-line bg-background p-4"
            >
                <label htmlFor="ipa-sample" className="block text-base text-ink">
                    {t("filters:previewTitle")}
                </label>
                <p className="mt-1 text-base leading-relaxed text-muted">
                    {t("filters:previewDescription")}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                    <select
                        id="ipa-sample"
                        value={previewSound}
                        className="min-h-11 rounded-lg border border-line bg-background px-3 font-ipa text-xl text-ink"
                        onChange={(e) => {
                            speech.cancel();
                            setPreviewSound(e.target.value);
                        }}
                    >
                        {groups.map((g) => (
                            <optgroup label={t(g.name)} key={g.name}>
                                {g.sounds.map((sound) => (
                                    <option key={sound} value={sound}>
                                        /{sound}/
                                    </option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                    <button
                        type="button"
                        data-testid="ipa-listen-button"
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-base text-background hover:bg-ink"
                        onClick={() =>
                            playingSample ? speech.cancel() : speech.playSample(previewSound)
                        }
                    >
                        {playingSample ? <Square size={16} /> : <Volume2 size={18} />}
                        {playingSample ? t("filters:stopSample") : t("filters:playSample")}
                    </button>
                </div>
                <p role="status" className="mt-2 text-base text-muted">
                    {playingSample
                        ? t("filters:samplePlaying", { sound: previewSound })
                        : t("filters:sampleNote")}
                </p>
            </div>
            <div
                data-testid="segmented"
                className="mt-6 mb-5 flex flex-wrap gap-1 rounded-[9px] bg-background p-1.5 [&_button_span]:rounded-sm [&_button_span]:bg-surface [&_button_span]:px-1 [&_button_span]:py-px [&_button_span]:text-base [&_button:first-child]:grow-[1.1]"
                aria-label={t("filters:soundGroup")}
            >
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        aria-pressed={tab.id === group}
                        className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-1 rounded-md border-0 bg-transparent px-1.5 py-1.5 text-base whitespace-nowrap text-muted hover:bg-soft aria-pressed:bg-ink aria-pressed:font-medium aria-pressed:text-background max-[600px]:basis-0 max-[600px]:px-0.5 aria-pressed:[&_span]:bg-background/15 aria-pressed:[&_span]:text-background"
                        onClick={() => onGroup(tab.id)}
                    >
                        {t(tab.name)}
                        {tab.id === "all" && <span>44</span>}
                    </button>
                ))}
            </div>
            <div
                data-testid="sound-groups"
                className="[&>div+div]:mt-5 max-[600px]:[&>div+div]:mt-5.5"
            >
                {groups
                    .filter((g) => group === "all" || g.type === group)
                    .map((g) => (
                        <div data-testid="sound-group" className="min-w-0" key={g.name}>
                            <div
                                data-testid="group-label"
                                className="mb-2.5 flex items-center justify-between text-base text-muted [&>h3]:font-normal"
                            >
                                <h3>{t(g.name)}</h3>
                                <span>{t("filters:soundCount", { count: g.sounds.length })}</span>
                            </div>
                            <div
                                data-testid="sound-grid"
                                className="grid grid-cols-8 gap-[7px] max-[1100px]:grid-cols-6 max-[900px]:grid-cols-8 max-[600px]:grid-cols-6"
                            >
                                {g.sounds.map((p) => (
                                    <button
                                        data-testid="sound"
                                        className="relative inline-flex h-[46px] min-w-0 items-center justify-center rounded-[7px] border border-line bg-background font-ipa text-[22px] leading-none font-normal hover:border-primary hover:bg-soft aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-background max-[600px]:h-[47px] max-[600px]:text-[23px] min-[1500px]:h-[49px]"
                                        key={p}
                                        aria-label={t("filters:selectSound", { sound: p })}
                                        aria-pressed={selected.includes(p)}
                                        onClick={() => onSelect(p)}
                                        title={`/${p}/ · ${examples[p]}`}
                                    >
                                        <span>{p}</span>
                                        {selected.includes(p) && (
                                            <Check
                                                data-testid="sound-check"
                                                className="absolute top-[3px] right-[3px] motion-safe:animate-choice-check"
                                                size={10}
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
            </div>
            <div
                data-testid="filter-options"
                className="mt-6 flex flex-wrap items-center gap-2 text-base text-muted [&>select]:min-h-11 [&>select]:min-w-0 [&>select]:flex-[1_1_220px] [&>select]:rounded-md [&>select]:border-0 [&>select]:bg-background [&>select]:px-2 [&>select]:py-2.5 [&>select]:text-base [&>select]:text-primary-ink max-[600px]:[&>select]:basis-full"
            >
                <SlidersHorizontal size={14} />
                <label htmlFor="match-mode">{t("filters:matchLabel")}</label>
                <select
                    id="match-mode"
                    value={mode}
                    onChange={(e) => onMode(e.target.value as MatchMode)}
                >
                    <option value="any">{t("filters:matchAny")}</option>
                    <option value="all">{t("filters:matchAll")}</option>
                </select>
            </div>
            <div
                data-testid="selection-footer"
                className="mt-4 flex flex-wrap items-center justify-between gap-2.5 gap-y-3 border-t border-line pt-4 text-base text-muted [&_i]:inline-block [&_i]:size-1.5 [&_i]:shrink-0 [&_i]:rounded-full [&_i]:bg-primary [&_strong]:font-medium [&_strong]:text-primary-ink [&>span]:flex [&>span]:flex-wrap [&>span]:items-center [&>span]:gap-1"
            >
                <span>
                    <i /> <strong>{t("filters:selectedCount", { count: selected.length })}</strong>
                </span>
                <span aria-live="polite">
                    {t("filters:matchingCount", { count })}
                    <ArrowRight size={12} />
                </span>
            </div>
        </section>
    );
}
