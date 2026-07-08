// Clans: create/join/leave (max 35), clan chat, Siege War, and the
// Global Chat Scroll — one broadcast message per scroll consumed.
const express = require('express');
const { getDb } = require('../db/database');
const { authMiddleware } = require('../auth/auth');

const router = express.Router();
const MAX_MEMBERS = 35;
const CREATE_COST = 1000;
const WAR_HOURS   = 24;
const WAR_GOAL    = 200;    // siege points to breach the Golden Keep
const RIVALS = ['Goblin Horde', 'Iron Legion', 'Shadow Pact', 'Frost Wolves',
                'Ember Cult', 'Sky Raiders', 'Bone Battalion', 'Crystal Order'];

// ── Schema (idempotent) ───────────────────────────────────────────────────────
getDb().exec(`
CREATE TABLE IF NOT EXISTS clans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL, badge TEXT DEFAULT '🏰',
  description TEXT DEFAULT '', created_by INTEGER,
  war_wins INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (strftime('%s','now'))
);
CREATE TABLE IF NOT EXISTS clan_members (
  clan_id INTEGER NOT NULL, user_id INTEGER NOT NULL UNIQUE,
  role TEXT DEFAULT 'member', joined_at INTEGER DEFAULT (strftime('%s','now'))
);
CREATE TABLE IF NOT EXISTS clan_chat (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clan_id INTEGER NOT NULL, user_id INTEGER, username TEXT,
  message TEXT NOT NULL, created_at INTEGER DEFAULT (strftime('%s','now'))
);
CREATE TABLE IF NOT EXISTS global_chat (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER, username TEXT, clan_name TEXT,
  message TEXT NOT NULL, created_at INTEGER DEFAULT (strftime('%s','now'))
);
CREATE TABLE IF NOT EXISTS user_items (
  user_id INTEGER NOT NULL, item TEXT NOT NULL, qty INTEGER DEFAULT 0,
  UNIQUE(user_id, item)
);
CREATE TABLE IF NOT EXISTS clan_wars (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clan_id INTEGER NOT NULL, rival TEXT NOT NULL,
  our_score INTEGER DEFAULT 0, goal INTEGER DEFAULT 200,
  pot_gold INTEGER DEFAULT 0, state TEXT DEFAULT 'active',
  started_at INTEGER DEFAULT (strftime('%s','now')), ends_at INTEGER NOT NULL
);
`);

const now = () => Math.floor(Date.now() / 1000);
const myClan = (db, userId) => db.prepare(
  `SELECT c.*, m.role FROM clan_members m JOIN clans c ON c.id = m.clan_id WHERE m.user_id = ?`
).get(userId);

// Rival siege points climb on a deterministic clock (so wars feel alive 24/7)
function rivalScore(war) {
  const mins = Math.max(0, (now() - war.started_at) / 60);
  return Math.min(war.goal, Math.floor(mins / 8.5) + (war.id % 4));
}

// Settle a finished war: winner takes the pot (split equally, floor 50 each)
function settleWar(db, war) {
  const theirs = rivalScore(war);
  const won = war.our_score >= war.goal ||
              (now() >= war.ends_at && war.our_score > theirs);
  db.prepare(`UPDATE clan_wars SET state = ? WHERE id = ?`).run(won ? 'won' : 'lost', war.id);
  if (won) {
    db.prepare(`UPDATE clans SET war_wins = war_wins + 1 WHERE id = ?`).run(war.clan_id);
    const members = db.prepare(`SELECT user_id FROM clan_members WHERE clan_id = ?`).all(war.clan_id);
    const share = Math.max(50, Math.floor((war.pot_gold + 1500) / Math.max(1, members.length)));
    const pay = db.prepare(`UPDATE users SET gold = gold + ? WHERE id = ?`);
    members.forEach(m => pay.run(share, m.user_id));
    return { won: true, share };
  }
  return { won: false, share: 0 };
}

function activeWar(db, clanId) {
  const war = db.prepare(`SELECT * FROM clan_wars WHERE clan_id = ? AND state = 'active'`).get(clanId);
  if (!war) return null;
  if (now() >= war.ends_at || war.our_score >= war.goal) {
    const r = settleWar(db, war);
    return { ...war, state: r.won ? 'won' : 'lost', their_score: rivalScore(war), justSettled: r };
  }
  return { ...war, their_score: rivalScore(war) };
}

// ── Browse / create / join / leave ───────────────────────────────────────────
router.get('/', authMiddleware, (req, res) => {
  const db = getDb();
  const clans = db.prepare(`
    SELECT c.id, c.name, c.badge, c.description, c.war_wins,
           COUNT(m.user_id) AS members
    FROM clans c LEFT JOIN clan_members m ON m.clan_id = c.id
    GROUP BY c.id ORDER BY members DESC, c.war_wins DESC LIMIT 25
  `).all();
  res.json({ clans, mine: myClan(db, req.user.id)?.id || null });
});

