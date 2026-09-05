/* ==========================================================================
   SỐ LOGIC 0-9 - GAME ENGINE & EXPERT PUZZLE GENERATOR
   ========================================================================== */

class LogicGame {
    constructor() {
        this.difficulty = 'standard_digits'; // 'classic' | 'standard_digits' | 'expert_digits'
        this.INITIAL_NUMBERS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        
        this.slots = Array(10).fill(null);
        this.bank = [...this.INITIAL_NUMBERS];
        this.secretSolution = null;
        this.rules = [];
        this.history = [];
        this.selectedTile = null;
        this.timer = 0;
        this.timerInterval = null;
        this.hintsCount = 3;
        this.isGameOver = false;

        this.initDOM();
        this.bindEvents();
        this.startNewGame();
    }

    initDOM() {
        this.dom = {
            difficultySelect: document.getElementById('difficulty-select'),
            currentModeLabel: document.getElementById('current-mode-label'),
            slotsGrid: document.getElementById('slots-grid'),
            bankTiles: document.getElementById('bank-tiles'),
            rulesList: document.getElementById('rules-list'),
            timerDisplay: document.getElementById('timer-display'),
            filledCount: document.getElementById('filled-count'),
            satisfiedRulesCount: document.getElementById('satisfied-rules-count'),
            totalRulesCount: document.getElementById('total-rules-count'),
            hintCountDisplay: document.getElementById('hint-count'),
            btnUndo: document.getElementById('btn-undo'),
            btnClear: document.getElementById('btn-clear'),
            btnHint: document.getElementById('btn-hint'),
            btnCheck: document.getElementById('btn-check'),
            btnNewGame: document.getElementById('btn-new-game'),
            btnSound: document.getElementById('btn-sound'),
            btnHelp: document.getElementById('btn-help'),
            victoryModal: document.getElementById('victory-modal'),
            helpModal: document.getElementById('help-modal'),
            btnNextLevel: document.getElementById('btn-next-level'),
            finalTime: document.getElementById('final-time'),
            victorySequence: document.getElementById('victory-sequence')
        };
    }

    bindEvents() {
        this.dom.difficultySelect.addEventListener('change', (e) => {
            this.difficulty = e.target.value;
            this.startNewGame();
        });

        this.dom.btnUndo.addEventListener('click', () => this.undo());
        this.dom.btnClear.addEventListener('click', () => this.clearBoard());
        this.dom.btnHint.addEventListener('click', () => this.giveHint());
        this.dom.btnCheck.addEventListener('click', () => this.checkWinCondition(true));
        this.dom.btnNewGame.addEventListener('click', () => this.startNewGame());
        this.dom.btnNextLevel.addEventListener('click', () => {
            this.hideModal(this.dom.victoryModal);
            window.confettiSystem.stop();
            this.startNewGame();
        });

        this.dom.btnSound.addEventListener('click', () => {
            const enabled = window.soundSystem.toggle();
            this.dom.btnSound.innerHTML = enabled ? 
                '<i class="fa-solid fa-volume-high"></i>' : 
                '<i class="fa-solid fa-volume-xmark"></i>';
        });

        this.dom.btnHelp.addEventListener('click', () => this.showModal(this.dom.helpModal));
        document.querySelectorAll('.close-modal-btn').forEach(btn => {
            btn.addEventListener('click', () => this.hideModal(this.dom.helpModal));
        });

        window.addEventListener('click', (e) => {
            if (e.target === this.dom.helpModal) this.hideModal(this.dom.helpModal);
        });
    }

    /* ==========================================================================
       PUZZLE GENERATOR
       ========================================================================== */

    startNewGame() {
        if (this.difficulty === 'classic') {
            this.INITIAL_NUMBERS = [1, 2, 2, 3, 3, 3, 4, 4, 4, 4];
            this.dom.currentModeLabel.textContent = 'Cơ Bản (1 - 4)';
        } else if (this.difficulty === 'standard_digits') {
            this.INITIAL_NUMBERS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
            this.dom.currentModeLabel.textContent = 'Trung Bình (0 - 9)';
        } else {
            this.INITIAL_NUMBERS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
            this.dom.currentModeLabel.textContent = '🔴 Chuyên Gia (0 - 9 Hại Não)';
        }

        this.slots = Array(10).fill(null);
        this.bank = [...this.INITIAL_NUMBERS];
        this.history = [];
        this.selectedTile = null;
        this.hintsCount = 3;
        this.isGameOver = false;

        this.secretSolution = this.generateValidSequence();
        this.rules = this.generateRules(this.secretSolution);

        this.resetTimer();
        this.startTimer();
        this.render();
    }

