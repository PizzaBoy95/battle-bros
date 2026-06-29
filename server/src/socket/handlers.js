const { verifyToken } = require('../auth/auth');

function registerHandlers(io, gameManager) {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));
    const decoded = verifyToken(token);
    if (!decoded) return next(new Error('Invalid token'));
    socket.data.userId = decoded.id;
    socket.data.username = decoded.username;
    next();
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.data.username} (${socket.id})`);

    // ── Matchmaking ────────────────────────────────────────────────────────────
    socket.on('join_queue', (data) => {
      const { deck, mode = '1v1' } = data || {};
      socket.data.deck = deck;
      gameManager.joinQueue(socket, {
        userId: socket.data.userId,
        username: socket.data.username,
        deck
      }, mode);
    });

    socket.on('leave_queue', () => {
      gameManager.leaveQueue(socket.data.userId);
      socket.emit('queue_left', {});
    });

    // ── Friend Invite ──────────────────────────────────────────────────────────
    socket.on('invite_friend', (data) => {
      gameManager.inviteFriend(socket, {
        ...data,
        userId: socket.data.userId,
        username: socket.data.username
      });
    });

    socket.on('accept_invite', (data) => {
      gameManager.acceptInvite(socket, {
        ...data,
        userId: socket.data.userId,
        username: socket.data.username,
        deck: socket.data.deck
      });
    });

    socket.on('decline_invite', (data) => {
      const fromSocket = gameManager._findSocketByUserId(data.fromId)?.socket;
      if (fromSocket) fromSocket.emit('invite_declined', { by: socket.data.username });
    });

    // ── VS CPU ─────────────────────────────────────────────────────────────────
    socket.on('play_vs_cpu', (data) => {
      const { deck } = data || {};
      socket.data.deck = deck;
      gameManager.createBotGame(socket, {
        userId: socket.data.userId,
        username: socket.data.username,
        deck
      });
    });

    // ── Battle ─────────────────────────────────────────────────────────────────
    socket.on('deploy_unit', (data) => {
      gameManager.deployUnit(socket, data);
    });

    socket.on('chat_message', (data) => {
      const roomId = socket.data.roomId;
      if (!roomId) return;
      socket.to(roomId).emit('chat_message', {
        from: socket.data.username,
        text: (data.text || '').slice(0, 100)
      });
    });

    // ── Disconnect ─────────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.data.username}`);
      gameManager.handleDisconnect(socket);
    });
  });
}

module.exports = { registerHandlers };