router.post('/create', authMiddleware, (req, res) => {
  const db = getDb();
  const name = String(req.body?.name || '').trim().slice(0, 24);
  const badge = String(req.body?.badge || '🏰').slice(0, 4);
  if (name.length < 3) return res.status(400).json({ error: 'Name too short (3+ chars)' });
  if (myClan(db, req.user.id)) return res.status(400).json({ error: 'Already in a clan' });
  const user = db.prepare(`SELECT gold FROM users WHERE id = ?`).get(req.user.id);
  if (user.gold < CREATE_COST) return res.status(400).json({ error: `Need ${CREATE_COST} gold` });
  try {
    const r = db.prepare(`INSERT INTO clans (name, badge, created_by) VALUES (?,?,?)`)
      .run(name, badge, req.user.id);
    db.prepare(`INSERT INTO clan_members (clan_id, user_id, role) VALUES (?,?,'leader')`)
      .run(r.lastInsertRowid, req.user.id);
    db.prepare(`UPDATE users SET gold = gold - ? WHERE id = ?`).run(CREATE_COST, req.user.id);
    res.json({ success: true, clanId: r.lastInsertRowid });
  } catch { res.status(400).json({ error: 'Name already taken' }); }
});

router.post('/join', authMiddleware, (req, res) => {
  const db = getDb();
  if (myClan(db, req.user.id)) return res.status(400).json({ error: 'Already in a clan' });
  const clanId = Number(req.body?.clanId);
  const count = db.prepare(`SELECT COUNT(*) AS n FROM clan_members WHERE clan_id = ?`).get(clanId).n;
  if (count >= MAX_MEMBERS) return res.status(400).json({ error: 'Clan is full (35/35)' });
  db.prepare(`INSERT INTO clan_members (clan_id, user_id) VALUES (?,?)`).run(clanId, req.user.id);
  db.prepare(`INSERT INTO clan_chat (clan_id, user_id, username, message) VALUES (?,?,?,?)`)
    .run(clanId, null, '⚑', `${req.user.username} joined the clan!`);
  res.json({ success: true });
});

router.post('/leave', authMiddleware, (req, res) => {
  const db = getDb();
  const c = myClan(db, req.user.id);
  if (!c) return res.status(400).json({ error: 'Not in a clan' });
  db.prepare(`DELETE FROM clan_members WHERE user_id = ?`).run(req.user.id);
  // Disband empty clans; promote oldest member if the leader left
  const left = db.prepare(`SELECT user_id FROM clan_members WHERE clan_id = ? ORDER BY joined_at`).all(c.id);
  if (!left.length) {
    db.prepare(`DELETE FROM clans WHERE id = ?`).run(c.id);
    db.prepare(`DELETE FROM clan_wars WHERE clan_id = ?`).run(c.id);
  } else if (c.role === 'leader') {
    db.prepare(`UPDATE clan_members SET role = 'leader' WHERE user_id = ?`).run(left[0].user_id);
  }
  res.json({ success: true });
});

// ── My clan (details + members + chat + war) ─────────────────────────────────
router.get('/mine', authMiddleware, (req, res) => {
  const db = getDb();
  const c = myClan(db, req.user.id);
  if (!c) return res.json({ clan: null });
  const members = db.prepare(`
    SELECT u.id, u.username, u.wins, m.role FROM clan_members m
    JOIN users u ON u.id = m.user_id WHERE m.clan_id = ? ORDER BY m.role = 'leader' DESC, u.wins DESC
  `).all(c.id);
  const chat = db.prepare(`
    SELECT username, message, created_at FROM clan_chat
    WHERE clan_id = ? ORDER BY id DESC LIMIT 30
  `).all(c.id).reverse();
  res.json({ clan: { id: c.id, name: c.name, badge: c.badge, war_wins: c.war_wins, role: c.role },
             members, chat, war: activeWar(db, c.id), maxMembers: MAX_MEMBERS });
});

router.post('/chat', authMiddleware, (req, res) => {
  const db = getDb();
  const c = myClan(db, req.user.id);
  if (!c) return res.status(400).json({ error: 'Not in a clan' });
  const msg = String(req.body?.message || '').trim().slice(0, 140);
  if (!msg) return res.status(400).json({ error: 'Empty message' });
  db.prepare(`INSERT INTO clan_chat (clan_id, user_id, username, message) VALUES (?,?,?,?)`)
    .run(c.id, req.user.id, req.user.username, msg);
  res.json({ success: true });
});

