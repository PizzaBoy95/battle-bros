import Phaser from 'phaser';
import { CHARACTERS, CHARACTER_IDS, RARITY_COLORS, MYSTERY_SLOTS } from '../characters/CharacterRegistry.js';
import { DRAW_FUNCS } from '../characters/CharacterGraphics.js';
import { xpProgress } from '../systems/LevelSystem.js';
import { audioSystem } from '../systems/AudioSystem.js';

const DECK_SIZE = 7;
const COLS      = 4;
const CARD_W    = 104;   // larger cards (was 90)
const CARD_H    = 122;   // larger cards (was 106)
const CARD_PAD  = 8;
const SLOT_W    = 48;
const SLOT_H    = 46;
const GRID_TOP  = 70;    // viewport top (just below header)

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

  // ── Card Grid (scrollable, masked viewport) ─────────────────────────────────
  _buildGrid() {
    const { W, H } = this;
    const gridW  = COLS * (CARD_W + CARD_PAD) - CARD_PAD;
    const startX = (W - gridW) / 2 + CARD_W / 2;
    const startY = GRID_TOP + CARD_H / 2 + 6;

    // Scrollable container holds all card objects
    this.gridContainer = this.add.container(0, 0).setDepth(1);
    this.scrollY = 0;

    const ORDER = { legendary: 0, epic: 1, rare: 2, common: 3 };
    const sorted = [...CHARACTER_IDS].sort((a, b) =>
      ORDER[CHARACTERS[a].rarity] - ORDER[CHARACTERS[b].rarity]
    );

    this.cards = {};
    let lastBottom = startY;

    sorted.forEach((charId, idx) => {
      const col = idx % COLS;
      const row = Math.floor(idx / COLS);
      const cx  = startX + col * (CARD_W + CARD_PAD);
      const cy  = startY + row * (CARD_H + CARD_PAD);
      const parts = this._makeCard(charId, cx, cy);
      this.gridContainer.add(parts);
      lastBottom = Math.max(lastBottom, cy + CARD_H / 2);
    });

    const offset = sorted.length;
    for (let i = 0; i < MYSTERY_SLOTS; i++) {
      const idx = offset + i;
      const cx  = startX + (idx % COLS) * (CARD_W + CARD_PAD);
      const cy  = startY + Math.floor(idx / COLS) * (CARD_H + CARD_PAD);
      const parts = this._makeMysteryCard(cx, cy);
      this.gridContainer.add(parts);
      lastBottom = Math.max(lastBottom, cy + CARD_H / 2);
    }

    // Viewport mask between header and deck bar
    this.gridBottom = H - 64 - SLOT_H / 2 - 12;   // just above deck bar strip
    const maskShape = this.make.graphics({ x: 0, y: 0, add: false });
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(0, GRID_TOP, W, this.gridBottom - GRID_TOP);
    this.gridContainer.setMask(maskShape.createGeometryMask());

    // Scroll range
    this.maxScroll = Math.max(0, (lastBottom + 8) - this.gridBottom);

    this._setupScroll();
  }

  // ── Drag / wheel scrolling + tap-to-select hit testing ──────────────────────
  _setupScroll() {
    this._dragActive = false;
    this._dragMoved  = 0;
    this._lastPtrY   = 0;

    // Scrollbar track + thumb (only meaningful if content overflows)
    this.scrollbar = this.add.graphics().setDepth(8);
    this._drawScrollbar();

    // "scroll for more" hint fade at viewport bottom
    if (this.maxScroll > 0) {
      const hint = this.add.text(this.W / 2, this.gridBottom - 10, '▾ scroll for more ▾', {
        fontSize: '9px', fill: '#5566AA', fontFamily: 'Arial', fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(8);
      this.tweens.add({ targets: hint, alpha: 0.25, duration: 800, yoyo: true, repeat: -1 });
      this._scrollHint = hint;
    }

    this.input.on('pointerdown', (p) => {
      if (this.infoPanel && this.infoPanel.visible) return; // modal open
      if (p.y < GRID_TOP || p.y > this.gridBottom) return;  // outside viewport
      this._dragActive = true;
      this._dragMoved  = 0;
      this._lastPtrY   = p.y;
    });

    this.input.on('pointermove', (p) => {
      if (!this._dragActive || !p.isDown) return;
      const dy = p.y - this._lastPtrY;
      this._lastPtrY = p.y;
      this._dragMoved += Math.abs(dy);
      this._scrollBy(dy);
    });

    this.input.on('pointerup', (p) => {
      if (!this._dragActive) return;
      this._dragActive = false;
      if (this._dragMoved < 10 && p.y >= GRID_TOP && p.y <= this.gridBottom) {
        this._tapAt(p.x, p.y);   // it was a tap, not a scroll
      }
    });

    // Mouse wheel
    this.input.on('wheel', (_p, _o, _dx, dy) => this._scrollBy(-dy * 0.5));
  }

  _scrollBy(dy) {
    this.scrollY = Phaser.Math.Clamp(this.scrollY + dy, -this.maxScroll, 0);
    this.gridContainer.y = this.scrollY;
    this._drawScrollbar();
    if (this._scrollHint && this.scrollY < -8) {
      this._scrollHint.setVisible(false);
    }
  }

  _drawScrollbar() {
    if (!this.scrollbar || this.maxScroll <= 0) return;
    const { W } = this;
    const viewH    = this.gridBottom - GRID_TOP;
    const contentH = viewH + this.maxScroll;
    const thumbH   = Math.max(28, viewH * (viewH / contentH));
    const frac     = this.maxScroll ? (-this.scrollY / this.maxScroll) : 0;
    const thumbY   = GRID_TOP + frac * (viewH - thumbH);
    const x        = W - 6;

    this.scrollbar.clear();
    this.scrollbar.fillStyle(0x000000, 0.35); this.scrollbar.fillRoundedRect(x - 1, GRID_TOP, 4, viewH, 2);
    this.scrollbar.fillStyle(0x4488CC, 0.85);  this.scrollbar.fillRoundedRect(x - 1, thumbY, 4, thumbH, 2);
  }

  _tapAt(px, py) {
    const localY = py - this.gridContainer.y;
    for (const [charId, card] of Object.entries(this.cards)) {
      if (px >= card.cx - card.CW / 2 && px <= card.cx + card.CW / 2 &&
          localY >= card.cy - card.CH / 2 && localY <= card.cy + card.CH / 2) {
        this._showInfo(charId);   // open detail modal (stats + add/remove)
        return;
      }
    }
  }

  _makeCard(charId, cx, cy) {
    const char  = CHARACTERS[charId];
    const rc    = RARITY_COLORS[char.rarity];
    const cd    = this.charData[charId] || { level: 1, xp: 0 };
    const isSel = this.selectedDeck.includes(charId);
    const CW = CARD_W - 2, CH = CARD_H - 2;
    const lx = cx - CW / 2, ly = cy - CH / 2;

    // ── Dark card background ────────────────────────────────────────────────
    const bg = this.add.rectangle(cx, cy, CW, CH, 0x07071a);

    // Rarity-tinted top gradient wash
    const grad1 = this.add.rectangle(cx, ly + CH * 0.28, CW, CH * 0.56, rc, 0.18);
    const grad2 = this.add.rectangle(cx, ly + CH * 0.10, CW, CH * 0.22, rc, 0.10);
    // Left-edge shine (lighting illusion)
    const topShine = this.add.rectangle(lx + 2, cy, 3, CH - 2, 0xFFFFFF, 0.07);

    // ── 4px rarity border ──────────────────────────────────────────────────
    const border = this.add.graphics();
    this._drawCardBorder(border, cx, cy, CW, CH, rc, isSel);

    // ── Character portrait — top 68% of card ───────────────────────────────
    const PORTRAIT_H = CH * 0.68;
    const portraitCY = ly + PORTRAIT_H / 2;
    const portraitKey = charId + '_p';
    let portrait;
    if (this.textures.exists(portraitKey)) {
      portrait = this.add.image(cx, portraitCY, portraitKey)
        .setDisplaySize(CW, PORTRAIT_H)
        .setDepth(1);
    } else {
      portrait = this.add.graphics().setDepth(1);
      portrait.x = cx; portrait.y = portraitCY;
      const fn = DRAW_FUNCS[charId];
      if (fn) fn(portrait);
      portrait.setScale(0.72);
    }

    // ── Dark name plate — bottom 30% overlay ───────────────────────────────
    const plateH = CH * 0.32;
    const plateY = cy + CH / 2 - plateH / 2;
    const plateBg = this.add.graphics().setDepth(2);
    plateBg.fillStyle(0x000000, 0.72); plateBg.fillRect(lx, cy + CH / 2 - plateH, CW, plateH);
    // Rarity strip along bottom of name plate
    plateBg.fillStyle(rc, 0.90); plateBg.fillRect(lx, cy + CH / 2 - 18, CW, 18);
    // Inner shine on rarity strip
    plateBg.fillStyle(0xFFFFFF, 0.14); plateBg.fillRect(lx + 6, cy + CH / 2 - 17, CW * 0.35, 8);

    // Rarity initial ribbon (diagonal top-right corner)
    const ribG = this.add.graphics().setDepth(3);
    const RIB = 22;
    ribG.fillStyle(rc, 0.9);
    ribG.fillTriangle(lx + CW - RIB, ly, lx + CW, ly, lx + CW, ly + RIB);
    const rarInitial = { legendary: 'L', epic: 'E', rare: 'R', common: 'C' }[char.rarity] || '?';
    const ribLbl = this.add.text(lx + CW - 7, ly + 7, rarInitial, {
      fontSize: '7px', fill: '#000', fontFamily: 'Arial Black, Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(4);

    // Rarity label inside strip
    const rarLbl = this.add.text(cx, cy + CH / 2 - 9, char.rarity.toUpperCase(), {
      fontSize: '7px', fill: '#000000', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3);

    // Character name
    const name = this.add.text(cx, cy + CH / 2 - plateH + 11, char.name, {
      fontSize: '8px', fill: '#FFFFFF', fontFamily: 'Arial', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
      wordWrap: { width: CW - 8 }
    }).setOrigin(0.5).setDepth(3);

    // ── Elixir badge (top-left, larger) ────────────────────────────────────
    const egX = lx + 14, egY = ly + 14;
    const eg = this.add.graphics().setDepth(4);
    eg.fillStyle(0x4A0088); eg.fillCircle(egX, egY, 14);
    eg.fillStyle(0x9933DD, 0.55); eg.fillCircle(egX - 1.5, egY - 2, 9);
    eg.lineStyle(2, 0xCC88FF, 0.75); eg.strokeCircle(egX, egY, 14);
    const eLbl = this.add.text(egX, egY + 1, String(char.elixirCost), {
      fontSize: '14px', fill: '#FFFFFF', fontFamily: 'Arial Black, Arial', fontStyle: 'bold',
      stroke: '#220044', strokeThickness: 3
    }).setOrigin(0.5).setDepth(5);

    // ── Level badge (top-right) ─────────────────────────────────────────────
    const lvX = lx + CW - 14, lvY = ly + 14;
    const lvG = this.add.graphics().setDepth(4);
    lvG.fillStyle(0x05050f); lvG.fillCircle(lvX, lvY, 13);
    lvG.lineStyle(2.5, rc, 0.95); lvG.strokeCircle(lvX, lvY, 13);
    const lvLbl = this.add.text(lvX, lvY + 1, `${cd.level || 1}`, {
      fontSize: '12px', fontStyle: 'bold', fontFamily: 'Arial Black, Arial',
      fill: `#${rc.toString(16).padStart(6, '0')}`
    }).setOrigin(0.5).setDepth(5);

    // ── Selected checkmark overlay ──────────────────────────────────────────
    const sel = this.add.text(cx, portraitCY, isSel ? '✓' : '', {
      fontSize: '28px', fill: '#FFD700', fontFamily: 'Arial', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(5);
    // Selected gold overlay tint
    const selOverlay = this.add.rectangle(cx, cy, CW, CH, 0xFFD700, isSel ? 0.08 : 0).setDepth(2);

    const banShine = topShine; // alias so destroy loop still works

    this.cards[charId] = {
      cx, cy, CW, CH, rc,
      bg, grad1, grad2, border, portrait, plateBg, banShine, rarLbl, name,
      ribG, ribLbl, eg, eLbl, lvG, lvLbl, sel, selOverlay, charId
    };

    // Return every display object in render order so the grid container can hold them
    return [bg, grad1, grad2, topShine, border, portrait, plateBg,
            ribG, ribLbl, rarLbl, name, eg, eLbl, lvG, lvLbl, sel, selOverlay];
  }

  _drawCardBorder(g, cx, cy, CW, CH, rc, isSel) {
    g.clear();
    const lx = cx - CW / 2, ly = cy - CH / 2;
    if (isSel) {
      // Gold glow outer halo
      g.lineStyle(10, 0xFFD700, 0.15); g.strokeRect(lx - 4, ly - 4, CW + 8, CH + 8);
      g.lineStyle(6, 0xFFD700, 0.30);  g.strokeRect(lx - 2, ly - 2, CW + 4, CH + 4);
      // Main gold border
      g.lineStyle(4, 0xFFD700, 1.0);   g.strokeRect(lx, ly, CW, CH);
      // Inner 1px dark shadow line
      g.lineStyle(1, 0x000000, 0.5);   g.strokeRect(lx + 2, ly + 2, CW - 4, CH - 4);
    } else {
      // 4px rarity border
      g.lineStyle(4, rc, 0.85);        g.strokeRect(lx, ly, CW, CH);
      // Inner 1px shadow
      g.lineStyle(1, 0x000000, 0.45);  g.strokeRect(lx + 2, ly + 2, CW - 4, CH - 4);
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
    const r1 = this.add.rectangle(cx, cy, CW, CH, 0x07070f);
    const r2 = this.add.rectangle(cx, ly + CH * 0.2, CW, CH * 0.4, 0x3344AA, 0.06);

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

    const t1 = this.add.text(cx, cy + 26, '???',    { fontSize: '14px', fill: '#1e1e44', fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5);
    const t2 = this.add.text(cx, cy + 40, 'LOCKED', { fontSize: '7px',  fill: '#14142a', fontFamily: 'Arial' }).setOrigin(0.5);

    return [r1, r2, g, dot, t1, t2];
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

        const pKey = charId + '_p';
        if (this.textures.exists(pKey)) {
          const img = this.add.image(sx, sy - 4, pKey).setDisplaySize(SLOT_W - 4, SLOT_H - 8).setDepth(11);
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

  // ── Character detail modal ──────────────────────────────────────────────────
  _buildInfoPanel() {
    const { W, H } = this;
    const PW = 348, PH = 452;

    // Dim backdrop (tap outside to close)
    this.infoBackdrop = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.65)
      .setDepth(49).setVisible(false).setInteractive();
    this.infoBackdrop.on('pointerdown', () => this._closeInfo());

    this.infoPanel = this.add.container(W / 2, H / 2).setVisible(false).setDepth(50);

    // Panel background (border tint set per-character in _showInfo)
    this.infoBg = this.add.graphics();
    this.infoPanel.add(this.infoBg);

    // Portrait holder (recreated per character)
    this._infoPortrait = null;

    // Header texts
    this.infoName = this.add.text(-PW / 2 + 110, -PH / 2 + 22, '', {
      fontSize: '20px', fill: '#FFD700', fontFamily: 'Arial Black, Arial', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 3
    }).setOrigin(0, 0);
    this.infoRar = this.add.text(-PW / 2 + 110, -PH / 2 + 50, '', {
      fontSize: '12px', fill: '#8899CC', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0, 0);
    this.infoType = this.add.text(-PW / 2 + 110, -PH / 2 + 70, '', {
      fontSize: '11px', fill: '#AAB4DD', fontFamily: 'Arial'
    }).setOrigin(0, 0);

    // Stat bars (redrawn per character)
    this.infoBars  = this.add.graphics();
    this.infoStatTxt = this.add.text(0, 0, '', { fontSize: '1px' }).setVisible(false); // placeholder
    this._infoStatLabels = [];

    // Special / description
    this.infoSpec = this.add.text(0, PH / 2 - 120, '', {
      fontSize: '11px', fill: '#C9B8FF', fontFamily: 'Arial', fontStyle: 'bold',
      wordWrap: { width: PW - 36 }, align: 'center'
    }).setOrigin(0.5, 0);

    // Toggle (add/remove) button
    this.infoBtnBg = this.add.graphics();
    this.infoBtnTxt = this.add.text(0, PH / 2 - 40, '', {
      fontSize: '16px', fill: '#FFFFFF', fontFamily: 'Arial Black, Arial', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.infoBtnTxt.on('pointerdown', () => {
      if (!this._infoCharId) return;
      this._toggleCard(this._infoCharId);
      this._showInfo(this._infoCharId); // refresh button state
    });

    // Close X
    const closeBtn = this.add.text(PW / 2 - 16, -PH / 2 + 14, '✕', {
      fontSize: '18px', fill: '#8888AA', fontFamily: 'Arial Black, Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this._closeInfo());

    this.infoPanel.add([this.infoName, this.infoRar, this.infoType, this.infoBars,
                        this.infoSpec, this.infoBtnBg, this.infoBtnTxt, closeBtn]);
    this._PW = PW; this._PH = PH;
  }

  _closeInfo() {
    this.infoPanel.setVisible(false);
    this.infoBackdrop.setVisible(false);
  }

  _showInfo(charId) {
    const char = CHARACTERS[charId];
    if (!char) return;
    this._infoCharId = charId;
    const cd  = this.charData[charId] || { level: 1, xp: 0 };
    const rc  = RARITY_COLORS[char.rarity];
    const rcH = `#${rc.toString(16).padStart(6, '0')}`;
    const PW = this._PW, PH = this._PH;

    // ── Panel background + rarity border ──────────────────────────────────────
    this.infoBg.clear();
    this.infoBg.fillStyle(0x0a0a1e, 0.98);
    this.infoBg.fillRoundedRect(-PW / 2, -PH / 2, PW, PH, 16);
    this.infoBg.fillStyle(rc, 0.10);
    this.infoBg.fillRoundedRect(-PW / 2, -PH / 2, PW, 96, { tl: 16, tr: 16, bl: 0, br: 0 });
    this.infoBg.lineStyle(3, rc, 0.95);
    this.infoBg.strokeRoundedRect(-PW / 2, -PH / 2, PW, PH, 16);
    // Portrait frame
    this.infoBg.fillStyle(0x05050f, 1);
    this.infoBg.fillRoundedRect(-PW / 2 + 14, -PH / 2 + 14, 84, 84, 10);
    this.infoBg.lineStyle(2, rc, 0.8);
    this.infoBg.strokeRoundedRect(-PW / 2 + 14, -PH / 2 + 14, 84, 84, 10);

    // ── Portrait ──────────────────────────────────────────────────────────────
    if (this._infoPortrait) { this._infoPortrait.destroy(); this._infoPortrait = null; }
    const px = -PW / 2 + 56, py = -PH / 2 + 56;
    const pKey = charId + '_p';
    if (this.textures.exists(pKey)) {
      this._infoPortrait = this.add.image(px, py, pKey).setDisplaySize(78, 78);
    } else {
      this._infoPortrait = this.add.graphics();
      this._infoPortrait.x = px; this._infoPortrait.y = py + 18;
      const fn = DRAW_FUNCS[charId];
      if (fn) fn(this._infoPortrait);
      this._infoPortrait.setScale(0.6);
    }
    this.infoPanel.add(this._infoPortrait);
    this.infoPanel.bringToTop(this.infoName);

    // ── Header text ───────────────────────────────────────────────────────────
    this.infoName.setText(char.name).setColor(rcH);
    this.infoRar.setText(`${char.rarity.toUpperCase()}  •  Lv ${cd.level || 1}/9`).setColor(rcH);
    this.infoType.setText(char.type === 'air' ? '🪂 Air unit' : '🦶 Ground unit');

    // ── Stat bars ─────────────────────────────────────────────────────────────
    // [label, value, displayText, maxForBar, barColor]
    const aps = char.attackSpeed || 1;
    const rows = [
      ['Health',      char.hp,          String(char.hp),                3000, 0x2ECC71],
      ['Damage',      char.damage,      String(char.damage),            260,  0xE74C3C],
      ['Atk Speed',   aps,              `${aps.toFixed(2)}/s (${(1 / aps).toFixed(1)}s)`, 1.3, 0xF39C12],
      ['Move Speed',  char.speed,       this._speedWord(char.speed),    95,   0x3498DB],
      ['Range',       char.range,       `${char.range}`,                300,  0x9B59B6],
      ['Elixir',      char.elixirCost,  `${char.elixirCost}`,           8,    0xCC55FF],
    ];

    this.infoBars.clear();
    for (const t of this._infoStatLabels) t.destroy();
    this._infoStatLabels = [];

    const barX = -PW / 2 + 22, barW = PW - 130;
    let yy = -PH / 2 + 116;
    const rowH = 30;
    for (const [label, val, disp, max, col] of rows) {
      // Label
      const lblT = this.add.text(barX, yy - 2, label, {
        fontSize: '11px', fill: '#9AA6D0', fontFamily: 'Arial', fontStyle: 'bold'
      }).setOrigin(0, 0);
      // Value text (right side)
      const valT = this.add.text(PW / 2 - 16, yy - 2, disp, {
        fontSize: '11px', fill: '#FFFFFF', fontFamily: 'Arial Black, Arial', fontStyle: 'bold'
      }).setOrigin(1, 0);
      this.infoPanel.add([lblT, valT]);
      this._infoStatLabels.push(lblT, valT);

      // Bar track + fill
      const by = yy + 14;
      this.infoBars.fillStyle(0x1a1a30, 1);
      this.infoBars.fillRoundedRect(barX, by, barW, 7, 3);
      const frac = Phaser.Math.Clamp(val / max, 0.04, 1);
      this.infoBars.fillStyle(col, 0.95);
      this.infoBars.fillRoundedRect(barX, by, barW * frac, 7, 3);
      yy += rowH;
    }

    // ── Special ───────────────────────────────────────────────────────────────
    this.infoSpec.setText(`✨ ${char.name.split(' ')[0]}'s Special\n${char.specialDesc || ''}`);

    // ── Add / Remove button ───────────────────────────────────────────────────
    const inDeck = this.selectedDeck.includes(charId);
    const bw = 260, bh = 42, bx = -bw / 2, byb = PH / 2 - 40 - bh / 2;
    const btnCol = inDeck ? 0x992222 : 0x227744;
    const btnBdr = inDeck ? 0xFF5555 : 0x44DD88;
    this.infoBtnBg.clear();
    this.infoBtnBg.fillStyle(btnCol, 1);
    this.infoBtnBg.fillRoundedRect(bx, byb, bw, bh, 10);
    this.infoBtnBg.fillStyle(0xFFFFFF, 0.08);
    this.infoBtnBg.fillRoundedRect(bx + 2, byb + 2, bw - 4, bh * 0.42, 8);
    this.infoBtnBg.lineStyle(2, btnBdr, 0.9);
    this.infoBtnBg.strokeRoundedRect(bx, byb, bw, bh, 10);
    this.infoBtnTxt.setText(inDeck ? '✕  REMOVE FROM DECK' : '✓  ADD TO DECK');

    this.infoBackdrop.setVisible(true);
    this.infoPanel.setVisible(true);
  }

  _speedWord(s) {
    if (s >= 80) return `${s} (Fast)`;
    if (s >= 55) return `${s} (Medium)`;
    if (s >= 40) return `${s} (Slow)`;
    return `${s} (V.Slow)`;
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
      if (card.selOverlay) card.selOverlay.setAlpha(isSel ? 0.08 : 0);
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
