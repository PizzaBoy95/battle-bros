import Phaser from 'phaser';
import { CHARACTERS, RARITY_COLORS } from './CharacterRegistry.js';

// ── Canvas portrait helpers ───────────────────────────────────────────────────
function _p(scene, key, fn) {
  const k = key + '_p';
  if (scene.textures.exists(k)) return;
  const W = 160, H = 200;
  const tex = scene.textures.createCanvas(k, W, H);
  const ctx = tex.getContext();
  fn(ctx, W, H);
  tex.refresh();
}

function gbg(ctx, c1, c2, W, H) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, c1); g.addColorStop(1, c2);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

function rglow(ctx, x, y, r, hex, a = 0.55) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, hex + Math.round(a * 255).toString(16).padStart(2, '0'));
  g.addColorStop(1, hex + '00');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}

function shadow(ctx, blur, color) { ctx.shadowBlur = blur; ctx.shadowColor = color; }
function noshadow(ctx) { ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'; }
function gbg3(ctx, c1, c2, c3, W, H) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, c1); g.addColorStop(0.5, c2); g.addColorStop(1, c3);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
function ol(ctx, w = 2.5, c = '#111') { ctx.strokeStyle = c; ctx.lineWidth = w; }
function spec(ctx, x, y, rx, ry, a = 0.32) {
  ctx.fillStyle = `rgba(255,255,255,${a})`;
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, -0.5, 0, Math.PI * 2); ctx.fill();
}
function eye(ctx, x, y, iris = '#3399ff', r = 5.5) {
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.82, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#333'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.fillStyle = iris; ctx.beginPath(); ctx.arc(x, y + 0.5, r * 0.6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(x, y + 0.8, r * 0.34, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(x - r * 0.28, y - r * 0.3, r * 0.22, 0, Math.PI * 2); ctx.fill();
}

// ── Portrait draw functions ───────────────────────────────────────────────────
function _titan_grunt(ctx, W, H) {
  const cx = W / 2;
  gbg3(ctx, '#0d1f3c', '#06101e', '#020408', W, H);
  rglow(ctx, cx, H * 0.55, 90, '#c8960a');
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(cx, H * 0.92, 52, 12, 0, 0, Math.PI * 2); ctx.fill();
  // axe handle + head
  ctx.fillStyle = '#7b5030'; ctx.fillRect(cx - 56, H * 0.23, 6, 78); ol(ctx, 1.5); ctx.strokeRect(cx - 56, H * 0.23, 6, 78);
  const ag = ctx.createLinearGradient(cx - 74, 0, cx - 36, 0);
  ag.addColorStop(0, '#f0f0f0'); ag.addColorStop(0.5, '#d0d0d0'); ag.addColorStop(1, '#888');
  ctx.fillStyle = ag; ctx.beginPath(); ctx.moveTo(cx - 74, H * 0.22); ctx.lineTo(cx - 36, H * 0.26); ctx.lineTo(cx - 46, H * 0.08); ctx.closePath(); ctx.fill(); ol(ctx, 2); ctx.stroke(); spec(ctx, cx - 62, H * 0.20, 8, 4, 0.5);
  // shield
  const sg = ctx.createLinearGradient(cx + 28, 0, cx + 68, 0);
  sg.addColorStop(0, '#778899'); sg.addColorStop(0.4, '#aabbcc'); sg.addColorStop(1, '#223355');
  ctx.fillStyle = sg; ctx.fillRect(cx + 28, H * 0.22, 40, 74); ol(ctx, 2); ctx.strokeRect(cx + 28, H * 0.22, 40, 74); spec(ctx, cx + 34, H * 0.28, 5, 30, 0.2);
  shadow(ctx, 10, '#c8960a'); ctx.fillStyle = '#c8960a'; ctx.beginPath(); ctx.arc(cx + 48, H * 0.44, 10, 0, Math.PI * 2); ctx.fill(); noshadow(ctx);
  // pauldrons
  const pg = ctx.createLinearGradient(0, H * 0.22, 0, H * 0.36); pg.addColorStop(0, '#d0d0d0'); pg.addColorStop(0.5, '#aaa'); pg.addColorStop(1, '#444');
  ctx.fillStyle = pg; ctx.fillRect(cx - 62, H * 0.24, 24, 14); ctx.fillRect(cx + 22, H * 0.24, 24, 14); ol(ctx, 2); ctx.strokeRect(cx - 62, H * 0.24, 24, 14); ctx.strokeRect(cx + 22, H * 0.24, 24, 14); spec(ctx, cx - 52, H * 0.26, 7, 4);
  // body armor
  const bg = ctx.createLinearGradient(cx - 36, 0, cx + 28, 0); bg.addColorStop(0, '#7a4a20'); bg.addColorStop(0.4, '#a06030'); bg.addColorStop(1, '#3a1808');
  ctx.fillStyle = bg; ctx.fillRect(cx - 36, H * 0.32, 64, 36); ol(ctx, 2.5); ctx.strokeRect(cx - 36, H * 0.32, 64, 36);
  ctx.fillStyle = 'rgba(0,0,0,0.2)'; for (let i = 0; i < 3; i++) ctx.fillRect(cx - 30, H * (0.37 + i * 0.06), 52, 3);
  ctx.fillStyle = '#c8960a'; ctx.fillRect(cx - 36, H * 0.56, 64, 6);
  // legs
  ctx.fillStyle = '#5a3010'; ctx.fillRect(cx - 26, H * 0.64, 22, 26); ctx.fillRect(cx + 4, H * 0.64, 22, 26); ol(ctx, 2); ctx.strokeRect(cx - 26, H * 0.64, 22, 26); ctx.strokeRect(cx + 4, H * 0.64, 22, 26);
  ctx.fillStyle = '#1a1010'; ctx.fillRect(cx - 26, H * 0.83, 22, 8); ctx.fillRect(cx + 4, H * 0.83, 22, 8);
  // BIG helmet (Clash Royale chibi proportion)
  const hg = ctx.createRadialGradient(cx - 10, H * 0.10, 2, cx, H * 0.20, 32); hg.addColorStop(0, '#d8d8d8'); hg.addColorStop(0.5, '#909090'); hg.addColorStop(1, '#2a2a2a');
  ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(cx, H * 0.20, 32, 0, Math.PI * 2); ctx.fill(); ol(ctx, 2.5); ctx.stroke(); spec(ctx, cx - 12, H * 0.10, 10, 7, 0.4);
  // horns
  ctx.fillStyle = '#c8960a'; ctx.beginPath(); ctx.moveTo(cx - 32, H * 0.11); ctx.lineTo(cx - 22, H * 0.01); ctx.lineTo(cx - 14, H * 0.11); ctx.closePath(); ctx.fill(); ol(ctx, 1.5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 14, H * 0.11); ctx.lineTo(cx + 22, H * 0.01); ctx.lineTo(cx + 32, H * 0.11); ctx.closePath(); ctx.fill(); ol(ctx, 1.5); ctx.stroke();
  // T-visor glow
  shadow(ctx, 22, '#ff2200'); ctx.fillStyle = '#ff4400'; ctx.fillRect(cx - 24, H * 0.195, 48, 9); ctx.fillRect(cx - 5, H * 0.195, 10, 22); noshadow(ctx);
  ctx.fillStyle = 'rgba(255,150,150,0.35)'; ctx.fillRect(cx - 22, H * 0.195, 16, 4);
  rglow(ctx, cx, H * 0.94, 50, '#000000');
}

function _pyro_drake(ctx, W, H) {
  const cx = W / 2;
  gbg3(ctx, '#2d0800', '#140200', '#080000', W, H);
  rglow(ctx, cx, H * 0.5, 92, '#ff4400');
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(cx, H * 0.93, 48, 11, 0, 0, Math.PI * 2); ctx.fill();
  // wings (outlined)
  ctx.fillStyle = 'rgba(180,30,0,0.9)'; ctx.beginPath(); ctx.moveTo(cx - 12, H * 0.35); ctx.lineTo(cx - 76, H * 0.10); ctx.lineTo(cx - 62, H * 0.56); ctx.closePath(); ctx.fill(); ol(ctx, 1.8, '#550000'); ctx.stroke();
  ctx.fillStyle = 'rgba(255,80,0,0.4)'; ctx.beginPath(); ctx.moveTo(cx - 14, H * 0.40); ctx.lineTo(cx - 58, H * 0.18); ctx.lineTo(cx - 50, H * 0.52); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(180,30,0,0.9)'; ctx.beginPath(); ctx.moveTo(cx + 12, H * 0.35); ctx.lineTo(cx + 76, H * 0.10); ctx.lineTo(cx + 62, H * 0.56); ctx.closePath(); ctx.fill(); ol(ctx, 1.8, '#550000'); ctx.stroke();
  ctx.fillStyle = 'rgba(255,80,0,0.4)'; ctx.beginPath(); ctx.moveTo(cx + 14, H * 0.40); ctx.lineTo(cx + 58, H * 0.18); ctx.lineTo(cx + 50, H * 0.52); ctx.closePath(); ctx.fill();
  // body
  const drg = ctx.createRadialGradient(cx - 6, H * 0.50, 5, cx, H * 0.52, 44); drg.addColorStop(0, '#ff6600'); drg.addColorStop(1, '#aa1500');
  ctx.fillStyle = drg; ctx.beginPath(); ctx.ellipse(cx, H * 0.52, 36, 54, 0, 0, Math.PI * 2); ctx.fill(); ol(ctx, 2, '#660000'); ctx.stroke();
  // scales
  ctx.fillStyle = 'rgba(180,40,0,0.45)'; for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.arc(cx + (i % 3 - 1) * 18, H * 0.42 + Math.floor(i / 3) * 16, 6, 0, Math.PI * 2); ctx.fill(); }
  // neck
  ctx.fillStyle = '#cc2200'; ctx.beginPath(); ctx.ellipse(cx, H * 0.28, 22, 26, 0, 0, Math.PI * 2); ctx.fill(); ol(ctx, 2, '#660000'); ctx.stroke();
  // BIG dragon head
  const hdrg = ctx.createRadialGradient(cx - 8, H * 0.14, 2, cx, H * 0.18, 26); hdrg.addColorStop(0, '#ff7700'); hdrg.addColorStop(1, '#881000');
  ctx.fillStyle = hdrg; ctx.beginPath(); ctx.ellipse(cx, H * 0.18, 26, 22, 0, 0, Math.PI * 2); ctx.fill(); ol(ctx, 2.5, '#550000'); ctx.stroke(); spec(ctx, cx - 8, H * 0.10, 8, 5, 0.35);
  // horns
  ctx.fillStyle = '#880000'; ctx.beginPath(); ctx.moveTo(cx - 10, H * 0.09); ctx.lineTo(cx - 24, H * 0.00); ctx.lineTo(cx - 4, H * 0.10); ctx.closePath(); ctx.fill(); ol(ctx, 1.5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 10, H * 0.09); ctx.lineTo(cx + 24, H * 0.00); ctx.lineTo(cx + 4, H * 0.10); ctx.closePath(); ctx.fill(); ol(ctx, 1.5); ctx.stroke();
  // glowing dragon eyes
  shadow(ctx, 14, '#ffcc00'); ctx.fillStyle = '#ffcc00'; ctx.beginPath(); ctx.ellipse(cx - 9, H * 0.165, 6, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(cx + 9, H * 0.165, 6, 5, 0, 0, Math.PI * 2); ctx.fill(); noshadow(ctx);
  ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(cx - 9, H * 0.168, 2.5, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(cx + 9, H * 0.168, 2.5, 4, 0, 0, Math.PI * 2); ctx.fill();
  // fire breath cone
  const fg = ctx.createLinearGradient(cx - 34, H * 0.22, cx + 34, H * 0.22); fg.addColorStop(0, 'rgba(255,230,0,0.95)'); fg.addColorStop(0.4, 'rgba(255,80,0,0.75)'); fg.addColorStop(1, 'rgba(255,0,0,0)');
  ctx.fillStyle = fg; ctx.beginPath(); ctx.ellipse(cx, H * 0.10, 32, 10, -0.2, 0, Math.PI * 2); ctx.fill();
  rglow(ctx, cx, H * 0.94, 46, '#000000');
}

function _lady_vex(ctx, W, H) {
  const cx = W / 2;
  gbg3(ctx, '#1a0030', '#0a0018', '#050008', W, H);
  rglow(ctx, cx, H * 0.5, 90, '#9b00ff');
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; rglow(ctx, cx + Math.cos(a) * 44, H * 0.45 + Math.sin(a) * 24, 20, i % 2 ? '#ff00aa' : '#6600ff', 0.28); }
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(cx, H * 0.93, 44, 11, 0, 0, Math.PI * 2); ctx.fill();
  // staff
  ctx.fillStyle = '#c8a000'; ctx.fillRect(cx + 30, H * 0.07, 5, 70); ol(ctx, 1.5, '#886000'); ctx.strokeRect(cx + 30, H * 0.07, 5, 70);
  shadow(ctx, 24, '#aa00ff'); ctx.fillStyle = '#cc44ff'; ctx.beginPath(); ctx.arc(cx + 32, H * 0.07, 15, 0, Math.PI * 2); ctx.fill(); noshadow(ctx);
  ctx.fillStyle = 'rgba(255,200,255,0.65)'; ctx.beginPath(); ctx.arc(cx + 27, H * 0.045, 8, 0, Math.PI * 2); ctx.fill(); ol(ctx, 1.5, '#aa00ff'); ctx.stroke();
  // robe
  const rg = ctx.createLinearGradient(cx - 28, 0, cx + 28, 0); rg.addColorStop(0, '#4a0080'); rg.addColorStop(0.5, '#6600aa'); rg.addColorStop(1, '#2a0050');
  ctx.fillStyle = rg; ctx.beginPath(); ctx.moveTo(cx - 28, H * 0.36); ctx.lineTo(cx + 28, H * 0.36); ctx.lineTo(cx + 38, H * 0.88); ctx.lineTo(cx - 38, H * 0.88); ctx.closePath(); ctx.fill(); ol(ctx, 2, '#220040'); ctx.stroke();
  ctx.fillStyle = 'rgba(180,0,255,0.22)'; ctx.beginPath(); ctx.moveTo(cx, H * 0.36); ctx.lineTo(cx + 4, H * 0.88); ctx.lineTo(cx - 4, H * 0.88); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#5a0090'; ctx.fillRect(cx - 38, H * 0.36, 10, 40); ctx.fillRect(cx + 26, H * 0.36, 10, 40); ol(ctx, 1.5); ctx.strokeRect(cx - 38, H * 0.36, 10, 40); ctx.strokeRect(cx + 26, H * 0.36, 10, 40);
  // chaos orb left hand
  shadow(ctx, 22, '#ff00aa'); ctx.fillStyle = '#ff44cc'; ctx.beginPath(); ctx.arc(cx - 38, H * 0.59, 11, 0, Math.PI * 2); ctx.fill(); noshadow(ctx); ol(ctx, 2, '#880066'); ctx.stroke();
  ctx.fillStyle = 'rgba(255,180,255,0.55)'; ctx.beginPath(); ctx.arc(cx - 41, H * 0.565, 5, 0, Math.PI * 2); ctx.fill();
  // hair + BIG face
  ctx.fillStyle = '#220040'; ctx.beginPath(); ctx.moveTo(cx - 22, H * 0.25); ctx.lineTo(cx - 16, H * 0.08); ctx.lineTo(cx + 16, H * 0.08); ctx.lineTo(cx + 22, H * 0.25); ctx.closePath(); ctx.fill(); ol(ctx, 2, '#110020'); ctx.stroke();
  ctx.fillStyle = '#3a0060'; ctx.beginPath(); ctx.arc(cx, H * 0.14, 18, Math.PI, 0, true); ctx.fill();
  const fg = ctx.createRadialGradient(cx - 5, H * 0.24, 2, cx, H * 0.27, 22); fg.addColorStop(0, '#f5d0c0'); fg.addColorStop(1, '#c8907a');
  ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(cx, H * 0.27, 22, 0, Math.PI * 2); ctx.fill(); ol(ctx, 2.5, '#7a3020'); ctx.stroke(); spec(ctx, cx - 8, H * 0.17, 8, 5, 0.35);
  // ornate mask (half face)
  ctx.fillStyle = 'rgba(170,0,200,0.55)'; ctx.fillRect(cx - 14, H * 0.255, 28, 10); ol(ctx, 1, '#aa00cc'); ctx.strokeRect(cx - 14, H * 0.255, 28, 10);
  // glowing magenta eyes
  shadow(ctx, 10, '#ff00aa'); eye(ctx, cx - 8, H * 0.258, '#ff44cc', 5); eye(ctx, cx + 8, H * 0.258, '#ff44cc', 5); noshadow(ctx);
  // sparkles
  shadow(ctx, 10, '#fff'); ctx.fillStyle = '#fff'; [[cx - 50, H * 0.28], [cx + 48, H * 0.34], [cx - 42, H * 0.60], [cx + 50, H * 0.62]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill(); }); noshadow(ctx);
  rglow(ctx, cx, H * 0.94, 44, '#000000');
}

