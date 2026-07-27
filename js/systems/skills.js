// ============================================================
// SKILLS SYSTEM
// Draft pool generation, skill slot management, level tracking
// Effect application is STUBBED — implementation comes next pass
// ============================================================

// Fisher-Yates shuffle, in place
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Build a draft pool for an avatar
// Returns array of {skillDef, currentLevel} for display
function buildDraftPool(av) {
  const pool = [];

  // Own skills — weighted higher
  av.skillPool.forEach(skillId => {
    const def = SKILL_DEFS[skillId];
    if (!def) return;
    const current = av.skills.find(s => s.id === skillId);
    const level = current ? current.level : 0;
    if (level >= C.MAX_SKILL_LEVEL) return; // maxed out, remove from pool

    // Add multiple times = higher weight
    const weight = current ? 2 : 3; // upgrade existing slightly less than new
    for (let i = 0; i < weight; i++) {
      pool.push({ skillId, def, currentLevel: level });
    }
  });

  // Cross-training — small chance to get another avatar's skill at reduced power
  // STUB: cross-training implementation
  // if (Math.random() < C.CROSS_TRAIN_CHANCE) { ... }

  // Shuffle and take DRAFT_OPTIONS unique skill IDs
  shuffleArray(pool);
  const seen = new Set();
  const result = [];
  for (const entry of pool) {
    if (seen.has(entry.skillId)) continue;
    seen.add(entry.skillId);
    result.push(entry);
    if (result.length >= C.DRAFT_OPTIONS) break;
  }

  // Pad with random own skills if pool is thin (shouldn't happen, but safety)
  while (result.length < C.DRAFT_OPTIONS && result.length < pool.length) {
    const entry = pool[result.length];
    if (!seen.has(entry.skillId)) {
      seen.add(entry.skillId);
      result.push(entry);
    }
  }

  return result;
}

// Apply a chosen skill to an avatar
function applySkill(av, skillId) {
  const existing = av.skills.find(s => s.id === skillId);
  if (existing) {
    // Level up
    existing.level = Math.min(existing.level + 1, C.MAX_SKILL_LEVEL);
  } else {
    // New slot — check space
    if (av.skills.length >= C.MAX_SKILL_SLOTS) {
      console.warn(`${av.id} has no skill slots — this shouldn't happen if draft pool is built correctly`);
      return;
    }
    av.skills.push({ id: skillId, level: 1 });
  }

  // STUB: trigger any immediate on-acquire effects
  // const def = SKILL_DEFS[skillId];
  // if (def.onAcquire) def.onAcquire(av, level);
}

// Get current level of a skill for an avatar (0 = not learned)
function getSkillLevel(av, skillId) {
  const s = av.skills.find(s => s.id === skillId);
  return s ? s.level : 0;
}

// Build avatar state for a run — called in initState
function buildAvatarRunState(cfg) {
  return {
    ...cfg,
    weapon: cfg.weapon,           // weapon key string
    x: 0, y: 0,
    angle: 0,
    fireTimer: 0,
    abilityCooldown: 0,
    animPhase: Math.random() * Math.PI * 2,
    recoilTimer: 0,
    skills: [],                   // [] = no skills yet, filled during run
    kills: 0,                     // per-avatar kill tracking for draft eligibility
  };
}

// ── STUB: on-hit skill effects ────────────────────────────────
// Called from combat.js — implement effects here as skills are fleshed out
function applyOnHitEffects(bullet, enemy, effectiveness, STATE) {
  const av = STATE.avatars.find(a => a.id === bullet.heroId);
  if (!av) return;

  // Example stub structure:
  // const bioLevel = getSkillLevel(av, 'biohazardRounds');
  // if (bioLevel > 0 && enemy.apoc === 'zombie') {
  //   applyDOT(enemy, bioLevel * 3, 180); // 3/6/9 dmg over 3s
  // }
}

// ── STUB: ability effects ─────────────────────────────────────
function applyAbilityEffect(STATE, av) {
  switch (av.id) {
    case 'rex':
      // STUB: Biohazard Grenade — slow enemies in radius
      break;
    case 'sable':
      // STUB: EMP Burst — stun all robots
      break;
    case 'yara':
      // STUB: Pacify Signal — confuse aliens
      break;
    case 'gage':
      // STUB: Suppressing Fire — push enemies outward
      break;
  }
}
