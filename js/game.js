/* ==========================================================================
   SỐ LOGIC 10 - GAME ENGINE & PUZZLE GENERATOR
   ========================================================================== */

class LogicGame {
    constructor() {
        this.INITIAL_NUMBERS = [1, 2, 2, 3, 3, 3, 4, 4, 4, 4];
        this.slots = Array(10).fill(null);
        this.bank = [...this.INITIAL_NUMBERS];
        this.secretSolution = null;
        this.rules = [];
        this.history = [];
        this.selectedTile = null; // { num, source: 'bank'|'slot', index }
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
        // Control buttons
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

        // Sound toggle
        this.dom.btnSound.addEventListener('click', () => {
            const enabled = window.soundSystem.toggle();
            this.dom.btnSound.innerHTML = enabled ? 
                '<i class="fa-solid fa-volume-high"></i>' : 
                '<i class="fa-solid fa-volume-xmark"></i>';
        });

        // Help Modal
        this.dom.btnHelp.addEventListener('click', () => this.showModal(this.dom.helpModal));
        document.querySelectorAll('.close-modal-btn').forEach(btn => {
            btn.addEventListener('click', () => this.hideModal(this.dom.helpModal));
        });

        // Close modal on click outside
        window.addEventListener('click', (e) => {
            if (e.target === this.dom.helpModal) this.hideModal(this.dom.helpModal);
        });
    }

    /* ==========================================================================
       PUZZLE GENERATOR
       ========================================================================== */

    startNewGame() {
        this.slots = Array(10).fill(null);
        this.bank = [...this.INITIAL_NUMBERS];
        this.history = [];
        this.selectedTile = null;
        this.hintsCount = 3;
        this.isGameOver = false;

        // Generate secret valid sequence
        this.secretSolution = this.generateValidSequence();
        // Generate rules
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
            
            // Check Rule 2: Two 2s not adjacent
            let isValid = true;
            let twoIndices = [];
            let oneIdx = -1;
            let threeIndices = [];

            for (let i = 0; i < arr.length; i++) {
                if (arr[i] === 2) twoIndices.push(i);
                if (arr[i] === 1) oneIdx = i;
                if (arr[i] === 3) threeIndices.push(i);
            }

            // Check 2s distance > 1
            if (Math.abs(twoIndices[0] - twoIndices[1]) <= 1) isValid = false;

            // Check at least one 3 is adjacent to 1
            let hasThreeAdjacentToOne = threeIndices.some(idx => Math.abs(idx - oneIdx) === 1);
            if (!hasThreeAdjacentToOne) isValid = false;

            if (isValid) {
                console.log("Generated Secret Solution:", arr);
                return arr;
            }
        }

