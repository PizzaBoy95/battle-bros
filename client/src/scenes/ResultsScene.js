import Phaser from 'phaser';
import { audioSystem } from '../systems/AudioSystem.js';
import { rollRarity, rollReward, rollLossReward } from '../systems/LootSystem.js';

export class ResultsScene extends Phaser.Scene {
  constructor() { super('Results'); }

  init(data) {
    this.won = data?.won || false;
    this.crowns = data?.crowns || { p1: 0, p2: 0 };
    this.myKey = data?.myKey || 'p1';
    this.damage = data?.damage || 0;
    this.deck = data?.deck || [];
    this.lootReward = this.won ? rollReward(rollRarity()) : rollLossReward();
  }

  create() {
    const { width: W, height: H } = this.scale;

    // Background
    const bgColor = this.won ? 0x0a1a08 : 0x1a0808;
    this.add.rectangle(0, 0, W, H, bgColor).setOrigin(0);
    this._drawStars();

    // Result title
    const titleColor = this.won ? '#FFD700' : '#FF6B6B';
    const titleText = this.won ? '⚔  VICTORY  ⚔' : '☠  DEFEAT  ☠';

    this.add.text(W / 2, 70, titleText, {
      fontSize: '40px', fill: titleColor,
      fontFamily: 'Arial Black, Arial', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 6
    }).setOrigin(0.5).setAlpha(0).setScale(0.3);

    // Animate title in
    this.tweens.add({
      targets: this.children.list[this.children.list.length - 1],
      alpha: 1, scaleX: 1, scaleY: 1,
      duration: 700, ease: 'Back.easeOut'
    });

    // Crown display
    const myCrowns = this.crowns[this.myKey] || 0;
    const opKey = this.myKey === 'p1' ? 'p2' : 'p1';
    const opCrowns = this.crowns[opKey] || 0;

    this._drawCrowns(W / 2, 160, myCrowns, opCrowns);

    // Damage stat
    this.add.text(W / 2, 250, `Damage dealt: ${this.damage.toLocaleString()}`, {
      fontSize: '15px', fill: '#AAAACC', fontFamily: 'Arial'
    }).setOrigin(0.5);

    // Reward box
    this._drawRewardBox(W / 2, 380);

    // Buttons
    this._makeBtn(W / 2, H - 110, 'OPEN LOOT BOX', 0xFFD700, () => {
      this.scene.start('LootBox', { reward: this.lootReward });
    });
    this._makeBtn(W / 2, H - 55, 'BACK TO MENU', 0x555566, () => {
      this.scene.start('MainMenu');
    });

    this.cameras.main.fadeIn(400);
    audioSystem.playTrack('battle_hymn');
  }

  _drawStars() {
    const { width: W, height: H } = this.scale;
    const g = this.add.graphics();
    for (let i = 0; i < 60; i++) {
      g.fillStyle(0xFFFFFF, 0.1 + Math.random() * 0.4);
      g.fillRect(Math.random() * W, Math.random() * H, 1, 1);
    }
  }

  _drawCrowns(x, y, mine, theirs) {
    // Crown icons
    const colors = { 0: 0x444444, 1: 0xFFD700, 2: 0xFFD700, 3: 0xFF4500 };
    const g = this.add.graphics();

    const drawCrown = (cx, cy, filled) => {
      g.fillStyle(filled ? 0xFFD700 : 0x333333);
      g.fillTriangle(cx - 14, cy + 8, cx, cy - 8, cx + 14, cy + 8);
      g.fillRect(cx - 14, cy, 28, 10);
      g.fillTriangle(cx - 22, cy + 8, cx - 14, cy - 4, cx - 6, cy + 8);
      g.fillTriangle(cx + 6, cy + 8, cx + 14, cy - 4, cx + 22, cy + 8);
    };

    // My crowns
    this.add.text(x - 80, y - 30, 'YOU', { fontSize: '12px', fill: '#AAAACC', fontFamily: 'Arial' }).setOrigin(0.5);
    for (let i = 0; i < 3; i++) drawCrown(x - 100 + i * 36, y, i < mine);

    // VS divider
    this.add.text(x, y, 'VS', { fontSize: '18px', fill: '#FFFFFF', fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5);

    // Opponent crowns
    this.add.text(x + 80, y - 30, 'THEM', { fontSize: '12px', fill: '#AAAACC', fontFamily: 'Arial' }).setOrigin(0.5);
    for (let i = 0; i < 3; i++) drawCrown(x + 40 + i * 36, y, i < theirs);

    // Score
    this.add.text(x, y + 40, `${mine} - ${theirs}`, {
      fontSize: '28px', fill: '#FFFFFF', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5);
  }

  _drawRewardBox(x, y) {
    const rarity = this.lootReward.rarity;
    const colors = { common: 0x95A5A6, rare: 0x3498DB, epic: 0x9B59B6, legendary: 0xFFD700 };
    const color = colors[rarity] || 0x95A5A6;

    const g = this.add.graphics();
    g.fillStyle(0x12122a);
    g.fillRoundedRect(x - 120, y - 60, 240, 120, 10);
    g.lineStyle(3, color, 0.9);
    g.strokeRoundedRect(x - 120, y - 60, 240, 120, 10);

    // Glow
    g.fillStyle(color, 0.08);
    g.fillRoundedRect(x - 120, y - 60, 240, 120, 10);

    this.add.text(x, y - 38, '🎁 REWARD', {
      fontSize: '13px', fill: '#AAAACC', fontFamily: 'Arial', letterSpacing: 2
    }).setOrigin(0.5);

    this.add.text(x, y - 10, rarity.toUpperCase(), {
      fontSize: '22px', fill: `#${color.toString(16).padStart(6, '0')}`,
      fontFamily: 'Arial Black, Arial', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(x, y + 20, `💰 ${this.lootReward.gold} gold${this.lootReward.charReward ? '  +  character card!' : ''}`, {
      fontSize: '14px', fill: '#FFFFFF', fontFamily: 'Arial'
    }).setOrigin(0.5);

    this.add.text(x, y + 46, 'Tap to open →', {
      fontSize: '11px', fill: '#888888', fontFamily: 'Arial'
    }).setOrigin(0.5);
  }

  _makeBtn(x, y, label, color, onClick) {
    const btn = this.add.rectangle(x, y, 260, 44, color, 0.9)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(1, 0xFFFFFF, 0.15);

    const txt = this.add.text(x, y, label, {
      fontSize: '16px', fill: '#FFFFFF', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5);

    btn.on('pointerover', () => btn.setAlpha(1));
    btn.on('pointerout',  () => btn.setAlpha(0.9));
    btn.on('pointerdown', () => {
      audioSystem.playClick();
      onClick();
    });
  }
}
