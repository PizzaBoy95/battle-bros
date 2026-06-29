import Phaser from 'phaser';
import { socketManager } from '../network/SocketManager.js';
import { audioSystem } from '../systems/AudioSystem.js';

export class MainMenuScene extends Phaser.Scene {
  constructor() { super('MainMenu'); }

  create() {
    const { width: W, height: H } = this.scale;

    this.username = this.registry.get('username') || 'Player';
    this.gold     = this.registry.get('gold')     || 500;

    // Background
    this.add.rectangle(0, 0, W, H, 0x060614).setOrigin(0);
    this._drawBackground();

    // Logo
    this.add.text(W / 2, 74, 'BATTLE BROS', {
      fontSize: '38px', fill: '#FFE566',
      fontFamily: 'Arial Black, Arial', fontStyle: 'bold',
      stroke: '#3D1C00', strokeThickness: 5
    }).setOrigin(0.5);

    this.add.text(W / 2, 112, '⚔  MULTIPLAYER STRATEGY  ⚔', {
      fontSize: '12px', fill: '#886600', fontFamily: 'Arial', letterSpacing: 2
    }).setOrigin(0.5);

    // Player bar
    this.add.rectangle(W / 2, 150, W - 20, 34, 0x111128, 0.95).setOrigin(0.5).setStrokeStyle(1, 0x2e2e5e);
    this.add.text(18, 138, `👤 ${this.username}`, { fontSize: '13px', fill: '#AAAACC', fontFamily: 'Arial' });
    this.goldText = this.add.text(W - 18, 138, `💰 ${this.gold}`, {
      fontSize: '13px', fill: '#FFD700', fontFamily: 'Arial'
    }).setOrigin(1, 0);

    // Buttons
    const btnY     = H * 0.40;
    const spacing  = 70;
    this._btn(W / 2, btnY,              '⚔  PLAY 1v1',      0x1E6B3A, () => this._goMode('1v1'));
    this._btn(W / 2, btnY + spacing,    '🤝  PLAY 2v2',     0x1A4A8A, () => this._goMode('2v2'));
    this._btn(W / 2, btnY + spacing * 2,'🃏  MY DECK',      0x5B2A8A, () => this.scene.start('CharSelect', { mode: 'deck_edit' }));
    this._btn(W / 2, btnY + spacing * 3,'📨  INVITE FRIEND', 0x7A4010, () => this._showInvite());
    this._btn(W / 2, btnY + spacing * 4,'🚪  LOGOUT',       0x3a3a3a, () => this._logout());

    this.add.text(W / 2, H - 16, 'Battle Bros v1.0', {
      fontSize: '10px', fill: '#333355', fontFamily: 'Arial'
    }).setOrigin(0.5);

    // Invite overlay (Phaser container — no DOM here)
    this._buildInviteContainer();

    // Socket
    const token = this.registry.get('token');
    if (token && !socketManager.isConnected()) socketManager.connect(token);
    socketManager.on('friend_invite', (data) => this._onFriendInvite(data));

    this.cameras.main.fadeIn(300);
    audioSystem.playTrack('battle_hymn');
  }

  _drawBackground() {
    const { width: W, height: H } = this.scale;
    const bg = this.add.graphics();
    bg.fillStyle(0x0d021e, 0.5); bg.fillCircle(W / 2, H / 2, 400);
    const sg = this.add.graphics();
    for (let i = 0; i < 80; i++) {
      sg.fillStyle(0xFFFFFF, 0.06 + Math.random() * 0.24);
      sg.fillRect(Math.random() * W, Math.random() * H, 1, 1);
    }
    // Faint character silhouettes
    const dg = this.add.graphics().setAlpha(0.06);
    dg.fillStyle(0x9B59B6);
    dg.fillRect(18, H * 0.58, 36, 66); dg.fillCircle(36, H * 0.58 - 10, 14);
    dg.fillStyle(0xFF4500);
    dg.fillRect(W - 54, H * 0.58, 36, 66); dg.fillCircle(W - 36, H * 0.58 - 10, 14);
  }

  _btn(x, y, label, color, onClick) {
    const bg = this.add.rectangle(x, y, 288, 50, color)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(1, 0xFFFFFF, 0.12);
    const txt = this.add.text(x, y, label, {
      fontSize: '17px', fill: '#FFFFFF',
      fontFamily: 'Arial Black, Arial', fontStyle: 'bold'
    }).setOrigin(0.5);
    bg.on('pointerover', () => { bg.setAlpha(0.85); txt.setScale(1.04); });
    bg.on('pointerout',  () => { bg.setAlpha(1);    txt.setScale(1); });
    bg.on('pointerdown', () => {
      audioSystem.playClick();
      this.tweens.add({ targets: [bg, txt], scaleX: 0.96, scaleY: 0.96, duration: 70, yoyo: true });
      this.time.delayedCall(110, onClick);
    });
  }

