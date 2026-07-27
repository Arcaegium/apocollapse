// ============================================================
// BREAK SCREEN
// Sequential per-avatar draft picks between waves
// ============================================================

let breakAvatarIndex = 0;
let breakSelectedCard = null;
let breakDraftOptions = [];

function hideBreakScreen() {
  document.getElementById('screenBreak').style.display = 'none';
}

function showAvatarDraft(STATE, avatarIdx) {
  const av = STATE.avatars[avatarIdx];
  const el = document.getElementById('screenBreak');
  breakSelectedCard = null;

  // Build draft options
  breakDraftOptions = buildDraftPool(av);

  // Check if this avatar has skill slots and eligible skills
  const canDraft = breakDraftOptions.length > 0 && av.skills.length < C.MAX_SKILL_SLOTS;

  el.innerHTML = `
    <div class="break-avatar-header" style="--ac:${av.bulletColor}">
      <div>
        <div class="break-avatar-name" style="color:${av.bulletColor}">${av.name}</div>
        <div class="break-avatar-sub">${getApoc(av.focus).name} specialist &nbsp;·&nbsp; ${WEAPONS[av.weapon].name}</div>
      </div>
      <div class="break-avatar-skills">
        ${Array.from({length: C.MAX_SKILL_SLOTS}, (_, i) => {
          const skill = av.skills[i];
          return `<div class="skill-pip ${skill ? 'filled' : ''}" style="--ac:${av.bulletColor}" title="${skill ? SKILL_DEFS[skill.id].name + ' Lv' + skill.level : 'empty'}"></div>`;
        }).join('')}
      </div>
    </div>

    ${av.skills.length > 0 ? `
      <div style="width:100%;margin-bottom:12px;display:flex;gap:8px;flex-wrap:wrap">
        ${av.skills.map(s => `
          <span style="font-size:10px;color:#666;border:1px solid #222;padding:2px 8px;border-radius:2px">
            ${SKILL_DEFS[s.id].name} <span style="color:${av.bulletColor}">Lv${s.level}</span>
          </span>
        `).join('')}
      </div>
    ` : ''}

    ${canDraft ? `
      <div style="font-size:11px;color:#555;margin-bottom:12px;letter-spacing:.06em;text-transform:uppercase">
        Choose a skill upgrade
      </div>
      <div class="draft-options" style="--ac:${av.bulletColor}">
        ${breakDraftOptions.map((opt, i) => `
          <div class="draft-card" id="draftCard${i}" onclick="selectDraftCard(${i})" style="--ac:${av.bulletColor}">
            <div class="draft-skill-name">${opt.def.name}</div>
            <div class="draft-skill-level" style="color:${av.bulletColor}">
              ${opt.currentLevel === 0 ? 'NEW SKILL' : `UPGRADE → LV ${opt.currentLevel + 1}`}
            </div>
            <div class="draft-skill-desc">${opt.def.levelDescs[opt.currentLevel]}</div>
            <div class="draft-skill-tags">
              ${opt.def.tags.map(t => `<span class="skill-tag">${t}</span>`).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    ` : `
      <div style="font-size:12px;color:#444;margin-bottom:16px;text-align:center">
        ${av.skills.length >= C.MAX_SKILL_SLOTS ? 'Skill slots full — no new skills available' : 'All skills maxed out'}
      </div>
    `}

    <div class="break-footer">
      <div class="break-progress" style="color:#555">
        Wave ${STATE.wave} complete &nbsp;·&nbsp; Avatar ${avatarIdx + 1} of ${STATE.avatars.length}
      </div>
      <div style="display:flex;gap:8px">
        ${canDraft ? `<button class="secondary" onclick="skipDraft(${STATE.wave})">Skip</button>` : ''}
        <button id="breakNextBtn" onclick="advanceBreakScreen()" ${canDraft && !breakSelectedCard ? 'disabled style="opacity:.4"' : ''}>
          ${avatarIdx < STATE.avatars.length - 1 ? 'Next Avatar →' : 'Deploy →'}
        </button>
      </div>
    </div>
  `;

  // If no draft available, enable next button immediately
  if (!canDraft) {
    const btn = document.getElementById('breakNextBtn');
    if (btn) btn.removeAttribute('disabled');
  }
}

function selectDraftCard(idx) {
  breakSelectedCard = idx;
  // Update card visuals
  document.querySelectorAll('.draft-card').forEach((card, i) => {
    card.classList.toggle('selected-card', i === idx);
  });
  // Enable next button
  const btn = document.getElementById('breakNextBtn');
  if (btn) { btn.removeAttribute('disabled'); btn.style.opacity = '1'; }
}

function skipDraft(wave) {
  breakSelectedCard = null;
  advanceBreakScreen();
}

// Called when player clicks Next/Deploy
function advanceBreakScreen() {
  // This function needs STATE — we store it on window during break
  const STATE = window._breakState;
  if (!STATE) return;

  // Apply selected skill if any
  if (breakSelectedCard !== null && breakDraftOptions[breakSelectedCard]) {
    const av = STATE.avatars[breakAvatarIndex];
    applySkill(av, breakDraftOptions[breakSelectedCard].skillId);
  }

  breakAvatarIndex++;

  if (breakAvatarIndex < STATE.avatars.length) {
    showAvatarDraft(STATE, breakAvatarIndex);
  } else {
    // All avatars drafted — start next wave
    hideBreakScreen();
    window._breakState = null;
    startNextWave(STATE);
    resumeGame(STATE);
  }
}
