# Buffalo Ear → TanStack Start full-stack (single package)

## Quyết định đã chốt

| Mục                 | Lựa chọn                                                                                        |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| Cấu trúc repository | Một ứng dụng, một `package.json` ở gốc; không dùng monorepo, npm workspaces hoặc package nội bộ |
| Full-stack          | TanStack Start (React 19, Vite) — server functions + server routes                              |
| Data fetching       | TanStack Query (đi kèm router)                                                                  |
| ORM                 | Drizzle ORM + drizzle-kit migrations                                                            |
| Auth                | Better Auth — email/mật khẩu + Google OAuth, session cookie httpOnly lưu DB                     |
| Ngôn ngữ            | TypeScript cho toàn bộ code mới; UI hiện có chuyển dần sang `.tsx`                              |
| Khách               | Vẫn luyện bằng localStorage; khi đăng nhập → gộp lịch sử lên server                             |

## Database: đề xuất **PostgreSQL**

| Tiêu chí                               | PostgreSQL                                                             | SQLite                                               |
| -------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------- |
| Chạy local                             | Docker Compose (máy bạn đã có Docker 29.7)                             | Không cần gì                                         |
| Deploy                                 | Mọi nơi: VPS, Railway, Fly, Vercel/Netlify + Neon/Supabase (free tier) | Chỉ host có ổ đĩa bền vững; **hỏng trên serverless** |
| Ghi đồng thời nhiều user               | Tốt                                                                    | Khóa cả file khi ghi                                 |
| Better Auth / Drizzle                  | Hỗ trợ đầy đủ                                                          | Hỗ trợ                                               |
| Thống kê (group by ngày, theo cấp độ…) | Mạnh (`date_trunc`, timezone)                                          | Hạn chế hơn                                          |

> [!TIP]
> Chọn Postgres vì Docker sẵn có nên chi phí local ≈ 0, và không bị trói buộc nơi deploy. Nếu sau này muốn, đổi sang Neon chỉ cần đổi `DATABASE_URL`.

## Cấu trúc mới

Giữ một package ở thư mục gốc. UI, logic học và database là các module trong `src/`, dùng import tương đối; không tạo `apps/`, `packages/` hoặc các package `@buffalo-ear/*`.

```text
buffalo-ear/
├─ package.json                # scripts dev, build, test, typecheck, db:*
├─ vite.config.ts              # TanStack Start
├─ tsconfig.json
├─ docker-compose.yml          # postgres:17
├─ drizzle.config.ts
├─ drizzle/                    # migrations
├─ .env.example                # DATABASE_URL, BETTER_AUTH_SECRET, GOOGLE_CLIENT_ID/SECRET, BETTER_AUTH_URL
├─ src/
│  ├─ router.tsx
│  ├─ routes/
│  │  ├─ __root.tsx            # document, header/nav, footer, menu tài khoản
│  │  ├─ index.tsx             # Luyện nghe
│  │  ├─ library.tsx           # Thư viện
│  │  ├─ progress.tsx          # Tiến độ
│  │  ├─ login.tsx             # Đăng nhập / Đăng ký / Google
│  │  └─ api/auth/$.ts         # Better Auth handler
│  ├─ lib/
│  │  ├─ auth.ts              # chỉ import phía server
│  │  └─ auth-client.ts
│  ├─ core/
│  │  ├─ data.ts              # nạp data/vocabulary.json ở gốc
│  │  ├─ learning.ts          # logic học thuần, không phụ thuộc React
│  │  └─ levels.ts
│  ├─ db/                     # chỉ import phía server
│  │  ├─ schema.ts            # auth + attempt + user_settings
│  │  └─ index.ts             # Drizzle client
│  ├─ server/                 # server functions + middleware requireUser
│  ├─ hooks/                  # useSpeech.ts, useLearning.ts
│  ├─ components/             # tách từ components.jsx
│  └─ styles.css
├─ data/                      # giữ vocabulary.json, legacy.json, sources.json
├─ public/                    # favicon, licenses
├─ scripts/                   # giữ pipeline Python ghi dữ liệu vào data/
└─ tests/                     # test logic học và browser.cjs
```