function _bone_shard(ctx, W, H) {
  const cx = W / 2;
  gbg3(ctx, '#0a0018', '#050010', '#000005', W, H);
  rglow(ctx, cx, H * 0.5, 82, '#6600aa');
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(cx, H * 0.93, 40, 11, 0, 0, Math.PI * 2); ctx.fill();
  // staff
  ctx.fillStyle = '#4a0088'; ctx.fillRect(cx + 14, H * 0.09, 5, 74); ol(ctx, 1.5, '#220044'); ctx.strokeRect(cx + 14, H * 0.09, 5, 74);
  shadow(ctx, 16, '#8800ff'); ctx.fillStyle = '#cc00ff'; ctx.beginPath(); ctx.arc(cx + 16, H * 0.09, 11, 0, Math.PI * 2); ctx.fill(); noshadow(ctx); ol(ctx, 2, '#550088'); ctx.stroke();
  ctx.fillStyle = 'rgba(200,100,255,0.5)'; ctx.beginPath(); ctx.arc(cx + 12, H * 0.065, 5, 0, Math.PI * 2); ctx.fill();
  // robe body
  ctx.fillStyle = '#0d0d20'; ctx.beginPath(); ctx.moveTo(cx - 28, H * 0.34); ctx.lineTo(cx + 28, H * 0.34); ctx.lineTo(cx + 36, H * 0.88); ctx.lineTo(cx - 36, H * 0.88); ctx.closePath(); ctx.fill(); ol(ctx, 2, '#080814'); ctx.stroke();
  ctx.fillStyle = 'rgba(100,0,160,0.2)'; ctx.beginPath(); ctx.moveTo(cx, H * 0.34); ctx.lineTo(cx + 4, H * 0.88); ctx.lineTo(cx - 4, H * 0.88); ctx.closePath(); ctx.fill();
  // soul orbs
  shadow(ctx, 18, '#8800ff');
  [[cx - 34, H * 0.47], [cx + 34, H * 0.47], [cx, H * 0.67]].forEach(([x, y]) => {
    ctx.fillStyle = '#aa44ff'; ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.fill(); ol(ctx, 1.5, '#550088'); ctx.stroke();
    ctx.fillStyle = 'rgba(200,150,255,0.55)'; ctx.beginPath(); ctx.arc(x - 2.5, y - 2.5, 5, 0, Math.PI * 2); ctx.fill();
  }); noshadow(ctx);
  // hood
  ctx.fillStyle = '#111126'; ctx.beginPath(); ctx.moveTo(cx - 22, H * 0.32); ctx.lineTo(cx + 22, H * 0.32); ctx.lineTo(cx + 16, H * 0.12); ctx.lineTo(cx - 16, H * 0.12); ctx.closePath(); ctx.fill(); ol(ctx, 2, '#080814'); ctx.stroke();
  ctx.fillStyle = '#111126'; ctx.beginPath(); ctx.arc(cx, H * 0.22, 20, Math.PI, 0); ctx.closePath(); ctx.fill(); ol(ctx, 2, '#080814'); ctx.stroke();
  // BIG skull face
  ctx.fillStyle = '#e8e0b0'; ctx.beginPath(); ctx.ellipse(cx, H * 0.24, 16, 18, 0, 0, Math.PI * 2); ctx.fill(); ol(ctx, 2, '#8a7a60'); ctx.stroke(); spec(ctx, cx - 5, H * 0.155, 6, 4, 0.3);
  ctx.fillStyle = '#0a0018'; ctx.fillRect(cx - 8, H * 0.19, 6, 8); ctx.fillRect(cx + 2, H * 0.19, 6, 8); // eye sockets
  ctx.fillStyle = '#6600aa'; ctx.beginPath(); ctx.arc(cx - 5, H * 0.22, 3, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(cx + 5, H * 0.22, 3, 0, Math.PI * 2); ctx.fill(); // purple soul glow in sockets
  ctx.fillStyle = '#220044'; ctx.beginPath(); ctx.arc(cx, H * 0.30, 6, 0, Math.PI); ctx.fill(); // grinning teeth gap
  ctx.fillStyle = '#fff'; ctx.fillRect(cx - 6, H * 0.295, 4, 4); ctx.fillRect(cx - 1, H * 0.295, 4, 4); ctx.fillRect(cx + 4, H * 0.295, 4, 4); // teeth
  // mini skeleton minion
  ctx.fillStyle = 'rgba(220,210,160,0.75)'; ctx.beginPath(); ctx.arc(cx - 44, H * 0.78, 8, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(cx - 48, H * 0.83, 9, 18); ctx.fillRect(cx - 52, H * 0.85, 16, 3); ol(ctx, 1.2, '#8a7a60'); ctx.strokeRect(cx - 48, H * 0.83, 9, 18);
  rglow(ctx, cx, H * 0.94, 42, '#000000');
}

function _iron_bro(ctx, W, H) {
  const cx = W / 2;
  gbg3(ctx, '#0a1a2e', '#05101c', '#020408', W, H);
  rglow(ctx, cx, H * 0.50, 84, '#2266ff');
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(cx, H * 0.93, 46, 11, 0, 0, Math.PI * 2); ctx.fill();
  // sword
  ctx.fillStyle = '#c8c8d8'; ctx.fillRect(cx - 40, H * 0.27, 6, 58); ol(ctx, 1.5, '#888'); ctx.strokeRect(cx - 40, H * 0.27, 6, 58);
  ctx.fillStyle = '#c8a000'; ctx.fillRect(cx - 48, H * 0.32, 24, 5); ol(ctx, 1.5, '#886000'); ctx.strokeRect(cx - 48, H * 0.32, 24, 5);
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(cx - 40, H * 0.27, 2, 58);
  // tower shield
  const shg = ctx.createLinearGradient(cx + 22, 0, cx + 66, 0); shg.addColorStop(0, '#8899bb'); shg.addColorStop(0.4, '#aabbdd'); shg.addColorStop(1, '#223355');
  ctx.fillStyle = shg; ctx.fillRect(cx + 22, H * 0.22, 44, 74); ol(ctx, 2, '#112244'); ctx.strokeRect(cx + 22, H * 0.22, 44, 74); spec(ctx, cx + 27, H * 0.28, 5, 32, 0.22);
  shadow(ctx, 12, '#4488ff'); ctx.fillStyle = '#2266cc'; ctx.beginPath(); ctx.arc(cx + 44, H * 0.44, 11, 0, Math.PI * 2); ctx.fill(); noshadow(ctx); ol(ctx, 2, '#112266'); ctx.stroke();
  // body armor
  const bg = ctx.createLinearGradient(cx - 32, 0, cx + 22, 0); bg.addColorStop(0, '#3366aa'); bg.addColorStop(0.4, '#4488cc'); bg.addColorStop(1, '#1a3366');
  ctx.fillStyle = bg; ctx.fillRect(cx - 32, H * 0.30, 54, 36); ol(ctx, 2.5, '#112244'); ctx.strokeRect(cx - 32, H * 0.30, 54, 36);
  ctx.fillStyle = 'rgba(100,160,255,0.22)'; ctx.fillRect(cx - 30, H * 0.38, 50, 12); ctx.fillRect(cx - 30, H * 0.52, 50, 12);
  // legs
  ctx.fillStyle = '#1a3366'; ctx.fillRect(cx - 26, H * 0.64, 22, 28); ctx.fillRect(cx - 2, H * 0.64, 22, 28); ol(ctx, 2, '#112244'); ctx.strokeRect(cx - 26, H * 0.64, 22, 28); ctx.strokeRect(cx - 2, H * 0.64, 22, 28);
  ctx.fillStyle = '#0a1a2e'; ctx.fillRect(cx - 26, H * 0.84, 22, 8); ctx.fillRect(cx - 2, H * 0.84, 22, 8);
  // BIG knight helmet
  const hmg = ctx.createRadialGradient(cx - 10, H * 0.12, 2, cx - 4, H * 0.21, 30); hmg.addColorStop(0, '#aabbdd'); hmg.addColorStop(0.5, '#6688aa'); hmg.addColorStop(1, '#223355');
  ctx.fillStyle = hmg; ctx.beginPath(); ctx.arc(cx - 4, H * 0.21, 30, 0, Math.PI * 2); ctx.fill(); ol(ctx, 2.5, '#112244'); ctx.stroke(); spec(ctx, cx - 16, H * 0.11, 10, 7, 0.4);
  ctx.fillStyle = '#4488ff'; ctx.fillRect(cx - 16, H * 0.205, 24, 7); ol(ctx, 1.5, '#2255cc'); ctx.strokeRect(cx - 16, H * 0.205, 24, 7); // visor
  ctx.fillStyle = 'rgba(180,220,255,0.5)'; ctx.fillRect(cx - 14, H * 0.205, 9, 3); // visor highlight
  shadow(ctx, 18, '#2266ff'); ctx.fillStyle = 'rgba(30,100,255,0.12)'; ctx.fillRect(cx - 32, H * 0.22, 54, 98); noshadow(ctx);
  rglow(ctx, cx, H * 0.94, 46, '#000000');
}

function _stone_golem(ctx, W, H) {
  const cx = W / 2;
  gbg3(ctx, '#151515', '#0a0a0a', '#060606', W, H);
  rglow(ctx, cx, H * 0.50, 92, '#ff6600');
  ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.ellipse(cx, H * 0.93, 56, 14, 0, 0, Math.PI * 2); ctx.fill();
  // massive stone arms
  const ag = ctx.createLinearGradient(0, 0, 30, 0); ag.addColorStop(0, '#6a7575'); ag.addColorStop(1, '#3a4040');
  ctx.fillStyle = ag; ctx.fillRect(cx - 68, H * 0.30, 30, 62); ctx.fillRect(cx + 38, H * 0.30, 30, 62); ol(ctx, 2, '#222'); ctx.strokeRect(cx - 68, H * 0.30, 30, 62); ctx.strokeRect(cx + 38, H * 0.30, 30, 62);
  ctx.fillStyle = 'rgba(130,160,160,0.35)'; ctx.fillRect(cx - 68, H * 0.30, 9, 62); ctx.fillRect(cx + 38, H * 0.30, 9, 62);
  // fist bumps
  ctx.fillStyle = '#5a6565'; ctx.beginPath(); ctx.arc(cx - 54, H * 0.76, 14, 0, Math.PI * 2); ctx.fill(); ol(ctx, 2, '#222'); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx + 54, H * 0.76, 14, 0, Math.PI * 2); ctx.fill(); ol(ctx, 2, '#222'); ctx.stroke();
  // arm lava cracks
  shadow(ctx, 10, '#ff6600'); ctx.fillStyle = '#ff4400';
  ctx.fillRect(cx - 62, H * 0.40, 18, 3); ctx.fillRect(cx - 60, H * 0.52, 14, 3); ctx.fillRect(cx + 44, H * 0.42, 14, 3); ctx.fillRect(cx + 42, H * 0.54, 16, 3); noshadow(ctx);
  // body
  const stg = ctx.createLinearGradient(cx - 38, 0, cx + 38, 0); stg.addColorStop(0, '#6a7575'); stg.addColorStop(0.3, '#8a9898'); stg.addColorStop(1, '#3a4040');
  ctx.fillStyle = stg; ctx.fillRect(cx - 38, H * 0.28, 76, 74); ol(ctx, 2.5, '#222'); ctx.strokeRect(cx - 38, H * 0.28, 76, 74); ctx.fillStyle = 'rgba(150,180,180,0.3)'; ctx.fillRect(cx - 38, H * 0.28, 13, 74);
  // body lava cracks
  shadow(ctx, 14, '#ff5500'); ctx.fillStyle = '#ff3300';
  ctx.fillRect(cx - 30, H * 0.38, 60, 3); ctx.fillRect(cx - 30, H * 0.52, 60, 3); ctx.fillRect(cx - 8, H * 0.30, 3, 30); ctx.fillRect(cx + 5, H * 0.44, 3, 24); noshadow(ctx);
  // moss patches
  ctx.fillStyle = 'rgba(40,100,50,0.55)'; ctx.beginPath(); ctx.arc(cx + 20, H * 0.34, 9, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(cx - 22, H * 0.48, 7, 0, Math.PI * 2); ctx.fill();
  // legs
  ctx.fillStyle = '#4a5555'; ctx.fillRect(cx - 28, H * 0.64, 24, 28); ctx.fillRect(cx + 4, H * 0.64, 24, 28); ol(ctx, 2, '#222'); ctx.strokeRect(cx - 28, H * 0.64, 24, 28); ctx.strokeRect(cx + 4, H * 0.64, 24, 28);
  // BIG rocky head
  const hg = ctx.createRadialGradient(cx - 8, H * 0.14, 2, cx, H * 0.21, 33); hg.addColorStop(0, '#909a9a'); hg.addColorStop(0.5, '#606868'); hg.addColorStop(1, '#303838');
  ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(cx, H * 0.21, 33, 0, Math.PI * 2); ctx.fill(); ol(ctx, 2.5, '#1a1a1a'); ctx.stroke(); spec(ctx, cx - 10, H * 0.11, 10, 7, 0.3);
  // lava crack on face
  shadow(ctx, 8, '#ff4400'); ctx.fillStyle = '#ff2200'; ctx.fillRect(cx - 20, H * 0.24, 40, 2); noshadow(ctx);
  // single BIG glowing eye
  shadow(ctx, 22, '#ff8800'); ctx.fillStyle = '#ff6600'; ctx.beginPath(); ctx.ellipse(cx, H * 0.195, 18, 12, 0, 0, Math.PI * 2); ctx.fill(); noshadow(ctx);
  ctx.fillStyle = '#ffcc00'; ctx.beginPath(); ctx.arc(cx, H * 0.195, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx - 4, H * 0.185, 3, 0, Math.PI * 2); ctx.fill();
  rglow(ctx, cx, H * 0.94, 52, '#000000');
}

function _thunder_chief(ctx, W, H) {
  const cx = W / 2;
  gbg3(ctx, '#1a0a00', '#0c0500', '#060200', W, H);
  rglow(ctx, cx, H * 0.50, 88, '#ffaa00');
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; shadow(ctx, 12, '#ffee00'); ctx.fillStyle = 'rgba(255,220,0,0.22)'; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * 56, H * 0.48 + Math.sin(a) * 28, 7, 0, Math.PI * 2); ctx.fill(); } noshadow(ctx);
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(cx, H * 0.93, 46, 11, 0, 0, Math.PI * 2); ctx.fill();
  // left axe
  ctx.fillStyle = '#8b6030'; ctx.fillRect(cx - 52, H * 0.22, 8, 72); ol(ctx, 1.5, '#5a3010'); ctx.strokeRect(cx - 52, H * 0.22, 8, 72);
  const lag = ctx.createLinearGradient(cx - 68, 0, cx - 34, 0); lag.addColorStop(0, '#e8e8e8'); lag.addColorStop(0.5, '#c0c0c0'); lag.addColorStop(1, '#777');
  ctx.fillStyle = lag; ctx.beginPath(); ctx.moveTo(cx - 68, H * 0.21); ctx.lineTo(cx - 34, H * 0.24); ctx.lineTo(cx - 44, H * 0.06); ctx.closePath(); ctx.fill(); ol(ctx, 2); ctx.stroke(); spec(ctx, cx - 58, H * 0.18, 7, 4, 0.5);
  // right axe
  ctx.fillStyle = '#8b6030'; ctx.fillRect(cx + 44, H * 0.22, 8, 72); ol(ctx, 1.5, '#5a3010'); ctx.strokeRect(cx + 44, H * 0.22, 8, 72);
  const rag = ctx.createLinearGradient(cx + 34, 0, cx + 68, 0); rag.addColorStop(0, '#777'); rag.addColorStop(0.5, '#c0c0c0'); rag.addColorStop(1, '#e8e8e8');
  ctx.fillStyle = rag; ctx.beginPath(); ctx.moveTo(cx + 34, H * 0.24); ctx.lineTo(cx + 68, H * 0.21); ctx.lineTo(cx + 44, H * 0.06); ctx.closePath(); ctx.fill(); ol(ctx, 2); ctx.stroke(); spec(ctx, cx + 58, H * 0.18, 7, 4, 0.5);
  // body
  const tbg = ctx.createLinearGradient(cx - 28, 0, cx + 28, 0); tbg.addColorStop(0, '#8b3a00'); tbg.addColorStop(0.4, '#cc5500'); tbg.addColorStop(1, '#661a00');
  ctx.fillStyle = tbg; ctx.fillRect(cx - 28, H * 0.28, 56, 38); ol(ctx, 2, '#3a1500'); ctx.strokeRect(cx - 28, H * 0.28, 56, 38);
  ctx.fillStyle = '#cc0000'; ctx.fillRect(cx - 28, H * 0.36, 56, 8); // war paint stripe
  // legs
  ctx.fillStyle = '#441a00'; ctx.fillRect(cx - 22, H * 0.64, 18, 28); ctx.fillRect(cx + 4, H * 0.64, 18, 28); ol(ctx, 2, '#2a1000'); ctx.strokeRect(cx - 22, H * 0.64, 18, 28); ctx.strokeRect(cx + 4, H * 0.64, 18, 28);
  // BIG head
  const thg = ctx.createRadialGradient(cx - 8, H * 0.14, 2, cx, H * 0.21, 28); thg.addColorStop(0, '#e06020'); thg.addColorStop(0.5, '#c04010'); thg.addColorStop(1, '#7a2800');
  ctx.fillStyle = thg; ctx.beginPath(); ctx.arc(cx, H * 0.21, 28, 0, Math.PI * 2); ctx.fill(); ol(ctx, 2.5, '#3a1000'); ctx.stroke(); spec(ctx, cx - 10, H * 0.11, 9, 6, 0.35);
  // war paint on face
  ctx.fillStyle = '#cc0000'; ctx.fillRect(cx - 22, H * 0.195, 44, 5); // nose-stripe war paint
  // horned helmet
  ctx.fillStyle = '#555'; ctx.fillRect(cx - 28, H * 0.09, 56, 16); ol(ctx, 1.5, '#222'); ctx.strokeRect(cx - 28, H * 0.09, 56, 16);
  ctx.fillStyle = '#777'; ctx.beginPath(); ctx.moveTo(cx - 26, H * 0.09); ctx.lineTo(cx - 36, H * -0.01); ctx.lineTo(cx - 16, H * 0.09); ctx.closePath(); ctx.fill(); ol(ctx, 1.5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 16, H * 0.09); ctx.lineTo(cx + 36, H * -0.01); ctx.lineTo(cx + 26, H * 0.09); ctx.closePath(); ctx.fill(); ol(ctx, 1.5); ctx.stroke();
  // eyes
  eye(ctx, cx - 8, H * 0.215, '#ffaa00', 5); eye(ctx, cx + 8, H * 0.215, '#ffaa00', 5);
  // lightning sparks
  shadow(ctx, 16, '#ffee00'); [[cx - 38, H * 0.42], [cx + 38, H * 0.42], [cx - 30, H * 0.60], [cx + 30, H * 0.60]].forEach(([x, y]) => { ctx.fillStyle = '#ffcc00'; ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill(); }); noshadow(ctx);
  rglow(ctx, cx, H * 0.94, 46, '#000000');
}

