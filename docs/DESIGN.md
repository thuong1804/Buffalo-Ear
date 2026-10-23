# Buffalo Ear — design notes

Applied skills: frontend-design and ui-ux-pro-max.

## Direction

A calm editorial learning notebook. Cream paper, deep forest ink and a mint practice card. The distinct anchor is the phonetic tile board alongside a quiet audio stage. The interface supports a repeated activity rather than a promotional landing page.

DFII: impact 4 + context fit 5 + feasibility 4 + performance 4 − consistency risk 3 = 14.

## System

- Be Vietnam Pro: Vietnamese interface text; DM Sans: numbers and phoneme tiles; Georgia italic: the short hero phrase. Local fallback fonts remain usable without Google Fonts.
- Semantic CSS variables define paper, ink, green, mint and error colors.
- Spacing follows a 4 px rhythm, with 24 px between main desktop panels.
- Motion is limited to control feedback and the speaking state; reduced-motion preference disables animation.
- Lucide SVG icons use a consistent stroke style. Selected sounds use both color and a checkmark.

## Learning UX

1. Select a group and multiple IPA sounds. Match any selected sound by default, or explicitly require all.
2. Listen to a hidden word, write an answer and submit with Enter. A word is scored once.
3. Show a direct result; the learner controls the next-word action. Reveal-first answers never earn a correct score.
4. Shuffle without repeating until the current deck is exhausted. Filter changes rebuild the deck immediately.
5. Review words whose most recent result needs practice. Search the separate library without revealing words in the practice view.
6. Persist settings and the last 5,000 results locally. Storage errors do not prevent learning.
7. A shared CEFR selector combines A1–B2 with IPA and review filters. It exposes each level's full count and persists the chosen level. Library cards show level badges. Filtering the library never starts hidden audio.

The 3,000-entry dataset is bundled as compact text; no dictionary server or stored audio files are required. Cached build-time source databases are excluded from the app. End-user source attribution is available beneath the main content.

Empty states explain how to recover from an impossible filter or completed review. Form inputs have labels, feedback uses a live region, navigation and sound selections expose their state, and keyboard focus is visible. No account or backend is needed for this version.

## Verification

Pure logic tests cover vocabulary integrity, whole-phoneme filtering, any/all matching, review pools, randomization, scoring and storage recovery. Browser checks cover the actual React workflow, keyboard submission, reveal scoring, persistence, review and library navigation. Responsive checks run at 375, 768, 1024 and 1440 px. A deterministic speech adapter verifies utterance text, not physical audio output.
