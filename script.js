/**
 * CURLING PUZZLES — MEMORY
 * Architecture: Platform Shell + High-Fidelity Collision Physics + Daily Determinism + 2D Grid Engine
 */

(function() {
  'use strict';

  /* ==========================================================================
     0. CONSTANTS & BASELINE
     ========================================================================== */
  const STORAGE_KEY = 'curling_puzzles_memory_v1';
  const SOUND_KEY = 'curling_sound_enabled';
  
  // Baseline Day 0 = 8 September 2026 UTC
  const EPOCH_UTC = Date.UTC(2026, 8, 8); // Month is 0-indexed: 8 = Sept

  /* ==========================================================================
     1. AUDIO SYSTEM (Synthesized via Web Audio API)
     ========================================================================== */
  class SoundManager {
    constructor() {
      this.ctx = null;
      this.enabled = localStorage.getItem(SOUND_KEY) !== 'false';
    }

    initCtx() {
      if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggle() {
      this.enabled = !this.enabled;
      localStorage.setItem(SOUND_KEY, this.enabled ? 'true' : 'false');
      return this.enabled;
    }

    playTap() {
      if (!this.enabled) return;
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(540, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(760, this.ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    }

    playFlip() {
      if (!this.enabled) return;
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(340, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(460, this.ctx.currentTime + 0.07);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    }

    playMatch() {
      if (!this.enabled) return;
      this.initCtx();
      if (!this.ctx) return;
      // Dual harmonic chime
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.05);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.05 + 0.32);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + idx * 0.05);
        osc.stop(this.ctx.currentTime + idx * 0.05 + 0.33);
      });
    }

    playMismatch() {
      if (!this.enabled) return;
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(185, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.16);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
    }

    playWin() {
      if (!this.enabled) return;
      this.initCtx();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.09);
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime + i * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.09 + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + i * 0.09);
        osc.stop(this.ctx.currentTime + i * 0.09 + 0.41);
      });
    }
  }

  const soundMgr = new SoundManager();

  /* ==========================================================================
     2. AMBIENT CURLING ROCKS & RINK PHYSICS SIMULATION
     ========================================================================== */
  class RinkBackgroundPhysics {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.stones = [];
      this.animationId = null;
      this.prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.lastTimestamp = performance.now();
      this.accumulator = 0;
      this.fixedDt = 1 / 60; // 60 FPS fixed physics timestep
      this.gameActive = false;
      this.aggressiveTimer = 0;

      this.resize = this.resize.bind(this);
      this.loop = this.loop.bind(this);

      window.addEventListener('resize', this.resize, { passive: true });
      this.resize();
      this.initStones();

      if (!this.prefersReduced) {
        this.animationId = requestAnimationFrame(this.loop);
      } else {
        this.render();
      }
    }

    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.canvas.width = this.width * dpr;
      this.canvas.height = this.height * dpr;
      this.ctx.resetTransform?.();
      this.ctx.scale(dpr, dpr);
    }

    initStones() {
      const isMobile = this.width < 540;
      const count = isMobile ? 5 : 8;
      this.stones = [];

      for (let i = 0; i < count; i++) {
        const radius = isMobile ? 20 : 25;
        let x = 0, y = 0, safe = false, attempts = 0;
        
        while (!safe && attempts < 100) {
          x = radius + 10 + Math.random() * (this.width - 2 * radius - 20);
          y = radius + 10 + Math.random() * (this.height - 2 * radius - 20);
          safe = true;
          for (const other of this.stones) {
            if (Math.hypot(other.x - x, other.y - y) < radius + other.radius + 15) {
              safe = false;
              break;
            }
          }
          attempts++;
        }

        const angle = Math.random() * Math.PI * 2;
        const speed = 0.35 + Math.random() * 0.45; // Gentle natural glide

        this.stones.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius,
          mass: radius * radius,
          team: (i % 2 === 0) ? 'red' : 'yellow',
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.008,
          isAggressive: false
        });
      }
    }

    setGameActive(active) {
      this.gameActive = active;
    }

    triggerAggressiveEntry() {
      if (this.stones.length === 0) return;
      const isMobile = this.width < 540;
      const radius = isMobile ? 22 : 26;
      // Launch a fast stone from a corner/edge
      const fromTop = Math.random() > 0.5;
      const x = fromTop ? Math.random() * this.width : (Math.random() > 0.5 ? -radius : this.width + radius);
      const y = fromTop ? -radius : Math.random() * this.height * 0.5;
      
      const targetX = this.width * 0.5 + (Math.random() - 0.5) * (this.width * 0.4);
      const targetY = this.height * 0.5 + (Math.random() - 0.5) * (this.height * 0.4);
      const angle = Math.atan2(targetY - y, targetX - x);
      const speed = isMobile ? 2.6 : 3.2;

      this.stones.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius,
        mass: radius * radius,
        team: Math.random() > 0.5 ? 'red' : 'yellow',
        rotation: 0,
        vRot: (Math.random() - 0.5) * 0.04,
        isAggressive: true
      });

      // Maintain max stones ceiling
      if (this.stones.length > (isMobile ? 7 : 11)) {
        this.stones.shift();
      }
    }

    physicsStep(dt) {
      const friction = 0.08; // Authentic pebbled ice glide
      const restitution = 0.82; // Granite stone elastic collision

      // Periodic aggressive entry stone event
      this.aggressiveTimer += dt;
      if (this.aggressiveTimer > 28) {
        this.aggressiveTimer = 0;
        this.triggerAggressiveEntry();
      }

      // 1. Move & damp
      for (const s of this.stones) {
        s.x += s.vx * (dt * 60);
        s.y += s.vy * (dt * 60);
        s.rotation += s.vRot * (dt * 60);

        // Pebble ice friction decay
        s.vx *= Math.pow(1 - friction * 0.015, dt * 60);
        s.vy *= Math.pow(1 - friction * 0.015, dt * 60);
        s.vRot *= Math.pow(1 - 0.005, dt * 60);

        // Keep minimum gentle drift if not aggressive
        const currentSpeed = Math.hypot(s.vx, s.vy);
        if (currentSpeed < 0.2 && !s.isAggressive) {
          const a = s.rotation;
          s.vx = Math.cos(a) * 0.25;
          s.vy = Math.sin(a) * 0.25;
        }

        // Sheet boundary reflections
        if (s.x - s.radius < 0) {
          s.x = s.radius;
          s.vx = Math.abs(s.vx) * restitution;
        } else if (s.x + s.radius > this.width) {
          s.x = this.width - s.radius;
          s.vx = -Math.abs(s.vx) * restitution;
        }

        if (s.y - s.radius < 0) {
          s.y = s.radius;
          s.vy = Math.abs(s.vy) * restitution;
        } else if (s.y + s.radius > this.height) {
          s.y = this.height - s.radius;
          s.vy = -Math.abs(s.vy) * restitution;
        }
      }

      // 2. Collision detection & impulse resolution
      const count = this.stones.length;
      for (let i = 0; i < count; i++) {
        for (let j = i + 1; j < count; j++) {
          const s1 = this.stones[i];
          const s2 = this.stones[j];

          const dx = s2.x - s1.x;
          const dy = s2.y - s1.y;
          const dist = Math.hypot(dx, dy);
          const minDist = s1.radius + s2.radius;

          if (dist < minDist && dist > 0.001) {
            // Overlap correction to prevent interpenetration
            const overlap = (minDist - dist);
            const nx = dx / dist;
            const ny = dy / dist;

            const m1 = s1.mass;
            const m2 = s2.mass;
            const totalMass = m1 + m2;

            s1.x -= nx * overlap * (m2 / totalMass);
            s1.y -= ny * overlap * (m2 / totalMass);
            s2.x += nx * overlap * (m1 / totalMass);
            s2.y += ny * overlap * (m1 / totalMass);

            // Relative velocity
            const kx = s1.vx - s2.vx;
            const ky = s1.vy - s2.vy;
            const velAlongNormal = kx * nx + ky * ny;

            if (velAlongNormal > 0) {
              const impulse = (-(1 + restitution) * velAlongNormal) / (1 / m1 + 1 / m2);
              s1.vx += (impulse / m1) * nx;
              s1.vy += (impulse / m1) * ny;
              s2.vx -= (impulse / m2) * nx;
              s2.vy -= (impulse / m2) * ny;

              // Spin transfer
              const spinDiff = s1.vRot - s2.vRot;
              s1.vRot -= spinDiff * 0.2;
              s2.vRot += spinDiff * 0.2;
            }
          }
        }
      }
    }

    drawRinkMarkings() {
      const ctx = this.ctx;
      const cx = this.width * 0.5;
      const cy = this.height * 0.48;
      const baseR = Math.min(this.width, this.height) * 0.44;

      ctx.save();

      // Centre line (Dark blue rink ink)
      ctx.strokeStyle = 'rgba(21, 59, 93, 0.07)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, this.height);
      ctx.stroke();

      // Tee line (Crossing the house)
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(this.width, cy);
      ctx.stroke();

      // Hog line (Authentic Curling Red band with ice transparency)
      const hogY = this.height * 0.22;
      ctx.strokeStyle = 'rgba(214, 59, 59, 0.14)';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(0, hogY);
      ctx.lineTo(this.width, hogY);
      ctx.stroke();

      // House: 12-foot ring (Blue wash)
      ctx.fillStyle = 'rgba(34, 123, 240, 0.04)';
      ctx.strokeStyle = 'rgba(34, 123, 240, 0.12)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, baseR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // House: 8-foot ring (White ice sheet)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.strokeStyle = 'rgba(21, 59, 93, 0.08)';
      ctx.beginPath();
      ctx.arc(cx, cy, baseR * 0.66, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // House: 4-foot ring (Curling Red wash)
      ctx.fillStyle = 'rgba(214, 59, 59, 0.05)';
      ctx.strokeStyle = 'rgba(214, 59, 59, 0.16)';
      ctx.beginPath();
      ctx.arc(cx, cy, baseR * 0.33, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // The Button (Center)
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = 'rgba(34, 123, 240, 0.2)';
      ctx.beginPath();
      ctx.arc(cx, cy, baseR * 0.09, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }

    drawStone(s) {
      const ctx = this.ctx;
      const r = s.radius;
      const alpha = this.gameActive ? 0.25 : 0.72; // Dimmed during active puzzle to highlight board

      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rotation);

      // 1. Soft Ice Contact Shadow
      ctx.beginPath();
      ctx.ellipse(2, 4, r * 1.06, r * 0.94, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(16, 47, 74, ${alpha * 0.32})`;
      ctx.fill();

      // 2. Granite Stone Body (Trefor / Ailsa Craig texture gradient)
      const gradBody = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.15, 0, 0, r);
      gradBody.addColorStop(0, `rgba(138, 155, 173, ${alpha})`);
      gradBody.addColorStop(0.65, `rgba(88, 103, 118, ${alpha})`);
      gradBody.addColorStop(1, `rgba(50, 62, 74, ${alpha})`);

      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = gradBody;
      ctx.fill();
      ctx.strokeStyle = `rgba(16, 47, 74, ${alpha * 0.7})`;
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // 3. Granite Bevel & Striking Band
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.86, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.35})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // 4. Colored Team Core Insert
      const teamColor = s.team === 'red' ? '#d63b3b' : '#f0c647';
      const gradTeam = ctx.createRadialGradient(-r * 0.2, -r * 0.2, 0, 0, 0, r * 0.62);
      if (s.team === 'red') {
        gradTeam.addColorStop(0, '#f25d5d');
        gradTeam.addColorStop(1, '#b92e34');
      } else {
        gradTeam.addColorStop(0, '#ffdf7a');
        gradTeam.addColorStop(1, '#d8aa32');
      }

      ctx.beginPath();
      ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2);
      ctx.fillStyle = gradTeam;
      ctx.globalAlpha = alpha;
      ctx.fill();
      ctx.strokeStyle = `rgba(16, 47, 74, 0.6)`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // 5. Authentic Goose-Neck Handle (Curling equipment)
      // Mounting plate center
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.16, 0, Math.PI * 2);
      ctx.fillStyle = '#2d3748';
      ctx.fill();

      // Handle goose-neck grip bar
      ctx.strokeStyle = `rgba(248, 253, 255, ${alpha * 0.95})`;
      ctx.lineWidth = Math.max(2.2, r * 0.15);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(-r * 0.38, 0);
      ctx.lineTo(r * 0.38, 0);
      ctx.stroke();

      // Handle bolt / tip accent
      ctx.beginPath();
      ctx.arc(0, -r * 0.02, r * 0.08, 0, Math.PI * 2);
      ctx.fillStyle = s.team === 'red' ? '#ffffff' : '#102f4a';
      ctx.fill();

      ctx.restore();
    }

    render() {
      this.ctx.clearRect(0, 0, this.width, this.height);
      this.drawRinkMarkings();
      for (const stone of this.stones) {
        this.drawStone(stone);
      }
    }

    loop(timestamp) {
      const elapsed = (timestamp - this.lastTimestamp) / 1000;
      this.lastTimestamp = timestamp;

      // Cap max elapsed to avoid spiral of death when tab is backgrounded
      this.accumulator += Math.min(elapsed, 0.1);

      while (this.accumulator >= this.fixedDt) {
        this.physicsStep(this.fixedDt);
        this.accumulator -= this.fixedDt;
      }

      this.render();
      this.animationId = requestAnimationFrame(this.loop);
    }
  }

  /* ==========================================================================
     3. PERSISTENCE LAYER
     ========================================================================== */
  class StorageService {
    static get() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return StorageService.defaultData();
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return StorageService.defaultData();
        return Object.assign(StorageService.defaultData(), parsed);
      } catch (err) {
        return StorageService.defaultData();
      }
    }

    static save(data) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (err) {
        console.warn('Storage save failed', err);
      }
    }

    static defaultData() {
      return {
        version: 1,
        completedDays: {}, // { [dayId]: { attempts: number, date: string, timestamp: number } }
        streak: 0,
        lastCompletedDayIndex: null
      };
    }
  }

  /* ==========================================================================
     4. DETERMINISTIC DAILY SCHEDULER
     ========================================================================== */
  class DailyScheduler {
    static getDaysSinceEpoch() {
      const now = new Date();
      const currentUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
      const diff = Math.floor((currentUtc - EPOCH_UTC) / (1000 * 60 * 60 * 24));
      return Math.max(0, diff); // Clamped minimum to Day 0
    }

    static getTodayPuzzle(puzzles) {
      if (!puzzles || !puzzles.length) return null;
      const dayIndex = DailyScheduler.getDaysSinceEpoch();
      const puzzleIndex = dayIndex % puzzles.length;
      return {
        puzzle: puzzles[puzzleIndex],
        dayIndex: dayIndex
      };
    }

    static getReleasedVaultPuzzles(puzzles) {
      if (!puzzles || !puzzles.length) return [];
      const currentDay = DailyScheduler.getDaysSinceEpoch();
      const released = [];
      // Strictly days prior to current calendar Day (day < currentDay)
      for (let day = 0; day < currentDay; day++) {
        const puzzleIndex = day % puzzles.length;
        released.push({
          dayIndex: day,
          puzzle: puzzles[puzzleIndex]
        });
      }
      return released.reverse(); // Newest released first
    }
  }

  /* ==========================================================================
     5. MEMORY GAME APP ENGINE
     ========================================================================== */
  class MemoryApp {
    constructor() {
      this.puzzles = (window.CURLING_MEMORY_PUZZLES && Array.isArray(window.CURLING_MEMORY_PUZZLES))
        ? window.CURLING_MEMORY_PUZZLES
        : [];
      
      this.store = StorageService.get();
      this.currentDay = DailyScheduler.getDaysSinceEpoch();

      this.activePuzzle = null;
      this.activeDayIndex = null;
      this.isVaultMode = false;
      this.cards = [];
      this.flippedCards = [];
      this.matchedCount = 0;
      this.totalPairs = 0;
      this.attempts = 0;
      this.isLocked = false;

      this.bgPhysics = null;

      this.initDom();
      this.initSoundUI();
      this.initCanvas();
      this.bindEvents();
      this.renderMenu();
    }

    initDom() {
      this.dom = {
        menuScreen: document.getElementById('menu-screen'),
        gameScreen: document.getElementById('game-screen'),
        vaultScreen: document.getElementById('vault-screen'),
        resultsModal: document.getElementById('results-modal'),
        soundBtn: document.getElementById('sound-btn'),
        soundOnIcon: document.querySelector('.sound-on-icon'),
        soundOffIcon: document.querySelector('.sound-off-icon'),
        
        // Menu Elements
        todayDateLabel: document.getElementById('today-date-label'),
        todayPuzzleTitle: document.getElementById('today-puzzle-title'),
        todayPuzzleMeta: document.getElementById('today-puzzle-meta'),
        todayGridDim: document.getElementById('today-grid-dim'),
        todayStatusBadge: document.getElementById('today-status-badge'),
        todayBestVal: document.getElementById('today-best-val'),
        playTodayBtn: document.getElementById('play-today-btn'),
        playTodayText: document.getElementById('play-today-text'),
        openVaultBtn: document.getElementById('open-vault-btn'),
        vaultCountBadge: document.getElementById('vault-count-badge'),

        // Game Elements
        backToMenuBtn: document.getElementById('back-to-menu-btn'),
        restartGameBtn: document.getElementById('restart-game-btn'),
        gameModeLabel: document.getElementById('game-mode-label'),
        gameCategoryTag: document.getElementById('game-category-tag'),
        hudAttempts: document.getElementById('hud-attempts'),
        hudMatches: document.getElementById('hud-matches'),
        hudBest: document.getElementById('hud-best'),
        memoryGrid: document.getElementById('memory-grid'),

        // Vault Elements
        closeVaultBtn: document.getElementById('close-vault-btn'),
        vaultItemsContainer: document.getElementById('vault-items-container'),

        // Modal Elements
        modalTitle: document.getElementById('modal-title'),
        modalSubtitle: document.getElementById('modal-subtitle'),
        resAttempts: document.getElementById('res-attempts'),
        resEfficiency: document.getElementById('res-efficiency'),
        resStreak: document.getElementById('res-streak'),
        modalMenuBtn: document.getElementById('modal-menu-btn'),
        modalShareBtn: document.getElementById('modal-share-btn'),
        announcer: document.getElementById('screen-announcer')
      };
    }

    initSoundUI() {
      this.updateSoundDisplay(soundMgr.enabled);
    }

    updateSoundDisplay(enabled) {
      if (enabled) {
        this.dom.soundOnIcon.style.display = 'block';
        this.dom.soundOffIcon.style.display = 'none';
        this.dom.soundBtn.setAttribute('aria-pressed', 'true');
      } else {
        this.dom.soundOnIcon.style.display = 'none';
        this.dom.soundOffIcon.style.display = 'block';
        this.dom.soundBtn.setAttribute('aria-pressed', 'false');
      }
    }

    initCanvas() {
      const canvas = document.getElementById('rink-canvas');
      if (canvas) {
        this.bgPhysics = new RinkBackgroundPhysics(canvas);
      }
    }

    announce(message) {
      if (this.dom.announcer) {
        this.dom.announcer.textContent = message;
      }
    }

    bindEvents() {
      this.dom.soundBtn.addEventListener('click', () => {
        const enabled = soundMgr.toggle();
        this.updateSoundDisplay(enabled);
        if (enabled) soundMgr.playTap();
      });

      this.dom.playTodayBtn.addEventListener('click', () => {
        soundMgr.playTap();
        const todayData = DailyScheduler.getTodayPuzzle(this.puzzles);
        if (todayData) {
          this.launchGame(todayData.puzzle, todayData.dayIndex, false);
        }
      });

      this.dom.openVaultBtn.addEventListener('click', () => {
        soundMgr.playTap();
        this.showScreen('vault');
      });

      this.dom.closeVaultBtn.addEventListener('click', () => {
        soundMgr.playTap();
        this.showScreen('menu');
      });

      this.dom.backToMenuBtn.addEventListener('click', () => {
        soundMgr.playTap();
        this.showScreen('menu');
      });

      this.dom.restartGameBtn.addEventListener('click', () => {
        soundMgr.playTap();
        if (this.activePuzzle) {
          this.launchGame(this.activePuzzle, this.activeDayIndex, this.isVaultMode);
        }
      });

      this.dom.modalMenuBtn.addEventListener('click', () => {
        soundMgr.playTap();
        this.dom.resultsModal.style.display = 'none';
        this.showScreen('menu');
      });

      this.dom.modalShareBtn.addEventListener('click', () => {
        soundMgr.playTap();
        this.shareResult();
      });

      // Escape key modal handling
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.dom.resultsModal.style.display === 'flex') {
          this.dom.resultsModal.style.display = 'none';
        }
      });

      // 2D Grid Arrow-Key Accessibility Navigation
      this.dom.memoryGrid.addEventListener('keydown', (e) => {
        this.handleGridKeyboardNav(e);
      });
    }

    showScreen(screen) {
      this.dom.menuScreen.style.display = 'none';
      this.dom.gameScreen.style.display = 'none';
      this.dom.vaultScreen.style.display = 'none';
      this.dom.resultsModal.style.display = 'none';

      if (this.bgPhysics) {
        this.bgPhysics.setGameActive(screen === 'game');
      }

      if (screen === 'menu') {
        this.renderMenu();
        this.dom.menuScreen.style.display = 'flex';
      } else if (screen === 'game') {
        this.dom.gameScreen.style.display = 'flex';
      } else if (screen === 'vault') {
        this.renderVault();
        this.dom.vaultScreen.style.display = 'flex';
      }
    }

    renderMenu() {
      const todayData = DailyScheduler.getTodayPuzzle(this.puzzles);
      if (!todayData) return;

      const { puzzle, dayIndex } = todayData;
      const completion = this.store.completedDays[dayIndex];

      this.dom.todayDateLabel.textContent = `Day ${dayIndex} • Today`;
      this.dom.todayPuzzleTitle.textContent = puzzle.title;
      this.dom.todayPuzzleMeta.textContent = `Curriculum: ${puzzle.category}`;
      
      const cardCount = puzzle.pairs.length * 2;
      this.dom.todayGridDim.textContent = cardCount === 16 ? '4 × 4' : '3 × 4';

      if (completion) {
        this.dom.todayStatusBadge.textContent = 'Completed';
        this.dom.todayStatusBadge.className = 'stat-val status-completed';
        this.dom.todayBestVal.textContent = `${completion.attempts} tries`;
        this.dom.playTodayText.textContent = 'Replay Today';
      } else {
        this.dom.todayStatusBadge.textContent = 'Ready';
        this.dom.todayStatusBadge.className = 'stat-val status-ready';
        this.dom.todayBestVal.textContent = '—';
        this.dom.playTodayText.textContent = 'Play Today';
      }

      const releasedVault = DailyScheduler.getReleasedVaultPuzzles(this.puzzles);
      this.dom.vaultCountBadge.textContent = `${releasedVault.length} Released`;
    }

    renderVault() {
      const container = this.dom.vaultItemsContainer;
      container.innerHTML = '';

      const releasedVault = DailyScheduler.getReleasedVaultPuzzles(this.puzzles);

      if (releasedVault.length === 0) {
        const emptyNotice = document.createElement('div');
        emptyNotice.className = 'empty-vault-notice';
        emptyNotice.textContent = 'The Vault opens on Day 1 once previous ends are archived.';
        container.appendChild(emptyNotice);
        return;
      }

      releasedVault.forEach(({ dayIndex, puzzle }) => {
        const completion = this.store.completedDays[dayIndex];
        const card = document.createElement('div');
        card.className = 'vault-row-card';
        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `Play Day ${dayIndex} ${puzzle.title}`);

        const info = document.createElement('div');
        info.className = 'vault-info-cluster';

        const dateTag = document.createElement('span');
        dateTag.className = 'vault-date-tag';
        dateTag.textContent = `Day ${dayIndex} • ${puzzle.difficulty}`;

        const title = document.createElement('span');
        title.className = 'vault-item-title';
        title.textContent = puzzle.title;

        info.appendChild(dateTag);
        info.appendChild(title);

        const statusCluster = document.createElement('div');
        statusCluster.className = 'vault-status-cluster';

        const pill = document.createElement('span');
        pill.className = `vault-pill ${completion ? 'is-win' : ''}`;
        pill.textContent = completion ? `Won (${completion.attempts})` : 'Play';

        statusCluster.appendChild(pill);
        card.appendChild(info);
        card.appendChild(statusCluster);

        const startVaultGame = () => {
          soundMgr.playTap();
          this.launchGame(puzzle, dayIndex, true);
        };

        card.addEventListener('click', startVaultGame);
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            startVaultGame();
          }
        });

        container.appendChild(card);
      });
    }

    launchGame(puzzle, dayIndex, isVault = false) {
      this.activePuzzle = puzzle;
      this.activeDayIndex = dayIndex;
      this.isVaultMode = isVault;
      this.attempts = 0;
      this.matchedCount = 0;
      this.totalPairs = puzzle.pairs.length;
      this.flippedCards = [];
      this.isLocked = false;

      this.dom.gameModeLabel.textContent = isVault ? `Day ${dayIndex}` : 'Today';
      this.dom.gameCategoryTag.textContent = puzzle.category;
      this.dom.hudAttempts.textContent = '0';
      this.dom.hudMatches.textContent = `0 / ${this.totalPairs}`;

      const previous = this.store.completedDays[dayIndex];
      this.dom.hudBest.textContent = previous ? `${previous.attempts}` : '—';

      // Assemble pairs
      const deck = [];
      puzzle.pairs.forEach((pair) => {
        deck.push({ id: `${pair.id}_A`, pairId: pair.id, label: pair.label, iconSvg: pair.iconSvg });
        deck.push({ id: `${pair.id}_B`, pairId: pair.id, label: pair.label, iconSvg: pair.iconSvg });
      });

      // Deterministic Fisher-Yates shuffle seeded by dayIndex
      this.shuffleDeck(deck, dayIndex);
      this.cards = deck;

      this.renderBoard();
      this.showScreen('game');
      this.announce(`Puzzle started: ${puzzle.title}. 16 tiles to match.`);
    }

    shuffleDeck(deck, seedInt) {
      let seed = (seedInt + 1) * 1103515245 + 12345;
      const rnd = () => {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return seed / 0x7fffffff;
      };

      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        const temp = deck[i];
        deck[i] = deck[j];
        deck[j] = temp;
      }
    }

    renderBoard() {
      const grid = this.dom.memoryGrid;
      grid.innerHTML = '';

      this.cards.forEach((cardData, idx) => {
        const cardBtn = document.createElement('button');
        cardBtn.className = 'memory-card';
        cardBtn.type = 'button';
        cardBtn.dataset.index = idx;
        cardBtn.dataset.pairId = cardData.pairId;
        cardBtn.setAttribute('role', 'gridcell');
        cardBtn.setAttribute('aria-label', `Tile ${idx + 1}: Face down`);

        // Card Back (House Motif with authentic curling geometry)
        const back = document.createElement('div');
        back.className = 'card-face card-back';
        back.innerHTML = `
          <svg class="card-back-house" viewBox="0 0 32 32" aria-hidden="true">
            <circle cx="16" cy="16" r="14" fill="#f0f8fd" stroke="#227bf0" stroke-width="2"/>
            <circle cx="16" cy="16" r="9" fill="#ffffff" stroke="#d63b3b" stroke-width="2"/>
            <circle cx="16" cy="16" r="4" fill="#ffffff" stroke="#227bf0" stroke-width="1.5"/>
            <circle cx="16" cy="16" r="1.5" fill="#d63b3b"/>
          </svg>
        `;

        // Card Front (Revealed equipment SVG + Dark Blue Label)
        const front = document.createElement('div');
        front.className = 'card-face card-front';
        front.innerHTML = `
          <div class="card-icon-wrap" aria-hidden="true">${cardData.iconSvg}</div>
          <span class="card-title">${cardData.label}</span>
        `;

        cardBtn.appendChild(back);
        cardBtn.appendChild(front);

        cardBtn.addEventListener('click', () => this.handleCardClick(cardBtn, cardData));

        grid.appendChild(cardBtn);
      });
    }

    handleGridKeyboardNav(e) {
      const activeEl = document.activeElement;
      if (!activeEl || !activeEl.classList.contains('memory-card')) return;

      const idx = parseInt(activeEl.dataset.index, 10);
      if (isNaN(idx)) return;

      const cols = 4;
      const total = this.cards.length;
      let nextIdx = idx;

      switch (e.key) {
        case 'ArrowRight':
          nextIdx = (idx + 1) % total;
          e.preventDefault();
          break;
        case 'ArrowLeft':
          nextIdx = (idx - 1 + total) % total;
          e.preventDefault();
          break;
        case 'ArrowDown':
          nextIdx = (idx + cols) % total;
          e.preventDefault();
          break;
        case 'ArrowUp':
          nextIdx = (idx - cols + total) % total;
          e.preventDefault();
          break;
        case 'Home':
          nextIdx = 0;
          e.preventDefault();
          break;
        case 'End':
          nextIdx = total - 1;
          e.preventDefault();
          break;
        default:
          return;
      }

      const nextCard = this.dom.memoryGrid.querySelector(`[data-index="${nextIdx}"]`);
      if (nextCard) {
        nextCard.focus();
      }
    }

    handleCardClick(cardEl, cardData) {
      if (this.isLocked) return;
      if (cardEl.classList.contains('is-flipped') || cardEl.classList.contains('is-matched')) return;

      soundMgr.playFlip();
      cardEl.classList.add('is-flipped');
      cardEl.setAttribute('aria-label', `${cardData.label}`);
      this.flippedCards.push({ element: cardEl, data: cardData });

      if (this.flippedCards.length === 2) {
        this.evaluateTurn();
      }
    }

    evaluateTurn() {
      this.attempts++;
      this.dom.hudAttempts.textContent = this.attempts;

      const [cardA, cardB] = this.flippedCards;
      const isMatch = cardA.data.pairId === cardB.data.pairId;

      if (isMatch) {
        this.isLocked = true;
        setTimeout(() => {
          soundMgr.playMatch();
          cardA.element.classList.add('is-matched');
          cardB.element.classList.add('is-matched');
          cardA.element.setAttribute('aria-label', `${cardA.data.label} (Matched)`);
          cardB.element.setAttribute('aria-label', `${cardB.data.label} (Matched)`);

          this.matchedCount++;
          this.dom.hudMatches.textContent = `${this.matchedCount} / ${this.totalPairs}`;
          this.flippedCards = [];
          this.isLocked = false;
          this.announce(`Match found! ${cardA.data.label}. ${this.matchedCount} of ${this.totalPairs} pairs cleared.`);

          if (this.matchedCount === this.totalPairs) {
            this.handleVictory();
          }
        }, 300);
      } else {
        this.isLocked = true;
        setTimeout(() => {
          soundMgr.playMismatch();
          cardA.element.classList.add('is-shaking');
          cardB.element.classList.add('is-shaking');
        }, 380);

        setTimeout(() => {
          cardA.element.classList.remove('is-flipped', 'is-shaking');
          cardB.element.classList.remove('is-flipped', 'is-shaking');
          cardA.element.setAttribute('aria-label', 'Tile face down');
          cardB.element.setAttribute('aria-label', 'Tile face down');
          this.flippedCards = [];
          this.isLocked = false;
        }, 860);
      }
    }

    handleVictory() {
      soundMgr.playWin();

      const dayId = this.activeDayIndex;
      const existing = this.store.completedDays[dayId];
      const isBetter = !existing || this.attempts < existing.attempts;

      if (!existing || isBetter) {
        this.store.completedDays[dayId] = {
          attempts: this.attempts,
          date: new Date().toISOString(),
          timestamp: Date.now()
        };
      }

      // Streak integrity: Only increment for Today's puzzle
      if (!this.isVaultMode) {
        if (this.store.lastCompletedDayIndex === dayId - 1) {
          this.store.streak = (this.store.streak || 0) + 1;
        } else if (this.store.lastCompletedDayIndex !== dayId) {
          this.store.streak = 1;
        }
        this.store.lastCompletedDayIndex = dayId;
      }

      StorageService.save(this.store);

      const accuracy = Math.round((this.totalPairs / this.attempts) * 100);
      this.dom.resAttempts.textContent = this.attempts;
      this.dom.resEfficiency.textContent = `${Math.min(100, accuracy)}%`;
      this.dom.resStreak.textContent = this.store.streak || 1;

      setTimeout(() => {
        this.dom.resultsModal.style.display = 'flex';
        this.announce(`Puzzle cleared in ${this.attempts} attempts with ${accuracy}% shot accuracy.`);
      }, 500);
    }

    shareResult() {
      const dayId = this.activeDayIndex;
      const title = this.activePuzzle ? this.activePuzzle.title : 'Memory';
      const text = `Curling Puzzles — Memory (Day ${dayId})\n🥌 "${title}"\n🎯 ${this.attempts} Attempts | ${this.dom.resEfficiency.textContent} Accuracy\nhttps://tileworksgamesstudio.github.io/Curling-Menu/`;

      if (navigator.share) {
        navigator.share({ title: 'Curling Puzzles — Memory', text })
          .catch(() => this.copyToClipboard(text));
      } else {
        this.copyToClipboard(text);
      }
    }

    copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => {
        alert('Results copied to clipboard!');
      }).catch(() => {
        alert(text);
      });
    }
  }

  // Self-bootstrapping entry point
  document.addEventListener('DOMContentLoaded', () => {
    window.curlingMemoryApp = new MemoryApp();
  });
})();