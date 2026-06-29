import Phaser from 'phaser';
import { audioSystem } from '../systems/AudioSystem.js';

export class SplashScene extends Phaser.Scene {
  constructor() { super('Splash'); }

  init(data) {
    this.autoLogin = data?.autoLogin || false;
  }

  create() {
    const { width: W, height: H } = this.scale;

    // Dark background
    this.add.rectangle(0, 0, W, H, 0x050510).setOrigin(0);

    // Animated star field
    const stars = this.add.graphics();
    for (let i = 0; i < 100; i++) {
      stars.fillStyle(0xFFFFFF, 0.3 + Math.random() * 0.7);
      stars.fillRect(Math.random() * W, Math.random() * H, 1 + Math.random(), 1 + Math.random());
    }

    // Main title: BATTLE BROS
    const titleX = W / 2;
    const titleY = H * 0.38;

    // Shadow
    this.add.text(titleX + 4, titleY + 4, 'BATTLE', {
      fontSize: '72px', fill: '#000000', fontFamily: 'Arial Black, Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0.5);

    const battleText = this.add.text(titleX, titleY, 'BATTLE', {
      fontSize: '72px',
      fill: '#FFD700',
      fontFamily: 'Arial Black, Arial',
      fontStyle: 'bold',
      stroke: '#8B4513',
      strokeThickness: 6
    }).setOrigin(0.5).setAlpha(0).setScale(0.5);

    // Shadow
    this.add.text(titleX + 4, titleY + 78, 'BROS', {
      fontSize: '88px', fill: '#000000', fontFamily: 'Arial Black, Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0.5);

    const brosText = this.add.text(titleX, titleY + 74, 'BROS', {
      fontSize: '88px',
      fill: '#FF4500',
      fontFamily: 'Arial Black, Arial',
      fontStyle: 'bold',
      stroke: '#1A0000',
      strokeThickness: 8
    }).setOrigin(0.5).setAlpha(0).setScale(0.5);

    // Tagline
    const tagline = this.add.text(titleX, titleY + 160, 'DEPLOY · BATTLE · CONQUER', {
      fontSize: '16px', fill: '#AAAACC', fontFamily: 'Arial', letterSpacing: 4
    }).setOrigin(0.5).setAlpha(0);

    // BB shield logo
    const logo = this.add.graphics();
    const lx = titleX, ly = titleY - 90;
    logo.fillStyle(0xFFD700);
    logo.fillTriangle(lx - 24, ly - 20, lx + 24, ly - 20, lx, ly + 28); // shield bottom
    logo.fillRect(lx - 24, ly - 44, 48, 26);                              // shield top
    logo.fillStyle(0xFF4500);
    logo.fillCircle(lx, ly - 12, 12);
    logo.fillStyle(0x1A0000);
    logo.fillRect(lx - 5, ly - 20, 10, 18);  // letter B left
    logo.fillCircle(lx + 2, ly - 16, 5);
    logo.fillCircle(lx + 2, ly - 10, 5);
    logo.setAlpha(0).setScale(0.3);

    // Glow particles
    const particles = [];
    for (let i = 0; i < 20; i++) {
      const p = this.add.rectangle(
        titleX + (Math.random() - 0.5) * 300,
        titleY + (Math.random() - 0.5) * 200,
        4, 4, 0xFFD700
      ).setAlpha(0);
      particles.push(p);
    }

    // Animate in
    this.tweens.add({ targets: logo, alpha: 1, scaleX: 1, scaleY: 1, duration: 600, ease: 'Back.easeOut' });

    this.time.delayedCall(400, () => {
      this.tweens.add({ targets: battleText, alpha: 1, scaleX: 1, scaleY: 1, duration: 500, ease: 'Back.easeOut' });
    });
    this.time.delayedCall(700, () => {
      this.tweens.add({ targets: brosText, alpha: 1, scaleX: 1, scaleY: 1, duration: 500, ease: 'Back.easeOut' });
    });
    this.time.delayedCall(1000, () => {
      this.tweens.add({ targets: tagline, alpha: 1, duration: 600 });
      for (const p of particles) {
        this.tweens.add({
          targets: p, alpha: 0.8, duration: 400 + Math.random() * 400,
          yoyo: true, repeat: -1, delay: Math.random() * 800
        });
      }
    });

    // Idle logo pulse
    this.time.delayedCall(1200, () => {
      this.tweens.add({
        targets: [battleText, brosText, logo],
        scaleX: 1.04, scaleY: 1.04,
        duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
    });

    // "TAP TO CONTINUE" prompt
    this.time.delayedCall(1500, () => {
      const prompt = this.add.text(titleX, H * 0.82, 'TAP TO START', {
        fontSize: '20px', fill: '#FFFFFF', fontFamily: 'Arial', letterSpacing: 3
      }).setOrigin(0.5);

      this.tweens.add({ targets: prompt, alpha: 0.1, duration: 700, yoyo: true, repeat: -1 });

      this.input.once('pointerdown', () => this._proceed());
      this.input.keyboard?.once('keydown', () => this._proceed());

      // Auto-proceed after 4s
      this.time.delayedCall(4000, () => this._proceed());
    });

    // Start menu music
    this.time.delayedCall(600, () => audioSystem.playTrack('battle_hymn'));
  }

  _proceed() {
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      if (this.autoLogin) {
        this.scene.start('MainMenu');
      } else {
        this.scene.start('Auth');
      }
    });
  }
}
