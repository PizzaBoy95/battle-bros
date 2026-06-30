import Phaser from 'phaser';
import { audioSystem } from '../systems/AudioSystem.js';
import { rollRarity, rollReward, rollLossReward } from '../systems/LootSystem.js';

export class ResultsScene extends Phaser.Scene {
  constructor() { super('Results'); }

  init(data) {
    this.won       = data?.won   || false;
    this.crowns    = data?.crowns || { p1: 0, p2: 0 };
    this.myKey     = data?.myKey  || 'p1';
    this.damage    = data?.damage || 0;
    this.deck      = data?.deck   || [];
    this.lootReward = this.won ? rollReward(rollRarity()) : rollLossReward();
  }

  create() {
    const { width: W, height: H } = this.scale;
    const won = this.won;

    // ── Background gradient ────────────────────────────────────────────────────
    const bg = this.add.graphics();
    if (won) {
      bg.fillGradientStyle(0x0a1a04, 0x0a1a04, 0x182800, 0x0d2000, 1);
    } else {
      bg.fillGradientStyle(0x1a0404, 0x1a0404, 0x260808, 0x180000, 1);
    }
    bg.fillRect(0, 0, W, H);

    // Starfield
    this._drawStars();

    // ── Top banner ────────────────────────────────────────────────────────────
    const bannerCol = won ? 0xFFD700 : 0xFF3333;
    const bannerG = this.add.graphics().setDepth(2);
    bannerG.fillGradientStyle(
      won ? 0xAA7700 : 0x880000, won ? 0xAA7700 : 0x880000,
      won ? 0x553300 : 0x440000, won ? 0x553300 : 0x440000, 1
    );
    bannerG.fillRect(0, 0, W, 110);
    bannerG.lineStyle(2, bannerCol, 0.45);
    bannerG.strokeRect(0, 108, W, 1);
    // Diagonal stripe accents
    bannerG.fillStyle(0xFFFFFF, 0.04);
    for (let i = -4; i < 16; i++) {
      const sx = i * 32;
      bannerG.fillTriangle(sx, 0, sx + 22, 0, sx - 2, 110);
    }

    // ── Victory / Defeat title ────────────────────────────────────────────────
    const titleText = won ? 'VICTORY!' : 'DEFEAT';
    const titleSub  = won ? '⚔  Well fought, warrior  ⚔' : '☠  Better luck next time  ☠';
    const titleCol  = won ? '#FFD700' : '#FF6666';

    const title = this.add.text(W / 2, 52, titleText, {
      fontSize: '44px', fill: titleCol,
      fontFamily: 'Arial Black, Arial', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 7
    }).setOrigin(0.5).setAlpha(0).setScale(0.4).setDepth(5);

    this.tweens.add({ targets: title, alpha: 1, scaleX: 1, scaleY: 1, duration: 650, ease: 'Back.easeOut' });

    this.add.text(W / 2, 88, titleSub, {
      fontSize: '12px', fill: '#CCCCAA', fontFamily: 'Arial', letterSpacing: 1
    }).setOrigin(0.5).setAlpha(0).setDepth(5);
    this.time.delayedCall(400, () => {
      this.tweens.add({ targets: this.children.list[this.children.list.length - 1], alpha: 1, duration: 400 });
    });

    // ── Crown scoreboard ──────────────────────────────────────────────────────
    this._drawCrownBoard(W / 2, 210);

    // ── Stats panel ───────────────────────────────────────────────────────────
    this._drawStatsPanel(W / 2, 330);

    // ── Reward box ────────────────────────────────────────────────────────────
    this._drawRewardBox(W / 2, 470);

    // ── Buttons ───────────────────────────────────────────────────────────────
    this._makeBtn(W / 2, H - 105, '🎁  OPEN LOOT BOX', 0xBB8800, 0xFFD700, () => {
      this.cameras.main.fadeOut(220, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () =>
        this.scene.start('LootBox', { reward: this.lootReward })
      );
    });
    this._makeBtn(W / 2, H - 52, 'BACK TO MENU', 0x222236, 0x5566AA, () => {
      this.cameras.main.fadeOut(220, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('MainMenu'));
    });

    this.cameras.main.fadeIn(350);
    audioSystem.playTrack('battle_hymn');

    // Victory particles
    if (won) this.time.delayedCall(700, () => this._spawnConfetti());
  }

