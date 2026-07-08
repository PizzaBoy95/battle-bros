// Shared game constants — used by both client and server

const GAME_WIDTH = 480;
const GAME_HEIGHT = 854;

// Tower positions (from server's coordinate system — y=0 is enemy side)
const TOWER_POSITIONS = {
  p1: {
    king:       { x: 240, y: 760 },
    guardLeft:  { x: 100, y: 660 },
    guardRight: { x: 380, y: 660 }
  },
  p2: {
    king:       { x: 240, y: 94 },
    guardLeft:  { x: 100, y: 194 },
    guardRight: { x: 380, y: 194 }
  }
};

const TOWER_STATS = {
  guard: { maxHp: 1500, damage: 80, range: 200, attackSpeed: 1.2, radius: 36 },
  king:  { maxHp: 3000, damage: 120, range: 250, attackSpeed: 1.0, radius: 44 }
};

const ELIXIR = {
  max: 10,
  startAmount: 5,
  regenMs: 2800,       // ms per 1 elixir unit (standard)
  overtimeRegenMs: 1400 // ms per 1 elixir unit (overtime = 2x speed)
};

const BATTLE_TIMER = {
  standard: 180,  // seconds
  overtime: 60,   // extra seconds in overtime
};

// XP needed to reach each level (index = level, value = cumulative XP for that level)
const XP_THRESHOLDS = [0, 500, 2000, 6000, 16000, 41000, 101000, 251000, 651000];
const GOLD_UPGRADE_COSTS = [0, 200, 500, 1000, 2500, 5000, 12000, 30000, 75000];

const LOOT_RARITIES = {
  common:    { probability: 0.60, goldMin: 50,   goldMax: 150,  cardGuaranteed: false },
  rare:      { probability: 0.25, goldMin: 200,  goldMax: 500,  cardGuaranteed: false },
  epic:      { probability: 0.12, goldMin: 800,  goldMax: 1500, cardGuaranteed: true  },
  legendary: { probability: 0.03, goldMin: 3000, goldMax: 5000, cardGuaranteed: true  }
};

const STAT_LEVEL_MULTIPLIER = 0.08; // +8% per level

// Lane deployment X boundaries
const LANES = {
  left:  { minX: 20,  maxX: 220 },
  right: { minX: 260, maxX: 460 }
};

// Deploy zone: player may deploy anywhere in their OWN HALF, from just past the
// river (the enemy bridge line) down to in front of their king. River center is
// at GAME_HEIGHT*0.48 ≈ 410 (river band 410–448), so p1 starts at y=450.
// (p2 is mirrored on the server: deployY ∈ [854-maxY, 854-minY] = [134, 404].)
const DEPLOY_ZONE = { minY: 450, maxY: 720 };