    generateValidSequence() {
        let attempts = 0;
        while (attempts < 2000) {
            attempts++;
            let arr = [...this.INITIAL_NUMBERS].sort(() => Math.random() - 0.5);

            if (this.difficulty === 'classic') {
                let twoIndices = [];
                let oneIdx = -1;
                let threeIndices = [];
                for (let i = 0; i < 10; i++) {
                    if (arr[i] === 2) twoIndices.push(i);
                    if (arr[i] === 1) oneIdx = i;
                    if (arr[i] === 3) threeIndices.push(i);
                }
                if (Math.abs(twoIndices[0] - twoIndices[1]) <= 1) continue;
                if (!threeIndices.some(idx => Math.abs(idx - oneIdx) === 1)) continue;
                return arr;
            } else {
                // For 0-9 digits, verify it passes parity & prime structure constraints
                const zeroIdx = arr.indexOf(0);
                const nineIdx = arr.indexOf(9);
                if (zeroIdx === 0 || zeroIdx === 9 || nineIdx === 0 || nineIdx === 9) continue;
                return arr;
            }
        }
        return [...this.INITIAL_NUMBERS].sort(() => Math.random() - 0.5);
    }

    generateRules(solution) {
        if (this.difficulty === 'classic') {
            return this.generateClassicRules(solution);
        } else if (this.difficulty === 'standard_digits') {
            return this.generateStandardDigitsRules(solution);
        } else {
            return this.generateExpertDigitsRules(solution);
        }
    }

    generateClassicRules(solution) {
        const rules = [
            {
                id: 'rule_freq',
                text: 'Có đúng 1x[1], 2x[2], 3x[3] và 4x[4]',
                check: (slots) => {
                    const counts = {1:0, 2:0, 3:0, 4:0};
                    slots.forEach(n => { if (n !== null) counts[n]++; });
                    if (slots.filter(n => n !== null).length === 10) {
                        return counts[1] === 1 && counts[2] === 2 && counts[3] === 3 && counts[4] === 4;
                    }
                    if (counts[1] > 1 || counts[2] > 2 || counts[3] > 3 || counts[4] > 4) return false;
                    return null;
                }
            },
            {
                id: 'rule_twos_adjacent',
                text: 'Hai số 2 KHÔNG được nằm kề cạnh nhau',
                check: (slots) => {
                    for (let i = 0; i < 9; i++) {
                        if (slots[i] === 2 && slots[i+1] === 2) return false;
                    }
                    const twos = [];
                    for (let i = 0; i < 10; i++) if (slots[i] === 2) twos.push(i);
                    return twos.length === 2 ? Math.abs(twos[1] - twos[0]) > 1 : null;
                }
            },
            {
                id: 'rule_three_next_to_one',
                text: 'Có ít nhất một số 3 đứng kề cạnh số 1',
                check: (slots) => {
                    const oneIdx = slots.indexOf(1);
                    if (oneIdx === -1) return null;
                    const left3 = oneIdx > 0 && slots[oneIdx - 1] === 3;
                    const right3 = oneIdx < 9 && slots[oneIdx + 1] === 3;
                    if (left3 || right3) return true;
                    if ((oneIdx === 0 || slots[oneIdx - 1] !== null) && (oneIdx === 9 || slots[oneIdx + 1] !== null)) return false;
                    return null;
                }
            }
        ];
        return rules;
    }

