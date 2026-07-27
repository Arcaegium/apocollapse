// ============================================================
// COMBAT SYSTEM
// Shooting, bullet movement, homing, collision detection
// ============================================================

function updateShooting(STATE) {
  STATE.avatars.forEach(av => {
    av.fireTimer--;
    if (av.fireTimer <= 0) {
      const w = WEAPONS[av.weapon];
      av.fireTimer = w.fireRate;
      fireWeapon(STATE, av);
      av.recoilTimer = 5;
    }
  });
}

function fireWeapon(STATE, av) {
  const w = WEAPONS[av.weapon];
  const baseAngle = av.angle;
  const lifeFrames = Math.round(w.range / w.bulletSpeed);

  for (let i = 0; i < w.pellets; i++) {
    const spreadOffset = w.pellets > 1
      ? (i / (w.pellets - 1) - 0.5) * w.spread
      : (Math.random() - 0.5) * w.spread;

    STATE.bullets.push({
      x: av.x, y: av.y,
      vx: Math.cos(baseAngle + spreadOffset) * w.bulletSpeed,
      vy: Math.sin(baseAngle + spreadOffset) * w.bulletSpeed,
      color: w.color,
      size: w.bulletSize,
      life: lifeFrames, maxLife: lifeFrames,
      damage: w.damage * C.BULLET_BASE_DAMAGE,
      pierce: w.pierce || false,
      homing: w.homing || 0,
      heroId: av.id,
      focus: av.focus,
      hit: new Set(),
    });
  }
}

function updateBullets(STATE) {
  STATE.bullets.forEach(b => {
    // Homing — aggressive close-range convergence
    if (b.homing > 0 && STATE.enemies.length > 0) {
      let nearDist = Infinity, nearEn = null;
      STATE.enemies.forEach(en => {
        const d = Math.hypot(en.x - b.x, en.y - b.y);
        if (d < nearDist) { nearDist = d; nearEn = en; }
      });
      if (nearEn && nearDist < 220) {
        const tx = Math.atan2(nearEn.y - b.y, nearEn.x - b.x);
        let diff = tx - Math.atan2(b.vy, b.vx);
        while (diff >  Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        const closeFactor = Math.max(0.08, 1 - (nearDist / 220) * 0.85);
        const turnRate = b.homing + closeFactor * 0.18;
        const spd = Math.hypot(b.vx, b.vy);
        const newAngle = Math.atan2(b.vy, b.vx) + diff * Math.min(turnRate, 0.28);
        b.vx = Math.cos(newAngle) * spd;
        b.vy = Math.sin(newAngle) * spd;
      }
    }

    b.x += b.vx; b.y += b.vy; b.life--;
  });

  // Remove bullets that hit walls or expired
  STATE.bullets = STATE.bullets.filter(b =>
    b.life > 0 &&
    b.x > 0 && b.x < C.WORLD_W &&
    b.y > 0 && b.y < C.WORLD_H &&
    isBulletPassable(b.x, b.y)
  );
}

function checkCollisions(STATE) {
  const HIT_B = 13;

  // Bullets vs enemies
  for (let bi = STATE.bullets.length - 1; bi >= 0; bi--) {
    const b = STATE.bullets[bi];
    let consumed = false;

    for (let ei = STATE.enemies.length - 1; ei >= 0; ei--) {
      const en = STATE.enemies[ei];
      if (b.pierce && b.hit.has(ei)) continue;

      if (Math.abs(b.x - en.x) < HIT_B && Math.abs(b.y - en.y) < HIT_B) {
        const eff = getEffectiveness(b.heroId, en.apoc);
        const dmg = b.damage * eff;
        en.hp -= dmg;

        // Flash only on specialist hit
        const isSpecialist = b.focus === en.apoc;
        if (isSpecialist) en.flashTimer = 7;

        // Apply any active skill effects
        // STUB: applyOnHitEffects(b, en, eff, STATE);

        // Effectiveness feedback
        if (eff >= 1.8) showEffectFlash('EFFECTIVE!', getApoc(en.apoc).textColor);
        else if (eff <= 0.5) showEffectFlash('RESISTANT', '#ff4422');

        if (b.pierce) {
          b.hit.add(ei);
          b.damage *= 0.65;
        } else {
          consumed = true;
        }

        if (en.hp <= 0) {
          killEnemy(STATE, ei, en, eff);
          if (b.pierce) { /* enemy removed, index shift handled below */ }
        }

        if (consumed) break;
      }
    }
    if (consumed) STATE.bullets.splice(bi, 1);
  }

  // Enemies touching formation center = death
  const fx = STATE.formation.x, fy = STATE.formation.y;
  for (const en of STATE.enemies) {
    if (Math.hypot(en.x - fx, en.y - fy) < C.KILL_RADIUS) {
      triggerDeath(STATE);
      return;
    }
  }
}

function killEnemy(STATE, idx, en, eff) {
  startDeathAnim(STATE, en);
  STATE.enemies.splice(idx, 1);
  STATE.score += Math.round(10 * STATE.wave * eff);
  STATE.kills++;
  STATE.waveKills++;
  updateHUD(STATE);

  // STUB: check recruitment triggers
  // checkRecruitmentTrigger(STATE, en.apoc);
}

// ── Cooldowns ────────────────────────────────────────────────

function updateCooldowns(STATE) {
  STATE.avatars.forEach(av => {
    if (av.abilityCooldown > 0) av.abilityCooldown--;
  });
}

function triggerAbility(STATE) {
  const av = STATE.avatars[STATE.selectedAbility];
  if (av.abilityCooldown > 0) return;
  av.abilityCooldown = av.activeAbility.cooldown;
  spawnAbilityBurst(STATE, av.x, av.y, av.bulletColor);
  applyAbilityEffect(STATE, av);
}

// ── Effect flash ─────────────────────────────────────────────

let effectFlashTimer = 0, effectFlashText = '', effectFlashColor = '#fff';

function showEffectFlash(text, color) {
  effectFlashTimer = 40;
  effectFlashText = text;
  effectFlashColor = color;
}

function updateEffectFlash() {
  if (effectFlashTimer <= 0) return;
  effectFlashTimer--;
  const el = document.getElementById('effectFlash');
  if (!el) return;
  el.textContent = effectFlashText;
  el.style.color = effectFlashColor;
  el.style.opacity = (effectFlashTimer / 40).toString();
  if (effectFlashTimer === 0) el.style.opacity = '0';
}
