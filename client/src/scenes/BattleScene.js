import Phaser from 'phaser';
import { socketManager } from '../network/SocketManager.js';
import { audioSystem } from '../systems/AudioSystem.js';
import { ElixirSystem } from '../systems/ElixirSystem.js';
import { BattleTimer } from '../systems/BattleTimer.js';
import { CHARACTERS, CHARACTER_IDS, RARITY_COLORS } from '../characters/CharacterRegistry.js';
import { DRAW_FUNCS } from '../characters/CharacterGraphics.js';
import { heroTexKey, cardTexKey, heroAnim } from '../characters/heroTex.js';
import * as EmberCrossing from '../maps/EmberCrossing.js';
import * as FrostpeakArena from '../maps/FrostpeakArena.js';

const DECK_SIZE = 7;

const TOWER_POSITIONS = {
  p1: {
    king:       { x: 240, y: 760 },
    guardLeft:  { x: 100, y: 660 },
    guardRight: { x: 380, y: 660 }
  },
  p2: {
    king:       { x: 240, y: 94 },
    guardLeft:  { x: 100, y: 194 },
    guardRight: { x: 380, y: 194 }
  }
};

const TOWER_MAX = { guard: 1500, king: 3000 };

export class BattleScene extends Phaser.Scene {
  constructor() { super('Battle'); }

  init(data) {
    this.matchInfo = data?.matchInfo || this.registry.get('matchInfo');
    this.deck = data?.deck || this.registry.get('deck') || [];
    const rawToken = this.registry.get('token');
    if (rawToken) {
      try {
        const b64 = rawToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        this.myUserId = JSON.parse(atob(b64)).id;
      } catch { this.myUserId = null; }
    } else {
      this.myUserId = null;
    }

    this.mapId = this.matchInfo?.map || 'ember_crossing';
    this.myKey = null; // 'p1' or 'p2'
    this.unitGraphics = {}; // unitId → {g, hpBar, hpBg}
    this.towers = {
      p1: {
        king:       { hp: 3000, maxHp: 3000 },
        guardLeft:  { hp: 1500, maxHp: 1500 },
        guardRight: { hp: 1500, maxHp: 1500 }
      },
      p2: {
        king:       { hp: 3000, maxHp: 3000 },
        guardLeft:  { hp: 1500, maxHp: 1500 },
        guardRight: { hp: 1500, maxHp: 1500 }
      }
    };
    this.selectedCardIdx = 0;
    this.myElixir = 5;
    this.overtime = false;
    this.elixirRate = 1;
    this.currentUnits = [];
    this.gameOver = false;
  }

  create() {
    const { width: W, height: H } = this.scale;

    // Determine my player key
    if (this.matchInfo?.teams) {
      const uid = this.myUserId;
      for (const [key, ids] of Object.entries(this.matchInfo.teams)) {
        if (ids.includes(uid)) { this.myKey = key; break; }
      }
    }
    if (!this.myKey) this.myKey = 'p1';

    // Draw map
    this._drawMap();

    // Draw towers
    this._buildTowers();

    // HUD
    this._buildHUD();

    // Unit layer
    this.unitLayer = this.add.container(0, 0).setDepth(5);

    // Particle effects layer
    this.fxLayer = this.add.container(0, 0).setDepth(6);

    // Deploy zone indicator
    this._buildDeployZone();

    // Clash-style hand: 4 cards in hand, the rest cycle through a queue
    this.hand  = this.deck.slice(0, 4);
    this.queue = this.deck.slice(4);
    this._buildHandCards();

    // 3…2…1…FIGHT! intro
    this._battleCountdown();

    // Drag-to-deploy global listeners
    this._dragging = false;
    this._dragCardIdx = -1;
    this._ghostG = null;
    this.input.on('pointermove', (ptr) => this._onPointerMove(ptr));
    this.input.on('pointerup',   (ptr) => this._onPointerUp(ptr));
    // Tap-on-map fallback (fires only when NOT on a card)
    this.input.on('pointerdown', (ptr) => this._onTap(ptr));

    // Socket events
    socketManager.on('game_state', (data) => this._onGameState(data));
    socketManager.on('game_event', (data) => this._onGameEvent(data));
    socketManager.on('game_over', (data) => this._onGameOver(data));
    socketManager.on('overtime_start', () => this._onOvertime());
    socketManager.on('sudden_death_start', () => this._onSuddenDeath());

    // Camera fade in
    this.cameras.main.fadeIn(400);

    // Start music
    const track = this.mapId === 'ember_crossing' ? 'ember_rush' : 'frost_crown';
    audioSystem.playTrack(track);
  }

  _drawMap() {
    if (this.mapId === 'ember_crossing') {
      EmberCrossing.drawMap(this);
    } else {
      FrostpeakArena.drawMap(this);
      FrostpeakArena.drawSnowAnimation(this);
    }
  }

