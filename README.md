# Buffalo Ear

Ứng dụng React luyện nghe và viết tiếng Anh theo 44 âm IPA, có 3.000 mục từ A1–B2, phiên âm và nghĩa tiếng Việt. Giao diện responsive gồm Luyện nghe, Thư viện và Tiến độ.

## Chạy dự án

Yêu cầu Node.js 20.19+ và npm.

```sh
npm install
npm start
```

Mở http://127.0.0.1:5174. Máy chủ chỉ lắng nghe trên máy cục bộ.

```sh
npm run build
npm run preview
```

Bản production nằm trong `dist/`, có thể triển khai lên dịch vụ lưu trữ web tĩnh.

## Cách sử dụng

- Chọn cấp độ **Tất cả / A1 / A2 / B1 / B2**. Cấp độ kết hợp với bộ lọc IPA, dùng chung cho bài luyện và thư viện, và được lưu khi tải lại trang.
- Chọn nhiều âm IPA: mặc định lọc từ chứa **ít nhất một** âm đã chọn, có thể đổi thành **tất cả**. Đổi nhóm sẽ bỏ các âm được chọn thuộc nhóm khác.
- Nhấn nghe, gõ từ và nhấn **Enter** để chấm. Câu trả lời bỏ qua hoa/thường và khoảng trắng ở hai đầu. Mỗi từ chỉ được chấm một lần.
- “Hiện đáp án” cho biết từ, phiên âm và nghĩa. Xem trước sẽ không được tính điểm đúng.
- “Từ tiếp theo” hoặc **Alt + →** chuyển từ. Bộ từ được xáo trộn và không lặp trong cùng một lượt đi hết bộ lọc. Chỉ có một từ phù hợp thì từ đó được lặp lại.
- Bật/tắt tự động đọc và chọn tốc độ. Lần đầu mở trang cần thao tác người dùng để trình duyệt cho phép phát tiếng.
- Thư viện hỗ trợ tìm từ/nghĩa và chuyển sang luyện một từ cụ thể. Bộ lọc IPA hiện tại cũng áp dụng trong thư viện.
- Tiến độ hiển thị lịch sử, nhịp luyện 7 ngày, tỉ lệ đúng và chế độ ôn từ sai. Trạng thái học của mỗi từ dựa trên câu trả lời gần nhất.
- Điểm trong thẻ luyện là điểm của phiên hiện tại. Lịch sử và cài đặt lưu trong localStorage trên trình duyệt, giới hạn 5.000 lượt gần nhất. Mục tiêu mỗi ngày là 20 lượt trả lời.

## Kiểm tra

```sh
npm test
npm run build
npm run format:check
```

Kiểm thử trình duyệt (khởi chạy app trước ở terminal khác):

```sh
npx playwright install chromium
npm run test:browser
```

Có thể đặt `APP_URL`, `CHROMIUM_PATH` hoặc `PLAYWRIGHT_PACKAGE` nếu dùng runtime riêng. Kiểm thử dùng giọng đọc giả lập để xác nhận nội dung phát và luồng học, không kiểm tra phần cứng âm thanh. Ảnh desktop/mobile được lưu trong `test-results/`.

## Cấu trúc

- `src/App.jsx`: trạng thái và điều phối phiên luyện.
- `src/components.jsx`: bảng IPA, bài luyện, thư viện, tiến độ.
- `src/useSpeech.js`: Web Speech API, phát/hủy giọng đọc, xử lý lỗi.
- `src/learning.js`: lọc từ, xáo trộn, chấm điểm và lưu tiến độ.
- `data/vocabulary.json`: bộ dữ liệu 3.000 mục dạng `[word, ipa, meaning, level]` gọn nhẹ.
- `data.js`: nạp bộ từ và tách chính xác token IPA (ưu tiên nguyên âm đôi, phụ âm ghép).
- `data/legacy.json`: bản lưu 507 từ ban đầu để kiểm tra tương thích lịch sử; không được nạp vào app.
- `data/sources.json`: phiên bản nguồn và mã SHA-256 để có thể tái tạo dữ liệu.
- `scripts/fetch-vocabulary.py`, `scripts/build-vocabulary.py`: tải nguồn và tạo dữ liệu offline.
- `style.css`: hệ thống thiết kế và responsive.
- `docs/DESIGN.md`: quyết định thiết kế và UX dựa trên frontend-design, ui-ux-pro-max.

## Dữ liệu & dung lượng

| Cấp độ | Số mục từ |
| ------ | --------: |
| A1     |       904 |
| A2     |       801 |
| B1     |       701 |
| B2     |       594 |
| Tổng   |     3.000 |

Tệp `data/vocabulary.json` chiếm khoảng 180 kB (176 KiB); nén gzip còn khoảng 63 KiB. Đây là dữ liệu văn bản, không chứa file âm thanh. Dữ liệu được đóng gói với app, không chép vào localStorage; localStorage chỉ lưu tối đa 5.000 lượt luyện cùng cài đặt. Việc chạy cục bộ không cần database server hoặc gọi API để tra từ. Giọng đọc có thể cần mạng tùy thiết bị.

Bộ từ là dữ liệu tổng hợp cho Buffalo Ear, **không phải bản Oxford 3000 chính thức**. Nhãn A1–B2 là tham khảo theo mục từ, không phải đánh giá trình độ của người dùng hoặc của mọi nghĩa của từ đó. Dữ liệu giữ nguyên 507 mục cũ; phần lớn cấp độ đến từ [3000MostCommonEnglishWords](https://github.com/chihyungchang/3000MostCommonEnglishWords) (Apache 2.0). Nghĩa/phiên âm bổ sung lấy từ [Skypedia / MinhQND](https://github.com/skypediacode/english-vietnamese-dictionary) (CC BY-SA 4.0), đã chọn nghĩa theo từ loại, chuẩn hóa phiên âm và bổ sung các hiệu đính trong script. Một số mục bổ sung và cấp độ được biên soạn riêng. Dữ liệu phái sinh phát hành theo CC BY-SA 4.0; xem `public/licenses/ATTRIBUTION.txt`. Bộ nguồn có thể có sai sót; các từ nhiều nghĩa có thể có nhiều cách đọc và cấp độ khác nhau.

Tái tạo dữ liệu (Python 3.10+, chỉ dùng thư viện chuẩn):

```sh
python scripts/fetch-vocabulary.py
python scripts/build-vocabulary.py
npm test
```

Bước tải nguồn lưu một database khoảng 42 MiB trong `.cache/` đã được loại khỏi Git. Database nguồn này **không được đóng gói vào bản web**. Các lần tạo lại dùng bản nguồn đã khóa theo commit và kiểm tra SHA-256. Tệp JSON được giữ dạng compact, không cần format lại.

## Giới hạn hiện tại

Giọng đọc dùng Web Speech API, ưu tiên en-GB và dự phòng giọng tiếng Anh khác; khả năng phát phụ thuộc trình duyệt và thiết bị. Bộ phiên âm học tập ưu tiên Anh–Anh, chưa ghi dấu trọng âm và có thể khác giọng đọc dự phòng. Font Google có font dự phòng khi ngoại tuyến. Chưa có tài khoản hoặc đồng bộ dữ liệu giữa thiết bị.
