# Buffalo Ear — design notes

Applied skills: frontend-design and ui-ux-pro-max.

## Direction

A calm editorial learning notebook. Pale ocean backgrounds, deep teal ink and soft seafoam cards, with restrained teal highlights. The distinct anchor is the phonetic tile board alongside a quiet audio stage. The interface supports a repeated activity rather than a promotional landing page.

DFII: impact 4 + context fit 5 + feasibility 4 + performance 4 − consistency risk 3 = 14.

## System

- Nunito Sans 400–600: a locally served, soft humanist typeface for Vietnamese UI, headings and numbers. A 3.6 kB Noto Sans subset renders IPA. Body text is regular 400, labels/actions 500 and headings 600. No synthetic bold or italic; system fonts are fallback only.
- The current `--color-*` tokens define the Ocean Teal reference: background (#F2F8F7), surface (#D9ECE8), primary (#247568), text (#193C3A) and accent (#80BFB0). Supporting text uses a slightly darker teal for sufficient contrast on seafoam cards.
- Spacing follows a 4 px rhythm, with 24 px between main desktop panels.
- Motion is limited to control feedback and the speaking state; reduced-motion preference disables animation.
- Lucide SVG icons use a consistent stroke style. Selected sounds use both color and a checkmark.

## Learning UX

1. Select a group and multiple IPA sounds. Match any selected sound by default, or explicitly require all.
2. Listen to a hidden word, write an answer and submit with Enter. A word is scored once.
3. Show a direct result; the learner controls the next-word action. Reveal-first answers never earn a correct score.
4. Shuffle without repeating until the current deck is exhausted. Filter changes rebuild the deck immediately.
5. Review words whose most recent result needs practice. Search the separate library without revealing words in the practice view.
6. Guests persist settings and the last 5,000 results locally. Signed-in users save to PostgreSQL through Drizzle and read the most recent 5,000 attempts. Storage errors do not prevent guest practice.
7. A shared CEFR selector combines A1–B2 with IPA and review filters. It exposes each level's full count and persists the chosen level. Library cards show level badges. Filtering the library never starts hidden audio.

The 3,000-entry dataset is bundled as compact text; no dictionary server or stored audio files are required. Cached build-time source databases are excluded from the app. End-user source attribution is available beneath the main content.

Empty states explain how to recover from an impossible filter or completed review. Form inputs have labels, feedback uses a live region, navigation and sound selections expose their state, and keyboard focus is visible. Guest practice remains available without a configured database or account. Browser-only state and shuffled decks initialize after hydration.

## Verification

Pure logic tests cover vocabulary integrity, whole-phoneme filtering, any/all matching, review pools, randomization, scoring and storage recovery. Browser checks cover the actual React workflow, keyboard submission, reveal scoring, persistence, review and library navigation. Responsive checks run at 375, 768, 1024 and 1440 px. A deterministic speech adapter verifies utterance text, not physical audio output.

## Full-stack and account UX

The repository remains one npm package. TanStack Start serves the document and routes, TanStack Query manages account data, Drizzle maps PostgreSQL tables, Zod validates RPC input, and Better Auth manages credentials/OAuth and database-backed sessions. No secrets or database modules enter the client bundle.

The root layout retains the learning controller across navigation between `/`, `/library` and `/progress`. Authentication lives at `/login`; its fields and error messages follow the existing design system. The Google button is present only when both OAuth credentials are configured. Without server configuration, the page explains that accounts are unavailable and offers guest practice.

After login, a bounded transaction imports guest history using per-user unique client IDs. The browser removes only acknowledged entries after success. Errors preserve local history and expose a retry action. Existing account settings win; guest settings seed a new account. Authenticated results never enter guest storage. Sign-out clears inactive account query caches; each account has a separate query key.

Answer submission uses an optimistic history row, then replaces it with the server-graded result. A failed submission rolls back the optimistic row and retains its request ID for retry; a response lost after commit cannot create duplicate attempts on retry. Controls pause while writes are in flight. Deleting history requires the existing explicit confirmation and affects only the current user's rows.

Legacy guest history contains outcomes rather than original answers, so it is imported as learning history rather than regraded. New answers are validated, checked against the bundled vocabulary and graded on the server. Revealed answers cannot count as correct; the database also enforces that invariant.

## Full-stack verification

Unit tests cover input limits, malformed history, legacy hint normalization and conflicting correctness flags. Integration browser tests use a real local PostgreSQL database to verify registration, failed-import recovery, idempotent import, lost-response retries, server validation/grading, settings persistence, logout/login, account isolation, anonymous access rejection and remote history deletion. The guest regression test still covers 375, 768, 1024 and 1440 px widths. Real Google OAuth requires external credentials and a browser authorization flow and is not covered by the automated local tests.

## Mustard & charcoal refresh (26/10/2026)

The user-provided palette keeps the notebook direction and IPA tile board as its visual anchor. DFII: impact 4 + fit 5 + feasibility 5 + performance 5 − consistency risk 4 = 15. Backgrounds stay ivory/cream; mustard and yellow mark selected controls, the listening action, and daily progress rather than filling the whole page.

Visible small text now uses a 16px baseline across desktop and mobile, including metadata, labels, buttons and inputs. Titles retain a larger hierarchy. Secondary text uses a darker warm brown for legibility. Layouts wrap or stack before text needs to shrink: practice panels stack on tablets, vocabulary cards use one mobile column, and answer input/action separate on small screens. Existing font families and reduced-motion behavior are preserved.

## Neutral gray palette (latest, 26/10/2026)

The latest user palette replaces mustard/cream throughout the interface, theme-color and favicon. Existing semantic aliases reference the exact supplied `--color-*` tokens. Dark primary actions use light labels, accent selections use dark labels, and success/error feedback uses the dedicated green/red tokens. The 16px minimum visible text size and responsive layout are retained.

## Ocean Teal + softer typography (latest, 26/10/2026)

Applied UI/UX Pro Max from `C:/Users/thuon/.agents/skills/ui-ux-pro-max/SKILL.md` with design-system, typography and React searches. The user reference takes precedence over the generic educational/childlike suggestions from the design-system search. The typography search's soft humanist direction informs Nunito Sans, without introducing cartoon display fonts or heavy effects.

Five swatch colors sampled directly from the user's image: background `#F2F8F7`, surface `#D9ECE8`, primary `#247568`, text `#193C3A`, accent `#80BFB0`. Secondary text and status colors are tuned for legibility on these surfaces. Existing neutral and mustard sections describe earlier iterations.

Supporting labels now use sentence case, normal tracking and lighter weights. The hero no longer mixes a Georgia italic with the UI sans; regular and medium text provide a calmer hierarchy. Small text stays at least 16px. The practice panel uses a lighter seafoam mix and a teal listening action, with a more compact horizontal session summary on mobile.

Nunito Sans WOFF2 (Latin, Latin Extended and Vietnamese, variable weights 400–600) is served locally from `public/fonts/`, with its OFL license. This avoids a remote-font failure silently changing the typography. Glyph rendering is checked in Chromium, including all 44 IPA symbols (Noto Sans IPA) and Vietnamese labels (Nunito Sans).

## Tailwind CSS v4 migration (26/10/2026)

Tailwind CSS 4.3.3 integrates through `@tailwindcss/vite` before TanStack Start's plugin. `src/styles.css` now contains only the Tailwind import, CSS-first `@theme` tokens and the speaking animation. The previous component stylesheet and its accumulated responsive overrides have been removed. There is no Tailwind JavaScript config or `@apply` layer.

Every UI component uses complete, statically discoverable utility classes, including responsive and descendant variants where appropriate. Native `aria-pressed`, `aria-current`, `data-result`, `data-speaking` and `peer-checked` variants express state. The Ocean Teal palette, locally served fonts, 16px baseline, keyboard focus and reduced-motion support are preserved. Prettier sorts classes using the project's CSS theme.

The daily goal and chart heights pass continuous numeric data through typed CSS custom properties; Tailwind's `w-(--goal)` and `h-(--activity)` utilities own the actual dimensions. Local font-face CSS remains in public assets because it registers font files rather than component styling.

Browser tests use `data-testid` hooks instead of presentation class names. The dedicated style check verifies selection and grading colors, checkbox state, daily goal width and chart height. Broader browser, account integration and six-width/font audits verify behavior and presentation after migration.