  // ── Invite overlay (pure Phaser, no DOM) ─────────────────────────────────
  _buildInviteContainer() {
    const { width: W, height: H } = this.scale;
    this._inviteContainer = this.add.container(W / 2, H / 2 - 40)
      .setVisible(false).setDepth(20);

    const panel = this.add.rectangle(0, 0, 320, 200, 0x0a0820, 0.97)
      .setStrokeStyle(2, 0xFFD700);
    const title = this.add.text(0, -70, '📨  Invite a Friend', {
      fontSize: '18px', fill: '#FFD700', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5);
    this._inviteHint = this.add.text(0, -30, 'Type username in the field below', {
      fontSize: '12px', fill: '#AAAACC', fontFamily: 'Arial'
    }).setOrigin(0.5);

    const sendBtn = this.add.text(0, 40, '[ SEND INVITE ]', {
      fontSize: '15px', fill: '#27AE60', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    sendBtn.on('pointerdown', () => {
      const val = document.getElementById('bb-invite-input')?.value?.trim();
      if (val) {
        socketManager.inviteFriend(val, this.registry.get('deck') || []);
        this._hideInvite();
      }
    });

    const closeBtn = this.add.text(0, 76, '[ CANCEL ]', {
      fontSize: '13px', fill: '#666688', fontFamily: 'Arial'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this._hideInvite());

    this._inviteContainer.add([panel, title, this._inviteHint, sendBtn, closeBtn]);
  }

  _showInvite() {
    this._inviteContainer.setVisible(true);
    // Native input positioned over the invite panel
    document.getElementById('bb-invite-wrap')?.remove();
    const { width: W, height: H } = this.scale;
    const wrap = document.createElement('div');
    wrap.id = 'bb-invite-wrap';
    wrap.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-80%);z-index:201;';
    const inp = document.createElement('input');
    inp.id = 'bb-invite-input';
    inp.type = 'text';
    inp.placeholder = 'Enter username';
    inp.style.cssText = [
      'width:240px;padding:11px 14px;box-sizing:border-box',
      'background:#111128;border:2px solid #FFD700;border-radius:8px',
      'color:#fff;font-size:15px;outline:none;text-align:center;font-family:Arial',
    ].join(';');
    inp.onkeydown = e => { if (e.key === 'Enter') { const v = inp.value.trim(); if (v) { socketManager.inviteFriend(v, this.registry.get('deck') || []); this._hideInvite(); } } };
    wrap.appendChild(inp);
    document.body.appendChild(wrap);
    this._inviteWrap = wrap;
    setTimeout(() => inp.focus(), 60);
  }

  _hideInvite() {
    this._inviteContainer.setVisible(false);
    this._inviteWrap?.remove();
    this._inviteWrap = null;
  }

  // ── Friend invite notification ────────────────────────────────────────────
  _onFriendInvite({ from, fromId }) {
    const { width: W, height: H } = this.scale;
    const c = this.add.container(W / 2, H * 0.28).setDepth(30);
    c.add(this.add.rectangle(0, 0, 320, 140, 0x0a0820, 0.97).setStrokeStyle(2, 0xFFD700));
    c.add(this.add.text(0, -42, `${from} invited you!`, {
      fontSize: '16px', fill: '#FFD700', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5));

    const accept = this.add.text(-66, 18, '[ ACCEPT ]', {
      fontSize: '15px', fill: '#27AE60', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    accept.on('pointerdown', () => { socketManager.acceptInvite(fromId); c.destroy(); this._goMode('1v1'); });

    const decline = this.add.text(66, 18, '[ DECLINE ]', {
      fontSize: '15px', fill: '#C0392B', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    decline.on('pointerdown', () => { socketManager.declineInvite(fromId); c.destroy(); });

    c.add([accept, decline]);
    this.time.delayedCall(15000, () => { if (c.active) c.destroy(); });
  }

  _goMode(mode) {
    this.cameras.main.fadeOut(280, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () =>
      this.scene.start('CharSelect', { mode })
    );
  }

  _logout() {
    localStorage.removeItem('bb_token');
    localStorage.removeItem('bb_username');
    localStorage.removeItem('bb_gold');
    socketManager.disconnect();
    this.cameras.main.fadeOut(280, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Auth'));
  }

  shutdown() {
    socketManager.offAll('friend_invite');
    this._hideInvite();
  }
}
