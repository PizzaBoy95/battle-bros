import Phaser from 'phaser';
import { socketManager } from '../network/SocketManager.js';
import { audioSystem } from '../systems/AudioSystem.js';
import { DRAW_FUNCS } from '../characters/CharacterGraphics.js';
import { CHARACTER_IDS, CHARACTERS } from '../characters/CharacterRegistry.js';
import { cardTexKey } from '../characters/heroTex.js';

const PARADE_IDS = [
  'titan_grunt','pyro_drake','lady_vex','iron_bro',
  'stone_golem','thunder_chief','blaze_witch','wing_knight',
  'frostborn','jade_monk'
];

export class MainMenuScene extends Phaser.Scene {
  constructor() { super('MainMenu'); }

  create() {
    const { width: W, height: H } = this.scale;
    this.W = W; this.H = H;
    this.username = this.registry.get('username') || 'Player';
    this.gold     = Number(localStorage.getItem('bb_gold')     || this.registry.get('gold')     || 1200);
    this.trophies = Number(localStorage.getItem('bb_trophies') || 1219);
    this.gems     = Number(localStorage.getItem('bb_gems')     || 300);
    this._activePanel = null;

    // ── Background: Meadow Isles home (matches the new battle art) ─────────
    if (this.textures.exists('castle_blue') && this.textures.exists('water_tile')) {
      this._drawMeadowHome();
    } else {
      this._drawSky(); this._drawStars(); this._drawMoon();
      this._drawMountains(); this._drawCastle(); this._drawMoatReflection();
      this._spawnTorches(); this._spawnBanner(); this._spawnMist(); this._startEmbers();
    }

    // ── Character parade in front of castle ────────────────────────────────
    this._drawCharacterParade();

    // ── HUD overlay ────────────────────────────────────────────────────────
    const hud = this.add.graphics().setDepth(10);
    hud.fillStyle(0x000000, 0.65); hud.fillRect(0, 0, W, 60);
    hud.lineStyle(1, 0x1a3a6a, 0.6); hud.lineBetween(0, 60, W, 60);

    this._drawTopBar();
    this._drawBattleBar();
    this._drawNavBar();
    this._buildOverlays();
    this._buildInviteContainer();

    const token = this.registry.get('token');
    if (token && !socketManager.isConnected()) socketManager.connect(token);
    socketManager.on('friend_invite', d => this._onFriendInvite(d));

    this.cameras.main.fadeIn(400);
    audioSystem.playTrack('battle_hymn');
    // Browsers keep AudioContext suspended until a user gesture — kick the
    // music on the first tap so the home page always has sound.
    this.input.once('pointerdown', () => {
      audioSystem.resume();
      if (!audioSystem.currentTrackName) audioSystem.playTrack('battle_hymn');
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // BACKGROUND — Meadow Isles home (Tiny Swords CC0 art)
  // ══════════════════════════════════════════════════════════════════════════
  _drawMeadowHome() {
    const { W, H } = this;
    // Warm dusk sky
    const sky = this.add.graphics().setDepth(0);
    sky.fillGradientStyle(0x2e4a8f, 0x2e4a8f, 0x7fb0d8, 0xd9a05e, 1);
    sky.fillRect(0, 0, W, H * 0.45);
    // Sea fills the rest
    this.add.tileSprite(W / 2, H * 0.72, W + 64, H * 0.56 + 64, 'water_tile').setDepth(0);
    // Island: grass strip the castle + warriors stand on
    const islTop = H * 0.42, islH = H * 0.36;
    const isl = this.add.tileSprite(W / 2, islTop + islH / 2, W + 32, islH, 'tilemap_flat')
      .setDepth(1);
    isl.setTileScale(1, 1); isl.tilePositionX = 64; isl.tilePositionY = 64; // inner grass tile
    // Island edge shading
    const edge = this.add.graphics().setDepth(1);
    edge.fillStyle(0x3f6b30, 0.9); edge.fillRect(0, islTop, W, 4);
    edge.fillStyle(0x2b4a20, 0.9); edge.fillRect(0, islTop + islH - 4, W, 6);
    // Castle — the star of the screen
    this.add.image(W / 2, H * 0.475, 'castle_blue').setOrigin(0.5, 1).setScale(0.86).setDepth(2);
    // Trees + decor + sheep
    if (this.textures.exists('tree')) {
      this.add.image(44, H * 0.47, 'tree', 0).setScale(0.7).setDepth(2);
      this.add.image(W - 44, H * 0.465, 'tree', 0).setScale(0.62).setDepth(2);
    }
    ['deco_02', 'deco_05', 'deco_08'].forEach((k, i) => {
      if (this.textures.exists(k)) this.add.image(60 + i * (W / 3.2), H * 0.56, k).setDepth(2);
    });
    if (this.anims.exists('sheep_anim')) {
      const sh = this.add.sprite(W * 0.80, H * 0.545, 'sheep').setScale(0.5).setDepth(2);
      sh.play('sheep_anim');
    }
    // Soft vignette so HUD + buttons read clearly
    const vig = this.add.graphics().setDepth(3);
    vig.fillStyle(0x000000, 0.42); vig.fillRect(0, 0, W, 60);
    vig.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.55, 0.55);
    vig.fillRect(0, H * 0.72, W, H * 0.28);
  }

  _drawSky() {
    const { W, H } = this;
    const g = this.add.graphics().setDepth(0);
    [[0,H*0.14,0x03070e],[H*0.14,H*0.12,0x040a18],[H*0.26,H*0.14,0x050d1e],
     [H*0.40,H*0.18,0x060f22],[H*0.58,H*0.20,0x050d1c],[H*0.78,H*0.22,0x040b14]
    ].forEach(([y,h,c])=>{ g.fillStyle(c); g.fillRect(0,y,W,h+2); });
    g.fillStyle(0x0a4030,0.28); g.fillEllipse(W/2,H*0.70,W*1.5,H*0.30);
    g.fillStyle(0x082818,0.16); g.fillEllipse(W/2,H*0.74,W*1.2,H*0.18);
  }

  _drawStars() {
    const { W, H } = this;
    const g = this.add.graphics().setDepth(1);
    for(let i=0;i<230;i++){
      const x=((Math.sin(i*73.1+1.2)*0.5+0.5))*W;
      const y=((Math.cos(i*37.7+0.5)*0.5+0.5))*H*0.62;
      const sz=i%18===0?2:i%7===0?1.5:1;
      g.fillStyle(0xFFFFFF,0.15+(Math.sin(i*13.3)*0.5+0.5)*0.65); g.fillRect(x,y,sz,sz);
    }
    [[W*0.12,H*0.06],[W*0.78,H*0.11],[W*0.55,H*0.04],[W*0.30,H*0.15]].forEach(([x,y])=>{
      g.fillStyle(0xCCDDFF,0.12); g.fillCircle(x,y,5); g.fillStyle(0xFFFFFF,0.95); g.fillRect(x-1,y-1,2,2);
    });
  }

  _drawMoon() {
    const { W, H } = this;
    const mx=W*0.82,my=H*0.10, g=this.add.graphics().setDepth(2);
    [[52,0.04],[38,0.08],[28,0.15],[21,0.22]].forEach(([r,a])=>{ g.fillStyle(0xDDEEFF,a); g.fillCircle(mx,my,r); });
    g.fillStyle(0xEEF4FF); g.fillCircle(mx,my,19);
    g.fillStyle(0xD8E8F0,0.45); g.fillCircle(mx+4,my-3,6);
    g.fillStyle(0x06101e,0.52); g.fillCircle(mx+5,my+1,17);
  }

  _drawMountains() {
    const { W, H } = this;
    const g=this.add.graphics().setDepth(3), bY=H*0.70;
    const P=arr=>{ const p=[]; for(let i=0;i<arr.length;i+=2) p.push({x:arr[i],y:arr[i+1]}); return p; };
    g.fillStyle(0x0c1e30,0.68);
    g.fillPoints(P([0,bY-18,W*.08,bY-102,W*.18,bY-142,W*.26,bY-112,W*.35,bY-164,W*.44,bY-122,W*.54,bY-174,W*.63,bY-132,W*.72,bY-154,W*.80,bY-102,W*.90,bY-132,W,bY-58,W,bY,0,bY]));
    g.fillStyle(0x07141e,0.88);
    g.fillPoints(P([0,bY+10,W*.05,bY-62,W*.14,bY-94,W*.20,bY-72,W*.28,bY-114,W*.38,bY-84,W*.48,bY-136,W*.56,bY-92,W*.65,bY-122,W*.75,bY-88,W*.84,bY-104,W*.92,bY-56,W,bY-40,W,bY+10,0,bY+10]));
    g.fillStyle(0x030d12,0.96);
    g.fillPoints(P([0,bY+20,W*.10,bY-34,W*.22,bY-54,W*.30,bY-30,W*.42,bY-62,W*.52,bY-40,W*.60,bY-64,W*.70,bY-44,W*.80,bY-56,W*.90,bY-28,W,bY-36,W,bY+20,0,bY+20]));
  }

  _drawCastle() {
    const { W, H } = this;
    const cx=W/2, gY=H*0.74, g=this.add.graphics().setDepth(4);
    g.fillStyle(0x0b1a0c);
    g.fillPoints(this._P([cx-185,gY+4,cx+185,gY+4,cx+215,gY+40,cx-215,gY+40]));
    this._wall(g,cx-155,gY-78,310,78,0x283a2a,0x1c281e,0x364e38);
    this._battlements(g,cx-155,gY-78,310,0x364e38,0x243428);
    const lt={x:cx-132,y:gY-268,w:78,h:268};
    this._wall(g,lt.x,lt.y,lt.w,lt.h,0x223028,0x16201a,0x2e3e30);
    this._battlements(g,lt.x,lt.y,lt.w,0x2e3e30,0x1c2820);
    this._cap(g,lt.x,lt.y,lt.w,0x18241a,0x0e1610);
    this._windows(g,lt.x,lt.y,lt.w,lt.h,2);
    g.fillStyle(0x4a6a4e,0.15); g.fillRect(lt.x,lt.y,10,lt.h);
    const rt={x:cx+54,y:gY-268,w:78,h:268};
    this._wall(g,rt.x,rt.y,rt.w,rt.h,0x1c2822,0x121c16,0x283430);
    this._battlements(g,rt.x,rt.y,rt.w,0x283430,0x1a2420);
    this._cap(g,rt.x,rt.y,rt.w,0x141e16,0x0c1210);
    this._windows(g,rt.x,rt.y,rt.w,rt.h,2);
    g.fillStyle(0x000000,0.22); g.fillRect(rt.x+rt.w-10,rt.y,10,rt.h);
    const kk={x:cx-94,y:gY-390,w:188,h:390};
    this._wall(g,kk.x,kk.y,kk.w,kk.h,0x2e4432,0x202e24,0x3c5640);
    this._battlements(g,kk.x,kk.y,kk.w,0x3c5440,0x263830);
    this._cap(g,kk.x,kk.y,kk.w,0x1c2e1e,0x101a12,true);
    this._windows(g,kk.x,kk.y,kk.w,kk.h,5);
    g.fillStyle(0x6a9a6e,0.12); g.fillRect(kk.x,kk.y,14,kk.h);
    g.fillStyle(0x000000,0.20); g.fillRect(kk.x+kk.w-14,kk.y,14,kk.h);
    const gw=60,gh=96,gx=cx-30,gy2=gY-96;
    g.fillStyle(0x090e08); g.fillRect(gx,gy2,gw,gh); g.fillCircle(cx,gy2,gw/2);
    g.fillStyle(0x1e2e20,0.75);
    for(let xi=0;xi<5;xi++) g.fillRect(gx+6+xi*10,gy2,3,gh);
    for(let yi=0;yi<7;yi++) g.fillRect(gx,gy2+yi*13,gw,2);
    g.fillStyle(0x3a6a22,0.14); g.fillRect(gx,gy2,gw,gh);
    g.lineStyle(1.5,0x3a5438,0.55); g.strokeRect(gx,gy2,gw,gh);
    g.fillStyle(0x030e0c);
    g.fillPoints(this._P([cx-225,gY,cx+225,gY,cx+248,gY+32,cx-248,gY+32]));
    g.fillStyle(0x081e18,0.55);
    g.fillPoints(this._P([cx-200,gY+2,cx+200,gY+2,cx+218,gY+14,cx-218,gY+14]));
    g.fillStyle(0x1a2a18);
    g.fillPoints(this._P([cx-26,gY,cx+26,gY,cx+22,gY+28,cx-22,gY+28]));
    g.fillStyle(0x283a20,0.55);
    for(let yi=0;yi<6;yi++) g.fillRect(cx-24,gY+3+yi*5,48,3);
  }

  _P(arr){const p=[];for(let i=0;i<arr.length;i+=2)p.push({x:arr[i],y:arr[i+1]});return p;}
  _wall(g,x,y,w,h,base,mortar,hl){
    g.fillStyle(base);g.fillRect(x,y,w,h);
    const BH=18,BW=26;
    for(let row=0;row*BH<h;row++){
      const off=(row%2)*(BW/2);
      for(let col=-1;col*BW<w+BW;col++){
        const bx=x+col*BW-off,by=y+row*BH;
        const cx2=Math.max(bx,x),cx3=Math.min(bx+BW-2,x+w),cy2=Math.max(by,y),cy3=Math.min(by+BH-2,y+h);
        if(cx3<=cx2||cy3<=cy2)continue;
        g.fillStyle(mortar,0.55);g.fillRect(cx2,cy2,cx3-cx2,cy3-cy2);
        g.fillStyle(base);g.fillRect(cx2+1,cy2+1,cx3-cx2-2,cy3-cy2-2);
        g.fillStyle(hl,0.28);g.fillRect(cx2+1,cy2+1,cx3-cx2-2,2);g.fillRect(cx2+1,cy2+1,2,cy3-cy2-2);
        g.fillStyle(mortar,0.45);g.fillRect(cx2+1,cy3-3,cx3-cx2-2,2);
      }
    }
  }
  _battlements(g,x,y,w,base,shadow){
    const mw=16,mh=20,gap=12,total=mw+gap,count=Math.floor(w/total);
    const sx=x+(w-count*total+gap)/2;
    g.fillStyle(shadow);for(let i=0;i<count;i++)g.fillRect(sx+i*total,y-mh+5,mw,mh);
    for(let i=0;i<count;i++){const bx=sx+i*total;g.fillStyle(base);g.fillRect(bx,y-mh,mw,mh);g.fillStyle(0x6a8a6e,0.22);g.fillRect(bx,y-mh,mw,3);}
  }
  _cap(g,x,y,w,dark,shadow,main=false){
    const cx=x+w/2,capH=main?76:54;
    g.fillStyle(dark);g.fillTriangle(cx-w/2-5,y,cx+w/2+5,y,cx,y-capH);
    g.fillStyle(shadow,0.45);g.fillTriangle(cx-w/2-5,y,cx,y,cx,y-capH);
    if(main){g.fillStyle(0xFFD700,0.65);g.fillCircle(cx,y-capH,6);g.fillStyle(0xFFFFFF,0.45);g.fillCircle(cx,y-capH,2.5);}
  }
  _windows(g,x,y,w,h,count){
    const sp=h/(count+1);
    for(let i=0;i<count;i++){
      const wx=x+w/2-9,wy=y+sp*(i+1)-15;
      g.fillStyle(0x040e08);g.fillRect(wx,wy,18,22);g.fillCircle(wx+9,wy,9);
      g.fillStyle(0xFF8800,0.32);g.fillRect(wx+1,wy,16,22);
      g.fillStyle(0xFFCC44,0.18);g.fillRect(wx+3,wy+3,12,14);
      g.lineStyle(1,0x2a4030,0.6);g.strokeRect(wx,wy,18,22);
    }
  }

  _drawMoatReflection(){
    const{W,H}=this,g=this.add.graphics().setDepth(5),gY=H*0.74;
    g.fillStyle(0x1a3a28,0.10);g.fillRect(W/2-85,gY+7,170,18);
    g.fillStyle(0x0e2018,0.14);g.fillRect(W/2-52,gY+14,104,10);
    for(let i=0;i<7;i++){g.fillStyle(0x3a8a5a,0.22);g.fillRect(W/2-185+i*60+(Math.sin(i*7.3)*0.5+0.5)*18,gY+9,18,2);}
  }

  _spawnTorches(){
    const{W,H}=this,gY=H*0.74;
    [W/2-104,W/2+104,W/2-148,W/2+148].forEach((tx,i)=>this._makeTorch(tx,gY-98-(i>1?58:0)));
  }
  _makeTorch(x,y){
    const bg=this.add.graphics().setDepth(6);
    bg.fillStyle(0x4a3010);bg.fillRect(x-3,y-14,6,14);bg.fillStyle(0x888888);bg.fillRect(x-5,y-16,10,4);
    const fl=this.add.graphics().setDepth(7);let t=Math.random()*100;
    const draw=()=>{fl.clear();const f=0.85+Math.sin(t*0.09)*0.15;fl.fillStyle(0xFF6600,0.07*f);fl.fillCircle(x,y-26,23);fl.fillStyle(0xFF8800,0.13*f);fl.fillCircle(x,y-22,16);fl.fillStyle(0xFF4400,0.88*f);fl.fillTriangle(x-9,y-14,x+9,y-14,x,y-38*f);fl.fillStyle(0xFF9000,0.92*f);fl.fillTriangle(x-6,y-14,x+6,y-14,x,y-28*f);fl.fillStyle(0xFFDD44,0.78*f);fl.fillTriangle(x-3,y-14,x+3,y-14,x,y-20*f);t++;};
    draw();this.time.addEvent({delay:38,loop:true,callback:draw});
    const glow=this.add.graphics().setDepth(5);glow.fillStyle(0xFF8800,0.05);glow.fillCircle(x,y-20,44);
  }

  _spawnBanner(){
    const{W,H}=this,bx=W/2,by=H*0.74-390-76+8,ban=this.add.graphics().setDepth(8);let t=0;
    const draw=()=>{ban.clear();const s=Math.sin(t*0.7)*7,s2=Math.sin(t*0.7+0.9)*4;ban.fillStyle(0xC8A800);ban.fillRect(bx-2,by,4,62);ban.fillStyle(0x1a0066);ban.fillPoints([{x:bx+2,y:by+5},{x:bx+52+s,y:by+10+s*0.3},{x:bx+52+s2,y:by+48+s*0.2},{x:bx+2,y:by+42}],true);ban.fillStyle(0xFFD700);const ex=bx+28+s*0.5,ey=by+28;ban.fillTriangle(ex,ey-11,ex+9,ey,ex,ey+11);ban.fillTriangle(ex,ey-11,ex-9,ey,ex,ey+11);t+=0.025;};
    draw();this.time.addEvent({delay:30,loop:true,callback:draw});
  }

  _spawnMist(){
    const{W,H}=this,gY=H*0.74,g=this.add.graphics().setDepth(9),mists=[];
    for(let i=0;i<14;i++) mists.push({x:Math.random()*W,y:gY+8+Math.random()*28,w:55+Math.random()*90,spd:0.08+Math.random()*0.2,a:0.04+Math.random()*0.07,t:Math.random()*Math.PI*2});
    this.time.addEvent({delay:48,loop:true,callback:()=>{g.clear();mists.forEach(m=>{m.t+=0.02;m.x+=m.spd;if(m.x>W+m.w)m.x=-m.w;g.fillStyle(0x88CCAA,m.a*(0.8+Math.sin(m.t)*0.2));g.fillEllipse(m.x,m.y,m.w,12);});}});
  }

  _startEmbers(){
    const{W,H}=this,embers=[],gY=H*0.74;
    for(let i=0;i<22;i++) embers.push({x:W/2+(Math.random()-0.5)*230,y:gY-Math.random()*200,vy:-(0.28+Math.random()*0.58),vx:(Math.random()-0.5)*0.35,life:Math.random(),sz:1+Math.random()*1.5,col:Math.random()>0.5?0xFF8800:0xFFCC44});
    const pg=this.add.graphics().setDepth(9);
    this.time.addEvent({delay:33,loop:true,callback:()=>{pg.clear();embers.forEach(p=>{p.y+=p.vy;p.x+=p.vx;p.life-=0.007;if(p.life<=0){p.life=0.5+Math.random()*0.5;p.x=W/2+(Math.random()-0.5)*230;p.y=gY-Math.random()*30;}pg.fillStyle(p.col,p.life*0.65);pg.fillCircle(p.x,p.y,p.sz);});}});
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CHARACTER PARADE
  // ══════════════════════════════════════════════════════════════════════════
  _drawCharacterParade() {
    const { W, H } = this;
    const paradeY = H * 0.630;
    const count   = PARADE_IDS.length;
    const gap     = W / count;

    // Ground shadow strip
    const sg = this.add.graphics().setDepth(11);
    sg.fillStyle(0x000000, 0.28); sg.fillEllipse(W / 2, paradeY + 40, W * 0.94, 16);

    // Rarity glow colors for parade halos
    const RARITY_GLOW = { legendary: 0xFFD700, epic: 0xAA44FF, rare: 0x4488FF, common: 0x888888 };

    PARADE_IDS.forEach((charId, i) => {
      const cx = gap * i + gap / 2;
      const cy = paradeY + (i % 2 === 0 ? 0 : -10);
      const char = CHARACTERS?.[charId];
      const glowCol = RARITY_GLOW[char?.rarity] ?? 0x888888;

      // Team-color glow halo behind character
      const haloG = this.add.graphics().setDepth(11);
      haloG.fillStyle(glowCol, 0.18); haloG.fillEllipse(cx, cy + 8, 68, 32);
      haloG.fillStyle(glowCol, 0.10); haloG.fillEllipse(cx, cy + 4, 52, 48);

      // Character portrait — real hero art, aspect-fit to ~78px tall
      const pKey = cardTexKey(this, charId);
      let unitObj;
      if (pKey) {
        unitObj = this.add.image(cx, cy, pKey).setDepth(12);
        const src = this.textures.get(pKey).getSourceImage();
        const s = Math.min(64 / src.width, 78 / src.height);
        unitObj.setDisplaySize(src.width * s, src.height * s);
      } else {
        unitObj = this.add.graphics().setDepth(12);
        unitObj.x = cx; unitObj.y = cy;
        if (DRAW_FUNCS[charId]) DRAW_FUNCS[charId](unitObj);
        unitObj.setScale(0.65);
      }

      // Gentle bob tween
      this.tweens.add({
        targets: [unitObj, haloG], y: `-=7`,
        duration: 850 + i * 90, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });

      // Foot shadow
      const sh = this.add.graphics().setDepth(11);
      sh.fillStyle(0x000000, 0.28); sh.fillEllipse(cx, paradeY + 38, 36, 9);
    });

    this.add.text(W / 2, paradeY + 52, 'YOUR WARRIORS AWAIT', {
      fontSize: '9px', fill: '#5aaa6a', fontFamily: 'Arial', letterSpacing: 3
    }).setOrigin(0.5).setDepth(12);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // HUD ELEMENTS
  // ══════════════════════════════════════════════════════════════════════════
  _drawTopBar() {
    const { W } = this;
    const g = this.add.graphics().setDepth(12);
    g.fillStyle(0xFFD700); g.fillRect(12,7,12,10); g.fillRect(14,17,8,4); g.fillRect(11,20,14,3);
    const aG = this.add.graphics().setDepth(12);
    aG.fillStyle(0x1A44BB); aG.fillRoundedRect(36,5,26,19,4);
    this.add.text(49,14,'1',{fontSize:'11px',fill:'#FFFFFF',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0.5).setDepth(13);
    this.add.text(65,12,String(this.trophies),{fontSize:'17px',fill:'#FFFFFF',fontFamily:'Arial',fontStyle:'bold'}).setDepth(12);
    const xpG = this.add.graphics().setDepth(12);
    xpG.fillStyle(0x000000,0.7); xpG.fillRoundedRect(36,28,100,9,3);
    xpG.fillStyle(0x4499FF); xpG.fillRoundedRect(37,29,60,7,3);
    xpG.fillStyle(0xAADDFF,0.4); xpG.fillRoundedRect(37,29,22,4,2);
    this.add.text(W/2,14,this.username.toUpperCase(),{fontSize:'14px',fill:'#FFFFFF',fontFamily:'Arial',fontStyle:'bold',stroke:'#000000',strokeThickness:2}).setOrigin(0.5).setDepth(12);
    const goldG = this.add.graphics().setDepth(12);
    goldG.fillStyle(0x8B6914); goldG.fillRoundedRect(W-112,5,62,22,5);
    goldG.fillStyle(0xFFD700); goldG.fillRoundedRect(W-111,6,60,20,4);
    goldG.fillStyle(0xFFEE88,0.35); goldG.fillRoundedRect(W-109,7,28,9,3);
    this.add.text(W-106,10,'💰',{fontSize:'12px'}).setDepth(13);
    this.add.text(W-90,15,String(this.gold),{fontSize:'12px',fill:'#3D1F00',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0,0.5).setDepth(13);
    const gemG = this.add.graphics().setDepth(12);
    gemG.fillStyle(0x5A0070); gemG.fillRoundedRect(W-46,5,40,22,5);
    gemG.fillStyle(0xCC44FF); gemG.fillRoundedRect(W-45,6,38,20,4);
    this.add.text(W-40,10,'💎',{fontSize:'12px'}).setDepth(13);
    this.add.text(W-22,15,String(this.gems),{fontSize:'11px',fill:'#FFFFFF',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0,0.5).setDepth(13);
  }

  _drawProfileRow() {
    const { W, H } = this;
    const rowY = H * 0.083;
    const pg = this.add.graphics().setDepth(11);
    pg.fillStyle(0x000000,0.52); pg.fillRoundedRect(8,rowY,W-16,68,10);
    pg.lineStyle(1,0x2a4a3a,0.55); pg.strokeRoundedRect(8,rowY,W-16,68,10);
    pg.fillStyle(0x1a3a2a); pg.fillCircle(42,rowY+34,26);
    pg.fillStyle(0x2a5a3a); pg.fillCircle(42,rowY+34,22);
    pg.fillStyle(0xFFD700,0.7); pg.fillCircle(42,rowY+26,8);
    pg.fillStyle(0xFFD700,0.5); pg.fillEllipse(42,rowY+44,18,9);
    this.add.text(76,rowY+8,this.username,{fontSize:'16px',fill:'#FFFFFF',fontFamily:'Arial',fontStyle:'bold',stroke:'#000',strokeThickness:2}).setDepth(12);
    const bG = this.add.graphics().setDepth(12);
    bG.fillStyle(0x4499FF); bG.fillRoundedRect(76,rowY+30,34,17,5);
    this.add.text(93,rowY+38,'LVL 14',{fontSize:'10px',fill:'#FFFFFF',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0.5).setDepth(13);
    this.add.text(116,rowY+11,'🏆  '+this.trophies,{fontSize:'13px',fill:'#FFD700',fontFamily:'Arial'}).setDepth(12);
    this.add.text(W-18,rowY+13,'62%\nWIN RATE',{fontSize:'11px',fill:'#44FF88',fontFamily:'Arial',fontStyle:'bold',align:'right'}).setOrigin(1,0).setDepth(12);
    this.add.text(W-18,rowY+43,'128W  76L',{fontSize:'10px',fill:'#8899AA',fontFamily:'Arial',align:'right'}).setOrigin(1,0).setDepth(12);
  }

  _drawBattleBar() {
    const { W, H } = this;
    const rowY = H * 0.083;
    const bg = this.add.graphics().setDepth(11);
    bg.fillStyle(0x000000,0.52); bg.fillRoundedRect(8,rowY,W-16,130,12);
    bg.lineStyle(1,0x2a5a3a,0.45); bg.strokeRoundedRect(8,rowY,W-16,130,12);

    const bw = (W-32)*0.58;

    // ── BATTLE (1v1) — real carved button art ────────────────────────────────
    const useTS = this.textures.exists('btn_red3');
    let bb;
    if (useTS) {
      bb = this.add.image(16 + bw / 2, rowY + 28, 'btn_red3').setDepth(12).setDisplaySize(bw, 52);
    } else {
      bb = this.add.graphics().setDepth(12);
      bb.fillStyle(0xBB2200); bb.fillRoundedRect(16,rowY+8,bw,40,8);
      bb.fillStyle(0xFF4400); bb.fillRoundedRect(16,rowY+8,bw,34,8);
    }
    const btn = this.add.text(16+bw/2,rowY+26,'⚔  BATTLE',{fontSize:'21px',fill:'#FFFFFF',fontFamily:'Arial Black, Arial',fontStyle:'bold',stroke:'#551100',strokeThickness:4}).setOrigin(0.5).setDepth(13).setInteractive({useHandCursor:true});
    btn.on('pointerdown',()=>this._goCharSelect('1v1'));
    btn.on('pointerover',()=>{bb.setAlpha(0.82);btn.setScale(1.05);});
    btn.on('pointerout', ()=>{bb.setAlpha(1);btn.setScale(1);});
    // Repeating shimmer pan across BATTLE button every 3.5s
    const _shimmerBattle = () => {
      const sh = this.add.rectangle(16, rowY + 8, 28, 34, 0xFFFFFF, 0.28).setDepth(14).setOrigin(0,0);
      this.tweens.add({ targets: sh, x: 16 + bw, duration: 500, ease: 'Linear', onComplete: () => sh.destroy() });
      this.time.delayedCall(3500, _shimmerBattle);
    };
    this.time.delayedCall(1200, _shimmerBattle);

    // ── 2v2 ───────────────────────────────────────────────────────────────
    const bx2=16+bw+4, bw2=W-32-bw-4;
    if (useTS) {
      this.add.image(bx2 + bw2 / 2, rowY + 28, 'btn_blue3').setDepth(12).setDisplaySize(bw2, 52);
    } else {
      const bb2=this.add.graphics().setDepth(12);
      bb2.fillStyle(0x1a3a88); bb2.fillRoundedRect(bx2,rowY+8,bw2,40,8);
      bb2.fillStyle(0x3366CC); bb2.fillRoundedRect(bx2,rowY+8,bw2,34,8);
    }
    const btn2=this.add.text(bx2+bw2/2,rowY+26,'2v2',{fontSize:'18px',fill:'#FFFFFF',fontFamily:'Arial Black, Arial',fontStyle:'bold',stroke:'#113355',strokeThickness:4}).setOrigin(0.5).setDepth(13).setInteractive({useHandCursor:true});
    btn2.on('pointerdown',()=>this._goCharSelect('2v2'));

    // ── 🤖 vs BOT ────────────────────────────────────────────────────────
    const trg=this.add.graphics().setDepth(12);
    trg.fillStyle(0x1a4a1a); trg.fillRoundedRect(16,rowY+54,(W-32)*0.47,34,8);
    trg.fillStyle(0x2a7a2a); trg.fillRoundedRect(16,rowY+54,(W-32)*0.47,28,8);
    trg.fillStyle(0x44AA44,0.28); trg.fillRoundedRect(18,rowY+56,(W-32)*0.32,12,4);
    this.add.text(16+(W-32)*0.235,rowY+70,'🤖 vs BOT',{fontSize:'13px',fill:'#CCFFCC',fontFamily:'Arial',fontStyle:'bold',stroke:'#001100',strokeThickness:2}).setOrigin(0.5).setDepth(13).setInteractive({useHandCursor:true})
      .on('pointerdown',()=>this._goCharSelect('bot'));

    // ── 2v2 vs BOT ───────────────────────────────────────────────────────
    const bvx=16+(W-32)*0.50+4, bvw=(W-32)*0.50-4;
    const bvg=this.add.graphics().setDepth(12);
    bvg.fillStyle(0x1a3a6a); bvg.fillRoundedRect(bvx,rowY+54,bvw,34,8);
    bvg.fillStyle(0x2255aa); bvg.fillRoundedRect(bvx,rowY+54,bvw,28,8);
    bvg.fillStyle(0x4488dd,0.28); bvg.fillRoundedRect(bvx+2,rowY+56,bvw*0.65,12,4);
    this.add.text(bvx+bvw/2,rowY+70,'🤖 2v2 BOT',{fontSize:'13px',fill:'#AADDFF',fontFamily:'Arial',fontStyle:'bold',stroke:'#000a22',strokeThickness:2}).setOrigin(0.5).setDepth(13).setInteractive({useHandCursor:true})
      .on('pointerdown',()=>this._goCharSelect('2v2_bot'));

    // ── 🏆 RANKED PLAY — gold ribbon banner ───────────────────────────────
    let rkg;
    if (this.textures.exists('ribbon_yellow')) {
      rkg = this.add.image(W/2, rowY+108, 'ribbon_yellow').setDepth(12).setDisplaySize(W-24, 40);
    } else {
      rkg = this.add.graphics().setDepth(12);
      rkg.fillStyle(0x4a2a00); rkg.fillRoundedRect(16,rowY+94,W-32,28,8);
      rkg.fillStyle(0xaa6600); rkg.fillRoundedRect(16,rowY+94,W-32,22,8);
    }
    const rkBtn=this.add.text(W/2,rowY+105,'🏆  RANKED PLAY — Season 1',{fontSize:'13px',fill:'#5A3400',fontFamily:'Arial Black, Arial',fontStyle:'bold'}).setOrigin(0.5).setDepth(13).setInteractive({useHandCursor:true});
    rkBtn.on('pointerdown',()=>this._goCharSelect('ranked'));
    rkBtn.on('pointerover',()=>{rkg.setAlpha(0.85);rkBtn.setScale(1.03);});
    rkBtn.on('pointerout', ()=>{rkg.setAlpha(1);rkBtn.setScale(1);});
  }

  _goCharSelect(mode) {
    this.cameras.main.fadeOut(240,0,0,0);
    this.cameras.main.once('camerafadeoutcomplete',()=>this.scene.start('CharSelect',{mode}));
  }

  // ══════════════════════════════════════════════════════════════════════════
  // NAV BAR (fully functional)
  // ══════════════════════════════════════════════════════════════════════════
  _drawNavBar() {
    const { W, H } = this;
    const navY = H - 74;
    const ng = this.add.graphics().setDepth(14);
    ng.fillStyle(0x070d1a,0.96); ng.fillRect(0,navY,W,74);
    ng.fillStyle(0xFFFFFF,0.05);  ng.fillRect(0,navY,W,3);
    ng.lineStyle(1.5,0x2a4a7a,0.8); ng.lineBetween(0,navY,W,navY);

    const items = [
      { icon:'🏠', label:'HOME',     x:W*0.10, fn:()=>this._closePanel() },
      { icon:'🏰', label:'CLAN',     x:W*0.30, fn:()=>this._openPanel('social') },
      { icon:'🏪', label:'SHOP',     x:W*0.50, fn:()=>this._openPanel('shop') },
      { icon:'📊', label:'STATS',    x:W*0.70, fn:()=>this._openPanel('stats') },
      { icon:'⚙️', label:'SETTINGS', x:W*0.90, fn:()=>this._openPanel('settings') },
    ];
    this._navIndicator = this.add.graphics().setDepth(14);
    const _setInd = (x) => {
      this._navIndicator.clear();
      this._navIndicator.fillStyle(0x44FF88,0.9);  this._navIndicator.fillRoundedRect(x-22,navY+2,44,4,2);
      this._navIndicator.fillStyle(0x44FF88,0.10); this._navIndicator.fillRoundedRect(x-30,navY+2,60,68,10);
    };
    _setInd(W*0.10);

    items.forEach((it) => {
      const icon = this.add.text(it.x,navY+22,it.icon,{fontSize:'26px'}).setOrigin(0.5).setDepth(15);
      const lbl  = this.add.text(it.x,navY+52,it.label,{fontSize:'10px',fill:'#AFC4E0',fontFamily:'Arial Black, Arial',fontStyle:'bold'}).setOrigin(0.5).setDepth(15);
      // one big tap zone per tab (icon + label + padding)
      const zone = this.add.zone(it.x, navY+37, W*0.19, 74).setOrigin(0.5).setInteractive({useHandCursor:true}).setDepth(16);
      zone.on('pointerover',()=>{ icon.setScale(1.15); lbl.setColor('#FFFFFF'); });
      zone.on('pointerout', ()=>{ icon.setScale(1);    lbl.setColor('#AFC4E0'); });
      zone.on('pointerdown',()=>{ audioSystem.playClick?.(); it.fn(); _setInd(it.x); });
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // OVERLAY PANEL SYSTEM
  // ══════════════════════════════════════════════════════════════════════════
  _buildOverlays() {
    this._panels = {};
    this._buildSocialPanel();
    this._buildShopPanel();
    this._buildStatsPanel();
    this._buildSettingsPanel();
  }

  _openPanel(name) {
    this._closePanel();
    const panel = this._panels[name];
    if (!panel) return;
    this._activePanel = name;
    panel.setVisible(true).setAlpha(0);
    this.tweens.add({ targets: panel, alpha:1, y: panel._targetY, duration:280, ease:'Power2' });
    if (name === 'social') this._refreshClan();   // pull fresh clan data
  }

  _closePanel() {
    if (!this._activePanel) return;
    const panel = this._panels[this._activePanel];
    if (panel) {
      this.tweens.add({ targets: panel, alpha:0, y: panel._targetY+60, duration:220, ease:'Power2', onComplete:()=>panel.setVisible(false) });
    }
    this._activePanel = null;
    // Reset nav indicator to HOME
    const { W, H } = this;
    const navY = H - 74;
    this._navIndicator.clear();
    this._navIndicator.fillStyle(0x44FF88,0.9);  this._navIndicator.fillRoundedRect(W*0.10-22,navY+2,44,4,2);
    this._navIndicator.fillStyle(0x44FF88,0.10); this._navIndicator.fillRoundedRect(W*0.10-30,navY+2,60,68,10);
  }

  _makePanel(h) {
    const { W, H } = this;
    const targetY = H - 74 - h;
    const panel = this.add.container(0, targetY + 60).setDepth(80).setVisible(false);
    panel._targetY = targetY;
    // Rich card background: deep navy gradient + gold trim
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x101c34, 0x101c34, 0x060a16, 0x060a16, 0.98);
    bg.fillRoundedRect(0, 0, W, h, {tl:18,tr:18,bl:0,br:0});
    bg.fillStyle(0xFFFFFF, 0.05); bg.fillRoundedRect(3, 3, W-6, 42, {tl:15,tr:15,bl:0,br:0});
    bg.lineStyle(2, 0xC8A23A, 0.75); bg.strokeRoundedRect(1, 1, W-2, h, {tl:18,tr:18,bl:0,br:0});
    // Handle bar
    bg.fillStyle(0xC8A23A, 0.6); bg.fillRoundedRect(W/2-26, 8, 52, 5, 2.5);
    // Close button — big circular target
    const closeG = this.add.graphics();
    closeG.fillStyle(0x3a1020, 0.95); closeG.fillCircle(W-26, 24, 15);
    closeG.lineStyle(2, 0xFF6677, 0.9); closeG.strokeCircle(W-26, 24, 15);
    const close = this.add.text(W-26, 24, '✕', {fontSize:'16px', fill:'#FFAABB', fontFamily:'Arial Black, Arial', fontStyle:'bold'}).setOrigin(0.5);
    const closeZone = this.add.zone(W-26, 24, 46, 46).setOrigin(0.5).setInteractive({useHandCursor:true});
    closeZone.on('pointerdown',()=>this._closePanel());
    panel.add([bg, closeG, close, closeZone]);
    return panel;
  }

  // ── CLAN PANEL (My Clan · Find · Global Scroll chat) ──────────────────────
  _buildSocialPanel() {
    const { W } = this;
    const panel = this._makePanel(560);
    this._panels.social = panel;
    this._clanTab = 'mine';

    const title = this.add.text(W/2,28,'🏰  CLANS',{fontSize:'22px',fill:'#44FF88',fontFamily:'Arial Black, Arial',fontStyle:'bold',stroke:'#000',strokeThickness:3}).setOrigin(0.5);
    panel.add(title);

    // Sub-tabs
    const tabs = [['mine','🏰 MY CLAN'],['find','🔎 FIND'],['global','📜 GLOBAL']];
    this._clanTabObjs = [];
    tabs.forEach(([key,label],i) => {
      const x = 14 + i*((W-28)/3), tw2 = (W-28)/3 - 6;
      const g = this.add.graphics();
      const t = this.add.text(x+tw2/2, 63, label, {fontSize:'12px', fill:'#9FB2D8', fontFamily:'Arial Black, Arial', fontStyle:'bold'}).setOrigin(0.5);
      const z = this.add.zone(x+tw2/2, 63, tw2, 34).setOrigin(0.5).setInteractive({useHandCursor:true});
      z.on('pointerdown', () => { audioSystem.playClick(); this._clanTab = key; this._refreshClan(); });
      panel.add([g,t,z]);
      this._clanTabObjs.push({ key, g, t, x, tw2 });
    });

    // Dynamic content container
    this._clanContent = this.add.container(0, 0);
    panel.add(this._clanContent);

    // Live global chat updates
    socketManager.on?.('global_msg', () => {
      if (this._activePanel === 'social' && this._clanTab === 'global') this._refreshClan();
    });
  }

  async _capi(path, body) {
    const token = this.registry.get('token') || localStorage.getItem('bb_token');
    const res = await fetch(path, {
      method: body ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: body ? JSON.stringify(body) : undefined
    });
    return res.json().catch(() => ({}));
  }

  async _refreshClan() {
    // Tab highlight
    for (const o of this._clanTabObjs) {
      const on = o.key === this._clanTab;
      o.g.clear();
      o.g.fillStyle(on ? 0x1E5A38 : 0x0d1730, 0.95); o.g.fillRoundedRect(o.x, 46, o.tw2, 34, 9);
      o.g.lineStyle(1.5, on ? 0x44FF88 : 0x2a3a5a, 0.9); o.g.strokeRoundedRect(o.x, 46, o.tw2, 34, 9);
      o.t.setColor(on ? '#FFFFFF' : '#9FB2D8');
    }
    this._clanContent.removeAll(true);
    const { W } = this;
    const C = this._clanContent;
    const txt  = (x,y,s,st) => { const t = this.add.text(x,y,s,st); C.add(t); return t; };
    const box  = (x,y,w,h,col,a=0.95) => { const g = this.add.graphics(); g.fillStyle(0x0d1730,a); g.fillRoundedRect(x,y,w,h,10); g.lineStyle(1.5,col,0.7); g.strokeRoundedRect(x,y,w,h,10); C.add(g); return g; };
    const btn  = (x,y,w,h,label,col,cb) => {
      const g = this.add.graphics();
      g.fillStyle(col,0.92); g.fillRoundedRect(x,y,w,h,9);
      g.fillStyle(0xFFFFFF,0.15); g.fillRoundedRect(x+2,y+2,w-4,h*0.4,7);
      const t = this.add.text(x+w/2,y+h/2,label,{fontSize:'13px',fill:'#FFFFFF',fontFamily:'Arial Black, Arial',fontStyle:'bold',stroke:'#000',strokeThickness:2}).setOrigin(0.5);
      const z = this.add.zone(x+w/2,y+h/2,w+8,h+8).setOrigin(0.5).setInteractive({useHandCursor:true});
      z.on('pointerdown',()=>{ audioSystem.playClick(); cb(); });
      C.add([g,t,z]);
    };
    const Y = 94;

    if (this._clanTab === 'mine') {
      const d = await this._capi('/clans/mine');
      if (!d.clan) {
        txt(W/2, Y+40, 'You are not in a clan yet.', {fontSize:'15px',fill:'#AFC4E0',fontFamily:'Arial'}).setOrigin(0.5);
        txt(W/2, Y+64, 'Join one, or found your own for 1000 gold.', {fontSize:'12px',fill:'#7A93C4',fontFamily:'Arial'}).setOrigin(0.5);
        btn(W/2-150, Y+95, 140, 44, '➕ CREATE (1000🪙)', 0x2E9E6B, async () => {
          const name = window.prompt('Clan name (3-24 chars):');
          if (!name) return;
          const r = await this._capi('/clans/create', { name });
          this._flashMsg(r.error || 'Clan founded! 🏰'); this._refreshClan();
        });
        btn(W/2+10, Y+95, 140, 44, '🔎 FIND A CLAN', 0x3366CC, () => { this._clanTab='find'; this._refreshClan(); });
        return;
      }
      // Header
      box(12, Y, W-24, 54, 0x44FF88);
      txt(24, Y+9, `${d.clan.badge}  ${d.clan.name}`, {fontSize:'17px',fill:'#FFFFFF',fontFamily:'Arial Black, Arial',fontStyle:'bold'});
      txt(24, Y+33, `👥 ${d.members.length}/${d.maxMembers}   ·   ⚔ ${d.clan.war_wins} war wins   ·   you: ${d.clan.role}`, {fontSize:'11px',fill:'#9FB2D8',fontFamily:'Arial'});
      // War block
      const wy = Y+62;
      if (d.war && d.war.state === 'active') {
        box(12, wy, W-24, 74, 0xD9A21B);
        txt(24, wy+8, `⚔ SIEGE WAR vs ${d.war.rival}`, {fontSize:'13px',fill:'#FFD700',fontFamily:'Arial Black, Arial',fontStyle:'bold'});
        const hrs = Math.max(0, Math.round((d.war.ends_at - Date.now()/1000)/360)/10);
        txt(W-24, wy+8, `${hrs}h left`, {fontSize:'11px',fill:'#C9B577',fontFamily:'Arial'}).setOrigin(1,0);
        // score bars
        const bw2 = W-72, bx = 24;
        const bars = this.add.graphics(); C.add(bars);
        bars.fillStyle(0x1a2440); bars.fillRoundedRect(bx, wy+30, bw2, 10, 5);
        bars.fillStyle(0x44FF88); bars.fillRoundedRect(bx, wy+30, Math.max(4, bw2*Math.min(1,d.war.our_score/d.war.goal)), 10, 5);
        bars.fillStyle(0x1a2440); bars.fillRoundedRect(bx, wy+48, bw2, 10, 5);
        bars.fillStyle(0xE05C2A); bars.fillRoundedRect(bx, wy+48, Math.max(4, bw2*Math.min(1,d.war.their_score/d.war.goal)), 10, 5);
        txt(W-24, wy+27, `US ${d.war.our_score}`, {fontSize:'10px',fill:'#44FF88',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(1,0);
        txt(W-24, wy+45, `${d.war.rival} ${d.war.their_score}`, {fontSize:'10px',fill:'#E88A6A',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(1,0);
        txt(24, wy+60, `First to ${d.war.goal}! Crowns you win in battle = siege points · pot ${d.war.pot_gold}🪙`, {fontSize:'9px',fill:'#8FA4D8',fontFamily:'Arial'});
      } else if (d.war && (d.war.state === 'won' || d.war.state === 'lost')) {
        box(12, wy, W-24, 40, d.war.state === 'won' ? 0x44FF88 : 0xE05C2A);
        txt(W/2, wy+20, d.war.state === 'won' ? `🏆 WAR WON vs ${d.war.rival} — gold paid out!` : `💀 War lost vs ${d.war.rival}...`,
          {fontSize:'13px',fill: d.war.state==='won' ? '#44FF88' : '#E88A6A',fontFamily:'Arial Black, Arial',fontStyle:'bold'}).setOrigin(0.5);
        btn(W/2-70, wy+48, 140, 34, '⚔ NEW WAR', 0xB8341B, async () => {
          const r = await this._capi('/clans/war/start', {});
          this._flashMsg(r.error || 'Siege War started!'); this._refreshClan();
        });
      } else {
        btn(24, wy, W-48, 40, '⚔ START SIEGE WAR (24h)', 0xB8341B, async () => {
          const r = await this._capi('/clans/war/start', {});
          this._flashMsg(r.error || 'Siege War started!'); this._refreshClan();
        });
      }
      // Members (top 6 by wins)
      const my2 = wy + (d.war && d.war.state === 'active' ? 82 : (d.war ? 92 : 48));
      txt(24, my2, 'MEMBERS', {fontSize:'10px',fill:'#7A93C4',fontFamily:'Arial Black, Arial',fontStyle:'bold'});
      d.members.slice(0, 6).forEach((m, i) => {
        const yy = my2 + 16 + i*22;
        txt(24, yy, `${m.role==='leader'?'👑':'•'} ${m.username}`, {fontSize:'12px',fill:'#FFFFFF',fontFamily:'Arial'});
        txt(W-24, yy, `${m.wins || 0} wins`, {fontSize:'11px',fill:'#9FB2D8',fontFamily:'Arial'}).setOrigin(1,0);
      });
      if (d.members.length > 6) txt(24, my2+16+6*22, `…and ${d.members.length-6} more`, {fontSize:'10px',fill:'#7A93C4',fontFamily:'Arial'});
      // Chat (last 4)
      const cy2 = my2 + 16 + Math.min(6, d.members.length)*22 + (d.members.length>6?18:6);
      txt(24, cy2, 'CLAN CHAT', {fontSize:'10px',fill:'#7A93C4',fontFamily:'Arial Black, Arial',fontStyle:'bold'});
      d.chat.slice(-4).forEach((c, i) => {
        txt(24, cy2+16+i*18, `${c.username}: ${c.message}`.slice(0, 52), {fontSize:'11px',fill:'#CFE0FF',fontFamily:'Arial'});
      });
      btn(24, 466, (W-58)/2, 38, '✍ SEND MESSAGE', 0x3366CC, async () => {
        const m = window.prompt('Message to your clan:');
        if (!m) return;
        await this._capi('/clans/chat', { message: m }); this._refreshClan();
      });
      btn(34 + (W-58)/2, 466, (W-58)/2, 38, '🚪 LEAVE CLAN', 0x8A2A2A, async () => {
        if (!window.confirm('Leave this clan?')) return;
        await this._capi('/clans/leave', {}); this._refreshClan();
      });

    } else if (this._clanTab === 'find') {
      const d = await this._capi('/clans');
      btn(24, Y, W-48, 40, '➕ CREATE YOUR OWN CLAN (1000🪙)', 0x2E9E6B, async () => {
        const name = window.prompt('Clan name (3-24 chars):');
        if (!name) return;
        const r = await this._capi('/clans/create', { name });
        this._flashMsg(r.error || 'Clan founded! 🏰');
        if (!r.error) { this._clanTab='mine'; } this._refreshClan();
      });
      if (!d.clans?.length) txt(W/2, Y+90, 'No clans yet — be the first founder!', {fontSize:'13px',fill:'#9FB2D8',fontFamily:'Arial'}).setOrigin(0.5);
      (d.clans || []).slice(0, 6).forEach((c, i) => {
        const yy = Y + 52 + i*58;
        box(12, yy, W-24, 50, 0x3366CC, 0.9);
        txt(24, yy+8, `${c.badge}  ${c.name}`, {fontSize:'14px',fill:'#FFFFFF',fontFamily:'Arial Black, Arial',fontStyle:'bold'});
        txt(24, yy+29, `👥 ${c.members}/35 · ⚔ ${c.war_wins} war wins`, {fontSize:'10px',fill:'#9FB2D8',fontFamily:'Arial'});
        if (!d.mine && c.members < 35) {
          btn(W-96, yy+9, 72, 32, 'JOIN', 0x2E9E6B, async () => {
            const r = await this._capi('/clans/join', { clanId: c.id });
            this._flashMsg(r.error || `Joined ${c.name}! 🏰`);
            if (!r.error) this._clanTab = 'mine';
            this._refreshClan();
          });
        }
      });

    } else { // global scroll chat
      const d = await this._capi('/clans/global');
      box(12, Y, W-24, 46, 0xC9B078);
      txt(24, Y+14, `📜 Chat Scrolls: ${d.scrolls ?? 0}`, {fontSize:'14px',fill:'#E8D5A0',fontFamily:'Arial Black, Arial',fontStyle:'bold'});
      btn(W-160, Y+7, 136, 32, '📜 POST GLOBAL', 0xB8862A, async () => {
        if (!(d.scrolls > 0)) { this._flashMsg('No scrolls! Win them in loot chests.'); return; }
        const m = window.prompt('Your GLOBAL message (everyone sees it!):');
        if (!m) return;
        const r = await this._capi('/clans/global', { message: m });
        this._flashMsg(r.error || 'Message sent to the whole realm! 📜');
        this._refreshClan();
      });
      txt(24, Y+56, 'REALM FEED — recruit for your clan here!', {fontSize:'10px',fill:'#7A93C4',fontFamily:'Arial Black, Arial',fontStyle:'bold'});
      const msgs = (d.messages || []).slice(-11);
      if (!msgs.length) txt(W/2, Y+110, 'No messages yet. Be the first voice in the realm!', {fontSize:'12px',fill:'#9FB2D8',fontFamily:'Arial'}).setOrigin(0.5);
      msgs.forEach((m, i) => {
        const yy = Y + 74 + i*30;
        txt(24, yy, `${m.username}${m.clan_name ? ' ['+m.clan_name+']' : ''}`, {fontSize:'11px',fill:'#FFD700',fontFamily:'Arial',fontStyle:'bold'});
        txt(24, yy+13, m.message.slice(0, 58), {fontSize:'11px',fill:'#CFE0FF',fontFamily:'Arial'});
      });
    }
  }

  // ── SHOP PANEL ────────────────────────────────────────────────────────────
  _buildShopPanel() {
    const { W } = this;
    const panel = this._makePanel(520);
    this._panels.shop = panel;

    const title = this.add.text(W/2,30,'🏪  SHOP',{fontSize:'22px',fill:'#FFD700',fontFamily:'Arial Black, Arial',fontStyle:'bold',stroke:'#000',strokeThickness:3}).setOrigin(0.5);
    panel.add(title);

    const items = [
      { icon:'⚗️',  name:'XP Potion',      desc:'Boost one character +200 XP',  cost:300,  gem:false, color:0x3366CC },
      { icon:'⚡',  name:'Elixir Flask',    desc:'Double elixir for next match', cost:150,  gem:false, color:0x9933CC },
      { icon:'🛡️',  name:'Shield Charm',    desc:'+15% tower HP next battle',    cost:500,  gem:false, color:0x2E86AB },
      { icon:'🃏',  name:'Card Pack (x5)',  desc:'5 random character cards',     cost:800,  gem:false, color:0xCC8800 },
      { icon:'💎',  name:'Gem Bundle x50',  desc:'50 Gems added to account',     cost:250,  gem:true,  color:0xAA33CC },
      { icon:'🔓',  name:'Unlock Slot',     desc:'Unlock 1 mystery character',   cost:1500, gem:false, color:0x55AA33 },
      { icon:'📜',  name:'Chat Scroll',     desc:'Post 1 message to GLOBAL chat', cost:400, gem:false, scroll:true, color:0xC9B078 },
    ];

    // ── One large row per item, in a scrollable masked list ─────────────────
    const PANEL_H = 520, LIST_TOP = 56, ROW_H = 96, PAD = 12;
    const listH = PANEL_H - LIST_TOP - 10;
    const list = this.add.container(0, 0);
    panel.add(list);

    items.forEach((item, i) => {
      const y = i * (ROW_H + PAD), iw = W - 28, x = 14;
      const bg = this.add.graphics();
      // Card: colored left accent + dark body + soft top shine
      bg.fillStyle(0x0d1730, 0.96); bg.fillRoundedRect(x, y, iw, ROW_H, 14);
      bg.fillStyle(item.color, 0.22); bg.fillRoundedRect(x, y, iw, ROW_H, 14);
      bg.fillStyle(item.color, 0.9);  bg.fillRoundedRect(x, y, 7, ROW_H, { tl: 14, bl: 14, tr: 0, br: 0 });
      bg.fillStyle(0xFFFFFF, 0.06);   bg.fillRoundedRect(x + 3, y + 3, iw - 6, ROW_H * 0.4, 11);
      bg.lineStyle(2, item.color, 0.75); bg.strokeRoundedRect(x, y, iw, ROW_H, 14);
      // Icon chip
      const chip = this.add.graphics();
      chip.fillStyle(item.color, 0.35); chip.fillRoundedRect(x + 16, y + 18, 60, 60, 12);
      chip.lineStyle(1.5, item.color, 0.9); chip.strokeRoundedRect(x + 16, y + 18, 60, 60, 12);
      const icon = this.add.text(x + 46, y + 48, item.icon, { fontSize: '32px' }).setOrigin(0.5);
      // Name + description — big and readable
      const name = this.add.text(x + 90, y + 20, item.name, { fontSize: '17px', fill: '#FFFFFF', fontFamily: 'Arial Black, Arial', fontStyle: 'bold' });
      const desc = this.add.text(x + 90, y + 46, item.desc, { fontSize: '12px', fill: '#9FB2D8', fontFamily: 'Arial', wordWrap: { width: iw - 190 } });
      // Big BUY price pill on the right
      const pw = 86, ph2 = 34, pxx = x + iw - pw - 14, pyy = y + ROW_H / 2 - ph2 / 2;
      const buyBg = this.add.graphics();
      const bCol = item.gem ? 0x8822CC : 0xD99A1B;
      buyBg.fillStyle(item.gem ? 0x5A1188 : 0x8A5E00); buyBg.fillRoundedRect(pxx, pyy + 3, pw, ph2, 10);
      buyBg.fillStyle(bCol); buyBg.fillRoundedRect(pxx, pyy, pw, ph2 - 3, 10);
      buyBg.fillStyle(0xFFFFFF, 0.22); buyBg.fillRoundedRect(pxx + 3, pyy + 3, pw - 6, 11, 6);
      const costLabel = this.add.text(pxx + pw / 2, pyy + ph2 / 2 - 2, (item.gem ? '💎 ' : '🪙 ') + item.cost, { fontSize: '14px', fill: '#FFFFFF', fontFamily: 'Arial Black, Arial', fontStyle: 'bold', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5);
      const buyZone = this.add.zone(pxx + pw / 2, pyy + ph2 / 2, pw + 14, ph2 + 14).setOrigin(0.5).setInteractive({ useHandCursor: true });
      buyZone.on('pointerover', () => costLabel.setScale(1.08));
      buyZone.on('pointerout',  () => costLabel.setScale(1));
      buyZone.on('pointerdown', async () => {
        if (item.scroll) {
          // Real server purchase — banks a Global Chat Scroll
          const r = await this._capi('/clans/items/buy', {});
          if (r.error) return this._flashMsg(r.error);
          this.gold = r.gold; localStorage.setItem('bb_gold', String(r.gold));
          audioSystem.playClick();
          return this._flashMsg('Chat Scroll added! 📜 (see CLAN → GLOBAL)');
        }
        if (this.gold >= item.cost || item.gem) {
          if (!item.gem) { this.gold -= item.cost; localStorage.setItem('bb_gold', String(this.gold)); }
          audioSystem.playClick();
          this._flashMsg(item.name + ' purchased!');
        } else this._flashMsg('Not enough gold!');
      });
      list.add([bg, chip, icon, name, desc, buyBg, costLabel, buyZone]);
    });

    // Mask the list to the panel body (screen-space at the panel's final Y)
    const { H } = this;
    const panelTop = H - 74 - PANEL_H;
    list.y = LIST_TOP;
    const mshape = this.make.graphics({ add: false });
    mshape.fillStyle(0xffffff); mshape.fillRect(0, panelTop + LIST_TOP, W, listH);
    list.setMask(mshape.createGeometryMask());
    // Drag scrolling
    const contentH = items.length * (ROW_H + PAD);
    const maxScroll = Math.max(0, contentH - listH + 8);
    const scrollZone = this.add.zone(W / 2, LIST_TOP + listH / 2, W, listH).setOrigin(0.5).setInteractive();
    panel.add(scrollZone);
    panel.sendToBack(scrollZone);   // keep BUY buttons on top for taps
    let lastY = null;
    scrollZone.on('pointerdown', (p) => { lastY = p.y; });
    scrollZone.on('pointermove', (p) => {
      if (lastY == null || !p.isDown) return;
      list.y = Phaser.Math.Clamp(list.y + (p.y - lastY), LIST_TOP - maxScroll, LIST_TOP);
      lastY = p.y;
    });
    scrollZone.on('pointerup', () => { lastY = null; });
    // Desktop mouse-wheel scrolling
    this.input.on('wheel', (_p, _o, _dx, dy) => {
      if (this._activePanel !== 'shop') return;
      list.y = Phaser.Math.Clamp(list.y - dy * 0.5, LIST_TOP - maxScroll, LIST_TOP);
    });
    if (maxScroll > 0) {
      const hint = this.add.text(W / 2, PANEL_H - 16, '▾ scroll for more ▾', { fontSize: '10px', fill: '#5B6B9A', fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5);
      panel.add(hint);
    }
  }

  // ── STATS PANEL ───────────────────────────────────────────────────────────
  _buildStatsPanel() {
    const { W } = this;
    const panel = this._makePanel(480);
    this._panels.stats = panel;

    const title = this.add.text(W/2,30,'📊  BATTLE STATS',{fontSize:'22px',fill:'#88CCFF',fontFamily:'Arial Black, Arial',fontStyle:'bold',stroke:'#000',strokeThickness:3}).setOrigin(0.5);
    panel.add(title);

    // ── Hero header: trophy count + win-rate donut ───────────────────────────
    const hd = this.add.graphics();
    hd.fillGradientStyle(0x2a3f7a, 0x2a3f7a, 0x14204a, 0x14204a, 1);
    hd.fillRoundedRect(12, 54, W-24, 118, 14);
    hd.lineStyle(2, 0xFFD700, 0.55); hd.strokeRoundedRect(12, 54, W-24, 118, 14);
    hd.fillStyle(0xFFFFFF, 0.06); hd.fillRoundedRect(15, 57, W-30, 40, 11);
    // trophy block (left)
    const tIcon = this.add.text(46, 96, '🏆', { fontSize: '34px' }).setOrigin(0.5);
    const tNum  = this.add.text(76, 84, this.trophies.toLocaleString(), { fontSize:'30px', fill:'#FFD700', fontFamily:'Arial Black, Arial', fontStyle:'bold', stroke:'#000', strokeThickness:3 });
    const tLbl  = this.add.text(78, 118, 'TROPHIES  ·  GOLD LEAGUE', { fontSize:'10px', fill:'#C9B577', fontFamily:'Arial', fontStyle:'bold', letterSpacing:1 });
    const tBest = this.add.text(78, 138, 'Season best: 1,480   ·   Rank #847 (Top 12%)', { fontSize:'11px', fill:'#8FA4D8', fontFamily:'Arial' });
    // win-rate donut (right)
    const dX = W-72, dY = 113, R = 34, winPct = 0.62;
    const donut = this.add.graphics();
    donut.lineStyle(11, 0x1a2440, 1); donut.beginPath(); donut.arc(dX, dY, R, 0, Math.PI*2); donut.strokePath();
    donut.lineStyle(11, 0x44FF88, 1); donut.beginPath();
    donut.arc(dX, dY, R, -Math.PI/2, -Math.PI/2 + Math.PI*2*winPct); donut.strokePath();
    const dTxt = this.add.text(dX, dY-6, '62%', { fontSize:'17px', fill:'#44FF88', fontFamily:'Arial Black, Arial', fontStyle:'bold' }).setOrigin(0.5);
    const dLbl = this.add.text(dX, dY+12, 'WIN RATE', { fontSize:'8px', fill:'#7A93C4', fontFamily:'Arial', fontStyle:'bold' }).setOrigin(0.5);
    panel.add([hd, tIcon, tNum, tLbl, tBest, donut, dTxt, dLbl]);

    // ── Colorful stat tiles ──────────────────────────────────────────────────
    const tiles = [
      ['⚔️','Battles','204',0x3366CC], ['👑','Crowns','586',0xD9A21B],
      ['🔥','Best Streak','8 wins',0xE05C2A], ['🛡️','Towers Broken','311',0x2E9E6B],
      ['⭐','Fav. Character','Titan Grunt',0x9B59B6], ['⏱️','Avg. Battle','2:41',0x2E86AB],
    ];
    tiles.forEach(([ic,label,val,col],i) => {
      const row=Math.floor(i/2), c=i%2;
      const x=12+c*((W-24)/2+4), y=184+row*66, tw=(W-28)/2, th=58;
      const g=this.add.graphics();
      g.fillStyle(0x0d1730,0.95); g.fillRoundedRect(x,y,tw,th,10);
      g.fillStyle(col,0.20); g.fillRoundedRect(x,y,tw,th,10);
      g.fillStyle(col,0.9);  g.fillRoundedRect(x,y,5,th,{tl:10,bl:10,tr:0,br:0});
      g.lineStyle(1.5,col,0.7); g.strokeRoundedRect(x,y,tw,th,10);
      const icon=this.add.text(x+22,y+th/2,ic,{fontSize:'20px'}).setOrigin(0.5);
      const lbl=this.add.text(x+42,y+10,label,{fontSize:'10px',fill:'#9FB2D8',fontFamily:'Arial',fontStyle:'bold'});
      const v=this.add.text(x+42,y+26,val,{fontSize:'16px',fill:'#FFFFFF',fontFamily:'Arial Black, Arial',fontStyle:'bold'});
      panel.add([g,icon,lbl,v]);
    });

    // ── Season banner ────────────────────────────────────────────────────────
    let sb;
    if (this.textures.exists('ribbon_yellow')) {
      sb = this.add.image(W/2, 316+96+8, 'ribbon_yellow').setDisplaySize(W-40, 44);
    } else {
      sb = this.add.graphics();
      sb.fillStyle(0x4a2a00,0.9); sb.fillRoundedRect(16,398,W-32,40,10);
    }
    const sTxt = this.add.text(W/2, 316+96+5, '🏆 SEASON 1 — ends in 12 days', { fontSize:'13px', fill:'#5A3400', fontFamily:'Arial Black, Arial', fontStyle:'bold' }).setOrigin(0.5);
    panel.add([sb, sTxt]);
  }

  // ── SETTINGS PANEL ────────────────────────────────────────────────────────
  _buildSettingsPanel() {
    const { W } = this;
    const panel = this._makePanel(480);
    this._panels.settings = panel;

    const title = this.add.text(W/2,32,'⚙️  SETTINGS',{fontSize:'18px',fill:'#AABBCC',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0.5);
    panel.add(title);

    // ── Toggles (Music, Sound FX) — wired to audioSystem ─────────────────
    const toggles = [
      { label:'Music',    state:audioSystem.musicEnabled, on:(v)=>audioSystem.setMusicEnabled(v) },
      { label:'Sound FX', state:audioSystem.sfxEnabled,   on:(v)=>audioSystem.setSfxEnabled(v) },
    ];
    toggles.forEach((opt,i) => {
      const y = 64 + i*62;
      const bg = this.add.graphics();
      bg.fillStyle(0x0a1e14,0.8); bg.fillRoundedRect(12,y,W-24,50,8);
      bg.lineStyle(1,0x2a4a3a,0.4); bg.strokeRoundedRect(12,y,W-24,50,8);
      const lbl = this.add.text(28,y+25,opt.label,{fontSize:'14px',fill:'#AABBCC',fontFamily:'Arial'}).setOrigin(0,0.5);
      const tog = this.add.graphics();
      const drawTog = (on) => {
        tog.clear();
        tog.fillStyle(on?0x44FF88:0x334455); tog.fillRoundedRect(W-72,y+14,52,22,11);
        tog.fillStyle(0xFFFFFF); tog.fillCircle(on?W-30:W-62,y+25,9);
      };
      drawTog(opt.state);
      const zone = this.add.zone(W-46,y+25,52,22).setInteractive({useHandCursor:true});
      zone.on('pointerdown',()=>{
        opt.state = !opt.state;
        drawTog(opt.state);
        opt.on(opt.state);
        // If re-enabling music, restart the current track
        if (opt.label==='Music' && opt.state) audioSystem.playTrack('battle_hymn');
      });
      panel.add([bg,lbl,tog,zone]);
    });

    // ── Music track selector ──────────────────────────────────────────────
    const trackY = 196;
    const trackBg = this.add.graphics();
    trackBg.fillStyle(0x0a1e14,0.8); trackBg.fillRoundedRect(12,trackY,W-24,170,8);
    trackBg.lineStyle(1,0x2a4a3a,0.4); trackBg.strokeRoundedRect(12,trackY,W-24,170,8);
    const trackTitle = this.add.text(W/2,trackY+14,'🎵  MUSIC TRACK',{fontSize:'11px',fill:'#667788',fontFamily:'Arial',letterSpacing:2}).setOrigin(0.5);
    panel.add([trackBg,trackTitle]);

    const tracks = [
      { key:'battle_hymn',  label:'Battle Hymn',  sub:'Peaceful · D Major · 76 BPM',  color:0x2244aa },
      { key:'ember_rush',   label:'Ember Rush',   sub:'Energetic · A Minor · 138 BPM', color:0xaa4400 },
      { key:'frost_crown',  label:'Frost Crown',  sub:'Atmospheric · D Minor · 124 BPM',color:0x2266aa },
    ];
    let activeTrack = audioSystem.currentTrackName || 'battle_hymn';
    const trackDots = [];

    tracks.forEach((tr, i) => {
      const ty = trackY + 34 + i * 42;
      const rowBg = this.add.graphics();
      const dot = this.add.graphics();
      const drawRow = (active) => {
        rowBg.clear(); dot.clear();
        rowBg.fillStyle(active?tr.color:0x0a1014, active?0.35:0.5);
        rowBg.fillRoundedRect(20,ty,W-40,34,6);
        if (active) { rowBg.lineStyle(1.5,tr.color,0.8); rowBg.strokeRoundedRect(20,ty,W-40,34,6); }
        dot.fillStyle(active?0x44FF88:0x334455); dot.fillCircle(36,ty+17,7);
        if (active) { dot.fillStyle(0xFFFFFF); dot.fillCircle(36,ty+17,3.5); }
      };
      drawRow(activeTrack === tr.key);
      trackDots.push({ key:tr.key, draw:drawRow });

      const nameTxt = this.add.text(52,ty+8,tr.label,{fontSize:'13px',fill:'#FFFFFF',fontFamily:'Arial',fontStyle:'bold'});
      const subTxt  = this.add.text(52,ty+24,tr.sub,{fontSize:'9px',fill:'#778899',fontFamily:'Arial'});

      const zone = this.add.zone(W/2,ty+17,W-40,34).setInteractive({useHandCursor:true});
      zone.on('pointerdown',()=>{
        activeTrack = tr.key;
        trackDots.forEach(d => d.draw(d.key === activeTrack));
        audioSystem.playTrack(tr.key);
      });
      panel.add([rowBg,dot,nameTxt,subTxt,zone]);
    });

    // ── Sign out ──────────────────────────────────────────────────────────
    const soBg = this.add.graphics();
    soBg.fillStyle(0x660000); soBg.fillRoundedRect(W/2-70,408,140,38,8);
    const soBtn = this.add.text(W/2,427,'SIGN OUT',{fontSize:'14px',fill:'#FFFFFF',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0.5).setInteractive({useHandCursor:true});
    soBtn.on('pointerdown',()=>{ localStorage.clear(); this.scene.start('Auth'); });
    panel.add([title,soBg,soBtn]);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // INVITE POPUP
  // ══════════════════════════════════════════════════════════════════════════
  _buildInviteContainer() {
    const { W } = this;
    this._inviteCont = this.add.container(W/2,-120).setDepth(90);
    const bg = this.add.rectangle(0,0,320,90,0x0a1e2a,0.97).setStrokeStyle(2,0x44FF88);
    const title = this.add.text(0,-24,'⚔  BATTLE INVITATION',{fontSize:'13px',fill:'#FFD700',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0.5);
    this._inviteText = this.add.text(0,4,'',{fontSize:'13px',fill:'#FFFFFF',fontFamily:'Arial'}).setOrigin(0.5);
    const accept  = this.add.text(-60,28,'[ ACCEPT ]', {fontSize:'12px',fill:'#44FF88',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0.5).setInteractive({useHandCursor:true}).on('pointerdown',()=>this._acceptInvite());
    const decline = this.add.text(60,28,'[ DECLINE ]',{fontSize:'12px',fill:'#FF4444',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0.5).setInteractive({useHandCursor:true}).on('pointerdown',()=>this._hideInvite());
    this._inviteCont.add([bg,title,this._inviteText,accept,decline]);
  }

  _flashMsg(msg) {
    const { W, H } = this;
    const t = this.add.text(W/2,H/2,msg,{fontSize:'14px',fill:'#FFD700',fontFamily:'Arial',fontStyle:'bold',backgroundColor:'#0a1e14',padding:{x:14,y:8}}).setOrigin(0.5).setDepth(100);
    this.tweens.add({targets:t,alpha:0,y:t.y-40,duration:1600,onComplete:()=>t.destroy()});
  }

  _onFriendInvite(d){ this._inviteData=d; this._inviteText.setText(d.fromUsername+' wants to play!'); this.tweens.add({targets:this._inviteCont,y:80,duration:400,ease:'Back.Out'}); }
  _hideInvite(){ this.tweens.add({targets:this._inviteCont,y:-120,duration:300,ease:'Back.In'}); }
  _acceptInvite(){ if(this._inviteData) socketManager.emit('accept_invite',{roomId:this._inviteData.roomId}); this._hideInvite(); }

  shutdown() {
    socketManager.offAll('friend_invite');
    this._hideInvite();
  }
}
