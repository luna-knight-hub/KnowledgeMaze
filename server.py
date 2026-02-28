#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys, io
# Force UTF-8 output on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
"""
Knowledge Maze — Competition Backend  v2
==========================================
Chạy: python server.py

API (v2):
  GET  /api/competition-status          → trạng thái cửa sổ thi (before/active/ended)
  GET  /api/can-play?ip=<ip>            → kiểm tra lượt còn lại
  POST /api/register-play               → đăng ký lượt + lưu điểm
  GET  /api/leaderboard?period=&limit=  → bảng xếp hạng (SUM điểm, mỗi IP 1 dòng)
  POST /api/admin/reset                 → xóa kết quả (manual only, cần secret)

Quy tắc quan trọng:
  • Leaderboard dùng SUM(score) GROUP BY ip — tích lũy qua các lượt.
  • KHÔNG tự động reset khi hết giờ. Chỉ reset khi teacher gọi /api/admin/reset.
  • Cửa sổ thi đọc từ config.js (nếu có) hoặc dùng giá trị mặc định.
"""

import json, sqlite3, os
from datetime import datetime, date, timezone, timedelta
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# ─── Cấu hình ──────────────────────────────────────────────────────
PORT             = 5000
DB_FILE          = os.path.join(os.path.dirname(__file__), 'km_data.db')
PLAY_LIMIT_PER_DAY = 3
ADMIN_SECRET     = 'TEACHER_RESET_2026'   # đổi trong teacher-config.js nếu cần

# Cửa sổ thi mặc định (được ghi đè bởi config.js trên frontend)
# — Dùng khi không có config.js hoặc server cần tự xác định status.
DEFAULT_COMP_START = '2026-02-22T08:00:00'
DEFAULT_COMP_END   = '2026-12-31T23:59:00'


# ─── Database ──────────────────────────────────────────────────────
def init_db():
    conn = sqlite3.connect(DB_FILE)
    conn.execute('''
        CREATE TABLE IF NOT EXISTS plays (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            ip        TEXT NOT NULL,
            name      TEXT NOT NULL,
            grade     TEXT,
            score     INTEGER DEFAULT 0,
            timestamp TEXT NOT NULL,
            day       TEXT NOT NULL
        )
    ''')
    # Bảng lưu cửa sổ thi (teacher có thể cập nhật qua API)
    conn.execute('''
        CREATE TABLE IF NOT EXISTS competition_config (
            key   TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
    ''')
    conn.commit()
    return conn


def get_today():
    return date.today().isoformat()


def count_plays_today(conn, ip):
    cur = conn.execute(
        'SELECT COUNT(*) FROM plays WHERE ip=? AND day=?',
        (ip, get_today())
    )
    return cur.fetchone()[0]


def can_play(conn, ip):
    return count_plays_today(conn, ip) < PLAY_LIMIT_PER_DAY


def register_play(conn, ip, name, grade, score, timestamp):
    conn.execute(
        'INSERT INTO plays (ip, name, grade, score, timestamp, day) VALUES (?,?,?,?,?,?)',
        (ip, name, grade or '', score, timestamp, get_today())
    )
    conn.commit()


