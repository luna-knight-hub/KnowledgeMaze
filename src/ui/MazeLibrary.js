/**
 * MAZE LIBRARY — src/ui/MazeLibrary.js
 *
 * Thư viện Ma trận nhiều cấp độ.
 * Lưu trữ qua localStorage, key: "km_maze_library"
 *
 * Schema một mục:
 * {
 *   id:          string,        // "maze_<timestamp>"
 *   title:       string,        // "Tin học Lớp 3 - Chủ đề Phần cứng"
 *   description: string,        // mô tả ngắn
 *   grade:       3 | 4 | 5,    // khối lớp
 *   icon:        string,        // emoji đại diện
 *   difficulty:  1 | 2 | 3,    // độ khó (1 dễ, 3 khó)
 *   createdAt:   string (ISO),
 *   updatedAt:   string (ISO),
 *   playCount:   number,
 *   config:      GAME_CONFIG    // snapshot đầy đủ
 * }
 */
class MazeLibrary {
    static STORAGE_KEY = 'km_maze_library';

    // ─── Read ─────────────────────────────────────────────────────

    /** Lấy toàn bộ danh sách ma trận */
    static getAll() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
        } catch { return []; }
    }

    /** Lấy theo khối lớp */
    static getByGrade(grade) {
        return this.getAll().filter(m => String(m.grade) === String(grade));
    }

    /** Lấy một ma trận theo ID */
    static getById(id) {
        return this.getAll().find(m => m.id === id) ?? null;
    }

    /** Tổng số ma trận theo từng lớp */
    static getStats() {
        const all = this.getAll();
        return {
            total: all.length,
            grade3: all.filter(m => m.grade == 3).length,
            grade4: all.filter(m => m.grade == 4).length,
            grade5: all.filter(m => m.grade == 5).length,
        };
    }

    // ─── Write ────────────────────────────────────────────────────

    /**
     * Lưu ma trận mới.
     * @param {{title, description, grade, icon, difficulty, config}} data
     * @returns {string} ID của ma trận vừa lưu
     */
    static save(data) {
        const all = this.getAll();
        const entry = {
            id: `maze_${Date.now()}`,
            title: data.title || 'Ma trận không tên',
            description: data.description || '',
            grade: Number(data.grade) || 3,
            icon: data.icon || '🧩',
            difficulty: Number(data.difficulty) || 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            playCount: 0,
            config: data.config
        };
        all.push(entry);
        this.#persist(all);
        return entry.id;
    }

    /**
     * Cập nhật ma trận đã có (theo ID).
     * @param {string} id
     * @param {Partial<{title, description, grade, icon, difficulty, config}>} updates
     */
    static update(id, updates) {
        const all = this.getAll();
        const idx = all.findIndex(m => m.id === id);
        if (idx === -1) return false;
        all[idx] = { ...all[idx], ...updates, updatedAt: new Date().toISOString() };
        this.#persist(all);
        return true;
    }

    /** Xoá ma trận theo ID */
    static delete(id) {
        const all = this.getAll().filter(m => m.id !== id);
        this.#persist(all);
    }

    /** Tăng play count */
    static incrementPlayCount(id) {
        const all = this.getAll();
        const idx = all.findIndex(m => m.id === id);
        if (idx !== -1) {
            all[idx].playCount = (all[idx].playCount ?? 0) + 1;
            this.#persist(all);
        }
    }

    /** Nạp config vào window.GAME_CONFIG để game dùng */
    static activateMaze(id) {
        const entry = this.getById(id);
        if (!entry) return false;
        window.GAME_CONFIG = entry.config;
        window._activeMazeId = id;
        window._activeMazeTitle = entry.title;
        window._activeMazeGrade = entry.grade;
        this.incrementPlayCount(id);
        return true;
    }

    // ─── Demo Data ────────────────────────────────────────────────

    /** Nạp dữ liệu mẫu nếu thư viện rỗng */
    static seedIfEmpty() {
        if (this.getAll().length > 0) return;
        const demoMaze = [
            [1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 1, 1, 1, 0, 1, 0, 1],
            [1, 0, 1, 0, 0, 0, 1, 0, 1],
            [1, 0, 1, 0, 1, 1, 1, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 1, 0, 1, 0, 1, 0, 1],
            [1, 0, 0, 0, 1, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1],
        ];
        const demos = [
            {
                grade: 3, icon: '🖥', title: 'Tin học Lớp 3 — Thiết bị máy tính', description: 'Khám phá các bộ phận của máy tính', difficulty: 1,
                milestones: [
                    { id: 'm1', x: 2, y: 2, type: 'mcq', question: 'Thiết bị nào dùng để nhập dữ liệu?', options: ['Màn hình', 'Bàn phím', 'Loa', 'Máy in'], correct: 1, points: 100, time: 20 },
                    { id: 'm2', x: 6, y: 2, type: 'fill', question: 'CPU là viết tắt của từ gì trong tiếng Anh? (Gợi ý: Central Processing ___)', correct_answers: ['Unit', 'unit'], points: 120, time: 25 },
                    { id: 'm3', x: 6, y: 6, type: 'mcq', question: 'Bộ nhớ nào mất dữ liệu khi tắt máy?', options: ['Ổ cứng HDD', 'RAM', 'ROM', 'USB'], correct: 1, points: 100, time: 20 },
                    { id: 'm4', x: 2, y: 6, type: 'mcq', question: 'Thiết bị xuất nào phổ biến nhất?', options: ['Máy quét', 'Loa', 'Màn hình', 'Webcam'], correct: 2, points: 100, time: 20 },
                ]
            },
            {
                grade: 4, icon: '🌐', title: 'Tin học Lớp 4 — Mạng máy tính', description: 'Tìm hiểu về internet và mạng máy tính', difficulty: 2,
                milestones: [
                    { id: 'm1', x: 2, y: 2, type: 'mcq', question: 'WWW là viết tắt của?', options: ['World Wide Web', 'Wide World Web', 'World Web Wide', 'Web World Wide'], correct: 0, points: 100, time: 20 },
                    { id: 'm2', x: 6, y: 2, type: 'mcq', question: 'Thiết bị nào kết nối mạng Wi-Fi?', options: ['Bộ định tuyến (Router)', 'Màn hình', 'Ổ cứng', 'RAM'], correct: 0, points: 100, time: 20 },
                    { id: 'm3', x: 6, y: 6, type: 'matching', question: 'Nối đúng các khái niệm mạng:', pairs: [{ left: 'Email', right: 'Thư điện tử' }, { left: 'Browser', right: 'Trình duyệt web' }, { left: 'URL', right: 'Địa chỉ trang web' }], points: 150, time: 35 },
                    { id: 'm4', x: 2, y: 6, type: 'fill', question: 'HTTP là viết tắt của HyperText Transfer ___?', correct_answers: ['Protocol', 'protocol'], points: 120, time: 25 },
                ]
            },
            {
                grade: 5, icon: '💻', title: 'Tin học Lớp 5 — Thuật toán & Lập trình', description: 'Làm quen với lập trình và tư duy thuật toán', difficulty: 3,
                milestones: [
                    { id: 'm1', x: 2, y: 2, type: 'mcq', question: 'Thuật toán là gì?', options: ['Dãy các bước giải quyết vấn đề', 'Ngôn ngữ lập trình', 'Phần cứng máy tính', 'Hệ điều hành'], correct: 0, points: 100, time: 20 },
                    { id: 'm2', x: 6, y: 2, type: 'mcq', question: 'Trong lập trình Scratch, khối nào dùng để lặp lại?', options: ['If/Else', 'Repeat/Forever', 'Say', 'Move'], correct: 1, points: 100, time: 20 },
                    { id: 'm3', x: 6, y: 6, type: 'matching', question: 'Nối cấu trúc điều khiển với mô tả:', pairs: [{ left: 'Rẽ nhánh', right: 'Nếu... thì...' }, { left: 'Lặp', right: 'Làm đi làm lại' }, { left: 'Tuần tự', right: 'Từng bước một' }], points: 150, time: 35 },
                    { id: 'm4', x: 2, y: 6, type: 'fill', question: 'Trong Scratch, lệnh "move ___ steps" dùng để làm gì? (Điền số)', correct_answers: ['10', '10 steps'], points: 120, time: 25 },
                ]
            },
        ];

        demos.forEach(d => {
            this.save({
                title: d.title, description: d.description,
                grade: d.grade, icon: d.icon, difficulty: d.difficulty,
                config: {
                    settings: {
                        title: d.title,
                        play_limit_per_day: 3,
                        competition_window: {
                            start: '2026-01-01T00:00:00',
                            end: '2099-12-31T23:59:59'
                        }
                    },
                    maze: demoMaze,
                    milestones: d.milestones
                }
            });
        });
    }

    // ─── Private ──────────────────────────────────────────────────

    static #persist(all) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(all));
    }
}
