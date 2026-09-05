/* ==========================================================================
   AUDIO SYSTEM (Web Audio API Synthesizer)
   ========================================================================== */

class SoundSystem {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
    }

    playTone(freq, type = 'sine', duration = 0.1, gainValue = 0.1) {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

            gain.gain.setValueAtTime(gainValue, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {
            console.error(e);
        }
    }

    playClick() {
        this.playTone(440, 'sine', 0.05, 0.08);
    }

    playPlace() {
        this.playTone(600, 'triangle', 0.08, 0.12);
        setTimeout(() => this.playTone(800, 'triangle', 0.08, 0.1), 50);
    }

    playRemove() {
        this.playTone(350, 'sine', 0.08, 0.08);
    }

    playHint() {
        this.playTone(523.25, 'sine', 0.1, 0.1); // C5
        setTimeout(() => this.playTone(659.25, 'sine', 0.1, 0.1), 80); // E5
        setTimeout(() => this.playTone(783.99, 'sine', 0.15, 0.12), 160); // G5
    }

    playError() {
        this.playTone(200, 'sawtooth', 0.15, 0.1);
        setTimeout(() => this.playTone(160, 'sawtooth', 0.2, 0.1), 100);
    }

    playVictory() {
        if (!this.enabled) return;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
            setTimeout(() => {
                this.playTone(freq, 'triangle', 0.25, 0.15);
            }, idx * 120);
        });
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}

window.soundSystem = new SoundSystem();
