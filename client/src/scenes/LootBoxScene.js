import Phaser from 'phaser';
import { audioSystem } from '../systems/AudioSystem.js';
import { SERVER_URL } from '../config.js';
import { RARITIES } from '../systems/LootSystem.js';
import { cardTexKey } from '../characters/heroTex.js';
import { CHARACTERS } from '../characters/CharacterRegistry.js';
import { xpProgress } from '../systems/LevelSystem.js';

const CLICKS_NEEDED = 10;
const CLICK_WINDOW_MS = 2500;

export class LootBoxScene extends Phaser.Scene {
  constructor() { super('LootBox'); }

  init(data) {
    this.reward     = data?.reward || { rarity: 'common', gold: 100, charReward: null };
    this.clickCount = 0;
    this.clickStart = null;
    this.opened     = false;
    this.phase      = 'locked';
    this._shakeOff  = null;
  }

  create() {
    const { width: W, height: H } = this.scale;
    const rarityData = RARITIES[this.reward.rarity] || RARITIES.common;
    this.rarityCol   = rarityData.color;
    // Common's grey reads dull — FX always use a vibrant color (gold for common)
    this.fxCol = this.reward.rarity === 'common' ? 0xFFC94D : this.rarityCol;

    // ── Background — rich vault purple, spotlight on the chest ───────────────
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1b1038, 0x1b1038, 0x0a0618, 0x120a26, 1);
    bg.fillRect(0, 0, W, H);
    bg.fillStyle(this.fxCol, 0.05); bg.fillEllipse(W / 2, H * 0.38, 420, 420);
    this._drawStars();

    // Ambient rarity glow on floor
    const glowG = this.add.graphics().setDepth(1);
    glowG.fillStyle(this.rarityCol, 0.07);
    glowG.fillEllipse(W / 2, H * 0.62, 260, 80);

    // ── Title ─────────────────────────────────────────────────────────────────
    this.add.text(W / 2, 38, 'LOOT CHEST', {
      fontSize: '28px', fill: '#FFD700',
      fontFamily: 'Arial Black, Arial', fontStyle: 'bold',
      stroke: '#332200', strokeThickness: 5
    }).setOrigin(0.5).setDepth(3);

    const colH = `#${this.rarityCol.toString(16).padStart(6, '0')}`;
    this.add.text(W / 2, 68, `✦  ${(rarityData.label || this.reward.rarity).toUpperCase()}  ✦`, {
      fontSize: '13px', fill: colH, fontFamily: 'Arial', fontStyle: 'bold', letterSpacing: 3
    }).setOrigin(0.5).setDepth(3);

    // ── Instruction (blink) ───────────────────────────────────────────────────
    this.instructionText = this.add.text(W / 2, H * 0.75, 'TAP THE CHEST TO UNLOCK!', {
      fontSize: '14px', fill: '#AAAACC', fontFamily: 'Arial', letterSpacing: 2
    }).setOrigin(0.5).setDepth(3);
    this.tweens.add({ targets: this.instructionText, alpha: 0.25, duration: 520, yoyo: true, repeat: -1 });

