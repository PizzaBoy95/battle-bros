// Client-side battle timer display

export class BattleTimer {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.timerMs = 180000;
    this.overtime = false;
    this.suddenDeath = false;

    this._build();
  }

  _build() {
    const s = this.scene;

    this.bg = s.add.rectangle(this.x, this.y, 110, 38, 0x0a0a1a, 0.85)
      .setOrigin(0.5).setDepth(10);

    this.text = s.add.text(this.x, this.y, '3:00', {
      fontSize: '26px', fill: '#FFFFFF',
      fontFamily: 'Arial Black, Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);

    this.phaseLabel = s.add.text(this.x, this.y + 24, '', {
      fontSize: '11px', fill: '#FFD700', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);
  }

  update(timerMs, overtime, suddenDeath) {
    this.timerMs = timerMs;
    this.overtime = overtime;
    this.suddenDeath = suddenDeath;

    const totalSec = Math.ceil(timerMs / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    const timeStr = `${min}:${sec.toString().padStart(2, '0')}`;

    this.text.setText(timeStr);

    if (suddenDeath) {
      this.text.setStyle({ fill: '#FF0000' });
      this.phaseLabel.setText('SUDDEN DEATH');
      this.phaseLabel.setStyle({ fill: '#FF4444' });
    } else if (overtime) {
      this.text.setStyle({ fill: '#FFD700' });
      this.phaseLabel.setText('OVERTIME');
      this.phaseLabel.setStyle({ fill: '#FFD700' });
      // Pulse
      this.scene.tweens.add({ targets: this.text, scaleX: 1.1, scaleY: 1.1, duration: 200, yoyo: true });
    } else {
      const color = totalSec <= 30 ? '#FF6B6B' : '#FFFFFF';
      this.text.setStyle({ fill: color });
      this.phaseLabel.setText('');
    }
  }

  flashOvertime() {
    this.scene.tweens.add({
      targets: this.text, scaleX: 1.3, scaleY: 1.3,
      duration: 150, yoyo: true, repeat: 3
    });
  }

  destroy() {
    this.bg.destroy();
    this.text.destroy();
    this.phaseLabel.destroy();
  }
}
