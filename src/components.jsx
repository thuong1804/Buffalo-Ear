import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Ear,
  Eye,
  Headphones,
  Keyboard,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Volume2,
  X,
} from "lucide-react";
import { groups, words } from "../data.js";
import { getPool } from "./learning.js";

export const localDay = (date) => new Date(date).toLocaleDateString("en-CA");
const tabs = [
  { id: "all", name: "Tất cả" },
  { id: "vowels", name: "Nguyên âm" },
  { id: "consonants", name: "Phụ âm" },
];
const examples = Object.fromEntries(
  groups
    .flatMap((g) => g.sounds)
    .map((p) => [p, words.find((w) => w.phonemes.includes(p))?.word]),
);
export function Stat({ value, label, icon: Icon }) {
  return (
    <div className="stat">
      <span className="stat-icon">
        <Icon size={18} />
      </span>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}
export function SectionTitle({ number, title, children }) {
  return (
    <div className="section-heading">
      <div>
        <span className="eyebrow">{number}</span>
        <h2>{title}</h2>
      </div>
      {children}
    </div>
  );
}

export function SoundPicker({
  selected,
  group,
  mode,
  onSelect,
  onGroup,
  onMode,
  onClear,
  count,
}) {
  return (
    <section className="panel sounds-panel" aria-labelledby="sounds-heading">
      <SectionTitle
        number="01 / CHỌN ÂM CỦA BẠN"
        title={<span id="sounds-heading">Hôm nay, luyện âm nào?</span>}
      >
        <button
          className="text-button"
          onClick={onClear}
          disabled={!selected.length}
        >
          Bỏ chọn
        </button>
      </SectionTitle>
      <p className="section-description">
        Chọn nhiều âm để tạo bộ từ phù hợp với bạn.
      </p>
      <div className="segmented" aria-label="Nhóm âm">
        {tabs.map((t) => (
          <button
            key={t.id}
            aria-pressed={t.id === group}
            className={t.id === group ? "active" : ""}
            onClick={() => onGroup(t.id)}
          >
            {t.name}
            {t.id === "all" && <span>44</span>}
          </button>
        ))}
      </div>
      <div className="sound-groups">
        {groups
          .filter((g) => group === "all" || g.type === group)
          .map((g) => (
            <div className="sound-group" key={g.name}>
              <div className="group-label">
                <h3>{g.name}</h3>
                <span>{g.sounds.length} âm</span>
              </div>
              <div className="sound-grid">
                {g.sounds.map((p) => (
                  <button
                    className={`sound ${selected.includes(p) ? "selected" : ""}`}
                    key={p}
                    aria-label={`Chọn âm /${p}/`}
                    aria-pressed={selected.includes(p)}
                    onClick={() => onSelect(p)}
                    title={`/${p}/ · ${examples[p]}`}
                  >
                    <span>{p}</span>
                    {selected.includes(p) && (
                      <Check className="sound-check" size={10} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
      </div>
      <div className="filter-options">
        <SlidersHorizontal size={14} />
        <label htmlFor="match-mode">Từ chứa</label>
        <select
          id="match-mode"
          value={mode}
          onChange={(e) => onMode(e.target.value)}
        >
          <option value="any">ít nhất một âm đã chọn</option>
          <option value="all">tất cả âm đã chọn</option>
        </select>
      </div>
      <div className="selection-footer">
        <span>
          <i /> <strong>{selected.length}</strong> âm đã chọn
        </span>
        <span aria-live="polite">
          {count} từ phù hợp <ArrowRight size={12} />
        </span>
      </div>
    </section>
  );
}

export function Practice({
  round,
  answer,
  setAnswer,
  result,
  revealed,
  reveal,
  submit,
  next,
  speech,
  settings,
  setSettings,
  inputRef,
  count,
  session,
  start,
  review,
  onReview,
  mistakeCount,
}) {
  const current = round.deck[round.index];
  const visible = revealed || result;
  return (
    <section
      className="panel practice-panel"
      aria-labelledby="practice-heading"
    >
      <SectionTitle
        number="02 / LẮNG NGHE & GHI NHỚ"
        title={<span id="practice-heading">Để đôi tai dẫn đường.</span>}
      >
        <span className="live-badge">
          <i /> {review ? "ÔN TẬP" : "LUYỆN NGHE"}
        </span>
      </SectionTitle>
      <div className="practice-controls">
        <span>
          <Headphones size={14} /> {count} từ · Anh–Anh
        </span>
        <label htmlFor="rate">
          Tốc độ{" "}
          <select
            id="rate"
            value={settings.rate}
            onChange={(e) =>
              setSettings((s) => ({ ...s, rate: Number(e.target.value) }))
            }
          >
            <option value="0.7">0.7×</option>
            <option value="0.85">0.85×</option>
            <option value="1">1×</option>
          </select>
        </label>
      </div>
      {current ? (
        <>
          <div className="listen-stage">
            <span className="eyebrow">
              {visible ? "ĐÁP ÁN CỦA BẠN" : "MỘT TỪ ĐANG CHỜ BẠN"}
            </span>
            <div
              className={`secret-word ${visible ? "revealed" : ""}`}
              aria-live="polite"
            >
              {visible ? current.word : "••••••"}
            </div>
            <div className="pronunciation">
              {visible
                ? `/${current.ipa}/ · ${current.meaning}`
                : "Nghe âm thanh. Hình dung con chữ."}
            </div>
            <button
              className={`listen-button ${speech.speaking ? "speaking" : ""}`}
              onClick={() => start(current.word)}
              aria-label="Nghe từ vựng"
            >
              <Volume2 size={30} strokeWidth={1.6} />
            </button>
            <span className="listen-caption">
              {speech.speaking
                ? "Đang đọc…"
                : "Nhấn để nghe · Nghe lại không giới hạn"}
            </span>
            <button
              className="text-button reveal-button"
              disabled={Boolean(visible)}
              onClick={reveal}
            >
              <Eye size={14} />
              {visible ? "Đã hiện đáp án" : "Hiện đáp án"}
            </button>
          </div>
          {speech.error && (
            <p className="audio-error" role="alert">
              {speech.error}
            </p>
          )}
          <form onSubmit={submit} className="answer-form">
            <label htmlFor="answer">Bạn nghe được từ gì?</label>
            <div
              className={`answer-row ${result ? (result.correct ? "is-correct" : "is-incorrect") : ""}`}
            >
              <input
                ref={inputRef}
                id="answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Nhập từ tiếng Anh…"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                required
                readOnly={Boolean(result)}
                aria-describedby="answer-feedback"
              />
              <button type="submit" disabled={Boolean(result)}>
                Kiểm tra <span>↵</span>
              </button>
            </div>
            <div
              id="answer-feedback"
              className={`feedback ${result ? (result.correct ? "success" : "error") : ""}`}
              role="status"
            >
              {result ? (
                result.correct ? (
                  <>
                    <Check size={16} /> Chính xác! Thêm một từ bạn đã nhớ.
                  </>
                ) : result.matches ? (
                  "Bạn đã xem đáp án. Thử tự nghe ở từ tiếp theo nhé."
                ) : (
                  <>
                    Chưa đúng. Đáp án là <strong>{current.word}</strong>. Nghe
                    lại và ghi nhớ nhé.
                  </>
                )
              ) : (
                <>
                  <Keyboard size={13} /> Nhấn Enter để kiểm tra đáp án.
                </>
              )}
            </div>
          </form>
          <div className="practice-actions">
            <label className="switch-label">
              <input
                type="checkbox"
                checked={settings.auto}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, auto: e.target.checked }))
                }
              />
              <span className="switch" />
              Tự động đọc
            </label>
            <button className="next-button" onClick={next}>
              Từ tiếp theo <ArrowRight size={16} />
            </button>
          </div>
          <div className="session-stats">
            <div>
              <strong>{session.attempted}</strong>
              <span>ĐÃ LUYỆN</span>
            </div>
            <div>
              <strong>{session.correct}</strong>
              <span>CHÍNH XÁC</span>
            </div>
            <div>
              <strong>
                {session.attempted
                  ? Math.round((session.correct / session.attempted) * 100) +
                    "%"
                  : "—"}
              </strong>
              <span>TỈ LỆ ĐÚNG</span>
            </div>
          </div>
        </>
      ) : (
        <div className="empty-state">
          <Search size={32} />
          <h3>
            {review ? "Bạn đã ôn hết các từ cần luyện!" : "Chưa có từ phù hợp"}
          </h3>
          <p>
            {review
              ? "Quay lại bộ từ để tiếp tục khám phá."
              : "Thử bỏ bớt âm hoặc chọn “ít nhất một âm”."}
          </p>
        </div>
      )}
      <button
        className="review-link"
        disabled={!review && !mistakeCount}
        onClick={onReview}
      >
        <RotateCcw size={13} />
        {review
          ? "Quay lại toàn bộ từ"
          : `Ôn từ cần luyện lại (${mistakeCount})`}
      </button>
    </section>
  );
}

export function Library({ selected, group, mode, learned, onPractice }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const pool = useMemo(
    () =>
      getPool(selected, group, mode).filter((w) =>
        `${w.word} ${w.meaning}`
          .toLocaleLowerCase("vi")
          .includes(query.toLocaleLowerCase("vi").trim()),
      ),
    [selected, group, mode, query],
  );
  const pages = Math.max(1, Math.ceil(pool.length / 24));
  const safePage = Math.min(page, pages - 1);
  return (
    <section className="panel library-panel">
      <SectionTitle number="KHÁM PHÁ & ÔN TẬP" title="Thư viện từ vựng">
        <span className="count-pill">{words.length} từ</span>
      </SectionTitle>
      <p className="section-description">
        Tra cứu từ và chọn từ để luyện nghe. Bộ lọc IPA ở màn hình Luyện nghe
        cũng áp dụng tại đây.
      </p>
      <label className="search-field">
        <Search size={18} />
        <span className="sr-only">Tìm từ hoặc nghĩa tiếng Việt</span>
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
          placeholder="Tìm từ hoặc nghĩa tiếng Việt…"
        />
        {query && (
          <button
            aria-label="Xóa tìm kiếm"
            onClick={() => {
              setQuery("");
              setPage(0);
            }}
          >
            <X size={16} />
          </button>
        )}
      </label>
      <div className="library-meta">
        <span>{pool.length} kết quả</span>
        <span>Phiên âm Anh–Anh · 44 âm IPA</span>
      </div>
      <div className="word-cards">
        {pool.slice(safePage * 24, safePage * 24 + 24).map((w) => (
          <article className="word-card" key={w.word}>
            <div>
              <h3>
                {w.word}
                {learned.has(w.word) && (
                  <Check size={14} aria-label="Đã trả lời đúng" />
                )}
              </h3>
              <span className="ipa">/{w.ipa}/</span>
              <p>{w.meaning}</p>
            </div>
            <button
              aria-label={`Luyện từ ${w.word}`}
              title="Chuyển sang luyện từ này"
              onClick={() => onPractice(w)}
            >
              <Headphones size={19} />
            </button>
          </article>
        ))}
      </div>
      {!pool.length && (
        <div className="empty-state">
          <Search size={28} />
          <h3>Không tìm thấy từ</h3>
          <p>Thử một từ khóa khác hoặc điều chỉnh bộ lọc IPA.</p>
        </div>
      )}
      <div className="pagination">
        <button
          aria-label="Trang trước"
          disabled={safePage === 0}
          onClick={() => setPage(safePage - 1)}
        >
          <ChevronLeft size={18} />
        </button>
        <span>
          Trang {safePage + 1} / {pages}
        </span>
        <button
          aria-label="Trang tiếp theo"
          disabled={safePage === pages - 1}
          onClick={() => setPage(safePage + 1)}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </section>
  );
}

export function Progress({ history, summary, onReview, onReset }) {
  const [confirm, setConfirm] = useState(false);
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - 6 + i);
    return {
      date,
      label: date.toLocaleDateString("vi-VN", { weekday: "short" }),
      count: history.filter((h) => localDay(h.date) === localDay(date)).length,
    };
  });
  return (
    <section className="progress-page">
      <div className="progress-stats">
        <Stat
          icon={BookIcon}
          value={`${summary.learned}/${words.length}`}
          label="Từ trả lời đúng gần nhất"
        />
        <Stat
          icon={Headphones}
          value={summary.attempted}
          label="Lượt luyện đã lưu"
        />
        <Stat
          icon={Check}
          value={
            summary.attempted
              ? Math.round((summary.correct / summary.attempted) * 100) + "%"
              : "—"
          }
          label="Tỉ lệ đúng không gợi ý"
        />
      </div>
      <div className="progress-columns">
        <section className="panel">
          <SectionTitle number="ĐỀU ĐẶN MỖI NGÀY" title="Nhịp học của bạn" />
          <p className="section-description">
            Số lượt luyện trong 7 ngày gần nhất.
          </p>
          <div className="activity-chart">
            {days.map((d) => (
              <div key={d.label} className="activity-day">
                <strong>{d.count}</strong>
                <div className="bar-track">
                  <span
                    style={{
                      height: `${d.count ? Math.max(5, (d.count / Math.max(20, ...days.map((x) => x.count))) * 100) : 0}%`,
                    }}
                  />
                </div>
                <span>{d.label}</span>
              </div>
            ))}
          </div>
          <p className="chart-note">Mục tiêu nhỏ: 20 lượt luyện mỗi ngày.</p>
        </section>
        <section className="panel recent-panel">
          <SectionTitle number="NHÌN LẠI ĐỂ TIẾN BỘ" title="Lịch sử gần đây" />
          {history.length ? (
            <ul className="history-list">
              {history
                .slice(-8)
                .reverse()
                .map((h, i) => (
                  <li key={i}>
                    <span
                      className={h.correct ? "history-dot good" : "history-dot"}
                    >
                      {h.correct ? (
                        <Check size={13} />
                      ) : (
                        <RotateCcw size={13} />
                      )}
                    </span>
                    <strong>{h.word}</strong>
                    <span>
                      {h.correct
                        ? "Chính xác"
                        : h.matches
                          ? "Có gợi ý"
                          : "Cần luyện lại"}
                    </span>
                  </li>
                ))}
            </ul>
          ) : (
            <div className="empty-state">
              <Ear size={32} />
              <h3>Tiến bộ bắt đầu từ một từ.</h3>
              <p>Hoàn thành bài nghe đầu tiên để xem lịch sử ở đây.</p>
            </div>
          )}
          <button
            className="secondary-button"
            disabled={!summary.mistakes.length}
            onClick={onReview}
          >
            Ôn {summary.mistakes.length} từ cần luyện lại{" "}
            <ArrowRight size={16} />
          </button>
        </section>
      </div>
      <div className="storage-note">
        <span>Tiến độ được lưu trên trình duyệt này.</span>
        {!confirm ? (
          <button className="text-button" onClick={() => setConfirm(true)}>
            Xóa tiến độ
          </button>
        ) : (
          <span className="reset-confirm">
            Xóa toàn bộ lịch sử?{" "}
            <button
              className="text-button danger"
              onClick={() => {
                onReset();
                setConfirm(false);
              }}
            >
              Xóa
            </button>
            <button className="text-button" onClick={() => setConfirm(false)}>
              Hủy
            </button>
          </span>
        )}
      </div>
    </section>
  );
}
function BookIcon(props) {
  return <BookOpen {...props} />;
}
