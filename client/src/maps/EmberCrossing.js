// Map 1: Ember Crossing — Volcanic arena with stone-arch bridges over lava river

export function drawMap(scene) {
  const { width: W, height: H } = scene.scale;
  const CX = W / 2;
  const RIVER_Y = H * 0.48;
  const RIVER_H = 38;

  // ── Base background ──────────────────────────────────────────────────────────
  const bg = scene.add.graphics().setDepth(0);
  bg.fillStyle(0x0A0400); bg.fillRect(0, 0, W, H);

  // ── Lava column flanks — multi-layer hot gradient ────────────────────────────
  const lavaG = scene.add.graphics().setDepth(0);
  [[0xFF3300, 62], [0xFF5500, 50], [0xFF7700, 36], [0xFFAA00, 22], [0xFFCC00, 10]].forEach(([c, w]) => {
    lavaG.fillStyle(c, 0.82); lavaG.fillRect(0, 0, w, H);
    lavaG.fillStyle(c, 0.82); lavaG.fillRect(W - w, 0, w, H);
  });
  lavaG.fillStyle(0xFFEE44, 0.40); lavaG.fillRect(16, 0, 10, H);
  lavaG.fillStyle(0xFFEE44, 0.40); lavaG.fillRect(W - 26, 0, 10, H);

  // ── Stone arena floor — two halves (ally=green tint top, enemy=red tint bottom) ──
  const stoneG = scene.add.graphics().setDepth(1);
  // Top half (enemy side) — scorched stone
  stoneG.fillStyle(0x1E0E06); stoneG.fillRect(62, 0, W - 124, RIVER_Y);
  stoneG.fillStyle(0x2A1206, 0.5); stoneG.fillRect(90, 0, W - 180, RIVER_Y);
  // Bottom half (ally side) — ash grey stone
  stoneG.fillStyle(0x181410); stoneG.fillRect(62, RIVER_Y + RIVER_H, W - 124, H - RIVER_Y - RIVER_H);
  stoneG.fillStyle(0x222016, 0.5); stoneG.fillRect(90, RIVER_Y + RIVER_H, W - 180, H - RIVER_Y - RIVER_H);

  // Brick mortar grid — top half
  for (let row = 0; row <= Math.ceil(RIVER_Y / 18); row++) {
    const ry = row * 18;
    stoneG.fillStyle(0x000000, 0.14); stoneG.fillRect(62, ry, W - 124, 1);
    const off = (row % 2) * 12;
    for (let col = 0; col < Math.ceil((W - 124) / 28); col++) {
      const vx = 62 + off + col * 28;
      if (vx < W - 62) stoneG.fillRect(vx, ry, 1, 18);
    }
  }
  // Brick mortar grid — bottom half
  for (let row = 0; row <= Math.ceil((H - RIVER_Y - RIVER_H) / 18); row++) {
    const ry = RIVER_Y + RIVER_H + row * 18;
    stoneG.fillStyle(0x000000, 0.14); stoneG.fillRect(62, ry, W - 124, 1);
    const off = (row % 2) * 12;
    for (let col = 0; col < Math.ceil((W - 124) / 28); col++) {
      const vx = 62 + off + col * 28;
      if (vx < W - 62) stoneG.fillRect(vx, ry, 1, 18);
    }
  }

  // ── Perspective grid lines ────────────────────────────────────────────────────
  const perspG = scene.add.graphics().setDepth(1);
  const VPX = CX, VPY = H * 0.48;
  perspG.lineStyle(1, 0x3A2010, 0.20);
  const COLS = 7;
  for (let i = 0; i <= COLS; i++) {
    const bx = 62 + i * ((W - 124) / COLS);
    perspG.lineBetween(bx, H, VPX + (bx - VPX) * 0.12, VPY);
  }
  for (let j = 0; j < 10; j++) {
    const t = j / 10, yy = VPY + (H - VPY) * (t * t);
    const xL = VPX - (VPX - 62) * (1 - t * 0.85);
    const xR = VPX + (W - 62 - VPX) * (1 - t * 0.85);
    perspG.lineStyle(1, 0x3A2010, 0.12 * (1 - t * 0.5));
    perspG.lineBetween(xL, yy, xR, yy);
  }

  // ── Lava river at center ─────────────────────────────────────────────────────
  const riverG = scene.add.graphics().setDepth(2);
  [[0xFF3300, 0.9, 0], [0xFF5500, 0.8, 4], [0xFF7700, 0.7, 8], [0xFFAA00, 0.5, 12]].forEach(([c, a, shrink]) => {
    riverG.fillStyle(c, a);
    riverG.fillRect(62 + shrink, RIVER_Y, W - 124 - shrink * 2, RIVER_H);
  });
  riverG.fillStyle(0xFFEE44, 0.25); riverG.fillRect(62, RIVER_Y + 4, W - 124, RIVER_H - 8);

  // ── Stone-arch bridge LEFT (spans lava river) ─────────────────────────────────
  const bridgeG = scene.add.graphics().setDepth(3);
  const BW = 68, BX_L = CX - 80 - BW / 2;
  _drawArch(bridgeG, BX_L, RIVER_Y, BW, RIVER_H);

  // ── Stone-arch bridge RIGHT ───────────────────────────────────────────────────
  const BX_R = CX + 80 - BW / 2;
  _drawArch(bridgeG, BX_R, RIVER_Y, BW, RIVER_H);

  // ── Decorative broken pillars (corners of arena) ──────────────────────────────
  const pillarG = scene.add.graphics().setDepth(2);
  [[80, 100], [80, H - 100], [W - 80, 100], [W - 80, H - 100]].forEach(([px, py]) => {
    pillarG.fillStyle(0x2A1A0A); pillarG.fillRect(px - 10, py - 32, 20, 64);
    pillarG.fillStyle(0x3A2A14); pillarG.fillRect(px - 8, py - 30, 16, 60);
    pillarG.fillStyle(0x4A3A1E, 0.5); pillarG.fillRect(px - 6, py - 30, 6, 60);
    pillarG.fillStyle(0x2A1A0A); pillarG.fillRect(px - 14, py - 38, 28, 10);
    pillarG.fillStyle(0x2A1A0A); pillarG.fillRect(px - 14, py + 26, 28, 10);
    // Top broken off — offset slab
    pillarG.fillStyle(0x1A0E06); pillarG.fillRect(px - 8, py - 50, 14, 14);
  });

  // ── Torch posts at four bridge ends ──────────────────────────────────────────
  const torchG = scene.add.graphics().setDepth(3);
  [BX_L, BX_L + BW, BX_R, BX_R + BW].forEach(tx => {
    // Post
    torchG.fillStyle(0x3A2010); torchG.fillRect(tx - 3, RIVER_Y - 28, 6, 26);
    // Torch cup
    torchG.fillStyle(0x6A4020); torchG.fillRect(tx - 6, RIVER_Y - 36, 12, 10);
    // Flame
    torchG.fillStyle(0xFF8800, 0.85); torchG.fillCircle(tx, RIVER_Y - 40, 7);
    torchG.fillStyle(0xFFCC00, 0.70); torchG.fillCircle(tx, RIVER_Y - 44, 4);
    torchG.fillStyle(0xFFEE88, 0.55); torchG.fillCircle(tx - 1, RIVER_Y - 47, 2);
  });

  // ── Lava glow bleed inward ────────────────────────────────────────────────────
  const glowG = scene.add.graphics().setDepth(1);
  glowG.fillStyle(0xFF5500, 0.09); glowG.fillRect(62, 0, 30, H);
  glowG.fillStyle(0xFF5500, 0.09); glowG.fillRect(W - 92, 0, 30, H);

  // ── Lava bubble static dots ───────────────────────────────────────────────────
  const bubG = scene.add.graphics().setDepth(2);
  for (let i = 0; i < 14; i++) {
    const lx = 5 + Math.abs(Math.sin(i * 97.3)) * 46;
    const ly = (i / 14) * H + Math.sin(i * 1.7) * 18;
    const lr = 2 + Math.abs(Math.sin(i * 13)) * 3;
    bubG.fillStyle(0xFFDD00, 0.55); bubG.fillCircle(lx, ly, lr);
    bubG.fillStyle(0xFFFFAA, 0.25); bubG.fillCircle(lx - lr * 0.3, ly - lr * 0.3, lr * 0.4);
    const rx = W - 5 - Math.abs(Math.sin(i * 97.3)) * 46;
    bubG.fillStyle(0xFFDD00, 0.55); bubG.fillCircle(rx, ly + 10, lr);
    bubG.fillStyle(0xFFFFAA, 0.25); bubG.fillCircle(rx + lr * 0.3, ly + 10 - lr * 0.3, lr * 0.4);
  }

  // ── Edge scorching — dark char marks along lava border ───────────────────────
  const charG = scene.add.graphics().setDepth(2);
  charG.fillStyle(0x000000, 0.35); charG.fillRect(62, 0, 18, H);
  charG.fillStyle(0x000000, 0.35); charG.fillRect(W - 80, 0, 18, H);

  // ── Vignette ──────────────────────────────────────────────────────────────────
  const vigG = scene.add.graphics().setDepth(3);
  vigG.fillStyle(0x000000, 0.36); vigG.fillRect(0, 0, W, 100);
  vigG.fillStyle(0x000000, 0.22); vigG.fillRect(0, H - 100, W, 100);

  // ── Animated lava river + columns ─────────────────────────────────────────────
  const animG = scene.add.graphics().setDepth(2);
  _startLavaAnimation(scene, animG, W, H, RIVER_Y, RIVER_H);

  return bg;
}

