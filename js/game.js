/* ==========================================================================
   SỐ LOGIC 0-9 - GAME ENGINE & EXPERT PUZZLE GENERATOR (MULTIPLAYER SUPPORT)
   ========================================================================== */

function mulberry32(a) {
    return function() {
        var t = a += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

class LogicGame {
    constructor() {
        this.difficulty = 'standard_digits'; // 'classic' | 'standard_digits' | 'expert_digits'
        this.INITIAL_NUMBERS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        
        this.slots = Array(10).fill(null);
        this.bank = [];
        this.secretSolution = null;
        this.rules = [];
        this.history = [];
        this.selectedTile = null;
        this.timer = 0;
        this.timerInterval = null;
        this.hintsCount = 3;
        this.isGameOver = false;
        this.randomFunc = Math.random;

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
            victoryTitle: document.getElementById('victory-title'),
            victoryDesc: document.getElementById('victory-desc'),
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

    startMultiplayerGame(seed) {
        this.randomFunc = mulberry32(seed);
        this.startNewGame();
    }

    startNewGame() {
        if (this.difficulty === 'classic') {
            this.INITIAL_NUMBERS = [1, 2, 2, 3, 3, 3, 4, 4, 4, 4];
            this.dom.currentModeLabel.textContent = 'Cơ Bản (1 - 4)';
        } else if (this.difficulty === 'standard_digits') {
            this.INITIAL_NUMBERS = Array.from({length: 10}, () => Math.floor(this.randomFunc() * 10));
            this.dom.currentModeLabel.textContent = 'Trung Bình (Random 0-9)';
        } else {
            this.INITIAL_NUMBERS = Array.from({length: 10}, () => Math.floor(this.randomFunc() * 10));
            this.dom.currentModeLabel.textContent = '🔴 Chuyên Gia (Random 0-9 Hại Não)';
        }

        this.bank = [...this.INITIAL_NUMBERS].sort((a,b) => a - b);
        this.slots = Array(10).fill(null);
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
            let arr = [...this.INITIAL_NUMBERS].sort(() => this.randomFunc() - 0.5);

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
                let valid = true;
                for (let i = 0; i < 9; i++) {
                    if (arr[i] === arr[i+1]) {
                        valid = false;
                        break;
                    }
                }
                if (valid) return arr;
            }
        }
        return [...this.INITIAL_NUMBERS].sort(() => this.randomFunc() - 0.5);
    }

    generateRules(solution) {
        if (this.difficulty === 'classic') {
            return this.generateClassicRules(solution);
        } else if (this.difficulty === 'standard_digits') {
            return this.generateRandomDigitsRules(solution, false);
        } else {
            return this.generateRandomDigitsRules(solution, true);
        }
    }

    generateClassicRules(solution) {
        const rules = [
            {
                id: 'rule_freq',
                text: 'Dùng đúng 1 số 1, 2 số 2, 3 số 3 và 4 số 4',
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
                text: 'Hai số 2 không nằm kề cạnh nhau',
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
                text: 'Có ít nhất 1 số 3 đứng kề cạnh số 1',
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

    generateRandomDigitsRules(solution, isExpert = false) {
        const rules = [];

        const countsMap = {};
        solution.forEach(n => countsMap[n] = (countsMap[n] || 0) + 1);

        rules.push({
            id: 'rule_bank_freq',
            text: 'Dùng đúng 10 thẻ số có trong kho',
            check: (slots) => {
                const currentCounts = {};
                slots.forEach(n => { if (n !== null) currentCounts[n] = (currentCounts[n] || 0) + 1; });
                
                for (let num in currentCounts) {
                    if (currentCounts[num] > (countsMap[num] || 0)) return false;
                }
                const filled = slots.filter(n => n !== null).length;
                if (filled === 10) {
                    for (let num in countsMap) {
                        if (currentCounts[num] !== countsMap[num]) return false;
                    }
                    return true;
                }
                return null;
            }
        });

        const dupes = Object.keys(countsMap).filter(n => countsMap[n] >= 2).map(Number);
        dupes.forEach(dupeNum => {
            rules.push({
                id: `rule_no_adj_${dupeNum}`,
                text: `Các số ${dupeNum} không nằm kề cạnh nhau`,
                check: (slots) => {
                    for (let i = 0; i < 9; i++) {
                        if (slots[i] === dupeNum && slots[i+1] === dupeNum) return false;
                    }
                    const placed = [];
                    for (let i = 0; i < 10; i++) if (slots[i] === dupeNum) placed.push(i);
                    if (placed.length === countsMap[dupeNum]) {
                        for (let k = 0; k < placed.length - 1; k++) {
                            if (placed[k+1] - placed[k] <= 1) return false;
                        }
                        return true;
                    }
                    return null;
                }
            });
        });

        const sumFirst3 = solution[0] + solution[1] + solution[2];
        const sumLast3 = solution[7] + solution[8] + solution[9];
        const sumDiff = sumFirst3 - sumLast3;

        let sumText = 'Tổng 3 ô đầu tiên bằng tổng 3 ô cuối';
        if (sumDiff > 0) sumText = 'Tổng 3 ô đầu tiên lớn hơn tổng 3 ô cuối';
        else if (sumDiff < 0) sumText = 'Tổng 3 ô đầu tiên nhỏ hơn tổng 3 ô cuối';

        rules.push({
            id: 'rule_sum_balance',
            text: sumText,
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

        const oddsInSolution = solution.filter(n => n % 2 !== 0).length;
        if (oddsInSolution >= 3) {
            rules.push({
                id: 'rule_odds_adjacent',
                text: 'Không có 2 số lẻ nào nằm kề cạnh nhau',
                check: (slots) => {
                    for (let i = 0; i < 9; i++) {
                        if (slots[i] !== null && slots[i+1] !== null) {
                            if (slots[i] % 2 !== 0 && slots[i+1] % 2 !== 0) return false;
                        }
                    }
                    const filledOdds = slots.filter(n => n !== null && n % 2 !== 0);
                    if (filledOdds.length === oddsInSolution) {
                        for (let i = 0; i < 9; i++) {
                            if (slots[i] % 2 !== 0 && slots[i+1] % 2 !== 0) return false;
                        }
                        return true;
                    }
                    return null;
                }
            });
        }

        const firstVal = solution[0];
        const lastVal = solution[9];
        let boundText = 'Số ở ô đầu tiên bằng số ở ô cuối cùng';
        if (firstVal > lastVal) boundText = 'Số ở ô đầu tiên lớn hơn số ở ô cuối cùng';
        else if (firstVal < lastVal) boundText = 'Số ở ô đầu tiên nhỏ hơn số ở ô cuối cùng';

        rules.push({
            id: 'rule_boundary_cmp',
            text: boundText,
            check: (slots) => {
                if (slots[0] !== null && slots[9] !== null) {
                    if (firstVal === lastVal) return slots[0] === slots[9];
                    return firstVal > lastVal ? (slots[0] > slots[9]) : (slots[0] < slots[9]);
                }
                return null;
            }
        });

        if (isExpert) {
            const prod = solution[4] * solution[5];
            const isEvenProd = prod % 2 === 0;
            rules.push({
                id: 'rule_center_prod',
                text: `Tích 2 ô trung tâm là một số ${isEvenProd ? 'chẵn' : 'lẻ'}`,
                check: (slots) => {
                    if (slots[4] !== null && slots[5] !== null) {
                        return (slots[4] * slots[5]) % 2 === (isEvenProd ? 0 : 1);
                    }
                    return null;
                }
            });
        }

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

            if (prevNum !== null) {
                this.bank.push(prevNum);
            }
            this.bank.sort((a,b) => a - b);

            this.selectedTile = null;
            window.soundSystem.playPlace();
        } else if (this.selectedTile && this.selectedTile.source === 'slot') {
            const fromIndex = this.selectedTile.index;
            if (fromIndex === slotIndex) {
                this.saveHistory();
                const num = this.slots[slotIndex];
                this.slots[slotIndex] = null;
                this.bank.push(num);
                this.bank.sort((a,b) => a - b);
                this.selectedTile = null;
                window.soundSystem.playRemove();
            } else {
                this.saveHistory();
                const temp = this.slots[slotIndex];
                this.slots[slotIndex] = this.slots[fromIndex];
                this.slots[fromIndex] = temp;
                this.selectedTile = null;
                window.soundSystem.playPlace();
            }
        } else if (this.slots[slotIndex] !== null) {
            this.saveHistory();
            const num = this.slots[slotIndex];
            this.slots[slotIndex] = null;
            this.bank.push(num);
            this.bank.sort((a,b) => a - b);
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
        this.slots = [...lastState.slots];
        this.bank = [...lastState.bank].sort((a,b) => a - b);
        this.selectedTile = null;
        window.soundSystem.playRemove();
        this.render();
    }

    clearBoard() {
        if (this.slots.every(s => s === null) || this.isGameOver) return;
        this.saveHistory();
        this.slots = Array(10).fill(null);
        this.bank = [...this.INITIAL_NUMBERS].sort((a,b) => a - b);
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

        this.bank.sort((a,b) => a - b);
        this.hintsCount--;
        window.soundSystem.playHint();
        this.render();
        this.checkWinCondition(false);
    }

    /* ==========================================================================
       WIN CONDITION & MULTIPLAYER NOTIFICATIONS
       ========================================================================== */

    checkWinCondition(isManualCheck = false) {
        const isFull = this.slots.every(s => s !== null);
        let satisfiedCount = 0;

        this.rules.forEach(rule => {
            const res = rule.check(this.slots);
            if (res === true) satisfiedCount++;
        });

        const allSatisfied = satisfiedCount === this.rules.length;

        // Broadcast progress in multiplayer mode
        if (window.multiplayer && window.multiplayer.isOpponentConnected) {
            const filledCount = this.slots.filter(s => s !== null).length;
            window.multiplayer.sendProgress(filledCount, satisfiedCount);
        }

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

        if (window.multiplayer && window.multiplayer.isOpponentConnected) {
            window.multiplayer.sendWin();
        }

        if (this.dom.victoryTitle) this.dom.victoryTitle.textContent = "XUẤT SẮC! BẠN ĐÃ THẮNG";
        if (this.dom.victoryDesc) this.dom.victoryDesc.innerHTML = `Bạn đã giải thành công dãy số logic trong thời gian <strong id="final-time">${this.dom.timerDisplay.textContent}</strong>!`;

        this.dom.victorySequence.innerHTML = this.slots.map(num => 
            `<div class="tile" data-num="${num}">${num}</div>`
        ).join('');

        this.showModal(this.dom.victoryModal);
    }

    onOpponentWon() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.stopTimer();

        if (this.dom.victoryTitle) this.dom.victoryTitle.textContent = "ĐỐI THỦ ĐÃ THẮNG!";
        if (this.dom.victoryDesc) this.dom.victoryDesc.innerHTML = `Đối thủ đã giải đố thành công trước bạn! Rút kinh nghiệm cho ván sau nhé.`;

        this.dom.victorySequence.innerHTML = this.secretSolution.map(num => 
            `<div class="tile" data-num="${num}">${num}</div>`
        ).join('');

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

    showModal(modal) { if (modal) modal.classList.add('active'); }
    hideModal(modal) { if (modal) modal.classList.remove('active'); }

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
        this.bank.forEach((num, bankIdx) => {
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
