# 📘 Hướng dẫn Giáo viên — Mê cung Tri thức
> *Phiên bản 2.0 — Hệ thống Đa Ma trận | Cập nhật: 24/02/2026*

---

## 🗺️ Tổng quan hệ thống

```
[Giáo viên]                          [Học sinh]
    │                                     │
    ├─ Mở editor.html                     ├─ Mở index.html
    ├─ Thiết kế mê cung + câu hỏi         ├─ Chọn Ma trận (theo lớp)
    ├─ Lưu vào Thư viện (Library)         ├─ Nhập tên
    │                                     ├─ Chơi & giải đố
    └─ Mở server.py (ghi điểm)            └─ Xem kết quả + bảng xếp hạng
```

---

## 🚀 Khởi động lần đầu (Chỉ cần làm 1 lần)

### Bước 1 — Khởi động server điểm số

```bat
KhoiDong_Server.bat   (double-click để chạy)
```
Hoặc mở CMD / PowerShell và chạy:
```bash
python server.py
```
> ✅ Server chạy tại `http://localhost:5000` — **Giữ cửa sổ này mở** trong suốt buổi học.  
> ⚠️ Nếu không chạy server, điểm vẫn lưu vào bộ nhớ cục bộ (localStorage) nhưng không chia sẻ giữa các máy.

### Bước 2 — Mở trò chơi cho học sinh

- **Dùng file local:** Mở `index.html` bằng Chrome / Edge / Firefox.
- **Dùng mạng LAN:** Học sinh truy cập `http://<IP-máy-giáo-viên>:5000` (server.py phục vụ cả file tĩnh).
- **Dùng mã QR:** Tạo QR từ địa chỉ IP LAN và chiếu lên bảng / in ra giấy.

---

## 🗺️ Tạo & quản lý Ma trận (editor.html)

### Mở Map Editor

```
Mở file: editor.html
Hoặc click "🗺 Teacher Map Editor" trên trang chủ (index.html)
```

### Sơ đồ các tab trong Editor

| Tab | Chức năng |
|-----|-----------|
| **🗺 Mê cung** | Vẽ tường / đường đi bằng cách click ô |
| **📍 Milestones** | Đặt vị trí câu hỏi trên bản đồ |
| **❓ Câu hỏi** | Soạn nội dung từng câu (5 dạng) |
| **⚙️ Cài đặt** | Tên mê cung, giới hạn lượt, thời gian thi |
| **📚 Thư viện** | Lưu / tải / xoá ma trận đã tạo |

### Quy trình tạo 1 Ma trận mới

```
1. Tab "Mê cung"     → Vẽ bản đồ (click ô = đặt tường/đường)
2. Tab "Milestones"  → Click ô trống trên bản đồ = đặt cột mốc câu hỏi
3. Tab "Câu hỏi"     → Chọn từng milestone → soạn câu hỏi → chọn dạng
4. Tab "Cài đặt"     → Đặt tên, khối lớp, giới hạn lượt chơi/ngày
5. Tab "Thư viện"    → Nhấn "💾 Lưu vào Thư viện"
                        Điền: Tên · Mô tả · Lớp (3/4/5) · Độ khó · Icon
6. Nhấn "Lưu"        → Ma trận xuất hiện trong danh sách Thư viện
```

### 5 dạng câu hỏi được hỗ trợ

| Dạng | Ký hiệu | Mô tả |
|------|---------|-------|
| **Trắc nghiệm** | `mcq` | 4 đáp án, chọn 1 đúng |
| **Điền từ** | `fill` | Học sinh gõ câu trả lời (hỗ trợ nhiều đáp án đúng) |
| **Nối cặp** | `matching` | Kéo nối 2 cột (cột phải được xáo trộn ngẫu nhiên) |
| **Hình ảnh** | `image` | Có ảnh minh hoạ + 4 đáp án |
| **Âm thanh** | `audio` | Có file âm thanh + 4 đáp án |

> 💡 **Mẹo:** Dạng **Điền từ** hỗ trợ nhiều đáp án đúng — ví dụ `["Memory", "memory", "MEMORY"]` cho phép học sinh gõ không phân biệt hoa/thường.

---

## 🎮 Trải nghiệm học sinh (index.html)

### Luồng chơi

