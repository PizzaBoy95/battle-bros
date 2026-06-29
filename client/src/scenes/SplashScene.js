import Phaser from 'phaser';
import { audioSystem } from '../systems/AudioSystem.js';

export class SplashScene extends Phaser.Scene {
  constructor() { super('Splash'); }

  init(data) { this.autoLogin = data?.autoLogin || false; }

  create() {
    const { width: W, height: H } = this.scale;
    const cx = W / 2;

    // ── Base background ──────────────────────────────────────────────────────
    this.add.rectangle(0, 0, W, H, 0x000000).setOrigin(0);

    // Deep purple radial glow from center
    const bg = this.add.graphics();
    [
      [0x1a0535, 0.55, 420],
      [0x110228, 0.45, 290],
      [0x060112, 0.35, 160],
    ].forEach(([c, a, r]) => { bg.fillStyle(c, a); bg.fillCircle(cx, H * 0.45, r); });

    // Sunburst rays (very subtle)
    const rays = this.add.graphics();
    for (let i = 0; i < 16; i++) {
      const ang = (i / 16) * Math.PI * 2;
      rays.fillStyle(0xFFD700, 0.025);
      rays.fillTriangle(
        cx, H * 0.45,
        cx + Math.cos(ang - 0.07) * 600, H * 0.45 + Math.sin(ang - 0.07) * 600,
        cx + Math.cos(ang + 0.07) * 600, H * 0.45 + Math.sin(ang + 0.07) * 600
      );
    }

    // Stars (small, sparse)
    const sg = this.add.graphics();
    for (let i = 0; i < 90; i++) {
      sg.fillStyle(0xFFFFFF, 0.08 + Math.random() * 0.28);
      sg.fillRect(Math.random() * W, Math.random() * H, 1 + (Math.random() > 0.85 ? 1 : 0), 1);
    }

    // ── Shield emblem ────────────────────────────────────────────────────────
    const SY = H * 0.295;
    const shield = this._drawShield(cx, SY);
    shield.setAlpha(0).setScale(0.1);

    // ── BATTLE title ─────────────────────────────────────────────────────────
    const TY = H * 0.52;

    // Glow halos behind title
    const bg1 = this.add.text(cx, TY, 'BATTLE', { fontSize: '76px', fill: '#FFB700', fontFamily: 'Arial Black, Arial', fontStyle: 'bold' }).setOrigin(0.5).setAlpha(0).setScale(1.12);
    const battleText = this.add.text(cx, TY, 'BATTLE', {
      fontSize: '76px', fill: '#FFE566',
      fontFamily: 'Arial Black, Arial', fontStyle: 'bold',
      stroke: '#3D1C00', strokeThickness: 8
    }).setOrigin(0.5).setAlpha(0);

    // ── BROS title ────────────────────────────────────────────────────────────
    const bg2 = this.add.text(cx, TY + 88, 'BROS', { fontSize: '96px', fill: '#FF4400', fontFamily: 'Arial Black, Arial', fontStyle: 'bold' }).setOrigin(0.5).setAlpha(0).setScale(1.12);
    const brosText = this.add.text(cx, TY + 88, 'BROS', {
      fontSize: '96px', fill: '#FF6633',
      fontFamily: 'Arial Black, Arial', fontStyle: 'bold',
      stroke: '#1A0000', strokeThickness: 10
    }).setOrigin(0.5).setAlpha(0);

    // Tagline
    const tagline = this.add.text(cx, TY + 204, '✦  DEPLOY · BATTLE · CONQUER  ✦', {
      fontSize: '11px', fill: '#BB8800', fontFamily: 'Arial', letterSpacing: 3
    }).setOrigin(0.5).setAlpha(0);

    // ── Spark particles ───────────────────────────────────────────────────────
    const sparks = [];
    for (let i = 0; i < 28; i++) {
      const ang = Math.random() * Math.PI * 2;
      const dist = 50 + Math.random() * 130;
      const obj = this.add.rectangle(cx, SY, 2, 2, i % 3 === 0 ? 0xFF6600 : 0xFFD700).setAlpha(0);
      sparks.push({ obj, targetX: cx + Math.cos(ang) * dist, targetY: SY + Math.sin(ang) * dist });
    }

    // ── Tap prompt ────────────────────────────────────────────────────────────
    const PY = H * 0.875;
    const promptBg   = this.add.rectangle(cx, PY, 268, 50, 0xFFD700, 0.1).setAlpha(0);
    const promptEdge = this.add.rectangle(cx, PY, 268, 50, 0x000000, 0).setStrokeStyle(1, 0xFFD700, 0.5).setAlpha(0);
    const prompt     = this.add.text(cx, PY, '▶  TAP TO START  ◀', {
      fontSize: '17px', fill: '#FFD700', fontFamily: 'Arial Black, Arial',
      stroke: '#7A5500', strokeThickness: 3
    }).setOrigin(0.5).setAlpha(0);

    // Version tag
    this.add.text(cx, H - 16, 'v1.0 · BATTLE BROS', { fontSize: '10px', fill: '#333366', fontFamily: 'Arial' }).setOrigin(0.5);

    // ── Animation sequence ────────────────────────────────────────────────────

    // 1) Shield pops in (0.25s)
    this.tweens.add({ targets: shield, alpha: 1, scaleX: 1, scaleY: 1, duration: 550, ease: 'Back.easeOut', delay: 200 });

    // 2) Sparks burst (0.7s)
    this.time.delayedCall(700, () => {
      for (const { obj, targetX, targetY } of sparks) {
        this.tweens.add({
          targets: obj, alpha: 1, x: targetX, y: targetY,
          duration: 500 + Math.random() * 300, ease: 'Power2',
          onComplete: () => this.tweens.add({ targets: obj, alpha: 0, duration: 350 })
        });
      }
    });

    // 3) BATTLE slides from left (0.6s)
    battleText.x = -120; bg1.x = -120;
    this.time.delayedCall(550, () => {
      this.tweens.add({ targets: [battleText, bg1], alpha: 1, x: cx, duration: 420, ease: 'Power3' });
      bg1.setAlpha(0.22);
    });

    // 4) BROS slides from right (0.85s)
    brosText.x = W + 120; bg2.x = W + 120;
    this.time.delayedCall(800, () => {
      this.tweens.add({ targets: [brosText, bg2], alpha: 1, x: cx, duration: 420, ease: 'Power3' });
      bg2.setAlpha(0.22);
    });

    // 5) Tagline fades in
    this.time.delayedCall(1100, () => {
      this.tweens.add({ targets: tagline, alpha: 0.85, duration: 500 });
    });

    // 6) Prompt appears + pulses
    this.time.delayedCall(1400, () => {
      this.tweens.add({ targets: [promptBg, promptEdge, prompt], alpha: 1, duration: 450 });
      this.tweens.add({ targets: prompt, alpha: 0.25, duration: 680, yoyo: true, repeat: -1, delay: 450 });
      this.tweens.add({ targets: promptBg, alpha: 0.18, duration: 680, yoyo: true, repeat: -1, delay: 450 });
    });

    // 7) Idle title pulse
    this.time.delayedCall(1600, () => {
      this.tweens.add({ targets: [battleText, brosText], scaleX: 1.025, scaleY: 1.025, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: shield, scaleX: 1.03, scaleY: 1.03, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 200 });
    });

    // 8) Input
    this.time.delayedCall(1500, () => {
      this.input.once('pointerdown', () => this._proceed());
      this.input.keyboard?.once('keydown', () => this._proceed());
      this.time.delayedCall(6000, () => this._proceed());
    });

    // 9) Music
    this.time.delayedCall(300, () => audioSystem.playTrack('battle_hymn'));
  }

