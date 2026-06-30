// Map 2: Frostpeak Arena — Ice/snow theme with frozen river + log bridges

export function drawMap(scene) {
  const { width: W, height: H } = scene.scale;
  const CX = W / 2;
  const RIVER_Y = H * 0.48;
  const RIVER_H = 34;

  // ── Deep winter sky background ────────────────────────────────────────────────
  const bg = scene.add.graphics().setDepth(0);
  bg.fillStyle(0x0a1a2e); bg.fillRect(0, 0, W, H);

  // ── Glacier walls (flanks) — layered ice faces ────────────────────────────────
  const glacierG = scene.add.graphics().setDepth(0);
  [[0x2C4A6B, 62], [0x3A5E80, 50], [0x5D8AA8, 36], [0x7DAAC8, 20], [0xADD8E6, 8]].forEach(([c, w]) => {
    glacierG.fillStyle(c, 0.88); glacierG.fillRect(0, 0, w, H);
    glacierG.fillStyle(c, 0.88); glacierG.fillRect(W - w, 0, w, H);
  });
  // Ice shine
  glacierG.fillStyle(0xDDF0FF, 0.28); glacierG.fillRect(14, 0, 10, H);
  glacierG.fillStyle(0xDDF0FF, 0.28); glacierG.fillRect(W - 24, 0, 10, H);
  // Glacier cracks
  glacierG.lineStyle(1, 0x0a1a2e, 0.45);
  for (let i = 0; i < 10; i++) {
    const sy = (i / 10) * H;
    glacierG.lineBetween(8, sy, 32, sy + 44);
    glacierG.lineBetween(W - 8, sy + 22, W - 32, sy + 66);
  }
  // Ice crystal protrusions along glacier edge
  glacierG.fillStyle(0xE0F4FF, 0.6);
  for (let y = 60; y < H; y += 90) {
    glacierG.fillTriangle(60, y, 48, y + 16, 60, y + 32);
    glacierG.fillTriangle(W - 60, y + 10, W - 48, y + 26, W - 60, y + 42);
  }

  // ── Snow-covered arena floor — two halves ─────────────────────────────────────
  const snowG = scene.add.graphics().setDepth(1);
  // Top half (enemy side)
  snowG.fillStyle(0xB8D0E4); snowG.fillRect(62, 0, W - 124, RIVER_Y);
  snowG.fillStyle(0xC8DCF0, 0.6); snowG.fillRect(80, 0, W - 160, RIVER_Y);
  // Bottom half (ally side)
  snowG.fillStyle(0xC0D8EC); snowG.fillRect(62, RIVER_Y + RIVER_H, W - 124, H - RIVER_Y - RIVER_H);
  snowG.fillStyle(0xD0E4F4, 0.6); snowG.fillRect(80, RIVER_Y + RIVER_H, W - 160, H - RIVER_Y - RIVER_H);

  // Ice tile grid
  snowG.lineStyle(1, 0xADD8E6, 0.35);
  for (let y = 0; y < H; y += 48) snowG.strokeRect(62, y, W - 124, 48);
  for (let x = 62; x < W - 62; x += 48) snowG.lineBetween(x, 0, x, H);

  // Snow drifts along lava edge and bottom
  snowG.fillStyle(0xE8F4F8, 0.75);
  for (let y = 20; y < H; y += 72) {
    snowG.fillEllipse(76, y + 36, 26, 16);
    snowG.fillEllipse(W - 76, y + 52, 26, 16);
  }
  // Snow mounds along glacier face
  snowG.fillStyle(0xD8EEF8, 0.5);
  for (let y = 0; y < H; y += 55) {
    snowG.fillEllipse(70, y + 28, 20, 12);
    snowG.fillEllipse(W - 70, y + 42, 20, 12);
  }

  // ── Perspective grid ──────────────────────────────────────────────────────────
  const perspG = scene.add.graphics().setDepth(1);
  const VPX = CX, VPY = RIVER_Y;
  perspG.lineStyle(1, 0x8AB8D8, 0.18);
  for (let i = 0; i <= 7; i++) {
    const bx = 62 + i * ((W - 124) / 7);
    perspG.lineBetween(bx, H, VPX + (bx - VPX) * 0.12, VPY);
  }
  for (let j = 0; j < 10; j++) {
    const t = j / 10, yy = VPY + (H - VPY) * (t * t);
    const xL = VPX - (VPX - 62) * (1 - t * 0.85);
    const xR = VPX + (W - 62 - VPX) * (1 - t * 0.85);
    perspG.lineStyle(1, 0x8AB8D8, 0.12 * (1 - t * 0.5));
    perspG.lineBetween(xL, yy, xR, yy);
  }

  // ── Frozen river at center ────────────────────────────────────────────────────
  const riverG = scene.add.graphics().setDepth(2);
  riverG.fillStyle(0x1E5A9A, 0.9); riverG.fillRect(62, RIVER_Y, W - 124, RIVER_H);
  riverG.fillStyle(0x3A8ACC, 0.65); riverG.fillRect(66, RIVER_Y + 5, W - 132, RIVER_H - 10);
  riverG.fillStyle(0x7FCEF8, 0.35); riverG.fillRect(70, RIVER_Y + 8, W - 140, RIVER_H - 16);
  // Ice cracks across river
  riverG.lineStyle(2, 0xBBDDFF, 0.45);
  for (let x = 90; x < W - 90; x += 55) {
    riverG.lineBetween(x, RIVER_Y + 4, x + 18, RIVER_Y + RIVER_H - 4);
    riverG.lineBetween(x + 28, RIVER_Y + 6, x + 8, RIVER_Y + RIVER_H - 6);
  }
  // Ice crystal spires on river edge
  riverG.fillStyle(0xDDF4FF, 0.8);
  for (let x = 88; x < W - 88; x += 52) {
    riverG.fillTriangle(x, RIVER_Y, x - 6, RIVER_Y + 12, x + 6, RIVER_Y + 12);
    riverG.fillTriangle(x + 26, RIVER_Y + RIVER_H, x + 20, RIVER_Y + RIVER_H - 12, x + 32, RIVER_Y + RIVER_H - 12);
  }

  // ── Log bridges — left and right ─────────────────────────────────────────────
  const bridgeG = scene.add.graphics().setDepth(3);
  const BW = 66;
  const BX_L = CX - 82 - BW / 2;
  const BX_R = CX + 82 - BW / 2;
  _drawLogBridge(bridgeG, BX_L, RIVER_Y, BW, RIVER_H);
  _drawLogBridge(bridgeG, BX_R, RIVER_Y, BW, RIVER_H);

  // ── Ice crystal formations at arena corners ───────────────────────────────────
  const crystalG = scene.add.graphics().setDepth(2);
  [[80, 80], [80, H - 80], [W - 80, 80], [W - 80, H - 80]].forEach(([px, py]) => {
    _drawIceCrystal(crystalG, px, py, 1.0);
  });
  // Smaller mid-edge crystals
  [[80, H / 2 - 60], [80, H / 2 + 60], [W - 80, H / 2 - 60], [W - 80, H / 2 + 60]].forEach(([px, py]) => {
    _drawIceCrystal(crystalG, px, py, 0.65);
  });

  // ── Cold blue tint overlay ────────────────────────────────────────────────────
  const tintG = scene.add.graphics().setDepth(1);
  tintG.fillStyle(0x0066AA, 0.06); tintG.fillRect(0, 0, W, H);

  // ── Vignette ──────────────────────────────────────────────────────────────────
  const vigG = scene.add.graphics().setDepth(3);
  vigG.fillStyle(0x000000, 0.38); vigG.fillRect(0, 0, W, 100);
  vigG.fillStyle(0x000000, 0.22); vigG.fillRect(0, H - 100, W, 100);

  // ── Animated snow ─────────────────────────────────────────────────────────────
  drawSnowAnimation(scene);

  return bg;
}

