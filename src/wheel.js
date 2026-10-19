/**
 * Ultra-Premium HTML5 Canvas Wheel & Physics Engine
 * Features: High-DPI Retina, Spring Physics Pointer, LED Rim Chaser,
 * Variable Slice Weights, Drag/Flick Spin, and Realistic Friction
 */

import { sound } from './audio.js';

export class LuckyWheel {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.items = options.items || [];
    this.theme = options.theme;
    this.onSpinStart = options.onSpinStart || (() => {});
    this.onSpinEnd = options.onSpinEnd || (() => {});
    this.spinDuration = options.spinDuration || 6; // seconds

    // State
    this.rotation = 0; // Current angle in radians
    this.isSpinning = false;
    this.isDragging = false;
    this.dragStartAngle = 0;
    this.dragLastAngle = 0;
    this.dragAngularVelocity = 0;
    this.lastDragTime = 0;

    // Pointer physics (Spring Damper system)
    this.pointerAngle = 0;
    this.pointerVelocity = 0;
    this.lastCrossedPin = -1;

    // LED Rim Animation
    this.ledOffset = 0;
    this.ledSpeed = 0.05;
    this.isWinningCelebration = false;
    this.winningBlinkCount = 0;

    // Dimensions
    this.size = 560;
    this.centerX = 280;
    this.centerY = 280;
    this.radius = 240;

    // Idle background ambient drift (rotates subtly when not spinning)
    this.idleSpeed = options.idleSpeed !== undefined ? options.idleSpeed : 0.0032;
    this.isIdleRotating = options.isIdleRotating !== undefined ? options.isIdleRotating : true;
    this.idleAnimId = null;
    this.pauseIdleUntil = 0;