  _buildTowers() {
    this.towerObjects = {};
    const useSprites = this.textures.exists('castle_blue') && this.textures.exists('tower_blue');

    for (const playerKey of ['p1', 'p2']) {
      this.towerObjects[playerKey] = {};
      for (const towerKey of ['king', 'guardLeft', 'guardRight']) {
        const pos = TOWER_POSITIONS[playerKey][towerKey];
        const isKing = towerKey === 'king';
        const isEnemy = playerKey !== this.myKey;
        const tw = isKing ? 58 : 44;

        // Ground shadow
        const g = this.add.graphics().setDepth(2);
        g.fillStyle(0x000000, 0.25);
        g.fillEllipse(pos.x, pos.y + 18, tw + 44, 16);

        // Castle (king) / stone tower (guards) — Tiny Swords CC0 art
        let img = null;
        if (useSprites) {
          const tex = (isKing ? 'castle_' : 'tower_') + (isEnemy ? 'red' : 'blue');
          img = this.add.image(pos.x, pos.y + 28, tex).setOrigin(0.5, 1).setDepth(2);
          img.setScale(isKing ? 0.52 : 0.56);
        }

        // HP bar
        const maxHp = isKing ? TOWER_MAX.king : TOWER_MAX.guard;
        const hpBg  = this.add.rectangle(pos.x, pos.y + 26, tw + 8, 8, 0x0a0a0a).setDepth(3);
        const hpBar = this.add.rectangle(pos.x, pos.y + 26, tw + 4, 6, isEnemy ? 0xE74C3C : 0x27AE60)
          .setDepth(4).setOrigin(0.5);
        const hpText = this.add.text(pos.x, pos.y + 38, String(maxHp), {
          fontSize: '10px', fill: '#FFFFFF', fontFamily: 'Arial', stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(4);

        this.towerObjects[playerKey][towerKey] =
          { g, img, hpBg, hpBar, hpText, pos, tw, th: isKing ? 80 : 60, isKing, isEnemy, state: 'full', fires: [] };
      }
    }
  }

  _buildHUD() {
    const { width: W, height: H } = this.scale;

    // Elixir bar
    this.elixirSystem = new ElixirSystem(this, W / 2, H - 180, W - 100);

    // ── Top HUD bar: [YOU 👑] [Timer] [👑 OPP] ──────────────────────────────
    const BAR_H = 52;
    const topBar = this.add.graphics().setDepth(9);
    topBar.fillStyle(0x030310, 0.88);
    topBar.fillRoundedRect(0, 0, W, BAR_H, { bl: 14, br: 14, tl: 0, tr: 0 });
    topBar.lineStyle(1, 0x223366, 0.55);
    topBar.strokeRoundedRect(0, 0, W, BAR_H, { bl: 14, br: 14, tl: 0, tr: 0 });

    // Timer centered in bar
    this.battleTimer = new BattleTimer(this, W / 2, BAR_H / 2 + 2);

    // Player name + crown — left side
    const opKey = this.myKey === 'p1' ? 'p2' : 'p1';
    const opInfo = this.matchInfo?.players?.find(p =>
      this.matchInfo?.teams?.[opKey]?.includes(p.userId)
    );
    const myInfo = this.matchInfo?.players?.find(p =>
      this.matchInfo?.teams?.[this.myKey]?.includes(p.userId)
    );
    const myName = (myInfo?.username || 'YOU').slice(0, 10);
    const opName = (opInfo?.username || 'OPP').slice(0, 10);

    // Left panel (you — blue)
    const panelW = W / 2 - 68;
    const leftPan = this.add.graphics().setDepth(10);
    leftPan.fillStyle(0x1133AA, 0.22); leftPan.fillRoundedRect(4, 4, panelW - 4, BAR_H - 8, 8);
    this.add.text(12, 8, myName, { fontSize: '10px', fill: '#8899FF', fontFamily: 'Arial', fontStyle: 'bold' }).setDepth(11);
    this.mycrownText = this.add.text(12, 22, '👑 0', {
      fontSize: '17px', fill: '#4488FF', fontFamily: 'Arial Black, Arial', fontStyle: 'bold',
      stroke: '#001133', strokeThickness: 3
    }).setDepth(11);

    // Right panel (opponent — red)
    const rightX = W / 2 + 68;
    const rightPan = this.add.graphics().setDepth(10);
    rightPan.fillStyle(0xAA1111, 0.22); rightPan.fillRoundedRect(rightX, 4, W - rightX - 4, BAR_H - 8, 8);
    this.add.text(W - 12, 8, opName, { fontSize: '10px', fill: '#FF8888', fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(1, 0).setDepth(11);
    this.opCrownText = this.add.text(W - 12, 22, '0 👑', {
      fontSize: '17px', fill: '#FF4444', fontFamily: 'Arial Black, Arial', fontStyle: 'bold',
      stroke: '#330000', strokeThickness: 3
    }).setOrigin(1, 0).setDepth(11);

    // Overtime banner (hidden)
    this.overtimeBanner = this.add.text(W / 2, H / 2, '⚡ OVERTIME ⚡', {
      fontSize: '36px', fill: '#FFD700',
      fontFamily: 'Arial Black, Arial', fontStyle: 'bold',
      stroke: '#1A1A00', strokeThickness: 6
    }).setOrigin(0.5).setAlpha(0).setDepth(20);
  }

  // Player may deploy anywhere in their own half — from just past the river
  // (the enemy bridge line) down to in front of their king tower.
  _deployBounds() {
    return this.myKey === 'p1'
      ? { minY: 450, maxY: 720 }
      : { minY: 134, maxY: 404 };
  }

  _buildDeployZone() {
    const { width: W } = this.scale;
    const b = this._deployBounds();
    const h = b.maxY - b.minY;
    this._deployZoneG = this.add.graphics().setDepth(1).setAlpha(0);
    this._deployZoneG.fillStyle(0x00FF88);
    this._deployZoneG.fillRect(24, b.minY, W - 48, h);
    // Dashed boundary line at the river edge (the limit of your half)
    this._deployEdgeG = this.add.graphics().setDepth(2).setAlpha(0.5);
    const edgeY = this.myKey === 'p1' ? b.minY : b.maxY;
    this._deployEdgeG.lineStyle(2, 0x00FFAA, 0.5);
    for (let x = 28; x < W - 28; x += 22) {
      this._deployEdgeG.lineBetween(x, edgeY, x + 12, edgeY);
    }
    // Zone label
    const zy = this.myKey === 'p1' ? b.minY + 16 : b.maxY - 16;
    this.add.text(W / 2, zy, 'YOUR TERRITORY', {
      fontSize: '9px', fill: '#00FF88', fontFamily: 'Arial', letterSpacing: 3
    }).setOrigin(0.5).setDepth(2).setAlpha(0.4);
  }

  // Card in slot idx was played → next queued card takes its place (CR cycle)
  _cycleCard(idx) {
    if (!this.queue?.length || !this.hand) return;
    const used = this.hand[idx];
    this.hand[idx] = this.queue.shift();
    this.queue.push(used);
    this._rebuildTray();
  }

  _rebuildTray() {
    for (const c of this.handCards || []) {
      [c.cardG, c.charG, c.elixirG, c.costText, c.nameText, c.zone].forEach(o => o?.destroy());
    }
    (this._nextObjs || []).forEach(o => o?.destroy());
    this._buildHandCards();
    this._refreshHandCards();
  }

  _buildHandCards() {
    const { width: W, height: H } = this.scale;
    const CARD_W = 64, CARD_H = 96;
    const GAP = 6;
    const totalCards = Math.min(this.hand.length, 4);
    const totalW = totalCards * (CARD_W + GAP) - GAP;
    const startX = (W - 74) / 2 - totalW / 2 + CARD_W / 2;   // leave room for NEXT slot
    // Card tray background — rounded top edge (built once)
    if (!this._trayBar) {
      this._trayBar = this.add.graphics().setDepth(7);
      this._trayBar.fillStyle(0x040410, 0.95);
      this._trayBar.fillRoundedRect(0, H - CARD_H - 32, W, CARD_H + 32, { tl: 14, tr: 14, bl: 0, br: 0 });
      this._trayBar.lineStyle(1.5, 0x2244AA, 0.45);
      this._trayBar.strokeRoundedRect(0, H - CARD_H - 32, W, CARD_H + 32, { tl: 14, tr: 14, bl: 0, br: 0 });
    }

    const cardY = H - CARD_H / 2 - 14;

    this.handCards = [];

    // ── NEXT card preview (right side, smaller + dimmed) ────────────────────
    this._nextObjs = [];
    const nx = W - 40;
    if (this.queue?.length) {
      const nId = this.queue[0];
      const ng = this.add.graphics().setDepth(8);
      ng.fillStyle(0x0A0A18, 0.9); ng.fillRoundedRect(nx - 24, cardY - 30, 48, 68, 7);
      ng.lineStyle(1.5, 0x445588, 0.8); ng.strokeRoundedRect(nx - 24, cardY - 30, 48, 68, 7);
      this._nextObjs.push(ng);
      const nKey = cardTexKey(this, nId);
      if (nKey) {
        const img = this.add.image(nx, cardY - 2, nKey).setDepth(9).setAlpha(0.75);
        const src = this.textures.get(nKey).getSourceImage();
        const s = Math.min(38 / src.width, 48 / src.height);
        img.setDisplaySize(src.width * s, src.height * s);
        this._nextObjs.push(img);
      }
      this._nextObjs.push(this.add.text(nx, cardY - 40, 'NEXT', {
        fontSize: '9px', fill: '#8899BB', fontFamily: 'Arial Black, Arial', fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(9));
    }

    for (let i = 0; i < totalCards; i++) {
      const charId = this.hand[i];
      if (!charId) continue;
      const char = CHARACTERS[charId];
      if (!char) continue;

      const cx = startX + i * (CARD_W + GAP);
      const isSelected = i === this.selectedCardIdx;
      const rarityColor = RARITY_COLORS[char.rarity] || 0x888888;
      // Selected card lifts up slightly
      const cy = isSelected ? cardY - 6 : cardY;

      const cardG = this.add.graphics().setDepth(8);

      // Card shadow
      cardG.fillStyle(0x000000, 0.55);
      cardG.fillRoundedRect(cx - CARD_W / 2 + 3, cy - CARD_H / 2 + 3, CARD_W, CARD_H, 8);

      // Card body — selected has richer blue tint
      cardG.fillStyle(isSelected ? 0x1A1A44 : 0x0D0D1E);
      cardG.fillRoundedRect(cx - CARD_W / 2, cy - CARD_H / 2, CARD_W, CARD_H, 8);
      // Subtle inner top highlight
      cardG.fillStyle(0xFFFFFF, 0.04);
      cardG.fillRoundedRect(cx - CARD_W / 2 + 2, cy - CARD_H / 2 + 2, CARD_W - 4, CARD_H * 0.45, 6);

      // Rarity stripe at bottom
      cardG.fillStyle(rarityColor, 0.75);
      cardG.fillRoundedRect(cx - CARD_W / 2, cy + CARD_H / 2 - 11, CARD_W, 11, { bl: 8, br: 8, tl: 0, tr: 0 });

      // Border
      cardG.lineStyle(isSelected ? 3 : 1.5, isSelected ? 0xFFD700 : rarityColor, isSelected ? 1 : 0.5);
      cardG.strokeRoundedRect(cx - CARD_W / 2, cy - CARD_H / 2, CARD_W, CARD_H, 8);

      // Selected: layered gold glow
      if (isSelected) {
        cardG.lineStyle(8, 0xFFD700, 0.12);
        cardG.strokeRoundedRect(cx - CARD_W / 2 - 3, cy - CARD_H / 2 - 3, CARD_W + 6, CARD_H + 6, 11);
        cardG.lineStyle(4, 0xFFD700, 0.22);
        cardG.strokeRoundedRect(cx - CARD_W / 2 - 1, cy - CARD_H / 2 - 1, CARD_W + 2, CARD_H + 2, 9);
      }

      // Character art — hero sprite if available, else procedural drawing
      let charG;
      const cardKey = heroTexKey(this, charId);
      if (cardKey) {
        charG = this.add.image(cx, cy - 6, cardKey).setDepth(9);
        const fit = Math.min((CARD_W - 16) / charG.width, (CARD_H - 26) / charG.height);
        charG.setScale(fit);
      } else {
        charG = this.add.graphics().setDepth(9);
        charG.x = cx; charG.y = cy - 8;
        const fn = DRAW_FUNCS[charId];
        if (fn) fn(charG);
        charG.setScale(0.44);
      }

      // Elixir cost badge (top-left)
      const elixirG = this.add.graphics().setDepth(9);
      elixirG.fillStyle(0x5A1188);
      elixirG.fillCircle(cx - CARD_W / 2 + 13, cy - CARD_H / 2 + 13, 13);
      elixirG.lineStyle(1.5, 0xCC66FF, 0.8);
      elixirG.strokeCircle(cx - CARD_W / 2 + 13, cy - CARD_H / 2 + 13, 13);
      const costText = this.add.text(cx - CARD_W / 2 + 13, cy - CARD_H / 2 + 13,
        String(char.elixirCost), {
          fontSize: '13px', fill: '#FFFFFF', fontFamily: 'Arial Black, Arial', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(10);

      // Character name at bottom
      const nameText = this.add.text(cx, cy + CARD_H / 2 - 6,
        char.name.split(' ')[0].slice(0, 8), {
          fontSize: '9px', fill: '#CCCCFF', fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(10);

      // Large interactive hit zone — full card area + extra padding for fat fingers
      const zone = this.add.zone(cx, cardY, CARD_W + 14, CARD_H + 20)
        .setInteractive({ useHandCursor: true }).setDepth(11);

      zone.on('pointerdown', (ptr) => {
        this.selectedCardIdx = i;
        this._refreshHandCards();
        audioSystem.playClick();
        this._startDrag(i, ptr);
      });

      this.handCards.push({ charId, cx, cardY, cy, cardG, charG, elixirG, costText, nameText, zone, idx: i });
    }
    this.DECK_SIZE = totalCards;
  }

  _refreshHandCards() {
    const CW = 64, CH = 96;
    for (const card of this.handCards) {
      const char = CHARACTERS[card.charId];
      const isSelected = card.idx === this.selectedCardIdx;
      const canAfford = char && this.myElixir >= char.elixirCost;
      const rarityColor = RARITY_COLORS[char?.rarity] || 0x888888;
      const cy = isSelected ? card.cardY - 6 : card.cardY;
      const alpha = canAfford ? 1 : 0.5;

      card.cardG.clear();

      // Shadow
      card.cardG.fillStyle(0x000000, 0.55 * alpha);
      card.cardG.fillRoundedRect(card.cx - CW / 2 + 3, cy - CH / 2 + 3, CW, CH, 8);

      // Body — red tint when can't afford
      const bodyCol = !canAfford ? 0x1A0808 : isSelected ? 0x1A1A44 : 0x0D0D1E;
      card.cardG.fillStyle(bodyCol, alpha);
      card.cardG.fillRoundedRect(card.cx - CW / 2, cy - CH / 2, CW, CH, 8);
      card.cardG.fillStyle(0xFFFFFF, 0.04 * alpha);
      card.cardG.fillRoundedRect(card.cx - CW / 2 + 2, cy - CH / 2 + 2, CW - 4, CH * 0.45, 6);

      // Rarity stripe
      card.cardG.fillStyle(rarityColor, 0.75 * alpha);
      card.cardG.fillRoundedRect(card.cx - CW / 2, cy + CH / 2 - 11, CW, 11, { bl: 8, br: 8, tl: 0, tr: 0 });

      // Border
      const borderCol = !canAfford ? 0xFF2222 : isSelected ? 0xFFD700 : rarityColor;
      card.cardG.lineStyle(isSelected ? 3 : 1.5, borderCol, isSelected ? 1 : 0.55 * alpha);
      card.cardG.strokeRoundedRect(card.cx - CW / 2, cy - CH / 2, CW, CH, 8);

      if (isSelected) {
        card.cardG.lineStyle(8, 0xFFD700, 0.12);
        card.cardG.strokeRoundedRect(card.cx - CW / 2 - 3, cy - CH / 2 - 3, CW + 6, CH + 6, 11);
        card.cardG.lineStyle(4, 0xFFD700, 0.22);
        card.cardG.strokeRoundedRect(card.cx - CW / 2 - 1, cy - CH / 2 - 1, CW + 2, CH + 2, 9);
      }

      // Elixir badge — red when can't afford
      card.elixirG.clear();
      const badgeCol = canAfford ? 0x5A1188 : 0x881122;
      const badgeBorder = canAfford ? 0xCC66FF : 0xFF4444;
      card.elixirG.fillStyle(badgeCol);
      card.elixirG.fillCircle(card.cx - CW / 2 + 13, cy - CH / 2 + 13, 13);
      card.elixirG.lineStyle(1.5, badgeBorder, 0.8);
      card.elixirG.strokeCircle(card.cx - CW / 2 + 13, cy - CH / 2 + 13, 13);
      card.costText.setColor(canAfford ? '#FFFFFF' : '#FF8888');

      card.charG.setAlpha(canAfford ? 1 : 0.28);
      card.charG.y = cy - 8;
      card.nameText.y = cy + CH / 2 - 6;
    }
  }

  _buildDeployIndicator(x, y) {
    // Outer shockwave
    const ring = this.add.graphics().setDepth(7);
    ring.lineStyle(2, 0x00FFAA, 1);
    ring.strokeCircle(x, y, 18);
    this.tweens.add({ targets: ring, scaleX: 3, scaleY: 3, alpha: 0, duration: 450, ease: 'Power2', onComplete: () => ring.destroy() });
    // Inner flash
    const flash = this.add.graphics().setDepth(7);
    flash.fillStyle(0x00FFAA, 0.55);
    flash.fillCircle(x, y, 16);
    this.tweens.add({ targets: flash, alpha: 0, scaleX: 0.5, scaleY: 0.5, duration: 280, onComplete: () => flash.destroy() });
  }

  // ── Drag-to-deploy ─────────────────────────────────────────────────────────
  _startDrag(idx, ptr) {
    if (this.gameOver) return;
    this._dragging = true;
    this._dragCardIdx = idx;
    const card = this.handCards[idx];
    if (!card) return;

    // Ghost unit follows pointer
    const gKey = cardTexKey(this, card.charId);
    if (gKey) {
      this._ghostG = this.add.image(ptr.x, ptr.y, gKey).setDepth(22).setAlpha(0.8);
      const src = this.textures.get(gKey).getSourceImage();
      const s = 74 / Math.max(src.width, src.height);
      this._ghostG.setScale(s);
    } else {
      this._ghostG = this.add.graphics().setDepth(22).setAlpha(0.75);
      const fn = DRAW_FUNCS[card.charId];
      if (fn) fn(this._ghostG);
      this._ghostG.setScale(0.68);
      this._ghostG.setPosition(ptr.x, ptr.y);
    }

    // Brighten deploy zone
    this._deployZoneG?.setAlpha(0.22);
  }

  _onPointerMove(ptr) {
    if (!this._dragging || !this._ghostG) return;
    this._ghostG.setPosition(ptr.x, ptr.y);
    const inZone = this._inMyDeployZone(ptr.x, ptr.y);
    this._ghostG.setAlpha(inZone ? 0.88 : 0.32);
    this._deployZoneG?.setAlpha(inZone ? 0.32 : 0.22);
  }

  _onPointerUp(ptr) {
    if (!this._dragging) return;
    const card = this.handCards[this._dragCardIdx];
    if (card && this._inMyDeployZone(ptr.x, ptr.y)) {
      const char = CHARACTERS[card.charId];
      if (char && this.myElixir >= char.elixirCost) {
        socketManager.deployUnit(card.charId, Math.round(ptr.x), Math.round(ptr.y), 1);
        audioSystem.playDeploy();
        this._buildDeployIndicator(ptr.x, ptr.y);
        this.myElixir = Math.max(0, this.myElixir - char.elixirCost);
        this.elixirSystem.update(this.myElixir, this.elixirRate || 1);
        this._cycleCard(this._dragCardIdx);
      } else if (char) {
        this._showNotEnoughElixir();
      }
    }
    this._endDrag();
  }

  _endDrag() {
    this._dragging = false;
    this._dragCardIdx = -1;
    this._ghostG?.destroy();
    this._ghostG = null;
    this._deployZoneG?.setAlpha(0);
  }

  _inMyDeployZone(x, y) {
    const b = this._deployBounds();
    return x >= 24 && x <= this.scale.width - 24 && y >= b.minY && y <= b.maxY;
  }

  // Fallback: tap on map directly while card selected (no drag)
  _onTap(ptr) {
    if (this.gameOver || this._dragging) return;
    const { height: H } = this.scale;
    if (ptr.y > H - 115) return; // in card bar → handled by card zone

    if (!this._inMyDeployZone(ptr.x, ptr.y)) return;

    const selCard = this.handCards[this.selectedCardIdx];
    if (!selCard) return;
    const char = CHARACTERS[selCard.charId];
    if (!char) return;
    if (this.myElixir < char.elixirCost) { this._showNotEnoughElixir(); return; }

    socketManager.deployUnit(selCard.charId, Math.round(ptr.x), Math.round(ptr.y), 1);
    audioSystem.playDeploy();
    this._buildDeployIndicator(ptr.x, ptr.y);
    this.myElixir = Math.max(0, this.myElixir - char.elixirCost);
    this.elixirSystem.update(this.myElixir, this.elixirRate || 1);
    this._cycleCard(this.selectedCardIdx);
  }

  // ── 3…2…1…FIGHT! intro ─────────────────────────────────────────────────────
  _battleCountdown() {
    const { width: W, height: H } = this.scale;
    const steps = ['3', '2', '1', 'FIGHT!'];
    steps.forEach((s, i) => {
      this.time.delayedCall(i * 650, () => {
        const t = this.add.text(W / 2, H * 0.42, s, {
          fontSize: s === 'FIGHT!' ? '58px' : '76px',
          fill: s === 'FIGHT!' ? '#FFD700' : '#FFFFFF',
          fontFamily: 'Arial Black, Arial', fontStyle: 'bold',
          stroke: '#000000', strokeThickness: 10
        }).setOrigin(0.5).setDepth(30).setScale(2.2).setAlpha(0);
        this.tweens.add({ targets: t, alpha: 1, scaleX: 1, scaleY: 1, duration: 240, ease: 'Back.easeOut' });
        this.tweens.add({ targets: t, alpha: 0, duration: 200, delay: 430, onComplete: () => t.destroy() });
        if (s === 'FIGHT!') this.cameras.main.shake(150, 0.006);
      });
    });
  }

  _showNotEnoughElixir() {
    const { width: W, height: H } = this.scale;
    const t = this.add.text(W / 2, H - 160, 'Not enough elixir!', {
      fontSize: '13px', fill: '#FF6B6B', fontFamily: 'Arial'
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets: t, alpha: 0, y: t.y - 30, duration: 900, onComplete: () => t.destroy() });
  }

  _onGameState(data) {
    // Update timer
    this.battleTimer.update(data.timerMs, data.overtime, data.suddenDeath);

    // Update my elixir from server
    this.elixirRate = data.elixirRate || 1;
    if (data.elixir) {
      const uid = this.myUserId;
      if (data.elixir[uid] !== undefined) {
        this.myElixir = data.elixir[uid];
        this.elixirSystem.update(this.myElixir, this.elixirRate);
      }
    }

    // Update towers
    for (const playerKey of ['p1', 'p2']) {
      if (!data.towers?.[playerKey]) continue;
      for (const towerKey of ['king', 'guardLeft', 'guardRight']) {
        const towerData = data.towers[playerKey][towerKey];
        if (!towerData) continue;
        this.towers[playerKey][towerKey].hp = towerData.hp;
        this._updateTowerHP(playerKey, towerKey, towerData.hp, towerData.maxHp);
      }
    }

    // Update units
    this._syncUnits(data.units || []);

    // Update crowns
    this._updateCrowns();

    this.overtime = data.overtime;
    this._refreshHandCards();
  }

  _updateTowerHP(playerKey, towerKey, hp, maxHp) {
    const tObj = this.towerObjects?.[playerKey]?.[towerKey];
    if (!tObj) return;
    const pct = Math.max(0, hp / maxHp);
    const tw = tObj.tw;
    tObj.hpBar.setDisplaySize(tw * pct, 6);
    tObj.hpText.setText(String(Math.ceil(hp)));

    const newState = hp <= 0 ? 'destroyed' : pct <= 0.5 ? 'damaged' : 'full';
    if (newState !== tObj.state) {
      tObj.state = newState;
      this._redrawTower(playerKey, towerKey, newState);
      if (newState === 'damaged') this._playTowerCrumble(tObj.pos, false);
      if (newState === 'destroyed') this._playTowerDestroyFX(tObj.pos.x, tObj.pos.y);
    }
  }

  _redrawTower(playerKey, towerKey, state) {
    const tObj = this.towerObjects?.[playerKey]?.[towerKey];
    if (!tObj || !tObj.img) return;
    const { pos, img, isKing, isEnemy } = tObj;

    // Clear any fire overlays from a previous state
    tObj.fires.forEach(f => f.destroy());
    tObj.fires = [];

    if (state === 'destroyed') {
      // Swap to the destroyed rubble art (castle rubble fits both sizes)
      img.setTexture(isKing ? 'castle_destroyed' : 'tower_destroyed');
      img.clearTint();
      return;
    }

    if (state === 'damaged') {
      // Scorched tint + burning fires on the structure
      img.setTint(0xB59B8A);
      if (this.anims.exists('fire_anim')) {
        const spots = isKing
          ? [[-30, -66], [24, -44]]
          : [[0, -60]];
        for (const [dx, dy] of spots) {
          const f = this.add.sprite(pos.x + dx, pos.y + dy, 'fire')
            .setDepth(3).setScale(0.42).setAlpha(0.95);
          f.play('fire_anim');
          tObj.fires.push(f);
        }
      }
      this._addTowerSmoke(pos);
      return;
    }

    // full
    img.setTexture((isKing ? 'castle_' : 'tower_') + (isEnemy ? 'red' : 'blue'));
    img.clearTint();
  }

  _playTowerCrumble(pos, isDestroy) {
    const fxG = this.add.graphics().setDepth(15);
    fxG.fillStyle(0x888888, 0.8);
    for (let i = 0; i < 6; i++) {
      const rx = pos.x - 16 + i * 6;
      fxG.fillRect(rx, pos.y - 20, 5, 10);
    }
    this.tweens.add({ targets: fxG, y: 40, alpha: 0, duration: 500, onComplete: () => fxG.destroy() });
  }

  _addTowerSmoke(pos) {
    if (this._smokeTimers?.[`${pos.x},${pos.y}`]) return; // already smoking
    if (!this._smokeTimers) this._smokeTimers = {};
    const key = `${pos.x},${pos.y}`;
    this._smokeTimers[key] = this.time.addEvent({ delay: 600, loop: true, callback: () => {
      if (!this.scene.isActive()) return;
      const sx = pos.x + (Math.random() - 0.5) * 20;
      const sy = pos.y - 10;
      const sG = this.add.graphics().setDepth(8).setAlpha(0.45);
      sG.fillStyle(0x666666); sG.fillCircle(sx, sy, 4 + Math.random() * 4);
      this.tweens.add({ targets: sG, y: '-=28', alpha: 0, duration: 900, onComplete: () => sG.destroy() });
    }});
  }

  _playTowerDestroyFX(x, y) {
    const fxG = this.add.graphics().setDepth(15);
    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2;
      const r = 18 + Math.random() * 32;
      fxG.fillStyle(0xFF6600, 0.8); fxG.fillCircle(x + Math.cos(angle) * r, y + Math.sin(angle) * r, 4 + Math.random() * 5);
      fxG.fillStyle(0x888888, 0.6); fxG.fillCircle(x + Math.cos(angle) * r * 0.6, y + Math.sin(angle) * r * 0.6 - 10, 3 + Math.random() * 4);
    }
    this.tweens.add({ targets: fxG, alpha: 0, scaleX: 2.2, scaleY: 2.2, duration: 700, onComplete: () => fxG.destroy() });
    audioSystem.playTowerDestroyed();
  }

  _syncUnits(serverUnits) {
    const serverIds = new Set(serverUnits.map(u => u.id));

    // Remove dead units
    for (const [id, uObj] of Object.entries(this.unitGraphics)) {
      if (!serverIds.has(id)) {
        this._playDeathFX(uObj.dispX, uObj.dispY, uObj);
        uObj.g.destroy();
        uObj.tintG?.destroy();
        uObj.shadowG?.destroy();
        uObj.legG?.destroy();
        uObj.hpBg.destroy();
        uObj.hpBar.destroy();
        delete this.unitGraphics[id];
      }
    }

    // Update or create units — store TARGET position; animation handled in update()
    for (const u of serverUnits) {
      if (this.unitGraphics[u.id]) {
        const uObj = this.unitGraphics[u.id];
        uObj.tx = u.x; uObj.ty = u.y;
        uObj.hp = u.hp; uObj.maxHp = u.maxHp;
        uObj.state = u.state;
      } else {
        this._createUnitGraphic(u);
      }
    }
  }

  _unitDepthScale(y) {
    // Units at the top (y≈100) appear at 72% size; at bottom (y≈750) at 100% — creates depth illusion
    const { height: H } = this.scale;
    return 0.72 + (y / H) * 0.28;
  }

  _createUnitGraphic(u) {
    const char    = CHARACTERS[u.charId] || {};
    const isAir   = char.type === 'air';
    const isMe    = u.owner === this.myKey;

    // Animated hero pack (imported spritesheets) takes priority,
    // then static hero image, then procedural DRAW_FUNCS.
    const anim     = heroAnim(u.charId);
    const isSheet  = !!(anim && anim.anims?.run && this.anims.exists(`${u.charId}_run`));
    const texKey   = isSheet ? null : heroTexKey(this, u.charId);
    const isSprite = !!texKey;

    // Dynamic ground shadow + team ring (behind everything)
    const shadowG = this.add.graphics().setDepth(3);
    // Procedural legs only for code-drawn ground units (sprites have their own legs)
    const legG    = (isAir || isSprite || isSheet) ? null : this.add.graphics().setDepth(4);
    // Team ring at feet
    const tintG   = this.add.graphics().setDepth(4).setAlpha(0.75);

    // Body
    let g, baseScale;
    if (isSheet) {
      const t = anim.trim || { x: 0, y: 0, h: anim.anims.idle?.fh || 100, w: 40 };
      const fh = anim.anims.run.fh, fw = anim.anims.run.fw;
      // Origin = the character's actual center-x / feet-y inside the padded frame
      const originY = Math.min(0.98, (t.y + t.h) / fh);
      const originX = t.x != null ? (t.x + t.w / 2) / fw : 0.5;
      g = this.add.sprite(u.x, u.y, `${u.charId}_run`).setOrigin(originX, originY).setDepth(5);
      g.play(`${u.charId}_run`);
      const TARGET_H = isAir ? 54 : 62;       // on-screen character height
      baseScale = TARGET_H / Math.max(20, t.h);
      if (anim.tint) g.setTint(anim.tint);
      if (!isMe) g.setFlipX(true);            // packs face right; enemies face left
    } else if (isSprite) {
      g = this.add.image(u.x, u.y, texKey).setOrigin(0.5, 0.82).setDepth(5);
      const srcH = this.textures.get(texKey).getSourceImage().height || 64;
      baseScale = 60 / srcH;                  // render ~60px tall
      if (!isMe) g.setFlipX(true);            // enemies face the other way
    } else {
      g = this.add.graphics().setDepth(5);
      const drawFn = DRAW_FUNCS[u.charId];
      if (drawFn) drawFn(g);
      else { g.fillStyle(0x888888); g.fillCircle(0, 0, 18); }
      baseScale = 1;
    }

    // HP bar
    const hpBg  = this.add.rectangle(u.x, u.y, 40, 6, 0x111111).setDepth(6);
    const hpBar = this.add.rectangle(u.x, u.y, 36, 4, isMe ? 0x27AE60 : 0xE74C3C).setDepth(7).setOrigin(0.5);

    this.unitGraphics[u.id] = {
      g, tintG, shadowG, legG, hpBg, hpBar,
      charId: u.charId, char, isAir, isMe, isSprite, isSheet, baseScale,
      barOff: isSheet ? 72 : isSprite ? 56 : 34,
      attackUntil: 0,                       // time until attack anim finishes
      color: char.color ?? 0x888888, accent: char.accentColor ?? 0xCCCCCC,
      tx: u.x, ty: u.y, dispX: u.x, dispY: u.y,
      hp: u.hp, maxHp: u.maxHp, state: u.state,
      phase: Math.random() * Math.PI * 2,   // walk/hover cycle offset
      walkT: Math.random() * 10,            // accumulated cycle time
      lungeX: 0, lungeY: 0,                 // attack lunge offset (decays)
      kbX: 0, kbY: 0,                       // knockback offset (decays)
      facing: isMe ? -1 : 1                 // -1 = up the board, 1 = down
    };
  }

  // ── Per-frame animation: walking bounce, hover, legs, lunge, knockback ──────
  update(time, delta) {
    if (!this.unitGraphics) return;
    const { height: H } = this.scale;
    const dt = Math.min(delta, 50);

    for (const id in this.unitGraphics) {
      const o = this.unitGraphics[id];

      // Smoothly chase the server target position
      const lerp = 0.22;
      const prevX = o.dispX, prevY = o.dispY;
      o.dispX += (o.tx - o.dispX) * lerp;
      o.dispY += (o.ty - o.dispY) * lerp;

      // Movement speed → drives walk cadence & whether we bounce
      const moved = Math.hypot(o.dispX - prevX, o.dispY - prevY);
      const movingByState = o.state === 'moving';
      const isMoving = movingByState || moved > 0.25;

      // Advance the animation cycle (faster when moving)
      const cadence = o.isAir ? 0.004 : (isMoving ? 0.011 : 0.005);
      o.walkT += dt * cadence;
      const ph = o.walkT + o.phase;

      const depthSc = this._unitDepthScale(o.dispY);

      // Decay lunge & knockback
      o.lungeX *= 0.80; o.lungeY *= 0.80;
      o.kbX    *= 0.84; o.kbY    *= 0.84;

      // ── Vertical motion ──────────────────────────────────────────────────
      let bob, sqStretch;
      if (o.isSheet) {
        // Real frame animation handles gait — only air units hover
        bob = o.isAir ? Math.sin(ph * 1.6) * 5 : 0;
        sqStretch = 1;
        // Swap run/idle based on movement (attack anim takes priority)
        if (time > o.attackUntil) {
          const want = isMoving ? `${o.charId}_run`
            : (this.anims.exists(`${o.charId}_idle`) ? `${o.charId}_idle` : `${o.charId}_run`);
          if (o.g.anims?.currentAnim?.key !== want) o.g.play(want, true);
        }
      } else if (o.isAir) {
        bob = Math.sin(ph * 1.6) * 5;          // gentle hover
        sqStretch = 1 + Math.sin(ph * 1.6) * 0.03;
      } else if (isMoving) {
        bob = -Math.abs(Math.sin(ph)) * 6;     // walking bounce (up)
        sqStretch = 1 - (bob / 6) * 0.07;      // squash on footfall
      } else {
        bob = Math.sin(ph) * 1.5;              // idle breath
        sqStretch = 1 + Math.sin(ph) * 0.02;
      }

      const bx = o.dispX + o.lungeX + o.kbX;
      const by = o.dispY + o.lungeY + o.kbY;

      // ── Dynamic shadow (shrinks as unit rises) ───────────────────────────
      const lift = Math.abs(bob);
      const shScale = 1 - lift / 26;
      o.shadowG.clear();
      o.shadowG.fillStyle(0x000000, 0.28 * shScale);
      o.shadowG.fillEllipse(o.dispX, o.dispY + 24 * depthSc, 30 * depthSc * shScale, 9 * depthSc * shScale);

      // ── Team ring at feet ────────────────────────────────────────────────
      o.tintG.clear();
      o.tintG.lineStyle(2.5, o.isMe ? 0x44AAFF : 0xFF4444, 0.9);
      o.tintG.strokeEllipse(o.dispX, o.dispY + 24 * depthSc, 34 * depthSc, 12 * depthSc);

      // ── Animated legs (ground only) ──────────────────────────────────────
      if (o.legG) {
        o.legG.clear();
        const hipX = bx, hipY = by + bob + 16 * depthSc;
        const legLen = 11 * depthSc;
        const swing  = (isMoving ? Math.sin(ph) : 0) * 6 * depthSc;
        o.legG.lineStyle(5 * depthSc, this._darken(o.color, 0.6), 1);
        // Back leg
        o.legG.lineBetween(hipX - 4 * depthSc, hipY, hipX - 4 * depthSc - swing, hipY + legLen);
        // Front leg
        o.legG.lineBetween(hipX + 4 * depthSc, hipY, hipX + 4 * depthSc + swing, hipY + legLen);
        // Tiny feet
        o.legG.fillStyle(this._darken(o.color, 0.45), 1);
        o.legG.fillCircle(hipX - 4 * depthSc - swing, hipY + legLen, 2.6 * depthSc);
        o.legG.fillCircle(hipX + 4 * depthSc + swing, hipY + legLen, 2.6 * depthSc);
      }

      // ── Body transform ───────────────────────────────────────────────────
      if (o.isSheet && time > o.attackUntil && o.aimRot) o.aimRot *= 0.86; // relax aim
      const lean = o.isSheet ? (o.aimRot || 0)
        : (isMoving && !o.isAir ? Math.sin(ph * 0.5) * 0.045 : Math.sin(ph) * 0.02);
      const bs = o.baseScale * depthSc;
      o.g.setPosition(bx, by + bob);
      o.g.setScale(bs, bs * sqStretch);
      o.g.setRotation(lean);

      // ── HP bar ───────────────────────────────────────────────────────────
      const barW = 36 * depthSc;
      const barY = by + bob - o.barOff * depthSc;
      o.hpBg.setPosition(o.dispX, barY).setDisplaySize(barW + 4, 6);
      o.hpBar.setPosition(o.dispX - barW / 2, barY).setDisplaySize(barW * Math.max(0, o.hp / o.maxHp), 4).setOrigin(0, 0.5);
    }
  }

  _darken(hex, f) {
    const r = ((hex >> 16) & 0xff) * f, g = ((hex >> 8) & 0xff) * f, b = (hex & 0xff) * f;
    return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);
  }

  // Nearest displayed unit of a charId (attacker lookup for events)
  _unitNear(charId, x, y, r = 110) {
    let best = null, bestD = r * r;
    for (const id in this.unitGraphics) {
      const o = this.unitGraphics[id];
      if (o.charId !== charId) continue;
      const d = (o.dispX - x) ** 2 + (o.dispY - y) ** 2;
      if (d < bestD) { bestD = d; best = o; }
    }
    return best;
  }

  // Attacker faces + tilts toward its target, lunges, and swings (real anim)
  _lungeUnit(charId, fx, fy, tx, ty) {
    const best = this._unitNear(charId, fx, fy);
    if (!best) return;
    const dx = tx - best.dispX, dy = ty - best.dispY;
    const d = Math.hypot(dx, dy) || 1;
    best.lungeX = (dx / d) * 8;
    best.lungeY = (dy / d) * 8;

    if (best.isSheet) {
      // Face left/right toward the target...
      if (Math.abs(dx) > 4) best.g.setFlipX(dx < 0);
      // ...and pitch the body up/down so vertical shots read as aimed
      const pitch = Phaser.Math.Clamp(Math.atan2(dy, Math.abs(dx)), -0.85, 0.85) * 0.55;
      best.aimRot = (best.g.flipX ? -1 : 1) * pitch;
      if (this.anims.exists(`${best.charId}_attack`)) {
        const animObj = this.anims.get(`${best.charId}_attack`);
        best.attackUntil = this.time.now + (animObj?.duration || 500);
        best.g.play(`${best.charId}_attack`, true);
      }
    }
  }

  // Target gets shoved away from the attacker (knockback decays in update)
  _knockbackTarget(targetId, fx, fy, tx, ty, dmg) {
    const o = this.unitGraphics[targetId];
    if (!o) return; // towers aren't in unitGraphics — they don't get knocked back
    const dx = tx - fx, dy = ty - fy;
    const d = Math.hypot(dx, dy) || 1;
    const mag = Math.min(4 + (dmg || 0) / 30, 12);
    o.kbX = (dx / d) * mag;
    o.kbY = (dy / d) * mag;
    // Quick white hit-flash on the body
    o.g.setAlpha(0.6);
    this.tweens.add({ targets: o.g, alpha: 1, duration: 140 });
  }

  _playDeathFX(x, y, uObj = null) {
    // Real death animation from the imported pack, if the unit has one
    if (uObj?.isSheet && this.anims.exists(`${uObj.charId}_death`)) {
      const d = this.add.sprite(x, y, `${uObj.charId}_death`).setDepth(5);
      d.setOrigin(uObj.g.originX, uObj.g.originY);
      d.setScale(uObj.g.scaleX, uObj.g.scaleY);
      d.setFlipX(uObj.g.flipX);
      if (uObj.g.tintTopLeft !== 0xffffff) d.setTint(uObj.g.tintTopLeft);
      d.play(`${uObj.charId}_death`);
      d.once('animationcomplete', () => {
        this.tweens.add({ targets: d, alpha: 0, duration: 420, onComplete: () => d.destroy() });
      });
    }

    // Modern shockwave ring
    const ring = this.add.graphics().setDepth(15);
    ring.lineStyle(3, 0xFFFFFF, 0.9);
    ring.strokeCircle(x, y, 14);
    this.tweens.add({ targets: ring, scaleX: 3.5, scaleY: 3.5, alpha: 0, duration: 380, ease: 'Power2', onComplete: () => ring.destroy() });

    // 6 directional sparks (thin lines, not blobs)
    const sparks = this.add.graphics().setDepth(14);
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const len = 16 + Math.random() * 14;
      const col = i % 2 === 0 ? 0xFFCC00 : 0xFF8800;
      sparks.lineStyle(2, col, 0.9);
      sparks.lineBetween(x, y, x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    }
    this.tweens.add({ targets: sparks, scaleX: 1.8, scaleY: 1.8, alpha: 0, duration: 280, onComplete: () => sparks.destroy() });

    audioSystem.playHit();
  }

  _onGameEvent(evt) {
    if (evt.type === 'unit_hit' || evt.type === 'tower_hit') {
      const char = CHARACTERS[evt.charId];
      const range = char?.range ?? 80;
      const accent = char?.accentColor ?? char?.color ?? 0xFFFFFF;

      // Aim at where things are DRAWN, not where the server says they were:
      // attacker = nearest displayed unit of that charId, target = its live
      // display position (falls back to server coords for towers).
      const atk = this._unitNear(evt.charId, evt.fromX ?? evt.x, evt.fromY ?? evt.y);
      const fx = atk ? atk.dispX : (evt.fromX ?? evt.x);
      const fy = atk ? atk.dispY - 20 : (evt.fromY ?? evt.y);
      const tgt0 = this.unitGraphics[evt.targetId];
      const tx = tgt0 ? tgt0.dispX : evt.x;
      const ty = tgt0 ? tgt0.dispY - 14 : evt.y;

      // Fire the attacker's projectile / slash + lunge + facing
      if (evt.charId) {
        this._playAttackFX(evt.charId, fx, fy, tx, ty);
        this._lungeUnit(evt.charId, fx, fy, tx, ty);
      }

      // Projectile travel time (ranged only)
      const dist = Math.hypot(tx - fx, ty - fy);
      const travel = range >= 130 ? Math.min(dist * 1.0, 380) : 0;

      // Impact spark + damage number land ON the target when the shot arrives
      this.time.delayedCall(travel, () => {
        const t2 = this.unitGraphics[evt.targetId];
        const ix = t2 ? t2.dispX : tx, iy = t2 ? t2.dispY - 14 : ty;
        this._impactFlash(ix, iy, accent);
        this._showDamageNumber(ix, iy - 8, evt.damage);
        this._knockbackTarget(evt.targetId, fx, fy, ix, iy, evt.damage);
        audioSystem.playHit();
      });
    }
    if (evt.type === 'tower_destroyed') { audioSystem.playTowerDestroyed(); }
    if (evt.type === 'tower_attack') {
      const fx = evt.fromX ?? evt.x, fy = evt.fromY ?? evt.y;
      const col = evt.from === this.myKey ? 0x44AAFF : 0xFF4444;
      this._towerBolt(fx, fy, evt.x, evt.y, col);
      const dist = Math.hypot(evt.x - fx, evt.y - fy);
      this.time.delayedCall(Math.min(dist * 0.9, 300), () => {
        this._impactFlash(evt.x, evt.y, col);
        this._showDamageNumber(evt.x, evt.y, evt.damage);
        this._knockbackTarget(evt.targetId, fx, fy, evt.x, evt.y, evt.damage);
        audioSystem.playTowerHit();
      });
    }
  }

  // ── Impact spark burst at the point of contact ─────────────────────────────
  _impactFlash(x, y, col) {
    // Bright flash core
    const flash = this.add.graphics().setDepth(16);
    flash.fillStyle(0xFFFFFF, 0.9); flash.fillCircle(x, y, 8);
    flash.fillStyle(col, 0.6); flash.fillCircle(x, y, 13);
    this.tweens.add({ targets: flash, scaleX: 1.8, scaleY: 1.8, alpha: 0, duration: 200, onComplete: () => flash.destroy() });
    // Radiating spark lines
    const sparks = this.add.graphics().setDepth(16);
    sparks.lineStyle(2, col, 0.95);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.random() * 0.4;
      const len = 9 + Math.random() * 9;
      sparks.lineBetween(x, y, x + Math.cos(a) * len, y + Math.sin(a) * len);
    }
    this.tweens.add({ targets: sparks, scaleX: 1.7, scaleY: 1.7, alpha: 0, duration: 240, onComplete: () => sparks.destroy() });
  }

  // ── Tower projectile bolt ──────────────────────────────────────────────────
  _towerBolt(fx, fy, tx, ty, col) {
    const g = this.add.graphics().setDepth(14);
    g.fillStyle(col, 0.95); g.fillCircle(0, 0, 6);
    g.fillStyle(0xFFFFFF, 0.7); g.fillCircle(0, 0, 3);
    g.x = fx; g.y = fy;
    const dist = Math.hypot(tx - fx, ty - fy);
    this.tweens.add({
      targets: g, x: tx, y: ty,
      duration: Math.min(dist * 0.9, 300), ease: 'Linear',
      onComplete: () => g.destroy()
    });
  }

  // One-shot animated explosion (Tiny Swords sheet)
  _boom(x, y, scale = 0.55) {
    if (!this.anims.exists('explosion_anim')) return;
    const b = this.add.sprite(x, y, 'explosions').setDepth(16).setScale(scale);
    b.play('explosion_anim');
    b.once('animationcomplete', () => b.destroy());
    this.cameras.main.shake(90, 0.004);
  }

  // Short-lived fire pool (Tiny Swords sheet)
  _firePool(x, y, ms = 1400) {
    if (!this.anims.exists('fire_anim')) return;
    const f = this.add.sprite(x, y, 'fire').setDepth(6).setScale(0.55).setAlpha(0.95);
    f.play('fire_anim');
    this.time.delayedCall(ms, () => {
      this.tweens.add({ targets: f, alpha: 0, duration: 300, onComplete: () => f.destroy() });
    });
  }

  _playAttackFX(charId, fx, fy, tx, ty) {
    const dxx = tx - fx, dyy = ty - fy;
    const distT = Math.hypot(dxx, dyy) || 1;

    // ── Imported-sheet projectiles & impacts (the flashy ones) ──────────────
    if (charId === 'pyro_drake' && this.anims.exists('pyro_drake_proj')) {
      const p = this.add.sprite(fx, fy, 'pyro_drake_proj').setDepth(14).setScale(1.3);
      p.play('pyro_drake_proj');
      p.setRotation(Math.atan2(dyy, dxx));
      this.tweens.add({
        targets: p, x: tx, y: ty, duration: Math.min(distT * 1.0, 380), ease: 'Linear',
        onComplete: () => {
          p.destroy();
          if (this.anims.exists('pyro_drake_boom')) {
            const b = this.add.sprite(tx, ty, 'pyro_drake_boom').setDepth(16).setScale(1.4);
            b.play('pyro_drake_boom');
            b.once('animationcomplete', () => b.destroy());
          }
        }
      });
      return;
    }
    if ((charId === 'arrow_jack' || charId === 'volt_ranger')) {
      const key = charId === 'arrow_jack' && this.textures.exists('arrow_jack_proj')
        ? 'arrow_jack_proj' : (this.textures.exists('ts_arrow') ? 'ts_arrow' : null);
      if (key) {
        const p = this.add.image(fx, fy, key).setDepth(14);
        p.setScale(key === 'ts_arrow' ? 0.5 : 1.6);
        if (charId === 'volt_ranger') p.setTint(0xFFE066);
        // both arrow textures point right → rotate straight toward the target
        p.setRotation(Math.atan2(dyy, dxx));
        this.tweens.add({ targets: p, x: tx, y: ty, duration: Math.min(distT * 0.85, 320), ease: 'Linear', onComplete: () => p.destroy() });
        return;
      }
    }
    if ((charId === 'skywing' || charId === 'forge_dwarf') && this.anims.exists('dynamite_anim')) {
      const p = this.add.sprite(fx, fy, 'dynamite').setDepth(14).setScale(0.8);
      p.play('dynamite_anim');
      this.tweens.add({ targets: p, x: tx, duration: Math.min(distT * 1.1, 420), ease: 'Linear' });
      this.tweens.add({
        targets: p, y: ty, duration: Math.min(distT * 1.1, 420), ease: 'Quad.easeIn',
        onComplete: () => { p.destroy(); this._boom(tx, ty, 0.6); }
      });
      return;
    }
    if (charId === 'titan_grunt' || charId === 'stone_golem') {
      this.time.delayedCall(140, () => this._boom(tx, ty, 0.5));
      // fall through to the melee slash below as well
    }
    if (charId === 'blaze_witch') {
      this.time.delayedCall(200, () => this._firePool(tx, ty));
    }

    const g = this.add.graphics().setDepth(14);
    const dx = tx - fx, dy = ty - fy;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = dx / dist, ny = dy / dist;

    const _arc = (col, r, dur, onDone) => {
      g.fillStyle(col, 0.9); g.fillCircle(0, 0, r);
      g.x = fx; g.y = fy;
      this.tweens.add({ targets: g, x: tx, y: ty, duration: dur, ease: 'Linear', onComplete: () => { if (onDone) onDone(); g.destroy(); } });
    };
    const _ring = (x, y, col, rMax, dur) => {
      const rg = this.add.graphics().setDepth(14);
      rg.lineStyle(3, col, 0.8); rg.strokeCircle(x, y, 4);
      this.tweens.add({ targets: rg, scaleX: rMax / 4, scaleY: rMax / 4, alpha: 0, duration: dur, onComplete: () => rg.destroy() });
    };
    const _line = (col, lw, dur) => {
      g.lineStyle(lw, col, 0.85); g.lineBetween(fx, fy, tx, ty);
      this.tweens.add({ targets: g, alpha: 0, duration: dur, onComplete: () => g.destroy() });
    };
    const _pool = (x, y, col, rMax, dur) => {
      const pg = this.add.graphics().setDepth(7);
      pg.fillStyle(col, 0.55); pg.fillCircle(x, y, 4);
      this.tweens.add({ targets: pg, scaleX: rMax / 4, scaleY: rMax / 4 * 0.4, alpha: 0, duration: dur, onComplete: () => pg.destroy() });
    };

    switch (charId) {
      case 'titan_grunt':
        _ring(tx, ty, 0xAAAAAA, 40, 400); break;
      case 'pyro_drake':
        g.fillStyle(0xFF6600, 0.9); g.fillCircle(0, 0, 10);
        g.x = fx; g.y = fy;
        this.tweens.add({ targets: g, x: tx, y: ty, duration: 380, ease: 'Quad.Out', onComplete: () => { _pool(tx, ty, 0xFF4400, 30, 500); g.destroy(); } });
        break;
      case 'lady_vex':
        g.lineStyle(3, 0xCC44FF, 0.85);
        g.lineBetween(fx, fy, fx + dx * 0.4 + ny * 18, fy + dy * 0.4 - nx * 18);
        g.lineBetween(fx + dx * 0.4 + ny * 18, fy + dy * 0.4 - nx * 18, tx, ty);
        this.tweens.add({ targets: g, alpha: 0, duration: 260, onComplete: () => g.destroy() });
        break;
      case 'bone_shard':
        g.fillStyle(0x88FF88, 0.85); g.fillCircle(0, 0, 8);
        g.x = fx; g.y = fy;
        this.tweens.add({ targets: g, x: tx, y: ty, duration: 500, ease: 'Sine.InOut', onComplete: () => g.destroy() });
        break;
      case 'iron_bro':
        _ring(tx, ty, 0x2266FF, 30, 300); break;
      case 'stone_golem':
        g.fillStyle(0x888888, 0.9); g.fillCircle(0, 0, 14);
        g.x = fx; g.y = fy;
        this.tweens.add({ targets: g, x: tx, y: ty, duration: 450, ease: 'Quad.In', onComplete: () => { _ring(tx, ty, 0x888888, 36, 350); g.destroy(); } });
        break;
      case 'thunder_chief':
        _line(0xFFEE00, 3, 130);
        this.time.delayedCall(65, () => _line(0xFFFFAA, 2, 80));
        break;
      case 'blaze_witch':
        _pool(tx, ty, 0xFF4400, 38, 700); break;
      case 'wing_knight':
        _line(0xFFFFFF, 4, 160);
        _ring(tx, ty, 0xFFFFFF, 24, 260);
        break;
      case 'frostborn': {
        g.fillStyle(0xAADDFF, 0.9);
        g.fillTriangle(0, -7, -5, 5, 5, 5);
        g.x = fx; g.y = fy;
        this.tweens.add({ targets: g, x: tx, y: ty, duration: 420, ease: 'Linear', onComplete: () => g.destroy() });
        break;
      }
      case 'jade_monk':
        _ring(fx, fy, 0x00FF88, 28, 500);
        _ring(fx, fy, 0x00CC66, 20, 400);
        break;
      case 'sea_crusher':
        g.fillStyle(0x00AACC, 0.8); g.fillEllipse(0, 0, 18, 10);
        g.x = fx; g.y = fy; g.rotation = Math.atan2(dy, dx);
        this.tweens.add({ targets: g, x: tx, y: ty, duration: 350, ease: 'Linear', onComplete: () => g.destroy() });
        break;
      case 'crystal_sage':
        [-10, 0, 10].forEach(off => {
          const sg = this.add.graphics().setDepth(14);
          sg.fillStyle(0xCC88FF, 0.85);
          sg.fillTriangle(0, -6, -4, 4, 4, 4);
          sg.x = fx; sg.y = fy;
          this.tweens.add({ targets: sg, x: tx + off * ny, y: ty + off * nx, duration: 380, delay: off * 3, ease: 'Linear', onComplete: () => sg.destroy() });
        });
        g.destroy();
        break;
      case 'arrow_jack':
        g.lineStyle(2, 0xC8A000, 0.9); g.lineBetween(fx, fy, tx, ty);
        g.fillStyle(0xCC2200, 0.9); g.fillTriangle(tx - nx * 8, ty - ny * 8, tx + ny * 4, ty - nx * 4, tx - ny * 4, ty + nx * 4);
        this.tweens.add({ targets: g, alpha: 0, duration: 200, onComplete: () => g.destroy() });
        break;
      case 'shadow_rogue':
        g.fillStyle(0x220022, 0.85);
        g.fillCircle(0, 0, 12);
        g.lineStyle(2, 0xAA0066, 0.7); g.strokeCircle(0, 0, 12);
        g.x = tx; g.y = ty;
        this.tweens.add({ targets: g, alpha: 0, scaleX: 2, scaleY: 2, duration: 280, onComplete: () => g.destroy() });
        break;
      case 'skywing':
        g.fillStyle(0x222222, 0.9); g.fillCircle(0, 0, 10);
        g.x = (fx + tx) / 2; g.y = Math.min(fy, ty) - 40;
        this.tweens.add({ targets: g, x: tx, y: ty, duration: 500, ease: 'Quad.In', onComplete: () => { _ring(tx, ty, 0xFF6600, 35, 400); g.destroy(); } });
        break;
      case 'volt_ranger': {
        const pts = [{ x: fx, y: fy }];
        for (let i = 1; i < 5; i++) pts.push({ x: fx + dx * i / 5 + (Math.random() - 0.5) * 16, y: fy + dy * i / 5 + (Math.random() - 0.5) * 16 });
        pts.push({ x: tx, y: ty });
        g.lineStyle(3, 0xFFEE00, 0.9);
        for (let i = 0; i < pts.length - 1; i++) g.lineBetween(pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y);
        this.tweens.add({ targets: g, alpha: 0, duration: 160, onComplete: () => g.destroy() });
        break;
      }
      case 'toxin_toad':
        g.fillStyle(0x00AA22, 0.8); g.fillCircle(0, 0, 9);
        g.x = fx; g.y = fy;
        this.tweens.add({ targets: g, x: tx, y: ty, duration: 550, ease: 'Sine.Out', onComplete: () => { _pool(tx, ty, 0x00AA22, 28, 600); g.destroy(); } });
        break;
      case 'neon_wraith':
        _ring(tx, ty, 0x00FFCC, 32, 380); break;
      case 'forge_dwarf':
        g.fillStyle(0x888888, 0.9); g.fillCircle(0, 0, 9);
        g.x = fx; g.y = fy;
        this.tweens.add({ targets: g, x: tx, y: ty, duration: 400, ease: 'Quad.In', onComplete: () => { _ring(tx, ty, 0xFF6600, 26, 320); g.destroy(); } });
        break;
      default:
        g.destroy();
    }
  }

  _showDamageNumber(x, y, dmg) {
    if (!dmg) return;
    const isCrit = dmg > 200;
    const txt = this.add.text(x, y - 28, `-${dmg}`, {
      fontSize:        isCrit ? '22px' : '15px',
      fill:            isCrit ? '#FF2222' : '#FFFFFF',
      fontFamily:      'Arial Black, Arial',
      fontStyle:       'bold',
      stroke:          '#000000',
      strokeThickness: isCrit ? 5 : 3,
    }).setOrigin(0.5).setDepth(18).setScale(isCrit ? 0.8 : 1);

    this.tweens.add({
      targets: txt,
      y:       txt.y - 55,
      alpha:   0,
      scaleX:  isCrit ? 1.4 : 1.1,
      scaleY:  isCrit ? 1.4 : 1.1,
      duration: isCrit ? 1100 : 850,
      ease:    'Power2',
      onComplete: () => txt.destroy()
    });
  }

  _updateCrowns() {
    const myCrowns = this._countCrowns(this.myKey === 'p1' ? 'p2' : 'p1');
    const opCrowns = this._countCrowns(this.myKey);
    this.mycrownText.setText(`👑 ${myCrowns}`);
    this.opCrownText.setText(`👑 ${opCrowns}`);
  }

  _countCrowns(player) {
    let crowns = 0;
    const t = this.towers[player];
    if (t.guardLeft.hp <= 0)  crowns++;
    if (t.guardRight.hp <= 0) crowns++;
    if (t.king.hp <= 0)       crowns += 3;
    return crowns;
  }

  _onOvertime() {
    this.overtime = true;
    audioSystem.playOvertime();
    audioSystem.playTrack(this.mapId === 'ember_crossing' ? 'ember_rush' : 'frost_crown_overtime');

    this.overtimeBanner.setAlpha(1);
    this.tweens.add({
      targets: this.overtimeBanner,
      alpha: 0, scaleX: 1.4, scaleY: 1.4,
      duration: 2000, ease: 'Power2'
    });
    this.battleTimer.flashOvertime();
  }

  _onSuddenDeath() {
    const { width: W, height: H } = this.scale;
    const banner = this.add.text(W / 2, H / 2, '☠ SUDDEN DEATH ☠', {
      fontSize: '30px', fill: '#FF0000',
      fontFamily: 'Arial Black, Arial', fontStyle: 'bold',
      stroke: '#1A1A1A', strokeThickness: 6
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets: banner, alpha: 0, scaleX: 1.3, scaleY: 1.3, duration: 2500, onComplete: () => banner.destroy() });
  }

  _onGameOver(data) {
    this.gameOver = true;
    audioSystem.stopMusic();

    const myUserId = this.myUserId;
    const iWon = data.winnerUserIds?.includes(myUserId);

    if (iWon) audioSystem.playWin();
    else audioSystem.playLose();

    // Show result overlay
    const { width: W, height: H } = this.scale;
    const color = iWon ? 0x27AE60 : 0xC0392B;
    const msg = iWon ? '⚔ VICTORY! ⚔' : '☠ DEFEAT ☠';

    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6).setDepth(25);
    const resultText = this.add.text(W / 2, H / 2 - 60, msg, {
      fontSize: '46px', fill: `#${color.toString(16)}`,
      fontFamily: 'Arial Black, Arial', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 8
    }).setOrigin(0.5).setDepth(26).setAlpha(0).setScale(0.5);

    this.tweens.add({ targets: resultText, alpha: 1, scaleX: 1, scaleY: 1, duration: 600, ease: 'Back.easeOut' });

    const crownsText = `Crowns: ${data.crowns?.[this.myKey === 'p1' ? 'p1' : 'p2'] || 0} - ${data.crowns?.[this.myKey === 'p1' ? 'p2' : 'p1'] || 0}`;
    this.add.text(W / 2, H / 2 + 20, crownsText, {
      fontSize: '18px', fill: '#FFFFFF', fontFamily: 'Arial'
    }).setOrigin(0.5).setDepth(26);

    this.time.delayedCall(2500, () => {
      socketManager.offAll('game_state');
      socketManager.offAll('game_event');
      socketManager.offAll('game_over');
      socketManager.offAll('overtime_start');
      socketManager.offAll('sudden_death_start');

      this.scene.start('Results', {
        won: iWon,
        crowns: data.crowns,
        myKey: this.myKey,
        damage: data.damagePerUser?.[myUserId] || 0,
        deck: this.deck
      });
    });
  }

  shutdown() {
    socketManager.offAll('game_state');
    socketManager.offAll('game_event');
    socketManager.offAll('game_over');
    socketManager.offAll('overtime_start');
    socketManager.offAll('sudden_death_start');
    this.elixirSystem?.destroy();
    this.battleTimer?.destroy();
  }
}
