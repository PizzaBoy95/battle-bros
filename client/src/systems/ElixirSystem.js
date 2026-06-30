// Client-side elixir bar display — actual values come from server

export class ElixirSystem {
  constructor(scene, x, y, width = 320) {
    this.scene = scene;
    this.x = x; this.y = y; this.width = width;
    this.elixir = 5; this.maxElixir = 10; this.overtime = false;
    this._build();
  }

  _build() {
    const s = this.scene;
    const W = this.width;

    // Outer dark pill background
    this.bgG = s.add.graphics().setDepth(10);
    this.bgG.fillStyle(0x0a0a1e, 0.92);
    this.bgG.fillRoundedRect(this.x - W / 2 - 6, this.y - 16, W + 12, 32, 10);
    this.bgG.lineStyle(1.5, 0x3a2255, 0.8);
    this.bgG.strokeRoundedRect(this.x - W / 2 - 6, this.y - 16, W + 12, 32, 10);

    // 10 rounded-rect elixir segments
    this.cells = [];
    this.cellGs = [];
    const cellW = (W - 18) / 10;
    for (let i = 0; i < 10; i++) {
      const cx = this.x - W / 2 + i * (cellW + 2) + cellW / 2;
      const cg = s.add.graphics().setDepth(11);
      this.cellGs.push({ g: cg, cx, i });
      this.cells.push({ g: cg, cx });
    }

    // Elixir count + lightning label
    this.label = s.add.text(this.x, this.y + 22, '5', {
      fontSize: '13px', fill: '#cc88ff', fontFamily: 'Arial Black, Arial', fontStyle: 'bold',
      stroke: '#110022', strokeThickness: 3
    }).setOrigin(0.5).setDepth(11);

    // Lightning icon left of count
    this.iconLbl = s.add.text(this.x - 14, this.y + 22, '⚡', {
      fontSize: '11px'
    }).setOrigin(0.5).setDepth(11);

    // Overtime label
    this.overtimeLabel = s.add.text(this.x, this.y - 24, '', {
      fontSize: '11px', fill: '#FFD700', fontFamily: 'Arial', fontStyle: 'bold',
      stroke: '#332200', strokeThickness: 2
    }).setOrigin(0.5).setDepth(11);
  }

  update(elixir, overtime = false) {
    this.elixir = elixir;
    this.overtime = overtime;
    const W = this.width;
    const cellW = (W - 18) / 10;

    for (const { g, cx, i } of this.cellGs) {
      g.clear();
      const filled  = i < Math.floor(elixir);
      const partial = !filled && i === Math.floor(elixir);
      const alpha   = filled ? 0.95 : partial ? (elixir % 1) * 0.75 + 0.12 : 0.15;

      // Dim background slot
      g.fillStyle(0x220033, 0.55);
      g.fillRoundedRect(cx - cellW / 2, this.y - 13, cellW, 26, 5);

      if (alpha > 0.18) {
        // Filled segment — gradient simulation (3 layers)
        const col  = overtime ? 0xFFD700 : 0x9933CC;
        const col2 = overtime ? 0xFFAA00 : 0x7722AA;
        const col3 = overtime ? 0xFFEE88 : 0xCC66FF;
        g.fillStyle(col2, alpha * 0.9);
        g.fillRoundedRect(cx - cellW / 2, this.y - 13, cellW, 26, 5);
        g.fillStyle(col, alpha);
        g.fillRoundedRect(cx - cellW / 2, this.y - 13, cellW, 22, 5);
        // Specular top shine
        g.fillStyle(col3, alpha * 0.35);
        g.fillRoundedRect(cx - cellW / 2 + 2, this.y - 12, cellW - 4, 9, 4);
        // Segment border
        g.lineStyle(1, overtime ? 0xFFEE44 : 0xAA44FF, 0.6);
        g.strokeRoundedRect(cx - cellW / 2, this.y - 13, cellW, 26, 5);
      }
    }

    const col = overtime ? '#FFD700' : '#cc88ff';
    this.label.setText(String(Math.floor(elixir))).setStyle({ fill: col });
    this.iconLbl.setStyle({ fill: col });
    this.overtimeLabel.setText(overtime ? '⚡ 2x ELIXIR ⚡' : '');
  }

  destroy() {
    this.bgG.destroy();
    this.cellGs.forEach(({ g }) => g.destroy());
    this.label.destroy();
    this.iconLbl.destroy();
    this.overtimeLabel.destroy();
  }
}
