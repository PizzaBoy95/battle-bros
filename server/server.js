const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const { getDb } = require('./src/db/database');
const authRoutes = require('./src/auth/routes');
const GameManager = require('./src/game/GameManager');
const { registerHandlers } = require('./src/socket/handlers');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3001;
const IS_PROD = process.env.NODE_ENV === 'production';

// In production client+server share the same origin, so CORS isn't needed.
// In dev allow localhost and ngrok.
const CORS_ORIGIN = IS_PROD
  ? '*'
  : ['http://localhost:5173', /localhost/, /\.ngrok\.io/, /\.ngrok-free\.app/];

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: CORS_ORIGIN, credentials: false }));
app.use(express.json());

// ── Socket.io ─────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: CORS_ORIGIN, methods: ['GET', 'POST'] }
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.set('io', io);                       // routes can broadcast (global chat)
app.use('/auth', authRoutes);
app.use('/clans', require('./src/clans/routes'));

app.get('/health', (_, res) => res.json({ status: 'ok', time: Date.now() }));

// Serve built client in production
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../client/dist');
  // Hashed assets cache forever; index.html must NEVER be cached so players
  // always get the newest bundle after a deploy.
  app.use(express.static(clientDist, {
    maxAge: '30d',
    setHeaders: (res, p) => { if (p.endsWith('index.html')) res.setHeader('Cache-Control', 'no-store'); }
  }));
  app.get('*', (_, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// ── Game ──────────────────────────────────────────────────────────────────────
const gameManager = new GameManager(io);
registerHandlers(io, gameManager);

// ── Start ─────────────────────────────────────────────────────────────────────
getDb(); // Initialize database

server.listen(PORT, () => {
  console.log(`[Server] Battle Bros server running on port ${PORT}`);
  console.log(`[Server] CORS origin: ${IS_PROD ? '*' : 'localhost'}`);
});
