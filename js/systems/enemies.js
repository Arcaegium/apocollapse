// ============================================================
// ENEMY SYSTEM
// All positions in world coordinates.
// Spawn radius around formation, not screen edges.
// ============================================================

function spawnEnemy(STATE) {
  if (STATE.enemies.length >= C.MAX_ENEMIES) return;

  const apocKey = STATE.activeApocs[Math.floor(Math.random() * STATE.activeApocs.length)];
  const apocData = getApoc(apocKey);
  const behavior = getBehavior(apocData.enemyType);
  const wave = STATE.wave;

  // Spawn at random angle, random distance from formation in world space
  const angle = Math.random() * Math.PI * 2;
  const dist  = C.SPAWN_RADIUS_MIN + Math.random() * (C.SPAWN_RADIUS_MAX - C.SPAWN_RADIUS_MIN);
  let x = STATE.formation.x + Math.cos(angle) * dist;
  let y = STATE.formation.y + Math.sin(angle) * dist;

  // Clamp to world bounds
  const PAD = C.TILE * 2;
  x = Math.max(PAD, Math.min(C.WORLD_W - PAD, x));
  y = Math.max(PAD, Math.min(C.WORLD_H - PAD, y));

  // Push to walkable position if spawned in a wall
  if (!isWalkable(x, y)) {
    let found = false;
    for (let r = C.TILE; r < C.TILE * 5; r += C.TILE) {
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
        const tx = x + Math.cos(a) * r;
        const ty = y + Math.sin(a) * r;
        if (isWalkable(tx, ty)) { x = tx; y = ty; found = true; break; }
      }
      if (found) break;
    }
    if (!found) return; // give up on this spawn
  }

  const speedScale = 1 + (wave - 1) * 0.10;
  const hpScale    = 1 + (wave - 1) * 0.15;

  STATE.enemies.push({
    x, y,
    apoc: apocKey,
    sprite: apocData.enemyType,
    hp:    Math.ceil(behavior.baseHP * apocData.hpMult * hpScale),
    maxHp: Math.ceil(behavior.baseHP * apocData.hpMult * hpScale),
    speed:           behavior.baseSpeed * apocData.speedMult * speedScale,
    flashTimer: 0,
    animPhase: Math.random() * Math.PI * 2,
    behaviorType: apocData.enemyType,
    behaviorState: 'move',
    behaviorTimer: Math.floor(Math.random() * 40), // stagger initial behavior
    lurchAngle: Math.random() * Math.PI * 2,
    // Active-ability status effects
    slowTimer: 0, slowMult: 1,
    stunTimer: 0,
    confuseTimer: 0,
  });
}

// ── Enemy update ──────────────────────────────────────────────

function updateEnemies(STATE) {
  const fx = STATE.formation.x, fy = STATE.formation.y;

  STATE.enemies.forEach(en => {
    en.animPhase += 0.14;
    if (en.flashTimer > 0) en.flashTimer--;
    if (en.slowTimer    > 0) en.slowTimer--;
    if (en.stunTimer    > 0) en.stunTimer--;
    if (en.confuseTimer > 0) en.confuseTimer--;

    const prevX = en.x, prevY = en.y;

    if (en.stunTimer > 0) {
      // Frozen — no movement at all
    } else if (en.confuseTimer > 0) {
      moveConfused(STATE, en);
    } else {
      const savedSpeed = en.speed;
      if (en.slowTimer > 0) en.speed = savedSpeed * en.slowMult;

      switch (en.behaviorType) {
        case 'zombie':   moveSwarm(en, fx, fy);   break;
        case 'robot':    moveMarch(en, fx, fy);   break;
        case 'alien':    moveFlank(en, fx, fy);   break;
        case 'demon':    moveCharge(en, fx, fy);  break;
        case 'eldritch': moveErratic(en, fx, fy); break;
        case 'mutant':   moveSwarm(en, fx, fy);   break;
        default:         moveSwarm(en, fx, fy);   break;
      }

      en.speed = savedSpeed;
    }

    // Terrain collision — revert if walked into a wall
    if (!isWalkable(en.x, en.y)) {
      // Try sliding
      if (isWalkable(en.x, prevY)) { en.y = prevY; }
      else if (isWalkable(prevX, en.y)) { en.x = prevX; }
      else { en.x = prevX; en.y = prevY; }
    }
  });

  // Confused enemies can kill each other — sweep for deaths after movement
  for (let i = STATE.enemies.length - 1; i >= 0; i--) {
    if (STATE.enemies[i].hp <= 0) killEnemy(STATE, i, STATE.enemies[i], 1.0);
  }

  // Dying enemies
  STATE.dyingEnemies = STATE.dyingEnemies.filter(de => {
    de.frame++;
    de.x += de.vx; de.y += de.vy;
    de.rotation += de.rotSpeed;
    de.scale = Math.max(0, 1 - (de.frame / C.DEATH_ANIM_FRAMES));
    return de.frame < C.DEATH_ANIM_FRAMES;
  });
}

