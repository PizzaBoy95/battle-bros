import { CHARACTER_IDS, CHARACTERS } from '../characters/CharacterRegistry.js';

export const RARITIES = {
  common:    { probability: 0.60, goldMin: 50,   goldMax: 150,  cardChance: 0.0, color: 0x95A5A6, label: 'COMMON'    },
  rare:      { probability: 0.25, goldMin: 200,  goldMax: 500,  cardChance: 0.4, color: 0x3498DB, label: 'RARE'      },
  epic:      { probability: 0.12, goldMin: 800,  goldMax: 1500, cardChance: 1.0, color: 0x9B59B6, label: 'EPIC'      },
  legendary: { probability: 0.03, goldMin: 3000, goldMax: 5000, cardChance: 1.0, color: 0xFFD700, label: 'LEGENDARY' }
};

export function rollRarity() {
  const r = Math.random();
  let cumulative = 0;
  for (const [key, data] of Object.entries(RARITIES)) {
    cumulative += data.probability;
    if (r < cumulative) return key;
  }
  return 'common';
}

export function rollReward(rarity) {
  const data = RARITIES[rarity];
  const gold = Math.floor(data.goldMin + Math.random() * (data.goldMax - data.goldMin));

  let charReward = null;
  if (Math.random() < data.cardChance) {
    // Pick a character matching rarity or lower (locked heroes excluded here)
    const eligible = CHARACTER_IDS.filter(id => {
      const c = CHARACTERS[id];
      if (c.locked) return false;
      if (rarity === 'legendary') return c.rarity === 'legendary';
      if (rarity === 'epic')      return ['epic', 'legendary'].includes(c.rarity);
      if (rarity === 'rare')      return ['rare', 'epic'].includes(c.rarity);
      return true;
    });
    charReward = eligible[Math.floor(Math.random() * eligible.length)] || null;
  }

  // Locked mystery heroes — the jackpot roll. Better chests = better odds.
  const lockedChance = { common: 0.02, rare: 0.06, epic: 0.16, legendary: 0.40 }[rarity] || 0;
  if (Math.random() < lockedChance) {
    const lockedPool = CHARACTER_IDS.filter(id => {
      const c = CHARACTERS[id];
      if (!c.locked) return false;
      if (rarity === 'legendary') return true;
      if (rarity === 'epic')      return c.rarity !== 'legendary';
      return c.rarity === 'rare';
    });
    const pick = lockedPool[Math.floor(Math.random() * lockedPool.length)];
    if (pick) charReward = pick;   // overrides the normal card — it's an UNLOCK
  }

  // Global Chat Scroll drop — rarer chests carry them more often
  const scrollChance = { common: 0.10, rare: 0.30, epic: 0.60, legendary: 1.0 }[rarity] || 0;
  const scrolls = Math.random() < scrollChance ? 1 : 0;

  return { rarity, gold, charReward, scrolls };
}

// Loss reward (smaller)
export function rollLossReward() {
  const gold = Math.floor(20 + Math.random() * 80);
  return { rarity: 'common', gold, charReward: null };
}
