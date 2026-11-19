# GChat Space Filter

[English](#english) | [Tiếng Việt](#tiếng-việt)

<img src="icons/icon128.png" width="64" alt="icon">

---

## English

A Chrome extension that filters the **Home** view of Google Chat by the spaces (projects) you choose — while
keeping Home's thread view. Stop missing important messages buried under chats that don't matter to you right now.

### Features

- A **Lọc space ▾** (*Filter spaces*) button next to the *Thread* button on the Home header.
- Tick the spaces you want to see (with search and *(Chọn tất cả)* = select all) → **OK**. Everything else is hidden, like an
  Excel filter. **Xoá lọc** (*clear filter*) shows everything again. Your selection is remembered.
- Spaces are grouped by the **sections in your left sidebar** (read automatically). Tick a whole section and any
  space added to it later shows up too. Spaces seen on Home but not in any section go into **Khác** (*Other*).
- **Direct messages and apps are never filtered** — they always show.
- The UI is in Vietnamese; labels are translated in brackets above.
- Works on `chat.google.com` and Chat inside Gmail.

### Privacy

Runs entirely in your browser. No data is sent anywhere, no login or token needed. It only hides rows on screen;
it never reads or changes your messages on Google's side.

### Install

1. Download this repo: **Code → Download ZIP**, then unzip (or `git clone`).
2. Open `chrome://extensions` in Chrome and turn on **Developer mode** (top right).
3. Click **Load unpacked** and select the folder containing `manifest.json`.
4. Reload your Google Chat tab — the **Lọc space ▾** button appears on the Home header.

To update: pull / download the new version, click ↻ on the extension in `chrome://extensions`, then reload Chat.

### Notes & limitations

- A collapsed sidebar section ("Show all") only exposes its visible items — click *Show all* once and the
  extension remembers the rest.
- Unread counts and notifications from Google are **not** affected; this is a view filter only.
  (Unlike unfollowing / muting a space, you don't lose notifications and can switch projects in one click.)
- Google Chat has no stable CSS classes. The script locates the **Home** header next to **Unread**, takes the list
  below it and uses the first line of each row as the space name. If Google changes its UI, `findHeader()` /
  `findList()` in `content.js` may need adjusting.
- The extension popup lets you turn filtering on/off and clear the remembered spaces and sections.

---

## Tiếng Việt

Extension Chrome lọc màn **Home** của Google Chat theo các space (dự án) bạn chọn — vẫn giữ chế độ xem theo
thread. Không còn miss tin nhắn quan trọng vì bị chìm giữa những nhóm chat chưa cần quan tâm lúc này.

### Tính năng

- Nút **Lọc space ▾** cạnh nút *Thread* trên header màn Home.
- Tick chọn space muốn xem (có ô tìm, *(Chọn tất cả)*) → **OK**. Các dòng khác bị ẩn, giống filter Excel.
  **Xoá lọc** để hiện lại tất cả. Lựa chọn được nhớ cho lần sau.
- Space được chia theo **nhóm ở sidebar trái** (đọc tự động). Tick cả nhóm → space mới thêm vào nhóm đó sau này
  cũng tự hiện. Space chỉ thấy ở Home mà không thuộc nhóm nào → nhóm **Khác**.
- **DM / app không bao giờ bị lọc**, luôn hiện.
- Dùng được ở `chat.google.com` và Chat trong Gmail.

### Quyền riêng tư

Chạy hoàn toàn trên trình duyệt, không gửi dữ liệu đi đâu, không cần đăng nhập hay token. Chỉ ẩn dòng trên màn
hình, không đọc hay sửa tin nhắn phía Google.

### Cài đặt

1. Tải repo này: **Code → Download ZIP** rồi giải nén (hoặc `git clone`).
2. Mở `chrome://extensions` trong Chrome, bật **Developer mode** (góc trên bên phải).
3. Bấm **Load unpacked**, chọn folder có file `manifest.json`.
4. Reload tab Google Chat → nút **Lọc space ▾** xuất hiện trên header màn Home.

Cập nhật: tải / pull bản mới, bấm ↻ ở extension trong `chrome://extensions`, rồi reload tab Chat.

### Lưu ý & giới hạn

- Nhóm ở sidebar đang thu gọn ("Show all") chỉ đọc được phần đang hiện — bấm *Show all* 1 lần, extension tự nhớ.
- Số unread và thông báo của Google **không** đổi; extension chỉ lọc hiển thị.
  (Khác với unfollow / tắt thông báo space: không mất thông báo, đổi dự án cần xem chỉ trong 1 click.)
- Google Chat không có class CSS ổn định. Script tìm tiêu đề **Home** nằm cạnh chữ **Unread**, lấy danh sách ngay
  dưới đó và dùng dòng chữ đầu tiên của mỗi dòng làm tên space. Google đổi giao diện → có thể phải chỉnh
  `findHeader()` / `findList()` trong `content.js`.
- Popup của extension: bật/tắt lọc, xoá danh sách space + nhóm đã nhớ.