function _drawArch(g, bx, ry, bw, rh) {
  // Shadow below bridge
  g.fillStyle(0x000000, 0.35); g.fillRect(bx - 2, ry, bw + 4, rh);
  // Bridge deck — 3-layer stone
  g.fillStyle(0x3A2010); g.fillRect(bx, ry - 4, bw, rh + 4);
  g.fillStyle(0x4A2E18); g.fillRect(bx + 2, ry - 2, bw - 4, rh);
  g.fillStyle(0x5A3A20, 0.5); g.fillRect(bx + 4, ry - 2, bw * 0.3, rh);
  // Top rail
  g.fillStyle(0x5A3A22); g.fillRect(bx, ry - 10, bw, 8);
  g.fillStyle(0x7A5230, 0.6); g.fillRect(bx + 2, ry - 9, bw - 4, 5);
  // Bottom rail
  g.fillStyle(0x3A2010); g.fillRect(bx, ry + rh, bw, 8);
  // Arch pillars on sides
  g.fillStyle(0x2A1808); g.fillRect(bx, ry, 10, rh + 4);
  g.fillStyle(0x2A1808); g.fillRect(bx + bw - 10, ry, 10, rh + 4);
  // Plank lines across deck
  g.lineStyle(1, 0x5C3A1E, 0.35);
  for (let xi = bx + 8; xi < bx + bw - 8; xi += 14) {
    g.lineBetween(xi, ry - 2, xi, ry + rh);
  }
  // Stone keystone triangle (arch aesthetic)
  g.fillStyle(0x6A4020, 0.7);
  g.fillTriangle(bx + bw / 2 - 8, ry + rh, bx + bw / 2 + 8, ry + rh, bx + bw / 2, ry + rh - 14);
}

