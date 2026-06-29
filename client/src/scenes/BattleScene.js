import Phaser from 'phaser';
import { socketManager } from '../network/SocketManager.js';
import { audioSystem } from '../systems/AudioSystem.js';
import { ElixirSystem } from '../systems/ElixirSystem.js';
import { BattleTimer } from '../systems/BattleTimer.js';
import { CHARACTERS, CHARACTER_IDS, RARITY_COLORS } from '../characters/CharacterRegistry.js';
import { DRAW_FUNCS } from '../characters/CharacterGraphics.js';
import * as EmberCrossing from '../maps/EmberCrossing.js';
import * as FrostpeakArena from '../maps/FrostpeakArena.js';

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
    this.myUserId = this.registry.get('token')
      ? JSON.parse(atob(this.registry.get('token').split('.')[1])).id
      : null;

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

    // Touch/click to deploy
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
    const { width: W, height: H } = this.scale;
    this.towerObjects = {};

    for (const playerKey of ['p1', 'p2']) {
      this.towerObjects[playerKey] = {};
      for (const towerKey of ['king', 'guardLeft', 'guardRight']) {
        const pos = TOWER_POSITIONS[playerKey][towerKey];
        const isKing = towerKey === 'king';
        const isEnemy = playerKey !== this.myKey;

        const g = this.add.graphics().setDepth(2);
        const tw = isKing ? 54 : 40, th = isKing ? 70 : 54;

        // Tower body
        g.fillStyle(isEnemy ? 0xC0392B : 0x2980B9);
        g.fillRect(pos.x - tw / 2, pos.y - th + 10, tw, th);

        // Tower top battlements
        const btColor = isEnemy ? 0x922B21 : 0x1A5276;
        g.fillStyle(btColor);
        for (let i = 0; i < 4; i++) {
          g.fillRect(pos.x - tw / 2 + i * (tw / 4), pos.y - th, tw / 5, 14);
        }

        // Tower base
        g.fillStyle(isEnemy ? 0x7B241C : 0x154360);
        g.fillRect(pos.x - tw / 2 - 4, pos.y + 8, tw + 8, 12);

        // Crown on king tower
        if (isKing) {
          g.fillStyle(0xFFD700);
          g.fillTriangle(pos.x - 10, pos.y - th - 2, pos.x, pos.y - th - 14, pos.x + 10, pos.y - th - 2);
        }

        // HP bar background
        const hpBg = this.add.rectangle(pos.x, pos.y + 20, tw + 4, 8, 0x1a1a1a).setDepth(3);
        const hpBar = this.add.rectangle(pos.x, pos.y + 20, tw, 6, isEnemy ? 0xE74C3C : 0x27AE60)
          .setDepth(4).setOrigin(0.5);

        // HP text
        const maxHp = isKing ? TOWER_MAX.king : TOWER_MAX.guard;
        const hpText = this.add.text(pos.x, pos.y + 32, String(maxHp), {
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
    const zoneG = this.add.graphics().setDepth(1).setAlpha(0.08);
    zoneG.fillStyle(0xFFFFFF);
    if (this.myKey === 'p1') {
      zoneG.fillRect(62, 596, W - 124, 220);
    } else {
      zoneG.fillRect(62, 38, W - 124, 220);
    }
  }

  _buildHandCards() {
    const { width: W, height: H } = this.scale;
    const CARD_W = 56, CARD_H = 70;
    const totalCards = Math.min(this.deck.length, DECK_SIZE);
    const startX = W / 2 - ((totalCards - 1) * (CARD_W + 6)) / 2;
    const cardY = H - 80;

    this.handCards = [];
    this.handCardGraphics = [];

    for (let i = 0; i < totalCards; i++) {
      const charId = this.deck[i];
      if (!charId) continue;
      const char = CHARACTERS[charId];
      if (!char) continue;

      const cx = startX + i * (CARD_W + 6);
      const isSelected = i === this.selectedCardIdx;

      const cardG = this.add.graphics().setDepth(8);
      const rarityColor = RARITY_COLORS[char.rarity];

      cardG.fillStyle(isSelected ? 0x2a2a4a : 0x12122a);
      cardG.fillRoundedRect(cx - CARD_W / 2, cardY - CARD_H / 2, CARD_W, CARD_H, 5);
      cardG.lineStyle(2, isSelected ? 0xFFD700 : rarityColor, isSelected ? 1 : 0.5);
      cardG.strokeRoundedRect(cx - CARD_W / 2, cardY - CARD_H / 2, CARD_W, CARD_H, 5);

      // Character mini-drawing
      const charG = this.add.graphics().setDepth(9);
      charG.x = cx; charG.y = cardY - 10;
      const fn = DRAW_FUNCS[charId];
      if (fn) fn(charG);
      charG.setScale(0.38);

      // Elixir cost
      const elixirG = this.add.graphics().setDepth(9);
      elixirG.fillStyle(0x8E44AD);
      elixirG.fillCircle(cx + CARD_W / 2 - 10, cardY - CARD_H / 2 + 10, 10);
      const costText = this.add.text(cx + CARD_W / 2 - 10, cardY - CARD_H / 2 + 10, String(char.elixirCost), {
        fontSize: '10px', fill: '#FFFFFF', fontFamily: 'Arial', fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(10);

      // Name
      const nameText = this.add.text(cx, cardY + CARD_H / 2 - 12, char.name.split(' ')[0], {
        fontSize: '8px', fill: '#AAAACC', fontFamily: 'Arial'
      }).setOrigin(0.5).setDepth(9);

      // Hit zone
      const zone = this.add.zone(cx, cardY, CARD_W, CARD_H)
        .setInteractive({ useHandCursor: true }).setDepth(11);
      zone.on('pointerdown', () => { this.selectedCardIdx = i; this._refreshHandCards(); audioSystem.playClick(); });

      this.handCards.push({ charId, cx, cardY, cardG, charG, elixirG, costText, nameText, zone, idx: i });
    }
    this.DECK_SIZE = totalCards;
  }

  _refreshHandCards() {
    for (const card of this.handCards) {
      const char = CHARACTERS[card.charId];
      const isSelected = card.idx === this.selectedCardIdx;
      const canAfford = char && this.myElixir >= char.elixirCost;
      const rarityColor = RARITY_COLORS[char?.rarity];

      card.cardG.clear();
      card.cardG.fillStyle(isSelected ? 0x2a2a4a : 0x12122a, canAfford ? 1 : 0.5);
      card.cardG.fillRoundedRect(card.cx - 28, card.cardY - 35, 56, 70, 5);
      card.cardG.lineStyle(2, isSelected ? 0xFFD700 : (rarityColor || 0x888888), isSelected ? 1 : 0.4);
      card.cardG.strokeRoundedRect(card.cx - 28, card.cardY - 35, 56, 70, 5);
      card.charG.setAlpha(canAfford ? 1 : 0.4);
    }
  }

  _buildDeployIndicator(x, y) {
    // Flash a small ring where the unit was deployed
    const ring = this.add.graphics().setDepth(7);
    ring.lineStyle(3, 0xFFFFFF, 0.8);
    ring.strokeCircle(x, y, 20);
    this.tweens.add({
      targets: ring, alpha: 0, scaleX: 2, scaleY: 2,
      duration: 400, onComplete: () => ring.destroy()
    });
  }

  _onTap(ptr) {
    if (this.gameOver) return;

    const { width: W, height: H } = this.scale;

    // Check if tapping on a hand card (y > H - 120)
    if (ptr.y > H - 120) return;

    // Deploy zone check
    const inMyZone = this.myKey === 'p1'
      ? (ptr.y >= 596 && ptr.y <= 820)
      : (ptr.y >= 38 && ptr.y <= 258);

    if (!inMyZone) return;

    const selCard = this.handCards[this.selectedCardIdx];
    if (!selCard) return;

    const char = CHARACTERS[selCard.charId];
    if (!char) return;
    if (this.myElixir < char.elixirCost) {
      this._showNotEnoughElixir();
      return;
    }

    // Deploy
    const charLevel = 1; // TODO: use actual level from charData
    socketManager.deployUnit(selCard.charId, Math.round(ptr.x), Math.round(ptr.y), charLevel);
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
        uObj.hpBg.destroy();
        uObj.hpBar.destroy();
        delete this.unitGraphics[id];
      }
    }

    // Update or create units
    for (const u of serverUnits) {
      if (this.unitGraphics[u.id]) {
        // Update position and HP
        const uObj = this.unitGraphics[u.id];
        uObj.g.x = u.x; uObj.g.y = u.y;
        uObj.hpBg.setPosition(u.x, u.y + 28);
        uObj.hpBar.setPosition(u.x, u.y + 28);
        uObj.x = u.x; uObj.y = u.y;

        const pct = Math.max(0, u.hp / u.maxHp);
        uObj.hpBar.setDisplaySize(30 * pct, 4);
        uObj.hpBar.setFillStyle(u.owner === this.myKey ? 0x27AE60 : 0xE74C3C);
      } else {
        // Create new unit
        this._createUnitGraphic(u);
      }
    }
  }

  _createUnitGraphic(u) {
    const g = this.add.graphics().setDepth(5);
    g.x = u.x; g.y = u.y;

    const drawFn = DRAW_FUNCS[u.charId];
    if (drawFn) drawFn(g);
    else {
      g.fillStyle(0x888888);
      g.fillCircle(0, 0, 16);
    }
    g.setScale(0.6);

    // Team tint overlay
    const tintG = this.add.graphics().setDepth(5).setAlpha(0.18);
    tintG.fillStyle(u.owner === this.myKey ? 0x0000FF : 0xFF0000);
    tintG.fillCircle(u.x, u.y, 18);

    // HP bar
    const hpBg = this.add.rectangle(u.x, u.y + 28, 32, 5, 0x111111).setDepth(6);
    const hpBar = this.add.rectangle(u.x, u.y + 28, 30, 4, 0x27AE60).setDepth(7).setOrigin(0.5);

    this.unitGraphics[u.id] = { g, tintG, hpBg, hpBar, x: u.x, y: u.y };
  }

  _playDeathFX(x, y) {
    const g = this.add.graphics().setDepth(15);
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 10 + Math.random() * 15;
      g.fillStyle(0xFFAA00, 0.7);
      g.fillCircle(x + Math.cos(angle) * r, y + Math.sin(angle) * r, 3 + Math.random() * 3);
    }
    this.tweens.add({ targets: g, alpha: 0, duration: 350, onComplete: () => g.destroy() });
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
    const txt = this.add.text(x, y - 20, `-${dmg}`, {
      fontSize: '13px', fill: '#FF6B6B',
      fontFamily: 'Arial', fontStyle: 'bold',
      stroke: '#1a1a1a', strokeThickness: 3
    }).setOrigin(0.5).setDepth(18);

    this.tweens.add({
      targets: txt, y: txt.y - 40, alpha: 0, duration: 900,
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

const DECK_SIZE = 7;
