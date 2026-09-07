(() => {
  'use strict';

  const formatISODate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseISODate = (dateStr) => {
    const parts = dateStr.split('-');
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  };

  const addDays = (baseDate, days) => {
    const res = new Date(baseDate);
    res.setDate(res.getDate() + days);
    return res;
  };

  const getSystemTodayString = () => formatISODate(new Date());

  const PUZZLE_SETS = [
    {
      id: 'puzzle-1',
      title: 'PUZZLE 1: THE ESSENTIALS',
      description: 'Master the hammer, button, hack, and key team roles.',
      pairs: [
        { term: 'HAMMER', category: 'TACTIC', icon: '🔨', desc: 'Last stone advantage in an end' },
        { term: 'BUTTON', category: 'TARGET', icon: '🎯', desc: 'Exact center 1-foot circle of house' },
        { term: 'HACK', category: 'DELIVERY', icon: '👟', desc: 'Rubber foothold used to push off' },
        { term: 'HOG LINE', category: 'RULES', icon: '📏', desc: 'Boundary rock must fully clear' },
        { term: 'SKIP', category: 'ROLE', icon: '🧠', desc: 'Captain directing shots and strategy' },
        { term: 'SWEEPER', category: 'ROLE', icon: '🧹', desc: 'Brushes ice to control curl and speed' },
        { term: 'HOUSE', category: 'TARGET', icon: '⭕', desc: 'Concentric 12ft scoring rings' },
        { term: 'PEBBLE', category: 'ICE', icon: '❄️', desc: 'Frozen water droplets sprayed on sheet' }
      ]
    },
    {
      id: 'puzzle-2',
      title: 'PUZZLE 2: SHOT MAKING',
      description: 'Precision weight, takeouts, and rock placement.',
      pairs: [
        { term: 'DRAW', category: 'SHOT', icon: '🎯', desc: 'Gentle shot stopping in the house' },
        { term: 'TAKEOUT', category: 'SHOT', icon: '💥', desc: 'High-speed hit clearing opponent stone' },
        { term: 'GUARD', category: 'SHOT', icon: '🛡️', desc: 'Protective rock stationed in front' },
        { term: 'FREEZE', category: 'SHOT', icon: '🧊', desc: 'Resting flush against opponent stone' },
        { term: 'TAP-BACK', category: 'SHOT', icon: '👆', desc: 'Nudging a rock deeper into house' },
        { term: 'PEEL', category: 'SHOT', icon: '⚡', desc: 'Removing guard and shooter stone' },
        { term: 'CHIP & LIE', category: 'SHOT', icon: '🔀', desc: 'Deflecting off stone and staying' },
        { term: 'RAISE', category: 'SHOT', icon: '🚀', desc: 'Bumping teammate stone into rings' }
      ]
    },
    {
      id: 'puzzle-3',
      title: 'PUZZLE 3: ROTATION & TACTICS',
      description: 'Stone turns, blank ends, and scoreboard strategy.',
      pairs: [
        { term: 'IN-TURN', category: 'RELEASE', icon: '↻', desc: 'Clockwise rotation at release' },
        { term: 'OUT-TURN', category: 'RELEASE', icon: '↺', desc: 'Counter-clockwise stone rotation' },
        { term: 'BLANK END', category: 'TACTIC', icon: '0️⃣', desc: 'Scoreless end keeping hammer' },
        { term: 'STEAL', category: 'TACTIC', icon: '🥷', desc: 'Scoring without final hammer rock' },
        { term: 'POWER PLAY', category: 'RULES', icon: '⚡', desc: 'Mixed doubles split stones option' },
        { term: 'FORCE', category: 'TACTIC', icon: '🔒', desc: 'Limiting opponent to 1 point' },
        { term: 'SPLIT', category: 'SHOT', icon: '↔️', desc: 'Dividing two stones across rings' },
        { term: 'SWEEPING', category: 'TACTIC', icon: '🧹', desc: 'Choosing pressure and line to shape the shot' }
      ]
    },
    {
      id: 'puzzle-4',
      title: 'PUZZLE 4: GEAR & THE SHEET',
      description: 'Ailsa Craig granite, shoe soles, and sheet lines.',
      pairs: [
        { term: 'GRANITE', category: 'EQUIP', icon: '⛰️', desc: 'Ailsa Craig dense microgranite' },
        { term: 'SLIDER', category: 'EQUIP', icon: '⛸️', desc: 'Teflon shoe sole for gliding' },
        { term: 'GRIPPER', category: 'EQUIP', icon: '🥾', desc: 'Rubber traction sole for pushing' },
        { term: 'BROOM', category: 'EQUIP', icon: '🧹', desc: 'Synthetic sweeping brush head' },
        { term: 'TEE LINE', category: 'LINE', icon: '➕', desc: 'Transverse line dividing house' },
        { term: 'BACK LINE', category: 'LINE', icon: '⛔', desc: 'Back boundary behind the 12ft ring' },
        { term: 'CORNER GUARD', category: 'TACTIC', icon: '📐', desc: 'Shield stone placed out wide' },
        { term: 'ICE MAKER', category: 'ROLE', icon: '🧑‍🔧', desc: 'Craftsman who stones and pebbles' }
      ]
    },
    {
      id: 'puzzle-5',
      title: 'PUZZLE 5: CHAMPIONSHIP PLAY',
      description: 'Tournament prestige, rock weights, and execution.',
      pairs: [
        { term: 'BONSPIEL', category: 'EVENT', icon: '🏆', desc: 'Traditional curling tournament' },
        { term: 'EIGHT-ENDER', category: 'SCORE', icon: '🎱', desc: 'Flawless 8-point maximum end' },
        { term: 'CURL', category: 'PHYSICS', icon: '🌀', desc: 'Lateral arc of a spinning stone' },
        { term: 'WEIGHT', category: 'PHYSICS', icon: '⚖️', desc: 'Velocity applied to the stone' },
        { term: 'LINE', category: 'PHYSICS', icon: '📐', desc: 'Initial trajectory toward target' },
        { term: 'VICE-SKIP', category: 'ROLE', icon: '🥈', desc: 'Directs house for skip deliveries' },
        { term: 'LEAD', category: 'ROLE', icon: '1️⃣', desc: 'Throws opening 2 rocks of an end' },
        { term: 'SECOND', category: 'ROLE', icon: '2️⃣', desc: 'Throws 3rd and 4th stones each end' }
      ]
    },
    {
      id: 'puzzle-6',
      title: 'PUZZLE 6: SWEEPING & CALLS',
      description: 'Directional sweeping, broom mechanics, and skip calls.',
      pairs: [
        { term: 'HARD SWEEP', category: 'TACTIC', icon: '💨', desc: 'Maximum pressure to hold stone line' },
        { term: 'CARVING', category: 'TACTIC', icon: '🔪', desc: 'Directional brushing to enhance curl' },
        { term: 'WHOA', category: 'CALL', icon: '✋', desc: 'Skip directive to stop brushing' },
        { term: 'HURRY', category: 'CALL', icon: '⚡', desc: 'Urgent command for intense sweeping' },
        { term: 'FOUR-FOOT', category: 'TARGET', icon: '🔴', desc: 'Concentric ring surrounding button' },
        { term: 'TWELVE-FOOT', category: 'TARGET', icon: '🔵', desc: 'Outermost scoring circle zone' },
        { term: 'BITER', category: 'TARGET', icon: '🤏', desc: 'Stone barely touching outer ring' },
        { term: 'THINKING TIME', category: 'RULES', icon: '⏱️', desc: 'Strategic match clock per team' }
      ]
    },
    {
      id: 'puzzle-7',
      title: 'PUZZLE 7: OFFICIAL RULES',
      description: 'Free Guard Zone rules, splits, and championship lore.',
      pairs: [
        { term: 'FREE GUARD ZONE', category: 'RULES', icon: '🛡️', desc: 'Protected area for opening 5 rocks' },
        { term: 'BURNT STONE', category: 'RULES', icon: '🔥', desc: 'Infraction when touched while moving' },
        { term: 'HANDLE', category: 'EQUIP', icon: '🔴', desc: 'Plastic grip fastened atop stone' },
        { term: 'RUNNING EDGE', category: 'EQUIP', icon: '⭕', desc: 'Precision ground circular base' },
        { term: 'EXTRA END', category: 'SCORE', icon: '➕', desc: 'Sudden-death tiebreak round' },
        { term: 'DRAW WEIGHT', category: 'PHYSICS', icon: '🎯', desc: 'Exact momentum required for house' },
        { term: 'AILSA CRAIG', category: 'GEAR', icon: '🏔️', desc: 'Scottish island microgranite quarry' },
        { term: 'SPIRIT OF CURLING', category: 'CODE', icon: '🤝', desc: 'Traditional honor code and conduct' }
      ]
    },
    {
      id: 'puzzle-8',
      title: 'PUZZLE 8: DELIVERY & PHYSICS',
      description: 'Balance, slide mechanics, and ice friction dynamics.',
      pairs: [
        { term: 'SLIDE', category: 'DELIVERY', icon: '⛸️', desc: 'Low-friction lunge out of the hack' },
        { term: 'RELEASE', category: 'DELIVERY', icon: '🎯', desc: 'Smooth detachment of hand from handle' },
        { term: 'LINE OF DELIVERY', category: 'PHYSICS', icon: '📏', desc: 'Target path from hack to skip broom' },
        { term: 'BACKSWING', category: 'DELIVERY', icon: '🔄', desc: 'Initial pull back before delivery push' },
        { term: 'FRICTION', category: 'PHYSICS', icon: '❄️', desc: 'Thermal interaction between stone and pebble' },
        { term: 'FALL LINE', category: 'ICE', icon: '📉', desc: 'Natural slope or drift across sheet' },
        { term: 'CENTER LINE', category: 'LINE', icon: '➖', desc: 'Longitudinal line splitting sheet length' },
        { term: 'MOMENTUM', category: 'PHYSICS', icon: '⚡', desc: 'Forward inertia carrying stone to house' }
      ]
    },
    {
      id: 'puzzle-9',
      title: 'PUZZLE 9: ADVANCED TACTICS',
      description: 'Complex angles, multi-stone caroms, and board management.',
      pairs: [
        { term: 'CENTER GUARD', category: 'TACTIC', icon: '🛡️', desc: 'Stone placed directly on center line' },
        { term: 'PORT', category: 'TACTIC', icon: '🚪', desc: 'Narrow opening between two stationary rocks' },
        { term: 'DOUBLE TAKEOUT', category: 'SHOT', icon: '💥', desc: 'Single delivery removing two stones' },
        { term: 'WICK', category: 'SHOT', icon: '🔀', desc: 'Glancing contact that changes trajectory' },
        { term: 'COME-AROUND', category: 'SHOT', icon: '↩️', desc: 'Curling cleanly behind a guard rock' },
        { term: 'ANGLE RAISE', category: 'SHOT', icon: '📐', desc: 'Bumping a rock diagonally into rings' },
        { term: 'ROLL', category: 'SHOT', icon: '🌀', desc: 'Shooter moving sideways after contact' },
        { term: 'RUB', category: 'SHOT', icon: '🤏', desc: 'Barely touching a rock without full carom' }
      ]
    },
    {
      id: 'puzzle-10',
      title: 'PUZZLE 10: MATCH PLAY & PROTOCOL',
      description: 'Tournament procedures, measurements, and sportsmanship.',
      pairs: [
        { term: 'MEASURE', category: 'RULES', icon: '📐', desc: 'Brass gauge resolving closest stone' },
        { term: 'CONCESSION', category: 'CODE', icon: '🤝', desc: 'Honorable handshake ending match early' },
        { term: 'NO-TICK RULE', category: 'RULES', icon: '🚫', desc: 'Cannot touch center guard off line early' },
        { term: 'STANDINGS', category: 'EVENT', icon: '📊', desc: 'Tournament round-robin leaderboard' },
        { term: 'LASER GAUGE', category: 'EQUIP', icon: '🔴', desc: 'Optoelectronic hog-line sensor device' },
        { term: 'FOURTH', category: 'ROLE', icon: '🎯', desc: 'Player assigned to deliver final rocks' },
        { term: 'SPEED TRAP', category: 'PHYSICS', icon: '⏱️', desc: 'Stopwatch measure of hog-to-hog split' },
        { term: 'WARM-UP', category: 'EVENT', icon: '🔥', desc: 'Pre-game practice session per team' }
      ]
    }
  ];

  const STORAGE_KEY_RECORDS = 'hack_house_records_prod';
  const STORAGE_KEY_STATS = 'hack_house_stats_prod';
  const STORAGE_KEY_SETTINGS = 'hack_house_settings_prod';
  const STORAGE_KEY_EPOCH = 'hack_house_epoch_prod';

  let playerRecords = {};
  let playerStats = {
    currentStreak: 0,
    maxStreak: 0,
    puzzlesSolved: 0,
    totalStars: 0,
    lastDailyClearedDate: null
  };
  let playerSettings = {
    audioEnabled: true
  };

  const getOrInitEpochDate = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_EPOCH);
      if (stored) return stored;
      const today = new Date();
      const initialEpoch = formatISODate(addDays(today, -2));
      localStorage.setItem(STORAGE_KEY_EPOCH, initialEpoch);
      return initialEpoch;
    } catch {
      return formatISODate(addDays(new Date(), -2));
    }
  };

  const loadStorage = () => {
    try {
      const rec = localStorage.getItem(STORAGE_KEY_RECORDS);
      if (rec) playerRecords = JSON.parse(rec);

      const sta = localStorage.getItem(STORAGE_KEY_STATS);
      if (sta) playerStats = { ...playerStats, ...JSON.parse(sta) };

      const set = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (set) playerSettings = { ...playerSettings, ...JSON.parse(set) };
    } catch (e) {
      console.warn('Storage fallback applied.', e);
    }
  };

  const saveStorage = () => {
    try {
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(playerRecords));
      localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(playerStats));
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(playerSettings));
    } catch (e) {
      console.warn('Unable to persist storage.', e);
    }
  };

  loadStorage();

  const getCalendarPuzzles = () => {
    const epochStr = getOrInitEpochDate();
    const epochDate = parseISODate(epochStr);
    const todayStr = getSystemTodayString();
    const todayDate = parseISODate(todayStr);

    const dayDiff = Math.max(0, Math.round((todayDate - epochDate) / (1000 * 60 * 60 * 24)));

    const result = [];
    for (let i = 0; i <= dayDiff; i++) {
      const assignedDate = formatISODate(addDays(epochDate, i));
      const template = PUZZLE_SETS[i % PUZZLE_SETS.length];
      result.push({
        ...template,
        instanceId: `p-${assignedDate}`,
        assignedDate,
        isToday: assignedDate === todayStr,
        isPast: assignedDate < todayStr
      });
    }

    return result;
  };

  class AudioSynthesizer {
    constructor() {
      this.ctx = null;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    }

    playClick() {
      if (!playerSettings.audioEnabled) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1100, t);
      osc.frequency.exponentialRampToValueAtTime(280, t + 0.024);
      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.024);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.024);
    }

    playCardFlip() {
      if (!playerSettings.audioEnabled) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      const bufferSize = Math.floor(this.ctx.sampleRate * 0.06);
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1500, t);
      filter.Q.setValueAtTime(2.5, t);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.12, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(t);

      const osc = this.ctx.createOscillator();
      const toneGain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(380, t);
      osc.frequency.exponentialRampToValueAtTime(620, t + 0.05);
      toneGain.gain.setValueAtTime(0.05, t);
      toneGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      osc.connect(toneGain);
      toneGain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.05);
    }

    playMatch() {
      if (!playerSettings.audioEnabled) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(180, t);
      subOsc.frequency.exponentialRampToValueAtTime(40, t + 0.12);
      subGain.gain.setValueAtTime(0.35, t);
      subGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      subOsc.connect(subGain);
      subGain.connect(this.ctx.destination);
      subOsc.start(t);
      subOsc.stop(t + 0.12);

      [880, 1318].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.14 / (i + 1), t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.32);
      });
    }

    playMismatch() {
      if (!playerSettings.audioEnabled) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      [130, 165].forEach((freq) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.07, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.2);
      });
    }

    playVictory() {
      if (!playerSettings.audioEnabled) return;
      this.init();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      notes.forEach((freq, idx) => {
        const t = this.ctx.currentTime + (idx * 0.085);
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.45);
      });
    }
  }

  const audio = new AudioSynthesizer();

  const toastEl = document.getElementById('toast');
  let toastTimeout = null;

  const showToast = (message) => {
    if (!toastEl) return;
    clearTimeout(toastTimeout);
    toastEl.textContent = message;
    toastEl.classList.add('show');
    toastTimeout = setTimeout(() => {
      toastEl.classList.remove('show');
    }, 2200);
  };

  const screens = {
    menu: document.getElementById('screen-menu'),
    game: document.getElementById('screen-game'),
    vault: document.getElementById('screen-vault'),
    settings: document.getElementById('screen-settings')
  };

  const showScreen = (screenName) => {
    Object.keys(screens).forEach((key) => {
      if (screens[key]) {
        screens[key].classList.toggle('screen-active', key === screenName);
      }
    });
    audio.playClick();
  };

  let activePuzzle = null;
  let activeCardsData = [];
  let flippedIndices = [];
  let matchedPairsCount = 0;
  let totalMoves = 0;
  let timerInterval = null;
  let elapsedSeconds = 0;
  let isBoardLocked = false;

  const gridEl = document.getElementById('memory-grid');
  const movesEl = document.getElementById('score-moves');
  const matchesEl = document.getElementById('score-matches');
  const timerEl = document.getElementById('score-timer');
  const tickerEl = document.getElementById('game-status-message');
  const sheetTitleEl = document.getElementById('game-sheet-title');
  const modalVictory = document.getElementById('modal-victory');

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const startTimer = () => {
    clearInterval(timerInterval);
    elapsedSeconds = 0;
    timerEl.textContent = '00:00';
    timerInterval = setInterval(() => {
      elapsedSeconds++;
      timerEl.textContent = formatTimer(elapsedSeconds);
    }, 1000);
  };

  const stopTimer = () => {
    clearInterval(timerInterval);
  };

  const setupPuzzleGrid = (puzzle) => {
    activePuzzle = puzzle;
    matchedPairsCount = 0;
    totalMoves = 0;
    flippedIndices = [];
    isBoardLocked = false;

    sheetTitleEl.textContent = puzzle.title;
    movesEl.textContent = '0';
    matchesEl.textContent = '0 / 8';
    tickerEl.textContent = 'SELECT TWO CARDS TO FIND A MATCH';

    const rawCards = [];
    puzzle.pairs.slice(0, 8).forEach((pair, pairIdx) => {
      rawCards.push({
        pairId: pairIdx,
        term: pair.term,
        category: pair.category,
        icon: pair.icon,
        desc: pair.desc
      });
      rawCards.push({
        pairId: pairIdx,
        term: pair.term,
        category: pair.category,
        icon: pair.icon,
        desc: pair.desc
      });
    });

    for (let i = rawCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rawCards[i], rawCards[j]] = [rawCards[j], rawCards[i]];
    }

    activeCardsData = rawCards;

    gridEl.innerHTML = '';
    activeCardsData.forEach((card, index) => {
      const cardEl = document.createElement('div');
      cardEl.className = 'memory-card';
      cardEl.setAttribute('role', 'button');
      cardEl.setAttribute('tabindex', '0');
      cardEl.setAttribute('aria-label', `Card ${index + 1}, face down`);
      cardEl.dataset.index = index;

      cardEl.innerHTML = `
        <div class="card-flipper">
          <div class="card-face card-face-front">
            <div class="target-ring">
              <span class="stone-handle-icon" aria-hidden="true">🥌</span>
            </div>
          </div>
          <div class="card-face card-face-back">
            <span class="card-category-badge">${card.category}</span>
            <div class="card-icon-back" aria-hidden="true">${card.icon}</div>
            <div class="card-term">${card.term}</div>
            <div class="card-desc">${card.desc}</div>
          </div>
        </div>
      `;

      const selectCard = (e) => {
        if (e) e.preventDefault();
        onCardSelected(index, cardEl);
      };

      cardEl.addEventListener('click', selectCard);

      cardEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          selectCard(e);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          const next = (index + 1) % 16;
          gridEl.children[next]?.focus();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          const prev = (index - 1 + 16) % 16;
          gridEl.children[prev]?.focus();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          const down = (index + 4) % 16;
          gridEl.children[down]?.focus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const up = (index - 4 + 16) % 16;
          gridEl.children[up]?.focus();
        }
      });

      gridEl.appendChild(cardEl);
    });

    startTimer();
    showScreen('game');
  };

  const onCardSelected = (index, cardEl) => {
    if (isBoardLocked) return;
    if (flippedIndices.includes(index)) return;
    if (cardEl.classList.contains('is-flipped') || cardEl.classList.contains('is-matched')) return;

    audio.playCardFlip();
    cardEl.classList.add('is-flipped');
    cardEl.setAttribute('aria-label', `${activeCardsData[index].term}, ${activeCardsData[index].category}`);
    flippedIndices.push(index);

    if (flippedIndices.length === 1) {
      tickerEl.textContent = `SELECTED: ${activeCardsData[index].term}. SELECT A SECOND CARD.`;
    } else if (flippedIndices.length === 2) {
      totalMoves++;
      movesEl.textContent = totalMoves;
      isBoardLocked = true;

      const idx1 = flippedIndices[0];
      const idx2 = flippedIndices[1];
      const cardEl1 = gridEl.children[idx1];
      const cardEl2 = gridEl.children[idx2];

      const matchFound = activeCardsData[idx1].pairId === activeCardsData[idx2].pairId;

      if (matchFound) {
        setTimeout(() => {
          audio.playMatch();
          cardEl1.classList.add('is-matched');
          cardEl2.classList.add('is-matched');
          cardEl1.setAttribute('aria-label', `${activeCardsData[idx1].term}, matched`);
          cardEl2.setAttribute('aria-label', `${activeCardsData[idx2].term}, matched`);
          matchedPairsCount++;
          matchesEl.textContent = `${matchedPairsCount} / 8`;
          tickerEl.textContent = `MATCH FOUND: ${activeCardsData[idx1].term}!`;

          flippedIndices = [];
          isBoardLocked = false;

          if (matchedPairsCount === 8) {
            setTimeout(handleGameWin, 350);
          }
        }, 220);
      } else {
        tickerEl.textContent = 'NOT A MATCH. TRY AGAIN.';
        setTimeout(() => {
          audio.playMismatch();
          cardEl1.classList.add('is-error');
          cardEl2.classList.add('is-error');

          setTimeout(() => {
            cardEl1.classList.remove('is-flipped', 'is-error');
            cardEl2.classList.remove('is-flipped', 'is-error');
            cardEl1.setAttribute('aria-label', `Card ${idx1 + 1}, face down`);
            cardEl2.setAttribute('aria-label', `Card ${idx2 + 1}, face down`);
            flippedIndices = [];
            isBoardLocked = false;
            tickerEl.textContent = 'SELECT TWO CARDS TO FIND A MATCH';
          }, 580);
        }, 320);
      }
    }
  };

  const handleGameWin = () => {
    stopTimer();
    audio.playVictory();

    const accuracy = Math.min(100, Math.round((8 / totalMoves) * 100));
    let stars = 1;
    if (totalMoves <= 12) stars = 3;
    else if (totalMoves <= 18) stars = 2;

    const todayStr = getSystemTodayString();
    const isTodayDaily = activePuzzle.assignedDate === todayStr;

    if (isTodayDaily) {
      if (playerStats.lastDailyClearedDate) {
        if (playerStats.lastDailyClearedDate !== todayStr) {
          const lastDate = parseISODate(playerStats.lastDailyClearedDate);
          const currDate = parseISODate(todayStr);
          const dayDiff = Math.round((currDate - lastDate) / (1000 * 60 * 60 * 24));

          if (dayDiff === 1) {
            playerStats.currentStreak += 1;
          } else if (dayDiff > 1) {
            playerStats.currentStreak = 1;
          }
        }
      } else {
        playerStats.currentStreak = 1;
      }
      playerStats.maxStreak = Math.max(playerStats.maxStreak, playerStats.currentStreak);
      playerStats.lastDailyClearedDate = todayStr;
    }

    const puzzleKey = activePuzzle.instanceId || activePuzzle.id;
    const existing = playerRecords[puzzleKey] || {};
    const isFirstClear = !existing.completed;
    const bestMoves = existing.bestMoves ? Math.min(existing.bestMoves, totalMoves) : totalMoves;
    const bestTime = existing.bestTime ? Math.min(existing.bestTime, elapsedSeconds) : elapsedSeconds;
    const bestStars = existing.bestStars ? Math.max(existing.bestStars, stars) : stars;

    if (isFirstClear) {
      playerStats.puzzlesSolved += 1;
      playerStats.totalStars += stars;
    } else if (stars > (existing.bestStars || 0)) {
      playerStats.totalStars += (stars - existing.bestStars);
    }

    playerRecords[puzzleKey] = {
      completed: true,
      lastPlayedDate: todayStr,
      bestMoves,
      bestTime,
      bestStars
    };

    saveStorage();
    renderClubhouseMenu();

    document.getElementById('victory-moves').textContent = totalMoves;
    document.getElementById('victory-time').textContent = formatTimer(elapsedSeconds);
    document.getElementById('victory-accuracy').textContent = `${accuracy}%`;

    const starSpans = document.querySelectorAll('#victory-stars .star');
    starSpans.forEach((starEl, sIdx) => {
      starEl.classList.toggle('earned', sIdx < stars);
    });

    modalVictory.classList.add('is-active');
  };

  const dailyTitleEl = document.getElementById('daily-puzzle-title');
  const dailyDescEl = document.getElementById('daily-puzzle-desc');
  const dailyDateBadge = document.getElementById('daily-date-display');
  const dailyStatusBadge = document.getElementById('daily-status-badge');
  const btnPlayDaily = document.getElementById('btn-play-daily');
  const vaultCountBadge = document.getElementById('vault-count-badge');
  const vaultListEl = document.getElementById('vault-list');
  const statStreakEl = document.getElementById('stat-streak');
  const statClearedEl = document.getElementById('stat-cleared');
  const statStarsEl = document.getElementById('stat-stars');

  let currentDailyPuzzle = null;
  let activeVaultFilter = 'all';

  const renderClubhouseMenu = () => {
    statStreakEl.textContent = playerStats.currentStreak;
    statClearedEl.textContent = playerStats.puzzlesSolved;
    statStarsEl.textContent = `${playerStats.totalStars}★`;

    const allPuzzles = getCalendarPuzzles();
    currentDailyPuzzle = allPuzzles.find(p => p.isToday) || null;
    const pastPuzzles = allPuzzles.filter(p => p.isPast).reverse();

    if (currentDailyPuzzle) {
      dailyTitleEl.textContent = currentDailyPuzzle.title;
      dailyDescEl.textContent = currentDailyPuzzle.description;
      dailyDateBadge.textContent = currentDailyPuzzle.assignedDate;
      btnPlayDaily.disabled = false;

      const puzzleKey = currentDailyPuzzle.instanceId || currentDailyPuzzle.id;
      const rec = playerRecords[puzzleKey];
      if (rec && rec.completed) {
        dailyStatusBadge.className = 'status-pill pill-done';
        dailyStatusBadge.textContent = `COMPLETED ★ ${rec.bestStars}`;
        btnPlayDaily.querySelector('.btn-text').textContent = 'REPLAY PUZZLE';
      } else {
        dailyStatusBadge.className = 'status-pill pill-ready';
        dailyStatusBadge.textContent = 'READY TO PLAY';
        btnPlayDaily.querySelector('.btn-text').textContent = 'PLAY DAILY PUZZLE';
      }
    } else {
      dailyTitleEl.textContent = 'DAILY PUZZLE';
      dailyDescEl.textContent = 'Next puzzle will unlock at midnight.';
      dailyDateBadge.textContent = getSystemTodayString();
      dailyStatusBadge.className = 'status-pill';
      dailyStatusBadge.textContent = 'LOCKED';
      btnPlayDaily.disabled = true;
    }

    vaultCountBadge.textContent = pastPuzzles.length;
    renderVaultScreen(pastPuzzles);
  };

  const renderVaultScreen = (pastPuzzles) => {
    vaultListEl.innerHTML = '';

    if (pastPuzzles.length === 0) {
      const emptyCard = document.createElement('div');
      emptyCard.className = 'empty-vault-card';
      emptyCard.innerHTML = `
        <h3>ARCHIVE IS EMPTY</h3>
        <p>Past daily puzzles will be filed here automatically each day at midnight.</p>
      `;
      vaultListEl.appendChild(emptyCard);
      return;
    }

    const filteredPuzzles = pastPuzzles.filter(puzzle => {
      const puzzleKey = puzzle.instanceId || puzzle.id;
      const rec = playerRecords[puzzleKey];
      const isCleared = rec && rec.completed;
      if (activeVaultFilter === 'cleared') return isCleared;
      if (activeVaultFilter === 'unplayed') return !isCleared;
      return true;
    });

    if (filteredPuzzles.length === 0) {
      const emptyFilterCard = document.createElement('div');
      emptyFilterCard.className = 'empty-vault-card';
      emptyFilterCard.innerHTML = `<h3>NO PUZZLES IN THIS CATEGORY</h3><p>Try switching to another tab above.</p>`;
      vaultListEl.appendChild(emptyFilterCard);
      return;
    }

    filteredPuzzles.forEach(puzzle => {
      const puzzleKey = puzzle.instanceId || puzzle.id;
      const rec = playerRecords[puzzleKey];
      const isCompleted = rec && rec.completed;

      const card = document.createElement('div');
      card.className = 'vault-item-card';
      card.innerHTML = `
        <div class="vault-card-header">
          <span class="vault-date">${puzzle.assignedDate}</span>
          <span class="status-pill ${isCompleted ? 'pill-done' : 'pill-ready'}">
            ${isCompleted ? `COMPLETED ★ ${rec.bestStars}` : 'UNPLAYED'}
          </span>
        </div>
        <h3 class="vault-item-title">${puzzle.title}</h3>
        <p class="vault-item-desc">${puzzle.description}</p>
        <div class="vault-meta-row">
          <span class="vault-badge">${isCompleted ? `BEST: ${rec.bestMoves} MOVES • ${formatTimer(rec.bestTime)}` : '8 CARD PAIRS'}</span>
          <button class="neo-btn neo-btn-sm neo-btn-vault btn-play-vault" data-id="${puzzleKey}">
            ${isCompleted ? 'REPLAY' : 'PLAY'}
          </button>
        </div>
      `;

      const playBtn = card.querySelector('.btn-play-vault');
      playBtn.addEventListener('click', () => {
        setupPuzzleGrid(puzzle);
        audio.playClick();
      });

      vaultListEl.appendChild(card);
    });
  };

  btnPlayDaily.addEventListener('click', () => {
    if (currentDailyPuzzle) {
      setupPuzzleGrid(currentDailyPuzzle);
      audio.playClick();
    }
  });

  document.getElementById('btn-open-vault').addEventListener('click', () => showScreen('vault'));
  document.getElementById('btn-open-settings').addEventListener('click', () => showScreen('settings'));
  document.getElementById('btn-game-back').addEventListener('click', () => {
    stopTimer();
    showScreen('menu');
  });
  document.getElementById('btn-vault-back').addEventListener('click', () => showScreen('menu'));
  document.getElementById('btn-settings-back').addEventListener('click', () => showScreen('menu'));

  const modalRules = document.getElementById('modal-rules');
  const openRules = () => {
    modalRules.classList.add('is-active');
    audio.playClick();
  };
  const closeRules = () => {
    modalRules.classList.remove('is-active');
    audio.playClick();
  };

  document.getElementById('btn-open-rules').addEventListener('click', openRules);
  document.getElementById('btn-settings-open-rules').addEventListener('click', openRules);
  document.getElementById('btn-close-rules').addEventListener('click', closeRules);
  document.getElementById('btn-rules-got-it').addEventListener('click', closeRules);

  modalRules.addEventListener('click', (e) => {
    if (e.target === modalRules) closeRules();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (modalRules.classList.contains('is-active')) closeRules();
    }
  });

  document.getElementById('btn-victory-continue').addEventListener('click', () => {
    modalVictory.classList.remove('is-active');
    showScreen('menu');
  });

  const copyToClipboard = (text) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('Result copied to clipboard!');
      }).catch(() => {
        showToast('Score recorded!');
      });
    } else {
      showToast('Score recorded!');
    }
  };

  document.getElementById('btn-share-result').addEventListener('click', () => {
    const accuracy = Math.min(100, Math.round((8 / totalMoves) * 100));
    const starCount = totalMoves <= 12 ? '⭐⭐⭐' : totalMoves <= 18 ? '⭐⭐' : '⭐';
    const text = `🥌 HACK & HOUSE // ${activePuzzle.title}\n` +
                 `Moves: ${totalMoves} | Time: ${formatTimer(elapsedSeconds)} | Accuracy: ${accuracy}%\n` +
                 `Rating: ${starCount}\n` +
                 `Daily Curling Concentration`;

    if (navigator.share) {
      navigator.share({
        title: `HACK & HOUSE // ${activePuzzle.title}`,
        text: text
      }).then(() => {
        showToast('Shared successfully!');
      }).catch((err) => {
        if (err.name !== 'AbortError') {
          copyToClipboard(text);
        }
      });
    } else {
      copyToClipboard(text);
    }
    audio.playClick();
  });

  const vaultTabs = document.querySelectorAll('.vault-tab-btn');
  vaultTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      vaultTabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      activeVaultFilter = tab.dataset.filter;
      const pastPuzzles = getCalendarPuzzles().filter(p => p.isPast).reverse();
      renderVaultScreen(pastPuzzles);
      audio.playClick();
    });
  });

  const toggleSoundBtn = document.getElementById('btn-toggle-sound');
  const hudAudioIcon = document.getElementById('hud-audio-icon');

  const updateAudioUI = () => {
    if (playerSettings.audioEnabled) {
      toggleSoundBtn.textContent = 'ENABLED';
      toggleSoundBtn.classList.remove('neo-btn-danger');
      toggleSoundBtn.classList.add('btn-toggle-active');
      hudAudioIcon.textContent = '🔊';
    } else {
      toggleSoundBtn.textContent = 'MUTED';
      toggleSoundBtn.classList.add('neo-btn-danger');
      toggleSoundBtn.classList.remove('btn-toggle-active');
      hudAudioIcon.textContent = '🔇';
    }
  };

  const handleAudioToggle = () => {
    playerSettings.audioEnabled = !playerSettings.audioEnabled;
    saveStorage();
    updateAudioUI();
    if (playerSettings.audioEnabled) audio.playClick();
    showToast(playerSettings.audioEnabled ? 'Sound effects enabled' : 'Sound effects muted');
  };

  toggleSoundBtn.addEventListener('click', handleAudioToggle);
  document.getElementById('btn-toggle-audio-hud').addEventListener('click', handleAudioToggle);

  document.getElementById('btn-wipe-data').addEventListener('click', () => {
    if (window.confirm('Reset all saved puzzle scores, streak records, and star totals? This cannot be undone.')) {
      playerRecords = {};
      playerStats = {
        currentStreak: 0,
        maxStreak: 0,
        puzzlesSolved: 0,
        totalStars: 0,
        lastDailyClearedDate: null
      };
      saveStorage();
      renderClubhouseMenu();
      audio.playClick();
      showToast('All player records have been reset');
    }
  });

  const unlockAudio = () => {
    audio.init();
    window.removeEventListener('touchstart', unlockAudio);
    window.removeEventListener('click', unlockAudio);
  };
  window.addEventListener('touchstart', unlockAudio, { passive: true });
  window.addEventListener('click', unlockAudio, { passive: true });

  updateAudioUI();
  renderClubhouseMenu();

})();