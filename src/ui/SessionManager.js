/**
 * SESSION MANAGER - IP-Aware Edition
 *
 * Kiến trúc 2 lớp:
 *  - Lớp FE: Dùng IP thật (qua public API) làm key trong localStorage.
 *            Khó bypass hơn dùng device fingerprint thuần.
 *  - Lớp BE: Gọi tới API server Python (server.py) nếu server đang chạy.
 *            Server là nguồn chân lý cuối cùng, không thể bị xóa cache qua.
 *
 * Fallback logic:
 *   BE available? → dùng BE hoàn toàn
 *   BE not available? → dùng IP + localStorage (thích hợp môi trường LAN, không có server)
 */
class SessionManager {
    static STORAGE_KEY = 'km_sessions';
    static IP_CACHE_KEY = 'km_cached_ip';
    static LIMIT_PER_DAY = window.GAME_CONFIG?.settings?.play_limit_per_day ?? 3;

    // Địa chỉ backend Python (server.py).
    // Nếu server không chạy, FE tự xử lý bằng localStorage.
    static API_BASE = 'http://localhost:5000';

    // ═══════════════════════════════════════════════
    //  IP DETECTION
    // ═══════════════════════════════════════════════

    /**
     * Lấy IP của người dùng.
     * Ưu tiên: cache trình duyệt → public API → fallback "unknown"
     * @returns {Promise<string>}
     */
    static async getClientIP() {
        const cached = sessionStorage.getItem(SessionManager.IP_CACHE_KEY);
        if (cached) return cached;

        try {
            // Dùng các public IP API (dự phòng nếu một cái fail)
            const endpoints = [
                'https://api.ipify.org?format=json',
                'https://api64.ipify.org?format=json',
            ];
            for (const url of endpoints) {
                try {
                    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
                    if (res.ok) {
                        const data = await res.json();
                        const ip = data.ip;
                        sessionStorage.setItem(SessionManager.IP_CACHE_KEY, ip);
                        return ip;
                    }
                } catch (_) { /* thử API tiếp theo */ }
            }
        } catch (_) { /* ignore */ }

        return 'local_device'; // fallback khi không có internet
    }

    // ═══════════════════════════════════════════════
    //  BACKEND API LAYER (Python server.py)
    // ═══════════════════════════════════════════════

    static async #beCanPlay(ip) {
        try {
            const res = await fetch(`${SessionManager.API_BASE}/api/can-play?ip=${encodeURIComponent(ip)}`,
                { signal: AbortSignal.timeout(2000) });
            if (res.ok) return (await res.json()).can_play;
        } catch (_) { /* server không chạy */ }
        return null; // null = backend không khả dụng
    }

    static async #beRegisterPlay(ip, name, grade, score) {
        try {
            await fetch(`${SessionManager.API_BASE}/api/register-play`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ip, name, grade, score,
                    timestamp: new Date().toISOString()
                }),
                signal: AbortSignal.timeout(3000)
            });
            return true;
        } catch (_) { return false; }
    }

    static async #beGetLeaderboard(period = 'today', limit = 10) {
        try {
            const res = await fetch(
                `${SessionManager.API_BASE}/api/leaderboard?period=${period}&limit=${limit}`,
                { signal: AbortSignal.timeout(3000) });
            if (res.ok) return await res.json();
        } catch (_) { /* ignore */ }
        return null;
    }

    // ═══════════════════════════════════════════════
    //  FRONTEND FALLBACK LAYER (localStorage + IP key)
    // ═══════════════════════════════════════════════

    static #getTodayKey() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    static #feGetPlaysToday(ip) {
        const key = `km_plays_${ip}_${SessionManager.#getTodayKey()}`;
        return parseInt(localStorage.getItem(key) || '0', 10);
    }

    static #feIncrementPlay(ip) {
        const key = `km_plays_${ip}_${SessionManager.#getTodayKey()}`;
        localStorage.setItem(key, SessionManager.#feGetPlaysToday(ip) + 1);
    }

    static #feCanPlay(ip) {
        return SessionManager.#feGetPlaysToday(ip) < SessionManager.LIMIT_PER_DAY;
    }

    static #feGetRemaining(ip) {
        return Math.max(0, SessionManager.LIMIT_PER_DAY - SessionManager.#feGetPlaysToday(ip));
    }

    // ═══════════════════════════════════════════════
    //  PUBLIC API (được gọi từ ScreenFlow)
    // ═══════════════════════════════════════════════

    /**
     * Kiểm tra xem người chơi có thể chơi không.
     * @param {string} ip
     * @returns {Promise<{can_play: boolean, remaining: number, source: 'backend'|'local'}>}
     */
    static async checkPlayEligibility(ip) {
        // Thử backend trước
        const beResult = await SessionManager.#beCanPlay(ip);
        if (beResult !== null) {
            return {
                can_play: beResult,
                remaining: beResult ? '?' : 0,  // server sẽ biết chính xác
                source: 'backend'
            };
        }

        // Fallback sang localStorage
        const remaining = SessionManager.#feGetRemaining(ip);
        return {
            can_play: remaining > 0,
            remaining,
            source: 'local'
        };
    }

    /**
     * Đăng ký một lượt chơi và lưu kết quả.
     * @param {string} ip
     * @param {string} name
     * @param {string} grade
     * @param {number} score
     */
    static async saveResult(ip, name, grade, score) {
        // Lưu localStorage trước (instant)
        const sessions = JSON.parse(localStorage.getItem(SessionManager.STORAGE_KEY) || '[]');
        sessions.push({
            id: Date.now(), ip, name, grade, score,
            date: new Date().toISOString(), day: SessionManager.#getTodayKey()
        });
        localStorage.setItem(SessionManager.STORAGE_KEY, JSON.stringify(sessions));
        SessionManager.#feIncrementPlay(ip);

        // Sync lên backend (async, không block UI)
        SessionManager.#beRegisterPlay(ip, name, grade, score);
    }

    /**
     * Lấy bảng xếp hạng hôm nay — ưu tiên backend, fallback localStorage
     * @param {number} limit
     */
    static async getTodayTop(limit = 10) {
        const beData = await SessionManager.#beGetLeaderboard('today', limit);
        if (beData) return beData;

        // Fallback local
        const today = SessionManager.#getTodayKey();
        return JSON.parse(localStorage.getItem(SessionManager.STORAGE_KEY) || '[]')
            .filter(r => r.day === today)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    static getTopAllTimeLocal(limit = 10) {
        return JSON.parse(localStorage.getItem(SessionManager.STORAGE_KEY) || '[]')
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    static getPlayerRankLocal(score) {
        const all = SessionManager.getTopAllTimeLocal(1000);
        return all.filter(r => r.score > score).length + 1;
    }

    /**
     * Public wrapper cho bên ngoài gọi backend leaderboard.
     * Trả về null nếu backend không khả dụng.
     * @param {'today'|'week'|'month'|'all'} period
     * @param {number} limit
     */
    static async _beGetLeaderboard(period = 'today', limit = 10) {
        return SessionManager.#beGetLeaderboard(period, limit);
    }
}
