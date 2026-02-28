// ─── Competition Guard ───────────────────────────────────────────
/**
 * Quản lý cửa sổ thời gian thi.
 * Đọc start/end từ GAME_CONFIG.settings.competition_window.
 * Trạng thái: BEFORE → đếm ngược | ACTIVE → bình thường | ENDED → khóa
 */
const CompetitionGuard = (() => {
    let _countdownTimer = null;
    let _endWatchTimer = null;
    let _status = 'ACTIVE';

    function _getWindow() {
        const cfg = window.GAME_CONFIG?.settings?.competition_window;
        if (!cfg) return { start: null, end: null };
        return {
            start: cfg.start ? new Date(cfg.start) : null,
            end: cfg.end ? new Date(cfg.end) : null,
        };
    }

    function _fmt2(n) { return String(n).padStart(2, '0'); }

    function _computeStatus() {
        const { start, end } = _getWindow();
        const now = new Date();
        if (start && now < start) return 'BEFORE';
        if (end && now > end) return 'ENDED';
        return 'ACTIVE';
    }

    function _showBeforeOverlay(startDt) {
        document.getElementById('comp-before-overlay')?.classList.remove('hidden');
        document.getElementById('comp-ended-overlay')?.classList.add('hidden');

        // Nhãn giờ bắt đầu
        const lbl = document.getElementById('comp-start-time-lbl');
        if (lbl && startDt) {
            lbl.textContent = `Giờ bắt đầu: ${startDt.toLocaleString('vi-VN')}`;
        }

        // Đếm ngược tick mỗi giây
        clearInterval(_countdownTimer);
        _countdownTimer = setInterval(() => {
            const secs = Math.max(0, Math.floor((startDt - new Date()) / 1000));
            const h = Math.floor(secs / 3600);
            const m = Math.floor((secs % 3600) / 60);
            const s = secs % 60;
            const hEl = document.getElementById('ccd-h');
            const mEl = document.getElementById('ccd-m');
            const sEl = document.getElementById('ccd-s');
            if (hEl) hEl.textContent = _fmt2(h);
            if (mEl) mEl.textContent = _fmt2(m);
            if (sEl) sEl.textContent = _fmt2(s);

            if (secs === 0) {
                clearInterval(_countdownTimer);
                _unlock();  // tự chuyển sang ACTIVE
            }
        }, 1000);
    }

    function _showEndedOverlay() {
        document.getElementById('comp-ended-overlay')?.classList.remove('hidden');
        document.getElementById('comp-before-overlay')?.classList.add('hidden');
        // Khóa toàn bộ game nếu đang chơi
        if (window.game?.model) window.game.model.isLocked = true;
    }

    function _unlock() {
        _status = 'ACTIVE';
        document.getElementById('comp-before-overlay')?.classList.add('hidden');
        document.getElementById('comp-ended-overlay')?.classList.add('hidden');
        _watchEnd();
    }

    /** Canh thời điểm kết thúc để tự động khóa */
    function _watchEnd() {
        clearTimeout(_endWatchTimer);
        const { end } = _getWindow();
        if (!end) return;
        const ms = end - new Date();
        if (ms <= 0) { _showEndedOverlay(); return; }
        _endWatchTimer = setTimeout(() => {
            _status = 'ENDED';
            _showEndedOverlay();
        }, ms);
    }

    /** Gọi khi DOMContentLoaded */
    function check() {
        const { start, end } = _getWindow();
        _status = _computeStatus();

        if (_status === 'BEFORE') {
            _showBeforeOverlay(start);
        } else if (_status === 'ENDED') {
            // Hiện overlay ngay lập tức
            requestAnimationFrame(() => _showEndedOverlay());
        } else {
            // ACTIVE — canh thời điểm kết thúc
            _watchEnd();
        }
    }

    /** Cho controller.js kiểm tra trước khi khởi động game */
    function isActive() { return _computeStatus() === 'ACTIVE'; }

    return { check, isActive };
})();


// ─── Player State ───────────────────────────────────────────────
let playerState = {
    name: '',
    grade: '',
    score: 0,
    ip: 'unknown',
    activeMazeId: null,    // ID trong MazeLibrary
};

