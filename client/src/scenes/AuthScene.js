import Phaser from 'phaser';
import { SERVER_URL } from '../config.js';
import { socketManager } from '../network/SocketManager.js';
import { audioSystem } from '../systems/AudioSystem.js';

export class AuthScene extends Phaser.Scene {
  constructor() { super('Auth'); }

  create() {
    const { width: W, height: H } = this.scale;
    this.mode = 'login';

    // Background
    this.add.rectangle(0, 0, W, H, 0x050510).setOrigin(0);

    const stars = this.add.graphics();
    for (let i = 0; i < 60; i++) {
      stars.fillStyle(0xFFFFFF, 0.2 + Math.random() * 0.5);
      stars.fillRect(Math.random() * W, Math.random() * H, 1, 1);
    }

    // Title
    this.add.text(W / 2, 60, 'BATTLE BROS', {
      fontSize: '32px', fill: '#FFD700',
      fontFamily: 'Arial Black, Arial', fontStyle: 'bold',
      stroke: '#8B4513', strokeThickness: 4
    }).setOrigin(0.5);

    // Panel background
    const panelY = H / 2 + 20;
    this.add.rectangle(W / 2, panelY, 340, 440, 0x0d0d22, 0.95)
      .setOrigin(0.5).setStrokeStyle(2, 0x3a3a6e);

    // Mode tabs
    this.loginTab = this.add.text(W / 2 - 80, panelY - 200, 'LOGIN', {
      fontSize: '15px', fill: '#FFD700',
      fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.registerTab = this.add.text(W / 2 + 80, panelY - 200, 'SIGN UP', {
      fontSize: '15px', fill: '#888888',
      fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.loginTab.on('pointerdown', () => this._switchMode('login'));
    this.registerTab.on('pointerdown', () => this._switchMode('register'));

    // Error text
    this.errorText = this.add.text(W / 2, panelY + 190, '', {
      fontSize: '13px', fill: '#FF6B6B',
      fontFamily: 'Arial', wordWrap: { width: 300 }
    }).setOrigin(0.5);

    // Build initial form
    this._buildForm();

    this.cameras.main.fadeIn(300);
    audioSystem.resume();
    audioSystem.playTrack('battle_hymn');
  }

  _switchMode(mode) {
    if (this.mode === mode) return;
    this.mode = mode;
    this.loginTab.setStyle({ fill: mode === 'login' ? '#FFD700' : '#888888' });
    this.registerTab.setStyle({ fill: mode === 'register' ? '#FFD700' : '#888888' });
    this.errorText.setText('');
    if (this.formDom) { this.formDom.destroy(); this.formDom = null; }
    this._buildForm();
  }

  _buildForm() {
    const { width: W, height: H } = this.scale;
    const panelY = H / 2 + 20;

    const inputStyle = `
      width:260px; padding:10px 14px;
      background:#1a1a2e; border:1px solid #3a3a6e; border-radius:6px;
      color:#fff; font-size:15px; outline:none; box-sizing:border-box;
    `;
    const btnStyle = `
      width:260px; padding:12px; border:none; border-radius:6px;
      color:#fff; font-size:16px; font-weight:bold; cursor:pointer;
    `;

    const html = this.mode === 'register' ? `
      <div style="display:flex;flex-direction:column;gap:12px;align-items:center;font-family:Arial;">
        <input id="bb_username" type="text"     placeholder="Username (3+ chars)" style="${inputStyle}" maxlength="20" />
        <input id="bb_email"    type="email"    placeholder="Email"               style="${inputStyle}" />
        <input id="bb_pass"     type="password" placeholder="Password (6+ chars)" style="${inputStyle}" />
        <button id="bb_submit" style="${btnStyle}background:linear-gradient(135deg,#27AE60,#1E8449);">
          CREATE ACCOUNT
        </button>
      </div>
    ` : `
      <div style="display:flex;flex-direction:column;gap:12px;align-items:center;font-family:Arial;">
        <input id="bb_email" type="email"    placeholder="Email"    style="${inputStyle}" />
        <input id="bb_pass"  type="password" placeholder="Password" style="${inputStyle}" />
        <button id="bb_submit" style="${btnStyle}background:linear-gradient(135deg,#2980B9,#1A5276);">
          LOGIN
        </button>
      </div>
    `;

    this.formDom = this.add.dom(W / 2, panelY - 30).createFromHTML(html);

    // Wire up events after DOM is in place
    this.time.delayedCall(50, () => {
      document.getElementById('bb_submit')?.addEventListener('click',   () => this._submit());
      document.getElementById('bb_pass')  ?.addEventListener('keydown', (e) => { if (e.key === 'Enter') this._submit(); });
    });
  }

  async _submit() {
    const email    = document.getElementById('bb_email')?.value?.trim();
    const pass     = document.getElementById('bb_pass')?.value;
    const username = document.getElementById('bb_username')?.value?.trim();

    if (!email || !pass) { this.errorText.setText('Please fill all fields.'); return; }

    const endpoint = this.mode === 'register' ? '/auth/register' : '/auth/login';
    const body     = this.mode === 'register'
      ? { email, password: pass, username }
      : { email, password: pass };

    this.errorText.setText('Connecting…');

    try {
      const res  = await fetch(SERVER_URL + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (!res.ok) {
        this.errorText.setText(data.error || 'An error occurred.');
        return;
      }

      // Persist credentials
      localStorage.setItem('bb_token',    data.token);
      localStorage.setItem('bb_username', data.username);
      localStorage.setItem('bb_gold',     String(data.gold));

      this.registry.set('token',    data.token);
      this.registry.set('username', data.username);
      this.registry.set('gold',     data.gold);

      socketManager.connect(data.token);
      audioSystem.playClick();

      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MainMenu');
      });
    } catch {
      this.errorText.setText('Cannot reach server.\nMake sure the server is running on :3001');
    }
  }

  shutdown() {
    if (this.formDom) { this.formDom.destroy(); this.formDom = null; }
  }
}
