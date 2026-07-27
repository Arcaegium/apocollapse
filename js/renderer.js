// ============================================================
// RENDERER — all canvas draw calls
// World coordinates → screen: subtract CAM.x / CAM.y
// ============================================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Shorthand: world to screen
function ws(wx) { return wx - CAM.x; }
function hs(wy) { return wy - CAM.y; }

function render(STATE) {
  drawTerrain(ctx);           // terrain handles its own camera offset
  drawParticlesLayer(STATE);
  drawAbilityRings(STATE);
  drawBulletsLayer(STATE);
  drawDyingEnemies(STATE);
  drawEnemies(STATE);
  drawAvatars(STATE);
  drawMC(STATE);
  drawScreenFlash(STATE);
}

// ── Particles ─────────────────────────────────────────────────

function drawParticlesLayer(STATE) {
  STATE.particles.forEach(p => {
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.fillStyle = p.color;
    // Particles stored in world coords
    ctx.fillRect(ws(p.x) - p.size / 2, hs(p.y) - p.size / 2, p.size, p.size);
  });
  ctx.globalAlpha = 1;
}

// ── Ability cast feedback ───────────────────────────────────────

function drawAbilityRings(STATE) {
  STATE.abilityRings.forEach(r => {
    const t = r.life / r.maxLife; // 1 -> 0
    const grow = 1 + (1 - t) * 0.3;
    ctx.globalAlpha = t * 0.8;
    ctx.strokeStyle = r.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ws(r.x), hs(r.y), r.radius * grow, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.globalAlpha = 1;
}

function drawScreenFlash(STATE) {
  const f = STATE.screenFlash;
  if (!f) return;
  ctx.globalAlpha = (f.life / f.maxLife) * 0.35;
  ctx.fillStyle = f.color;
  ctx.fillRect(0, 0, C.W, C.H);
  ctx.globalAlpha = 1;
}

// ── Bullets ───────────────────────────────────────────────────

function drawBulletsLayer(STATE) {
  STATE.bullets.forEach(b => {
    const alpha = Math.min(1, b.life / Math.min(b.maxLife, 15));
    ctx.globalAlpha = alpha * 0.92;
    const sx = ws(b.x), sy = hs(b.y);
    ctx.fillStyle = b.color;
    ctx.fillRect(sx - b.size / 2, sy - b.size / 2, b.size, b.size);
    ctx.fillStyle = '#fff';
    ctx.fillRect(sx - 1, sy - 1, 2, 2);
  });
  ctx.globalAlpha = 1;
}

// ── Sprite rendering ──────────────────────────────────────────

// Draws sprite at SCREEN position (already converted from world)
function drawSpriteAt(key, sx, sy, opts = {}) {
  const oc = SCACHE[key];
  if (!oc) return;
  const P = C.PIXEL, sz = C.SPRITE_SIZE * P;
  const rot       = opts.rotation  ?? 0;
  const scale     = opts.scale     ?? 1;
  const flash     = opts.flash     ?? false;
  const animPhase = opts.animPhase ?? 0;

  ctx.save();
  ctx.translate(Math.round(sx), Math.round(sy));
  if (rot)       ctx.rotate(rot);
  if (scale !== 1) ctx.scale(scale, scale);

  if (flash) {
    ctx.globalAlpha = 0.75;
    ctx.drawImage(oc, -sz / 2, -sz / 2);
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = '#ff4422';
    ctx.fillRect(-sz / 2, -sz / 2, sz, sz);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  } else {
    const bodyH  = Math.round(sz * 0.72);
    const legSrcY = bodyH, legH = sz - bodyH, halfW = sz / 2;
    const leftStep  = Math.round(Math.sin(animPhase) * 3);
    const rightStep = Math.round(Math.sin(animPhase + Math.PI) * 3);

    ctx.drawImage(oc, 0, 0, sz, bodyH, -sz/2, -sz/2, sz, bodyH);
    ctx.drawImage(oc,    0, legSrcY, halfW, legH, -sz/2, -sz/2 + legSrcY + leftStep,  halfW, legH);
    ctx.drawImage(oc, halfW, legSrcY, halfW, legH,     0, -sz/2 + legSrcY + rightStep, halfW, legH);
  }
  ctx.restore();
}

// ── Enemies ───────────────────────────────────────────────────

function drawDyingEnemies(STATE) {
  STATE.dyingEnemies.forEach(de => {
    drawSpriteAt(de.sprite, ws(de.x), hs(de.y), {
      rotation: de.rotation, scale: de.scale, animPhase: de.frame * 0.3,
    });
  });
}

function drawEnemies(STATE) {
  STATE.enemies.forEach(en => {
    const sx = ws(en.x), sy = hs(en.y);

    // Skip if off screen (with generous margin)
    if (sx < -40 || sx > C.W + 40 || sy < -40 || sy > C.H + 40) return;

    drawSpriteAt(en.sprite, sx, sy, {
      flash: en.flashTimer > 0,
      animPhase: en.animPhase,
    });

    // Status effect indicator — stays up for the whole effect duration
    if (en.stunTimer > 0) {
      ctx.strokeStyle = '#44ccff'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(sx, sy, 14, 0, Math.PI * 2); ctx.stroke();
    } else if (en.confuseTimer > 0) {
      ctx.strokeStyle = '#ff66ff'; ctx.lineWidth = 1.5; ctx.setLineDash([2, 2]);
      ctx.beginPath(); ctx.arc(sx, sy, 14, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
    } else if (en.slowTimer > 0) {
      ctx.strokeStyle = '#88ff44'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(sx, sy, 14, 0, Math.PI * 2); ctx.stroke();
    }

    // HP bar
    if (en.hp < en.maxHp) {
      const bw = 24, bh = 3, bx = sx - bw / 2, by = sy - 22;
      ctx.fillStyle = '#220000'; ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = '#ff4422'; ctx.fillRect(bx, by, bw * (en.hp / en.maxHp), bh);
    }

    // Demon charge warning
    if (en.behaviorType === 'demon' && en.behaviorState === 'charge') {
      ctx.strokeStyle = '#ff440055'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(sx, sy, 16, 0, Math.PI * 2); ctx.stroke();
    }
  });
}

// ── Avatars ───────────────────────────────────────────────────

function drawAvatars(STATE) {
  const f  = STATE.formation;
  const fsx = ws(f.x), fsy = hs(f.y);

  // Formation connector lines (screen coords)
  ctx.strokeStyle = '#162016'; ctx.lineWidth = 0.5; ctx.setLineDash([3, 7]);
  for (let i = 0; i < STATE.avatars.length; i++) {
    const a = STATE.avatars[i], b = STATE.avatars[(i + 1) % STATE.avatars.length];
    ctx.beginPath();
    ctx.moveTo(ws(a.x), hs(a.y));
    ctx.lineTo(ws(b.x), hs(b.y));
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Aim line — formation center to mouse (both screen coords)
  ctx.strokeStyle = '#1a2a1a'; ctx.lineWidth = 0.5; ctx.setLineDash([4, 10]);
  ctx.beginPath(); ctx.moveTo(fsx, fsy); ctx.lineTo(mouseX, mouseY); ctx.stroke();
  ctx.setLineDash([]);

  STATE.avatars.forEach((av, i) => {
    const recoilDX = av.recoilTimer > 0 ? -Math.cos(av.angle) * 3 : 0;
    const recoilDY = av.recoilTimer > 0 ? -Math.sin(av.angle) * 3 : 0;
    const sx = ws(av.x) + recoilDX;
    const sy = hs(av.y) + recoilDY;

    drawSpriteAt(av.sprite, sx, sy, { animPhase: av.animPhase });

    // Selected ability ring
    if (i === STATE.selectedAbility) {
      ctx.strokeStyle = av.bulletColor + 'cc'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(ws(av.x), hs(av.y), 23, 0, Math.PI * 2); ctx.stroke();

      // Cooldown arc
      if (av.abilityCooldown > 0) {
        const pct = 1 - (av.abilityCooldown / av.activeAbility.cooldown);
        ctx.strokeStyle = av.bulletColor + '88'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ws(av.x), hs(av.y), 23, -Math.PI/2, -Math.PI/2 + pct * Math.PI * 2);
        ctx.stroke();
      }
    }

    // Name label
    ctx.fillStyle = i === STATE.selectedAbility ? av.bulletColor : av.bulletColor + '66';
    ctx.font = '9px "Share Tech Mono"'; ctx.textAlign = 'center';
    ctx.fillText(av.shortName, ws(av.x), hs(av.y) + 26);
  });
}

// ── MC ────────────────────────────────────────────────────────
// The protagonist, at formation center. Only entity with HP/collision.

function drawMC(STATE) {
  const mc = STATE.mc;
  const f = STATE.formation;
  const sx = ws(f.x), sy = hs(f.y);

  // Shield aura — pulses gently while the barrier holds
  if (mc.shieldHp > 0) {
    ctx.strokeStyle = '#5ec9e0';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.55 + Math.sin(STATE.frame * 0.2) * 0.2;
    ctx.beginPath(); ctx.arc(sx, sy, 20, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Invulnerability — blink instead of the red hit-flash (that means something else)
  const invuln = mc.invulnTimer > 0;
  if (invuln) ctx.globalAlpha = (Math.floor(STATE.frame / 4) % 2 === 0) ? 1 : 0.35;

  drawSpriteAt('mc', sx, sy, { animPhase: mc.animPhase });

  if (invuln) ctx.globalAlpha = 1;

  // HP bar — the one stat that ends the run
  const bw = 30, bh = 4, bx = sx - bw / 2, by = sy - 26;
  ctx.fillStyle = '#220000'; ctx.fillRect(bx, by, bw, bh);
  const pct = Math.max(0, mc.hp / mc.maxHp);
  ctx.fillStyle = pct > 0.3 ? '#44dd66' : '#ff4422';
  ctx.fillRect(bx, by, bw * pct, bh);
}

// ── Ability bar ───────────────────────────────────────────────

function buildAbilityBar(STATE) {
  const bar = document.getElementById('abilityBar');
  if (!bar) return;
  bar.innerHTML = STATE.avatars.map((av, i) => `
    <div class="ability-slot ${i === STATE.selectedAbility ? 'selected' : ''}" id="aslot${i}" style="--sc:${av.bulletColor}">
      <div class="slot-num ${i === STATE.selectedAbility ? 'sel' : ''}">${i + 1}</div>
      <div class="slot-name ${i === STATE.selectedAbility ? 'sel' : ''}">${av.shortName}</div>
      <div class="slot-ability ${i === STATE.selectedAbility ? 'sel' : ''}">${av.activeAbility.name}</div>
      <div class="slot-skills ${i === STATE.selectedAbility ? 'sel' : ''}" id="askills${i}"></div>
      <div class="slot-cdtrack"></div>
      <div class="slot-cdfill" id="acd${i}" style="width:100%"></div>
    </div>
  `).join('');
}

function updateAbilityBar(STATE) {
  STATE.avatars.forEach((av, i) => {
    const slot   = document.getElementById(`aslot${i}`);
    const cd     = document.getElementById(`acd${i}`);
    const skills = document.getElementById(`askills${i}`);
    if (!slot || !cd) return;
    const sel = i === STATE.selectedAbility;
    slot.className = `ability-slot${sel ? ' selected' : ''}`;
    const pct = av.abilityCooldown > 0
      ? (1 - av.abilityCooldown / av.activeAbility.cooldown) * 100 : 100;
    cd.style.width = pct + '%';
    slot.querySelectorAll('.slot-num,.slot-name,.slot-ability,.slot-skills').forEach(el => {
      el.className = el.className.replace(/ sel/g, '') + (sel ? ' sel' : '');
    });
    if (skills) {
      skills.textContent = av.skills.map(s =>
        `${SKILL_DEFS[s.id]?.name ?? s.id} ${s.level}`
      ).join(' · ') || '';
    }
  });
}
