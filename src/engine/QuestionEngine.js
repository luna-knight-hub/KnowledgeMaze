/**
 * QUESTION ENGINE — v3 (Bug-fixed)
 *
 * Design nguyên tắc:
 *   1. Mỗi lần render() reset toàn bộ trạng thái.
 *   2. #answered flag chặn mọi callback sau lần đầu tiên.
 *   3. #resolve() là hàm DUY NHẤT gọi onCorrect/onWrong/onTimeout.
 *      Tất cả nhánh đều đi qua đây — KHÔNG có setTimeout wrapping callback.
 *   4. Visual feedback hiện TRƯỚC khi #resolve() chạy (setTimeout 650ms).
 *   5. Timer onTimeout cũng đi qua #resolve().
 */
class QuestionEngine {
    #container = null;
    #timerBar = null;
    #timerHandle = null;
    #answered = false;

    // Callbacks cho câu hỏi hiện tại
    #onCorrect = null;
    #onWrong = null;
    #onTimeout = null;

    // ─── Public API ──────────────────────────────────────────────

    init(container, timerBar) {
        this.#container = container;
        this.#timerBar = timerBar;
    }

    /**
     * Điểm vào duy nhất — render câu hỏi và gắn handlers.
     */
    render(milestone, onCorrect, onWrong, onTimeout) {
        // Reset trạng thái
        this.#answered = false;
        this.#onCorrect = onCorrect;
        this.#onWrong = onWrong;
        this.#onTimeout = onTimeout;
        this.#stopTimer();

        this.#container.innerHTML = '';
        SoundManager.play('quizOpen');

        // Render HTML theo loại
        switch (milestone.type) {
            case 'mcq': this.#renderMCQ(milestone); break;
            case 'image': this.#renderImage(milestone); break;
            case 'audio': this.#renderAudio(milestone); break;
            case 'matching': this.#renderMatching(milestone); break;
            case 'fill': this.#renderFill(milestone); break;
            default: this.#renderMCQ(milestone);
        }

        // Gắn handlers
        this.#attachHandlers(milestone);

        // Bắt đầu đếm giờ
        this.#startTimer(milestone.time ?? 20);
    }

