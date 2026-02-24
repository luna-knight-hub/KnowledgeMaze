#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys, io
# Force UTF-8 output on Windows so Vietnamese chars don't crash
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
"""
Knowledge Maze - Mini Backend Server
=====================================
Chạy bằng: python server.py

Yêu cầu: Python 3.8+  (không cần cài thêm gì)
  → Dùng thư viện chuẩn: http.server, json, sqlite3, datetime

Cung cấp 3 API:
  GET  /api/can-play?ip=<ip>          → Kiểm tra lượt chơi còn lại
  POST /api/register-play             → Đăng ký lượt chơi + lưu điểm
  GET  /api/leaderboard?period=today&limit=10  → Bảng xếp hạng

Database: SQLite (file km_data.db - tự tạo khi chạy lần đầu)
"""

import json
import sqlite3
import os
from datetime import datetime, date
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# ─── Cấu hình ────────────────────────────────────────────────────
PORT = 5000
DB_FILE = os.path.join(os.path.dirname(__file__), 'km_data.db')
PLAY_LIMIT_PER_DAY = 3   # Đồng bộ với config.js


# ─── Database ────────────────────────────────────────────────────
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
    conn.commit()
    return conn


def get_today():
    return date.today().isoformat()  # "2026-02-23"


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


def get_leaderboard(conn, period='today', limit=10):
    """
    period: 'today' | 'week' | 'month' | 'all'
    Trả về top scores của từng người (điểm cao nhất trong kỳ).
    """
    today = date.today()
    if period == 'today':
        where = f"WHERE day = '{today.isoformat()}'"
    elif period == 'week':
        # Thứ Hai đầu tuần
        monday = today.isocalendar()
        week_start = today.strftime('%Y-W%W')
        where = f"WHERE strftime('%Y-W%W', day) = '{week_start}'"
    elif period == 'month':
        where = f"WHERE strftime('%Y-%m', day) = '{today.strftime('%Y-%m')}'"
    else:
        where = ''

    sql = f'''
        SELECT name, grade, MAX(score) as best_score, COUNT(*) as play_count
        FROM plays
        {where}
        GROUP BY ip
        ORDER BY best_score DESC
        LIMIT {int(limit)}
    '''
    cur = conn.execute(sql)
    cols = [d[0] for d in cur.description]
    return [dict(zip(cols, row)) for row in cur.fetchall()]


# ─── HTTP Handler ─────────────────────────────────────────────────
class MazeHandler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        # Ghi log gọn hơn mặc định
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {self.address_string()} → {fmt % args}")

    def _send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', len(body))
        # CORS headers (cho phép file:// gọi từ localhost)
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

        # ── GET /api/can-play?ip=<ip> ─────────────────────────────
        if parsed.path == '/api/can-play':
            ip = params.get('ip', ['unknown'])[0]
            conn = init_db()
            plays = count_plays_today(conn, ip)
            conn.close()
            remaining = max(0, PLAY_LIMIT_PER_DAY - plays)
            self._send_json({
                'can_play': plays < PLAY_LIMIT_PER_DAY,
                'plays_today': plays,
                'remaining': remaining,
                'limit': PLAY_LIMIT_PER_DAY
            })

        # ── GET /api/leaderboard?period=today&limit=10 ────────────
        elif parsed.path == '/api/leaderboard':
            period = params.get('period', ['today'])[0]
            limit  = int(params.get('limit', [10])[0])
            conn = init_db()
            data = get_leaderboard(conn, period, limit)
            conn.close()
            self._send_json(data)

        # ── GET /api/admin/reset?secret=<key> ─────────────────────
        elif parsed.path == '/api/admin/reset':
            secret = params.get('secret', [''])[0]
            if secret == 'TEACHER_RESET_2026':
                conn = init_db()
                conn.execute("DELETE FROM plays WHERE day = ?", (get_today(),))
                conn.commit()
                conn.close()
                self._send_json({'status': 'ok', 'message': 'Đã xóa kết quả hôm nay.'})
            else:
                self._send_json({'error': 'Unauthorized'}, 403)

        else:
            self._send_json({'error': 'Not found'}, 404)

    def do_POST(self):
        parsed = urlparse(self.path)

        # ── POST /api/register-play ───────────────────────────────
        if parsed.path == '/api/register-play':
            length = int(self.headers.get('Content-Length', 0))
            body   = json.loads(self.rfile.read(length))

            ip        = body.get('ip', 'unknown')
            name      = body.get('name', 'Ẩn danh')
            grade     = body.get('grade', '')
            score     = int(body.get('score', 0))
            timestamp = body.get('timestamp', datetime.now().isoformat())

            conn = init_db()
            if can_play(conn, ip):
                register_play(conn, ip, name, grade, score, timestamp)
                plays_left = PLAY_LIMIT_PER_DAY - count_plays_today(conn, ip)
                conn.close()
                self._send_json({'status': 'ok', 'plays_remaining': plays_left})
            else:
                conn.close()
                self._send_json({
                    'status': 'limit_reached',
                    'message': f'Bạn đã dùng hết {PLAY_LIMIT_PER_DAY} lượt chơi hôm nay.'
                }, 429)
        else:
            self._send_json({'error': 'Not found'}, 404)


# ─── Entry Point ──────────────────────────────────────────────────
if __name__ == '__main__':
    init_db()
    server = HTTPServer(('0.0.0.0', PORT), MazeHandler)
    sep = '=' * 52
    print(sep)
    print('  Knowledge Maze - Backend Server')
    print(f'  Running at : http://localhost:{PORT}')
    print(f'  Play limit : {PLAY_LIMIT_PER_DAY} times/day per IP')
    print(f'  Admin reset: http://localhost:{PORT}/api/admin/reset?secret=TEACHER_RESET_2026')
    print(sep)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nServer stopped.')
