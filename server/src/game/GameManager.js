const { v4: uuidv4 } = require('uuid');
const GameRoom = require('./GameRoom');
const BotController = require('./BotController');

class GameManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map();
    this.queue1v1 = [];
    this.queue2v2 = [];
    this.userToRoom = new Map();
  }

  joinQueue(socket, data, mode = '1v1') {
    const { userId, username, deck } = data;
    this.leaveQueue(userId);
    const entry = { socket, userId, username, deck };

    if (mode === '1v1') {
      this.queue1v1.push(entry);
      socket.emit('queue_status', { mode: '1v1', position: this.queue1v1.length });
      if (this.queue1v1.length >= 2) {
        const p1 = this.queue1v1.shift();
        const p2 = this.queue1v1.shift();
        this._createRoom([p1, p2], '1v1');
      }
    } else if (mode === '2v2') {
      this.queue2v2.push(entry);
      socket.emit('queue_status', { mode: '2v2', position: this.queue2v2.length });
      if (this.queue2v2.length >= 4) {
        const players = this.queue2v2.splice(0, 4);
        this._createRoom(players, '2v2');
      }
    }
  }

  // Instantly create a game against a CPU bot
  createBotGame(socket, data) {
    const { userId, username, deck } = data;
    const botUserId = `cpu_${uuidv4().slice(0, 8)}`;
    const humanPlayer = { socket, userId, username, deck };
    const botPlayer   = { socket: null, userId: botUserId, username: 'CPU Bot', deck: [] };
    this._createRoom([humanPlayer, botPlayer], '1v1', botUserId);
  }

  inviteFriend(socket, data) {
    const { targetUsername, userId, username, deck } = data;
    const targetSocket = this._findSocketByUsername(targetUsername);
    if (!targetSocket) {
      socket.emit('invite_error', { error: 'Player not found or offline' });
      return;
    }
    targetSocket.emit('friend_invite', { from: username, fromId: userId });
    socket.emit('invite_sent', { to: targetUsername });
  }

  acceptInvite(socket, data) {
    const { fromId, userId, username, deck } = data;
    const fromEntry = this._findSocketByUserId(fromId);
    if (!fromEntry) {
      socket.emit('invite_error', { error: 'Inviter disconnected' });
      return;
    }
    this._createRoom([fromEntry, { socket, userId, username, deck }], '1v1');
  }

  leaveQueue(userId) {
    this.queue1v1 = this.queue1v1.filter(e => e.userId !== userId);
    this.queue2v2 = this.queue2v2.filter(e => e.userId !== userId);
  }

  _createRoom(players, mode, botUserId = null) {
    const roomId = uuidv4();
    const maps = ['ember_crossing', 'frostpeak_arena'];
    const map = maps[Math.floor(Math.random() * maps.length)];

    const room = new GameRoom(roomId, players, mode, map, this.io);
    this.rooms.set(roomId, room);

    for (const p of players) {
      this.userToRoom.set(p.userId, roomId);
      if (p.socket) {
        p.socket.join(roomId);
        p.socket.data.roomId = roomId;
      }
    }

    room.start();

    // Wire up bot controller if CPU game
    let bot = null;
    if (botUserId) {
      const botKey = room.playerKey[botUserId];
      bot = new BotController(room, botUserId, botKey);
      bot.start();
    }

    room.onEnd = () => {
      if (bot) bot.stop();
      for (const p of players) this.userToRoom.delete(p.userId);
      this.rooms.delete(roomId);
    };
  }

  handleDisconnect(socket) {
    const roomId = socket.data.roomId;
    if (roomId) {
      const room = this.rooms.get(roomId);
      if (room) room.playerDisconnected(socket.data.userId);
    }
    if (socket.data.userId) this.leaveQueue(socket.data.userId);
  }

  deployUnit(socket, data) {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    const room = this.rooms.get(roomId);
    if (room) room.deployUnit(socket.data.userId, data);
  }

  _findSocketByUsername(username) {
    for (const [, socket] of this.io.sockets.sockets) {
      if (socket.data.username === username) return socket;
    }
    return null;
  }

  _findSocketByUserId(userId) {
    for (const [, socket] of this.io.sockets.sockets) {
      if (socket.data.userId === userId) {
        return { socket, userId, username: socket.data.username, deck: socket.data.deck };
      }
    }
    return null;
  }
}

module.exports = GameManager;