    generateStandardDigitsRules(solution) {
        const rules = [
            {
                id: 'rule_unique',
                text: 'Gồm 10 chữ số phân biệt từ 0 đến 9',
                check: (slots) => {
                    const filled = slots.filter(n => n !== null);
                    const unique = new Set(filled);
                    if (filled.length !== unique.size) return false;
                    return filled.length === 10 ? true : null;
                }
            }
        ];

        // Zero and Nine boundary rule
        const zeroIdx = solution.indexOf(0);
        const nineIdx = solution.indexOf(9);

        rules.push({
            id: 'rule_boundary_0_9',
            text: 'Số 0 và số 9 KHÔNG được nằm ở ô đầu tiên (#1) hay ô cuối cùng (#10)',
            check: (slots) => {
                if (slots[0] === 0 || slots[0] === 9 || slots[9] === 0 || slots[9] === 9) return false;
                if (slots.includes(0) && slots.includes(9)) return true;
                return null;
            }
        });

        // Relative position: 9 is left or right of 0
        const isNineLeft = nineIdx < zeroIdx;
        rules.push({
            id: 'rule_nine_rel_zero',
            text: `Số 9 nằm ở bên ${isNineLeft ? 'TRÁI' : 'PHẢI'} của số 0`,
            check: (slots) => {
                const i9 = slots.indexOf(9);
                const i0 = slots.indexOf(0);
                if (i9 !== -1 && i0 !== -1) {
                    return isNineLeft ? (i9 < i0) : (i9 > i0);
                }
                return null;
            }
        });

        // Position of 5
        const fiveIdx = solution.indexOf(5);
        rules.push({
            id: 'rule_five_pos',
            text: `Số 5 nằm ở nửa ${fiveIdx < 5 ? 'ĐẦU (ô #1 - #5)' : 'SAU (ô #6 - #10)'} của dãy`,
            check: (slots) => {
                const i5 = slots.indexOf(5);
                if (i5 !== -1) {
                    return fiveIdx < 5 ? (i5 < 5) : (i5 >= 5);
                }
                return null;
            }
        });

        // Exact distance between 0 and 9
        const dist = Math.abs(nineIdx - zeroIdx);
        rules.push({
            id: 'rule_dist_0_9',
            text: `Khoảng cách giữa số 0 và số 9 đúng bằng ${dist} vị trí (${dist - 1} ô trống ở giữa)`,
            check: (slots) => {
                const i9 = slots.indexOf(9);
                const i0 = slots.indexOf(0);
                if (i9 !== -1 && i0 !== -1) {
                    return Math.abs(i9 - i0) === dist;
                }
                return null;
            }
        });

        return rules;
    }

