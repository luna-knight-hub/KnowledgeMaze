/**
 * LEADERBOARD — v2
 * Render bảng xếp hạng từ SessionManager data.
 * Tất cả method async đều hỗ trợ đúng.
 */
class Leaderboard {
    /**
     * Render top list vào một <ol> / <ul> container element.
     * Hỗ trợ cả format từ backend (best_score, play_count)
     * lẫn format từ localStorage (score, date).
     * @param {HTMLElement} container
     * @param {Array}       entries
     */
    static render(container, entries) {
        if (!entries || !entries.length) {
            container.innerHTML =
                '<li class="lb-empty">Chưa có kết quả nào. Hãy là người đầu tiên! 🚀</li>';
            return;
        }

        const medals = ['🥇', '🥈', '🥉'];

        container.innerHTML = entries.map((e, i) => {
            const medal = medals[i] ?? `<span class="lb-rank">#${i + 1}</span>`;
            // Backend trả về best_score; localStorage trả về score
            const score = e.best_score ?? e.score ?? 0;
            // Backend: play_count; localStorage: 1 lượt mỗi bản ghi
            const plays = e.play_count != null ? `${e.play_count} lượt` : '';
            // Thời gian — backend không có date, localStorage có
            const timeStr = e.date
                ? new Date(e.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                : '';
            const meta = [e.grade ? `Lớp ${e.grade}` : '', timeStr, plays]
                .filter(Boolean).join(' · ');

            return `
                <li class="lb-item ${i < 3 ? 'lb-top-' + (i + 1) : ''}">
                    <span class="lb-medal">${medal}</span>
                    <div class="lb-info">
                        <span class="lb-name">${e.name ?? 'Ẩn danh'}</span>
                        ${meta ? `<span class="lb-meta">${meta}</span>` : ''}
                    </div>
                    <span class="lb-score">${Number(score).toLocaleString('vi-VN')}</span>
                </li>`;
        }).join('');
    }

    /**
     * Render bảng xếp hạng theo kỳ (ưu tiên backend, fallback local).
     * @param {HTMLElement} container
     * @param {'today'|'week'|'month'|'all'} period
     * @param {number} limit
     */
    static async renderByPeriod(container, period = 'today', limit = 10) {
        container.innerHTML = '<li class="lb-loading">⏳ Đang tải...</li>';
        try {
            let data;
            if (period === 'today') {
                data = await SessionManager.getTodayTop(limit);
            } else if (period === 'all') {
                // Thử backend trước, fallback local
                data = await SessionManager._beGetLeaderboard?.('all', limit)
                    ?? SessionManager.getTopAllTimeLocal(limit);
            } else {
                // week / month — chỉ có qua backend
                data = await SessionManager._beGetLeaderboard?.(period, limit)
                    ?? SessionManager.getTopAllTimeLocal(limit);
            }
            Leaderboard.render(container, data ?? []);
        } catch (err) {
            console.error('[Leaderboard] renderByPeriod error:', err);
            Leaderboard.render(container, []);
        }
    }
}
