# Buffalo Ear

Ứng dụng React + TanStack Start, giao diện Tailwind CSS v4, luyện nghe và viết tiếng Anh theo 44 âm IPA, có 3.000 mục từ A1–B2, phiên âm và nghĩa tiếng Việt. Giao diện responsive gồm Luyện nghe, Thư viện và Tiến độ.

## Chạy dự án

Yêu cầu **Node.js 22.12+ (khuyên dùng Node 24 LTS)**, npm và Docker nếu dùng PostgreSQL local. Repository là **một package**, không dùng workspaces hoặc monorepo.

```sh
npm install
npm run dev
```

Mở http://127.0.0.1:5174. Khi chưa cấu hình database/auth, bạn vẫn luyện được với tư cách khách và lưu tiến độ trên trình duyệt.

Để bật tài khoản và đồng bộ:

1. Sao chép `.env.example` thành `.env` (`Copy-Item .env.example .env` trong PowerShell).
2. Sinh secret bằng lệnh dưới đây rồi điền vào `BETTER_AUTH_SECRET`. Không commit `.env`.
3. Chạy PostgreSQL và migration, rồi khởi động lại server.

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
npm run db:up
npm run db:migrate
npm run dev
```

PostgreSQL local dùng cổng **5438**, database `buffalo_ear`; volume Docker giữ dữ liệu qua các lần khởi động. Thông tin đăng nhập trong Compose dành cho local. Nếu dùng database khác, sửa `DATABASE_URL`.

| Biến môi trường                            | Công dụng                                                 |
| ------------------------------------------ | --------------------------------------------------------- |
| `DATABASE_URL`                             | Kết nối PostgreSQL, chỉ phía server                       |
| `BETTER_AUTH_SECRET`                       | Secret ít nhất 32 ký tự                                   |
| `BETTER_AUTH_URL`                          | Origin ứng dụng, mặc định ví dụ `http://127.0.0.1:5174`   |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Tùy chọn; nút Google chỉ hiện khi có đủ cả hai            |
| `HOST`, `PORT`                             | Địa chỉ/cổng server production; mặc định `127.0.0.1:5174` |

Google OAuth cần OAuth Client trên Google Cloud Console, redirect URI local là `http://127.0.0.1:5174/api/auth/callback/google`. Khi đổi origin/cổng, cập nhật cả `BETTER_AUTH_URL` và redirect URI tại Google. Email/mật khẩu hoạt động độc lập với Google.

```sh
npm run build
npm start
```

Production chạy **Node server** từ `.output/server/index.mjs`, phục vụ assets trong `.output/public`; không còn deploy như website tĩnh từ `dist/`. `npm start` tự đọc `.env` nếu có. Khi deploy, cấu hình HTTPS, database và secrets trên host; đặt `HOST=0.0.0.0` nếu host yêu cầu. Khi chạy sau reverse proxy, cấu hình trusted proxy/IP headers của Better Auth cho đúng hạ tầng để rate limit phân biệt người dùng.

Schema nằm ở `src/db/schema.ts`. Khi thay đổi schema:

```sh
npm run db:generate
npm run db:migrate
```

Review và lưu migration SQL trong `drizzle/` cùng mã nguồn; không dùng `db:push` cho production.

## Cách sử dụng

