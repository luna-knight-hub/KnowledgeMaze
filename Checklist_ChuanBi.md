# ✅ Checklist Chuẩn bị — Mê cung Tri thức
> *Hoàn thành danh sách này trước buổi học để đảm bảo mọi thứ chạy mượt mà.*

---

## ⚡ Trước buổi học (Giáo viên)

### 🖥️ Máy tính giáo viên
- [ ] **Server điểm số:** Chạy `KhoiDong_Server.bat` (hoặc `python server.py`) — giữ cửa sổ mở
- [ ] **Ma trận đã chuẩn bị:** Mở `editor.html` → Tab "Thư viện" → Kiểm tra ma trận đúng lớp học hôm nay
- [ ] **Câu hỏi đã đủ:** Mỗi milestone trong ma trận đều có nội dung câu hỏi
- [ ] **Thời gian thi:** Cổng thi đang mở (cài trong Tab "Cài đặt" của Editor)

### 🌐 Kết nối & Chia sẻ
- [ ] **Chọn phương thức chia sẻ:**
  - `[ ]` File local → Học sinh mở `index.html` trực tiếp
  - `[ ]` Mạng LAN → Học sinh vào `http://<IP-giáo-viên>:5000`
  - `[ ]` Mã QR → In / chiếu QR lên bảng
- [ ] **Kiểm tra kết nối:** Thử mở trang trò chơi trên 1 máy học sinh trước

### 🔊 Thiết bị học sinh
- [ ] **Trình duyệt:** Chrome hoặc Edge (mới nhất)
- [ ] **Bàn phím:** Phím mũi tên hoặc WASD hoạt động
- [ ] **Tai nghe / Loa:** Nếu có câu hỏi dạng **Âm thanh** (audio)

---

## 🎮 Trong buổi học

- [ ] **Màn chiếu:** Mở `leaderboard.html` để học sinh thấy bảng xếp hạng cập nhật thời gian thực
- [ ] **Nhắc học sinh:** Nhập đúng **Họ và Tên** + **chọn đúng Lớp** để dễ vinh danh cuối buổi
- [ ] **Theo dõi:** Học sinh đang chơi đúng ma trận của lớp mình

---

## 🏆 Cuối buổi học

- [ ] **Xướng tên:** Top 3 từ bảng xếp hạng (`leaderboard.html`)
- [ ] **Trao thưởng:** Phần quà / huy hiệu số chuẩn bị sẵn
- [ ] **Reset điểm** (nếu cần cho lượt sau):
  ```
  http://localhost:5000/api/admin/reset?secret=TEACHER_RESET_2026
  ```
- [ ] **Tắt server:** Đóng cửa sổ `server.py` sau khi xong

---

## 🆘 Khắc phục nhanh

| Vấn đề | Xử lý ngay |
|--------|-----------|
| Bảng xếp hạng không cập nhật | Chạy lại `python server.py` |
| Học sinh không vào được | Kiểm tra đã hết lượt chưa (3 lượt/ngày) |
| Thư viện ma trận trống | Vào Editor → Tab Thư viện → Lưu ma trận |
| Game bị đơ khi trả lời câu hỏi | Reload trang (F5) và chọn lại ma trận |

---

*🚀 Antigravity Mindset: Chuẩn bị kỹ 20% → Tạo ra 80% trải nghiệm đáng nhớ!*
