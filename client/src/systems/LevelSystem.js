// Client-side level system utils

export const XP_THRESHOLDS = [0, 500, 1500, 4000, 10000, 25000, 60000, 150000, 400000];
export const GOLD_COSTS = [0, 200, 500, 1000, 2500, 5000, 12000, 30000, 75000];
export const MAX_LEVEL = 9;

export function xpForLevel(level) {
  return XP_THRESHOLDS[level] || Infinity;
}

export function xpProgress(level, xp) {
  if (level >= MAX_LEVEL) return { pct: 1, xpInLevel: 0, xpNeeded: 0 };
  const needed = XP_THRESHOLDS[level];
  return {
    pct: Math.min(1, xp / needed),
    xpInLevel: xp,
    xpNeeded: needed
  };
}

export function statMultiplier(level) {
  return 1 + (level - 1) * 0.08;
}

// Draw a compact level badge
export function drawLevelBadge(scene, x, y, level, xpPct) {
  const g = scene.add.graphics();

  // Badge background
  g.fillStyle(0x0a0a1a);
  g.fillCircle(x, y, 14);

  // XP ring
  const color = level >= 9 ? 0xFFD700 : level >= 6 ? 0x9B59B6 : level >= 3 ? 0x3498DB : 0x95A5A6;
  g.lineStyle(3, color, 1);
  g.beginPath();
  g.arc(x, y, 11, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * xpPct, false);
  g.strokePath();

  const label = scene.add.text(x, y, String(level), {
    fontSize: '11px', fill: '#FFFFFF', fontFamily: 'Arial', fontStyle: 'bold'
  }).setOrigin(0.5);

  return { g, label, destroy() { g.destroy(); label.destroy(); } };
}