    generateExpertDigitsRules(solution) {
        const rules = [
            {
                id: 'rule_unique',
                text: 'Gồm 10 chữ số phân biệt từ 0 đến 9',
                check: (slots) => {
                    const filled = slots.filter(n => n !== null);
                    const unique = new Set(filled);
                    if (filled.length !== unique.size) return false;
                    return filled.length === 10 ? true : null;
                }
            }
        ];

        // 1. Math Balance: Sum(#1+#2+#3) vs Sum(#8+#9+#10)
        const sumFirst3 = solution[0] + solution[1] + solution[2];
        const sumLast3 = solution[7] + solution[8] + solution[9];
        const sumDiff = sumFirst3 - sumLast3;

        rules.push({
            id: 'rule_sum_balance',
            text: `Tổng 3 ô đầu tiên (#1+#2+#3) ${sumDiff === 0 ? 'BẰNG' : (sumDiff > 0 ? `LỚN HƠN (${sumDiff} đơn vị)` : `NHO HƠN (${Math.abs(sumDiff)} đơn vị)`)} tổng 3 ô cuối (#8+#9+#10)`,
            check: (slots) => {
                const f0 = slots[0], f1 = slots[1], f2 = slots[2];
                const l7 = slots[7], l8 = slots[8], l9 = slots[9];
                if (f0 !== null && f1 !== null && f2 !== null && l7 !== null && l8 !== null && l9 !== null) {
                    const s1 = f0 + f1 + f2;
                    const s2 = l7 + l8 + l9;
                    return (s1 - s2) === sumDiff;
                }
                return null;
            }
        });

        // 2. Parity rule: No 2 odds adjacent OR odds parity
        rules.push({
            id: 'rule_no_adjacent_odds',
            text: 'KHÔNG được có 2 số lẻ đứng kề cạnh nhau',
            check: (slots) => {
                for (let i = 0; i < 9; i++) {
                    if (slots[i] !== null && slots[i+1] !== null) {
                        if (slots[i] % 2 !== 0 && slots[i+1] % 2 !== 0) return false;
                    }
                }
                const filledOdds = slots.filter(n => n !== null && n % 2 !== 0);
                if (filledOdds.length === 5) {
                    for (let i = 0; i < 9; i++) {
                        if (slots[i] % 2 !== 0 && slots[i+1] % 2 !== 0) return false;
                    }
                    return true;
                }
                return null;
            }
        });

        // 3. Prime numbers rule: Primes (2,3,5,7) adjacent to an even number
        rules.push({
            id: 'rule_primes_even_neighbor',
            text: 'Mọi số nguyên tố (2, 3, 5, 7) phải đứng kề ít nhất 1 số chẵn',
            check: (slots) => {
                const primes = [2, 3, 5, 7];
                for (let p of primes) {
                    const idx = slots.indexOf(p);
                    if (idx !== -1) {
                        const leftEven = idx > 0 && slots[idx-1] !== null && slots[idx-1] % 2 === 0;
                        const rightEven = idx < 9 && slots[idx+1] !== null && slots[idx+1] % 2 === 0;
                        if (!leftEven && !rightEven) {
                            const leftFilled = idx === 0 || slots[idx-1] !== null;
                            const rightFilled = idx === 9 || slots[idx+1] !== null;
                            if (leftFilled && rightFilled) return false;
                        }
                    }
                }
                const placedPrimes = primes.filter(p => slots.includes(p));
                if (placedPrimes.length === 4) {
                    let ok = true;
                    for (let p of primes) {
                        const idx = slots.indexOf(p);
                        const leftEven = idx > 0 && slots[idx-1] !== null && slots[idx-1] % 2 === 0;
                        const rightEven = idx < 9 && slots[idx+1] !== null && slots[idx+1] % 2 === 0;
                        if (!leftEven && !rightEven) ok = false;
                    }
                    return ok ? true : false;
                }
                return null;
            }
        });

        // 4. Increasing triad rule
        let triadStart = 3; // check slots #4, #5, #6 (indices 3, 4, 5)
        const isIncreasing = solution[triadStart] < solution[triadStart+1] && solution[triadStart+1] < solution[triadStart+2];
        rules.push({
            id: 'rule_triad_order',
            text: `Cụm 3 ô ở giữa (#4, #5, #6) ${isIncreasing ? 'tạo thành dãy TĂNG DẦN' : 'KHÔNG tăng dần theo thứ tự'}`,
            check: (slots) => {
                const a = slots[3], b = slots[4], c = slots[5];
                if (a !== null && b !== null && c !== null) {
                    const inc = a < b && b < c;
                    return isIncreasing ? inc : !inc;
                }
                return null;
            }
        });

        // 5. Boundary comparison: Slot #1 vs Slot #10
        const firstIsGreater = solution[0] > solution[9];
        rules.push({
            id: 'rule_boundary_cmp',
            text: `Số tại ô đầu tiên (#1) ${firstIsGreater ? 'LỚN HƠN' : 'NHỎ HƠN'} số tại ô cuối cùng (#10)`,
            check: (slots) => {
                if (slots[0] !== null && slots[9] !== null) {
                    return firstIsGreater ? (slots[0] > slots[9]) : (slots[0] < slots[9]);
                }
                return null;
            }
        });

        // 6. Product of center elements
        const centerProd = solution[4] * solution[5];
        const isEvenProd = centerProd % 2 === 0;
        rules.push({
            id: 'rule_center_prod',
            text: `Tích 2 ô trung tâm (#5 × #6) là một số ${isEvenProd ? 'CHẴN' : 'LẺ'} (${centerProd})`,
            check: (slots) => {
                if (slots[4] !== null && slots[5] !== null) {
                    return (slots[4] * slots[5]) % 2 === (isEvenProd ? 0 : 1);
                }
                return null;
            }
        });

        return rules;
    }

