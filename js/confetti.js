/* ==========================================================================
   CONFETTI ANIMATION SYSTEM
   ========================================================================== */

class ConfettiSystem {
    constructor() {
        this.canvas = document.getElementById('confetti-canvas');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.particles = [];
        this.animationFrame = null;

        if (this.canvas) {
            this.resize();
            window.addEventListener('resize', () => this.resize());
        }
    }

    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    start() {
        if (!this.canvas || !this.ctx) return;
        this.particles = [];
        const colors = ['#00f0ff', '#e056fd', '#ffb703', '#10b981', '#ffffff', '#3b82f6'];

        for (let i = 0; i < 150; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height - this.canvas.height,
                size: Math.random() * 8 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * 5 + 3,
                rotation: Math.random() * 360,
                vRot: (Math.random() - 0.5) * 10
            });
        }

        this.animate();
    }

    animate() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        let activeCount = 0;
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.rotation += p.vRot;

            if (p.y < this.canvas.height) {
                activeCount++;
            }

            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate((p.rotation * Math.PI) / 180);
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            this.ctx.restore();
        });

        if (activeCount > 0) {
            this.animationFrame = requestAnimationFrame(() => this.animate());
        } else {
            this.stop();
        }
    }

    stop() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
}

window.confettiSystem = new ConfettiSystem();
