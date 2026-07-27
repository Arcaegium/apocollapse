// ============================================================
// TERRAIN SYSTEM
// World-scale tile map with structured scene generation.
// Camera offsets all rendering — world coords != screen coords.
// Change C.WORLD_TILES in constants.js to resize the world.
// ============================================================

// Tile type constants
const TILE = {
  FLOOR:  0,
  WALL:   1,
  COVER:  2,   // impassable to enemies, bullets pass through
  HAZARD: 3,   // walkable, applies periodic effect
  ROAD:   4,   // always clear — road surface
};

// World tile map — flat array [y * WORLD_TILES + x]
let tileMap = [];
let worldTilesX = 0;
let worldTilesY = 0;

// ── Camera ───────────────────────────────────────────────────
// Camera tracks formation center, clamped to world bounds
const CAM = { x: 0, y: 0 };

function updateCamera(formationX, formationY) {
  // Center camera on formation, clamp to world edges
  CAM.x = Math.round(
    Math.max(C.W / 2, Math.min(C.WORLD_W - C.W / 2, formationX)) - C.W / 2
  );
  CAM.y = Math.round(
    Math.max(C.H / 2, Math.min(C.WORLD_H - C.H / 2, formationY)) - C.H / 2
  );
}

// Convert world coords to screen coords
function worldToScreen(wx, wy) {
  return { sx: wx - CAM.x, sy: wy - CAM.y };
}

// Convert screen coords to world coords
function screenToWorld(sx, sy) {
  return { wx: sx + CAM.x, wy: sy + CAM.y };
}

// ── Tile map access ──────────────────────────────────────────

function initTileMap() {
  worldTilesX = C.WORLD_TILES;
  worldTilesY = C.WORLD_TILES;
  tileMap = new Array(worldTilesX * worldTilesY)
    .fill(null)
    .map(() => ({ type: TILE.FLOOR, apoc: null, kitIndex: 0 }));
}

function getTileAt(tx, ty) {
  if (tx < 0 || ty < 0 || tx >= worldTilesX || ty >= worldTilesY) {
    return { type: TILE.WALL }; // out of bounds = wall
  }
  return tileMap[ty * worldTilesX + tx];
}

function setTileAt(tx, ty, type, apoc, kitIndex) {
  if (tx < 0 || ty < 0 || tx >= worldTilesX || ty >= worldTilesY) return;
  tileMap[ty * worldTilesX + tx] = { type, apoc: apoc ?? null, kitIndex: kitIndex ?? 0 };
}

// World position → tile coords
function worldToTile(wx, wy) {
  return {
    tx: Math.floor(wx / C.TILE),
    ty: Math.floor(wy / C.TILE),
  };
}

// ── Walkability ───────────────────────────────────────────────

function isWalkable(wx, wy) {
  const { tx, ty } = worldToTile(wx, wy);
  const tile = getTileAt(tx, ty);
  return tile.type === TILE.FLOOR ||
         tile.type === TILE.HAZARD ||
         tile.type === TILE.ROAD;
}

function isBulletPassable(wx, wy) {
  const { tx, ty } = worldToTile(wx, wy);
  const tile = getTileAt(tx, ty);
  return tile.type !== TILE.WALL; // bullets blocked by walls only
}

function getHazardAt(wx, wy) {
  const { tx, ty } = worldToTile(wx, wy);
  const tile = getTileAt(tx, ty);
  if (tile.type !== TILE.HAZARD || !tile.apoc) return null;
  const apocData = getApoc(tile.apoc);
  return apocData.terrain.hazards[tile.kitIndex] ?? null;
}

// Slide movement — try full move, then X-only, then Y-only
function resolveMovement(x, y, dx, dy) {
  const nx = x + dx, ny = y + dy;
  if (isWalkable(nx, ny)) return { x: nx, y: ny };
  if (isWalkable(nx, y))  return { x: nx, y };
  if (isWalkable(x, ny))  return { x, y: ny };
  return { x, y };
}

// ── Map generation ────────────────────────────────────────────
// Scene-based: lay roads first, then place building footprints
// between roads, then scatter cover and hazards in open areas.