let _mazeFilter = 'all';   // grade filter hiện tại trên màn hình chọn

// ─── Screen Transitions ─────────────────────────────────────────
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) requestAnimationFrame(() => target.classList.add('active'));

    // Hook khi vào màn hình chọn
    if (id === 'screen-select') renderMazeSelect();
    if (id === 'screen-entry') updatePlayLimitNotice();
}

// ─── App Init ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    // Kiểm tra cửa sổ thi ngay khi tải trang
    CompetitionGuard.check();

    // Seed demo data nếu thư viện rỗng
    MazeLibrary.seedIfEmpty();

    // Detect IP âm thầm
    playerState.ip = await SessionManager.getClientIP();

    // Welcome stats
    const todayEntries = await SessionManager.getTodayTop(1000);
    document.getElementById('total-players').textContent = todayEntries.length;
    const top1 = todayEntries[0];
    if (top1) document.getElementById('top-player-name').textContent = top1.name;

    const stats = MazeLibrary.getStats();
    document.getElementById('total-mazes').textContent = stats.total;

    createParticles();

    // Name input enable/disable logic
    const nameInput = document.getElementById('player-name-input');
    const enterBtn = document.getElementById('btn-enter-maze');
    nameInput.addEventListener('input', () => {
        enterBtn.disabled = nameInput.value.trim().length < 2 || !playerState.activeMazeId;
    });
});

// ─── MAZE SELECTION SCREEN ──────────────────────────────────────

function filterGrade(grade, btn) {
    _mazeFilter = grade;
    document.querySelectorAll('.grade-tab').forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderMazeSelect();
}

function renderMazeSelect() {
    const grid = document.getElementById('maze-grid');
    const empty = document.getElementById('maze-empty');
    if (!grid) return;

    const mazes = _mazeFilter === 'all'
        ? MazeLibrary.getAll()
        : MazeLibrary.getByGrade(_mazeFilter);

    if (mazes.length === 0) {
        grid.innerHTML = '';
        empty.classList.remove('hidden');
        return;
    }
    empty.classList.add('hidden');
    grid.innerHTML = mazes.map(m => buildMazeCard(m)).join('');
}

function buildMazeCard(m) {
    const gradeColors = { 3: '#00f3ff', 4: '#00ff88', 5: '#a855f7' };
    const diffLabels = { 1: '⭐ Dễ', 2: '⭐⭐ TB', 3: '⭐⭐⭐ Khó' };
    const color = gradeColors[m.grade] ?? '#ffd700';
    const isActive = m.id === playerState.activeMazeId;

    return `
    <div class="maze-card ${isActive ? 'selected' : ''}"
         onclick="selectMaze('${m.id}')"
         style="--mc: ${color}">
        <div class="mc-top">
            <span class="mc-icon">${m.icon || '🧩'}</span>
            <div class="mc-badges">
                <span class="mc-badge grade">Lớp ${m.grade}</span>
                <span class="mc-badge diff">${diffLabels[m.difficulty] || '⭐'}</span>
            </div>
        </div>
        <h3 class="mc-title">${escHtml(m.title)}</h3>
        <p class="mc-desc">${escHtml(m.description || '')}</p>
        <div class="mc-footer">
            <span class="mc-stat">🎯 ${m.config?.milestones?.length ?? 0} câu hỏi</span>
            <span class="mc-stat">🎮 ${m.playCount ?? 0} lượt chơi</span>
        </div>
        ${isActive ? '<div class="mc-selected-chip">✓ Đang chọn</div>' : ''}
    </div>`;
}

function selectMaze(id) {
    playerState.activeMazeId = id;
    const maze = MazeLibrary.getById(id);
    if (!maze) return;

    // Activate maze config globally
    MazeLibrary.activateMaze(id);

    // Update selected chip in Entry screen
    const chip = document.getElementById('selected-maze-chip');
    if (chip) {
        chip.style.display = '';
        document.getElementById('smz-icon').textContent = maze.icon || '🧩';
        document.getElementById('smz-title').textContent = maze.title;
        document.getElementById('smz-grade').textContent = `Lớp ${maze.grade}`;
    }
    document.getElementById('entry-maze-icon').textContent = maze.icon || '🎮';
    document.getElementById('entry-maze-title').textContent = 'Nhập tên của bạn';

    // Re-render cards để hiển thị "Đang chọn"
    renderMazeSelect();

    // Chuyển sang màn hình nhập tên sau 200ms (hiệu ứng nhẹ)
    setTimeout(() => showScreen('screen-entry'), 200);
}

