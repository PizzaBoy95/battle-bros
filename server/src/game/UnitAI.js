// Server-side unit movement and targeting logic

const { TOWER_POSITIONS, CHARACTERS } = require('../../../shared/constants');

function getScaledStats(charDef, level) {
  const mult = 1 + (level - 1) * 0.08;
  return {
    ...charDef,
    hp: Math.floor(charDef.hp * mult),
    damage: Math.floor(charDef.damage * mult)
  };
}

function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function getEnemyTowerTargets(ownerKey, towers) {
  const enemyKey = ownerKey === 'p1' ? 'p2' : 'p1';
  const et = towers[enemyKey];
  const targets = [];

  // Guard towers first (must destroy before king)
  if (et.guardLeft.hp > 0)  targets.push({ key: 'guardLeft',  ...TOWER_POSITIONS[enemyKey].guardLeft,  hp: et.guardLeft.hp  });
  if (et.guardRight.hp > 0) targets.push({ key: 'guardRight', ...TOWER_POSITIONS[enemyKey].guardRight, hp: et.guardRight.hp });

  // King only targetable if one guard is down
  const guardDownLeft  = et.guardLeft.hp <= 0;
  const guardDownRight = et.guardRight.hp <= 0;
  if ((guardDownLeft || guardDownRight) && et.king.hp > 0) {
    targets.push({ key: 'king', ...TOWER_POSITIONS[enemyKey].king, hp: et.king.hp });
  }

  return targets;
}