- Chọn cấp độ **Tất cả / A1 / A2 / B1 / B2**. Cấp độ kết hợp với bộ lọc IPA, dùng chung cho bài luyện và thư viện, và được lưu khi tải lại trang.
- Chọn nhiều âm IPA: mặc định lọc từ chứa **ít nhất một** âm đã chọn, có thể đổi thành **tất cả**. Đổi nhóm sẽ bỏ các âm được chọn thuộc nhóm khác.
- Nhấn nghe, gõ từ và nhấn **Enter** để chấm. Câu trả lời bỏ qua hoa/thường và khoảng trắng ở hai đầu. Mỗi từ chỉ được chấm một lần.
- “Hiện đáp án” cho biết từ, phiên âm và nghĩa. Xem trước sẽ không được tính điểm đúng.
- “Từ tiếp theo” hoặc **Alt + →** chuyển từ. Bộ từ được xáo trộn và không lặp trong cùng một lượt đi hết bộ lọc. Chỉ có một từ phù hợp thì từ đó được lặp lại.
- Bật/tắt tự động đọc và chọn tốc độ. Lần đầu mở trang cần thao tác người dùng để trình duyệt cho phép phát tiếng.
- Thư viện hỗ trợ tìm từ/nghĩa và chuyển sang luyện một từ cụ thể. Bộ lọc IPA hiện tại cũng áp dụng trong thư viện.
- Tiến độ hiển thị lịch sử, nhịp luyện 7 ngày, tỉ lệ đúng và chế độ ôn từ sai. Trạng thái học của mỗi từ dựa trên câu trả lời gần nhất.
- Điểm trong thẻ luyện là điểm của phiên hiện tại. Khách lưu lịch sử và cài đặt trong localStorage, giới hạn 5.000 lượt gần nhất. Tài khoản lưu trên PostgreSQL và tải 5.000 lượt gần nhất. Mục tiêu mỗi ngày là 20 lượt trả lời.

## Tài khoản và dữ liệu

- Đăng ký bằng tên, email, mật khẩu ít nhất 8 ký tự; đăng nhập bằng email hoặc Google nếu được cấu hình.
- Better Auth quản lý tài khoản và session cookie httpOnly. Mọi server function đọc/ghi dữ liệu cá nhân đều kiểm tra session.
- Khi đăng nhập, gộp lịch sử khách vào tài khoản bằng transaction và khóa chống trùng. Chỉ xóa các lượt local được server xác nhận; lỗi mạng giữ lại lịch sử để thử lại.
- Cài đặt khách được dùng khi tài khoản chưa có cài đặt. Cài đặt tài khoản hiện có được ưu tiên.
- Đáp án mới được kiểm tra bằng Zod, chấm trên server và ghi bằng Drizzle. Gửi lại cùng mã lượt luyện không tạo thêm bản ghi.
- Tiến độ của tài khoản không được sao chép vào localStorage của khách. Đăng xuất trở về dữ liệu khách; “Xóa tiến độ” khi đăng nhập sẽ xóa lịch sử của chính tài khoản trên server.
- Lịch sử khách cũ không có đáp án gốc nên được nhập dưới dạng kết quả lịch sử, không thể chấm lại. Đây là ứng dụng tự học, không phải hệ thống thi chống gian lận.

## Kiểm tra

```sh
npm test
npm run typecheck
npm run build
npm run format:check
```

Khởi chạy app ở terminal khác trước khi kiểm thử trình duyệt:

```sh
npx playwright install chromium
npm run test:browser
npm run test:styles
npm run test:integration
```

`test:integration` cần `.env`, PostgreSQL đã migrate và auth đã bật. Test tạo tài khoản riêng với email ngẫu nhiên; cuối lượt chỉ dọn các tài khoản của chính lượt test nếu `DATABASE_URL` trỏ đến localhost. Không chạy test này trên production.

Có thể đặt `APP_URL`, `CHROMIUM_PATH` hoặc `PLAYWRIGHT_PACKAGE` nếu dùng runtime riêng. Test trình duyệt dùng giọng đọc giả lập để xác nhận nội dung phát và luồng học, không kiểm tra phần cứng âm thanh. Ảnh desktop/mobile được lưu trong `test-results/`.

## Cấu trúc