function generateMap(activeApocs) {
  initTileMap();

  const WT = worldTilesX;
  const spawnTX = Math.floor(WT / 2);
  const spawnTY = Math.floor(worldTilesY / 2);

  // Step 1 — Border walls
  for (let x = 0; x < WT; x++) {
    setTileAt(x, 0, TILE.WALL, activeApocs[0], 0);
    setTileAt(x, worldTilesY - 1, TILE.WALL, activeApocs[0], 0);
  }
  for (let y = 0; y < worldTilesY; y++) {
    setTileAt(0, y, TILE.WALL, activeApocs[0], 0);
    setTileAt(WT - 1, y, TILE.WALL, activeApocs[0], 0);
  }

  // Step 2 — Road grid
  // Lay horizontal and vertical roads on a grid pattern
  const roadSpacing = 10; // tiles between road centerlines
  const roadWidth   = C.ROAD_WIDTH;

  for (let ty = 1; ty < worldTilesY - 1; ty++) {
    if (ty % roadSpacing < roadWidth) {
      for (let tx = 1; tx < WT - 1; tx++) {
        setTileAt(tx, ty, TILE.ROAD, null, 0);
      }
    }
  }
  for (let tx = 1; tx < WT - 1; tx++) {
    if (tx % roadSpacing < roadWidth) {
      for (let ty = 1; ty < worldTilesY - 1; ty++) {
        setTileAt(tx, ty, TILE.ROAD, null, 0);
      }
    }
  }

  // Step 3 — Building footprints in the blocks between roads
  // A "block" is the space between two roads
  const extra = Math.max(0, activeApocs.length - 1);
  const buildingTarget = Math.floor(
    WT * worldTilesY * (C.BUILDING_COVERAGE + extra * C.COVERAGE_PER_APOC)
  );

  let buildingsFilled = 0;
  let attempts = 0;
  const maxAttempts = 400;

  while (buildingsFilled < buildingTarget && attempts < maxAttempts) {
    attempts++;

    const apocKey = activeApocs[Math.floor(Math.random() * activeApocs.length)];
    const apocData = getApoc(apocKey);
    const kitIdx = Math.floor(Math.random() * apocData.terrain.walls.length);

    // Random building size
    const bw = C.BUILDING_MIN + Math.floor(Math.random() * (C.BUILDING_MAX - C.BUILDING_MIN + 1));
    const bh = C.BUILDING_MIN + Math.floor(Math.random() * (C.BUILDING_MAX - C.BUILDING_MIN + 1));

    // Random position (stay off borders)
    const bx = 1 + Math.floor(Math.random() * (WT - bw - 2));
    const by = 1 + Math.floor(Math.random() * (worldTilesY - bh - 2));

    // Don't place on roads or spawn clear zone
    let valid = true;
    for (let dy = 0; dy < bh && valid; dy++) {
      for (let dx = 0; dx < bw && valid; dx++) {
        const tx = bx + dx, ty = by + dy;
        const tile = getTileAt(tx, ty);
        if (tile.type === TILE.ROAD || tile.type === TILE.WALL) { valid = false; break; }
        // Clear zone around spawn
        const distX = Math.abs(tx - spawnTX), distY = Math.abs(ty - spawnTY);
        if (distX < C.CLEAR_RADIUS && distY < C.CLEAR_RADIUS) { valid = false; break; }
      }
    }
    if (!valid) continue;

    // Place building — walls on perimeter, floor inside (hollow building)
    for (let dy = 0; dy < bh; dy++) {
      for (let dx = 0; dx < bw; dx++) {
        const tx = bx + dx, ty = by + dy;
        const isPerimeter = dx === 0 || dy === 0 || dx === bw - 1 || dy === bh - 1;
        if (isPerimeter) {
          setTileAt(tx, ty, TILE.WALL, apocKey, kitIdx);
          buildingsFilled++;
        }
        // Interior stays floor — players and enemies can enter through door gaps
      }
    }

    // Add a door gap — open one tile on each long side
    const doorSideH = by + Math.floor(Math.random() * (bh - 2)) + 1;
    const doorSideV = bx + Math.floor(Math.random() * (bw - 2)) + 1;
    setTileAt(bx,        doorSideH, TILE.FLOOR, null, 0); // left door
    setTileAt(bx + bw - 1, doorSideH, TILE.FLOOR, null, 0); // right door
    setTileAt(doorSideV, by,         TILE.FLOOR, null, 0); // top door
    setTileAt(doorSideV, by + bh - 1, TILE.FLOOR, null, 0); // bottom door
  }

  // Step 4 — Cover objects in open floor areas
  const coverTarget = Math.floor(
    WT * worldTilesY * (C.COVER_COVERAGE + extra * C.COVERAGE_PER_APOC * 0.5)
  );
  placeScattered(TILE.COVER, coverTarget, activeApocs, spawnTX, spawnTY, C.CLEAR_RADIUS + 2,
    (apocKey) => getApoc(apocKey).terrain.covers.length);

  // Step 5 — Hazard tiles in open floor areas
  const hazardTarget = Math.floor(
    WT * worldTilesY * (C.HAZARD_COVERAGE + extra * C.COVERAGE_PER_APOC * 0.5)
  );
  placeScattered(TILE.HAZARD, hazardTarget, activeApocs, spawnTX, spawnTY, C.CLEAR_RADIUS,
    (apocKey) => getApoc(apocKey).terrain.hazards.length);
}

function placeScattered(tileType, target, activeApocs, spawnTX, spawnTY, clearR, kitLenFn) {
  let placed = 0, attempts = 0;
  while (placed < target && attempts < target * 6) {
    attempts++;
    const tx = 1 + Math.floor(Math.random() * (worldTilesX - 2));
    const ty = 1 + Math.floor(Math.random() * (worldTilesY - 2));
    const tile = getTileAt(tx, ty);
    if (tile.type !== TILE.FLOOR) continue;
    const distX = Math.abs(tx - spawnTX), distY = Math.abs(ty - spawnTY);
    if (distX < clearR && distY < clearR) continue;
    const apocKey = activeApocs[Math.floor(Math.random() * activeApocs.length)];
    const kitIdx = Math.floor(Math.random() * kitLenFn(apocKey));
    setTileAt(tx, ty, tileType, apocKey, kitIdx);
    placed++;
  }
}

