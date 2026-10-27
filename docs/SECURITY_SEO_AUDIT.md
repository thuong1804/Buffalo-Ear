# Kiểm tra bảo mật và SEO — 27/10/2026

Phạm vi: source trong project, bundle production local và các request GET công khai tới https://buffalo-ear.vercel.app. Không chạy test tạo tài khoản, sửa/xóa dữ liệu hoặc thử mật khẩu trên production. Đây là đánh giá trong phạm vi ứng dụng, không phải chứng nhận không còn lỗ hổng.

## Bản production đã quan sát

- `/` và `/library`: HTTP 200, cùng title/description mặc định.
- `/tenses`, `/robots.txt`, `/sitemap.xml`: HTTP 404; bản deploy chưa có đầy đủ chức năng trong source hiện tại.
- Có HTTPS/HSTS do Vercel cung cấp. Chưa có CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy hoặc canonical trên các response đã kiểm tra.
- Response SSR đang có `Cache-Control: public, max-age=0, must-revalidate`. Source đọc profile và locale từ cookie nên đã đổi sang `private, no-store`, đồng thời tắt cache CDN cho response động.

Các thay đổi dưới đây **chưa được deploy** bởi cuộc kiểm tra này.

## Bảo mật trong source

- `npm audit --json`: **0 lỗ hổng đã biết**, gồm dependency runtime và development, tại thời điểm kiểm tra. Điều này không loại trừ lỗi logic hoặc lỗ hổng chưa công bố.
- Server functions lấy user ID từ session, không nhận user ID để ghi/đọc tài khoản khác. Truy vấn Drizzle có ràng buộc theo user; không tìm thấy ghép SQL thô từ input.
- Input đáp án/cài đặt dùng Zod; import giới hạn 5.000 phần tử và chuẩn hóa dữ liệu; ID request và unique constraint chống ghi lặp. Kết quả luyện từ được chấm phía server.
- Better Auth dùng secret server, session cookie ký, HttpOnly và SameSite=Lax; HTTPS làm cookie Secure theo thư viện. Auth rate limit dùng bảng database. Giữ handler gốc TanStack Start để bảo toàn CSRF middleware mặc định cho RPC.
- CSP mới có nonce ngẫu nhiên riêng từng response; nonce client gửi lên luôn bị thay thế. `script-src` không cho `unsafe-inline`/`unsafe-eval`; chặn inline event handlers, object, nhúng iframe và base URL. Cho phép style attribute vì giao diện có biến CSS động; font/audio từ cùng origin và ảnh avatar HTTPS vẫn hoạt động.
- Thêm header chống nhúng/đoán MIME, referrer và quyền camera/microphone/geolocation. Vercel config cũng đặt header cơ bản cho static assets.
- Không tìm thấy file `.env` thực hoặc private key trong danh sách Git tracked. Kiểm tra bundle public không chứa giá trị DATABASE_URL, BETTER_AUTH_SECRET hay GOOGLE_CLIENT_SECRET từ môi trường local.
- Không thấy `dangerouslySetInnerHTML`, `innerHTML`, `eval` hoặc `new Function` trong source ứng dụng được rà soát.

### Giới hạn còn lại

- Email/password chưa bắt buộc xác minh email, chưa cấu hình luồng gửi mail khôi phục mật khẩu. Không được coi địa chỉ chưa xác minh là bằng chứng sở hữu email. Muốn bật xác minh cần cấu hình dịch vụ gửi mail và kiểm thử trước.
- Rate limit hiện bảo vệ auth; chưa có quota riêng theo user cho RPC submit/import. Khi mở rộng public, cần cân nhắc quota ghi dữ liệu/giới hạn chi phí theo mức sử dụng thực tế.
- Node local không cung cấp IP được tin cậy cho Better Auth nên có thể dùng bucket chung theo endpoint. Production đã cấu hình header IP của Vercel; cần xác nhận hoạt động theo IP sau deploy.
- Chưa kiểm chứng cookie Secure, Google OAuth, chính sách cache sau CDN hoặc thẻ chia sẻ trên bản deploy mới. Cần kiểm tra lại sau redeploy bằng tài khoản test được phép.

## SEO trong source mới