const CHARACTERS = {
  titan_grunt: {
    id: 'titan_grunt', name: 'Titan Grunt', rarity: 'legendary',
    type: 'ground', hp: 2800, damage: 180, speed: 40,
    attackSpeed: 0.67, range: 52, elixirCost: 6,
    special: 'aoe_landing',
    specialDesc: 'Ground smash AoE on landing',
    color: 0x8B4513, accentColor: 0xC0C0C0
  },
  pyro_drake: {
    id: 'pyro_drake', name: 'Pyro Drake', rarity: 'legendary',
    type: 'air', hp: 1800, damage: 220, speed: 65,
    attackSpeed: 0.8, range: 150, elixirCost: 5,
    special: 'fire_breath',
    specialDesc: 'Fire breath cone (AoE)',
    color: 0xFF4500, accentColor: 0xFF8C00
  },
  lady_vex: {
    id: 'lady_vex', name: 'Lady Vex', rarity: 'legendary',
    type: 'ground', hp: 900, damage: 260, speed: 80,
    attackSpeed: 1.0, range: 280, elixirCost: 4,
    special: 'chaos_bolt',
    specialDesc: 'Chaos bolt bounces to 3 targets',
    color: 0x9B59B6, accentColor: 0xE91E8C, gender: 'female'
  },
  bone_shard: {
    id: 'bone_shard', name: 'Bone Shard', rarity: 'epic',
    type: 'ground', hp: 1100, damage: 90, speed: 70,
    attackSpeed: 0.9, range: 100, elixirCost: 5,
    special: 'spawn_skeletons',
    specialDesc: 'Spawns 3 skeleton minions on deploy',
    color: 0x2C3E50, accentColor: 0x8E44AD
  },
  iron_bro: {
    id: 'iron_bro', name: 'Iron Bro', rarity: 'epic',
    type: 'ground', hp: 2200, damage: 140, speed: 50,
    attackSpeed: 0.75, range: 50, elixirCost: 5,
    special: 'shield_bash',
    specialDesc: 'Shield bash stuns target 1s',
    color: 0x2980B9, accentColor: 0x7F8C8D
  },
  stone_golem: {
    id: 'stone_golem', name: 'Stone Golem', rarity: 'epic',
    type: 'ground', hp: 3000, damage: 100, speed: 30,
    attackSpeed: 0.5, range: 52, elixirCost: 6,
    special: 'split_on_death',
    specialDesc: 'Immune to knockback; splits into 2 mini-golems on death',
    color: 0x7F8C8D, accentColor: 0x95A5A6
  },
  thunder_chief: {
    id: 'thunder_chief', name: 'Thunder Chief', rarity: 'epic',
    type: 'ground', hp: 1600, damage: 200, speed: 90,
    attackSpeed: 1.1, range: 54, elixirCost: 4,
    special: 'battle_cry',
    specialDesc: 'Battle cry buffs all nearby allies +20% damage for 3s',
    color: 0xE67E22, accentColor: 0xC0392B
  },
  blaze_witch: {
    id: 'blaze_witch', name: 'Blaze Witch', rarity: 'rare',
    type: 'ground', hp: 950, damage: 190, speed: 75,
    attackSpeed: 0.85, range: 240, elixirCost: 4,
    special: 'flame_pool',
    specialDesc: 'Leaves burning flame pool (DoT)',
    color: 0xFF6B00, accentColor: 0x1A1A1A
  },
  wing_knight: {
    id: 'wing_knight', name: 'Wing Knight', rarity: 'rare',
    type: 'air', hp: 1400, damage: 160, speed: 85,
    attackSpeed: 0.9, range: 52, elixirCost: 4,
    special: 'dive_slam',
    specialDesc: 'Aerial dive slam on first attack',
    color: 0xECF0F1, accentColor: 0x2C3E50
  },
  frostborn: {
    id: 'frostborn', name: 'Frostborn', rarity: 'rare',
    type: 'ground', hp: 1050, damage: 140, speed: 72,
    attackSpeed: 0.8, range: 260, elixirCost: 3,
    special: 'slow_aura',
    specialDesc: 'Slows all nearby enemies 40% for 2s',
    color: 0x3498DB, accentColor: 0xADD8E6
  },
  jade_monk: {
    id: 'jade_monk', name: 'Jade Monk', rarity: 'rare',
    type: 'ground', hp: 1200, damage: 100, speed: 80,
    attackSpeed: 0.9, range: 52, elixirCost: 3,
    special: 'healing_aura',
    specialDesc: 'Heals nearest ally 50 HP/s while fighting',
    color: 0x27AE60, accentColor: 0x2ECC71
  },
  sea_crusher: {
    id: 'sea_crusher', name: 'Sea Crusher', rarity: 'rare',
    type: 'ground', hp: 2000, damage: 130, speed: 45,
    attackSpeed: 0.7, range: 200, elixirCost: 5,
    special: 'water_cannon',
    specialDesc: 'Water cannon knocks back target',
    color: 0x16A085, accentColor: 0x1ABC9C
  },
  crystal_sage: {
    id: 'crystal_sage', name: 'Crystal Sage', rarity: 'rare',
    type: 'ground', hp: 1000, damage: 110, speed: 68,
    attackSpeed: 0.85, range: 250, elixirCost: 3,
    special: 'crystal_barrier',
    specialDesc: 'Deploys crystal barrier (absorbs 400 dmg)',
    color: 0xA29BFE, accentColor: 0xFD79A8
  },
  arrow_jack: {
    id: 'arrow_jack', name: 'Arrow Jack', rarity: 'common',
    type: 'ground', hp: 750, damage: 120, speed: 90,
    attackSpeed: 1.43, range: 300, elixirCost: 2,
    special: 'rapid_fire',
    specialDesc: 'Rapid fire 0.7s attack interval',
    color: 0x6D8B2B, accentColor: 0xA0522D
  },
  shadow_rogue: {
    id: 'shadow_rogue', name: 'Shadow Rogue', rarity: 'common',
    type: 'ground', hp: 700, damage: 240, speed: 110,
    attackSpeed: 0.9, range: 52, elixirCost: 3,
    special: 'backstab',
    specialDesc: '+50% crit damage from behind',
    color: 0x2D3436, accentColor: 0x636E72
  },
  skywing: {
    id: 'skywing', name: 'Skywing', rarity: 'common',
    type: 'air', hp: 1100, damage: 150, speed: 70,
    attackSpeed: 0.8, range: 200, elixirCost: 3,
    special: 'bomb_drop',
    specialDesc: 'Drops bombs — AoE splash on ground targets',
    color: 0x0984E3, accentColor: 0x74B9FF
  },
  volt_ranger: {
    id: 'volt_ranger', name: 'Volt Ranger', rarity: 'common',
    type: 'ground', hp: 900, damage: 130, speed: 85,
    attackSpeed: 1.0, range: 280, elixirCost: 3,
    special: 'chain_lightning',
    specialDesc: 'Lightning chains to 2 additional enemies',
    color: 0xF9CA24, accentColor: 0x0652DD
  },
  toxin_toad: {
    id: 'toxin_toad', name: 'Toxin Toad', rarity: 'common',
    type: 'ground', hp: 1300, damage: 80, speed: 55,
    attackSpeed: 0.75, range: 120, elixirCost: 2,
    special: 'poison_splash',
    specialDesc: 'Poison DoT splash on contact',
    color: 0x00B894, accentColor: 0x55EFC4
  },
  neon_wraith: {
    id: 'neon_wraith', name: 'Neon Wraith', rarity: 'common',
    type: 'air', hp: 600, damage: 180, speed: 100,
    attackSpeed: 0.95, range: 160, elixirCost: 2,
    special: 'phase_dodge',
    specialDesc: '30% dodge chance; ignores terrain',
    color: 0x00CEC9, accentColor: 0xDFE6E9
  },
  forge_dwarf: {
    id: 'forge_dwarf', name: 'Forge Dwarf', rarity: 'common',
    type: 'ground', hp: 850, damage: 80, speed: 55,
    attackSpeed: 0.7, range: 52, elixirCost: 3,
    special: 'place_turret',
    specialDesc: 'Places a cannon turret that fires automatically',
    color: 0xE17055, accentColor: 0xFDCB6E
  },

  // ── Locked mystery heroes (chest-drop unlocks; stronger for their rarity) ──
  void_reaper: {
    id: 'void_reaper', name: 'Void Reaper', rarity: 'legendary', locked: true,
    type: 'ground', hp: 1600, damage: 310, speed: 70,
    attackSpeed: 0.9, range: 270, elixirCost: 5,
    special: 'soul_burn', specialDesc: 'Flame bolts deal +50% damage to towers',
    color: 0x8B0000, accentColor: 0xFF6B35
  },
  king_aurel: {
    id: 'king_aurel', name: 'King Aurel', rarity: 'legendary', locked: true,
    type: 'ground', hp: 3200, damage: 210, speed: 55,
    attackSpeed: 0.8, range: 54, elixirCost: 6,
    special: 'royal_decree', specialDesc: 'Nearby allies fight 15% faster',
    color: 0xB03A48, accentColor: 0xFFD700
  },
  storm_herald: {
    id: 'storm_herald', name: 'Storm Herald', rarity: 'epic', locked: true,
    type: 'ground', hp: 1900, damage: 240, speed: 85,
    attackSpeed: 1.0, range: 52, elixirCost: 4,
    special: 'tempest_slash', specialDesc: 'Every 3rd strike hits all nearby foes',
    color: 0x4A6FA5, accentColor: 0xBFEFFF
  },
  doom_blade: {
    id: 'doom_blade', name: 'Doom Blade', rarity: 'epic', locked: true,
    type: 'ground', hp: 1300, damage: 280, speed: 105,
    attackSpeed: 1.1, range: 50, elixirCost: 3,
    special: 'shadowstep', specialDesc: 'First strike on each target is a crit',
    color: 0x7A1F2B, accentColor: 0x2D3436
  },
  iron_vanguard: {
    id: 'iron_vanguard', name: 'Iron Vanguard', rarity: 'rare', locked: true,
    type: 'ground', hp: 2400, damage: 160, speed: 60,
    attackSpeed: 0.8, range: 52, elixirCost: 4,
    special: 'bulwark', specialDesc: 'Takes 20% less damage while attacking',
    color: 0x5A6B7A, accentColor: 0xC0C8D0
  }
};

// Internal unit spawned by Bone Shard's special ability (not selectable by players)
CHARACTERS._skeleton = {
  id: '_skeleton', name: 'Skeleton', rarity: 'common',
  type: 'ground', hp: 150, damage: 45, speed: 100,
  attackSpeed: 1.0, range: 46, elixirCost: 0,
  special: 'none', specialDesc: '',
  color: 0xF0E68C, accentColor: 0xFFFFFF
};

const CHARACTER_IDS = Object.keys(CHARACTERS).filter(k => !k.startsWith('_'));

const MYSTERY_SLOTS = 6;

// Export for Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    GAME_WIDTH, GAME_HEIGHT, TOWER_POSITIONS, TOWER_STATS, ELIXIR,
    BATTLE_TIMER, XP_THRESHOLDS, GOLD_UPGRADE_COSTS, LOOT_RARITIES,
    STAT_LEVEL_MULTIPLIER, LANES, DEPLOY_ZONE, CHARACTERS, CHARACTER_IDS, MYSTERY_SLOTS
  };
}
