// ============================================================
// MC — the protagonist. Everyone in the formation exists to keep
// this one character alive; only the MC has HP, and only the MC's
// position (== formation center) ever collides with terrain.
// ============================================================

const MC_WARD_COLOR   = '#d4af6a'; // matches the MC sprite's gold trim
const MC_SHIELD_COLOR = '#5ec9e0';

function updateMC(STATE) {
  const mc = STATE.mc;
  if (mc.wardCooldown   > 0) mc.wardCooldown--;
  if (mc.shieldCooldown > 0) mc.shieldCooldown--;
  if (mc.invulnTimer    > 0) mc.invulnTimer--;

  if (mc.shieldTimer > 0) {
    mc.shieldTimer--;
    if (mc.shieldTimer <= 0) mc.shieldHp = 0; // barrier expires even if not fully spent
  }
}

// ── Ward Pulse (Q) — knock everything back, buy a moment of safety ──
function triggerWardPulse(STATE) {
  const mc = STATE.mc;
  if (mc.wardCooldown > 0) return;
  if (STATE.killBank < C.WARD_KILL_COST) return; // squad hasn't earned it yet

  STATE.killBank -= C.WARD_KILL_COST;
  mc.wardCooldown = C.WARD_COOLDOWN;
  mc.invulnTimer = C.WARD_INVULN_FRAMES;

  const fx = STATE.formation.x, fy = STATE.formation.y;
  STATE.enemies.forEach(en => {
    const dx = en.x - fx, dy = en.y - fy;
    const dist = Math.hypot(dx, dy);
    if (dist > C.WARD_RADIUS) return;
    const d = dist || 1;
    const pushX = (dx / d) * C.WARD_KNOCKBACK;
    const pushY = (dy / d) * C.WARD_KNOCKBACK;
    const resolved = resolveMovement(en.x, en.y, pushX, pushY);
    en.x = resolved.x; en.y = resolved.y;
  });

  spawnAbilityBurst(STATE, fx, fy, MC_WARD_COLOR);
  spawnAbilityRing(STATE, fx, fy, C.WARD_RADIUS, MC_WARD_COLOR, 30);
}

// ── Adaptive Shield (E) — temporary damage-absorbing barrier ──
function triggerAdaptiveShield(STATE) {
  const mc = STATE.mc;
  if (mc.shieldCooldown > 0) return;
  if (STATE.killBank < C.SHIELD_KILL_COST) return;

  STATE.killBank -= C.SHIELD_KILL_COST;
  mc.shieldCooldown = C.SHIELD_COOLDOWN;
  mc.shieldHp = C.SHIELD_AMOUNT;
  mc.shieldTimer = C.SHIELD_DURATION;

  spawnAbilityBurst(STATE, STATE.formation.x, STATE.formation.y, MC_SHIELD_COLOR);
}
