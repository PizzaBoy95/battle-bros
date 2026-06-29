import Phaser from 'phaser';
import { generateAllTextures } from '../characters/CharacterGraphics.js';
import { audioSystem } from '../systems/AudioSystem.js';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    // Attempt to load character portrait sprites from public/assets/characters/
    // Silently skip any that don't exist — game falls back to procedural drawing
    const charIds = [
      'titan_grunt','pyro_drake','lady_vex','bone_shard','iron_bro',
      'stone_golem','thunder_chief','blaze_witch','wing_knight','frostborn',
      'jade_monk','sea_crusher','crystal_sage','arrow_jack','shadow_rogue',
      'skywing','volt_ranger','toxin_toad','neon_wraith','forge_dwarf'
    ];
    for (const id of charIds) {
      this.load.image(id, `assets/characters/${id}.png`);
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

    // Generate all character textures via Phaser Graphics API
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