// ─── ENTRY SCREEN ────────────────────────────────────────────────

async function updatePlayLimitNotice() {
    const notice = document.getElementById('play-limit-notice');
    const enterBtn = document.getElementById('btn-enter-maze');
    if (!notice) return;

    notice.innerHTML = `<span class="checking">🔄 Đang kiểm tra lượt chơi...</span>`;

    const elig = await SessionManager.checkPlayEligibility(playerState.ip);
    const srcBadge = elig.source === 'backend'
        ? '<span class="src-badge server">🖥 Server</span>'
        : '<span class="src-badge local">💾 Cục bộ</span>';

    if (!elig.can_play) {
        notice.innerHTML = `⛔ Đã hết ${SessionManager.LIMIT_PER_DAY} lượt hôm nay. Quay lại ngày mai! ${srcBadge}`;
        notice.className = 'play-limit-notice limit-reached';
        if (enterBtn) enterBtn.disabled = true;
    } else {
        const rem = elig.remaining === '?' ? 'còn lượt' : `còn ${elig.remaining} lượt`;
        notice.innerHTML = `✅ ${rem} hôm nay ${srcBadge}`;
        notice.className = 'play-limit-notice limit-ok';
        // Bật nút nếu có tên + đã chọn ma trận
        const nameInput = document.getElementById('player-name-input');
        if (enterBtn && nameInput)
            enterBtn.disabled = nameInput.value.trim().length < 2 || !playerState.activeMazeId;
    }
}

async function enterMaze() {
    // Chặn: nếu ngoài cửa sổ thi
    if (!CompetitionGuard.isActive()) {
        CompetitionGuard.check(); // hiện lại overlay tương ứng
        return;
    }

    const name = document.getElementById('player-name-input').value.trim();
    if (!name || !playerState.activeMazeId) return;

    const elig = await SessionManager.checkPlayEligibility(playerState.ip);
    if (!elig.can_play) { await updatePlayLimitNotice(); return; }

    playerState.name = name;
    playerState.score = 0;

    document.getElementById('hud-name').textContent = name;
    showScreen('screen-game');
    setTimeout(initGame, 300);

    // Ẩn controls hint sau 4s
    setTimeout(() => {
        const hint = document.getElementById('controls-hint');
        if (hint) { hint.style.opacity = '0'; hint.style.transition = 'opacity 1.5s'; }
    }, 4000);
}

// ─── GAME INIT ───────────────────────────────────────────────────
function initGame() {
    // Dọn engine cũ
    if (window.game?.controller?.destroy) window.game.controller.destroy();

    const canvas = document.getElementById('maze-canvas');
    const container = document.getElementById('maze-canvas-container');
    const size = Math.min(container.clientWidth, container.clientHeight);
    canvas.width = size || 480;
    canvas.height = size || 480;

    // Ẩn completion overlay nếu còn hiện
    document.getElementById('completion-overlay').classList.add('hidden');

    const config = window.GAME_CONFIG;
    if (!config) {
        console.error('[ScreenFlow] GAME_CONFIG chưa được set.');
        return;
    }

    const mazeEngine = new MazeEngine();
    const questionEngine = new QuestionEngine();
    const model = new GameModel(config);
    const view = new GameView(mazeEngine, questionEngine);
    const controller = new GameController(model, view, onGameComplete);

    window.game = { model, view, controller };
}

// ─── GAME COMPLETE — hiển thị ngay trên màn hình game ─────────────
function confirmExitMaze() {
    if (!confirm('Bạn muốn rời mê cung? Tiến độ sẽ không được lưu.')) return;
    if (window.game?.controller?.destroy) window.game.controller.destroy();
    showScreen('screen-select');
}

function replayCurrentMaze() {
    document.getElementById('completion-overlay').classList.add('hidden');
    setTimeout(initGame, 100);
}