    stopTimer() { this.#stopTimer(); }

    // ─── #resolve — hàm kết thúc câu hỏi DUY NHẤT ───────────────

    /**
     * Chỉ chạy 1 lần. Tự bảo vệ bằng #answered flag.
     * @param {'correct'|'wrong'|'timeout'} result
     * @param {number} delayMs - ms trì hoãn sau khi hiển thị feedback
     */
    #resolve(result, delayMs = 0) {
        if (this.#answered) return;   // guard
        this.#answered = true;
        this.#stopTimer();

        const cb = result === 'correct' ? this.#onCorrect
            : result === 'wrong' ? this.#onWrong
                : this.#onTimeout;

        if (delayMs > 0) {
            setTimeout(() => cb?.(), delayMs);
        } else {
            cb?.();
        }
    }

    // ─── Renderers ───────────────────────────────────────────────

    #renderMCQ(milestone) {
        const opts = milestone.options ?? [];
        this.#container.innerHTML = `
            <p class="quiz-question">${milestone.question ?? ''}</p>
            <div class="answer-grid" id="answers">
                ${opts.map((opt, i) =>
            `<button class="quiz-btn" data-index="${i}">${opt}</button>`
        ).join('')}
            </div>`;
    }

    #renderImage(milestone) {
        const opts = milestone.options ?? [];
        this.#container.innerHTML = `
            ${milestone.image
                ? `<img src="${milestone.image}" class="quiz-image" alt="Câu hỏi">`
                : ''}
            <p class="quiz-question">${milestone.question ?? ''}</p>
            <div class="answer-grid" id="answers">
                ${opts.map((opt, i) =>
                    `<button class="quiz-btn" data-index="${i}">${opt}</button>`
                ).join('')}
            </div>`;
    }

    #renderAudio(milestone) {
        const opts = milestone.options ?? [];
        this.#container.innerHTML = `
            ${milestone.audio
                ? `<div class="audio-player-wrap">
                       <audio controls src="${milestone.audio}" class="quiz-audio"></audio>
                   </div>`
                : ''}
            <p class="quiz-question">${milestone.question ?? ''}</p>
            <div class="answer-grid" id="answers">
                ${opts.map((opt, i) =>
                    `<button class="quiz-btn" data-index="${i}">${opt}</button>`
                ).join('')}
            </div>`;
    }

    #renderFill(milestone) {
        this.#container.innerHTML = `
            <p class="quiz-question">${milestone.question ?? ''}</p>
            <div class="fill-wrap">
                <input  type="text" id="fill-input" class="fill-input"
                        placeholder="Nhập câu trả lời..."
                        autocomplete="off" spellcheck="false"/>
                <button class="quiz-btn primary" id="submit-fill">✓ Kiểm tra</button>
            </div>
            <div id="fill-feedback" class="fill-feedback"></div>`;
    }

    #renderMatching(milestone) {
        const pairs = milestone.pairs ?? [];
        // Hỗ trợ cả hai format: {left,right} và {a,b}
        const lefts = pairs.map(p => p.left ?? p.a ?? '');
        const rights = pairs.map(p => p.right ?? p.b ?? '');
        const shuffled = [...rights].sort(() => Math.random() - 0.5);

        this.#container.innerHTML = `
            <p class="quiz-question">${milestone.question ?? ''}</p>
            <div class="matching-grid">
                <div class="col-a">
                    ${lefts.map((l, i) =>
            `<div class="match-item-a"
                              data-index="${i}"
                              data-correct="${rights[i]}"
                              data-matched="">${l}</div>`
        ).join('')}
                </div>
                <div class="col-b">
                    ${shuffled.map(r =>
            `<div class="match-item-b" data-value="${r}">${r}</div>`
        ).join('')}
                </div>
            </div>
            <button class="quiz-btn primary" id="submit-match">✓ Kiểm tra</button>`;
    }

    // ─── Answer Handlers ─────────────────────────────────────────

    #attachHandlers(milestone) {
        // ── MCQ / Image / Audio ──
        const grid = this.#container.querySelector('#answers');
        if (grid) {
            grid.addEventListener('click', (e) => {
                if (this.#answered) return;
                const btn = e.target.closest('button[data-index]');
                if (!btn) return;

                const idx = parseInt(btn.dataset.index, 10);
                const correct = milestone.correct ?? 0;
                const isCorrect = (idx === correct);

                // Visual feedback — highlight tất cả buttons
                this.#container.querySelectorAll('button[data-index]').forEach((b, i) => {
                    b.disabled = true;
                    if (i === correct) b.classList.add('btn-correct');
                });
                if (!isCorrect) btn.classList.add('btn-wrong');

                // Resolve sau khi người dùng kịp thấy feedback
                this.#resolve(isCorrect ? 'correct' : 'wrong', 700);
            });
        }

        // ── Fill ──
        const fillInput = this.#container.querySelector('#fill-input');
        const submitFill = this.#container.querySelector('#submit-fill');

        if (fillInput && submitFill) {
            const doSubmitFill = () => {
                if (this.#answered) return;

                const val = fillInput.value.trim().toLowerCase();
                if (!val) return;   // không submit khi rỗng

                const answers = (milestone.correct_answers ?? [])
                    .concat(milestone.answer ? [milestone.answer] : [])   // compat
                    .filter(Boolean);

                const isCorrect = answers.some(a => a.trim().toLowerCase() === val);

                // Disable inputs ngay
                fillInput.disabled = true;
                submitFill.disabled = true;

                // Visual feedback
                const feedback = this.#container.querySelector('#fill-feedback');
                if (isCorrect) {
                    fillInput.classList.add('fill-correct');
                    if (feedback) feedback.innerHTML =
                        `<span class="fb-correct">✓ Chính xác! Đáp án: <b>${answers[0]}</b></span>`;
                } else {
                    fillInput.classList.add('fill-wrong');
                    if (feedback) feedback.innerHTML =
                        `<span class="fb-wrong">✗ Sai rồi! Đáp án đúng: <b>${answers[0] ?? '?'}</b></span>`;
                }

                this.#resolve(isCorrect ? 'correct' : 'wrong', 800);
            };

            submitFill.addEventListener('click', doSubmitFill);
            fillInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') doSubmitFill();
            });
            // Auto-focus
            setTimeout(() => fillInput.focus(), 60);
        }

        // ── Matching ──
        const submitMatch = this.#container.querySelector('#submit-match');
        if (submitMatch) {
            this.#setupMatchingInteraction();

            submitMatch.addEventListener('click', () => {
                if (this.#answered) return;

                const aItems = this.#container.querySelectorAll('.match-item-a');
                const pairs = milestone.pairs ?? [];

                // Kiểm tra tất cả đã nối chưa
                const allMatched = [...aItems].every(el => el.dataset.matched !== '');
                if (!allMatched) {
                    // Gợi ý nhẹ
                    submitMatch.classList.add('btn-shake');
                    setTimeout(() => submitMatch.classList.remove('btn-shake'), 500);
                    return;
                }

                // Chấm điểm
                const isCorrect = pairs.every((pair, i) => {
                    const correct = pair.right ?? pair.b ?? '';
                    return aItems[i]?.dataset.matched === correct;
                });

                // Highlight từng cặp
                aItems.forEach(el => {
                    const matched = el.dataset.matched;
                    const correct = el.dataset.correct;
                    el.classList.add(matched === correct ? 'match-correct' : 'match-wrong');
                });
                submitMatch.disabled = true;

                this.#resolve(isCorrect ? 'correct' : 'wrong', 800);
            });
        }
    }

    // ─── Matching Interaction ────────────────────────────────────

    #setupMatchingInteraction() {
        let selectedB = null;

        const bItems = this.#container.querySelectorAll('.match-item-b');
        const aItems = this.#container.querySelectorAll('.match-item-a');

        bItems.forEach(bEl => {
            bEl.addEventListener('click', () => {
                if (this.#answered) return;
                // Toggle selection
                if (selectedB === bEl) {
                    bEl.classList.remove('selected');
                    selectedB = null;
                    return;
                }
                bItems.forEach(b => b.classList.remove('selected'));
                selectedB = bEl;
                bEl.classList.add('selected');
            });
        });

        aItems.forEach(aEl => {
            aEl.addEventListener('click', () => {
                if (this.#answered || !selectedB) return;

                const val = selectedB.dataset.value;
                const leftText = aEl.textContent.split('→')[0].trim();

                // Ghi lại matched value vào data attribute
                aEl.dataset.matched = val;
                aEl.innerHTML = `${leftText} <span class="match-arrow">→</span> <b>${val}</b>`;

                selectedB.classList.remove('selected');
                selectedB.classList.add('matched');
                selectedB = null;
            });
        });
    }

    // ─── Timer ───────────────────────────────────────────────────

    #startTimer(totalSecs) {
        if (!this.#timerBar) return;
        let remaining = totalSecs;
        this.#timerBar.style.transition = 'none';
        this.#timerBar.style.width = '100%';
        this.#timerBar.style.background = '';

        this.#timerHandle = setInterval(() => {
            remaining--;
            const pct = Math.max(0, (remaining / totalSecs) * 100);

            if (this.#timerBar) {
                this.#timerBar.style.width = `${pct}%`;
                if (pct < 25) this.#timerBar.style.background = '#ff007a';
                else if (pct < 55) this.#timerBar.style.background = '#ffd700';
                else this.#timerBar.style.background = '';
            }

            if (remaining <= 0) {
                this.#resolve('timeout', 0);
            }
        }, 1000);
    }

    #stopTimer() {
        if (this.#timerHandle) {
            clearInterval(this.#timerHandle);
            this.#timerHandle = null;
        }
    }
}
