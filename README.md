# Buffalo Ear

> 🤖 **Built with an AI Agent** — this project was designed, implemented, tested and documented with the help of an agentic AI coding assistant working in pair-programming mode with a human developer.

Buffalo Ear is an English listening and spelling (dictation) trainer organized around the **44 IPA sounds**. It ships with **3,000 A1–B2 vocabulary entries**, each with IPA transcription and a Vietnamese meaning. The responsive UI has three main areas: **Practice**, **Library** and **Progress**.

## Tech Stack

| Area             | Technologies                                                                  |
| ---------------- | ----------------------------------------------------------------------------- |
| Language         | TypeScript 6                                                                  |
| Framework        | React 19, TanStack Start (full-stack SSR), TanStack Router                    |
| Data fetching    | TanStack Query                                                                |
| Build / server   | Vite 8, Nitro, Node.js 22.12+ (Node 24 LTS recommended)                       |
| Styling          | Tailwind CSS v4 (`@tailwindcss/vite`), prettier-plugin-tailwindcss            |
| Icons            | lucide-react                                                                  |
| Authentication   | Better Auth (email/password, optional Google OAuth) + Drizzle adapter         |
| Database         | PostgreSQL (Docker Compose locally, Neon in production), `postgres` driver    |
| ORM / migrations | Drizzle ORM, Drizzle Kit                                                      |
| Validation       | Zod 4                                                                         |
| i18n             | i18next, react-i18next (Vietnamese / English)                                 |
| Speech           | Web Speech API (text-to-speech), bundled synthesized IPA WAV samples          |
| Testing          | Node test runner via `tsx`, Playwright (Chromium) browser/integration tests   |
| Tooling          | Prettier, `tsc` type checking, Python 3.10+ scripts for vocabulary generation |
| Deployment       | Node server or Vercel Functions + Neon PostgreSQL                             |

## Getting Started

Requirements: **Node.js 22.12+ (Node 24 LTS recommended)**, npm, and Docker if you want a local PostgreSQL. The repository is a **single package** — no workspaces or monorepo.

```sh
npm install
npm run dev
```

Open http://127.0.0.1:5174. Without database/auth configuration you can still practice as a guest; progress is stored in the browser.

To enable accounts and sync:

1. Copy `.env.example` to `.env` (`Copy-Item .env.example .env` in PowerShell).
2. Generate a secret with the command below and put it in `BETTER_AUTH_SECRET`. Never commit `.env`.
3. Start PostgreSQL, run the migrations, then restart the server.

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
npm run db:up
npm run db:migrate
npm run dev
```

The local PostgreSQL uses port **5438** and database `buffalo_ear`; a Docker volume keeps data across restarts. The credentials in Compose are for local use only. To use another database, change `DATABASE_URL`.

| Environment variable                       | Purpose                                                    |
| ------------------------------------------ | ---------------------------------------------------------- |
| `DATABASE_URL`                             | PostgreSQL connection string, server-side only             |
| `BETTER_AUTH_SECRET`                       | Secret of at least 32 characters                           |
| `BETTER_AUTH_URL`                          | App origin, e.g. `http://127.0.0.1:5174`                   |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Optional; the Google button appears only when both are set |
| `HOST`, `PORT`                             | Production server address/port; default `127.0.0.1:5174`   |

Google OAuth requires an OAuth Client in Google Cloud Console; the local redirect URI is `http://127.0.0.1:5174/api/auth/callback/google`. When you change the origin/port, update both `BETTER_AUTH_URL` and the redirect URI in Google. Email/password sign-in works independently of Google.

```sh
npm run build
npm start
```

Production runs a **Node server** from `.output/server/index.mjs` and serves assets from `.output/public`; it is no longer deployed as a static site from `dist/`. `npm start` loads `.env` automatically if present. When deploying, configure HTTPS, the database and secrets on the host; set `HOST=0.0.0.0` if the host requires it. Behind a reverse proxy, configure Better Auth's trusted proxy/IP headers for your infrastructure so rate limiting can distinguish users.

The schema lives in `src/db/schema.ts`. After changing it:

```sh
npm run db:generate
npm run db:migrate
```

Review and commit the generated SQL migrations in `drizzle/` alongside the source code; do not use `db:push` in production.

## Usage