function _drawLogBridge(g, bx, ry, bw, rh) {
  // Bridge shadow
  g.fillStyle(0x000000, 0.30); g.fillRect(bx - 2, ry + 2, bw + 4, rh);
  // Snow-dusted log planks (individual logs)
  const logH = Math.floor(rh / 5);
  for (let i = 0; i < 5; i++) {
    const ly = ry + i * logH;
    const logCol = i % 2 === 0 ? 0x7A5030 : 0x5A3820;
    g.fillStyle(logCol); g.fillRect(bx, ly, bw, logH - 1);
    g.fillStyle(logCol + 0x101010, 0.5); g.fillRect(bx + 2, ly + 1, bw - 4, logH * 0.4);
    // Snow on top of each log
    g.fillStyle(0xE8F4F8, 0.55); g.fillRect(bx + 3, ly, bw - 6, 3);
  }
  // Side rails (rope + post)
  g.fillStyle(0x4A2E14); g.fillRect(bx - 5, ry - 6, 8, rh + 10);
  g.fillStyle(0x4A2E14); g.fillRect(bx + bw - 3, ry - 6, 8, rh + 10);
  // Rope lines
  g.lineStyle(1, 0x8B6030, 0.7);
  g.lineBetween(bx - 1, ry - 4, bx + bw + 1, ry - 4);
  g.lineBetween(bx - 1, ry + rh + 2, bx + bw + 1, ry + rh + 2);
  // Snow caps on posts
  g.fillStyle(0xDDF0FF, 0.8);
  g.fillEllipse(bx - 1, ry - 8, 12, 6);
  g.fillEllipse(bx + bw + 1, ry - 8, 12, 6);
}

