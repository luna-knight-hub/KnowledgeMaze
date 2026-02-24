/**
 * VIEW (MVC) - Antigravity Neon Edition
 *
 * Nhận MazeEngine và QuestionEngine làm dependency injection.
 * Chỉ xử lý DOM và ủy thác render canvas cho MazeEngine,
 * render quiz cho QuestionEngine.
 */
class GameView {
    /**
     * @param {MazeEngine}     mazeEngine
     * @param {QuestionEngine} questionEngine
     */
    constructor(mazeEngine, questionEngine) {
        // Canvas + engines
        this.canvas = document.getElementById('maze-canvas');
        this.mazeEngine = mazeEngine;
        this.questionEngine = questionEngine;

        // HUD elements
        this.scoreEl = document.getElementById('score');
        this.playsEl = document.getElementById('plays');
        this.progressEl = document.getElementById('hud-progress-fill');
        this.progressLbl = document.getElementById('hud-progress-label');

        // Quiz overlay elements
        this.quizOverlay = document.getElementById('quiz-overlay');
        this.timerBar = document.getElementById('timer-bar');

        // Quiz content container — QuestionEngine sẽ render vào đây
        this.quizContainer = document.getElementById('quiz-body');

        // Khởi tạo QuestionEngine với container + timerBar
        if (this.questionEngine && this.quizContainer && this.timerBar) {
            this.questionEngine.init(this.quizContainer, this.timerBar);
        }
    }

    // ─── Game Render ──────────────────────────────────────────────

    /**
     * Khởi tạo engine và vẽ mê cung lần đầu.
     * @param {GameModel} model
     * @param {function(x:number,y:number):void} onCellEnter
     */
    initMaze(model, onCellEnter) {
        if (this.mazeEngine._animFrame) this.mazeEngine.destroy?.();
        this.mazeEngine.init(
            this.canvas,
            model.config.maze,
            onCellEnter,
            model.config.milestones   // ← live reference để markers cập nhật real-time
        );
    }

    /**
     * Cập nhật HUD điểm số và progress bar.
     * @param {GameModel} model
     */
    render(model) {
        if (this.scoreEl) this.scoreEl.innerText = model.score.toLocaleString('vi-VN');
        if (this.playsEl) this.playsEl.innerText = `Lượt ${model.plays ?? 1}/${model.maxPlays}`;
        this.renderProgress(model);
    }

    /** Cập nhật thanh tiến trình milestone */
    renderProgress(model) {
        const { done, total } = model.getProgress?.() ?? { done: 0, total: 0 };
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        if (this.progressEl) this.progressEl.style.width = pct + '%';
        if (this.progressLbl) this.progressLbl.textContent = `${done}/${total} câu`;
    }

    // ─── Quiz Show / Hide ─────────────────────────────────────────

    /**
     * Hiển thị quiz overlay và ủy thác render cho QuestionEngine.
     * @param {object}   milestone  - Dữ liệu câu hỏi từ config.js
     * @param {function} onCorrect  - Gọi khi trả lời đúng
     * @param {function} onWrong    - Gọi khi trả lời sai
     * @param {function} onTimeout  - Gọi khi hết giờ
     */
    showQuiz(milestone, onCorrect, onWrong, onTimeout) {
        // Hiển thị badge loại câu hỏi (nếu có element)
        const badge = document.getElementById('quiz-type-badge');
        const labels = {
            mcq: 'Trắc nghiệm', image: 'Hình ảnh', audio: 'Âm thanh',
            matching: 'Nối cặp', fill: 'Điền từ'
        };
        if (badge) {
            badge.textContent = labels[milestone.type] || 'Câu hỏi';
            badge.className = `quiz-type-badge type-${milestone.type}`;
        }

        // Hiện overlay
        this.quizOverlay.classList.remove('hidden');

        // Ủy thác toàn bộ render cho QuestionEngine
        this.questionEngine.render(milestone, onCorrect, onWrong, onTimeout);
    }

    hideQuiz() {
        this.quizOverlay.classList.add('hidden');
        // Reset timer bar màu
        if (this.timerBar) {
            this.timerBar.style.background = '';
            this.timerBar.style.width = '100%';
        }
        // Reset container
        if (this.quizContainer) this.quizContainer.innerHTML = '';
    }

    // ─── Reward Feedback ──────────────────────────────────────────

    showReward(points) {
        const popup = document.createElement('div');
        popup.className = 'reward-popup bounce-in';
        popup.innerHTML = `
            <div class="reward-content">
                <span class="reward-icon">🏆</span>
                <h3>KHEN THƯỞNG!</h3>
                <p>+<b>${points.toLocaleString('vi-VN')}</b> điểm</p>
                <div class="stars">⭐⭐⭐</div>
            </div>`;
        document.body.appendChild(popup);
        setTimeout(() => popup.remove(), 2500);
    }

    showWrong() {
        const popup = document.createElement('div');
        popup.className = 'wrong-popup bounce-in';
        popup.innerHTML = `<div class="wrong-content"><span>❌</span><p>Chưa đúng rồi!</p></div>`;
        document.body.appendChild(popup);
        setTimeout(() => popup.remove(), 1500);
    }

    showTimeout() {
        const popup = document.createElement('div');
        popup.className = 'wrong-popup bounce-in';
        popup.innerHTML = `<div class="wrong-content"><span>⏰</span><p>Hết thời gian!</p></div>`;
        document.body.appendChild(popup);
        setTimeout(() => popup.remove(), 1500);
    }
}
