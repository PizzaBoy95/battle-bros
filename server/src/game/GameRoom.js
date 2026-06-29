const { v4: uuidv4 } = require('uuid');
const {
  TOWER_POSITIONS, TOWER_STATS, ELIXIR, BATTLE_TIMER, CHARACTERS, DEPLOY_ZONE
} = require('../../../shared/constants');
const { updateUnits, getScaledStats } = require('./UnitAI');

const TICK_MS = 50;  // 20 TPS
const STATE_BROADCAST_EVERY = 2; // broadcast every 2 ticks

class GameRoom {
  constructor(roomId, players, mode, map, io) {
    this.roomId = roomId;
    this.players = players;  // [{ socket, userId, username, deck }]
    this.mode = mode;
    this.map = map;
    this.io = io;
    this.onEnd = null;

    // Game state
    this.units = [];
    this.unitIdCounter = 0;

    const makeTowers = () => ({
      guardLeft:  { hp: TOWER_STATS.guard.maxHp, maxHp: TOWER_STATS.guard.maxHp, attackCooldown: 0 },
      guardRight: { hp: TOWER_STATS.guard.maxHp, maxHp: TOWER_STATS.guard.maxHp, attackCooldown: 0 },
      king:       { hp: TOWER_STATS.king.maxHp,  maxHp: TOWER_STATS.king.maxHp,  attackCooldown: 0 }
    });

    this.towers = { p1: makeTowers(), p2: makeTowers() };

    // Elixir per player
    this.elixir = {};
    this.elixirAccum = {};
    for (const p of players) {
      this.elixir[p.userId] = ELIXIR.startAmount;
      this.elixirAccum[p.userId] = 0;
    }

    this.timerMs = BATTLE_TIMER.standard * 1000;
    this.overtime = false;
    this.suddenDeath = false;
    this.phase = 'waiting'; // waiting | battle | overtime | ended

    // 2v2: teams { team1: [userId, userId], team2: [userId, userId] }
    this.teams = mode === '2v2'
      ? { p1: [players[0].userId, players[1].userId], p2: [players[2].userId, players[3].userId] }
      : { p1: [players[0].userId], p2: [players[1].userId] };

    // map userId → player key (p1/p2)
    this.playerKey = {};
    for (const uid of this.teams.p1) this.playerKey[uid] = 'p1';
    for (const uid of this.teams.p2) this.playerKey[uid] = 'p2';

    this.tickCount = 0;
    this.startTime = null;
    this.interval = null;
    this.winnerKey = null;
    this.disconnected = new Set();
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  start() {
    // Notify all players that the match is starting
    const matchInfo = {
      roomId: this.roomId,
      map: this.map,
      mode: this.mode,
      players: this.players.map(p => ({ userId: p.userId, username: p.username })),
      teams: this.teams
    };
    this.io.to(this.roomId).emit('match_start', matchInfo);

    this.phase = 'battle';
    this.startTime = Date.now();
    this.interval = setInterval(() => this._tick(), TICK_MS);
  }

  deployUnit(userId, data) {
    if (this.phase !== 'battle' && this.phase !== 'overtime') return;

    const { charId, x, y, level } = data;
    const charDef = CHARACTERS[charId];
    if (!charDef) return;

    const cost = charDef.elixirCost;
    const currentElixir = this.elixir[userId] || 0;
    if (currentElixir < cost) return; // not enough elixir

    // Validate deploy position is in player's zone
    const playerKey = this.playerKey[userId];
    if (!playerKey) return;

    // p1 deploys in bottom, p2 deploys in top
    const deployY = playerKey === 'p1'
      ? Math.max(DEPLOY_ZONE.minY, Math.min(DEPLOY_ZONE.maxY, y || 680))
      : Math.min(854 - DEPLOY_ZONE.minY, Math.max(854 - DEPLOY_ZONE.maxY, y || 174));

    const deployX = Math.max(20, Math.min(460, x || 240));

    this.elixir[userId] = Math.max(0, currentElixir - cost);

    const unit = {
      id: `u${++this.unitIdCounter}`,
      charId,
      owner: playerKey,
      userId,
      x: deployX,
      y: deployY,
      hp: getScaledStats(charDef, level || 1).hp,
      maxHp: getScaledStats(charDef, level || 1).hp,
      level: level || 1,
      state: 'moving',
      targetId: null,
      attackCooldown: 0,
      damageDealt: 0,
      spawnedAt: Date.now()
    };

    this.units.push(unit);

    // Special: bone_shard spawns skeletons
    if (charId === 'bone_shard') {
      for (let i = 0; i < 3; i++) {
        this.units.push({
          id: `u${++this.unitIdCounter}`,
          charId: '_skeleton',
          owner: playerKey, userId,
          x: deployX + (i - 1) * 30, y: deployY,
          hp: 150, maxHp: 150, level: 1,
          state: 'moving', targetId: null,
          attackCooldown: 0, damageDealt: 0, spawnedAt: Date.now()
        });
      }
    }

    this.io.to(this.roomId).emit('unit_deployed', {
      unit: { id: unit.id, charId, owner: playerKey, x: deployX, y: deployY, hp: unit.hp, maxHp: unit.maxHp, level: unit.level }
    });
  }

  playerDisconnected(userId) {
    this.disconnected.add(userId);
    if (this.disconnected.size >= this.players.length) {
      this._endGame(null, 'all_disconnected');
    } else {
      // Other player wins
      const winner = this.players.find(p => !this.disconnected.has(p.userId));
      if (winner) {
        const winKey = this.playerKey[winner.userId];
        this._endGame(winKey, 'opponent_disconnected');
      }
    }
  }

  // ── Private ─────────────────────────────────────────────────────────────────

  _tick() {
    if (this.phase === 'ended') return;

    const dt = TICK_MS;
    this.tickCount++;

    // Update timer
    this.timerMs -= dt;

    if (this.timerMs <= 0 && !this.overtime && !this.suddenDeath) {
      const winner = this._checkTowerWinner();
      if (winner) {
        this._endGame(winner, 'time_up');
        return;
      }
      // Go to overtime
      this.overtime = true;
      this.timerMs = BATTLE_TIMER.overtime * 1000;
      this.io.to(this.roomId).emit('overtime_start', {});
    } else if (this.timerMs <= 0 && this.overtime) {
      const winner = this._checkTowerWinner();
      if (winner) {
        this._endGame(winner, 'overtime_end');
      } else {
        // Sudden death
        this.suddenDeath = true;
        this.overtime = false;
        this.timerMs = 999999;
        this.io.to(this.roomId).emit('sudden_death_start', {});
      }
      return;
    }

    // Elixir regen
    const regenMs = this.overtime ? ELIXIR.overtimeRegenMs : ELIXIR.regenMs;
    for (const p of this.players) {
      this.elixirAccum[p.userId] = (this.elixirAccum[p.userId] || 0) + dt;
      if (this.elixirAccum[p.userId] >= regenMs) {
        this.elixirAccum[p.userId] -= regenMs;
        this.elixir[p.userId] = Math.min(ELIXIR.max, (this.elixir[p.userId] || 0) + 1);
      }
    }

    // Update units (movement + combat)
    const { units: alive, events } = updateUnits(this.units, this.towers, dt);
    this.units = alive.filter(u => u.hp > 0);

    // Broadcast events
    for (const evt of events) {
      this.io.to(this.roomId).emit('game_event', evt);

      if (evt.type === 'tower_destroyed') {
        if (evt.tower === 'king') {
          const winnerKey = evt.player === 'p1' ? 'p2' : 'p1';
          this._endGame(winnerKey, 'king_destroyed');
          return;
        }
      }
    }

    // Broadcast full state every N ticks
    if (this.tickCount % STATE_BROADCAST_EVERY === 0) {
      const elixirMap = {};
      for (const p of this.players) elixirMap[p.userId] = this.elixir[p.userId];

      this.io.to(this.roomId).emit('game_state', {
        units: this.units.map(u => ({
          id: u.id, charId: u.charId, owner: u.owner,
          x: Math.round(u.x), y: Math.round(u.y),
          hp: Math.round(u.hp), maxHp: u.maxHp, state: u.state, level: u.level
        })),
        towers: {
          p1: {
            king:       { hp: this.towers.p1.king.hp,       maxHp: TOWER_STATS.king.maxHp },
            guardLeft:  { hp: this.towers.p1.guardLeft.hp,  maxHp: TOWER_STATS.guard.maxHp },
            guardRight: { hp: this.towers.p1.guardRight.hp, maxHp: TOWER_STATS.guard.maxHp }
          },
          p2: {
            king:       { hp: this.towers.p2.king.hp,       maxHp: TOWER_STATS.king.maxHp },
            guardLeft:  { hp: this.towers.p2.guardLeft.hp,  maxHp: TOWER_STATS.guard.maxHp },
            guardRight: { hp: this.towers.p2.guardRight.hp, maxHp: TOWER_STATS.guard.maxHp }
          }
        },
        elixir: elixirMap,
        timerMs: Math.max(0, this.timerMs),
        overtime: this.overtime,
        suddenDeath: this.suddenDeath
      });
    }
  }

  _checkTowerWinner() {
    const p1Crowns = this._countCrowns('p2'); // crowns p1 took from p2
    const p2Crowns = this._countCrowns('p1');
    if (p1Crowns > p2Crowns) return 'p1';
    if (p2Crowns > p1Crowns) return 'p2';
    return null;
  }

  _countCrowns(player) {
    // Count towers destroyed on the given player's side
    let crowns = 0;
    if (this.towers[player].guardLeft.hp <= 0)  crowns++;
    if (this.towers[player].guardRight.hp <= 0) crowns++;
    if (this.towers[player].king.hp <= 0)       crowns += 3;
    return crowns;
  }

  _endGame(winnerKey, reason) {
    if (this.phase === 'ended') return;
    this.phase = 'ended';
    this.winnerKey = winnerKey;

    clearInterval(this.interval);

    // Compute XP per player from damage dealt
    const damagePerUser = {};
    for (const u of this.units) {
      damagePerUser[u.userId] = (damagePerUser[u.userId] || 0) + (u.damageDealt || 0);
    }

    const winnerUserIds = winnerKey ? (this.teams[winnerKey] || []) : [];
    const p1Crowns = this._countCrowns('p2');
    const p2Crowns = this._countCrowns('p1');

    this.io.to(this.roomId).emit('game_over', {
      winnerKey,
      winnerUserIds,
      reason,
      crowns: { p1: p1Crowns, p2: p2Crowns },
      damagePerUser
    });

    if (this.onEnd) setTimeout(() => this.onEnd(), 3000);
  }
}

module.exports = GameRoom;
