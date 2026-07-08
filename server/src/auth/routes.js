const express = require('express');
const bcrypt  = require('bcryptjs');
const { getDb }           = require('../db/database');
const { signToken, authMiddleware } = require('./auth');
const { CHARACTER_IDS, GOLD_UPGRADE_COSTS } = require('../../../shared/constants');

const router      = express.Router();
const SALT_ROUNDS = 12;

// ── Register ──────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body || {};
  if (!username || !email || !password)
    return res.status(400).json({ error: 'username, email and password required' });
  if (password.length < 6)   return res.status(400).json({ error: 'Password too short (min 6)' });
  if (username.length < 3)   return res.status(400).json({ error: 'Username too short (min 3)' });

  try {
    const db   = getDb();
    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = db.prepare(
      'INSERT INTO users (username, email, password_hash, gold) VALUES (?, ?, ?, 500)'
    ).run(username.trim(), email.toLowerCase().trim(), hash);

    const userId = Number(result.lastInsertRowid);

    // Seed character progress for every character
    const insertChar = db.prepare(
      'INSERT OR IGNORE INTO character_progress (user_id, char_id, level, xp, cards_owned) VALUES (?, ?, 1, 0, 0)'
    );
    db.exec('BEGIN');
    for (const charId of CHARACTER_IDS) insertChar.run(userId, charId);
    db.exec('COMMIT');

    const token = signToken({ id: userId, username: username.trim() });
    res.json({ token, username: username.trim(), gold: 500 });
  } catch (err) {
    if (err.message?.includes('UNIQUE'))
      return res.status(409).json({ error: 'Username or email already taken' });
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Login ─────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ error: 'email and password required' });

  try {
    const db   = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken({ id: user.id, username: user.username });
    res.json({ token, username: user.username, gold: user.gold });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Current user ─────────────────────────────────────────────────────────────
router.get('/me', authMiddleware, (req, res) => {
  const db   = getDb();
  const user = db.prepare('SELECT id, username, email, gold, wins, losses FROM users WHERE id = ?')
    .get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const chars = db.prepare(
    'SELECT char_id, level, xp, cards_owned FROM character_progress WHERE user_id = ?'
  ).all(user.id);

  res.json({ ...user, characters: chars });
});

// ── Claim loot ───────────────────────────────────────────────────────────────
router.post('/loot/claim', authMiddleware, (req, res) => {
  const { rarity, goldReward, charReward } = req.body || {};
  const db = getDb();

  db.prepare('UPDATE users SET gold = gold + ? WHERE id = ?')
    .run(goldReward || 0, req.user.id);
  db.prepare('INSERT INTO loot_history (user_id, rarity, gold_reward, char_reward) VALUES (?, ?, ?, ?)')
    .run(req.user.id, rarity, goldReward || 0, charReward || null);

  if (charReward) {
    // Upsert so locked mystery heroes (no seeded row) unlock on first drop
    db.prepare('INSERT OR IGNORE INTO character_progress (user_id, char_id, level, xp, cards_owned) VALUES (?, ?, 1, 0, 0)')
      .run(req.user.id, charReward);
    db.prepare('UPDATE character_progress SET cards_owned = cards_owned + 1 WHERE user_id = ? AND char_id = ?')
      .run(req.user.id, charReward);
  }

  const updated = db.prepare('SELECT gold FROM users WHERE id = ?').get(req.user.id);
  res.json({ success: true, gold: updated.gold });
});

// ── Upgrade character ─────────────────────────────────────────────────────────
router.post('/character/upgrade', authMiddleware, (req, res) => {
  const { charId } = req.body || {};
  if (!charId) return res.status(400).json({ error: 'charId required' });

  const db = getDb();
  const cp = db.prepare('SELECT * FROM character_progress WHERE user_id = ? AND char_id = ?')
    .get(req.user.id, charId);
  if (!cp)       return res.status(404).json({ error: 'Character not found' });
  if (cp.level >= 9) return res.status(400).json({ error: 'Already max level' });

  const cost = GOLD_UPGRADE_COSTS[cp.level];
  const user = db.prepare('SELECT gold FROM users WHERE id = ?').get(req.user.id);
  if (user.gold < cost) return res.status(400).json({ error: 'Not enough gold' });

  db.prepare('UPDATE users SET gold = gold - ? WHERE id = ?').run(cost, req.user.id);
  db.prepare('UPDATE character_progress SET level = level + 1, xp = 0 WHERE user_id = ? AND char_id = ?')
    .run(req.user.id, charId);

  const updatedUser = db.prepare('SELECT gold FROM users WHERE id = ?').get(req.user.id);
  const updatedChar = db.prepare('SELECT * FROM character_progress WHERE user_id = ? AND char_id = ?')
    .get(req.user.id, charId);

  res.json({ success: true, gold: updatedUser.gold, character: updatedChar });
});

// ── Add XP ────────────────────────────────────────────────────────────────────
router.post('/character/xp', authMiddleware, (req, res) => {
  const { charId, xpGain } = req.body || {};
  if (!charId || !xpGain) return res.status(400).json({ error: 'charId and xpGain required' });

  const db = getDb();
  db.prepare('UPDATE character_progress SET xp = xp + ? WHERE user_id = ? AND char_id = ?')
    .run(Math.floor(xpGain), req.user.id, charId);

  res.json({ success: true });
});

module.exports = router;
