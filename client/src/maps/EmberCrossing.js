// Map 1: Ember Crossing — Volcanic/lava theme

export function drawMap(scene) {
  const { width: W, height: H } = scene.scale;
  const g = scene.add.graphics().setDepth(0);

  // Dark volcanic background
  g.fillStyle(0x1a0800);
  g.fillRect(0, 0, W, H);

  // Stone path / lane (center)
  g.fillStyle(0x2C1810);
  g.fillRect(60, 0, W - 120, H);

  // Dark stone texture strips
  g.fillStyle(0x3D2218);
  for (let y = 0; y < H; y += 40) {
    g.fillRect(60, y, W - 120, 2);
  }

  // Lava rivers (flanks)
  // Left lava
  g.fillStyle(0xFF3300);
  g.fillRect(0, 0, 62, H);
  g.fillStyle(0xFF6600);
  g.fillRect(4, 0, 52, H);
  g.fillStyle(0xFF8C00);
  g.fillRect(12, 0, 36, H);
  g.fillStyle(0xFFAA00, 0.4);
  g.fillRect(20, 0, 22, H);

  // Right lava
  g.fillStyle(0xFF3300);
  g.fillRect(W - 62, 0, 62, H);
  g.fillStyle(0xFF6600);
  g.fillRect(W - 56, 0, 52, H);
  g.fillStyle(0xFF8C00);
  g.fillRect(W - 48, 0, 36, H);
  g.fillStyle(0xFFAA00, 0.4);
  g.fillRect(W - 42, 0, 22, H);

  // River divider (midline)
  g.lineStyle(3, 0xFF8800, 0.8);
  g.strokeRect(62, H / 2 - 1, W - 124, 2);

  // Lava animated overlay (static bubbles)
  g.fillStyle(0xFF4400, 0.5);
  for (let i = 0; i < 20; i++) {
    const bx = (Math.sin(i * 137.5) * 0.5 + 0.5) * 55;
    const by = (i / 20) * H;
    g.fillCircle(bx, by, 4 + Math.sin(i * 7) * 3);
    g.fillCircle(W - bx, by + 15, 4 + Math.cos(i * 5) * 3);
  }

  // River divider bridge (center line)
  g.fillStyle(0x4A2810);
  g.fillRect(100, H / 2 - 12, W - 200, 24);
  g.lineStyle(2, 0x8B4513, 1);
  g.strokeRect(100, H / 2 - 12, W - 200, 24);

  // Ember particles (static)
  g.fillStyle(0xFF6600, 0.7);
  for (let i = 0; i < 30; i++) {
    const px = 65 + Math.random() * (W - 130);
    const py = Math.random() * H;
    g.fillCircle(px, py, 1 + Math.random() * 2);
  }

  // Lava glow on walls
  g.fillStyle(0xFF4400, 0.12);
  g.fillRect(0, 0, W, H);

  return g;
}

export function drawLavaAnimation(scene, graphics) {
  let offset = 0;
  scene.time.addEvent({
    delay: 80,
    loop: true,
    callback: () => {
      offset = (offset + 2) % 40;
      // Draw scrolling lava lines
      graphics.fillStyle(0xFF5500, 0.15);
      for (let y = -40 + offset; y < scene.scale.height; y += 40) {
        graphics.fillRect(0, y, 62, 3);
        graphics.fillRect(scene.scale.width - 62, y + 20, 62, 3);
      }
    }
  });
}

export const MAP_CONFIG = {
  id: 'ember_crossing',
  name: 'Ember Crossing',
  bgColor: 0x1a0800,
  hazardType: 'lava',
  hazardDPS: 30,
  hazardZones: [
    { x: 0, y: 0, width: 62, height: 854 },
    { x: 418, y: 0, width: 62, height: 854 }
  ],
  battleTrack: 'ember_rush',
  ambientColor: 0xFF4400
};
