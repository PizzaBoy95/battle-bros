// Map 1: Ember Crossing — Volcanic / lava theme, high-quality procedural render

export function drawMap(scene) {
  const { width: W, height: H } = scene.scale;

  // ── Layer 0: deep void background ──────────────────────────────────────────
  const bg = scene.add.graphics().setDepth(0);
  bg.fillStyle(0x0A0400); bg.fillRect(0, 0, W, H);

  // ── Layer 1: lava columns (flanks) — multi-pass for depth ──────────────────
  const lavaG = scene.add.graphics().setDepth(0);

  // Outer dark rim
  lavaG.fillStyle(0x1A0200); lavaG.fillRect(0, 0, 62, H);
  lavaG.fillStyle(0x1A0200); lavaG.fillRect(W - 62, 0, 62, H);

  // Lava gradient — 5 concentric strips each side
  const lavaPalette = [0xCC2200, 0xEE3300, 0xFF5500, 0xFF7700, 0xFFAA00];
  const lavaWidths  = [58, 44, 32, 22, 12];
  for (let i = 0; i < 5; i++) {
    const lw = lavaWidths[i];
    lavaG.fillStyle(lavaPalette[i], 0.75 - i * 0.04);
    lavaG.fillRect(0, 0, lw, H);
    lavaG.fillRect(W - lw, 0, lw, H);
  }

  // Hot-glow core strip
  lavaG.fillStyle(0xFFDD44, 0.22);
  lavaG.fillRect(18, 0, 14, H);
  lavaG.fillRect(W - 32, 0, 14, H);

  // ── Layer 2: stone lane (center) ────────────────────────────────────────────
  const stoneG = scene.add.graphics().setDepth(1);

  // Base stone
  stoneG.fillStyle(0x1E120A); stoneG.fillRect(62, 0, W - 124, H);

  // Subtle center-line depth (slightly brighter mid-lane)
  stoneG.fillStyle(0x251810, 0.6); stoneG.fillRect(100, 0, W - 200, H);

  // Stone brick pattern — horizontal mortar lines with slight color variation
  for (let row = 0; row < Math.ceil(H / 22); row++) {
    const shade = row % 2 === 0 ? 0x000000 : 0x110A04;
    stoneG.fillStyle(shade, 0.18);
    stoneG.fillRect(62, row * 22, W - 124, 1);
  }
  // Vertical mortar (staggered brickwork)
  for (let row = 0; row < Math.ceil(H / 22); row++) {
    const offset = (row % 2) * 16;
    stoneG.fillStyle(0x000000, 0.12);
    for (let col = 0; col < Math.ceil((W - 124) / 32); col++) {
      const vx = 62 + offset + col * 32;
      if (vx < W - 62) stoneG.fillRect(vx, row * 22, 1, 22);
    }
  }

  // Mid-line divider (bridge plank)
  stoneG.fillStyle(0x3A2010, 0.9);
  stoneG.fillRect(90, H / 2 - 14, W - 180, 28);
  stoneG.fillStyle(0x4A2E18);
  stoneG.fillRect(90, H / 2 - 12, W - 180, 24);
  stoneG.lineStyle(1, 0x8B5520, 0.5);
  stoneG.strokeRect(90, H / 2 - 14, W - 180, 28);
  // Plank grain lines
  stoneG.fillStyle(0x5C3A1E, 0.35);
  for (let xi = 90; xi < W - 90; xi += 18) {
    stoneG.fillRect(xi, H / 2 - 12, 1, 24);
  }

  // ── Layer 3: lava edge glow bleeding onto lane ──────────────────────────────
  const glowG = scene.add.graphics().setDepth(1);
  glowG.fillStyle(0xFF5500, 0.12); glowG.fillRect(62, 0, 30, H);
  glowG.fillStyle(0xFF5500, 0.12); glowG.fillRect(W - 92, 0, 30, H);

  // ── Layer 4: static lava bubbles / hot spots ────────────────────────────────
  const bubbleG = scene.add.graphics().setDepth(2);

  // Left lava column bubbles
  for (let i = 0; i < 28; i++) {
    const bx = 6  + (Math.abs(Math.sin(i * 97.3)) * 44);
    const by = (i / 28) * H + Math.sin(i * 1.7) * 12;
    const br = 3 + Math.abs(Math.sin(i * 13)) * 5;
    bubbleG.fillStyle(0xFFDD00, 0.5 + Math.sin(i * 3) * 0.25);
    bubbleG.fillCircle(bx, by, br);
    bubbleG.fillStyle(0xFFFFAA, 0.3);
    bubbleG.fillCircle(bx - br * 0.3, by - br * 0.3, br * 0.45);
  }
  // Right column (mirrored)
  for (let i = 0; i < 28; i++) {
    const bx = W - 6 - (Math.abs(Math.sin(i * 97.3)) * 44);
    const by = (i / 28) * H + Math.sin(i * 1.7 + 1) * 12;
    const br = 3 + Math.abs(Math.sin(i * 13)) * 5;
    bubbleG.fillStyle(0xFFDD00, 0.5 + Math.sin(i * 3 + 1) * 0.25);
    bubbleG.fillCircle(bx, by, br);
    bubbleG.fillStyle(0xFFFFAA, 0.3);
    bubbleG.fillCircle(bx + br * 0.3, by - br * 0.3, br * 0.45);
  }

  // Scattered embers on the stone lane
  for (let i = 0; i < 45; i++) {
    const ex = 70 + (Math.abs(Math.sin(i * 73.1 + 5)) * (W - 140));
    const ey = (Math.abs(Math.cos(i * 31.7 + 2))) * H;
    const sz = 0.5 + Math.abs(Math.sin(i * 17)) * 2.5;
    const alpha = 0.3 + Math.abs(Math.sin(i * 11)) * 0.5;
    bubbleG.fillStyle(0xFF6600, alpha);
    bubbleG.fillCircle(ex, ey, sz);
  }

  // ── Layer 5: depth vignette (edges of lane darkened) ───────────────────────
  const vigG = scene.add.graphics().setDepth(3);
  // Top shadow (enemy end feels darker/more threatening)
  vigG.fillStyle(0x000000, 0.28); vigG.fillRect(0, 0, W, 80);
  // Bottom shadow (player end)
  vigG.fillStyle(0x000000, 0.20); vigG.fillRect(0, H - 80, W, 80);

  // ── Animated lava ──────────────────────────────────────────────────────────
  const animG = scene.add.graphics().setDepth(2);
  _startLavaAnimation(scene, animG, W, H);

  return bg;
}

