/**
 * CURLING PUZZLES — MEMORY CONTENT DATASET
 * 
 * Curriculum Categories:
 * - Level 1: Stones / Rocks, The House, The Curling Sheet, Basic Equipment
 * - Level 2: Delivery, Brushing / Sweeping, Curl & Rotation, Guards, Draws, Takeouts
 * - Level 3: Shot Selection, Skip / Lead / Second / Third Roles, Free Guard Zone
 * - Level 4: Ice Conditions, Pebble & Preparation, Tournament Formats
 */

window.CURLING_MEMORY_PUZZLES = [
  {
    id: "mem-curling-001",
    dayIndex: 0,
    title: "Granite & Rings",
    category: "The House & Stones",
    difficulty: "Beginner",
    pairs: [
      {
        id: "red-stone",
        label: "Red Stone",
        iconSvg: `<svg viewBox="0 0 32 32"><ellipse cx="16" cy="19" rx="12" ry="7" fill="#4b5563" stroke="#9ca3af" stroke-width="1.5"/><ellipse cx="16" cy="17" rx="9" ry="4.5" fill="#e02e3c"/><path d="M12 17 L12 12 Q12 9 16 9 L19 9" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round"/><circle cx="16" cy="6" r="1.5" fill="#f5a623"/></svg>`
      },
      {
        id: "yellow-stone",
        label: "Yellow Stone",
        iconSvg: `<svg viewBox="0 0 32 32"><ellipse cx="16" cy="19" rx="12" ry="7" fill="#4b5563" stroke="#9ca3af" stroke-width="1.5"/><ellipse cx="16" cy="17" rx="9" ry="4.5" fill="#f5a623"/><path d="M12 17 L12 12 Q12 9 16 9 L19 9" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round"/><circle cx="16" cy="6" r="1.5" fill="#e02e3c"/></svg>`
      },
      {
        id: "the-house",
        label: "The House",
        iconSvg: `<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="#1e3a8a" stroke="#60a5fa" stroke-width="1.5"/><circle cx="16" cy="16" r="9" fill="#f8fafc"/><circle cx="16" cy="16" r="5" fill="#dc2626"/><circle cx="16" cy="16" r="1.8" fill="#f8fafc"/></svg>`
      },
      {
        id: "the-button",
        label: "The Button",
        iconSvg: `<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="12" fill="none" stroke="#64748b" stroke-dasharray="2 2"/><circle cx="16" cy="16" r="5.5" fill="#ffffff" stroke="#2563eb" stroke-width="2"/><circle cx="16" cy="16" r="2" fill="#dc2626"/></svg>`
      },
      {
        id: "curling-broom",
        label: "Curling Broom",
        iconSvg: `<svg viewBox="0 0 32 32"><line x1="6" y1="26" x2="22" y2="10" stroke="#f5a623" stroke-width="2.5" stroke-linecap="round"/><rect x="18" y="6" width="10" height="5" rx="1.5" transform="rotate(-45 23 8.5)" fill="#2563eb" stroke="#ffffff" stroke-width="1.2"/></svg>`
      },
      {
        id: "the-hack",
        label: "The Hack",
        iconSvg: `<svg viewBox="0 0 32 32"><line x1="4" y1="16" x2="28" y2="16" stroke="#ef4444" stroke-width="2"/><rect x="11" y="9" width="10" height="14" rx="2" fill="#334155" stroke="#94a3b8" stroke-width="1.5"/><line x1="16" y1="11" x2="16" y2="21" stroke="#38bdf8" stroke-width="2"/></svg>`
      },
      {
        id: "hog-line",
        label: "Hog Line",
        iconSvg: `<svg viewBox="0 0 32 32"><line x1="4" y1="16" x2="28" y2="16" stroke="#dc2626" stroke-width="4" stroke-linecap="round"/><circle cx="16" cy="16" r="5" fill="none" stroke="#ffffff" stroke-width="1.5"/></svg>`
      },
      {
        id: "pebble-ice",
        label: "Pebble Ice",
        iconSvg: `<svg viewBox="0 0 32 32"><rect x="4" y="4" width="24" height="24" rx="4" fill="#0f172a" stroke="#38bdf8" stroke-width="1.2"/><circle cx="10" cy="10" r="1.5" fill="#bae6fd"/><circle cx="17" cy="12" r="2" fill="#ffffff"/><circle cx="22" cy="9" r="1.2" fill="#bae6fd"/><circle cx="12" cy="18" r="1.8" fill="#ffffff"/><circle cx="20" cy="19" r="2" fill="#7dd3fc"/><circle cx="15" cy="24" r="1.5" fill="#bae6fd"/></svg>`
      }
    ]
  },
  {
    id: "mem-curling-002",
    dayIndex: 1,
    title: "The Delivery & Shots",
    category: "Delivery & Tactics",
    difficulty: "Easy",
    pairs: [
      {
        id: "slider-shoe",
        label: "Slider Shoe",
        iconSvg: `<svg viewBox="0 0 32 32"><path d="M5 21 C8 21 12 22 17 22 C22 22 27 20 27 16 C27 13 24 11 21 11 L16 11 L13 14 L8 14 C6 14 5 17 5 21 Z" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5"/><line x1="6" y1="23" x2="26" y2="23" stroke="#f8fafc" stroke-width="2"/></svg>`
      },
      {
        id: "gripper-shoe",
        label: "Gripper Shoe",
        iconSvg: `<svg viewBox="0 0 32 32"><path d="M5 21 C8 21 12 22 17 22 C22 22 27 20 27 16 C27 13 24 11 21 11 L16 11 L13 14 L8 14 C6 14 5 17 5 21 Z" fill="#334155" stroke="#94a3b8" stroke-width="1.5"/><line x1="6" y1="23" x2="26" y2="23" stroke="#f5a623" stroke-width="2" stroke-dasharray="2 1"/></svg>`
      },
      {
        id: "takeout-shot",
        label: "Takeout Shot",
        iconSvg: `<svg viewBox="0 0 32 32"><circle cx="11" cy="16" r="6" fill="#e02e3c"/><path d="M17 16 L27 16 M23 12 L27 16 L23 20" stroke="#f8fafc" stroke-width="2.2" stroke-linecap="round"/><circle cx="26" cy="16" r="4" fill="#f5a623" opacity="0.6"/></svg>`
      },
      {
        id: "draw-shot",
        label: "Draw Shot",
        iconSvg: `<svg viewBox="0 0 32 32"><path d="M6 24 C10 18 16 14 22 15" fill="none" stroke="#38bdf8" stroke-width="2" stroke-dasharray="3 2"/><circle cx="24" cy="16" r="5" fill="#e02e3c" stroke="#ffffff" stroke-width="1.5"/></svg>`
      },
      {
        id: "guard-rock",
        label: "Guard Rock",
        iconSvg: `<svg viewBox="0 0 32 32"><rect x="4" y="6" width="24" height="20" rx="3" fill="none" stroke="#64748b" stroke-dasharray="2 2"/><circle cx="16" cy="12" r="5" fill="#f5a623" stroke="#ffffff" stroke-width="1.5"/><circle cx="16" cy="22" r="3" fill="#e02e3c" opacity="0.4"/></svg>`
      },
      {
        id: "in-turn-arrow",
        label: "In-Turn Curl",
        iconSvg: `<svg viewBox="0 0 32 32"><path d="M12 24 C12 14 20 14 20 8" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round"/><polyline points="16 11 20 7 24 11" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round"/></svg>`
      },
      {
        id: "out-turn-arrow",
        label: "Out-Turn Curl",
        iconSvg: `<svg viewBox="0 0 32 32"><path d="M20 24 C20 14 12 14 12 8" fill="none" stroke="#f5a623" stroke-width="2.5" stroke-linecap="round"/><polyline points="8 11 12 7 16 11" fill="none" stroke="#f5a623" stroke-width="2.5" stroke-linecap="round"/></svg>`
      },
      {
        id: "stopwatch",
        label: "Split Timer",
        iconSvg: `<svg viewBox="0 0 32 32"><circle cx="16" cy="18" r="10" fill="#1e293b" stroke="#38bdf8" stroke-width="1.8"/><line x1="16" y1="18" x2="20" y2="15" stroke="#f8fafc" stroke-width="1.8" stroke-linecap="round"/><rect x="14" y="4" width="4" height="4" fill="#64748b"/></svg>`
      }
    ]
  },
  {
    id: "mem-curling-003",
    dayIndex: 2,
    title: "Rink Positions & Strategy",
    category: "Curling Roles & Rules",
    difficulty: "Medium",
    pairs: [
      {
        id: "skip-role",
        label: "Skip's Broom",
        iconSvg: `<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="12" fill="none" stroke="#2563eb" stroke-width="1.5"/><line x1="16" y1="4" x2="16" y2="28" stroke="#f8fafc" stroke-width="2"/><line x1="4" y1="16" x2="28" y2="16" stroke="#f8fafc" stroke-width="2"/></svg>`
      },
      {
        id: "the-hammer",
        label: "The Hammer",
        iconSvg: `<svg viewBox="0 0 32 32"><path d="M12 7 L20 7 L20 12 L12 12 Z" fill="#e02e3c" stroke="#f8fafc" stroke-width="1.5"/><line x1="16" y1="12" x2="16" y2="26" stroke="#f5a623" stroke-width="2.5" stroke-linecap="round"/></svg>`
      },
      {
        id: "free-guard",
        label: "FGZ Zone",
        iconSvg: `<svg viewBox="0 0 32 32"><rect x="6" y="8" width="20" height="16" rx="2" fill="#1e3a8a" stroke="#38bdf8" stroke-width="1.5"/><text x="16" y="19" font-size="8" font-weight="bold" fill="#ffffff" text-anchor="middle">5-ROCK</text></svg>`
      },
      {
        id: "lead-position",
        label: "The Lead",
        iconSvg: `<svg viewBox="0 0 32 32"><circle cx="16" cy="10" r="4.5" fill="#38bdf8"/><path d="M8 24 C8 19 12 16 16 16 C20 16 24 19 24 24" fill="none" stroke="#38bdf8" stroke-width="2"/><circle cx="16" cy="24" r="2" fill="#e02e3c"/></svg>`
      },
      {
        id: "score-board",
        label: "Score End",
        iconSvg: `<svg viewBox="0 0 32 32"><rect x="4" y="7" width="24" height="18" rx="2" fill="#0f172a" stroke="#64748b" stroke-width="1.5"/><line x1="4" y1="16" x2="28" y2="16" stroke="#334155" stroke-width="1"/><text x="10" y="14" font-size="6" fill="#e02e3c" font-weight="bold">2</text><text x="22" y="14" font-size="6" fill="#f5a623" font-weight="bold">0</text></svg>`
      },
      {
        id: "sweeping-pair",
        label: "Hard Sweep",
        iconSvg: `<svg viewBox="0 0 32 32"><line x1="8" y1="24" x2="20" y2="12" stroke="#38bdf8" stroke-width="2.5"/><line x1="12" y1="26" x2="24" y2="14" stroke="#f5a623" stroke-width="2.5"/><path d="M18 10 L24 16" stroke="#ffffff" stroke-width="2"/></svg>`
      },
      {
        id: "freeze-shot",
        label: "Freeze Shot",
        iconSvg: `<svg viewBox="0 0 32 32"><circle cx="12" cy="16" r="6" fill="#e02e3c" stroke="#ffffff" stroke-width="1.2"/><circle cx="21" cy="16" r="6" fill="#f5a623" stroke="#ffffff" stroke-width="1.2"/></svg>`
      },
      {
        id: "measuring-device",
        label: "Measure Stick",
        iconSvg: `<svg viewBox="0 0 32 32"><circle cx="8" cy="16" r="3" fill="#ffffff"/><line x1="8" y1="16" x2="26" y2="16" stroke="#38bdf8" stroke-width="2"/><rect x="23" y="12" width="4" height="8" rx="1" fill="#e02e3c"/></svg>`
      }
    ]
  },
  {
    id: "mem-curling-004",
    dayIndex: 3,
    title: "Granite Quarry & Tech",
    category: "Stones & Ice Physics",
    difficulty: "Medium",
    pairs: [
      {
        id: "ailsa-craig",
        label: "Ailsa Granite",
        iconSvg: `<svg viewBox="0 0 32 32"><polygon points="16,4 26,10 28,22 16,28 4,20 6,8" fill="#475569" stroke="#cbd5e1" stroke-width="1.5"/><circle cx="14" cy="14" r="1.5" fill="#ffffff"/><circle cx="20" cy="18" r="1" fill="#94a3b8"/></svg>`
      },
      {
        id: "running-edge",
        label: "Running Edge",
        iconSvg: `<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="12" fill="none" stroke="#38bdf8" stroke-width="3"/><circle cx="16" cy="16" r="8" fill="none" stroke="#64748b" stroke-width="1"/></svg>`
      },
      {
        id: "pebble-head",
        label: "Pebble Nipple",
        iconSvg: `<svg viewBox="0 0 32 32"><rect x="10" y="8" width="12" height="16" rx="2" fill="#334155" stroke="#cbd5e1" stroke-width="1.5"/><circle cx="16" cy="12" r="1.5" fill="#38bdf8"/><circle cx="16" cy="16" r="1.5" fill="#38bdf8"/><circle cx="16" cy="20" r="1.5" fill="#38bdf8"/></svg>`
      },
      {
        id: "ice-scraper",
        label: "Ice Scraper",
        iconSvg: `<svg viewBox="0 0 32 32"><rect x="6" y="10" width="20" height="4" fill="#94a3b8"/><line x1="16" y1="14" x2="16" y2="26" stroke="#f5a623" stroke-width="2.5"/></svg>`
      },
      {
        id: "laser-line",
        label: "Tee Line",
        iconSvg: `<svg viewBox="0 0 32 32"><line x1="4" y1="16" x2="28" y2="16" stroke="#2563eb" stroke-width="2.5"/><circle cx="16" cy="16" r="4" fill="none" stroke="#ef4444" stroke-width="1.5"/></svg>`
      },
      {
        id: "brush-fabric",
        label: "WCF Fabric",
        iconSvg: `<svg viewBox="0 0 32 32"><rect x="6" y="8" width="20" height="16" rx="2" fill="#fbbf24" stroke="#d97706" stroke-width="1.5"/><line x1="6" y1="14" x2="26" y2="14" stroke="#ffffff" stroke-width="1" stroke-dasharray="2 1"/><line x1="6" y1="18" x2="26" y2="18" stroke="#ffffff" stroke-width="1" stroke-dasharray="2 1"/></svg>`
      },
      {
        id: "speed-trap",
        label: "Speed Sensor",
        iconSvg: `<svg viewBox="0 0 32 32"><rect x="8" y="10" width="16" height="12" rx="2" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5"/><circle cx="16" cy="16" r="2.5" fill="#ef4444"/></svg>`
      },
      {
        id: "sheet-dividers",
        label: "Rink Divider",
        iconSvg: `<svg viewBox="0 0 32 32"><rect x="14" y="4" width="4" height="24" rx="1" fill="#475569" stroke="#94a3b8" stroke-width="1"/><line x1="4" y1="16" x2="14" y2="16" stroke="#38bdf8" stroke-width="1.5"/></svg>`
      }
    ]
  },
  {
    id: "mem-curling-005",
    dayIndex: 4,
    title: "Championship Lore",
    category: "Canadian Lore & Events",
    difficulty: "Hard",
    pairs: [
      {
        id: "brier-tankard",
        label: "The Tankard",
        iconSvg: `<svg viewBox="0 0 32 32"><path d="M10 8 L22 8 L20 24 L12 24 Z" fill="#fbbf24" stroke="#ffffff" stroke-width="1.5"/><path d="M22 11 Q26 12 22 18" fill="none" stroke="#fbbf24" stroke-width="2"/><line x1="8" y1="26" x2="24" y2="26" stroke="#fbbf24" stroke-width="2.5"/></svg>`
      },
      {
        id: "hearts-trophy",
        label: "Scotties Heart",
        iconSvg: `<svg viewBox="0 0 32 32"><path d="M16 26 C16 26 6 18 6 11 C6 7 9 5 12 5 C14 5 15.5 6 16 7 C16.5 6 18 5 20 5 C23 5 26 7 26 11 C26 18 16 26 16 26 Z" fill="#e02e3c" stroke="#ffffff" stroke-width="1.5"/></svg>`
      },
      {
        id: "maple-crest",
        label: "Maple Crest",
        iconSvg: `<svg viewBox="0 0 32 32"><path d="M16 4 L18 9 L23 8 L21 13 L26 15 L22 18 L24 23 L19 22 L17 26 L16 28 L15 26 L13 22 L8 23 L10 18 L6 15 L11 13 L9 8 L14 9 Z" fill="#dc2626" stroke="#ffffff" stroke-width="1.2"/></svg>`
      },
      {
        id: "blank-end",
        label: "Blank End",
        iconSvg: `<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="10" fill="none" stroke="#64748b" stroke-width="2"/><text x="16" y="20" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">0</text></svg>`
      },
      {
        id: "steal-of-two",
        label: "Steal of Two",
        iconSvg: `<svg viewBox="0 0 32 32"><rect x="6" y="6" width="20" height="20" rx="3" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5"/><text x="16" y="20" font-size="10" font-weight="bold" fill="#38bdf8" text-anchor="middle">+2</text></svg>`
      },
      {
        id: "extra-end",
        label: "Extra End",
        iconSvg: `<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="11" fill="#0f172a" stroke="#f5a623" stroke-width="2"/><text x="16" y="20" font-size="10" font-weight="bold" fill="#f5a623" text-anchor="middle">EE</text></svg>`
      },
      {
        id: "gold-medal",
        label: "World Gold",
        iconSvg: `<svg viewBox="0 0 32 32"><circle cx="16" cy="18" r="8" fill="#f5a623" stroke="#ffffff" stroke-width="1.5"/><path d="M12 4 L16 11 L20 4" fill="none" stroke="#2563eb" stroke-width="2.5"/></svg>`
      },
      {
        id: "spirit-curling",
        label: "Spirit of Curling",
        iconSvg: `<svg viewBox="0 0 32 32"><path d="M12 18 L16 14 L20 18" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/><circle cx="16" cy="16" r="12" fill="none" stroke="#38bdf8" stroke-width="1.8"/><circle cx="16" cy="16" r="2" fill="#ef4444"/></svg>`
      }
    ]
  }
];