function updateUnits(units, towers, dt) {
  const alive = units.filter(u => u.hp > 0);
  const events = [];

  for (const unit of alive) {
    const charDef = CHARACTERS[unit.charId];
    if (!charDef) continue;
    const stats = getScaledStats(charDef, unit.level || 1);

    // Resolve attack cooldown
    if (unit.attackCooldown > 0) {
      unit.attackCooldown -= dt;
    }

    // Find closest enemy unit
    const enemyUnits = alive.filter(u => u.owner !== unit.owner && u.hp > 0);
    // Air units target air+ground; ground units only target ground (for simplicity)
    const validTargets = enemyUnits.filter(e => {
      if (stats.type === 'air') return true;
      return CHARACTERS[e.charId]?.type !== 'air' || true; // ground units can still attack air
    });

    let closestEnemy = null;
    let closestDist = Infinity;
    for (const e of validTargets) {
      const d = dist(unit, e);
      if (d < closestDist) { closestDist = d; closestEnemy = e; }
    }

    // Find closest enemy tower
    const towerTargets = getEnemyTowerTargets(unit.owner, towers);
    let closestTower = null;
    let closestTowerDist = Infinity;
    for (const t of towerTargets) {
      const d = dist(unit, t);
      if (d < closestTowerDist) { closestTowerDist = d; closestTower = t; }
    }

    // Priority: attack enemy unit if in range, else move toward closest tower
    const attackRange = stats.range;

    if (closestEnemy && closestDist <= attackRange) {
      // Attack enemy unit
      unit.state = 'attacking';
      unit.targetId = closestEnemy.id;

      if (unit.attackCooldown <= 0) {
        const cooldown = 1000 / stats.attackSpeed; // ms between attacks
        unit.attackCooldown = cooldown;

        let dmg = stats.damage;
        // Phase dodge
        if (closestEnemy.charId === 'neon_wraith' && Math.random() < 0.3) {
          dmg = 0; // dodged
        }

        closestEnemy.hp -= dmg;
        unit.damageDealt = (unit.damageDealt || 0) + dmg;

        events.push({ type: 'unit_hit', targetId: closestEnemy.id, damage: dmg, x: closestEnemy.x, y: closestEnemy.y });

        if (closestEnemy.hp <= 0) {
          closestEnemy.hp = 0;
          closestEnemy.state = 'dead';
          events.push({ type: 'unit_died', unitId: closestEnemy.id, x: closestEnemy.x, y: closestEnemy.y });

          // Stone golem splits
          if (closestEnemy.charId === 'stone_golem') {
            events.push({ type: 'spawn_mini_golems', owner: closestEnemy.owner, x: closestEnemy.x, y: closestEnemy.y });
          }
        }
      }
    } else if (closestTower && closestTowerDist <= attackRange) {
      // Attack tower
      unit.state = 'attacking';
      const enemyKey2 = unit.owner === 'p1' ? 'p2' : 'p1';
      unit.targetId = `tower_${enemyKey2}_${closestTower.key}`;

      if (unit.attackCooldown <= 0) {
        const cooldown = 1000 / stats.attackSpeed;
        unit.attackCooldown = cooldown;

        const damage = stats.damage;
        const enemyKey = unit.owner === 'p1' ? 'p2' : 'p1';
        towers[enemyKey][closestTower.key].hp = Math.max(0,
          towers[enemyKey][closestTower.key].hp - damage
        );
        unit.damageDealt = (unit.damageDealt || 0) + damage;

        events.push({
          type: 'tower_hit',
          player: enemyKey,
          tower: closestTower.key,
          hp: towers[enemyKey][closestTower.key].hp,
          damage,
          x: closestTower.x,
          y: closestTower.y
        });

        if (towers[enemyKey][closestTower.key].hp <= 0) {
          events.push({ type: 'tower_destroyed', player: enemyKey, tower: closestTower.key });
        }
      }
    } else {
      // Move toward closest tower (or closest enemy unit if closer)
      unit.state = 'moving';
      unit.targetId = null;

      let targetX, targetY;
      if (closestTower) {
        targetX = closestTower.x;
        targetY = closestTower.y;
      } else {
        continue;
      }

      // If enemy unit is between us and tower, head toward it
      if (closestEnemy && closestDist < closestTowerDist) {
        targetX = closestEnemy.x;
        targetY = closestEnemy.y;
      }

      const dx = targetX - unit.x;
      const dy = targetY - unit.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > 1) {
        const speed = stats.speed * (dt / 1000);
        unit.x += (dx / d) * speed;
        unit.y += (dy / d) * speed;
      }
    }
  }

  // Tower auto-attack: towers shoot nearby enemies
  for (const playerKey of ['p1', 'p2']) {
    const enemyKey = playerKey === 'p1' ? 'p2' : 'p1';
    const myTowers = towers[playerKey];
    const enemyUnitsNear = alive.filter(u => u.owner === enemyKey);

    for (const [towerType, towerStats] of [
      ['guardLeft', { range: 200, damage: 80, attackSpeed: 1.2, pos: TOWER_POSITIONS[playerKey].guardLeft }],
      ['guardRight',{ range: 200, damage: 80, attackSpeed: 1.2, pos: TOWER_POSITIONS[playerKey].guardRight }],
      ['king',      { range: 250, damage: 120,attackSpeed: 1.0, pos: TOWER_POSITIONS[playerKey].king }]
    ]) {
      const tower = myTowers[towerType];
      if (tower.hp <= 0) continue;

      if (!tower.attackCooldown) tower.attackCooldown = 0;
      tower.attackCooldown -= dt;
      if (tower.attackCooldown > 0) continue;

      // Find closest enemy unit in range
      let tgt = null, tgtDist = Infinity;
      for (const u of enemyUnitsNear) {
        if (u.hp <= 0) continue;
        const d = dist(u, towerStats.pos);
        if (d <= towerStats.range && d < tgtDist) { tgt = u; tgtDist = d; }
      }

      // King tower also activates when a guard is destroyed
      if (towerType === 'king') {
        const guardDown = myTowers.guardLeft.hp <= 0 || myTowers.guardRight.hp <= 0;
        if (!guardDown && tgt) { tgt = null; } // king doesn't attack until a guard is down
      }

      if (tgt) {
        const cooldown = 1000 / towerStats.attackSpeed;
        tower.attackCooldown = cooldown;
        tgt.hp -= towerStats.damage;

        events.push({ type: 'tower_attack', from: playerKey, fromTower: towerType, targetId: tgt.id, damage: towerStats.damage });

        if (tgt.hp <= 0) {
          tgt.hp = 0;
          tgt.state = 'dead';
          events.push({ type: 'unit_died', unitId: tgt.id, x: tgt.x, y: tgt.y });
        }
      }
    }
  }

  return { units: alive, events };
}

module.exports = { updateUnits, getScaledStats };