function _startLavaAnimation(scene, g, W, H) {
  let t = 0;
  scene.time.addEvent({
    delay: 60, loop: true,
    callback: () => {
      g.clear();
      t += 0.04;

      // Flowing hot streaks in lava columns
      for (let i = 0; i < 6; i++) {
        const phase  = t + i * 1.1;
        const yPos   = (Math.sin(phase * 0.7 + i * 0.4) * 0.5 + 0.5) * H;
        const alpha  = 0.22 + Math.sin(phase * 2) * 0.12;
        g.fillStyle(0xFFCC00, alpha);
        g.fillRect(4, yPos - 8, 44, 4);
        g.fillRect(W - 48, yPos - 8 + 20, 44, 4);
      }

      // Pulsing glow core
      const pulse = 0.12 + Math.sin(t * 2.8) * 0.06;
      g.fillStyle(0xFFDD44, pulse);
      g.fillRect(14, 0, 10, H);
      g.fillStyle(0xFFDD44, pulse * 0.7);
      g.fillRect(W - 24, 0, 10, H);

      // Rising bubble animations
      for (let i = 0; i < 4; i++) {
        const bPhase = (t * 0.6 + i * 0.75) % 1;
        const bx = 10 + Math.sin(i * 2.3) * 20;
        const by = H * (1 - bPhase);
        const br = 2 + Math.sin(i * 1.7) * 2;
        g.fillStyle(0xFFEE66, 0.55 - bPhase * 0.4);
        g.fillCircle(bx, by, br);
        g.fillCircle(W - bx, by + H * 0.1, br);
      }
    }
  });
}

export const MAP_CONFIG = {
  id: 'ember_crossing',
  name: 'Ember Crossing',
  bgColor: 0x0A0400,
  hazardType: 'lava',
  hazardDPS: 30,
  hazardZones: [
    { x: 0, y: 0, width: 62, height: 854 },
    { x: 418, y: 0, width: 62, height: 854 }
  ],
  battleTrack: 'ember_rush',
  ambientColor: 0xFF4400
};
