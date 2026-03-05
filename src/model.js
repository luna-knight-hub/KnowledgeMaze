/**
 * MODEL: Quản lý dữ liệu và trạng thái trò chơi
 *
 * FIX: Deep-clone milestones để reset completed state mỗi lượt chơi mới.
 * Tránh tình trạng config.js bị mutate, gây lỗi hoàn thành giả sau lượt 1.
 */
class GameModel {
    constructor(config) {
        // Deep-clone toàn bộ config để tránh mutate object gốc
        this.config = {
            ...config,
            milestones: config.milestones.map(m => ({ ...m, completed: false })),
            start: config.start ? { ...config.start } : { x: 1, y: 1 },
            end: config.end ? { ...config.end } : null,
        };
        // Player bắt đầu tại điểm Start (hoặc (1,1) nếu chưa đặt)
        this.player = { ...this.config.start };
        this.score = 0;
        this.isLocked = false;
        this.maxPlays = config.settings.play_limit_per_day;
        this.startTime = new Date(config.settings.competition_window.start);
        this.endTime = new Date(config.settings.competition_window.end);
    }

    checkStatus() {
        const now = new Date();
        if (now < this.startTime) {
            this.isLocked = true;
            return 'BEFORE';   // Chưa đến giờ — hiển thị đếm ngược
        }
        if (now > this.endTime) {
            this.isLocked = true;
            return 'ENDED';    // Đã hết giờ — khóa vĩnh viễn
        }
        return 'ACTIVE';       // Trong cửa sổ thi
    }

    /** Số giây còn lại đến khi bắt đầu (nếu BEFORE) */
    secondsUntilStart() {
        return Math.max(0, Math.floor((this.startTime - new Date()) / 1000));
    }

    /** Số giây còn lại đến khi kết thúc (nếu ACTIVE) */
    secondsUntilEnd() {
        return Math.max(0, Math.floor((this.endTime - new Date()) / 1000));
    }

    movePlayer(dx, dy) {
        if (this.isLocked) return false;
        const nx = this.player.x + dx;
        const ny = this.player.y + dy;
        if (this.config.maze[ny]?.[nx] === 0) {
            this.player.x = nx;
            this.player.y = ny;
            return true;
        }
        return false;
    }

    /** Trả về true nếu player đang đứng tại điểm End */
    isAtEnd() {
        if (!this.config.end) return false;
        return this.player.x === this.config.end.x && this.player.y === this.config.end.y;
    }

    getMilestoneAtCurrentPos() {
        return this.config.milestones.find(
            m => m.x === this.player.x && m.y === this.player.y
        );
    }

    /** Trả về tổng số milestone và số đã hoàn thành */
    getProgress() {
        const total = this.config.milestones.length;
        const done = this.config.milestones.filter(m => m.completed).length;
        return { total, done };
    }

    calculatePoints(timeRemaining, totalTime, maxPoints) {
        const ratio = Math.max(0, timeRemaining / totalTime);
        const points = Math.floor(maxPoints * (0.4 + 0.6 * ratio)); // Tối thiểu 40%
        return Math.max(10, points);
    }
}
