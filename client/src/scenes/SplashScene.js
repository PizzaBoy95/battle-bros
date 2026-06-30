import Phaser from 'phaser';
import { audioSystem } from '../systems/AudioSystem.js';
import { CHARACTERS } from '../characters/CharacterRegistry.js';
import { cardTexKey, placeHero } from '../characters/heroTex.js';

const RARITY_GLOW = { legendary: 0xFFD24A, epic: 0xC061FF, rare: 0x4FA8FF, common: 0x8FA0C0 };

// Featured roster shown standing along the bottom of the title screen
const SHOWCASE = ['titan_grunt', 'pyro_drake', 'lady_vex', 'wing_knight', 'arrow_jack', 'blaze_witch'];

export class SplashScene extends Phaser.Scene {
  constructor() { super('Splash'); }

  init(data) {
    this.autoLogin = data?.autoLogin || false;
    this._proceeded = false;
    this._embers = [];
  }

  create() {
    const { width: W, height: H } = this.scale;
    this.W = W; this.H = H;

    // ── Rich arena backdrop (deep royal blue → navy), NOT flat black ──────────
    const bg = this.add.graphics().setDepth(0);
    bg.fillGradientStyle(0x1b2f78, 0x16276a, 0x070b1c, 0x04060f, 1);
    bg.fillRect(0, 0, W, H);
    // Floor wash at the bottom (the battlefield horizon)
    bg.fillStyle(0x0a1430, 0.9); bg.fillRect(0, H * 0.74, W, H * 0.26);
    bg.fillStyle(0x24407e, 0.35); bg.fillEllipse(W / 2, H * 0.78, W * 1.3, H * 0.16);

    // ── Vignette (darken edges, focus center) ────────────────────────────────
    const vig = this.add.graphics().setDepth(0);
    for (let i = 0; i < 6; i++) {
      vig.fillStyle(0x000000, 0.06);
      vig.fillRect(0, 0, W, 6 + i * 7);
      vig.fillRect(0, H - (6 + i * 7), W, 6 + i * 7);
    }
    vig.fillStyle(0x000000, 0.22); vig.fillRect(0, 0, 40, H);
    vig.fillStyle(0x000000, 0.22); vig.fillRect(W - 40, 0, 40, H);

    const SY = H * 0.26;

    // ── Rotating golden god-rays behind the emblem ───────────────────────────
    this._rayG = this.add.graphics().setDepth(1);
    this._drawRays(this._rayG);
    this._rayG.setPosition(W / 2, SY);
    this.tweens.add({ targets: this._rayG, angle: 360, duration: 26000, repeat: -1, ease: 'Linear' });

    // Central radial glow behind emblem
    this._glowG = this.add.graphics().setDepth(1);

    // ── Floating ember particles ─────────────────────────────────────────────
    this._emberG = this.add.graphics().setDepth(2);
    this.time.addEvent({ delay: 120, repeat: -1, callback: () => this._spawnEmber() });
    for (let i = 0; i < 26; i++) this._spawnEmber(true);

    // ── Emblem shield ────────────────────────────────────────────────────────
    this._shieldG = this.add.graphics().setDepth(3);
    this._drawShield(W / 2, SY);
    this._shieldG.setAlpha(0).setScale(0.08);

    // ── BATTLE / BROS title ──────────────────────────────────────────────────
    const TY = H * 0.45;
    this._battleShadow = this.add.text(W / 2 + 4, TY + 5, 'BATTLE', {
      fontSize: '82px', fill: '#140600', fontFamily: 'Arial Black, Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0).setDepth(3);
    this._battleText = this.add.text(W / 2, TY, 'BATTLE', {
      fontSize: '82px', fill: '#FFD700',
      fontFamily: 'Arial Black, Arial', fontStyle: 'bold',
      stroke: '#3D1C00', strokeThickness: 9
    }).setOrigin(0.5).setAlpha(0).setDepth(4);
    this._battleHL = this.add.text(W / 2, TY - 3, 'BATTLE', {
      fontSize: '82px', fill: '#FFF4C0', fontFamily: 'Arial Black, Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0).setDepth(5);

    const BY = TY + 88;
    this._brosShadow = this.add.text(W / 2 + 4, BY + 5, 'BROS', {
      fontSize: '100px', fill: '#08000C', fontFamily: 'Arial Black, Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0).setDepth(3);
    this._brosText = this.add.text(W / 2, BY, 'BROS', {
      fontSize: '100px', fill: '#FFFFFF',
      fontFamily: 'Arial Black, Arial', fontStyle: 'bold',
      stroke: '#1A0030', strokeThickness: 10
    }).setOrigin(0.5).setAlpha(0).setDepth(4);
    this._brosHL = this.add.text(W / 2, BY - 3, 'BROS', {
      fontSize: '100px', fill: '#FFE680', fontFamily: 'Arial Black, Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0).setDepth(5);

    // ── Tagline ribbon ───────────────────────────────────────────────────────
    const TGY = BY + 58;
    const ribbon = this.add.graphics().setDepth(3);
    ribbon.fillStyle(0x0a1230, 0.85); ribbon.fillRoundedRect(W / 2 - 150, TGY - 13, 300, 26, 13);
    ribbon.lineStyle(1.5, 0xC8A23A, 0.55); ribbon.strokeRoundedRect(W / 2 - 150, TGY - 13, 300, 26, 13);
    this._tagline = this.add.text(W / 2, TGY, '⚔  DEPLOY · BATTLE · CONQUER  ⚔', {
      fontSize: '12px', fill: '#E7C870', fontFamily: 'Arial', fontStyle: 'bold', letterSpacing: 2
    }).setOrigin(0.5).setAlpha(0).setDepth(4);
    this._ribbon = ribbon.setAlpha(0);

    // ── Character showcase (the roster, standing on the battlefield) ──────────
    this._buildShowcase(H * 0.775);

    // ── TAP TO START button ──────────────────────────────────────────────────
    const PY = H * 0.9;
    this._promptG = this.add.graphics().setDepth(5);
    this._drawPrompt(this._promptG);
    this._promptG.setPosition(W / 2, PY);
    this._promptText = this.add.text(W / 2, PY, '▶  TAP TO START  ◀', {
      fontSize: '19px', fill: '#3a2400',
      fontFamily: 'Arial Black, Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0).setDepth(6);
    this._promptG.setAlpha(0);

    this.add.text(W / 2, H - 12, 'v1.1 · BATTLE BROS', {
      fontSize: '9px', fill: '#33406a', fontFamily: 'Arial'
    }).setOrigin(0.5).setDepth(3);

    this._runSequence(W, H, SY, PY);
    this.time.delayedCall(200, () => audioSystem.playTrack('battle_hymn'));
  }

  // ── Golden god-rays (drawn around local origin so the graphic can spin) ──────
  _drawRays(g) {
    const RAYS = 16;
    for (let i = 0; i < RAYS; i++) {
      const a = (i / RAYS) * Math.PI * 2;
      const len = i % 2 === 0 ? 150 : 96;
      const spread = i % 2 === 0 ? 0.12 : 0.08;
      g.fillStyle(0xFFD24A, i % 2 === 0 ? 0.07 : 0.045);
      g.fillTriangle(
        0, 0,
        Math.cos(a - spread) * len, Math.sin(a - spread) * len,
        Math.cos(a + spread) * len, Math.sin(a + spread) * len
      );
    }
  }

  _spawnEmber(seed = false) {
    const { W, H } = this;
    this._embers.push({
      x: Math.random() * W,
      y: seed ? Math.random() * H : H + 8,
      vy: -(0.25 + Math.random() * 0.6),
      wob: Math.random() * Math.PI * 2,
      wobSp: 0.01 + Math.random() * 0.02,
      amp: 0.2 + Math.random() * 0.7,
      life: 1,
      size: 1 + Math.random() * 2.2,
      color: [0xFFD24A, 0xFF9933, 0xFFE680, 0x88AAFF][Math.floor(Math.random() * 4)]
    });
  }

  _buildShowcase(groundY) {
    const { W } = this;
    // Stage ground line
    const stage = this.add.graphics().setDepth(2);
    stage.fillStyle(0x16244e, 0.7); stage.fillRect(0, groundY - 2, W, 4);
    stage.fillStyle(0x3a5bb0, 0.5); stage.fillRect(0, groundY - 3, W, 1.5);

    this._showcaseObjs = [];
    const n = SHOWCASE.length;
    const span = (W - 24) / n;
    SHOWCASE.forEach((id, i) => {
      const char = CHARACTERS[id];
      if (!char) return;
      const x = 12 + span * (i + 0.5);
      const rc = RARITY_GLOW[char.rarity] || 0x8FA0C0;

      // Rarity glow halo
      const halo = this.add.graphics().setDepth(2);
      halo.fillStyle(rc, 0.14); halo.fillCircle(x, groundY - 30, 30);
      halo.fillStyle(rc, 0.10); halo.fillCircle(x, groundY - 30, 42);
      // Ground shadow
      const sh = this.add.graphics().setDepth(2);
      sh.fillStyle(0x000000, 0.4); sh.fillEllipse(x, groundY + 2, 42, 10);

      // Sprite (real hero texture) standing on the ground line
      let spr;
      const key = cardTexKey(this, id);
      if (key) {
        spr = placeHero(this, x, groundY, key, span - 6, 92, { fill: false, originY: 1 }).setDepth(3);
      } else {
        spr = this.add.graphics().setDepth(3);
        spr.x = x; spr.y = groundY - 26;
      }

      // Entrance + idle bob
      const grp = [halo, sh, spr];
      grp.forEach(o => o.setAlpha(0));
      this.time.delayedCall(2400 + i * 120, () => {
        grp.forEach(o => this.tweens.add({ targets: o, alpha: 1, duration: 360 }));
        this.tweens.add({
          targets: spr, y: groundY - 6, duration: 1100 + i * 90,
          yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });
      });
      this._showcaseObjs.push(grp);
    });
  }

  // Drawn around local (0,0) so the graphic can be positioned & scale-pulsed
  // around its own centre.
  _drawPrompt(g) {
    g.clear();
    const w = 280, h = 56, x = -w / 2, y = -h / 2;
    g.fillStyle(0xB8860B, 1);  g.fillRoundedRect(x, y, w, h, 14);
    g.fillStyle(0xFFC233, 1);  g.fillRoundedRect(x, y, w, h - 6, 14);
    g.fillStyle(0xFFE07A, 1);  g.fillRoundedRect(x + 4, y + 4, w - 8, h * 0.4, 10);
    g.lineStyle(2.5, 0x6A4A00, 1); g.strokeRoundedRect(x, y, w, h, 14);
  }

  _drawShield(cx, cy) {
    const g = this._shieldG;
    [[0xFFAA00, 0.06, 100], [0xFF7700, 0.07, 76], [0xFFCC00, 0.09, 55]].forEach(([c, a, r]) => {
      g.fillStyle(c, a); g.fillCircle(cx, cy, r);
    });
    g.fillStyle(0xFFD700, 0.18);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      g.fillTriangle(cx, cy,
        cx + Math.cos(a - 0.18) * 88, cy + Math.sin(a - 0.18) * 88,
        cx + Math.cos(a + 0.18) * 88, cy + Math.sin(a + 0.18) * 88);
    }
    g.fillStyle(0xFFD700); g.fillCircle(cx, cy, 50);
    g.fillStyle(0x0A0005); g.fillCircle(cx, cy, 45);
    g.fillStyle(0xCC9900);
    g.fillTriangle(cx - 30, cy - 30, cx + 30, cy - 30, cx, cy + 44);
    g.fillRect(cx - 30, cy - 56, 60, 28);
    g.fillStyle(0xFFD700);
    g.fillTriangle(cx - 26, cy - 26, cx + 26, cy - 26, cx, cy + 38);
    g.fillRect(cx - 26, cy - 52, 52, 28);
    g.fillStyle(0x7A0000);
    g.fillTriangle(cx - 20, cy - 20, cx + 20, cy - 20, cx, cy + 30);
    g.fillRect(cx - 20, cy - 46, 40, 28);
    g.fillStyle(0xFF4444, 0.25);
    g.fillTriangle(cx - 18, cy - 45, cx + 2, cy - 45, cx - 18, cy - 10);
    g.lineStyle(3.5, 0xDDDDBB, 0.95);
    g.lineBetween(cx - 20, cy - 24, cx + 20, cy + 22);
    g.lineBetween(cx + 20, cy - 24, cx - 20, cy + 22);
    g.lineStyle(5, 0xFFD700, 1);
    g.lineBetween(cx - 10, cy + 4, cx + 10, cy - 6);
    g.lineBetween(cx + 10, cy + 4, cx - 10, cy - 6);
    g.fillStyle(0xEEEECC);
    g.fillCircle(cx - 20, cy - 24, 3.5); g.fillCircle(cx + 20, cy - 24, 3.5);
    g.fillStyle(0xFF2200); g.fillCircle(cx, cy - 1, 7);
    g.fillStyle(0xFF7755, 0.55); g.fillCircle(cx - 2, cy - 3, 3.5);
    g.fillStyle(0xFFAAAA, 0.2); g.fillCircle(cx - 1, cy - 2, 1.5);
    g.fillStyle(0xFFD700);
    g.fillRect(cx - 18, cy - 68, 36, 12);
    g.fillTriangle(cx - 16, cy - 68, cx - 22, cy - 84, cx - 8, cy - 68);
    g.fillTriangle(cx, cy - 68, cx, cy - 88, cx + 8, cy - 68);
    g.fillTriangle(cx + 16, cy - 68, cx + 22, cy - 84, cx + 8, cy - 68);
    g.fillStyle(0xFFEE88, 0.5); g.fillRect(cx - 16, cy - 66, 32, 4);
    g.fillStyle(0xFF1100);
    g.fillCircle(cx - 16, cy - 70, 3.5);
    g.fillCircle(cx + 1, cy - 74, 3.5);
    g.fillCircle(cx + 16, cy - 70, 3.5);
  }

  update() {
    const { W, H } = this;

    // Embers
    this._emberG.clear();
    this._embers = this._embers.filter(p => p.life > 0 && p.y > -10);
    for (const p of this._embers) {
      p.y += p.vy;
      p.wob += p.wobSp;
      p.x += Math.sin(p.wob) * p.amp;
      if (p.y < H * 0.2) p.life -= 0.012;
      const a = Math.min(0.9, p.life) * (0.5 + 0.5 * Math.sin(p.wob * 2));
      this._emberG.fillStyle(p.color, a);
      this._emberG.fillCircle(p.x, p.y, p.size);
    }

    // Emblem glow pulse
    const t = this.time.now / 1000;
    const pulse = 0.10 + 0.055 * Math.sin(t * 2.8);
    this._glowG.clear();
    this._glowG.fillStyle(0xFFAA00, pulse); this._glowG.fillCircle(W / 2, H * 0.26, 150);
    this._glowG.fillStyle(0xFFDD00, pulse * 0.5); this._glowG.fillCircle(W / 2, H * 0.26, 86);
  }

  _runSequence(W, H, SY, PY) {
    this.tweens.add({
      targets: this._shieldG, alpha: 1, scaleX: 1, scaleY: 1,
      duration: 620, ease: 'Back.easeOut', delay: 700
    });

    this._battleShadow.y -= 80; this._battleText.y -= 80; this._battleHL.y -= 80;
    this.time.delayedCall(1150, () => {
      this.tweens.add({ targets: [this._battleShadow, this._battleText, this._battleHL],
        alpha: 1, y: '+=80', duration: 340, ease: 'Power3.easeOut' });
      this._battleHL.setAlpha(0);
      this.tweens.add({ targets: this._battleHL, alpha: 0.12, duration: 500, delay: 300 });
    });

    this._brosShadow.y += 80; this._brosText.y += 80; this._brosHL.y += 80;
    this.time.delayedCall(1350, () => {
      this.tweens.add({ targets: [this._brosShadow, this._brosText, this._brosHL],
        alpha: 1, y: '-=80', duration: 340, ease: 'Power3.easeOut' });
      this._brosHL.setAlpha(0);
      this.tweens.add({ targets: this._brosHL, alpha: 0.10, duration: 500, delay: 300 });
    });

    this.time.delayedCall(1750, () => {
      this.tweens.add({ targets: [this._tagline, this._ribbon], alpha: 1, duration: 500 });
    });

    this.time.delayedCall(2100, () => {
      this.tweens.add({ targets: [this._promptText, this._promptG], alpha: 1, duration: 400 });
      this.tweens.add({ targets: [this._promptText, this._promptG],
        scaleX: 1.04, scaleY: 1.04, duration: 700, yoyo: true, repeat: -1,
        ease: 'Sine.easeInOut', delay: 400 });
    });

    this.time.delayedCall(2300, () => {
      this.tweens.add({ targets: [this._battleText, this._brosText],
        scaleX: 1.02, scaleY: 1.02, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: this._shieldG,
        scaleX: 1.04, scaleY: 1.04, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 300 });
    });

    this.time.delayedCall(1900, () => {
      this.input.once('pointerdown', () => this._proceed());
      this.input.keyboard?.once('keydown', () => this._proceed());
      this.time.delayedCall(8000, () => this._proceed());
    });
  }

  _proceed() {
    if (this._proceeded) return;
    this._proceeded = true;
    this.cameras.main.fadeOut(380, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(this.autoLogin ? 'MainMenu' : 'Auth');
    });
  }
}