// ── Siege War: race the rival clan to 200 siege points (crowns = points).
//    Every win also feeds the war chest; the victors split the pot. ───────────
router.post('/war/start', authMiddleware, (req, res) => {
  const db = getDb();
  const c = myClan(db, req.user.id);
  if (!c) return res.status(400).json({ error: 'Not in a clan' });
  if (activeWar(db, c.id)?.state === 'active') return res.status(400).json({ error: 'War already running' });
  const rival = RIVALS[Math.floor(Math.random() * RIVALS.length)];
  db.prepare(`INSERT INTO clan_wars (clan_id, rival, goal, ends_at) VALUES (?,?,?,?)`)
    .run(c.id, rival, WAR_GOAL, now() + WAR_HOURS * 3600);
  db.prepare(`INSERT INTO clan_chat (clan_id, user_id, username, message) VALUES (?,?,?,?)`)
    .run(c.id, null, '⚔', `SIEGE WAR started vs ${rival}! Win battles to earn siege points!`);
  res.json({ success: true });
});

// Client reports crowns after each battle → siege points + war chest gold
router.post('/war/report', authMiddleware, (req, res) => {
  const db = getDb();
  const c = myClan(db, req.user.id);
  if (!c) return res.json({ success: false });
  const war = db.prepare(`SELECT * FROM clan_wars WHERE clan_id = ? AND state = 'active'`).get(c.id);
  if (!war || now() >= war.ends_at) return res.json({ success: false });
  const pts = Math.min(3, Math.max(0, Number(req.body?.crowns) || 0));
  if (pts > 0) {
    db.prepare(`UPDATE clan_wars SET our_score = our_score + ?, pot_gold = pot_gold + ? WHERE id = ?`)
      .run(pts, pts * 40, war.id);
  }
  res.json({ success: true, added: pts });
});

// ── Global Chat Scroll ────────────────────────────────────────────────────────
router.get('/global', authMiddleware, (req, res) => {
  const db = getDb();
  const messages = db.prepare(
    `SELECT username, clan_name, message, created_at FROM global_chat ORDER BY id DESC LIMIT 40`
  ).all().reverse();
  const scrolls = db.prepare(
    `SELECT qty FROM user_items WHERE user_id = ? AND item = 'chat_scroll'`
  ).get(req.user.id)?.qty || 0;
  res.json({ messages, scrolls });
});

router.post('/global', authMiddleware, (req, res) => {
  const db = getDb();
  const msg = String(req.body?.message || '').trim().slice(0, 160);
  if (!msg) return res.status(400).json({ error: 'Empty message' });
  const row = db.prepare(`SELECT qty FROM user_items WHERE user_id = ? AND item = 'chat_scroll'`).get(req.user.id);
  if (!row || row.qty < 1) return res.status(400).json({ error: 'No Chat Scrolls! Win them from loot chests.' });
  db.prepare(`UPDATE user_items SET qty = qty - 1 WHERE user_id = ? AND item = 'chat_scroll'`).run(req.user.id);
  const clan = myClan(db, req.user.id);
  db.prepare(`INSERT INTO global_chat (user_id, username, clan_name, message) VALUES (?,?,?,?)`)
    .run(req.user.id, req.user.username, clan?.name || null, msg);
  // Live-broadcast to everyone online
  req.app.get('io')?.emit('global_msg', {
    username: req.user.username, clan_name: clan?.name || null, message: msg, created_at: now()
  });
  res.json({ success: true, scrolls: row.qty - 1 });
});

// ── Items: grant (loot) & buy (shop) ─────────────────────────────────────────
router.post('/items/grant', authMiddleware, (req, res) => {
  const db = getDb();
  const qty = Math.min(3, Math.max(1, Number(req.body?.qty) || 1));
  db.prepare(`INSERT INTO user_items (user_id, item, qty) VALUES (?,?,?)
              ON CONFLICT(user_id, item) DO UPDATE SET qty = qty + ?`)
    .run(req.user.id, 'chat_scroll', qty, qty);
  res.json({ success: true });
});

router.post('/items/buy', authMiddleware, (req, res) => {
  const db = getDb();
  const COST = 400;
  const user = db.prepare(`SELECT gold FROM users WHERE id = ?`).get(req.user.id);
  if (user.gold < COST) return res.status(400).json({ error: 'Not enough gold' });
  db.prepare(`UPDATE users SET gold = gold - ? WHERE id = ?`).run(COST, req.user.id);
  db.prepare(`INSERT INTO user_items (user_id, item, qty) VALUES (?,'chat_scroll',1)
              ON CONFLICT(user_id, item) DO UPDATE SET qty = qty + 1`).run(req.user.id);
  const g = db.prepare(`SELECT gold FROM users WHERE id = ?`).get(req.user.id);
  res.json({ success: true, gold: g.gold });
});

module.exports = router;
