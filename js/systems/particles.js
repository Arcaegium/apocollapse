// ============================================================
// PARTICLES SYSTEM
// Death bursts, ability effects, hit sparks
// ============================================================

function spawnDeathParticles(STATE, x, y, color) {
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI * 2 / 10) * i + Math.random() * 0.4;
    const spd = 1.2 + Math.random() * 2.8;
    STATE.particles.push({
      x, y,
      vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd,
      color, life: 28 + Math.floor(Math.random() * 14), maxLife: 40,
      size: 2 + Math.random() * 2.5,
    });
  }
}

function spawnAbilityBurst(STATE, x, y, color) {
  for (let i = 0; i < 20; i++) {
    const angle = (Math.PI * 2 / 20) * i;
    const spd = 2 + Math.random() * 3.5;
    STATE.particles.push({
      x, y,
      vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd,
      color, life: 35, maxLife: 35,
      size: 3 + Math.random(),
    });
  }
}

function spawnHitSpark(STATE, x, y, color) {
  for (let i = 0; i < 4; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd = 0.8 + Math.random() * 1.5;
    STATE.particles.push({
      x, y,
      vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd,
      color, life: 10, maxLife: 10,
      size: 1.5,
    });
  }
}

function startDeathAnim(STATE, en) {
  const angle = Math.random() * Math.PI * 2;
  const speed = 0.6 + Math.random() * 1.0;
  STATE.dyingEnemies.push({
    x: en.x, y: en.y,
    sprite: en.sprite, apoc: en.apoc,
    vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.22,
    scale: 1, frame: 0,
  });
  spawnDeathParticles(STATE, en.x, en.y, getApoc(en.apoc).textColor);
}

function updateParticles(STATE) {
  STATE.particles = STATE.particles.filter(p => {
    p.x += p.vx; p.y += p.vy;
    p.vx *= 0.87; p.vy *= 0.87;
    p.life--;
    return p.life > 0;
  });
}

// ── Ability cast feedback ───────────────────────────────────────
// Radius-bound abilities (Rex, Yara) draw a world-space ring showing
// exactly the area affected. Map-wide abilities (Sable, Gage) flash
// the whole screen instead, since there's no meaningful radius to draw.

function spawnAbilityRing(STATE, x, y, radius, color, life = 30) {
  STATE.abilityRings.push({ x, y, radius, color, life, maxLife: life });
}

function spawnScreenFlash(STATE, color, life = 24) {
  STATE.screenFlash = { color, life, maxLife: life };
}

function updateAbilityVFX(STATE) {
  STATE.abilityRings = STATE.abilityRings.filter(r => { r.life--; return r.life > 0; });
  if (STATE.screenFlash) {
    STATE.screenFlash.life--;
    if (STATE.screenFlash.life <= 0) STATE.screenFlash = null;
  }
}
