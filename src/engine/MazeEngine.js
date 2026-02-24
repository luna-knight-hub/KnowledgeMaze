/**
 * CORE ENGINE – MazeEngine
 *
 * NEW: Hiển thị markers cho từng milestone trực quan trên canvas:
 *   - Chưa hoàn thành → vòng màu vàng phát sáng với số thứ tự
 *   - Đã hoàn thành   → vòng xanh lá với ✓
 *   - Player đứng trên milestone chưa làm → nhấp nháy
 */
class MazeEngine {
    /** @type {HTMLCanvasElement} */ canvas;
    /** @type {CanvasRenderingContext2D} */ ctx;

    #playerX = 1;
    #playerY = 1;
    #maze = [];
    #milestones = [];   // ← NEW
    #cellSize = 0;
    #onCellEnter = null;
    #pulseFrame = 0;
    #animFrame = null;

    /**
     * @param {HTMLCanvasElement} canvas
     * @param {Array<Array<number>>} mazeData
     * @param {function(x,y):void} onCellEnter
     * @param {Array} milestones — từ model.config.milestones (live reference để đọc completed)
     */
    init(canvas, mazeData, onCellEnter, milestones = []) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.#maze = mazeData;
        this.#onCellEnter = onCellEnter;
        this.#milestones = milestones;
        this.#cellSize = canvas.width / mazeData[0].length;
        this.#startAnimLoop();
    }

    // ─── Position API ────────────────────────────────────────────

    setPosition(x, y) {
        this.#playerX = x;
        this.#playerY = y;
        // render được gọi bởi animation loop
    }

    getPosition() {
        return { x: this.#playerX, y: this.#playerY };
    }

    destroy() {
        if (this.#animFrame) cancelAnimationFrame(this.#animFrame);
    }

    // ─── Animation Loop ──────────────────────────────────────────

    #startAnimLoop() {
        const loop = () => {
            this.#pulseFrame = (this.#pulseFrame + 1) % 120;
            this.render();
            this.#animFrame = requestAnimationFrame(loop);
        };
        this.#animFrame = requestAnimationFrame(loop);
    }

    // ─── Render ──────────────────────────────────────────────────

    render() {
        const { ctx, canvas } = this;
        const cs = this.#cellSize;
        if (!ctx || cs === 0) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 1. Vẽ tường và đường đi
        this.#maze.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell === 1) {
                    ctx.fillStyle = '#0b0d22';
                    ctx.fillRect(x * cs, y * cs, cs, cs);
                    ctx.strokeStyle = 'rgba(0,243,255,0.12)';
                    ctx.lineWidth = 0.5;
                    ctx.strokeRect(x * cs + 0.5, y * cs + 0.5, cs - 1, cs - 1);
                } else {
                    // Đường đi: gradient nhẹ
                    ctx.fillStyle = '#070819';
                    ctx.fillRect(x * cs, y * cs, cs, cs);
                }
            });
        });

        // 2. Vẽ milestone markers
        this.#milestones.forEach((m, idx) => {
            if (m.x === undefined || m.y === undefined) return;
            const cx = m.x * cs + cs / 2;
            const cy = m.y * cs + cs / 2;
            const r = cs * 0.30;

            if (m.completed) {
                // ✓ Đã hoàn thành — xanh mờ
                ctx.save();
                ctx.globalAlpha = 0.55;
                ctx.fillStyle = '#00ff88';
                ctx.shadowBlur = 6;
                ctx.shadowColor = '#00ff88';
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 0.9;
                ctx.fillStyle = '#fff';
                ctx.font = `bold ${Math.max(8, cs * 0.22)}px Outfit, sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('✓', cx, cy + 0.5);
                ctx.restore();
            } else {
                // Chưa hoàn thành — vàng nhấp nháy theo pulse
                const pulse = Math.sin(this.#pulseFrame * 0.1) * 0.3 + 0.7;
                const isOnStar = this.#playerX === m.x && this.#playerY === m.y;

                ctx.save();
                ctx.shadowBlur = isOnStar ? 28 * pulse : 14 * pulse;
                ctx.shadowColor = '#ffd700';
                ctx.fillStyle = isOnStar
                    ? `rgba(255,215,0,${0.7 + 0.3 * pulse})`
                    : `rgba(255,215,0,${0.55 + 0.25 * pulse})`;
                ctx.beginPath();
                ctx.arc(cx, cy, r * (isOnStar ? 1.15 : 1), 0, Math.PI * 2);
                ctx.fill();

                // Số thứ tự
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#111';
                ctx.font = `bold ${Math.max(8, cs * 0.22)}px Outfit, sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(idx + 1, cx, cy + 0.5);
                ctx.restore();
            }
        });

        // 3. Vẽ nhân vật (neon glow)
        const px = this.#playerX * cs + cs / 2;
        const py = this.#playerY * cs + cs / 2;
        const pr = cs * 0.28;
        const playerPulse = Math.sin(this.#pulseFrame * 0.08) * 0.15 + 0.85;

        ctx.save();
        ctx.shadowBlur = 22 * playerPulse;
        ctx.shadowColor = '#00f3ff';
        ctx.fillStyle = '#00f3ff';
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fill();

        // Tâm trắng
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath();
        ctx.arc(px, py, pr * 0.28, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
