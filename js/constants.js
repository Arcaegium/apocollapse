// ============================================================
// CONSTANTS — all tuning values live here
// Change a number here, nothing else needs to touch it
// ============================================================
const C = {
  // Canvas — viewport, never changes
  W: 640, H: 640,

  // Tile size
  TILE: 32,

  // ── WORLD SIZE — change these two to resize the world ──
  // World is WORLD_TILES × WORLD_TILES tiles
  // 80×80 = 2560×2560px world. Try 60 for smaller, 100 for larger.
  WORLD_TILES: 80,

  // Derived — computed below, don't edit directly
  get WORLD_W() { return this.WORLD_TILES * this.TILE; },
  get WORLD_H() { return this.WORLD_TILES * this.TILE; },

  // Viewport in tiles (always canvas size / tile size)
  get TILES_X() { return Math.ceil(this.W / this.TILE) + 2; }, // +2 for overdraw buffer
  get TILES_Y() { return Math.ceil(this.H / this.TILE) + 2; },

  // Formation
  FORMATION_RADIUS: 40,
  ROTATION_SPEED: 0.10,
  PLAYER_SPEED: 2.8,
  PLAYER_COLLISION_R: 14,

  // Combat
  BULLET_BASE_DAMAGE: 1.0,
  ENEMY_BASE_SPEED: 0.9,
  ENEMY_BASE_HP: 3,
  ENEMY_COLLISION_R: 12,
  KILL_RADIUS: 18,

  // Sprites
  PIXEL: 2,
  SPRITE_SIZE: 16,

  // Spawn — enemies spawn this many world-px from formation
  MAX_ENEMIES: 90,
  SPAWN_RADIUS_MIN: 340,   // don't spawn too close
  SPAWN_RADIUS_MAX: 480,   // don't spawn too far off screen
  SPAWN_RATE_BASE: 85,
  SPAWN_RATE_MIN: 22,
  SPAWN_BURST_CHANCE: 0.30,

  // Wave
  WAVE_DURATION: 1800,
  WAVE_TRANSITION: 180,

  // Death animation
  DEATH_ANIM_FRAMES: 20,

  // Skills
  MAX_SKILL_SLOTS: 4,
  MAX_SKILL_LEVEL: 3,
  DRAFT_OPTIONS: 3,
  CROSS_TRAIN_CHANCE: 0.15,

  // Active abilities — all distances/durations in world units & frames,
  // same coordinate system as everything else (not screen pixels)
  ABILITY_RADIUS: 160,       // base AoE radius for Rex/Yara
  ABILITY_SLOW_MULT: 0.45,   // Rex — enemy speed multiplier while slowed
  ABILITY_KNOCKBACK: 90,     // Gage — push distance

  // Progression
  SAVE_KEY: 'apocollapse-save',

  // Hazard
  HAZARD_TICK_FRAMES: 60,

  // Terrain generation — scene-based
  // Densities are per-scene, not global
  BUILDING_COVERAGE: 0.22,  // fraction of world that is building footprint
  COVER_COVERAGE:    0.06,  // fraction that is cover objects
  HAZARD_COVERAGE:   0.04,  // fraction that is hazard tiles
  COVERAGE_PER_APOC: 0.02,  // additional coverage per extra active apocalypse

  // Scene piece sizes (in tiles)
  BUILDING_MIN: 3,   // min building footprint dimension
  BUILDING_MAX: 8,   // max building footprint dimension
  ROAD_WIDTH: 3,     // width of road corridors in tiles
  CLEAR_RADIUS: 5,   // tiles kept clear around spawn point
};