# ── Leaderboard — SUM(score) per IP ───────────────────────────────
def get_leaderboard(conn, period='today', limit=10):
    """
    Trả về tổng điểm tích lũy (SUM) của mỗi IP trong khoảng thời gian.
    Sắp xếp giảm dần. Mỗi IP chỉ xuất hiện 1 dòng (lấy tên từ lần chơi cuối).

    period: 'today' | 'week' | 'month' | 'all'
    """
    today = date.today()
    if period == 'today':
        where = f"WHERE day = '{today.isoformat()}'"
    elif period == 'week':
        week_start = today.strftime('%Y-W%W')
        where = f"WHERE strftime('%Y-W%W', day) = '{week_start}'"
    elif period == 'month':
        where = f"WHERE strftime('%Y-%m', day) = '{today.strftime('%Y-%m')}'"
    else:
        where = ''

    # SUM điểm, lấy tên + grade từ bản ghi mới nhất của mỗi IP
    sql = f'''
        SELECT
            p.name,
            p.grade,
            SUM(p.score)          AS total_score,
            COUNT(p.id)           AS play_count,
            MAX(p.timestamp)      AS last_play
        FROM plays p
        INNER JOIN (
            SELECT ip, MAX(timestamp) AS max_ts
            FROM plays
            {where}
            GROUP BY ip
        ) latest ON p.ip = latest.ip AND p.timestamp = latest.max_ts
        {where}
        GROUP BY p.ip
        ORDER BY total_score DESC
        LIMIT {int(limit)}
    '''
    try:
        cur = conn.execute(sql)
        cols = [d[0] for d in cur.description]
        return [dict(zip(cols, row)) for row in cur.fetchall()]
    except Exception:
        # Fallback đơn giản hơn nếu JOIN phức tạp lỗi
        sql2 = f'''
            SELECT name, grade, SUM(score) AS total_score, COUNT(*) AS play_count
            FROM plays {where}
            GROUP BY ip
            ORDER BY total_score DESC
            LIMIT {int(limit)}
        '''
        cur = conn.execute(sql2)
        cols = [d[0] for d in cur.description]
        return [dict(zip(cols, row)) for row in cur.fetchall()]


# ── Competition status ─────────────────────────────────────────────
def get_competition_status(conn, start_str=None, end_str=None):
    """
    Trả về dict: { status, start, end, now, seconds_until_start, seconds_until_end }
    status: 'before' | 'active' | 'ended'
    """
    # Đọc từ DB nếu teacher đã cập nhật
    if start_str is None:
        row = conn.execute("SELECT value FROM competition_config WHERE key='start'").fetchone()
        start_str = row[0] if row else DEFAULT_COMP_START
    if end_str is None:
        row = conn.execute("SELECT value FROM competition_config WHERE key='end'").fetchone()
        end_str = row[0] if row else DEFAULT_COMP_END

    now = datetime.now()
    try:
        start_dt = datetime.fromisoformat(start_str)
        end_dt   = datetime.fromisoformat(end_str)
    except ValueError:
        start_dt = datetime.fromisoformat(DEFAULT_COMP_START)
        end_dt   = datetime.fromisoformat(DEFAULT_COMP_END)

    if now < start_dt:
        status = 'before'
    elif now > end_dt:
        status = 'ended'
    else:
        status = 'active'

    return {
        'status': status,
        'start':  start_dt.isoformat(),
        'end':    end_dt.isoformat(),
        'now':    now.isoformat(),
        'seconds_until_start': max(0, int((start_dt - now).total_seconds())),
        'seconds_until_end':   max(0, int((end_dt   - now).total_seconds())),
    }


