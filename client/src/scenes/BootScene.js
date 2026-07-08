import Phaser from 'phaser';
import { generateAllTextures, generatePortraitTextures } from '../characters/CharacterGraphics.js';
import { setHeroManifest } from '../characters/heroTex.js';
import { audioSystem } from '../systems/AudioSystem.js';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    // ── Hero animation packs (public/assets/heroes) ─────────────────────────
    // manifest.json describes every character's sheets; when it arrives we
    // queue the actual spritesheet/portrait files into the same load phase.
    this.load.json('heroManifest', 'assets/heroes/manifest.json');
    this.load.on('filecomplete-json-heroManifest', (_k, _t, data) => {
      this._heroManifest = data || {};
      for (const [id, e] of Object.entries(this._heroManifest)) {
        for (const [anim, a] of Object.entries(e.anims || {})) {
          this.load.spritesheet(`${id}_${anim}`, `assets/heroes/${id}/${anim}.png`,
            { frameWidth: a.fw, frameHeight: a.fh });
        }
        if (e.proj) this.load.spritesheet(`${id}_proj`, `assets/heroes/${id}/proj.png`,
          { frameWidth: e.proj.fw, frameHeight: e.proj.fh });
        if (e.boom) this.load.spritesheet(`${id}_boom`, `assets/heroes/${id}/boom.png`,
          { frameWidth: e.boom.fw, frameHeight: e.boom.fh });
        this.load.image(`${id}_port`, `assets/portraits/${id}.png`);
      }
    });

    // ── Tiny Swords world assets ────────────────────────────────────────────
    const W = 'assets/world';
    this.load.spritesheet('tilemap_flat', `${W}/tilemap_flat.png`, { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('bridge_all',   `${W}/bridge_all.png`,   { frameWidth: 64, frameHeight: 64 });
    this.load.image('water_tile', `${W}/water.png`);
    this.load.spritesheet('foam',       `${W}/foam.png`,       { frameWidth: 192, frameHeight: 192 });
    this.load.spritesheet('explosions', `${W}/explosions.png`, { frameWidth: 192, frameHeight: 192 });
    this.load.spritesheet('fire',       `${W}/fire.png`,       { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('dynamite',   `${W}/dynamite.png`,   { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('sheep',      `${W}/sheep.png`,      { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('tree',       `${W}/tree.png`,       { frameWidth: 192, frameHeight: 192 });
    this.load.spritesheet('rocks_01',   `${W}/rocks_01.png`,   { frameWidth: 128, frameHeight: 128 });
    this.load.image('ts_arrow',  `${W}/arrow.png`);
    for (const k of ['castle_blue', 'castle_red', 'castle_destroyed',
                     'tower_blue', 'tower_red', 'tower_destroyed',
                     'banner_h', 'carved_9', 'ribbon_blue', 'ribbon_red',
                     'ribbon_yellow', 'btn_blue3', 'btn_red3']) {
      this.load.image(k, `${W}/${k}.png`);
    }
    for (const d of ['01','02','03','04','05','06','07','08','09','10','14','16']) {
      this.load.image(`deco_${d}`, `${W}/deco_${d}.png`);
    }

    // Suppress console errors for missing optional assets
    this.load.on('loaderror', () => {});

    // Progress bar
    const bar = document.getElementById('lbar');
    if (bar) {
      this.load.on('progress', (v) => { bar.style.width = (v * 100) + '%'; });
    }
  }

  create() {
    const loading = document.getElementById('loading');
    if (loading) loading.classList.add('hidden');

    // ── Hero animations from manifest ───────────────────────────────────────
    const manifest = this._heroManifest || {};
    setHeroManifest(manifest);
    this.registry.set('heroManifest', manifest);
    const FPS = { idle: 8, run: 11, attack: 13, death: 10 };
    for (const [id, e] of Object.entries(manifest)) {
      for (const [anim, a] of Object.entries(e.anims || {})) {
        const key = `${id}_${anim}`;
        if (!this.textures.exists(key)) continue;
        this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
        if (!this.anims.exists(key)) {
          this.anims.create({
            key,
            frames: this.anims.generateFrameNumbers(key, { start: 0, end: a.n - 1 }),
            frameRate: FPS[anim] || 10,
            repeat: (anim === 'idle' || anim === 'run') ? -1 : 0
          });
        }
      }
      if (e.proj && this.textures.exists(`${id}_proj`) && !this.anims.exists(`${id}_proj`)) {
        this.textures.get(`${id}_proj`).setFilter(Phaser.Textures.FilterMode.NEAREST);
        this.anims.create({ key: `${id}_proj`, frames: this.anims.generateFrameNumbers(`${id}_proj`, { start: 0, end: e.proj.n - 1 }), frameRate: 12, repeat: -1 });
      }
      if (e.boom && this.textures.exists(`${id}_boom`) && !this.anims.exists(`${id}_boom`)) {
        this.textures.get(`${id}_boom`).setFilter(Phaser.Textures.FilterMode.NEAREST);
        this.anims.create({ key: `${id}_boom`, frames: this.anims.generateFrameNumbers(`${id}_boom`, { start: 0, end: e.boom.n - 1 }), frameRate: 16, repeat: 0 });
      }
      if (this.textures.exists(`${id}_port`)) {
        this.textures.get(`${id}_port`).setFilter(Phaser.Textures.FilterMode.NEAREST);
      }
    }

    // ── World animations ────────────────────────────────────────────────────
    const mkAnim = (key, tex, n, fps, repeat = -1) => {
      if (this.textures.exists(tex) && !this.anims.exists(key)) {
        this.anims.create({ key, frames: this.anims.generateFrameNumbers(tex, { start: 0, end: n - 1 }), frameRate: fps, repeat });
      }
    };
    mkAnim('foam_anim',      'foam',       8, 7);
    mkAnim('explosion_anim', 'explosions', 9, 16, 0);
    mkAnim('fire_anim',      'fire',       7, 12);
    mkAnim('dynamite_anim',  'dynamite',   6, 12);
    mkAnim('sheep_anim',     'sheep',      6, 7);

    // Generate canvas portrait textures + procedural battle textures (fallbacks)
    generatePortraitTextures(this);
    generateAllTextures(this);
    this._genUITextures();

    // Init audio (deferred until first user gesture)
    audioSystem.init();

    // Auto-login check
    const token    = localStorage.getItem('bb_token');
    const username = localStorage.getItem('bb_username');
    const gold     = parseInt(localStorage.getItem('bb_gold') || '500', 10);

    if (token) {
      this.registry.set('token',    token);
      this.registry.set('username', username || 'Player');
      this.registry.set('gold',     gold);
      this.scene.start('Splash', { autoLogin: true });
    } else {
      this.scene.start('Splash', { autoLogin: false });
    }
  }

  _genUITextures() {
    const make = (key, w, h, color, radius = 8, alpha = 1) => {
      if (this.textures.exists(key)) return;
      const g = this.make.graphics({ add: false });
      g.fillStyle(color, alpha);
      g.fillRoundedRect(0, 0, w, h, radius);
      g.generateTexture(key, w, h);
      g.destroy();
    };

    make('btn_green', 200, 50, 0x27AE60);
    make('btn_blue',  200, 50, 0x2980B9);
    make('btn_red',   200, 50, 0xC0392B);
    make('btn_gold',  200, 50, 0xF39C12);
    make('btn_grey',  200, 50, 0x555566);
    make('panel',     440, 600, 0x0a0a1e, 12, 0.95);
  }
}
