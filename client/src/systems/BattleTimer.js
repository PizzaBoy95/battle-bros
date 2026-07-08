// Client-side battle timer display

export class BattleTimer {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x; this.y = y;
    this.timerMs = 180000;
    this.overtime = false;
    this.suddenDeath = false;
    this._build();
  }

  _build() {
    const s = this.scene;

    // Oval/pill background
    this.bgG = s.add.graphics().setDepth(10);
    this._drawBg(0x0a0a1a, 0x1a1a3a);

    this.text = s.add.text(this.x, this.y - 2, '3:00', {
      fontSize: '26px', fill: '#FFFFFF',
      fontFamily: 'Arial Black, Arial', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(11);

    this.phaseLabel = s.add.text(this.x, this.y + 22, '', {
      fontSize: '10px', fill: '#FFD700',
      fontFamily: 'Arial', fontStyle: 'bold',
      stroke: '#332200', strokeThickness: 2
    }).setOrigin(0.5).setDepth(11);
  }

  _drawBg(fill, border) {
    this.bgG.clear();
    // Outer glow ring
    this.bgG.lineStyle(6, border, 0.22);
    this.bgG.strokeEllipse(this.x, this.y, 128, 52);
    // Main oval pill
    this.bgG.fillStyle(fill, 0.90);
    this.bgG.fillEllipse(this.x, this.y, 120, 44);
    // Border ring
    this.bgG.lineStyle(1.5, border, 0.80);
    this.bgG.strokeEllipse(this.x, this.y, 120, 44);
    // Inner top shine
    this.bgG.fillStyle(0xFFFFFF, 0.06);
    this.bgG.fillEllipse(this.x - 4, this.y - 8, 72, 14);
  }

  update(timerMs, overtime, suddenDeath) {
    this.timerMs = timerMs;
    this.overtime = overtime;
    this.suddenDeath = suddenDeath;

    const totalSec = Math.ceil(timerMs / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    this.text.setText(`${min}:${sec.toString().padStart(2, '0')}`);

    if (suddenDeath) {
      this._drawBg(0x1a0000, 0xFF2222);
      this.text.setStyle({ fill: '#FF4444' });
      this.phaseLabel.setText('SUDDEN DEATH').setStyle({ fill: '#FF4444' });
    } else if (overtime) {
      this._drawBg(0x1a1400, 0xFFD700);
      this.text.setStyle({ fill: '#FFD700' });
      this.phaseLabel.setText('OVERTIME').setStyle({ fill: '#FFD700' });
      this.scene.tweens.add({ targets: this.text, scaleX: 1.08, scaleY: 1.08, duration: 180, yoyo: true });
    } else {
      const low = totalSec <= 30;
      this._drawBg(0x0a0a1a, low ? 0xFF4444 : 0x2a2a5a);
      this.text.setStyle({ fill: low ? '#FF6B6B' : '#FFFFFF' });
      this.phaseLabel.setText('');
      // Heartbeat pulse in the final 10 seconds
      if (totalSec <= 10 && this._lastPulse !== totalSec) {
        this._lastPulse = totalSec;
        this.scene.tweens.add({ targets: this.text, scaleX: 1.25, scaleY: 1.25, duration: 130, yoyo: true });
      }
    }
  }

  flashOvertime() {
    this.scene.tweens.add({
      targets: this.text, scaleX: 1.3, scaleY: 1.3,
      duration: 150, yoyo: true, repeat: 3
    });
  }

  destroy() {
    this.bgG.destroy();
    this.text.destroy();
    this.phaseLabel.destroy();
  }
}