## Bảng tiến độ implementation

Cập nhật ngày 26/10/2026. Trạng thái: **Hoàn tất**, **Đang làm**, **Chưa bắt đầu**, **Bị chặn**. Khi triển khai, cập nhật từng dòng cùng kết quả kiểm chứng; chỉ đánh dấu hoàn tất khi có bằng chứng tương ứng.

| Bước | Công việc                                                   | Trạng thái | Tiến độ / kiểm chứng                                                                                                                                                                                                                               |
| ---- | ----------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Kiểm tra hiện trạng và chốt cấu trúc một package            | Hoàn tất   | Đã kiểm tra `package.json`, `src/`, `tests/`, README; hiện là React + Vite, chưa có workspaces. Đã sửa kế hoạch theo yêu cầu không monorepo.                                                                                                       |
| 2    | Chuyển ứng dụng sang TanStack Start + TypeScript tại gốc    | Hoàn tất   | Một package; routes `/`, `/library`, `/progress`, `/login`; Node 22.12+ (kiểm thử bằng Node 24). Typecheck và production build đã qua.                                                                                                             |
| 3    | Chuyển logic học sang `src/core/`, tách hooks và components | Hoàn tất   | Toàn bộ app chuyển TS/TSX; hooks dữ liệu/phiên học/giọng đọc và các component riêng. localStorage và deck khởi tạo sau hydrate; test logic cũ và browser regression đã qua.                                                                        |
| 4    | Thêm PostgreSQL, Drizzle schema và migrations               | Hoàn tất   | PostgreSQL 17 chạy Docker ở 5438; 6 bảng, index, khóa chống trùng và ràng buộc kết quả. Migration `0000_slim_sheva_callister.sql` đã áp dụng thành công.                                                                                           |
| 5    | Tích hợp Better Auth và trang đăng nhập                     | Hoàn tất   | Đăng ký/email login/logout đã chạy thực tế. Schema auth đối chiếu CLI `auth@1.7.13`; nút Google ẩn khi thiếu cấu hình. Luồng OAuth Google thật chưa kiểm thử vì chưa có credentials.                                                               |
| 6    | Thêm server functions và kiểm tra dữ liệu đầu vào           | Hoàn tất   | Session, chấm điểm, progress/settings, import theo transaction và xóa lịch sử riêng tài khoản; Zod và requireUser. Browser integration đã xác nhận từ không hợp lệ bị từ chối và RPC riêng tư trả 401 khi chưa đăng nhập.                          |
| 7    | Đồng bộ dữ liệu khách và tài khoản qua TanStack Query       | Hoàn tất   | Query key theo user; optimistic answer, rollback khi lỗi và ID gửi lại chống trùng. Đã kiểm thử import mất mạng giữ local, retry thành công, import lặp không trùng, mất response sau commit không trùng; đăng xuất và hai tài khoản tách dữ liệu. |
| 8    | Kiểm chứng logic, typecheck, build và luồng trình duyệt     | Hoàn tất   | 14/14 tests, strict typecheck, production build, Prettier, browser regression 4 kích thước và account integration PostgreSQL đều qua. CSRF 403, anonymous RPC 401; dev nạp .env; public assets không chứa secret; npm audit 0 vulnerabilities.     |
| 9    | Cập nhật README và `docs/DESIGN.md`                         | Hoàn tất   | Đã ghi cách chạy một package, Node 22.12+, biến môi trường, migrations, Node production server, luồng đồng bộ và giới hạn Google OAuth.                                                                                                            |

## Schema (Drizzle)

- **Better Auth**: `user`, `session`, `account`, `verification` (sinh bằng CLI `auth@1.7.13 generate`, đối chiếu vào `schema.ts`; bổ sung timestamptz/index)
- **attempt**: `id uuid pk`, `user_id fk → user (cascade)`, `word text`, `answer text null` (history khách cũ không có đáp án gốc), `correct bool`, `matches bool`, `revealed bool`, `created_at timestamptz`, `client_id text not null`
  - index `(user_id, created_at)`, unique `(user_id, client_id)` để import idempotent