- Metadata SSR theo từng route, cập nhật khi chuyển trang/đổi ngôn ngữ: title, description, canonical, robots, Open Graph và Twitter card. Chỉ một bộ metadata; tránh effect ghi đè title về trang chủ.
- Canonical và ảnh chia sẻ dùng origin cố định được cấu hình, không lấy từ Host header của request. Mặc định đúng domain người dùng cung cấp: `https://buffalo-ear.vercel.app`.
- Ảnh chia sẻ `public/social-card.png` kích thước 1200×630, tạo lại bằng `node scripts/generate-social-card.cjs`.
- `/robots.txt` và `/sitemap.xml` được phục vụ từ server. Sitemap chỉ chứa `/`, `/library`, `/dialogues`, `/tenses`; không đưa login, tiến độ cá nhân, API hoặc bộ lọc vào sitemap.
- Có các liên kết HTML thật ở footer để crawler tìm trang công khai, giữ điều hướng SPA khi người dùng bấm bình thường.
- Local và Vercel Preview mặc định không index. Vercel Production tự bật index cho trang công khai. Login, progress và trang 404 có noindex.
- Ngôn ngữ hiện dùng cookie trên cùng URL, nên không tạo hreflang giả. Nếu cần SEO riêng cho tiếng Anh, phải xây dựng URL riêng từng ngôn ngữ trước.
- Chưa liên kết Google Search Console hay xác nhận Google đã index. Có metadata/sitemap không đảm bảo thứ hạng hoặc thời điểm xuất hiện trên Google.

## Kiểm chứng

- Build production local và TypeScript.
- 34 unit tests, gồm indexing policy, origin validation, metadata theo route/ngôn ngữ và CSP/cache headers.
- `test:security-seo`: SSR mỗi trang chỉ có một title/description/canonical; nonce khớp mọi script và thay đổi giữa các response; nonce giả bị thay thế; script chèn không có nonce bị trình duyệt chặn; CSP không phá hydration/navigation/đổi ngôn ngữ; robots/sitemap, noindex 404/trang cá nhân, ảnh PNG, liên kết crawl và kiểm tra secret trong bundle.
- `test:i18n` và `test:mobile-navigation`: metadata/locale SSR, đổi ngôn ngữ, menu mobile và reduced motion.
- `test:integration` đã chạy thành công trên PostgreSQL local: đăng ký/đăng nhập/đăng xuất, cookie HttpOnly/SameSite=Lax có chữ ký, mật khẩu lưu dạng hash, tên tài khoản chứa HTML được hiển thị như text, chặn request auth và RPC khác origin, từ chối RPC ẩn danh, cách ly hai tài khoản, chống replay và xóa lịch sử. Tài khoản test được dọn sau khi chạy.
- Docker local ban đầu lỗi socket runtime cũ. Đã cách ly hai thư mục chỉ chứa socket runtime và tạo lại chúng; không factory reset, không xóa database/volumes. Container PostgreSQL sau đó Healthy. Các bản sao runtime cũ vẫn được giữ trên máy.

## Sau redeploy

1. Đặt `SITE_URL=https://buffalo-ear.vercel.app` trong Vercel Production (mặc định code đã dùng domain này); đổi biến khi chuyển domain. Không dùng URL preview làm canonical. Không cần `SITE_INDEXABLE` trên Vercel.
2. Redeploy source mới; kiểm tra trực tiếp `/tenses`, `/robots.txt`, `/sitemap.xml`, `/social-card.png` và các security header.
3. Kiểm tra login/logout, Google OAuth, cookie Secure/HttpOnly/SameSite và tiến độ bằng tài khoản test. Xác nhận HTML có tài khoản không được cache public.
4. Thêm domain vào Google Search Console, xác minh quyền sở hữu và submit `/sitemap.xml`; kiểm tra URL Inspection và bản xem trước thẻ chia sẻ sau khi deploy.

## Tài liệu đối chiếu

- [TanStack Start server entry](https://tanstack.com/start/latest/docs/framework/react/guide/server-entry-point)
- [TanStack Start middleware và CSRF](https://tanstack.com/start/latest/docs/framework/react/guide/middleware)
- [Vercel request headers và IP client](https://vercel.com/docs/headers/request-headers)
- [Google: phiên bản trang theo ngôn ngữ](https://developers.google.com/search/docs/specialty/international/localized-versions)
