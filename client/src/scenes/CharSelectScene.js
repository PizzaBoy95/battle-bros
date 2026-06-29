import Phaser from 'phaser';
import { CHARACTERS, CHARACTER_IDS, RARITY_COLORS, MYSTERY_SLOTS } from '../characters/CharacterRegistry.js';
import { DRAW_FUNCS } from '../characters/CharacterGraphics.js';
import { xpProgress } from '../systems/LevelSystem.js';
import { audioSystem } from '../systems/AudioSystem.js';

const DECK_SIZE   = 7;
const COLS        = 4;
const CARD_W      = 90;
const CARD_H      = 106;
const CARD_PAD    = 8;
const SLOT_W      = 48;
const SLOT_H      = 46;

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

    // Fetch user's character progress
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
    this.add.rectangle(0, 0, W, H, 0x060614).setOrigin(0);
    const sg = this.add.graphics();
    for (let i = 0; i < 50; i++) {
      sg.fillStyle(0xFFFFFF, 0.08 + Math.random() * 0.25);
      sg.fillRect(Math.random() * W, Math.random() * H, 1, 1);
    }

    // ── Header ─────────────────────────────────────────────────────────────
    this.add.text(W / 2, 22, 'SELECT YOUR BATTLE DECK', {
      fontSize: '19px', fill: '#FFD700',
      fontFamily: 'Arial Black, Arial', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.counterText = this.add.text(W / 2, 46, `${this.selectedDeck.length} / ${DECK_SIZE} selected`, {
      fontSize: '13px', fill: '#AAAACC', fontFamily: 'Arial'
    }).setOrigin(0.5);

    // Back
    this.add.text(26, 22, '← BACK', {
      fontSize: '13px', fill: '#666688', fontFamily: 'Arial'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('MainMenu'));

    // ── Card grid ──────────────────────────────────────────────────────────
    this.gridContainer = this.add.container(0, 0);
    this._buildGrid();

    // ── Deck slots ─────────────────────────────────────────────────────────
    this._buildDeckBar();

    // ── Info panel (hidden initially) ──────────────────────────────────────
    this._buildInfoPanel();

    // ── Confirm button ─────────────────────────────────────────────────────
    this.confirmBtn = this.add.text(W / 2, H - 22, '', {
      fontSize: '17px', fill: '#FFD700',
      fontFamily: 'Arial Black, Arial', fontStyle: 'bold',
      backgroundColor: '#1a1a2e',
      padding: { x: 18, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(12);

    this.confirmBtn.on('pointerdown', () => this._confirm());
    this.confirmBtn.on('pointerover', () => this.confirmBtn.setStyle({ fill: '#FFFFFF' }));
    this.confirmBtn.on('pointerout',  () => this.confirmBtn.setStyle({ fill: '#FFD700' }));

    this._refreshUI();
    this.cameras.main.fadeIn(250);
  }

  // ── Grid ───────────────────────────────────────────────────────────────────
  _buildGrid() {
    const { width: W } = this.scale;
    const totalCols  = COLS;
    const gridW      = totalCols * (CARD_W + CARD_PAD) - CARD_PAD;
    const startX     = (W - gridW) / 2 + CARD_W / 2;
    const startY     = 72;

    // Sort by rarity
    const ORDER = { legendary: 0, epic: 1, rare: 2, common: 3 };
    const sorted = [...CHARACTER_IDS].sort((a, b) =>
      ORDER[CHARACTERS[a].rarity] - ORDER[CHARACTERS[b].rarity]
    );

    this.cards = {}; // charId → { cx, cy, bg, border, charG, sel }

    sorted.forEach((charId, idx) => {
      const col = idx % COLS;
      const row = Math.floor(idx / COLS);
      const cx  = startX + col * (CARD_W + CARD_PAD);
      const cy  = startY + row * (CARD_H + CARD_PAD);
      this._makeCard(charId, cx, cy);
    });

    // Mystery locked slots
    const offset = sorted.length;
    for (let i = 0; i < MYSTERY_SLOTS; i++) {
      const idx = offset + i;
      const col = idx % COLS;
      const row = Math.floor(idx / COLS);
      const cx  = startX + col * (CARD_W + CARD_PAD);
      const cy  = startY + row * (CARD_H + CARD_PAD);
      this._makeMysteryCard(cx, cy);
    }
  }

  _makeCard(charId, cx, cy) {
    const char  = CHARACTERS[charId];
    const rc    = RARITY_COLORS[char.rarity];
    const cd    = this.charData[charId] || { level: 1, xp: 0 };
    const isSel = this.selectedDeck.includes(charId);

    // Background fill
    const bg = this.add.rectangle(cx, cy, CARD_W - 2, CARD_H - 2, 0x12122a).setOrigin(0.5);

    // Rarity border (separate graphics for easy redraw)
    const border = this.add.graphics();
    border.lineStyle(2, rc, isSel ? 1 : 0.35);
    border.strokeRect(cx - CARD_W / 2 + 1, cy - CARD_H / 2 + 1, CARD_W - 2, CARD_H - 2);
    if (isSel) {
      border.fillStyle(rc, 0.18);
      border.fillRect(cx - CARD_W / 2 + 1, cy - CARD_H / 2 + 1, CARD_W - 2, CARD_H - 2);
    }

    // Character art
    const charG = this.add.graphics();
    charG.x = cx; charG.y = cy - 8;
    const fn = DRAW_FUNCS[charId];
    if (fn) fn(charG);
    charG.setScale(0.62);

    // Name
    const name = this.add.text(cx, cy + 44, char.name, {
      fontSize: '9px', fill: '#CCCCCC', fontFamily: 'Arial', fontStyle: 'bold',
      wordWrap: { width: CARD_W - 6 }
    }).setOrigin(0.5);

    // Elixir cost badge
    const eg = this.add.graphics();
    eg.fillStyle(0x8E44AD); eg.fillCircle(cx - 34, cy - 43, 10);
    const elbl = this.add.text(cx - 34, cy - 43, String(char.elixirCost), {
      fontSize: '11px', fill: '#FFFFFF', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5);

    // Level badge
    const lg = this.add.graphics();
    lg.fillStyle(rc); lg.fillCircle(cx + 34, cy - 43, 10);
    const llbl = this.add.text(cx + 34, cy - 43, String(cd.level || 1), {
      fontSize: '11px', fill: '#000000', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5);

    // Selected checkmark
    const sel = this.add.text(cx, cy - 43, isSel ? '✓' : '', {
      fontSize: '18px', fill: '#FFD700', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(2);

    // Interaction zone
    const zone = this.add.zone(cx, cy, CARD_W, CARD_H)
      .setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => this._toggleCard(charId));
    zone.on('pointerover', () => { charG.setScale(0.68); this._showInfo(charId); });
    zone.on('pointerout',  () => charG.setScale(0.62));

    this.cards[charId] = { cx, cy, bg, border, charG, name, eg, elbl, lg, llbl, sel, zone, charId };
  }

  _makeMysteryCard(cx, cy) {
    const g = this.add.graphics();
    g.fillStyle(0x0d0d1a);
    g.fillRect(cx - CARD_W / 2 + 1, cy - CARD_H / 2 + 1, CARD_W - 2, CARD_H - 2);
    g.lineStyle(1, 0x222244);
    g.strokeRect(cx - CARD_W / 2 + 1, cy - CARD_H / 2 + 1, CARD_W - 2, CARD_H - 2);
    // Padlock
    g.fillStyle(0x222244); g.fillRect(cx - 10, cy - 8, 20, 16);
    g.lineStyle(3, 0x222244);
    g.beginPath(); g.arc(cx, cy - 8, 10, Math.PI, 0, false); g.strokePath();
    this.add.text(cx, cy + 30, '???',    { fontSize: '14px', fill: '#222244', fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(cx, cy + 44, 'LOCKED', { fontSize: '8px',  fill: '#1a1a33', fontFamily: 'Arial' }).setOrigin(0.5);
  }

  // ── Deck bar ───────────────────────────────────────────────────────────────
  _buildDeckBar() {
    const { width: W, height: H } = this.scale;
    this.deckBarY    = H - 68;
    const totalW     = DECK_SIZE * (SLOT_W + 4) - 4;
    this.deckStartX  = (W - totalW) / 2 + SLOT_W / 2;

    // Background strip
    this.add.rectangle(W / 2, this.deckBarY, W, SLOT_H + 24, 0x0a0a1e, 0.9)
      .setDepth(9);

    this.deckSlots    = []; // per-slot container for easy cleanup
    for (let i = 0; i < DECK_SIZE; i++) {
      const sx = this.deckStartX + i * (SLOT_W + 4);
      this.deckSlots.push({ sx, objects: [] });
    }
    this._redrawDeckBar();
  }

  _redrawDeckBar() {
    // Destroy previous slot objects
    for (const slot of this.deckSlots) {
      slot.objects.forEach(o => o.destroy());
      slot.objects = [];
    }

    for (let i = 0; i < DECK_SIZE; i++) {
      const { sx } = this.deckSlots[i];
      const sy     = this.deckBarY;
      const charId = this.selectedDeck[i];
      const objs   = [];

      const bg = this.add.graphics().setDepth(10);
      objs.push(bg);

      if (charId) {
        const char = CHARACTERS[charId];
        const rc   = RARITY_COLORS[char.rarity];
        bg.lineStyle(2, rc, 0.9);
        bg.fillStyle(0x12122a);
        bg.fillRect(sx - SLOT_W / 2, sy - SLOT_H / 2, SLOT_W, SLOT_H);
        bg.strokeRect(sx - SLOT_W / 2, sy - SLOT_H / 2, SLOT_W, SLOT_H);

        const mg = this.add.graphics().setDepth(11);
        mg.x = sx; mg.y = sy - 4;
        const fn = DRAW_FUNCS[charId];
        if (fn) fn(mg);
        mg.setScale(0.34);
        objs.push(mg);

        const nl = this.add.text(sx, sy + SLOT_H / 2 - 2, char.name.split(' ')[0], {
          fontSize: '7px', fill: '#AAAACC', fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(11);
        objs.push(nl);
      } else {
        bg.lineStyle(1, 0x333355, 0.5);
        bg.fillStyle(0x111122, 0.5);
        bg.fillRect(sx - SLOT_W / 2, sy - SLOT_H / 2, SLOT_W, SLOT_H);
        bg.strokeRect(sx - SLOT_W / 2, sy - SLOT_H / 2, SLOT_W, SLOT_H);
        const nl = this.add.text(sx, sy, String(i + 1), {
          fontSize: '12px', fill: '#333355', fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(11);
        objs.push(nl);
      }

      this.deckSlots[i].objects = objs;
    }
  }

  // ── Info panel ─────────────────────────────────────────────────────────────
  _buildInfoPanel() {
    const { width: W, height: H } = this.scale;
    this.infoPanel = this.add.container(W / 2, H / 2 - 40).setVisible(false).setDepth(50);

    const bg = this.add.rectangle(0, 0, 320, 230, 0x0d0d22, 0.97)
      .setStrokeStyle(2, 0xFFD700);
    this.infoPanel.add(bg);

    this.infoName  = this.add.text(0, -95, '', { fontSize: '18px', fill: '#FFD700', fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5);
    this.infoRar   = this.add.text(0, -72, '', { fontSize: '11px', fill: '#AAAACC', fontFamily: 'Arial' }).setOrigin(0.5);
    this.infoStats = this.add.text(0, -30, '', { fontSize: '12px', fill: '#FFFFFF', fontFamily: 'Arial', align: 'center' }).setOrigin(0.5);
    this.infoDesc  = this.add.text(0, 30,  '', { fontSize: '11px', fill: '#BBBBDD', fontFamily: 'Arial', wordWrap: { width: 290 }, align: 'center' }).setOrigin(0.5);
    this.infoSpec  = this.add.text(0, 80,  '', { fontSize: '11px', fill: '#A29BFE', fontFamily: 'Arial', wordWrap: { width: 290 }, align: 'center' }).setOrigin(0.5);

    const closeBtn = this.add.text(140, -104, '✕', {
      fontSize: '16px', fill: '#888888', fontFamily: 'Arial'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.infoPanel.setVisible(false));

    this.infoPanel.add([this.infoName, this.infoRar, this.infoStats, this.infoDesc, this.infoSpec, closeBtn]);
  }

  _showInfo(charId) {
    const char  = CHARACTERS[charId];
    const cd    = this.charData[charId] || { level: 1, xp: 0 };
    const rc    = RARITY_COLORS[char.rarity];
    const { pct, xpInLevel, xpNeeded } = xpProgress(cd.level || 1, cd.xp || 0);

    this.infoName .setText(char.name).setStyle({ fill: `#${rc.toString(16).padStart(6,'0')}` });
    this.infoRar  .setText(`${char.rarity.toUpperCase()}  •  ${char.type === 'air' ? '🪂 Air' : '🦶 Ground'}  •  Lv ${cd.level || 1}/9`);
    this.infoStats.setText(`❤  HP ${char.hp}   ⚔  DMG ${char.damage}   ⚡ Cost ${char.elixirCost}\nXP ${xpInLevel}/${xpNeeded || '—'}`);
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
      if (this.selectedDeck.length >= DECK_SIZE) {
        this._flashMsg('Deck full! (max 7)');
        return;
      }
      this.selectedDeck.push(charId);
    }
    this._refreshUI();
  }

  _refreshUI() {
    // Update each card's border and checkmark
    for (const [charId, card] of Object.entries(this.cards)) {
      const char  = CHARACTERS[charId];
      const rc    = RARITY_COLORS[char.rarity];
      const isSel = this.selectedDeck.includes(charId);

      card.border.clear();
      card.border.lineStyle(2, rc, isSel ? 1 : 0.35);
      card.border.strokeRect(card.cx - CARD_W / 2 + 1, card.cy - CARD_H / 2 + 1, CARD_W - 2, CARD_H - 2);
      if (isSel) {
        card.border.fillStyle(rc, 0.18);
        card.border.fillRect(card.cx - CARD_W / 2 + 1, card.cy - CARD_H / 2 + 1, CARD_W - 2, CARD_H - 2);
      }
      card.sel.setText(isSel ? '✓' : '');
    }

    // Redraw deck bar
    this._redrawDeckBar();

    // Counter + confirm button
    const n    = this.selectedDeck.length;
    const done = n === DECK_SIZE;
    this.counterText.setText(`${n} / ${DECK_SIZE} selected`);
    this.confirmBtn .setText(
      this.deckEditOnly ? '[ SAVE DECK ]'
      : done            ? '[ ENTER BATTLE ]'
      :                   `[ SELECT ${DECK_SIZE - n} MORE ]`
    );
    this.confirmBtn.setStyle({ fill: done || this.deckEditOnly ? '#FFD700' : '#555566' });
  }

  _flashMsg(msg) {
    const { width: W, height: H } = this.scale;
    const t = this.add.text(W / 2, H - 105, msg, {
      fontSize: '13px', fill: '#FF6B6B', fontFamily: 'Arial'
    }).setOrigin(0.5).setDepth(99);
    this.tweens.add({ targets: t, alpha: 0, y: t.y - 24, duration: 1000, onComplete: () => t.destroy() });
  }

  _confirm() {
    if (!this.deckEditOnly && this.selectedDeck.length !== DECK_SIZE) {
      this._flashMsg(`Need ${DECK_SIZE} characters!`);
      return;
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
