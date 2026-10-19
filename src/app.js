/**
 * Main Application Controller for Lucky Wheel Studio
 */

import { sound } from './audio.js';
import { ConfettiCelebration } from './confetti.js';
import { LuckyWheel } from './wheel.js';
import { THEMES, PRESETS } from './presets.js';

class App {
  constructor() {
    this.currentTheme = 'cyberpunk';
    this.items = [];
    this.history = [];
    this.autoEliminate = false;
    this.lastWinner = null;

    this.initDOM();
    this.loadState();
    this.initWheel();
    this.initConfetti();
    this.bindEvents();
    this.renderThemes();
    this.renderPresets();
    this.renderItemsList();
    this.renderHistory();

    // Ensure perfect layout measurement once CSS layout is calculated
    requestAnimationFrame(() => {
      this.wheel.initCanvas();
      this.wheel.render();
    });
    setTimeout(() => {
      this.wheel.initCanvas();
      this.wheel.render();
    }, 150);
  }

  initDOM() {
    this.wheelCanvas = document.getElementById('wheelCanvas');
    this.confettiCanvas = document.getElementById('confettiCanvas');
    this.spinBtn = document.getElementById('spinBtn');
    this.muteBtn = document.getElementById('muteBtn');
    this.streamerBtn = document.getElementById('streamerBtn');
    this.fullscreenBtn = document.getElementById('fullscreenBtn');
    this.exitStreamerBtn = document.getElementById('exitStreamerBtn');

    // Quick Actions
    this.shuffleBtn = document.getElementById('shuffleBtn');
    this.sortBtn = document.getElementById('sortBtn');
    this.bulkAddBtn = document.getElementById('bulkAddBtn');
    this.clearAllBtn = document.getElementById('clearAllBtn');

    // Items
    this.addItemForm = document.getElementById('addItemForm');
    this.itemTextInput = document.getElementById('itemTextInput');
    this.itemColorInput = document.getElementById('itemColorInput');
    this.itemWeightInput = document.getElementById('itemWeightInput');
    this.weightDisplay = document.getElementById('weightDisplay');
    this.itemsCountBadge = document.getElementById('itemsCountBadge');
    this.itemsList = document.getElementById('itemsList');

    // Settings
    this.durationSlider = document.getElementById('durationSlider');
    this.durationDisplay = document.getElementById('durationDisplay');
    this.idleDriftToggle = document.getElementById('idleDriftToggle');
    this.autoEliminateToggle = document.getElementById('autoEliminateToggle');
    this.soundToggle = document.getElementById('soundToggle');
    this.volumeSlider = document.getElementById('volumeSlider');
    this.historyList = document.getElementById('historyList');
    this.clearHistoryBtn = document.getElementById('clearHistoryBtn');

    // Modals
    this.winnerModal = document.getElementById('winnerModal');
    this.winnerTitle = document.getElementById('winnerTitle');
    this.modalSpinAgainBtn = document.getElementById('modalSpinAgainBtn');
    this.modalEliminateBtn = document.getElementById('modalEliminateBtn');
    this.modalCopyBtn = document.getElementById('modalCopyBtn');
    this.modalCloseBtn = document.getElementById('modalCloseBtn');

    this.bulkAddModal = document.getElementById('bulkAddModal');
    this.bulkAddTextarea = document.getElementById('bulkAddTextarea');
    this.bulkAddSubmitBtn = document.getElementById('bulkAddSubmitBtn');
    this.bulkAddCancelBtn = document.getElementById('bulkAddCancelBtn');

    this.themesGrid = document.getElementById('themesGrid');
    this.presetsList = document.getElementById('presetsList');
  }

  loadState() {
    try {
      const savedTheme = localStorage.getItem('cark_theme');
      if (savedTheme && THEMES[savedTheme]) {
        this.currentTheme = savedTheme;
      }
      document.body.dataset.theme = this.currentTheme;

      const savedItems = localStorage.getItem('cark_items');
      if (savedItems) {
        this.items = JSON.parse(savedItems);
      } else {
        // Default to first preset (Yemek)
        this.items = JSON.parse(JSON.stringify(PRESETS[0].items));
      }

      const savedDuration = localStorage.getItem('cark_duration');
      if (savedDuration) {
        this.durationSlider.value = savedDuration;
        this.durationDisplay.textContent = `${savedDuration}s`;
      }

      const savedEliminate = localStorage.getItem('cark_auto_eliminate');
      if (savedEliminate !== null) {
        this.autoEliminate = JSON.parse(savedEliminate);
        this.autoEliminateToggle.checked = this.autoEliminate;
      }

      const savedIdle = localStorage.getItem('cark_idle_drift');
      if (savedIdle !== null && this.idleDriftToggle) {
        const isIdle = JSON.parse(savedIdle);
        this.idleDriftToggle.checked = isIdle;
        if (this.wheel) this.wheel.setIdleRotating(isIdle);
      }

      const savedHistory = localStorage.getItem('cark_history');
      if (savedHistory) {
        this.history = JSON.parse(savedHistory);
      }

      // Initial color for input
      this.updateNextInputColor();
    } catch (e) {
      console.warn('Error loading state:', e);
    }
  }

