/**
 * CONTROLLER (MVC) — v2 Multi-Maze Edition
 *
 * Additions:
 *  - onGameComplete: gọi với (score, milestoneResults[]) để Victory screen
 *    có thể hiển thị bảng tổng kết ngay
 *  - isLocked: bảo vệ cả khi quiz đang mở lẫn khi xem kết quả
 */
class GameController {
    /**
     * @param {GameModel}  model
     * @param {GameView}   view
     * @param {function}   onGameComplete  - Callback(finalScore, results[]) khi hoàn thành
     */
    constructor(model, view, onGameComplete) {
        this.model = model;
        this.view = view;
        this.onGameComplete = onGameComplete || (() => { });
        this.#milestoneLog = [];   // ghi lại kết quả từng câu
        this.#init();
    }

    #milestoneLog = [];

    #init() {
        if (this.model.checkStatus() === 'LOCKED') {
            this.view.quizOverlay?.classList.remove('hidden');
            const badge = document.getElementById('quiz-type-badge');
            if (badge) badge.textContent = '🔒 Cuộc thi chưa bắt đầu hoặc đã kết thúc';
            if (this.view.quizContainer) {
                this.view.quizContainer.innerHTML =
                    `<p style="text-align:center;color:#ff007a;padding:20px">
                        Hệ thống đang khóa. Vui lòng quay lại trong giờ thi.
                    </p>`;
            }
            return;
        }

        this.view.initMaze(this.model, () => { });
        this.mazeEngine = this.view.mazeEngine;
        this.view.render(this.model);
        this.#setupKeyboard();
        SoundManager.startBGM();
    }

    // ─── Movement ─────────────────────────────────────────────────

    #setupKeyboard() {
        this._keyHandler = (e) => {
            if (this.model.isLocked) return;
            const map = {
                ArrowUp: [0, -1], w: [0, -1], W: [0, -1],
                ArrowDown: [0, 1], s: [0, 1], S: [0, 1],
                ArrowLeft: [-1, 0], a: [-1, 0], A: [-1, 0],
                ArrowRight: [1, 0], d: [1, 0], D: [1, 0],
            };
            const dir = map[e.key];
            if (dir) { e.preventDefault(); this.handleMove(...dir); }
        };
        window.addEventListener('keydown', this._keyHandler);
    }

    /** Công khai để D-pad gọi */
    handleMove(dx, dy) {
        if (this.model.isLocked) return;
        if (!this.model.movePlayer(dx, dy)) return;

        SoundManager.play('move');
        const { x, y } = this.model.player;
        this.mazeEngine.setPosition(x, y);
        this.view.render(this.model);
        this.#checkMilestone();
    }

    // ─── Milestone ─────────────────────────────────────────────────

    #checkMilestone() {
        const milestone = this.model.getMilestoneAtCurrentPos();
        if (milestone && !milestone.completed) {
            SoundManager.play('milestone');
            this.#startQuiz(milestone);
        }
    }

    #startQuiz(milestone) {
        this.model.isLocked = true;
        const startTime = Date.now();

        this.view.showQuiz(
            milestone,

            // ── onCorrect ──
            () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const remaining = Math.max(0, milestone.time - elapsed);
                const earned = this.model.calculatePoints(remaining, milestone.time, milestone.points);

                this.model.score += earned;
                milestone.completed = true;
                milestone.result = 'correct';  // ← cho canvas biết kết quả

                // Ghi log kết quả câu hỏi
                this.#milestoneLog.push({
                    question: milestone.question,
                    result: 'correct',
                    earned,
                    maxPoints: milestone.points,
                });

                this.view.hideQuiz();
                SoundManager.play('reward');
                this.view.showReward(earned);
                this.view.render(this.model);
                this.model.isLocked = false;

                this.#checkCompletion();
            },

            // ── onWrong ──
            () => {
                this.#milestoneLog.push({
                    question: milestone.question,
                    result: 'wrong',
                    earned: 0,
                    maxPoints: milestone.points,
                });

                milestone.completed = true;   // đánh dấu đã qua (cho phép di chuyển tiếp)
                milestone.result = 'wrong';
                this.view.hideQuiz();
                SoundManager.play('wrong');
                this.view.showWrong();
                this.view.render(this.model);
                this.model.isLocked = false;

                this.#checkCompletion();
            },

            // ── onTimeout ──
            () => {
                this.#milestoneLog.push({
                    question: milestone.question,
                    result: 'timeout',
                    earned: 0,
                    maxPoints: milestone.points,
                });

                milestone.completed = true;
                milestone.result = 'timeout';
                this.view.hideQuiz();
                SoundManager.play('timeout');
                this.view.showTimeout();
                this.view.render(this.model);
                this.model.isLocked = false;

                this.#checkCompletion();
            }
        );
    }

    #checkCompletion() {
        const allDone = this.model.config.milestones.every(m => m.completed);
        if (allDone) {
            this.model.isLocked = true;   // khóa di chuyển sau khi xong
            SoundManager.play('victory');
            SoundManager.stopBGM();
            setTimeout(() => {
                this.onGameComplete(this.model.score, [...this.#milestoneLog]);
            }, 1200);
        }
    }

    /** Dọn dẹp event listener khi cần restart */
    destroy() {
        if (this._keyHandler) window.removeEventListener('keydown', this._keyHandler);
        this.view?.mazeEngine?.destroy?.();
    }
}
