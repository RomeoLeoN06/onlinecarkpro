/**
 * High Performance Canvas Confetti & Particle Explosion System
 */

export class ConfettiCelebration {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.particles = [];
    this.animationId = null;
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth * window.devicePixelRatio;
    this.canvas.height = window.innerHeight * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  /**
   * Launch a grand victory celebration with cannons & fireworks
   */
  launch(colors = ['#FFD700', '#FF3366', '#00F0FF', '#7000FF', '#00FF66', '#FFAA00']) {
    this.resizeCanvas();
    this.particles = [];

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Left cannon
    for (let i = 0; i < 90; i++) {
      this.particles.push(this.createParticle(0, height * 0.9, {
        angle: -Math.PI / 4 + (Math.random() - 0.5) * 0.45,
        speed: 16 + Math.random() * 18,
        colors
      }));
    }

    // Right cannon
    for (let i = 0; i < 90; i++) {
      this.particles.push(this.createParticle(width, height * 0.9, {
        angle: -3 * Math.PI / 4 + (Math.random() - 0.5) * 0.45,
        speed: 16 + Math.random() * 18,
        colors
      }));
    }

    // Center explosion
    for (let i = 0; i < 110; i++) {
      this.particles.push(this.createParticle(width / 2, height / 2, {
        angle: Math.random() * Math.PI * 2,
        speed: 8 + Math.random() * 16,
        colors
      }));
    }

    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.animate();
  }

  createParticle(x, y, options) {
    const angle = options.angle;
    const speed = options.speed;
    const color = options.colors[Math.floor(Math.random() * options.colors.length)];
    const shape = Math.random() > 0.3 ? 'rect' : 'circle';

    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 7 + Math.random() * 9,
      color,
      shape,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12,
      gravity: 0.35 + Math.random() * 0.25,
      friction: 0.965,
      wobble: Math.random() * 10,
      wobbleSpeed: 0.08 + Math.random() * 0.08,
      alpha: 1,
      decay: 0.007 + Math.random() * 0.007
    };
  }

  animate() {
    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      p.vx *= p.friction;
      p.vy *= p.friction;
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;

      p.rotation += p.rotationSpeed;
      p.wobble += p.wobbleSpeed;
      p.alpha -= p.decay;

      if (p.alpha <= 0 || p.y > window.innerHeight + 50) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.scale(Math.cos(p.wobble), 1);
      this.ctx.globalAlpha = Math.max(0, p.alpha);
      this.ctx.fillStyle = p.color;

      if (p.shape === 'rect') {
        this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
      } else {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        this.ctx.fill();
      }

      this.ctx.restore();
    }

    if (this.particles.length > 0) {
      this.animationId = requestAnimationFrame(() => this.animate());
    } else {
      this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      this.animationId = null;
    }
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.particles = [];
    if (this.ctx) {
      this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
  }
}