- **user_settings**: `user_id pk/fk`, `rate real`, `auto bool`, `level text`, `updated_at`

## Server functions (`src/server`)

| Hàm                              | Method   | Mô tả                                                                                                                                                           |
| -------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getSessionFn`                   | GET      | User hiện tại hoặc `null` (dùng ở `__root` beforeLoad)                                                                                                          |
| `submitAnswer`                   | POST     | Validate (zod) → kiểm từ có trong bộ → `grade()` trên server → insert attempt → trả `{matches, correct, revealed}`                                              |
| `getProgress`                    | GET      | Lịch sử (giới hạn 5.000 gần nhất) — client tính `summarize` bằng `src/core` như cũ                                                                              |
| `getSettings` / `updateSettings` | GET/POST | Đồng bộ rate/auto/level                                                                                                                                         |
| `importLocalHistory`             | POST     | Nhận tối đa 5.000 lượt từ localStorage, lọc từ hợp lệ, `client_id` ổn định theo ID lượt khách, hoặc word + thời điểm ISO cho history cũ → `onConflictDoNothing` |

Tất cả (trừ session) dùng middleware `requireUser` → 401 nếu chưa đăng nhập.

## Luồng FE

- `useLearning` trừu tượng hóa nguồn dữ liệu:
  - **Khách**: như hiện tại — chấm bằng `grade()` local, lưu localStorage.
  - **Đã đăng nhập**: `submitAnswer` qua `useMutation`; lịch sử/settings qua `useQuery`; cập nhật lạc quan (optimistic) để UI phản hồi tức thì.
- Lần đầu đăng nhập (hoặc khi phát hiện localStorage có lịch sử): gọi `importLocalHistory`, thành công thì xóa history local và hiện thông báo "Đã đồng bộ N lượt".
- Header thêm nút **Đăng nhập** / avatar + menu (Đăng xuất).
- Trang `/login`: tab Đăng nhập / Đăng ký (tên, email, mật khẩu ≥ 8), nút "Tiếp tục với Google" (ẩn nếu chưa cấu hình `GOOGLE_CLIENT_ID`), cùng design system hiện tại.
- Các API trình duyệt (`speechSynthesis`, `localStorage`) chỉ chạy phía client để SSR không lỗi; deck xáo trộn tạo sau khi hydrate để tránh mismatch.

## Scripts gốc

```
npm run db:up        # docker compose up -d
npm run db:migrate   # drizzle-kit migrate
npm run dev          # TanStack Start tại http://127.0.0.1:5174
npm test             # test core + validation
npm run build
```

> [!IMPORTANT]
> Google OAuth: code viết sẵn, bạn cần tạo OAuth Client trên Google Cloud Console với redirect URI `http://127.0.0.1:5174/api/auth/callback/google` rồi điền vào `.env`. Khi thiếu, nút Google tự ẩn.

> [!WARNING]
>
> - App không còn là web tĩnh — `dist/` cũ bị thay bằng output server Node.
> - `npm run dev` đang chạy sẽ cần dừng khi chuyển cấu trúc.
> - Chống gian lận ở mức vừa phải: TTS chạy ở client nên client vẫn biết từ; server chỉ đảm bảo kết quả được chấm thật, không bị ghi giả.

## Kiểm chứng

1. `npm test` — toàn bộ test core cũ pass sau khi chuyển TS.
2. `npm run build` + typecheck.
3. Chạy Postgres + migrate, rồi dùng `npm run test:browser` và `npm run test:integration`: luyện khi là khách → đăng ký → thấy lịch sử được gộp → submit đáp án → reload vẫn còn tiến độ → đăng xuất/đăng nhập lại.
4. Cập nhật `README.md` và `docs/DESIGN.md`.

## Ghi chú triển khai

