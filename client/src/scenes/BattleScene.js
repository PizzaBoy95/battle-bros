import Phaser from 'phaser';
import { socketManager } from '../network/SocketManager.js';
import { audioSystem } from '../systems/AudioSystem.js';
import { ElixirSystem } from '../systems/ElixirSystem.js';
import { BattleTimer } from '../systems/BattleTimer.js';
import { CHARACTERS, CHARACTER_IDS, RARITY_COLORS } from '../characters/CharacterRegistry.js';
import { DRAW_FUNCS } from '../characters/CharacterGraphics.js';
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

    // Deck hand at bottom
    this._buildHandCards();

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

    for (const playerKey of ['p1', 'p2']) {
      this.towerObjects[playerKey] = {};
      for (const towerKey of ['king', 'guardLeft', 'guardRight']) {
        const pos = TOWER_POSITIONS[playerKey][towerKey];
        const isKing = towerKey === 'king';
        const isEnemy = playerKey !== this.myKey;

        const g = this.add.graphics().setDepth(2);
        const tw = isKing ? 58 : 44, th = isKing ? 80 : 60;
        const SIDE = 9; // depth illusion thickness

        // Ground shadow ellipse
        g.fillStyle(0x000000, 0.30);
        g.fillEllipse(pos.x + SIDE / 2, pos.y + 16, tw + 28, 14);

        // Right-side depth face (darker)
        const sideCol = isEnemy ? 0x641A11 : 0x10304A;
        g.fillStyle(sideCol);
        g.fillRect(pos.x + tw / 2, pos.y - th + 10, SIDE, th + 6);

        // Main tower body
        const bodyCol = isEnemy ? 0xA93226 : 0x2471A3;
        g.fillStyle(bodyCol);
        g.fillRect(pos.x - tw / 2, pos.y - th + 10, tw, th);

        // Stone brick texture
        g.fillStyle(0x000000, 0.10);
        for (let row = 0; row < Math.floor(th / 10); row++) {
          const ry = pos.y - th + 10 + row * 10;
          g.fillRect(pos.x - tw / 2, ry, tw, 1);
          const offset = (row % 2) * 10;
          for (let col = 0; col < 5; col++) {
            g.fillRect(pos.x - tw / 2 + offset + col * 20, ry, 1, 10);
          }
        }

        // Highlight strip (left edge — light source from left)
        g.fillStyle(0xFFFFFF, 0.14);
        g.fillRect(pos.x - tw / 2, pos.y - th + 10, 3, th);

        // Battlements
        const merCol  = isEnemy ? 0x871E18 : 0x1A4A72;
        const merSide = isEnemy ? 0x621610 : 0x123654;
        const slotW = Math.floor(tw / 4);
        for (let i = 0; i < 4; i++) {
          const bx = pos.x - tw / 2 + i * slotW;
          g.fillStyle(merCol);
          g.fillRect(bx, pos.y - th, slotW - 4, 15);
          g.fillStyle(merSide);
          g.fillRect(bx + slotW - 4, pos.y - th, SIDE / 2 + 1, 15);
          g.fillStyle(0xFFFFFF, 0.12);
          g.fillRect(bx, pos.y - th, 2, 15);
        }

        // Base platform
        const baseCol = isEnemy ? 0x5A1911 : 0x0E2A3D;
        g.fillStyle(baseCol);
        g.fillRect(pos.x - tw / 2 - 5, pos.y + 8, tw + 10 + SIDE, 12);

        // King tower crown
        if (isKing) {
          g.fillStyle(0xD4AC0D);
          g.fillTriangle(pos.x - 13, pos.y - th - 2, pos.x, pos.y - th - 18, pos.x + 13, pos.y - th - 2);
          g.fillStyle(0xFFD700);
          g.fillTriangle(pos.x - 11, pos.y - th - 3, pos.x, pos.y - th - 15, pos.x + 11, pos.y - th - 3);
          g.fillStyle(0xFFEE88, 0.5);
          g.fillTriangle(pos.x - 7, pos.y - th - 3, pos.x - 1, pos.y - th - 13, pos.x + 3, pos.y - th - 3);
        }

        // Archer silhouette on top
        const archerCol = isEnemy ? 0xFF7777 : 0x77CCFF;
        g.fillStyle(archerCol, 0.85);
        g.fillCircle(pos.x, pos.y - th - 5, 5);
        g.fillRect(pos.x - 3, pos.y - th + 1, 6, 9);

        // HP bar
        const maxHp = isKing ? TOWER_MAX.king : TOWER_MAX.guard;
        const hpBg  = this.add.rectangle(pos.x + SIDE / 2, pos.y + 22, tw + 8, 8, 0x0a0a0a).setDepth(3);
        const hpBar = this.add.rectangle(pos.x + SIDE / 2, pos.y + 22, tw + 4, 6, isEnemy ? 0xE74C3C : 0x27AE60)
          .setDepth(4).setOrigin(0.5);
        const hpText = this.add.text(pos.x + SIDE / 2, pos.y + 34, String(maxHp), {
          fontSize: '10px', fill: '#FFFFFF', fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(4);

        this.towerObjects[playerKey][towerKey] = { g, hpBg, hpBar, hpText, pos, tw, th, isKing };
      }
    }
  }

  _buildHUD() {
    const { width: W, height: H } = this.scale;

    // Elixir bar
    this.elixirSystem = new ElixirSystem(this, W / 2, H - 180, W - 100);

    // Timer
    this.battleTimer = new BattleTimer(this, W / 2, 30);

    // Player label
    const myLabel = this.myKey === 'p1' ? 'YOU (Bottom)' : 'YOU (Top)';
    this.add.text(10, H - 200, myLabel, {
      fontSize: '11px', fill: '#AAAACC', fontFamily: 'Arial'
    }).setDepth(10);

    // Opponent
    const opKey = this.myKey === 'p1' ? 'p2' : 'p1';
    const opInfo = this.matchInfo?.players?.find(p =>
      this.matchInfo.teams[opKey]?.includes(p.userId)
    );
    const opName = opInfo?.username || 'Opponent';
    this.add.text(W - 10, 50, opName, {
      fontSize: '11px', fill: '#FF6B6B', fontFamily: 'Arial'
    }).setOrigin(1, 0).setDepth(10);

    // Crown counters
    this.mycrownText  = this.add.text(10, H - 218, '👑 0', { fontSize: '14px', fill: '#FFD700', fontFamily: 'Arial' }).setDepth(10);
    this.opCrownText  = this.add.text(W - 10, 64,  '👑 0', { fontSize: '14px', fill: '#FF6B6B', fontFamily: 'Arial' }).setOrigin(1, 0).setDepth(10);

    // Overtime banner (hidden)
    this.overtimeBanner = this.add.text(W / 2, H / 2, '⚡ OVERTIME ⚡', {
      fontSize: '36px', fill: '#FFD700',
      fontFamily: 'Arial Black, Arial', fontStyle: 'bold',
      stroke: '#1A1A00', strokeThickness: 6
    }).setOrigin(0.5).setAlpha(0).setDepth(20);
  }

  _buildDeployZone() {
    const { width: W, height: H } = this.scale;
    this._deployZoneG = this.add.graphics().setDepth(1).setAlpha(0.10);
    this._deployZoneG.fillStyle(0x00FF88);
    if (this.myKey === 'p1') {
      this._deployZoneG.fillRect(62, 596, W - 124, 220);
    } else {
      this._deployZoneG.fillRect(62, 38, W - 124, 220);
    }
    // Zone label
    const zy = this.myKey === 'p1' ? 620 : 58;
    this.add.text(W / 2, zy, 'YOUR TERRITORY', {
      fontSize: '9px', fill: '#00FF88', fontFamily: 'Arial', alpha: 0.4, letterSpacing: 3
    }).setOrigin(0.5).setDepth(2).setAlpha(0.35);
  }

  _buildHandCards() {
    const { width: W, height: H } = this.scale;
    // Bigger cards for easy mobile tapping
    const CARD_W = 64, CARD_H = 86;
    const GAP = 7;
    const totalCards = Math.min(this.deck.length, DECK_SIZE);
    const totalW = totalCards * (CARD_W + GAP) - GAP;
    const startX = W / 2 - totalW / 2 + CARD_W / 2;
    // Card bar background
    const barG = this.add.graphics().setDepth(7);
    barG.fillStyle(0x05050F, 0.92);
    barG.fillRect(0, H - CARD_H - 28, W, CARD_H + 28);
    barG.lineStyle(1, 0x334466, 0.6);
    barG.strokeRect(0, H - CARD_H - 28, W, 1);

    const cardY = H - CARD_H / 2 - 12;

    this.handCards = [];

    for (let i = 0; i < totalCards; i++) {
      const charId = this.deck[i];
      if (!charId) continue;
      const char = CHARACTERS[charId];
      if (!char) continue;

      const cx = startX + i * (CARD_W + GAP);
      const isSelected = i === this.selectedCardIdx;
      const rarityColor = RARITY_COLORS[char.rarity] || 0x888888;

      const cardG = this.add.graphics().setDepth(8);

      // Card shadow
      cardG.fillStyle(0x000000, 0.5);
      cardG.fillRoundedRect(cx - CARD_W / 2 + 3, cardY - CARD_H / 2 + 3, CARD_W, CARD_H, 7);

      // Card body
      cardG.fillStyle(isSelected ? 0x1E1E3C : 0x0E0E20);
      cardG.fillRoundedRect(cx - CARD_W / 2, cardY - CARD_H / 2, CARD_W, CARD_H, 7);

      // Rarity stripe at bottom of card
      cardG.fillStyle(rarityColor, 0.7);
      cardG.fillRoundedRect(cx - CARD_W / 2, cardY + CARD_H / 2 - 10, CARD_W, 10, { bl: 7, br: 7, tl: 0, tr: 0 });

      // Border
      cardG.lineStyle(isSelected ? 2.5 : 1.5, isSelected ? 0xFFD700 : rarityColor, isSelected ? 1 : 0.45);
      cardG.strokeRoundedRect(cx - CARD_W / 2, cardY - CARD_H / 2, CARD_W, CARD_H, 7);

      // If selected: gold glow outline
      if (isSelected) {
        cardG.lineStyle(5, 0xFFD700, 0.18);
        cardG.strokeRoundedRect(cx - CARD_W / 2 - 2, cardY - CARD_H / 2 - 2, CARD_W + 4, CARD_H + 4, 9);
      }

      // Character drawing (centered in upper 3/4 of card)
      const charG = this.add.graphics().setDepth(9);
      charG.x = cx; charG.y = cardY - 8;
      const fn = DRAW_FUNCS[charId];
      if (fn) fn(charG);
      charG.setScale(0.42);

      // Elixir cost badge (top-left)
      const elixirG = this.add.graphics().setDepth(9);
      elixirG.fillStyle(0x6C1D9E);
      elixirG.fillCircle(cx - CARD_W / 2 + 13, cardY - CARD_H / 2 + 13, 12);
      elixirG.lineStyle(1.5, 0xDD88FF, 0.7);
      elixirG.strokeCircle(cx - CARD_W / 2 + 13, cardY - CARD_H / 2 + 13, 12);
      const costText = this.add.text(cx - CARD_W / 2 + 13, cardY - CARD_H / 2 + 13,
        String(char.elixirCost), {
          fontSize: '12px', fill: '#FFFFFF', fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(10);

      // Character name at bottom
      const nameText = this.add.text(cx, cardY + CARD_H / 2 - 5,
        char.name.split(' ')[0].slice(0, 8), {
          fontSize: '9px', fill: '#FFFFFF', fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(10);

      // Large interactive hit zone — full card area + extra padding for fat fingers
      const zone = this.add.zone(cx, cardY, CARD_W + 14, CARD_H + 14)
        .setInteractive({ useHandCursor: true }).setDepth(11);

      zone.on('pointerdown', (ptr) => {
        this.selectedCardIdx = i;
        this._refreshHandCards();
        audioSystem.playClick();
        this._startDrag(i, ptr);
      });

      this.handCards.push({ charId, cx, cardY, cardG, charG, elixirG, costText, nameText, zone, idx: i });
    }
    this.DECK_SIZE = totalCards;
  }

  _refreshHandCards() {
    const CW = 64, CH = 86;
    for (const card of this.handCards) {
      const char = CHARACTERS[card.charId];
      const isSelected = card.idx === this.selectedCardIdx;
      const canAfford = char && this.myElixir >= char.elixirCost;
      const rarityColor = RARITY_COLORS[char?.rarity] || 0x888888;

      card.cardG.clear();
      const alpha = canAfford ? 1 : 0.45;

      card.cardG.fillStyle(0x000000, 0.5 * alpha);
      card.cardG.fillRoundedRect(card.cx - CW / 2 + 3, card.cardY - CH / 2 + 3, CW, CH, 7);

      card.cardG.fillStyle(isSelected ? 0x1E1E3C : 0x0E0E20, alpha);
      card.cardG.fillRoundedRect(card.cx - CW / 2, card.cardY - CH / 2, CW, CH, 7);

      card.cardG.fillStyle(rarityColor, 0.7 * alpha);
      card.cardG.fillRoundedRect(card.cx - CW / 2, card.cardY + CH / 2 - 10, CW, 10, { bl: 7, br: 7, tl: 0, tr: 0 });

      card.cardG.lineStyle(isSelected ? 2.5 : 1.5, isSelected ? 0xFFD700 : rarityColor, isSelected ? alpha : 0.4 * alpha);
      card.cardG.strokeRoundedRect(card.cx - CW / 2, card.cardY - CH / 2, CW, CH, 7);

      if (isSelected) {
        card.cardG.lineStyle(5, 0xFFD700, 0.18);
        card.cardG.strokeRoundedRect(card.cx - CW / 2 - 2, card.cardY - CH / 2 - 2, CW + 4, CH + 4, 9);
      }

      card.charG.setAlpha(canAfford ? 1 : 0.3);
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
    this._ghostG = this.add.graphics().setDepth(22).setAlpha(0.75);
    const fn = DRAW_FUNCS[card.charId];
    if (fn) fn(this._ghostG);
    this._ghostG.setScale(0.68);
    this._ghostG.setPosition(ptr.x, ptr.y);

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
        this.elixirSystem.update(this.myElixir, this.overtime);
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
    this._deployZoneG?.setAlpha(0.10);
  }

  _inMyDeployZone(x, y) {
    return this.myKey === 'p1'
      ? (y >= 596 && y <= 820)
      : (y >= 38  && y <= 258);
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
    this.elixirSystem.update(this.myElixir, this.overtime);
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
    if (data.elixir) {
      const uid = this.myUserId;
      if (data.elixir[uid] !== undefined) {
        this.myElixir = data.elixir[uid];
        this.elixirSystem.update(this.myElixir, data.overtime);
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
    if (hp <= 0 && tObj.g.visible) {
      tObj.g.setAlpha(0.3);
      this._playTowerDestroyFX(tObj.pos.x, tObj.pos.y);
    }
  }

  _playTowerDestroyFX(x, y) {
    const fxG = this.add.graphics().setDepth(15);
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const r = 20 + Math.random() * 30;
      const ex = x + Math.cos(angle) * r;
      const ey = y + Math.sin(angle) * r;
      fxG.fillStyle(0xFF6600, 0.8);
      fxG.fillCircle(ex, ey, 4 + Math.random() * 4);
    }
    this.tweens.add({ targets: fxG, alpha: 0, scaleX: 2, scaleY: 2, duration: 600, onComplete: () => fxG.destroy() });
    audioSystem.playTowerDestroyed();
  }

  _syncUnits(serverUnits) {
    const serverIds = new Set(serverUnits.map(u => u.id));

    // Remove dead units
    for (const [id, uObj] of Object.entries(this.unitGraphics)) {
      if (!serverIds.has(id)) {
        this._playDeathFX(uObj.x, uObj.y);
        uObj.g.destroy();
        uObj.tintG?.destroy();
        uObj.hpBg.destroy();
        uObj.hpBar.destroy();
        delete this.unitGraphics[id];
      }
    }

    // Update or create units
    for (const u of serverUnits) {
      if (this.unitGraphics[u.id]) {
        const uObj = this.unitGraphics[u.id];
        const { height: H } = this.scale;
        const depthSc = this._unitDepthScale(u.y);
        const barW    = 36 * depthSc;

        uObj.g.setPosition(u.x, u.y).setScale(1.0 * depthSc);
        uObj.tintG.setPosition(u.x, u.y);
        uObj.tintG.clear();
        uObj.tintG.lineStyle(3, u.owner === this.myKey ? 0x44AAFF : 0xFF4444, 1);
        uObj.tintG.strokeCircle(0, 24, 18 * depthSc);

        uObj.hpBg.setPosition(u.x, u.y - 32 * depthSc).setDisplaySize(barW + 4, 6);
        uObj.hpBar.setPosition(u.x, u.y - 32 * depthSc).setDisplaySize(barW * Math.max(0, u.hp / u.maxHp), 4);
        uObj.hpBar.setFillStyle(u.owner === this.myKey ? 0x27AE60 : 0xE74C3C);
        uObj.x = u.x; uObj.y = u.y;
      } else {
        // Create new unit
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
    const { height: H } = this.scale;
    const depthSc = this._unitDepthScale(u.y);
    const BASE_SCALE = 1.0;

    const g = this.add.graphics().setDepth(5);
    g.x = u.x; g.y = u.y;

    const drawFn = DRAW_FUNCS[u.charId];
    if (drawFn) drawFn(g);
    else {
      g.fillStyle(0x888888);
      g.fillCircle(0, 0, 18);
    }
    g.setScale(BASE_SCALE * depthSc);

    // Team color ring (clean, not a heavy tint blob)
    const isMe = u.owner === this.myKey;
    const tintG = this.add.graphics().setDepth(4).setAlpha(0.70);
    tintG.x = u.x; tintG.y = u.y;
    tintG.lineStyle(3, isMe ? 0x44AAFF : 0xFF4444, 1);
    tintG.strokeCircle(0, 24, 18 * depthSc);

    // HP bar (above unit, not below — looks more modern)
    const barW = 36 * depthSc;
    const hpBg  = this.add.rectangle(u.x, u.y - 32 * depthSc, barW + 4, 6, 0x111111).setDepth(6);
    const hpBar = this.add.rectangle(u.x, u.y - 32 * depthSc, barW,     4, isMe ? 0x27AE60 : 0xE74C3C).setDepth(7).setOrigin(0.5);

    this.unitGraphics[u.id] = { g, tintG, hpBg, hpBar, x: u.x, y: u.y };
  }

  _playDeathFX(x, y) {
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
      this._showDamageNumber(evt.x, evt.y, evt.damage);
      audioSystem.playHit();
    }
    if (evt.type === 'tower_destroyed') {
      audioSystem.playTowerDestroyed();
    }
    if (evt.type === 'tower_attack') {
      audioSystem.playTowerHit();
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
