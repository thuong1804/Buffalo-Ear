import { useTranslation } from "react-i18next";
import type { DialogueSpeech } from "./shared";

interface DialogueAudioSettingsProps {
    rate: number;
    onRateChange: (rate: number) => void;
    speech: DialogueSpeech;
}

export function DialogueAudioSettings({ rate, onRateChange, speech }: DialogueAudioSettingsProps) {
    const { t } = useTranslation();
    return (
        <>
            {" "}
            <div className="my-5 flex min-w-0 flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 text-base text-muted">
                    {t("practice:speed")}
                    <select
                        aria-label={t("practice:speed")}
                        className="min-h-11 rounded-lg border border-line bg-background px-2 text-base text-ink"
                        value={rate}
                        onChange={(event) => {
                            speech.cancel();
                            onRateChange(Number(event.target.value));
                        }}
                    >
                        {[0.7, 0.85, 1].map((value) => (
                            <option key={value} value={value}>
                                {t("practice:rateValue", { value })}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="flex w-full min-w-0 flex-wrap items-center gap-2 text-base text-muted sm:w-auto sm:flex-1">
                    {t("practice:voice")}
                    <select
                        aria-label={t("practice:voice")}
                        data-testid="dialogue-voice"
                        className="min-h-11 w-full min-w-0 rounded-lg border border-line bg-background px-3 text-base text-ink sm:flex-1"
                        value={speech.voiceChoice}
                        onChange={(event) => speech.changeVoice(event.target.value)}
                    >
                        <option value="device">{t("practice:automaticVoice")}</option>
                        {speech.deviceVoices.map((voice) => (
                            <option key={voice.voiceURI} value={`device:${voice.voiceURI}`}>
                                {voice.name} · {voice.lang}
                            </option>
                        ))}
                        {speech.voiceChoice.startsWith("device:") &&
                            !speech.deviceVoices.some(
                                (voice) => `device:${voice.voiceURI}` === speech.voiceChoice,
                            ) && (
                                <option value={speech.voiceChoice}>
                                    {t("practice:missingVoice")}
                                </option>
                            )}
                    </select>
                </label>
            </div>
            {speech.error && (
                <p
                    role="alert"
                    className="mb-4 rounded-lg border border-error bg-error-soft p-3 text-error"
                >
                    {t(speech.error)}
                </p>
            )}
        </>
    );
}