- Choose a level: **All / A1 / A2 / B1 / B2**. The level combines with the IPA filter, is shared by Practice and Library, and persists across reloads.
- Select multiple IPA sounds: by default words containing **at least one** selected sound are shown; you can switch to **all**. Switching groups clears selected sounds from other groups.
- Press play, type the word and press **Enter** to check. Answers ignore case and leading/trailing whitespace. Each word is graded only once.
- "Show answer" reveals the word, IPA and meaning. Peeking means the answer is not counted as correct.
- "Next word" or **Alt + →** moves on. Words are shuffled and do not repeat until the whole filtered set has been used. If only one word matches, it repeats.
- Toggle auto-play and choose the speed. On first load, the browser requires a user interaction before audio can play.
- The Library supports searching by word/meaning and jumping to practice a specific word. The current IPA filter also applies there.
- Progress shows history, a 7-day streak chart, accuracy and a review mode for missed words. Each word's learning status is based on its most recent answer.
- The score on the practice card is for the current session. Guests store history and settings in localStorage (latest 5,000 attempts). Accounts store data in PostgreSQL and load the latest 5,000 attempts. The daily goal is 20 answers.

## Accounts & Data

- Sign up with name, email and a password of at least 8 characters; sign in with email or Google (if configured).
- Better Auth manages accounts and httpOnly session cookies. Every server function that reads/writes personal data checks the session.
- On sign-in, guest history is merged into the account inside a transaction with a deduplication lock. Only local attempts confirmed by the server are removed; on network errors history is kept for retry.
- Guest settings are used when the account has none; existing account settings take precedence.
- New answers are validated with Zod, graded on the server and written with Drizzle. Resubmitting the same attempt ID does not create duplicates.
- Account progress is never copied into guest localStorage. Signing out returns to guest data; "Reset progress" while signed in deletes that account's server-side history.
- Legacy guest history lacks the original answers, so it is imported as historical results and cannot be re-graded. This is a self-study app, not an anti-cheating exam system.

## Testing

```sh
npm test
npm run typecheck
npm run build
npm run format:check
```

Start the app in another terminal before running browser tests:

```sh
npx playwright install chromium
npm run test:browser
npm run test:styles
npm run test:integration
```

`test:integration` needs `.env`, a migrated PostgreSQL and auth enabled. It creates its own accounts with random emails and, at the end, cleans up only its own accounts when `DATABASE_URL` points to localhost. Never run it against production.

You can set `APP_URL`, `CHROMIUM_PATH` or `PLAYWRIGHT_PACKAGE` for custom runtimes. Browser tests use a mocked speech engine to verify spoken content and learning flows; they do not test audio hardware. Desktop/mobile screenshots are saved in `test-results/`.

## Project Structure

- `src/routes/`: pages `/`, `/library`, `/progress`, `/login` and the `/api/auth/*` handler.
- `src/App.tsx`: shared layout, navigation, onboarding and sync notifications.
- `src/components/`: IPA/level filters, practice, library, progress, account and sign-in forms.
- `src/hooks/usePractice.ts`: practice session and filter orchestration.
- `src/hooks/useLearning.tsx`: guest/account data, TanStack Query and sync.
- `src/hooks/useSpeech.ts`: Web Speech API playback/cancel and error handling.
- `src/core/`: vocabulary data, filtering, shuffling, grading, localStorage parsing and progress stats in pure TypeScript.
- `src/db/`: Drizzle/PostgreSQL schema and connection, server-side only.
- `src/server/`: server functions, session middleware and Zod schemas.
- `src/lib/auth.ts`, `src/lib/auth-client.ts`: Better Auth server/client configuration.
- `src/i18n/`: i18next setup and `vi`/`en` translation catalogs.
- `drizzle/`, `drizzle.config.ts`: SQL migrations and Drizzle Kit config.
- `data/`: vocabulary set, legacy version and source metadata.
- `scripts/fetch-vocabulary.py`, `scripts/build-vocabulary.py`: download sources and build offline data.
- `src/styles.css`: Tailwind v4 import, Ocean Teal theme, font/shadow and animation tokens. Component styling, responsiveness and states use utility classes in TSX; no CSS component selectors or `@apply`.
- `.prettierrc.json`: automatic utility sorting via prettier-plugin-tailwindcss.
- `tests/styles.cjs`: checks selection, correct/incorrect borders and feedback, checkboxes, goal bar and charts after the Tailwind migration.
- `docs/DESIGN.md`: design and UX decisions.
- `implementation_plan.md`: implementation plan and progress tracker.

## Data & Size

| Level | Entries |
| ----- | ------: |
| A1    |     904 |
| A2    |     801 |
| B1    |     701 |
| B2    |     594 |
| Total |   3,000 |