  _drawShield(cx, cy) {
    const g = this.add.graphics();

    // Outer glow ring
    g.fillStyle(0xFFD700, 0.08); g.fillCircle(cx, cy, 68);
    g.fillStyle(0xFF6600, 0.06); g.fillCircle(cx, cy, 85);

    // Shield shadow
    g.fillStyle(0x000000, 0.35);
    g.fillTriangle(cx - 35 + 4, cy - 32 + 4, cx + 35 + 4, cy - 32 + 4, cx + 4, cy + 46 + 4);
    g.fillRect(cx - 35 + 4, cy - 56 + 4, 70, 26);

    // Shield body (dark gold border)
    g.fillStyle(0x7A5500);
    g.fillTriangle(cx - 36, cy - 32, cx + 36, cy - 32, cx, cy + 46);
    g.fillRect(cx - 36, cy - 56, 72, 26);

    // Shield body (bright gold)
    g.fillStyle(0xFFD700);
    g.fillTriangle(cx - 30, cy - 27, cx + 30, cy - 27, cx, cy + 39);
    g.fillRect(cx - 30, cy - 51, 60, 26);

    // Inner plate (deep red/maroon)
    g.fillStyle(0x6B0000);
    g.fillTriangle(cx - 22, cy - 22, cx + 22, cy - 22, cx, cy + 30);
    g.fillRect(cx - 22, cy - 46, 44, 26);

    // Center gem (bright red diamond)
    g.fillStyle(0xFF2200);
    g.fillTriangle(cx, cy - 30, cx + 13, cy - 8, cx, cy + 14);
    g.fillTriangle(cx - 13, cy - 8, cx, cy - 30, cx, cy + 14);
    g.fillStyle(0xFF7755);
    g.fillTriangle(cx, cy - 30, cx + 6, cy - 18, cx - 6, cy - 18); // highlight

    // Crossed swords
    g.lineStyle(3, 0xEEEECC);
    g.lineBetween(cx - 20, cy - 20, cx + 20, cy + 20);
    g.lineBetween(cx + 20, cy - 20, cx - 20, cy + 20);

    // Sword guards
    g.lineStyle(5, 0xDDBB00);
    g.lineBetween(cx - 9, cy + 7, cx + 9, cy - 7);
    g.lineBetween(cx + 9, cy + 7, cx - 9, cy - 7);

    // Sword tips (dots)
    g.fillStyle(0xCCCCAA);
    g.fillCircle(cx - 20, cy - 20, 2.5); g.fillCircle(cx + 20, cy - 20, 2.5);

    // Two crowns above shield
    [-20, 20].forEach(dx => {
      const kx = cx + dx, ky = cy - 64;
      g.fillStyle(0xFFD700);
      g.fillRect(kx - 7, ky, 14, 8);
      g.fillTriangle(kx - 7, ky, kx - 7, ky - 8, kx - 2, ky);
      g.fillTriangle(kx, ky, kx, ky - 10, kx + 4, ky);
      g.fillTriangle(kx + 7, ky, kx + 7, ky - 8, kx + 2, ky);
      g.fillStyle(0xFF3300);
      g.fillCircle(kx, ky - 1, 2);
    });

    return g;
  }

  _proceed() {
    if (this._proceeded) return;
    this._proceeded = true;
    this.cameras.main.fadeOut(350, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(this.autoLogin ? 'MainMenu' : 'Auth');
    });
  }
}