// ── Status effects ─────────────────────────────────────────────
// Confused enemies ignore the formation and go after the nearest
// other enemy instead, chipping away at it until one of them dies.
function moveConfused(STATE, en) {
  let nearest = null, nearestDist = Infinity;
  STATE.enemies.forEach(other => {
    if (other === en) return;
    const d = Math.hypot(other.x - en.x, other.y - en.y);
    if (d < nearestDist) { nearestDist = d; nearest = other; }
  });
  if (!nearest) return;

  const dx = nearest.x - en.x, dy = nearest.y - en.y;
  const ATTACK_RANGE = 18;
  if (nearestDist > ATTACK_RANGE) {
    en.x += (dx / nearestDist) * en.speed;
    en.y += (dy / nearestDist) * en.speed;
  } else {
    nearest.hp -= 0.15;
    nearest.flashTimer = 4;
  }
}

// ── Behaviors (all in world coords) ──────────────────────────

function moveSwarm(en, fx, fy) {
  const p = getBehavior(en.behaviorType).params;
  en.behaviorTimer += p.wobbleSpeed;
  const dx = fx - en.x, dy = fy - en.y;
  const dist = Math.hypot(dx, dy);
  if (dist > 1) {
    en.x += (dx / dist) * en.speed + Math.cos(en.behaviorTimer) * p.wobbleAmount;
    en.y += (dy / dist) * en.speed + Math.sin(en.behaviorTimer * 1.3) * p.wobbleAmount;
  }
}

function moveMarch(en, fx, fy) {
  const p = getBehavior(en.behaviorType).params;
  if (en.behaviorState === 'pause') {
    en.behaviorTimer--;
    if (en.behaviorTimer <= 0) { en.behaviorState = 'move'; en.behaviorTimer = p.marchInterval; }
    return;
  }
  const dx = fx - en.x, dy = fy - en.y, dist = Math.hypot(dx, dy);
  if (dist > 1) { en.x += (dx / dist) * en.speed; en.y += (dy / dist) * en.speed; }
  en.behaviorTimer--;
  if (en.behaviorTimer <= 0) { en.behaviorState = 'pause'; en.behaviorTimer = Math.floor(p.marchInterval * 0.5); }
}

function moveFlank(en, fx, fy) {
  const p = getBehavior(en.behaviorType).params;
  en.behaviorTimer += p.wobbleSpeed;
  const directAngle = Math.atan2(fy - en.y, fx - en.x);
  const flankAngle = directAngle + p.flankOffset * Math.sin(en.behaviorTimer * 0.5);
  const dist = Math.hypot(fx - en.x, fy - en.y);
  if (dist > 1) {
    en.x += Math.cos(flankAngle) * en.speed;
    en.y += Math.sin(flankAngle) * en.speed;
  }
}

function moveCharge(en, fx, fy) {
  const p = getBehavior(en.behaviorType).params;
  if (en.behaviorState === 'pause') {
    en.behaviorTimer--;
    if (en.behaviorTimer <= 0) {
      en.behaviorState = 'charge';
      en.behaviorTimer = p.chargeFrames;
      en.lurchAngle = Math.atan2(fy - en.y, fx - en.x);
    }
    return;
  }
  en.x += Math.cos(en.lurchAngle) * p.chargeSpeed;
  en.y += Math.sin(en.lurchAngle) * p.chargeSpeed;
  en.behaviorTimer--;
  if (en.behaviorTimer <= 0) { en.behaviorState = 'pause'; en.behaviorTimer = p.pauseFrames; }
}

function moveErratic(en, fx, fy) {
  const p = getBehavior(en.behaviorType).params;
  en.behaviorTimer++;
  if (en.behaviorTimer >= p.directionChangeInterval) {
    en.behaviorTimer = 0;
    const base = Math.atan2(fy - en.y, fx - en.x);
    en.lurchAngle = base + (Math.random() - 0.5) * p.lurchAmount * 2;
  }
  en.x += Math.cos(en.lurchAngle) * en.speed;
  en.y += Math.sin(en.lurchAngle) * en.speed;
}

// ── Spawner ───────────────────────────────────────────────────

function updateSpawner(STATE) {
  const spawnRate = Math.max(C.SPAWN_RATE_MIN, C.SPAWN_RATE_BASE - STATE.wave * 5);
  STATE.spawnTimer++;
  if (STATE.spawnTimer >= spawnRate) {
    STATE.spawnTimer = 0;
    spawnEnemy(STATE);
    if (STATE.wave > 2 && Math.random() < C.SPAWN_BURST_CHANCE) spawnEnemy(STATE);
  }
}
