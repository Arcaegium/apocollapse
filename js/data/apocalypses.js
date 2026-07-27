// ============================================================
// APOCALYPSE TYPES + TERRAIN KITS
// Adding a new apocalypse: add one entry here. Nothing else changes.
// ============================================================

const APOCALYPSE_DATA = {

  zombie: {
    name: 'ZOMBIE OUTBREAK',
    color: '#2d4a22', textColor: '#9fe87a',
    enemyType: 'zombie',
    speedMult: 1.0, hpMult: 1.0,

    terrain: {
      // Floor visual — base tile appearance
      floorColor: '#1a1a14',
      floorDetail: '#1e1e18',   // crack/stain color

      // Wall kit — what walls look like in this apocalypse
      walls: [
        { label: 'barricade',    color: '#3a2a18', accent: '#5a3a22' },
        { label: 'rubble',       color: '#2a2218', accent: '#443322' },
        { label: 'overturned car', color: '#2a2a22', accent: '#3a3a30' },
      ],

      // Cover kit — partial cover objects
      covers: [
        { label: 'dumpster',     color: '#2a3a22', accent: '#334a2a' },
        { label: 'burned car',   color: '#221a14', accent: '#332211' },
      ],

      // Hazard kit — traversable danger zones
      hazards: [
        {
          label: 'corpse pool',
          color: '#1e3018',
          glowColor: '#4a7a3a',
          // STUB: effect applied when standing on this tile
          // effect: (state) => { /* apply DOT to formation */ }
          effect: null,
        },
        {
          label: 'bloodstain',
          color: '#2a1414',
          glowColor: '#882200',
          effect: null, // cosmetic only for now
        },
      ],
    },
  },

  robot: {
    name: 'ROBOT UPRISING',
    color: '#223344', textColor: '#aabbcc',
    enemyType: 'robot',
    speedMult: 0.8, hpMult: 1.5,

    terrain: {
      floorColor: '#141820',
      floorDetail: '#1a2030',

      walls: [
        { label: 'mech husk',    color: '#223344', accent: '#334455' },
        { label: 'server rack',  color: '#1a2233', accent: '#2a3344' },
        { label: 'blast door',   color: '#1e2a33', accent: '#2a3a44' },
      ],

      covers: [
        { label: 'broken drone', color: '#2a3040', accent: '#3a4050' },
        { label: 'cargo crate',  color: '#222a33', accent: '#2a3440' },
      ],

      hazards: [
        {
          label: 'tesla coil',
          color: '#1a2a44',
          glowColor: '#44aaff',
          // STUB: periodic lightning burst in radius
          effect: null,
        },
        {
          label: 'oil slick',
          color: '#181820',
          glowColor: '#334466',
          // STUB: slows formation
          effect: null,
        },
      ],
    },
  },

  alien: {
    name: 'ALIEN INVASION',
    color: '#221155', textColor: '#aa88ff',
    enemyType: 'alien',
    speedMult: 1.2, hpMult: 1.0,

    terrain: {
      floorColor: '#120e22',
      floorDetail: '#1a1430',

      walls: [
        { label: 'monolith',     color: '#1a1033', accent: '#2a1a4a' },
        { label: 'bio-growth',   color: '#0e1a22', accent: '#1a2a33' },
        { label: 'alien pod',    color: '#1a1030', accent: '#2a1844' },
      ],

      covers: [
        { label: 'crystal shard', color: '#1a1440', accent: '#2a1a55' },
        { label: 'crashed probe', color: '#181428', accent: '#28203a' },
      ],

      hazards: [
        {
          label: 'bio-field',
          color: '#0e1a1a',
          glowColor: '#00ffaa',
          // STUB: confuses formation movement
          effect: null,
        },
        {
          label: 'psionic well',
          color: '#14103a',
          glowColor: '#8855ff',
          // STUB: slows ability cooldown recovery
          effect: null,
        },
      ],
    },
  },

  demon: {
    name: 'DEMON INCURSION',
    color: '#330000', textColor: '#ff6644',
    enemyType: 'demon',
    speedMult: 1.1, hpMult: 1.2,

    terrain: {
      floorColor: '#160a0a',
      floorDetail: '#220e0e',

      walls: [
        { label: 'bone altar',   color: '#2a1414', accent: '#3a1818' },
        { label: 'hellstone',    color: '#220e0e', accent: '#331414' },
        { label: 'soul pillar',  color: '#2a1010', accent: '#440a0a' },
      ],

      covers: [
        { label: 'ritual stone', color: '#1e1010', accent: '#2a1414' },
        { label: 'demon husk',   color: '#220a0a', accent: '#331010' },
      ],

      hazards: [
        {
          label: 'sigil circle',
          color: '#220808',
          glowColor: '#ff4422',
          // STUB: empowers nearby demons
          effect: null,
        },
        {
          label: 'hellfire vent',
          color: '#2a0a0a',
          glowColor: '#ff8800',
          // STUB: DOT to formation
          effect: null,
        },
      ],
    },
  },

  eldritch: {
    name: 'ELDRITCH HORROR',
    color: '#1a0022', textColor: '#cc88ff',
    enemyType: 'eldritch',
    speedMult: 0.9, hpMult: 0.8,

    terrain: {
      floorColor: '#0e0814',
      floorDetail: '#14101e',

      walls: [
        { label: 'void mass',    color: '#1a1028', accent: '#2a1840' },
        { label: 'eye cluster',  color: '#140e22', accent: '#221433' },
        { label: 'tendril wall', color: '#180e2a', accent: '#281440' },
      ],

      covers: [
        { label: 'bone heap',    color: '#1a1422', accent: '#221a30' },
        { label: 'void stone',   color: '#100c1a', accent: '#1a1228' },
      ],

      hazards: [
        {
          label: 'madness pool',
          color: '#140c22',
          glowColor: '#cc44ff',
          // STUB: randomizes formation rotation briefly
          effect: null,
        },
        {
          label: 'void tear',
          color: '#0c0814',
          glowColor: '#00ffff',
          // STUB: teleports enemies short distance
          effect: null,
        },
      ],
    },
  },

  mutant: {
    name: 'MUTANT SURGE',
    color: '#223311', textColor: '#aacc33',
    enemyType: 'mutant',
    speedMult: 1.3, hpMult: 0.9,

    terrain: {
      floorColor: '#141a0a',
      floorDetail: '#1a2210',

      walls: [
        { label: 'mutant nest',  color: '#1e2a10', accent: '#2a3a18' },
        { label: 'toxic barrel', color: '#1a2208', accent: '#283010' },
        { label: 'overgrowth',   color: '#182210', accent: '#243018' },
      ],

      covers: [
        { label: 'acid puddle barrier', color: '#1e2a0e', accent: '#2a380e' },
        { label: 'mutant husk', color: '#1a2010', accent: '#243018' },
      ],

      hazards: [
        {
          label: 'radiation zone',
          color: '#1a2208',
          glowColor: '#aacc33',
          // STUB: DOT + slows enemies passing through
          effect: null,
        },
        {
          label: 'spore cloud',
          color: '#182210',
          glowColor: '#88aa33',
          // STUB: reduces visibility radius
          effect: null,
        },
      ],
    },
  },

  collapse: {
    name: 'SOCIETAL COLLAPSE',
    color: '#3a2200', textColor: '#d4a843',
    enemyType: 'zombie',  // uses zombie sprite for now
    speedMult: 1.1, hpMult: 1.0,

    terrain: {
      floorColor: '#1a1410',
      floorDetail: '#221a14',

      walls: [
        { label: 'shanty wall',  color: '#3a2a14', accent: '#4a3a1e' },
        { label: 'wrecked truck', color: '#2a2018', accent: '#3a3020' },
        { label: 'sandbag nest', color: '#3a3018', accent: '#4a4020' },
      ],

      covers: [
        { label: 'oil drum',     color: '#2a2010', accent: '#3a3018' },
        { label: 'scrap pile',   color: '#222018', accent: '#302e20' },
      ],

      hazards: [
        {
          label: 'fire pit',
          color: '#2a1a08',
          glowColor: '#ff8800',
          // STUB: DOT
          effect: null,
        },
        {
          label: 'razor wire',
          color: '#221a14',
          glowColor: '#d4a843',
          // STUB: slows formation
          effect: null,
        },
      ],
    },
  },

  plague: {
    name: 'PLAGUE SWARM',
    color: '#1a2200', textColor: '#aacc11',
    enemyType: 'mutant',  // uses mutant sprite for now
    speedMult: 1.4, hpMult: 0.7,

    terrain: {
      floorColor: '#121808',
      floorDetail: '#182010',

      walls: [
        { label: 'quarantine barrier', color: '#1e2a10', accent: '#2a3818' },
        { label: 'bio-container',      color: '#182208', accent: '#243010' },
        { label: 'hive mass',          color: '#1a2210', accent: '#263018' },
      ],

      covers: [
        { label: 'body pile',   color: '#182010', accent: '#222e14' },
        { label: 'swarm nest',  color: '#1a2208', accent: '#283010' },
      ],

      hazards: [
        {
          label: 'plague pool',
          color: '#141e08',
          glowColor: '#aacc11',
          // STUB: heavy DOT
          effect: null,
        },
        {
          label: 'swarm cloud',
          color: '#182210',
          glowColor: '#88aa00',
          // STUB: reduces fire rate
          effect: null,
        },
      ],
    },
  },

};

// Helper — get apocalypse data safely
function getApoc(key) {
  return APOCALYPSE_DATA[key] ?? APOCALYPSE_DATA.zombie;
}
