#!/usr/bin/env python3
"""
Tạo 9 file WAV mẫu cho Knowledge Maze.
Dùng wave module (built-in) để tổng hợp âm thanh đơn giản.
Chạy: python generate_audio.py
"""
import wave, struct, math, os

OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets", "audio")
SAMPLE_RATE = 22050

def make_wav(filename, duration_s, freq_list, amplitude=0.5):
    """Tạo file WAV với chuỗi tần số."""
    filepath = os.path.join(OUT_DIR, filename)
    n_samples = int(SAMPLE_RATE * duration_s)
    seg_len = n_samples // len(freq_list) if freq_list else n_samples

    samples = []
    for i, freq in enumerate(freq_list):
        for j in range(seg_len):
            t = j / SAMPLE_RATE
            env = min(1.0, j / (seg_len * 0.05 + 1)) * min(1.0, (seg_len - j) / (seg_len * 0.1 + 1))
            val = amplitude * env * math.sin(2 * math.pi * freq * t)
            samples.append(int(val * 32767))

    while len(samples) < n_samples:
        samples.append(0)

    with wave.open(filepath, 'w') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        for s in samples[:n_samples]:
            wf.writeframes(struct.pack('<h', max(-32767, min(32767, s))))
    print(f"  ✓ {filename} ({duration_s}s)")

print("Generating audio files...")
os.makedirs(OUT_DIR, exist_ok=True)

make_wav("g3_keyboard.wav", 0.8, [800, 0, 900, 0, 700, 0, 850, 0, 750, 0, 800, 0, 900, 0, 700, 0], amplitude=0.3)
make_wav("g3_double_click.wav", 0.5, [1200, 0, 1200, 0], amplitude=0.4)
make_wav("paint_spray.wav", 1.0, [3000, 3200, 2800, 3100, 2900, 3300, 2700, 3400], amplitude=0.15)
make_wav("win_start.wav", 2.0, [392, 523, 659, 784, 1047], amplitude=0.4)
make_wav("messenger_ping.wav", 0.5, [880, 1100], amplitude=0.35)
make_wav("printer_noise.wav", 1.5, [200, 250, 200, 300, 200, 250, 200, 300, 200, 250], amplitude=0.2)
make_wav("scratch_meow.wav", 0.8, [600, 700, 800, 900, 800, 700, 600], amplitude=0.35)
make_wav("scratch_boing.wav", 0.6, [300, 600, 400, 500, 350], amplitude=0.4)
make_wav("game_win.wav", 1.5, [523, 659, 784, 1047, 1319, 1568], amplitude=0.45)

print(f"\nDone! {len(os.listdir(OUT_DIR))} audio files in {OUT_DIR}")
