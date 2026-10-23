# Buffalo Ear

Ứng dụng React luyện nghe và viết tiếng Anh theo 44 âm IPA, có 507 từ vựng và nghĩa tiếng Việt. Giao diện responsive gồm Luyện nghe, Thư viện và Tiến độ.

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
- `data.js`: 507 từ với các token IPA phân tách rõ ràng.
- `style.css`: hệ thống thiết kế và responsive.
- `docs/DESIGN.md`: quyết định thiết kế và UX dựa trên frontend-design, ui-ux-pro-max.

## Giới hạn hiện tại

Giọng đọc dùng Web Speech API, ưu tiên en-GB và dự phòng giọng tiếng Anh khác; khả năng phát phụ thuộc trình duyệt và thiết bị. Bộ phiên âm học tập theo Anh–Anh, chưa ghi dấu trọng âm và có thể khác giọng đọc dự phòng. Font Google có font dự phòng khi ngoại tuyến. App hiện có 507 từ, chưa mở rộng thành 3.000 từ. Chưa có tài khoản hoặc đồng bộ dữ liệu giữa thiết bị.
