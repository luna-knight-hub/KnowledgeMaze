/**
 * MAP EDITOR — MapEditor.js
 *
 * Tính năng:
 *  - Đặt cột mốc bằng click (tọa độ %)
 *  - Xoá cột mốc bằng click trong mode "delete"
 *  - Tải ảnh nền
 *  - Render visual markers nổi bật (vị trí + loại + số thứ tự)
 *  - selectMilestone() để highlight marker được chọn
 *  - clearAll(), loadDemo()
 *  - Xuất JSON / JS
 */
class MapEditor {
    #canvas;
    #ctx;
    #bgImage = null;
    #milestones = [];
    #mode = 'place';   // 'place' | 'delete'
    #selectedId = null;
    #onUpdate = null;
    #pulseFrame = 0;
    #animId = null;

    /** @param {HTMLCanvasElement} canvas */
    init(canvas, onUpdate) {
        this.#canvas = canvas;
        this.#ctx = canvas.getContext('2d');
        this.#onUpdate = onUpdate;
        this.#setupEvents();
        this.#startLoop();
    }

    // ─── Public API ──────────────────────────────────────────────

    setMode(mode) { this.#mode = mode; }

    selectMilestone(id) { this.#selectedId = id; }

    deleteMilestone(id) {
        this.#milestones = this.#milestones.filter(m => m.id !== id);
        if (this.#selectedId === id) this.#selectedId = null;
        this.#emit();
    }

    updateMilestone(id, data) {
        const idx = this.#milestones.findIndex(m => m.id === id);
        if (idx !== -1) {
            this.#milestones[idx] = { ...this.#milestones[idx], ...data };
            this.#emit();
        }
    }

    clearAll() {
        this.#milestones = [];
        this.#selectedId = null;
        this.#emit();
    }

    /**
     * Nạp một milestone từ bên ngoài (dùng khi load từ MazeLibrary).
     * Không emit cho đến khi gọi _finishLoad().
     */
    _loadMilestone(ms) {
        this.#milestones.push(ms);
    }

    /** Gọi sau khi _loadMilestone() xong để emit cập nhật UI */
    _finishLoad() {
        this.#emit();
    }

    loadImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => { this.#bgImage = img; };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    loadDemo() {
        this.#milestones = [
            {
                id: 'ms_demo_1',
                x_pct: 20, y_pct: 25,
                x: 2, y: 2,
                type: 'mcq',
                question: 'CPU là viết tắt của?',
                options: ['Central Processing Unit', 'Computer Power Unit', 'Central Power Unit', 'Computer Processing Unit'],
                correct: 0,
                points: 100,
                time: 20
            },
            {
                id: 'ms_demo_2',
                x_pct: 70, y_pct: 25,
                x: 6, y: 2,
                type: 'fill',
                question: 'RAM là viết tắt của Random Access ___?',
                correct_answers: ['Memory', 'memory'],
                points: 100,
                time: 20
            },
            {
                id: 'ms_demo_3',
                x_pct: 70, y_pct: 75,
                x: 6, y: 6,
                type: 'matching',
                question: 'Nối đúng thiết bị với chức năng:',
                pairs: [
                    { left: 'Chuột', right: 'Thiết bị nhập' },
                    { left: 'Màn hình', right: 'Thiết bị xuất' },
                    { left: 'CPU', right: 'Xử lý' }
                ],
                points: 150,
                time: 30
            },
            {
                id: 'ms_demo_4',
                x_pct: 20, y_pct: 75,
                x: 2, y: 6,
                type: 'mcq',
                question: 'Đơn vị nào nhỏ nhất của dữ liệu?',
                options: ['Byte', 'Kilobyte', 'Bit', 'Megabyte'],
                correct: 2,
                points: 100,
                time: 20
            }
        ];
        this.#selectedId = null;
        this.#emit();
    }

    getMilestones() { return [...this.#milestones]; }

    exportJSON() { return JSON.stringify({ milestones: this.#milestones }, null, 2); }

    // ─── Events ──────────────────────────────────────────────────

    #setupEvents() {
        this.#canvas.addEventListener('click', (e) => {
            const rect = this.#canvas.getBoundingClientRect();
            const xPct = ((e.clientX - rect.left) / rect.width) * 100;
            const yPct = ((e.clientY - rect.top) / rect.height) * 100;

            if (this.#mode === 'delete') {
                // Tìm marker gần nhất để xoá
                const hit = this.#hitTest(xPct, yPct);
                if (hit) this.deleteMilestone(hit.id);
                return;
            }

            // Mode place — kiểm tra không click trùng marker đã có
            const hit = this.#hitTest(xPct, yPct);
            if (hit) {
                // Select milestone đó thay vì tạo mới
                this.#selectedId = (this.#selectedId === hit.id) ? null : hit.id;
                this.#emit();
                return;
            }

            // Tạo cột mốc mới
            const id = `ms_${Date.now()}`;
            this.#milestones.push({
                id,
                x_pct: parseFloat(xPct.toFixed(2)),
                y_pct: parseFloat(yPct.toFixed(2)),
                type: 'mcq',
                question: 'Câu hỏi mới',
                options: ['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D'],
                correct: 0,
                points: 100,
                time: 20
            });
            this.#selectedId = id;
            this.#emit();
        });

        // Drag support
        let dragging = null;
        this.#canvas.addEventListener('mousedown', (e) => {
            if (this.#mode !== 'place') return;
            const rect = this.#canvas.getBoundingClientRect();
            const xPct = ((e.clientX - rect.left) / rect.width) * 100;
            const yPct = ((e.clientY - rect.top) / rect.height) * 100;
            dragging = this.#hitTest(xPct, yPct);
        });

        this.#canvas.addEventListener('mousemove', (e) => {
            if (!dragging) return;
            const rect = this.#canvas.getBoundingClientRect();
            const xPct = ((e.clientX - rect.left) / rect.width) * 100;
            const yPct = ((e.clientY - rect.top) / rect.height) * 100;
            this.updateMilestone(dragging.id, {
                x_pct: parseFloat(xPct.toFixed(2)),
                y_pct: parseFloat(yPct.toFixed(2))
            });
        });

