// config.js — Thư viện 9 Ma trận mẫu
// Kiến thức Tin học lớp 3, 4, 5 — Bộ sách Chân Trời Sáng Tạo
// Cập nhật: 02/03/2026
//
// Cấu trúc:
//   window.GAME_CONFIGS  — mảng 9 ma trận (10×10)
//   window.GAME_CONFIG   — ma trận mặc định (ma trận đầu tiên)
//
// Mỗi khối lớp (3, 4, 5) có 3 mức độ:
//   Dễ:  100 điểm / 30 giây
//   TB:  150 điểm / 25 giây
//   Khó: 200 điểm / 20 giây
//
// Mỗi ma trận có 5 câu hỏi (mcq, image, audio, matching, fill)

window.GAME_CONFIG = [

  // ═══════════════════════════════════════════════════════════════
  //  LỚP 3 — DỄ: Làm quen với máy tính
  // ═══════════════════════════════════════════════════════════════
  {
    "settings": {
      "title": "Lớp 3 - Dễ: Làm quen với máy tính",
      "play_limit_per_day": 3,
      "competition_window": { "start": "2026-01-01T00:00:00", "end": "2099-12-31T23:59:59" }
    },
    "start": { "x": 1, "y": 1 },
    "end": { "x": 8, "y": 8 },
    "maze": [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 0, 1, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 0, 1, 0, 0, 0, 1, 0, 1],
      [1, 1, 0, 1, 1, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 1, 1, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ],
    "milestones": [
      { "x": 2, "y": 1, "type": "mcq", "question": "Thiết bị nào dùng để điều khiển con trỏ trên màn hình?", "options": ["Bàn phím", "Chuột", "Loa", "Máy in"], "correct": 1, "points": 100, "time": 30 },
      { "x": 4, "y": 3, "type": "image", "question": "Đây là thiết bị gì?", "image": "assets/images/g3_monitor.png", "options": ["Màn hình", "Thân máy", "Chuột", "Bàn phím"], "correct": 0, "points": 100, "time": 30 },
      { "x": 1, "y": 5, "type": "audio", "question": "Nghe và cho biết đây là âm thanh của thiết bị nào?", "audio": "assets/audio/g3_keyboard.wav", "options": ["Tiếng gõ phím", "Tiếng chuột click", "Tiếng loa", "Tiếng quạt thân máy"], "correct": 0, "points": 100, "time": 30 },
      { "x": 6, "y": 7, "type": "matching", "question": "Nối các thiết bị với chức năng tương ứng:", "pairs": [{ "left": "Loa", "right": "Phát âm thanh" }, { "left": "Bàn phím", "right": "Gõ chữ và số" }, { "left": "Màn hình", "right": "Hiển thị hình ảnh" }], "points": 100, "time": 30 },
      { "x": 8, "y": 7, "type": "fill", "question": "Thiết bị dùng để lưu trữ dữ liệu phổ biến hiện nay là ổ ___?", "correct_answers": ["cứng", "Cứng", "hdd", "ssd"], "points": 100, "time": 30 }
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  LỚP 3 — TRUNG BÌNH: Sử dụng bàn phím và chuột
  // ═══════════════════════════════════════════════════════════════
  {
    "settings": {
      "title": "Lớp 3 - TB: Sử dụng bàn phím và chuột",
      "play_limit_per_day": 3,
      "competition_window": { "start": "2026-01-01T00:00:00", "end": "2099-12-31T23:59:59" }
    },
    "start": { "x": 1, "y": 8 },
    "end": { "x": 8, "y": 1 },
    "maze": [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 1, 0, 0, 0, 0, 0, 1],
      [1, 1, 0, 1, 0, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 1, 0, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 1, 1, 0, 1, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ],
    "milestones": [
      { "x": 3, "y": 7, "type": "mcq", "question": "Phím dài nhất trên bàn phím là phím?", "options": ["Enter", "Shift", "Space (Cách)", "Ctrl"], "correct": 2, "points": 150, "time": 25 },
      { "x": 1, "y": 5, "type": "image", "question": "Ngón tay nào được dùng để nhấn phím Space?", "image": "assets/images/g3_typing.png", "options": ["Ngón trỏ", "Ngón giữa", "Ngón cái", "Ngón út"], "correct": 2, "points": 150, "time": 25 },
      { "x": 2, "y": 3, "type": "audio", "question": "Nghe và đoán thao tác chuột:", "audio": "assets/audio/g3_double_click.wav", "options": ["Nháy chuột", "Nháy đúp chuột", "Kéo thả chuột", "Nháy chuột phải"], "correct": 1, "points": 150, "time": 25 },
      { "x": 6, "y": 5, "type": "matching", "question": "Nối phím với chức năng:", "pairs": [{ "left": "Shift", "right": "Gõ chữ hoa" }, { "left": "Enter", "right": "Xuống dòng" }, { "left": "Backspace", "right": "Xóa ký tự bên trái" }], "points": 150, "time": 25 },
      { "x": 6, "y": 3, "type": "fill", "question": "Khi gõ phím, hai ngón trỏ đặt lên phím F và phím ___ (có gờ nổi)?", "correct_answers": ["J", "j"], "points": 150, "time": 25 }
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  LỚP 3 — KHÓ: Vẽ hình với Paint
  // ═══════════════════════════════════════════════════════════════
  {
    "settings": {
      "title": "Lớp 3 - Khó: Vẽ hình với Paint",
      "play_limit_per_day": 3,
      "competition_window": { "start": "2026-01-01T00:00:00", "end": "2099-12-31T23:59:59" }
    },
    "start": { "x": 1, "y": 1 },
    "end": { "x": 8, "y": 1 },
    "maze": [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 1, 1, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 1, 1, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ],
    "milestones": [
      { "x": 4, "y": 1, "type": "mcq", "question": "Công cụ nào dùng để tô màu vùng kín?", "options": ["Bút vẽ", "Bình màu", "Tẩy", "Cọ vẽ"], "correct": 1, "points": 200, "time": 20 },
      { "x": 1, "y": 4, "type": "image", "question": "Biểu tượng này dùng để làm gì?", "image": "assets/images/paint_save.png", "options": ["Mở file", "Lưu file", "In file", "Thoát"], "correct": 1, "points": 200, "time": 20 },
      { "x": 3, "y": 6, "type": "audio", "question": "Âm thanh của thao tác nào trong Paint?", "audio": "assets/audio/paint_spray.wav", "options": ["Tô màu", "Xóa hình", "Vẽ bình xịt", "Vẽ đường thẳng"], "correct": 2, "points": 200, "time": 20 },
      { "x": 4, "y": 8, "type": "matching", "question": "Nối phím tắt với chức năng:", "pairs": [{ "left": "Ctrl + S", "right": "Lưu hình" }, { "left": "Ctrl + N", "right": "Mở trang mới" }, { "left": "Ctrl + Z", "right": "Hoàn tác (Quay lại)" }], "points": 200, "time": 20 },
      { "x": 8, "y": 4, "type": "fill", "question": "Để vẽ hình vuông hoàn hảo trong Paint, em nhấn giữ phím ___ khi kéo chuột?", "correct_answers": ["Shift", "shift"], "points": 200, "time": 20 }
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  LỚP 4 — DỄ: Phần cứng và Phần mềm
  // ═══════════════════════════════════════════════════════════════
  {
    "settings": {
      "title": "Lớp 4 - Dễ: Phần cứng và Phần mềm",
      "play_limit_per_day": 3,
      "competition_window": { "start": "2026-01-01T00:00:00", "end": "2099-12-31T23:59:59" }
    },
    "start": { "x": 1, "y": 1 },
    "end": { "x": 8, "y": 8 },
    "maze": [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 1, 0, 0, 1],
      [1, 0, 1, 1, 1, 0, 1, 0, 1, 1],
      [1, 0, 1, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 0, 1, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 1, 1, 1, 1, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 1, 1, 1, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 0, 1]
    ],
    "milestones": [
      { "x": 3, "y": 1, "type": "mcq", "question": "Thiết bị nào là phần cứng?", "options": ["Windows 10", "Bàn phím", "Paint", "Scratch"], "correct": 1, "points": 100, "time": 30 },
      { "x": 5, "y": 3, "type": "image", "question": "Đây là biểu tượng của hệ điều hành nào?", "image": "assets/images/logo_windows.png", "options": ["MacOS", "Linux", "Windows", "Android"], "correct": 2, "points": 100, "time": 30 },
      { "x": 8, "y": 3, "type": "audio", "question": "Âm thanh khởi động của hệ điều hành nào?", "audio": "assets/audio/win_start.wav", "options": ["Windows", "MacOS", "Linux", "ChromeOS"], "correct": 0, "points": 100, "time": 30 },
      { "x": 6, "y": 5, "type": "matching", "question": "Phân loại thiết bị:", "pairs": [{ "left": "Máy in", "right": "Phần cứng" }, { "left": "Youtube", "right": "Phần mềm/Web" }, { "left": "Micro", "right": "Phần cứng" }], "points": 100, "time": 30 },
      { "x": 1, "y": 7, "type": "fill", "question": "Người ta gọi các chương trình chạy trong máy tính là phần ___?", "correct_answers": ["mềm", "Mềm", "software"], "points": 100, "time": 30 }
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  LỚP 4 — TRUNG BÌNH: Tìm kiếm trên Internet
  // ═══════════════════════════════════════════════════════════════
  {
    "settings": {
      "title": "Lớp 4 - TB: Tìm kiếm trên Internet",
      "play_limit_per_day": 3,
      "competition_window": { "start": "2026-01-01T00:00:00", "end": "2099-12-31T23:59:59" }
    },
    "start": { "x": 1, "y": 1 },
    "end": { "x": 1, "y": 8 },
    "maze": [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 1, 0, 0, 1],
      [1, 0, 1, 1, 1, 1, 1, 0, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 1, 1, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 1, 1, 1, 1, 1]
    ],
    "milestones": [
      { "x": 1, "y": 3, "type": "mcq", "question": "Trang web nào là công cụ tìm kiếm phổ biến nhất?", "options": ["Facebook", "Google", "Shopee", "Youtube"], "correct": 1, "points": 150, "time": 25 },
      { "x": 3, "y": 3, "type": "image", "question": "Đây là trình duyệt web nào?", "image": "assets/images/logo_chrome.png", "options": ["Firefox", "Chrome", "Edge", "Safari"], "correct": 1, "points": 150, "time": 25 },
      { "x": 7, "y": 5, "type": "audio", "question": "Nghe và nhận diện thông báo tin nhắn từ ứng dụng nào?", "audio": "assets/audio/messenger_ping.wav", "options": ["Zalo", "Messenger", "Gmail", "Viber"], "correct": 1, "points": 150, "time": 25 },
      { "x": 7, "y": 1, "type": "matching", "question": "Nối trang web với mục đích:", "pairs": [{ "left": "Google.com", "right": "Tìm kiếm" }, { "left": "Tiki.vn", "right": "Mua sắm" }, { "left": "VnExpress.net", "right": "Đọc tin tức" }], "points": 150, "time": 25 },
      { "x": 5, "y": 8, "type": "fill", "question": "Mạng máy tính toàn cầu được gọi là ___?", "correct_answers": ["Internet", "internet", "mạng toàn cầu"], "points": 150, "time": 25 }
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  LỚP 4 — KHÓ: Soạn thảo văn bản nâng cao
  // ═══════════════════════════════════════════════════════════════
  {
    "settings": {
      "title": "Lớp 4 - Khó: Soạn thảo văn bản nâng cao",
      "play_limit_per_day": 3,
      "competition_window": { "start": "2026-01-01T00:00:00", "end": "2099-12-31T23:59:59" }
    },
    "start": { "x": 1, "y": 8 },
    "end": { "x": 8, "y": 4 },
    "maze": [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 1, 1, 1, 0, 1],
      [1, 0, 1, 0, 0, 1, 0, 0, 0, 1],
      [1, 0, 1, 0, 1, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 1, 1, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 1, 1, 1, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ],
    "milestones": [
      { "x": 4, "y": 7, "type": "mcq", "question": "Để chèn bảng vào Word, em vào tab nào?", "options": ["Home", "Insert", "Design", "Layout"], "correct": 1, "points": 200, "time": 20 },
      { "x": 1, "y": 5, "type": "image", "question": "Nút này dùng để làm gì trong Word?", "image": "assets/images/word_bold.png", "options": ["In nghiêng", "In đậm", "Gạch chân", "Đổi màu chữ"], "correct": 1, "points": 200, "time": 20 },
      { "x": 4, "y": 1, "type": "audio", "question": "Âm thanh khi in tài liệu?", "audio": "assets/audio/printer_noise.wav", "options": ["In ấn", "Scan", "Photo", "Fax"], "correct": 0, "points": 200, "time": 20 },
      { "x": 8, "y": 1, "type": "matching", "question": "Nối phím tắt:", "pairs": [{ "left": "Ctrl + C", "right": "Sao chép" }, { "left": "Ctrl + V", "right": "Dán" }, { "left": "Ctrl + X", "right": "Cắt" }], "points": 200, "time": 20 },
      { "x": 4, "y": 3, "type": "fill", "question": "Font chữ phổ biến nhất trong văn bản hành chính Việt Nam là Times New ___?", "correct_answers": ["Roman", "roman"], "points": 200, "time": 20 }
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  LỚP 5 — DỄ: Giải quyết vấn đề với Scratch
  // ═══════════════════════════════════════════════════════════════
  {
    "settings": {
      "title": "Lớp 5 - Dễ: Giải quyết vấn đề với Scratch",
      "play_limit_per_day": 3,
      "competition_window": { "start": "2026-01-01T00:00:00", "end": "2099-12-31T23:59:59" }
    },
    "start": { "x": 1, "y": 1 },
    "end": { "x": 8, "y": 8 },
    "maze": [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 0, 1, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 0, 1, 0, 0, 0, 1, 0, 1],
      [1, 1, 0, 1, 1, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 1, 1, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ],
    "milestones": [
      { "x": 3, "y": 3, "type": "mcq", "question": "Trong Scratch, nhân vật được gọi là?", "options": ["Sprite", "Object", "Actor", "Character"], "correct": 0, "points": 100, "time": 30 },
      { "x": 5, "y": 1, "type": "image", "question": "Khối lệnh này dùng để làm gì?", "image": "assets/images/scratch_move.png", "options": ["Quay nhân vật", "Di chuyển", "Thay đổi trang phục", "Phát âm thanh"], "correct": 1, "points": 100, "time": 30 },
      { "x": 1, "y": 7, "type": "audio", "question": "Âm thanh mặc định của chú mèo Scratch là?", "audio": "assets/audio/scratch_meow.wav", "options": ["Gâu gâu", "Chíp chíp", "Meo meo", "Ùm bò"], "correct": 2, "points": 100, "time": 30 },
      { "x": 6, "y": 5, "type": "matching", "question": "Nối nhóm lệnh với chức năng:", "pairs": [{ "left": "Motion", "right": "Chuyển động" }, { "left": "Looks", "right": "Hiển thị" }, { "left": "Sound", "right": "Âm thanh" }], "points": 100, "time": 30 },
      { "x": 8, "y": 7, "type": "fill", "question": "Lệnh để bắt đầu chương trình khi nhấn vào biểu tượng là \"When ___ clicked\"?", "correct_answers": ["green flag", "lá cờ xanh", "flag"], "points": 100, "time": 30 }
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  LỚP 5 — TRUNG BÌNH: Cấu trúc điều khiển
  // ═══════════════════════════════════════════════════════════════
  {
    "settings": {
      "title": "Lớp 5 - TB: Cấu trúc điều khiển",
      "play_limit_per_day": 3,
      "competition_window": { "start": "2026-01-01T00:00:00", "end": "2099-12-31T23:59:59" }
    },
    "start": { "x": 1, "y": 1 },
    "end": { "x": 5, "y": 7 },
    "maze": [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 1, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 0, 1, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 0, 1, 1, 0, 1, 0, 1, 1, 1],
      [1, 0, 0, 1, 0, 0, 0, 0, 0, 1],
      [1, 1, 0, 1, 1, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ],
    "milestones": [
      { "x": 3, "y": 3, "type": "mcq", "question": "Vòng lặp \"Forever\" chạy bao nhiêu lần?", "options": ["10 lần", "100 lần", "Mãi mãi", "Chỉ 1 lần"], "correct": 2, "points": 150, "time": 25 },
      { "x": 7, "y": 1, "type": "image", "question": "Khối lệnh \"If...then\" thuộc nhóm lệnh nào?", "image": "assets/images/scratch_control.png", "options": ["Events", "Control", "Sensing", "Operators"], "correct": 1, "points": 150, "time": 25 },
      { "x": 6, "y": 3, "type": "audio", "question": "Đây là âm thanh khi nhân vật chạm vào chướng ngại vật (Boing)?", "audio": "assets/audio/scratch_boing.wav", "options": ["Chạm tường", "Nhảy lên", "Biến mất", "Xuất hiện"], "correct": 1, "points": 150, "time": 25 },
      { "x": 1, "y": 5, "type": "matching", "question": "Nối điều kiện với khối lệnh:", "pairs": [{ "left": "Nhấn phím Space", "right": "Sensing" }, { "left": "2 > 1", "right": "Operators" }, { "left": "Lặp 10 lần", "right": "Control" }], "points": 150, "time": 25 },
      { "x": 8, "y": 7, "type": "fill", "question": "Để nhân vật nói gì đó trong 2 giây, ta dùng khối lệnh \"___ for 2 seconds\"?", "correct_answers": ["say", "Say"], "points": 150, "time": 25 }
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  LỚP 5 — KHÓ: Lập trình trò chơi đơn giản
  // ═══════════════════════════════════════════════════════════════
  {
    "settings": {
      "title": "Lớp 5 - Khó: Lập trình trò chơi đơn giản",
      "play_limit_per_day": 3,
      "competition_window": { "start": "2026-01-01T00:00:00", "end": "2099-12-31T23:59:59" }
    },
    "start": { "x": 1, "y": 1 },
    "end": { "x": 8, "y": 1 },
    "maze": [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 1, 1, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 1, 1, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ],
    "milestones": [
      { "x": 4, "y": 1, "type": "mcq", "question": "Để lưu trữ điểm số trong game Scratch, em cần tạo một?", "options": ["Hàm", "Biến (Variable)", "Trang phục", "Sân khấu"], "correct": 1, "points": 200, "time": 20 },
      { "x": 8, "y": 4, "type": "image", "question": "Khối lệnh này dùng để làm gì?", "image": "assets/images/scratch_broadcast.png", "options": ["Thay đổi kích thước", "Phát tin nhắn (Broadcast)", "Ẩn nhân vật", "Vẽ hình"], "correct": 1, "points": 200, "time": 20 },
      { "x": 4, "y": 8, "type": "audio", "question": "Âm thanh thắng cuộc thường dùng trong game?", "audio": "assets/audio/game_win.wav", "options": ["Thắng", "Thua", "Cảnh báo", "Nhạc nền"], "correct": 0, "points": 200, "time": 20 },
      { "x": 1, "y": 4, "type": "matching", "question": "Nối khái niệm:", "pairs": [{ "left": "Backdrop", "right": "Phông nền" }, { "left": "Costume", "right": "Trang phục" }, { "left": "Script", "right": "Kịch bản lệnh" }], "points": 200, "time": 20 },
      { "x": 3, "y": 6, "type": "fill", "question": "Trong tọa độ Scratch, tâm của sân khấu có tọa độ x = 0, y = ___?", "correct_answers": ["0"], "points": 200, "time": 20 }
    ]
  }

];

// ── Mặc định: dùng ma trận đầu tiên ──────────────────────────────
//window.GAME_CONFIG = window.GAME_CONFIGS[0];
