import { useCallback, useEffect, useRef, useState } from "react";
import ipaAudio from "../core/ipa-audio.json";

const voiceStorageKey = "buffalo-ear-voice";

export default function useSpeech(rate: number) {
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceChoice, setVoiceChoice] = useState("device");
  useEffect(() => {
    try {
      const saved = localStorage.getItem(voiceStorageKey);
      if (saved === "device" || saved?.startsWith("device:")) {
        setVoiceChoice(saved);
      } else if (saved) {
        localStorage.setItem(voiceStorageKey, "device");
      }
    } catch {
      /* Voice choice still works for this session. */
    }
  }, []);
  const generation = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [sampleSound, setSampleSound] = useState<string | null>(null);
  const supported =
    typeof window !== "undefined" && "speechSynthesis" in window;
  const cancel = useCallback(() => {
    generation.current++;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
      audioRef.current = null;
    }
    setSampleSound(null);
    if (supported) window.speechSynthesis.cancel();
    setSpeaking(false);
    setError("");
  }, [supported]);
  useEffect(() => {
    const update = () => setVoices(window.speechSynthesis.getVoices());
    if (supported) {
      update();
      window.speechSynthesis.addEventListener("voiceschanged", update);
    }
    return () => {
      generation.current++;
      if (supported) window.speechSynthesis.cancel();
      audioRef.current?.pause();
      audioRef.current = null;
      if (supported)
        window.speechSynthesis.removeEventListener("voiceschanged", update);
    };
  }, [supported]);
  const changeVoice = useCallback(
    (choice: string) => {
      cancel();
      setVoiceChoice(choice);
      try {
        localStorage.setItem(voiceStorageKey, choice);
      } catch {
        /* Session-only preference. */
      }
    },
    [cancel],
  );
  const speak = useCallback(
    (word: string) => {
      cancel();
      if (!word) return;
      const token = generation.current;
      const speakDevice = () => {
        if (token !== generation.current) return;
        if (!supported) {
          setSpeaking(false);
          setError("errors:audioUnavailable");
          return;
        }
        const utterance = new SpeechSynthesisUtterance(word);
        const requestedVoice = voiceChoice.startsWith("device:")
          ? voices.find((voice) => `device:${voice.voiceURI}` === voiceChoice)
          : undefined;
        utterance.voice =
          requestedVoice ||
          voices.find((v) => v.lang === "en-GB") ||
          voices.find((v) => v.lang.startsWith("en")) ||
          null;
        utterance.lang = utterance.voice?.lang || "en-GB";
        utterance.rate = rate;
        utterance.onstart = () => {
          if (token === generation.current) setSpeaking(true);
        };
        utterance.onend = () => {
          if (token === generation.current) setSpeaking(false);
        };
        utterance.onerror = (event) => {
          if (token !== generation.current) return;
          setSpeaking(false);
          if (!["canceled", "interrupted"].includes(event.error))
            setError("errors:voicePlayback");
        };
        try {
          window.speechSynthesis.speak(utterance);
        } catch {
          setSpeaking(false);
          setError("errors:voiceUnavailable");
        }
      };
      speakDevice();
    },
    [cancel, supported, rate, voices, voiceChoice],
  );
  const playSample = useCallback(
    (sound: string) => {
      cancel();
      const source = ipaAudio[sound as keyof typeof ipaAudio];
      if (!source) return;
      const token = generation.current;
      const audio = new Audio(source);
      audioRef.current = audio;
      setSampleSound(sound);
      setSpeaking(true);
      const fail = () => {
        if (token !== generation.current) return;
        setSpeaking(false);
        setSampleSound(null);
        setError("errors:samplePlayback");
      };
      audio.onended = () => {
        if (token !== generation.current) return;
        setSpeaking(false);
        setSampleSound(null);
      };
      audio.onerror = fail;
      void audio.play().catch(fail);
    },
    [cancel],
  );
  return {
    speak,
    playSample,
    sampleSound,
    cancel,
    speaking,
    error,
    supported,
    voiceChoice,
    changeVoice,
    deviceVoices: voices.filter((voice) =>
      voice.lang.toLowerCase().startsWith("en"),
    ),
  };
}
