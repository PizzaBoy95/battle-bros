// Resolves the best available "hero" image texture for a character and helps
// place it while preserving aspect ratio.
//
// Priority:
//   1. `${id}_art` — hand-authored vector (SVG) art   (CharacterArt.js)
//   2. `${id}`     — imported sprite (Kenney CC0 PNG)  (public/assets/characters)
//   3. (cards only) `${id}_p` — generated canvas portrait (CharacterGraphics.js)
//
// Returns null when nothing exists, so callers fall back to DRAW_FUNCS.

export function heroTexKey(scene, id) {
  if (scene.textures.exists(id + '_art')) return id + '_art';
  if (scene.textures.exists(id))          return id;
  return null;
}

export function cardTexKey(scene, id) {
  return heroTexKey(scene, id) || (scene.textures.exists(id + '_p') ? id + '_p' : null);
}

// True when the resolved key is a full-body imported/vector sprite (not the
// generated canvas portrait). Used to decide aspect-fit vs stretch-fill, and
// whether the battle renderer should add procedural legs.
export function isSpriteKey(key, id) {
  return key === id + '_art' || key === id;
}

// Add an image, fitting inside (maxW, maxH). `fill` stretches to fill instead.
export function placeHero(scene, x, y, key, maxW, maxH, { fill = false, originY = 0.5 } = {}) {
  const img = scene.add.image(x, y, key).setOrigin(0.5, originY);
  if (fill) {
    img.setDisplaySize(maxW, maxH);
  } else {
    const src = scene.textures.get(key).getSourceImage();
    const s = Math.min(maxW / src.width, maxH / src.height);
    img.setDisplaySize(src.width * s, src.height * s);
  }
  return img;
}
