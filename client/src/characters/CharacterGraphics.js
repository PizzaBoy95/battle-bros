import Phaser from 'phaser';
import { CHARACTERS, RARITY_COLORS } from './CharacterRegistry.js';

// Draws a character onto a Phaser.GameObjects.Graphics object centered at (0,0)
// Size: roughly 40x60 pixels for battle units

const DRAW_FUNCS = {
  titan_grunt(g) {
    // Massive legendary armored warrior — multi-layer shading for 3D feel
    // Body (dark base + highlight)
    g.fillStyle(0x3E2208); g.fillRect(-21, -27, 42, 51);  // shadow side
    g.fillStyle(0x6B3A12); g.fillRect(-20, -28, 40, 50);  // body
    g.fillStyle(0x8A5020, 0.5); g.fillRect(-20, -28, 10, 50); // highlight strip
    // Shoulder pauldrons
    g.fillStyle(0x808080); g.fillRect(-26, -30, 48, 14);
    g.fillStyle(0xC8C8C8); g.fillRect(-24, -32, 44, 10);
    g.fillStyle(0xE8E8E8, 0.4); g.fillRect(-22, -32, 8, 6); // light sheen
    // Helm
    g.fillStyle(0x555555); g.fillCircle(0, -38, 15);
    g.fillStyle(0x909090); g.fillCircle(0, -38, 13);
    g.fillStyle(0xCCCCCC, 0.3); g.fillCircle(-4, -42, 6);   // helm glint
    g.fillStyle(0x555555); g.fillRect(-4, -44, 8, 5);       // crest
    // Visor slit
    g.fillStyle(0xFF4400, 0.8); g.fillRect(-8, -38, 16, 4);
    // War axe (left hand)
    g.fillStyle(0x8B7355); g.fillRect(-24, -12, 6, 28);
    g.fillStyle(0xC8C8C8); g.fillTriangle(-28, -14, -16, -14, -22, -28);
    g.fillStyle(0xE8E8E8, 0.4); g.fillTriangle(-27, -15, -23, -15, -25, -25); // blade sheen
    // Tower shield (right)
    g.fillStyle(0x444444); g.fillRect(11, -28, 18, 36);
    g.fillStyle(0x666666); g.fillRect(12, -27, 16, 34);
    g.fillStyle(0xFFD700); g.fillCircle(20, -10, 5);
    g.fillStyle(0xFFEE88, 0.5); g.fillCircle(18, -12, 2.5);
    // Belt details
    g.fillStyle(0xFFD700, 0.7); g.fillRect(-20, 12, 40, 4);
  },

  pyro_drake(g) {
    // Dragon with wings
    g.fillStyle(0xFF4500); g.fillEllipse(0, -10, 30, 44); // body
    g.fillStyle(0xFF8C00); g.fillCircle(0, -36, 12);      // head
    g.fillStyle(0xFF0000);
    // Wings (triangles)
    g.fillTriangle(-14, -20, -40, -40, -14, 0);
    g.fillTriangle(14, -20, 40, -40, 14, 0);
    g.fillStyle(0xFFD700); g.fillEllipse(0, -42, 6, 10);  // snout
    g.fillStyle(0xFF6600); g.fillRect(-4, 18, 8, 16);     // tail
  },

  lady_vex(g) {
    // Female mage with staff
    g.fillStyle(0x9B59B6); g.fillEllipse(0, -12, 22, 40); // robe body
    g.fillStyle(0xFAD7A0); g.fillCircle(0, -36, 10);      // face
    g.fillStyle(0x8E44AD);
    g.fillTriangle(-12, -44, 12, -44, 0, -28);            // magic hair/crown
    g.fillStyle(0xFAD7A0); g.fillRect(-20, -28, 4, 18);   // left arm
    g.fillStyle(0xE91E8C); g.fillRect(-22, -36, 4, 4);    // magic orb hand
    g.fillStyle(0x2980B9);
    // Stars/sparkles
    g.fillCircle(-30, -18, 4); g.fillCircle(28, -30, 3); g.fillCircle(-24, -8, 3);
    // Staff
    g.fillStyle(0xFFD700); g.fillRect(14, -42, 4, 50);
    g.fillCircle(16, -44, 8);
    g.fillStyle(0xE91E8C); g.fillCircle(16, -44, 5);
  },

  bone_shard(g) {
    // Dark summoner in hooded robe
    g.fillStyle(0x1A1A2E); g.fillEllipse(0, -10, 28, 46); // robe
    g.fillStyle(0x2C3E50); g.fillTriangle(-14, -30, 14, -30, 0, -50); // hood
    g.fillStyle(0xF0E68C); g.fillCircle(0, -36, 7);       // skull face
    g.fillStyle(0x1A1A2E); g.fillRect(-3, -38, 2, 4);     // eye socket
    g.fillRect(1, -38, 2, 4);
    g.fillStyle(0x8E44AD);
    g.fillCircle(-20, -10, 5); g.fillCircle(20, -10, 5);  // soul orbs
    g.fillCircle(0, 14, 6);
    g.fillStyle(0x6C3483); g.fillRect(-2, -26, 4, 50);    // staff
  },

  iron_bro(g) {
    // Tank with shield and sword
    g.fillStyle(0x1F618D); g.fillRect(-16, -28, 32, 50); // body armor
    g.fillStyle(0x2E86C1); g.fillCircle(0, -38, 12);     // helmet
    g.fillStyle(0x85C1E9); g.fillRect(-6, -44, 12, 6);   // visor
    g.fillStyle(0x7F8C8D); g.fillRect(12, -32, 18, 36);  // large shield
    g.fillStyle(0xFFD700); g.fillCircle(21, -14, 4);     // shield boss
    g.fillStyle(0xC0C0C0); g.fillRect(-20, -26, 6, 30);  // sword
    g.fillStyle(0xFFD700); g.fillRect(-24, -22, 14, 4);  // crossguard
  },

  stone_golem(g) {
    // Massive rock monster — layered shading for stone 3D effect
    // Arm shadows
    g.fillStyle(0x3A4040); g.fillRect(-35, -22, 12, 34); // left arm shadow
    g.fillRect(23, -22, 12, 34);                          // right arm shadow
    // Arms
    g.fillStyle(0x5A6465); g.fillRect(-34, -22, 12, 34);
    g.fillRect(22, -22, 12, 34);
    // Arm highlights
    g.fillStyle(0x7A8888, 0.5); g.fillRect(-34, -22, 4, 34);
    // Body shadow
    g.fillStyle(0x3A4040); g.fillRect(-22, -26, 46, 58);
    // Body
    g.fillStyle(0x5A6465); g.fillRect(-22, -28, 44, 56);
    // Stone crack textures
    g.fillStyle(0x404848, 0.9);
    g.fillRect(-18, -16, 36, 2); g.fillRect(-18, -4, 36, 2); g.fillRect(-18, 8, 36, 2);
    g.fillRect(-10, -22, 2, 12); g.fillRect(8, -8, 2, 16);  // vertical cracks
    // Body highlight (top-left light)
    g.fillStyle(0x7A8888, 0.4); g.fillRect(-22, -28, 8, 56);
    // Head shadow
    g.fillStyle(0x3A4040); g.fillCircle(2, -37, 18);
    // Head
    g.fillStyle(0x5A6465); g.fillCircle(0, -38, 18);
    // Eye sockets
    g.fillStyle(0x252E2E); g.fillRect(-9, -41, 7, 8); g.fillRect(2, -41, 7, 8);
    // Glowing eyes
    g.fillStyle(0xFF8800); g.fillCircle(-5.5, -37, 3.5); g.fillCircle(5.5, -37, 3.5);
    g.fillStyle(0xFFCC00, 0.6); g.fillCircle(-5.5, -37, 1.5); g.fillCircle(5.5, -37, 1.5);
    // Head highlight
    g.fillStyle(0x7A8888, 0.35); g.fillCircle(-6, -42, 8);
    // Mossy patches
    g.fillStyle(0x2D6A4F, 0.5); g.fillCircle(10, -20, 6); g.fillCircle(-14, -2, 5);
  },

  thunder_chief(g) {
    // Berserker with two axes
    g.fillStyle(0xA04000); g.fillRect(-14, -28, 28, 46); // body
    g.fillStyle(0xE67E22); g.fillCircle(0, -38, 12);     // head
    g.fillStyle(0xC0392B); g.fillRect(-14, -40, 28, 8);  // war paint band
    g.fillStyle(0x7D6608); g.fillRect(-28, -30, 10, 32); // left axe handle
    g.fillTriangle(-30, -30, -18, -28, -28, -44);        // left axe blade
    g.fillRect(18, -30, 10, 32);                          // right axe handle
    g.fillTriangle(20, -30, 32, -28, 22, -44);           // right axe blade
    g.fillStyle(0xFF6600);
    g.fillCircle(-22, 0, 4); g.fillCircle(22, 0, 4);    // lightning orbs
  },

  blaze_witch(g) {
    // Witch with pointed hat and fire
    g.fillStyle(0x1A1A1A); g.fillEllipse(0, -6, 22, 40); // robe body
    g.fillStyle(0xFF6B00);
    g.fillTriangle(-12, -28, 12, -28, 0, -56);           // pointed hat
    g.fillStyle(0xFAD7A0); g.fillCircle(0, -34, 9);      // face
    g.fillStyle(0xFF4500);
    g.fillCircle(-16, -2, 6); g.fillCircle(16, -2, 6);   // fire hands
    g.fillCircle(-16, -8, 4); g.fillCircle(16, -8, 4);
    g.fillCircle(0, 18, 8); g.fillCircle(0, 24, 5);      // fire base
    g.fillStyle(0xFF8C00); g.fillCircle(-10, 14, 5); g.fillCircle(10, 14, 5);
  },

  wing_knight(g) {
    // Flying knight with silver armor and white wings
    g.fillStyle(0xBDC3C7); g.fillRect(-14, -26, 28, 44); // silver armor
    g.fillStyle(0xECF0F1); g.fillCircle(0, -36, 12);     // helmet
    g.fillStyle(0x2C3E50); g.fillRect(-6, -42, 12, 6);   // visor
    // Wings
    g.fillStyle(0xF0F4F8);
    g.fillTriangle(-16, -22, -44, -44, -12, 8);
    g.fillTriangle(16, -22, 44, -44, 12, 8);
    g.fillStyle(0xABB2B9); // wing detail
    g.fillTriangle(-16, -14, -36, -36, -10, -2);
    g.fillTriangle(16, -14, 36, -36, 10, -2);
    g.fillStyle(0xFFD700); g.fillRect(-4, -32, 8, 44);   // lance
  },

  frostborn(g) {
    // Ice wizard in blue robes
    g.fillStyle(0x1A5276); g.fillEllipse(0, -8, 26, 44); // robe
    g.fillStyle(0xD6EAF8); g.fillCircle(0, -36, 11);     // face
    g.fillStyle(0x2E86C1);
    // Ice crown
    g.fillTriangle(-12, -44, -6, -50, 0, -44);
    g.fillTriangle(0, -44, 6, -50, 12, -44);
    g.fillStyle(0xADD8E6);
    g.fillCircle(-20, -10, 7); g.fillCircle(20, -10, 7); // ice orbs
    g.fillStyle(0xFFFFFF);
    g.fillRect(-2, -22, 4, 40);                           // staff
    g.fillCircle(0, -24, 9);
    g.fillStyle(0x85C1E9); g.fillCircle(0, -24, 6);      // ice crystal
  },

  jade_monk(g) {
    // Green-robed monk with staff
    g.fillStyle(0x1E8449); g.fillEllipse(0, -8, 24, 44); // robe
    g.fillStyle(0xFAD7A0); g.fillCircle(0, -36, 10);     // face
    g.fillStyle(0x239B56); g.fillRect(-12, -24, 24, 8);  // belt sash
    g.fillStyle(0x8B4513); g.fillRect(-20, -42, 4, 56);  // staff left
    g.fillStyle(0xFFD700);
    g.fillCircle(-18, -44, 6); g.fillCircle(-18, 18, 4); // staff ends
    g.fillStyle(0x52BE80); g.fillCircle(10, -10, 5);     // jade orb
    g.fillCircle(14, 0, 4);
    // Healing sparkle
    g.fillStyle(0x2ECC71); g.fillCircle(20, -24, 3); g.fillCircle(24, -14, 3);
  },

  sea_crusher(g) {
    // Aquatic tank with water cannon arm
    g.fillStyle(0x0E6655); g.fillRect(-16, -26, 32, 50); // body
    g.fillStyle(0x16A085); g.fillCircle(0, -36, 13);     // head
    g.fillStyle(0x1ABC9C); g.fillRect(-6, -40, 12, 8);   // face plate
    // Water cannon arm
    g.fillStyle(0x0B5345); g.fillRect(16, -22, 20, 14);  // cannon barrel
    g.fillCircle(36, -15, 7);                              // cannon end
    g.fillStyle(0x1ABC9C); g.fillCircle(36, -15, 4);
    g.fillStyle(0x85C1E9);
    g.fillCircle(40, -18, 3); g.fillCircle(44, -14, 2);  // water droplets
    g.fillStyle(0x0B5345); g.fillRect(-28, -20, 14, 12); // shield arm
  },

  crystal_sage(g) {
    // Purple mage with crystal formations
    g.fillStyle(0x6C3483); g.fillEllipse(0, -8, 24, 42); // robe
    g.fillStyle(0xD7BDE2); g.fillCircle(0, -36, 10);     // face
    // Crystal crown
    g.fillStyle(0xA29BFE);
    g.fillTriangle(-10, -44, -4, -56, 2, -44);
    g.fillTriangle(2, -44, 8, -54, 14, -44);
    g.fillTriangle(-16, -42, -10, -50, -4, -42);
    // Floating crystals
    g.fillStyle(0xFD79A8);
    g.fillTriangle(-24, -20, -18, -30, -12, -20);
    g.fillTriangle(12, -18, 18, -28, 24, -18);
    g.fillStyle(0xA29BFE); g.fillCircle(0, 10, 8);       // crystal orb bottom
  },

  arrow_jack(g) {
    // Ranger archer
    g.fillStyle(0x4A7C24); g.fillRect(-10, -28, 20, 44); // body
    g.fillStyle(0x8B6914); g.fillCircle(0, -38, 10);     // head
    g.fillStyle(0x4A7C24); g.fillRect(-4, -38, 2, 2);    // eye
    // Bow
    g.fillStyle(0x8B4513);
    g.fillRect(-22, -26, 4, 32);  // bow stave
    g.fillCircle(-20, -26, 5);    // bow tip top
    g.fillCircle(-20, 6, 5);      // bow tip bottom
    // Arrow
    g.fillStyle(0xC0C0C0); g.fillRect(-20, -12, 20, 2);
    g.fillStyle(0x8B0000); g.fillTriangle(-20, -16, -20, -8, -14, -10);
  },

  shadow_rogue(g) {
    // Dark assassin with dual daggers
    g.fillStyle(0x1C1C1C); g.fillRect(-10, -26, 20, 42); // body
    g.fillStyle(0x2D2D2D); g.fillCircle(0, -36, 9);      // hooded head
    // Daggers
    g.fillStyle(0xBDC3C7); g.fillRect(-22, -28, 4, 24); // left dagger
    g.fillTriangle(-22, -28, -18, -28, -20, -36);        // left tip
    g.fillRect(18, -28, 4, 24);                           // right dagger
    g.fillTriangle(18, -28, 22, -28, 20, -36);           // right tip
    g.fillStyle(0xFF0000); g.fillCircle(-2, -34, 2);     // glowing eye
    g.fillCircle(2, -34, 2);
  },

  skywing(g) {
    // Aerial bomber with wings
    g.fillStyle(0x0652DD); g.fillRect(-10, -22, 20, 38); // body
    g.fillStyle(0x74B9FF); g.fillCircle(0, -32, 10);     // head
    // Wings
    g.fillStyle(0x0652DD);
    g.fillTriangle(-12, -18, -38, -36, -10, 6);
    g.fillTriangle(12, -18, 38, -36, 10, 6);
    g.fillStyle(0x74B9FF);
    g.fillTriangle(-12, -10, -30, -28, -8, 0);
    g.fillTriangle(12, -10, 30, -28, 8, 0);
    // Bombs
    g.fillStyle(0x2D3436); g.fillCircle(-6, 12, 5); g.fillCircle(6, 12, 5);
    g.fillStyle(0xFFD700); g.fillCircle(-6, 12, 2); g.fillCircle(6, 12, 2);
  },

  volt_ranger(g) {
    // Electric archer in yellow
    g.fillStyle(0xD4AC0D); g.fillRect(-10, -26, 20, 42); // body
    g.fillStyle(0xF9CA24); g.fillCircle(0, -36, 10);     // head
    g.fillStyle(0x0652DD); g.fillRect(-4, -40, 8, 8);    // visor
    // Electric bow
    g.fillStyle(0xF9CA24); g.fillRect(-22, -22, 3, 26);  // bow
    g.fillCircle(-20, -22, 4); g.fillCircle(-20, 4, 4);
    // Lightning bolt arrow
    g.fillStyle(0xFFFFFF);
    g.fillRect(-20, -10, 20, 2);
    g.fillStyle(0xF9CA24);
    g.fillTriangle(0, -14, 4, -10, 0, -6);
    // Sparks
    g.fillCircle(10, -8, 3); g.fillCircle(14, -12, 2);
  },

  toxin_toad(g) {
    // Fat toad shape
    g.fillStyle(0x1D8A5E); g.fillEllipse(0, -4, 38, 42); // body
    g.fillStyle(0x27AE60); g.fillCircle(0, -24, 16);     // head (big)
    g.fillStyle(0xFFFF00); g.fillCircle(-7, -26, 5);     // left eye
    g.fillCircle(7, -26, 5);
    g.fillStyle(0x000000); g.fillCircle(-7, -26, 2);     // pupils
    g.fillCircle(7, -26, 2);
    // Toxic bumps
    g.fillStyle(0x00B894);
    g.fillCircle(-14, -4, 5); g.fillCircle(14, -4, 5);
    g.fillCircle(-8, 12, 4); g.fillCircle(8, 12, 4);
    // Dripping poison
    g.fillStyle(0x55EFC4); g.fillCircle(-4, 22, 3); g.fillCircle(4, 22, 3);
    g.fillCircle(0, 26, 2);
  },

  neon_wraith(g) {
    // Translucent ghost shape
    g.fillStyle(0x00CEC9, 0.7); g.fillEllipse(0, -10, 30, 50); // ghost body
    g.fillStyle(0xDFE6E9, 0.6); g.fillCircle(0, -32, 13);      // head
    // Glowing eyes
    g.fillStyle(0x00B894); g.fillCircle(-6, -34, 5); g.fillCircle(6, -34, 5);
    g.fillStyle(0xFFFFFF); g.fillCircle(-6, -34, 2); g.fillCircle(6, -34, 2);
    // Wispy tail
    g.fillStyle(0x00CEC9, 0.5);
    g.fillEllipse(-8, 18, 10, 18);
    g.fillEllipse(8, 20, 10, 14);
    g.fillEllipse(0, 22, 12, 10);
    // Neon glow dots
    g.fillStyle(0x00FFFF); g.fillCircle(-16, -8, 3); g.fillCircle(16, -6, 3);
  },

  forge_dwarf(g) {
    // Short wide dwarf with goggles and tools
    g.fillStyle(0xA0522D); g.fillRect(-16, -18, 32, 38); // stout body
    g.fillStyle(0xE17055); g.fillCircle(0, -28, 13);     // big round head
    g.fillStyle(0x2C3E50); g.fillRect(-10, -32, 20, 8);  // goggles band
    g.fillStyle(0xF39C12); g.fillCircle(-5, -29, 5);     // left goggle
    g.fillCircle(5, -29, 5);
    g.fillStyle(0xFDCB6E); g.fillCircle(-5, -29, 3);
    g.fillCircle(5, -29, 3);
    // Wrench
    g.fillStyle(0x7F8C8D); g.fillRect(-26, -16, 6, 26);
    g.fillRect(-30, -16, 14, 6);
    g.fillRect(-30, -10, 14, 6);
    // Tool belt
    g.fillStyle(0x6B3A2A); g.fillRect(-16, 12, 32, 6);
    g.fillStyle(0xFDCB6E); g.fillCircle(-6, 15, 3); g.fillCircle(6, 15, 3);
  },

  // ── Skeleton minion (for Bone Shard special) ────────────────────────────────
  _skeleton(g) {
    g.fillStyle(0xF0E68C); g.fillCircle(0, -26, 7);      // skull
    g.fillStyle(0xF0E68C); g.fillRect(-5, -20, 10, 20);  // ribcage
    g.fillRect(-3, 0, 6, 14);                              // legs
    g.fillRect(-8, -16, 6, 3);                             // left arm
    g.fillRect(2, -16, 6, 3);                              // right arm
    g.fillStyle(0x1A1A1A); g.fillRect(-3, -28, 2, 3);    // eye
    g.fillRect(1, -28, 2, 3);
  }
};

