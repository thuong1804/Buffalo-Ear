# Deploy Buffalo Ear: Vercel + Neon

Một package, TanStack Start SSR/API trên Vercel Node.js; PostgreSQL trên Neon và Drizzle migration. Giữ Better Auth hiện tại.

## 1. Tạo PostgreSQL trên Neon

1. Đăng nhập https://console.neon.tech và tạo project `buffalo-ear` trên gói Free.
2. Chọn Singapore nếu có, để gần người dùng Việt Nam và Vercel region `sin1` trong `vercel.json`. Nếu chọn region khác, đặt Vercel Functions gần database.
3. Trong Connect, sao chép hai connection string có TLS:
    - Pooled (hostname chứa `-pooler`) → `DATABASE_URL` cho ứng dụng.
    - Direct, tắt connection pooling → `DATABASE_URL_UNPOOLED` cho migration.
4. Giữ nguyên các tham số TLS do Neon cấp, ví dụ `sslmode=require`. Không đưa URL hoặc secret vào source, chat, ảnh chụp hay biến `VITE_*`.

Ứng dụng dùng `postgres.js` để giữ interactive transaction của import tiến độ; giới hạn một kết nối mỗi Vercel instance, tắt prepared statements và dùng pooler Neon.

## 2. Migration trước khi bật auth

Tạo file riêng `.env.production` trên máy (đã được gitignore), điền URL direct của Neon:

```dotenv
DATABASE_URL_UNPOOLED=postgresql://USER:PASSWORD@DIRECT_HOST/DATABASE?sslmode=require
```

Với Node 24:

```sh
node --env-file=.env.production node_modules/drizzle-kit/bin.cjs migrate
```

`drizzle.config.ts` ưu tiên `DATABASE_URL_UNPOOLED`, nếu trống mới dùng `DATABASE_URL`. Lệnh trên áp dụng migration SQL đã review trong `drizzle/`, gồm tài khoản, tiến độ và rate limit. Không chạy migration trong mỗi build hoặc dùng `db:push` trên production.

Database mới bắt đầu trống; lệnh migrate không chuyển tài khoản/dữ liệu PostgreSQL local. Bộ 3.000 từ và 44 audio IPA nằm trong mã nguồn/assets nên không cần seed database.

## 3. Tạo project Vercel

1. Đăng nhập https://vercel.com/new, import repository GitHub `thuong1804/Buffalo-Ear` sau khi mã nguồn mới đã được push.
2. Gói Hobby cho dự án cá nhân phi thương mại. Đặt Root Directory là thư mục gốc, Node.js **24.x**.
3. Chọn framework TanStack Start nếu được nhận diện; Build Command `npm run build`, để Output Directory mặc định. Nitro xuất Build Output API vào `.vercel/output`; không đặt `dist`, không thêm SPA rewrite `/(.*) → /index.html`.
4. Tạo project, lấy domain production ổn định, ví dụ `https://buffalo-ear.vercel.app` (tên thực tế phụ thuộc tài khoản/tên còn trống).
5. Thêm các biến dưới đây vào **Production**, rồi redeploy.

| Biến                   | Giá trị                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`         | Neon pooled connection string, có TLS                                                             |
| `BETTER_AUTH_URL`      | Origin production HTTPS chính xác, không thêm path                                                |
| `BETTER_AUTH_SECRET`   | Secret mới riêng cho production, tối thiểu 32 ký tự                                               |
| `SITE_URL`             | `https://buffalo-ear.vercel.app` hoặc origin domain riêng; dùng cho canonical/sitemap/ảnh chia sẻ |
| `GOOGLE_CLIENT_ID`     | OAuth client ID production                                                                        |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret production                                                                    |

Sinh secret trên máy và dán trực tiếp vào Vercel Environment Variables:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Không cần `HOST`/`PORT` hoặc Start Command trên Vercel. `VERCEL` do nền tảng cung cấp; config tự chọn preset `vercel`. Local vẫn build Node server; có thể kiểm tra bundle Vercel bằng `NITRO_PRESET=vercel npm run build` (PowerShell: `$env:NITRO_PRESET='vercel'; npm run build; Remove-Item Env:NITRO_PRESET`).

Không sao chép toàn bộ `.env` local lên Vercel: URL local và secret dev không dùng cho production. Chưa cấp biến Production cho Preview; khi cần Preview có auth, dùng Neon branch/database và secret riêng, origin preview chính xác.

## 4. Google OAuth

Trong Google Cloud Console → Google Auth Platform → Clients → Web application:

- Authorized JavaScript origins: origin production.
- Authorized redirect URIs: `https://YOUR_DOMAIN/api/auth/callback/google`.
- Nếu consent screen ở chế độ Testing, thêm email người thử vào Test users.

Giữ redirect URI local nếu vẫn phát triển trên máy. Nếu thêm domain riêng, cập nhật cả `BETTER_AUTH_URL`, origin và redirect URI rồi redeploy.

## 5. Kiểm tra sau deploy

- Mở trực tiếp và reload `/`, `/library`, `/progress`; kiểm tra HTTPS, không có lỗi SSR/hydration.
- Đổi Việt/Anh rồi reload; nghe từ và IPA bằng thao tác bấm trên thiết bị thực tế.
- Đăng ký/đăng nhập/đăng xuất; thử Google với tài khoản được phép.
- Làm một bài, reload và đăng nhập lại để xác nhận tiến độ lưu ở Neon.
- Kiểm tra lỗi auth và logs. Better Auth dùng bảng `rate_limit` chung giữa các instance, đọc IP do Vercel cung cấp; giới hạn đăng nhập vẫn hoạt động khi scale.
- Kiểm tra điện thoại, tab Library phát tại chỗ, Enter kiểm tra/chuyển từ.

Không chạy `test:integration` trực tiếp với production: test tạo tài khoản và dữ liệu. Dùng database/branch test riêng. Bản Free có quota; theo dõi usage của cả Vercel và Neon.

## SEO và header sau audit

Xem kết quả tại [SECURITY_SEO_AUDIT.md](SECURITY_SEO_AUDIT.md). Sau deploy, kiểm tra `/robots.txt`, `/sitemap.xml`, `/social-card.png`, title/canonical từng trang và CSP/cache headers. Vercel Production tự bật index cho trang công khai; Preview và local mặc định noindex. `/login` và `/progress` luôn noindex.

Không đặt `SITE_INDEXABLE=true` trên Preview. Biến này chỉ dành cho host production khác Vercel; test local giả lập production có thể bật tạm. Để chạy `test:security-seo` trên local, start server với biến này rồi chạy test, không trỏ test tới production. Test integration chỉ cho phép app/database loopback và tự dọn tài khoản test.

Thêm domain vào Google Search Console và submit sitemap sau khi deploy. Chuyển Việt/Anh hiện dùng cookie cùng URL; chưa có URL riêng để index hai phiên bản ngôn ngữ độc lập.

## Tài liệu chính thức

- [TanStack Start trên Vercel](https://vercel.com/docs/frameworks/full-stack/tanstack-start)
- [Nitro Vercel preset](https://nitro.build/deploy/providers/vercel)
- [Neon + Drizzle](https://neon.com/docs/guides/drizzle)
- [Neon connection pooling](https://neon.com/docs/connect/connection-pooling)