function _drawIceCrystal(g, cx, cy, scale) {
  const s = scale;
  g.fillStyle(0xBBE4FF, 0.7);
  g.fillTriangle(cx, cy - 28 * s, cx - 8 * s, cy, cx + 8 * s, cy);
  g.fillStyle(0xDDF4FF, 0.5);
  g.fillTriangle(cx - 3 * s, cy - 20 * s, cx - 12 * s, cy + 8 * s, cx, cy + 4 * s);
  g.fillStyle(0xAAD8FF, 0.65);
  g.fillTriangle(cx + 3 * s, cy - 22 * s, cx, cy + 6 * s, cx + 14 * s, cy + 2 * s);
  g.fillStyle(0xEEF8FF, 0.4);
  g.fillTriangle(cx - 2 * s, cy - 26 * s, cx + 2 * s, cy - 26 * s, cx, cy - 14 * s);
}

export function drawSnowAnimation(scene) {
  const W = scene.scale.width;
  const H = scene.scale.height;
  const particles = Array.from({ length: 80 }, () => ({
    x: 62 + Math.random() * (W - 124),
    y: Math.random() * H,
    speed: 0.4 + Math.random() * 0.8,
    size: 1 + Math.random() * 2.5,
    drift: (Math.random() - 0.5) * 0.6
  }));

  const snowG = scene.add.graphics().setDepth(4).setAlpha(0.7);
  scene.time.addEvent({
    delay: 45, loop: true,
    callback: () => {
      snowG.clear();
      snowG.fillStyle(0xFFFFFF);
      for (const p of particles) {
        p.y += p.speed;
        p.x += Math.sin(p.y * 0.022) * 0.5 + p.drift;
        if (p.y > H) { p.y = -4; p.x = 62 + Math.random() * (W - 124); }
        if (p.x < 62) p.x = W - 64;
        if (p.x > W - 62) p.x = 64;
        snowG.fillRect(Math.round(p.x), Math.round(p.y), Math.ceil(p.size), Math.ceil(p.size));
      }
    }
  });
  return snowG;
}

export const MAP_CONFIG = {
  id: 'frostpeak_arena',
  name: 'Frostpeak Arena',
  bgColor: 0x0a1a2e,
  hazardType: 'ice',
  hazardSlowPct: 0.20,
  hazardZones: [
    { x: 0, y: 0, width: 62, height: 854 },
    { x: 418, y: 0, width: 62, height: 854 }
  ],
  battleTrack: 'frost_crown',
  ambientColor: 0x4A90D9
};
