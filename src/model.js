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
            milestones: config.milestones.map(m => ({ ...m, completed: false }))
        };
        this.player = { x: 1, y: 1 };
        this.score = 0;
        this.isLocked = false;
        this.maxPlays = config.settings.play_limit_per_day;
        this.startTime = new Date(config.settings.competition_window.start);
        this.endTime = new Date(config.settings.competition_window.end);
    }

    checkStatus() {
        const now = new Date();
        if (now < this.startTime || now > this.endTime) {
            this.isLocked = true;
            return 'LOCKED';
        }
        return 'ACTIVE';
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