function _startLavaAnimation(scene, g, W, H, RIVER_Y, RIVER_H) {
  let t = 0;
  scene.time.addEvent({
    delay: 75, loop: true,
    callback: () => {
      g.clear();
      t += 0.05;

      // Flowing streaks — lava columns
      for (let i = 0; i < 5; i++) {
        const yPos = ((t * 0.5 + i * 0.22) % 1) * H;
        const alpha = 0.20 + Math.sin(t * 2 + i) * 0.08;
        g.fillStyle(0xFFCC00, alpha); g.fillRect(6, yPos, 48, 3);
      }
      for (let i = 0; i < 5; i++) {
        const yPos = ((t * 0.5 + i * 0.22 + 0.5) % 1) * H;
        const alpha = 0.20 + Math.sin(t * 2 + i + 1) * 0.08;
        g.fillStyle(0xFFCC00, alpha); g.fillRect(W - 54, yPos, 48, 3);
      }

      // Pulsing glow core
      const pulse = 0.20 + Math.sin(t * 3) * 0.08;
      g.fillStyle(0xFFEE44, pulse); g.fillRect(16, 0, 8, H);
      g.fillStyle(0xFFEE44, pulse * 0.8); g.fillRect(W - 24, 0, 8, H);

      // Rising bubbles — columns
      for (let i = 0; i < 4; i++) {
        const phase = (t * 0.45 + i * 0.28) % 1;
        const bx = 8 + Math.abs(Math.sin(i * 2.1)) * 36;
        const by = H * (1 - phase);
        g.fillStyle(0xFFEE66, 0.52 - phase * 0.42); g.fillCircle(bx, by, 2 + Math.sin(i) * 1.5);
      }
      for (let i = 0; i < 4; i++) {
        const phase = (t * 0.45 + i * 0.28 + 0.5) % 1;
        const bx = W - 8 - Math.abs(Math.sin(i * 2.1)) * 36;
        const by = H * (1 - phase);
        g.fillStyle(0xFFEE66, 0.52 - phase * 0.42); g.fillCircle(bx, by, 2 + Math.sin(i + 1) * 1.5);
      }

      // Lava river animated flow + bubbles
      const rPulse = 0.22 + Math.sin(t * 4) * 0.10;
      g.fillStyle(0xFFAA00, rPulse); g.fillRect(62, RIVER_Y + 6, W - 124, RIVER_H - 12);
      // River bubbles
      for (let i = 0; i < 6; i++) {
        const phase = (t * 0.6 + i * 0.18) % 1;
        const bx = 70 + phase * (W - 140);
        const by = RIVER_Y + 6 + Math.sin(t * 3 + i) * (RIVER_H * 0.3);
        g.fillStyle(0xFFEE44, 0.55); g.fillCircle(bx, by, 2.5 + Math.sin(i * 1.7) * 1.2);
      }

      // Torch flame flicker
      const flicker = 0.6 + Math.sin(t * 8) * 0.2;
      g.fillStyle(0xFF8800, flicker * 0.85);
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
