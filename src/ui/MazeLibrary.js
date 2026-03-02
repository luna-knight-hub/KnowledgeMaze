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

        // SAMPLE_MAZES được định nghĩa trong src/ui/SampleLibraryData.js
        if (typeof SAMPLE_MAZES === 'undefined') {
            console.warn('SAMPLE_MAZES not found. Cannot seed library.');
            return;
        }

        SAMPLE_MAZES.forEach(m => {
            this.save({
                title: m.title,
                description: m.description || `Ma trận Tin học lớp ${m.grade} - Mức độ ${m.difficulty === 1 ? 'Dễ' : m.difficulty === 2 ? 'Trung bình' : 'Khó'}`,
                grade: m.grade,
                icon: m.icon,
                difficulty: m.difficulty,
                config: m.config
            });
        });
        console.log(`Đã nạp ${SAMPLE_MAZES.length} ma trận mẫu vào thư viện.`);
    }

    // ─── Private ──────────────────────────────────────────────────

    static #persist(all) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(all));
    }
}