- Bản kiểm thử production chạy ở `http://127.0.0.1:5175` vì cổng 5174 đang được sử dụng. Cấu hình mặc định trong source vẫn là 5174.
- `.env` local đã được tạo với secret ngẫu nhiên và được Git ignore; Google credentials để trống.
- Import legacy là dữ liệu lịch sử tự học; do không có đáp án gốc, không thể xác thực/chấm lại kết quả cũ. Đáp án mới luôn chấm trên server.
- Hướng dẫn tích hợp tham khảo: [TanStack Start](https://tanstack.com/start/latest/docs/framework/react/build-from-scratch), [Better Auth + TanStack](https://better-auth.com/docs/integrations/tanstack), [Drizzle adapter](https://better-auth.com/docs/adapters/drizzle).

### Kết quả kiểm chứng cuối (26/10/2026)

| Kiểm tra                                     | Kết quả                                                                                                                                            |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Core + Zod validation                        | 14 tests, 0 lỗi                                                                                                                                    |
| TypeScript strict + unused declarations      | Qua                                                                                                                                                |
| Vite/TanStack Start + Nitro production build | Qua; có cảnh báo bundle client lớn hơn 500 kB và directive từ thư viện trong server bundle                                                         |
| Drizzle generate / migrate                   | Schema không lệch migration; chạy migrate lại thành công                                                                                           |
| Guest browser regression                     | Qua; 375 / 768 / 1024 / 1440 px                                                                                                                    |
| Account integration + PostgreSQL             | Qua; signup/login/logout, import idempotent, lỗi import giữ local, lost-response retry, validate, settings, reload, account isolation, xóa history |
| HTTP access checks                           | CSRF 403; RPC riêng tư chưa đăng nhập 401                                                                                                          |
| Development smoke                            | Qua; đọc .env, form auth và route thư viện                                                                                                         |
| Dependency audit                             | 0 vulnerabilities; override esbuild của @esbuild-kit/core-utils để vá dependency công cụ Drizzle Kit                                               |
| Google OAuth thật                            | Chưa chạy; cần Google Client ID/Secret của chủ dự án                                                                                               |

## Điều chỉnh giao diện theo ảnh (26/10/2026)

| Công việc                                            | Trạng thái | Kiểm chứng                                                                                                                                                                                                                          |
| ---------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Đổi palette mustard/charcoal theo 5 mã màu trong ảnh | Hoàn tất   | CSS tokens, favicon và theme-color đã cập nhật; nền kem, chữ than, vàng dùng làm điểm nhấn.                                                                                                                                         |
| Tăng chữ nhỏ lên khoảng 16px                         | Hoàn tất   | Cập nhật cả font shorthand và breakpoint mobile; nới bố cục cho nhãn dài và thẻ từ.                                                                                                                                                 |
| Kiểm tra desktop/mobile và cập nhật bản local        | Hoàn tất   | Đã đo chữ hiển thị từ 16px, đúng màu nền/chữ và không tràn ngang trên 4 routes ở 320/375/768/900/1024/1440px; xem ảnh desktop/mobile/login/library. Production build, format và browser regression qua; bản local 5175 đã cập nhật. |

## Đổi palette xám theo mã màu mới (26/10/2026)

| Công việc                                         | Trạng thái | Kiểm chứng                                                                                              |
| ------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| Áp dụng 9 biến `--color-*` do người dùng cung cấp | Hoàn tất   | Đồng bộ CSS aliases, màu trạng thái đúng/sai, favicon và theme-color; giữ cỡ chữ 16px và bố cục.        |
| Build và kiểm tra bản local                       | Hoàn tất   | Production build và browser regression qua ở 375/768/1024/1440px; server 5175 đã cập nhật bảng màu mới. |

## Ocean Teal và typography mềm hơn (26/10/2026)

| Công việc                                           | Trạng thái | Tiến độ / kiểm chứng                                                                                                                                                                                                                                             |
| --------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Áp dụng UI/UX Pro Max và đối chiếu palette ảnh      | Hoàn tất   | Skill tại `.agents/skills/ui-ux-pro-max`; đã chạy design-system/typography/React searches. Lấy trực tiếp 5 màu swatch từ ảnh: #F2F8F7, #D9ECE8, #247568, #193C3A, #80BFB0.                                                                                       |
| Tinh chỉnh font, độ đậm và cách viết nhãn           | Hoàn tất   | Nunito Sans local variable WOFF2 400–600; font con Noto Sans IPA 3,6 KB. Nhãn sentence case, tracking tự nhiên, body 400; giữ chữ nhỏ 16px. Chromium xác nhận dùng font local cho tiếng Việt và đủ 44 IPA.                                                       |
| Kiểm tra font thực tế, responsive và cập nhật local | Hoàn tất   | Audit 4 routes ở 320/375/768/900/1024/1440px: không tràn ngang, chữ từ 16px; Chromium xác nhận font local cho tiếng Việt và 44 IPA. Đã xem ảnh desktop/mobile, production build, strict typecheck, format và browser regression đều qua. Local 5175 đã cập nhật. |

Typography: Nunito Sans 400/500/600, Noto Sans IPA subset; font WOFF2 + giấy phép lưu tại `public/fonts/`. Thay Google Fonts từ xa bằng tài nguyên local. Màu chữ primary trên card được làm đậm hơn nhẹ để bảo đảm tương phản.

## Chuyển toàn bộ styling sang Tailwind CSS v4 (26/10/2026)

| Công việc                                                        | Trạng thái | Tiến độ / kiểm chứng                                                                                                                                                                                                                                                                                                       |
| ---------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cài Tailwind v4 + Vite plugin và theme CSS-first                 | Hoàn tất   | Tailwind 4.3.3 + @tailwindcss/vite; @theme Ocean Teal/Nunito/IPA tokens; Prettier plugin tự sắp xếp utilities. Một package, không thêm JS Tailwind config.                                                                                                                                                                 |
| Chuyển layout, controls, states và responsive sang utilities     | Hoàn tất   | Tất cả component TSX đã dùng utility classes; trạng thái aria/data/peer, breakpoint, focus và reduced-motion. Goal/chart chỉ truyền dữ liệu qua CSS variables, dimensions dùng utilities.                                                                                                                                  |
| Xóa stylesheet component cũ, cập nhật test selectors và tài liệu | Hoàn tất   | src/styles.css còn 29 dòng import/theme/keyframes, không selector component hoặc @apply. Test dùng data-testid; thêm test:styles. README và DESIGN đã cập nhật.                                                                                                                                                            |
| Kiểm chứng và cập nhật bản local                                 | Hoàn tất   | 14 tests, strict typecheck, build, format, production browser regression, test:styles và account integration PostgreSQL đều qua. Audit 4 routes ở 320/375/768/900/1024/1440px giữ chữ 16px, font local/44 IPA và không tràn ngang. Source audit xác nhận không class/component CSS cũ hoặc @apply. Local 5175 đã cập nhật. |

## Tinh chỉnh header (26/10/2026)

| Công việc                                   | Trạng thái | Kiểm chứng                                                                                                                                              |
| ------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Logo viết hoa, gom Đăng nhập cạnh Hướng dẫn | Hoàn tất   | Build qua; browser xác nhận logo viết hoa, hai nút sát nhau, Hướng dẫn hoạt động và không tràn ngang ở 320/375/768/1024/1440px. Local 5175 đã cập nhật. |

## Avatar tài khoản (26/10/2026)

| Công việc                                               | Trạng thái | Kiểm chứng                                                                                                                                                                               |
| ------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Avatar nhỏ cạnh họ tên, ảnh mặc định khi thiếu hoặc lỗi | Hoàn tất   | Avatar tròn 32px, image từ session và fallback local; build/typecheck qua. Browser xác nhận có ảnh, thiếu ảnh, ảnh lỗi và không tràn ngang ở 320/375/768/1440px. Local 5175 đã cập nhật. |

## Nghe âm IPA mẫu và phím Enter (26/10/2026)

| Công việc                                           | Trạng thái | Kiểm chứng                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nghe âm mẫu độc lập trước khi luyện từ, đủ 44 IPA   | Hoàn tất   | 44 WAV tổng hợp âm vị en-gb bằng eSpeak, khoảng 474 KB; có phát/dừng, chống chồng âm, xử lý lỗi/thử lại. Nghe mẫu không đổi bộ lọc/từ. Có script tái tạo và tài liệu nguồn.                                                                                                |
| Enter kiểm tra, đúng thì Enter lần nữa sang từ tiếp | Hoàn tất   | Đúng thì Enter sang từ tiếp; sai/xem đáp án không tự chuyển. Chặn giữ phím và IME, giữ chống lưu trùng; cập nhật hướng dẫn.                                                                                                                                                |
| Kiểm tra chức năng, responsive và cập nhật local    | Hoàn tất   | Build, strict typecheck, 14 unit tests, browser regression và test:ipa qua. 44 WAV giải mã được, không rỗng; xác minh sự kiện IPA từ engine. Kiểm tra phát/lỗi/thử lại, Enter đúng/sai/lặp, không tràn ngang ở 320/375/768/1440px. Đã xem ảnh mobile; local 5175 cập nhật. |

## Chuyển sang giọng hệ thống (26/10/2026)

| Công việc                                  | Trạng thái | Tiến độ / kiểm chứng                                                                                                                                                                                                                                |
| ------------------------------------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gỡ tích hợp Kokoro theo yêu cầu người dùng | Hoàn tất   | Đã xóa model/cache, 1.037 WAV, manifest, script tạo/kiểm tra audio và 53 package liên quan. Không còn tài nguyên Kokoro trong source hoặc bản build; npm audit 0 vulnerabilities.                                                                   |
| Giữ menu giọng hệ thống và lưu lựa chọn    | Hoàn tất   | Chọn giọng tiếng Anh có sẵn, ưu tiên Anh–Anh; tự chuyển lựa chọn engine cũ sang hệ thống, nhớ giọng trên trình duyệt, giọng đã mất dùng giọng tiếng Anh dự phòng. Giữ tốc độ, mẫu IPA và Enter lần hai.                                             |
| Kiểm tra và cập nhật local                 | Hoàn tất   | Build và strict typecheck qua; browser regression, test:voice và test:ipa qua ở desktop/mobile 320/375/768/1440px. Kiểm tra đổi giọng/tốc độ/lưu lựa chọn, lỗi/thử lại, không tải audio từ vựng, dừng âm khi chuyển chế độ; local 5175 đã cập nhật. |

## Sửa tự động đọc khi thay bộ lọc (26/10/2026)

| Công việc                                       | Trạng thái | Kiểm chứng                                                                                                                                                                                                  |
| ----------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tách thao tác lọc khỏi tự động đọc từ tiếp theo | Hoàn tất   | Round có cờ autoplay rõ ràng; cấp độ, nhóm IPA, chọn/bỏ âm và chế độ lọc không tự đọc. Chuyển từ vẫn tuân theo thiết lập tự động đọc; nghe tại thư viện dùng nút nghe riêng.                                |
| Kiểm tra hồi quy và cập nhật local              | Hoàn tất   | Build và strict typecheck qua. Browser regression xác nhận lọc im lặng trước/sau nghe, auto bật/tắt, Enter lần hai, chấm điểm và luyện từ thư viện; responsive 375/768/1024/1440px. Local 5175 đã cập nhật. |

## Nghe từ ngay trong thư viện (26/10/2026)

| Công việc                                           | Trạng thái | Kiểm chứng                                                                                                                                                                                                                  |
| --------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nút tai nghe phát từ tại thư viện, không điều hướng | Hoàn tất   | Dùng giọng hệ thống trực tiếp, nhãn Nghe từ và thông báo lỗi ngay tại thư viện; bỏ callback chuyển sang trang luyện nghe.                                                                                                   |
| Kiểm tra hồi quy và cập nhật local                  | Hoàn tất   | Build/strict typecheck, browser regression, voice và styles tests qua. Nghe/lặp lại nghe giữ route /library, từ khóa, kết quả và phân trang; đúng từ, tốc độ/giọng hệ thống, lỗi/thử lại hoạt động. Local 5175 đã cập nhật. |

## Giao diện đa ngôn ngữ Việt / Anh (26/10/2026)

| Công việc                                                   | Trạng thái | Kiểm chứng                                                                                                                                                                                                                                                                                                                                                           |
| ----------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| i18next + react-i18next, cookie và SSR độc lập từng request | Hoàn tất   | Việt/Anh, tiếng Việt mặc định; chọn ở header, cookie một năm với giá trị whitelist; instance SSR riêng, html lang/title/description đúng locale. Chuyển giao diện tại chỗ không gọi server và hoạt động khi tạm offline.                                                                                                                                             |
| Dịch giao diện, thông báo, nhãn trợ năng và số/ngày         | Hoàn tất   | Catalog vi/en chia thành 9 namespace, semantic keys, plural và Intl, Trans cho rich text. Đổi ngôn ngữ giữ bài/bộ lọc/từ khóa/giọng. Từ tiếng Anh, IPA và nghĩa tiếng Việt là nội dung học độc lập có lang riêng. README đã cập nhật.                                                                                                                                |
| Kiểm tra hai ngôn ngữ và hồi quy                            | Hoàn tất   | 17 unit tests, strict typecheck, build, format, browser/voice/IPA/styles và account PostgreSQL integration đều qua. SSR song song vi/en không lẫn; cookie/reload/offline, Enter tiếng Anh, lỗi đổi theo locale, 4 routes × 5 widths × 2 ngôn ngữ; tài khoản đăng nhập ở 320/375/1440px. Đã xem ảnh mobile. Local 5175 cập nhật; npm audit 0 vulnerabilities khi cài. |

## Nút cờ chuyển ngôn ngữ (26/10/2026)

| Công việc                                    | Trạng thái | Kiểm chứng                                                                                                                                                                                 |
| -------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Thay dropdown bằng một nút cờ Việt Nam / Anh | Hoàn tất   | Nút cờ SVG 44px, nhãn trợ năng, giữ cookie và chuyển tại chỗ. Typecheck, build, 17 unit tests và kiểm tra i18n trình duyệt (4 trang × 5 kích thước × 2 ngôn ngữ) qua; local 5175 cập nhật. |

## Vị trí nút cờ cuối header (26/10/2026)

| Công việc                                                 | Trạng thái | Kiểm chứng                                                                                                                                                            |
| --------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Đặt nút cờ sau Hướng dẫn, cố định vị trí khi đổi ngôn ngữ | Hoàn tất   | Mobile dành hàng riêng cho nhóm thao tác. Build qua; kiểm tra trình duyệt xác nhận tọa độ nút không đổi giữa Việt/Anh ở 320/375/768/1024/1440px. Local 5175 cập nhật. |

## Deploy Vercel + Neon (26/10/2026)

| Công việc                                                                | Trạng thái    | Kiểm chứng                                                                                                                        |
| ------------------------------------------------------------------------ | ------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Preset Vercel, region Singapore, connection pool và direct migration URL | Hoàn tất      | Build Vercel xuất .vercel/output (Node 24), Node local build, strict typecheck và 17 unit tests qua; giữ transaction.             |
| Rate limit dùng database giữa các serverless instance                    | Hoàn tất      | Migration 0001 đã áp dụng local; integration signup/login/import/retry/account isolation và lưu tiến độ qua với storage database. |
| Hướng dẫn môi trường production và Google OAuth                          | Hoàn tất      | docs/DEPLOYMENT.md và README.                                                                                                     |
| Tạo Neon/Vercel, migrate Neon và kiểm tra URL public                     | Chờ đăng nhập | Hai tab tài khoản đã mở; chưa có phiên đăng nhập.                                                                                 |
