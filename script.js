/**
 * Memory Match — Canadian Championship Curling Edition
 * Advanced Light Neo-Brutalist Sports Architecture & Presentation System
 * Follows Universal Game Design, UX & Engineering Bible
 */

(function () {
  'use strict';

  // Application-level configuration
  const CONFIG = {
    csvPath: './puzzles.csv',
    storageKey: 'memory_match_vault_v1',
    // Universal placeholder URL for project owner
    homeUrl: 'https://tileworksgamesstudio.github.io/Curling-Menu/'
  };

  const state = {
    puzzles: [],
    todayDate: '',
    todayPuzzle: null,
    activePuzzle: null,
    boardCards: [],
    flippedIndices: [],
    matchedCardCount: 0,
    turns: 0,
    isLocked: false,
    activeSession: null, // For in-progress recovery
    stats: {
      played: 0,
      completed: 0,
      currentStreak: 0,
      bestStreak: 0,
      bestTurns: null,
      turnHistory: [],
      history: {} // date -> { turns, accuracy }
    }
  };

  // ==========================================================================
  // SAFE LOCAL STORAGE (DEFENSIVE PERSISTENCE)
  // ==========================================================================
  function loadPersistence() {
    try {
      const raw = localStorage.getItem(CONFIG.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          if (parsed.stats) state.stats = { ...state.stats, ...parsed.stats };
          if (parsed.activeSession) state.activeSession = parsed.activeSession;
        }
      }
    } catch (err) {
      console.warn('Unable to read local storage safely, using defaults.', err);
    }
  }

  function savePersistence() {
    try {
      const payload = {
        stats: state.stats,
        activeSession: state.activeSession
      };
      localStorage.setItem(CONFIG.storageKey, JSON.stringify(payload));
    } catch (err) {
      console.warn('Unable to persist game progress.', err);
    }
  }

  // ==========================================================================
  // DETERMINISTIC SEED SHUFFLE
  // ==========================================================================
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

  function getTodayDateString() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // ==========================================================================
  // CSV PARSING & DATA VALIDATION
  // ==========================================================================
  function parseCSV(text) {
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
      rows.push(curRow);
    }
    return rows;
  }

  function mapAndValidateRecords(rows) {
    if (rows.length < 2) return [];
    const headers = rows[0].map(h => h.trim().toLowerCase());
    return rows.slice(1).map(row => {
      const record = {};
      headers.forEach((h, i) => {
        record[h] = row[i] ? row[i].trim() : '';
      });
      const items = [];
      for (let i = 1; i <= 8; i++) {
        const itemVal = record[`item_${i}`] || record[`item${i}`] || `Item ${i}`;
        items.push(itemVal);
      }
      return {
        date: record.date || '',
        title: record.title || 'Untitled Memory Puzzle',
        items
      };
    }).filter(p => p.date && /^\d{4}-\d{2}-\d{2}$/.test(p.date));
  }

  async function loadPuzzles() {
    state.todayDate = getTodayDateString();
    const res = await fetch(CONFIG.csvPath, { cache: 'no-store' });
    if (!res.ok) throw new Error('Data file unreachable');
    const text = await res.text();
    const rows = parseCSV(text);
    const parsed = mapAndValidateRecords(rows);

    if (!parsed.length) throw new Error('No valid puzzle records found');

    // Chronological sort
    parsed.sort((a, b) => a.date.localeCompare(b.date));
    state.puzzles = parsed;

    // Daily puzzle: exact date match, fallback to latest past date, or first available
    const exact = parsed.find(p => p.date === state.todayDate);
    if (exact) {
      state.todayPuzzle = exact;
    } else {
      const pastOrToday = parsed.filter(p => p.date <= state.todayDate);
      state.todayPuzzle = pastOrToday.length
        ? pastOrToday[pastOrToday.length - 1]
        : parsed[0];
    }
  }

  // ==========================================================================
  // NAVIGATION & VIEW HIERARCHY
  // ==========================================================================
  function showMainView(viewName) {
    soundSystem.playNavigation();

    // Show main header, hide gameplay header
    document.getElementById('main-header').classList.remove('hidden');
    document.getElementById('gameplay-header').classList.add('hidden');

    // Update active state on navigation tabs
    const navDaily = document.getElementById('nav-daily');
    const navVault = document.getElementById('nav-vault');

    navDaily.classList.toggle('active', viewName === 'daily');
    navVault.classList.toggle('active', viewName === 'vault');

    // Switch views
    document.querySelectorAll('.app-main .view').forEach(v => v.classList.add('hidden'));

    if (viewName === 'daily') {
      renderDailyView();
      document.getElementById('view-daily').classList.remove('hidden');
    } else if (viewName === 'vault') {
      renderVaultView();
      document.getElementById('view-vault').classList.remove('hidden');
    }
  }

  function showGameplayView() {
    soundSystem.playNavigation();

    // Show dedicated gameplay header with puzzle title & back button
    document.getElementById('main-header').classList.add('hidden');
    document.getElementById('gameplay-header').classList.remove('hidden');

    document.querySelectorAll('.app-main .view').forEach(v => v.classList.add('hidden'));
    document.getElementById('view-game').classList.remove('hidden');
  }

  function showToast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.add('hidden'), 2200);
  }

  // ==========================================================================
  // DAILY VIEW RENDER
  // ==========================================================================
  function renderDailyView() {
    const p = state.todayPuzzle;
    if (!p) return;

    document.getElementById('daily-date').textContent = p.date;
    document.getElementById('daily-title').textContent = p.title;

    const completed = state.stats.history[p.date];
    const statusDesc = document.getElementById('daily-status');
    const playBtn = document.getElementById('btn-play-daily');

    if (completed) {
      statusDesc.textContent = `Completed in ${completed.turns} deliveries (${completed.accuracy} ice accuracy)`;
      playBtn.textContent = 'Replay Daily Puzzle';
    } else if (state.activeSession && state.activeSession.date === p.date) {
      statusDesc.textContent = `End In Progress (${state.activeSession.matchedCardCount / 2} / 8 pairs in the house)`;
      playBtn.textContent = 'Resume Daily Puzzle';
    } else {
      statusDesc.textContent = 'Sheet prepared & ready for delivery';
      playBtn.textContent = 'Play Daily Puzzle';
    }

    // Quick stats update
    const s = state.stats;
    document.getElementById('quick-streak').textContent = s.currentStreak;
    document.getElementById('quick-completed').textContent = s.completed;
    document.getElementById('quick-best-turns').textContent = s.bestTurns !== null ? s.bestTurns : '—';
  }

  // ==========================================================================
  // VAULT VIEW RENDER (Historical Archive Only)
  // ==========================================================================
  function renderVaultView() {
    const container = document.getElementById('vault-list');
    container.innerHTML = '';

    // Filter out future puzzles AND exclude the current Daily Puzzle
    const archivePuzzles = state.puzzles.filter(
      p => p.date <= state.todayDate && p.date !== state.todayPuzzle.date
    );

    // Sort descending by release date
    archivePuzzles.sort((a, b) => b.date.localeCompare(a.date));

    if (!archivePuzzles.length) {
      container.innerHTML = '<div class="card status-card ice-panel-surface"><p class="status-text">No previous tournaments recorded in the archive yet.</p></div>';
      return;
    }

    archivePuzzles.forEach(p => {
      const item = document.createElement('div');
      item.className = 'vault-item';

      const done = state.stats.history[p.date];
      const badgeText = done
        ? `Solved: ${done.turns} turns`
        : 'Unplayed';

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

      item.querySelector('button').onclick = () => {
        soundSystem.playTap();
        loadPuzzle(p);
      };

      container.appendChild(item);
    });
  }

  // ==========================================================================
  // GAMEPLAY ENGINE
  // ==========================================================================
  function loadPuzzle(puzzle) {
    state.activePuzzle = puzzle;
    state.flippedIndices = [];
    state.isLocked = false;

    // Set Dedicated Gameplay Header title
    document.getElementById('gameplay-title').textContent = puzzle.title;

    // Generate 16 deterministic cards
    const raw = [];
    puzzle.items.forEach((label, id) => {
      raw.push({ id, name: label });
      raw.push({ id, name: label });
    });

    const seedVal = parseInt(puzzle.date.replace(/-/g, ''), 10) || 4242;
    state.boardCards = shuffle(raw, seedVal);

    // Check for in-progress session recovery
    const isResuming = state.activeSession && state.activeSession.date === puzzle.date;
    if (isResuming) {
      state.turns = state.activeSession.turns || 0;
      state.matchedCardCount = state.activeSession.matchedCardCount || 0;
    } else {
      state.turns = 0;
      state.matchedCardCount = 0;
      state.activeSession = {
        date: puzzle.date,
        turns: 0,
        matchedCardCount: 0,
        matchedIds: []
      };
      savePersistence();
    }

    document.getElementById('stat-turns').textContent = state.turns;
    document.getElementById('stat-pairs').textContent = `${state.matchedCardCount / 2} / 8`;
    document.getElementById('game-feedback').textContent = 'Deliver stones and pair up matching labels to clear the house.';

    const board = document.getElementById('game-board');
    board.innerHTML = '';

    state.boardCards.forEach((card, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'card-tile face-down';
      btn.dataset.index = index;
      btn.textContent = '🥌';
      btn.setAttribute('aria-label', `Curling Stone ${index + 1}`);

      // Re-apply matched state if resuming
      if (isResuming && state.activeSession.matchedIds.includes(card.id)) {
        btn.classList.remove('face-down');
        btn.classList.add('matched');
        btn.textContent = card.name;
        btn.setAttribute('aria-disabled', 'true');
      }

      btn.onclick = () => handleCardInteraction(index);
      board.appendChild(btn);
    });

    showGameplayView();
  }

  function handleCardInteraction(index) {
    if (state.isLocked) return;
    if (state.flippedIndices.includes(index)) return;

    const board = document.getElementById('game-board');
    const btn = board.children[index];
    if (btn.classList.contains('matched')) return;

    // Audio & tactile response
    soundSystem.playTap();

    // Flip card up
    state.flippedIndices.push(index);
    btn.classList.remove('face-down');
    btn.classList.add('flipped');
    btn.textContent = state.boardCards[index].name;

    if (state.flippedIndices.length === 2) {
      state.turns++;
      document.getElementById('stat-turns').textContent = state.turns;
      evaluateCardPair();
    }
  }

  function evaluateCardPair() {
    const [idx1, idx2] = state.flippedIndices;
    const card1 = state.boardCards[idx1];
    const card2 = state.boardCards[idx2];
    const board = document.getElementById('game-board');
    const btn1 = board.children[idx1];
    const btn2 = board.children[idx2];

    if (card1.id === card2.id) {
      // Correct match
      soundSystem.playMatch();

      btn1.classList.remove('flipped');
      btn2.classList.remove('flipped');
      btn1.classList.add('matched');
      btn2.classList.add('matched');
      btn1.setAttribute('aria-disabled', 'true');
      btn2.setAttribute('aria-disabled', 'true');

      state.matchedCardCount += 2;
      state.flippedIndices = [];
      const pairsFound = state.matchedCardCount / 2;
      document.getElementById('stat-pairs').textContent = `${pairsFound} / 8`;
      document.getElementById('game-feedback').textContent = `In the house: ${card1.name}!`;

      // Update active session progress
      if (state.activeSession && state.activeSession.date === state.activePuzzle.date) {
        state.activeSession.turns = state.turns;
        state.activeSession.matchedCardCount = state.matchedCardCount;
        if (!state.activeSession.matchedIds.includes(card1.id)) {
          state.activeSession.matchedIds.push(card1.id);
        }
        savePersistence();
      }

      if (state.matchedCardCount === 16) {
        setTimeout(handlePuzzleCompletion, 360);
      }
    } else {
      // Mismatch
      soundSystem.playMismatch();
      state.isLocked = true;
      document.getElementById('game-feedback').textContent = 'Heavy delivery. Stones mismatch.';
      setTimeout(() => {
        btn1.classList.remove('flipped');
        btn2.classList.remove('flipped');
        btn1.classList.add('face-down');
        btn2.classList.add('face-down');
        btn1.textContent = '🥌';
        btn2.textContent = '🥌';
        state.flippedIndices = [];
        state.isLocked = false;
      }, 750);
    }
  }

  function handlePuzzleCompletion() {
    soundSystem.playCompletion();

    const turns = state.turns;
    const accuracy = `${Math.max(0, Math.round((8 / turns) * 100))}%`;
    const dateKey = state.activePuzzle.date;
    const s = state.stats;

    // Clear active temporary session once cleared
    state.activeSession = null;

    if (!s.history[dateKey]) {
      s.played++;
      s.completed++;
      s.currentStreak++;
      if (s.currentStreak > s.bestStreak) s.bestStreak = s.currentStreak;
      if (s.bestTurns === null || turns < s.bestTurns) s.bestTurns = turns;
      s.turnHistory.push(turns);
      s.history[dateKey] = { turns, accuracy };
    }
    savePersistence();

    document.getElementById('complete-turns').textContent = turns;
    document.getElementById('complete-accuracy').textContent = accuracy;

    const list = document.getElementById('complete-items-list');
    list.innerHTML = '';
    state.activePuzzle.items.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      list.appendChild(li);
    });

    openModal('modal-complete');
  }

  // ==========================================================================
  // MODALS & DIALOGS
  // ==========================================================================
  function openModal(modalId) {
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    const target = document.getElementById(modalId);
    if (target) {
      target.classList.remove('hidden');
      document.getElementById('modal-overlay').classList.remove('hidden');
    }
  }

  function closeAllModals() {
    soundSystem.playNavigation();
    document.querySelectorAll('.modal, .modal-overlay').forEach(el => el.classList.add('hidden'));
  }

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
  }

  function shareResult() {
    soundSystem.playTap();
    const turns = state.turns;
    const acc = Math.max(0, Math.round((8 / turns) * 100));
    const text = `Memory Match — Canadian Curling Edition\n${state.activePuzzle.title}\nDate: ${state.activePuzzle.date}\nCompleted in ${turns} deliveries (${acc}% accuracy)`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('Tournament scorecard copied to clipboard');
      }).catch(() => {
        showToast('Unable to copy scorecard');
      });
    } else {
      showToast('Scorecard sharing not supported on this browser');
    }
  }

  // ==========================================================================
  // AMBIENT CURLING ICONS & CANADIAN MAPLE LEAF SYSTEM
  // EXACTLY 12 CURLING ICONS + AUTHORITATIVE MAPLE LEAF (Section 65.6)
  // ==========================================================================
  const CURLING_ICON_TEMPLATES = [
    // 1. Curling Stone
    `<svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="18" fill="var(--c-curling-dark)" opacity="0.14"/><circle cx="24" cy="24" r="14" stroke="var(--c-canadian-red)" stroke-width="2.5"/><path d="M18 20h12v4a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3z" fill="var(--c-curling-dark)"/></svg>`,
    // 2. Curling House / Rings
    `<svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="20" stroke="var(--c-curling-navy)" stroke-width="2" opacity="0.25"/><circle cx="24" cy="24" r="13" stroke="var(--c-canadian-red)" stroke-width="2" opacity="0.3"/><circle cx="24" cy="24" r="5" fill="var(--c-stone-yellow)" opacity="0.4"/></svg>`,
    // 3. Curling Broom
    `<svg viewBox="0 0 48 48" fill="none"><line x1="10" y1="38" x2="34" y2="12" stroke="var(--c-curling-dark)" stroke-width="2.5"/><rect x="30" y="8" width="12" height="6" rx="2" transform="rotate(45 30 8)" fill="var(--c-canadian-red)"/></svg>`,
    // 4. Brush Head
    `<svg viewBox="0 0 48 48" fill="none"><rect x="10" y="18" width="28" height="12" rx="3" fill="var(--c-stone-yellow)" stroke="var(--c-curling-dark)" stroke-width="2"/><line x1="16" y1="18" x2="16" y2="30" stroke="var(--c-curling-dark)" stroke-width="1.5"/><line x1="24" y1="18" x2="24" y2="30" stroke="var(--c-curling-dark)" stroke-width="1.5"/><line x1="32" y1="18" x2="32" y2="30" stroke="var(--c-curling-dark)" stroke-width="1.5"/></svg>`,
    // 5. Hack
    `<svg viewBox="0 0 48 48" fill="none"><rect x="14" y="14" width="20" height="20" rx="3" stroke="var(--c-curling-dark)" stroke-width="2.5"/><line x1="14" y1="24" x2="34" y2="24" stroke="var(--c-canadian-red)" stroke-width="2"/><line x1="20" y1="14" x2="20" y2="34" stroke="var(--c-curling-dark)" stroke-width="1.5"/><line x1="28" y1="14" x2="28" y2="34" stroke="var(--c-curling-dark)" stroke-width="1.5"/></svg>`,
    // 6. Stone Handle
    `<svg viewBox="0 0 48 48" fill="none"><path d="M12 28h24v-6a6 6 0 0 0-6-6H18a6 6 0 0 0-6 6z" stroke="var(--c-curling-dark)" stroke-width="2.5"/><rect x="20" y="12" width="8" height="4" rx="1.5" fill="var(--c-canadian-red)"/></svg>`,
    // 7. Hog Line
    `<svg viewBox="0 0 48 48" fill="none"><line x1="4" y1="24" x2="44" y2="24" stroke="var(--c-canadian-red)" stroke-width="4"/><line x1="4" y1="20" x2="44" y2="20" stroke="var(--c-curling-dark)" stroke-width="1" opacity="0.3"/><line x1="4" y1="28" x2="44" y2="28" stroke="var(--c-curling-dark)" stroke-width="1" opacity="0.3"/></svg>`,
    // 8. Back Line
    `<svg viewBox="0 0 48 48" fill="none"><line x1="4" y1="24" x2="44" y2="24" stroke="var(--c-curling-navy)" stroke-width="2.5"/><circle cx="24" cy="24" r="5" stroke="var(--c-canadian-red)" stroke-width="2"/></svg>`,
    // 9. Centre Line
    `<svg viewBox="0 0 48 48" fill="none"><line x1="24" y1="4" x2="24" y2="44" stroke="var(--c-curling-navy)" stroke-width="2.5"/><polygon points="24,12 20,18 28,18" fill="var(--c-canadian-red)"/><polygon points="24,36 20,30 28,30" fill="var(--c-canadian-red)"/></svg>`,
    // 10. Curling Pebble Ice Texture
    `<svg viewBox="0 0 48 48" fill="none"><circle cx="16" cy="16" r="3.5" fill="var(--c-canadian-red)" opacity="0.4"/><circle cx="32" cy="18" r="4.5" fill="var(--c-stone-yellow)" opacity="0.4"/><circle cx="22" cy="32" r="3" fill="var(--c-curling-mid-blue)" opacity="0.35"/><circle cx="34" cy="34" r="2.5" fill="var(--c-curling-dark)" opacity="0.3"/></svg>`,
    // 11. Scoreboard / End Marker
    `<svg viewBox="0 0 48 48" fill="none"><rect x="10" y="10" width="28" height="28" rx="2" stroke="var(--c-curling-dark)" stroke-width="2"/><line x1="10" y1="24" x2="38" y2="24" stroke="var(--c-curling-dark)" stroke-width="1.5"/><line x1="24" y1="10" x2="24" y2="38" stroke="var(--c-curling-dark)" stroke-width="1.5"/><circle cx="17" cy="17" r="2.5" fill="var(--c-canadian-red)"/></svg>`,
    // 12. Skip / Delivery Silhouette
    `<svg viewBox="0 0 48 48" fill="none"><circle cx="16" cy="16" r="4" fill="var(--c-curling-dark)"/><path d="M12 28l8-4 8 8 10-2" stroke="var(--c-curling-dark)" stroke-width="2.5" stroke-linecap="round"/><line x1="16" y1="22" x2="36" y2="36" stroke="var(--c-canadian-red)" stroke-width="2"/></svg>`,
    // 13. AUTHORITATIVE CANADIAN MAPLE LEAF (Section 65.6 - exact geometry preserved)
    `<svg viewBox="0 0 298.72 341.12" fill="none" aria-hidden="true" focusable="false"><g transform="translate(-250.85 -233.44)"><path d="m325.8 480.69 8.1527-20.11-65.765-60.873 17.392-9.2397-7.6092-44.568 39.676 4.3481 11.957-16.849 30.98 39.133-17.392-84.788 26.089 8.6962 25.001-45.655 23.371 44.568 27.719-7.6092-17.936 84.244 30.98-38.046 10.87 16.305 39.133-3.8046-5.9786 42.937 17.936 11.414-65.765 60.33 7.0656 21.197-58.699-9.7832 1.6305 72.83h-22.284l3.2611-73.374z" fill="var(--c-canadian-red)"/></g></svg>`
  ];

  function initAmbientCurlingField() {
    const container = document.getElementById('curling-icons-field');
    if (!container) return;

    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const maxItems = window.innerWidth < 480 ? 12 : 20;
    const activeElements = [];

    function spawnIcon() {
      if (activeElements.length >= maxItems) return;

      const el = document.createElement('div');
      el.className = 'ambient-curling-elem';

      // 3 perceived depth levels
      const depthSeed = Math.random();
      let depthClass = 'depth-middle';
      let size = 32;
      let duration = 22;
      let opacity = 0.28;

      if (depthSeed < 0.4) {
        depthClass = 'depth-distant';
        size = 20 + Math.random() * 8;
        duration = 30 + Math.random() * 15;
        opacity = 0.14 + Math.random() * 0.08;
      } else if (depthSeed > 0.8) {
        depthClass = 'depth-near';
        size = 38 + Math.random() * 14;
        duration = 16 + Math.random() * 8;
        opacity = 0.35 + Math.random() * 0.15;
      }

      el.classList.add(depthClass);
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;

      // Select random icon template
      const templateIndex = Math.floor(Math.random() * CURLING_ICON_TEMPLATES.length);
      el.innerHTML = CURLING_ICON_TEMPLATES[templateIndex];

      const startX = Math.random() * (window.innerWidth - size);
      const driftX = (Math.random() - 0.5) * 80;
      const startRot = Math.random() * 360;
      const endRot = startRot + (Math.random() > 0.5 ? 90 : -90);

      el.style.left = `${startX}px`;
      el.style.top = `${window.innerHeight + size}px`;
      el.style.opacity = `${opacity}`;

      container.appendChild(el);
      activeElements.push(el);

      const startTime = performance.now();
      const totalDistance = window.innerHeight + size * 2;

      function animateStep(currentTime) {
        const elapsed = (currentTime - startTime) / 1000;
        const progress = elapsed / duration;

        if (progress >= 1 || !el.isConnected) {
          el.remove();
          const idx = activeElements.indexOf(el);
          if (idx !== -1) activeElements.splice(idx, 1);
          return;
        }

        const currentY = (window.innerHeight + size) - progress * totalDistance;
        const currentX = startX + Math.sin(progress * Math.PI * 2) * driftX;
        const currentRot = startRot + (endRot - startRot) * progress;

        el.style.transform = `translate3d(${currentX - startX}px, ${currentY - (window.innerHeight + size)}px, 0) rotate(${currentRot}deg)`;
        requestAnimationFrame(animateStep);
      }

      requestAnimationFrame(animateStep);
    }

    // Initial staggered population
    for (let i = 0; i < maxItems / 2; i++) {
      setTimeout(spawnIcon, i * 600);
    }

    // Continuous randomized spawner
    setInterval(() => {
      if (document.visibilityState === 'visible') {
        spawnIcon();
      }
    }, 1800);
  }

  // ==========================================================================
  // DISCIPLINED LUXURY WEB AUDIO SYNTHESIS SYSTEM
  // Safe user-gesture activation, subtle, muted curling sounds
  // ==========================================================================
  const soundSystem = (function () {
    let ctx = null;

    function getContext() {
      if (!ctx && (window.AudioContext || window.webkitAudioContext)) {
        try {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          ctx = new AudioCtx();
        } catch (_) {
          ctx = null;
        }
      }
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      return ctx;
    }

    function playTap() {
      try {
        const audio = getContext();
        if (!audio) return;
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, audio.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, audio.currentTime + 0.05);

        gain.gain.setValueAtTime(0.08, audio.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.05);

        osc.connect(gain);
        gain.connect(audio.destination);

        osc.start();
        osc.stop(audio.currentTime + 0.05);
      } catch (_) {}
    }

    function playNavigation() {
      try {
        const audio = getContext();
        if (!audio) return;
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, audio.currentTime);
        osc.frequency.exponentialRampToValueAtTime(260, audio.currentTime + 0.06);

        gain.gain.setValueAtTime(0.04, audio.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.06);

        osc.connect(gain);
        gain.connect(audio.destination);

        osc.start();
        osc.stop(audio.currentTime + 0.06);
      } catch (_) {}
    }

    function playMatch() {
      try {
        const audio = getContext();
        if (!audio) return;
        // Two-tone harmonic chime
        [523.25, 659.25].forEach((freq, i) => {
          const osc = audio.createOscillator();
          const gain = audio.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, audio.currentTime + i * 0.07);

          gain.gain.setValueAtTime(0.06, audio.currentTime + i * 0.07);
          gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + i * 0.07 + 0.18);

          osc.connect(gain);
          gain.connect(audio.destination);

          osc.start(audio.currentTime + i * 0.07);
          osc.stop(audio.currentTime + i * 0.07 + 0.18);
        });
      } catch (_) {}
    }

    function playMismatch() {
      try {
        const audio = getContext();
        if (!audio) return;
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(110, audio.currentTime);
        osc.frequency.linearRampToValueAtTime(80, audio.currentTime + 0.1);

        gain.gain.setValueAtTime(0.04, audio.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(audio.destination);

        osc.start();
        osc.stop(audio.currentTime + 0.1);
      } catch (_) {}
    }

    function playCompletion() {
      try {
        const audio = getContext();
        if (!audio) return;
        // 3-note victory cue
        [523.25, 659.25, 783.99].forEach((freq, idx) => {
          const osc = audio.createOscillator();
          const gain = audio.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, audio.currentTime + idx * 0.1);

          gain.gain.setValueAtTime(0.08, audio.currentTime + idx * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + idx * 0.1 + 0.35);

          osc.connect(gain);
          gain.connect(audio.destination);

          osc.start(audio.currentTime + idx * 0.1);
          osc.stop(audio.currentTime + idx * 0.1 + 0.35);
        });
      } catch (_) {}
    }

    return {
      playTap,
      playNavigation,
      playMatch,
      playMismatch,
      playCompletion
    };
  })();

  // ==========================================================================
  // EVENT ATTACHMENTS
  // ==========================================================================
  function setupEvents() {
    // Prime AudioContext safely upon genuine interaction
    window.addEventListener('pointerdown', () => soundSystem.playTap(), { once: true });

    // Navigation Order: Daily Puzzle -> Vault -> Home
    document.getElementById('nav-daily').onclick = () => showMainView('daily');
    document.getElementById('nav-vault').onclick = () => showMainView('vault');

    // Home link setup with clearly identifiable placeholder
    const homeLink = document.getElementById('nav-home');
    homeLink.href = CONFIG.homeUrl;

    // Daily Play
    document.getElementById('btn-play-daily').onclick = () => {
      soundSystem.playTap();
      loadPuzzle(state.todayPuzzle);
    };

    // Gameplay Dedicated Header: Back button returns to Game Menu
    document.getElementById('btn-game-back').onclick = () => {
      showMainView('daily');
    };

    // Reset button on gameplay screen
    document.getElementById('btn-reset-board').onclick = () => {
      soundSystem.playTap();
      if (confirm('Reset current tournament progress on this sheet?')) {
        state.activeSession = null;
        savePersistence();
        loadPuzzle(state.activePuzzle);
      }
    };

    // Stats and Rules modal triggers
    document.getElementById('btn-help-toggle').onclick = () => {
      soundSystem.playNavigation();
      openModal('modal-rules');
    };
    document.getElementById('btn-open-stats-modal').onclick = () => {
      soundSystem.playNavigation();
      renderStatsModal();
      openModal('modal-stats');
    };

    // Completion modal actions
    document.getElementById('btn-complete-share').onclick = shareResult;
    document.getElementById('btn-complete-vault').onclick = () => {
      closeAllModals();
      showMainView('vault');
    };
    document.getElementById('btn-complete-menu').onclick = () => {
      closeAllModals();
      showMainView('daily');
    };

    // Modal dismissals
    document.getElementById('modal-overlay').onclick = closeAllModals;
    document.querySelectorAll('.btn-close').forEach(b => {
      b.onclick = closeAllModals;
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeAllModals();
    });
  }

  // ==========================================================================
  // INITIALIZATION PASS
  // ==========================================================================
  async function init() {
    loadPersistence();
    setupEvents();
    initAmbientCurlingField();

    try {
      await loadPuzzles();
      showMainView('daily');
    } catch (err) {
      console.error('Initialization error:', err);
      const msgEl = document.getElementById('status-message');
      msgEl.textContent = 'Unable to load tournament puzzle records. Please verify connection.';
      const retryBtn = document.getElementById('btn-retry');
      retryBtn.classList.remove('hidden');
      retryBtn.onclick = () => {
        retryBtn.classList.add('hidden');
        msgEl.textContent = 'Loading puzzles...';
        init();
      };
      document.querySelectorAll('.app-main .view').forEach(v => v.classList.add('hidden'));
      document.getElementById('view-status').classList.remove('hidden');
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();