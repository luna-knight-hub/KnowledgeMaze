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
    #start = { x: 1, y: 1 };  // Điểm xuất phát
    #end = null;             // Điểm kết thúc (null = chưa đặt)
    #cellSize = 0;
    #onCellEnter = null;
    #pulseFrame = 0;
    #animFrame = null;
    #playerIconImg = null;  // HTMLImageElement cho icon SVG

    /**
     * @param {HTMLCanvasElement} canvas
     * @param {Array<Array<number>>} mazeData
     * @param {function(x,y):void} onCellEnter
     * @param {Array} milestones — từ model.config.milestones (live reference để đọc completed)
     */
    init(canvas, mazeData, onCellEnter, milestones = [], start = null, end = null) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.#maze = mazeData;
        this.#onCellEnter = onCellEnter;
        this.#milestones = milestones;
        this.#start = start ?? { x: 1, y: 1 };
        this.#end = end ?? null;
        this.#cellSize = canvas.width / mazeData[0].length;
        // Đặt player về điểm start
        this.#playerX = this.#start.x;
        this.#playerY = this.#start.y;
        this.#startAnimLoop();
    }

    /**
     * Đặt icon SVG cho nhân vật.
     * @param {string|null} dataUrl - Data URL của file SVG, hoặc null để dùng neon circle
     */
    setPlayerIcon(dataUrl) {
        if (!dataUrl) {
            this.#playerIconImg = null;
            return;
        }
        const img = new Image();
        img.onload = () => { this.#playerIconImg = img; };
        img.onerror = () => { this.#playerIconImg = null; };
        img.src = dataUrl;
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
                const failed = m.result === 'wrong' || m.result === 'timeout';

                if (failed) {
                    // ✗ Sai / Hết giờ — đỏ nhấp nháy nhẹ
                    const pulse = Math.sin(this.#pulseFrame * 0.08) * 0.18 + 0.82;
                    ctx.save();

                    // Outer glow ring
                    ctx.shadowBlur = 18 * pulse;
                    ctx.shadowColor = '#ff2244';
                    ctx.globalAlpha = 0.78 * pulse;
                    ctx.fillStyle = '#cc1133';
                    ctx.beginPath();
                    ctx.arc(cx, cy, r, 0, Math.PI * 2);
                    ctx.fill();

                    // Dashed red border
                    ctx.globalAlpha = 0.9;
                    ctx.shadowBlur = 0;
                    ctx.strokeStyle = '#ff4466';
                    ctx.lineWidth = Math.max(1.5, cs * 0.045);
                    ctx.setLineDash([r * 0.55, r * 0.35]);
                    ctx.beginPath();
                    ctx.arc(cx, cy, r * 1.22, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.setLineDash([]);

                    // ✗ symbol
                    ctx.globalAlpha = 1;
                    ctx.fillStyle = '#fff';
                    ctx.shadowBlur = 0;
                    ctx.font = `bold ${Math.max(9, cs * 0.28)}px Outfit, sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('✕', cx, cy + 0.5);

                    ctx.restore();
                } else {
                    // ✓ Đúng — xanh lá mờ
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
                }
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

        // 3. Start / End portal markers
        const angle = (this.#pulseFrame / 120) * Math.PI * 2;
        if (this.#start) this.#drawPortal(this.#start.x, this.#start.y, '#00ff88', '#00cc66', 'S', angle);
        if (this.#end) this.#drawPortal(this.#end.x, this.#end.y, '#ff4466', '#cc0033', 'E', -angle);

        // 4. Nhân vật
        const px = this.#playerX * cs + cs / 2;
        const py = this.#playerY * cs + cs / 2;
        const pr = cs * 0.28;
        const playerPulse = Math.sin(this.#pulseFrame * 0.08) * 0.15 + 0.85;

        ctx.save();
        if (this.#playerIconImg) {
            // Vẽ icon SVG với glow
            const iconSize = cs * 0.72;
            ctx.shadowBlur = 18 * playerPulse;
            ctx.shadowColor = '#00f3ff';
            ctx.globalAlpha = 0.92 + 0.08 * playerPulse;
            ctx.drawImage(this.#playerIconImg,
                px - iconSize / 2, py - iconSize / 2, iconSize, iconSize);
        } else {
            // Neon circle mặc định
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
        }
        ctx.restore();
    }

    // ─── Portal helper ──────────────────────────────────────

    /**
     * Vẽ một portal vòng xoay (Start / End).
     * @param {number} gx        grid x
     * @param {number} gy        grid y
     * @param {string} fillColor màu nền
     * @param {string} ringColor màu viền xoay
     * @param {string} label     'S' hoặc 'E'
     * @param {number} angle     góc quay hiện tại (radians)
     */
    #drawPortal(gx, gy, fillColor, ringColor, label, angle) {
        const { ctx } = this;
        const cs = this.#cellSize;
        const cx = gx * cs + cs / 2;
        const cy = gy * cs + cs / 2;
        const r = cs * 0.33;
        const pulse = Math.sin(this.#pulseFrame * 0.07) * 0.12 + 0.88;

        ctx.save();

        // 1. Glow aura
        ctx.shadowBlur = 20 * pulse;
        ctx.shadowColor = fillColor;

        // 2. Filled circle
        ctx.globalAlpha = 0.82 * pulse;
        ctx.fillStyle = fillColor;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        // 3. Rotating dashed outer ring
        ctx.globalAlpha = 0.95;
        ctx.shadowBlur = 0;
        ctx.strokeStyle = ringColor;
        ctx.lineWidth = Math.max(1.5, cs * 0.045);
        ctx.setLineDash([r * 0.7, r * 0.4]);
        ctx.lineDashOffset = angle * r * 3;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 1.25, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // 4. Letter label
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.max(9, cs * 0.26)}px Outfit, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, cx, cy + 0.5);

        ctx.restore();
    }
}