    // ── Rotating god-rays + pulsing aura behind the chest ────────────────────
    this.raysG = this.add.graphics().setDepth(2).setPosition(W / 2, H * 0.38);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const len = i % 2 === 0 ? 190 : 130;
      this.raysG.fillStyle(this.fxCol, i % 2 === 0 ? 0.22 : 0.12);
      this.raysG.fillTriangle(0, 0,
        Math.cos(a - 0.10) * len, Math.sin(a - 0.10) * len,
        Math.cos(a + 0.10) * len, Math.sin(a + 0.10) * len);
    }
    this.tweens.add({ targets: this.raysG, angle: 360, duration: 20000, repeat: -1, ease: 'Linear' });
    const aura = this.add.graphics().setDepth(2);
    aura.fillStyle(this.fxCol, 0.22); aura.fillCircle(W / 2, H * 0.38, 110);
    aura.fillStyle(this.fxCol, 0.12); aura.fillCircle(W / 2, H * 0.38, 150);
    this.tweens.add({ targets: aura, alpha: 0.45, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Drifting sparkles around the chest
    this.time.addEvent({ delay: 260, repeat: -1, callback: () => {
      if (this.opened) return;
      const sx = W / 2 + (Math.random() - 0.5) * 220, sy = H * 0.38 + (Math.random() - 0.5) * 170;
      const sp = this.add.text(sx, sy, '✦', { fontSize: '12px', fill: '#FFE9A0' }).setDepth(3).setAlpha(0);
      this.tweens.add({ targets: sp, alpha: 0.9, y: sy - 16, duration: 480, yoyo: true,
        onComplete: () => sp.destroy() });
    }});

    // ── Chest ─────────────────────────────────────────────────────────────────
    this.chestContainer = this.add.container(W / 2, H * 0.38).setDepth(5).setScale(1.35);
    this.boxG  = this.add.graphics();
    this.lidG  = this.add.graphics();
    this.lockG = this.add.graphics();
    this.glintG = this.add.graphics();
    this.chestContainer.add([this.boxG, this.lidG, this.lockG, this.glintG]);
    this._drawChest();

    // Idle float tween
    this._floatTween = this.tweens.add({
      targets: this.chestContainer, y: H * 0.38 - 8,
      duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    // ── Progress bar ──────────────────────────────────────────────────────────
    const barY = H * 0.77;
    const BAR_W = 260, BAR_H = 16;
    const barBg = this.add.graphics().setDepth(4);
    barBg.fillStyle(0x0e0e28, 0.9); barBg.fillRoundedRect(W / 2 - BAR_W / 2, barY - BAR_H / 2, BAR_W, BAR_H, 8);
    barBg.lineStyle(1.5, 0x223355, 0.7); barBg.strokeRoundedRect(W / 2 - BAR_W / 2, barY - BAR_H / 2, BAR_W, BAR_H, 8);

    this.progressFill = this.add.graphics().setDepth(5);
    this._drawProgress(0);

    this.clickLabel = this.add.text(W / 2, barY + 16, `0 / ${CLICKS_NEEDED}`, {
      fontSize: '12px', fill: '#6688AA', fontFamily: 'Arial'
    }).setOrigin(0.5).setDepth(5);

    // ── Skip button ───────────────────────────────────────────────────────────
    const skip = this.add.text(W / 2, H - 38, '[ SKIP ]', {
      fontSize: '13px', fill: '#334455', fontFamily: 'Arial'
    }).setOrigin(0.5).setDepth(5).setInteractive({ useHandCursor: true });
    skip.on('pointerover', () => skip.setStyle({ fill: '#8899AA' }));
    skip.on('pointerout',  () => skip.setStyle({ fill: '#334455' }));
    skip.on('pointerdown', () => this._openBox());

    // ── Tap zone (whole upper screen) ────────────────────────────────────────
    this.add.zone(W / 2, H * 0.38, 300, 300)
      .setInteractive({ useHandCursor: true }).setDepth(10)
      .on('pointerdown', () => this._handleClick());

    this.cameras.main.fadeIn(350);
  }

  // ── Chest drawing ──────────────────────────────────────────────────────────
  _drawChest(lidAngle = 0) {
    const col   = this.rarityCol;
    const BW = 110, BH = 72, LH = 38;

    this.boxG.clear(); this.lidG.clear(); this.lockG.clear(); this.glintG.clear();

    // Shadow on floor
    this.boxG.fillStyle(0x000000, 0.28);
    this.boxG.fillEllipse(0, BH / 2 + 8, BW + 20, 14);

    // ── Body ──────────────────────────────────────────────────────────────────
    // Dark wood base
    this.boxG.fillStyle(0x3B1E08);
    this.boxG.fillRoundedRect(-BW / 2, 0, BW, BH, { bl: 10, br: 10, tl: 0, tr: 0 });
    // Wood grain highlight
    this.boxG.fillStyle(0x5A2E10, 0.7);
    this.boxG.fillRoundedRect(-BW / 2 + 4, 4, BW - 8, BH - 8, { bl: 8, br: 8, tl: 0, tr: 0 });
    // Metal band
    this.boxG.fillStyle(0xD9A21B);
    this.boxG.fillRect(-BW / 2, BH * 0.38, BW, 10);
    this.boxG.fillStyle(0xFFE9A0, 0.6);
    this.boxG.fillRect(-BW / 2 + 2, BH * 0.38 + 1, BW - 4, 4);
    // Rarity accent strips
    this.boxG.fillStyle(col, 0.55);
    this.boxG.fillRect(-BW / 2, BH * 0.38, BW, 3);
    this.boxG.fillRect(-BW / 2, BH * 0.38 + 7, BW, 3);
    // Corner studs
    [[- BW / 2 + 6, 6], [BW / 2 - 14, 6], [-BW / 2 + 6, BH - 14], [BW / 2 - 14, BH - 14]].forEach(([sx, sy]) => {
      this.boxG.fillStyle(0xD9A21B); this.boxG.fillRect(sx, sy, 8, 8);
      this.boxG.fillStyle(0xFFFFFF, 0.3); this.boxG.fillRect(sx + 1, sy + 1, 3, 3);
    });
    // Body border
    this.boxG.lineStyle(2, col, 0.7);
    this.boxG.strokeRoundedRect(-BW / 2, 0, BW, BH, { bl: 10, br: 10, tl: 0, tr: 0 });

    // ── Lid (hinged at top of body) ───────────────────────────────────────────
    const lidY = -lidAngle * LH * 0.6;
    this.lidG.fillStyle(0x4A2510);
    this.lidG.fillRoundedRect(-BW / 2, lidY - LH, BW, LH + 4, { tl: 10, tr: 10, bl: 0, br: 0 });
    this.lidG.fillStyle(0x6A3518, 0.7);
    this.lidG.fillRoundedRect(-BW / 2 + 4, lidY - LH + 4, BW - 8, LH - 6, { tl: 8, tr: 8, bl: 0, br: 0 });
    // Lid metal band
    this.lidG.fillStyle(0xD9A21B);
    this.lidG.fillRect(-BW / 2, lidY - 6, BW, 8);
    this.lidG.fillStyle(0xFFE9A0, 0.5);
    this.lidG.fillRect(-BW / 2 + 2, lidY - 5, BW - 4, 3);
    this.lidG.fillStyle(col, 0.55);
    this.lidG.fillRect(-BW / 2, lidY - 6, BW, 3);
    // Lid border
    this.lidG.lineStyle(2, col, 0.7);
    this.lidG.strokeRoundedRect(-BW / 2, lidY - LH, BW, LH + 4, { tl: 10, tr: 10, bl: 0, br: 0 });

    // ── Padlock (front center) ─────────────────────────────────────────────────
    this.lockG.fillStyle(0xE8B62A);
    this.lockG.fillRoundedRect(-14, -10, 28, 22, 5);
    this.lockG.fillStyle(0xFFE9A0, 0.5);
    this.lockG.fillRoundedRect(-12, -8, 12, 8, 3);
    this.lockG.lineStyle(5.5, 0xE8B62A);
    this.lockG.beginPath(); this.lockG.arc(0, -10, 10, Math.PI, 0, false); this.lockG.strokePath();
    this.lockG.fillStyle(0x666666); this.lockG.fillCircle(0, -1, 5);
    this.lockG.fillRect(-1.5, -1, 3, 8);
    // Rarity tint on lock
    this.lockG.lineStyle(1.5, col, 0.5);
    this.lockG.strokeRoundedRect(-14, -10, 28, 22, 5);

    // ── Glint (top corner specular) ───────────────────────────────────────────
    this.glintG.fillStyle(0xFFFFFF, 0.22);
    this.glintG.fillTriangle(-BW / 2 + 6, lidY - LH + 4, -BW / 2 + 26, lidY - LH + 4, -BW / 2 + 6, lidY - LH + 18);
  }

  _drawProgress(pct) {
    const { width: W, height: H } = this.scale;
    const BAR_W = 260, BAR_H = 16, barY = H * 0.77;
    const col = pct >= 1 ? 0x44FF88 : this.rarityCol;
    this.progressFill.clear();
    if (pct <= 0) return;
    this.progressFill.fillStyle(col, 0.8);
    this.progressFill.fillRoundedRect(W / 2 - BAR_W / 2 + 2, barY - BAR_H / 2 + 2, (BAR_W - 4) * pct, BAR_H - 4, 6);
    this.progressFill.fillStyle(0xFFFFFF, 0.18);
    this.progressFill.fillRoundedRect(W / 2 - BAR_W / 2 + 2, barY - BAR_H / 2 + 2, (BAR_W - 4) * pct * 0.55, (BAR_H - 4) * 0.45, 4);
  }

  // ── Interaction ────────────────────────────────────────────────────────────
  _handleClick() {
    if (this.opened || this.phase === 'opening') return;
    const now = Date.now();

    if (!this.clickStart) {
      this.clickStart = now;
      this._shakeOff = setTimeout(() => this._resetClicks(), CLICK_WINDOW_MS);
    }

    this.clickCount++;
    audioSystem.playClick();

    // Chest shake
    this.tweens.add({
      targets: this.chestContainer,
      x: `+=${(Math.random() - 0.5) * 18}`,
      duration: 55, yoyo: true, ease: 'Linear'
    });
    // Lid crack open slightly more with each click
    const lidFraction = Math.min(1, this.clickCount / CLICKS_NEEDED);
    this._drawChest(lidFraction * 0.45);

    // Rarity glow pulse
    const pct = this.clickCount / CLICKS_NEEDED;
    this._drawProgress(pct);
    this.clickLabel.setText(`${this.clickCount} / ${CLICKS_NEEDED}`);

    if (this.clickCount >= CLICKS_NEEDED) {
      if (this._shakeOff) clearTimeout(this._shakeOff);
      this._openBox();
    }
  }

  _resetClicks() {
    if (this.opened) return;
    this.clickCount = 0;
    this.clickStart = null;
    this._drawProgress(0);
    this._drawChest(0);
    this.clickLabel.setText(`0 / ${CLICKS_NEEDED}`);
    this.tweens.add({ targets: this.chestContainer, x: `+=10`, duration: 55, yoyo: true, repeat: 3, ease: 'Linear' });
  }

  _openBox() {
    if (this.opened) return;
    this.opened = true; this.phase = 'opening';

    this._floatTween?.stop();
    this._drawChest(1);
    this._drawProgress(1);
    this.clickLabel.setText('UNLOCKED!').setStyle({ fill: '#44FF88' });
    this.instructionText.setVisible(false);
    // Hide locked-phase chrome so the reveal screen is clean
    this.time.delayedCall(600, () => {
      this.clickLabel.setVisible(false);
      this.progressFill.setVisible(false);
      this.children.list.forEach(o => { if (o.text === '[ SKIP ]') o.setVisible(false); });
    });

    audioSystem.playLootOpen?.();

    // White screen flash + camera shake — the "pop"
    const { width: FW, height: FH } = this.scale;
    const flash = this.add.rectangle(FW / 2, FH / 2, FW, FH, 0xFFFFFF, 0.85).setDepth(30);
    this.tweens.add({ targets: flash, alpha: 0, duration: 380, onComplete: () => flash.destroy() });
    this.cameras.main.shake(180, 0.012);

    // Blast the chest open
    this.tweens.add({
      targets: this.chestContainer,
      scaleX: 1.6, scaleY: 1.6, y: `-=16`,
      duration: 130, yoyo: true, ease: 'Back.easeOut',
      onComplete: () => {
        this._coinBurst(this.chestContainer.x, this.chestContainer.y);
        this.tweens.add({
          targets: this.chestContainer,
          alpha: 0, scaleX: 0.6, scaleY: 0.6,
          duration: 300, ease: 'Power2',
          onComplete: () => this._reveal()
        });
      }
    });
  }

  _reveal() {
    const { width: W, height: H } = this.scale;
    this.phase = 'revealed';
    const col  = this.rarityCol;
    const colH = `#${col.toString(16).padStart(6, '0')}`;
    const rarityData = RARITIES[this.reward.rarity] || RARITIES.common;

    // Big burst ring
    const burst = this.add.graphics().setDepth(12);
    burst.lineStyle(12, col, 0.7); burst.strokeCircle(W / 2, H / 2, 10);
    this.tweens.add({ targets: burst, scaleX: 18, scaleY: 18, alpha: 0, duration: 600, ease: 'Power2', onComplete: () => burst.destroy() });

    // Floor glow
    const glow = this.add.graphics().setDepth(11);
    glow.fillStyle(col, 0.22); glow.fillEllipse(W / 2, H * 0.55, 300, 120);
    this.tweens.add({ targets: glow, alpha: 0, duration: 900, onComplete: () => glow.destroy() });

    // Rarity label — big drop-in
    const rarityText = this.add.text(W / 2, H * 0.28, rarityData.label?.toUpperCase() || this.reward.rarity.toUpperCase(), {
      fontSize: '46px', fill: colH,
      fontFamily: 'Arial Black, Arial', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 8
    }).setOrigin(0.5).setAlpha(0).setScale(0.25).setDepth(15);
    this.tweens.add({ targets: rarityText, alpha: 1, scaleX: 1, scaleY: 1, duration: 520, ease: 'Back.easeOut' });

    // Gold reward
    const goldText = this.add.text(W / 2, H * 0.44, `💰  +${this.reward.gold} GOLD`, {
      fontSize: '30px', fill: '#FFD700',
      fontFamily: 'Arial Black, Arial', fontStyle: 'bold',
      stroke: '#332200', strokeThickness: 4
    }).setOrigin(0.5).setAlpha(0).setDepth(15);
    this.time.delayedCall(280, () => {
      this.tweens.add({ targets: goldText, alpha: 1, y: goldText.y - 8, duration: 380, ease: 'Sine.easeOut' });
    });

    // Character card reward — a real physical card with the hero's portrait
    if (this.reward.charReward) {
      const id = this.reward.charReward;
      const cy = H * 0.51, cw = 84, ch = 104;
      const card = this.add.container(W / 2, cy).setDepth(15).setAlpha(0).setScale(0.3);
      const cbg = this.add.graphics();
      cbg.fillStyle(0x0d1428, 1); cbg.fillRoundedRect(-cw / 2, -ch / 2, cw, ch, 10);
      cbg.fillStyle(col, 0.25);   cbg.fillRoundedRect(-cw / 2, -ch / 2, cw, ch, 10);
      cbg.lineStyle(3, col, 1);   cbg.strokeRoundedRect(-cw / 2, -ch / 2, cw, ch, 10);
      card.add(cbg);
      const pKey = cardTexKey(this, id);
      if (pKey) {
        const img = this.add.image(0, -8, pKey);
        const src = this.textures.get(pKey).getSourceImage();
        const s = Math.min((cw - 14) / src.width, (ch - 34) / src.height);
        img.setDisplaySize(src.width * s, src.height * s);
        card.add(img);
      }
      card.add(this.add.text(0, ch / 2 - 12, CHARACTERS[id]?.name || id, {
        fontSize: '10px', fill: '#FFFFFF', fontFamily: 'Arial Black, Arial', fontStyle: 'bold'
      }).setOrigin(0.5));
      const newTag = this.add.text(W / 2 + cw / 2 - 4, cy - ch / 2 + 4, '+1', {
        fontSize: '14px', fill: '#44FF88', fontFamily: 'Arial Black, Arial', fontStyle: 'bold', stroke: '#000', strokeThickness: 3
      }).setOrigin(0.5).setAlpha(0).setDepth(16);
      this.time.delayedCall(430, () => {
        this.tweens.add({ targets: card, alpha: 1, scaleX: 1, scaleY: 1, duration: 420, ease: 'Back.easeOut' });
        this.tweens.add({ targets: newTag, alpha: 1, duration: 300, delay: 300 });
        this.tweens.add({ targets: card, angle: 3, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 500 });
      });
    }

    this._claimReward();
    this._spawnParticles(col);
    this.raysG?.setPosition(W / 2, H * 0.40);
    this.time.delayedCall(650, () => this._showXpPanel());

    // Continue button
    this.time.delayedCall(950, () => {
      const btnG = this.add.graphics().setDepth(16);
      btnG.fillStyle(0xBB8800, 0.92);
      btnG.fillRoundedRect(W / 2 - 130, H - 88, 260, 48, 10);
      btnG.fillStyle(0xFFFFFF, 0.07); btnG.fillRoundedRect(W / 2 - 128, H - 86, 256, 20, 8);
      btnG.lineStyle(2, 0xFFD700, 0.8); btnG.strokeRoundedRect(W / 2 - 130, H - 88, 260, 48, 10);

      const btnTxt = this.add.text(W / 2, H - 64, 'CONTINUE  →', {
        fontSize: '18px', fill: '#FFFFFF',
        fontFamily: 'Arial Black, Arial', fontStyle: 'bold',
        stroke: '#331100', strokeThickness: 3
      }).setOrigin(0.5).setDepth(17).setInteractive({ useHandCursor: true });

      btnTxt.on('pointerover', () => { btnG.setAlpha(0.8); btnTxt.setScale(1.04); });
      btnTxt.on('pointerout',  () => { btnG.setAlpha(1);   btnTxt.setScale(1); });
      btnTxt.on('pointerdown', () => {
        audioSystem.playClick();
        this.cameras.main.fadeOut(220, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('MainMenu'));
      });

      this.tweens.add({ targets: [btnG, btnTxt], alpha: 0, duration: 0 });
      this.tweens.add({ targets: [btnG, btnTxt], alpha: 1, duration: 400 });
    });
  }

  // Physical gold coins erupting from the chest
  _coinBurst(x, y) {
    for (let i = 0; i < 16; i++) {
      const coin = this.add.container(x, y - 20).setDepth(20);
      const g = this.add.graphics();
      g.fillStyle(0x8A5E00); g.fillCircle(0, 1.5, 8);
      g.fillStyle(0xFFC94D); g.fillCircle(0, 0, 8);
      g.fillStyle(0xFFE9A0); g.fillCircle(-2.5, -2.5, 3);
      g.lineStyle(1.5, 0xB8860B, 0.9); g.strokeCircle(0, 0, 8);
      coin.add(g);
      const dx = (Math.random() - 0.5) * 260;
      const peak = 60 + Math.random() * 110;
      const dur = 620 + Math.random() * 300;
      this.tweens.add({ targets: coin, x: x + dx, duration: dur, ease: 'Linear' });
      this.tweens.add({ targets: coin, y: y - 20 - peak, duration: dur * 0.42, ease: 'Quad.easeOut',
        onComplete: () => this.tweens.add({
          targets: coin, y: y + 120 + Math.random() * 60, duration: dur * 0.58, ease: 'Quad.easeIn',
          onComplete: () => this.tweens.add({ targets: coin, alpha: 0, duration: 200, onComplete: () => coin.destroy() })
        })
      });
      this.tweens.add({ targets: coin, scaleX: 0.25, duration: 180, yoyo: true, repeat: Math.ceil(dur / 360), ease: 'Sine.easeInOut' });
    }
  }

  // Deck characters' level-up progress (how close each is to the next level)
  async _showXpPanel() {
    const { width: W, height: H } = this.scale;
    let charData = {};
    try {
      const token = this.registry.get('token') || localStorage.getItem('bb_token');
      const res = await fetch(`${SERVER_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) for (const c of (await res.json()).characters || []) charData[c.char_id] = c;
    } catch { /* offline — show level 1 defaults */ }

    const deck = (this.registry.get('deck') || []).slice(0, 7);
    if (!deck.length) return;

    const panelY = H * 0.625, rowH = 40, colW = (W - 48) / 2;
    const pg = this.add.graphics().setDepth(14).setAlpha(0);
    pg.fillStyle(0x0a1024, 0.92);
    pg.fillRoundedRect(16, panelY - 14, W - 32, Math.ceil(deck.length / 2) * rowH + 46, 12);
    pg.lineStyle(1.5, 0xC8A23A, 0.5);
    pg.strokeRoundedRect(16, panelY - 14, W - 32, Math.ceil(deck.length / 2) * rowH + 46, 12);
    const title = this.add.text(W / 2, panelY + 2, '⬆  CHARACTER PROGRESS', {
      fontSize: '12px', fill: '#E7C870', fontFamily: 'Arial Black, Arial', fontStyle: 'bold', letterSpacing: 1
    }).setOrigin(0.5).setAlpha(0).setDepth(15);
    const objs = [pg, title];

    deck.forEach((id, i) => {
      const cd  = charData[id] || { level: 1, xp: 0 };
      const pr  = xpProgress(cd.level || 1, cd.xp || 0);
      const x   = 28 + (i % 2) * colW, y = panelY + 22 + Math.floor(i / 2) * rowH;
      // portrait chip
      const pKey = cardTexKey(this, id);
      if (pKey) {
        const img = this.add.image(x + 13, y + 12, pKey).setDepth(15).setAlpha(0);
        const src = this.textures.get(pKey).getSourceImage();
        const s = Math.min(26 / src.width, 30 / src.height);
        img.setDisplaySize(src.width * s, src.height * s);
        objs.push(img);
      }
      const nm = this.add.text(x + 30, y, `${CHARACTERS[id]?.name || id}  ·  Lv ${cd.level || 1}`, {
        fontSize: '10px', fill: '#FFFFFF', fontFamily: 'Arial', fontStyle: 'bold'
      }).setAlpha(0).setDepth(15);
      // XP bar
      const bw = colW - 44;
      const bar = this.add.graphics().setDepth(15).setAlpha(0);
      bar.fillStyle(0x1c2440, 1); bar.fillRoundedRect(x + 30, y + 14, bw, 8, 4);
      bar.fillStyle(pr.pct >= 1 ? 0x44FF88 : 0x4FA8FF, 0.95);
      bar.fillRoundedRect(x + 30, y + 14, Math.max(4, bw * pr.pct), 8, 4);
      const pctT = this.add.text(x + 30 + bw, y + 4, pr.pct >= 1 ? 'MAX' : `${Math.round(pr.pct * 100)}%`, {
        fontSize: '9px', fill: pr.pct >= 1 ? '#44FF88' : '#8FB4E8', fontFamily: 'Arial', fontStyle: 'bold'
      }).setOrigin(1, 0).setAlpha(0).setDepth(15);
      objs.push(nm, bar, pctT);
    });

    this.tweens.add({ targets: objs, alpha: 1, duration: 420 });
  }

  async _claimReward() {
    try {
      const token = this.registry.get('token') || localStorage.getItem('bb_token');
      const res = await fetch(`${SERVER_URL}/auth/loot/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ rarity: this.reward.rarity, goldReward: this.reward.gold, charReward: this.reward.charReward })
      });
      if (res.ok) {
        const data = await res.json();
        this.registry.set('gold', data.gold);
        localStorage.setItem('bb_gold', String(data.gold));
      }
    } catch (e) { console.warn('Could not claim reward:', e); }
  }

  _drawStars() {
    const { width: W, height: H } = this.scale;
    const g = this.add.graphics().setDepth(1);
    for (let i = 0; i < 90; i++) {
      const a = 0.06 + Math.random() * 0.5;
      const s = Math.random() < 0.12 ? 2 : 1;
      g.fillStyle(0xFFFFFF, a);
      g.fillRect(Math.random() * W, Math.random() * H, s, s);
    }
  }

  _spawnParticles(col) {
    const { width: W, height: H } = this.scale;
    const g = this.add.graphics().setDepth(13);
    const SEC = [0xFFD700, 0xFFFFFF, col];
    const particles = Array.from({ length: 50 }, () => ({
      x: W / 2 + (Math.random() - 0.5) * 40,
      y: H * 0.52,
      vx: (Math.random() - 0.5) * 7,
      vy: -(3 + Math.random() * 6),
      col: SEC[Math.floor(Math.random() * SEC.length)],
      s: 3 + Math.random() * 5,
      life: 1
    }));
    this.time.addEvent({
      delay: 16, repeat: 90,
      callback: () => {
        g.clear();
        for (const p of particles) {
          p.x += p.vx; p.y += p.vy; p.vy += 0.14; p.life -= 0.011;
          if (p.life > 0) { g.fillStyle(p.col, p.life); g.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s); }
        }
      }
    });
  }
}