```
[Trang chủ]
    ↓ Nhấn "⚡ Bắt đầu hành trình"
[Chọn Ma trận]
    → Lọc theo Lớp: Tất cả / Lớp 3 / Lớp 4 / Lớp 5
    → Click vào thẻ Ma trận → "Chọn Ma trận này"
    ↓
[Nhập tên]
    → Gõ họ tên → Nhấn "🚀 Vào Mê cung!"
    ↓
[Chơi Game]
    → Di chuyển: Phím mũi tên / WASD / D-pad (mobile)
    → Chạm vào cột mốc (★) → Popup câu hỏi xuất hiện
    → Trả lời đúng/sai/hết giờ → Di chuyển tiếp
    → Nút "× Thoát" (HUD) → xác nhận rồi quay về Chọn Ma trận
    ↓
[Hoàn thành — Overlay kết quả]
    → Xem: Điểm tổng · Số câu đúng · Xếp hạng
    → Xem bảng kết quả từng câu (✅ / ❌ / ⏰)
    → Xem Top 5 hôm nay
    → Chọn: "🧩 Đổi ma trận" / "🔄 Chơi lại" / "📊 Bảng đầy đủ"
```

### Giới hạn lượt chơi

- Mặc định: **3 lượt/ngày/IP** (cài trong Tab Cài đặt của Editor).
- Sau khi hết lượt, học sinh thấy thông báo và không thể vào game.
- Giáo viên có thể reset bằng API:
  ```
  http://localhost:5000/api/admin/reset?secret=TEACHER_RESET_2026
  ```

---

## 📊 Bảng xếp hạng

### Xem bảng xếp hạng

- Mở `leaderboard.html` (từ trang chủ hoặc gõ trực tiếp).
- Lọc theo: **Hôm nay / Tuần / Tháng / Tất cả**.
- Hiển thị: Hạng · Tên · Lớp · Điểm cao nhất · Số lượt chơi.

### API cho giáo viên

| Endpoint | Mô tả |
|----------|-------|
| `GET /api/leaderboard?period=today&limit=10` | Top 10 hôm nay |
| `GET /api/can-play?ip=<ip>` | Kiểm tra lượt còn lại |
| `GET /api/admin/reset?secret=TEACHER_RESET_2026` | Xoá kết quả hôm nay |

---

## 📁 Cấu trúc thư mục

```
KnowledgeMaze/
├── index.html          ← Trang chơi của học sinh
├── editor.html         ← Công cụ tạo ma trận (chỉ dành cho giáo viên)
├── leaderboard.html    ← Bảng xếp hạng
├── config.js           ← Cấu hình ma trận mặc định (được tạo bởi Editor)
├── server.py           ← Backend ghi điểm (Python 3.8+)
├── KhoiDong_Server.bat ← Khởi động server nhanh (double-click)
├── km_data.db          ← Cơ sở dữ liệu SQLite (tự tạo)
├── style.css           ← Giao diện
├── HuongDan_GiaoVien.md← Tài liệu này
├── Checklist_ChuanBi.md← Danh sách kiểm tra trước buổi học
└── src/
    ├── engine/         ← MazeEngine, QuestionEngine
    ├── ui/             ← ScreenFlow, SessionManager, MazeLibrary, Leaderboard
    ├── model.js / view.js / controller.js
```

> ⚠️ **Không xoá `km_data.db`** — đây là toàn bộ kết quả điểm số đã lưu.

---

## 🆘 Xử lý sự cố thường gặp

| Vấn đề | Nguyên nhân | Cách xử lý |
|--------|-------------|------------|
| Bảng xếp hạng trống | Server chưa chạy | Chạy `python server.py` |
| Học sinh không vào được game | Hết lượt chơi hôm nay | Dùng link reset hoặc chờ hôm sau |
| Câu hỏi không xuất hiện | Milestone chưa có câu hỏi | Vào Editor → Tab Câu hỏi → soạn nội dung |
| Thư viện ma trận trống | Chưa lưu vào Library | Editor → Tab Thư viện → Lưu vào Thư viện |
| Game không nhận di chuyển | Quiz overlay đang mở | Trả lời hoặc chờ hết giờ câu hỏi |

---

## 💡 Mẹo vận hành lớp học

**Trước buổi học (5 phút):**
1. Chạy `KhoiDong_Server.bat`
2. Mở `editor.html` → xem lại ma trận đã chuẩn bị
3. Chiếu `index.html` lên màn hình / gửi link QR cho học sinh

**Trong buổi học:**
- Học sinh tự chơi theo nhóm hoặc cá nhân
- Giáo viên theo dõi `leaderboard.html` trên màn chiếu
- Sau mỗi câu hỏi, có thể dừng lại giải thích đáp án

**Cuối buổi:**
- Xướng tên Top 3 từ bảng xếp hạng
- Trao phần thưởng / huy hiệu số
- Nếu cần reset điểm: `http://localhost:5000/api/admin/reset?secret=TEACHER_RESET_2026`

---

*🚀 Antigravity Mindset: Chuẩn bị 20% — Tạo ra 80% trải nghiệm đáng nhớ cho học sinh.*
