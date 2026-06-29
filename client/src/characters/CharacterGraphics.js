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

// ── Portrait draw functions ───────────────────────────────────────────────────
function _titan_grunt(ctx, W, H) {
  gbg(ctx, '#0d1f3c', '#020408', W, H);
  rglow(ctx, W/2, H*0.55, 85, '#c8960a');
  // pauldrons
  const pg = ctx.createLinearGradient(0, H*0.22, 0, H*0.40);
  pg.addColorStop(0,'#d0d0d0'); pg.addColorStop(1,'#444');
  ctx.fillStyle = pg; ctx.fillRect(W/2-54,H*0.22,108,22);
  ctx.fillRect(W/2-48,H*0.20,96,10);
  ctx.fillStyle='#c8960a'; ctx.fillRect(W/2-54,H*0.22,108,3);
  // body
  const bg2 = ctx.createLinearGradient(W/2-36,0,W/2+36,0);
  bg2.addColorStop(0,'#7a4a20'); bg2.addColorStop(0.4,'#a06030'); bg2.addColorStop(1,'#3a2010');
  ctx.fillStyle=bg2; ctx.fillRect(W/2-36,H*0.30,72,90);
  ctx.fillStyle='#c8960a'; ctx.fillRect(W/2-36,H*0.56,72,4);
  // helmet
  const hg = ctx.createRadialGradient(W/2-8,H*0.14,2,W/2,H*0.21,26);
  hg.addColorStop(0,'#cccccc'); hg.addColorStop(1,'#303030');
  ctx.fillStyle=hg; ctx.beginPath(); ctx.arc(W/2,H*0.21,26,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#c8960a'; ctx.fillRect(W/2-3,H*0.04,6,14);
  // visor glow
  shadow(ctx,18,'#ff2200');
  ctx.fillStyle='#ff4400'; ctx.fillRect(W/2-18,H*0.208,36,6);
  noshadow(ctx);
  ctx.fillStyle='rgba(255,180,180,0.35)'; ctx.fillRect(W/2-16,H*0.208,13,3);
  // axe
  ctx.fillStyle='#7b6040'; ctx.fillRect(W/2-52,H*0.30,7,85);
  const ag=ctx.createLinearGradient(W/2-62,0,W/2-36,0);
  ag.addColorStop(0,'#e0e0e0'); ag.addColorStop(1,'#888');
  ctx.fillStyle=ag;
  ctx.beginPath(); ctx.moveTo(W/2-62,H*0.30); ctx.lineTo(W/2-36,H*0.30); ctx.lineTo(W/2-44,H*0.16); ctx.closePath(); ctx.fill();
  // shield
  const sg=ctx.createLinearGradient(W/2+32,0,W/2+60,0);
  sg.addColorStop(0,'#777'); sg.addColorStop(1,'#252525');
  ctx.fillStyle=sg; ctx.fillRect(W/2+32,H*0.24,28,70);
  shadow(ctx,8,'#c8960a'); ctx.fillStyle='#c8960a'; ctx.beginPath(); ctx.arc(W/2+46,H*0.44,9,0,Math.PI*2); ctx.fill();
  noshadow(ctx);
  // legs
  ctx.fillStyle='#3a2010'; ctx.fillRect(W/2-28,H*0.62,22,30); ctx.fillRect(W/2+6,H*0.62,22,30);
  ctx.fillStyle='#111'; ctx.fillRect(W/2-28,H*0.84,22,8); ctx.fillRect(W/2+6,H*0.84,22,8);
  rglow(ctx,W/2,H*0.94,48,'#000000');
}

function _pyro_drake(ctx, W, H) {
  gbg(ctx, '#2d0800', '#080000', W, H);
  rglow(ctx, W/2, H*0.5, 90, '#ff4400');
  // left wing
  ctx.fillStyle='rgba(180,30,0,0.85)';
  ctx.beginPath(); ctx.moveTo(W/2-12,H*0.35); ctx.lineTo(W/2-75,H*0.12); ctx.lineTo(W/2-60,H*0.55); ctx.closePath(); ctx.fill();
  ctx.fillStyle='rgba(255,80,0,0.4)';
  ctx.beginPath(); ctx.moveTo(W/2-14,H*0.40); ctx.lineTo(W/2-58,H*0.18); ctx.lineTo(W/2-48,H*0.52); ctx.closePath(); ctx.fill();
  // right wing
  ctx.fillStyle='rgba(180,30,0,0.85)';
  ctx.beginPath(); ctx.moveTo(W/2+12,H*0.35); ctx.lineTo(W/2+75,H*0.12); ctx.lineTo(W/2+60,H*0.55); ctx.closePath(); ctx.fill();
  ctx.fillStyle='rgba(255,80,0,0.4)';
  ctx.beginPath(); ctx.moveTo(W/2+14,H*0.40); ctx.lineTo(W/2+58,H*0.18); ctx.lineTo(W/2+48,H*0.52); ctx.closePath(); ctx.fill();
  // body
  const drg=ctx.createRadialGradient(W/2-5,H*0.52,5,W/2,H*0.52,42);
  drg.addColorStop(0,'#ff6600'); drg.addColorStop(1,'#aa1500');
  ctx.fillStyle=drg; ctx.beginPath(); ctx.ellipse(W/2,H*0.52,34,52,0,0,Math.PI*2); ctx.fill();
  // neck+head
  ctx.fillStyle='#cc2200';
  ctx.beginPath(); ctx.ellipse(W/2,H*0.28,22,28,0,0,Math.PI*2); ctx.fill();
  const hdrg=ctx.createRadialGradient(W/2-6,H*0.17,2,W/2,H*0.19,20);
  hdrg.addColorStop(0,'#ff7700'); hdrg.addColorStop(1,'#881000');
  ctx.fillStyle=hdrg; ctx.beginPath(); ctx.ellipse(W/2,H*0.18,22,20,0,0,Math.PI*2); ctx.fill();
  // horns
  ctx.fillStyle='#880000';
  ctx.beginPath(); ctx.moveTo(W/2-10,H*0.09); ctx.lineTo(W/2-22,H*0.01); ctx.lineTo(W/2-4,H*0.10); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(W/2+10,H*0.09); ctx.lineTo(W/2+22,H*0.01); ctx.lineTo(W/2+4,H*0.10); ctx.closePath(); ctx.fill();
  // eyes
  shadow(ctx,12,'#ffcc00'); ctx.fillStyle='#ffcc00'; ctx.beginPath(); ctx.ellipse(W/2-8,H*0.17,5,4,0,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(W/2+8,H*0.17,5,4,0,0,Math.PI*2); ctx.fill(); noshadow(ctx);
  // fire breath
  const fg=ctx.createLinearGradient(W/2-30,H*0.22,W/2+30,H*0.22);
  fg.addColorStop(0,'rgba(255,200,0,0.9)'); fg.addColorStop(0.5,'rgba(255,80,0,0.7)'); fg.addColorStop(1,'rgba(255,0,0,0)');
  ctx.fillStyle=fg; ctx.beginPath(); ctx.ellipse(W/2,H*0.11,28,8,-0.2,0,Math.PI*2); ctx.fill();
  // scales texture
  ctx.fillStyle='rgba(180,40,0,0.4)';
  for(let i=0;i<8;i++) { ctx.beginPath(); ctx.arc(W/2+(i%3-1)*18, H*0.42+Math.floor(i/3)*16, 6, 0, Math.PI*2); ctx.fill(); }
  rglow(ctx,W/2,H*0.94,44,'#000000');
}

function _lady_vex(ctx, W, H) {
  gbg(ctx, '#1a0030', '#050008', W, H);
  rglow(ctx, W/2, H*0.5, 88, '#9b00ff');
  // chaos energy swirls
  for(let i=0;i<6;i++) {
    const a=i/6*Math.PI*2; const r=50+i*4;
    rglow(ctx, W/2+Math.cos(a)*r*0.4, H*0.45+Math.sin(a)*r*0.22, 18, i%2?'#ff00aa':'#6600ff', 0.3);
  }
  // robe
  const rg=ctx.createLinearGradient(W/2-28,0,W/2+28,0);
  rg.addColorStop(0,'#4a0080'); rg.addColorStop(0.5,'#6600aa'); rg.addColorStop(1,'#2a0050');
  ctx.fillStyle=rg; ctx.beginPath(); ctx.moveTo(W/2-28,H*0.36); ctx.lineTo(W/2+28,H*0.36); ctx.lineTo(W/2+36,H*0.88); ctx.lineTo(W/2-36,H*0.88); ctx.closePath(); ctx.fill();
  // robe detail
  ctx.fillStyle='rgba(180,0,255,0.25)';
  ctx.beginPath(); ctx.moveTo(W/2,H*0.36); ctx.lineTo(W/2+4,H*0.88); ctx.lineTo(W/2-4,H*0.88); ctx.closePath(); ctx.fill();
  // arms
  ctx.fillStyle='#5a0090'; ctx.fillRect(W/2-36,H*0.36,10,38); ctx.fillRect(W/2+26,H*0.36,10,38);
  // magic orb (left hand)
  shadow(ctx,20,'#ff00aa'); ctx.fillStyle='#ff44cc'; ctx.beginPath(); ctx.arc(W/2-36,H*0.58,10,0,Math.PI*2); ctx.fill(); noshadow(ctx);
  ctx.fillStyle='rgba(255,180,255,0.5)'; ctx.beginPath(); ctx.arc(W/2-39,H*0.555,5,0,Math.PI*2); ctx.fill();
  // staff (right)
  ctx.fillStyle='#c8a000'; ctx.fillRect(W/2+30,H*0.08,5,68);
  shadow(ctx,22,'#aa00ff'); ctx.fillStyle='#cc44ff'; ctx.beginPath(); ctx.arc(W/2+32,H*0.08,14,0,Math.PI*2); ctx.fill(); noshadow(ctx);
  ctx.fillStyle='rgba(255,200,255,0.6)'; ctx.beginPath(); ctx.arc(W/2+27,H*0.055,7,0,Math.PI*2); ctx.fill();
  // face
  const fg=ctx.createRadialGradient(W/2-4,H*0.26,2,W/2,H*0.28,16);
  fg.addColorStop(0,'#f5d0c0'); fg.addColorStop(1,'#c8907a');
  ctx.fillStyle=fg; ctx.beginPath(); ctx.arc(W/2,H*0.28,16,0,Math.PI*2); ctx.fill();
  // hair
  ctx.fillStyle='#220040';
  ctx.beginPath(); ctx.moveTo(W/2-18,H*0.25); ctx.lineTo(W/2-14,H*0.10); ctx.lineTo(W/2+14,H*0.10); ctx.lineTo(W/2+18,H*0.25); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#3a0060'; ctx.beginPath(); ctx.arc(W/2,H*0.15,14,0,Math.PI,true); ctx.fill();
  // eyes
  shadow(ctx,8,'#ff00aa'); ctx.fillStyle='#ff44cc'; ctx.fillRect(W/2-10,H*0.265,6,4); ctx.fillRect(W/2+4,H*0.265,6,4); noshadow(ctx);
  // star sparkles
  shadow(ctx,10,'#ffffff'); ctx.fillStyle='#ffffff';
  [[W/2-48,H*0.28],[W/2+46,H*0.35],[W/2-40,H*0.60],[W/2+50,H*0.60]].forEach(([x,y])=>{ ctx.beginPath(); ctx.arc(x,y,2.5,0,Math.PI*2); ctx.fill(); });
  noshadow(ctx);
  rglow(ctx,W/2,H*0.94,44,'#000000');
}

function _bone_shard(ctx, W, H) {
  gbg(ctx, '#0a0018', '#000005', W, H);
  rglow(ctx, W/2, H*0.5, 80, '#6600aa');
  // robe
  ctx.fillStyle='#0d0d20'; ctx.beginPath(); ctx.moveTo(W/2-24,H*0.34); ctx.lineTo(W/2+24,H*0.34); ctx.lineTo(W/2+32,H*0.88); ctx.lineTo(W/2-32,H*0.88); ctx.closePath(); ctx.fill();
  // hood
  ctx.fillStyle='#111126';
  ctx.beginPath(); ctx.moveTo(W/2-20,H*0.32); ctx.lineTo(W/2+20,H*0.32); ctx.lineTo(W/2+14,H*0.14); ctx.lineTo(W/2-14,H*0.14); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.arc(W/2,H*0.24,18,Math.PI,0); ctx.closePath(); ctx.fill();
  // skull face
  ctx.fillStyle='#e8e0b0'; ctx.beginPath(); ctx.ellipse(W/2,H*0.26,12,14,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#0a0018'; ctx.fillRect(W/2-7,H*0.22,5,7); ctx.fillRect(W/2+2,H*0.22,5,7);
  ctx.fillStyle='#220044'; ctx.beginPath(); ctx.arc(W/2,H*0.31,5,0,Math.PI); ctx.fill();
  // soul orbs
  shadow(ctx,16,'#8800ff');
  [[W/2-32,H*0.46],[W/2+32,H*0.46],[W/2,H*0.66]].forEach(([x,y])=>{
    ctx.fillStyle='#aa44ff'; ctx.beginPath(); ctx.arc(x,y,9,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(200,150,255,0.5)'; ctx.beginPath(); ctx.arc(x-2,y-2,4,0,Math.PI*2); ctx.fill();
  });
  noshadow(ctx);
  // staff
  ctx.fillStyle='#4a0088'; ctx.fillRect(W/2+14,H*0.10,5,72);
  shadow(ctx,14,'#8800ff'); ctx.fillStyle='#cc00ff'; ctx.beginPath(); ctx.arc(W/2+16,H*0.10,10,0,Math.PI*2); ctx.fill(); noshadow(ctx);
  // skeleton minion (small, bottom-left)
  ctx.fillStyle='rgba(220,210,160,0.7)';
  ctx.beginPath(); ctx.arc(W/2-42,H*0.78,7,0,Math.PI*2); ctx.fill(); // skull
  ctx.fillRect(W/2-46,H*0.82,8,16); ctx.fillRect(W/2-49,H*0.84,14,3);
  rglow(ctx,W/2,H*0.94,42,'#000000');
}

function _iron_bro(ctx, W, H) {
  gbg(ctx, '#0a1a2e', '#020408', W, H);
  rglow(ctx, W/2, H*0.50, 82, '#2266ff');
  // large tower shield (right side)
  const shg=ctx.createLinearGradient(W/2+20,0,W/2+64,0);
  shg.addColorStop(0,'#8899bb'); shg.addColorStop(1,'#223355');
  ctx.fillStyle=shg; ctx.fillRect(W/2+22,H*0.22,42,72);
  shadow(ctx,10,'#4488ff'); ctx.fillStyle='#2266cc'; ctx.beginPath(); ctx.arc(W/2+43,H*0.44,10,0,Math.PI*2); ctx.fill(); noshadow(ctx);
  ctx.fillStyle='rgba(200,220,255,0.35)'; ctx.fillRect(W/2+24,H*0.23,8,68);
  // body armor
  const bg3=ctx.createLinearGradient(W/2-32,0,W/2+22,0);
  bg3.addColorStop(0,'#3366aa'); bg3.addColorStop(0.4,'#4488cc'); bg3.addColorStop(1,'#1a3366');
  ctx.fillStyle=bg3; ctx.fillRect(W/2-32,H*0.30,54,88);
  // armor plates
  ctx.fillStyle='rgba(100,160,255,0.2)';
  ctx.fillRect(W/2-30,H*0.38,50,14); ctx.fillRect(W/2-30,H*0.54,50,14);
  // helmet
  const hmg=ctx.createRadialGradient(W/2-8,H*0.15,2,W/2-4,H*0.22,24);
  hmg.addColorStop(0,'#aabbdd'); hmg.addColorStop(1,'#223355');
  ctx.fillStyle=hmg; ctx.beginPath(); ctx.arc(W/2-4,H*0.22,24,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#4488ff'; ctx.fillRect(W/2-14,H*0.218,20,6);
  ctx.fillStyle='rgba(180,220,255,0.4)'; ctx.fillRect(W/2-12,H*0.218,8,3);
  // sword
  ctx.fillStyle='#c8c8d8'; ctx.fillRect(W/2-38,H*0.28,6,54);
  ctx.fillStyle='#c8a000'; ctx.fillRect(W/2-46,H*0.33,22,5);
  ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.fillRect(W/2-38,H*0.28,2,54);
  // legs
  ctx.fillStyle='#1a3366'; ctx.fillRect(W/2-26,H*0.62,22,30); ctx.fillRect(W/2-2,H*0.62,22,30);
  ctx.fillStyle='#0a1a2e'; ctx.fillRect(W/2-26,H*0.84,22,8); ctx.fillRect(W/2-2,H*0.84,22,8);
  shadow(ctx,18,'#2266ff'); ctx.fillStyle='rgba(30,100,255,0.15)'; ctx.fillRect(W/2-32,H*0.22,54,100); noshadow(ctx);
  rglow(ctx,W/2,H*0.94,44,'#000000');
}

function _stone_golem(ctx, W, H) {
  gbg(ctx, '#151515', '#060606', W, H);
  rglow(ctx, W/2, H*0.50, 90, '#ff6600');
  // massive arms
  ctx.fillStyle='#4a5555';
  ctx.fillRect(W/2-66,H*0.30,28,60); ctx.fillRect(W/2+38,H*0.30,28,60);
  ctx.fillStyle='rgba(130,160,160,0.35)'; ctx.fillRect(W/2-66,H*0.30,8,60); ctx.fillRect(W/2+38,H*0.30,8,60);
  // lava cracks in arms
  shadow(ctx,8,'#ff6600'); ctx.fillStyle='#ff4400';
  ctx.fillRect(W/2-60,H*0.40,16,2); ctx.fillRect(W/2-58,H*0.50,12,2);
  ctx.fillRect(W/2+44,H*0.42,12,2); ctx.fillRect(W/2+42,H*0.52,14,2);
  noshadow(ctx);
  // body
  const stg=ctx.createLinearGradient(W/2-36,0,W/2+36,0);
  stg.addColorStop(0,'#6a7575'); stg.addColorStop(0.3,'#8a9898'); stg.addColorStop(1,'#3a4040');
  ctx.fillStyle=stg; ctx.fillRect(W/2-36,H*0.28,72,72);
  // body cracks with lava glow
  shadow(ctx,12,'#ff5500'); ctx.fillStyle='#ff3300';
  ctx.fillRect(W/2-28,H*0.38,56,3); ctx.fillRect(W/2-28,H*0.50,56,3);
  ctx.fillRect(W/2-8,H*0.30,3,28); ctx.fillRect(W/2+5,H*0.42,3,22);
  noshadow(ctx);
  ctx.fillStyle='rgba(150,180,180,0.3)'; ctx.fillRect(W/2-36,H*0.28,12,72);
  // head
  const hstg=ctx.createRadialGradient(W/2-6,H*0.17,2,W/2,H*0.22,30);
  hstg.addColorStop(0,'#909a9a'); hstg.addColorStop(1,'#303838');
  ctx.fillStyle=hstg; ctx.beginPath(); ctx.arc(W/2,H*0.22,30,0,Math.PI*2); ctx.fill();
  // glowing eyes
  shadow(ctx,20,'#ff8800'); ctx.fillStyle='#ff6600';
  ctx.fillRect(W/2-16,H*0.188,13,10); ctx.fillRect(W/2+3,H*0.188,13,10);
  ctx.fillStyle='#ffcc00'; ctx.beginPath(); ctx.arc(W/2-10,H*0.21,4,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(W/2+10,H*0.21,4,0,Math.PI*2); ctx.fill(); noshadow(ctx);
  // moss patches
  ctx.fillStyle='rgba(40,100,50,0.5)';
  ctx.beginPath(); ctx.arc(W/2+18,H*0.34,8,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(W/2-20,H*0.46,6,0,Math.PI*2); ctx.fill();
  // legs
  ctx.fillStyle='#4a5555'; ctx.fillRect(W/2-28,H*0.62,24,30); ctx.fillRect(W/2+4,H*0.62,24,30);
  rglow(ctx,W/2,H*0.94,50,'#000000');
}

function _thunder_chief(ctx, W, H) {
  gbg(ctx, '#1a0a00', '#060200', W, H);
  rglow(ctx, W/2, H*0.50, 85, '#ffaa00');
  // lightning aura
  for(let i=0;i<5;i++) {
    const a=i/5*Math.PI*2;
    shadow(ctx,10,'#ffee00'); ctx.fillStyle='rgba(255,220,0,0.25)';
    ctx.beginPath(); ctx.arc(W/2+Math.cos(a)*55,H*0.48+Math.sin(a)*28,6,0,Math.PI*2); ctx.fill();
  }
  noshadow(ctx);
  // left axe
  ctx.fillStyle='#8b6030'; ctx.fillRect(W/2-50,H*0.24,8,70);
  const lag=ctx.createLinearGradient(W/2-64,0,W/2-34,0);
  lag.addColorStop(0,'#e8e8e8'); lag.addColorStop(1,'#777');
  ctx.fillStyle=lag; ctx.beginPath(); ctx.moveTo(W/2-64,H*0.22); ctx.lineTo(W/2-34,H*0.24); ctx.lineTo(W/2-42,H*0.08); ctx.closePath(); ctx.fill();
  // right axe
  ctx.fillStyle='#8b6030'; ctx.fillRect(W/2+42,H*0.24,8,70);
  const rag=ctx.createLinearGradient(W/2+34,0,W/2+64,0);
  rag.addColorStop(0,'#777'); rag.addColorStop(1,'#e8e8e8');
  ctx.fillStyle=rag; ctx.beginPath(); ctx.moveTo(W/2+34,H*0.24); ctx.lineTo(W/2+64,H*0.22); ctx.lineTo(W/2+42,H*0.08); ctx.closePath(); ctx.fill();
  // body
  const tbg=ctx.createLinearGradient(W/2-28,0,W/2+28,0);
  tbg.addColorStop(0,'#8b3a00'); tbg.addColorStop(0.4,'#cc5500'); tbg.addColorStop(1,'#661a00');
  ctx.fillStyle=tbg; ctx.fillRect(W/2-28,H*0.28,56,80);
  // war paint
  ctx.fillStyle='#cc0000'; ctx.fillRect(W/2-28,H*0.35,56,7);
  // head
  const thg=ctx.createRadialGradient(W/2-6,H*0.19,2,W/2,H*0.22,22);
  thg.addColorStop(0,'#e06020'); thg.addColorStop(1,'#7a2800');
  ctx.fillStyle=thg; ctx.beginPath(); ctx.arc(W/2,H*0.22,22,0,Math.PI*2); ctx.fill();
  // horned helmet
  ctx.fillStyle='#555'; ctx.fillRect(W/2-24,H*0.11,48,14);
  ctx.fillStyle='#777'; ctx.beginPath(); ctx.moveTo(W/2-22,H*0.11); ctx.lineTo(W/2-30,H*0.01); ctx.lineTo(W/2-14,H*0.11); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(W/2+22,H*0.11); ctx.lineTo(W/2+30,H*0.01); ctx.lineTo(W/2+14,H*0.11); ctx.closePath(); ctx.fill();
  // lightning crackling
  shadow(ctx,14,'#ffee00');
  [[W/2-36,H*0.42],[W/2+36,H*0.42],[W/2-28,H*0.62],[W/2+28,H*0.62]].forEach(([x,y])=>{
    ctx.fillStyle='#ffcc00'; ctx.beginPath(); ctx.arc(x,y,5,0,Math.PI*2); ctx.fill();
  });
  noshadow(ctx);
  ctx.fillStyle='#441a00'; ctx.fillRect(W/2-22,H*0.62,18,28); ctx.fillRect(W/2+4,H*0.62,18,28);
  rglow(ctx,W/2,H*0.94,44,'#000000');
}

function _blaze_witch(ctx, W, H) {
  gbg(ctx, '#1a0500', '#060100', W, H);
  rglow(ctx, W/2, H*0.55, 80, '#ff4400');
  // fire pool at feet
  const fpg=ctx.createRadialGradient(W/2,H*0.82,2,W/2,H*0.82,52);
  fpg.addColorStop(0,'rgba(255,200,0,0.8)'); fpg.addColorStop(0.5,'rgba(255,60,0,0.5)'); fpg.addColorStop(1,'rgba(255,0,0,0)');
  ctx.fillStyle=fpg; ctx.beginPath(); ctx.ellipse(W/2,H*0.82,52,22,0,0,Math.PI*2); ctx.fill();
  // robe
  ctx.fillStyle='#0d0d0d';
  ctx.beginPath(); ctx.moveTo(W/2-24,H*0.36); ctx.lineTo(W/2+24,H*0.36); ctx.lineTo(W/2+32,H*0.88); ctx.lineTo(W/2-32,H*0.88); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#1a0000'; ctx.beginPath(); ctx.moveTo(W/2,H*0.36); ctx.lineTo(W/2+4,H*0.88); ctx.lineTo(W/2-4,H*0.88); ctx.closePath(); ctx.fill();
  // fire hands
  shadow(ctx,18,'#ff6600');
  [[W/2-34,H*0.52],[W/2+34,H*0.52]].forEach(([x,y])=>{
    ctx.fillStyle='#ff4400'; ctx.beginPath(); ctx.arc(x,y,10,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#ffcc00'; ctx.beginPath(); ctx.arc(x,y,5,0,Math.PI*2); ctx.fill();
  });
  noshadow(ctx);
  // arms
  ctx.fillStyle='#1a1a1a'; ctx.fillRect(W/2-36,H*0.36,10,28); ctx.fillRect(W/2+26,H*0.36,10,28);
  // hat
  ctx.fillStyle='#111';
  ctx.beginPath(); ctx.moveTo(W/2-22,H*0.32); ctx.lineTo(W/2+22,H*0.32); ctx.lineTo(W/2+8,H*0.08); ctx.lineTo(W/2-8,H*0.08); ctx.closePath(); ctx.fill();
  ctx.fillRect(W/2-24,H*0.30,48,6); // brim
  // hat detail
  ctx.fillStyle='#ff4400'; ctx.fillRect(W/2-22,H*0.32,44,3);
  // face
  const wfg=ctx.createRadialGradient(W/2-4,H*0.272,2,W/2,H*0.29,14);
  wfg.addColorStop(0,'#f0c890'); wfg.addColorStop(1,'#c09060');
  ctx.fillStyle=wfg; ctx.beginPath(); ctx.arc(W/2,H*0.29,14,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#ff3300'; ctx.fillRect(W/2-7,H*0.278,5,4); ctx.fillRect(W/2+2,H*0.278,5,4);
  // ember particles
  shadow(ctx,8,'#ff8800');
  [[W/2-44,H*0.44],[W/2+48,H*0.38],[W/2-36,H*0.68],[W/2+38,H*0.72]].forEach(([x,y])=>{
    ctx.fillStyle='#ff8800'; ctx.beginPath(); ctx.arc(x,y,3,0,Math.PI*2); ctx.fill();
  });
  noshadow(ctx);
  rglow(ctx,W/2,H*0.94,44,'#000000');
}

function _wing_knight(ctx, W, H) {
  gbg(ctx, '#0a1428', '#020408', W, H);
  rglow(ctx, W/2, H*0.45, 88, '#88aaff');
  // divine light beam from above
  const dlg=ctx.createLinearGradient(0,0,0,H*0.5);
  dlg.addColorStop(0,'rgba(200,220,255,0.22)'); dlg.addColorStop(1,'rgba(200,220,255,0)');
  ctx.fillStyle=dlg; ctx.fillRect(W/2-50,0,100,H*0.5);
  // left wing
  ctx.fillStyle='rgba(240,248,255,0.9)';
  ctx.beginPath(); ctx.moveTo(W/2-14,H*0.30); ctx.bezierCurveTo(W/2-70,H*0.10,W/2-78,H*0.38,W/2-60,H*0.58); ctx.lineTo(W/2-14,H*0.44); ctx.closePath(); ctx.fill();
  ctx.fillStyle='rgba(180,200,230,0.5)';
  ctx.beginPath(); ctx.moveTo(W/2-16,H*0.34); ctx.bezierCurveTo(W/2-56,H*0.18,W/2-62,H*0.40,W/2-50,H*0.54); ctx.lineTo(W/2-16,H*0.42); ctx.closePath(); ctx.fill();
  // right wing
  ctx.fillStyle='rgba(240,248,255,0.9)';
  ctx.beginPath(); ctx.moveTo(W/2+14,H*0.30); ctx.bezierCurveTo(W/2+70,H*0.10,W/2+78,H*0.38,W/2+60,H*0.58); ctx.lineTo(W/2+14,H*0.44); ctx.closePath(); ctx.fill();
  ctx.fillStyle='rgba(180,200,230,0.5)';
  ctx.beginPath(); ctx.moveTo(W/2+16,H*0.34); ctx.bezierCurveTo(W/2+56,H*0.18,W/2+62,H*0.40,W/2+50,H*0.54); ctx.lineTo(W/2+16,H*0.42); ctx.closePath(); ctx.fill();
  // silver armor body
  const wag=ctx.createLinearGradient(W/2-28,0,W/2+28,0);
  wag.addColorStop(0,'#d0d8e8'); wag.addColorStop(0.4,'#eef2f8'); wag.addColorStop(1,'#8899aa');
  ctx.fillStyle=wag; ctx.fillRect(W/2-28,H*0.30,56,84);
  // armor details
  ctx.fillStyle='rgba(100,140,200,0.3)'; ctx.fillRect(W/2-26,H*0.38,52,14); ctx.fillRect(W/2-26,H*0.54,52,14);
  // helmet
  const whg=ctx.createRadialGradient(W/2-6,H*0.17,2,W/2,H*0.22,22);
  whg.addColorStop(0,'#ffffff'); whg.addColorStop(1,'#667788');
  ctx.fillStyle=whg; ctx.beginPath(); ctx.arc(W/2,H*0.22,22,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#1a2a3a'; ctx.fillRect(W/2-12,H*0.208,24,6);
  ctx.fillStyle='rgba(200,230,255,0.5)'; ctx.fillRect(W/2-10,H*0.208,10,3);
  // lance
  shadow(ctx,10,'#aaccff'); ctx.fillStyle='#c8c8d8'; ctx.fillRect(W/2-4,H*0.04,6,72); noshadow(ctx);
  ctx.fillStyle='#ffcc00'; ctx.beginPath(); ctx.moveTo(W/2-4,H*0.04); ctx.lineTo(W/2+8,H*0.04); ctx.lineTo(W/2+2,H*-0.02); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#aaaaaa'; ctx.fillRect(W/2-26,H*0.60,52,6);
  ctx.fillStyle='#8899aa'; ctx.fillRect(W/2-22,H*0.62,18,28); ctx.fillRect(W/2+4,H*0.62,18,28);
  rglow(ctx,W/2,H*0.94,44,'#000000');
}

function _frostborn(ctx, W, H) {
  gbg(ctx, '#061428', '#000608', W, H);
  rglow(ctx, W/2, H*0.50, 82, '#0088ff');
  // frost aura snowflakes
  for(let i=0;i<8;i++){
    const a=i/8*Math.PI*2; const r=64;
    shadow(ctx,6,'#aaddff'); ctx.fillStyle='rgba(180,230,255,0.5)';
    ctx.beginPath(); ctx.arc(W/2+Math.cos(a)*r,H*0.5+Math.sin(a)*r*0.4,3.5,0,Math.PI*2); ctx.fill();
  }
  noshadow(ctx);
  // ice robe
  const irg=ctx.createLinearGradient(W/2-26,0,W/2+26,0);
  irg.addColorStop(0,'#1a4a7a'); irg.addColorStop(0.5,'#2266aa'); irg.addColorStop(1,'#0d2a4a');
  ctx.fillStyle=irg; ctx.beginPath(); ctx.moveTo(W/2-26,H*0.34); ctx.lineTo(W/2+26,H*0.34); ctx.lineTo(W/2+30,H*0.88); ctx.lineTo(W/2-30,H*0.88); ctx.closePath(); ctx.fill();
  // ice crystal overlay on robe
  ctx.fillStyle='rgba(150,220,255,0.15)';
  for(let i=0;i<4;i++) ctx.fillRect(W/2-22+i*14,H*0.42,3,40);
  // ice orbs
  shadow(ctx,14,'#00aaff');
  [[W/2-36,H*0.46],[W/2+36,H*0.46]].forEach(([x,y])=>{
    ctx.fillStyle='#44aaff'; ctx.beginPath(); ctx.arc(x,y,12,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(200,240,255,0.6)'; ctx.beginPath(); ctx.arc(x-3,y-3,6,0,Math.PI*2); ctx.fill();
  });
  noshadow(ctx);
  // head
  const fbhg=ctx.createRadialGradient(W/2-4,H*0.185,2,W/2,H*0.21,18);
  fbhg.addColorStop(0,'#d8eeff'); fbhg.addColorStop(1,'#5588aa');
  ctx.fillStyle=fbhg; ctx.beginPath(); ctx.arc(W/2,H*0.21,18,0,Math.PI*2); ctx.fill();
  // ice crown
  shadow(ctx,10,'#00ccff'); ctx.fillStyle='#66ccff';
  [[-14,-56],[-6,-62],[4,-60],[12,-54]].forEach(([dx,dy])=>{
    ctx.beginPath(); ctx.moveTo(W/2+dx,H*0.14); ctx.lineTo(W/2+dx/2,H*0.14+dy/H*2); ctx.lineTo(W/2+dx+8,H*0.14); ctx.closePath(); ctx.fill();
  });
  noshadow(ctx);
  ctx.fillStyle='rgba(180,230,255,0.6)'; ctx.beginPath(); ctx.arc(W/2-4,H*0.20,7,0,Math.PI*2); ctx.fill();
  // breath of frost
  const bfg=ctx.createLinearGradient(W/2-20,H*0.24,W/2-50,H*0.28);
  bfg.addColorStop(0,'rgba(180,230,255,0.7)'); bfg.addColorStop(1,'rgba(180,230,255,0)');
  ctx.fillStyle=bfg; ctx.beginPath(); ctx.ellipse(W/2-34,H*0.26,24,8,-.3,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#0d2a4a'; ctx.fillRect(W/2-22,H*0.62,18,28); ctx.fillRect(W/2+4,H*0.62,18,28);
  rglow(ctx,W/2,H*0.94,44,'#000000');
}

function _jade_monk(ctx, W, H) {
  gbg(ctx, '#041808', '#010601', W, H);
  rglow(ctx, W/2, H*0.50, 82, '#00cc44');
  // healing aura rings
  for(let r=30;r<=70;r+=20){
    ctx.strokeStyle=`rgba(0,200,80,${0.4-r/200})`; ctx.lineWidth=2;
    ctx.beginPath(); ctx.ellipse(W/2,H*0.54,r,r*0.4,0,0,Math.PI*2); ctx.stroke();
  }
  // robe
  const jrg=ctx.createLinearGradient(W/2-26,0,W/2+26,0);
  jrg.addColorStop(0,'#0e5e28'); jrg.addColorStop(0.5,'#1a8040'); jrg.addColorStop(1,'#0a3818');
  ctx.fillStyle=jrg; ctx.beginPath(); ctx.moveTo(W/2-26,H*0.34); ctx.lineTo(W/2+26,H*0.34); ctx.lineTo(W/2+30,H*0.88); ctx.lineTo(W/2-30,H*0.88); ctx.closePath(); ctx.fill();
  // sash
  ctx.fillStyle='#1a8040'; ctx.fillRect(W/2-26,H*0.46,52,7);
  ctx.fillStyle='#c8a000'; ctx.fillRect(W/2-4,H*0.46,8,7);
  // jade orb
  shadow(ctx,16,'#00ff66'); ctx.fillStyle='#33cc66'; ctx.beginPath(); ctx.arc(W/2+18,H*0.54,10,0,Math.PI*2); ctx.fill(); noshadow(ctx);
  ctx.fillStyle='rgba(180,255,200,0.5)'; ctx.beginPath(); ctx.arc(W/2+14,H*0.52,5,0,Math.PI*2); ctx.fill();
  // arms
  ctx.fillStyle='#0e5e28'; ctx.fillRect(W/2-36,H*0.34,10,34); ctx.fillRect(W/2+26,H*0.34,10,34);
  // staff
  ctx.fillStyle='#7a5020'; ctx.fillRect(W/2-36,H*0.10,6,64);
  shadow(ctx,12,'#00ff66'); ctx.fillStyle='#44ee88'; ctx.beginPath(); ctx.arc(W/2-33,H*0.10,10,0,Math.PI*2); ctx.fill(); noshadow(ctx);
  ctx.fillStyle='rgba(200,255,220,0.5)'; ctx.beginPath(); ctx.arc(W/2-36,H*0.10,5,0,Math.PI*2); ctx.fill();
  // face
  const jfg=ctx.createRadialGradient(W/2-4,H*0.205,2,W/2,H*0.22,16);
  jfg.addColorStop(0,'#f0d8b0'); jfg.addColorStop(1,'#c8a070');
  ctx.fillStyle=jfg; ctx.beginPath(); ctx.arc(W/2,H*0.22,16,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#334422'; ctx.fillRect(W/2-7,H*0.21,4,5); ctx.fillRect(W/2+3,H*0.21,4,5);
  // heal sparks
  shadow(ctx,8,'#00ff88');
  [[W/2+36,H*0.36],[W/2+44,H*0.50],[W/2+30,H*0.62]].forEach(([x,y])=>{
    ctx.fillStyle='#88ffaa'; ctx.beginPath(); ctx.arc(x,y,3,0,Math.PI*2); ctx.fill();
  });
  noshadow(ctx);
  ctx.fillStyle='#0a3818'; ctx.fillRect(W/2-22,H*0.62,18,28); ctx.fillRect(W/2+4,H*0.62,18,28);
  rglow(ctx,W/2,H*0.94,44,'#000000');
}

function _sea_crusher(ctx, W, H) {
  gbg(ctx, '#051820', '#010608', W, H);
  rglow(ctx, W/2, H*0.50, 82, '#00aacc');
  // water cannon arm (right, big)
  const wcg=ctx.createLinearGradient(W/2+20,0,W/2+70,0);
  wcg.addColorStop(0,'#1a6688'); wcg.addColorStop(1,'#0a3344');
  ctx.fillStyle=wcg; ctx.fillRect(W/2+22,H*0.36,46,20);
  shadow(ctx,14,'#00ccff'); ctx.fillStyle='#00aabb'; ctx.beginPath(); ctx.arc(W/2+68,H*0.46,12,0,Math.PI*2); ctx.fill(); noshadow(ctx);
  ctx.fillStyle='rgba(150,240,255,0.5)'; ctx.beginPath(); ctx.arc(W/2+64,H*0.43,6,0,Math.PI*2); ctx.fill();
  // water spray
  for(let i=0;i<5;i++){
    const spg=ctx.createLinearGradient(W/2+68,H*0.46,W/2+68+20+i*8,H*0.46+(i-2)*6);
    spg.addColorStop(0,'rgba(100,220,255,0.6)'); spg.addColorStop(1,'rgba(100,220,255,0)');
    ctx.fillStyle=spg; ctx.beginPath(); ctx.ellipse(W/2+76+i*8,H*0.42+(i-2)*5,6,3,.1*i,0,Math.PI*2); ctx.fill();
  }
  // body
  const sbg=ctx.createLinearGradient(W/2-28,0,W/2+22,0);
  sbg.addColorStop(0,'#1a7060'); sbg.addColorStop(0.5,'#22908a'); sbg.addColorStop(1,'#0e4040');
  ctx.fillStyle=sbg; ctx.fillRect(W/2-28,H*0.28,50,84);
  ctx.fillStyle='rgba(100,240,240,0.2)'; ctx.fillRect(W/2-26,H*0.38,46,14); ctx.fillRect(W/2-26,H*0.54,46,14);
  // helmet
  const shg2=ctx.createRadialGradient(W/2-8,H*0.16,2,W/2-4,H*0.22,22);
  shg2.addColorStop(0,'#33bbbb'); shg2.addColorStop(1,'#0a4040');
  ctx.fillStyle=shg2; ctx.beginPath(); ctx.arc(W/2-4,H*0.22,22,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#00ccdd'; ctx.fillRect(W/2-14,H*0.208,20,6);
  // shield (left)
  ctx.fillStyle='#0a4050'; ctx.fillRect(W/2-52,H*0.28,26,48);
  ctx.fillStyle='rgba(50,200,220,0.3)'; ctx.fillRect(W/2-50,H*0.30,22,44);
  ctx.fillStyle='#1a8888'; ctx.fillRect(W/2-52,H*0.28,4,48);
  ctx.fillStyle='#0a3818'; ctx.fillRect(W/2-22,H*0.62,18,28); ctx.fillRect(W/2+4,H*0.62,18,28);
  rglow(ctx,W/2,H*0.94,44,'#000000');
}

function _crystal_sage(ctx, W, H) {
  gbg(ctx, '#150828', '#050108', W, H);
  rglow(ctx, W/2, H*0.50, 82, '#aa44ff');
  // floating crystal shards
  shadow(ctx,12,'#cc44ff');
  [[-44,H*0.30],[-50,H*0.50],[48,H*0.26],[52,H*0.48]].forEach(([dx,y])=>{
    ctx.fillStyle='#dd88ff';
    ctx.beginPath(); ctx.moveTo(W/2+dx,y); ctx.lineTo(W/2+dx+10,y+18); ctx.lineTo(W/2+dx-2,y+22); ctx.closePath(); ctx.fill();
    ctx.fillStyle='rgba(255,200,255,0.4)'; ctx.fillRect(W/2+dx+1,y+2,4,10);
  });
  noshadow(ctx);
  // robe
  const crg=ctx.createLinearGradient(W/2-26,0,W/2+26,0);
  crg.addColorStop(0,'#44107a'); crg.addColorStop(0.5,'#6620aa'); crg.addColorStop(1,'#2a0850');
  ctx.fillStyle=crg; ctx.beginPath(); ctx.moveTo(W/2-26,H*0.34); ctx.lineTo(W/2+26,H*0.34); ctx.lineTo(W/2+30,H*0.88); ctx.lineTo(W/2-30,H*0.88); ctx.closePath(); ctx.fill();
  // crystal barrier (front center)
  shadow(ctx,16,'#ff88ff'); ctx.fillStyle='rgba(220,150,255,0.35)'; ctx.fillRect(W/2-30,H*0.52,60,36); noshadow(ctx);
  ctx.strokeStyle='rgba(200,100,255,0.7)'; ctx.lineWidth=2; ctx.strokeRect(W/2-30,H*0.52,60,36);
  // arms
  ctx.fillStyle='#44107a'; ctx.fillRect(W/2-36,H*0.34,10,38); ctx.fillRect(W/2+26,H*0.34,10,38);
  // face+crown
  const cfg=ctx.createRadialGradient(W/2-4,H*0.205,2,W/2,H*0.22,15);
  cfg.addColorStop(0,'#e8d0f0'); cfg.addColorStop(1,'#9060b0');
  ctx.fillStyle=cfg; ctx.beginPath(); ctx.arc(W/2,H*0.22,15,0,Math.PI*2); ctx.fill();
  shadow(ctx,10,'#ff88ff'); ctx.fillStyle='#ff66ff';
  [[-10,-52],[-2,-60],[8,-56]].forEach(([dx,dy])=>{
    ctx.beginPath(); ctx.moveTo(W/2+dx,H*0.16); ctx.lineTo(W/2+dx+4,H*0.16+dy/H*8); ctx.lineTo(W/2+dx+8,H*0.16); ctx.closePath(); ctx.fill();
  });
  noshadow(ctx);
  ctx.fillStyle='rgba(240,200,255,0.5)'; ctx.beginPath(); ctx.arc(W/2-3,H*0.20,6,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#2a0850'; ctx.fillRect(W/2-20,H*0.62,16,28); ctx.fillRect(W/2+4,H*0.62,16,28);
  rglow(ctx,W/2,H*0.94,44,'#000000');
}

function _arrow_jack(ctx, W, H) {
  gbg(ctx, '#0a1e06', '#020601', W, H);
  rglow(ctx, W/2, H*0.50, 72, '#448800');
  // quiver (back right)
  ctx.fillStyle='#6b3010'; ctx.fillRect(W/2+26,H*0.22,14,42);
  ctx.fillStyle='#8b4020'; ctx.fillRect(W/2+27,H*0.22,12,4);
  // arrows in quiver
  shadow(ctx,4,'#cccc00'); ctx.fillStyle='#c8c8c8';
  [W/2+30,W/2+34,W/2+38].forEach(x=>ctx.fillRect(x,H*0.14,2,16));
  ctx.fillStyle='#cc2200'; [W/2+30,W/2+34,W/2+38].forEach(x=>{ ctx.beginPath(); ctx.moveTo(x,H*0.14); ctx.lineTo(x+2,H*0.14); ctx.lineTo(x+1,H*0.09); ctx.closePath(); ctx.fill(); });
  noshadow(ctx);
  // body - ranger green
  const arb=ctx.createLinearGradient(W/2-22,0,W/2+22,0);
  arb.addColorStop(0,'#2a5a10'); arb.addColorStop(0.5,'#3a7018'); arb.addColorStop(1,'#1a3a08');
  ctx.fillStyle=arb; ctx.fillRect(W/2-22,H*0.30,44,78);
  // leather straps
  ctx.fillStyle='#7a4010'; ctx.fillRect(W/2-22,H*0.36,44,4); ctx.fillRect(W/2-22,H*0.50,44,4);
  // head + hood
  ctx.fillStyle='#2a5a10'; ctx.fillRect(W/2-18,H*0.14,36,20);
  const afhg=ctx.createRadialGradient(W/2-4,H*0.232,2,W/2,H*0.25,16);
  afhg.addColorStop(0,'#e8c890'); afhg.addColorStop(1,'#b8906a');
  ctx.fillStyle=afhg; ctx.beginPath(); ctx.arc(W/2,H*0.25,16,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#1a3a08'; ctx.beginPath(); ctx.arc(W/2,H*0.17,16,Math.PI,0); ctx.fill();
  // bow (left)
  ctx.fillStyle='#7a4010'; ctx.fillRect(W/2-42,H*0.18,6,54);
  shadow(ctx,6,'#88aa44'); ctx.strokeStyle='#88aa44'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(W/2-39,H*0.18); ctx.quadraticCurveTo(W/2-52,H*0.45,W/2-39,H*0.72); ctx.stroke();
  noshadow(ctx);
  // arrow nocked
  shadow(ctx,6,'#ffee00'); ctx.fillStyle='#c8c8c8'; ctx.fillRect(W/2-52,H*0.44,42,2);
  ctx.fillStyle='#cc0000'; ctx.beginPath(); ctx.moveTo(W/2-52,H*0.42); ctx.lineTo(W/2-52,H*0.46); ctx.lineTo(W/2-44,H*0.44); ctx.closePath(); ctx.fill();
  noshadow(ctx);
  ctx.fillStyle='#1a3a08'; ctx.fillRect(W/2-18,H*0.62,16,28); ctx.fillRect(W/2+2,H*0.62,16,28);
  rglow(ctx,W/2,H*0.94,40,'#000000');
}

function _shadow_rogue(ctx, W, H) {
  gbg(ctx, '#050508', '#000000', W, H);
  rglow(ctx, W/2, H*0.50, 72, '#440044');
  // shadow smoke
  for(let i=0;i<6;i++){
    ctx.fillStyle=`rgba(30,0,40,${0.3-i*0.04})`;
    ctx.beginPath(); ctx.ellipse(W/2+(i%3-1)*18,H*0.60+i*8,18+i*4,10+i*3,0,0,Math.PI*2); ctx.fill();
  }
  // body - dark assassin
  ctx.fillStyle='#0a0a14'; ctx.fillRect(W/2-20,H*0.30,40,78);
  ctx.fillStyle='rgba(80,0,80,0.2)'; ctx.fillRect(W/2-18,H*0.36,36,66);
  // cloak
  ctx.fillStyle='#080810';
  ctx.beginPath(); ctx.moveTo(W/2-26,H*0.32); ctx.lineTo(W/2+26,H*0.32); ctx.lineTo(W/2+34,H*0.88); ctx.lineTo(W/2-34,H*0.88); ctx.closePath(); ctx.fill();
  // left dagger
  shadow(ctx,8,'#aa0088'); ctx.fillStyle='#c8c0d8';
  ctx.fillRect(W/2-44,H*0.25,5,36); ctx.fillStyle='#c8a000'; ctx.fillRect(W/2-48,H*0.31,13,4);
  ctx.fillStyle='c8c0d8'; ctx.beginPath(); ctx.moveTo(W/2-44,H*0.25); ctx.lineTo(W/2-39,H*0.25); ctx.lineTo(W/2-41,H*0.19); ctx.closePath(); ctx.fill();
  // right dagger
  ctx.fillStyle='#c8c0d8'; ctx.fillRect(W/2+39,H*0.25,5,36); ctx.fillStyle='#c8a000'; ctx.fillRect(W/2+35,H*0.31,13,4);
  ctx.beginPath(); ctx.moveTo(W/2+39,H*0.25); ctx.lineTo(W/2+44,H*0.25); ctx.lineTo(W/2+42,H*0.19); ctx.closePath(); ctx.fill();
  noshadow(ctx);
  // hooded head
  ctx.fillStyle='#0a0a14'; ctx.beginPath(); ctx.arc(W/2,H*0.22,20,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#080808'; ctx.beginPath(); ctx.arc(W/2,H*0.15,18,Math.PI,0); ctx.fill();
  // glowing red eyes
  shadow(ctx,14,'#ff0000'); ctx.fillStyle='#ff2222';
  ctx.beginPath(); ctx.ellipse(W/2-7,H*0.215,5,3,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(W/2+7,H*0.215,5,3,0,0,Math.PI*2); ctx.fill();
  noshadow(ctx);
  ctx.fillStyle='#ff8888'; ctx.beginPath(); ctx.arc(W/2-7,H*0.213,2,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(W/2+7,H*0.213,2,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#080810'; ctx.fillRect(W/2-16,H*0.62,14,28); ctx.fillRect(W/2+2,H*0.62,14,28);
  rglow(ctx,W/2,H*0.94,40,'#000000');
}

function _skywing(ctx, W, H) {
  gbg(ctx, '#061428', '#010408', W, H);
  rglow(ctx, W/2, H*0.48, 80, '#2255ff');
  // left wing
  ctx.fillStyle='rgba(20,80,220,0.9)';
  ctx.beginPath(); ctx.moveTo(W/2-12,H*0.33); ctx.bezierCurveTo(W/2-68,H*0.14,W/2-72,H*0.44,W/2-52,H*0.62); ctx.lineTo(W/2-12,H*0.48); ctx.closePath(); ctx.fill();
  ctx.fillStyle='rgba(80,160,255,0.4)'; ctx.beginPath(); ctx.moveTo(W/2-14,H*0.38); ctx.bezierCurveTo(W/2-54,H*0.22,W/2-58,H*0.44,W/2-44,H*0.58); ctx.lineTo(W/2-14,H*0.46); ctx.closePath(); ctx.fill();
  // right wing
  ctx.fillStyle='rgba(20,80,220,0.9)';
  ctx.beginPath(); ctx.moveTo(W/2+12,H*0.33); ctx.bezierCurveTo(W/2+68,H*0.14,W/2+72,H*0.44,W/2+52,H*0.62); ctx.lineTo(W/2+12,H*0.48); ctx.closePath(); ctx.fill();
  ctx.fillStyle='rgba(80,160,255,0.4)'; ctx.beginPath(); ctx.moveTo(W/2+14,H*0.38); ctx.bezierCurveTo(W/2+54,H*0.22,W/2+58,H*0.44,W/2+44,H*0.58); ctx.lineTo(W/2+14,H*0.46); ctx.closePath(); ctx.fill();
  // body suit
  ctx.fillStyle='#1144cc'; ctx.fillRect(W/2-20,H*0.30,40,68);
  ctx.fillStyle='rgba(80,140,255,0.3)'; ctx.fillRect(W/2-18,H*0.38,36,14);
  // helmet
  const shbg=ctx.createRadialGradient(W/2-6,H*0.18,2,W/2,H*0.22,20);
  shbg.addColorStop(0,'#8ab4ff'); shbg.addColorStop(1,'#112288');
  ctx.fillStyle=shbg; ctx.beginPath(); ctx.arc(W/2,H*0.22,20,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#001166'; ctx.fillRect(W/2-12,H*0.205,24,6);
  ctx.fillStyle='rgba(150,200,255,0.4)'; ctx.fillRect(W/2-10,H*0.205,10,3);
  // bombs
  shadow(ctx,8,'#ff4400');
  [[W/2-12,H*0.70],[W/2+12,H*0.70]].forEach(([x,y])=>{
    ctx.fillStyle='#1a1a1a'; ctx.beginPath(); ctx.arc(x,y,10,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#cc2200'; ctx.beginPath(); ctx.arc(x,y,5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#ff6600'; ctx.fillRect(x-1,y-14,2,6);
  });
  noshadow(ctx);
  ctx.fillStyle='#112288'; ctx.fillRect(W/2-16,H*0.62,14,20); ctx.fillRect(W/2+2,H*0.62,14,20);
  rglow(ctx,W/2,H*0.94,42,'#000000');
}

function _volt_ranger(ctx, W, H) {
  gbg(ctx, '#1a1400', '#060400', W, H);
  rglow(ctx, W/2, H*0.50, 80, '#ffcc00');
  // chain lightning
  shadow(ctx,16,'#ffee00');
  [[W/2+44,H*0.34],[W/2+60,H*0.42],[W/2+52,H*0.52]].forEach(([x,y],i)=>{
    ctx.strokeStyle='#ffee00'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+10*(i%2?1:-1),y+12); ctx.stroke();
  });
  noshadow(ctx);
  // body
  const vrb=ctx.createLinearGradient(W/2-22,0,W/2+22,0);
  vrb.addColorStop(0,'#8a6a00'); vrb.addColorStop(0.5,'#c8a000'); vrb.addColorStop(1,'#5a4400');
  ctx.fillStyle=vrb; ctx.fillRect(W/2-22,H*0.30,44,78);
  ctx.fillStyle='rgba(255,200,0,0.2)'; ctx.fillRect(W/2-20,H*0.38,40,14);
  // head
  const vrhg=ctx.createRadialGradient(W/2-4,H*0.19,2,W/2,H*0.22,18);
  vrhg.addColorStop(0,'#ffe040'); vrhg.addColorStop(1,'#885a00');
  ctx.fillStyle=vrhg; ctx.beginPath(); ctx.arc(W/2,H*0.22,18,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#001166'; ctx.fillRect(W/2-10,H*0.205,20,6);
  ctx.fillStyle='rgba(80,160,255,0.5)'; ctx.fillRect(W/2-8,H*0.205,8,3);
  // electric bow
  ctx.fillStyle='#c8a000'; ctx.fillRect(W/2-42,H*0.20,5,46);
  shadow(ctx,10,'#ffee00'); ctx.strokeStyle='rgba(255,220,0,0.8)'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(W/2-39,H*0.20); ctx.quadraticCurveTo(W/2-54,H*0.43,W/2-39,H*0.66); ctx.stroke();
  noshadow(ctx);
  // lightning arrow
  shadow(ctx,8,'#ffee00'); ctx.fillStyle='#eeee44'; ctx.fillRect(W/2-54,H*0.42,42,2); noshadow(ctx);
  ctx.fillStyle='#ffcc00'; ctx.beginPath(); ctx.moveTo(W/2-54,H*0.40); ctx.lineTo(W/2-54,H*0.44); ctx.lineTo(W/2-46,H*0.42); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#5a4400'; ctx.fillRect(W/2-18,H*0.62,16,28); ctx.fillRect(W/2+2,H*0.62,16,28);
  rglow(ctx,W/2,H*0.94,40,'#000000');
}

function _toxin_toad(ctx, W, H) {
  gbg(ctx, '#041408', '#010401', W, H);
  rglow(ctx, W/2, H*0.55, 82, '#00aa22');
  // poison cloud at feet
  const pcg=ctx.createRadialGradient(W/2,H*0.80,4,W/2,H*0.80,60);
  pcg.addColorStop(0,'rgba(0,200,50,0.4)'); pcg.addColorStop(0.5,'rgba(0,150,30,0.2)'); pcg.addColorStop(1,'rgba(0,100,20,0)');
  ctx.fillStyle=pcg; ctx.beginPath(); ctx.ellipse(W/2,H*0.80,60,28,0,0,Math.PI*2); ctx.fill();
  // body - fat toad
  const tbog=ctx.createRadialGradient(W/2-8,H*0.50,8,W/2,H*0.54,44);
  tbog.addColorStop(0,'#22cc44'); tbog.addColorStop(1,'#0a6020');
  ctx.fillStyle=tbog; ctx.beginPath(); ctx.ellipse(W/2,H*0.54,42,44,0,0,Math.PI*2); ctx.fill();
  // belly lighter
  ctx.fillStyle='rgba(180,255,160,0.25)'; ctx.beginPath(); ctx.ellipse(W/2,H*0.58,24,26,0,0,Math.PI*2); ctx.fill();
  // toxic bumps
  shadow(ctx,8,'#44ff88'); ctx.fillStyle='#1ab840';
  [[-28,H*0.42],[28,H*0.42],[-22,H*0.60],[22,H*0.60],[0,H*0.36]].forEach(([dx,y])=>{
    ctx.beginPath(); ctx.arc(W/2+dx,y,8,0,Math.PI*2); ctx.fill();
  });
  noshadow(ctx);
  // head (big)
  const thbg=ctx.createRadialGradient(W/2-6,H*0.27,4,W/2,H*0.29,26);
  thbg.addColorStop(0,'#44ee66'); thbg.addColorStop(1,'#0a8030');
  ctx.fillStyle=thbg; ctx.beginPath(); ctx.ellipse(W/2,H*0.29,28,24,0,0,Math.PI*2); ctx.fill();
  // big bulgy eyes
  shadow(ctx,8,'#aaff44'); ctx.fillStyle='#eeff00'; ctx.beginPath(); ctx.arc(W/2-14,H*0.222,9,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(W/2+14,H*0.222,9,0,Math.PI*2); ctx.fill(); noshadow(ctx);
  ctx.fillStyle='#000'; ctx.beginPath(); ctx.arc(W/2-14,H*0.222,5,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(W/2+14,H*0.222,5,0,Math.PI*2); ctx.fill();
  // mouth + tongue
  ctx.fillStyle='#066020'; ctx.beginPath(); ctx.arc(W/2,H*0.32,20,0.1,Math.PI-0.1); ctx.fill();
  shadow(ctx,6,'#ff3300'); ctx.fillStyle='#ff2244'; ctx.beginPath(); ctx.ellipse(W/2+10,H*0.35,12,5,.3,0,Math.PI*2); ctx.fill(); noshadow(ctx);
  // legs
  ctx.fillStyle='#0a7030'; ctx.beginPath(); ctx.ellipse(W/2-30,H*0.72,16,12,.4,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(W/2+30,H*0.72,16,12,-.4,0,Math.PI*2); ctx.fill();
  rglow(ctx,W/2,H*0.94,46,'#000000');
}

function _neon_wraith(ctx, W, H) {
  gbg(ctx, '#020008', '#000002', W, H);
  rglow(ctx, W/2, H*0.50, 88, '#00ffcc');
  // ethereal wisps
  for(let i=0;i<8;i++){
    const a=i/8*Math.PI*2+0.3; const r=56+i*2;
    shadow(ctx,10,'#00ffcc'); ctx.fillStyle=`rgba(0,${180+i*8},${180+i*6},0.35)`;
    ctx.beginPath(); ctx.arc(W/2+Math.cos(a)*r*0.42,H*0.50+Math.sin(a)*r*0.25,5-i*0.3,0,Math.PI*2); ctx.fill();
  }
  noshadow(ctx);
  // ghost body (translucent)
  const nwg=ctx.createRadialGradient(W/2-6,H*0.44,8,W/2,H*0.50,52);
  nwg.addColorStop(0,'rgba(0,240,200,0.6)'); nwg.addColorStop(0.6,'rgba(0,180,160,0.35)'); nwg.addColorStop(1,'rgba(0,120,120,0)');
  ctx.fillStyle=nwg; ctx.beginPath(); ctx.ellipse(W/2,H*0.50,44,58,0,0,Math.PI*2); ctx.fill();
  // wispy tail
  ctx.fillStyle='rgba(0,200,160,0.4)';
  [[-14,H*0.78],[0,H*0.84],[14,H*0.80]].forEach(([dx,y])=>{
    ctx.beginPath(); ctx.ellipse(W/2+dx,y,8,14,0,0,Math.PI*2); ctx.fill();
  });
  // head glow
  const nwhg=ctx.createRadialGradient(W/2-4,H*0.26,4,W/2,H*0.28,24);
  nwhg.addColorStop(0,'rgba(200,255,240,0.8)'); nwhg.addColorStop(1,'rgba(0,180,160,0.2)');
  ctx.fillStyle=nwhg; ctx.beginPath(); ctx.arc(W/2,H*0.28,24,0,Math.PI*2); ctx.fill();
  // glowing eyes
  shadow(ctx,18,'#00ffcc'); ctx.fillStyle='#00ffcc';
  ctx.beginPath(); ctx.arc(W/2-9,H*0.265,6,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(W/2+9,H*0.265,6,0,Math.PI*2); ctx.fill();
  noshadow(ctx);
  ctx.fillStyle='#ffffff'; ctx.beginPath(); ctx.arc(W/2-9,H*0.262,2.5,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(W/2+9,H*0.262,2.5,0,Math.PI*2); ctx.fill();
  // neon edge glow
  ctx.strokeStyle='rgba(0,255,200,0.3)'; ctx.lineWidth=3;
  ctx.beginPath(); ctx.ellipse(W/2,H*0.50,44,58,0,0,Math.PI*2); ctx.stroke();
  rglow(ctx,W/2,H*0.94,44,'#000000');
}

function _forge_dwarf(ctx, W, H) {
  gbg(ctx, '#1a0c04', '#060200', W, H);
  rglow(ctx, W/2, H*0.55, 78, '#ff8800');
  // mechanical arm (right, large)
  ctx.fillStyle='#666'; ctx.fillRect(W/2+22,H*0.34,30,18);
  shadow(ctx,10,'#ff6600'); ctx.fillStyle='#ff4400'; ctx.beginPath(); ctx.arc(W/2+52,H*0.43,12,0,Math.PI*2); ctx.fill(); noshadow(ctx);
  ctx.fillStyle='rgba(255,180,80,0.5)'; ctx.beginPath(); ctx.arc(W/2+48,H*0.40,6,0,Math.PI*2); ctx.fill();
  // cannon gears
  ctx.fillStyle='#888'; ctx.beginPath(); ctx.arc(W/2+36,H*0.38,6,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#aaa'; ctx.beginPath(); ctx.arc(W/2+36,H*0.38,3,0,Math.PI*2); ctx.fill();
  // stout body
  const fdb=ctx.createLinearGradient(W/2-26,0,W/2+22,0);
  fdb.addColorStop(0,'#7a3810'); fdb.addColorStop(0.5,'#a05020'); fdb.addColorStop(1,'#4a2008');
  ctx.fillStyle=fdb; ctx.fillRect(W/2-26,H*0.32,48,72);
  // leather apron
  ctx.fillStyle='#5a3010'; ctx.fillRect(W/2-22,H*0.46,44,40);
  ctx.fillStyle='#7a4018'; ctx.fillRect(W/2-22,H*0.46,44,6);
  // tool belt
  ctx.fillStyle='#4a2010'; ctx.fillRect(W/2-22,H*0.56,44,7);
  shadow(ctx,6,'#ff8800'); ctx.fillStyle='#ff8800';
  [W/2-12,W/2,W/2+12].forEach(x=>{ ctx.beginPath(); ctx.arc(x,H*0.595,4,0,Math.PI*2); ctx.fill(); });
  noshadow(ctx);
  // big round head
  const fdh=ctx.createRadialGradient(W/2-6,H*0.22,2,W/2,H*0.25,20);
  fdh.addColorStop(0,'#e08060'); fdh.addColorStop(1,'#8a4030');
  ctx.fillStyle=fdh; ctx.beginPath(); ctx.arc(W/2,H*0.25,20,0,Math.PI*2); ctx.fill();
  // thick beard
  ctx.fillStyle='#aa5520'; ctx.beginPath(); ctx.ellipse(W/2,H*0.32,16,10,0,0,Math.PI); ctx.fill();
  // goggles
  ctx.fillStyle='#1a1a1a'; ctx.fillRect(W/2-16,H*0.218,32,10);
  shadow(ctx,8,'#ff8800'); ctx.fillStyle='#f39c12'; ctx.beginPath(); ctx.arc(W/2-7,H*0.222,7,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(W/2+7,H*0.222,7,0,Math.PI*2); ctx.fill(); noshadow(ctx);
  ctx.fillStyle='rgba(255,220,100,0.4)'; ctx.beginPath(); ctx.arc(W/2-9,H*0.218,3,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(W/2+5,H*0.218,3,0,Math.PI*2); ctx.fill();
  // wrench (left hand)
  ctx.fillStyle='#888'; ctx.fillRect(W/2-42,H*0.34,6,38);
  ctx.fillRect(W/2-46,H*0.34,14,6); ctx.fillRect(W/2-46,H*0.40,14,5);
  // short legs
  ctx.fillStyle='#4a2010'; ctx.fillRect(W/2-20,H*0.66,16,24); ctx.fillRect(W/2+4,H*0.66,16,24);
  ctx.fillStyle='#2a1008'; ctx.fillRect(W/2-20,H*0.82,16,8); ctx.fillRect(W/2+4,H*0.82,16,8);
  rglow(ctx,W/2,H*0.94,42,'#000000');
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

// ── Battle unit draw functions (40×60 for in-game units) ─────────────────────
export const DRAW_FUNCS = {
  titan_grunt(g) {
    g.fillStyle(0x3E2208); g.fillRect(-21,-27,42,51);
    g.fillStyle(0x6B3A12); g.fillRect(-20,-28,40,50);
    g.fillStyle(0x8A5020,0.5); g.fillRect(-20,-28,10,50);
    g.fillStyle(0x808080); g.fillRect(-26,-30,48,14);
    g.fillStyle(0xC8C8C8); g.fillRect(-24,-32,44,10);
    g.fillStyle(0x555555); g.fillCircle(0,-38,15);
    g.fillStyle(0x909090); g.fillCircle(0,-38,13);
    g.fillStyle(0xFF4400,0.8); g.fillRect(-8,-38,16,4);
    g.fillStyle(0xC8A000); g.fillRect(-24,-12,6,28);
    g.fillStyle(0xC8C8C8); g.fillTriangle(-28,-14,-16,-14,-22,-28);
    g.fillStyle(0x444444); g.fillRect(11,-28,18,36);
    g.fillStyle(0xFFD700); g.fillCircle(20,-10,5);
    g.fillStyle(0xFFD700,0.7); g.fillRect(-20,12,40,4);
  },
  pyro_drake(g) {
    g.fillStyle(0xFF4500); g.fillEllipse(0,-10,30,44);
    g.fillStyle(0xFF8C00); g.fillCircle(0,-36,12);
    g.fillStyle(0xCC2200); g.fillTriangle(-14,-20,-40,-40,-14,0); g.fillTriangle(14,-20,40,-40,14,0);
    g.fillStyle(0xFFD700); g.fillEllipse(0,-42,6,10);
    g.fillStyle(0xFF6600); g.fillRect(-4,18,8,16);
    g.fillStyle(0xFFCC00,0.8); g.fillEllipse(-16,-36,14,6);
  },
  lady_vex(g) {
    g.fillStyle(0x9B59B6); g.fillEllipse(0,-12,22,40);
    g.fillStyle(0xFAD7A0); g.fillCircle(0,-36,10);
    g.fillStyle(0x8E44AD); g.fillTriangle(-12,-44,12,-44,0,-28);
    g.fillStyle(0xFAD7A0); g.fillRect(-20,-28,4,18);
    g.fillStyle(0xE91E8C); g.fillRect(-22,-36,4,4);
    g.fillStyle(0xFFD700); g.fillRect(14,-42,4,50); g.fillCircle(16,-44,8);
    g.fillStyle(0xE91E8C); g.fillCircle(16,-44,5);
    g.fillStyle(0xAA44FF,0.6); g.fillCircle(-30,-18,4); g.fillCircle(28,-30,3);
  },
  bone_shard(g) {
    g.fillStyle(0x1A1A2E); g.fillEllipse(0,-10,28,46);
    g.fillStyle(0x2C3E50); g.fillTriangle(-14,-30,14,-30,0,-50);
    g.fillStyle(0xF0E68C); g.fillCircle(0,-36,7);
    g.fillStyle(0x1A1A2E); g.fillRect(-3,-38,2,4); g.fillRect(1,-38,2,4);
    g.fillStyle(0x8E44AD); g.fillCircle(-20,-10,5); g.fillCircle(20,-10,5); g.fillCircle(0,14,6);
    g.fillStyle(0x6C3483); g.fillRect(-2,-26,4,50);
  },
  iron_bro(g) {
    g.fillStyle(0x1F618D); g.fillRect(-16,-28,32,50);
    g.fillStyle(0x2E86C1); g.fillCircle(0,-38,12);
    g.fillStyle(0x85C1E9); g.fillRect(-6,-44,12,6);
    g.fillStyle(0x7F8C8D); g.fillRect(12,-32,18,36);
    g.fillStyle(0xFFD700); g.fillCircle(21,-14,4);
    g.fillStyle(0xC0C0C0); g.fillRect(-20,-26,6,30);
    g.fillStyle(0xFFD700); g.fillRect(-24,-22,14,4);
    g.fillStyle(0x2266FF,0.4); g.fillRect(-16,-28,32,50);
  },
  stone_golem(g) {
    g.fillStyle(0x3A4040); g.fillRect(-35,-22,12,34); g.fillRect(23,-22,12,34);
    g.fillStyle(0x5A6465); g.fillRect(-34,-22,12,34); g.fillRect(22,-22,12,34);
    g.fillStyle(0x5A6465); g.fillRect(-22,-28,44,56);
    g.fillStyle(0xFF4400,0.8); g.fillRect(-18,-16,36,2); g.fillRect(-18,-4,36,2);
    g.fillStyle(0x5A6465); g.fillCircle(0,-38,18);
    g.fillStyle(0xFF8800); g.fillCircle(-5.5,-37,3.5); g.fillCircle(5.5,-37,3.5);
    g.fillStyle(0xFFCC00,0.6); g.fillCircle(-5.5,-37,1.5); g.fillCircle(5.5,-37,1.5);
  },
  thunder_chief(g) {
    g.fillStyle(0xA04000); g.fillRect(-14,-28,28,46);
    g.fillStyle(0xE67E22); g.fillCircle(0,-38,12);
    g.fillStyle(0xC0392B); g.fillRect(-14,-40,28,8);
    g.fillStyle(0x7D6608); g.fillRect(-28,-30,10,32); g.fillTriangle(-30,-30,-18,-28,-28,-44);
    g.fillRect(18,-30,10,32); g.fillTriangle(20,-30,32,-28,22,-44);
    g.fillStyle(0xFFEE00,0.8); g.fillCircle(-22,0,4); g.fillCircle(22,0,4);
  },
  blaze_witch(g) {
    g.fillStyle(0x1A1A1A); g.fillEllipse(0,-6,22,40);
    g.fillStyle(0xFF6B00); g.fillTriangle(-12,-28,12,-28,0,-56);
    g.fillStyle(0xFAD7A0); g.fillCircle(0,-34,9);
    g.fillStyle(0xFF4500); g.fillCircle(-16,-2,6); g.fillCircle(16,-2,6);
    g.fillStyle(0xFF8C00,0.7); g.fillCircle(0,18,8); g.fillCircle(0,24,5);
  },
  wing_knight(g) {
    g.fillStyle(0xBDC3C7); g.fillRect(-14,-26,28,44);
    g.fillStyle(0xECF0F1); g.fillCircle(0,-36,12);
    g.fillStyle(0x2C3E50); g.fillRect(-6,-42,12,6);
    g.fillStyle(0xF0F4F8); g.fillTriangle(-16,-22,-44,-44,-12,8); g.fillTriangle(16,-22,44,-44,12,8);
    g.fillStyle(0xFFD700); g.fillRect(-4,-32,8,44);
    g.fillStyle(0xAABBFF,0.5); g.fillRect(-14,-26,28,44);
  },
  frostborn(g) {
    g.fillStyle(0x1A5276); g.fillEllipse(0,-8,26,44);
    g.fillStyle(0xD6EAF8); g.fillCircle(0,-36,11);
    g.fillStyle(0x2E86C1); g.fillTriangle(-12,-44,-6,-50,0,-44); g.fillTriangle(0,-44,6,-50,12,-44);
    g.fillStyle(0xADD8E6); g.fillCircle(-20,-10,7); g.fillCircle(20,-10,7);
    g.fillStyle(0x85C1E9,0.6); g.fillRect(-2,-22,4,40); g.fillCircle(0,-24,9);
  },
  jade_monk(g) {
    g.fillStyle(0x1E8449); g.fillEllipse(0,-8,24,44);
    g.fillStyle(0xFAD7A0); g.fillCircle(0,-36,10);
    g.fillStyle(0x239B56); g.fillRect(-12,-24,24,8);
    g.fillStyle(0x8B4513); g.fillRect(-20,-42,4,56);
    g.fillStyle(0x2ECC71); g.fillCircle(-18,-44,6); g.fillCircle(10,-10,5);
    g.fillStyle(0x00FF88,0.5); g.fillCircle(20,-24,3); g.fillCircle(24,-14,3);
  },
  sea_crusher(g) {
    g.fillStyle(0x0E6655); g.fillRect(-16,-26,32,50);
    g.fillStyle(0x16A085); g.fillCircle(0,-36,13);
    g.fillStyle(0x1ABC9C); g.fillRect(-6,-40,12,8);
    g.fillStyle(0x0B5345); g.fillRect(16,-22,20,14); g.fillCircle(36,-15,7);
    g.fillStyle(0x1ABC9C); g.fillCircle(36,-15,4);
    g.fillStyle(0x85C1E9,0.8); g.fillCircle(40,-18,3); g.fillCircle(44,-14,2);
  },
  crystal_sage(g) {
    g.fillStyle(0x6C3483); g.fillEllipse(0,-8,24,42);
    g.fillStyle(0xD7BDE2); g.fillCircle(0,-36,10);
    g.fillStyle(0xA29BFE); g.fillTriangle(-10,-44,-4,-56,2,-44); g.fillTriangle(2,-44,8,-54,14,-44);
    g.fillStyle(0xFD79A8); g.fillTriangle(-24,-20,-18,-30,-12,-20); g.fillTriangle(12,-18,18,-28,24,-18);
    g.fillStyle(0xCC44FF,0.4); g.fillRect(-14,-22,28,40);
  },
  arrow_jack(g) {
    g.fillStyle(0x4A7C24); g.fillRect(-10,-28,20,44);
    g.fillStyle(0x8B6914); g.fillCircle(0,-38,10);
    g.fillStyle(0x8B4513); g.fillRect(-22,-26,4,32); g.fillCircle(-20,-26,5); g.fillCircle(-20,6,5);
    g.fillStyle(0xC0C0C0); g.fillRect(-20,-12,20,2);
    g.fillStyle(0x8B0000); g.fillTriangle(-20,-16,-20,-8,-14,-10);
  },
  shadow_rogue(g) {
    g.fillStyle(0x1C1C1C); g.fillRect(-10,-26,20,42);
    g.fillStyle(0x2D2D2D); g.fillCircle(0,-36,9);
    g.fillStyle(0xBDC3C7); g.fillRect(-22,-28,4,24); g.fillTriangle(-22,-28,-18,-28,-20,-36);
    g.fillRect(18,-28,4,24); g.fillTriangle(18,-28,22,-28,20,-36);
    g.fillStyle(0xFF0000); g.fillCircle(-2,-34,2); g.fillCircle(2,-34,2);
    g.fillStyle(0x440044,0.5); g.fillRect(-10,-26,20,42);
  },
  skywing(g) {
    g.fillStyle(0x0652DD); g.fillRect(-10,-22,20,38);
    g.fillStyle(0x74B9FF); g.fillCircle(0,-32,10);
    g.fillStyle(0x0652DD); g.fillTriangle(-12,-18,-38,-36,-10,6); g.fillTriangle(12,-18,38,-36,10,6);
    g.fillStyle(0x2D3436); g.fillCircle(-6,12,5); g.fillCircle(6,12,5);
    g.fillStyle(0xFF4400,0.8); g.fillCircle(-6,12,2); g.fillCircle(6,12,2);
  },
  volt_ranger(g) {
    g.fillStyle(0xD4AC0D); g.fillRect(-10,-26,20,42);
    g.fillStyle(0xF9CA24); g.fillCircle(0,-36,10);
    g.fillStyle(0x0652DD); g.fillRect(-4,-40,8,8);
    g.fillStyle(0xF9CA24); g.fillRect(-22,-22,3,26); g.fillCircle(-20,-22,4); g.fillCircle(-20,4,4);
    g.fillStyle(0xFFEE00,0.9); g.fillRect(-20,-10,20,2);
    g.fillStyle(0xFFEE00); g.fillCircle(10,-8,3); g.fillCircle(14,-12,2);
  },
  toxin_toad(g) {
    g.fillStyle(0x1D8A5E); g.fillEllipse(0,-4,38,42);
    g.fillStyle(0x27AE60); g.fillCircle(0,-24,16);
    g.fillStyle(0xFFFF00); g.fillCircle(-7,-26,5); g.fillCircle(7,-26,5);
    g.fillStyle(0x000000); g.fillCircle(-7,-26,2); g.fillCircle(7,-26,2);
    g.fillStyle(0x55EFC4); g.fillCircle(-4,22,3); g.fillCircle(4,22,3);
    g.fillStyle(0x00AA22,0.5); g.fillEllipse(0,8,44,20);
  },
  neon_wraith(g) {
    g.fillStyle(0x00CEC9,0.7); g.fillEllipse(0,-10,30,50);
    g.fillStyle(0xDFE6E9,0.6); g.fillCircle(0,-32,13);
    g.fillStyle(0x00FFCC); g.fillCircle(-6,-34,5); g.fillCircle(6,-34,5);
    g.fillStyle(0xFFFFFF); g.fillCircle(-6,-34,2); g.fillCircle(6,-34,2);
    g.fillStyle(0x00CEC9,0.4); g.fillEllipse(-8,18,10,18); g.fillEllipse(8,20,10,14);
    g.fillStyle(0x00FFFF,0.6); g.fillCircle(-16,-8,3); g.fillCircle(16,-6,3);
  },
  forge_dwarf(g) {
    g.fillStyle(0xA0522D); g.fillRect(-16,-18,32,38);
    g.fillStyle(0xE17055); g.fillCircle(0,-28,13);
    g.fillStyle(0x2C3E50); g.fillRect(-10,-32,20,8);
    g.fillStyle(0xF39C12); g.fillCircle(-5,-29,5); g.fillCircle(5,-29,5);
    g.fillStyle(0x7F8C8D); g.fillRect(-26,-16,6,26); g.fillRect(-30,-16,14,6); g.fillRect(-30,-10,14,6);
    g.fillStyle(0xFF8800); g.fillCircle(24,-8,8); g.fillCircle(24,-8,5);
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