  _drawStars() {
    const { width: W, height: H } = this.scale;
    const g = this.add.graphics().setDepth(1);
    for (let i = 0; i < 80; i++) {
      const a = 0.08 + Math.random() * 0.45;
      const s = Math.random() < 0.15 ? 2 : 1;
      g.fillStyle(0xFFFFFF, a);
      g.fillRect(Math.random() * W, Math.random() * H, s, s);
    }
  }

  _drawCrownBoard(cx, cy) {
    const { width: W } = this.scale;
    const myCrowns = this.crowns[this.myKey] || 0;
    const opKey    = this.myKey === 'p1' ? 'p2' : 'p1';
    const opCrowns = this.crowns[opKey]   || 0;

    // Panel background
    const g = this.add.graphics().setDepth(3);
    g.fillStyle(0x0a0a18, 0.82);
    g.fillRoundedRect(cx - 160, cy - 55, 320, 110, 12);
    g.lineStyle(1.5, 0x334466, 0.6);
    g.strokeRoundedRect(cx - 160, cy - 55, 320, 110, 12);

    // Labels
    this.add.text(cx - 90, cy - 40, 'YOU', {
      fontSize: '11px', fill: '#6688FF', fontFamily: 'Arial', fontStyle: 'bold', letterSpacing: 2
    }).setOrigin(0.5).setDepth(4);
    this.add.text(cx + 90, cy - 40, 'OPPONENT', {
      fontSize: '11px', fill: '#FF6666', fontFamily: 'Arial', fontStyle: 'bold', letterSpacing: 2
    }).setOrigin(0.5).setDepth(4);

    // Crown icons
    const drawCrown = (x, y, filled, big) => {
      const cg = this.add.graphics().setDepth(4);
      const s  = big ? 1.3 : 1;
      const col = filled ? (this.won && big ? 0xFFD700 : 0xFFD700) : 0x2a2a44;
      const bdr = filled ? (this.won && big ? 0xFFAA00 : 0xAA8800) : 0x444466;
      cg.fillStyle(col);
      cg.fillTriangle(x, y - 16 * s, x - 12 * s, y + 8 * s, x + 12 * s, y + 8 * s);
      cg.fillRect(x - 14 * s, y - 2 * s, 28 * s, 12 * s);
      cg.fillTriangle(x - 20 * s, y + 8 * s, x - 12 * s, y - 6 * s, x - 4 * s, y + 8 * s);
      cg.fillTriangle(x + 4 * s,  y + 8 * s, x + 12 * s, y - 6 * s, x + 20 * s, y + 8 * s);
      cg.lineStyle(1.5, bdr, 0.7);
      cg.strokeTriangle(x, y - 16 * s, x - 12 * s, y + 8 * s, x + 12 * s, y + 8 * s);
      cg.strokeRect(x - 14 * s, y - 2 * s, 28 * s, 12 * s);
      if (filled) {
        cg.fillStyle(0xFFFFFF, 0.22);
        cg.fillTriangle(x, y - 14 * s, x - 6 * s, y, x + 6 * s, y);
      }
    };

    for (let i = 0; i < 3; i++) drawCrown(cx - 116 + i * 30, cy + 4, i < myCrowns, false);
    for (let i = 0; i < 3; i++) drawCrown(cx + 64  + i * 30, cy + 4, i < opCrowns, false);

    // Score
    this.add.text(cx, cy + 4, `${myCrowns}  —  ${opCrowns}`, {
      fontSize: '30px', fill: '#FFFFFF', fontFamily: 'Arial Black, Arial', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(4);
  }

  _drawStatsPanel(cx, cy) {
    const g = this.add.graphics().setDepth(3);
    g.fillStyle(0x0a0a18, 0.72);
    g.fillRoundedRect(cx - 140, cy - 32, 280, 64, 10);
    g.lineStyle(1, 0x223355, 0.5);
    g.strokeRoundedRect(cx - 140, cy - 32, 280, 64, 10);

    this.add.text(cx, cy - 14, 'DAMAGE DEALT', {
      fontSize: '10px', fill: '#556688', fontFamily: 'Arial', letterSpacing: 3
    }).setOrigin(0.5).setDepth(4);

    this.add.text(cx, cy + 12, this.damage.toLocaleString(), {
      fontSize: '26px', fill: '#FF8844', fontFamily: 'Arial Black, Arial', fontStyle: 'bold',
      stroke: '#220000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(4);
  }

  _drawRewardBox(cx, cy) {
    const rarity = this.lootReward.rarity;
    const COLS = { common: 0x95A5A6, rare: 0x3498DB, epic: 0x9B59B6, legendary: 0xFFD700 };
    const col  = COLS[rarity] || 0x95A5A6;
    const colH = `#${col.toString(16).padStart(6, '0')}`;
    const BW = 260, BH = 110;

    const g = this.add.graphics().setDepth(3);
    // Glow halo
    g.fillStyle(col, 0.08);
    g.fillRoundedRect(cx - BW / 2 - 8, cy - BH / 2 - 8, BW + 16, BH + 16, 16);
    // Body
    g.fillStyle(0x0c0c20, 0.96);
    g.fillRoundedRect(cx - BW / 2, cy - BH / 2, BW, BH, 12);
    // Rarity top bar
    g.fillStyle(col, 0.22);
    g.fillRoundedRect(cx - BW / 2, cy - BH / 2, BW, 28, { tl: 12, tr: 12, bl: 0, br: 0 });
    // Border
    g.lineStyle(2.5, col, 0.85);
    g.strokeRoundedRect(cx - BW / 2, cy - BH / 2, BW, BH, 12);

    this.add.text(cx, cy - BH / 2 + 14, `✦  ${rarity.toUpperCase()} CHEST  ✦`, {
      fontSize: '12px', fill: colH, fontFamily: 'Arial', fontStyle: 'bold', letterSpacing: 2
    }).setOrigin(0.5).setDepth(4);

    this.add.text(cx, cy + 6, `💰  +${this.lootReward.gold} Gold${this.lootReward.charReward ? '   🃏 +Card!' : ''}`, {
      fontSize: '20px', fill: '#FFFFFF', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(4);

    this.add.text(cx, cy + 36, 'Tap OPEN LOOT BOX below to claim', {
      fontSize: '10px', fill: '#556677', fontFamily: 'Arial', letterSpacing: 1
    }).setOrigin(0.5).setDepth(4);
  }

  _makeBtn(x, y, label, fillCol, borderCol, onClick) {
    const BW = 280, BH = 46;
    const g = this.add.graphics().setDepth(5);
    g.fillStyle(fillCol, 0.92);
    g.fillRoundedRect(x - BW / 2, y - BH / 2, BW, BH, 10);
    g.fillStyle(0xFFFFFF, 0.06);
    g.fillRoundedRect(x - BW / 2 + 2, y - BH / 2 + 2, BW - 4, BH * 0.45, 8);
    g.lineStyle(2, borderCol, 0.8);
    g.strokeRoundedRect(x - BW / 2, y - BH / 2, BW, BH, 10);

    const txt = this.add.text(x, y, label, {
      fontSize: '16px', fill: '#FFFFFF', fontFamily: 'Arial Black, Arial', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(6).setInteractive({ useHandCursor: true });

    txt.on('pointerover', () => { g.setAlpha(0.8); txt.setScale(1.04); });
    txt.on('pointerout',  () => { g.setAlpha(1);   txt.setScale(1); });
    txt.on('pointerdown', () => { audioSystem.playClick(); onClick(); });
  }

  _spawnConfetti() {
    const { width: W, height: H } = this.scale;
    const COLS = [0xFFD700, 0xFF4444, 0x44AAFF, 0x44FF88, 0xFF88FF];
    const g = this.add.graphics().setDepth(12);
    const particles = Array.from({ length: 55 }, () => ({
      x: Math.random() * W,
      y: -10,
      vx: (Math.random() - 0.5) * 3.5,
      vy: 2 + Math.random() * 4,
      rot: Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 0.18,
      col: COLS[Math.floor(Math.random() * COLS.length)],
      w: 5 + Math.random() * 6, h: 4 + Math.random() * 4,
      life: 1
    }));
    this.time.addEvent({
      delay: 16, repeat: 120,
      callback: () => {
        g.clear();
        for (const p of particles) {
          p.x += p.vx; p.y += p.vy; p.vy += 0.06;
          p.rot += p.rotV; p.life -= 0.008;
          if (p.y < H && p.life > 0) {
            g.fillStyle(p.col, p.life);
            g.fillRect(Math.round(p.x), Math.round(p.y), p.w, p.h);
          }
        }
      }
    });
  }
}
