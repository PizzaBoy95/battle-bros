import Phaser from 'phaser';
import { audioSystem } from '../systems/AudioSystem.js';

export class SplashScene extends Phaser.Scene {
  constructor() { super('Splash'); }

  init(data) {
    this.autoLogin = data?.autoLogin || false;
    this._proceeded = false;
    this._sparks = [];
    this._rings = [];
  }

  create() {
    const { width: W, height: H } = this.scale;
    this.W = W; this.H = H;

    // ── Pure black base ─────────────────────────────────────────────────────
    this.add.rectangle(0, 0, W, H, 0x000000).setOrigin(0);

    // ── Particle layer ──────────────────────────────────────────────────────
    this._sparkG = this.add.graphics().setDepth(1);
    this._glowG  = this.add.graphics().setDepth(2);

    // ── Spawn sparks gradually ──────────────────────────────────────────────
    this.time.addEvent({
      delay: 30, repeat: 100,
      callback: () => this._spawnSpark()
    });

    // ── Shield ──────────────────────────────────────────────────────────────
    const SY = H * 0.305;
    this._shieldG = this.add.graphics().setDepth(3);
    this._drawShield(W / 2, SY);
    this._shieldG.setAlpha(0).setScale(0.08);

    // ── BATTLE text group ───────────────────────────────────────────────────
    const TY = H * 0.555;
    // Shadow pass
    this._battleShadow = this.add.text(W / 2 + 4, TY + 5, 'BATTLE', {
      fontSize: '82px', fill: '#1A0800', fontFamily: 'Arial Black, Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0).setDepth(3);
    // Main gold layer
    this._battleText = this.add.text(W / 2, TY, 'BATTLE', {
      fontSize: '82px', fill: '#FFD700',
      fontFamily: 'Arial Black, Arial', fontStyle: 'bold',
      stroke: '#3D1C00', strokeThickness: 9
    }).setOrigin(0.5).setAlpha(0).setDepth(4);
    // Highlight pass
    this._battleHL = this.add.text(W / 2, TY - 3, 'BATTLE', {
      fontSize: '82px', fill: '#FFFFFF',
      fontFamily: 'Arial Black, Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0).setDepth(5);

    // ── BROS text group ─────────────────────────────────────────────────────
    const BY = TY + 94;
    this._brosShadow = this.add.text(W / 2 + 4, BY + 5, 'BROS', {
      fontSize: '100px', fill: '#0A0008', fontFamily: 'Arial Black, Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0).setDepth(3);
    this._brosText = this.add.text(W / 2, BY, 'BROS', {
      fontSize: '100px', fill: '#FFFFFF',
      fontFamily: 'Arial Black, Arial', fontStyle: 'bold',
      stroke: '#200030', strokeThickness: 10
    }).setOrigin(0.5).setAlpha(0).setDepth(4);
    this._brosHL = this.add.text(W / 2, BY - 3, 'BROS', {
      fontSize: '100px', fill: '#FFD700',
      fontFamily: 'Arial Black, Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0).setDepth(5);

    // ── Tagline ─────────────────────────────────────────────────────────────
    this._tagline = this.add.text(W / 2, BY + 116, '✦  DEPLOY · BATTLE · CONQUER  ✦', {
      fontSize: '11px', fill: '#AA8800', fontFamily: 'Arial', letterSpacing: 4
    }).setOrigin(0.5).setAlpha(0).setDepth(4);

    // ── TAP TO START ─────────────────────────────────────────────────────────
    const PY = H * 0.87;
    this._promptRingG = this.add.graphics().setDepth(3);
    this._promptBg    = this.add.rectangle(W / 2, PY, 274, 54, 0xFFD700, 0).setDepth(3);
    this._promptBord  = this.add.graphics().setDepth(4);
    this._promptText  = this.add.text(W / 2, PY, '▶  TAP TO START  ◀', {
      fontSize: '18px', fill: '#FFD700',
      fontFamily: 'Arial Black, Arial',
      stroke: '#5A3A00', strokeThickness: 4
    }).setOrigin(0.5).setAlpha(0).setDepth(5);

    this._promptBord.lineStyle(1.5, 0xFFD700, 0);
    this._promptBord.strokeRoundedRect(W / 2 - 137, PY - 27, 274, 54, 10);

    this.add.text(W / 2, H - 14, 'v1.0 · BATTLE BROS', {
      fontSize: '9px', fill: '#222244', fontFamily: 'Arial'
    }).setOrigin(0.5).setDepth(3);

    // ── Animation sequence ──────────────────────────────────────────────────
    this._runSequence(W, H, SY);

    // ── Music ───────────────────────────────────────────────────────────────
    this.time.delayedCall(200, () => audioSystem.playTrack('battle_hymn'));
  }

  _drawShield(cx, cy) {
    const g = this._shieldG;

    // Multi-layer glow halos
    [[0xFFAA00, 0.06, 100], [0xFF7700, 0.07, 76], [0xFFCC00, 0.09, 55]].forEach(([c, a, r]) => {
      g.fillStyle(c, a); g.fillCircle(cx, cy, r);
    });

    // 8-pointed starburst
    g.fillStyle(0xFFD700, 0.18);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      g.fillTriangle(
        cx, cy,
        cx + Math.cos(a - 0.18) * 88, cy + Math.sin(a - 0.18) * 88,
        cx + Math.cos(a + 0.18) * 88, cy + Math.sin(a + 0.18) * 88
      );
    }

    // Outer ring (gold)
    g.fillStyle(0xFFD700); g.fillCircle(cx, cy, 50);
    // Inner dark ring
    g.fillStyle(0x0A0005); g.fillCircle(cx, cy, 45);

    // Shield body - outer gold border
    g.fillStyle(0xCC9900);
    g.fillTriangle(cx - 30, cy - 30, cx + 30, cy - 30, cx, cy + 44);
    g.fillRect(cx - 30, cy - 56, 60, 28);
    // Shield body - bright gold
    g.fillStyle(0xFFD700);
    g.fillTriangle(cx - 26, cy - 26, cx + 26, cy - 26, cx, cy + 38);
    g.fillRect(cx - 26, cy - 52, 52, 28);
    // Shield inner - deep crimson
    g.fillStyle(0x7A0000);
    g.fillTriangle(cx - 20, cy - 20, cx + 20, cy - 20, cx, cy + 30);
    g.fillRect(cx - 20, cy - 46, 40, 28);
    // Highlight on shield (top-left)
    g.fillStyle(0xFF4444, 0.25);
    g.fillTriangle(cx - 18, cy - 45, cx + 2, cy - 45, cx - 18, cy - 10);

    // Crossed swords
    g.lineStyle(3.5, 0xDDDDBB, 0.95);
    g.lineBetween(cx - 20, cy - 24, cx + 20, cy + 22);
    g.lineBetween(cx + 20, cy - 24, cx - 20, cy + 22);
    // Sword guards
    g.lineStyle(5, 0xFFD700, 1);
    g.lineBetween(cx - 10, cy + 4, cx + 10, cy - 6);
    g.lineBetween(cx + 10, cy + 4, cx - 10, cy - 6);
    // Sword tips
    g.fillStyle(0xEEEECC);
    g.fillCircle(cx - 20, cy - 24, 3.5); g.fillCircle(cx + 20, cy - 24, 3.5);

    // Center jewel
    g.fillStyle(0xFF2200); g.fillCircle(cx, cy - 1, 7);
    g.fillStyle(0xFF7755, 0.55); g.fillCircle(cx - 2, cy - 3, 3.5);
    g.fillStyle(0xFFAAAA, 0.2); g.fillCircle(cx - 1, cy - 2, 1.5);

    // Crown
    g.fillStyle(0xFFD700);
    g.fillRect(cx - 18, cy - 68, 36, 12);
    g.fillTriangle(cx - 16, cy - 68, cx - 22, cy - 84, cx - 8, cy - 68);
    g.fillTriangle(cx,     cy - 68, cx,      cy - 88, cx + 8,  cy - 68);
    g.fillTriangle(cx + 16, cy - 68, cx + 22, cy - 84, cx + 8,  cy - 68);
    g.fillStyle(0xFFEE88, 0.5); g.fillRect(cx - 16, cy - 66, 32, 4);
    // Crown gems
    g.fillStyle(0xFF1100);
    g.fillCircle(cx - 16, cy - 70, 3.5);
    g.fillCircle(cx + 1,  cy - 74, 3.5);
    g.fillCircle(cx + 16, cy - 70, 3.5);
  }

  _spawnSpark() {
    const { W, H } = this;
    const cx = W / 2, cy = H * 0.305;
    const angle = Math.random() * Math.PI * 2;
    const dist = 160 + Math.random() * 220;
    this._sparks.push({
      x: cx + Math.cos(angle) * dist,
      y: cy + Math.sin(angle) * dist,
      vx: -Math.cos(angle) * (0.6 + Math.random() * 0.8),
      vy: -Math.sin(angle) * (0.6 + Math.random() * 0.8),
      life: 1,
      size: 0.8 + Math.random() * 1.8,
      color: [0xFFD700, 0xFF9900, 0xFF6600, 0xFFFFAA][Math.floor(Math.random() * 4)]
    });
  }

  update() {
    const { W, H } = this;
    this._sparkG.clear();
    this._sparks = this._sparks.filter(p => p.life > 0);
    for (const p of this._sparks) {
      p.x += p.vx; p.y += p.vy;
      p.life -= 0.007;
      if (p.life > 0) {
        this._sparkG.fillStyle(p.color, Math.min(1, p.life * 1.4));
        this._sparkG.fillRect(p.x, p.y, p.size, p.size);
      }
    }

    // Animate center glow
    const t = this.time.now / 1000;
    const pulse = 0.10 + 0.055 * Math.sin(t * 2.8);
    this._glowG.clear();
    this._glowG.fillStyle(0xFFAA00, pulse);     this._glowG.fillCircle(W / 2, H * 0.305, 160);
    this._glowG.fillStyle(0xFFDD00, pulse * 0.5); this._glowG.fillCircle(W / 2, H * 0.305, 90);

    // Animate prompt border
    if (this._promptBord && this._promptText.alpha > 0) {
      const ba = 0.5 + 0.5 * Math.sin(t * 3.2);
      this._promptBord.clear();
      this._promptBord.lineStyle(1.5, 0xFFD700, ba * 0.8);
      this._promptBord.strokeRoundedRect(W / 2 - 137, H * 0.87 - 27, 274, 54, 10);
    }
  }

  _runSequence(W, H, SY) {
    // 0.8s: Shield pops in
    this.tweens.add({
      targets: this._shieldG, alpha: 1, scaleX: 1, scaleY: 1,
      duration: 620, ease: 'Back.easeOut', delay: 800
    });

    // 1.3s: BATTLE crashes down from top
    this._battleShadow.y -= 80; this._battleText.y -= 80; this._battleHL.y -= 80;
    this.time.delayedCall(1280, () => {
      this.tweens.add({ targets: [this._battleShadow, this._battleText, this._battleHL],
        alpha: 1, y: `+=${80}`, duration: 340, ease: 'Power3.easeOut' });
      this._battleHL.setAlpha(0);
      this.tweens.add({ targets: this._battleHL, alpha: 0.10, duration: 500, delay: 300 });
    });

    // 1.5s: BROS crashes up from bottom
    this._brosShadow.y += 80; this._brosText.y += 80; this._brosHL.y += 80;
    this.time.delayedCall(1480, () => {
      this.tweens.add({ targets: [this._brosShadow, this._brosText, this._brosHL],
        alpha: 1, y: `-=${80}`, duration: 340, ease: 'Power3.easeOut' });
      this._brosHL.setAlpha(0);
      this.tweens.add({ targets: this._brosHL, alpha: 0.08, duration: 500, delay: 300 });
    });

    // 1.9s: Tagline
    this.time.delayedCall(1880, () => {
      this.tweens.add({ targets: this._tagline, alpha: 0.8, duration: 500 });
    });

    // 2.2s: Prompt + pulse loop
    this.time.delayedCall(2200, () => {
      this.tweens.add({ targets: this._promptText, alpha: 1, duration: 400 });
      this.tweens.add({ targets: this._promptText, alpha: 0.2, duration: 650, yoyo: true, repeat: -1, delay: 400 });
    });

    // 2.4s: Title idle pulse
    this.time.delayedCall(2400, () => {
      this.tweens.add({ targets: [this._battleText, this._brosText],
        scaleX: 1.02, scaleY: 1.02, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: this._shieldG,
        scaleX: 1.04, scaleY: 1.04, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 300 });
    });

    // Input unlock at 2.0s, auto-advance at 9s
    this.time.delayedCall(2000, () => {
      this.input.once('pointerdown', () => this._proceed());
      this.input.keyboard?.once('keydown', () => this._proceed());
      this.time.delayedCall(7000, () => this._proceed());
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
