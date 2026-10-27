# Nội dung Hội thoại CEFR A1–C2

## Quy mô và phân cấp

600 bài = 6 cấp × 10 chủ đề × 10 hội thoại. Mỗi hội thoại có 4 lượt A/B. ID ổn định theo dạng `A1-cafe-1`; draft và kết quả trong phiên gắn với ID, không dùng chỉ số của danh sách đang lọc.

10 chủ đề được khai thác ở cả sáu cấp: quán cà phê, đi lại/du lịch, khách sạn, mua sắm, nhà ở, sức khỏe/vận động, học tập, công việc, công nghệ, môi trường/cộng đồng. Mỗi cấp có 10 bài trong từng chủ đề. Các bài được viết riêng theo ngữ cảnh, phản hồi và diễn biến cụ thể; không dùng mẫu câu chung để thay tên đồ vật hoặc tăng độ dài cho cấp cao hơn.

| Cấp | Mục tiêu nội dung                                                                                |
| --- | ------------------------------------------------------------------------------------------------ |
| A1  | Từ quen thuộc, câu hỏi/yêu cầu trực tiếp, đáp ngắn; dùng bộ từ đơn giản hơn cho cùng tình huống. |
| A2  | Trao đổi thường ngày, nêu trở ngại cụ thể và đề xuất phương án đơn giản.                         |
| B1  | Mô tả vấn đề, giải thích lý do, hỏi thông tin và thương lượng lựa chọn quen thuộc.               |
| B2  | So sánh ưu/nhược điểm, điều kiện, nhượng bộ và hệ quả của lựa chọn.                              |
| C1  | Lập luận trừu tượng hơn, phân biệt mục tiêu và biện pháp, xét giả định và cam kết.               |
| C2  | Sắc thái hàm ý, giới hạn của lập luận, phân bổ lợi ích/gánh nặng và phản biện có cân nhắc.       |

Nguồn định hướng:

- [CEFR global scale — Council of Europe](https://www.coe.int/en/web/common-european-framework-reference-languages/table-1-cefr-3.3-common-reference-levels-global-scale)
- [CEFR self-assessment — Europass](https://europass.europa.eu/en/common-european-framework-reference-language-skills)

CEFR đánh giá năng lực trong ngữ cảnh, không chỉ độ dài/từ vựng. Nhãn ở đây là mục tiêu biên soạn tham khảo; chưa có đánh giá độc lập hoặc chứng nhận CEFR. Tốc độ giọng hệ thống là tùy chọn luyện tập và không quyết định cấp độ.

## Biên soạn và IPA

- `scripts/dialogue-content/{A1,A2,B1,B2,C1,C2}.json`: nguồn của 600 hội thoại viết riêng, mỗi bài bốn lượt nói. Các bài có trao đổi thông tin, hiểu nhầm, đề nghị, phản hồi tích cực, lựa chọn, hài hước và hàm ý. Không sao chép hội thoại của DailyDictation.
- `scripts/dialogue-content/catalog.json`: tiêu đề Việt/Anh và số bài ổn định; `scripts/dialogue-curriculum.mjs` chỉ đọc và kiểm tra nội dung viết sẵn, không ghép câu theo mẫu.
- `scripts/generate-dialogues.mjs`: kiểm tra đủ bài và độ đa dạng trước khi sinh IPA, rồi mới cập nhật sáu file runtime sau khi chuyển đổi thành công.
- `src/core/dialogue-data/{A1,A2,B1,B2,C1,C2}.json`: dữ liệu tĩnh được commit; runtime không gọi AI hay dịch vụ tạo IPA.
- IPA được sinh tự động bằng eSpeak NG, có thể khác giọng hệ thống và cần rà soát ngôn ngữ trước khi dùng làm tài liệu thi/giảng dạy chính thức. Thông tin này được hiển thị trong UI.
- Tài nguyên sức khỏe chỉ là tình huống ngôn ngữ về sinh hoạt/đặt lịch, không đưa lời khuyên y khoa.

Để tạo lại dữ liệu, dùng Node 24 và bản `@echogarden/espeak-ng-emscripten@0.3.5` đã tải vào thư mục công cụ ngoài runtime, rồi chạy:

```sh
node scripts/generate-dialogues.mjs /absolute/path/to/espeak-ng.js
```

Công cụ eSpeak chỉ chạy lúc tạo dữ liệu; không thêm dependency, WASM, model hay audio vào ứng dụng. Âm thanh hội thoại vẫn phát qua Web Speech API của hệ thống. Giấy phép công cụ eSpeak NG: GPL-3.0; không phân phối engine trong dữ liệu hoặc bundle ứng dụng.

## Kiểm tra tránh lặp nội dung

`scripts/dialogue-content-audit.mjs` kiểm tra toàn bộ sáu cấp:

- Chuẩn hóa hoa/thường, dấu câu, dấu nháy và chữ số để phát hiện hội thoại trùng.
- Chặn câu trùng từ 6 từ trở lên và cụm 8 từ xuất hiện ở nhiều bài. Lời chào/ngắn thông dụng có thể được dùng khi hợp ngữ cảnh.
- So sánh tập cụm 4 từ giữa từng cặp bài, chặn độ giống Jaccard từ 55% trở lên.
- Kiểm tra là hàng rào chống sao chép mẫu, không phải chứng nhận độ tự nhiên hay cấp CEFR.

Ở lần viết lại này, bộ cũ có 87 câu dài và 1.704 cụm 8 từ bị lặp; bộ mới có 0 ở cả hai chỉ số và không có cặp gần trùng theo ngưỡng trên.

```sh
node scripts/dialogue-content-audit.mjs
npm run test:dialogue-content
```

## Kiểm chứng

- Unit tests so nguồn viết sẵn với dữ liệu runtime, kiểm tra bộ phát hiện lặp bằng các mẫu lỗi cố ý, rồi đếm đủ 6 × 10 × 10, kiểm tra ID/nội dung hội thoại không trùng, metadata hai ngôn ngữ, 4 lượt nói/bài, IPA và độ dài vừa ô nhập.
- Kiểm tra chấm từ: hoa/thường, dấu câu, khoảng trắng, thiếu/thừa/sai và từ viết tắt.
- Browser tests đi qua 60 nhóm cấp/chủ đề, kiểm tra đủ 10 bài/nhóm và đầu/cuối danh sách; draft không lẫn khi đổi bài/cấp; chỉ tải chunk nội dung khi chọn cấp.
- Kiểm tra nghe/dừng, tốc độ, Enter, transcript, reset, Việt/Anh và responsive 320–1440px.