    this.initCanvas();
    this.initEvents();
    this.render();
    this.startIdleLoop();
  }

  initCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const wrapper = this.canvas.parentElement;
    
    let availableW = 460;
    let availableH = 460;

    if (window.innerWidth > 991) {
      // Desktop: constrained by wrapper clientHeight and clientWidth
      const wrapperH = wrapper ? wrapper.clientHeight : 0;
      const wrapperW = wrapper ? wrapper.clientWidth : 0;
      
      // Calculate from viewport if wrapper not measured yet
      const fallbackH = window.innerHeight - 50 - 95 - 24; // header (50) + controls (95) + margins
      const fallbackW = window.innerWidth - 410 - 48; // control deck (410) + gap/padding
      
      availableH = (wrapperH && wrapperH > 150) ? wrapperH : fallbackH;
      availableW = (wrapperW && wrapperW > 150) ? wrapperW : fallbackW;
    } else {
      // Mobile / Tablet: detect orientation
      const isLandscape = window.innerWidth > window.innerHeight;
      if (isLandscape) {
        // Landscape mobile: limit by height
        availableH = window.innerHeight - 80;
        availableW = availableH;
      } else {
        // Portrait mobile: fill screen width with comfortable margin
        availableW = Math.min(window.innerWidth - 24, 420);
        availableH = Math.min(window.innerHeight * 0.52, availableW);
      }
    }

    // Leave margin for top pointer pin, glow, and bezel
    const safeDimension = Math.floor(Math.min(availableW - 6, availableH - 6, 520));
    const displaySize = Math.max(220, safeDimension);
    
    this.size = displaySize;
    this.canvas.width = Math.round(displaySize * dpr);
    this.canvas.height = Math.round(displaySize * dpr);
    this.canvas.style.width = `${displaySize}px`;
    this.canvas.style.height = `${displaySize}px`;

    this.ctx.resetTransform?.();
    this.ctx.scale(dpr, dpr);

    this.centerX = displaySize / 2;
    this.centerY = displaySize / 2;
    this.radius = displaySize * 0.44;
  }

  setItems(items) {
    this.items = items;
    this.render();
  }

  setTheme(theme) {
    this.theme = theme;
    this.render();
  }

  setDuration(seconds) {
    this.spinDuration = Math.max(3, Math.min(20, seconds));
  }

  setIdleSpeed(speed) {
    this.idleSpeed = speed;
  }

  setIdleRotating(enabled) {
    this.isIdleRotating = enabled;
  }

  getRandom() {
    if (window.crypto && window.crypto.getRandomValues) {
      const arr = new Uint32Array(1);
      window.crypto.getRandomValues(arr);
      return arr[0] / 4294967296;
    }
    return Math.random();
  }

  startIdleLoop() {
    if (this.idleAnimId) cancelAnimationFrame(this.idleAnimId);

    const loop = (now) => {
      if (!this.isSpinning && !this.isDragging && this.isIdleRotating && now > this.pauseIdleUntil) {
        this.rotation = (this.rotation + this.idleSpeed) % (Math.PI * 2);
        this.ledOffset += 0.025;
        this.render();
      }
      this.idleAnimId = requestAnimationFrame(loop);
    };

    this.idleAnimId = requestAnimationFrame(loop);
  }

  getActiveItems() {
    const active = this.items.filter(it => it.active !== false);
    return active.length > 0 ? active : [{ text: 'Seçenek Ekleyin', color: '#6366F1', weight: 1, active: true }];
  }

  getTotalWeight() {
    return this.getActiveItems().reduce((sum, it) => sum + (Number(it.weight) || 1), 0);
  }

  /**
   * Calculate angle ranges for each active slice
   */
  getSliceAngles() {
    const items = this.getActiveItems();
    const totalWeight = this.getTotalWeight();
    let currentAngle = 0;

    return items.map(item => {
      const sliceAngle = ((Number(item.weight) || 1) / totalWeight) * (Math.PI * 2);
      const start = currentAngle;
      const end = currentAngle + sliceAngle;
      currentAngle = end;
      return { item, start, end, angle: sliceAngle };
    });
  }

  /**
   * Determine winning item based on current rotation
   * Pointer is at TOP: angle -Math.PI / 2 (or 3*PI/2)
   */
  getWinningSlice(rotationAngle = this.rotation) {
    const slices = this.getSliceAngles();
    const twoPi = Math.PI * 2;
    // Normalize rotation
    let normalized = (rotationAngle % twoPi + twoPi) % twoPi;
    
    // Top pointer is at -PI/2 in canvas space, which is 3*PI/2 (270 deg)
    // Slices are drawn rotated by `rotationAngle`.
    // The slice under the top pointer satisfies:
    // (slice.start + rotationAngle) <= topPointerAngle <= (slice.end + rotationAngle)
    const pointerPos = (3 * Math.PI / 2 - normalized + twoPi * 2) % twoPi;

    for (const slice of slices) {
      if (pointerPos >= slice.start && pointerPos < slice.end) {
        return slice.item;
      }
    }
    return slices[0].item;
  }

  /**
   * Trigger spin to a randomly selected or predetermined winner
   */
  spin() {
    if (this.isSpinning) return;
    this.isSpinning = true;
    this.isWinningCelebration = false;
    this.onSpinStart();
    sound.playWhoosh();

    const slices = this.getSliceAngles();
    // Cryptographically secure weighted random selection
    const totalWeight = this.getTotalWeight();
    let randomWeight = this.getRandom() * totalWeight;
    let selectedSlice = slices[0];

    for (const slice of slices) {
      randomWeight -= (Number(slice.item.weight) || 1);
      if (randomWeight <= 0) {
        selectedSlice = slice;
        break;
      }
    }

    // Dynamic organic landing: anywhere comfortably inside the slice (between 16% and 84% of arc)
    const sliceBuffer = selectedSlice.angle * 0.16;
    const targetOffsetInSlice = sliceBuffer + this.getRandom() * (selectedSlice.angle - sliceBuffer * 2);
    const targetSlicePos = selectedSlice.start + targetOffsetInSlice;

    // Pointer is at TOP: 3 * Math.PI / 2
    const twoPi = Math.PI * 2;
    // Dynamic randomized full spins (between 6 and 9 full rotations for suspense)
    const minSpins = 6 + Math.floor(this.getRandom() * 4);
    const currentRotMod = (this.rotation % twoPi + twoPi) % twoPi;
    
    // Desired final normalized rotation
    const desiredFinalMod = (3 * Math.PI / 2 - targetSlicePos + twoPi * 2) % twoPi;
    let extraRotation = desiredFinalMod - currentRotMod;
    if (extraRotation < 0) extraRotation += twoPi;

    const totalDelta = minSpins * twoPi + extraRotation;
    const startRotation = this.rotation;
    const finalRotation = startRotation + totalDelta;
    const duration = this.spinDuration * 1000;
    const startTime = performance.now();

    // Sound tick tracking
    this.lastCrossedPin = -1;

    // Realistic physics curve: initial dynamic acceleration surge, followed by tense quintic deceleration
    const physicsEase = (t) => {
      if (t < 0.08) {
        // Fast dynamic rev-up
        const p = t / 0.08;
        return 0.10 * (p * p);
      }
      // Long suspenseful coast
      const p = (t - 0.08) / 0.92;
      return 0.10 + 0.90 * (1 - Math.pow(1 - p, 4.8));
    };

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = physicsEase(progress);

      this.rotation = startRotation + totalDelta * eased;

      // Current angular velocity
      let currentSpeed;
      if (progress < 0.08) {
        currentSpeed = (totalDelta * 0.10 * (2 * (progress / 0.08))) / (duration * 0.08 / 1000);
      } else {
        const p = (progress - 0.08) / 0.92;
        currentSpeed = (totalDelta * 0.90 * (4.8 * Math.pow(1 - p, 3.8))) / (duration * 0.92 / 1000);
      }
      const speedRatio = Math.min(1, Math.max(0.05, currentSpeed / 25));

      // Check pin hits for pointer bounce & audio tick
      this.checkPinCollision(speedRatio);

      // LED chase speed matches wheel rotation speed
      this.ledOffset += 0.06 + speedRatio * 0.7;

      this.render();

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        this.rotation = finalRotation;
        this.isSpinning = false;
        this.isWinningCelebration = true;
        this.winningBlinkCount = 0;
        this.render();

        // Pause idle drift for 3.5s so winner remains prominently under the pointer
        this.pauseIdleUntil = performance.now() + 3500;

        const winner = this.getWinningSlice();
        sound.playWinner();
        this.onSpinEnd(winner);
      }
    };

    requestAnimationFrame(step);
  }

  /**
   * Pointer collision and spring deflection physics
   */
  checkPinCollision(speedRatio) {
    const totalPins = Math.max(12, this.getActiveItems().length * 2);
    const pinAngleStep = (Math.PI * 2) / totalPins;
    const currentPin = Math.floor(((this.rotation + Math.PI / 2) % (Math.PI * 2) + (Math.PI * 2)) / pinAngleStep);

    if (currentPin !== this.lastCrossedPin) {
      this.lastCrossedPin = currentPin;
      sound.playTick(speedRatio);
      // Give pointer an angular impulse
      this.pointerVelocity = -0.38 * Math.max(0.3, speedRatio);
    }
  }

  updatePointerPhysics() {
    // Spring physics: restoring torque + damping
    const springK = 0.28;
    const damping = 0.82;
    const springForce = -springK * this.pointerAngle;
    this.pointerVelocity = (this.pointerVelocity + springForce) * damping;
    this.pointerAngle += this.pointerVelocity;

    // Hard limit stop
    if (this.pointerAngle < -0.45) this.pointerAngle = -0.45;
    if (this.pointerAngle > 0.2) this.pointerAngle = 0.2;
  }

  render() {
    const ctx = this.ctx;
    const cx = this.centerX;
    const cy = this.centerY;
    const r = this.radius;

    ctx.clearRect(0, 0, this.size, this.size);
    this.updatePointerPhysics();

    const theme = this.theme || {
      palette: ['#3A86FF', '#FF006E', '#8338EC', '#FB5607', '#06D6A0', '#FFBE0B'],
      rimColor: '#120E2E',
      pinColor: '#00F0FF',
      hubBg: 'linear-gradient(135deg, #00F0FF, #FF0077)',
      pointerColor: '#FF0055'
    };

    // 1. Draw Outer Glowing Ring & Shadow
    ctx.save();
    ctx.shadowBlur = 35;
    ctx.shadowColor = theme.pinColor || '#00F0FF';
    ctx.beginPath();
    ctx.arc(cx, cy, r + 24, 0, Math.PI * 2);
    ctx.fillStyle = theme.rimColor || '#120E2E';
    ctx.fill();
    ctx.restore();

    // 2. Draw Outer Bezel Rim
    const bezelGrad = ctx.createRadialGradient(cx, cy, r + 4, cx, cy, r + 26);
    bezelGrad.addColorStop(0, '#1E1B2E');
    bezelGrad.addColorStop(0.5, '#2D2747');
    bezelGrad.addColorStop(1, '#0C0A17');
    ctx.beginPath();
    ctx.arc(cx, cy, r + 25, 0, Math.PI * 2);
    ctx.arc(cx, cy, r, 0, Math.PI * 2, true);
    ctx.fillStyle = bezelGrad;
    ctx.fill();

    // 3. Draw Animated Chasing LED Pins around the Rim
    const totalPins = Math.max(16, this.getActiveItems().length * 2);
    for (let i = 0; i < totalPins; i++) {
      const pinAngle = (i / totalPins) * Math.PI * 2;
      const pinX = cx + Math.cos(pinAngle) * (r + 12);
      const pinY = cy + Math.sin(pinAngle) * (r + 12);

      // Light chase intensity
      const ledPhase = (i - this.ledOffset) % totalPins;
      const normalizedPhase = ((ledPhase % totalPins) + totalPins) % totalPins;
      const isLit = normalizedPhase < 3 || this.isWinningCelebration;

      ctx.save();
      ctx.beginPath();
      ctx.arc(pinX, pinY, isLit ? 4.5 : 3.2, 0, Math.PI * 2);
      if (isLit) {
        ctx.shadowBlur = 12;
        ctx.shadowColor = theme.pinColor || '#FFD700';
        ctx.fillStyle = '#FFFFFF';
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      }
      ctx.fill();
      ctx.restore();
    }

    // 4. Draw Wheel Slices
    const slices = this.getSliceAngles();
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.rotation);

    slices.forEach((slice, idx) => {
      const itemColor = slice.item.color || theme.palette[idx % theme.palette.length];

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, slice.start, slice.end);
      ctx.closePath();

      // Slice background
      ctx.fillStyle = itemColor;
      ctx.fill();

      // Slice border / divider line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Inner radial gradient overlay for 3D depth
      const sliceGrad = ctx.createRadialGradient(0, 0, 30, 0, 0, r);
      sliceGrad.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
      sliceGrad.addColorStop(0.75, 'rgba(0, 0, 0, 0)');
      sliceGrad.addColorStop(1, 'rgba(0, 0, 0, 0.42)');
      ctx.fillStyle = sliceGrad;
      ctx.fill();

      // Draw Slice Text & Icons (Multi-line, centered, away from center hub, no ellipsis)
      ctx.save();
      const midAngle = slice.start + slice.angle / 2;
      ctx.rotate(midAngle);

      // Base font size - slightly smaller & sharper for elegant readability
      const availableArc = slice.angle * r;
      let fontSize = Math.min(14, Math.max(10, Math.floor(availableArc * 0.28)));
      if (this.size < 460) {
        fontSize = Math.min(12, Math.max(9.5, Math.floor(availableArc * 0.23)));
      }

      ctx.font = `700 ${fontSize}px "Outfit", "Inter", -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Text Shadow for high contrast readability
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      ctx.shadowBlur = 5;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.fillStyle = '#FFFFFF';

      const rawText = slice.item.text || '';
      const maxLineWidth = r * 0.52; // Text occupies at most 52% of radius

      // Smart multi-line splitter: split long texts into 2 lines instead of cutting with "..."
      let lines = [rawText];
      const words = rawText.split(' ').filter(Boolean);

      if (words.length >= 2 && (ctx.measureText(rawText).width > maxLineWidth || rawText.length > 9)) {
        // Find the most balanced split point
        let bestSplit = 1;
        let minDiff = Infinity;
        for (let i = 1; i < words.length; i++) {
          const l1 = words.slice(0, i).join(' ');
          const l2 = words.slice(i).join(' ');
          const diff = Math.abs(ctx.measureText(l1).width - ctx.measureText(l2).width);
          if (diff < minDiff) {
            minDiff = diff;
            bestSplit = i;
          }
        }
        lines = [
          words.slice(0, bestSplit).join(' '),
          words.slice(bestSplit).join(' ')
        ];
      }

      // If text still exceeds maxLineWidth (e.g. very long single word), slightly scale down font
      for (const line of lines) {
        const lw = ctx.measureText(line).width;
        if (lw > maxLineWidth) {
          const scale = maxLineWidth / lw;
          fontSize = Math.max(9, Math.floor(fontSize * scale));
          ctx.font = `700 ${fontSize}px "Outfit", "Inter", -apple-system, sans-serif`;
        }
      }

      // Position text away from center hub (textRadius = r * 0.63 sits in the wide outer sweet spot)
      const textRadius = r * 0.63;
      let lineHeight = Math.round(fontSize * 1.25);

      lines.forEach((line, lineIdx) => {
        let yOffset = 0;
        if (lines.length === 2) {
          yOffset = (lineIdx === 0 ? -1 : 1) * (lineHeight * 0.52);
        } else if (lines.length === 3) {
          yOffset = (lineIdx - 1) * lineHeight;
        }
        ctx.fillText(line, textRadius, yOffset);
      });

      ctx.restore();
    });

    ctx.restore(); // Restore translate(cx, cy) and rotation

    // 5. Draw 3D Center Hub (Primary Spin Button)
    const hubRadius = r * 0.24;
    const hubGrad = ctx.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, hubRadius);
    hubGrad.addColorStop(0, '#FFFFFF');
    hubGrad.addColorStop(0.25, '#E2E8F0');
    hubGrad.addColorStop(0.75, '#4A5568');
    hubGrad.addColorStop(1, '#0F172A');

    ctx.save();
    // Glowing ambient pulse behind hub
    ctx.beginPath();
    ctx.arc(cx, cy, hubRadius + 8, 0, Math.PI * 2);
    ctx.shadowBlur = this.isSpinning ? 35 : 22;
    ctx.shadowColor = theme.pointerColor || '#FF0055';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fill();

    // Metallic ring
    ctx.beginPath();
    ctx.arc(cx, cy, hubRadius, 0, Math.PI * 2);
    ctx.fillStyle = hubGrad;
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = theme.pinColor || '#FFD700';
    ctx.stroke();

    // Center jewel / spin button surface
    const jewelRadius = hubRadius * 0.70;
    const jewelGrad = ctx.createRadialGradient(cx - 3, cy - 3, 1, cx, cy, jewelRadius);
    jewelGrad.addColorStop(0, '#FFFFFF');
    jewelGrad.addColorStop(0.22, theme.pointerColor || '#FF0055');
    jewelGrad.addColorStop(1, '#4A0019');

    ctx.beginPath();
    ctx.arc(cx, cy, jewelRadius, 0, Math.PI * 2);
    ctx.fillStyle = jewelGrad;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.stroke();

    // Center "ÇEVİR" text / state
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 4;

    if (this.isSpinning) {
      ctx.font = `800 ${Math.floor(jewelRadius * 0.46)}px "Outfit", sans-serif`;
      ctx.fillText('⚡', cx, cy);
    } else {
      ctx.font = `800 ${Math.floor(jewelRadius * 0.40)}px "Outfit", sans-serif`;
      ctx.fillText('ÇEVİR', cx, cy);
    }
    ctx.restore();

    // 6. Draw Top Ticker / Pointer with Spring Reaction
    this.renderPointer(cx, cy - r - 2, theme);
  }

  renderPointer(x, y, theme) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.pointerAngle);

    // Pointer shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;

    // Pointer pin base / hinge
    ctx.beginPath();
    ctx.arc(0, -6, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#2D3748';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#E2E8F0';
    ctx.stroke();

    // Pointer needle pointing DOWN into the wheel
    ctx.beginPath();
    ctx.moveTo(-10, -4);
    ctx.lineTo(10, -4);
    ctx.lineTo(0, 36);
    ctx.closePath();

    const pointerGrad = ctx.createLinearGradient(-10, -4, 10, 36);
    pointerGrad.addColorStop(0, '#FFFFFF');
    pointerGrad.addColorStop(0.5, theme.pointerColor || '#FF0055');
    pointerGrad.addColorStop(1, '#9B0033');

    ctx.fillStyle = pointerGrad;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    // Center bolt on pointer hinge
    ctx.beginPath();
    ctx.arc(0, -6, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#FFD700';
    ctx.fill();

    ctx.restore();
  }

  /**
   * Touch & Mouse drag-to-spin interaction
   */
  initEvents() {
    const getAngle = (clientX, clientY) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = clientX - rect.left - rect.width / 2;
      const y = clientY - rect.top - rect.height / 2;
      return Math.atan2(y, x);
    };

    const isCenterClick = (clientX, clientY) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = clientX - rect.left - rect.width / 2;
      const y = clientY - rect.top - rect.height / 2;
      const dist = Math.sqrt(x * x + y * y);
      return dist <= this.radius * 0.32;
    };

    this.canvas.addEventListener('mousemove', (e) => {
      if (this.isSpinning) {
        this.canvas.style.cursor = 'default';
        return;
      }
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const dist = Math.sqrt(x * x + y * y);
      if (dist <= this.radius * 0.32) {
        this.canvas.style.cursor = 'pointer';
      } else {
        this.canvas.style.cursor = this.isDragging ? 'grabbing' : 'grab';
      }
    });

    const onStart = (e) => {
      if (this.isSpinning) return;
      const point = e.touches ? e.touches[0] : e;
      if (isCenterClick(point.clientX, point.clientY)) {
        this.spin();
        return;
      }
      this.isDragging = true;
      this.dragStartAngle = getAngle(point.clientX, point.clientY);
      this.dragLastAngle = this.dragStartAngle;
      this.lastDragTime = performance.now();
      this.dragAngularVelocity = 0;
    };

    const onMove = (e) => {
      if (!this.isDragging || this.isSpinning) return;
      const point = e.touches ? e.touches[0] : e;
      const currentAngle = getAngle(point.clientX, point.clientY);
      let deltaAngle = currentAngle - this.dragLastAngle;

      // Handle wrapping at -PI to PI boundary
      if (deltaAngle > Math.PI) deltaAngle -= Math.PI * 2;
      if (deltaAngle < -Math.PI) deltaAngle += Math.PI * 2;

      this.rotation += deltaAngle;
      this.dragLastAngle = currentAngle;

      const now = performance.now();
      const dt = (now - this.lastDragTime) / 1000;
      if (dt > 0.005) {
        this.dragAngularVelocity = deltaAngle / dt;
        this.lastDragTime = now;
      }

      this.checkPinCollision(Math.min(1, Math.abs(this.dragAngularVelocity) / 10));
      this.render();
    };

    const onEnd = () => {
      if (!this.isDragging) return;
      this.isDragging = false;
      // If user flicked with substantial velocity, initiate spin!
      if (Math.abs(this.dragAngularVelocity) > 4.5 && !this.isSpinning) {
        this.spin();
      }
    };

    this.canvas.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);

    this.canvas.addEventListener('touchstart', onStart, { passive: false });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);

    const onResize = () => {
      this.initCanvas();
      this.render();
    };

    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', () => {
      setTimeout(onResize, 150);
    });
  }
}
