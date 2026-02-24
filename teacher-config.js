/**
 * ╔══════════════════════════════════════════════════════╗
 * ║          CẤU HÌNH GIÁO VIÊN — teacher-config.js     ║
 * ╠══════════════════════════════════════════════════════╣
 * ║  Đây là file duy nhất bạn cần chỉnh để:             ║
 * ║    • Đổi mật khẩu vào Map Editor                    ║
 * ║    • Đổi tên hiển thị của giáo viên                 ║
 * ╚══════════════════════════════════════════════════════╝
 *
 * CÁCH ĐỔI MẬT KHẨU:
 *   1. Mở file này bằng Notepad / VS Code
 *   2. Sửa dòng EDITOR_PASSWORD bên dưới
 *   3. Lưu lại (Ctrl+S) — KHÔNG cần khởi động lại bất cứ thứ gì
 *
 * ⚠ LƯU Ý BẢO MẬT:
 *   Đây là mật khẩu phía client (client-side), phù hợp để ngăn
 *   học sinh vô tình vào trang editor. Không dùng cho dữ liệu
 *   nhạy cảm quan trọng.
 */

window.TEACHER_CONFIG = {

    // ── MẬT KHẨU VÀO MAP EDITOR ─────────────────────────
    // Đổi chuỗi bên dưới thành mật khẩu bạn muốn
    EDITOR_PASSWORD: 'q12345',

    // ── THÔNG TIN GIÁO VIÊN (hiển thị ở màn hình login) ─
    TEACHER_NAME: 'Giáo viên',
    SCHOOL_NAME: 'Trường Tiểu học',

};
