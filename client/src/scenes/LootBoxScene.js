import Phaser from 'phaser';
import { audioSystem } from '../systems/AudioSystem.js';
import { SERVER_URL } from '../config.js';
import { RARITIES } from '../systems/LootSystem.js';

const CLICKS_NEEDED = 10;
const CLICK_WINDOW_MS = 2500;

export class LootBoxScene extends Phaser.Scene {
  constructor() { super('LootBox'); }

  init(data) {
    this.reward = data?.reward || { rarity: 'common', gold: 100, charReward: null };
    this.clickCount = 0;
    this.clickStart = null;
    this.opened = false;
    this.phase = 'locked'; // locked | opening | revealed
  }

  create() {
    const { width: W, height: H } = this.scale;

    // Background
    this.add.rectangle(0, 0, W, H, 0x050510).setOrigin(0);
    this._drawStars();

    // Title
    this.add.text(W / 2, 50, 'LOOT BOX', {
      fontSize: '30px', fill: '#FFD700',
      fontFamily: 'Arial Black, Arial', fontStyle: 'bold'
    }).setOrigin(0.5);

    // Instruction
    this.instructionText = this.add.text(W / 2, 90, 'TAP RAPIDLY TO UNLOCK!', {
      fontSize: '15px', fill: '#AAAACC', fontFamily: 'Arial', letterSpacing: 2
    }).setOrigin(0.5);

    this.tweens.add({ targets: this.instructionText, alpha: 0.3, duration: 500, yoyo: true, repeat: -1 });

    // Box graphics
    this.boxG = this.add.graphics().setDepth(5);
    this.boxX = W / 2;
    this.boxY = H / 2;
    this._drawBox(false);

    // Padlock
    this.lockG = this.add.graphics().setDepth(6);
    this._drawLock();

    // Click progress bar
    this.progressBg = this.add.rectangle(W / 2, H * 0.73, 260, 14, 0x1a1a2e)
      .setStrokeStyle(1, 0x333355).setDepth(7);
    this.progressBar = this.add.rectangle(W / 2 - 128, H * 0.73, 2, 10, 0xFFD700)
      .setOrigin(0, 0.5).setDepth(8);

    this.clickLabel = this.add.text(W / 2, H * 0.73 + 22, `0 / ${CLICKS_NEEDED} clicks`, {
      fontSize: '13px', fill: '#AAAACC', fontFamily: 'Arial'
    }).setOrigin(0.5).setDepth(8);

    // Skip button
    this.add.text(W / 2, H - 40, '[ SKIP ]', {
      fontSize: '13px', fill: '#444466', fontFamily: 'Arial'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this._openBox());

    // Main tap area
    const tapZone = this.add.zone(W / 2, H / 2 - 30, 280, 280)
      .setInteractive({ useHandCursor: true }).setDepth(10);
    tapZone.on('pointerdown', () => this._handleClick());

    this.cameras.main.fadeIn(400);
  }

  _drawStars() {
    const { width: W, height: H } = this.scale;
    const g = this.add.graphics();
    for (let i = 0; i < 60; i++) {
      g.fillStyle(0xFFFFFF, 0.1 + Math.random() * 0.4);
      g.fillRect(Math.random() * W, Math.random() * H, 1, 1);
    }
  }

  _drawBox(glowing) {
    const rarityData = RARITIES[this.reward.rarity] || RARITIES.common;
    const color = rarityData.color;
    const x = this.boxX, y = this.boxY;
    const bw = 120, bh = 110;

    this.boxG.clear();

    if (glowing) {
      this.boxG.fillStyle(color, 0.15);
      this.boxG.fillRoundedRect(x - bw - 16, y - bh - 16, (bw + 16) * 2, (bh + 16) * 2, 18);
    }

    // Box body
    this.boxG.fillStyle(0x1a0800);
    this.boxG.fillRoundedRect(x - bw, y - bh / 2, bw * 2, bh, 12);

    // Box lid (top half)
    this.boxG.fillStyle(0x2a1010);
    this.boxG.fillRoundedRect(x - bw, y - bh, bw * 2, bh / 2 + 8, 12);

    // Rarity border
    this.boxG.lineStyle(3, color, 0.9);
    this.boxG.strokeRoundedRect(x - bw, y - bh, bw * 2, bh * 1.5, 12);

    // Ribbon / bow
    this.boxG.fillStyle(color);
    this.boxG.fillRect(x - 8, y - bh, 16, bh * 1.5);
    this.boxG.fillRect(x - bw, y - 14, bw * 2, 14);

    // Corner details
    this.boxG.fillStyle(color, 0.3);
    this.boxG.fillRect(x - bw + 8, y - bh + 8, 20, 20);
    this.boxG.fillRect(x + bw - 28, y - bh + 8, 20, 20);
  }

  _drawLock() {
    const x = this.boxX, y = this.boxY - 60;
    this.lockG.clear();
    this.lockG.fillStyle(0xC0C0C0);
    this.lockG.fillRoundedRect(x - 16, y, 32, 26, 4);
    this.lockG.lineStyle(6, 0xC0C0C0);
    this.lockG.beginPath();
    this.lockG.arc(x, y, 14, Math.PI, 0, false);
    this.lockG.strokePath();
    this.lockG.fillStyle(0x888888);
    this.lockG.fillCircle(x, y + 14, 5);
    this.lockG.fillRect(x - 1.5, y + 14, 3, 8);
  }

  _handleClick() {
    if (this.opened) return;
    if (this.phase === 'revealing') return;

    const now = Date.now();

    if (!this.clickStart) {
      this.clickStart = now;
      this.clickTimer = setTimeout(() => this._resetClicks(), CLICK_WINDOW_MS);
    }

    this.clickCount++;
    audioSystem.playClick();

    // Shake box
    this.tweens.add({
      targets: this.boxG,
      x: this.boxX + (Math.random() - 0.5) * 14,
      duration: 60, yoyo: true, ease: 'Linear'
    });

    // Update progress
    const pct = Math.min(1, this.clickCount / CLICKS_NEEDED);
    this.progressBar.setDisplaySize(256 * pct, 10);
    this.clickLabel.setText(`${this.clickCount} / ${CLICKS_NEEDED} clicks`);

    if (pct === 1 && pct >= 1 && this.clickCount === CLICKS_NEEDED) {
      clearTimeout(this.clickTimer);
      this._openBox();
    }
  }

  _resetClicks() {
    if (this.opened) return;
    this.clickCount = 0;
    this.clickStart = null;
    this.progressBar.setDisplaySize(2, 10);
    this.clickLabel.setText(`0 / ${CLICKS_NEEDED} clicks`);

    // Shake lockG as "nope"
    this.tweens.add({ targets: this.lockG, x: -8, duration: 60, yoyo: true, repeat: 2, ease: 'Linear' });
  }

  _openBox() {
    if (this.opened) return;
    this.opened = true;
    this.phase = 'opening';

    // Shatter animation
    this.tweens.add({
      targets: [this.boxG, this.lockG],
      scaleX: 1.3, scaleY: 1.3, alpha: 0,
      duration: 350, ease: 'Power2',
      onComplete: () => this._reveal()
    });

    audioSystem.playLootOpen();
    this.progressBar.setDisplaySize(256, 10);
    this.clickLabel.setText('UNLOCKED!').setStyle({ fill: '#FFD700' });
  }

  _reveal() {
    const { width: W, height: H } = this.scale;
    this.phase = 'revealed';

    const rarityData = RARITIES[this.reward.rarity] || RARITIES.common;
    const color = rarityData.color;
    const colorHex = `#${color.toString(16).padStart(6, '0')}`;

    // Big glow burst
    const burst = this.add.graphics().setDepth(12);
    burst.fillStyle(color, 0.4);
    burst.fillCircle(W / 2, H / 2, 160);
    this.tweens.add({ targets: burst, alpha: 0, scaleX: 2.5, scaleY: 2.5, duration: 700, onComplete: () => burst.destroy() });

    // Rarity label
    const rarityText = this.add.text(W / 2, H / 2 - 90, rarityData.label, {
      fontSize: '36px', fill: colorHex,
      fontFamily: 'Arial Black, Arial', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 7
    }).setOrigin(0.5).setAlpha(0).setScale(0.3).setDepth(15);

    this.tweens.add({ targets: rarityText, alpha: 1, scaleX: 1, scaleY: 1, duration: 500, ease: 'Back.easeOut' });

    // Gold reward
    const goldText = this.add.text(W / 2, H / 2 - 20, `💰 +${this.reward.gold} GOLD`, {
      fontSize: '28px', fill: '#FFD700',
      fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0).setDepth(15);

    this.time.delayedCall(300, () => {
      this.tweens.add({ targets: goldText, alpha: 1, y: goldText.y - 10, duration: 400 });
    });

    // Character reward
    if (this.reward.charReward) {
      const charText = this.add.text(W / 2, H / 2 + 40, `🃏 ${this.reward.charReward.replace(/_/g, ' ').toUpperCase()} CARD`, {
        fontSize: '16px', fill: '#A29BFE', fontFamily: 'Arial', fontStyle: 'bold'
      }).setOrigin(0.5).setAlpha(0).setDepth(15);
      this.time.delayedCall(500, () => { this.tweens.add({ targets: charText, alpha: 1, duration: 400 }); });
    }

    // Claim & save
    this._claimReward();

    // Particle celebration
    this._spawnParticles(color);

    // Continue button
    this.time.delayedCall(1000, () => {
      this.add.text(W / 2, H - 70, '[ CONTINUE ]', {
        fontSize: '18px', fill: '#FFFFFF',
        fontFamily: 'Arial', fontStyle: 'bold',
        backgroundColor: '#1a1a2e',
        padding: { x: 20, y: 10 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(16)
        .on('pointerdown', () => {
          this.scene.start('MainMenu');
        });
    });
  }

  async _claimReward() {
    try {
      const token = this.registry.get('token') || localStorage.getItem('bb_token');
      const res = await fetch(`${SERVER_URL}/auth/loot/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rarity: this.reward.rarity,
          goldReward: this.reward.gold,
          charReward: this.reward.charReward
        })
      });
      if (res.ok) {
        const data = await res.json();
        this.registry.set('gold', data.gold);
        localStorage.setItem('bb_gold', String(data.gold));
      }
    } catch (e) {
      console.warn('Could not claim reward:', e);
    }
  }

  _spawnParticles(color) {
    const { width: W, height: H } = this.scale;
    const g = this.add.graphics().setDepth(14);
    const particles = Array.from({ length: 30 }, () => ({
      x: W / 2 + (Math.random() - 0.5) * 60,
      y: H / 2,
      vx: (Math.random() - 0.5) * 6,
      vy: -(2 + Math.random() * 5),
      life: 1
    }));

    this.time.addEvent({
      delay: 16, repeat: 60,
      callback: () => {
        g.clear();
        for (const p of particles) {
          p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life -= 0.015;
          if (p.life > 0) {
            g.fillStyle(color, p.life);
            g.fillRect(p.x, p.y, 5, 5);
          }
        }
      }
    });
  }
}