        // Fallback default valid sequence
        return [4, 2, 4, 3, 1, 3, 4, 2, 4, 3];
    }

    generateRules(solution) {
        // Base mandatory user rules
        const rules = [
            {
                id: 'rule_freq',
                text: 'Có đúng 1 số 1, 2 số 2, 3 số 3 và 4 số 4',
                check: (slots) => {
                    const counts = {1:0, 2:0, 3:0, 4:0};
                    slots.forEach(n => { if (n) counts[n]++; });
                    // If full 10 slots filled
                    if (slots.filter(n => n !== null).length === 10) {
                        return counts[1] === 1 && counts[2] === 2 && counts[3] === 3 && counts[4] === 4;
                    }
                    // Over-limit check
                    if (counts[1] > 1 || counts[2] > 2 || counts[3] > 3 || counts[4] > 4) return false;
                    return null; // pending
                }
            },
            {
                id: 'rule_twos_adjacent',
                text: 'Hai số 2 KHÔNG được nằm kề cạnh nhau',
                check: (slots) => {
                    const twos = [];
                    for (let i = 0; i < 10; i++) {
                        if (slots[i] === 2) twos.push(i);
                    }
                    if (twos.length >= 2) {
                        return Math.abs(twos[0] - twos[1]) > 1;
                    }
                    // Check if two adjacent 2s exist right now
                    for (let i = 0; i < 9; i++) {
                        if (slots[i] === 2 && slots[i+1] === 2) return false;
                    }
                    return null;
                }
            },
            {
                id: 'rule_three_next_to_one',
                text: 'Có ít nhất một số 3 đứng kề cạnh số 1',
                check: (slots) => {
                    const oneIdx = slots.indexOf(1);
                    if (oneIdx === -1) return null;

                    const leftIsThree = oneIdx > 0 && slots[oneIdx - 1] === 3;
                    const rightIsThree = oneIdx < 9 && slots[oneIdx + 1] === 3;

                    if (leftIsThree || rightIsThree) return true;

                    // If neighbors are filled with non-3 numbers, it's invalid
                    const leftFilled = oneIdx === 0 || slots[oneIdx - 1] !== null;
                    const rightFilled = oneIdx === 9 || slots[oneIdx + 1] !== null;

                    if (leftFilled && rightFilled) return false;

                    return null;
                }
            }
        ];

        // Additional generated location clues based on secretSolution
        const extraCluesCandidates = [];

        // Clue: Distance between 2s
        const twos = [];
        for (let i = 0; i < 10; i++) if (solution[i] === 2) twos.push(i);
        const distTwos = Math.abs(twos[1] - twos[0]);
        extraCluesCandidates.push({
            id: 'rule_dist_twos',
            text: `Hai số 2 cách nhau đúng ${distTwos - 1} ô trống (khoảng cách là ${distTwos} vị trí)`,
            check: (slots) => {
                const currentTwos = [];
                for (let i = 0; i < 10; i++) if (slots[i] === 2) currentTwos.push(i);
                if (currentTwos.length === 2) {
                    return Math.abs(currentTwos[1] - currentTwos[0]) === distTwos;
                }
                return null;
            }
        });

        // Clue: Position parity of 1 (Even or Odd index)
        const oneIdx = solution.indexOf(1);
        const onePosHuman = oneIdx + 1;
        const isOdd = onePosHuman % 2 !== 0;
        extraCluesCandidates.push({
            id: 'rule_one_parity',
            text: `Số 1 nằm ở ô vị trí ${isOdd ? 'LẺ (ô #1, #3, #5, #7, #9)' : 'CHẴN (ô #2, #4, #6, #8, #10)'}`,
            check: (slots) => {
                const idx = slots.indexOf(1);
                if (idx !== -1) {
                    const pos = idx + 1;
                    return isOdd ? (pos % 2 !== 0) : (pos % 2 === 0);
                }
                return null;
            }
        });

        // Clue: First or Last element
        const firstNum = solution[0];
        extraCluesCandidates.push({
            id: 'rule_first_elem',
            text: `Số đầu tiên ở ô #1 là số ${firstNum}`,
            check: (slots) => {
                if (slots[0] !== null) return slots[0] === firstNum;
                return null;
            }
        });

        const lastNum = solution[9];
        extraCluesCandidates.push({
            id: 'rule_last_elem',
            text: `Số cuối cùng ở ô #10 là số ${lastNum}`,
            check: (slots) => {
                if (slots[9] !== null) return slots[9] === lastNum;
                return null;
            }
        });

        // Pick 2 random extra clues
        const shuffled = extraCluesCandidates.sort(() => Math.random() - 0.5);
        rules.push(shuffled[0]);
        if (shuffled[1]) rules.push(shuffled[1]);

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
            // Deselect
            this.selectedTile = null;
        } else {
            this.selectedTile = { num, source: 'bank', index };
        }
        this.render();
    }

    selectSlot(slotIndex) {
        if (this.isGameOver) return;

        // Case 1: Placing a selected tile from bank into slot
        if (this.selectedTile && this.selectedTile.source === 'bank') {
            const prevNum = this.slots[slotIndex];

            // Save history
            this.saveHistory();

            // Place tile
            this.slots[slotIndex] = this.selectedTile.num;
            // Remove from bank
            this.bank.splice(this.selectedTile.index, 1);

            // If slot already had a tile, return prev to bank
            if (prevNum !== null) {
                this.bank.push(prevNum);
            }

            this.selectedTile = null;
            window.soundSystem.playPlace();
        }
        // Case 2: Moving tile between slots
        else if (this.selectedTile && this.selectedTile.source === 'slot') {
            const fromIndex = this.selectedTile.index;
            if (fromIndex !== slotIndex) {
                this.saveHistory();
                const temp = this.slots[slotIndex];
                this.slots[slotIndex] = this.slots[fromIndex];
                this.slots[fromIndex] = temp;
                window.soundSystem.playPlace();
            }
            this.selectedTile = null;
        }
        // Case 3: Clicking a filled slot (select or return to bank if clicked again)
        else if (this.slots[slotIndex] !== null) {
            // Return to bank directly
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

        // Find an empty slot or an incorrect slot
        const candidateIndices = [];
        for (let i = 0; i < 10; i++) {
            if (this.slots[i] !== this.secretSolution[i]) {
                candidateIndices.push(i);
            }
        }

        if (candidateIndices.length === 0) return;

        // Pick one index
        const targetIdx = candidateIndices[Math.floor(Math.random() * candidateIndices.length)];
        const correctNum = this.secretSolution[targetIdx];

        this.saveHistory();

        // If current slot has wrong tile, return it to bank
        if (this.slots[targetIdx] !== null) {
            this.bank.push(this.slots[targetIdx]);
            this.slots[targetIdx] = null;
        }

        // Find correctNum in bank
        const bankIdx = this.bank.indexOf(correctNum);
        if (bankIdx !== -1) {
            this.bank.splice(bankIdx, 1);
            this.slots[targetIdx] = correctNum;
        } else {
            // If correctNum is in another slot, swap it
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

        // Render winning sequence in modal
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

    showModal(modal) {
        modal.classList.add('active');
    }

    hideModal(modal) {
        modal.classList.remove('active');
    }

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
        // Sort bank tiles ascending for neat display
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

        // Update counters
        const filled = this.slots.filter(s => s !== null).length;
        this.dom.filledCount.textContent = filled;
        this.dom.satisfiedRulesCount.textContent = satisfiedCount;
        this.dom.totalRulesCount.textContent = this.rules.length;
        this.dom.hintCountDisplay.textContent = this.hintsCount;
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    window.game = new LogicGame();
});
