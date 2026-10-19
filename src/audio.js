/**
 * Web Audio API Sound Synthesizer for Lucky Wheel
 * 100% Procedural & Self-contained - Zero external asset dependencies
 */

class SoundEffects {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.volume = 0.7;
    this.lastTickTime = 0;

    // Load user preferences
    try {
      const savedMute = localStorage.getItem('cark_muted');
      if (savedMute !== null) this.muted = JSON.parse(savedMute);
      const savedVol = localStorage.getItem('cark_volume');
      if (savedVol !== null) this.volume = parseFloat(savedVol);
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted) {
    this.muted = muted;
    try {
      localStorage.setItem('cark_muted', JSON.stringify(this.muted));
    } catch (e) {}
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    try {
      localStorage.setItem('cark_volume', this.volume.toString());
    } catch (e) {}
  }

  /**
   * Mechanical ratchet / peg collision tick sound
   * Frequency and volume vary based on current wheel velocity
   */
  playTick(velocityRatio = 1) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Debounce extremely rapid ticks to avoid audio buffer saturation
    if (now - this.lastTickTime < 0.02) return;
    this.lastTickTime = now;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Filter settings for crisp mechanical strike
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400 + velocityRatio * 800, now);
      filter.Q.setValueAtTime(3.5, now);

      // Pitch sweep down: gives a tactile wooden/metallic click
      const startFreq = 850 + velocityRatio * 450;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.035);

      // Amplitude envelope
      const tickVol = Math.min(1, (0.35 + velocityRatio * 0.45) * this.volume);
      gain.gain.setValueAtTime(tickVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.038);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {
      // Audio error fallback
    }
  }

  /**
   * Dynamic Whoosh sound when wheel is spun with force
   */
  playWhoosh() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.4;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Pinkish noise generator
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        data[i] = (b0 + b1 + b2) * 0.2;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(250, now);
      filter.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
      filter.frequency.exponentialRampToValueAtTime(200, now + 0.4);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.4 * this.volume, now + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
    } catch (e) {}
  }

  /**
   * Glorious 4-chord celebration fanfare & shimmer bells
   */
  playWinner() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Arpeggiated victory notes (C Major triad + 9th shimmer: C5, E5, G5, C6, D6, E6)
      const notes = [523.25, 659.25, 783.99, 1046.50, 1174.66, 1318.51];
      
      notes.forEach((freq, idx) => {
        const noteStart = now + idx * 0.08;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        // Bell-like harmonic
        osc.type = idx >= 3 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, noteStart);

        const noteVol = (idx >= 3 ? 0.35 : 0.45) * this.volume;
        gain.gain.setValueAtTime(0.001, noteStart);
        gain.gain.linearRampToValueAtTime(noteVol, noteStart + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + (idx >= 3 ? 1.5 : 0.9));

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 1.6);
      });

      // Ambient warm chord pad behind victory
      const padFreqs = [261.63, 329.63, 392.00];
      padFreqs.forEach(freq => {
        const padOsc = this.ctx.createOscillator();
        const padGain = this.ctx.createGain();
        padOsc.type = 'sine';
        padOsc.frequency.setValueAtTime(freq, now + 0.2);

        padGain.gain.setValueAtTime(0.001, now + 0.2);
        padGain.gain.linearRampToValueAtTime(0.18 * this.volume, now + 0.5);
        padGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

        padOsc.connect(padGain);
        padGain.connect(this.ctx.destination);

        padOsc.start(now + 0.2);
        padOsc.stop(now + 2.3);
      });
    } catch (e) {}
  }

  /**
   * Subtle clean UI button click sound
   */
  playClick() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.03);

      gain.gain.setValueAtTime(0.25 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {}
  }
}

export const sound = new SoundEffects();