`data/vocabulary.json` is about 180 kB (176 KiB), roughly 63 KiB gzipped. It is text only — no audio files. The data is bundled with the app and not copied into localStorage; localStorage only holds up to 5,000 attempts plus settings. Guest mode needs no database server or API calls for lookups; accounts require PostgreSQL. Speech synthesis may require a network connection depending on the device.

The word list is compiled for Buffalo Ear and is **not the official Oxford 3000**. A1–B2 labels are per-entry references, not an assessment of the user's level or of every sense of a word. The data keeps the 507 original entries; most levels come from [3000MostCommonEnglishWords](https://github.com/chihyungchang/3000MostCommonEnglishWords) (Apache 2.0). Additional meanings/IPA come from [Skypedia / MinhQND](https://github.com/skypediacode/english-vietnamese-dictionary) (CC BY-SA 4.0), with meanings selected by part of speech, normalized IPA and corrections applied in the scripts. Some entries and levels were curated manually. Derived data is released under CC BY-SA 4.0; see `public/licenses/ATTRIBUTION.txt`. Sources may contain errors; polysemous words may have multiple pronunciations and levels.

Regenerate the data (Python 3.10+, standard library only):

```sh
python scripts/fetch-vocabulary.py
python scripts/build-vocabulary.py
npm test
```

The fetch step stores a ~42 MiB source database in `.cache/`, which is git-ignored. This source database is **not bundled into the web build**. Rebuilds use commit-pinned sources verified by SHA-256. The JSON file is kept compact and does not need reformatting.

## Known Limitations

Speech uses the Web Speech API, preferring en-GB and falling back to other English voices; playback depends on the browser and device. The learner IPA favors British English, does not yet mark stress and may differ from fallback voices. Nunito Sans (UI) and Noto Sans (IPA) are served from `public/fonts/` with their OFL licenses. Google OAuth requires your own configuration and has not been tested with a real Google account. There is no email verification or password-reset-by-email flow yet.

## IPA Sound Samples & Shortcuts

In "Get to know IPA sounds", pick one of the 44 sounds and press "Play sample". You can listen before choosing a word set; this does not change the filter or the current word. The synthesized British English WAV samples are stored locally, separate from the device's vocabulary voice. Sources and regeneration: `public/audio/ipa/README.md`, `scripts/generate-ipa-audio.mjs`.

Press Enter in the answer field to check. When correct, press Enter again to go to the next word; holding the key does not skip. When wrong or after revealing the answer, use the "Next word" button or Alt + →.

Run sample/shortcut tests with `npm run test:ipa` (set `APP_URL` if the app is not on port 5175). The test verifies that all 44 WAVs decode, play independently, handle errors/retries and render responsively.

## System Voice Selection

Under "Voice", choose any English voice available on the device or "Device · Auto" to prefer British English. The choice is remembered in the browser; if the saved voice is no longer available, the app falls back to another English voice. Reading speed is adjustable. The voice list depends on the OS and browser; no model or API key is required.

IPA samples and the Enter-to-check / Enter-again-for-next behavior work as before. Run `npm run test:voice` to test voice selection, speed, persistence and error cases.

## Interface Language

Click the Vietnam / UK flag button in the header to switch languages. The `buffalo-ear-locale` cookie stores the choice for one year and is shared by SSR and the browser; only `vi`/`en` are accepted, defaulting to Vietnamese. Each render uses its own i18next instance to avoid mixing languages between users. Switching in place keeps the route, filters and current input; the English speech voice is stored separately.

Catalogs live in `src/i18n/locales/{vi,en}/`, split by feature. Use `useTranslation()` with namespaced keys (e.g. `practice:next`); pluralized strings use `_one` / `_other` and `{{count, number}}`. Formatted sentences use `Trans`; avoid concatenating sentence fragments. The locale applies to date labels, numbers, metadata, errors and accessibility text. Learning content is English words, IPA and Vietnamese meanings (marked with their own `lang`).

`npm run test:i18n` covers SSR/cookies, language switching, state preservation, dates/numbers and responsiveness; unit tests check keys/placeholders across both catalogs. When adding new strings, update both languages.

## Deploying to Vercel + Neon

The configuration supports Vercel Functions and Neon PostgreSQL; locally it still runs as a Node server. See the [deployment guide](docs/DEPLOYMENT.md) for creating the database, running migrations, configuring secrets and Google OAuth. Do not set the output directory to `dist/` and do not run migrations during the build.
