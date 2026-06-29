import Phaser from 'phaser';
import { SERVER_URL } from '../config.js';
import { socketManager } from '../network/SocketManager.js';
import { audioSystem } from '../systems/AudioSystem.js';

export class AuthScene extends Phaser.Scene {
  constructor() { super('Auth'); }

  create() {
    const { width: W, height: H } = this.scale;
    this.mode = 'login';

    // ── Phaser background visuals ──────────────────────────────────────────
    this.add.rectangle(0, 0, W, H, 0x000000).setOrigin(0);

    const bg = this.add.graphics();
    [
      [0x0d021e, 0.6, 380],
      [0x060112, 0.4, 220],
    ].forEach(([c, a, r]) => { bg.fillStyle(c, a); bg.fillCircle(W / 2, H / 2, r); });

    const sg = this.add.graphics();
    for (let i = 0; i < 60; i++) {
      sg.fillStyle(0xFFFFFF, 0.1 + Math.random() * 0.25);
      sg.fillRect(Math.random() * W, Math.random() * H, 1, 1);
    }

    this.add.text(W / 2, 52, 'BATTLE BROS', {
      fontSize: '30px', fill: '#FFE566',
      fontFamily: 'Arial Black, Arial', fontStyle: 'bold',
      stroke: '#3D1C00', strokeThickness: 5
    }).setOrigin(0.5);

    this.add.text(W / 2, 86, 'DEPLOY · BATTLE · CONQUER', {
      fontSize: '10px', fill: '#886600', fontFamily: 'Arial', letterSpacing: 3
    }).setOrigin(0.5);

    // ── HTML overlay form (reliable in all browsers) ───────────────────────
    this._buildOverlay();
    this.cameras.main.fadeIn(300);
    audioSystem.playTrack('battle_hymn');
  }

  _buildOverlay() {
    // Remove previous overlay
    document.getElementById('bb-auth')?.remove();

    const IS_REG = this.mode === 'register';

    const wrap = document.createElement('div');
    wrap.id = 'bb-auth';
    wrap.style.cssText = [
      'position:fixed;top:0;left:0;right:0;bottom:0',
      'display:flex;align-items:center;justify-content:center',
      'z-index:200;pointer-events:none',
    ].join(';');

    const card = document.createElement('div');
    card.style.cssText = [
      'pointer-events:all',
      'background:rgba(10,8,30,0.97)',
      'border:1px solid #2e2e5e',
      'border-radius:16px',
      'padding:32px 28px 28px',
      'display:flex;flex-direction:column;gap:14px;align-items:center',
      'width:290px',
      'box-shadow:0 0 40px rgba(80,0,160,0.4)',
      'margin-top:60px',
    ].join(';');

    // Tab bar
    const tabs = document.createElement('div');
    tabs.style.cssText = 'display:flex;gap:0;width:100%;border-radius:8px;overflow:hidden;margin-bottom:4px;';

    ['login', 'register'].forEach(m => {
      const t = document.createElement('button');
      t.textContent = m === 'login' ? 'LOG IN' : 'SIGN UP';
      t.style.cssText = [
        'flex:1;padding:10px 0;border:none;cursor:pointer',
        'font-size:13px;font-weight:bold;font-family:Arial',
        'letter-spacing:1px;transition:background 0.2s',
        m === this.mode
          ? 'background:#2a1f6e;color:#FFD700;'
          : 'background:#13112a;color:#555588;',
      ].join(';');
      t.onclick = () => { if (this.mode !== m) { this.mode = m; this._buildOverlay(); } };
      tabs.appendChild(t);
    });
    card.appendChild(tabs);

    // Inputs
    const inp = (id, type, placeholder) => {
      const el = document.createElement('input');
      el.id = id; el.type = type; el.placeholder = placeholder;
      el.style.cssText = [
        'width:100%;padding:12px 14px;box-sizing:border-box',
        'background:#111128;border:1px solid #2e2e5e;border-radius:8px',
        'color:#fff;font-size:15px;outline:none;font-family:Arial',
        'transition:border-color 0.2s',
      ].join(';');
      el.onfocus = () => { el.style.borderColor = '#5555CC'; };
      el.onblur  = () => { el.style.borderColor = '#2e2e5e'; };
      return el;
    };

    if (IS_REG) card.appendChild(inp('bb_username', 'text', 'Username (3+ chars)'));
    card.appendChild(inp('bb_email', 'email', 'Email address'));
    const passEl = inp('bb_pass', 'password', 'Password (6+ chars)');
    card.appendChild(passEl);

    // Error label
    const err = document.createElement('div');
    err.id = 'bb-err';
    err.style.cssText = 'color:#FF6B6B;font-size:13px;font-family:Arial;min-height:18px;text-align:center;width:100%;';
    card.appendChild(err);

    // Submit button
    const btn = document.createElement('button');
    btn.textContent = IS_REG ? 'CREATE ACCOUNT' : 'LOG IN';
    btn.style.cssText = [
      'width:100%;padding:14px;border:none;border-radius:8px',
      IS_REG ? 'background:linear-gradient(135deg,#27AE60,#1A6B3C)' : 'background:linear-gradient(135deg,#2255CC,#1A3A8A)',
      'color:#fff;font-size:16px;font-weight:bold;cursor:pointer',
      'font-family:Arial;letter-spacing:1px',
      'box-shadow:0 4px 14px rgba(0,0,0,0.5)',
    ].join(';');
    btn.onmouseenter = () => { btn.style.filter = 'brightness(1.15)'; };
    btn.onmouseleave = () => { btn.style.filter = ''; };
    card.appendChild(btn);

    wrap.appendChild(card);
    document.body.appendChild(wrap);
    this._overlay = wrap;

    // Events
    btn.addEventListener('click', () => this._submit());
    passEl.addEventListener('keydown', e => { if (e.key === 'Enter') this._submit(); });

    // Focus first input
    setTimeout(() => wrap.querySelector('input')?.focus(), 80);
  }

  async _submit() {
    const email    = document.getElementById('bb_email')?.value?.trim();
    const pass     = document.getElementById('bb_pass')?.value;
    const username = document.getElementById('bb_username')?.value?.trim();
    const err      = document.getElementById('bb-err');

    if (!email || !pass) { if (err) err.textContent = 'Please fill all fields.'; return; }
    if (err) err.textContent = 'Connecting…';

    const endpoint = this.mode === 'register' ? '/auth/register' : '/auth/login';
    const body     = this.mode === 'register'
      ? { email, password: pass, username }
      : { email, password: pass };

    try {
      const res  = await fetch(SERVER_URL + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (!res.ok) {
        if (err) err.textContent = data.error || 'An error occurred.';
        return;
      }

      localStorage.setItem('bb_token',    data.token);
      localStorage.setItem('bb_username', data.username);
      localStorage.setItem('bb_gold',     String(data.gold));

      this.registry.set('token',    data.token);
      this.registry.set('username', data.username);
      this.registry.set('gold',     data.gold);

      socketManager.connect(data.token);
      audioSystem.playClick();

      this._removeOverlay();
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('MainMenu'));

    } catch {
      if (err) err.textContent = 'Could not reach server. Try again.';
    }
  }

  _removeOverlay() {
    this._overlay?.remove();
    this._overlay = null;
    document.getElementById('bb-auth')?.remove();
  }

  shutdown() { this._removeOverlay(); }
}