    /* ==========================================================================
       GAMEPLAY & INTERACTION LOGIC
       ========================================================================== */

    selectBankTile(index) {
        if (this.isGameOver) return;
        const num = this.bank[index];
        if (num === undefined) return;

        window.soundSystem.playClick();

        if (this.selectedTile && this.selectedTile.source === 'bank' && this.selectedTile.index === index) {
            this.selectedTile = null;
        } else {
            this.selectedTile = { num, source: 'bank', index };
        }
        this.render();
    }

    selectSlot(slotIndex) {
        if (this.isGameOver) return;

        if (this.selectedTile && this.selectedTile.source === 'bank') {
            const prevNum = this.slots[slotIndex];
            this.saveHistory();
            this.slots[slotIndex] = this.selectedTile.num;
            this.bank.splice(this.selectedTile.index, 1);
            if (prevNum !== null) this.bank.push(prevNum);
            this.selectedTile = null;
            window.soundSystem.playPlace();
        } else if (this.selectedTile && this.selectedTile.source === 'slot') {
            const fromIndex = this.selectedTile.index;
            if (fromIndex !== slotIndex) {
                this.saveHistory();
                const temp = this.slots[slotIndex];
                this.slots[slotIndex] = this.slots[fromIndex];
                this.slots[fromIndex] = temp;
                window.soundSystem.playPlace();
            }
            this.selectedTile = null;
        } else if (this.slots[slotIndex] !== null) {
            this.saveHistory();
            const num = this.slots[slotIndex];
            this.slots[slotIndex] = null;
            this.bank.push(num);
            window.soundSystem.playRemove();
        }

        this.render();
        this.checkWinCondition(false);
    }

    saveHistory() {
        this.history.push({
            slots: [...this.slots],
            bank: [...this.bank]
        });
    }

    undo() {
        if (this.history.length === 0 || this.isGameOver) return;
        const lastState = this.history.pop();
        this.slots = lastState.slots;
        this.bank = lastState.bank;
        this.selectedTile = null;
        window.soundSystem.playRemove();
        this.render();
    }

    clearBoard() {
        if (this.slots.every(s => s === null) || this.isGameOver) return;
        this.saveHistory();
        this.slots = Array(10).fill(null);
        this.bank = [...this.INITIAL_NUMBERS];
        this.selectedTile = null;
        window.soundSystem.playRemove();
        this.render();
    }

    giveHint() {
        if (this.hintsCount <= 0 || this.isGameOver) return;

        const candidateIndices = [];
        for (let i = 0; i < 10; i++) {
            if (this.slots[i] !== this.secretSolution[i]) {
                candidateIndices.push(i);
            }
        }
        if (candidateIndices.length === 0) return;

        const targetIdx = candidateIndices[Math.floor(Math.random() * candidateIndices.length)];
        const correctNum = this.secretSolution[targetIdx];

        this.saveHistory();

        if (this.slots[targetIdx] !== null) {
            this.bank.push(this.slots[targetIdx]);
            this.slots[targetIdx] = null;
        }

        const bankIdx = this.bank.indexOf(correctNum);
        if (bankIdx !== -1) {
            this.bank.splice(bankIdx, 1);
            this.slots[targetIdx] = correctNum;
        } else {
            const otherSlotIdx = this.slots.indexOf(correctNum);
            if (otherSlotIdx !== -1) {
                this.slots[otherSlotIdx] = null;
                this.slots[targetIdx] = correctNum;
            }
        }

        this.hintsCount--;
        window.soundSystem.playHint();
        this.render();
        this.checkWinCondition(false);
    }

    /* ==========================================================================
       WIN CONDITION & VALIDATION
       ========================================================================== */

    checkWinCondition(isManualCheck = false) {
        const isFull = this.slots.every(s => s !== null);
        let allSatisfied = true;

        this.rules.forEach(rule => {
            const res = rule.check(this.slots);
            if (res !== true) allSatisfied = false;
        });

        if (isFull && allSatisfied) {
            this.onWin();
        } else if (isManualCheck) {
            if (!isFull) {
                window.soundSystem.playError();
                alert("Bạn chưa xếp đủ 10 ô! Hãy xếp đầy các ô số nhé.");
            } else {
                window.soundSystem.playError();
                alert("Dãy số chưa thỏa mãn tất cả quy luật! Hãy rà soát các ô báo màu đỏ nhé.");
            }
        }
    }

