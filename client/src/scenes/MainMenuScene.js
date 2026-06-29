import Phaser from 'phaser';
import { socketManager } from '../network/SocketManager.js';
import { audioSystem } from '../systems/AudioSystem.js';

export class MainMenuScene extends Phaser.Scene {
  constructor() { super('MainMenu'); }

  create() {
    const { width: W, height: H } = this.scale;
    this.W = W; this.H = H;

    this.username = this.registry.get('username') || 'Player';
    this.gold     = Number(localStorage.getItem('bb_gold')     || this.registry.get('gold')     || 1200);
    this.trophies = Number(localStorage.getItem('bb_trophies') || 1219);
    this.gems     = Number(localStorage.getItem('bb_gems')     || 300);

    this._drawBackground();
    this._drawTopBar();
    this._drawProfileRow();
    this._drawCastleArena();
    this._drawChestRow();
    this._drawBattleBar();
    this._drawNavBar();
    this._buildInviteContainer();
    this._startAmbientParticles();

    const token = this.registry.get('token');
    if (token && !socketManager.isConnected()) socketManager.connect(token);
    socketManager.on('friend_invite', (d) => this._onFriendInvite(d));

    this.cameras.main.fadeIn(380);
    audioSystem.playTrack('battle_hymn');
  }

  // ── BACKGROUND ────────────────────────────────────────────────────────────
  _drawBackground() {
    const { W, H } = this;
    const g = this.add.graphics();

    // Deep teal base
    g.fillStyle(0x0E5A46); g.fillRect(0, 0, W, H);

    // Radial-ish glow center (castle area)
    g.fillStyle(0x1A7A5E, 0.6); g.fillEllipse(W / 2, H * 0.42, W * 1.1, H * 0.55);
    g.fillStyle(0x22906E, 0.3); g.fillEllipse(W / 2, H * 0.42, W * 0.7, H * 0.38);

    // Diamond quilted grid
    const S = 44, tG = this.add.graphics();
    tG.lineStyle(1.2, 0x0A4A38, 0.85);
    for (let i = -H - S; i < W + H + S; i += S) {
      tG.lineBetween(i, 0, i + H * 2, H * 2);
      tG.lineBetween(i + H * 2, 0, i, H * 2);
    }
    // Subtle second grid offset for "stitch" depth
    const tG2 = this.add.graphics();
    tG2.lineStyle(0.5, 0x2AA880, 0.20);
    for (let i = -H - S + 2; i < W + H + S; i += S) {
      tG2.lineBetween(i, 0, i + H * 2, H * 2);
      tG2.lineBetween(i + H * 2, 0, i, H * 2);
    }

    // Dark top strip for resource bar
    const topG = this.add.graphics();
    topG.fillStyle(0x000000, 0.62); topG.fillRect(0, 0, W, 58);
    topG.lineStyle(1, 0x0A6A4E, 0.5); topG.lineBetween(0, 58, W, 58);
  }

