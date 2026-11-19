# GChat Space Filter (Chrome extension)

Lọc mục **Home** của Google Chat theo danh sách space (dự án) — vẫn giữ chế độ xem theo thread của Home.
Chạy hoàn toàn trên trình duyệt, không gửi dữ liệu đi đâu, không cần token.

## Cài

1. Chrome → `chrome://extensions` → bật **Developer mode**.
2. **Load unpacked** → chọn folder chứa extension này (folder có `manifest.json`).
3. Mở lại tab Google Chat → ở header màn **Home** (cạnh nút *Thread*) có nút **Lọc space ▾**.
4. Bấm vào → tick chọn space muốn xem (có ô tìm, *(Chọn tất cả)*) → **OK**. Các dòng khác bị ẩn, giống filter Excel.
   **Xoá lọc** để hiện lại tất cả. Lựa chọn được nhớ cho lần sau.

Bảng lọc chia theo **nhóm ở sidebar trái** (AF, CTC - TV, Spaces… — đọc tự động). Tick cả nhóm → lưu theo nhóm,
space mới thêm vào nhóm đó sau này cũng tự hiện. Space chỉ thấy ở Home mà không thuộc nhóm nào → nhóm **Khác**.
Nhóm đang thu gọn ("Show all") chỉ đọc được phần đang hiện — bấm *Show all* 1 lần, extension tự nhớ.

DM / app không lọc, luôn hiện: nhận diện theo mục **Direct messages** ở sidebar; người không có ở đó thì đoán theo
preview (space có "Người gửi: …", DM thì không). Popup của extension: bật/tắt lọc, xoá danh sách đã nhớ.

Dùng được ở `chat.google.com` và Chat trong Gmail. Sửa code → bấm ↻ ở `chrome://extensions` rồi reload tab Chat.

## Cách hoạt động / giới hạn

- Google Chat không có class ổn định, nên script tìm tiêu đề **Home** nằm cạnh chữ **Unread**, lấy danh sách ngay
  dưới header đó, và dùng **dòng chữ đầu tiên** của mỗi dòng làm tên space. Sidebar không bị đụng tới.
- Google đổi giao diện → có thể phải chỉnh `findHeader()` / `findList()` trong `content.js`.
- Chỉ ẩn trên giao diện; số đếm unread / thông báo của Google không đổi.