// ── Rendering ─────────────────────────────────────────────────
// Only renders tiles visible in the current camera viewport

function drawTerrain(ctx) {
  const T = C.TILE;

  // First visible tile
  const startTX = Math.max(0, Math.floor(CAM.x / T) - 1);
  const startTY = Math.max(0, Math.floor(CAM.y / T) - 1);
  const endTX   = Math.min(worldTilesX - 1, startTX + Math.ceil(C.W / T) + 2);
  const endTY   = Math.min(worldTilesY - 1, startTY + Math.ceil(C.H / T) + 2);

  for (let ty = startTY; ty <= endTY; ty++) {
    for (let tx = startTX; tx <= endTX; tx++) {
      const tile = getTileAt(tx, ty);
      const apocData = tile.apoc ? getApoc(tile.apoc) : null;

      // Screen position of this tile
      const sx = tx * T - CAM.x;
      const sy = ty * T - CAM.y;

      drawTile(ctx, tile, apocData, sx, sy, T, tx, ty);
    }
  }

  // Subtle grid overlay
  ctx.strokeStyle = 'rgba(255,255,255,0.018)';
  ctx.lineWidth = 0.5;
  const offX = -(CAM.x % T);
  const offY = -(CAM.y % T);
  for (let x = offX; x <= C.W + T; x += T) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, C.H); ctx.stroke();
  }
  for (let y = offY; y <= C.H + T; y += T) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(C.W, y); ctx.stroke();
  }
}

function drawTile(ctx, tile, apocData, sx, sy, T, tx, ty) {
  const now = Date.now();

  switch (tile.type) {

    case TILE.FLOOR: {
      ctx.fillStyle = '#141414';
      ctx.fillRect(sx, sy, T, T);
      // Subtle detail — every 3rd tile gets a tiny dot
      if ((tx + ty) % 3 === 0) {
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(sx + 2, sy + 2, 2, 2);
      }
      break;
    }

    case TILE.ROAD: {
      // Road surface — slightly lighter, lane markings
      ctx.fillStyle = '#1c1c1c';
      ctx.fillRect(sx, sy, T, T);
      // Dashed center line on every 4th tile
      if ((tx + ty) % 4 === 0) {
        ctx.fillStyle = '#2a2a22';
        ctx.fillRect(sx + T/2 - 1, sy + 2, 2, T - 4);
      }
      break;
    }

    case TILE.WALL: {
      const kit = apocData?.terrain.walls[tile.kitIndex];
      const col = kit?.color ?? '#1e1e1e';
      const acc = kit?.accent ?? '#2a2a2a';
      ctx.fillStyle = col;
      ctx.fillRect(sx, sy, T, T);
      // Top and left accent edges — gives 3D block feel
      ctx.fillStyle = acc;
      ctx.fillRect(sx, sy, T, 3);
      ctx.fillRect(sx, sy, 3, T);
      // Darker bottom-right shadow
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(sx, sy + T - 3, T, 3);
      ctx.fillRect(sx + T - 3, sy, 3, T);
      // Bright full-perimeter rim — theme-independent "this is solid" cue,
      // since apoc wall palettes can be nearly as dark as the floor
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(sx + 1, sy + 1, T - 2, T - 2);
      break;
    }

    case TILE.COVER: {
      const kit = apocData?.terrain.covers[tile.kitIndex];
      const col = kit?.color ?? '#1a1a20';
      const acc = kit?.accent ?? '#252530';
      // Floor beneath
      ctx.fillStyle = '#141414';
      ctx.fillRect(sx, sy, T, T);
      // Cover object — inset rectangle, shorter than a wall
      ctx.fillStyle = col;
      ctx.fillRect(sx + 3, sy + 5, T - 6, T - 7);
      ctx.fillStyle = acc;
      ctx.fillRect(sx + 3, sy + 5, T - 6, 2);
      ctx.fillRect(sx + 3, sy + 5, 2, T - 7);
      // Cover also blocks movement (bullets pass, players/enemies don't) —
      // give it the same bright rim as walls so that's clear at a glance
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(sx + 3.5, sy + 5.5, T - 7, T - 8);
      break;
    }

    case TILE.HAZARD: {
      const kit = apocData?.terrain.hazards[tile.kitIndex];
      const col  = kit?.color     ?? '#141414';
      const glow = kit?.glowColor ?? '#333333';
      ctx.fillStyle = col;
      ctx.fillRect(sx, sy, T, T);
      // Pulsing glow
      const pulse = 0.25 + Math.sin((now / 700) + tx * 0.4 + ty * 0.3) * 0.15;
      ctx.fillStyle = glow;
      ctx.globalAlpha = pulse * 0.45;
      ctx.fillRect(sx + 4, sy + 4, T - 8, T - 8);
      ctx.globalAlpha = 1;
      break;
    }
  }
}
