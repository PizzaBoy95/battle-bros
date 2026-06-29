// Client-side elixir bar display — actual values come from server

export class ElixirSystem {
  constructor(scene, x, y, width = 320) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.width = width;
    this.elixir = 5;
    this.maxElixir = 10;
    this.overtime = false;

    this._build();
  }

  _build() {
    const s = this.scene;

    // Background bar
    this.bg = s.add.rectangle(this.x, this.y, this.width + 8, 28, 0x1a1a2e)
      .setOrigin(0.5).setDepth(10);

    // Elixir cells (10 cells)
    this.cells = [];
    const cellW = (this.width - 2) / 10;
    for (let i = 0; i < 10; i++) {
      const cx = this.x - this.width / 2 + i * cellW + cellW / 2;
      const cell = s.add.rectangle(cx, this.y, cellW - 2, 22, 0x8E44AD).setDepth(11);
      cell.setAlpha(0.2);
      this.cells.push(cell);
    }

    // Elixir count text
    this.label = s.add.text(this.x, this.y + 24, '5 ⚡', {
      fontSize: '14px', fill: '#A29BFE', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);

    // Overtime indicator
    this.overtimeLabel = s.add.text(this.x, this.y - 22, '', {
      fontSize: '12px', fill: '#FFD700', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);
  }

  update(elixir, overtime = false) {
    this.elixir = elixir;
    this.overtime = overtime;

    for (let i = 0; i < 10; i++) {
      const filled = i < Math.floor(elixir);
      const partial = !filled && i === Math.floor(elixir);
      const alpha = filled ? 0.9 : partial ? (elixir % 1) * 0.7 + 0.1 : 0.15;
      const color = overtime ? 0xFFD700 : 0x8E44AD;
      this.cells[i].setFillStyle(color).setAlpha(alpha);
    }

    this.label.setText(`${Math.floor(elixir)} ⚡`);
    this.label.setStyle({ fill: overtime ? '#FFD700' : '#A29BFE' });
    this.overtimeLabel.setText(overtime ? '2x ELIXIR' : '');
  }

  destroy() {
    this.bg.destroy();
    this.cells.forEach(c => c.destroy());
    this.label.destroy();
    this.overtimeLabel.destroy();
  }
}
