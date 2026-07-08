// Map 1: "Meadow Isles" — a grass island battlefield floating in the sea.
// Built entirely from the Tiny Swords CC0 tile set (Pixel Frog): water,
// foamed island edges, sand lane paths, wooden bridges over a central river,
// trees, rocks and meadow decorations. (File keeps its original name so the
// server map id 'ember_crossing' continues to work.)

const T = 64;                 // tile size
const COLS_PER_ROW = 10;      // tilemap_flat atlas layout

// tilemap_flat frame indexes (10 per row)
const G = {                    // grass block
  TL: 0,  T: 1,  T2: 2,  TR: 3,
  L: 10,  M: 11, M2: 12, R: 13,
  BL: 30, B: 31, B2: 32, BR: 33
};
const S = { M: 16, M2: 17 };   // sand inner tiles

export function drawMap(scene) {
  const { width: W, height: H } = scene.scale;
  const hasTiles = scene.textures.exists('tilemap_flat') && scene.textures.exists('water_tile');
  if (!hasTiles) return _fallback(scene, W, H);

  // ── Open sea underneath everything ────────────────────────────────────────
  scene.add.tileSprite(W / 2, H / 2, W + 64, H + 64, 'water_tile').setDepth(0);

  // Island geometry
  const IX = 16;                       // island left edge
  const ICOLS = 7;                     // 7 × 64 = 448 wide (fills 16..464)
  const IY = 56;                       // island top edge
  const IROWS = 12;                    // down to y = 824
  const RIVER_ROW = 5;                 // river occupies this row (y 376..440)
  const riverY = IY + RIVER_ROW * T;   // 376 — river band center ≈ 408

  // ── Foam ring around the island + river mouths (animated, under tiles) ───
  if (scene.anims.exists('foam_anim')) {
    const foamAt = (x, y) => {
      const f = scene.add.sprite(x, y, 'foam').setDepth(0).setScale(0.75);
      f.play({ key: 'foam_anim', startFrame: Math.floor(Math.random() * 8) });
    };
    for (let c = 0; c <= ICOLS; c += 2) {
      foamAt(IX + c * T, IY + 6);                    // top edge
      foamAt(IX + c * T, IY + IROWS * T - 6);        // bottom edge
    }
    for (let r = 1; r < IROWS; r += 2) {
      foamAt(IX + 6, IY + r * T);                    // left edge
      foamAt(IX + ICOLS * T - 6, IY + r * T);        // right edge
    }
    foamAt(IX + 40, riverY + T / 2); foamAt(IX + ICOLS * T - 40, riverY + T / 2);
  }

  // ── Island tiles ──────────────────────────────────────────────────────────
  // Lane columns (sand paths) — lanes at x=160 and x=320 → island cols 2 and 4
  const SAND_COLS = new Set([2, 4]);
  const tileAt = (c, r, frame) =>
    scene.add.image(IX + c * T + T / 2, IY + r * T + T / 2, 'tilemap_flat', frame).setDepth(1);

  for (let r = 0; r < IROWS; r++) {
    if (r === RIVER_ROW) continue;                   // river gap — water shows through
    for (let c = 0; c < ICOLS; c++) {
      let f;
      const top = r === 0 || r === RIVER_ROW + 1;    // island top or river's south bank
      const bot = r === IROWS - 1 || r === RIVER_ROW - 1; // island bottom or river's north bank
      const lef = c === 0, rig = c === ICOLS - 1;
      if      (top && lef) f = G.TL;
      else if (top && rig) f = G.TR;
      else if (bot && lef) f = G.BL;
      else if (bot && rig) f = G.BR;
      else if (top)        f = (c % 2) ? G.T : G.T2;
      else if (bot)        f = (c % 2) ? G.B : G.B2;
      else if (lef)        f = G.L;
      else if (rig)        f = G.R;
      else if (SAND_COLS.has(c)) f = ((c + r) % 2) ? S.M : S.M2;   // sand path
      else                 f = ((c + r) % 2) ? G.M : G.M2;
      tileAt(c, r, f);
    }
  }

  // ── Wooden bridges over the river (lanes) ─────────────────────────────────
  if (scene.textures.exists('bridge_all')) {
    for (const laneX of [IX + 2 * T + T / 2, IX + 4 * T + T / 2]) {
      scene.add.image(laneX, riverY - T / 2 + 40, 'bridge_all', 3).setDepth(1); // north end
      scene.add.image(laneX, riverY + T / 2,      'bridge_all', 6).setDepth(1); // span
      scene.add.image(laneX, riverY + T + 24,     'bridge_all', 9).setDepth(1); // south end
    }
  }

  // ── Rocks bobbing in the sea ──────────────────────────────────────────────
  if (scene.textures.exists('rocks_01')) {
    [[W - 26, 180], [24, 520], [W - 30, 700]].forEach(([x, y], i) => {
      scene.add.image(x, y, 'rocks_01', i % 3).setDepth(0).setScale(0.55);
    });
  }

  // ── Trees along the island flanks ─────────────────────────────────────────
  if (scene.textures.exists('tree')) {
    [[52, 150], [W - 52, 250], [52, 560], [W - 52, 640]].forEach(([x, y]) => {
      scene.add.image(x, y, 'tree', 0).setDepth(2).setScale(0.62);
    });
  }

  // ── Meadow decorations (bushes, flowers, mushrooms, pumpkins) ─────────────
  const deco = ['deco_01', 'deco_02', 'deco_03', 'deco_04', 'deco_05', 'deco_06',
                'deco_07', 'deco_08', 'deco_09', 'deco_10', 'deco_14'];
  const spots = [[105, 120], [370, 135], [220, 250], [60, 320], [415, 330],
                 [90, 500], [390, 520], [225, 590], [70, 730], [410, 750], [240, 320]];
  spots.forEach(([x, y], i) => {
    const key = deco[i % deco.length];
    if (scene.textures.exists(key)) scene.add.image(x, y, key).setDepth(1).setScale(0.9);
  });

  // ── A happy sheep or two near the kings ───────────────────────────────────
  if (scene.anims.exists('sheep_anim')) {
    [[168, 796], [318, 66]].forEach(([x, y]) => {
      const sh = scene.add.sprite(x, y, 'sheep').setDepth(2).setScale(0.55);
      sh.play({ key: 'sheep_anim', startFrame: Math.floor(Math.random() * 6) });
    });
  }

  // ── Soft vignette top/bottom for HUD readability ──────────────────────────
  const vigG = scene.add.graphics().setDepth(3);
  vigG.fillStyle(0x000000, 0.30); vigG.fillRect(0, 0, W, 84);
  vigG.fillStyle(0x000000, 0.18); vigG.fillRect(0, H - 96, W, 96);

  return null;
}

// Minimal fallback if the tile assets failed to load
function _fallback(scene, W, H) {
  const bg = scene.add.graphics().setDepth(0);
  bg.fillStyle(0x3E7C4F); bg.fillRect(0, 0, W, H);
  bg.fillStyle(0x2E6ABF); bg.fillRect(0, H * 0.47, W, 40);
  return bg;
}

export const MAP_CONFIG = {
  id: 'ember_crossing',          // keep server id
  name: 'Meadow Isles',
  bgColor: 0x47ABCE,
  hazardType: null,
  hazardDPS: 0,
  hazardZones: [],
  battleTrack: 'ember_rush',
  ambientColor: 0x7EC850
};
