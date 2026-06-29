import Phaser from 'phaser';
import { socketManager } from '../network/SocketManager.js';
import { audioSystem } from '../systems/AudioSystem.js';

export class LobbyScene extends Phaser.Scene {
  constructor() { super('Lobby'); }

  init(data) {
    this.battleMode = data?.mode || '1v1';
    this.deck = data?.deck || this.registry.get('deck') || [];
  }

  create() {
    const { width: W, height: H } = this.scale;

    this.add.rectangle(0, 0, W, H, 0x060614).setOrigin(0);

    // Star field
    const g = this.add.graphics();
    for (let i = 0; i < 70; i++) {
      g.fillStyle(0xFFFFFF, 0.1 + Math.random() * 0.4);
      g.fillRect(Math.random() * W, Math.random() * H, 1, 1);
    }

    this.add.text(W / 2, 70, 'BATTLE BROS', {
      fontSize: '30px', fill: '#FFD700',
      fontFamily: 'Arial Black, Arial', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.modeLabel = this.add.text(W / 2, 108, `MODE: ${this.battleMode.toUpperCase()}`, {
      fontSize: '14px', fill: '#AAAACC', fontFamily: 'Arial', letterSpacing: 3
    }).setOrigin(0.5);

    // Animated searching dots
    this.statusText = this.add.text(W / 2, H / 2 - 40, 'Searching for opponent', {
      fontSize: '20px', fill: '#FFFFFF', fontFamily: 'Arial'
    }).setOrigin(0.5);

    this.dotsText = this.add.text(W / 2, H / 2 + 10, '• • •', {
      fontSize: '28px', fill: '#8E44AD', fontFamily: 'Arial'
    }).setOrigin(0.5);

    // Spinning indicator
    this.spinner = this.add.graphics();
    this.spinAngle = 0;

    // Cancel button
    this.add.text(W / 2, H * 0.72, '[ CANCEL ]', {
      fontSize: '16px', fill: '#888888', fontFamily: 'Arial'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        socketManager.leaveQueue();
        this.scene.start('MainMenu');
      });

    // Dots animation
    this.time.addEvent({
      delay: 500, loop: true,
      callback: () => {
        const dots = ['•', '• •', '• • •'];
        this.dotsCount = ((this.dotsCount || 0) + 1) % 3;
        this.dotsText.setText(dots[this.dotsCount]);
      }
    });

    // Socket listeners
    socketManager.on('queue_status', (data) => {
      this.statusText.setText(`In queue: position ${data.position}`);
    });

    socketManager.on('match_start', (data) => {
      this._onMatchStart(data);
    });

    // Bot modes — skip matchmaking entirely, start immediately
    if (this.battleMode === 'bot' || this.battleMode === 'vs_cpu') {
      this.statusText.setText('Setting up CPU match...');
      this.modeLabel.setText('MODE: VS CPU  🤖');
      this.dotsText.setText('');
      this.time.delayedCall(800, () => {
        this._startBotMatch({ mode:'bot', players:[
          { username: this.registry.get('username')||'You' },
          { username: '🤖 Bot' }
        ]});
      });
    } else if (this.battleMode === '2v2_bot') {
      this.statusText.setText('Assembling your team...');
      this.modeLabel.setText('MODE: 2v2 vs BOT  🤖');
      this.dotsText.setText('');
      this.time.delayedCall(1000, () => {
        this._startBotMatch({ mode:'2v2_bot', players:[
          { username: this.registry.get('username')||'You' },
          { username: '🤖 Ally Bot' },
          { username: '🤖 Enemy 1' },
          { username: '🤖 Enemy 2' }
        ]});
      });
    } else {
      socketManager.joinQueue(this.deck, this.battleMode);
    }

    this.cameras.main.fadeIn(300);
  }

  update() {
    // Spin the indicator
    this.spinner.clear();
    this.spinAngle += 0.06;
    const { width: W, height: H } = this.scale;
    const cx = W / 2, cy = H / 2 + 70;
    const r = 30;
    for (let i = 0; i < 8; i++) {
      const angle = this.spinAngle + (i / 8) * Math.PI * 2;
      const alpha = (i / 8) * 0.8 + 0.1;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      this.spinner.fillStyle(0x8E44AD, alpha);
      this.spinner.fillCircle(x, y, 4 - i * 0.3);
    }
  }

  _startBotMatch(data) {
    const botData = {
      ...data,
      roomId: 'bot_' + Date.now(),
      isBotMatch: true,
      deck: this.deck,
    };
    this.statusText.setText(data.mode === '2v2_bot' ? 'Team ready!\n🤖 Ally + 2 Enemies' : 'Match ready!\nVS 🤖 Bot');
    this.statusText.setStyle({ fill:'#FFD700' });
    audioSystem.playDeploy();
    this.time.delayedCall(900, () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.registry.set('matchInfo', botData);
        this.scene.start('Battle', { matchInfo: botData, deck: this.deck });
      });
    });
  }

  _onMatchStart(data) {
    // Store match info
    this.registry.set('matchInfo', data);

    const opponentEntry = data.players?.find(p => p.username !== this.registry.get('username'));
    const opponentName = opponentEntry?.username || 'Opponent';

    this.statusText.setText(`Match found!\nVS ${opponentName}`);
    this.dotsText.setText('');
    this.statusText.setStyle({ fill: '#FFD700' });

    audioSystem.playDeploy();

    this.time.delayedCall(1200, () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        socketManager.offAll('match_start');
        socketManager.offAll('queue_status');
        this.scene.start('Battle', { matchInfo: data, deck: this.deck });
      });
    });
  }

  shutdown() {
    socketManager.offAll('match_start');
    socketManager.offAll('queue_status');
  }
}
