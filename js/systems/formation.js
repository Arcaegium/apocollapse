// ============================================================
// FORMATION SYSTEM
// Movement in world coordinates, camera tracking
// ============================================================

// mouseX/Y are in SCREEN coordinates — converted to world for aiming
let mouseX = 320, mouseY = 320;

function setupMouseTracking() {
  const canvas = document.getElementById('gameCanvas');
  canvas.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    // Canvas may be visually scaled (CSS transform) to fit the viewport —
    // convert client coords back to the canvas's internal 640x640 space.
    mouseX = (e.clientX - r.left) * (canvas.width / r.width);
    mouseY = (e.clientY - r.top) * (canvas.height / r.height);
  });
}

// World coords of mouse (for aiming)
function mouseWorldX() { return mouseX + CAM.x; }
function mouseWorldY() { return mouseY + CAM.y; }

function updateFormation(STATE) {
  const f = STATE.formation;
  const keys = STATE.keys;

  // WASD — move in world space
  let dx = 0, dy = 0;
  if (keys['w'] || keys['W']) dy -= C.PLAYER_SPEED;
  if (keys['s'] || keys['S']) dy += C.PLAYER_SPEED;
  if (keys['a'] || keys['A']) dx -= C.PLAYER_SPEED;
  if (keys['d'] || keys['D']) dx += C.PLAYER_SPEED;
  if (dx && dy) { dx *= 0.707; dy *= 0.707; }

  // Resolve movement against terrain in world coords
  if (dx !== 0 || dy !== 0) {
    const resolved = resolveMovement(f.x, f.y, dx, dy);
    f.x = resolved.x;
    f.y = resolved.y;
  }

  // Clamp to world bounds
  const PAD = C.TILE * 1.5;
  f.x = Math.max(PAD, Math.min(C.WORLD_W - PAD, f.x));
  f.y = Math.max(PAD, Math.min(C.WORLD_H - PAD, f.y));

  // Update camera to follow formation
  updateCamera(f.x, f.y);

  // Rotation tracks mouse — in world space
  const mwx = mouseWorldX(), mwy = mouseWorldY();
  const targetRot = Math.atan2(mwy - f.y, mwx - f.x);
  let diff = targetRot - f.rotation;
  while (diff >  Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  f.rotation += diff * C.ROTATION_SPEED;

  // Avatar positions in world space, aim toward mouse world pos
  const isMoving = dx !== 0 || dy !== 0;
  STATE.avatars.forEach((av, i) => {
    const slotAngle = SLOT_ANGLES[i] + f.rotation;
    av.x = f.x + Math.cos(slotAngle) * C.FORMATION_RADIUS;
    av.y = f.y + Math.sin(slotAngle) * C.FORMATION_RADIUS;
    av.angle = Math.atan2(mwy - av.y, mwx - av.x);
    if (isMoving) av.animPhase += 0.18;
    if (av.recoilTimer > 0) av.recoilTimer--;
  });
}
