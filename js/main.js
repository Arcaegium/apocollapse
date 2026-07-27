// ============================================================
// MAIN — game loop, state, input, entry point
// ============================================================

let animId = null;

// ── State ─────────────────────────────────────────────────────

function createState() {
  // Formation spawns at world center
  const startX = C.WORLD_W / 2;
  const startY = C.WORLD_H / 2;

  return {
    phase: 'TITLE',
    frame: 0,

    formation: { x: startX, y: startY, rotation: 0 },

    // The protagonist — the escorts orbit and protect this position.
    // Collision + damage only ever apply here, never to the escorts.
    mc: {
      hp: C.MC_MAX_HP, maxHp: C.MC_MAX_HP,
      shieldHp: 0, shieldTimer: 0,
      invulnTimer: 0,
      wardCooldown: 0,
      shieldCooldown: 0,
      animPhase: 0,
    },

    avatars: AVATAR_CONFIG
      .filter(cfg => cfg.unlocked)
      .slice(0, 4)
      .map((cfg, i) => ({
        ...buildAvatarRunState(cfg),
        fireTimer: Math.floor(i * (WEAPONS[cfg.weapon].fireRate / 4)),
      })),

    selectedAbility: 0,

    bullets:      [],
    enemies:      [],
    dyingEnemies: [],
    particles:    [],
    abilityRings: [],
    screenFlash:  null,

    spawnTimer:  0,
    wave:        1,
    waveTimer:   0,
    waveKills:   0,
    killBank:    0,
    activeApocs: ['zombie'],
    waveState:   'FIGHTING',

    score: 0,
    kills: 0,

    keys:            {},
    keysJustPressed: {},

    waveAnnounceTimer: 0,

    // Pause
    paused: false,
  };
}

// ── Lifecycle ─────────────────────────────────────────────────

function startGame(STATE) {
  const fresh = createState();
  Object.assign(STATE, fresh);
  STATE.phase = 'PLAYING';
  STATE.activeApocs = getApocSequence(1);

  generateMap(STATE.activeApocs);
  updateCamera(STATE.formation.x, STATE.formation.y);

  buildAbilityBar(STATE);
  updateApocBanner(STATE);
  updateHUD(STATE);
  announceWave(STATE);

  window._gameState = STATE;
  if (animId) cancelAnimationFrame(animId);
  gameLoop(STATE);
}

function resumeGame(STATE) {
  STATE.phase = 'PLAYING';
  STATE.paused = false;
  hidePauseScreen();
  buildAbilityBar(STATE);
  if (animId) cancelAnimationFrame(animId);
  gameLoop(STATE);
}

function triggerDeath(STATE) {
  STATE.phase = 'DEAD';
  cancelAnimationFrame(animId);
  animId = null;
  showGameOverScreen(STATE);
}

// ── Pause ─────────────────────────────────────────────────────

function togglePause(STATE) {
  if (STATE.phase !== 'PLAYING' && STATE.phase !== 'PAUSED') return;
  if (STATE.paused) {
    resumeGame(STATE);
  } else {
    STATE.paused = true;
    STATE.phase = 'PAUSED';
    cancelAnimationFrame(animId);
    animId = null;
    showPauseScreen(STATE);
  }
}

function showPauseScreen(STATE) {
  const el = document.getElementById('screenTitle');
  el.style.display = 'flex';
  el.innerHTML = `
    <h2 style="font-family:'Bebas Neue',sans-serif;font-size:52px;letter-spacing:.1em;color:#e0e0c0">PAUSED</h2>
    <p style="font-size:11px;color:#555">Wave ${STATE.wave} &nbsp;|&nbsp; ${STATE.score.toLocaleString()} pts</p>
    <button id="pauseResumeBtn">Resume</button>
    <button class="secondary" id="pauseQuitBtn">Quit to Title</button>
  `;
  document.getElementById('pauseResumeBtn').addEventListener('click', () => resumeGame(STATE));
  document.getElementById('pauseQuitBtn').addEventListener('click', () => {
    hidePauseScreen();
    STATE.phase = 'TITLE';
    showTitleScreen(STATE);
  });
}

function hidePauseScreen() {
  document.getElementById('screenTitle').style.display = 'none';
}

// ── Game loop ─────────────────────────────────────────────────

function gameLoop(STATE) {
  if (STATE.phase !== 'PLAYING') return;
  STATE.frame++;

  processInput(STATE);
  updateFormation(STATE);     // also updates camera
  updateShooting(STATE);
  updateBullets(STATE);
  updateEnemies(STATE);
  checkCollisions(STATE);
  updateParticles(STATE);
  updateAbilityVFX(STATE);
  updateMC(STATE);
  updateCooldowns(STATE);
  updateWave(STATE);
  updateWaveAnnounce(STATE);
  updateEffectFlash();
  updateAbilityBar(STATE);
  updateMCHud(STATE);
  updateWaveProgressUI(STATE);

  render(STATE);

  animId = requestAnimationFrame(() => gameLoop(STATE));
}

// ── Input ─────────────────────────────────────────────────────

function setupInput(STATE) {
  window.addEventListener('keydown', e => {
    if (!STATE.keys[e.key]) STATE.keysJustPressed[e.key] = true;
    STATE.keys[e.key] = true;
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
  });
  window.addEventListener('keyup', e => { STATE.keys[e.key] = false; });
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    if (STATE.phase !== 'PLAYING') return;
    STATE.selectedAbility = (STATE.selectedAbility + (e.deltaY > 0 ? 1 : 3)) % STATE.avatars.length;
  }, { passive: false });
}

function processInput(STATE) {
  const kjp = STATE.keysJustPressed;

  // 1-4 select ability
  for (let i = 1; i <= STATE.avatars.length; i++) {
    if (kjp[String(i)]) STATE.selectedAbility = i - 1;
  }

  // Space — use escort ability
  if (kjp[' ']) triggerAbility(STATE);

  // Q / E — MC's own defensive abilities
  if (kjp['q'] || kjp['Q']) triggerWardPulse(STATE);
  if (kjp['e'] || kjp['E']) triggerAdaptiveShield(STATE);

  // P or Escape — pause
  if (kjp['p'] || kjp['P'] || kjp['Escape']) togglePause(STATE);

  STATE.keysJustPressed = {};
}

// ── Break screen bridge ───────────────────────────────────────

function showBreakScreen(STATE) {
  STATE.phase = 'BREAK';
  cancelAnimationFrame(animId);
  animId = null;
  window._breakState = STATE;
  document.getElementById('screenBreak').style.display = 'flex';
  breakAvatarIndex = 0;
  showAvatarDraft(STATE, 0);
}

// ── Entry point ───────────────────────────────────────────────

(function init() {
  buildSpriteCache();

  const STATE = createState();
  window._gameState = STATE;

  setupInput(STATE);
  setupMouseTracking();

  // Init camera at world center before title shows
  updateCamera(STATE.formation.x, STATE.formation.y);

  showTitleScreen(STATE);
})();