        this.#canvas.addEventListener('mouseup', () => { dragging = null; });
    }

    /** Tìm marker trong vùng click (12px radius) */
    #hitTest(xPct, yPct) {
        const W = this.#canvas.width;
        const H = this.#canvas.height;
        const px = xPct / 100 * W;
        const py = yPct / 100 * H;
        const RADIUS = 20; // px
        return this.#milestones.find(m => {
            const mx = m.x_pct / 100 * W;
            const my = m.y_pct / 100 * H;
            return Math.hypot(px - mx, py - my) <= RADIUS;
        }) ?? null;
    }

    #emit() {
        if (this.#onUpdate) this.#onUpdate([...this.#milestones]);
    }

    // ─── Render Loop ─────────────────────────────────────────────

    #startLoop() {
        const loop = () => {
            this.#pulseFrame = (this.#pulseFrame + 1) % 120;
            this.#render();
            this.#animId = requestAnimationFrame(loop);
        };
        this.#animId = requestAnimationFrame(loop);
    }

    #render() {
        const { ctx, canvas } = { ctx: this.#ctx, canvas: this.#canvas };
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // ── Background ──
        if (this.#bgImage) {
            ctx.drawImage(this.#bgImage, 0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'rgba(6,7,20,0.35)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
            // Grid placeholder
            ctx.fillStyle = '#070819';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            const step = 40;
            ctx.strokeStyle = 'rgba(0,243,255,0.07)';
            ctx.lineWidth = 1;
            for (let x = 0; x < canvas.width; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
            for (let y = 0; y < canvas.height; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
        }

        // ── Milestones ──
        const typeColors = { mcq: '#00f3ff', image: '#ffd700', audio: '#00ff88', matching: '#ff007a', fill: '#a855f7' };
        const typeIcons = { mcq: '📝', image: '🖼', audio: '🎵', matching: '🔗', fill: '✍' };

        this.#milestones.forEach((m, i) => {
            const cx = m.x_pct / 100 * canvas.width;
            const cy = m.y_pct / 100 * canvas.height;
            const col = typeColors[m.type] ?? '#fff';
            const isSelected = m.id === this.#selectedId;
            const pulse = Math.sin(this.#pulseFrame * 0.1) * 0.25 + 0.75;
            const r = isSelected ? 22 : 18;

            ctx.save();

            // Vòng ngoài phát sáng
            ctx.shadowBlur = (isSelected ? 30 : 14) * pulse;
            ctx.shadowColor = col;
            ctx.fillStyle = col;
            ctx.globalAlpha = isSelected ? 1 : 0.85;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();

            // Vòng trong trắng
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
            ctx.fillStyle = '#0d0f24';
            ctx.beginPath();
            ctx.arc(cx, cy, r - 4, 0, Math.PI * 2);
            ctx.fill();

            // Số thứ tự
            ctx.fillStyle = col;
            ctx.font = `bold ${r - 2}px Outfit, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(i + 1, cx, cy + 0.5);

            ctx.restore();

            // Label bên dưới
            ctx.save();
            ctx.font = '11px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = '#fff';
            ctx.globalAlpha = 0.8;
            // Background pill
            const labelText = `${typeIcons[m.type] ?? '❓'} ${m.question?.substring(0, 18) ?? '...'}${m.question?.length > 18 ? '…' : ''}`;
            const tw = ctx.measureText(labelText).width;
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.globalAlpha = 0.9;
            ctx.beginPath();
            ctx.roundRect?.(cx - tw / 2 - 5, cy + r + 4, tw + 10, 16, 4);
            ctx.fill();

            ctx.fillStyle = '#e8eeff';
            ctx.globalAlpha = 1;
            ctx.fillText(labelText, cx, cy + r + 6);
            ctx.restore();

            // "SELECTED" ring
            if (isSelected) {
                ctx.save();
                ctx.strokeStyle = col;
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 3]);
                ctx.beginPath();
                ctx.arc(cx, cy, r + 7, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        });

        // Delete-mode cursor hint
        if (this.#mode === 'delete') {
            ctx.save();
            ctx.fillStyle = 'rgba(255,0,122,0.07)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.restore();
        }
    }
}