// Wrap every public draw function to add a ground shadow and top-light sheen.
// This gives all units a grounded, slightly 3D appearance with minimal extra code.
for (const key of Object.keys(DRAW_FUNCS)) {
  if (key.startsWith('_')) continue; // skip private helpers
  const original = DRAW_FUNCS[key];
  DRAW_FUNCS[key] = (g) => {
    // Ground shadow (oval beneath the unit)
    g.fillStyle(0x000000, 0.30);
    g.fillEllipse(5, 26, 46, 10);
    // Draw the character
    original(g);
    // Top-left ambient light hint (very subtle)
    g.fillStyle(0xFFFFFF, 0.04);
    g.fillCircle(-12, -44, 18);
  };
}

export function generateCharacterTexture(scene, charId, size = 40) {
  const key = `char_${charId}_${size}`;
  if (scene.textures.exists(key)) return key;

  const rt = scene.add.renderTexture(0, 0, size, size * 1.5);
  const g = scene.add.graphics();

  const drawFn = DRAW_FUNCS[charId];
  if (drawFn) {
    g.x = size / 2;
    g.y = size;
    drawFn(g);
  } else {
    g.fillStyle(0x888888);
    g.fillRect(0, 0, size, size);
  }

  rt.draw(g, 0, 0);
  rt.saveTexture(key);
  g.destroy();
  rt.destroy();
  return key;
}

export function drawCharacter(g, charId, x, y, scale = 1, alpha = 1) {
  const fn = DRAW_FUNCS[charId];
  if (!fn) return;
  g.save?.();
  g.setAlpha?.(alpha);
  g.translateCanvas?.(x, y);
  fn(g);
  g.restoreCanvas?.();
}

// All characters are rendered directly via DRAW_FUNCS on positioned Graphics objects.
// Pre-generated textures are not required; this is a no-op stub kept for future use.
export function generateAllTextures(_scene) {}

export { DRAW_FUNCS };
