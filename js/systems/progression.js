// ============================================================
// PROGRESSION SYSTEM
// Wave management, apocalypse stacking, save/load
// ============================================================

function getApocSequence(wave) {
  // Wave 1: zombie only. Each wave adds one more, max 4 simultaneous.
  // Sequence is fixed for now; randomization comes later.
  const sequence = ['zombie','robot','alien','demon','mutant','eldritch','collapse','plague'];
  return sequence.slice(0, Math.min(wave, 4));
}

function updateWave(STATE) {
  if (STATE.waveState === 'FIGHTING') {
    STATE.waveTimer++;
    updateSpawner(STATE);

    if (STATE.waveTimer >= C.WAVE_DURATION) {
      STATE.waveState = 'TRANSITION';
      STATE.waveTimer = 0;
    }
  } else if (STATE.waveState === 'TRANSITION') {
    // Brief calm before break screen
    STATE.waveTimer++;
    if (STATE.waveTimer >= C.WAVE_TRANSITION) {
      STATE.waveState = 'BREAK';
      STATE.waveTimer = 0;
      showBreakScreen(STATE);
    }
  }
  // BREAK state is handled by the break screen UI
}

function startNextWave(STATE) {
  STATE.wave++;
  STATE.waveTimer = 0;
  STATE.waveKills = 0;
  STATE.killBank = 0; // kill bank resets at the start of every wave
  STATE.waveState = 'FIGHTING';
  STATE.activeApocs = getApocSequence(STATE.wave);
  STATE.enemies = [];
  STATE.bullets = [];
  STATE.spawnTimer = 0;

  // Generate new map with updated apocalypse mix
  generateMap(STATE.activeApocs);

  // Reset formation to center
  STATE.formation.x = C.W / 2;
  STATE.formation.y = C.H / 2;

  announceWave(STATE);
  updateApocBanner(STATE);
  updateHUD(STATE);
  saveProgress(STATE);
}

// ── Announce ──────────────────────────────────────────────────

function announceWave(STATE) {
  const el = document.getElementById('waveAnnounce');
  if (!el) return;
  el.textContent = `WAVE ${STATE.wave}\n${STATE.activeApocs.map(k => getApoc(k).name).join('\n+ ')}`;
  el.style.opacity = '1';
  STATE.waveAnnounceTimer = 140;
}

function updateWaveAnnounce(STATE) {
  if (STATE.waveAnnounceTimer <= 0) return;
  STATE.waveAnnounceTimer--;
  const el = document.getElementById('waveAnnounce');
  if (!el) return;
  el.style.opacity = Math.min(1, STATE.waveAnnounceTimer / 20).toString();
  if (STATE.waveAnnounceTimer === 0) el.style.opacity = '0';
}

function updateApocBanner(STATE) {
  const el = document.getElementById('apocBanner');
  if (!el) return;
  el.innerHTML = STATE.activeApocs.map(k => {
    const a = getApoc(k);
    return `<span class="apoc-pill" style="color:${a.textColor};border-color:${a.color};background:${a.color}55">${a.name}</span>`;
  }).join('');
}

// ── HUD ──────────────────────────────────────────────────────

function updateHUD(STATE) {
  const s = document.getElementById('hudScore');
  const w = document.getElementById('hudWave');
  const k = document.getElementById('hudKills');
  if (s) s.textContent = STATE.score.toLocaleString();
  if (w) w.textContent = STATE.wave;
  if (k) k.textContent = STATE.kills;
}

// Wave is timed, not kill-based — this shows how close to the next
// wave transition (or break screen) the current wave is.
function updateWaveProgressUI(STATE) {
  const fill = document.getElementById('waveProgressFill');
  if (!fill) return;
  const duration = STATE.waveState === 'TRANSITION' ? C.WAVE_TRANSITION : C.WAVE_DURATION;
  const pct = Math.min(100, (STATE.waveTimer / duration) * 100);
  fill.style.width = pct + '%';
}

function updateMCHud(STATE) {
  const mc = STATE.mc;

  const hpFill = document.getElementById('mcHpFill');
  const hpText = document.getElementById('mcHpText');
  if (hpFill) {
    const pct = Math.max(0, mc.hp / mc.maxHp) * 100;
    hpFill.style.width = pct + '%';
    hpFill.classList.toggle('low', pct <= 30);
  }
  if (hpText) hpText.textContent = `${Math.ceil(mc.hp)}/${mc.maxHp}`;

  const bankValue = document.getElementById('mcBankValue');
  if (bankValue) bankValue.textContent = STATE.killBank;

  const wardCd = document.getElementById('mcWardCd');
  const wardSlot = document.getElementById('mcSlotWard');
  if (wardCd) wardCd.style.width = (1 - mc.wardCooldown / C.WARD_COOLDOWN) * 100 + '%';
  if (wardSlot) {
    wardSlot.classList.toggle('on-cooldown', mc.wardCooldown > 0);
    wardSlot.classList.toggle('unaffordable', STATE.killBank < C.WARD_KILL_COST);
  }

  const shieldCd = document.getElementById('mcShieldCd');
  const shieldSlot = document.getElementById('mcSlotShield');
  if (shieldCd) shieldCd.style.width = (1 - mc.shieldCooldown / C.SHIELD_COOLDOWN) * 100 + '%';
  if (shieldSlot) {
    shieldSlot.classList.toggle('on-cooldown', mc.shieldCooldown > 0);
    shieldSlot.classList.toggle('unaffordable', STATE.killBank < C.SHIELD_KILL_COST);
  }
}

// ── Save / Load ───────────────────────────────────────────────

function saveProgress(STATE) {
  try {
    const save = {
      version: 1,
      highScore: Math.max(STATE.score, loadProgress()?.highScore ?? 0),
      highWave:  Math.max(STATE.wave,  loadProgress()?.highWave  ?? 0),
      totalKills: (loadProgress()?.totalKills ?? 0) + STATE.kills,
      unlockedAvatars: AVATAR_CONFIG.filter(a => a.unlocked).map(a => a.id),
      // Future: persistent upgrades, meta-currency
    };
    localStorage.setItem(C.SAVE_KEY, JSON.stringify(save));
  } catch (e) {
    console.warn('Save failed:', e);
  }
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(C.SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function resetProgress() {
  localStorage.removeItem(C.SAVE_KEY);
}