- `src/routes/`: các trang `/`, `/library`, `/progress`, `/login` và handler `/api/auth/*`.
- `src/App.tsx`: layout chung, điều hướng, hướng dẫn và thông báo đồng bộ.
- `src/components/`: bộ lọc IPA/cấp độ, bài luyện, thư viện, tiến độ, tài khoản và form đăng nhập.
- `src/hooks/usePractice.ts`: điều phối phiên luyện và bộ lọc.
- `src/hooks/useLearning.tsx`: dữ liệu khách/tài khoản, TanStack Query và đồng bộ.
- `src/hooks/useSpeech.ts`: Web Speech API, phát/hủy giọng đọc và xử lý lỗi.
- `src/core/`: dữ liệu từ vựng, bộ lọc, xáo trộn, chấm điểm, đọc localStorage và tính tiến độ bằng TypeScript thuần.
- `src/db/`: schema và kết nối Drizzle/PostgreSQL, chỉ phía server.
- `src/server/`: server functions, middleware kiểm tra session và schema Zod.
- `src/lib/auth.ts`, `src/lib/auth-client.ts`: cấu hình Better Auth phía server/client.
- `drizzle/`, `drizzle.config.ts`: migration SQL và cấu hình Drizzle Kit.
- `data/`: giữ bộ từ, bản legacy và metadata nguồn tại gốc.
- `scripts/fetch-vocabulary.py`, `scripts/build-vocabulary.py`: tải nguồn và tạo dữ liệu offline.
- `src/styles.css`: Tailwind v4 import, theme Ocean Teal/font/shadow tokens và animation token. Styling component, responsive và states dùng utility classes trong TSX; không dùng CSS component selectors hoặc `@apply`.
- `.prettierrc.json`: tự sắp xếp utilities bằng prettier-plugin-tailwindcss.
- `tests/styles.cjs`: kiểm tra selection, viền/feedback đúng-sai, checkbox, thanh mục tiêu và biểu đồ sau chuyển Tailwind.
- `docs/DESIGN.md`: quyết định thiết kế và UX.
- `implementation_plan.md`: kế hoạch và bảng tiến độ triển khai.

## Dữ liệu & dung lượng

| Cấp độ | Số mục từ |
| ------ | --------: |
| A1     |       904 |
| A2     |       801 |
| B1     |       701 |
| B2     |       594 |
| Tổng   |     3.000 |

Tệp `data/vocabulary.json` chiếm khoảng 180 kB (176 KiB); nén gzip còn khoảng 63 KiB. Đây là dữ liệu văn bản, không chứa file âm thanh. Dữ liệu được đóng gói với app, không chép vào localStorage; localStorage chỉ lưu tối đa 5.000 lượt luyện cùng cài đặt. Chế độ khách không cần database server hoặc gọi API để tra từ; tài khoản cần PostgreSQL. Giọng đọc có thể cần mạng tùy thiết bị.

