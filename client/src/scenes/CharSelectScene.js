import Phaser from 'phaser';
import { CHARACTERS, CHARACTER_IDS, RARITY_COLORS, MYSTERY_SLOTS } from '../characters/CharacterRegistry.js';
import { DRAW_FUNCS } from '../characters/CharacterGraphics.js';
import { xpProgress } from '../systems/LevelSystem.js';
import { audioSystem } from '../systems/AudioSystem.js';

const DECK_SIZE = 7;
const COLS      = 4;
const CARD_W    = 90;
const CARD_H    = 106;
const CARD_PAD  = 8;
const SLOT_W    = 48;
const SLOT_H    = 46;

export class CharSelectScene extends Phaser.Scene {
  constructor() { super('CharSelect'); }

  init(data) {
    this.battleMode   = data?.mode || '1v1';
    this.deckEditOnly = data?.mode === 'deck_edit';
    this.selectedDeck = [...(this.registry.get('deck') || [])];
    this.charData     = {};
  }

  async create() {
    const { width: W, height: H } = this.scale;
    this.W = W; this.H = H;

    // Fetch user character progress
    try {
      const token = this.registry.get('token');
      const res   = await fetch('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const me = await res.json();
        this.registry.set('gold', me.gold);
        for (const c of (me.characters || [])) this.charData[c.char_id] = c;
      }
    } catch { /* offline */ }

    // ── Background ─────────────────────────────────────────────────────────
    // Deep space background
    this.add.rectangle(0, 0, W, H, 0x080816).setOrigin(0);

    // Subtle radial glow in center
    const bgG = this.add.graphics();
    bgG.fillStyle(0x1a2255, 0.4); bgG.fillEllipse(W / 2, H * 0.44, W * 1.2, H * 0.7);
    bgG.fillStyle(0x0d1133, 0.5); bgG.fillEllipse(W / 2, H * 0.44, W * 0.7, H * 0.4);

    // Stars
    const sg = this.add.graphics();
    for (let i = 0; i < 80; i++) {
      const alpha = 0.10 + Math.abs(Math.sin(i * 37)) * 0.35;
      sg.fillStyle(0xFFFFFF, alpha);
      sg.fillRect(
        Math.abs(Math.sin(i * 73.1)) * W,
        Math.abs(Math.cos(i * 37.7)) * H,
        1.2, 1.2
      );
    }

    // Top gradient bar
    const hdrG = this.add.graphics();
    hdrG.fillStyle(0x000000, 0.72); hdrG.fillRect(0, 0, W, 64);
    hdrG.lineStyle(1, 0x2244AA, 0.5); hdrG.lineBetween(0, 64, W, 64);

    // ── Header ─────────────────────────────────────────────────────────────
    this.add.text(W / 2, 22, 'SELECT YOUR BATTLE DECK', {
      fontSize: '18px', fill: '#FFD700',
      fontFamily: 'Arial Black, Arial', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(2);

    this.counterText = this.add.text(W / 2, 46, `${this.selectedDeck.length} / ${DECK_SIZE} selected`, {
      fontSize: '12px', fill: '#8899CC', fontFamily: 'Arial'
    }).setOrigin(0.5).setDepth(2);

    this.add.text(28, 22, '← BACK', {
      fontSize: '12px', fill: '#556688', fontFamily: 'Arial'
    }).setOrigin(0.5).setDepth(2).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('MainMenu'));

    // ── Card grid ──────────────────────────────────────────────────────────
    this._buildGrid();

    // ── Deck bar ───────────────────────────────────────────────────────────
    this._buildDeckBar();

    // ── Info panel ─────────────────────────────────────────────────────────
    this._buildInfoPanel();

    // ── Confirm button ─────────────────────────────────────────────────────
    this.confirmBtn = this.add.text(W / 2, H - 18, '', {
      fontSize: '16px', fill: '#FFD700',
      fontFamily: 'Arial Black, Arial', fontStyle: 'bold',
      backgroundColor: '#0d0d22',
      padding: { x: 18, y: 9 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(12);
    this.confirmBtn.on('pointerdown', () => this._confirm());
    this.confirmBtn.on('pointerover', () => this.confirmBtn.setStyle({ fill: '#FFFFFF' }));
    this.confirmBtn.on('pointerout',  () => this.confirmBtn.setStyle({ fill: '#FFD700' }));

    this._refreshUI();
    this.cameras.main.fadeIn(280);
  }

  // ── Card Grid ──────────────────────────────────────────────────────────────
  _buildGrid() {
    const { W } = this;
    const gridW  = COLS * (CARD_W + CARD_PAD) - CARD_PAD;
    const startX = (W - gridW) / 2 + CARD_W / 2;
    const startY = 76;

    const ORDER = { legendary: 0, epic: 1, rare: 2, common: 3 };
    const sorted = [...CHARACTER_IDS].sort((a, b) =>
      ORDER[CHARACTERS[a].rarity] - ORDER[CHARACTERS[b].rarity]
    );

    this.cards = {};

    sorted.forEach((charId, idx) => {
      const col = idx % COLS;
      const row = Math.floor(idx / COLS);
      const cx  = startX + col * (CARD_W + CARD_PAD);
      const cy  = startY + row * (CARD_H + CARD_PAD);
      this._makeCard(charId, cx, cy);
    });

    const offset = sorted.length;
    for (let i = 0; i < MYSTERY_SLOTS; i++) {
      const idx = offset + i;
      const cx  = startX + (idx % COLS) * (CARD_W + CARD_PAD);
      const cy  = startY + Math.floor(idx / COLS) * (CARD_H + CARD_PAD);
      this._makeMysteryCard(cx, cy);
    }
  }

  _makeCard(charId, cx, cy) {
    const char  = CHARACTERS[charId];
    const rc    = RARITY_COLORS[char.rarity];
    const cd    = this.charData[charId] || { level: 1, xp: 0 };
    const isSel = this.selectedDeck.includes(charId);
    const CW = CARD_W - 2, CH = CARD_H - 2;
    const lx = cx - CW / 2, ly = cy - CH / 2;

    // ── Background layers (gradient simulation) ─────────────────────────────
    const bg = this.add.rectangle(cx, cy, CW, CH, 0x0a0a1e);

    // Rarity color gradient at top
    const grad1 = this.add.rectangle(cx, ly + CH * 0.20, CW, CH * 0.40, rc, 0.20);
    const grad2 = this.add.rectangle(cx, ly + CH * 0.08, CW, CH * 0.18, rc, 0.12);
    const topShine = this.add.rectangle(cx, ly + 2, CW, 4, 0xFFFFFF, 0.06);

    // Top rarity color stripe
    const topStripe = this.add.rectangle(cx, ly + 2, CW, 4, rc, 0.85);

    // ── Border (drawn separately so we can redraw on select) ────────────────
    const border = this.add.graphics();
    this._drawCardBorder(border, cx, cy, CW, CH, rc, isSel);

    // ── Character portrait ──────────────────────────────────────────────────
    let portrait;
    if (this.textures.exists(charId)) {
      portrait = this.add.image(cx, cy - 12, charId)
        .setDisplaySize(CW - 8, CH * 0.58)
        .setDepth(1);
    } else {
      portrait = this.add.graphics().setDepth(1);
      portrait.x = cx;
      portrait.y = cy - 10;
      const fn = DRAW_FUNCS[charId];
      if (fn) fn(portrait);
      portrait.setScale(0.62);
    }

    // ── Rarity banner at bottom ─────────────────────────────────────────────
    const bannerH = 20;
    const bannerY = cy + CH / 2 - bannerH / 2 - 1;
    const banner  = this.add.rectangle(cx, bannerY, CW, bannerH, rc, 0.88).setDepth(2);
    const banShine= this.add.rectangle(cx - CW * 0.12, bannerY - bannerH * 0.22, CW * 0.38, bannerH * 0.38, 0xFFFFFF, 0.12).setDepth(2);
    const rarLbl  = this.add.text(cx, bannerY + 3, char.rarity.toUpperCase(), {
      fontSize: '7px', fill: '#000000', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3);

    // Name (above banner)
    const nameY = bannerY - 12;
    const name  = this.add.text(cx, nameY, char.name, {
      fontSize: '8px', fill: '#FFFFFF', fontFamily: 'Arial', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
      wordWrap: { width: CW - 6 }
    }).setOrigin(0.5).setDepth(3);

    // ── Elixir badge (top-left) ─────────────────────────────────────────────
    const egX = lx + 12, egY = ly + 12;
    const eg = this.add.graphics().setDepth(3);
    eg.fillStyle(0x5A0099); eg.fillCircle(egX, egY, 12);
    eg.fillStyle(0x8822CC, 0.5); eg.fillCircle(egX - 1, egY - 1, 8);
    eg.lineStyle(1.5, 0xCC88FF, 0.6); eg.strokeCircle(egX, egY, 12);
    const eLbl = this.add.text(egX, egY, String(char.elixirCost), {
      fontSize: '13px', fill: '#FFFFFF', fontFamily: 'Arial', fontStyle: 'bold',
      stroke: '#220044', strokeThickness: 2
    }).setOrigin(0.5).setDepth(4);

    // ── Level badge (top-right) ─────────────────────────────────────────────
    const lvX = lx + CW - 12, lvY = ly + 12;
    const lvG = this.add.graphics().setDepth(3);
    lvG.fillStyle(0x080814); lvG.fillCircle(lvX, lvY, 12);
    lvG.lineStyle(2, rc, 0.9); lvG.strokeCircle(lvX, lvY, 12);
    const lvLbl = this.add.text(lvX, lvY, String(cd.level || 1), {
      fontSize: '12px', fontStyle: 'bold', fontFamily: 'Arial',
      fill: `#${rc.toString(16).padStart(6, '0')}`
    }).setOrigin(0.5).setDepth(4);

    // ── Selected checkmark ──────────────────────────────────────────────────
    const sel = this.add.text(cx, cy - 14, isSel ? '✓' : '', {
      fontSize: '24px', fill: '#FFD700', fontFamily: 'Arial', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(5);

    // ── Interaction ─────────────────────────────────────────────────────────
    const zone = this.add.zone(cx, cy, CARD_W, CARD_H).setInteractive({ useHandCursor: true }).setDepth(6);
    zone.on('pointerdown', () => this._toggleCard(charId));
    zone.on('pointerover', () => {
      this.tweens.add({ targets: [bg, grad1, grad2, border, banner, name, sel], scaleX: 1.07, scaleY: 1.07, duration: 90, ease: 'Power1' });
      this._showInfo(charId);
      this._runShimmer(cx, cy, CW, CH);
    });
    zone.on('pointerout', () => {
      this.tweens.add({ targets: [bg, grad1, grad2, border, banner, name, sel], scaleX: 1, scaleY: 1, duration: 90, ease: 'Power1' });
    });

    this.cards[charId] = {
      cx, cy, CW, CH, rc,
      bg, grad1, grad2, border, portrait, banner, banShine, rarLbl, name,
      eg, eLbl, lvG, lvLbl, sel, zone, charId
    };
  }

  _drawCardBorder(g, cx, cy, CW, CH, rc, isSel) {
    g.clear();
    const lx = cx - CW / 2, ly = cy - CH / 2;
    if (isSel) {
      g.lineStyle(3, 0xFFD700, 1);
      g.strokeRect(lx, ly, CW, CH);
      g.lineStyle(7, 0xFFD700, 0.12);
      g.strokeRect(lx - 3, ly - 3, CW + 6, CH + 6);
      g.fillStyle(0xFFD700, 0.08);
      g.fillRect(lx, ly, CW, CH);
    } else {
      g.lineStyle(1.5, rc, 0.40);
      g.strokeRect(lx, ly, CW, CH);
    }
  }

  _runShimmer(cx, cy, CW, CH) {
    const shimmer = this.add.rectangle(cx - CW * 0.7, cy, 22, CH - 4, 0xFFFFFF, 0.22).setDepth(7);
    this.tweens.add({
      targets: shimmer, x: cx + CW * 0.7, duration: 360, ease: 'Linear',
      onComplete: () => shimmer.destroy()
    });
  }

  _makeMysteryCard(cx, cy) {
    const CW = CARD_W - 2, CH = CARD_H - 2;
    const lx = cx - CW / 2, ly = cy - CH / 2;

    // Dark card
    this.add.rectangle(cx, cy, CW, CH, 0x07070f);
    this.add.rectangle(cx, ly + CH * 0.2, CW, CH * 0.4, 0x3344AA, 0.06);

    const g = this.add.graphics();
    g.lineStyle(1.5, 0x1e1e44, 0.8); g.strokeRect(lx, ly, CW, CH);
    // Faint top stripe
    g.fillStyle(0x2233AA, 0.3); g.fillRect(lx, ly, CW, 3);

    // Padlock body
    const pkX = cx, pkY = cy - 6;
    g.fillStyle(0x151530); g.fillRoundedRect(pkX - 12, pkY - 2, 24, 18, 4);
    g.lineStyle(3, 0x1e1e44); g.strokeRoundedRect(pkX - 12, pkY - 2, 24, 18, 4);
    g.lineStyle(4, 0x1e1e44); g.beginPath(); g.arc(pkX, pkY - 2, 11, Math.PI, 0, false); g.strokePath();
    g.fillStyle(0x2a2a55, 0.6); g.fillCircle(pkX, pkY + 6, 4);

    // Pulsing mystery orb
    const dot = this.add.graphics().setDepth(1);
    dot.fillStyle(0x6677FF, 0.5); dot.fillCircle(cx, cy - 26, 4);
    this.tweens.add({ targets: dot, alpha: 0.12, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.add.text(cx, cy + 26, '???',    { fontSize: '14px', fill: '#1e1e44', fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(cx, cy + 40, 'LOCKED', { fontSize: '7px',  fill: '#14142a', fontFamily: 'Arial' }).setOrigin(0.5);
  }

  // ── Deck bar ───────────────────────────────────────────────────────────────
  _buildDeckBar() {
    const { W, H } = this;
    this.deckBarY   = H - 64;
    const totalW    = DECK_SIZE * (SLOT_W + 4) - 4;
    this.deckStartX = (W - totalW) / 2 + SLOT_W / 2;

    // Background strip
    const strip = this.add.graphics().setDepth(9);
    strip.fillStyle(0x000000, 0.88); strip.fillRect(0, this.deckBarY - SLOT_H / 2 - 8, W, SLOT_H + 16);
    strip.lineStyle(1, 0x223366, 0.6); strip.lineBetween(0, this.deckBarY - SLOT_H / 2 - 8, W, this.deckBarY - SLOT_H / 2 - 8);

    this.deckSlots = [];
    for (let i = 0; i < DECK_SIZE; i++) {
      const sx = this.deckStartX + i * (SLOT_W + 4);
      this.deckSlots.push({ sx, objects: [] });
    }
    this._redrawDeckBar();
  }

  _redrawDeckBar() {
    for (const slot of this.deckSlots) {
      slot.objects.forEach(o => o.destroy());
      slot.objects = [];
    }

    for (let i = 0; i < DECK_SIZE; i++) {
      const { sx }  = this.deckSlots[i];
      const sy      = this.deckBarY;
      const charId  = this.selectedDeck[i];
      const objs    = [];

      const bg = this.add.graphics().setDepth(10);
      objs.push(bg);

      if (charId) {
        const char = CHARACTERS[charId];
        const rc   = RARITY_COLORS[char.rarity];
        bg.lineStyle(2, rc, 0.9);
        bg.fillStyle(0x0a0a1e);
        bg.fillRect(sx - SLOT_W / 2, sy - SLOT_H / 2, SLOT_W, SLOT_H);
        bg.strokeRect(sx - SLOT_W / 2, sy - SLOT_H / 2, SLOT_W, SLOT_H);
        bg.fillStyle(rc, 0.08);
        bg.fillRect(sx - SLOT_W / 2, sy - SLOT_H / 2, SLOT_W, SLOT_H);

        if (this.textures.exists(charId)) {
          const img = this.add.image(sx, sy - 4, charId).setDisplaySize(SLOT_W - 6, SLOT_H - 10).setDepth(11);
          objs.push(img);
        } else {
          const mg = this.add.graphics().setDepth(11);
          mg.x = sx; mg.y = sy - 4;
          const fn = DRAW_FUNCS[charId];
          if (fn) fn(mg);
          mg.setScale(0.34);
          objs.push(mg);
        }

        const nl = this.add.text(sx, sy + SLOT_H / 2 - 3, char.name.split(' ')[0], {
          fontSize: '6px', fill: '#AAAACC', fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(11);
        objs.push(nl);
      } else {
        bg.lineStyle(1, 0x222244, 0.6);
        bg.fillStyle(0x080814, 0.6);
        bg.fillRect(sx - SLOT_W / 2, sy - SLOT_H / 2, SLOT_W, SLOT_H);
        bg.strokeRect(sx - SLOT_W / 2, sy - SLOT_H / 2, SLOT_W, SLOT_H);
        const nl = this.add.text(sx, sy, String(i + 1), {
          fontSize: '13px', fill: '#1a1a33', fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(11);
        objs.push(nl);
      }

      this.deckSlots[i].objects = objs;
    }
  }

  // ── Info panel ─────────────────────────────────────────────────────────────
  _buildInfoPanel() {
    const { W, H } = this;
    this.infoPanel = this.add.container(W / 2, H / 2 - 40).setVisible(false).setDepth(50);

    const bg = this.add.rectangle(0, 0, 320, 238, 0x08081e, 0.97).setStrokeStyle(2, 0xFFD700);
    this.infoPanel.add(bg);

    this.infoName  = this.add.text(0, -98, '', { fontSize: '18px', fill: '#FFD700', fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5);
    this.infoRar   = this.add.text(0, -74, '', { fontSize: '11px', fill: '#8899CC', fontFamily: 'Arial' }).setOrigin(0.5);
    this.infoStats = this.add.text(0, -32, '', { fontSize: '12px', fill: '#FFFFFF', fontFamily: 'Arial', align: 'center' }).setOrigin(0.5);
    this.infoDesc  = this.add.text(0, 26,  '', { fontSize: '11px', fill: '#BBBBDD', fontFamily: 'Arial', wordWrap: { width: 290 }, align: 'center' }).setOrigin(0.5);
    this.infoSpec  = this.add.text(0, 80,  '', { fontSize: '11px', fill: '#A29BFE', fontFamily: 'Arial', wordWrap: { width: 290 }, align: 'center' }).setOrigin(0.5);

    const closeBtn = this.add.text(140, -108, '✕', {
      fontSize: '16px', fill: '#666688', fontFamily: 'Arial'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.infoPanel.setVisible(false));

    this.infoPanel.add([this.infoName, this.infoRar, this.infoStats, this.infoDesc, this.infoSpec, closeBtn]);
  }

  _showInfo(charId) {
    const char  = CHARACTERS[charId];
    const cd    = this.charData[charId] || { level: 1, xp: 0 };
    const rc    = RARITY_COLORS[char.rarity];
    const { xpInLevel, xpNeeded } = xpProgress(cd.level || 1, cd.xp || 0);

    this.infoName .setText(char.name).setStyle({ fill: `#${rc.toString(16).padStart(6, '0')}` });
    this.infoRar  .setText(`${char.rarity.toUpperCase()}  •  ${char.type === 'air' ? '🪂 Air' : '🦶 Ground'}  •  Lv ${cd.level || 1}/9`);
    this.infoStats.setText(`❤  HP ${char.hp}   ⚔  DMG ${char.damage}   ⚡ ${char.elixirCost}\nXP ${xpInLevel} / ${xpNeeded || '—'}`);
    this.infoDesc .setText(char.description || '');
    this.infoSpec .setText(`✨ ${char.specialDesc}`);
    this.infoPanel.setVisible(true);
  }

  // ── Selection ──────────────────────────────────────────────────────────────
  _toggleCard(charId) {
    audioSystem.playClick();
    const idx = this.selectedDeck.indexOf(charId);
    if (idx !== -1) {
      this.selectedDeck.splice(idx, 1);
    } else {
      if (this.selectedDeck.length >= DECK_SIZE) { this._flashMsg('Deck full! (max 7)'); return; }
      this.selectedDeck.push(charId);
    }
    this._refreshUI();
  }

  _refreshUI() {
    for (const [charId, card] of Object.entries(this.cards)) {
      const isSel = this.selectedDeck.includes(charId);
      this._drawCardBorder(card.border, card.cx, card.cy, card.CW, card.CH, card.rc, isSel);
      card.sel.setText(isSel ? '✓' : '');
    }
    this._redrawDeckBar();

    const n    = this.selectedDeck.length;
    const done = n === DECK_SIZE;
    this.counterText.setText(`${n} / ${DECK_SIZE} selected`);
    this.confirmBtn.setText(
      this.deckEditOnly ? '[ SAVE DECK ]'
      : done            ? '[ ENTER BATTLE ]'
      :                   `[ SELECT ${DECK_SIZE - n} MORE ]`
    );
    this.confirmBtn.setStyle({ fill: done || this.deckEditOnly ? '#FFD700' : '#444466' });
  }

  _flashMsg(msg) {
    const { W, H } = this;
    const t = this.add.text(W / 2, H - 108, msg, {
      fontSize: '13px', fill: '#FF6B6B', fontFamily: 'Arial'
    }).setOrigin(0.5).setDepth(99);
    this.tweens.add({ targets: t, alpha: 0, y: t.y - 24, duration: 1000, onComplete: () => t.destroy() });
  }

  _confirm() {
    if (!this.deckEditOnly && this.selectedDeck.length !== DECK_SIZE) {
      this._flashMsg(`Need ${DECK_SIZE} characters!`); return;
    }
    this.registry.set('deck', [...this.selectedDeck]);
    audioSystem.playClick();

    if (this.deckEditOnly) { this.scene.start('MainMenu'); return; }

    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Lobby', { mode: this.battleMode, deck: this.selectedDeck });
    });
  }
}