  // ── TOP RESOURCE BAR ──────────────────────────────────────────────────────
  _drawTopBar() {
    const { W } = this;

    // Trophy icon + count
    this._drawTrophyIcon(18, 15);
    const aG = this.add.graphics().setDepth(2);
    aG.fillStyle(0x1A44BB); aG.fillRoundedRect(36, 5, 26, 19, 4);
    this.add.text(49, 14, '14', { fontSize: '11px', fill: '#FFFFFF', fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5).setDepth(3);
    this.add.text(65, 12, String(this.trophies), { fontSize: '17px', fill: '#FFFFFF', fontFamily: 'Arial', fontStyle: 'bold' }).setDepth(2);

    // XP bar
    const xpG = this.add.graphics().setDepth(2);
    xpG.fillStyle(0x000000, 0.7); xpG.fillRoundedRect(36, 28, 98, 9, 3);
    xpG.fillStyle(0x4499FF);      xpG.fillRoundedRect(37, 29, 58, 7, 3);
    xpG.fillStyle(0xAADDFF, 0.4); xpG.fillRoundedRect(37, 29, 22, 4, 2);

    // Dividers
    const dvG = this.add.graphics().setDepth(2);
    dvG.lineStyle(1, 0x0A6A4E, 0.6);
    dvG.lineBetween(W * 0.38, 3, W * 0.38, 52);
    dvG.lineBetween(W * 0.70, 3, W * 0.70, 52);

    // Gold
    const gx = W * 0.44;
    this._drawGoldIcon(gx, 22);
    this.goldText = this.add.text(gx + 15, 12, this._fmt(this.gold),
      { fontSize: '16px', fill: '#FFE566', fontFamily: 'Arial', fontStyle: 'bold' }).setDepth(2);
    this.add.text(gx + 15 + this.goldText.width + 4, 14, '+',
      { fontSize: '12px', fill: '#888888', fontFamily: 'Arial' }).setDepth(2).setInteractive({ useHandCursor: true });

    // Gems
    const ex = W * 0.74;
    this._drawGemIcon(ex, 22);
    this.add.text(ex + 14, 12, this._fmt(this.gems),
      { fontSize: '16px', fill: '#66FF99', fontFamily: 'Arial', fontStyle: 'bold' }).setDepth(2);
    this.add.text(ex + 55, 14, '+',
      { fontSize: '12px', fill: '#888888', fontFamily: 'Arial' }).setDepth(2).setInteractive({ useHandCursor: true });
  }

  _drawTrophyIcon(x, y) {
    const g = this.add.graphics().setDepth(3);
    g.fillStyle(0xFFD700);
    g.fillRect(x, y, 22, 15); g.fillTriangle(x, y + 15, x + 11, y + 26, x + 22, y + 15);
    g.fillRect(x + 7, y + 25, 8, 5); g.fillRect(x + 4, y + 28, 14, 3);
    g.fillStyle(0xCC9900); g.fillRect(x, y, 22, 4);
    g.fillStyle(0xFFEEAA, 0.4); g.fillRect(x + 2, y + 2, 8, 4);
  }

  _drawGoldIcon(x, y) {
    const g = this.add.graphics().setDepth(2);
    g.fillStyle(0xFFCC00); g.fillCircle(x, y, 11);
    g.fillStyle(0xFFAA00); g.fillCircle(x - 1, y, 9);
    g.fillStyle(0xFFEE44); g.fillCircle(x, y, 5);
    g.fillStyle(0xFFFFAA, 0.5); g.fillCircle(x - 3, y - 3, 3);
  }

  _drawGemIcon(x, y) {
    const g = this.add.graphics().setDepth(3);
    g.fillStyle(0x00CC44); g.fillTriangle(x, y - 12, x + 11, y, x - 11, y);
    g.fillTriangle(x - 11, y, x + 11, y, x, y + 12);
    g.fillStyle(0x88FFAA, 0.55); g.fillTriangle(x, y - 12, x + 4, y - 3, x - 4, y - 3);
  }

  // ── PROFILE ROW ───────────────────────────────────────────────────────────
  _drawProfileRow() {
    const { W } = this;
    const RY = 62;

    // Avatar background
    const avG = this.add.graphics().setDepth(2);
    avG.fillStyle(0x0E2030); avG.fillRoundedRect(6, RY, 54, 54, 9);
    avG.lineStyle(2.5, 0x4499DD, 0.9); avG.strokeRoundedRect(6, RY, 54, 54, 9);
    // Helmet figure
    avG.fillStyle(0xBBBBBB); avG.fillCircle(33, RY + 17, 13);
    avG.fillStyle(0x555555); avG.fillRect(21, RY + 9, 24, 15);
    avG.fillStyle(0xBBBBBB); avG.fillRect(26, RY + 5, 14, 9);
    avG.fillStyle(0x1A44AA); avG.fillRect(21, RY + 29, 24, 18);
    // Level badge
    avG.fillStyle(0xFFD700); avG.fillRoundedRect(6, RY + 42, 54, 14, 7);
    avG.fillStyle(0xCC9900); avG.fillRoundedRect(6, RY + 48, 54, 8, 7);
    this.add.text(33, RY + 49, 'Lv 14', { fontSize: '9px', fill: '#1A0A00', fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5).setDepth(3);

    // Name + clan
    this.add.text(66, RY + 5, this.username, {
      fontSize: '17px', fill: '#FFFFFF', fontFamily: 'Arial', fontStyle: 'bold', stroke: '#000000', strokeThickness: 2
    }).setDepth(2);
    this.add.text(66, RY + 26, '♦ Battle Bros Club', { fontSize: '12px', fill: '#66CCFF', fontFamily: 'Arial' }).setDepth(2);

    // Battle Pass
    const PX = W - 164, PW = 72;
    const pG = this.add.graphics().setDepth(2);
    pG.fillStyle(0xBB8800); pG.fillRoundedRect(PX, RY, PW, 36, 7);
    pG.fillStyle(0xFFCC00); pG.fillRoundedRect(PX, RY, PW, 26, 7);
    pG.fillStyle(0xFFEE88, 0.3); pG.fillRoundedRect(PX + 4, RY + 2, PW - 8, 10, 5);
    this.add.text(PX + PW / 2, RY + 10, '⚔ PASS', { fontSize: '11px', fill: '#1A0A00', fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5).setDepth(3);
    this.add.text(PX + PW / 2, RY + 25, '4h 30m', { fontSize: '9px',  fill: '#3A1A00', fontFamily: 'Arial' }).setOrigin(0.5).setDepth(3);

    // Icon buttons (social, clipboard, menu)
    const btns = [
      { icon: '👤', x: W - 112, cb: () => this._showInvite() },
      { icon: '📋', x: W - 70,  badge: true, cb: () => {} },
      { icon: '☰',  x: W - 28,  cb: () => this._logout() },
    ];
    for (const b of btns) {
      const bg = this.add.graphics().setDepth(2);
      bg.fillStyle(0x0A1E18, 0.92); bg.fillRoundedRect(b.x - 18, RY, 36, 36, 7);
      bg.lineStyle(1.5, 0x1A6A4E, 0.7); bg.strokeRoundedRect(b.x - 18, RY, 36, 36, 7);
      this.add.text(b.x, RY + 18, b.icon, { fontSize: '18px', fill: '#FFFFFF', fontFamily: 'Arial' })
        .setOrigin(0.5).setDepth(3)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => { audioSystem.playClick(); b.cb(); });
      if (b.badge) {
        const bdG = this.add.graphics().setDepth(4);
        bdG.fillStyle(0xDD1111); bdG.fillCircle(b.x + 14, RY + 1, 7);
        this.add.text(b.x + 14, RY + 1, '!', { fontSize: '10px', fill: '#FFF', fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5).setDepth(5);
      }
    }
  }

  // ── CASTLE ARENA ─────────────────────────────────────────────────────────
  _drawCastleArena() {
    const { W, H } = this;
    const cx = W / 2, cy = H * 0.42;

    // Sky atmosphere behind castle
    const skyG = this.add.graphics().setDepth(0);
    // Radial gradient (stacked translucent rects narrowing upward)
    for (let i = 0; i < 14; i++) {
      const w2 = W * (0.95 - i * 0.04), yy = H * 0.12 + i * 24;
      skyG.fillStyle(0x001028, 0.15 - i * 0.008);
      skyG.fillRect(cx - w2 / 2, yy, w2, 26);
    }
    // Stars
    for (let i = 0; i < 60; i++) {
      const sx = (Math.abs(Math.sin(i * 73.1)) * W);
      const sy = H * 0.12 + (Math.abs(Math.cos(i * 37.7)) * H * 0.28);
      skyG.fillStyle(0xFFFFFF, 0.06 + Math.abs(Math.sin(i * 11)) * 0.22);
      skyG.fillRect(sx, sy, 1.5, 1.5);
    }
    // Castle glow halos
    skyG.fillStyle(0x1A4A8A, 0.22); skyG.fillEllipse(cx, cy + 22, 340, 120);
    skyG.fillStyle(0x2266BB, 0.10); skyG.fillEllipse(cx, cy + 10, 240, 80);
    skyG.fillStyle(0x44AAFF, 0.05); skyG.fillEllipse(cx, cy - 20, 160, 60);

    // Ground shadow
    const islandG = this.add.graphics().setDepth(1);
    islandG.fillStyle(0x000000, 0.35); islandG.fillEllipse(cx + 6, cy + 118, 340, 72);

    // Grass island (3 layers)
    islandG.fillStyle(0x0E5A1A); islandG.fillEllipse(cx, cy + 114, 306, 62);
    islandG.fillStyle(0x1A7828); islandG.fillEllipse(cx, cy + 109, 282, 52);
    islandG.fillStyle(0x22942E, 0.6); islandG.fillEllipse(cx, cy + 105, 250, 40);

    // Moat
    islandG.lineStyle(10, 0x1155DD, 0.65); islandG.strokeEllipse(cx, cy + 110, 290, 54);
    islandG.lineStyle(4,  0x4488FF, 0.28); islandG.strokeEllipse(cx, cy + 109, 272, 46);
    islandG.fillStyle(0x0033AA, 0.18);     islandG.fillEllipse(cx, cy + 110, 280, 50);

    // Castle platform
    islandG.fillStyle(0x62584E); islandG.fillEllipse(cx, cy + 100, 238, 42);
    islandG.fillStyle(0x726860); islandG.fillEllipse(cx, cy + 96,  222, 35);
    islandG.fillStyle(0x887E72, 0.3); islandG.fillEllipse(cx - 20, cy + 90, 100, 18);

    // Connecting wall
    const wallG = this.add.graphics().setDepth(2);
    wallG.fillStyle(0x7A7268); wallG.fillRect(cx - 86, cy - 10, 172, 112);
    wallG.fillStyle(0x4A484A, 0.7); wallG.fillRect(cx - 86, cy + 84, 172, 28);
    wallG.fillStyle(0x9A9288, 0.5); wallG.fillRect(cx - 86, cy - 10, 172, 14);
    // Wall stone lines
    for (let i = 1; i < 5; i++) {
      wallG.lineStyle(1, 0x5A5450, 0.4);
      wallG.lineBetween(cx - 86, cy - 10 + i * 24, cx + 86, cy - 10 + i * 24);
    }
    // Banner on wall
    wallG.fillStyle(0x0E3A99); wallG.fillRect(cx - 48, cy + 14, 96, 46);
    wallG.fillStyle(0x1A55CC); wallG.fillRect(cx - 43, cy + 18, 86, 38);
    wallG.fillStyle(0x2266EE, 0.4); wallG.fillRect(cx - 41, cy + 18, 30, 12);
    // Gold diamond on banner
    wallG.fillStyle(0xFFD700);
    wallG.fillTriangle(cx, cy + 20, cx + 16, cy + 40, cx, cy + 56);
    wallG.fillTriangle(cx, cy + 20, cx - 16, cy + 40, cx, cy + 56);
    wallG.fillStyle(0xFFAA00); wallG.fillCircle(cx, cy + 38, 6);
    wallG.fillStyle(0xFFEE88, 0.4); wallG.fillCircle(cx - 2, cy + 35, 3);

    // Guard towers and king tower
    this._drawTower(cx - 86, cy - 4,  48, 90,  false);
    this._drawTower(cx + 86, cy - 4,  48, 90,  false);
    this._drawTower(cx,      cy - 60, 66, 130, true);

    // Decorative balloons
    this._spawnBalloons(cx - 92, cy - 124);

    // Claim chest
    this._drawClaimChest(cx + 152, cy + 20);
  }

  _drawTower(x, y, w, h, isKing) {
    const g = this.add.graphics().setDepth(isKing ? 4 : 3);
    const SIDE = 11;

    // Drop shadow
    g.fillStyle(0x000000, 0.28); g.fillEllipse(x + SIDE / 2, y + 16, w + 24, 14);

    // Right side depth face
    g.fillStyle(0x3A3830); g.fillRect(x + w / 2, y - h, SIDE, h + 8);

    // Tower body
    g.fillStyle(0x908880); g.fillRect(x - w / 2, y - h, w, h);
    // Left face highlight
    g.fillStyle(0xB8B0A8, 0.6); g.fillRect(x - w / 2, y - h, w * 0.28, h);
    // Right face shadow
    g.fillStyle(0x383430, 0.55); g.fillRect(x + w * 0.22, y - h, w * 0.28, h);

    // Stone brick grid
    const rows = Math.floor(h / 14);
    for (let i = 0; i <= rows; i++) {
      g.lineStyle(1, 0x5A5650, 0.4);
      g.lineBetween(x - w / 2, y - h + i * 14, x + w / 2, y - h + i * 14);
    }

    // Blue ribbon band
    const ry = y - h * 0.52;
    g.fillStyle(0x0E3A99); g.fillRect(x - w / 2, ry - 8, w, 16);
    g.fillStyle(0x1A55CC); g.fillRect(x - w / 2, ry - 7, w - 2, 12);
    g.fillStyle(0x2266EE, 0.3); g.fillRect(x - w / 2 + 2, ry - 6, 14, 6);
    // Diamond emblem
    g.fillStyle(0xFFD700);
    g.fillTriangle(x, ry - 7, x + 8, ry, x, ry + 7);
    g.fillTriangle(x, ry - 7, x - 8, ry, x, ry + 7);
    g.fillStyle(0xFFEE88, 0.5); g.fillCircle(x, ry, 2);

    // Battlements
    const btCount = isKing ? 6 : 4;
    const btW = (w - 4) / btCount * 0.58;
    const btGap = (w - 4 - btCount * btW) / (btCount - 1);
    for (let i = 0; i < btCount; i++) {
      const bx = x - w / 2 + 2 + i * (btW + btGap);
      g.fillStyle(0x908880); g.fillRect(bx, y - h - 15, btW, 17);
      // 3D top face
      g.fillStyle(0xB8B0A8, 0.5); g.fillRect(bx, y - h - 15, btW, 5);
      g.fillStyle(0x383430, 0.4); g.fillRect(bx + btW * 0.65, y - h - 15, btW * 0.35, 17);
      // Right side
      g.fillStyle(0x3A3830, 0.5); g.fillRect(bx + btW, y - h - 15, SIDE * 0.5, 17);
    }
    // Fill battlement gaps (sky showing through)
    g.fillStyle(0x000000, 0.6);
    for (let i = 0; i < btCount - 1; i++) {
      const bx = x - w / 2 + 2 + i * (btW + btGap) + btW;
      g.fillRect(bx, y - h - 15, btGap, 15);
    }

    // Base platform
    g.fillStyle(0x4A4840); g.fillRect(x - w / 2 - 6, y + 8, w + 12 + SIDE, 13);
    g.fillStyle(0x787068, 0.5); g.fillRect(x - w / 2 - 5, y + 8, w + 10, 5);

    if (isKing) {
      // Crown
      const kx = x, ky = y - h - 17;
      g.fillStyle(0xCC9900); g.fillRect(kx - 20, ky + 2, 42, 14);
      g.fillStyle(0xFFD700); g.fillRect(kx - 19, ky, 40, 14);
      g.fillStyle(0xFFEE88, 0.35); g.fillRect(kx - 18, ky + 1, 16, 5);
      // 3 spikes
      g.fillStyle(0xFFD700);
      g.fillTriangle(kx - 17, ky, kx - 24, ky - 20, kx - 9, ky);
      g.fillTriangle(kx,      ky, kx,      ky - 25, kx + 9, ky);
      g.fillTriangle(kx + 17, ky, kx + 24, ky - 20, kx + 9, ky);
      // Spike gems
      g.fillStyle(0xFF2200);
      g.fillCircle(kx - 20, ky - 16, 5); g.fillCircle(kx + 1, ky - 20, 5); g.fillCircle(kx + 20, ky - 16, 5);
      g.fillStyle(0xFF8888, 0.5);
      g.fillCircle(kx - 20, ky - 16, 2); g.fillCircle(kx + 1, ky - 20, 2); g.fillCircle(kx + 20, ky - 16, 2);
    }
  }

  _spawnBalloons(startX, startY) {
    [
      { x: startX,      y: startY,      r: 23, col: 0xFFDD00 },
      { x: startX - 20, y: startY - 34, r: 18, col: 0xFF6600 },
    ].forEach(b => {
      const g = this.add.graphics().setDepth(5);
      g.fillStyle(b.col); g.fillCircle(b.x, b.y, b.r);
      g.fillStyle(0xFFFFFF, 0.30); g.fillCircle(b.x - b.r * 0.32, b.y - b.r * 0.32, b.r * 0.40);
      g.fillStyle(0x000000, 0.08); g.fillCircle(b.x + b.r * 0.22, b.y + b.r * 0.22, b.r * 0.25);
      g.lineStyle(1, 0x886600, 0.6); g.lineBetween(b.x, b.y + b.r, b.x + 4, b.y + b.r + 34);
      this.tweens.add({ targets: g, y: -9, duration: 1700 + Math.random() * 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: Math.random() * 500 });
    });
  }

  _drawClaimChest(x, y) {
    const g = this.add.graphics().setDepth(4);
    // Glow rings
    g.fillStyle(0xFFAA00, 0.14); g.fillCircle(x, y, 44);
    g.fillStyle(0xFFCC00, 0.08); g.fillCircle(x, y, 34);
    // Chest body
    g.fillStyle(0x7A3A08); g.fillRoundedRect(x - 28, y - 4, 56, 34, 6);
    g.fillStyle(0x553000, 0.5); g.fillRoundedRect(x - 28, y + 20, 56, 14, 6);
    // Lid
    g.fillStyle(0xA0522A); g.fillRoundedRect(x - 28, y - 22, 56, 21, 6);
    g.fillStyle(0xC0693A, 0.4); g.fillRoundedRect(x - 24, y - 20, 26, 9, 4);
    // Gold bands
    g.fillStyle(0xFFD700); g.fillRect(x - 28, y - 3, 56, 9);
    g.fillRect(x - 6, y - 22, 12, 56);
    g.fillStyle(0xFFEE88, 0.4); g.fillRect(x - 26, y - 2, 20, 4);
    // Lock
    g.fillStyle(0xFFD700); g.fillCircle(x, y + 6, 9);
    g.fillStyle(0x6A3000); g.fillCircle(x, y + 7, 5);
    g.fillStyle(0xFFCC00, 0.4); g.fillCircle(x - 2, y + 4, 2.5);

    // CLAIM button
    const claimG = this.add.graphics().setDepth(4);
    claimG.fillStyle(0xCC8800); claimG.fillRoundedRect(x - 34, y + 34, 68, 28, 7);
    claimG.fillStyle(0xFFCC00); claimG.fillRoundedRect(x - 34, y + 34, 68, 20, 7);
    claimG.fillStyle(0xFFEE88, 0.35); claimG.fillRoundedRect(x - 30, y + 36, 28, 8, 4);
    this.add.text(x, y + 48, 'CLAIM', {
      fontSize: '13px', fill: '#3A1A00', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => audioSystem.playClick());
  }

  // ── CHEST ROW ─────────────────────────────────────────────────────────────
  _drawChestRow() {
    const { W, H } = this;
    const rowY = H * 0.73;
    const slotW = 64, slotH = 74;
    const slots = [
      { type: 'ready',  label: '',       color: 0x2ECC71 },
      { type: 'silver', label: 'SILVER', color: 0xCCCCCC },
      { type: 'golden', label: 'GOLDEN', color: 0xFFD700 },
      { type: 'silver', label: 'SILVER', color: 0xCCCCCC },
    ];
    const totalW = slots.length * slotW + (slots.length - 1) * 7;
    const sx = W / 2 - totalW / 2;

    // Row bg
    const rowBg = this.add.graphics().setDepth(2);
    rowBg.fillStyle(0x000000, 0.45); rowBg.fillRoundedRect(sx - 10, rowY - slotH / 2 - 8, totalW + 20, slotH + 16, 12);
    rowBg.lineStyle(1, 0x1A5A3A, 0.5); rowBg.strokeRoundedRect(sx - 10, rowY - slotH / 2 - 8, totalW + 20, slotH + 16, 12);

    // Info button
    const iG = this.add.graphics().setDepth(3);
    iG.fillStyle(0x0A2218, 0.9); iG.fillCircle(sx + totalW + 20, rowY + slotH / 2 - 4, 13);
    iG.lineStyle(1.5, 0x2A6A4A); iG.strokeCircle(sx + totalW + 20, rowY + slotH / 2 - 4, 13);
    this.add.text(sx + totalW + 20, rowY + slotH / 2 - 4, 'i',
      { fontSize: '14px', fill: '#AACCAA', fontFamily: 'Arial', fontStyle: 'italic' }).setOrigin(0.5).setDepth(4);

    for (let i = 0; i < slots.length; i++) {
      const chX = sx + i * (slotW + 7) + slotW / 2;
      const sl  = slots[i];
      const sG  = this.add.graphics().setDepth(3);

      if (sl.type === 'ready') {
        sG.fillStyle(0x0A2A0A, 0.97); sG.fillRoundedRect(chX - slotW / 2, rowY - slotH / 2, slotW, slotH, 9);
        sG.lineStyle(2.5, 0x2ECC71, 0.9); sG.strokeRoundedRect(chX - slotW / 2, rowY - slotH / 2, slotW, slotH, 9);
        // Inner glow
        sG.lineStyle(5, 0x2ECC71, 0.14); sG.strokeRoundedRect(chX - slotW / 2 - 2, rowY - slotH / 2 - 2, slotW + 4, slotH + 4, 11);
        // Checkmark (thick)
        sG.lineStyle(5, 0x2ECC71, 1);
        sG.beginPath();
        sG.moveTo(chX - 13, rowY + 1);
        sG.lineTo(chX - 3, rowY + 12);
        sG.lineTo(chX + 15, rowY - 13);
        sG.strokePath();
      } else {
        sG.fillStyle(0x0C1C12, 0.96); sG.fillRoundedRect(chX - slotW / 2, rowY - slotH / 2, slotW, slotH, 9);
        sG.lineStyle(1, 0x2A3A2A, 0.55); sG.strokeRoundedRect(chX - slotW / 2, rowY - slotH / 2, slotW, slotH, 9);
        this._drawChestMini(sG, chX, rowY - 6, sl.color);
        this.add.text(chX, rowY + slotH / 2 - 11, sl.label, {
          fontSize: '8px', fill: sl.color === 0xFFD700 ? '#FFD700' : '#BBBBBB',
          fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(4);
      }
    }
  }

  _drawChestMini(g, x, y, color) {
    g.fillStyle(0x7A3A0A); g.fillRoundedRect(x - 19, y + 1, 38, 22, 4);
    g.fillStyle(0x9A4A10); g.fillRoundedRect(x - 19, y - 13, 38, 17, 4);
    g.fillStyle(color);    g.fillRect(x - 19, y - 1, 38, 7);
    g.fillRect(x - 5, y - 13, 10, 36);
    g.fillCircle(x, y + 8, 6.5);
    g.fillStyle(0x5A2A00); g.fillCircle(x, y + 9, 4);
    g.fillStyle(0xFFEE88, 0.35); g.fillCircle(x - 2, y + 6, 2);
  }

  // ── BATTLE BAR ────────────────────────────────────────────────────────────
  _drawBattleBar() {
    const { W, H } = this;
    const BY = H * 0.838;

    // ─ Deck button (left) ─────────────────────────────────────────────────
    const DX = W / 2 - 128;
    const dG = this.add.graphics().setDepth(3);
    dG.fillStyle(0x1A5599); dG.fillRoundedRect(DX - 30, BY - 30, 60, 60, 11);
    dG.fillStyle(0x124488); dG.fillRoundedRect(DX - 30, BY + 6,  60, 24, 11);
    dG.lineStyle(2, 0x55AAFF, 0.55); dG.strokeRoundedRect(DX - 30, BY - 30, 60, 60, 11);
    dG.fillStyle(0xFFEEEE, 0.9); dG.fillRoundedRect(DX - 14, BY - 20, 26, 34, 5);
    dG.fillStyle(0x3366BB); dG.fillCircle(DX - 1, BY - 8, 8);
    dG.fillStyle(0xBBBBBB); dG.fillRect(DX - 7, BY + 2, 12, 8);
    dG.lineStyle(1, 0xCCCCCC, 0.4); dG.strokeRoundedRect(DX - 14, BY - 20, 26, 34, 5);
    this.add.text(DX, BY + 22, '◄ ►', { fontSize: '10px', fill: '#AAAAAA', fontFamily: 'Arial' }).setOrigin(0.5).setDepth(4);
    this.add.zone(DX, BY, 60, 60).setInteractive({ useHandCursor: true }).setDepth(5)
      .on('pointerdown', () => { audioSystem.playClick(); this.cameras.main.fadeOut(260, 0,0,0); this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('CharSelect', { mode: 'deck_edit' })); });

    // ─ BATTLE button (center) ─────────────────────────────────────────────
    const BW = 188, BH = 62;
    const btG = this.add.graphics().setDepth(3);

    // Outer glow aura
    btG.fillStyle(0xFFAA00, 0.18); btG.fillRoundedRect(W/2 - BW/2 - 8, BY - BH/2 - 8, BW + 16, BH + 16, 18);
    // Shadow
    btG.fillStyle(0x000000, 0.35); btG.fillRoundedRect(W/2 - BW/2 + 3, BY - BH/2 + 5, BW, BH, 13);
    // Button body
    btG.fillStyle(0xEEAA00); btG.fillRoundedRect(W/2 - BW/2, BY - BH/2, BW, BH, 13);
    // Top highlight (2-tone for 3D feel)
    btG.fillStyle(0xFFDD44); btG.fillRoundedRect(W/2 - BW/2, BY - BH/2, BW, BH * 0.48, 13);
    // Bottom shade
    btG.fillStyle(0xAA7700); btG.fillRoundedRect(W/2 - BW/2, BY + BH * 0.20, BW, BH * 0.30, 13);
    // Sheen stripe
    btG.fillStyle(0xFFFFAA, 0.20); btG.fillRoundedRect(W/2 - BW/2 + 14, BY - BH/2 + 6, 60, 14, 8);
    // Border
    btG.lineStyle(2.5, 0xFF9900, 0.8); btG.strokeRoundedRect(W/2 - BW/2, BY - BH/2, BW, BH, 13);

    this.add.text(W/2, BY + 1, 'BATTLE', {
      fontSize: '34px', fill: '#2A1200',
      fontFamily: 'Arial Black, Arial', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 1
    }).setOrigin(0.5).setDepth(4);

    // Pulsing glow tween
    this.tweens.add({ targets: btG, alpha: 0.85, duration: 960, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.add.zone(W/2, BY, BW, BH).setInteractive({ useHandCursor: true }).setDepth(5)
      .on('pointerdown', () => {
        audioSystem.playClick();
        this.cameras.main.fadeOut(260, 0,0,0);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('CharSelect', { mode: '1v1' }));
      });

    // ─ 2v2 button (right) ─────────────────────────────────────────────────
    const RX = W/2 + 128;
    const rG = this.add.graphics().setDepth(3);
    rG.fillStyle(0xCC9900); rG.fillRoundedRect(RX - 30, BY - 30, 60, 60, 11);
    rG.fillStyle(0xFFDD00); rG.fillRoundedRect(RX - 30, BY - 30, 60, 44, 11);
    rG.fillStyle(0xFFEE88, 0.3); rG.fillRoundedRect(RX - 26, BY - 27, 24, 14, 6);
    rG.lineStyle(2, 0xFFEE44, 0.5); rG.strokeRoundedRect(RX - 30, BY - 30, 60, 60, 11);
    rG.fillStyle(0x1A3A8A);
    rG.fillTriangle(RX, BY - 24, RX + 17, BY - 24, RX, BY + 8);
    rG.fillRect(RX - 17, BY - 24, 18, 32);
    rG.fillStyle(0xFFD700); rG.fillCircle(RX, BY - 5, 9);
    rG.fillStyle(0xFF2200); rG.fillCircle(RX, BY - 5, 5);
    rG.fillStyle(0xFF8888, 0.4); rG.fillCircle(RX - 2, BY - 7, 2.5);
    this.add.text(RX, BY + 22, '2v2', { fontSize: '10px', fill: '#2A1400', fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5).setDepth(4);
    this.add.zone(RX, BY, 60, 60).setInteractive({ useHandCursor: true }).setDepth(5)
      .on('pointerdown', () => { audioSystem.playClick(); this.cameras.main.fadeOut(260, 0,0,0); this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('CharSelect', { mode: '2v2' })); });

    // ─ VS CPU button ──────────────────────────────────────────────────────
    const cpuY = BY + 44;
    const cpuG = this.add.graphics().setDepth(3);
    // Gradient bg
    cpuG.fillStyle(0x061422, 0.96); cpuG.fillRoundedRect(W/2 - 108, cpuY - 20, 216, 40, 12);
    cpuG.lineStyle(2, 0x0088CC, 0.65); cpuG.strokeRoundedRect(W/2 - 108, cpuY - 20, 216, 40, 12);
    // Inner glow
    cpuG.lineStyle(5, 0x00AAFF, 0.10); cpuG.strokeRoundedRect(W/2 - 106, cpuY - 18, 212, 36, 11);
    // Left lightning bolt
    cpuG.fillStyle(0x00CCFF, 0.9);
    cpuG.fillTriangle(W/2 - 90, cpuY - 9, W/2 - 82, cpuY - 9, W/2 - 88, cpuY + 2);
    cpuG.fillTriangle(W/2 - 88, cpuY - 2, W/2 - 80, cpuY - 2, W/2 - 86, cpuY + 9);

    const cpuLabel = this.add.text(W/2 + 4, cpuY, 'VS CPU  —  Practice Mode', {
      fontSize: '13px', fill: '#00DDFF', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(4);

    this.add.zone(W/2, cpuY, 216, 40).setInteractive({ useHandCursor: true }).setDepth(5)
      .on('pointerover', () => cpuLabel.setStyle({ fill: '#AAEEFF' }))
      .on('pointerout',  () => cpuLabel.setStyle({ fill: '#00DDFF' }))
      .on('pointerdown', () => {
        audioSystem.playClick();
        this.cameras.main.fadeOut(260, 0,0,0);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('CharSelect', { mode: 'vs_cpu' }));
      });
  }

  // ── BOTTOM NAV BAR ────────────────────────────────────────────────────────
  _drawNavBar() {
    const { W, H } = this;
    const NAV_H = 66;
    const NY = H - NAV_H;

    // Nav background with top border
    const navG = this.add.graphics().setDepth(6);
    navG.fillStyle(0x050F0A, 0.97); navG.fillRect(0, NY, W, NAV_H);
    navG.lineStyle(1.5, 0x0A4A30, 0.7); navG.lineBetween(0, NY, W, NY);
    // Subtle inner glow at top
    navG.lineStyle(3, 0x1A8855, 0.08); navG.lineBetween(0, NY + 1, W, NY + 1);

    const items = [
      { icon: '📦', label: 'Chests', x: W * 0.10, cb: () => {} },
      { icon: '🃏', label: 'Cards',  x: W * 0.30, cb: () => { this.cameras.main.fadeOut(260,0,0,0); this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('CharSelect', { mode: 'deck_edit' })); } },
      { icon: '⚔',  label: 'Battle', x: W * 0.50, active: true, cb: () => {} },
      { icon: '👥', label: 'Social', x: W * 0.70, cb: () => this._showInvite() },
      { icon: '🏆', label: 'Trophy', x: W * 0.90, cb: () => {} },
    ];

    for (const it of items) {
      const cy = NY + NAV_H / 2 - 2;
      if (it.active) {
        const indG = this.add.graphics().setDepth(7);
        indG.fillStyle(0xFFD700); indG.fillRect(it.x - 30, NY, 60, 3);
      }
      this.add.text(it.x, cy - 10, it.icon, {
        fontSize: it.active ? '25px' : '22px', fill: '#FFFFFF', fontFamily: 'Arial'
      }).setOrigin(0.5).setAlpha(it.active ? 1 : 0.42).setDepth(7);
      this.add.text(it.x, cy + 14, it.label, {
        fontSize: '9px', fill: it.active ? '#FFFFFF' : '#446644',
        fontFamily: 'Arial', fontStyle: it.active ? 'bold' : 'normal'
      }).setOrigin(0.5).setDepth(7);
      this.add.zone(it.x, cy, 76, NAV_H).setInteractive({ useHandCursor: true }).setDepth(8)
        .on('pointerdown', () => { audioSystem.playClick(); it.cb(); });
    }
  }

  // ── AMBIENT PARTICLES (floating upward sparkles) ──────────────────────────
  _startAmbientParticles() {
    const { W, H } = this;
    this._sparks = [];
    this._sparkG = this.add.graphics().setDepth(5);
    this.time.addEvent({
      delay: 220, loop: true,
      callback: () => {
        if (this._sparks.length < 22) {
          this._sparks.push({
            x: W * 0.12 + Math.random() * W * 0.76,
            y: H * 0.65 + Math.random() * H * 0.12,
            vx: (Math.random() - 0.5) * 0.4,
            vy: -(0.4 + Math.random() * 0.5),
            life: 1,
            size: 1.5 + Math.random() * 2,
            col: [0xFFD700, 0xFFCC44, 0x88FFCC, 0xFFFFAA][Math.floor(Math.random() * 4)]
          });
        }
      }
    });
  }

  update() {
    if (!this._sparks) return;
    this._sparkG.clear();
    this._sparks = this._sparks.filter(p => p.life > 0);
    for (const p of this._sparks) {
      p.x += p.vx; p.y += p.vy; p.life -= 0.012;
      if (p.life > 0) {
        this._sparkG.fillStyle(p.col, Math.min(1, p.life * 1.5));
        this._sparkG.fillRect(p.x, p.y, p.size, p.size);
      }
    }
  }

  // ── INVITE OVERLAY ────────────────────────────────────────────────────────
  _buildInviteContainer() {
    const { W, H } = this;
    this._inviteContainer = this.add.container(W / 2, H / 2 - 40).setVisible(false).setDepth(20);
    const panel = this.add.rectangle(0, 0, 320, 200, 0x0A0820, 0.97).setStrokeStyle(2, 0xFFD700);
    const title = this.add.text(0, -70, '📨  Invite a Friend', { fontSize: '18px', fill: '#FFD700', fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5);
    const hint  = this.add.text(0, -30, 'Enter their username below', { fontSize: '12px', fill: '#AAAACC', fontFamily: 'Arial' }).setOrigin(0.5);
    const send  = this.add.text(0, 40, '[ SEND INVITE ]', { fontSize: '15px', fill: '#27AE60', fontFamily: 'Arial', fontStyle: 'bold' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        const v = document.getElementById('bb-invite-input')?.value?.trim();
        if (v) { socketManager.inviteFriend(v, this.registry.get('deck') || []); this._hideInvite(); }
      });
    const close = this.add.text(0, 76, '[ CANCEL ]', { fontSize: '13px', fill: '#666688', fontFamily: 'Arial' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', () => this._hideInvite());
    this._inviteContainer.add([panel, title, hint, send, close]);
  }

  _showInvite() {
    this._inviteContainer.setVisible(true);
    document.getElementById('bb-invite-wrap')?.remove();
    const wrap = document.createElement('div');
    wrap.id = 'bb-invite-wrap';
    wrap.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-78%);z-index:201;';
    const inp = document.createElement('input');
    inp.id = 'bb-invite-input'; inp.type = 'text'; inp.placeholder = 'Enter username';
    inp.style.cssText = 'width:240px;padding:11px 14px;box-sizing:border-box;background:#111128;border:2px solid #FFD700;border-radius:8px;color:#fff;font-size:15px;outline:none;text-align:center;font-family:Arial;';
    inp.onkeydown = e => { if (e.key === 'Enter') { const v = inp.value.trim(); if (v) { socketManager.inviteFriend(v, this.registry.get('deck') || []); this._hideInvite(); } } };
    wrap.appendChild(inp); document.body.appendChild(wrap);
    this._inviteWrap = wrap;
    setTimeout(() => inp.focus(), 60);
  }

  _hideInvite() {
    this._inviteContainer?.setVisible(false);
    this._inviteWrap?.remove(); this._inviteWrap = null;
  }

  _onFriendInvite({ from, fromId }) {
    const { W, H } = this;
    const c = this.add.container(W / 2, H * 0.28).setDepth(30);
    c.add(this.add.rectangle(0, 0, 320, 140, 0x0A0820, 0.97).setStrokeStyle(2, 0xFFD700));
    c.add(this.add.text(0, -42, `${from} wants to battle!`, { fontSize: '15px', fill: '#FFD700', fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5));
    const accept = this.add.text(-66, 18, '[ ACCEPT ]', { fontSize: '15px', fill: '#27AE60', fontFamily: 'Arial', fontStyle: 'bold' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        socketManager.acceptInvite(fromId); c.destroy();
        this.cameras.main.fadeOut(280, 0,0,0);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('CharSelect', { mode: '1v1' }));
      });
    const dec = this.add.text(66, 18, '[ DECLINE ]', { fontSize: '15px', fill: '#C0392B', fontFamily: 'Arial', fontStyle: 'bold' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', () => { socketManager.declineInvite(fromId); c.destroy(); });
    c.add([accept, dec]);
    this.time.delayedCall(15000, () => { if (c.active) c.destroy(); });
  }

  _logout() {
    localStorage.removeItem('bb_token'); localStorage.removeItem('bb_username'); localStorage.removeItem('bb_gold');
    socketManager.disconnect();
    this.cameras.main.fadeOut(280, 0,0,0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Auth'));
  }

  _fmt(n) { return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }

  shutdown() { socketManager.offAll('friend_invite'); this._hideInvite(); }
}