# ─── HTTP Handler ──────────────────────────────────────────────────
class MazeHandler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {self.address_string()} → {fmt % args}")

    def _send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', len(body))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self._send_json({})

    def do_GET(self):
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)

        # ── GET /api/competition-status ───────────────────────────
        if parsed.path == '/api/competition-status':
            start = params.get('start', [None])[0]
            end   = params.get('end',   [None])[0]
            conn  = init_db()
            data  = get_competition_status(conn, start, end)
            conn.close()
            self._send_json(data)

        # ── GET /api/can-play?ip=<ip> ─────────────────────────────
        elif parsed.path == '/api/can-play':
            ip   = params.get('ip', ['unknown'])[0]
            conn = init_db()
            plays     = count_plays_today(conn, ip)
            comp_info = get_competition_status(conn)
            conn.close()
            remaining = max(0, PLAY_LIMIT_PER_DAY - plays)
            self._send_json({
                'can_play':          plays < PLAY_LIMIT_PER_DAY and comp_info['status'] == 'active',
                'plays_today':       plays,
                'remaining':         remaining,
                'limit':             PLAY_LIMIT_PER_DAY,
                'competition_status': comp_info['status'],
            })

        # ── GET /api/leaderboard?period=today&limit=10 ────────────
        elif parsed.path == '/api/leaderboard':
            period = params.get('period', ['today'])[0]
            limit  = int(params.get('limit', [20])[0])
            conn   = init_db()
            data   = get_leaderboard(conn, period, limit)
            conn.close()
            self._send_json(data)

        else:
            self._send_json({'error': 'Not found'}, 404)

    def do_POST(self):
        parsed = urlparse(self.path)
        length = int(self.headers.get('Content-Length', 0))
        body   = json.loads(self.rfile.read(length)) if length else {}

        # ── POST /api/register-play ───────────────────────────────
        if parsed.path == '/api/register-play':
            ip        = body.get('ip',        'unknown')
            name      = body.get('name',      'Ẩn danh')
            grade     = body.get('grade',     '')
            score     = int(body.get('score', 0))
            timestamp = body.get('timestamp', datetime.now().isoformat())

            conn      = init_db()
            comp_info = get_competition_status(conn)

            # Khóa nếu ngoài cửa sổ thi
            if comp_info['status'] != 'active':
                conn.close()
                self._send_json({
                    'status':  'competition_locked',
                    'message': f"Cuộc thi {comp_info['status']}. Không thể lưu điểm.",
                    'competition_status': comp_info['status'],
                }, 403)
                return

            if can_play(conn, ip):
                register_play(conn, ip, name, grade, score, timestamp)
                plays_left = PLAY_LIMIT_PER_DAY - count_plays_today(conn, ip)
                conn.close()
                self._send_json({'status': 'ok', 'plays_remaining': plays_left})
            else:
                conn.close()
                self._send_json({
                    'status':  'limit_reached',
                    'message': f'Đã hết {PLAY_LIMIT_PER_DAY} lượt hôm nay.',
                }, 429)

        # ── POST /api/admin/reset ─────────────────────────────────
        elif parsed.path == '/api/admin/reset':
            secret = body.get('secret', '')
            period = body.get('period', 'today')   # 'today' | 'all'

            if secret != ADMIN_SECRET:
                self._send_json({'error': 'Unauthorized'}, 403)
                return

            conn = init_db()
            if period == 'all':
                conn.execute('DELETE FROM plays')
                msg = 'Đã xóa TOÀN BỘ kết quả.'
            else:
                conn.execute('DELETE FROM plays WHERE day = ?', (get_today(),))
                msg = f'Đã xóa kết quả ngày {get_today()}.'
            conn.commit()
            deleted = conn.execute('SELECT changes()').fetchone()[0]
            conn.close()
            self._send_json({'status': 'ok', 'message': msg, 'deleted_rows': deleted})

        # ── POST /api/admin/set-window ────────────────────────────
        elif parsed.path == '/api/admin/set-window':
            secret = body.get('secret', '')
            if secret != ADMIN_SECRET:
                self._send_json({'error': 'Unauthorized'}, 403)
                return
            start = body.get('start')
            end   = body.get('end')
            conn  = init_db()
            if start:
                conn.execute("INSERT OR REPLACE INTO competition_config (key,value) VALUES ('start',?)", (start,))
            if end:
                conn.execute("INSERT OR REPLACE INTO competition_config (key,value) VALUES ('end',?)",   (end,))
            conn.commit()
            conn.close()
            self._send_json({'status': 'ok', 'start': start, 'end': end})

        else:
            self._send_json({'error': 'Not found'}, 404)


# ─── Entry Point ───────────────────────────────────────────────────
if __name__ == '__main__':
    init_db()
    server = HTTPServer(('0.0.0.0', PORT), MazeHandler)
    sep = '=' * 58
    print(sep)
    print('  Knowledge Maze — Competition Backend  v2')
    print(f'  URL         : http://localhost:{PORT}')
    print(f'  Play limit  : {PLAY_LIMIT_PER_DAY} lượt/ngày/IP')
    print(f'  Admin reset : POST /api/admin/reset  {{secret, period}}')
    print(f'  Set window  : POST /api/admin/set-window {{secret, start, end}}')
    print(sep)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nServer đã dừng.')
