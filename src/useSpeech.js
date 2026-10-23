import { useCallback, useEffect, useRef, useState } from "react";

export default function useSpeech(rate) {
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState("");
  const [voices, setVoices] = useState([]);
  const generation = useRef(0);
  const supported =
    typeof window !== "undefined" && "speechSynthesis" in window;
  const cancel = useCallback(() => {
    generation.current++;
    if (supported) window.speechSynthesis.cancel();
    setSpeaking(false);
    setError("");
  }, [supported]);
  useEffect(() => {
    if (!supported) return;
    const update = () => setVoices(window.speechSynthesis.getVoices());
    update();
    window.speechSynthesis.addEventListener("voiceschanged", update);
    return () => {
      generation.current++;
      window.speechSynthesis.cancel();
      window.speechSynthesis.removeEventListener("voiceschanged", update);
    };
  }, [supported]);
  const speak = useCallback(
    (word) => {
      cancel();
      if (!supported) {
        setError(
          "Thiết bị chưa hỗ trợ giọng đọc. Hãy mở app bằng Chrome hoặc Edge.",
        );
        return;
      }
      if (!word) return;
      const token = generation.current;
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = "en-GB";
      utterance.rate = rate;
      utterance.voice =
        voices.find((v) => v.lang === "en-GB") ||
        voices.find((v) => v.lang.startsWith("en")) ||
        null;
      utterance.onstart = () => {
        if (token === generation.current) setSpeaking(true);
      };
      utterance.onend = () => {
        if (token === generation.current) setSpeaking(false);
      };
      utterance.onerror = (e) => {
        if (token !== generation.current) return;
        setSpeaking(false);
        if (!["canceled", "interrupted"].includes(e.error))
          setError(
            "Chưa phát được âm thanh. Nhấn nghe lại hoặc kiểm tra giọng tiếng Anh trên thiết bị.",
          );
      };
      window.speechSynthesis.speak(utterance);
    },
    [cancel, supported, rate, voices],
  );
  return { speak, cancel, speaking, error, supported };
}