Bộ từ là dữ liệu tổng hợp cho Buffalo Ear, **không phải bản Oxford 3000 chính thức**. Nhãn A1–B2 là tham khảo theo mục từ, không phải đánh giá trình độ của người dùng hoặc của mọi nghĩa của từ đó. Dữ liệu giữ nguyên 507 mục cũ; phần lớn cấp độ đến từ [3000MostCommonEnglishWords](https://github.com/chihyungchang/3000MostCommonEnglishWords) (Apache 2.0). Nghĩa/phiên âm bổ sung lấy từ [Skypedia / MinhQND](https://github.com/skypediacode/english-vietnamese-dictionary) (CC BY-SA 4.0), đã chọn nghĩa theo từ loại, chuẩn hóa phiên âm và bổ sung các hiệu đính trong script. Một số mục bổ sung và cấp độ được biên soạn riêng. Dữ liệu phái sinh phát hành theo CC BY-SA 4.0; xem `public/licenses/ATTRIBUTION.txt`. Bộ nguồn có thể có sai sót; các từ nhiều nghĩa có thể có nhiều cách đọc và cấp độ khác nhau.

Tái tạo dữ liệu (Python 3.10+, chỉ dùng thư viện chuẩn):

```sh
python scripts/fetch-vocabulary.py
python scripts/build-vocabulary.py
npm test
```

Bước tải nguồn lưu một database khoảng 42 MiB trong `.cache/` đã được loại khỏi Git. Database nguồn này **không được đóng gói vào bản web**. Các lần tạo lại dùng bản nguồn đã khóa theo commit và kiểm tra SHA-256. Tệp JSON được giữ dạng compact, không cần format lại.

## Giới hạn hiện tại

Giọng đọc dùng Web Speech API, ưu tiên en-GB và dự phòng giọng tiếng Anh khác; khả năng phát phụ thuộc trình duyệt và thiết bị. Bộ phiên âm học tập ưu tiên Anh–Anh, chưa ghi dấu trọng âm và có thể khác giọng đọc dự phòng. Font Nunito Sans cho giao diện và Noto Sans cho IPA được phục vụ từ `public/fonts/`; giấy phép OFL đi kèm. Google OAuth cần thông tin cấu hình riêng và chưa được kiểm thử với tài khoản Google thực. Chưa có luồng xác minh email hoặc quên mật khẩu qua email.

## Nghe âm mẫu và phím tắt

Trong “Làm quen âm IPA”, chọn một trong 44 âm rồi nhấn “Nghe âm mẫu”. Có thể nghe trước khi chọn bộ từ; thao tác này không thay đổi bộ lọc hoặc câu hiện tại. Mẫu WAV tổng hợp Anh–Anh được lưu local, tách khỏi giọng đọc từ vựng của thiết bị. Nguồn và cách tái tạo: `public/audio/ipa/README.md`, `scripts/generate-ipa-audio.mjs`.

Nhấn Enter trong ô trả lời để kiểm tra. Khi đúng, nhấn Enter lần nữa để qua từ tiếp theo; giữ phím không chuyển câu. Khi sai hoặc đã xem đáp án, dùng nút “Từ tiếp theo” hoặc Alt + →.

Chạy kiểm tra âm mẫu/phím tắt: `npm run test:ipa` (đặt `APP_URL` nếu app chạy khác cổng 5175). Test xác nhận 44 WAV giải mã được, phát âm độc lập, lỗi/thử lại và responsive.

## Chọn giọng hệ thống

Trong mục “Giọng đọc”, chọn giọng tiếng Anh có sẵn trên thiết bị hoặc “Thiết bị · Tự động” để ưu tiên Anh–Anh. Lựa chọn được nhớ trên trình duyệt; nếu giọng đã lưu không còn có sẵn, app dùng giọng tiếng Anh dự phòng. Có thể thay đổi tốc độ đọc. Danh sách giọng tùy hệ điều hành và trình duyệt; không cần model hoặc API key.

Phần mẫu IPA và thao tác Enter kiểm tra / Enter lần hai sang từ tiếp khi đúng vẫn hoạt động như trước. Chạy `npm run test:voice` để kiểm tra chọn giọng, tốc độ, lưu lựa chọn và các tình huống lỗi.

## Ngôn ngữ giao diện

Bấm nút cờ Việt Nam / Anh ở header để chuyển ngôn ngữ. Cookie `buffalo-ear-locale` lưu lựa chọn trong một năm, dùng chung cho SSR và trình duyệt; chỉ chấp nhận `vi`/`en`, mặc định tiếng Việt. Mỗi lần render dùng i18next instance riêng để tránh lẫn ngôn ngữ giữa người dùng. Đổi ngôn ngữ tại chỗ giữ route, bộ lọc và bài đang nhập; giọng đọc tiếng Anh được lưu độc lập.

Catalog đặt trong `src/i18n/locales/{vi,en}/`, chia theo tính năng. Dùng `useTranslation()` và key có namespace (ví dụ `practice:next`); câu có số lượng dùng plural `_one` / `_other` và `{{count, number}}`. Câu có định dạng dùng `Trans`; tránh ghép các mảnh câu. Locale áp dụng cho nhãn ngày, số, metadata, lỗi và trợ năng. Nội dung học hiện là từ tiếng Anh, IPA và nghĩa tiếng Việt (được đánh dấu `lang` riêng).

`npm run test:i18n` kiểm tra SSR/cookie, chuyển ngôn ngữ, giữ trạng thái, ngày/số và responsive; unit tests kiểm tra key/placeholder giữa hai catalog. Khi thêm câu mới, cập nhật cả hai ngôn ngữ.