function _blaze_witch(ctx, W, H) {
  const cx = W / 2;
  gbg3(ctx, '#1a0500', '#0c0200', '#060100', W, H);
  rglow(ctx, cx, H * 0.55, 82, '#ff4400');
  // fire pool at feet
  const fpg = ctx.createRadialGradient(cx, H * 0.84, 2, cx, H * 0.84, 56); fpg.addColorStop(0, 'rgba(255,200,0,0.85)'); fpg.addColorStop(0.5, 'rgba(255,60,0,0.55)'); fpg.addColorStop(1, 'rgba(255,0,0,0)');
  ctx.fillStyle = fpg; ctx.beginPath(); ctx.ellipse(cx, H * 0.84, 56, 24, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(cx, H * 0.93, 42, 10, 0, 0, Math.PI * 2); ctx.fill();
  // arms
  ctx.fillStyle = '#1a1a1a'; ctx.fillRect(cx - 38, H * 0.36, 10, 30); ctx.fillRect(cx + 26, H * 0.36, 10, 30); ol(ctx, 1.5); ctx.strokeRect(cx - 38, H * 0.36, 10, 30); ctx.strokeRect(cx + 26, H * 0.36, 10, 30);
  // fire hands
  shadow(ctx, 20, '#ff6600'); [[cx - 38, H * 0.54], [cx + 36, H * 0.54]].forEach(([x, y]) => {
    ctx.fillStyle = '#ff4400'; ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2); ctx.fill(); ol(ctx, 1.5, '#880000'); ctx.stroke();
    ctx.fillStyle = '#ffcc00'; ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x - 2, y - 2, 2, 0, Math.PI * 2); ctx.fill();
  }); noshadow(ctx);
  // robe body
  ctx.fillStyle = '#0d0d0d'; ctx.beginPath(); ctx.moveTo(cx - 26, H * 0.36); ctx.lineTo(cx + 26, H * 0.36); ctx.lineTo(cx + 34, H * 0.88); ctx.lineTo(cx - 34, H * 0.88); ctx.closePath(); ctx.fill(); ol(ctx, 2, '#050505'); ctx.stroke();
  ctx.fillStyle = '#1a0000'; ctx.beginPath(); ctx.moveTo(cx, H * 0.36); ctx.lineTo(cx + 4, H * 0.88); ctx.lineTo(cx - 4, H * 0.88); ctx.closePath(); ctx.fill();
  // pointy witch hat (tall)
  ctx.fillStyle = '#111'; ctx.beginPath(); ctx.moveTo(cx - 28, H * 0.31); ctx.lineTo(cx + 28, H * 0.31); ctx.lineTo(cx + 10, H * 0.05); ctx.lineTo(cx - 10, H * 0.05); ctx.closePath(); ctx.fill(); ol(ctx, 2, '#050505'); ctx.stroke();
  ctx.fillRect(cx - 30, H * 0.29, 60, 7); ol(ctx, 2, '#050505'); ctx.strokeRect(cx - 30, H * 0.29, 60, 7); // brim
  ctx.fillStyle = '#ff4400'; ctx.fillRect(cx - 28, H * 0.31, 56, 4); // hat band
  // BIG face
  const wfg = ctx.createRadialGradient(cx - 5, H * 0.24, 2, cx, H * 0.28, 22); wfg.addColorStop(0, '#f0c890'); wfg.addColorStop(1, '#c09060');
  ctx.fillStyle = wfg; ctx.beginPath(); ctx.arc(cx, H * 0.28, 22, 0, Math.PI * 2); ctx.fill(); ol(ctx, 2.5, '#7a5030'); ctx.stroke(); spec(ctx, cx - 8, H * 0.18, 8, 5, 0.3);
  // burning eyes
  shadow(ctx, 12, '#ff4400'); eye(ctx, cx - 7, H * 0.268, '#ff3300', 5.5); eye(ctx, cx + 7, H * 0.268, '#ff3300', 5.5); noshadow(ctx);
  // ember particles
  shadow(ctx, 10, '#ff8800'); [[cx - 46, H * 0.44], [cx + 50, H * 0.37], [cx - 38, H * 0.70], [cx + 40, H * 0.74]].forEach(([x, y]) => { ctx.fillStyle = '#ff8800'; ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill(); }); noshadow(ctx);
  rglow(ctx, cx, H * 0.94, 44, '#000000');
}

function _wing_knight(ctx, W, H) {
  const cx = W / 2;
  gbg3(ctx, '#0a1428', '#050c18', '#020408', W, H);
  rglow(ctx, cx, H * 0.45, 90, '#88aaff');
  // divine light beam
  const dlg = ctx.createLinearGradient(0, 0, 0, H * 0.5); dlg.addColorStop(0, 'rgba(200,220,255,0.25)'); dlg.addColorStop(1, 'rgba(200,220,255,0)');
  ctx.fillStyle = dlg; ctx.fillRect(cx - 54, 0, 108, H * 0.5);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(cx, H * 0.93, 46, 11, 0, 0, Math.PI * 2); ctx.fill();
  // wings (outlined, full spread)
  ctx.fillStyle = 'rgba(240,248,255,0.92)'; ctx.beginPath(); ctx.moveTo(cx - 14, H * 0.30); ctx.bezierCurveTo(cx - 72, H * 0.08, cx - 82, H * 0.38, cx - 62, H * 0.60); ctx.lineTo(cx - 14, H * 0.44); ctx.closePath(); ctx.fill(); ol(ctx, 1.8, '#8899bb'); ctx.stroke();
  ctx.fillStyle = 'rgba(180,200,235,0.5)'; ctx.beginPath(); ctx.moveTo(cx - 16, H * 0.34); ctx.bezierCurveTo(cx - 58, H * 0.17, cx - 64, H * 0.40, cx - 52, H * 0.55); ctx.lineTo(cx - 16, H * 0.42); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(240,248,255,0.92)'; ctx.beginPath(); ctx.moveTo(cx + 14, H * 0.30); ctx.bezierCurveTo(cx + 72, H * 0.08, cx + 82, H * 0.38, cx + 62, H * 0.60); ctx.lineTo(cx + 14, H * 0.44); ctx.closePath(); ctx.fill(); ol(ctx, 1.8, '#8899bb'); ctx.stroke();
  ctx.fillStyle = 'rgba(180,200,235,0.5)'; ctx.beginPath(); ctx.moveTo(cx + 16, H * 0.34); ctx.bezierCurveTo(cx + 58, H * 0.17, cx + 64, H * 0.40, cx + 52, H * 0.55); ctx.lineTo(cx + 16, H * 0.42); ctx.closePath(); ctx.fill();
  // lance
  shadow(ctx, 12, '#aaccff'); ctx.fillStyle = '#c8c8d8'; ctx.fillRect(cx - 4, H * 0.03, 6, 74); noshadow(ctx); ol(ctx, 1.5, '#888'); ctx.strokeRect(cx - 4, H * 0.03, 6, 74);
  ctx.fillStyle = '#ffcc00'; ctx.beginPath(); ctx.moveTo(cx - 5, H * 0.03); ctx.lineTo(cx + 9, H * 0.03); ctx.lineTo(cx + 2, H * -0.04); ctx.closePath(); ctx.fill(); ol(ctx, 1.5, '#886000'); ctx.stroke();
  ctx.fillStyle = '#aaaaaa'; ctx.fillRect(cx - 28, H * 0.60, 56, 7); ol(ctx, 1.5, '#777'); ctx.strokeRect(cx - 28, H * 0.60, 56, 7); // cross-guard
  // armor body
  const wag = ctx.createLinearGradient(cx - 28, 0, cx + 28, 0); wag.addColorStop(0, '#d0d8e8'); wag.addColorStop(0.4, '#eef2f8'); wag.addColorStop(1, '#8899aa');
  ctx.fillStyle = wag; ctx.fillRect(cx - 28, H * 0.30, 56, 36); ol(ctx, 2.5, '#667788'); ctx.strokeRect(cx - 28, H * 0.30, 56, 36); spec(ctx, cx - 22, H * 0.33, 14, 6, 0.35);
  ctx.fillStyle = 'rgba(100,140,200,0.28)'; ctx.fillRect(cx - 26, H * 0.38, 52, 12); ctx.fillRect(cx - 26, H * 0.52, 52, 12);
  // legs
  ctx.fillStyle = '#8899aa'; ctx.fillRect(cx - 22, H * 0.64, 18, 26); ctx.fillRect(cx + 4, H * 0.64, 18, 26); ol(ctx, 2, '#556677'); ctx.strokeRect(cx - 22, H * 0.64, 18, 26); ctx.strokeRect(cx + 4, H * 0.64, 18, 26);
  // BIG white helmet
  const whg = ctx.createRadialGradient(cx - 8, H * 0.11, 2, cx, H * 0.20, 30); whg.addColorStop(0, '#ffffff'); whg.addColorStop(0.5, '#ccd8ee'); whg.addColorStop(1, '#667788');
  ctx.fillStyle = whg; ctx.beginPath(); ctx.arc(cx, H * 0.20, 30, 0, Math.PI * 2); ctx.fill(); ol(ctx, 2.5, '#445566'); ctx.stroke(); spec(ctx, cx - 10, H * 0.10, 10, 7, 0.5);
  ctx.fillStyle = '#1a2a3a'; ctx.fillRect(cx - 14, H * 0.192, 28, 7); ol(ctx, 1.5, '#0a1520'); ctx.strokeRect(cx - 14, H * 0.192, 28, 7); // visor
  ctx.fillStyle = 'rgba(200,230,255,0.55)'; ctx.fillRect(cx - 12, H * 0.192, 10, 3); // visor highlight
  rglow(ctx, cx, H * 0.94, 46, '#000000');
}