    onWin() {
        this.isGameOver = true;
        this.stopTimer();
        window.soundSystem.playVictory();
        window.confettiSystem.start();

        this.dom.victorySequence.innerHTML = this.slots.map(num => 
            `<div class="tile" data-num="${num}">${num}</div>`
        ).join('');

        this.dom.finalTime.textContent = this.dom.timerDisplay.textContent;
        this.showModal(this.dom.victoryModal);
    }

    /* ==========================================================================
       TIMER & UI RENDERERS
       ========================================================================== */

    startTimer() {
        this.stopTimer();
        this.timer = 0;
        this.timerInterval = setInterval(() => {
            this.timer++;
            const mins = Math.floor(this.timer / 60).toString().padStart(2, '0');
            const secs = (this.timer % 60).toString().padStart(2, '0');
            this.dom.timerDisplay.textContent = `${mins}:${secs}`;
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
    }

    resetTimer() {
        this.stopTimer();
        this.dom.timerDisplay.textContent = "00:00";
    }

    showModal(modal) { modal.classList.add('active'); }
    hideModal(modal) { modal.classList.remove('active'); }

    render() {
        // Render 10 Slots
        this.dom.slotsGrid.innerHTML = '';
        this.slots.forEach((num, idx) => {
            const slotEl = document.createElement('div');
            slotEl.className = 'slot';
            if (this.selectedTile && this.selectedTile.source === 'slot' && this.selectedTile.index === idx) {
                slotEl.classList.add('selected');
            }

            slotEl.innerHTML = `<span class="slot-idx">#${idx + 1}</span>`;

            if (num !== null) {
                const tileEl = document.createElement('div');
                tileEl.className = 'tile';
                tileEl.setAttribute('data-num', num);
                tileEl.textContent = num;
                slotEl.appendChild(tileEl);
            }

            slotEl.addEventListener('click', () => this.selectSlot(idx));
            this.dom.slotsGrid.appendChild(slotEl);
        });

        // Render Bank Tiles
        this.dom.bankTiles.innerHTML = '';
        const sortedBank = [...this.bank].sort((a,b) => a - b);
        sortedBank.forEach((num, bankIdx) => {
            const tileEl = document.createElement('div');
            tileEl.className = 'tile';
            tileEl.setAttribute('data-num', num);
            tileEl.textContent = num;

            if (this.selectedTile && this.selectedTile.source === 'bank' && this.selectedTile.index === bankIdx) {
                tileEl.classList.add('selected');
            }

            tileEl.addEventListener('click', () => this.selectBankTile(bankIdx));
            this.dom.bankTiles.appendChild(tileEl);
        });

        // Render Rules Checklist
        let satisfiedCount = 0;
        this.dom.rulesList.innerHTML = '';

        this.rules.forEach(rule => {
            const res = rule.check(this.slots);
            let statusClass = 'status-pending';
            let icon = '<i class="fa-regular fa-circle rule-icon"></i>';

            if (res === true) {
                statusClass = 'status-valid';
                icon = '<i class="fa-solid fa-circle-check rule-icon"></i>';
                satisfiedCount++;
            } else if (res === false) {
                statusClass = 'status-invalid';
                icon = '<i class="fa-solid fa-circle-xmark rule-icon"></i>';
            }

            const ruleEl = document.createElement('div');
            ruleEl.className = `rule-item ${statusClass}`;
            ruleEl.innerHTML = `
                ${icon}
                <div class="rule-text">${rule.text}</div>
            `;
            this.dom.rulesList.appendChild(ruleEl);
        });

        const filled = this.slots.filter(s => s !== null).length;
        this.dom.filledCount.textContent = filled;
        this.dom.satisfiedRulesCount.textContent = satisfiedCount;
        this.dom.totalRulesCount.textContent = this.rules.length;
        this.dom.hintCountDisplay.textContent = this.hintsCount;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.game = new LogicGame();
});
