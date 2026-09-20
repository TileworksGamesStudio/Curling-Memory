/**
 * Memory Match — Canadian Curling Ice House Edition
 * Unified with Shared Daily Release Clock & Canadian Curling Physics Simulation
 */

(function () {
  'use strict';

  // --- 1. SHARED DAILY RELEASE ENGINE SPECIFICATION ---
  const DailyReleaseClock = (function () {
    const TIMEZONE = 'Europe/London';
    const SYNC_CACHE_KEY = 'tileworks_clock_sync_offset_ms';
    let syncOffsetMs = 0;
    let syncMonotonicOrigin = performance.now();
    let syncTimestampUtc = Date.now();
    let isSynchronized = false;

    try {
      const cached = localStorage.getItem(SYNC_CACHE_KEY);
      if (cached !== null) {
        syncOffsetMs = parseInt(cached, 10) || 0;
      }
    } catch (e) {}

    async function synchronize(httpDateHeader) {
      let authoritativeUtcMs = null;

      if (httpDateHeader) {
        const parsedHeader = Date.parse(httpDateHeader);
        if (!isNaN(parsedHeader) && parsedHeader > 0) {
          authoritativeUtcMs = parsedHeader;
        }
      }

      if (!authoritativeUtcMs) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);
          const res = await fetch('https://worldtimeapi.org/api/timezone/Europe/London', {
            signal: controller.signal,
            cache: 'no-store'
          });
          clearTimeout(timeoutId);
          if (res.ok) {
            const data = await res.json();
            if (data && data.unixtime) {
              authoritativeUtcMs = data.unixtime * 1000;
            }
          }
        } catch (netErr) {}
      }

      const nowDevice = Date.now();
      if (authoritativeUtcMs) {
        syncOffsetMs = authoritativeUtcMs - nowDevice;
        syncTimestampUtc = authoritativeUtcMs;
        syncMonotonicOrigin = performance.now();
        isSynchronized = true;
        try {
          localStorage.setItem(SYNC_CACHE_KEY, String(syncOffsetMs));
        } catch (e) {}
      } else {
        syncTimestampUtc = nowDevice + syncOffsetMs;
        syncMonotonicOrigin = performance.now();
      }

      return isSynchronized;
    }

    function getAuthoritativeUtcMs() {
      const monotonicElapsed = performance.now() - syncMonotonicOrigin;
      return syncTimestampUtc + monotonicElapsed;
    }

    function getLondonDateString() {
      const utcMs = getAuthoritativeUtcMs();
      const date = new Date(utcMs);
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      return formatter.format(date);
    }

    function getTimeUntilNextRelease() {
      const utcMs = getAuthoritativeUtcMs();
      const date = new Date(utcMs);

      const londonParts = new Intl.DateTimeFormat('en-GB', {
        timeZone: TIMEZONE,
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false
      }).formatToParts(date);

      let h = 0, m = 0, s = 0;
      londonParts.forEach(p => {
        if (p.type === 'hour') h = parseInt(p.value, 10);
        if (p.type === 'minute') m = parseInt(p.value, 10);
        if (p.type === 'second') s = parseInt(p.value, 10);
      });

      if (h === 24) h = 0;

      const secondsElapsedToday = (h * 3600) + (m * 60) + s;
      const totalSecondsInDay = 86400;
      let remainingSec = totalSecondsInDay - secondsElapsedToday;

      if (remainingSec <= 0) remainingSec = 0;

      const remHours = Math.floor(remainingSec / 3600);
      const remMinutes = Math.floor((remainingSec % 3600) / 60);
      const remSeconds = remainingSec % 60;

      return {
        totalMs: remainingSec * 1000,
        hours: String(remHours).padStart(2, '0'),
        minutes: String(remMinutes).padStart(2, '0'),
        seconds: String(remSeconds).padStart(2, '0')
      };
    }

    return {
      synchronize,
      getLondonDateString,
      getTimeUntilNextRelease,
      isSync: () => isSynchronized
    };
  })();

  // --- 2. GAME STATE & ENUMERATIONS ---
  const GamePhase = {
    IDLE: 'IDLE',
    ONE_UP: 'ONE_UP',
    EVALUATING: 'EVALUATING',
    LOCKED: 'LOCKED',
    COMPLETED: 'COMPLETED'
  };

  const CONFIG = {
    csvPath: './puzzles.csv',
    storageKey: 'memory_match_curling_vault_v3',
    csvCacheKey: 'memory_match_curling_csv_cache',
    soundPrefKey: 'memory_match_curling_sound',
    bgAnimPrefKey: 'memory_match_curling_sim_enabled'
  };

  const state = {
    phase: GamePhase.IDLE,
    puzzles: [],
    todayDate: '',
    todayPuzzle: null,
    activePuzzle: null,
    isReplay: false,
    boardCards: [],
    flippedIndices: [],
    focusedCardIndex: 0,
    matchedCardCount: 0,
    turns: 0,
    evalTimer: null,
    mismatchTimer: null,
    countdownTimer: null,
    soundEnabled: true,
    bgAnimEnabled: true,
    lastActiveElement: null,
    audioCtx: null,
    dailySession: null,
    vaultSession: null,
    stats: {
      schemaVersion: 3,
      played: 0,
      completed: 0,
      currentStreak: 0,
      bestStreak: 0,
      bestTurns: null,
      lastDailyCompletedDate: '',
      turnHistory: [],
      history: {}
    }
  };

  // --- 3. WEB AUDIO SYNTHESIS ---
  function initAudio() {
    if (!state.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) state.audioCtx = new AudioContext();
    }
    if (state.audioCtx && state.audioCtx.state === 'suspended') {
      state.audioCtx.resume();
    }
  }

  function playSound(type) {
    if (!state.soundEnabled) return;
    try {
      initAudio();
      if (!state.audioCtx) return;

      const ctx = state.audioCtx;
      const now = ctx.currentTime;

      if (type === 'flip') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(360, now);
        osc.frequency.exponentialRampToValueAtTime(190, now + 0.08);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'match') {
        [523.25, 659.25, 783.99].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          const t = now + (i * 0.05);
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.08, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
          osc.start(t);
          osc.stop(t + 0.32);
        });
      } else if (type === 'mismatch') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(230, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.12);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'complete') {
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
        notes.forEach((freq, idx) => {
          const nOsc = ctx.createOscillator();
          const nGain = ctx.createGain();
          nOsc.type = 'sine';
          nOsc.connect(nGain);
          nGain.connect(ctx.destination);
          const t = now + (idx * 0.09);
          nOsc.frequency.setValueAtTime(freq, t);
          nGain.gain.setValueAtTime(0.12, t);
          nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
          nOsc.start(t);
          nOsc.stop(t + 0.36);
        });
      }
    } catch (e) {}
  }

  function triggerHaptic(type) {
    if (!navigator.vibrate) return;
    try {
      if (type === 'tap') navigator.vibrate(10);
      else if (type === 'match') navigator.vibrate([15, 30, 20]);
      else if (type === 'mismatch') navigator.vibrate(30);
      else if (type === 'complete') navigator.vibrate([30, 40, 30, 40, 50]);
    } catch (e) {}
  }

  function toggleSound() {
    state.soundEnabled = !state.soundEnabled;
    try {
      localStorage.setItem(CONFIG.soundPrefKey, state.soundEnabled ? '1' : '0');
    } catch (e) {}
    updateSoundUI();
    showToast(state.soundEnabled ? 'Sound FX enabled' : 'Sound FX muted');
  }

  function toggleBgAnimation() {
    state.bgAnimEnabled = !state.bgAnimEnabled;
    try {
      localStorage.setItem(CONFIG.bgAnimPrefKey, state.bgAnimEnabled ? '1' : '0');
    } catch (e) {}
    updateBgAnimUI();
    showToast(state.bgAnimEnabled ? 'Curling simulation enabled' : 'Curling simulation paused');
  }

  function updateSoundUI() {
    const glyph = state.soundEnabled ? '🔊' : '🔇';
    const mainIcon = document.getElementById('sound-icon-glyph');
    if (mainIcon) mainIcon.textContent = glyph;

    const btnSetting = document.getElementById('btn-toggle-sound-setting');
    const lblSetting = document.getElementById('lbl-sound-setting');
    if (btnSetting && lblSetting) {
      btnSetting.setAttribute('aria-pressed', state.soundEnabled ? 'true' : 'false');
      lblSetting.textContent = state.soundEnabled ? 'On' : 'Off';
    }
  }

  function updateBgAnimUI() {
    document.body.classList.toggle('bg-anim-off', !state.bgAnimEnabled);
    const btnToggle = document.getElementById('btn-toggle-bg-anim');
    const lblToggle = document.getElementById('lbl-bg-anim');
    if (btnToggle && lblToggle) {
      btnToggle.setAttribute('aria-pressed', state.bgAnimEnabled ? 'true' : 'false');
      lblToggle.textContent = state.bgAnimEnabled ? 'On' : 'Off';
    }
  }

  // --- 4. CANADIAN CURLING RINK LIVE PHYSICS SIMULATION ---
  const CurlingSimulation = (function () {
    let canvas, ctx;
    let width = 0, height = 0, dpr = 1;
    let animFrameId = null;
    let lastTime = 0;

    const MU = 0.48;
    const CURL_BASE = 1.4;
    let turnCount = 0;
    let stones = [];
    let deliveredStone = null;
    let interShotDwell = 0;
    let isQuiescent = true;
    let stallWatchdogTimer = 0;

    let houseCenterX = 0;
    let houseCenterY = 0;
    let houseRadius = 130;
    let buttonRadius = 24;
    let rockRadius = 18;

    function resize() {
      if (!canvas) return;
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);

      houseCenterX = width * 0.5;
      houseCenterY = Math.max(height * 0.36, Math.min(height * 0.43, height * 0.40));
      houseRadius = Math.min(width * 0.38, height * 0.22, 175);
      buttonRadius = houseRadius * 0.18;
      rockRadius = Math.max(14, Math.min(22, houseRadius * 0.15));
    }

    function solveDelivery(launchX, launchY, targetX, targetY, spinDir, isMega) {
      const dt = 1 / 60;
      let omega = (isMega ? 0.8 : (Math.random() * 1.5 + 0.8)) * spinDir;
      let curlCoeff = CURL_BASE;

      const hasCurl = isMega ? false : (Math.random() < 0.55);
      if (!hasCurl) {
        omega *= 0.15;
      }

      const targetDx = targetX - launchX;
      const targetDy = targetY - launchY;

      let vxGuess = targetDx * MU;
      let vyGuess = targetDy * MU;

      if (isMega) {
        const mult = 2.85 + (Math.random() * 0.3);
        vxGuess *= mult;
        vyGuess *= mult;
        return { vx: vxGuess, vy: vyGuess, omega: omega * 0.5, curlCoeff: 0.5 };
      }

      for (let iter = 0; iter < 8; iter++) {
        let simX = launchX, simY = launchY;
        let simVx = vxGuess, simVy = vyGuess;
        let simOm = omega;

        for (let step = 0; step < 400; step++) {
          const spd = Math.hypot(simVx, simVy);
          if (spd < 1.0) break;

          const ax = (-simVy / spd) * (curlCoeff * simOm);
          const ay = (simVx / spd) * (curlCoeff * simOm);

          simX += simVx * dt;
          simY += simVy * dt;

          simVx += (ax - MU * simVx) * dt;
          simVy += (ay - MU * simVy) * dt;
          simOm *= (1.0 - 0.35 * dt);
        }

        const errX = simX - targetX;
        const errY = simY - targetY;
        if (Math.hypot(errX, errY) < 1.0) break;

        vxGuess -= errX * MU * 0.85;
        vyGuess -= errY * MU * 0.85;
      }

      return { vx: vxGuess, vy: vyGuess, omega, curlCoeff };
    }

    function findKeystoneTarget() {
      const activeCluster = stones.filter(s => s.state !== 'OUT_OF_PLAY' && s.y < height * 0.7);
      if (!activeCluster.length) {
        return { x: houseCenterX, y: houseCenterY };
      }

      let bestRock = activeCluster[0];
      let bestScore = -9999;

      activeCluster.forEach(candidate => {
        let neighbourCount = 0;
        activeCluster.forEach(other => {
          if (candidate !== other && Math.hypot(candidate.x - other.x, candidate.y - other.y) < rockRadius * 3.5) {
            neighbourCount++;
          }
        });
        const distToButton = Math.hypot(candidate.x - houseCenterX, candidate.y - houseCenterY);
        const score = (neighbourCount * 35) - (distToButton * 0.4);
        if (score > bestScore) {
          bestScore = score;
          bestRock = candidate;
        }
      });

      const angleOffset = (Math.random() - 0.5) * 0.6;
      return {
        x: bestRock.x + Math.sin(angleOffset) * (rockRadius * 0.4),
        y: bestRock.y + Math.cos(angleOffset) * (rockRadius * 0.4)
      };
    }

    function createAndLaunchStone() {
      turnCount++;
      const isRed = (turnCount % 2 === 1);
      const isMega = (turnCount % 9 === 0);
      const color = isRed ? 'RED' : 'YELLOW';

      const launchX = houseCenterX + (Math.random() - 0.5) * (width * 0.08);
      const launchY = height + rockRadius * 2 + (Math.random() * (height * 0.15));

      let targetX = houseCenterX;
      let targetY = houseCenterY;
      const spinDir = Math.random() < 0.5 ? 1 : -1;

      if (isMega) {
        const keystone = findKeystoneTarget();
        targetX = keystone.x;
        targetY = keystone.y;
      } else {
        const occupiedButton = stones.some(s => s.state !== 'OUT_OF_PLAY' && Math.hypot(s.x - houseCenterX, s.y - houseCenterY) < rockRadius * 1.6);
        if (occupiedButton) {
          const angle = (turnCount * 2.399) % (Math.PI * 2);
          const pocketDist = rockRadius * 2.1 + (Math.random() * rockRadius * 0.4);
          targetX = houseCenterX + Math.cos(angle) * pocketDist;
          targetY = houseCenterY + Math.sin(angle) * pocketDist;
        } else {
          targetX = houseCenterX + (Math.random() - 0.5) * (buttonRadius * 0.4);
          targetY = houseCenterY + (Math.random() - 0.5) * (buttonRadius * 0.4);
        }
      }

      const sol = solveDelivery(launchX, launchY, targetX, targetY, spinDir, isMega);

      const newStone = {
        id: turnCount,
        color,
        isMega,
        x: launchX,
        y: launchY,
        vx: sol.vx,
        vy: sol.vy,
        angle: Math.random() * Math.PI * 2,
        angularVelocity: sol.omega,
        radius: rockRadius,
        mass: 1.0,
        curlCoeff: sol.curlCoeff,
        state: 'ACTIVE',
        visualRotation: 0,
        quiescentTime: 0
      };

      stones.push(newStone);
      deliveredStone = newStone;
      isQuiescent = false;
      interShotDwell = 0;
      stallWatchdogTimer = 0;
    }

    function updatePhysics(dt) {
      const isFast = deliveredStone && deliveredStone.isMega;
      const substeps = isFast ? 6 : 2;
      const subDt = dt / substeps;

      for (let s = 0; s < substeps; s++) {
        stones.forEach(st => {
          if (st.state === 'OUT_OF_PLAY') return;

          const spd = Math.hypot(st.vx, st.vy);
          if (spd > 0.5) {
            const ax = (-st.vy / spd) * (st.curlCoeff * st.angularVelocity);
            const ay = (st.vx / spd) * (st.curlCoeff * st.angularVelocity);

            st.x += st.vx * subDt;
            st.y += st.vy * subDt;

            st.vx += (ax - MU * st.vx) * subDt;
            st.vy += (ay - MU * st.vy) * subDt;
            st.angularVelocity *= Math.pow(0.65, subDt);
          } else {
            st.vx = 0;
            st.vy = 0;
            st.angularVelocity *= Math.pow(0.2, subDt);
          }

          st.angle += st.angularVelocity * subDt;
          st.visualRotation += st.angularVelocity * subDt;

          if (st.x < -80 || st.x > width + 80 || st.y < -100 || st.y > height + 150) {
            st.state = 'OUT_OF_PLAY';
          }
        });

        const activeStones = stones.filter(st => st.state !== 'OUT_OF_PLAY');
        const count = activeStones.length;

        for (let i = 0; i < count; i++) {
          for (let j = i + 1; j < count; j++) {
            const r1 = activeStones[i];
            const r2 = activeStones[j];

            const dx = r2.x - r1.x;
            const dy = r2.y - r1.y;
            const dist = Math.hypot(dx, dy);
            const minDist = r1.radius + r2.radius;

            if (dist < minDist && dist > 1e-4) {
              const nx = dx / dist;
              const ny = dy / dist;
              const overlap = minDist - dist;

              r1.x -= nx * overlap * 0.5;
              r1.y -= ny * overlap * 0.5;
              r2.x += nx * overlap * 0.5;
              r2.y += ny * overlap * 0.5;

              const rvx = r2.vx - r1.vx;
              const rvy = r2.vy - r1.vy;
              const velAlongNormal = rvx * nx + rvy * ny;

              if (velAlongNormal < 0) {
                const isMegaImpact = r1.isMega || r2.isMega;
                const e = isMegaImpact ? 0.85 : 0.74;
                const impulse = -(1 + e) * velAlongNormal * 0.5;

                r1.vx -= impulse * nx;
                r1.vy -= impulse * ny;
                r2.vx += impulse * nx;
                r2.vy += impulse * ny;

                const tx = -ny;
                const ty = nx;
                const velAlongTangent = rvx * tx + rvy * ty;
                const tangentImpulse = -velAlongTangent * 0.08;

                r1.vx -= tangentImpulse * tx;
                r1.vy -= tangentImpulse * ty;
                r2.vx += tangentImpulse * tx;
                r2.vy += tangentImpulse * ty;

                r1.angularVelocity += tangentImpulse * 0.02;
                r2.angularVelocity -= tangentImpulse * 0.02;
              }
            }
          }
        }
      }

      if (deliveredStone && deliveredStone.state === 'ACTIVE') {
        stallWatchdogTimer += dt;
        if (deliveredStone.y > height * 0.8) {
          if (deliveredStone.vy >= -10 && stallWatchdogTimer > 1.2) {
            deliveredStone.vy = -180;
            stallWatchdogTimer = 0;
          }
        }
      }

      let totalBoardSpeed = 0;
      stones.forEach(st => {
        if (st.state !== 'OUT_OF_PLAY') {
          totalBoardSpeed += Math.hypot(st.vx, st.vy);
        }
      });

      if (totalBoardSpeed < 3.5) {
        interShotDwell += dt;
        if (interShotDwell > 0.9) {
          isQuiescent = true;
          deliveredStone = null;
        }
      } else {
        interShotDwell = 0;
        isQuiescent = false;
      }
    }

    function renderSheet() {
      ctx.clearRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(18, 59, 114, 0.16)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(houseCenterX, 0);
      ctx.lineTo(houseCenterX, height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, houseCenterY);
      ctx.lineTo(width, houseCenterY);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(18, 59, 114, 0.10)';
      ctx.beginPath();
      ctx.moveTo(0, houseCenterY - houseRadius);
      ctx.lineTo(width, houseCenterY - houseRadius);
      ctx.stroke();

      const hogY = houseCenterY + houseRadius * 2.2;
      if (hogY < height) {
        ctx.strokeStyle = 'rgba(200, 16, 46, 0.22)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, hogY);
        ctx.lineTo(width, hogY);
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(houseCenterX, houseCenterY, houseRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(18, 59, 114, 0.14)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(18, 59, 114, 0.35)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(houseCenterX, houseCenterY, houseRadius * (8 / 12), 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(247, 252, 255, 0.72)';
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(houseCenterX, houseCenterY, houseRadius * (4 / 12), 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(200, 16, 46, 0.18)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(200, 16, 46, 0.38)';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(houseCenterX, houseCenterY, buttonRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(247, 252, 255, 0.88)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(18, 59, 114, 0.45)';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(houseCenterX, houseCenterY, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(18, 59, 114, 0.6)';
      ctx.fill();
    }

    function renderStone(st) {
      if (st.state === 'OUT_OF_PLAY') return;

      const r = st.radius;
      ctx.save();
      ctx.translate(st.x, st.y);

      ctx.save();
      ctx.beginPath();
      ctx.ellipse(2, 4, r * 1.05, r * 0.85, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(11, 36, 80, 0.18)';
      ctx.filter = 'blur(3px)';
      ctx.fill();
      ctx.restore();

      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);

      const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.15, 0, 0, r);
      if (st.color === 'RED') {
        grad.addColorStop(0, '#D92B45');
        grad.addColorStop(0.55, '#C8102E');
        grad.addColorStop(1, '#8B0F24');
      } else {
        grad.addColorStop(0, '#FFE675');
        grad.addColorStop(0.55, '#FFD52A');
        grad.addColorStop(1, '#C99A00');
      }
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.lineWidth = 1.8;
      ctx.strokeStyle = 'rgba(11, 36, 80, 0.85)';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, r * 0.65, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(-r * 0.35, -r * 0.4, r * 0.38, r * 0.18, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.48)';
      ctx.fill();

      ctx.rotate(st.angle + st.visualRotation);

      ctx.fillStyle = '#2B3947';
      ctx.fillRect(-r * 0.28, -r * 0.15, r * 0.56, r * 0.3);

      ctx.fillStyle = st.color === 'RED' ? '#8B0F24' : '#1C2733';
      ctx.beginPath();
      ctx.roundRect(-r * 0.5, -r * 0.12, r * 1.0, r * 0.24, 3);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      ctx.restore();
    }

    function loop(timestamp) {
      if (!lastTime) lastTime = timestamp;
      const rawDt = (timestamp - lastTime) / 1000;
      lastTime = timestamp;
      const dt = Math.min(rawDt, 0.05);

      if (state.bgAnimEnabled) {
        updatePhysics(dt);

        if (isQuiescent && (!deliveredStone || deliveredStone.state === 'OUT_OF_PLAY')) {
          createAndLaunchStone();
        }

        renderSheet();
        stones.forEach(renderStone);
      }

      animFrameId = requestAnimationFrame(loop);
    }

    function init() {
      canvas = document.getElementById('curling-ice-canvas');
      if (!canvas) return;

      resize();
      window.addEventListener('resize', resize);
      createAndLaunchStone();
      animFrameId = requestAnimationFrame(loop);
    }

    return {
      init,
      resize
    };
  })();

  // --- 5. SVG SANITIZATION & SAFE RENDERING ---
  function sanitizeAndCreateSVG(svgStr) {
    if (!svgStr || typeof svgStr !== 'string') return null;
    const trimmed = svgStr.trim();
    if (!trimmed.includes('<svg') || !trimmed.includes('</svg>')) return null;

    try {
      const template = document.createElement('template');
      template.innerHTML = trimmed;
      const svg = template.content.querySelector('svg');
      if (!svg) return null;

      const dangerousTags = ['script', 'foreignobject', 'iframe', 'object', 'embed', 'audio', 'video', 'style'];
      dangerousTags.forEach(tag => {
        svg.querySelectorAll(tag).forEach(el => el.remove());
      });

      const allElements = [svg, ...svg.querySelectorAll('*')];
      allElements.forEach(el => {
        Array.from(el.attributes).forEach(attr => {
          const name = attr.name.toLowerCase();
          const val = attr.value.toLowerCase();
          if (name.startsWith('on') || ((name === 'href' || name === 'xlink:href') && val.includes('javascript:'))) {
            el.removeAttribute(attr.name);
          }
        });
      });

      if (!svg.getAttribute('viewBox')) {
        const w = svg.getAttribute('width') || '24';
        const h = svg.getAttribute('height') || '24';
        svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      }

      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
      svg.classList.add('card-icon-svg');

      return document.importNode(svg, true);
    } catch (e) {
      return null;
    }
  }

  // --- 6. PERSISTENCE & DATA INTEGRITY ---
  function sanitizeStats(raw) {
    if (!raw || typeof raw !== 'object') return { ...state.stats };
    return {
      schemaVersion: 3,
      played: Number.isInteger(raw.played) && raw.played >= 0 ? raw.played : 0,
      completed: Number.isInteger(raw.completed) && raw.completed >= 0 ? raw.completed : 0,
      currentStreak: Number.isInteger(raw.currentStreak) && raw.currentStreak >= 0 ? raw.currentStreak : 0,
      bestStreak: Number.isInteger(raw.bestStreak) && raw.bestStreak >= 0 ? raw.bestStreak : 0,
      bestTurns: Number.isInteger(raw.bestTurns) && raw.bestTurns > 0 ? raw.bestTurns : null,
      lastDailyCompletedDate: typeof raw.lastDailyCompletedDate === 'string' ? raw.lastDailyCompletedDate : '',
      turnHistory: Array.isArray(raw.turnHistory) ? raw.turnHistory.filter(n => Number.isInteger(n) && n > 0) : [],
      history: (raw.history && typeof raw.history === 'object') ? raw.history : {}
    };
  }

  function loadPersistence() {
    try {
      const soundPref = localStorage.getItem(CONFIG.soundPrefKey);
      if (soundPref !== null) state.soundEnabled = soundPref === '1';

      const bgAnimPref = localStorage.getItem(CONFIG.bgAnimPrefKey);
      if (bgAnimPref !== null) state.bgAnimEnabled = bgAnimPref === '1';

      const raw = localStorage.getItem(CONFIG.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          if (parsed.stats) state.stats = sanitizeStats(parsed.stats);
          if (parsed.dailySession && typeof parsed.dailySession === 'object') {
            state.dailySession = parsed.dailySession;
          }
          if (parsed.vaultSession && typeof parsed.vaultSession === 'object') {
            state.vaultSession = parsed.vaultSession;
          }
        }
      }
    } catch (err) {
      console.warn('Storage read error:', err);
    }
  }

  function savePersistence() {
    try {
      const payload = {
        stats: state.stats,
        dailySession: state.dailySession,
        vaultSession: state.vaultSession
      };
      localStorage.setItem(CONFIG.storageKey, JSON.stringify(payload));
    } catch (err) {
      console.warn('Unable to persist game progress.', err);
    }
  }

  // --- 7. DETERMINISTIC PRNG SHUFFLE ---
  function createRng(seed) {
    let s = (seed % 2147483647) || 1;
    return function () {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  function shuffle(array, seedVal) {
    const copy = [...array];
    const rng = createRng(seedVal);
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }
    return copy;
  }

  // --- 8. CSV PARSER & FALLBACK PUZZLES ---
  function parseCSV(text) {
    text = text.replace(/^\uFEFF/, '');
    const rows = [];
    let curRow = [];
    let curCell = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (inQuotes) {
        if (char === '"' && nextChar === '"') {
          curCell += '"';
          i++;
        } else if (char === '"') {
          inQuotes = false;
        } else {
          curCell += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          curRow.push(curCell.trim());
          curCell = '';
        } else if (char === '\n' || char === '\r') {
          curRow.push(curCell.trim());
          if (curRow.length > 1 || (curRow.length === 1 && curRow[0] !== '')) {
            rows.push(curRow);
          }
          curRow = [];
          curCell = '';
          if (char === '\r' && nextChar === '\n') i++;
        } else {
          curCell += char;
        }
      }
    }
    if (curCell.length || curRow.length) {
      curRow.push(curCell.trim());
      if (curRow.length > 1 || (curRow.length === 1 && curRow[0] !== '')) {
        rows.push(curRow);
      }
    }
    return rows;
  }

  function mapAndValidateRecords(rows) {
    if (rows.length < 2) return [];
    const rawHeaders = rows[0].map(h => h.trim());

    return rows.slice(1).map(row => {
      const record = {};
      rawHeaders.forEach((h, i) => {
        record[h] = row[i] ? row[i].trim() : '';
      });

      const findVal = (prefix, idx) => {
        const target = `${prefix}${idx}`.toLowerCase();
        for (const k of Object.keys(record)) {
          const norm = k.toLowerCase().replace(/[\s_-]/g, '');
          if (norm === target) return record[k];
        }
        return '';
      };

      const items = [];
      const icons = [];

      for (let i = 1; i <= 8; i++) {
        const itemVal = findVal('item', i) || `Item ${i}`;
        const iconVal = findVal('svg', i) || findVal('icon', i) || findVal('itemsvg', i) || '';
        items.push(itemVal);
        icons.push(iconVal);
      }

      const uniqueItems = new Set(items.map(s => s.trim().toLowerCase()));
      if (uniqueItems.size !== 8) {
        return null;
      }

      return {
        date: record.date || '',
        title: record.title || 'Championship Memory End',
        items,
        icons
      };
    }).filter(p => p && p.date && /^\d{4}-\d{2}-\d{2}$/.test(p.date));
  }

  const FALLBACK_PUZZLES = [
    {
      date: '2026-09-18',
      title: 'Championship Ice House',
      items: ['Granite Stone', 'Curling Broom', 'The Button', 'Delivery Hack', 'Hog Line', 'Tee Line', 'Ice Slider', 'Scoreboard'],
      icons: [
        "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'><circle cx='12' cy='12' r='8'/><path d='M8 12h8M12 8v4'/></svg>",
        "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'><line x1='19' y1='5' x2='9' y2='15'/><rect x='4' y='14' width='7' height='4' rx='1' transform='rotate(45 7.5 16)'/></svg>",
        "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'><circle cx='12' cy='12' r='9'/><circle cx='12' cy='12' r='5'/><circle cx='12' cy='12' r='2'/></svg>",
        "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'><rect x='5' y='6' width='14' height='12' rx='2'/><line x1='5' y1='12' x2='19' y2='12'/></svg>",
        "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'><line x1='3' y1='8' x2='21' y2='8'/><line x1='3' y1='16' x2='21' y2='16'/><line x1='12' y1='3' x2='12' y2='21'/></svg>",
        "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'><line x1='4' y1='12' x2='20' y2='12'/><line x1='12' y1='4' x2='12' y2='20'/></svg>",
        "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'><path d='M4 16c2-4 6-6 10-6s6 2 6 6H4z'/><line x1='4' y1='18' x2='20' y2='18'/></svg>",
        "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'><rect x='3' y='4' width='18' height='16' rx='2'/><line x1='3' y1='10' x2='21' y2='10'/><line x1='12' y1='10' x2='12' y2='20'/></svg>"
      ]
    },
    {
      date: '2026-09-17',
      title: 'Curling Delivery Tactics',
      items: ['In-Turn Draw', 'Out-Turn Curl', 'Center Guard', 'Corner Guard', 'Take-Out Hit', 'Hit and Roll', 'Button Freeze', 'Double Peel'],
      icons: [
        "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'><path d='M5 19c6-1 10-5 11-11'/><polyline points='11 8 16 8 16 13'/></svg>",
        "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'><path d='M19 19c-6-1-10-5-11-11'/><polyline points='13 8 8 8 8 13'/></svg>",
        "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'><path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'/></svg>",
        "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'><polygon points='4 4 11 4 11 11 4 11'/><polyline points='15 9 19 9 19 19 9 19 9 15'/></svg>",
        "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'><circle cx='8' cy='8' r='5'/><circle cx='16' cy='16' r='5'/><line x1='11.5' y1='11.5' x2='12.5' y2='12.5'/></svg>",
        "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'><circle cx='8' cy='12' r='4'/><path d='M12 12a5 5 0 0 1 8 4'/><polyline points='16 16 20 16 20 12'/></svg>",
        "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'><circle cx='9' cy='12' r='5'/><circle cx='17' cy='12' r='4'/></svg>",
        "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'><circle cx='6' cy='10' r='3'/><circle cx='18' cy='10' r='3'/><line x1='12' y1='20' x2='12' y2='4'/></svg>"
      ]
    }
  ];

  async function loadPuzzles() {
    let text = '';
    let httpDateHeader = null;

    try {
      const res = await fetch(CONFIG.csvPath, { cache: 'no-cache' });
      if (res.ok) {
        httpDateHeader = res.headers.get('date');
        text = await res.text();
        if (text && text.trim().length > 10) {
          localStorage.setItem(CONFIG.csvCacheKey, text);
        }
      }
    } catch (netErr) {
      const cached = localStorage.getItem(CONFIG.csvCacheKey);
      if (cached) text = cached;
    }

    await DailyReleaseClock.synchronize(httpDateHeader);
    state.todayDate = DailyReleaseClock.getLondonDateString();

    let parsed = [];
    if (text && text.trim().length > 10) {
      const rows = parseCSV(text);
      parsed = mapAndValidateRecords(rows);
    }

    if (!parsed.length) {
      parsed = [...FALLBACK_PUZZLES];
    }

    parsed.sort((a, b) => a.date.localeCompare(b.date));

    const isPreview = new URLSearchParams(window.location.search).get('preview') === '1';
    state.puzzles = isPreview ? parsed : parsed.filter(p => p.date <= state.todayDate);

    const exact = state.puzzles.find(p => p.date === state.todayDate);
    if (exact) {
      state.todayPuzzle = exact;
    } else {
      state.todayPuzzle = state.puzzles.length ? state.puzzles[state.puzzles.length - 1] : parsed[0];
    }
  }

  // --- 9. DYNAMIC ENLARGED MULTILINE CARD TEXT FITTING & ARIA ---
  function applyDynamicCardText(wordEl, text) {
    wordEl.textContent = text;
    const len = text.length;
    const words = text.trim().split(/\s+/);

    // Highly calibrated dynamic scale: larger rem & cqi ranges for distinct readability
    let cqi = 11.5;
    let minRem = 0.65;
    let maxRem = 0.95;

    if (len > 18 || (words.length >= 3 && len > 15)) {
      cqi = 8.5;
      minRem = 0.52;
      maxRem = 0.68;
    } else if (len > 13 || words.length >= 2) {
      cqi = 9.8;
      minRem = 0.58;
      maxRem = 0.78;
    } else if (len > 8) {
      cqi = 10.8;
      minRem = 0.62;
      maxRem = 0.88;
    }

    wordEl.style.whiteSpace = 'normal';
    wordEl.style.textOverflow = 'clip';
    wordEl.style.overflowWrap = 'break-word';
    wordEl.style.wordBreak = 'normal';
    wordEl.style.hyphens = 'auto';
    wordEl.style.lineHeight = '1.14';
    wordEl.style.display = '-webkit-box';
    wordEl.style.webkitBoxOrient = 'vertical';
    wordEl.style.webkitLineClamp = '2';
    wordEl.style.maxHeight = '2.8em';
    wordEl.style.fontSize = `clamp(${minRem}rem, ${cqi}cqi, ${maxRem}rem)`;
  }

  function renderCardDOM(btn, card, index) {
    btn.innerHTML = '';

    const inner = document.createElement('div');
    inner.className = 'card-inner';

    // Face-Down Card Element (Tactile Ice Stone Tile)
    const back = document.createElement('div');
    back.className = 'card-face card-face-back';
    const mark = document.createElement('span');
    mark.className = 'card-back-mark';
    mark.textContent = '🍁';
    back.appendChild(mark);

    // Face-Up Card Element (Polished Rink Tile)
    const front = document.createElement('div');
    front.className = 'card-face card-face-front';

    const content = document.createElement('div');
    content.className = 'card-content';

    if (card && card.icon) {
      const iconEl = sanitizeAndCreateSVG(card.icon);
      if (iconEl) {
        const iconWrap = document.createElement('div');
        iconWrap.className = 'card-icon';
        iconWrap.appendChild(iconEl);
        content.appendChild(iconWrap);
      }
    }

    const word = document.createElement('div');
    word.className = 'card-word';
    applyDynamicCardText(word, card.name);
    content.appendChild(word);
    front.appendChild(content);

    const badge = document.createElement('div');
    badge.className = 'card-match-badge hidden';
    badge.textContent = '✓';
    front.appendChild(badge);

    inner.appendChild(back);
    inner.appendChild(front);
    btn.appendChild(inner);

    btn.setAttribute('aria-label', `Card ${index + 1}`);
  }

  function updateCardAria(btn, card, stateType) {
    if (stateType === 'face-down') {
      btn.setAttribute('aria-label', `Card ${parseInt(btn.dataset.index, 10) + 1}`);
    } else if (stateType === 'flipped') {
      btn.setAttribute('aria-label', `${card.name}`);
    } else if (stateType === 'matched') {
      btn.setAttribute('aria-label', `${card.name}, matched pair`);
      const badge = btn.querySelector('.card-match-badge');
      if (badge) badge.classList.remove('hidden');
    }
  }

  // --- 10. VIEW CONTROLLERS ---
  function showView(viewId) {
    document.querySelectorAll('.app-main .view').forEach(v => v.classList.add('hidden'));
    const target = document.getElementById(viewId);
    if (target) target.classList.remove('hidden');

    if (viewId === 'view-menu') {
      renderMenuView();
    } else if (viewId === 'view-vault') {
      renderVaultView();
    }
  }

  function showToast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.add('hidden'), 2400);
  }

  // --- 11. MAIN MENU CONTROLLER ---
  function renderMenuView() {
    const p = state.todayPuzzle;
    if (!p) return;

    document.getElementById('menu-daily-date').textContent = p.date;
    document.getElementById('menu-daily-title').textContent = p.title;

    const completed = state.stats.history[p.date];
    const statusDesc = document.getElementById('menu-daily-status');
    const playBtn = document.getElementById('btn-play-game');
    const playLabel = document.getElementById('btn-play-label');
    const countdownWrap = document.getElementById('menu-countdown-wrap');

    if (completed) {
      statusDesc.textContent = `Completed in ${completed.turns} turns (Rating: ${'★'.repeat(completed.stars || 2)})`;
      playLabel.textContent = 'Replay End 🍁';
      countdownWrap.classList.remove('hidden');
      updateCountdownDisplays();
    } else if (state.dailySession && state.dailySession.date === p.date) {
      statusDesc.textContent = `In Progress (${state.dailySession.matchedCardCount / 2} / 8 pairs found)`;
      playLabel.textContent = 'Resume End 🍁';
      countdownWrap.classList.add('hidden');
    } else {
      statusDesc.textContent = 'Ready for delivery';
      playLabel.textContent = 'Play Memory Match 🍁';
      countdownWrap.classList.add('hidden');
    }

    const archiveCount = state.puzzles.filter(pz => pz.date <= state.todayDate && pz.date !== p.date).length;
    document.getElementById('vault-count-tag').textContent = `${archiveCount} Sets`;
  }

  function updateCountdownDisplays() {
    const rem = DailyReleaseClock.getTimeUntilNextRelease();
    const txt = `${rem.hours}h ${rem.minutes}m ${rem.seconds}s`;

    const el1 = document.getElementById('menu-countdown-val');
    const el2 = document.getElementById('complete-countdown-val');
    if (el1) el1.textContent = txt;
    if (el2) el2.textContent = txt;
  }

  // --- 12. VAULT VIEW ---
  function renderVaultView() {
    const container = document.getElementById('vault-list');
    container.innerHTML = '';

    const archive = state.puzzles.filter(
      p => p.date <= state.todayDate && p.date !== state.todayPuzzle.date
    );
    archive.sort((a, b) => b.date.localeCompare(a.date));

    if (!archive.length) {
      container.innerHTML = '<div class="card status-card"><p class="status-text">No previous ends in the championship vault yet.</p></div>';
      return;
    }

    const groups = {};
    archive.forEach(p => {
      const monthKey = p.date.substring(0, 7);
      if (!groups[monthKey]) groups[monthKey] = [];
      groups[monthKey].push(p);
    });

    const monthKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

    monthKeys.forEach((mKey, idx) => {
      const details = document.createElement('details');
      details.className = 'vault-month-group';
      if (idx === 0) details.open = true;

      const [year, month] = mKey.split('-');
      const dateObj = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      const monthName = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });

      const summary = document.createElement('summary');
      summary.className = 'vault-month-summary';
      summary.innerHTML = `<span>${monthName}</span> <span class="vault-badge">${groups[mKey].length} Ends</span>`;
      details.appendChild(summary);

      const content = document.createElement('div');
      content.className = 'vault-month-content';

      groups[mKey].forEach(p => {
        const item = document.createElement('div');
        item.className = 'vault-item';
        const done = state.stats.history[p.date];
        const badgeText = done ? `Solved (${done.turns} turns)` : 'Unplayed';

        item.innerHTML = `
          <div class="vault-info">
            <span class="meta-date">${p.date}</span>
            <span class="vault-title">${p.title}</span>
            <span class="vault-badge">${badgeText}</span>
          </div>
          <button class="btn btn-sm ${done ? '' : 'btn-primary'}" type="button">
            ${done ? 'Replay' : 'Play'}
          </button>
        `;
        item.querySelector('button').onclick = () => loadPuzzle(p);
        content.appendChild(item);
      });

      details.appendChild(content);
      container.appendChild(details);
    });
  }

  // --- 13. GAMEPLAY ENGINE ---
  function cancelPendingTimers() {
    if (state.evalTimer) {
      clearTimeout(state.evalTimer);
      state.evalTimer = null;
    }
    if (state.mismatchTimer) {
      clearTimeout(state.mismatchTimer);
      state.mismatchTimer = null;
    }
  }

  function loadPuzzle(puzzle) {
    cancelPendingTimers();
    state.activePuzzle = puzzle;
    state.flippedIndices = [];
    state.phase = GamePhase.IDLE;
    state.focusedCardIndex = 0;

    const isDaily = puzzle.date === state.todayPuzzle.date;
    const pastRecord = state.stats.history[puzzle.date];
    state.isReplay = !!pastRecord;

    document.getElementById('gameplay-title').textContent = puzzle.title;
    document.getElementById('game-practice-badge').classList.toggle('hidden', !state.isReplay);

    const raw = [];
    puzzle.items.forEach((label, id) => {
      const icon = (puzzle.icons && puzzle.icons[id]) ? puzzle.icons[id] : '';
      raw.push({ id, name: label, icon });
      raw.push({ id, name: label, icon });
    });

    const seedVal = parseInt(puzzle.date.replace(/-/g, ''), 10) || 4242;
    state.boardCards = shuffle(raw, seedVal);

    const sessionKey = isDaily ? 'dailySession' : 'vaultSession';
    const existing = state[sessionKey];
    const isResuming = existing && existing.date === puzzle.date && existing.matchedCardCount < 16;

    if (isResuming) {
      state.turns = existing.turns || 0;
      state.matchedCardCount = existing.matchedCardCount || 0;
    } else {
      state.turns = 0;
      state.matchedCardCount = 0;
      state[sessionKey] = {
        date: puzzle.date,
        turns: 0,
        matchedCardCount: 0,
        matchedIds: []
      };
      savePersistence();
    }

    document.getElementById('stat-turns').textContent = state.turns;
    document.getElementById('stat-pairs').textContent = `${state.matchedCardCount / 2} / 8`;
    document.getElementById('game-feedback').textContent = 'Flip tiles to match all 8 championship pairs.';

    const board = document.getElementById('game-board');
    board.innerHTML = '';

    state.boardCards.forEach((card, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'card-tile';
      btn.dataset.index = index;
      btn.setAttribute('tabindex', index === 0 ? '0' : '-1');

      renderCardDOM(btn, card, index);

      if (isResuming && state[sessionKey].matchedIds.includes(card.id)) {
        btn.classList.add('matched');
        updateCardAria(btn, card, 'matched');
        btn.setAttribute('aria-disabled', 'true');
      } else {
        updateCardAria(btn, card, 'face-down');
      }

      btn.onclick = () => handleCardInteraction(index);
      board.appendChild(btn);
    });

    showView('view-game');
  }

  function handleCardInteraction(index) {
    if (state.phase === GamePhase.EVALUATING || state.phase === GamePhase.LOCKED || state.phase === GamePhase.COMPLETED) {
      return;
    }
    if (state.flippedIndices.includes(index)) return;

    const board = document.getElementById('game-board');
    const btn = board.children[index];
    if (btn.classList.contains('matched')) return;

    playSound('flip');
    triggerHaptic('tap');

    state.flippedIndices.push(index);
    btn.classList.add('flipped');
    updateCardAria(btn, state.boardCards[index], 'flipped');

    if (state.flippedIndices.length === 1) {
      state.phase = GamePhase.ONE_UP;
      document.getElementById('game-feedback').textContent = 'Find its matching pair...';
    } else if (state.flippedIndices.length === 2) {
      state.phase = GamePhase.EVALUATING;
      state.turns++;
      document.getElementById('stat-turns').textContent = state.turns;

      state.evalTimer = setTimeout(() => {
        state.evalTimer = null;
        evaluateCardPair();
      }, 360);
    }
  }

  function evaluateCardPair() {
    if (state.flippedIndices.length < 2) return;
    const [idx1, idx2] = state.flippedIndices;
    const card1 = state.boardCards[idx1];
    const card2 = state.boardCards[idx2];
    const board = document.getElementById('game-board');
    if (!board) return;

    const btn1 = board.children[idx1];
    const btn2 = board.children[idx2];
    if (!btn1 || !btn2) return;

    const isDaily = state.activePuzzle.date === state.todayPuzzle.date;
    const sessionKey = isDaily ? 'dailySession' : 'vaultSession';

    if (card1.id === card2.id) {
      btn1.classList.add('matched', 'pulse-match');
      btn2.classList.add('matched', 'pulse-match');
      btn1.setAttribute('aria-disabled', 'true');
      btn2.setAttribute('aria-disabled', 'true');
      updateCardAria(btn1, card1, 'matched');
      updateCardAria(btn2, card2, 'matched');

      playSound('match');
      triggerHaptic('match');

      state.matchedCardCount += 2;
      const pairs = state.matchedCardCount / 2;
      document.getElementById('stat-pairs').textContent = `${pairs} / 8`;
      document.getElementById('game-feedback').textContent = `Match: ${card1.name}!`;

      setTimeout(() => {
        btn1.classList.remove('pulse-match');
        btn2.classList.remove('pulse-match');
      }, 350);

      state.flippedIndices = [];
      state.phase = GamePhase.IDLE;

      if (state[sessionKey]) {
        state[sessionKey].turns = state.turns;
        state[sessionKey].matchedCardCount = state.matchedCardCount;
        if (!state[sessionKey].matchedIds.includes(card1.id)) {
          state[sessionKey].matchedIds.push(card1.id);
        }
        savePersistence();
      }

      if (state.matchedCardCount === 16) {
        state.phase = GamePhase.COMPLETED;
        setTimeout(handlePuzzleCompletion, 450);
      }
    } else {
      playSound('mismatch');
      triggerHaptic('mismatch');
      btn1.classList.add('shake-mismatch');
      btn2.classList.add('shake-mismatch');
      document.getElementById('game-feedback').textContent = 'Not a match.';

      state.mismatchTimer = setTimeout(() => {
        btn1.classList.remove('flipped', 'shake-mismatch');
        btn2.classList.remove('flipped', 'shake-mismatch');
        updateCardAria(btn1, card1, 'face-down');
        updateCardAria(btn2, card2, 'face-down');
        state.flippedIndices = [];
        state.phase = GamePhase.IDLE;
        state.mismatchTimer = null;
        document.getElementById('game-feedback').textContent = 'Flip tiles to match all 8 pairs.';
      }, 850);
    }
  }

  // --- 14. ARROW-KEY GRID ACCESSIBILITY ---
  function handleGridKeydown(e) {
    const board = document.getElementById('game-board');
    if (!board || state.phase === GamePhase.COMPLETED) return;

    let cur = state.focusedCardIndex;
    let next = cur;

    switch (e.key) {
      case 'ArrowRight':
        next = (cur + 1) % 16;
        e.preventDefault();
        break;
      case 'ArrowLeft':
        next = (cur - 1 + 16) % 16;
        e.preventDefault();
        break;
      case 'ArrowDown':
        next = (cur + 4) % 16;
        e.preventDefault();
        break;
      case 'ArrowUp':
        next = (cur - 4 + 16) % 16;
        e.preventDefault();
        break;
      case 'Home':
        next = 0;
        e.preventDefault();
        break;
      case 'End':
        next = 15;
        e.preventDefault();
        break;
      default:
        return;
    }

    if (next !== cur) {
      board.children[cur].setAttribute('tabindex', '-1');
      board.children[next].setAttribute('tabindex', '0');
      board.children[next].focus();
      state.focusedCardIndex = next;
    }
  }

  // --- 15. STREAKS & COMPLETION MODAL ---
  function updateCalendarStreak(solvedDateStr) {
    const s = state.stats;
    if (!s.lastDailyCompletedDate) {
      s.currentStreak = 1;
    } else {
      const last = new Date(s.lastDailyCompletedDate + 'T00:00:00Z');
      const curr = new Date(solvedDateStr + 'T00:00:00Z');
      const diffDays = Math.round((curr - last) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        s.currentStreak++;
      } else if (diffDays === 0) {
        // Already cleared today
      } else {
        s.currentStreak = 1;
      }
    }
    s.lastDailyCompletedDate = solvedDateStr;
    if (s.currentStreak > s.bestStreak) s.bestStreak = s.currentStreak;
  }

  function handlePuzzleCompletion() {
    playSound('complete');
    triggerHaptic('complete');

    const turns = state.turns;
    const accuracy = `${Math.max(0, Math.round((8 / turns) * 100))}%`;
    const dateKey = state.activePuzzle.date;
    const isDaily = dateKey === state.todayPuzzle.date;
    const s = state.stats;

    let stars = 1;
    let ratingText = 'Solved!';
    if (turns <= 12) {
      stars = 3;
      ratingText = 'Masterful Recall! 🍁';
    } else if (turns <= 18) {
      stars = 2;
      ratingText = 'Great Match!';
    }

    let isNewBest = false;
    if (!s.history[dateKey]) {
      s.played++;
      s.completed++;
      if (isDaily) updateCalendarStreak(dateKey);

      if (s.bestTurns === null || turns < s.bestTurns) {
        if (s.completed > 1) isNewBest = true;
        s.bestTurns = turns;
      }
      s.turnHistory.push(turns);
      s.history[dateKey] = { turns, accuracy, stars };
    }

    if (isDaily) state.dailySession = null;
    else state.vaultSession = null;
    savePersistence();

    document.getElementById('complete-turns').textContent = turns;
    document.getElementById('complete-accuracy').textContent = accuracy;
    document.getElementById('complete-rating-label').textContent = ratingText;
    document.getElementById('complete-pb-banner').classList.toggle('hidden', !isNewBest);
    document.getElementById('complete-replay-note').classList.toggle('hidden', !state.isReplay);

    const starsBox = document.getElementById('complete-stars');
    starsBox.innerHTML = '';
    for (let i = 1; i <= 3; i++) {
      const sp = document.createElement('span');
      sp.className = i <= stars ? 'star-glyph' : 'star-glyph star-empty';
      sp.textContent = '★';
      starsBox.appendChild(sp);
    }

    const list = document.getElementById('complete-items-list');
    list.innerHTML = '';
    state.activePuzzle.items.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      list.appendChild(li);
    });

    updateCountdownDisplays();
    openModal('modal-complete');
  }

  // --- 16. SHARING SYSTEM ---
  function shareResult() {
    const p = state.activePuzzle || state.todayPuzzle;
    const turns = state.turns || (state.stats.history[p.date] ? state.stats.history[p.date].turns : 0);
    const shareText = `Memory Match 🍁 — ${p.date}\nSolved in ${turns} turns!\n🥌🥌🥌🥌\n🥌🥌🥌🥌`;

    if (navigator.share) {
      navigator.share({
        title: 'Memory Match 🍁 Result',
        text: shareText
      }).catch(() => {});
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareText).then(() => {
        showToast('Result copied to clipboard');
      }).catch(() => {
        showToast('Unable to copy result');
      });
    } else {
      showToast('Sharing not supported on this browser');
    }
  }

  // --- 17. HOW TO PLAY RIGHT-SIDE SLIDE PANEL ---
  function openHowToPlayPanel() {
    state.lastActiveElement = document.activeElement;
    const panel = document.getElementById('panel-how-to-play');
    const overlay = document.getElementById('modal-overlay');
    if (!panel || !overlay) return;

    panel.classList.remove('hidden');
    overlay.classList.remove('hidden');

    void panel.offsetWidth;
    panel.classList.add('panel-open');

    const focusable = panel.querySelectorAll('button, [href]');
    if (focusable.length) focusable[0].focus();
  }

  function closeHowToPlayPanel() {
    const panel = document.getElementById('panel-how-to-play');
    if (!panel) return;

    panel.classList.remove('panel-open');
    setTimeout(() => {
      panel.classList.add('hidden');
      const activeModal = document.querySelector('.modal:not(.hidden)');
      if (!activeModal) {
        document.getElementById('modal-overlay').classList.add('hidden');
      }
      if (state.lastActiveElement && typeof state.lastActiveElement.focus === 'function') {
        state.lastActiveElement.focus();
      }
    }, 400);
  }

  // --- 18. MODALS & FOCUS TRAP ---
  function openModal(modalId) {
    state.lastActiveElement = document.activeElement;
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));

    const target = document.getElementById(modalId);
    if (target) {
      target.classList.remove('hidden');
      document.getElementById('modal-overlay').classList.remove('hidden');
      const focusable = target.querySelectorAll('button, [href], input, textarea');
      if (focusable.length) focusable[0].focus();
    }
  }

  function closeAllModals() {
    closeHowToPlayPanel();
    document.querySelectorAll('.modal').forEach(el => el.classList.add('hidden'));
    document.getElementById('modal-overlay').classList.add('hidden');
    if (state.lastActiveElement && typeof state.lastActiveElement.focus === 'function') {
      state.lastActiveElement.focus();
    }
  }

  function handleModalTrap(e) {
    const activeModal = document.querySelector('.modal:not(.hidden)') || document.querySelector('.slide-panel.panel-open');
    if (!activeModal) return;

    if (e.key === 'Escape') {
      closeAllModals();
      return;
    }

    if (e.key === 'Tab') {
      const focusable = Array.from(activeModal.querySelectorAll('button, [href], input, textarea')).filter(
        el => !el.disabled && el.offsetParent !== null
      );
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        last.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    }
  }

  // --- 19. STATS & MIGRATION ---
  function renderStatsModal() {
    const s = state.stats;
    document.getElementById('stat-modal-played').textContent = s.played;
    document.getElementById('stat-modal-completed').textContent = s.completed;
    document.getElementById('stat-modal-streak').textContent = s.currentStreak;
    document.getElementById('stat-modal-best-streak').textContent = s.bestStreak;
    document.getElementById('stat-modal-best-turns').textContent = s.bestTurns !== null ? s.bestTurns : '—';

    const avg = s.turnHistory.length
      ? (s.turnHistory.reduce((a, b) => a + b, 0) / s.turnHistory.length).toFixed(1)
      : '—';
    document.getElementById('stat-modal-avg-turns').textContent = avg;
    document.getElementById('import-block').classList.add('hidden');
  }

  function exportBackupData() {
    const payload = JSON.stringify(state.stats);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(payload).then(() => {
        showToast('Backup JSON copied to clipboard!');
      }).catch(() => {
        showToast('Failed copying to clipboard.');
      });
    } else {
      prompt('Copy your backup string:', payload);
    }
  }

  function applyImportedData() {
    const txtArea = document.getElementById('import-data-text');
    const raw = txtArea.value.trim();
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      state.stats = sanitizeStats(parsed);
      savePersistence();
      renderStatsModal();
      txtArea.value = '';
      showToast('Records imported successfully!');
    } catch (e) {
      showToast('Invalid backup code.');
    }
  }

  // --- 20. MIDNIGHT ROLLOVER ---
  async function checkDayRollover() {
    const newLondonDate = DailyReleaseClock.getLondonDateString();
    if (state.todayDate && newLondonDate !== state.todayDate) {
      state.todayDate = newLondonDate;
      try {
        await loadPuzzles();
        renderMenuView();
        showToast("New Daily Challenge released! 🍁");
      } catch (e) {}
    }
  }

  // --- 21. EVENT BINDING ---
  function setupEvents() {
    document.getElementById('btn-sound-toggle').onclick = toggleSound;
    document.getElementById('btn-toggle-sound-setting').onclick = toggleSound;
    document.getElementById('btn-toggle-bg-anim').onclick = toggleBgAnimation;
    updateSoundUI();
    updateBgAnimUI();

    document.getElementById('btn-play-game').onclick = () => loadPuzzle(state.todayPuzzle);
    document.getElementById('btn-open-vault').onclick = () => showView('view-vault');
    document.getElementById('btn-open-settings').onclick = () => openModal('modal-settings');
    document.getElementById('btn-open-how-to-play').onclick = openHowToPlayPanel;

    document.getElementById('btn-util-stats').onclick = () => {
      renderStatsModal();
      openModal('modal-stats');
    };
    document.getElementById('btn-util-share').onclick = shareResult;
    document.getElementById('btn-util-plus').onclick = () => openModal('modal-plus');

    document.getElementById('btn-vault-back').onclick = () => showView('view-menu');

    document.getElementById('btn-game-back').onclick = () => {
      cancelPendingTimers();
      showView('view-menu');
    };
    document.getElementById('btn-game-rules').onclick = openHowToPlayPanel;
    document.getElementById('btn-reset-board').onclick = () => openModal('modal-reset');
    document.getElementById('btn-reset-cancel').onclick = closeAllModals;
    document.getElementById('btn-reset-confirm').onclick = () => {
      closeAllModals();
      cancelPendingTimers();
      const isDaily = state.activePuzzle.date === state.todayPuzzle.date;
      if (isDaily) state.dailySession = null;
      else state.vaultSession = null;
      savePersistence();
      loadPuzzle(state.activePuzzle);
    };

    document.getElementById('game-board').addEventListener('keydown', handleGridKeydown);

    document.getElementById('btn-close-htp').onclick = closeHowToPlayPanel;
    document.getElementById('btn-htp-got-it').onclick = closeHowToPlayPanel;

    document.getElementById('btn-complete-share').onclick = shareResult;
    document.getElementById('btn-complete-vault').onclick = () => {
      closeAllModals();
      showView('view-vault');
    };
    document.getElementById('btn-complete-menu').onclick = () => {
      closeAllModals();
      showView('view-menu');
    };

    document.getElementById('modal-overlay').onclick = closeAllModals;
    document.querySelectorAll('.btn-close').forEach(b => {
      b.onclick = closeAllModals;
    });
    document.addEventListener('keydown', handleModalTrap);

    document.getElementById('btn-export-backup').onclick = exportBackupData;
    document.getElementById('btn-import-backup-toggle').onclick = () => {
      const blk = document.getElementById('import-block');
      blk.classList.toggle('hidden');
    };
    document.getElementById('btn-import-apply').onclick = applyImportedData;

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        DailyReleaseClock.synchronize(null).then(checkDayRollover);
      }
    });
    window.addEventListener('focus', () => {
      DailyReleaseClock.synchronize(null).then(checkDayRollover);
    });
    window.addEventListener('online', () => {
      DailyReleaseClock.synchronize(null).then(checkDayRollover);
    });

    state.countdownTimer = setInterval(() => {
      updateCountdownDisplays();
      checkDayRollover();
    }, 1000);
  }

  // --- 22. INITIALIZATION ---
  async function init() {
    loadPersistence();
    CurlingSimulation.init();
    setupEvents();

    try {
      await loadPuzzles();
      showView('view-menu');
    } catch (err) {
      console.error('Initialization error:', err);
      const msgEl = document.getElementById('status-message');
      msgEl.textContent = 'Unable to connect to puzzle archives.';
      const retryBtn = document.getElementById('btn-retry');
      retryBtn.classList.remove('hidden');
      retryBtn.onclick = () => {
        retryBtn.classList.add('hidden');
        msgEl.textContent = 'Connecting...';
        init();
      };
      showView('view-status');
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();