import Phaser from 'phaser';
import { socketManager } from '../network/SocketManager.js';
import { audioSystem } from '../systems/AudioSystem.js';

export class MainMenuScene extends Phaser.Scene {
  constructor() { super('MainMenu'); }

  create() {
    const { width: W, height: H } = this.scale;

    this.username = this.registry.get('username') || 'Player';
    this.gold = this.registry.get('gold') || 500;

    // Background
    this.add.rectangle(0, 0, W, H, 0x060614).setOrigin(0);
    this._drawStars();
    this._drawDecorCharacters();

    // Logo
    this.add.text(W / 2, 80, 'BATTLE BROS', {
      fontSize: '38px', fill: '#FFD700',
      fontFamily: 'Arial Black, Arial', fontStyle: 'bold',
      stroke: '#8B4513', strokeThickness: 5
    }).setOrigin(0.5);

    this.add.text(W / 2, 118, '⚔  MULTIPLAYER STRATEGY  ⚔', {
      fontSize: '12px', fill: '#AAAACC', fontFamily: 'Arial', letterSpacing: 2
    }).setOrigin(0.5);

    // Player info bar
    this.add.rectangle(W / 2, 158, W - 20, 36, 0x1a1a2e, 0.9).setOrigin(0.5);
    this.add.text(20, 144, `👤 ${this.username}`, {
      fontSize: '14px', fill: '#AAAACC', fontFamily: 'Arial'
    });
    this.goldText = this.add.text(W - 20, 144, `💰 ${this.gold}`, {
      fontSize: '14px', fill: '#FFD700', fontFamily: 'Arial'
    }).setOrigin(1, 0);

    // Main menu buttons
    const btnY = H * 0.42;
    const btnSpacing = 72;

    this._makeMenuBtn(W / 2, btnY,                'PLAY 1v1', 0x27AE60, () => this._startMode('1v1'));
    this._makeMenuBtn(W / 2, btnY + btnSpacing,    'PLAY 2v2', 0x2980B9, () => this._startMode('2v2'));
    this._makeMenuBtn(W / 2, btnY + btnSpacing * 2,'MY DECK',  0x8E44AD, () => this.scene.start('CharSelect', { mode: 'deck_edit' }));
    this._makeMenuBtn(W / 2, btnY + btnSpacing * 3,'INVITE FRIEND', 0xE67E22, () => this._showInvite());
    this._makeMenuBtn(W / 2, btnY + btnSpacing * 4,'LOGOUT',   0x636E72, () => this._logout());

    // Version / info
    this.add.text(W / 2, H - 20, 'Battle Bros v1.0  |  battlestudios', {
      fontSize: '10px', fill: '#444466', fontFamily: 'Arial'
    }).setOrigin(0.5);

    // Invite overlay (hidden)
    this._buildInviteOverlay();

    // Socket reconnect if needed
    const token = this.registry.get('token');
    if (token && !socketManager.isConnected()) socketManager.connect(token);

    // Friend invite listener
    socketManager.on('friend_invite', (data) => this._onFriendInvite(data));

    this.cameras.main.fadeIn(300);
    audioSystem.playTrack('battle_hymn');
  }

  _drawStars() {
    const { width: W, height: H } = this.scale;
    const g = this.add.graphics();
    for (let i = 0; i < 80; i++) {
      const a = 0.1 + Math.random() * 0.6;
      g.fillStyle(0xFFFFFF, a);
      g.fillRect(Math.random() * W, Math.random() * H, 1 + (Math.random() > 0.9 ? 1 : 0), 1);
    }
  }

  _drawDecorCharacters() {
    const { width: W, height: H } = this.scale;
    // Silhouette character previews in background
    const g = this.add.graphics().setAlpha(0.08).setDepth(0);
    g.fillStyle(0x9B59B6);
    g.fillRect(20, H * 0.6, 40, 70);    // left silhouette
    g.fillCircle(40, H * 0.6 - 10, 16);
    g.fillStyle(0xFF4500);
    g.fillRect(W - 60, H * 0.6, 40, 70); // right silhouette
    g.fillCircle(W - 40, H * 0.6 - 10, 16);
  }

