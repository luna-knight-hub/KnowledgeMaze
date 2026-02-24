/**
 * SOUND MANAGER — Web Audio API Edition
 * ═══════════════════════════════════════
 * Mọi âm thanh được tổng hợp 100% bằng Web Audio API.
 * Không cần file mp3/ogg. Hoạt động offline hoàn toàn.
 *
 * SFX bank:
 *   'click'     – nút bấm nhẹ
 *   'select'    – chọn maze / màn hình
 *   'move'      – di chuyển nhân vật
 *   'milestone' – chạm đến cột mốc câu hỏi
 *   'quizOpen'  – quiz overlay xuất hiện
 *   'correct'   – trả lời đúng
 *   'wrong'     – trả lời sai
 *   'timeout'   – hết giờ
 *   'victory'   – hoàn thành mê cung
 *   'reward'    – nhận điểm thưởng
 *
 * BGM: nhạc nền C-pentatonic (melody + bass + pad), lặp vô hạn.
 */
class SoundManager {
    // ── Private state ────────────────────────────────────────────
    static #ctx = null;
    static #masterGain = null;
    static #bgmGain = null;
    static #sfxGain = null;

    static #bgmEnabled = true;
    static #sfxEnabled = true;
    static #bgmRunning = false;

    // BGM scheduler
    static #schedTimer = null;
    static #nextTime = 0;
    static #beatIndex = 0;

    static STORAGE_KEY = 'km_audio_prefs';

