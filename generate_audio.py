#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
generate_audio.py — Tạo file WAV mẫu cho Knowledge Maze
=========================================================
Dự án   : D:/Programming/Python/KnowledgeMaze
Chạy    : python generate_audio.py
          hoặc: venv\Scripts\python generate_audio.py
"""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

import wave, struct, math, os

# ── Đường dẫn dự án (Windows) ────────────────────────────────────
PROJECT_DIR = r"D:\Programming\Python\KnowledgeMaze"
AUDIO_DIR   = os.path.join(PROJECT_DIR, "assets", "audio")

SAMPLE_RATE = 22050


def make_wav(filename, duration_s, freq_list, amplitude=0.5):
    """Tạo file WAV với chuỗi tần số nối tiếp nhau."""
    filepath = os.path.join(AUDIO_DIR, filename)
    n_samples = int(SAMPLE_RATE * duration_s)
    seg_len = n_samples // len(freq_list) if freq_list else n_samples

    samples = []
    for freq in freq_list:
        for j in range(seg_len):
            t = j / SAMPLE_RATE
            # Envelope: fade-in nhanh + fade-out nhẹ
            env = min(1.0, j / (seg_len * 0.05 + 1)) * min(1.0, (seg_len - j) / (seg_len * 0.1 + 1))
            val = amplitude * env * math.sin(2 * math.pi * freq * t)
            samples.append(int(val * 32767))

    # Đệm thêm nếu thiếu
    while len(samples) < n_samples:
        samples.append(0)

    with wave.open(filepath, 'w') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        for s in samples[:n_samples]:
            wf.writeframes(struct.pack('<h', max(-32767, min(32767, s))))

    size_kb = os.path.getsize(filepath) / 1024
    print(f"  ✓ {filename:<25s} {duration_s}s  {size_kb:.1f} KB")


# ── Main ──────────────────────────────────────────────────────────
if __name__ == '__main__':
    print(f"Du an   : {PROJECT_DIR}")
    print(f"Audio   : {AUDIO_DIR}")
    print()

    os.makedirs(AUDIO_DIR, exist_ok=True)

    print("Dang tao file am thanh mau...")
    print("-" * 50)

    # 1. Lớp 3 Dễ — tiếng gõ bàn phím
    make_wav("g3_keyboard.wav",     0.8,
             [800, 0, 900, 0, 700, 0, 850, 0, 750, 0, 800, 0, 900, 0, 700, 0],
             amplitude=0.3)

    # 2. Lớp 3 TB — tiếng nháy đúp chuột
    make_wav("g3_double_click.wav", 0.5,
             [1200, 0, 1200, 0],
             amplitude=0.4)

    # 3. Lớp 3 Khó — tiếng bình xịt Paint
    make_wav("paint_spray.wav",     1.0,
             [3000, 3200, 2800, 3100, 2900, 3300, 2700, 3400],
             amplitude=0.15)

    # 4. Lớp 4 Dễ — tiếng khởi động Windows
    make_wav("win_start.wav",       2.0,
             [392, 523, 659, 784, 1047],
             amplitude=0.4)

    # 5. Lớp 4 TB — tiếng ping tin nhắn
    make_wav("messenger_ping.wav",  0.5,
             [880, 1100],
             amplitude=0.35)

    # 6. Lớp 4 Khó — tiếng máy in
    make_wav("printer_noise.wav",   1.5,
             [200, 250, 200, 300, 200, 250, 200, 300, 200, 250],
             amplitude=0.2)

    # 7. Lớp 5 Dễ — tiếng mèo Scratch
    make_wav("scratch_meow.wav",    0.8,
             [600, 700, 800, 900, 800, 700, 600],
             amplitude=0.35)

    # 8. Lớp 5 TB — tiếng boing (nhảy)
    make_wav("scratch_boing.wav",   0.6,
             [300, 600, 400, 500, 350],
             amplitude=0.4)

    # 9. Lớp 5 Khó — tiếng chiến thắng game
    make_wav("game_win.wav",        1.5,
             [523, 659, 784, 1047, 1319, 1568],
             amplitude=0.45)

    print("-" * 50)
    total = len([f for f in os.listdir(AUDIO_DIR) if f.endswith('.wav')])
    print(f"\nHoan tat! Da tao {total} file WAV trong:")
    print(f"  {AUDIO_DIR}")
