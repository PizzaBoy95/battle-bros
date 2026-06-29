// Map 1: Ember Crossing — Volcanic/lava theme, high-quality render
// NOTE: all particles kept INSIDE lava columns (x < 62 or x > W-62)

export function drawMap(scene) {
  const { width: W, height: H } = scene.scale;

  // ── Base background ────────────────────────────────────────────────────────
  const bg = scene.add.graphics().setDepth(0);
  bg.fillStyle(0x0A0400); bg.fillRect(0, 0, W, H);

  // ── Lava columns — multi-layer gradient (flanks only) ─────────────────────
  const lavaG = scene.add.graphics().setDepth(0);
  [
    [0xFF3300, 62], [0xFF5500, 50], [0xFF7700, 36], [0xFFAA00, 22], [0xFFCC00, 10]
  ].forEach(([c, w]) => {
    lavaG.fillStyle(c, 0.80); lavaG.fillRect(0, 0, w, H);
    lavaG.fillStyle(c, 0.80); lavaG.fillRect(W - w, 0, w, H);
  });

  // Bright core strip
  lavaG.fillStyle(0xFFEE44, 0.35); lavaG.fillRect(16, 0, 10, H);
  lavaG.fillStyle(0xFFEE44, 0.35); lavaG.fillRect(W - 26, 0, 10, H);

  // ── Stone lane (center) ────────────────────────────────────────────────────
  const stoneG = scene.add.graphics().setDepth(1);
  stoneG.fillStyle(0x1A0E06); stoneG.fillRect(62, 0, W - 124, H);
  stoneG.fillStyle(0x221408, 0.5); stoneG.fillRect(90, 0, W - 180, H);

  // Brick mortar — horizontal
  for (let row = 0; row <= Math.ceil(H / 20); row++) {
    stoneG.fillStyle(0x000000, 0.15);
    stoneG.fillRect(62, row * 20, W - 124, 1);
  }
  // Brick mortar — vertical (staggered)
  for (let row = 0; row <= Math.ceil(H / 20); row++) {
    const off = (row % 2) * 14;
    stoneG.fillStyle(0x000000, 0.10);
    for (let col = 0; col < Math.ceil((W - 124) / 28); col++) {
      const vx = 62 + off + col * 28;
      if (vx < W - 62) stoneG.fillRect(vx, row * 20, 1, 20);
    }
  }

  // ── Perspective grid — converging lines create depth illusion ──────────────
  const perspG = scene.add.graphics().setDepth(1);
  const VPX = W / 2, VPY = H * 0.48;
  perspG.lineStyle(1, 0x3A2010, 0.22);
  const COLS = 7;
  for (let i = 0; i <= COLS; i++) {
    const bx = 62 + i * ((W - 124) / COLS);
    perspG.lineBetween(bx, H, VPX + (bx - VPX) * 0.15, VPY);
  }
  // Horizontal perspective lines (closer together toward top = depth)
  for (let j = 0; j < 10; j++) {
    const t   = j / 10;
    const yy  = VPY + (H - VPY) * (t * t);   // quadratic spacing
    const xL  = VPX - (VPX - 62)  * (1 - t * 0.85);
    const xR  = VPX + (W - 62 - VPX) * (1 - t * 0.85);
    perspG.lineStyle(1, 0x3A2010, 0.14 * (1 - t * 0.5));
    perspG.lineBetween(xL, yy, xR, yy);
  }

  // ── Mid-line bridge ────────────────────────────────────────────────────────
  const bridgeG = scene.add.graphics().setDepth(2);
  bridgeG.fillStyle(0x3A2010, 0.9); bridgeG.fillRect(90, H / 2 - 14, W - 180, 28);
  bridgeG.fillStyle(0x4A2E18);      bridgeG.fillRect(90, H / 2 - 12, W - 180, 24);
  bridgeG.lineStyle(1, 0x8B5520, 0.4);
  bridgeG.strokeRect(90, H / 2 - 14, W - 180, 28);
  bridgeG.fillStyle(0x5C3A1E, 0.3);
  for (let xi = 90; xi < W - 90; xi += 16) {
    bridgeG.fillRect(xi, H / 2 - 12, 1, 24);
  }

  // ── Lava column — sparse bubbles (ONLY inside the 62px columns) ────────────
  const bubG = scene.add.graphics().setDepth(2);
  for (let i = 0; i < 12; i++) {
    // Left column
    const lx = 5  + (Math.abs(Math.sin(i * 97.3)) * 46);   // 5-51 ✓
    const ly = (i / 12) * H + Math.sin(i * 1.7) * 18;
    const lr = 2 + Math.abs(Math.sin(i * 13)) * 3;          // max 5px
    bubG.fillStyle(0xFFDD00, 0.55); bubG.fillCircle(lx, ly, lr);
    bubG.fillStyle(0xFFFFAA, 0.25); bubG.fillCircle(lx - lr * 0.3, ly - lr * 0.3, lr * 0.4);
    // Right column (mirror)
    const rx = W - 5 - (Math.abs(Math.sin(i * 97.3)) * 46); // W-51 to W-5 ✓
    bubG.fillStyle(0xFFDD00, 0.55); bubG.fillCircle(rx, ly + 10, lr);
    bubG.fillStyle(0xFFFFAA, 0.25); bubG.fillCircle(rx + lr * 0.3, ly + 10 - lr * 0.3, lr * 0.4);
  }

  // ── Vignette ───────────────────────────────────────────────────────────────
  const vigG = scene.add.graphics().setDepth(3);
  vigG.fillStyle(0x000000, 0.32); vigG.fillRect(0, 0, W, 90);
  vigG.fillStyle(0x000000, 0.18); vigG.fillRect(0, H - 90, W, 90);

  // ── Lava glow bleeding inward (soft) ──────────────────────────────────────
  const glowG = scene.add.graphics().setDepth(1);
  glowG.fillStyle(0xFF5500, 0.08); glowG.fillRect(62, 0, 28, H);
  glowG.fillStyle(0xFF5500, 0.08); glowG.fillRect(W - 90, 0, 28, H);

  // ── Animated lava (STRICTLY inside column bounds) ─────────────────────────
  const animG = scene.add.graphics().setDepth(2);
  _startLavaAnimation(scene, animG, W, H);

  return bg;
}

