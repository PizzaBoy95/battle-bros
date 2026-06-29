const { CHARACTERS, CHARACTER_IDS } = require('../../../shared/constants');

const BOT_DECK_SIZE = 7;
const CANVAS_W = 480;

class BotController {
  constructor(room, botUserId, botPlayerKey) {
    this.room = room;
    this.botUserId = botUserId;
    this.botPlayerKey = botPlayerKey;
    this.deck = this._buildDeck();
    this._timer = null;
    this._running = false;
  }

  _buildDeck() {
    const shuffled = [...CHARACTER_IDS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, BOT_DECK_SIZE);
  }

  start() {
    this._running = true;
    this._scheduleNext(3000 + Math.random() * 2000);
  }

  stop() {
    this._running = false;
    clearTimeout(this._timer);
    this._timer = null;
  }

  _scheduleNext(delay) {
    if (!this._running) return;
    this._timer = setTimeout(() => {
      if (this.room.phase === 'ended') { this.stop(); return; }
      this._tryDeploy();
      const base = this.room.overtime ? 1800 : 3000;
      this._scheduleNext(base + Math.random() * 3000);
    }, delay);
  }

  _tryDeploy() {
    const elixir = this.room.elixir[this.botUserId] || 0;

    const affordable = this.deck.filter(id => {
      const c = CHARACTERS[id];
      return c && c.elixirCost <= elixir;
    });
    if (!affordable.length) return;

    // Prefer higher-cost cards to spend elixir efficiently
    affordable.sort((a, b) => (CHARACTERS[b].elixirCost || 0) - (CHARACTERS[a].elixirCost || 0));
    const charId = affordable[Math.floor(Math.random() * Math.min(2, affordable.length))];

    const x = 70 + Math.random() * (CANVAS_W - 140);
    const y = this.botPlayerKey === 'p2'
      ? 55 + Math.random() * 170
      : 630 + Math.random() * 170;

    this.room.deployUnit(this.botUserId, {
      charId,
      x: Math.round(x),
      y: Math.round(y),
      level: 1
    });
  }
}

module.exports = BotController;
