import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  AudioLines,
  BookOpen,
  ChartNoAxesCombined,
  Check,
  CircleHelp,
  Ear,
  Headphones,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { groups, words } from "../data.js";
import {
  getPool,
  grade,
  makeDeck,
  readSaved,
  storageKey,
  summarize,
} from "./learning.js";
import {
  Library,
  localDay,
  Practice,
  Progress,
  SoundPicker,
  Stat,
} from "./components.jsx";
import useSpeech from "./useSpeech.js";

export default function App() {
  const [saved] = useState(() => {
    try {
      return readSaved(window.localStorage);
    } catch {
      return readSaved({ getItem: () => null });
    }
  });
  const [history, setHistory] = useState(saved.history);
  const [settings, setSettings] = useState(saved.settings);
  const [view, setView] = useState("practice");
  const [group, setGroup] = useState("all");
  const [selected, setSelected] = useState([]);
  const [mode, setMode] = useState("any");
  const [review, setReview] = useState(false);
  const [round, setRound] = useState(() => ({
    deck: makeDeck(words),
    index: 0,
    id: 0,
  }));
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [session, setSession] = useState({ attempted: 0, correct: 0 });
  const [showHelp, setShowHelp] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const inputRef = useRef(null);
  const submitLock = useRef(false);
  const interacted = useRef(false);
  const speech = useSpeech(settings.rate);
  const summary = useMemo(() => summarize(history), [history]);
  const learned = useMemo(
    () =>
      new Set(
        [...new Map(history.map((h) => [h.word, h])).values()]
          .filter((h) => h.correct)
          .map((h) => h.word),
      ),
    [history],
  );
  const pool = useMemo(
    () => getPool(selected, group, mode, review ? summary.mistakes : null),
    [selected, group, mode, review, summary.mistakes],
  );
  const poolRef = useRef(pool);
  poolRef.current = pool;
  const autoRef = useRef(null);
  autoRef.current = { auto: settings.auto, speak: speech.speak };
  const todayCount = history.filter(
    (h) => localDay(h.date) === localDay(new Date()),
  ).length;

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ history, settings }));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [history, settings]);
  useEffect(() => {
    setAnswer("");
    setResult(null);
    setRevealed(false);
    submitLock.current = false;
    const current = round.deck[round.index];
    if (interacted.current && autoRef.current.auto && current)
      autoRef.current.speak(current.word);
    if (interacted.current) inputRef.current?.focus({ preventScroll: true });
  }, [round]);
  function resetPool(
    nextSelected = selected,
    nextGroup = group,
    nextMode = mode,
    nextReview = review,
  ) {
    speech.cancel();
    interacted.current = true;
    const nextPool = getPool(
      nextSelected,
      nextGroup,
      nextMode,
      nextReview ? summary.mistakes : null,
    );
    setRound((r) => ({
      deck: makeDeck(nextPool, r.deck[r.index]?.word),
      index: 0,
      id: r.id + 1,
    }));
  }
  function changeGroup(value) {
    const available = groups
      .filter((g) => value === "all" || g.type === value)
      .flatMap((g) => g.sounds);
    const nextSelected = selected.filter((p) => available.includes(p));
    setGroup(value);
    setSelected(nextSelected);
    resetPool(nextSelected, value);
  }
  function selectSound(sound) {
    const next = selected.includes(sound)
      ? selected.filter((s) => s !== sound)
      : [...selected, sound];
    setSelected(next);
    resetPool(next);
  }
  function nextWord() {
    speech.cancel();
    interacted.current = true;
    setRound((r) => {
      const remaining = r.deck
        .slice(r.index + 1)
        .filter((w) => poolRef.current.some((p) => p.word === w.word));
      return {
        deck: remaining.length
          ? remaining
          : makeDeck(poolRef.current, r.deck[r.index]?.word),
        index: 0,
        id: r.id + 1,
      };
    });
  }
  function submit(event) {
    event.preventDefault();
    const current = round.deck[round.index];
    if (!current || submitLock.current || !answer.trim()) return;
    submitLock.current = true;
    const outcome = grade(answer, current.word, revealed);
    setResult(outcome);
    setSession((s) => ({
      attempted: s.attempted + 1,
      correct: s.correct + Number(outcome.correct),
    }));
    setHistory((h) =>
      [
        ...h,
        { word: current.word, ...outcome, date: new Date().toISOString() },
      ].slice(-5000),
    );
  }
  function start(word) {
    interacted.current = true;
    speech.speak(word);
    inputRef.current?.focus({ preventScroll: true });
  }
  function navigate(nextView) {
    speech.cancel();
    setView(nextView);
  }
  function toggleReview() {
    const next = !review;
    setReview(next);
    resetPool(selected, group, mode, next);
  }
  const nextRef = useRef(nextWord);
  nextRef.current = nextWord;
  useEffect(() => {
    const handler = (e) => {
      if (e.altKey && e.key === "ArrowRight" && view === "practice") {
        e.preventDefault();
        nextRef.current();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [view]);
  function practiceWord(word) {
    navigate("practice");
    interacted.current = true;
    setReview(false);
    setGroup("all");
    setSelected([]);
    setRound((r) => ({
      deck: [word, ...makeDeck(words.filter((w) => w.word !== word.word))],
      index: 0,
      id: r.id + 1,
    }));
  }
  const nav = [
    { id: "practice", label: "Luyện nghe", Icon: Headphones },
    { id: "library", label: "Thư viện", Icon: BookOpen },
    { id: "progress", label: "Tiến độ", Icon: ChartNoAxesCombined },
  ];

  return (
    <>
      <a className="skip-link" href="#main">
        Đến nội dung chính
      </a>
      <header className="site-header">
        <div className="header-inner">
          <a
            className="brand"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate("practice");
            }}
            aria-label="Buffalo Ear trang chủ"
          >
            <span className="brand-mark">
              <Ear size={26} />
            </span>
            <span>
              buffalo ear<span className="brand-dot">®</span>
            </span>
          </a>
          <nav aria-label="Điều hướng chính">
            {nav.map(({ id, label, Icon }) => (
              <button
                key={id}
                aria-current={view === id ? "page" : undefined}
                className={view === id ? "nav-link active" : "nav-link"}
                onClick={() => navigate(id)}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </nav>
          <button
            className="help-button"
            onClick={() => setShowHelp((h) => !h)}
            aria-expanded={showHelp}
            aria-controls="help"
          >
            <CircleHelp size={18} />
            <span>Hướng dẫn</span>
          </button>
        </div>
      </header>
      <main id="main">
        {showHelp && (
          <aside className="help-panel" id="help">
            <div>
              <strong>Ba bước, một thói quen tốt.</strong>
              <p>
                1. Chọn âm IPA → 2. Nhấn nghe → 3. Gõ từ và nhấn Enter. Dùng “Từ
                tiếp theo” hoặc Alt + → để chuyển từ. Xem đáp án trước sẽ không
                được cộng điểm đúng.
              </p>
              <p>
                Giọng đọc ưu tiên Anh–Anh; thiết bị có thể dùng giọng dự phòng.
                Phiên âm trong thư viện không ghi dấu trọng âm.
              </p>
            </div>
            <button
              aria-label="Đóng hướng dẫn"
              onClick={() => setShowHelp(false)}
            >
              <X size={18} />
            </button>
          </aside>
        )}
        {storageError && (
          <p className="audio-error" role="alert">
            Trình duyệt không cho phép lưu tiến độ. Bạn vẫn có thể luyện trong
            phiên này.
          </p>
        )}
        <section className="intro">
          <div>
            <div className="eyebrow">
              <i className="green-dot" /> YOUR DAILY LISTENING CLUB
            </div>
            <h1>
              {view === "practice" ? (
                <>
                  Nghe kỹ. <em>Nhớ lâu.</em>
                  <span className="asterisk">✳</span>
                </>
              ) : view === "library" ? (
                <>
                  Từng từ. <em>Từng bước.</em>
                </>
              ) : (
                <>
                  Đều đặn. <em>Tiến xa.</em>
                </>
              )}
            </h1>
            <p>
              {view === "practice"
                ? "Chọn âm bạn muốn luyện. Lắng nghe và viết lại."
                : view === "library"
                  ? "Những từ nhỏ, mở ra những cuộc trò chuyện lớn."
                  : "Mỗi lần lắng nghe là một bước tiến nhỏ của bạn."}
              <br />
              {view === "practice"
                ? "Một chút mỗi ngày, tiếng Anh gần hơn một chút."
                : view === "library"
                  ? "507 từ thông dụng, sẵn sàng để bạn khám phá."
                  : "Nhìn lại những gì bạn đã học và tiếp tục hành trình."}
            </p>
          </div>
          <div className="daily-card">
            <div className="daily-icon">
              <Target size={22} />
            </div>
            <div>
              <span>MỤC TIÊU HÔM NAY</span>
              <strong>
                {Math.min(todayCount, 20)} <small>/ 20 lượt</small>
              </strong>
              <div
                className="goal-track"
                role="progressbar"
                aria-label="Mục tiêu hôm nay"
                aria-valuenow={Math.min(todayCount, 20)}
                aria-valuemin={0}
                aria-valuemax={20}
              >
                <span
                  style={{ width: `${Math.min(todayCount / 20, 1) * 100}%` }}
                />
              </div>
              <p>
                {todayCount >= 20
                  ? "Bạn đã hoàn thành mục tiêu hôm nay!"
                  : "Một thói quen nhỏ. Một thay đổi lớn."}
              </p>
            </div>
          </div>
        </section>
        {view === "practice" ? (
          <>
            <div className="workspace">
              <SoundPicker
                selected={selected}
                group={group}
                mode={mode}
                onSelect={selectSound}
                onGroup={changeGroup}
                onMode={(value) => {
                  setMode(value);
                  resetPool(selected, group, value);
                }}
                onClear={() => {
                  setSelected([]);
                  resetPool([]);
                }}
                count={pool.length}
              />
              <Practice
                round={round}
                answer={answer}
                setAnswer={setAnswer}
                result={result}
                revealed={revealed}
                reveal={() => setRevealed(true)}
                submit={submit}
                next={nextWord}
                speech={speech}
                settings={settings}
                setSettings={setSettings}
                inputRef={inputRef}
                count={pool.length}
                session={session}
                start={start}
                review={review}
                onReview={toggleReview}
                mistakeCount={summary.mistakes.length}
              />
            </div>
            <div className="practice-note">
              <span className="note-icon">
                <Sparkles size={20} />
              </span>
              <p>
                <strong>Không cần vội. Cứ nghe thêm một lần.</strong>
                <span>Nghe lại, viết lại và cho mình thời gian ghi nhớ.</span>
              </p>
              <span className="keyboard-note">
                <kbd>Enter</kbd> kiểm tra <span>·</span> <kbd>Alt →</kbd> từ
                tiếp theo
              </span>
            </div>
            <div className="overview-strip">
              <Stat icon={AudioLines} value="44" label="Âm IPA để khám phá" />
              <Stat
                icon={BookOpen}
                value={words.length}
                label="Từ vựng thông dụng"
              />
              <Stat
                icon={Check}
                value={summary.learned}
                label="Từ đã trả lời đúng"
              />
              <button onClick={() => navigate("progress")}>
                Xem tiến độ của bạn <ArrowUpRight size={18} />
              </button>
            </div>
          </>
        ) : view === "library" ? (
          <Library
            selected={selected}
            group={group}
            mode={mode}
            learned={learned}
            onPractice={practiceWord}
          />
        ) : (
          <Progress
            history={history}
            summary={summary}
            onReset={() => {
              setHistory([]);
              setSession({ attempted: 0, correct: 0 });
            }}
            onReview={() => {
              navigate("practice");
              setReview(true);
              setGroup("all");
              setSelected([]);
              resetPool([], "all", mode, true);
            }}
          />
        )}
      </main>
      <footer>
        <span className="footer-brand">
          buffalo ear <i /> <span>Made for curious ears.</span>
        </span>
        <span>NGHE TỐT HƠN, TỪNG NGÀY.</span>
      </footer>
    </>
  );
}