function _frostborn(ctx, W, H) {
  const cx = W / 2;
  gbg3(ctx, '#061428', '#030a14', '#000608', W, H);
  rglow(ctx, cx, H * 0.50, 84, '#0088ff');
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; shadow(ctx, 8, '#aaddff'); ctx.fillStyle = 'rgba(180,230,255,0.52)'; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * 66, H * 0.5 + Math.sin(a) * 34, 4, 0, Math.PI * 2); ctx.fill(); } noshadow(ctx);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(cx, H * 0.93, 42, 11, 0, 0, Math.PI * 2); ctx.fill();
  // robe
  const irg = ctx.createLinearGradient(cx - 28, 0, cx + 28, 0); irg.addColorStop(0, '#1a4a7a'); irg.addColorStop(0.5, '#2266aa'); irg.addColorStop(1, '#0d2a4a');
  ctx.fillStyle = irg; ctx.beginPath(); ctx.moveTo(cx - 28, H * 0.34); ctx.lineTo(cx + 28, H * 0.34); ctx.lineTo(cx + 32, H * 0.88); ctx.lineTo(cx - 32, H * 0.88); ctx.closePath(); ctx.fill(); ol(ctx, 2, '#0a1e3a'); ctx.stroke();
  ctx.fillStyle = 'rgba(150,220,255,0.15)'; for (let i = 0; i < 4; i++) ctx.fillRect(cx - 22 + i * 14, H * 0.42, 3, 42);
  // legs
  ctx.fillStyle = '#0d2a4a'; ctx.fillRect(cx - 22, H * 0.64, 18, 26); ctx.fillRect(cx + 4, H * 0.64, 18, 26); ol(ctx, 2, '#061428'); ctx.strokeRect(cx - 22, H * 0.64, 18, 26); ctx.strokeRect(cx + 4, H * 0.64, 18, 26);
  // ice orbs (arms)
  shadow(ctx, 16, '#00aaff'); [[cx - 38, H * 0.47], [cx + 38, H * 0.47]].forEach(([x, y]) => {
    ctx.fillStyle = '#44aaff'; ctx.beginPath(); ctx.arc(x, y, 13, 0, Math.PI * 2); ctx.fill(); ol(ctx, 1.8, '#005588'); ctx.stroke();
    ctx.fillStyle = 'rgba(200,240,255,0.65)'; ctx.beginPath(); ctx.arc(x - 4, y - 4, 7, 0, Math.PI * 2); ctx.fill();
  }); noshadow(ctx);
  // BIG frost head
  const fbhg = ctx.createRadialGradient(cx - 6, H * 0.14, 2, cx, H * 0.20, 28); fbhg.addColorStop(0, '#d8eeff'); fbhg.addColorStop(0.5, '#88bbdd'); fbhg.addColorStop(1, '#3366aa');
  ctx.fillStyle = fbhg; ctx.beginPath(); ctx.arc(cx, H * 0.20, 28, 0, Math.PI * 2); ctx.fill(); ol(ctx, 2.5, '#0a2244'); ctx.stroke(); spec(ctx, cx - 10, H * 0.10, 9, 6, 0.45);
  // ice crown
  shadow(ctx, 12, '#00ccff'); ctx.fillStyle = '#66ccff';
  [[-14, -58], [-6, -66], [4, -64], [14, -58]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.moveTo(cx + dx, H * 0.13); ctx.lineTo(cx + dx / 2, H * 0.13 + dy / H * 3.5); ctx.lineTo(cx + dx + 8, H * 0.13); ctx.closePath(); ctx.fill(); ol(ctx, 1.5, '#005588'); ctx.stroke(); }); noshadow(ctx);
  // frost eyes
  eye(ctx, cx - 8, H * 0.193, '#44ccff', 5.5); eye(ctx, cx + 8, H * 0.193, '#44ccff', 5.5);
  // frost breath
  const bfg = ctx.createLinearGradient(cx - 22, H * 0.24, cx - 56, H * 0.28); bfg.addColorStop(0, 'rgba(180,230,255,0.75)'); bfg.addColorStop(1, 'rgba(180,230,255,0)');
  ctx.fillStyle = bfg; ctx.beginPath(); ctx.ellipse(cx - 38, H * 0.26, 28, 9, -0.3, 0, Math.PI * 2); ctx.fill();
  rglow(ctx, cx, H * 0.94, 46, '#000000');
}