async function onGameComplete(finalScore, milestoneLog = []) {
    playerState.score = finalScore;

    // Lưu kết quả lên server / local
    await SessionManager.saveResult(
        playerState.ip, playerState.name,
        String(playerState.grade || window._activeMazeGrade || 'unknown'),
        finalScore
    );

    // ─ Điện data vào completion overlay ─
    document.getElementById('comp-player-name').textContent =
        `🎉 Chúc mừng ${playerState.name}!`;
    document.getElementById('comp-score').textContent =
        finalScore.toLocaleString('vi-VN');

    const correct = milestoneLog.filter(m => m.result === 'correct').length;
    const total = milestoneLog.length;
    document.getElementById('comp-correct').textContent = `${correct}/${total}`;

    const rank = SessionManager.getPlayerRankLocal(finalScore);
    document.getElementById('comp-rank').textContent =
        rank === 1 ? '🥇 #1' : `#${rank}`;

    // Breakdown bảng kết quả từng câu
    const breakdown = document.getElementById('comp-breakdown');
    if (breakdown && milestoneLog.length) {
        const icons = { correct: '✅', wrong: '❌', timeout: '⏰' };
        breakdown.innerHTML = milestoneLog.map((m, i) => `
            <div class="comp-row ${m.result}">
                <span class="comp-row-num">${i + 1}</span>
                <span class="comp-row-q">${escHtml(m.question?.substring(0, 45) ?? '')}${(m.question?.length ?? 0) > 45 ? '…' : ''}</span>
                <span class="comp-row-icon">${icons[m.result] ?? '❓'}</span>
                <span class="comp-row-score">+${m.earned.toLocaleString('vi-VN')}</span>
            </div>`).join('');
    }

    // Leaderboard preview
    const lbEl = document.getElementById('comp-lb-list');
    if (lbEl) Leaderboard.render(lbEl, await SessionManager.getTodayTop(5));

    // Hiển completion overlay bên trong screen-game
    document.getElementById('completion-overlay').classList.remove('hidden');
    launchCompFireworks();
}

function playAgain() {
    updatePlayLimitNotice();
    showScreen('screen-entry');
}

// ─── HELPERS ────────────────────────────────────────────────────
function escHtml(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ─── PARTICLES ──────────────────────────────────────────────────
function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    for (let i = 0; i < 35; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.cssText = `
            left:${Math.random() * 100}%; top:${Math.random() * 100}%;
            width:${Math.random() * 4 + 2}px; height:${Math.random() * 4 + 2}px;
            animation-delay:${Math.random() * 5}s;
            animation-duration:${4 + Math.random() * 4}s;`;
        container.appendChild(p);
    }
}

// ─── FIREWORKS ──────────────────────────────────────────────────
function launchFireworks() {
    const container = document.getElementById('fireworks');
    if (!container) return;
    const colors = ['#ff007a', '#00f3ff', '#ffd700', '#00ff88', '#ff6b35'];
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const spark = document.createElement('div');
            spark.className = 'spark';
            spark.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 60}%;
                background:${colors[Math.floor(Math.random() * colors.length)]};
                animation-duration:${0.8 + Math.random() * 0.8}s;`;
            container.appendChild(spark);
            setTimeout(() => spark.remove(), 1600);
        }, i * 70);
    }
}

function launchCompFireworks() {
    const container = document.getElementById('comp-fireworks');
    if (!container) return;
    const colors = ['#ff007a', '#00f3ff', '#ffd700', '#00ff88', '#a855f7'];
    for (let i = 0; i < 40; i++) {
        setTimeout(() => {
            const spark = document.createElement('div');
            spark.className = 'spark';
            spark.style.cssText = `
                left:${Math.random() * 100}%; top:${Math.random() * 80}%;
                width:${4 + Math.random() * 4}px; height:${4 + Math.random() * 4}px;
                background:${colors[Math.floor(Math.random() * colors.length)]};
                animation-duration:${0.7 + Math.random() * 0.8}s;`;
            container.appendChild(spark);
            setTimeout(() => spark.remove(), 1500);
        }, i * 60);
    }
}