  _makeMenuBtn(x, y, label, color, onClick) {
    const btn = this.add.rectangle(x, y, 280, 52, color, 0.9)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0xFFFFFF, 0.1);

    const txt = this.add.text(x, y, label, {
      fontSize: '18px', fill: '#FFFFFF',
      fontFamily: 'Arial Black, Arial', fontStyle: 'bold'
    }).setOrigin(0.5);

    btn.on('pointerover', () => { btn.setAlpha(1); txt.setScale(1.05); });
    btn.on('pointerout',  () => { btn.setAlpha(0.9); txt.setScale(1); });
    btn.on('pointerdown', () => {
      audioSystem.playClick();
      this.tweens.add({ targets: [btn, txt], scaleX: 0.96, scaleY: 0.96, duration: 80, yoyo: true });
      this.time.delayedCall(120, onClick);
    });

    return { btn, txt };
  }

  _startMode(mode) {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('CharSelect', { mode });
    });
  }

  _buildInviteOverlay() {
    const { width: W, height: H } = this.scale;
    this.inviteOverlay = this.add.container(W / 2, H / 2).setVisible(false).setDepth(20);
    this.inviteOverlay.add(this.add.rectangle(0, 0, 360, 260, 0x0d0d22, 0.97).setStrokeStyle(2, 0xFFD700));
    this.inviteLabel = this.add.text(0, -90, 'Invite a Friend', {
      fontSize: '20px', fill: '#FFD700', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.inviteOverlay.add(this.inviteLabel);

    const inputHTML = `<input id="bb_invite_user" type="text" placeholder="Enter username"
      style="width:240px;padding:10px;background:#1a1a2e;border:1px solid #3a3a6e;
      border-radius:6px;color:#fff;font-size:15px;outline:none;" />`;
    this.inviteDom = this.add.dom(W / 2, H / 2 - 10).createFromHTML(inputHTML).setVisible(false).setDepth(21);

    const sendBtn = this.add.text(0, 50, '[ SEND INVITE ]', {
      fontSize: '16px', fill: '#27AE60', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    sendBtn.on('pointerdown', () => {
      const target = document.getElementById('bb_invite_user')?.value?.trim();
      if (target) socketManager.inviteFriend(target, this.registry.get('deck') || []);
    });

    const closeBtn = this.add.text(0, 90, '[ CLOSE ]', {
      fontSize: '14px', fill: '#888888', fontFamily: 'Arial'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this._hideInvite());

    this.inviteOverlay.add([sendBtn, closeBtn]);
  }

  _showInvite() {
    this.inviteOverlay.setVisible(true);
    this.inviteDom.setVisible(true);
  }

  _hideInvite() {
    this.inviteOverlay.setVisible(false);
    this.inviteDom.setVisible(false);
  }

  _onFriendInvite({ from, fromId }) {
    const { width: W, height: H } = this.scale;
    const overlay = this.add.container(W / 2, H * 0.3).setDepth(30);
    overlay.add(this.add.rectangle(0, 0, 320, 150, 0x0d0d22, 0.97).setStrokeStyle(2, 0xFFD700));
    overlay.add(this.add.text(0, -45, `${from} invited you!`, {
      fontSize: '17px', fill: '#FFD700', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5));

    const acceptBtn = this.add.text(-60, 20, '[ ACCEPT ]', {
      fontSize: '16px', fill: '#27AE60', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    acceptBtn.on('pointerdown', () => {
      socketManager.acceptInvite(fromId);
      overlay.destroy();
      this._startMode('1v1');
    });

    const declineBtn = this.add.text(60, 20, '[ DECLINE ]', {
      fontSize: '16px', fill: '#C0392B', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    declineBtn.on('pointerdown', () => {
      socketManager.declineInvite(fromId);
      overlay.destroy();
    });

    overlay.add([acceptBtn, declineBtn]);
    this.time.delayedCall(15000, () => overlay.destroy());
  }

  _logout() {
    localStorage.removeItem('bb_token');
    localStorage.removeItem('bb_username');
    localStorage.removeItem('bb_gold');
    socketManager.disconnect();
    this.scene.start('Auth');
  }

  shutdown() {
    socketManager.offAll('friend_invite');
    if (this.inviteDom) this.inviteDom.destroy();
  }
}
