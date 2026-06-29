// Map 2: Frostpeak Arena — Ice/snow theme

export function drawMap(scene) {
  const { width: W, height: H } = scene.scale;
  const g = scene.add.graphics().setDepth(0);

  // Deep blue sky/background
  g.fillStyle(0x0a1a2e);
  g.fillRect(0, 0, W, H);

  // Snow/ice path (center)
  g.fillStyle(0xC8DCE8);
  g.fillRect(60, 0, W - 120, H);

  // Ice tile lines
  g.lineStyle(1, 0xADD8E6, 0.4);
  for (let y = 0; y < H; y += 50) {
    g.strokeRect(62, y, W - 124, 50);
  }
  for (let x = 62; x < W - 62; x += 50) {
    g.lineBetween(x, 0, x, H);
  }

  // Glacier walls (flanks)
  g.fillStyle(0x2C4A6B);
  g.fillRect(0, 0, 62, H);
  g.fillRect(W - 62, 0, 62, H);

  // Ice face highlights on glaciers
  g.fillStyle(0x5D8AA8, 0.6);
  g.fillRect(4, 0, 38, H);
  g.fillRect(W - 42, 0, 38, H);

  g.fillStyle(0xADD8E6, 0.3);
  g.fillRect(12, 0, 20, H);
  g.fillRect(W - 32, 0, 20, H);

  // Glacier cracks
  g.lineStyle(1, 0x0a1a2e, 0.5);
  for (let i = 0; i < 8; i++) {
    const sy = (i / 8) * H;
    g.lineBetween(8, sy, 30, sy + 40);
    g.lineBetween(W - 8, sy + 20, W - 30, sy + 60);
  }

  // Center divider (frozen river)
  g.fillStyle(0x4A90D9, 0.5);
  g.fillRect(62, H / 2 - 14, W - 124, 28);
  g.fillStyle(0x7FCDFF, 0.4);
  g.fillRect(80, H / 2 - 10, W - 160, 20);

  // Ice crystals on divider
  g.fillStyle(0xE0F0FF);
  for (let x = 100; x < W - 100; x += 60) {
    const cx = x, cy = H / 2;
    g.fillTriangle(cx, cy - 12, cx - 6, cy, cx + 6, cy);
    g.fillTriangle(cx, cy + 12, cx - 6, cy, cx + 6, cy);
  }

  // Snow drifts at edges of path
  g.fillStyle(0xE8F4F8, 0.7);
  for (let y = 0; y < H; y += 80) {
    g.fillEllipse(80, y + 40, 30, 20);
    g.fillEllipse(W - 80, y + 60, 30, 20);
  }

  // Snowflake particles (static)
  g.fillStyle(0xFFFFFF, 0.8);
  for (let i = 0; i < 40; i++) {
    const px = 65 + Math.random() * (W - 130);
    const py = Math.random() * H;
    g.fillRect(px, py, 2, 2);
  }

  // Cold blue tint overlay
  g.fillStyle(0x0066AA, 0.05);
  g.fillRect(0, 0, W, H);

  return g;
}

export function drawSnowAnimation(scene) {
  const particles = [];
  const W = scene.scale.width;
  const H = scene.scale.height;

  for (let i = 0; i < 60; i++) {
    particles.push({
      x: 62 + Math.random() * (W - 124),
      y: Math.random() * H,
      speed: 0.3 + Math.random() * 0.7,
      size: 1 + Math.random() * 2
    });
  }

  const snowG = scene.add.graphics().setDepth(1).setAlpha(0.6);

  scene.time.addEvent({
    delay: 50,
    loop: true,
    callback: () => {
      snowG.clear();
      snowG.fillStyle(0xFFFFFF);
      for (const p of particles) {
        p.y += p.speed;
        p.x += Math.sin(p.y * 0.02) * 0.4;
        if (p.y > H) { p.y = -5; p.x = 62 + Math.random() * (W - 124); }
        snowG.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
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