function _startLavaAnimation(scene, g, W, H) {
  let t = 0;
  scene.time.addEvent({
    delay: 80, loop: true,
    callback: () => {
      g.clear();
      t += 0.05;

      // Flowing streaks — left column (x: 2–58)
      for (let i = 0; i < 4; i++) {
        const yPos  = ((t * 0.5 + i * 0.28) % 1) * H;
        const alpha = 0.20 + Math.sin(t * 2 + i) * 0.08;
        g.fillStyle(0xFFCC00, alpha);
        g.fillRect(6, yPos, 48, 3);            // max x = 54, inside column ✓
      }

      // Flowing streaks — right column (x: W-58 to W-6)
      for (let i = 0; i < 4; i++) {
        const yPos  = ((t * 0.5 + i * 0.28 + 0.5) % 1) * H;
        const alpha = 0.20 + Math.sin(t * 2 + i + 1) * 0.08;
        g.fillStyle(0xFFCC00, alpha);
        g.fillRect(W - 54, yPos, 48, 3);       // max x = W-6, inside column ✓
      }

      // Pulsing glow core strips
      const pulse = 0.18 + Math.sin(t * 3) * 0.07;
      g.fillStyle(0xFFEE44, pulse);
      g.fillRect(16, 0, 8, H);                  // x: 16-24 ✓
      g.fillStyle(0xFFEE44, pulse * 0.8);
      g.fillRect(W - 24, 0, 8, H);              // x: W-24 to W-16 ✓

      // Rising bubbles — left (x: 4-40)
      for (let i = 0; i < 3; i++) {
        const phase = (t * 0.45 + i * 0.38) % 1;
        const bx = 8 + Math.abs(Math.sin(i * 2.1)) * 30;  // 8-38 ✓
        const by = H * (1 - phase);
        g.fillStyle(0xFFEE66, 0.50 - phase * 0.40);
        g.fillCircle(bx, by, 2 + Math.sin(i) * 1.5);
      }
      // Right side
      for (let i = 0; i < 3; i++) {
        const phase = (t * 0.45 + i * 0.38 + 0.5) % 1;
        const bx = W - 8 - Math.abs(Math.sin(i * 2.1)) * 30; // W-38 to W-8 ✓
        const by = H * (1 - phase);
        g.fillStyle(0xFFEE66, 0.50 - phase * 0.40);
        g.fillCircle(bx, by, 2 + Math.sin(i + 1) * 1.5);
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
