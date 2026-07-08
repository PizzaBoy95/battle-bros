// Client-side character definitions (mirrors shared/constants.js)
// Imported directly to avoid issues with CommonJS/ESM boundary in Vite

export const CHARACTERS = {
  titan_grunt: {
    id: 'titan_grunt', name: 'Titan Grunt', rarity: 'legendary',
    type: 'ground', hp: 2800, damage: 180, speed: 40,
    attackSpeed: 0.67, range: 80, elixirCost: 6,
    special: 'aoe_landing', specialDesc: 'Ground smash AoE on landing',
    color: 0x8B4513, accentColor: 0xC0C0C0,
    description: 'A colossal armored warrior who shakes the earth on arrival.'
  },
  pyro_drake: {
    id: 'pyro_drake', name: 'Pyro Drake', rarity: 'legendary',
    type: 'air', hp: 1800, damage: 220, speed: 65,
    attackSpeed: 0.8, range: 150, elixirCost: 5,
    special: 'fire_breath', specialDesc: 'Fire breath cone (AoE)',
    color: 0xFF4500, accentColor: 0xFF8C00,
    description: 'A winged fire dragon that melts everything in its path.'
  },
  lady_vex: {
    id: 'lady_vex', name: 'Lady Vex', rarity: 'legendary',
    type: 'ground', hp: 900, damage: 260, speed: 80,
    attackSpeed: 1.0, range: 280, elixirCost: 4,
    special: 'chaos_bolt', specialDesc: 'Chaos bolt bounces to 3 targets',
    color: 0x9B59B6, accentColor: 0xE91E8C, gender: 'female',
    description: 'A chaos mage whose spell ricochets through enemy ranks.'
  },
  bone_shard: {
    id: 'bone_shard', name: 'Bone Shard', rarity: 'epic',
    type: 'ground', hp: 1100, damage: 90, speed: 70,
    attackSpeed: 0.9, range: 100, elixirCost: 5,
    special: 'spawn_skeletons', specialDesc: 'Spawns 3 skeleton minions on deploy',
    color: 0x2C3E50, accentColor: 0x8E44AD,
    description: 'A dark summoner who raises skeletal warriors from the dead.'
  },
  iron_bro: {
    id: 'iron_bro', name: 'Iron Bro', rarity: 'epic',
    type: 'ground', hp: 2200, damage: 140, speed: 50,
    attackSpeed: 0.75, range: 75, elixirCost: 5,
    special: 'shield_bash', specialDesc: 'Shield bash stuns target 1s',
    color: 0x2980B9, accentColor: 0x7F8C8D,
    description: 'A heavily armored bro who leads with his shield.'
  },
  stone_golem: {
    id: 'stone_golem', name: 'Stone Golem', rarity: 'epic',
    type: 'ground', hp: 3000, damage: 100, speed: 30,
    attackSpeed: 0.5, range: 80, elixirCost: 6,
    special: 'split_on_death', specialDesc: 'Splits into 2 mini-golems on death',
    color: 0x7F8C8D, accentColor: 0x95A5A6,
    description: 'A mountain of living rock. Even in death, the battle continues.'
  },
  thunder_chief: {
    id: 'thunder_chief', name: 'Thunder Chief', rarity: 'epic',
    type: 'ground', hp: 1600, damage: 200, speed: 90,
    attackSpeed: 1.1, range: 85, elixirCost: 4,
    special: 'battle_cry', specialDesc: 'Battle cry buffs allies +20% dmg for 3s',
    color: 0xE67E22, accentColor: 0xC0392B,
    description: 'A berserker whose battle cry inspires nearby warriors.'
  },
  blaze_witch: {
    id: 'blaze_witch', name: 'Blaze Witch', rarity: 'rare',
    type: 'ground', hp: 950, damage: 190, speed: 75,
    attackSpeed: 0.85, range: 240, elixirCost: 4,
    special: 'flame_pool', specialDesc: 'Leaves burning flame pool (DoT)',
    color: 0xFF6B00, accentColor: 0x1A1A1A,
    description: 'A fire sorceress who scorches the ground beneath her enemies.'
  },
  wing_knight: {
    id: 'wing_knight', name: 'Wing Knight', rarity: 'rare',
    type: 'air', hp: 1400, damage: 160, speed: 85,
    attackSpeed: 0.9, range: 80, elixirCost: 4,
    special: 'dive_slam', specialDesc: 'Aerial dive slam on first attack',
    color: 0xECF0F1, accentColor: 0x2C3E50,
    description: 'A noble knight with great wings who strikes from above.'
  },
  frostborn: {
    id: 'frostborn', name: 'Frostborn', rarity: 'rare',
    type: 'ground', hp: 1050, damage: 140, speed: 72,
    attackSpeed: 0.8, range: 260, elixirCost: 3,
    special: 'slow_aura', specialDesc: 'Slows all nearby enemies 40% for 2s',
    color: 0x3498DB, accentColor: 0xADD8E6,
    description: 'An ice mage who freezes enemy advance in its tracks.'
  },
  jade_monk: {
    id: 'jade_monk', name: 'Jade Monk', rarity: 'rare',
    type: 'ground', hp: 1200, damage: 100, speed: 80,
    attackSpeed: 0.9, range: 80, elixirCost: 3,
    special: 'healing_aura', specialDesc: 'Heals nearest ally 50 HP/s',
    color: 0x27AE60, accentColor: 0x2ECC71,
    description: 'A serene monk who heals allies while fighting with a staff.'
  },
  sea_crusher: {
    id: 'sea_crusher', name: 'Sea Crusher', rarity: 'rare',
    type: 'ground', hp: 2000, damage: 130, speed: 45,
    attackSpeed: 0.7, range: 200, elixirCost: 5,
    special: 'water_cannon', specialDesc: 'Water cannon knocks back target',
    color: 0x16A085, accentColor: 0x1ABC9C,
    description: 'A tidal warrior armed with a pressurized water cannon.'
  },
  crystal_sage: {
    id: 'crystal_sage', name: 'Crystal Sage', rarity: 'rare',
    type: 'ground', hp: 1000, damage: 110, speed: 68,
    attackSpeed: 0.85, range: 250, elixirCost: 3,
    special: 'crystal_barrier', specialDesc: 'Deploys crystal barrier (400 dmg shield)',
    color: 0xA29BFE, accentColor: 0xFD79A8,
    description: 'A gem-wielding sage who shields allies with crystal walls.'
  },
  arrow_jack: {
    id: 'arrow_jack', name: 'Arrow Jack', rarity: 'common',
    type: 'ground', hp: 750, damage: 120, speed: 90,
    attackSpeed: 1.43, range: 300, elixirCost: 2,
    special: 'rapid_fire', specialDesc: 'Rapid fire — 0.7s attack interval',
    color: 0x6D8B2B, accentColor: 0xA0522D,
    description: 'A lightning-fast archer who never misses his mark.'
  },
  shadow_rogue: {
    id: 'shadow_rogue', name: 'Shadow Rogue', rarity: 'common',
    type: 'ground', hp: 700, damage: 240, speed: 110,
    attackSpeed: 0.9, range: 80, elixirCost: 3,
    special: 'backstab', specialDesc: '+50% crit damage from behind',
    color: 0x2D3436, accentColor: 0x636E72,
    description: 'A deadly assassin who strikes from the shadows.'
  },
  skywing: {
    id: 'skywing', name: 'Skywing', rarity: 'common',
    type: 'air', hp: 1100, damage: 150, speed: 70,
    attackSpeed: 0.8, range: 200, elixirCost: 3,
    special: 'bomb_drop', specialDesc: 'Drops bombs — AoE splash damage',
    color: 0x0984E3, accentColor: 0x74B9FF,
    description: 'A winged bomber who rains destruction from above.'
  },
  volt_ranger: {
    id: 'volt_ranger', name: 'Volt Ranger', rarity: 'common',
    type: 'ground', hp: 900, damage: 130, speed: 85,
    attackSpeed: 1.0, range: 280, elixirCost: 3,
    special: 'chain_lightning', specialDesc: 'Lightning chains to 2 extra enemies',
    color: 0xF9CA24, accentColor: 0x0652DD,
    description: 'An electric ranger whose arrows chain between enemies.'
  },
  toxin_toad: {
    id: 'toxin_toad', name: 'Toxin Toad', rarity: 'common',
    type: 'ground', hp: 1300, damage: 80, speed: 55,
    attackSpeed: 0.75, range: 120, elixirCost: 2,
    special: 'poison_splash', specialDesc: 'Poison DoT splash on contact',
    color: 0x00B894, accentColor: 0x55EFC4,
    description: 'A toxin-laden toad that poisons anything it touches.'
  },
  neon_wraith: {
    id: 'neon_wraith', name: 'Neon Wraith', rarity: 'common',
    type: 'air', hp: 600, damage: 180, speed: 100,
    attackSpeed: 0.95, range: 160, elixirCost: 2,
    special: 'phase_dodge', specialDesc: '30% dodge chance; ignores terrain',
    color: 0x00CEC9, accentColor: 0xDFE6E9,
    description: 'A spectral entity that phases through attacks and terrain.'
  },
  forge_dwarf: {
    id: 'forge_dwarf', name: 'Forge Dwarf', rarity: 'common',
    type: 'ground', hp: 850, damage: 80, speed: 55,
    attackSpeed: 0.7, range: 80, elixirCost: 3,
    special: 'place_turret', specialDesc: 'Places a cannon turret on deploy',
    color: 0xE17055, accentColor: 0xFDCB6E,
    description: 'A stout engineer who deploys battle cannons mid-fight.'
  },

  // ── LOCKED mystery heroes — only unlock as random chest drops ─────────────
  void_reaper: {
    id: 'void_reaper', name: 'Void Reaper', rarity: 'legendary', locked: true,
    type: 'ground', hp: 1600, damage: 310, speed: 70,
    attackSpeed: 0.9, range: 270, elixirCost: 5,
    special: 'soul_burn', specialDesc: 'Flame bolts deal +50% damage to towers',
    color: 0x8B0000, accentColor: 0xFF6B35,
    description: 'A forbidden pyromancer whose soulfire melts stone itself.'
  },
  king_aurel: {
    id: 'king_aurel', name: 'King Aurel', rarity: 'legendary', locked: true,
    type: 'ground', hp: 3200, damage: 210, speed: 55,
    attackSpeed: 0.8, range: 54, elixirCost: 6,
    special: 'royal_decree', specialDesc: 'Nearby allies fight 15% faster',
    color: 0xB03A48, accentColor: 0xFFD700,
    description: 'The exiled king returns — his blade commands armies.'
  },
  storm_herald: {
    id: 'storm_herald', name: 'Storm Herald', rarity: 'epic', locked: true,
    type: 'ground', hp: 1900, damage: 240, speed: 85,
    attackSpeed: 1.0, range: 52, elixirCost: 4,
    special: 'tempest_slash', specialDesc: 'Every 3rd strike hits all nearby foes',
    color: 0x4A6FA5, accentColor: 0xBFEFFF,
    description: 'A wandering blademaster who cuts with the storm wind.'
  },
  doom_blade: {
    id: 'doom_blade', name: 'Doom Blade', rarity: 'epic', locked: true,
    type: 'ground', hp: 1300, damage: 280, speed: 105,
    attackSpeed: 1.1, range: 50, elixirCost: 3,
    special: 'shadowstep', specialDesc: 'First strike on each target is a crit',
    color: 0x7A1F2B, accentColor: 0x2D3436,
    description: 'A crimson assassin — you hear the blade before you see him.'
  },
  iron_vanguard: {
    id: 'iron_vanguard', name: 'Iron Vanguard', rarity: 'rare', locked: true,
    type: 'ground', hp: 2400, damage: 160, speed: 60,
    attackSpeed: 0.8, range: 52, elixirCost: 4,
    special: 'bulwark', specialDesc: 'Takes 20% less damage while attacking',
    color: 0x5A6B7A, accentColor: 0xC0C8D0,
    description: 'A mercenary wall of muscle and steel that never retreats.'
  }
};

export const CHARACTER_IDS = Object.keys(CHARACTERS);

export const RARITY_ORDER = ['legendary', 'epic', 'rare', 'common'];

export const RARITY_COLORS = {
  legendary: 0xFFD700,
  epic:      0x9B59B6,
  rare:      0x3498DB,
  common:    0x95A5A6
};

export function getScaledStats(char, level) {
  const mult = 1 + (level - 1) * 0.08;
  return {
    ...char,
    hp: Math.floor(char.hp * mult),
    damage: Math.floor(char.damage * mult)
  };
}

export const MYSTERY_SLOTS = 1;