  saveItems() {
    try {
      localStorage.setItem('cark_items', JSON.stringify(this.items));
    } catch (e) {}
  }

  saveHistory() {
    try {
      localStorage.setItem('cark_history', JSON.stringify(this.history));
    } catch (e) {}
  }

  initWheel() {
    const themeConfig = THEMES[this.currentTheme];
    const duration = parseInt(this.durationSlider.value, 10) || 6;

    this.wheel = new LuckyWheel(this.wheelCanvas, {
      items: this.items,
      theme: themeConfig,
      spinDuration: duration,
      onSpinStart: () => {
        if (this.spinBtn) {
          this.spinBtn.disabled = true;
          this.spinBtn.innerHTML = '<span>DÖNÜYOR...</span>';
        }
      },
      onSpinEnd: (winner) => {
        if (this.spinBtn) {
          this.spinBtn.disabled = false;
          this.spinBtn.innerHTML = '<span class="spin-icon">⚡</span><span>ÇARKI ÇEVİR</span>';
        }
        this.handleWinner(winner);
      }
    });
  }

  initConfetti() {
    this.confetti = new ConfettiCelebration(this.confettiCanvas);
  }

  updateNextInputColor() {
    const themeConfig = THEMES[this.currentTheme] || THEMES.cyberpunk;
    const colorIndex = this.items.length % themeConfig.palette.length;
    this.itemColorInput.value = themeConfig.palette[colorIndex];
  }

