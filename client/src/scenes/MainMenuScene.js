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

    const token = this.registry.get('token');
    if (token && !socketManager.isConnected()) socketManager.connect(token);
    socketManager.on('friend_invite', (d) => this._onFriendInvite(d));

    this.cameras.main.fadeIn(300);
    audioSystem.playTrack('battle_hymn');
  }

  // ── BACKGROUND: teal diamond quilted ──────────────────────────────────────
  _drawBackground() {
    const { W, H } = this;
    const g = this.add.graphics();

    // Base teal
    g.fillStyle(0x186b54);
    g.fillRect(0, 0, W, H);

    // Diamond grid via two sets of crossing diagonals
    const S = 46;
    g.lineStyle(1.5, 0x0d5040, 0.9);
    for (let i = -H - S; i < W + H + S; i += S) {
      g.lineBetween(i, 0, i + H * 2, H * 2);
      g.lineBetween(i + H * 2, 0, i, H * 2);
    }

    // Subtle highlight lines (offset by 2px to give 3-D "stitch" illusion)
    const hg = this.add.graphics();
    hg.lineStyle(0.5, 0x2a8a6e, 0.28);
    for (let i = -H - S + 2; i < W + H + S; i += S) {
      hg.lineBetween(i, 0, i + H * 2, H * 2);
      hg.lineBetween(i + H * 2, 0, i, H * 2);
    }

    // Dark top gradient bar behind resource bar
    const tg = this.add.graphics();
    tg.fillStyle(0x000000, 0.55);
    tg.fillRect(0, 0, W, 54);
  }

  // ── TOP RESOURCE BAR ──────────────────────────────────────────────────────
  _drawTopBar() {
    const { W } = this;

    // ─ Trophy section ─────────────────────────────────────────────────────
    this._drawTrophyIcon(20, 17);

    // Arena level badge (left of trophy count)
    const arenaBg = this.add.graphics().setDepth(2);
    arenaBg.fillStyle(0x2255BB);
    arenaBg.fillRoundedRect(36, 6, 26, 18, 4);
    this.add.text(49, 15, '14', {
      fontSize: '11px', fill: '#FFFFFF', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3);

    this.add.text(66, 14, String(this.trophies), {
      fontSize: '16px', fill: '#FFFFFF', fontFamily: 'Arial', fontStyle: 'bold'
    }).setDepth(2);

    // XP progress bar
    const progG = this.add.graphics().setDepth(2);
    progG.fillStyle(0x0a1a10, 0.8);
    progG.fillRoundedRect(36, 28, 100, 8, 3);
    progG.fillStyle(0x4499FF);
    progG.fillRoundedRect(36, 28, 60, 8, 3);

    // ─ Gold section ───────────────────────────────────────────────────────
    const gx = W * 0.44;
    const goldG = this.add.graphics().setDepth(2);
    goldG.fillStyle(0xFFCC00);
    goldG.fillCircle(gx, 22, 11);
    goldG.fillStyle(0xFFAA00);
    goldG.fillCircle(gx - 1, 21, 8);
    goldG.fillStyle(0xFFEE44);
    goldG.fillCircle(gx, 22, 5);

    this.goldText = this.add.text(gx + 14, 13, this._fmt(this.gold), {
      fontSize: '15px', fill: '#FFE566', fontFamily: 'Arial', fontStyle: 'bold'
    }).setDepth(2);
    this.add.text(gx + 14 + this.goldText.width + 3, 15, '+', {
      fontSize: '12px', fill: '#AAAAAA', fontFamily: 'Arial'
    }).setDepth(2).setInteractive({ useHandCursor: true });

    // Dividers
    const dvG = this.add.graphics().setDepth(2);
    dvG.lineStyle(1, 0x1a5540, 0.7);
    dvG.lineBetween(W * 0.38, 4, W * 0.38, 48);
    dvG.lineBetween(W * 0.7, 4, W * 0.7, 48);

    // ─ Gems section ───────────────────────────────────────────────────────
    const ex = W * 0.74;
    this._drawGemIcon(ex, 22);
    this.add.text(ex + 14, 13, this._fmt(this.gems), {
      fontSize: '15px', fill: '#66FF88', fontFamily: 'Arial', fontStyle: 'bold'
    }).setDepth(2);
    this.add.text(ex + 14 + 42, 15, '+', {
      fontSize: '12px', fill: '#AAAAAA', fontFamily: 'Arial'
    }).setDepth(2).setInteractive({ useHandCursor: true });
  }

  _drawTrophyIcon(x, y) {
    const g = this.add.graphics().setDepth(3);
    g.fillStyle(0xFFD700);
    g.fillRect(x, y, 22, 16);
    g.fillTriangle(x, y + 16, x + 11, y + 28, x + 22, y + 16);
    g.fillRect(x + 7, y + 26, 8, 5);
    g.fillRect(x + 4, y + 29, 14, 3);
    g.fillStyle(0xCC9900);
    g.fillRect(x, y, 22, 4);
  }

  _drawGemIcon(x, y) {
    const g = this.add.graphics().setDepth(3);
    g.fillStyle(0x22CC44);
    g.fillTriangle(x, y - 12, x + 10, y, x - 10, y);
    g.fillTriangle(x - 10, y, x + 10, y, x, y + 12);
    g.fillStyle(0x88FFAA, 0.55);
    g.fillTriangle(x, y - 12, x + 4, y - 4, x - 4, y - 4);
  }

  // ── PROFILE ROW ───────────────────────────────────────────────────────────
  _drawProfileRow() {
    const { W } = this;
    const ROW_Y = 56;

    // ─ Avatar frame ─────────────────────────────────────────────────────
    const avG = this.add.graphics().setDepth(2);
    avG.fillStyle(0x1a2a4a);
    avG.fillRoundedRect(6, ROW_Y, 52, 52, 8);
    avG.lineStyle(2, 0x4488CC, 0.9);
    avG.strokeRoundedRect(6, ROW_Y, 52, 52, 8);

    // Tiny knight face
    avG.fillStyle(0xBBBBBB);
    avG.fillCircle(32, ROW_Y + 17, 13);
    avG.fillStyle(0x666666);
    avG.fillRect(20, ROW_Y + 10, 24, 16);
    avG.fillStyle(0xBBBBBB);
    avG.fillRect(26, ROW_Y + 6, 12, 8);
    avG.fillStyle(0x2244AA);
    avG.fillRect(20, ROW_Y + 30, 24, 18);

    // Level bar at bottom of avatar
    avG.fillStyle(0xFFD700);
    avG.fillRoundedRect(6, ROW_Y + 42, 52, 14, 6);
    this.add.text(32, ROW_Y + 49, 'Lv 14', {
      fontSize: '9px', fill: '#1A0A00', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3);

    // Player name + clan
    this.add.text(64, ROW_Y + 6, this.username, {
      fontSize: '16px', fill: '#FFFFFF', fontFamily: 'Arial', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2
    }).setDepth(2);
    this.add.text(64, ROW_Y + 27, '♦ Battle Bros Club', {
      fontSize: '12px', fill: '#88DDFF', fontFamily: 'Arial'
    }).setDepth(2);

    // ─ Top-right icon buttons ────────────────────────────────────────────
    const btnDefs = [
      { icon: '👤', x: W - 110, cb: () => this._showInvite() },
      { icon: '📋', x: W - 68,  badge: true, cb: () => {} },
      { icon: '☰',  x: W - 26,  cb: () => this._logout() },
    ];
    for (const b of btnDefs) {
      const bg = this.add.graphics().setDepth(2);
      bg.fillStyle(0x0d2218, 0.9);
      bg.fillRoundedRect(b.x - 18, ROW_Y, 36, 36, 6);
      bg.lineStyle(1, 0x2a5a3a, 0.7);
      bg.strokeRoundedRect(b.x - 18, ROW_Y, 36, 36, 6);
      this.add.text(b.x, ROW_Y + 18, b.icon, {
        fontSize: '18px', fill: '#FFFFFF', fontFamily: 'Arial'
      }).setOrigin(0.5).setDepth(3).setInteractive({ useHandCursor: true }).on('pointerdown', () => { audioSystem.playClick(); b.cb(); });
      if (b.badge) {
        const bdg = this.add.graphics().setDepth(4);
        bdg.fillStyle(0xDD1111); bdg.fillCircle(b.x + 14, ROW_Y + 2, 7);
        this.add.text(b.x + 14, ROW_Y + 2, '!', {
          fontSize: '10px', fill: '#FFF', fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(5);
      }
    }

    // ─ Battle Pass button ─────────────────────────────────────────────────
    const passX = W - 156, passW = 36;
    const passG = this.add.graphics().setDepth(2);
    passG.fillStyle(0xCC9900);
    passG.fillRoundedRect(passX - passW, ROW_Y, passW * 2, 36, 6);
    passG.fillStyle(0xFFCC00);
    passG.fillRoundedRect(passX - passW, ROW_Y, passW * 2, 26, 6);
    this.add.text(passX, ROW_Y + 10, '⚔ PASS', {
      fontSize: '11px', fill: '#1A0A00', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3);
    this.add.text(passX, ROW_Y + 25, '4h 30m', {
      fontSize: '9px', fill: '#3A1A00', fontFamily: 'Arial'
    }).setOrigin(0.5).setDepth(3);
  }

  // ── CASTLE ARENA ─────────────────────────────────────────────────────────
  _drawCastleArena() {
    const { W, H } = this;
    const cx = W / 2;
    const cy = H * 0.415;

    // ─ Sky / atmosphere behind castle ─────────────────────────────────────
    const sky = this.add.graphics().setDepth(0);
    // Dark sky gradient (simulated with stacked rects at decreasing alpha)
    for (let i = 0; i < 12; i++) {
      const yy = H * 0.11 + i * 28;
      sky.fillStyle(0x000818, 0.18 - i * 0.012);
      sky.fillRect(0, yy, W, 30);
    }
    // Star field
    for (let i = 0; i < 50; i++) {
      const sx = Math.random() * W;
      const sy = H * 0.11 + Math.random() * H * 0.28;
      sky.fillStyle(0xFFFFFF, 0.06 + Math.random() * 0.22);
      sky.fillRect(sx, sy, 1, 1);
    }
    // Horizon glow behind castle
    sky.fillStyle(0x1A3A6A, 0.28); sky.fillEllipse(cx, cy + 30, 320, 120);
    sky.fillStyle(0x2255AA, 0.12); sky.fillEllipse(cx, cy + 20, 260, 90);

    // ─ Ground shadow ──────────────────────────────────────────────────────
    const bg = this.add.graphics().setDepth(1);
    bg.fillStyle(0x000000, 0.3);
    bg.fillEllipse(cx, cy + 120, 320, 70);

    // ─ Grass island ───────────────────────────────────────────────────────
    bg.fillStyle(0x1f6b2a);
    bg.fillEllipse(cx, cy + 112, 298, 60);
    bg.fillStyle(0x2a8a36);
    bg.fillEllipse(cx, cy + 107, 276, 50);

    // Moat (blue water ring)
    bg.lineStyle(9, 0x1155CC, 0.7);
    bg.strokeEllipse(cx, cy + 107, 276, 50);
    bg.lineStyle(4, 0x4488FF, 0.3);
    bg.strokeEllipse(cx, cy + 107, 260, 44);

    // ─ Castle platform ────────────────────────────────────────────────────
    bg.fillStyle(0x6a5e50);
    bg.fillEllipse(cx, cy + 100, 230, 40);
    bg.fillStyle(0x7a6e5e);
    bg.fillEllipse(cx, cy + 96, 215, 34);

    // ─ Connecting wall ────────────────────────────────────────────────────
    const wall = this.add.graphics().setDepth(2);
    wall.fillStyle(0x8a8278);
    wall.fillRect(cx - 84, cy - 10, 168, 108);
    // Wall depth (bottom)
    wall.fillStyle(0x5a5650);
    wall.fillRect(cx - 84, cy + 82, 168, 26);
    // Wall highlight (top)
    wall.fillStyle(0xA09890, 0.5);
    wall.fillRect(cx - 84, cy - 10, 168, 14);

    // Stone lines on wall
    wall.lineStyle(1, 0x6e6660, 0.5);
    for (let i = 1; i < 5; i++) {
      wall.lineBetween(cx - 84, cy - 10 + i * 22, cx + 84, cy - 10 + i * 22);
    }

    // Blue banner on wall
    wall.fillStyle(0x1244AA);
    wall.fillRect(cx - 46, cy + 16, 92, 44);
    wall.fillStyle(0x1A55CC);
    wall.fillRect(cx - 41, cy + 20, 82, 36);

    // Gold diamond emblem on banner
    wall.fillStyle(0xFFD700);
    wall.fillTriangle(cx, cy + 22, cx + 13, cy + 38, cx, cy + 54);
    wall.fillTriangle(cx, cy + 22, cx - 13, cy + 38, cx, cy + 54);
    wall.fillStyle(0xFFAA00);
    wall.fillCircle(cx, cy + 38, 5);

    // ─ Guard tower LEFT ───────────────────────────────────────────────────
    this._drawTower(cx - 84, cy - 4, 46, 88, false);

    // ─ Guard tower RIGHT ──────────────────────────────────────────────────
    this._drawTower(cx + 84, cy - 4, 46, 88, false);

    // ─ King tower (center, tallest) ───────────────────────────────────────
    this._drawTower(cx, cy - 58, 62, 124, true);

    // ─ Balloons (decorative) ──────────────────────────────────────────────
    this._spawnBalloons(cx - 90, cy - 120);

    // ─ Chest on the right (claimable) ────────────────────────────────────
    this._drawClaimChest(cx + 148, cy + 24);
  }

  _drawTower(x, y, w, h, isKing) {
    const g = this.add.graphics().setDepth(isKing ? 4 : 3);

    // Tower body
    g.fillStyle(0x9a9082);
    g.fillRect(x - w / 2, y - h, w, h);

    // Left face highlight
    g.fillStyle(0xB0A496, 0.55);
    g.fillRect(x - w / 2, y - h, w * 0.32, h);

    // Right face shadow
    g.fillStyle(0x50504A, 0.5);
    g.fillRect(x + w * 0.18, y - h, w * 0.32, h);

    // Horizontal mortar lines
    g.lineStyle(1, 0x6e6860, 0.5);
    const rows = isKing ? 7 : 5;
    for (let i = 1; i <= rows; i++) {
      g.lineBetween(x - w / 2, y - h + i * (h / rows), x + w / 2, y - h + i * (h / rows));
    }

    // Blue ribbon band
    const ry = y - h * 0.52;
    g.fillStyle(0x1244AA);
    g.fillRect(x - w / 2, ry - 7, w, 14);
    // Gold diamond on ribbon
    g.fillStyle(0xFFD700);
    g.fillTriangle(x, ry - 7, x + 7, ry, x, ry + 7);
    g.fillTriangle(x, ry - 7, x - 7, ry, x, ry + 7);

    // Battlements
    const btCount = isKing ? 5 : 4;
    const btW = (w - 4) / btCount * 0.6;
    const btGap = (w - 4 - btCount * btW) / (btCount - 1);
    for (let i = 0; i < btCount; i++) {
      const bx = x - w / 2 + 2 + i * (btW + btGap);
      g.fillStyle(0x9a9082);
      g.fillRect(bx, y - h - 14, btW, 16);
      g.fillStyle(0xB0A496, 0.4);
      g.fillRect(bx, y - h - 14, btW, 4);
      g.fillStyle(0x50504A, 0.3);
      g.fillRect(bx + btW * 0.6, y - h - 14, btW * 0.4, 16);
    }

    // Gap fill between battlements top
    g.fillStyle(0x050505, 0.5);
    for (let i = 0; i < btCount - 1; i++) {
      const bx = x - w / 2 + 2 + i * (btW + btGap) + btW;
      g.fillRect(bx, y - h - 14, btGap, 14);
    }

    if (isKing) {
      // Gold crown
      g.fillStyle(0xFFD700);
      const kx = x, ky = y - h - 16;
      // Crown base
      g.fillRect(kx - 18, ky, 36, 12);
      // 3 spikes
      g.fillTriangle(kx - 16, ky, kx - 22, ky - 18, kx - 10, ky);
      g.fillTriangle(kx, ky, kx, ky - 22, kx + 8, ky);
      g.fillTriangle(kx + 16, ky, kx + 22, ky - 18, kx + 8, ky);
      // Gems on spikes
      g.fillStyle(0xFF2200);
      g.fillCircle(kx - 18, ky - 14, 4);
      g.fillCircle(kx + 2, ky - 18, 4);
      g.fillCircle(kx + 18, ky - 14, 4);
      // Crown highlight
      g.fillStyle(0xFFEE88, 0.4);
      g.fillRect(kx - 16, ky + 1, 32, 4);
    }
  }

  _spawnBalloons(startX, startY) {
    const configs = [
      { x: startX, y: startY, r: 22, col: 0xFFDD00 },
      { x: startX - 18, y: startY - 30, r: 17, col: 0xFF6600 },
    ];
    configs.forEach(b => {
      const g = this.add.graphics().setDepth(5);
      g.fillStyle(b.col); g.fillCircle(b.x, b.y, b.r);
      g.fillStyle(0xFFFFFF, 0.28); g.fillCircle(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.38);
      g.fillStyle(0x000000, 0.08); g.fillCircle(b.x + b.r * 0.2, b.y + b.r * 0.25, b.r * 0.25);
      g.lineStyle(1, 0x886600, 0.7);
      g.lineBetween(b.x, b.y + b.r, b.x + 4, b.y + b.r + 32);
      this.tweens.add({ targets: g, y: -8, duration: 1600 + Math.random() * 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: Math.random() * 400 });
    });
  }

  _drawClaimChest(x, y) {
    const g = this.add.graphics().setDepth(4);
    // Glow ring
    g.fillStyle(0xFFAA00, 0.18); g.fillCircle(x, y, 38);
    // Chest body
    g.fillStyle(0x8B4513); g.fillRoundedRect(x - 26, y - 6, 52, 32, 5);
    // Lid
    g.fillStyle(0xA0522D); g.fillRoundedRect(x - 26, y - 22, 52, 20, 5);
    // Gold straps
    g.fillStyle(0xFFD700); g.fillRect(x - 26, y - 4, 52, 8);
    g.fillRect(x - 5, y - 22, 10, 54);
    // Lock
    g.fillStyle(0xFFD700); g.fillCircle(x, y + 4, 8);
    g.fillStyle(0x6a3000); g.fillCircle(x, y + 5, 4.5);

    // "CLAIM" button under chest
    const claimBg = this.add.graphics().setDepth(4);
    claimBg.fillStyle(0xFFCC00);
    claimBg.fillRoundedRect(x - 32, y + 32, 64, 26, 6);
    claimBg.fillStyle(0xFFAA00);
    claimBg.fillRoundedRect(x - 32, y + 44, 64, 14, 6);
    this.add.text(x, y + 45, 'CLAIM', {
      fontSize: '13px', fill: '#3A1A00', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(5);
  }

  // ── CHEST ROW ─────────────────────────────────────────────────────────────
  _drawChestRow() {
    const { W, H } = this;
    const rowY = H * 0.73;
    const slotW = 62, slotH = 72;
    const slots = [
      { type: 'ready',  label: '', color: 0x2ECC71 },
      { type: 'silver', label: 'SILVER', color: 0xCCCCCC },
      { type: 'golden', label: 'GOLDEN', color: 0xFFD700 },
      { type: 'silver', label: 'SILVER', color: 0xCCCCCC },
    ];

    const totalW = slots.length * slotW + (slots.length - 1) * 6;
    const sx = W / 2 - totalW / 2;

    // Row container
    const rowBg = this.add.graphics().setDepth(2);
    rowBg.fillStyle(0x000000, 0.42);
    rowBg.fillRoundedRect(sx - 8, rowY - slotH / 2 - 6, totalW + 16, slotH + 12, 10);
    rowBg.lineStyle(1, 0x1a4a2a, 0.5);
    rowBg.strokeRoundedRect(sx - 8, rowY - slotH / 2 - 6, totalW + 16, slotH + 12, 10);

    // Info "i" button
    const iBg = this.add.graphics().setDepth(3);
    iBg.fillStyle(0x0a2218, 0.9);
    iBg.fillCircle(sx + totalW + 18, rowY + slotH / 2 - 4, 12);
    iBg.lineStyle(1, 0x2a5a3a);
    iBg.strokeCircle(sx + totalW + 18, rowY + slotH / 2 - 4, 12);
    this.add.text(sx + totalW + 18, rowY + slotH / 2 - 4, 'i', {
      fontSize: '13px', fill: '#AACCAA', fontFamily: 'Arial', fontStyle: 'italic'
    }).setOrigin(0.5).setDepth(4);

    for (let i = 0; i < slots.length; i++) {
      const cx = sx + i * (slotW + 6) + slotW / 2;
      const sl = slots[i];
      const sg = this.add.graphics().setDepth(3);

      if (sl.type === 'ready') {
        sg.fillStyle(0x1a3a1a, 0.98);
        sg.fillRoundedRect(cx - slotW / 2, rowY - slotH / 2, slotW, slotH, 7);
        sg.lineStyle(2, 0x2ECC71, 0.9);
        sg.strokeRoundedRect(cx - slotW / 2, rowY - slotH / 2, slotW, slotH, 7);
        // Checkmark
        sg.lineStyle(4, 0x2ECC71, 1);
        sg.beginPath();
        sg.moveTo(cx - 12, rowY);
        sg.lineTo(cx - 3, rowY + 10);
        sg.lineTo(cx + 14, rowY - 12);
        sg.strokePath();
      } else {
        sg.fillStyle(0x0e1e14, 0.95);
        sg.fillRoundedRect(cx - slotW / 2, rowY - slotH / 2, slotW, slotH, 7);
        sg.lineStyle(1, 0x2a3a2a, 0.6);
        sg.strokeRoundedRect(cx - slotW / 2, rowY - slotH / 2, slotW, slotH, 7);
        this._drawChestMini(sg, cx, rowY - 6, sl.color);
        this.add.text(cx, rowY + slotH / 2 - 12, sl.label, {
          fontSize: '8px', fill: sl.color === 0xFFD700 ? '#FFD700' : '#BBBBBB',
          fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(4);
      }
    }
  }

  _drawChestMini(g, x, y, color) {
    const cw = 36, ch = 24;
    g.fillStyle(0x7a3a0a); g.fillRoundedRect(x - cw / 2, y, cw, ch, 4);
    g.fillStyle(0x9a4a10); g.fillRoundedRect(x - cw / 2, y - 13, cw, 16, 4);
    g.fillStyle(color);   g.fillRect(x - cw / 2, y - 1, cw, 6);
    g.fillRect(x - 4, y - 13, 8, ch + 13);
    g.fillCircle(x, y + 6, 6);
    g.fillStyle(0x5a2a00); g.fillCircle(x, y + 7, 3.5);
  }

  // ── BATTLE BAR ────────────────────────────────────────────────────────────
  _drawBattleBar() {
    const { W, H } = this;
    const BY = H * 0.838;

    // ─ DECK button (left) ─────────────────────────────────────────────────
    const DX = W / 2 - 126;
    const dg = this.add.graphics().setDepth(3);
    dg.fillStyle(0x2266BB);
    dg.fillRoundedRect(DX - 28, BY - 28, 56, 56, 10);
    dg.fillStyle(0x1A4A99);
    dg.fillRoundedRect(DX - 28, BY + 4, 56, 24, 10);
    dg.lineStyle(2, 0x55AAFF, 0.5);
    dg.strokeRoundedRect(DX - 28, BY - 28, 56, 56, 10);

    // Card stack icon
    dg.fillStyle(0x1a3355); dg.fillRoundedRect(DX - 12, BY - 18, 24, 32, 4);
    dg.fillStyle(0xCCCCCC); dg.fillRoundedRect(DX - 16, BY - 22, 24, 32, 4);
    dg.fillStyle(0xEEEEEE); dg.fillRoundedRect(DX - 14, BY - 20, 24, 32, 4);
    dg.lineStyle(1, 0xCCCCCC, 0.4); dg.strokeRoundedRect(DX - 14, BY - 20, 24, 32, 4);
    // Knight on card
    dg.fillStyle(0x3366BB); dg.fillCircle(DX - 2, BY - 10, 7);
    dg.fillStyle(0xBBBBBB); dg.fillRect(DX - 8, BY, 12, 8);
    this.add.text(DX, BY + 16, '◄ ►', {
      fontSize: '10px', fill: '#AAAAAA', fontFamily: 'Arial'
    }).setOrigin(0.5).setDepth(4);

    this.add.zone(DX, BY, 56, 56).setInteractive({ useHandCursor: true }).setDepth(5)
      .on('pointerdown', () => { audioSystem.playClick(); this.scene.start('CharSelect', { mode: 'deck_edit' }); });

    // ─ BATTLE button (center) ─────────────────────────────────────────────
    const BW = 180, BH = 60;
    const battleG = this.add.graphics().setDepth(3);

    // Outer glow pulse
    battleG.fillStyle(0xFFAA00, 0.22);
    battleG.fillRoundedRect(W / 2 - BW / 2 - 6, BY - BH / 2 - 6, BW + 12, BH + 12, 16);

    // Button body
    battleG.fillStyle(0xFFCC00);
    battleG.fillRoundedRect(W / 2 - BW / 2, BY - BH / 2, BW, BH, 12);
    // Top highlight
    battleG.fillStyle(0xFFEE44);
    battleG.fillRoundedRect(W / 2 - BW / 2, BY - BH / 2, BW, BH * 0.5, 12);
    // Bottom shadow
    battleG.fillStyle(0xBB8800);
    battleG.fillRoundedRect(W / 2 - BW / 2, BY + BH * 0.16, BW, BH * 0.34, 12);
    battleG.lineStyle(2, 0xFF9900, 0.7);
    battleG.strokeRoundedRect(W / 2 - BW / 2, BY - BH / 2, BW, BH, 12);

    this.add.text(W / 2, BY, 'BATTLE', {
      fontSize: '32px', fill: '#5A2800',
      fontFamily: 'Arial Black, Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(4);

    // Pulsing glow tween
    this.tweens.add({ targets: battleG, alpha: 0.88, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.add.zone(W / 2, BY, BW, BH).setInteractive({ useHandCursor: true }).setDepth(5)
      .on('pointerdown', () => {
        audioSystem.playClick();
        this.cameras.main.fadeOut(260, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('CharSelect', { mode: '1v1' }));
      });

    // ─ Rank button (right) ─────────────────────────────────────────────────
    const RX = W / 2 + 126;
    const rg = this.add.graphics().setDepth(3);
    rg.fillStyle(0xFFCC00);
    rg.fillRoundedRect(RX - 28, BY - 28, 56, 56, 10);
    rg.fillStyle(0xBB8800);
    rg.fillRoundedRect(RX - 28, BY + 4, 56, 24, 10);
    rg.lineStyle(2, 0xFFEE44, 0.5);
    rg.strokeRoundedRect(RX - 28, BY - 28, 56, 56, 10);

    // Shield icon
    rg.fillStyle(0x1A3A8A);
    rg.fillTriangle(RX, BY - 22, RX + 16, BY - 22, RX, BY + 6);
    rg.fillRect(RX - 16, BY - 22, 17, 28);
    rg.fillStyle(0xFFD700);
    rg.fillCircle(RX, BY - 4, 8);
    rg.fillStyle(0xFF2200);
    rg.fillCircle(RX, BY - 4, 4);

    this.add.text(RX, BY + 20, '2v2', {
      fontSize: '10px', fill: '#331100', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(4);

    this.add.zone(RX, BY, 56, 56).setInteractive({ useHandCursor: true }).setDepth(5)
      .on('pointerdown', () => { audioSystem.playClick(); this.scene.start('CharSelect', { mode: '2v2' }); });

    // ─ VS CPU button (below main battle button) ────────────────────────────
    const cpuY = BY + 42;
    const cpuG = this.add.graphics().setDepth(3);
    cpuG.fillStyle(0x0a1a22, 0.95);
    cpuG.fillRoundedRect(W / 2 - 100, cpuY - 18, 200, 36, 10);
    cpuG.lineStyle(1.5, 0x00CCFF, 0.5);
    cpuG.strokeRoundedRect(W / 2 - 100, cpuY - 18, 200, 36, 10);

    const cpuLabel = this.add.text(W / 2, cpuY, '⚡  VS CPU  —  Practice Mode', {
      fontSize: '13px', fill: '#00DDFF',
      fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(4);

    this.add.zone(W / 2, cpuY, 200, 36).setInteractive({ useHandCursor: true }).setDepth(5)
      .on('pointerover', () => { cpuG.setAlpha(1.2); cpuLabel.setStyle({ fill: '#88EEFF' }); })
      .on('pointerout',  () => { cpuG.setAlpha(1);   cpuLabel.setStyle({ fill: '#00DDFF' }); })
      .on('pointerdown', () => {
        audioSystem.playClick();
        this.cameras.main.fadeOut(260, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () =>
          this.scene.start('CharSelect', { mode: 'vs_cpu' })
        );
      });
  }

  // ── BOTTOM NAV BAR ────────────────────────────────────────────────────────
  _drawNavBar() {
    const { W, H } = this;
    const NAV_H = 64;
    const NY = H - NAV_H;

    const navG = this.add.graphics().setDepth(6);
    navG.fillStyle(0x081410, 0.97);
    navG.fillRect(0, NY, W, NAV_H);
    navG.lineStyle(1, 0x1a4a30, 0.8);
    navG.lineBetween(0, NY, W, NY);

    const items = [
      { icon: '📦', label: 'Chests',  x: W * 0.1,  active: false },
      { icon: '🃏', label: 'Cards',   x: W * 0.3,  active: false },
      { icon: '⚔',  label: 'Battle',  x: W * 0.5,  active: true  },
      { icon: '👥', label: 'Social',  x: W * 0.7,  active: false },
      { icon: '🏆', label: 'Trophy',  x: W * 0.9,  active: false },
    ];

    const callbacks = [
      () => {},
      () => this.scene.start('CharSelect', { mode: 'deck_edit' }),
      () => {},
      () => this._showInvite(),
      () => {},
    ];

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const cy = NY + NAV_H / 2 - 2;

      if (it.active) {
        // Yellow indicator bar
        const indG = this.add.graphics().setDepth(7);
        indG.fillStyle(0xFFD700);
        indG.fillRect(it.x - 28, NY, 56, 3);
      }

      const alpha = it.active ? '#FFFFFF' : '#445544';
      const sz = it.active ? '24px' : '21px';

      this.add.text(it.x, cy - 9, it.icon, {
        fontSize: sz, fill: '#FFFFFF', fontFamily: 'Arial'
      }).setOrigin(0.5).setAlpha(it.active ? 1 : 0.45).setDepth(7);

      this.add.text(it.x, cy + 14, it.label, {
        fontSize: '9px', fill: alpha, fontFamily: 'Arial', fontStyle: it.active ? 'bold' : 'normal'
      }).setOrigin(0.5).setDepth(7);

      this.add.zone(it.x, cy, 72, NAV_H)
        .setInteractive({ useHandCursor: true }).setDepth(8)
        .on('pointerdown', () => { audioSystem.playClick(); callbacks[i](); });
    }
  }

  // ── INVITE OVERLAY ────────────────────────────────────────────────────────
  _buildInviteContainer() {
    const { W, H } = this;
    this._inviteContainer = this.add.container(W / 2, H / 2 - 40)
      .setVisible(false).setDepth(20);

    const panel = this.add.rectangle(0, 0, 320, 200, 0x0a0820, 0.97)
      .setStrokeStyle(2, 0xFFD700);
    const title = this.add.text(0, -70, '📨  Invite a Friend', {
      fontSize: '18px', fill: '#FFD700', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5);
    const hint = this.add.text(0, -30, 'Type username in the field below', {
      fontSize: '12px', fill: '#AAAACC', fontFamily: 'Arial'
    }).setOrigin(0.5);

    const sendBtn = this.add.text(0, 40, '[ SEND INVITE ]', {
      fontSize: '15px', fill: '#27AE60', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    sendBtn.on('pointerdown', () => {
      const v = document.getElementById('bb-invite-input')?.value?.trim();
      if (v) { socketManager.inviteFriend(v, this.registry.get('deck') || []); this._hideInvite(); }
    });

    const closeBtn = this.add.text(0, 76, '[ CANCEL ]', {
      fontSize: '13px', fill: '#666688', fontFamily: 'Arial'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this._hideInvite());

    this._inviteContainer.add([panel, title, hint, sendBtn, closeBtn]);
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
    c.add(this.add.rectangle(0, 0, 320, 140, 0x0a0820, 0.97).setStrokeStyle(2, 0xFFD700));
    c.add(this.add.text(0, -42, `${from} invited you to battle!`, {
      fontSize: '15px', fill: '#FFD700', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5));
    const accept = this.add.text(-66, 18, '[ ACCEPT ]', {
      fontSize: '15px', fill: '#27AE60', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    accept.on('pointerdown', () => {
      socketManager.acceptInvite(fromId); c.destroy();
      this.cameras.main.fadeOut(280, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('CharSelect', { mode: '1v1' }));
    });
    const dec = this.add.text(66, 18, '[ DECLINE ]', {
      fontSize: '15px', fill: '#C0392B', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    dec.on('pointerdown', () => { socketManager.declineInvite(fromId); c.destroy(); });
    c.add([accept, dec]);
    this.time.delayedCall(15000, () => { if (c.active) c.destroy(); });
  }

  _logout() {
    localStorage.removeItem('bb_token'); localStorage.removeItem('bb_username');
    localStorage.removeItem('bb_gold');
    socketManager.disconnect();
    this.cameras.main.fadeOut(280, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Auth'));
  }

  _fmt(n) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  shutdown() {
    socketManager.offAll('friend_invite');
    this._hideInvite();
  }
}