    // ── Notes (Hz) ───────────────────────────────────────────────
    static #N = {
        C3: 130.81, E3: 164.81, G3: 196.00, A3: 220.00,
        C4: 261.63, D4: 293.66, E4: 329.63, G4: 392.00, A4: 440.00,
        C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.00,
        C6: 1046.50, D6: 1174.66, E6: 1318.51,
        R: 0   // rest
    };

    // BGM at 120 BPM — quarter note = 0.5 s
    // 16 beats = 4 bars, repeating loop
    static #BPM = 120;
    static #BEAT = 60 / 120;         // 0.5 s per quarter note
    static #NOTE_DUR = 60 / 120 * 0.5;  // 8th note duration

    // Melody pattern (8th notes, 32 slots = 4 bars)
    static #MEL = [
        // Bar 1 – going up
        'E5', 'G5', 'A5', 'G5', 'E5', 'D5', 'C5', 'D5',
        // Bar 2 – going higher
        'E5', 'G5', 'A5', 'C6', 'A5', 'G5', 'E5', 'D5',
        // Bar 3 – joyful lift
        'C5', 'E5', 'G5', 'A5', 'G5', 'E5', 'D5', 'C5',
        // Bar 4 – tension & resolve
        'D5', 'E5', 'G5', 'E5', 'D5', 'C5', 'A4', 'G4',
    ];

    // Bass pattern (quarter notes, 16 slots)
    static #BASS = [
        'C3', 'C3', 'G3', 'G3',
        'A3', 'A3', 'E3', 'E3',
        'C3', 'C3', 'G3', 'G3',
        'A3', 'E3', 'G3', 'C3',
    ];

    // Pad chords (every 2 bars = 8 8th-notes)
    static #PADS = [
        ['C4', 'E4', 'G4'],   // C major
        ['A3', 'C4', 'E4'],   // A minor
        ['G3', 'B3', 'D4'],   // G major (use B3 ≈ 246.94)
        ['C4', 'E4', 'G4'],   // C major
    ];

    // ── Initialise AudioContext ───────────────────────────────────

    static #ensureCtx() {
        if (SoundManager.#ctx) return SoundManager.#ctx;

        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;

        const ctx = new Ctx();
        SoundManager.#ctx = ctx;

        // Master
        const master = ctx.createGain();
        master.gain.value = 0.85;
        master.connect(ctx.destination);
        SoundManager.#masterGain = master;

        // BGM bus (compressor for smooth loudness)
        const comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -18;
        comp.ratio.value = 4;
        comp.connect(master);

        const bgm = ctx.createGain();
        bgm.gain.value = 0.22;
        bgm.connect(comp);
        SoundManager.#bgmGain = bgm;

        // SFX bus
        const sfx = ctx.createGain();
        sfx.gain.value = 0.75;
        sfx.connect(master);
        SoundManager.#sfxGain = sfx;

        return ctx;
    }

    // ── Helper: play a tone on a bus ─────────────────────────────

    /**
     * @param {number} freq       Hz (0 = silent/rest)
     * @param {number} startTime  AudioContext time
     * @param {number} duration   seconds
     * @param {string} type       OscillatorType
     * @param {number} gain       0-1
     * @param {GainNode} bus      which bus to connect to
     * @param {number} attack     attack time in seconds
     * @param {number} release    release time in seconds
     * @param {number} filterHz   if >0, apply lowpass at this freq
     */
    static #tone(freq, startTime, duration, type = 'sine',
        gain = 0.5, bus = null, attack = 0.01,
        release = 0.05, filterHz = 0) {
        const ctx = SoundManager.#ensureCtx();
        if (!ctx || freq <= 0) return;
        bus = bus ?? SoundManager.#sfxGain;

        const osc = ctx.createOscillator();
        const env = ctx.createGain();

        osc.type = type;
        osc.frequency.value = freq;

        // Envelope
        env.gain.setValueAtTime(0, startTime);
        env.gain.linearRampToValueAtTime(gain, startTime + attack);
        env.gain.setValueAtTime(gain, startTime + duration - release);
        env.gain.linearRampToValueAtTime(0, startTime + duration);

        if (filterHz > 0) {
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = filterHz;
            osc.connect(filter);
            filter.connect(env);
        } else {
            osc.connect(env);
        }

        env.connect(bus);
        osc.start(startTime);
        osc.stop(startTime + duration);
    }

    /** White noise burst (for sfx) */
    static #noise(startTime, duration, gain = 0.3, filterHz = 1000) {
        const ctx = SoundManager.#ensureCtx();
        if (!ctx) return;

        const bufSize = ctx.sampleRate * duration;
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

        const src = ctx.createBufferSource();
        const filter = ctx.createBiquadFilter();
        const env = ctx.createGain();

        src.buffer = buf;
        filter.type = 'bandpass';
        filter.frequency.value = filterHz;
        filter.Q.value = 1;

        env.gain.setValueAtTime(gain, startTime);
        env.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        src.connect(filter);
        filter.connect(env);
        env.connect(SoundManager.#sfxGain);
        src.start(startTime);
    }

    // ═══════════════════════════════════════════════════════════════
    //  SFX BANK
    // ═══════════════════════════════════════════════════════════════

    static #SFX = {

        /** Nhẹ nhàng — nút bấm */
        click() {
            const ctx = SoundManager.#ensureCtx(); if (!ctx) return;
            const t = ctx.currentTime;
            SoundManager.#tone(800, t, 0.04, 'sine', 0.25, null, 0.002, 0.02);
            SoundManager.#tone(600, t + 0.02, 0.04, 'sine', 0.15, null, 0.002, 0.02);
        },

        /** Chọn maze — sparkle ascending */
        select() {
            const ctx = SoundManager.#ensureCtx(); if (!ctx) return;
            const t = ctx.currentTime;
            const notes = [523.25, 659.25, 783.99, 1046.50];
            notes.forEach((f, i) =>
                SoundManager.#tone(f, t + i * 0.06, 0.12, 'triangle', 0.3, null, 0.005, 0.06)
            );
        },

        /** Di chuyển — tap nhẹ */
        move() {
            const ctx = SoundManager.#ensureCtx(); if (!ctx) return;
            const t = ctx.currentTime;
            SoundManager.#tone(220, t, 0.06, 'sine', 0.12, null, 0.001, 0.04, 400);
        },

        /** Chạm cột mốc — chime rung */
        milestone() {
            const ctx = SoundManager.#ensureCtx(); if (!ctx) return;
            const t = ctx.currentTime;
            SoundManager.#tone(880, t, 0.3, 'sine', 0.35, null, 0.005, 0.2);
            SoundManager.#tone(1108, t + 0.05, 0.3, 'sine', 0.20, null, 0.005, 0.2);
            SoundManager.#tone(1320, t + 0.10, 0.3, 'triangle', 0.15, null, 0.005, 0.2);
        },

        /** Quiz xuất hiện — swoosh */
        quizOpen() {
            const ctx = SoundManager.#ensureCtx(); if (!ctx) return;
            const t = ctx.currentTime;
            const osc = ctx.createOscillator();
            const env = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, t);
            osc.frequency.exponentialRampToValueAtTime(600, t + 0.25);
            env.gain.setValueAtTime(0.3, t);
            env.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(500, t);
            filter.frequency.exponentialRampToValueAtTime(2000, t + 0.25);
            osc.connect(filter); filter.connect(env);
            env.connect(SoundManager.#sfxGain);
            osc.start(t); osc.stop(t + 0.4);
        },

        /** Đúng — fanfare nhỏ vui tươi */
        correct() {
            const ctx = SoundManager.#ensureCtx(); if (!ctx) return;
            const t = ctx.currentTime;
            const chordNotes = [
                [523.25, 0.00],  // C5
                [659.25, 0.08],  // E5
                [783.99, 0.16],  // G5
                [1046.50, 0.24], // C6
            ];
            chordNotes.forEach(([f, delay]) =>
                SoundManager.#tone(f, t + delay, 0.45, 'triangle', 0.35, null, 0.01, 0.15)
            );
            // Sparkle on top
            SoundManager.#tone(1567.98, t + 0.32, 0.2, 'sine', 0.2, null, 0.005, 0.1);
        },

        /** Sai — tone thấp buồn */
        wrong() {
            const ctx = SoundManager.#ensureCtx(); if (!ctx) return;
            const t = ctx.currentTime;
            SoundManager.#tone(220, t, 0.25, 'sawtooth', 0.25, null, 0.01, 0.15, 800);
            SoundManager.#tone(196, t + 0.20, 0.30, 'sawtooth', 0.20, null, 0.01, 0.20, 600);
        },

        /** Hết giờ — clock descend */
        timeout() {
            const ctx = SoundManager.#ensureCtx(); if (!ctx) return;
            const t = ctx.currentTime;
            const falling = [440, 392, 349.23, 293.66, 261.63];
            falling.forEach((f, i) =>
                SoundManager.#tone(f, t + i * 0.12, 0.18, 'sine', 0.28, null, 0.005, 0.1)
            );
        },

        /** Hoàn thành mê cung — chiến thắng hoành tráng */
        victory() {
            const ctx = SoundManager.#ensureCtx(); if (!ctx) return;
            const t = ctx.currentTime;
            // Fanfare: trill, then big chord
            const fanfare = [
                [523.25, 0.00, 0.15, 'triangle', 0.4],
                [659.25, 0.15, 0.15, 'triangle', 0.4],
                [783.99, 0.30, 0.20, 'triangle', 0.4],
                [1046.50, 0.50, 0.60, 'triangle', 0.45],
                // Big chord at the end
                [523.25, 0.50, 0.70, 'sine', 0.25],
                [659.25, 0.50, 0.70, 'sine', 0.20],
                [783.99, 0.50, 0.70, 'sine', 0.18],
                // High sparkle
                [2093.00, 0.52, 0.35, 'sine', 0.18],
                [2637.02, 0.60, 0.30, 'sine', 0.12],
                [3136.00, 0.68, 0.25, 'sine', 0.10],
            ];
            fanfare.forEach(([f, d, dur, type, g]) =>
                SoundManager.#tone(f, t + d, dur, type, g, null, 0.01, 0.15)
            );
        },

        /** Nhận điểm — coin sparkle */
        reward() {
            const ctx = SoundManager.#ensureCtx(); if (!ctx) return;
            const t = ctx.currentTime;
            const sparkle = [1318.51, 1567.98, 1760, 2093, 1760, 1318.51];
            sparkle.forEach((f, i) =>
                SoundManager.#tone(f, t + i * 0.055, 0.09, 'triangle', 0.28, null, 0.003, 0.05)
            );
        },
    };

    // ═══════════════════════════════════════════════════════════════
    //  BGM SCHEDULER  (C pentatonic, 120 BPM, 4-bar loop)
    // ═══════════════════════════════════════════════════════════════

    static #scheduleBGM() {
        const ctx = SoundManager.#ctx;
        if (!ctx || !SoundManager.#bgmRunning) return;

        const LOOKAHEAD = 0.1;   // seconds to look ahead
        const INTERVAL = 0.025; // scheduler interval (ms * 1000 not needed, setTimeout)
        const HALF_BEAT = SoundManager.#BEAT * 0.5; // 8th note duration
        const TOTAL_8THS = SoundManager.#MEL.length; // 32 slots
        const bus = SoundManager.#bgmGain;
        const N = SoundManager.#N;

        function schedule() {
            while (SoundManager.#nextTime < ctx.currentTime + LOOKAHEAD) {
                const beat8 = SoundManager.#beatIndex % TOTAL_8THS;
                const t = SoundManager.#nextTime;

                // ── Melody (8th notes, triangle wave)
                const melNote = N[SoundManager.#MEL[beat8]] ?? 0;
                if (melNote > 0) {
                    SoundManager.#tone(melNote, t, HALF_BEAT * 0.75,
                        'triangle', 0.55, bus, 0.008, 0.08);
                }

                // ── Bass (quarter notes = every 2 x 8th notes)
                if (beat8 % 2 === 0) {
                    const bassNote = N[SoundManager.#BASS[Math.floor(beat8 / 2) % 16]] ?? 0;
                    if (bassNote > 0) {
                        SoundManager.#tone(bassNote, t, SoundManager.#BEAT * 0.85,
                            'sine', 0.60, bus, 0.015, 0.12, 300);
                    }
                }

                // ── Pad (every 8 8th-notes = every 2 bars)
                if (beat8 % 8 === 0) {
                    const padIdx = Math.floor(beat8 / 8) % SoundManager.#PADS.length;
                    const chordHz = SoundManager.#PADS[padIdx]
                        .map(name => N[name] ?? 0)
                        .filter(f => f > 0);
                    chordHz.forEach(f =>
                        SoundManager.#tone(f, t, SoundManager.#BEAT * 4 * 0.90,
                            'sine', 0.18, bus, 0.25, 0.50)
                    );
                }

                // ── Subtle hi-hat (every 2 8th notes)
                if (beat8 % 2 === 0) {
                    SoundManager.#noise(t, 0.04, 0.08, 8000);
                }

                SoundManager.#nextTime += HALF_BEAT;
                SoundManager.#beatIndex++;
            }

            SoundManager.#schedTimer = setTimeout(schedule, INTERVAL * 1000);
        }

        schedule();
    }

    // ═══════════════════════════════════════════════════════════════
    //  PUBLIC API
    // ═══════════════════════════════════════════════════════════════

    /** Phải gọi sau gesture đầu tiên của người dùng */
    static init() {
        SoundManager.#loadPrefs();
        // AudioContext sẽ được tạo khi user tương tác lần đầu
    }

    /**
     * Phát một hiệu ứng âm thanh.
     * @param {string} name  Tên sfx trong #SFX bank
     */
    static play(name) {
        if (!SoundManager.#sfxEnabled) return;
        const sfx = SoundManager.#SFX[name];
        if (!sfx) return;
        try {
            SoundManager.#ensureCtx();
            if (SoundManager.#ctx?.state === 'suspended') {
                SoundManager.#ctx.resume().then(() => sfx());
            } else {
                sfx();
            }
        } catch (e) { /* ignore audio errors */ }
    }

    /** Bắt đầu nhạc nền */
    static startBGM() {
        if (!SoundManager.#bgmEnabled) return;
        if (SoundManager.#bgmRunning) return;

        const ctx = SoundManager.#ensureCtx();
        if (!ctx) return;

        const resume = () => {
            SoundManager.#bgmRunning = true;
            SoundManager.#nextTime = ctx.currentTime + 0.05;
            SoundManager.#beatIndex = 0;
            SoundManager.#scheduleBGM();
            SoundManager.#updateUI();
        };

        if (ctx.state === 'suspended') {
            ctx.resume().then(resume);
        } else {
            resume();
        }
    }

    /** Dừng nhạc nền */
    static stopBGM() {
        SoundManager.#bgmRunning = false;
        clearTimeout(SoundManager.#schedTimer);
        SoundManager.#schedTimer = null;
        SoundManager.#updateUI();
    }

    /** Toggle nhạc nền */
    static toggleBGM() {
        SoundManager.#bgmEnabled = !SoundManager.#bgmEnabled;
        if (SoundManager.#bgmEnabled) {
            SoundManager.startBGM();
        } else {
            SoundManager.stopBGM();
        }
        SoundManager.#savePrefs();
        SoundManager.#updateUI();
    }

    /** Toggle hiệu ứng âm thanh */
    static toggleSFX() {
        SoundManager.#sfxEnabled = !SoundManager.#sfxEnabled;
        SoundManager.#savePrefs();
        SoundManager.#updateUI();
        if (SoundManager.#sfxEnabled) SoundManager.play('click');
    }

    static get bgmEnabled() { return SoundManager.#bgmEnabled; }
    static get sfxEnabled() { return SoundManager.#sfxEnabled; }

    // ── Persistence ──────────────────────────────────────────────

    static #savePrefs() {
        localStorage.setItem(SoundManager.STORAGE_KEY, JSON.stringify({
            bgm: SoundManager.#bgmEnabled,
            sfx: SoundManager.#sfxEnabled,
        }));
    }

    static #loadPrefs() {
        try {
            const p = JSON.parse(localStorage.getItem(SoundManager.STORAGE_KEY) || '{}');
            if (p.bgm != null) SoundManager.#bgmEnabled = Boolean(p.bgm);
            if (p.sfx != null) SoundManager.#sfxEnabled = Boolean(p.sfx);
        } catch (_) { }
    }

    // ── UI sync ──────────────────────────────────────────────────

    static #updateUI() {
        const bgmBtn = document.getElementById('audio-bgm-btn');
        const sfxBtn = document.getElementById('audio-sfx-btn');
        const fab = document.getElementById('audio-fab');

        if (bgmBtn) {
            bgmBtn.textContent = SoundManager.#bgmEnabled ? '🎵 Nhạc nền: BẬT' : '🔇 Nhạc nền: TẮT';
            bgmBtn.dataset.on = SoundManager.#bgmEnabled ? '1' : '0';
        }
        if (sfxBtn) {
            sfxBtn.textContent = SoundManager.#sfxEnabled ? '🔊 Hiệu ứng: BẬT' : '🔕 Hiệu ứng: TẮT';
            sfxBtn.dataset.on = SoundManager.#sfxEnabled ? '1' : '0';
        }
        // Animate FAB icon when BGM playing
        if (fab) {
            fab.classList.toggle('bgm-playing', SoundManager.#bgmRunning);
        }
    }
}