function _jade_monk(ctx, W, H) {
  const cx = W / 2;
  gbg3(ctx, '#041808', '#020c04', '#010601', W, H);
  rglow(ctx, cx, H * 0.50, 84, '#00cc44');
  for (let r = 32; r <= 72; r += 20) { ctx.strokeStyle = `rgba(0,200,80,${0.42 - r / 200})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cx, H * 0.54, r, r * 0.4, 0, 0, Math.PI * 2); ctx.stroke(); }
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(cx, H * 0.93, 42, 11, 0, 0, Math.PI * 2); ctx.fill();
  // staff
  ctx.fillStyle = '#7a5020'; ctx.fillRect(cx - 38, H * 0.09, 6, 66); ol(ctx, 1.5, '#4a3010'); ctx.strokeRect(cx - 38, H * 0.09, 6, 66);
  shadow(ctx, 14, '#00ff66'); ctx.fillStyle = '#44ee88'; ctx.beginPath(); ctx.arc(cx - 35, H * 0.09, 12, 0, Math.PI * 2); ctx.fill(); noshadow(ctx); ol(ctx, 2, '#006633'); ctx.stroke();
  ctx.fillStyle = 'rgba(200,255,220,0.55)'; ctx.beginPath(); ctx.arc(cx - 39, H * 0.065, 6, 0, Math.PI * 2); ctx.fill();
  // arms
  ctx.fillStyle = '#0e5e28'; ctx.fillRect(cx - 38, H * 0.34, 10, 36); ctx.fillRect(cx + 26, H * 0.34, 10, 36); ol(ctx, 1.5, '#073d18'); ctx.strokeRect(cx - 38, H * 0.34, 10, 36); ctx.strokeRect(cx + 26, H * 0.34, 10, 36);
  // jade orb in right hand
  shadow(ctx, 18, '#00ff66'); ctx.fillStyle = '#33cc66'; ctx.beginPath(); ctx.arc(cx + 31, H * 0.56, 12, 0, Math.PI * 2); ctx.fill(); noshadow(ctx); ol(ctx, 2, '#006633'); ctx.stroke();
  ctx.fillStyle = 'rgba(180,255,200,0.55)'; ctx.beginPath(); ctx.arc(cx + 27, H * 0.53, 6, 0, Math.PI * 2); ctx.fill();
  // robe
  const jrg = ctx.createLinearGradient(cx - 26, 0, cx + 26, 0); jrg.addColorStop(0, '#0e5e28'); jrg.addColorStop(0.5, '#1a8040'); jrg.addColorStop(1, '#0a3818');
  ctx.fillStyle = jrg; ctx.beginPath(); ctx.moveTo(cx - 26, H * 0.34); ctx.lineTo(cx + 26, H * 0.34); ctx.lineTo(cx + 32, H * 0.88); ctx.lineTo(cx - 32, H * 0.88); ctx.closePath(); ctx.fill(); ol(ctx, 2, '#073d18'); ctx.stroke();
  ctx.fillStyle = '#1a8040'; ctx.fillRect(cx - 26, H * 0.46, 52, 8); ctx.fillStyle = '#c8a000'; ctx.fillRect(cx - 5, H * 0.46, 10, 8); // sash + gold buckle
  // legs
  ctx.fillStyle = '#0a3818'; ctx.fillRect(cx - 22, H * 0.64, 18, 26); ctx.fillRect(cx + 4, H * 0.64, 18, 26); ol(ctx, 2, '#051c0c'); ctx.strokeRect(cx - 22, H * 0.64, 18, 26); ctx.strokeRect(cx + 4, H * 0.64, 18, 26);
  // BIG face
  const jfg = ctx.createRadialGradient(cx - 5, H * 0.17, 2, cx, H * 0.22, 26); jfg.addColorStop(0, '#f0d8b0'); jfg.addColorStop(1, '#c8a070');
  ctx.fillStyle = jfg; ctx.beginPath(); ctx.arc(cx, H * 0.22, 26, 0, Math.PI * 2); ctx.fill(); ol(ctx, 2.5, '#7a5030'); ctx.stroke(); spec(ctx, cx - 9, H * 0.11, 9, 6, 0.32);
  eye(ctx, cx - 8, H * 0.212, '#33aa44', 5); eye(ctx, cx + 8, H * 0.212, '#33aa44', 5);
  // serene smile
  ctx.strokeStyle = '#7a5030'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, H * 0.24, 10, 0.2, Math.PI - 0.2); ctx.stroke();
  // heal sparks
  shadow(ctx, 10, '#00ff88'); [[cx + 38, H * 0.36], [cx + 46, H * 0.50], [cx + 32, H * 0.64]].forEach(([x, y]) => { ctx.fillStyle = '#88ffaa'; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); }); noshadow(ctx);
  rglow(ctx, cx, H * 0.94, 46, '#000000');
}

function _sea_crusher(ctx, W, H) {
  const cx = W / 2;
  gbg3(ctx, '#051820', '#031018', '#010608', W, H);
  rglow(ctx, cx, H * 0.50, 86, '#00aacc');
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(cx, H * 0.93, 44, 11, 0, 0, Math.PI * 2); ctx.fill();
  // aqua shell shield (left arm)
  ctx.fillStyle = '#0a4050'; ctx.beginPath(); ctx.moveTo(cx - 52, H * 0.26); ctx.lineTo(cx - 26, H * 0.26); ctx.lineTo(cx - 26, H * 0.74); ctx.lineTo(cx - 52, H * 0.74); ctx.closePath(); ctx.fill(); ol(ctx, 2, '#0d2a35'); ctx.stroke();
  ctx.fillStyle = 'rgba(50,200,220,0.28)'; ctx.fillRect(cx - 50, H * 0.30, 22, 40);
  ctx.fillStyle = '#1a8888'; ctx.fillRect(cx - 52, H * 0.26, 5, 48); // shell ridge
  spec(ctx, cx - 42, H * 0.33, 8, 5, 0.28);
  // water cannon arm (right)
  const wcg = ctx.createLinearGradient(cx + 20, 0, cx + 74, 0); wcg.addColorStop(0, '#1a6688'); wcg.addColorStop(1, '#0a3344');
  ctx.fillStyle = wcg; ctx.fillRect(cx + 22, H * 0.36, 50, 22); ol(ctx, 2, '#082838'); ctx.strokeRect(cx + 22, H * 0.36, 50, 22);
  shadow(ctx, 16, '#00ccff'); ctx.fillStyle = '#00aabb'; ctx.beginPath(); ctx.arc(cx + 72, H * 0.47, 14, 0, Math.PI * 2); ctx.fill(); noshadow(ctx); ol(ctx, 2, '#006688'); ctx.stroke();
  ctx.fillStyle = 'rgba(150,240,255,0.55)'; ctx.beginPath(); ctx.arc(cx + 68, H * 0.44, 7, 0, Math.PI * 2); ctx.fill();
  // water spray jets
  for (let i = 0; i < 6; i++) { const spg = ctx.createLinearGradient(cx + 72, H * 0.47, cx + 86 + i * 9, H * 0.47 + (i - 2.5) * 7); spg.addColorStop(0, 'rgba(100,220,255,0.65)'); spg.addColorStop(1, 'rgba(100,220,255,0)'); ctx.fillStyle = spg; ctx.beginPath(); ctx.ellipse(cx + 80 + i * 9, H * 0.43 + (i - 2.5) * 6, 7, 3.5, 0.1 * i, 0, Math.PI * 2); ctx.fill(); }
  // body (aqua shell armor)
  const sbg = ctx.createLinearGradient(cx - 28, 0, cx + 28, 0); sbg.addColorStop(0, '#1a7060'); sbg.addColorStop(0.5, '#22908a'); sbg.addColorStop(1, '#0e4040');
  ctx.fillStyle = sbg; ctx.fillRect(cx - 26, H * 0.30, 52, 78); ol(ctx, 2, '#0a3030'); ctx.strokeRect(cx - 26, H * 0.30, 52, 78);
  ctx.fillStyle = 'rgba(100,240,240,0.18)'; ctx.fillRect(cx - 24, H * 0.40, 48, 14); ctx.fillRect(cx - 24, H * 0.56, 48, 14); // plate lines
  spec(ctx, cx - 8, H * 0.36, 12, 7, 0.26);
  // BIG helmet
  const shg = ctx.createRadialGradient(cx - 8, H * 0.16, 2, cx, H * 0.22, 30); shg.addColorStop(0, '#33bbbb'); shg.addColorStop(1, '#0a4040');
  ctx.fillStyle = shg; ctx.beginPath(); ctx.arc(cx, H * 0.22, 30, 0, Math.PI * 2); ctx.fill(); ol(ctx, 2.5, '#082838'); ctx.stroke(); spec(ctx, cx - 10, H * 0.10, 11, 7, 0.34);
  // visor slit
  ctx.fillStyle = '#00ccdd'; ctx.fillRect(cx - 16, H * 0.212, 22, 7); ol(ctx, 1.2, '#006688'); ctx.strokeRect(cx - 16, H * 0.212, 22, 7);
  ctx.fillStyle = 'rgba(0,220,255,0.45)'; ctx.fillRect(cx - 15, H * 0.214, 20, 4);
  // eyes peeking through visor
  eye(ctx, cx - 6, H * 0.216, '#00ddff', 4);  eye(ctx, cx + 8, H * 0.216, '#00ddff', 4);
  // legs
  ctx.fillStyle = '#0e5048'; ctx.fillRect(cx - 22, H * 0.66, 18, 26); ctx.fillRect(cx + 4, H * 0.66, 18, 26); ol(ctx, 2, '#082830'); ctx.strokeRect(cx - 22, H * 0.66, 18, 26); ctx.strokeRect(cx + 4, H * 0.66, 18, 26);
  rglow(ctx, cx, H * 0.94, 46, '#000000');
}

function _crystal_sage(ctx, W, H) {
  const cx = W / 2;
  gbg3(ctx, '#150828', '#0d0520', '#050108', W, H);
  rglow(ctx, cx, H * 0.50, 86, '#aa44ff');
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(cx, H * 0.93, 44, 11, 0, 0, Math.PI * 2); ctx.fill();
  // floating crystal shard halo
  shadow(ctx, 14, '#cc44ff');
  [[-46, H * 0.28], [-54, H * 0.48], [38, H * 0.24], [50, H * 0.46], [-20, H * 0.12], [22, H * 0.14]].forEach(([dx, y]) => {
    ctx.fillStyle = '#dd88ff'; ctx.beginPath(); ctx.moveTo(cx + dx, y); ctx.lineTo(cx + dx + 11, y + 20); ctx.lineTo(cx + dx - 3, y + 24); ctx.closePath(); ctx.fill();
    ol(ctx, 1.5, '#9922cc'); ctx.stroke();
    ctx.fillStyle = 'rgba(255,200,255,0.45)'; ctx.fillRect(cx + dx + 1, y + 3, 5, 11);
  });
  noshadow(ctx);
  // crystal barrier
  shadow(ctx, 18, '#ff88ff'); ctx.fillStyle = 'rgba(220,150,255,0.3)'; ctx.fillRect(cx - 32, H * 0.50, 64, 38); noshadow(ctx);
  ctx.strokeStyle = 'rgba(200,100,255,0.75)'; ctx.lineWidth = 2.5; ctx.strokeRect(cx - 32, H * 0.50, 64, 38);
  // arms
  ctx.fillStyle = '#44107a'; ctx.fillRect(cx - 38, H * 0.34, 10, 40); ctx.fillRect(cx + 28, H * 0.34, 10, 40); ol(ctx, 1.5, '#2a0850'); ctx.strokeRect(cx - 38, H * 0.34, 10, 40); ctx.strokeRect(cx + 28, H * 0.34, 10, 40);
  // robe
  const crg = ctx.createLinearGradient(cx - 28, 0, cx + 28, 0); crg.addColorStop(0, '#44107a'); crg.addColorStop(0.5, '#6620aa'); crg.addColorStop(1, '#2a0850');
  ctx.fillStyle = crg; ctx.beginPath(); ctx.moveTo(cx - 28, H * 0.34); ctx.lineTo(cx + 28, H * 0.34); ctx.lineTo(cx + 34, H * 0.88); ctx.lineTo(cx - 34, H * 0.88); ctx.closePath(); ctx.fill(); ol(ctx, 2, '#1a0440'); ctx.stroke();
  ctx.fillStyle = 'rgba(200,100,255,0.22)'; ctx.fillRect(cx - 26, H * 0.42, 52, 10); ctx.fillRect(cx - 26, H * 0.54, 52, 10);
  // legs
  ctx.fillStyle = '#2a0850'; ctx.fillRect(cx - 22, H * 0.66, 18, 24); ctx.fillRect(cx + 4, H * 0.66, 18, 24); ol(ctx, 2, '#1a0440'); ctx.strokeRect(cx - 22, H * 0.66, 18, 24); ctx.strokeRect(cx + 4, H * 0.66, 18, 24);
  // BIG face
  const cfg = ctx.createRadialGradient(cx - 8, H * 0.16, 2, cx, H * 0.22, 26); cfg.addColorStop(0, '#e8d0f0'); cfg.addColorStop(1, '#9060b0');
  ctx.fillStyle = cfg; ctx.beginPath(); ctx.arc(cx, H * 0.22, 26, 0, Math.PI * 2); ctx.fill(); ol(ctx, 2.5, '#5a1888'); ctx.stroke(); spec(ctx, cx - 9, H * 0.10, 9, 6, 0.3);
  eye(ctx, cx - 8, H * 0.21, '#cc44ff', 5); eye(ctx, cx + 8, H * 0.21, '#cc44ff', 5);
  // crystal crown spires
  shadow(ctx, 12, '#ff88ff'); ctx.fillStyle = '#ff66ff';
  [[-12, 16], [-2, 22], [10, 18]].forEach(([dx, h]) => { ctx.beginPath(); ctx.moveTo(cx + dx - 6, H * 0.075); ctx.lineTo(cx + dx, H * 0.075 - h); ctx.lineTo(cx + dx + 6, H * 0.075); ctx.closePath(); ctx.fill(); ol(ctx, 1.5, '#9922cc'); ctx.stroke(); });
  noshadow(ctx);
  rglow(ctx, cx, H * 0.94, 46, '#000000');
}

function _arrow_jack(ctx, W, H) {
  const cx = W / 2;
  gbg3(ctx, '#0a1e06', '#060f03', '#020601', W, H);
  rglow(ctx, cx, H * 0.50, 78, '#448800');
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(cx, H * 0.93, 40, 10, 0, 0, Math.PI * 2); ctx.fill();
  // quiver on back (right)
  ctx.fillStyle = '#6b3010'; ctx.fillRect(cx + 28, H * 0.22, 16, 44); ol(ctx, 1.5, '#3d1a08'); ctx.strokeRect(cx + 28, H * 0.22, 16, 44);
  ctx.fillStyle = '#8b4020'; ctx.fillRect(cx + 28, H * 0.22, 16, 6);
  shadow(ctx, 5, '#cccc00'); ctx.fillStyle = '#c8c8c8';
  [cx + 32, cx + 36, cx + 40].forEach(x => ctx.fillRect(x, H * 0.12, 2.5, 18));
  ctx.fillStyle = '#cc2200'; [cx + 32, cx + 36, cx + 40].forEach(x => { ctx.beginPath(); ctx.moveTo(x, H * 0.12); ctx.lineTo(x + 2.5, H * 0.12); ctx.lineTo(x + 1.25, H * 0.07); ctx.closePath(); ctx.fill(); });
  noshadow(ctx);
  // body - ranger cloak
  const arb = ctx.createLinearGradient(cx - 24, 0, cx + 24, 0); arb.addColorStop(0, '#2a5a10'); arb.addColorStop(0.5, '#3a7018'); arb.addColorStop(1, '#1a3a08');
  ctx.fillStyle = arb; ctx.fillRect(cx - 24, H * 0.30, 48, 76); ol(ctx, 2, '#1a3a08'); ctx.strokeRect(cx - 24, H * 0.30, 48, 76);
  ctx.fillStyle = '#7a4010'; ctx.fillRect(cx - 24, H * 0.36, 48, 5); ctx.fillRect(cx - 24, H * 0.51, 48, 5); // leather straps
  // arms
  ctx.fillStyle = '#2a5a10'; ctx.fillRect(cx - 36, H * 0.30, 12, 40); ctx.fillRect(cx + 24, H * 0.30, 12, 36); ol(ctx, 1.5, '#1a3a08'); ctx.strokeRect(cx - 36, H * 0.30, 12, 40); ctx.strokeRect(cx + 24, H * 0.30, 12, 36);
  // bow (left arm extended)
  ctx.fillStyle = '#7a4010'; ctx.fillRect(cx - 46, H * 0.16, 7, 58); ol(ctx, 1.5, '#3d1a08'); ctx.strokeRect(cx - 46, H * 0.16, 7, 58);
  shadow(ctx, 7, '#88aa44'); ctx.strokeStyle = '#88aa44'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(cx - 42, H * 0.16); ctx.quadraticCurveTo(cx - 58, H * 0.45, cx - 42, H * 0.74); ctx.stroke(); noshadow(ctx);
  // nocked arrow aimed forward
  shadow(ctx, 7, '#ffee00'); ctx.fillStyle = '#c8c8c8'; ctx.fillRect(cx - 58, H * 0.44, 46, 2.5);
  ctx.fillStyle = '#cc0000'; ctx.beginPath(); ctx.moveTo(cx - 58, H * 0.42); ctx.lineTo(cx - 58, H * 0.46); ctx.lineTo(cx - 48, H * 0.44); ctx.closePath(); ctx.fill(); noshadow(ctx);
  // legs
  ctx.fillStyle = '#1a3a08'; ctx.fillRect(cx - 20, H * 0.64, 18, 26); ctx.fillRect(cx + 2, H * 0.64, 18, 26); ol(ctx, 2, '#0e2004'); ctx.strokeRect(cx - 20, H * 0.64, 18, 26); ctx.strokeRect(cx + 2, H * 0.64, 18, 26);
  // BIG face
  const afhg = ctx.createRadialGradient(cx - 8, H * 0.18, 2, cx, H * 0.22, 26); afhg.addColorStop(0, '#e8c890'); afhg.addColorStop(1, '#b8906a');
  ctx.fillStyle = afhg; ctx.beginPath(); ctx.arc(cx, H * 0.22, 26, 0, Math.PI * 2); ctx.fill(); ol(ctx, 2.5, '#7a5030'); ctx.stroke(); spec(ctx, cx - 9, H * 0.11, 9, 6, 0.32);
  // ranger hat brim
  ctx.fillStyle = '#2a5a10'; ctx.beginPath(); ctx.ellipse(cx, H * 0.10, 32, 7, 0, 0, Math.PI * 2); ctx.fill(); ol(ctx, 2, '#1a3a08'); ctx.stroke();
  ctx.fillStyle = '#1a3a08'; ctx.beginPath(); ctx.arc(cx, H * 0.09, 20, Math.PI, 0); ctx.fill(); ol(ctx, 1.5, '#0e2004'); ctx.stroke();
  eye(ctx, cx - 8, H * 0.21, '#664400', 5); eye(ctx, cx + 8, H * 0.21, '#664400', 5);
  // smirk
  ctx.strokeStyle = '#7a5030'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx + 4, H * 0.245, 9, 0.1, Math.PI - 0.3); ctx.stroke();
  rglow(ctx, cx, H * 0.94, 42, '#000000');
}

function _shadow_rogue(ctx, W, H) {
  const cx = W / 2;
  gbg3(ctx, '#050508', '#020204', '#000000', W, H);
  rglow(ctx, cx, H * 0.50, 78, '#440044');
  // shadow smoke wisps rising from base
  for (let i = 0; i < 7; i++) { ctx.fillStyle = `rgba(50,0,60,${0.28 - i * 0.035})`; ctx.beginPath(); ctx.ellipse(cx + (i % 3 - 1) * 20, H * 0.62 + i * 7, 20 + i * 4, 10 + i * 3, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(cx, H * 0.93, 40, 10, 0, 0, Math.PI * 2); ctx.fill();
  // left dagger (X cross on chest)
  shadow(ctx, 10, '#aa0088'); ctx.fillStyle = '#c8c0d8';
  ctx.fillRect(cx - 46, H * 0.23, 5, 38); ol(ctx, 1.5, '#888090'); ctx.strokeRect(cx - 46, H * 0.23, 5, 38);
  ctx.fillStyle = '#c8a000'; ctx.fillRect(cx - 50, H * 0.29, 13, 5); ol(ctx, 1, '#806600'); ctx.strokeRect(cx - 50, H * 0.29, 13, 5);
  ctx.fillStyle = '#c8c0d8'; ctx.beginPath(); ctx.moveTo(cx - 46, H * 0.23); ctx.lineTo(cx - 41, H * 0.23); ctx.lineTo(cx - 43, H * 0.17); ctx.closePath(); ctx.fill(); ol(ctx, 1, '#888090'); ctx.stroke();
  // right dagger
  ctx.fillStyle = '#c8c0d8'; ctx.fillRect(cx + 41, H * 0.23, 5, 38); ol(ctx, 1.5, '#888090'); ctx.strokeRect(cx + 41, H * 0.23, 5, 38);
  ctx.fillStyle = '#c8a000'; ctx.fillRect(cx + 37, H * 0.29, 13, 5); ol(ctx, 1, '#806600'); ctx.strokeRect(cx + 37, H * 0.29, 13, 5);
  ctx.fillStyle = '#c8c0d8'; ctx.beginPath(); ctx.moveTo(cx + 41, H * 0.23); ctx.lineTo(cx + 46, H * 0.23); ctx.lineTo(cx + 44, H * 0.17); ctx.closePath(); ctx.fill(); ol(ctx, 1, '#888090'); ctx.stroke(); noshadow(ctx);
  // dark cloak body
  ctx.fillStyle = '#080810'; ctx.beginPath(); ctx.moveTo(cx - 28, H * 0.30); ctx.lineTo(cx + 28, H * 0.30); ctx.lineTo(cx + 36, H * 0.90); ctx.lineTo(cx - 36, H * 0.90); ctx.closePath(); ctx.fill(); ol(ctx, 2, '#1a0028'); ctx.stroke();
  ctx.fillStyle = 'rgba(80,0,80,0.18)'; ctx.fillRect(cx - 24, H * 0.36, 48, 48);
  // legs (barely visible in shadow)
  ctx.fillStyle = '#060610'; ctx.fillRect(cx - 18, H * 0.65, 16, 26); ctx.fillRect(cx + 2, H * 0.65, 16, 26); ol(ctx, 1.5, '#0a0018'); ctx.strokeRect(cx - 18, H * 0.65, 16, 26); ctx.strokeRect(cx + 2, H * 0.65, 16, 26);
  // BIG hooded head
  ctx.fillStyle = '#0a0a18'; ctx.beginPath(); ctx.arc(cx, H * 0.22, 28, 0, Math.PI * 2); ctx.fill(); ol(ctx, 2.5, '#1a0028'); ctx.stroke();
  ctx.fillStyle = '#060608'; ctx.beginPath(); ctx.arc(cx, H * 0.13, 26, Math.PI, 0); ctx.fill(); ol(ctx, 2, '#0a0018'); ctx.stroke();
  // deep hood shadow on lower face
  ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.beginPath(); ctx.ellipse(cx, H * 0.24, 20, 12, 0, 0, Math.PI * 2); ctx.fill();
  // glowing red assassin eyes (no iris, just red glow)
  shadow(ctx, 18, '#ff0000');
  ctx.fillStyle = '#ff2222'; ctx.beginPath(); ctx.ellipse(cx - 8, H * 0.208, 6, 3.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 8, H * 0.208, 6, 3.5, 0, 0, Math.PI * 2); ctx.fill(); noshadow(ctx);
  ctx.fillStyle = '#ff9999'; ctx.beginPath(); ctx.arc(cx - 8, H * 0.206, 2.5, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(cx + 8, H * 0.206, 2.5, 0, Math.PI * 2); ctx.fill();
  rglow(ctx, cx, H * 0.94, 42, '#000000');
}

function _skywing(ctx, W, H) {
  const cx = W / 2;
  gbg3(ctx, '#061428', '#030a18', '#010408', W, H);
  rglow(ctx, cx, H * 0.48, 84, '#2255ff');
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(cx, H * 0.93, 42, 11, 0, 0, Math.PI * 2); ctx.fill();
  // left mechanical wing (wider/bigger)
  ctx.fillStyle = 'rgba(20,80,220,0.92)'; ctx.beginPath(); ctx.moveTo(cx - 14, H * 0.30); ctx.bezierCurveTo(cx - 74, H * 0.12, cx - 78, H * 0.44, cx - 56, H * 0.64); ctx.lineTo(cx - 14, H * 0.48); ctx.closePath(); ctx.fill(); ol(ctx, 2, '#0a2288'); ctx.stroke();
  ctx.fillStyle = 'rgba(80,160,255,0.45)'; ctx.beginPath(); ctx.moveTo(cx - 16, H * 0.36); ctx.bezierCurveTo(cx - 58, H * 0.22, cx - 62, H * 0.44, cx - 48, H * 0.60); ctx.lineTo(cx - 16, H * 0.46); ctx.closePath(); ctx.fill();
  // right mechanical wing
  ctx.fillStyle = 'rgba(20,80,220,0.92)'; ctx.beginPath(); ctx.moveTo(cx + 14, H * 0.30); ctx.bezierCurveTo(cx + 74, H * 0.12, cx + 78, H * 0.44, cx + 56, H * 0.64); ctx.lineTo(cx + 14, H * 0.48); ctx.closePath(); ctx.fill(); ol(ctx, 2, '#0a2288'); ctx.stroke();
  ctx.fillStyle = 'rgba(80,160,255,0.45)'; ctx.beginPath(); ctx.moveTo(cx + 16, H * 0.36); ctx.bezierCurveTo(cx + 58, H * 0.22, cx + 62, H * 0.44, cx + 48, H * 0.60); ctx.lineTo(cx + 16, H * 0.46); ctx.closePath(); ctx.fill();
  // pilot jacket body
  ctx.fillStyle = '#1144cc'; ctx.fillRect(cx - 22, H * 0.30, 44, 70); ol(ctx, 2, '#0a2288'); ctx.strokeRect(cx - 22, H * 0.30, 44, 70);
  ctx.fillStyle = 'rgba(80,140,255,0.28)'; ctx.fillRect(cx - 20, H * 0.38, 40, 14); spec(ctx, cx - 8, H * 0.35, 12, 7, 0.26);
  // arm holding bomb cluster
  ctx.fillStyle = '#1144cc'; ctx.fillRect(cx - 34, H * 0.30, 12, 38); ctx.fillRect(cx + 22, H * 0.30, 12, 38); ol(ctx, 1.5, '#0a2288'); ctx.strokeRect(cx - 34, H * 0.30, 12, 38); ctx.strokeRect(cx + 22, H * 0.30, 12, 38);
  // bomb cluster below body
  shadow(ctx, 10, '#ff4400');
  [[cx - 14, H * 0.70], [cx, H * 0.72], [cx + 14, H * 0.70]].forEach(([x, y]) => {
    ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.arc(x, y, 11, 0, Math.PI * 2); ctx.fill(); ol(ctx, 1.5, '#333'); ctx.stroke();
    ctx.fillStyle = '#cc2200'; ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff6600'; ctx.fillRect(x - 1.5, y - 16, 3, 7); // fuse
  }); noshadow(ctx);
  // legs
  ctx.fillStyle = '#112288'; ctx.fillRect(cx - 18, H * 0.62, 16, 22); ctx.fillRect(cx + 2, H * 0.62, 16, 22); ol(ctx, 2, '#081166'); ctx.strokeRect(cx - 18, H * 0.62, 16, 22); ctx.strokeRect(cx + 2, H * 0.62, 16, 22);
  // BIG helmet + goggles
  const shbg = ctx.createRadialGradient(cx - 8, H * 0.17, 2, cx, H * 0.22, 28); shbg.addColorStop(0, '#8ab4ff'); shbg.addColorStop(1, '#112288');
  ctx.fillStyle = shbg; ctx.beginPath(); ctx.arc(cx, H * 0.22, 28, 0, Math.PI * 2); ctx.fill(); ol(ctx, 2.5, '#081166'); ctx.stroke(); spec(ctx, cx - 10, H * 0.10, 10, 7, 0.34);
  // goggles visor
  ctx.fillStyle = '#001166'; ctx.fillRect(cx - 16, H * 0.205, 32, 8); ol(ctx, 1.5, '#000844'); ctx.strokeRect(cx - 16, H * 0.205, 32, 8);
  ctx.fillStyle = 'rgba(150,200,255,0.45)'; ctx.fillRect(cx - 14, H * 0.207, 14, 5);
  eye(ctx, cx - 8, H * 0.209, '#44aaff', 4); eye(ctx, cx + 8, H * 0.209, '#44aaff', 4);
  rglow(ctx, cx, H * 0.94, 44, '#000000');
}

function _volt_ranger(ctx, W, H) {
  const cx = W / 2;
  gbg3(ctx, '#1a1400', '#0e0900', '#060400', W, H);
  rglow(ctx, cx, H * 0.50, 84, '#ffcc00');
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(cx, H * 0.93, 42, 11, 0, 0, Math.PI * 2); ctx.fill();
  // chain lightning sparks (right side)
  shadow(ctx, 18, '#ffee00');
  [[cx + 46, H * 0.32], [cx + 62, H * 0.44], [cx + 54, H * 0.56]].forEach(([x, y], i) => {
    ctx.strokeStyle = '#ffee00'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 12 * (i % 2 ? 1 : -1), y + 14); ctx.lineTo(x + 6 * (i % 2 ? -1 : 1), y + 24); ctx.stroke();
  }); noshadow(ctx);
  // gold bodysuit
  const vrb = ctx.createLinearGradient(cx - 24, 0, cx + 24, 0); vrb.addColorStop(0, '#8a6a00'); vrb.addColorStop(0.5, '#c8a000'); vrb.addColorStop(1, '#5a4400');
  ctx.fillStyle = vrb; ctx.fillRect(cx - 24, H * 0.30, 48, 76); ol(ctx, 2, '#4a3400'); ctx.strokeRect(cx - 24, H * 0.30, 48, 76);
  ctx.fillStyle = 'rgba(255,200,0,0.22)'; ctx.fillRect(cx - 22, H * 0.38, 44, 14); spec(ctx, cx - 8, H * 0.35, 12, 7, 0.28);
  // arms
  ctx.fillStyle = '#8a6a00'; ctx.fillRect(cx - 36, H * 0.30, 12, 40); ctx.fillRect(cx + 24, H * 0.30, 12, 38); ol(ctx, 1.5, '#4a3400'); ctx.strokeRect(cx - 36, H * 0.30, 12, 40); ctx.strokeRect(cx + 24, H * 0.30, 12, 38);
  // electric bow (left arm)
  ctx.fillStyle = '#c8a000'; ctx.fillRect(cx - 46, H * 0.18, 6, 50); ol(ctx, 1.5, '#806600'); ctx.strokeRect(cx - 46, H * 0.18, 6, 50);
  shadow(ctx, 12, '#ffee00'); ctx.strokeStyle = 'rgba(255,220,0,0.85)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(cx - 43, H * 0.18); ctx.quadraticCurveTo(cx - 60, H * 0.43, cx - 43, H * 0.68); ctx.stroke(); noshadow(ctx);
  // lightning arrow drawn back
  shadow(ctx, 10, '#ffee00'); ctx.fillStyle = '#eeee44'; ctx.fillRect(cx - 60, H * 0.42, 46, 3); noshadow(ctx);
  ctx.fillStyle = '#ffcc00'; ctx.beginPath(); ctx.moveTo(cx - 60, H * 0.40); ctx.lineTo(cx - 60, H * 0.44); ctx.lineTo(cx - 50, H * 0.42); ctx.closePath(); ctx.fill(); ol(ctx, 1, '#806600'); ctx.stroke();
  // legs
  ctx.fillStyle = '#5a4400'; ctx.fillRect(cx - 20, H * 0.64, 17, 26); ctx.fillRect(cx + 3, H * 0.64, 17, 26); ol(ctx, 2, '#3a2a00'); ctx.strokeRect(cx - 20, H * 0.64, 17, 26); ctx.strokeRect(cx + 3, H * 0.64, 17, 26);
  // BIG head
  const vrhg = ctx.createRadialGradient(cx - 8, H * 0.15, 2, cx, H * 0.22, 28); vrhg.addColorStop(0, '#ffe040'); vrhg.addColorStop(1, '#885a00');
  ctx.fillStyle = vrhg; ctx.beginPath(); ctx.arc(cx, H * 0.22, 28, 0, Math.PI * 2); ctx.fill(); ol(ctx, 2.5, '#4a3400'); ctx.stroke(); spec(ctx, cx - 10, H * 0.10, 10, 7, 0.34);
  // tactical visor
  ctx.fillStyle = '#001166'; ctx.fillRect(cx - 14, H * 0.205, 28, 8); ol(ctx, 1.5, '#000844'); ctx.strokeRect(cx - 14, H * 0.205, 28, 8);
  ctx.fillStyle = 'rgba(80,180,255,0.55)'; ctx.fillRect(cx - 12, H * 0.207, 12, 5);
  eye(ctx, cx - 6, H * 0.209, '#ffcc00', 4.5); eye(ctx, cx + 7, H * 0.209, '#ffcc00', 4.5);
  // electric crown sparks on head
  shadow(ctx, 10, '#ffee00'); [[cx - 10, H * 0.03], [cx, H * 0.0], [cx + 10, H * 0.03]].forEach(([x, y]) => { ctx.fillStyle = '#ffee44'; ctx.beginPath(); ctx.moveTo(x - 3, H * 0.09); ctx.lineTo(x, y); ctx.lineTo(x + 3, H * 0.09); ctx.fill(); }); noshadow(ctx);
  rglow(ctx, cx, H * 0.94, 44, '#000000');
}

function _toxin_toad(ctx, W, H) {
  const cx = W / 2;
  gbg3(ctx, '#041408', '#020b04', '#010401', W, H);
  rglow(ctx, cx, H * 0.55, 86, '#00aa22');
  // poison cloud base
  const pcg = ctx.createRadialGradient(cx, H * 0.82, 4, cx, H * 0.82, 66); pcg.addColorStop(0, 'rgba(0,200,50,0.42)'); pcg.addColorStop(0.5, 'rgba(0,150,30,0.22)'); pcg.addColorStop(1, 'rgba(0,100,20,0)');
  ctx.fillStyle = pcg; ctx.beginPath(); ctx.ellipse(cx, H * 0.82, 66, 30, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(cx, H * 0.93, 44, 11, 0, 0, Math.PI * 2); ctx.fill();
  // stubby legs
  ctx.fillStyle = '#0a7030'; ctx.beginPath(); ctx.ellipse(cx - 32, H * 0.74, 18, 14, 0.4, 0, Math.PI * 2); ctx.fill(); ol(ctx, 2, '#054018'); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(cx + 32, H * 0.74, 18, 14, -0.4, 0, Math.PI * 2); ctx.fill(); ol(ctx, 2, '#054018'); ctx.stroke();
  // fat round body
  const tbog = ctx.createRadialGradient(cx - 10, H * 0.48, 8, cx, H * 0.54, 48); tbog.addColorStop(0, '#22cc44'); tbog.addColorStop(1, '#0a6020');
  ctx.fillStyle = tbog; ctx.beginPath(); ctx.ellipse(cx, H * 0.54, 46, 46, 0, 0, Math.PI * 2); ctx.fill(); ol(ctx, 2.5, '#054018'); ctx.stroke();
  // pale belly
  ctx.fillStyle = 'rgba(180,255,160,0.28)'; ctx.beginPath(); ctx.ellipse(cx, H * 0.58, 26, 28, 0, 0, Math.PI * 2); ctx.fill();
  // toxic warts
  shadow(ctx, 10, '#44ff88'); ctx.fillStyle = '#1ab840';
  [[-30, H * 0.42], [30, H * 0.42], [-24, H * 0.62], [24, H * 0.62], [0, H * 0.36]].forEach(([dx, y]) => { ctx.beginPath(); ctx.arc(cx + dx, y, 9, 0, Math.PI * 2); ctx.fill(); ol(ctx, 1.5, '#0a8030'); ctx.stroke(); }); noshadow(ctx);
  // drool drips
  shadow(ctx, 6, '#00ff44'); ctx.fillStyle = 'rgba(0,200,50,0.6)';
  [[cx - 8, H * 0.70], [cx + 4, H * 0.73], [cx + 18, H * 0.68]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill(); }); noshadow(ctx);
  // BIG head (chibi toad head = wide ellipse, massive)
  const thbg = ctx.createRadialGradient(cx - 10, H * 0.25, 4, cx, H * 0.28, 32); thbg.addColorStop(0, '#44ee66'); thbg.addColorStop(1, '#0a8030');
  ctx.fillStyle = thbg; ctx.beginPath(); ctx.ellipse(cx, H * 0.28, 34, 28, 0, 0, Math.PI * 2); ctx.fill(); ol(ctx, 2.5, '#054018'); ctx.stroke(); spec(ctx, cx - 12, H * 0.14, 10, 6, 0.3);
  // huge bulgy googly eyes on top of head
  shadow(ctx, 10, '#aaff44');
  ctx.fillStyle = '#eeff00'; ctx.beginPath(); ctx.arc(cx - 16, H * 0.196, 12, 0, Math.PI * 2); ctx.fill(); ol(ctx, 2, '#668800'); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx + 16, H * 0.196, 12, 0, Math.PI * 2); ctx.fill(); ol(ctx, 2, '#668800'); ctx.stroke(); noshadow(ctx);
  ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(cx - 16, H * 0.196, 6, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(cx + 16, H * 0.196, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(cx - 19, H * 0.185, 2.5, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(cx + 13, H * 0.185, 2.5, 0, Math.PI * 2); ctx.fill();
  // wide mouth + lolling tongue
  ctx.fillStyle = '#055018'; ctx.beginPath(); ctx.arc(cx, H * 0.32, 24, 0.1, Math.PI - 0.1); ctx.fill(); ol(ctx, 2, '#033010'); ctx.stroke();
  shadow(ctx, 8, '#ff3300'); ctx.fillStyle = '#ff2244'; ctx.beginPath(); ctx.ellipse(cx + 12, H * 0.355, 14, 6, 0.35, 0, Math.PI * 2); ctx.fill(); noshadow(ctx);
  rglow(ctx, cx, H * 0.94, 48, '#000000');
}

function _neon_wraith(ctx, W, H) {
  const cx = W / 2;
  gbg3(ctx, '#020008', '#010005', '#000002', W, H);
  rglow(ctx, cx, H * 0.44, 90, '#00ffcc');
  // orbit wisps ring
  shadow(ctx, 12, '#00ffcc');
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2 + 0.3; const r = 62; ctx.fillStyle = `rgba(0,${160 + i * 10},${160 + i * 8},0.38)`; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r * 0.46, H * 0.48 + Math.sin(a) * r * 0.28, 6 - i * 0.3, 0, Math.PI * 2); ctx.fill(); } noshadow(ctx);
  // ghost body (translucent cyan, no outline — ghost)
  const nwg = ctx.createRadialGradient(cx - 8, H * 0.42, 8, cx, H * 0.48, 54); nwg.addColorStop(0, 'rgba(0,240,200,0.62)'); nwg.addColorStop(0.6, 'rgba(0,180,160,0.36)'); nwg.addColorStop(1, 'rgba(0,120,120,0)');
  ctx.fillStyle = nwg; ctx.beginPath(); ctx.ellipse(cx, H * 0.48, 46, 60, 0, 0, Math.PI * 2); ctx.fill();
  // wispy tail tendrils
  ctx.fillStyle = 'rgba(0,200,160,0.42)';
  [[-16, H * 0.78], [0, H * 0.84], [16, H * 0.80]].forEach(([dx, y]) => { ctx.beginPath(); ctx.ellipse(cx + dx, y, 9, 16, 0, 0, Math.PI * 2); ctx.fill(); });
  // neon edge outline
  shadow(ctx, 14, '#00ffcc'); ctx.strokeStyle = 'rgba(0,255,200,0.5)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(cx, H * 0.48, 46, 60, 0, 0, Math.PI * 2); ctx.stroke(); noshadow(ctx);
  // BIG translucent head
  const nwhg = ctx.createRadialGradient(cx - 8, H * 0.20, 4, cx, H * 0.24, 32); nwhg.addColorStop(0, 'rgba(200,255,240,0.82)'); nwhg.addColorStop(1, 'rgba(0,180,160,0.25)');
  ctx.fillStyle = nwhg; ctx.beginPath(); ctx.arc(cx, H * 0.24, 32, 0, Math.PI * 2); ctx.fill();
  shadow(ctx, 10, '#00ffcc'); ctx.strokeStyle = 'rgba(0,255,200,0.55)'; ctx.lineWidth = 2.5; ctx.stroke(); noshadow(ctx);
  // pupil-less glowing eyes (ghost — no iris)
  shadow(ctx, 22, '#00ffcc'); ctx.fillStyle = '#00ffcc';
  ctx.beginPath(); ctx.arc(cx - 10, H * 0.225, 8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 10, H * 0.225, 8, 0, Math.PI * 2); ctx.fill(); noshadow(ctx);
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(cx - 10, H * 0.222, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(cx + 10, H * 0.222, 3.5, 0, Math.PI * 2); ctx.fill();
  // eerie smile (simple arc)
  ctx.strokeStyle = 'rgba(0,200,160,0.7)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(cx, H * 0.262, 12, 0.2, Math.PI - 0.2); ctx.stroke();
  rglow(ctx, cx, H * 0.94, 46, '#000000');
}

function _forge_dwarf(ctx, W, H) {
  const cx = W / 2;
  gbg3(ctx, '#1a0c04', '#0e0602', '#060200', W, H);
  rglow(ctx, cx, H * 0.55, 82, '#ff8800');
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(cx, H * 0.93, 42, 11, 0, 0, Math.PI * 2); ctx.fill();
  // left arm + wrench
  ctx.fillStyle = '#7a3810'; ctx.fillRect(cx - 38, H * 0.32, 12, 40); ol(ctx, 1.5, '#4a2008'); ctx.strokeRect(cx - 38, H * 0.32, 12, 40);
  ctx.fillStyle = '#888'; ctx.fillRect(cx - 44, H * 0.32, 7, 40); ol(ctx, 1.5, '#555'); ctx.strokeRect(cx - 44, H * 0.32, 7, 40);
  ctx.fillRect(cx - 48, H * 0.32, 16, 7); ctx.fillRect(cx - 48, H * 0.39, 16, 6); ol(ctx, 1, '#555'); ctx.strokeRect(cx - 48, H * 0.32, 16, 7); ctx.strokeRect(cx - 48, H * 0.39, 16, 6);
  // mechanical cannon arm (right, massive)
  ctx.fillStyle = '#555'; ctx.fillRect(cx + 24, H * 0.30, 34, 20); ol(ctx, 2, '#333'); ctx.strokeRect(cx + 24, H * 0.30, 34, 20);
  // gears on cannon
  ctx.fillStyle = '#888'; ctx.beginPath(); ctx.arc(cx + 36, H * 0.36, 8, 0, Math.PI * 2); ctx.fill(); ol(ctx, 1.5, '#555'); ctx.stroke();
  ctx.fillStyle = '#aaa'; ctx.beginPath(); ctx.arc(cx + 36, H * 0.36, 4, 0, Math.PI * 2); ctx.fill();
  // cannon barrel + muzzle glow
  ctx.fillStyle = '#444'; ctx.fillRect(cx + 52, H * 0.32, 22, 16); ol(ctx, 2, '#222'); ctx.strokeRect(cx + 52, H * 0.32, 22, 16);
  shadow(ctx, 12, '#ff6600'); ctx.fillStyle = '#ff4400'; ctx.beginPath(); ctx.arc(cx + 74, H * 0.40, 14, 0, Math.PI * 2); ctx.fill(); noshadow(ctx); ol(ctx, 2, '#cc2200'); ctx.stroke();
  ctx.fillStyle = 'rgba(255,180,80,0.55)'; ctx.beginPath(); ctx.arc(cx + 70, H * 0.37, 7, 0, Math.PI * 2); ctx.fill();
  // stout body
  const fdb = ctx.createLinearGradient(cx - 26, 0, cx + 24, 0); fdb.addColorStop(0, '#7a3810'); fdb.addColorStop(0.5, '#a05020'); fdb.addColorStop(1, '#4a2008');
  ctx.fillStyle = fdb; ctx.fillRect(cx - 26, H * 0.32, 52, 70); ol(ctx, 2, '#3a1808'); ctx.strokeRect(cx - 26, H * 0.32, 52, 70);
  // leather apron
  ctx.fillStyle = '#5a3010'; ctx.fillRect(cx - 22, H * 0.46, 46, 38); ol(ctx, 1.5, '#3a2008'); ctx.strokeRect(cx - 22, H * 0.46, 46, 38);
  ctx.fillStyle = '#7a4018'; ctx.fillRect(cx - 22, H * 0.46, 46, 7);
  ctx.fillStyle = '#4a2010'; ctx.fillRect(cx - 22, H * 0.57, 46, 7); // tool belt
  shadow(ctx, 7, '#ff8800'); ctx.fillStyle = '#ff8800';
  [cx - 12, cx, cx + 12].forEach(x => { ctx.beginPath(); ctx.arc(x, H * 0.605, 5, 0, Math.PI * 2); ctx.fill(); }); noshadow(ctx); spec(ctx, cx - 8, H * 0.38, 12, 7, 0.26);
  // short stocky legs
  ctx.fillStyle = '#4a2010'; ctx.fillRect(cx - 22, H * 0.66, 18, 26); ctx.fillRect(cx + 4, H * 0.66, 18, 26); ol(ctx, 2, '#2a1008'); ctx.strokeRect(cx - 22, H * 0.66, 18, 26); ctx.strokeRect(cx + 4, H * 0.66, 18, 26);
  ctx.fillStyle = '#2a1008'; ctx.fillRect(cx - 22, H * 0.84, 18, 8); ctx.fillRect(cx + 4, H * 0.84, 18, 8);
  // BIG round dwarf head
  const fdh = ctx.createRadialGradient(cx - 10, H * 0.19, 2, cx, H * 0.24, 30); fdh.addColorStop(0, '#e08060'); fdh.addColorStop(1, '#8a4030');
  ctx.fillStyle = fdh; ctx.beginPath(); ctx.arc(cx, H * 0.24, 30, 0, Math.PI * 2); ctx.fill(); ol(ctx, 2.5, '#5a2818'); ctx.stroke(); spec(ctx, cx - 10, H * 0.11, 10, 7, 0.32);
  // thick braided beard
  const brd = ctx.createLinearGradient(cx, H * 0.30, cx, H * 0.44); brd.addColorStop(0, '#c87030'); brd.addColorStop(1, '#7a4010');
  ctx.fillStyle = brd; ctx.beginPath(); ctx.ellipse(cx, H * 0.36, 22, 14, 0, 0, Math.PI); ctx.fill(); ol(ctx, 2, '#5a2810'); ctx.stroke();
  // braid lines
  ctx.strokeStyle = '#8a4018'; ctx.lineWidth = 2; [cx - 8, cx, cx + 8].forEach(x => { ctx.beginPath(); ctx.moveTo(x, H * 0.35); ctx.lineTo(x, H * 0.44); ctx.stroke(); });
  // goggles band
  ctx.fillStyle = '#1a1a1a'; ctx.fillRect(cx - 20, H * 0.210, 40, 12); ol(ctx, 1.5, '#0a0a0a'); ctx.strokeRect(cx - 20, H * 0.210, 40, 12);
  shadow(ctx, 10, '#ff8800'); ctx.fillStyle = '#f39c12'; ctx.beginPath(); ctx.arc(cx - 8, H * 0.216, 8, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(cx + 8, H * 0.216, 8, 0, Math.PI * 2); ctx.fill(); noshadow(ctx); ol(ctx, 1.5, '#a06000'); ctx.stroke(); ctx.beginPath(); ctx.arc(cx - 8, H * 0.216, 8, 0, Math.PI * 2); ctx.fill(); ol(ctx, 1.5, '#a06000'); ctx.stroke();
  ctx.fillStyle = 'rgba(255,220,100,0.45)'; ctx.beginPath(); ctx.arc(cx - 11, H * 0.210, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(cx + 5, H * 0.210, 3.5, 0, Math.PI * 2); ctx.fill();
  rglow(ctx, cx, H * 0.94, 44, '#000000');
}

// ── Portrait texture generator ────────────────────────────────────────────────
const PORTRAIT_FNS = {
  titan_grunt: _titan_grunt, pyro_drake: _pyro_drake,
  lady_vex: _lady_vex, bone_shard: _bone_shard,
  iron_bro: _iron_bro, stone_golem: _stone_golem,
  thunder_chief: _thunder_chief, blaze_witch: _blaze_witch,
  wing_knight: _wing_knight, frostborn: _frostborn,
  jade_monk: _jade_monk, sea_crusher: _sea_crusher,
  crystal_sage: _crystal_sage, arrow_jack: _arrow_jack,
  shadow_rogue: _shadow_rogue, skywing: _skywing,
  volt_ranger: _volt_ranger, toxin_toad: _toxin_toad,
  neon_wraith: _neon_wraith, forge_dwarf: _forge_dwarf
};

export function generatePortraitTextures(scene) {
  for (const [key, fn] of Object.entries(PORTRAIT_FNS)) {
    _p(scene, key, fn);
  }
}

// ── Battle unit draw functions (84×84 canvas, origin at center) ──────────────
export const DRAW_FUNCS = {
  titan_grunt(g) {
    g.lineStyle(2,0x111111,0.9);
    g.fillStyle(0x444444); g.fillCircle(0,-40,17); g.strokeCircle(0,-40,17);
    g.fillStyle(0xFF4400,0.9); g.fillRect(-9,-41,18,5); g.strokeRect(-9,-41,18,5);
    g.fillStyle(0xC8C8C8); g.fillRect(-26,-32,52,16); g.strokeRect(-26,-32,52,16);
    g.fillStyle(0x6B3A12); g.fillRect(-22,-26,44,52); g.strokeRect(-22,-26,44,52);
    g.fillStyle(0x8A5020,0.45); g.fillRect(-22,-26,12,52);
    g.fillStyle(0xFFD700,0.8); g.fillRect(-22,10,44,5);
    g.fillStyle(0xC8A000); g.fillRect(-26,-14,7,30); g.strokeRect(-26,-14,7,30);
    g.fillStyle(0x888888); g.fillTriangle(-30,-16,-16,-16,-23,-32); g.strokeTriangle(-30,-16,-16,-16,-23,-32);
    g.fillStyle(0x444444); g.fillRect(14,-26,20,38); g.strokeRect(14,-26,20,38);
    g.fillStyle(0xFFD700); g.fillCircle(24,-8,6); g.strokeCircle(24,-8,6);
  },
  pyro_drake(g) {
    g.lineStyle(2,0x111111,0.9);
    g.fillStyle(0xCC2200); g.fillTriangle(-16,-22,-44,-44,-14,2); g.strokeTriangle(-16,-22,-44,-44,-14,2);
    g.fillTriangle(16,-22,44,-44,14,2); g.strokeTriangle(16,-22,44,-44,14,2);
    g.fillStyle(0xFF4500); g.fillEllipse(0,-8,32,48); g.strokeEllipse(0,-8,32,48);
    g.fillStyle(0xFF8C00); g.fillCircle(0,-36,14); g.strokeCircle(0,-36,14);
    g.fillStyle(0xFFCC00,0.9); g.fillEllipse(-14,-38,16,6);
    g.fillStyle(0xFFAA00); g.fillRect(-5,20,10,18); g.strokeRect(-5,20,10,18);
  },
  lady_vex(g) {
    g.lineStyle(2,0x111111,0.9);
    g.fillStyle(0x9B59B6); g.fillEllipse(0,-10,24,42); g.strokeEllipse(0,-10,24,42);
    g.fillStyle(0x8E44AD); g.fillTriangle(-14,-44,14,-44,0,-28); g.strokeTriangle(-14,-44,14,-44,0,-28);
    g.fillStyle(0xFAD7A0); g.fillRect(-22,-26,5,20); g.strokeRect(-22,-26,5,20);
    g.fillStyle(0xE91E8C); g.fillRect(-24,-36,5,5);
    g.fillStyle(0xFFD700); g.fillRect(15,-44,5,52); g.fillCircle(17,-46,9); g.strokeCircle(17,-46,9);
    g.fillStyle(0xE91E8C); g.fillCircle(17,-46,6);
    g.fillStyle(0xAA44FF,0.7); g.fillCircle(-32,-20,5); g.fillCircle(30,-30,4);
    g.fillStyle(0xFAD7A0); g.fillCircle(0,-36,12); g.strokeCircle(0,-36,12);
  },
  bone_shard(g) {
    g.lineStyle(2,0x111111,0.9);
    g.fillStyle(0x1A1A2E); g.fillEllipse(0,-8,30,48); g.strokeEllipse(0,-8,30,48);
    g.fillStyle(0x2C3E50); g.fillTriangle(-16,-30,16,-30,0,-52); g.strokeTriangle(-16,-30,16,-30,0,-52);
    g.fillStyle(0xF0E68C); g.fillCircle(0,-36,9); g.strokeCircle(0,-36,9);
    g.fillStyle(0x8E44AD,0.9); g.fillCircle(-22,-12,6); g.strokeCircle(-22,-12,6);
    g.fillCircle(22,-12,6); g.strokeCircle(22,-12,6);
    g.fillCircle(0,16,7); g.strokeCircle(0,16,7);
    g.fillStyle(0x6C3483); g.fillRect(-3,-24,6,52);
  },
  iron_bro(g) {
    g.lineStyle(2,0x111111,0.9);
    g.fillStyle(0xC0C0C0); g.fillRect(-22,-28,7,32); g.strokeRect(-22,-28,7,32);
    g.fillStyle(0xFFD700); g.fillRect(-26,-24,16,5); g.strokeRect(-26,-24,16,5);
    g.fillStyle(0x1F618D); g.fillRect(-16,-28,34,52); g.strokeRect(-16,-28,34,52);
    g.fillStyle(0x2266FF,0.35); g.fillRect(-16,-28,34,52);
    g.fillStyle(0x7F8C8D); g.fillRect(12,-32,20,38); g.strokeRect(12,-32,20,38);
    g.fillStyle(0xFFD700); g.fillCircle(22,-14,5); g.strokeCircle(22,-14,5);
    g.fillStyle(0x2E86C1); g.fillCircle(0,-38,14); g.strokeCircle(0,-38,14);
    g.fillStyle(0x85C1E9); g.fillRect(-7,-44,14,7); g.strokeRect(-7,-44,14,7);
  },
  stone_golem(g) {
    g.lineStyle(2,0x111111,0.9);
    g.fillStyle(0x3A4040); g.fillRect(-38,-24,13,36); g.strokeRect(-38,-24,13,36);
    g.fillRect(25,-24,13,36); g.strokeRect(25,-24,13,36);
    g.fillStyle(0x5A6465); g.fillRect(-24,-30,48,58); g.strokeRect(-24,-30,48,58);
    g.fillStyle(0xFF4400,0.7); g.fillRect(-18,-18,36,3); g.fillRect(-18,-6,36,3);
    g.fillStyle(0x5A6465); g.fillCircle(0,-40,20); g.strokeCircle(0,-40,20);
    g.fillStyle(0xFF8800); g.fillCircle(-7,-39,5); g.strokeCircle(-7,-39,5);
    g.fillCircle(7,-39,5); g.strokeCircle(7,-39,5);
    g.fillStyle(0xFFCC00); g.fillCircle(-7,-39,2); g.fillCircle(7,-39,2);
  },
  thunder_chief(g) {
    g.lineStyle(2,0x111111,0.9);
    g.fillStyle(0x7D6608); g.fillRect(-30,-32,11,34); g.strokeRect(-30,-32,11,34);
    g.fillTriangle(-32,-32,-18,-30,-30,-48); g.strokeTriangle(-32,-32,-18,-30,-30,-48);
    g.fillRect(19,-32,11,34); g.strokeRect(19,-32,11,34);
    g.fillTriangle(18,-32,32,-30,22,-48); g.strokeTriangle(18,-32,32,-30,22,-48);
    g.fillStyle(0xFFEE00,0.9); g.fillCircle(-24,2,5); g.fillCircle(24,2,5);
    g.fillStyle(0xA04000); g.fillRect(-15,-28,30,48); g.strokeRect(-15,-28,30,48);
    g.fillStyle(0xC0392B); g.fillRect(-15,-40,30,9); g.strokeRect(-15,-40,30,9);
    g.fillStyle(0xE67E22); g.fillCircle(0,-40,14); g.strokeCircle(0,-40,14);
  },
  blaze_witch(g) {
    g.lineStyle(2,0x111111,0.9);
    g.fillStyle(0xFF4500); g.fillCircle(-18,-4,7); g.strokeCircle(-18,-4,7);
    g.fillCircle(18,-4,7); g.strokeCircle(18,-4,7);
    g.fillStyle(0xFF8C00,0.8); g.fillCircle(0,20,9); g.fillCircle(0,26,6);
    g.fillStyle(0x1A1A1A); g.fillEllipse(0,-4,24,42); g.strokeEllipse(0,-4,24,42);
    g.fillStyle(0xFF6B00); g.fillTriangle(-14,-28,14,-28,0,-58); g.strokeTriangle(-14,-28,14,-28,0,-58);
    g.fillStyle(0xFAD7A0); g.fillCircle(0,-34,11); g.strokeCircle(0,-34,11);
    g.fillStyle(0xFF4400,0.9); g.fillCircle(-4,-34,3); g.fillCircle(4,-34,3);
  },
  wing_knight(g) {
    g.lineStyle(2,0x111111,0.9);
    g.fillStyle(0xF0F4F8); g.fillTriangle(-18,-22,-46,-46,-12,10); g.strokeTriangle(-18,-22,-46,-46,-12,10);
    g.fillTriangle(18,-22,46,-46,12,10); g.strokeTriangle(18,-22,46,-46,12,10);
    g.fillStyle(0xBDC3C7); g.fillRect(-16,-28,32,46); g.strokeRect(-16,-28,32,46);
    g.fillStyle(0xAABBFF,0.45); g.fillRect(-16,-28,32,46);
    g.fillStyle(0xFFD700); g.fillRect(-5,-34,10,46); g.strokeRect(-5,-34,10,46);
    g.fillStyle(0xECF0F1); g.fillCircle(0,-38,14); g.strokeCircle(0,-38,14);
    g.fillStyle(0x2C3E50); g.fillRect(-7,-44,14,7); g.strokeRect(-7,-44,14,7);
  },
  frostborn(g) {
    g.lineStyle(2,0x111111,0.9);
    g.fillStyle(0xADD8E6); g.fillCircle(-22,-12,8); g.strokeCircle(-22,-12,8);
    g.fillCircle(22,-12,8); g.strokeCircle(22,-12,8);
    g.fillStyle(0x1A5276); g.fillEllipse(0,-6,28,46); g.strokeEllipse(0,-6,28,46);
    g.fillStyle(0x85C1E9,0.6); g.fillRect(-3,-24,6,42); g.fillCircle(0,-26,10); g.strokeCircle(0,-26,10);
    g.fillStyle(0xD6EAF8); g.fillCircle(0,-38,13); g.strokeCircle(0,-38,13);
    g.fillStyle(0x2E86C1); g.fillTriangle(-13,-46,-7,-52,0,-46); g.strokeTriangle(-13,-46,-7,-52,0,-46);
    g.fillTriangle(0,-46,7,-52,13,-46); g.strokeTriangle(0,-46,7,-52,13,-46);
  },
  jade_monk(g) {
    g.lineStyle(2,0x111111,0.9);
    g.fillStyle(0x8B4513); g.fillRect(-22,-44,5,58); g.strokeRect(-22,-44,5,58);
    g.fillStyle(0x2ECC71); g.fillCircle(-19,-46,7); g.strokeCircle(-19,-46,7);
    g.fillStyle(0x1E8449); g.fillEllipse(0,-6,26,46); g.strokeEllipse(0,-6,26,46);
    g.fillStyle(0x239B56); g.fillRect(-13,-22,26,9); g.strokeRect(-13,-22,26,9);
    g.fillStyle(0x2ECC71); g.fillCircle(12,-10,6); g.strokeCircle(12,-10,6);
    g.fillStyle(0x00FF88,0.6); g.fillCircle(22,-26,4); g.fillCircle(26,-14,3);
    g.fillStyle(0xFAD7A0); g.fillCircle(0,-38,12); g.strokeCircle(0,-38,12);
  },
  sea_crusher(g) {
    g.lineStyle(2,0x111111,0.9);
    g.fillStyle(0x0B5345); g.fillRect(-24,-26,12,50); g.strokeRect(-24,-26,12,50);
    g.fillStyle(0x0E6655); g.fillRect(-14,-28,34,54); g.strokeRect(-14,-28,34,54);
    g.fillStyle(0x0B5345); g.fillRect(18,-24,22,16); g.strokeRect(18,-24,22,16);
    g.fillStyle(0x16A085); g.fillCircle(40,-16,8); g.strokeCircle(40,-16,8);
    g.fillStyle(0x1ABC9C); g.fillCircle(40,-16,5);
    g.fillStyle(0x85C1E9,0.9); g.fillCircle(44,-18,3); g.fillCircle(48,-14,2);
    g.fillStyle(0x16A085); g.fillCircle(0,-38,15); g.strokeCircle(0,-38,15);
    g.fillStyle(0x1ABC9C); g.fillRect(-7,-42,14,9); g.strokeRect(-7,-42,14,9);
  },
  crystal_sage(g) {
    g.lineStyle(2,0x111111,0.9);
    g.fillStyle(0xFD79A8); g.fillTriangle(-26,-22,-20,-34,-14,-22); g.strokeTriangle(-26,-22,-20,-34,-14,-22);
    g.fillTriangle(14,-20,20,-30,26,-20); g.strokeTriangle(14,-20,20,-30,26,-20);
    g.fillStyle(0xA29BFE); g.fillTriangle(-12,-44,-4,-58,2,-44); g.strokeTriangle(-12,-44,-4,-58,2,-44);
    g.fillTriangle(2,-44,9,-56,16,-44); g.strokeTriangle(2,-44,9,-56,16,-44);
    g.fillStyle(0x6C3483); g.fillEllipse(0,-6,26,44); g.strokeEllipse(0,-6,26,44);
    g.fillStyle(0xCC44FF,0.4); g.fillRect(-16,-22,32,42);
    g.fillStyle(0xD7BDE2); g.fillCircle(0,-36,12); g.strokeCircle(0,-36,12);
  },
  arrow_jack(g) {
    g.lineStyle(2,0x111111,0.9);
    g.fillStyle(0x8B4513); g.fillRect(-24,-28,5,34); g.strokeRect(-24,-28,5,34);
    g.fillCircle(-22,-28,6); g.strokeCircle(-22,-28,6);
    g.fillCircle(-22,6,6); g.strokeCircle(-22,6,6);
    g.fillStyle(0xC0C0C0); g.fillRect(-22,-14,22,3); g.strokeRect(-22,-14,22,3);
    g.fillStyle(0x8B0000); g.fillTriangle(-22,-18,-22,-10,-14,-12);
    g.fillStyle(0x4A7C24); g.fillRect(-12,-28,22,46); g.strokeRect(-12,-28,22,46);
    g.fillStyle(0x2A5814); g.fillTriangle(-12,-38,12,-36,0,-52); g.strokeTriangle(-12,-38,12,-36,0,-52);
    g.fillStyle(0xFAD7A0); g.fillCircle(0,-38,12); g.strokeCircle(0,-38,12);
  },
  shadow_rogue(g) {
    g.lineStyle(2,0x111111,0.9);
    g.fillStyle(0xBDC3C7); g.fillRect(-24,-30,5,26); g.strokeRect(-24,-30,5,26);
    g.fillTriangle(-24,-30,-20,-30,-22,-38); g.strokeTriangle(-24,-30,-20,-30,-22,-38);
    g.fillRect(19,-30,5,26); g.strokeRect(19,-30,5,26);
    g.fillTriangle(19,-30,23,-30,21,-38); g.strokeTriangle(19,-30,23,-30,21,-38);
    g.fillStyle(0x1C1C1C); g.fillRect(-12,-28,24,44); g.strokeRect(-12,-28,24,44);
    g.fillStyle(0x440044,0.55); g.fillRect(-12,-28,24,44);
    g.fillStyle(0x2D2D2D); g.fillCircle(0,-38,11); g.strokeCircle(0,-38,11);
    g.fillStyle(0xFF0000,0.95); g.fillCircle(-3,-36,3); g.fillCircle(3,-36,3);
  },
  skywing(g) {
    g.lineStyle(2,0x111111,0.9);
    g.fillStyle(0x0652DD); g.fillTriangle(-14,-18,-42,-38,-10,8); g.strokeTriangle(-14,-18,-42,-38,-10,8);
    g.fillTriangle(14,-18,42,-38,10,8); g.strokeTriangle(14,-18,42,-38,10,8);
    g.fillStyle(0x0652DD); g.fillRect(-12,-24,24,40); g.strokeRect(-12,-24,24,40);
    g.fillStyle(0x2D3436); g.fillCircle(-7,14,6); g.strokeCircle(-7,14,6);
    g.fillCircle(7,14,6); g.strokeCircle(7,14,6);
    g.fillStyle(0xFF4400,0.9); g.fillCircle(-7,14,3); g.fillCircle(7,14,3);
    g.fillStyle(0x74B9FF); g.fillCircle(0,-34,12); g.strokeCircle(0,-34,12);
    g.fillStyle(0x001166); g.fillRect(-7,-38,14,8); g.strokeRect(-7,-38,14,8);
  },
  volt_ranger(g) {
    g.lineStyle(2,0x111111,0.9);
    g.fillStyle(0xD4AC0D); g.fillRect(-24,-24,5,28); g.strokeRect(-24,-24,5,28);
    g.fillCircle(-22,-24,5); g.strokeCircle(-22,-24,5);
    g.fillCircle(-22,4,5); g.strokeCircle(-22,4,5);
    g.fillStyle(0xFFEE00,0.95); g.fillRect(-22,-12,22,3); g.strokeRect(-22,-12,22,3);
    g.fillStyle(0xFFEE00); g.fillCircle(12,-8,4); g.fillCircle(16,-14,3);
    g.fillStyle(0xD4AC0D); g.fillRect(-12,-28,24,44); g.strokeRect(-12,-28,24,44);
    g.fillStyle(0x0652DD); g.fillRect(-6,-38,12,9); g.strokeRect(-6,-38,12,9);
    g.fillStyle(0xF9CA24); g.fillCircle(0,-38,12); g.strokeCircle(0,-38,12);
  },
  toxin_toad(g) {
    g.lineStyle(2,0x111111,0.9);
    g.fillStyle(0x00AA22,0.55); g.fillEllipse(0,10,48,22);
    g.fillStyle(0x1D8A5E); g.fillEllipse(0,-2,40,44); g.strokeEllipse(0,-2,40,44);
    g.fillStyle(0x27AE60); g.fillCircle(0,-24,18); g.strokeCircle(0,-24,18);
    g.fillStyle(0xFFFF00); g.fillCircle(-9,-28,7); g.strokeCircle(-9,-28,7);
    g.fillCircle(9,-28,7); g.strokeCircle(9,-28,7);
    g.fillStyle(0x000000); g.fillCircle(-9,-28,3); g.fillCircle(9,-28,3);
    g.fillStyle(0x55EFC4); g.fillCircle(-5,24,4); g.fillCircle(5,24,4);
  },
  neon_wraith(g) {
    g.lineStyle(2,0x00FFCC,0.6);
    g.fillStyle(0x00CEC9,0.65); g.fillEllipse(0,-8,32,52); g.strokeEllipse(0,-8,32,52);
    g.fillStyle(0x00CEC9,0.45); g.fillEllipse(-9,20,12,20); g.fillEllipse(9,22,12,16);
    g.fillStyle(0xDFE6E9,0.55); g.fillCircle(0,-32,15); g.strokeCircle(0,-32,15);
    g.fillStyle(0x00FFCC,0.95); g.fillCircle(-7,-34,6); g.strokeCircle(-7,-34,6);
    g.fillCircle(7,-34,6); g.strokeCircle(7,-34,6);
    g.fillStyle(0xFFFFFF); g.fillCircle(-7,-34,2.5); g.fillCircle(7,-34,2.5);
    g.fillStyle(0x00FFFF,0.7); g.fillCircle(-18,-10,4); g.fillCircle(18,-8,4);
  },
  forge_dwarf(g) {
    g.lineStyle(2,0x111111,0.9);
    g.fillStyle(0x7F8C8D); g.fillRect(-28,-18,7,28); g.strokeRect(-28,-18,7,28);
    g.fillRect(-32,-18,16,7); g.strokeRect(-32,-18,16,7);
    g.fillRect(-32,-10,16,7); g.strokeRect(-32,-10,16,7);
    g.fillStyle(0xA0522D); g.fillRect(-17,-20,34,40); g.strokeRect(-17,-20,34,40);
    g.fillStyle(0x7F8C8D); g.fillRect(16,-16,16,12); g.strokeRect(16,-16,16,12);
    g.fillStyle(0xFF8800,0.9); g.fillCircle(28,-8,9); g.strokeCircle(28,-8,9);
    g.fillStyle(0xFFCC44); g.fillCircle(28,-8,5);
    g.fillStyle(0xE17055); g.fillCircle(0,-30,15); g.strokeCircle(0,-30,15);
    g.fillStyle(0x2C3E50); g.fillRect(-11,-34,22,9); g.strokeRect(-11,-34,22,9);
    g.fillStyle(0xF39C12); g.fillCircle(-6,-31,6); g.strokeCircle(-6,-31,6);
    g.fillCircle(6,-31,6); g.strokeCircle(6,-31,6);
  },
  _skeleton(g) {
    g.fillStyle(0xF0E68C); g.fillCircle(0,-26,7);
    g.fillStyle(0xF0E68C); g.fillRect(-5,-20,10,20); g.fillRect(-3,0,6,14);
    g.fillRect(-8,-16,6,3); g.fillRect(2,-16,6,3);
    g.fillStyle(0x1A1A1A); g.fillRect(-3,-28,2,3); g.fillRect(1,-28,2,3);
  }
};

// Add ground shadow + light sheen to all public DRAW_FUNCS
for (const key of Object.keys(DRAW_FUNCS)) {
  if (key.startsWith('_')) continue;
  const orig = DRAW_FUNCS[key];
  DRAW_FUNCS[key] = (g) => {
    g.fillStyle(0x000000, 0.28); g.fillEllipse(4, 28, 48, 10);
    orig(g);
    g.fillStyle(0xFFFFFF, 0.06); g.fillRect(-20, -44, 14, 62);
  };
}

export function generateAllTextures(scene) {
  generatePortraitTextures(scene);
  for (const [key, fn] of Object.entries(DRAW_FUNCS)) {
    if (key.startsWith('_')) continue;
    if (scene.textures.exists(key)) continue;
    const g = scene.make.graphics({ add: false });
    fn(g);
    g.generateTexture(key, 84, 84);
    g.destroy();
  }
}
