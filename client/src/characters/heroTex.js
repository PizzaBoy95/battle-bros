// Resolves the best available "hero" image texture for a character and helps
// place it while preserving aspect ratio.
//
// Priority:
//   1. `${id}_port` — trimmed portrait generated from the imported animation
//                     packs (public/assets/portraits/)
//   2. `${id}_art`  — hand-authored vector (SVG) art  (legacy)
//   3. `${id}`      — imported static sprite (legacy Kenney PNG)
//   4. (cards only) `${id}_p` — generated canvas portrait
//
// Returns null when nothing exists, so callers fall back to DRAW_FUNCS.

// Animation manifest (public/assets/heroes/manifest.json), set by BootScene
// once loaded. Keys: charId → { anims: {idle/run/attack/death: {fw,fh,n}},
// trim: {x,y,w,h,bottom}, tint, proj, boom }.
let HERO_MANIFEST = {};
export function setHeroManifest(m) { HERO_MANIFEST = m || {}; }
export function heroAnim(id) { return HERO_MANIFEST[id] || null; }

export function heroTexKey(scene, id) {
  if (scene.textures.exists(id + '_port')) return id + '_port';
  if (scene.textures.exists(id + '_art'))  return id + '_art';
  if (scene.textures.exists(id))           return id;
  return null;
}

export function cardTexKey(scene, id) {
  return heroTexKey(scene, id) || (scene.textures.exists(id + '_p') ? id + '_p' : null);
}

// True when the resolved key is a full-body imported/vector sprite (not the
// generated canvas portrait).
export function isSpriteKey(key, id) {
  return key === id + '_port' || key === id + '_art' || key === id;
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