  bindEvents() {
    // Spin trigger
    if (this.spinBtn) {
      this.spinBtn.addEventListener('click', () => {
        sound.playClick();
        this.wheel.spin();
      });
    }

    // Space key triggers spin
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !this.wheel.isSpinning) {
        // Only if user is not actively typing in an input/textarea
        const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
        if (tag !== 'input' && tag !== 'textarea') {
          e.preventDefault();
          this.wheel.spin();
        }
      }
    });

    // Audio & UI Controls
    this.muteBtn.addEventListener('click', () => {
      const isMuted = !sound.muted;
      sound.setMuted(isMuted);
      this.muteBtn.textContent = isMuted ? '🔇' : '🔊';
      this.soundToggle.checked = !isMuted;
    });

    this.soundToggle.addEventListener('change', (e) => {
      sound.setMuted(!e.target.checked);
      this.muteBtn.textContent = e.target.checked ? '🔊' : '🔇';
    });

    this.volumeSlider.addEventListener('input', (e) => {
      sound.setVolume(e.target.value / 100);
    });

    // Duration slider
    this.durationSlider.addEventListener('input', (e) => {
      const val = e.target.value;
      this.durationDisplay.textContent = `${val}s`;
      this.wheel.setDuration(parseInt(val, 10));
      localStorage.setItem('cark_duration', val);
    });

    // Idle drift toggle
    if (this.idleDriftToggle) {
      this.idleDriftToggle.addEventListener('change', (e) => {
        this.wheel.setIdleRotating(e.target.checked);
        localStorage.setItem('cark_idle_drift', JSON.stringify(e.target.checked));
      });
    }

    // Auto eliminate toggle
    this.autoEliminateToggle.addEventListener('change', (e) => {
      this.autoEliminate = e.target.checked;
      localStorage.setItem('cark_auto_eliminate', JSON.stringify(this.autoEliminate));
    });

    // Streamer & Fullscreen
    this.streamerBtn.addEventListener('click', () => {
      document.body.classList.toggle('streamer-mode');
      this.wheel.initCanvas();
      this.wheel.render();
    });

    this.exitStreamerBtn.addEventListener('click', () => {
      document.body.classList.remove('streamer-mode');
      this.wheel.initCanvas();
      this.wheel.render();
    });

    this.fullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });

    // Tabs navigation
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        sound.playClick();
        tabBtns.forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const tabId = btn.getAttribute('data-tab');
        const panel = document.getElementById(`panel-${tabId}`);
        if (panel) panel.classList.add('active');
      });
    });

    // Add item form
    this.itemWeightInput.addEventListener('input', (e) => {
      this.weightDisplay.textContent = `${e.target.value}x`;
    });

    this.addItemForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = this.itemTextInput.value.trim();
      if (!text) return;

      sound.playClick();
      const color = this.itemColorInput.value;
      const weight = parseInt(this.itemWeightInput.value, 10) || 1;

      this.items.push({ text, color, weight, active: true });
      this.saveItems();
      this.wheel.setItems(this.items);
      this.renderItemsList();

      this.itemTextInput.value = '';
      this.itemWeightInput.value = '1';
      this.weightDisplay.textContent = '1x';
      this.updateNextInputColor();
      this.itemTextInput.focus();
    });

    // Quick Actions
    this.shuffleBtn.addEventListener('click', () => {
      sound.playClick();
      // Fisher-Yates shuffle
      for (let i = this.items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.items[i], this.items[j]] = [this.items[j], this.items[i]];
      }
      this.saveItems();
      this.wheel.setItems(this.items);
      this.renderItemsList();
    });

    this.sortBtn.addEventListener('click', () => {
      sound.playClick();
      this.items.sort((a, b) => (a.text || '').localeCompare(b.text || '', 'tr'));
      this.saveItems();
      this.wheel.setItems(this.items);
      this.renderItemsList();
    });

    this.clearAllBtn.addEventListener('click', () => {
      if (confirm('Tüm seçenekleri silmek istediğinize emin misiniz?')) {
        sound.playClick();
        this.items = [];
        this.saveItems();
        this.wheel.setItems(this.items);
        this.renderItemsList();
      }
    });

    // Bulk Add Modal
    this.bulkAddBtn.addEventListener('click', () => {
      sound.playClick();
      this.bulkAddModal.classList.add('active');
      this.bulkAddTextarea.focus();
    });

    this.bulkAddCancelBtn.addEventListener('click', () => {
      this.bulkAddModal.classList.remove('active');
    });

    this.bulkAddSubmitBtn.addEventListener('click', () => {
      const rawText = this.bulkAddTextarea.value;
      const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length > 0) {
        sound.playClick();
        const themeConfig = THEMES[this.currentTheme] || THEMES.cyberpunk;
        lines.forEach(line => {
          const color = themeConfig.palette[this.items.length % themeConfig.palette.length];
          this.items.push({ text: line, color, weight: 1, active: true });
        });
        this.saveItems();
        this.wheel.setItems(this.items);
        this.renderItemsList();
      }
      this.bulkAddTextarea.value = '';
      this.bulkAddModal.classList.remove('active');
    });

    // Winner Modal Actions
    this.modalCloseBtn.addEventListener('click', () => {
      this.winnerModal.classList.remove('active');
      this.wheel.pauseIdleUntil = performance.now() + 500;
    });

    this.modalSpinAgainBtn.addEventListener('click', () => {
      this.winnerModal.classList.remove('active');
      setTimeout(() => this.wheel.spin(), 200);
    });

    this.modalEliminateBtn.addEventListener('click', () => {
      if (this.lastWinner) {
        this.eliminateItem(this.lastWinner);
      }
      this.winnerModal.classList.remove('active');
    });

    this.modalCopyBtn.addEventListener('click', () => {
      if (this.lastWinner) {
        navigator.clipboard.writeText(this.lastWinner.text).then(() => {
          this.modalCopyBtn.textContent = '✓ Kopyalandı!';
          setTimeout(() => { this.modalCopyBtn.textContent = '📋 Kopyala'; }, 1500);
        });
      }
    });

    // Clear History
    this.clearHistoryBtn.addEventListener('click', () => {
      this.history = [];
      this.saveHistory();
      this.renderHistory();
    });
  }

  handleWinner(winner) {
    this.lastWinner = winner;
    const themeConfig = THEMES[this.currentTheme] || THEMES.cyberpunk;

    // Confetti explosion
    this.confetti.launch(themeConfig.confettiColors);

    // Update history
    const now = new Date();
    const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.history.unshift({ text: winner.text, color: winner.color, time: timeStr });
    if (this.history.length > 50) this.history.pop();
    this.saveHistory();
    this.renderHistory();

    // Winner Modal show
    this.winnerTitle.textContent = winner.text;
    setTimeout(() => {
      this.winnerModal.classList.add('active');
    }, 450);

    // Auto eliminate if option enabled
    if (this.autoEliminate) {
      setTimeout(() => {
        this.eliminateItem(winner);
      }, 1200);
    }
  }

  eliminateItem(targetItem) {
    const idx = this.items.findIndex(it => it === targetItem || (it.text === targetItem.text && it.color === targetItem.color));
    if (idx !== -1) {
      this.items.splice(idx, 1);
      this.saveItems();
      this.wheel.setItems(this.items);
      this.renderItemsList();
    }
  }

  renderItemsList() {
    this.itemsList.innerHTML = '';
    const totalWeight = this.items.filter(it => it.active !== false).reduce((s, it) => s + (Number(it.weight) || 1), 0);
    this.itemsCountBadge.textContent = `${this.items.length} Seçenek (${totalWeight}x Toplam)`;

    if (this.items.length === 0) {
      this.itemsList.innerHTML = `
        <div style="text-align:center; padding:30px 10px; color:var(--text-secondary); font-size:0.9rem;">
          Henüz seçenek eklenmedi.<br>Yukarıdaki formdan veya <strong>Toplu Ekle</strong> ile başlayın!
        </div>
      `;
      return;
    }

    this.items.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'item-row';
      if (item.active === false) {
        row.style.opacity = '0.45';
        row.style.textDecoration = 'line-through';
      }

      const weightVal = Number(item.weight) || 1;
      const percent = totalWeight > 0 && item.active !== false
        ? ((weightVal / totalWeight) * 100).toFixed(1)
        : '0.0';

      row.innerHTML = `
        <div class="item-color-indicator" style="background:${item.color || '#00F0FF'};"></div>
        <div class="item-text" title="${this.escapeHtml(item.text)}">${this.escapeHtml(item.text)}</div>
        <div class="item-weight-badge" title="Şans Oranı">${percent}%</div>
        <div class="item-actions">
          <button class="item-action-btn toggle-active" title="${item.active !== false ? 'Devre Dışı Bırak' : 'Aktif Et'}">
            ${item.active !== false ? '👁️' : '🚫'}
          </button>
          <button class="item-action-btn delete" title="Sil">
            🗑️
          </button>
        </div>
      `;

      // Toggle active
      row.querySelector('.toggle-active').addEventListener('click', (e) => {
        e.stopPropagation();
        item.active = item.active === false ? true : false;
        this.saveItems();
        this.wheel.setItems(this.items);
        this.renderItemsList();
      });

      // Delete
      row.querySelector('.delete').addEventListener('click', (e) => {
        e.stopPropagation();
        this.items.splice(index, 1);
        this.saveItems();
        this.wheel.setItems(this.items);
        this.renderItemsList();
      });

      this.itemsList.appendChild(row);
    });
  }

  renderThemes() {
    this.themesGrid.innerHTML = '';
    Object.values(THEMES).forEach(th => {
      const card = document.createElement('div');
      card.className = `theme-card ${th.id === this.currentTheme ? 'active' : ''}`;
      
      const dotsHtml = th.palette.slice(0, 5).map(c => `<div class="theme-dot" style="background:${c};"></div>`).join('');

      card.innerHTML = `
        <div class="theme-card-title">
          <span>${th.icon}</span>
          <span>${th.name}</span>
        </div>
        <div class="theme-preview-dots">
          ${dotsHtml}
        </div>
      `;

      card.addEventListener('click', () => {
        sound.playClick();
        this.setTheme(th.id);
      });

      this.themesGrid.appendChild(card);
    });
  }

  setTheme(themeId) {
    if (!THEMES[themeId]) return;
    this.currentTheme = themeId;
    document.body.dataset.theme = themeId;
    localStorage.setItem('cark_theme', themeId);

    const themeConfig = THEMES[themeId];
    this.wheel.setTheme(themeConfig);

    // Re-color existing items according to theme palette if user desires
    this.items.forEach((item, idx) => {
      item.color = themeConfig.palette[idx % themeConfig.palette.length];
    });
    this.saveItems();
    this.wheel.setItems(this.items);
    this.renderItemsList();
    this.renderThemes();
    this.updateNextInputColor();
  }

  renderPresets() {
    this.presetsList.innerHTML = '';
    PRESETS.forEach(preset => {
      const card = document.createElement('div');
      card.className = 'preset-card';
      card.innerHTML = `
        <div class="preset-title">${preset.name}</div>
        <div class="preset-desc">${preset.description} (${preset.items.length} Seçenek)</div>
      `;

      card.addEventListener('click', () => {
        if (confirm(`"${preset.name}" şablonunu yüklemek istiyor musunuz? Mevcut liste güncellenecek.`)) {
          sound.playClick();
          this.items = JSON.parse(JSON.stringify(preset.items));
          this.saveItems();
          this.wheel.setItems(this.items);
          this.renderItemsList();
          // Switch to items tab
          document.querySelector('.tab-btn[data-tab="items"]').click();
        }
      });

      this.presetsList.appendChild(card);
    });
  }

  renderHistory() {
    this.historyList.innerHTML = '';
    if (this.history.length === 0) {
      this.historyList.innerHTML = '<div style="text-align:center; color:var(--text-secondary); padding:16px; font-size:0.85rem;">Henüz dönüş yapılmadı.</div>';
      return;
    }

    this.history.forEach(item => {
      const row = document.createElement('div');
      row.className = 'history-item';
      row.innerHTML = `
        <div class="history-winner">
          <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${item.color || '#00F0FF'};"></span>
          <span>${this.escapeHtml(item.text)}</span>
        </div>
        <div class="history-time">${item.time}</div>
      `;
      this.historyList.appendChild(row);
    });
  }

  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

// Start app once DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  window.carkApp = new App();
});
