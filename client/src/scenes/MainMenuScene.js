import Phaser from 'phaser';
import { socketManager } from '../network/SocketManager.js';
import { audioSystem } from '../systems/AudioSystem.js';

export class MainMenuScene extends Phaser.Scene {
  constructor() { super('MainMenu'); }

  create() {
    const { width: W, height: H } = this.scale;
    this.W = W; this.H = H;
    this.username = this.registry.get('username') || 'Player';
    this.gold     = Number(localStorage.getItem('bb_gold')     || this.registry.get('gold')     || 1200);
    this.trophies = Number(localStorage.getItem('bb_trophies') || 1219);
    this.gems     = Number(localStorage.getItem('bb_gems')     || 300);

    this._drawSky();
    this._drawStars();
    this._drawMoon();
    this._drawMountains();
    this._drawCastle();
    this._drawMoatReflection();
    this._spawnTorches();
    this._spawnBanner();
    this._spawnMist();
    this._startEmbers();

    const hud = this.add.graphics().setDepth(10);
    hud.fillStyle(0x000000, 0.65); hud.fillRect(0, 0, W, 60);
    hud.lineStyle(1, 0x1a3a6a, 0.6); hud.lineBetween(0, 60, W, 60);

    this._drawTopBar();
    this._drawProfileRow();
    this._drawChestRow();
    this._drawBattleBar();
    this._drawNavBar();
    this._buildInviteContainer();

    const token = this.registry.get('token');
    if (token && !socketManager.isConnected()) socketManager.connect(token);
    socketManager.on('friend_invite', d => this._onFriendInvite(d));
    this.cameras.main.fadeIn(400);
    audioSystem.playTrack('battle_hymn');
  }

  // ── Sky ────────────────────────────────────────────────────────────────────
  _drawSky() {
    const { W, H } = this;
    const g = this.add.graphics().setDepth(0);
    const bands = [
      [0,       H*0.14, 0x03070e],
      [H*0.14,  H*0.12, 0x040a18],
      [H*0.26,  H*0.14, 0x050d1e],
      [H*0.40,  H*0.18, 0x060f22],
      [H*0.58,  H*0.20, 0x050d1c],
      [H*0.78,  H*0.22, 0x040b14],
    ];
    bands.forEach(([y, h, c]) => { g.fillStyle(c); g.fillRect(0, y, W, h + 2); });
    // horizon glow
    g.fillStyle(0x0a4030, 0.30); g.fillEllipse(W/2, H*0.70, W*1.5, H*0.30);
    g.fillStyle(0x082818, 0.18); g.fillEllipse(W/2, H*0.74, W*1.2, H*0.18);
  }

  _drawStars() {
    const { W, H } = this;
    const g = this.add.graphics().setDepth(1);
    for (let i = 0; i < 230; i++) {
      const x  = ((Math.sin(i*73.1+1.2)*0.5+0.5)) * W;
      const y  = ((Math.cos(i*37.7+0.5)*0.5+0.5)) * H * 0.62;
      const sz = i%18===0 ? 2 : i%7===0 ? 1.5 : 1;
      const a  = 0.15 + (Math.sin(i*13.3)*0.5+0.5)*0.65;
      g.fillStyle(0xFFFFFF, a); g.fillRect(x, y, sz, sz);
    }
    [[W*0.12,H*0.06],[W*0.78,H*0.11],[W*0.55,H*0.04],[W*0.30,H*0.15]].forEach(([x,y]) => {
      g.fillStyle(0xCCDDFF, 0.12); g.fillCircle(x, y, 5);
      g.fillStyle(0xFFFFFF, 0.95); g.fillRect(x-1, y-1, 2, 2);
    });
  }

  _drawMoon() {
    const { W, H } = this;
    const mx = W*0.82, my = H*0.10;
    const g = this.add.graphics().setDepth(2);
    [[52,0.04],[38,0.08],[28,0.15],[21,0.22]].forEach(([r,a]) => {
      g.fillStyle(0xDDEEFF, a); g.fillCircle(mx, my, r);
    });
    g.fillStyle(0xEEF4FF); g.fillCircle(mx, my, 19);
    g.fillStyle(0xD8E8F0, 0.45); g.fillCircle(mx+4, my-3, 6);
    g.fillStyle(0xC8D8E8, 0.30); g.fillCircle(mx-5, my+5, 4);
    g.fillStyle(0x06101e, 0.52); g.fillCircle(mx+5, my+1, 17);
  }

  // ── Mountains ──────────────────────────────────────────────────────────────
  _drawMountains() {
    const { W, H } = this;
    const g  = this.add.graphics().setDepth(3);
    const bY = H * 0.70;
    const P  = (arr) => { const pts=[]; for(let i=0;i<arr.length;i+=2) pts.push({x:arr[i],y:arr[i+1]}); return pts; };

    g.fillStyle(0x0c1e30, 0.68);
    g.fillPoints(P([0,bY-18, W*.08,bY-102, W*.18,bY-142, W*.26,bY-112, W*.35,bY-164, W*.44,bY-122,
                    W*.54,bY-174, W*.63,bY-132, W*.72,bY-154, W*.80,bY-102, W*.90,bY-132, W,bY-58, W,bY, 0,bY]));

    g.fillStyle(0x07141e, 0.88);
    g.fillPoints(P([0,bY+10, W*.05,bY-62, W*.14,bY-94, W*.20,bY-72, W*.28,bY-114,
                    W*.38,bY-84, W*.48,bY-136, W*.56,bY-92, W*.65,bY-122, W*.75,bY-88,
                    W*.84,bY-104, W*.92,bY-56, W,bY-40, W,bY+10, 0,bY+10]));

    g.fillStyle(0x030d12, 0.96);
    g.fillPoints(P([0,bY+20, W*.10,bY-34, W*.22,bY-54, W*.30,bY-30, W*.42,bY-62,
                    W*.52,bY-40, W*.60,bY-64, W*.70,bY-44, W*.80,bY-56, W*.90,bY-28, W,bY-36, W,bY+20, 0,bY+20]));
  }

  // ── Castle ─────────────────────────────────────────────────────────────────
  _drawCastle() {
    const { W, H } = this;
    const cx     = W / 2;
    const groundY = H * 0.74;
    const g      = this.add.graphics().setDepth(4);

    // Ground platform
    g.fillStyle(0x0b1a0c);
    g.fillPoints(this._P([cx-185,groundY+4, cx+185,groundY+4, cx+215,groundY+40, cx-215,groundY+40]));
    g.fillStyle(0x162816, 0.7);
    g.fillPoints(this._P([cx-185,groundY+2, cx+185,groundY+2, cx+185,groundY+8, cx-185,groundY+8]));

    // Front wall base
    this._wall(g, cx-155, groundY-78, 310, 78, 0x283a2a, 0x1c281e, 0x364e38);
    this._battlements(g, cx-155, groundY-78, 310, 0x364e38, 0x243428);

    // Back-left tower
    const lt = { x:cx-132, y:groundY-268, w:78, h:268 };
    this._wall(g, lt.x, lt.y, lt.w, lt.h, 0x223028, 0x16201a, 0x2e3e30);
    this._battlements(g, lt.x, lt.y, lt.w, 0x2e3e30, 0x1c2820);
    this._cap(g, lt.x, lt.y, lt.w, 0x18241a, 0x0e1610);
    this._windows(g, lt.x, lt.y, lt.w, lt.h, 2);
    g.fillStyle(0x4a6a4e, 0.15); g.fillRect(lt.x, lt.y, 10, lt.h);

    // Back-right tower
    const rt = { x:cx+54, y:groundY-268, w:78, h:268 };
    this._wall(g, rt.x, rt.y, rt.w, rt.h, 0x1c2822, 0x121c16, 0x283430);
    this._battlements(g, rt.x, rt.y, rt.w, 0x283430, 0x1a2420);
    this._cap(g, rt.x, rt.y, rt.w, 0x141e16, 0x0c1210);
    this._windows(g, rt.x, rt.y, rt.w, rt.h, 2);
    g.fillStyle(0x000000, 0.22); g.fillRect(rt.x+rt.w-10, rt.y, 10, rt.h);

    // Center keep
    const kk = { x:cx-94, y:groundY-390, w:188, h:390 };
    this._wall(g, kk.x, kk.y, kk.w, kk.h, 0x2e4432, 0x202e24, 0x3c5640);
    this._battlements(g, kk.x, kk.y, kk.w, 0x3c5440, 0x263830);
    this._cap(g, kk.x, kk.y, kk.w, 0x1c2e1e, 0x101a12, true);
    this._windows(g, kk.x, kk.y, kk.w, kk.h, 5);
    g.fillStyle(0x6a9a6e, 0.12); g.fillRect(kk.x, kk.y, 14, kk.h);
    g.fillStyle(0x000000, 0.20); g.fillRect(kk.x+kk.w-14, kk.y, 14, kk.h);

    // Gate
    const gw = 60, gh = 96, gx = cx-30, gy = groundY-96;
    g.fillStyle(0x090e08); g.fillRect(gx, gy, gw, gh);
    g.fillStyle(0x090e08); g.fillCircle(cx, gy, gw/2);
    g.fillStyle(0x1e2e20, 0.75);
    for (let xi=0; xi<5; xi++) g.fillRect(gx+6+xi*10, gy, 3, gh);
    for (let yi=0; yi<7; yi++) g.fillRect(gx, gy+yi*13, gw, 2);
    g.fillStyle(0x3a6a22, 0.14); g.fillRect(gx, gy, gw, gh);
    g.lineStyle(1.5, 0x3a5438, 0.55); g.strokeRect(gx, gy, gw, gh);

    // Moat
    g.fillStyle(0x030e0c);
    g.fillPoints(this._P([cx-225,groundY, cx+225,groundY, cx+248,groundY+32, cx-248,groundY+32]));
    g.fillStyle(0x081e18, 0.55);
    g.fillPoints(this._P([cx-200,groundY+2, cx+200,groundY+2, cx+218,groundY+14, cx-218,groundY+14]));
    g.fillStyle(0x0e3828, 0.22);
    g.fillPoints(this._P([cx-175,groundY+4, cx+175,groundY+4, cx+188,groundY+10, cx-188,groundY+10]));

    // Drawbridge
    g.fillStyle(0x1a2a18);
    g.fillPoints(this._P([cx-26,groundY, cx+26,groundY, cx+22,groundY+28, cx-22,groundY+28]));
    g.fillStyle(0x283a20, 0.55);
    for (let yi=0; yi<6; yi++) g.fillRect(cx-24, groundY+3+yi*5, 48, 3);
  }

  _P(arr) { const p=[]; for(let i=0;i<arr.length;i+=2) p.push({x:arr[i],y:arr[i+1]}); return p; }

  _wall(g, x, y, w, h, base, mortar, hl) {
    g.fillStyle(base); g.fillRect(x, y, w, h);
    const BH=18, BW=26;
    for (let row=0; row*BH<h; row++) {
      const off=(row%2)*(BW/2);
      for (let col=-1; col*BW<w+BW; col++) {
        const bx=x+col*BW-off, by=y+row*BH;
        const cx2=Math.max(bx,x), cx3=Math.min(bx+BW-2,x+w);
        const cy2=Math.max(by,y), cy3=Math.min(by+BH-2,y+h);
        if (cx3<=cx2||cy3<=cy2) continue;
        g.fillStyle(mortar,0.55); g.fillRect(cx2,cy2,cx3-cx2,cy3-cy2);
        g.fillStyle(base); g.fillRect(cx2+1,cy2+1,cx3-cx2-2,cy3-cy2-2);
        g.fillStyle(hl,0.28); g.fillRect(cx2+1,cy2+1,cx3-cx2-2,2); g.fillRect(cx2+1,cy2+1,2,cy3-cy2-2);
        g.fillStyle(mortar,0.45); g.fillRect(cx2+1,cy3-3,cx3-cx2-2,2);
      }
    }
  }

  _battlements(g, x, y, w, base, shadow) {
    const mw=16, mh=20, gap=12, total=mw+gap;
    const count=Math.floor(w/total);
    const sx=x+(w-count*total+gap)/2;
    g.fillStyle(shadow);
    for (let i=0; i<count; i++) g.fillRect(sx+i*total, y-mh+5, mw, mh);
    for (let i=0; i<count; i++) {
      const bx=sx+i*total;
      g.fillStyle(base); g.fillRect(bx, y-mh, mw, mh);
      g.fillStyle(0x6a8a6e,0.22); g.fillRect(bx, y-mh, mw, 3);
    }
  }

  _cap(g, x, y, w, dark, shadow, main=false) {
    const cx=x+w/2, capH=main?76:54;
    g.fillStyle(dark); g.fillTriangle(cx-w/2-5,y, cx+w/2+5,y, cx,y-capH);
    g.fillStyle(shadow,0.45); g.fillTriangle(cx-w/2-5,y, cx,y, cx,y-capH);
    if (main) {
      g.fillStyle(0xFFD700,0.65); g.fillCircle(cx, y-capH, 6);
      g.fillStyle(0xFFFFFF,0.45); g.fillCircle(cx, y-capH, 2.5);
    }
  }

  _windows(g, x, y, w, h, count) {
    const sp=h/(count+1);
    for (let i=0; i<count; i++) {
      const wx=x+w/2-9, wy=y+sp*(i+1)-15;
      g.fillStyle(0x040e08); g.fillRect(wx,wy,18,22); g.fillCircle(wx+9,wy,9);
      g.fillStyle(0xFF8800,0.32); g.fillRect(wx+1,wy,16,22);
      g.fillStyle(0xFFCC44,0.18); g.fillRect(wx+3,wy+3,12,14);
      g.lineStyle(1,0x2a4030,0.6); g.strokeRect(wx,wy,18,22);
    }
  }

  _drawMoatReflection() {
    const { W, H } = this;
    const g = this.add.graphics().setDepth(5);
    const gY = H*0.74;
    g.fillStyle(0x1a3a28,0.10); g.fillRect(W/2-85,gY+7,170,18);
    g.fillStyle(0x0e2018,0.14); g.fillRect(W/2-52,gY+14,104,10);
    for (let i=0; i<7; i++) {
      const gx=W/2-185+i*60+(Math.sin(i*7.3)*0.5+0.5)*18;
      g.fillStyle(0x3a8a5a,0.22); g.fillRect(gx,gY+9,18,2);
    }
  }

  _spawnTorches() {
    const { W, H } = this;
    const gY = H*0.74;
    [W/2-104,W/2+104,W/2-148,W/2+148].forEach((tx,i) => {
      this._makeTorch(tx, gY-98-(i>1?58:0));
    });
  }

  _makeTorch(x, y) {
    const bg = this.add.graphics().setDepth(6);
    bg.fillStyle(0x4a3010); bg.fillRect(x-3,y-14,6,14);
    bg.fillStyle(0x888888); bg.fillRect(x-5,y-16,10,4);
    const fl = this.add.graphics().setDepth(7);
    let t=Math.random()*100;
    const draw = () => {
      fl.clear();
      const f=0.85+Math.sin(t*0.09)*0.15;
      fl.fillStyle(0xFF6600,0.07*f); fl.fillCircle(x,y-26,23);
      fl.fillStyle(0xFF8800,0.13*f); fl.fillCircle(x,y-22,16);
      fl.fillStyle(0xFF4400,0.88*f); fl.fillTriangle(x-9,y-14,x+9,y-14,x,y-38*f);
      fl.fillStyle(0xFF9000,0.92*f); fl.fillTriangle(x-6,y-14,x+6,y-14,x,y-28*f);
      fl.fillStyle(0xFFDD44,0.78*f); fl.fillTriangle(x-3,y-14,x+3,y-14,x,y-20*f);
      t++;
    };
    draw();
    this.time.addEvent({ delay:38, loop:true, callback:draw });
    const glow = this.add.graphics().setDepth(5);
    glow.fillStyle(0xFF8800,0.05); glow.fillCircle(x,y-20,44);
  }

  _spawnBanner() {
    const { W, H } = this;
    const bx=W/2, by=H*0.74-390-76+8;
    const ban = this.add.graphics().setDepth(8);
    let t=0;
    const draw = () => {
      ban.clear();
      const s=Math.sin(t*0.7)*7, s2=Math.sin(t*0.7+0.9)*4;
      ban.fillStyle(0xC8A800); ban.fillRect(bx-2,by,4,62);
      ban.fillStyle(0x1a0066);
      ban.fillPoints([{x:bx+2,y:by+5},{x:bx+52+s,y:by+10+s*0.3},{x:bx+52+s2,y:by+48+s*0.2},{x:bx+2,y:by+42}],true);
      ban.fillStyle(0xFFD700);
      const ex=bx+28+s*0.5, ey=by+28;
      ban.fillTriangle(ex,ey-11,ex+9,ey,ex,ey+11); ban.fillTriangle(ex,ey-11,ex-9,ey,ex,ey+11);
      t+=0.025;
    };
    draw();
    this.time.addEvent({ delay:30, loop:true, callback:draw });
  }

  _spawnMist() {
    const { W, H } = this;
    const gY=H*0.74;
    const g=this.add.graphics().setDepth(9);
    const mists=[];
    for(let i=0;i<14;i++) mists.push({
      x:Math.random()*W, y:gY+8+Math.random()*28,
      w:55+Math.random()*90, spd:0.08+Math.random()*0.2,
      a:0.04+Math.random()*0.07, t:Math.random()*Math.PI*2
    });
    this.time.addEvent({ delay:48, loop:true, callback:() => {
      g.clear();
      mists.forEach(m => {
        m.t+=0.02; m.x+=m.spd; if(m.x>W+m.w) m.x=-m.w;
        g.fillStyle(0x88CCAA, m.a*(0.8+Math.sin(m.t)*0.2));
        g.fillEllipse(m.x,m.y,m.w,12);
      });
    }});
  }

  _startEmbers() {
    const { W, H } = this;
    const embers=[]; const gY=H*0.74;
    for(let i=0;i<22;i++) embers.push({
      x:W/2+(Math.random()-0.5)*230, y:gY-Math.random()*200,
      vy:-(0.28+Math.random()*0.58), vx:(Math.random()-0.5)*0.35,
      life:Math.random(), sz:1+Math.random()*1.5,
      col:Math.random()>0.5?0xFF8800:0xFFCC44
    });
    const pg=this.add.graphics().setDepth(9);
    this.time.addEvent({ delay:33, loop:true, callback:() => {
      pg.clear();
      embers.forEach(p => {
        p.y+=p.vy; p.x+=p.vx; p.life-=0.007;
        if(p.life<=0){ p.life=0.5+Math.random()*0.5; p.x=W/2+(Math.random()-0.5)*230; p.y=gY-Math.random()*30; }
        pg.fillStyle(p.col,p.life*0.65); pg.fillCircle(p.x,p.y,p.sz);
      });
    }});
  }

  // ── TOP RESOURCE BAR ──────────────────────────────────────────────────────
  _drawTopBar() {
    const { W } = this;
    const g=this.add.graphics().setDepth(12);
    // Trophy
    g.fillStyle(0xFFD700); g.fillRect(12,7,12,10); g.fillRect(14,17,8,4); g.fillRect(11,20,14,3);
    g.fillStyle(0xFFAA00,0.5); g.fillRect(12,7,5,6);
    const aG=this.add.graphics().setDepth(12);
    aG.fillStyle(0x1A44BB); aG.fillRoundedRect(36,5,26,19,4);
    this.add.text(49,14,'14',{fontSize:'11px',fill:'#FFFFFF',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0.5).setDepth(13);
    this.add.text(65,12,String(this.trophies),{fontSize:'17px',fill:'#FFFFFF',fontFamily:'Arial',fontStyle:'bold'}).setDepth(12);
    const xpG=this.add.graphics().setDepth(12);
    xpG.fillStyle(0x000000,0.7); xpG.fillRoundedRect(36,28,100,9,3);
    xpG.fillStyle(0x4499FF); xpG.fillRoundedRect(37,29,60,7,3);
    xpG.fillStyle(0xAADDFF,0.4); xpG.fillRoundedRect(37,29,22,4,2);
    this.add.text(W/2,14,this.username.toUpperCase(),{fontSize:'14px',fill:'#FFFFFF',fontFamily:'Arial',fontStyle:'bold',stroke:'#000000',strokeThickness:2}).setOrigin(0.5).setDepth(12);
    const goldG=this.add.graphics().setDepth(12);
    goldG.fillStyle(0x8B6914); goldG.fillRoundedRect(W-112,5,62,22,5);
    goldG.fillStyle(0xFFD700); goldG.fillRoundedRect(W-111,6,60,20,4);
    goldG.fillStyle(0xFFEE88,0.35); goldG.fillRoundedRect(W-109,7,28,9,3);
    this.add.text(W-106,10,'💰',{fontSize:'12px'}).setDepth(13);
    this.add.text(W-90,15,String(this.gold),{fontSize:'12px',fill:'#3D1F00',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0,0.5).setDepth(13);
    const gemG=this.add.graphics().setDepth(12);
    gemG.fillStyle(0x5A0070); gemG.fillRoundedRect(W-46,5,40,22,5);
    gemG.fillStyle(0xCC44FF); gemG.fillRoundedRect(W-45,6,38,20,4);
    gemG.fillStyle(0xEE88FF,0.3); gemG.fillRoundedRect(W-43,7,18,9,3);
    this.add.text(W-40,10,'💎',{fontSize:'12px'}).setDepth(13);
    this.add.text(W-22,15,String(this.gems),{fontSize:'11px',fill:'#FFFFFF',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0,0.5).setDepth(13);
  }

  // ── Profile row ────────────────────────────────────────────────────────────
  _drawProfileRow() {
    const { W, H } = this;
    const rowY=H*0.14;
    const pg=this.add.graphics().setDepth(11);
    pg.fillStyle(0x000000,0.52); pg.fillRoundedRect(8,rowY,W-16,72,10);
    pg.lineStyle(1,0x2a4a3a,0.55); pg.strokeRoundedRect(8,rowY,W-16,72,10);
    pg.fillStyle(0x1a3a2a); pg.fillCircle(44,rowY+36,28);
    pg.fillStyle(0x2a5a3a); pg.fillCircle(44,rowY+36,24);
    pg.fillStyle(0xFFD700,0.7); pg.fillCircle(44,rowY+27,9);
    pg.fillStyle(0xFFD700,0.5); pg.fillEllipse(44,rowY+49,20,10);
    this.add.text(80,rowY+10,this.username,{fontSize:'17px',fill:'#FFFFFF',fontFamily:'Arial',fontStyle:'bold',stroke:'#000',strokeThickness:2}).setDepth(12);
    const bG=this.add.graphics().setDepth(12);
    bG.fillStyle(0x4499FF); bG.fillRoundedRect(80,rowY+32,36,18,5);
    this.add.text(98,rowY+41,'LVL 14',{fontSize:'10px',fill:'#FFFFFF',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0.5).setDepth(13);
    this.add.text(122,rowY+13,'🏆  '+this.trophies,{fontSize:'14px',fill:'#FFD700',fontFamily:'Arial'}).setDepth(12);
    this.add.text(W-20,rowY+15,'62%\nWIN RATE',{fontSize:'11px',fill:'#44FF88',fontFamily:'Arial',fontStyle:'bold',align:'right'}).setOrigin(1,0).setDepth(12);
    this.add.text(W-20,rowY+47,'128W  76L',{fontSize:'10px',fill:'#8899AA',fontFamily:'Arial',align:'right'}).setOrigin(1,0).setDepth(12);
  }

  // ── Chest row ──────────────────────────────────────────────────────────────
  _drawChestRow() {
    const { W, H } = this;
    const rowY=H*0.28;
    const chests=[
      {label:'Silver\n3:24',color:0x8899AA,glow:0xCCDDEE},
      {label:'READY!',color:0xFFD700,glow:0xFFEE88},
      {label:'Locked',color:0x445566,glow:0x667788},
      {label:'Locked',color:0x445566,glow:0x667788},
    ];
    const cw=(W-24)/4;
    const bg=this.add.graphics().setDepth(11);
    bg.fillStyle(0x000000,0.42); bg.fillRoundedRect(8,rowY,W-16,82,10);
    bg.lineStyle(1,0x1a3a2a,0.5); bg.strokeRoundedRect(8,rowY,W-16,82,10);
    chests.forEach((ch,i) => {
      const ccx=8+i*cw+cw/2;
      const cg=this.add.graphics().setDepth(12);
      const isReady=ch.label==='READY!';
      if(isReady){ cg.fillStyle(0xFFD700,0.10); cg.fillRoundedRect(ccx-cw/2+2,rowY+3,cw-4,76,8); }
      cg.fillStyle(ch.color); cg.fillRoundedRect(ccx-19,rowY+10,38,24,4);
      cg.fillStyle(ch.glow,0.38); cg.fillRoundedRect(ccx-17,rowY+12,34,20,3);
      cg.fillStyle(ch.color); cg.fillRoundedRect(ccx-21,rowY+6,42,12,4);
      cg.fillStyle(0xFFD700); cg.fillCircle(ccx,rowY+23,4);
      if(isReady){ cg.fillStyle(0xFFDD44,0.28); cg.fillCircle(ccx,rowY+22,22); this.tweens.add({targets:cg,alpha:0.65,duration:720,yoyo:true,repeat:-1}); }
      this.add.text(ccx,rowY+60,ch.label,{fontSize:'9px',fill:isReady?'#FFD700':'#6699AA',fontFamily:'Arial',fontStyle:'bold',align:'center'}).setOrigin(0.5).setDepth(13);
    });
  }

  // ── Battle bar ─────────────────────────────────────────────────────────────
  _drawBattleBar() {
    const { W, H } = this;
    const rowY=H*0.46;
    const bg=this.add.graphics().setDepth(11);
    bg.fillStyle(0x000000,0.48); bg.fillRoundedRect(8,rowY,W-16,100,12);
    bg.lineStyle(1,0x2a5a3a,0.45); bg.strokeRoundedRect(8,rowY,W-16,100,12);

    // 1v1 button
    const bb=this.add.graphics().setDepth(12);
    const bw=(W-32)*0.58;
    bb.fillStyle(0xBB2200); bb.fillRoundedRect(16,rowY+8,bw,42,8);
    bb.fillStyle(0xFF4400); bb.fillRoundedRect(16,rowY+8,bw,36,8);
    bb.fillStyle(0xFF6633,0.38); bb.fillRoundedRect(18,rowY+10,bw*0.7,14,4);
    const btn=this.add.text(16+bw/2,rowY+30,'⚔  BATTLE',{fontSize:'22px',fill:'#FFFFFF',fontFamily:'Arial Black, Arial',fontStyle:'bold',stroke:'#330000',strokeThickness:3}).setOrigin(0.5).setDepth(13).setInteractive({useHandCursor:true});
    btn.on('pointerdown',()=>{ this.cameras.main.fadeOut(250,0,0,0); this.cameras.main.once('camerafadeoutcomplete',()=>this.scene.start('CharSelect',{mode:'1v1'})); });
    btn.on('pointerover',()=>{ bb.setAlpha(0.82); btn.setScale(1.05); });
    btn.on('pointerout', ()=>{ bb.setAlpha(1);    btn.setScale(1); });

    // 2v2 button
    const bb2=this.add.graphics().setDepth(12);
    const bx2=16+bw+4, bw2=W-32-bw-4;
    bb2.fillStyle(0x1a3a88); bb2.fillRoundedRect(bx2,rowY+8,bw2,42,8);
    bb2.fillStyle(0x3366CC); bb2.fillRoundedRect(bx2,rowY+8,bw2,36,8);
    bb2.fillStyle(0x5588EE,0.35); bb2.fillRoundedRect(bx2+2,rowY+10,bw2*0.7,14,4);
    const btn2=this.add.text(bx2+bw2/2,rowY+30,'2v2',{fontSize:'18px',fill:'#FFFFFF',fontFamily:'Arial Black, Arial',fontStyle:'bold',stroke:'#001133',strokeThickness:3}).setOrigin(0.5).setDepth(13).setInteractive({useHandCursor:true});
    btn2.on('pointerdown',()=>{ this.cameras.main.fadeOut(250,0,0,0); this.cameras.main.once('camerafadeoutcomplete',()=>this.scene.start('CharSelect',{mode:'2v2'})); });

    // Bot button
    const trg=this.add.graphics().setDepth(12);
    trg.fillStyle(0x1a4a1a); trg.fillRoundedRect(16,rowY+56,W-32,34,8);
    trg.fillStyle(0x2a7a2a); trg.fillRoundedRect(16,rowY+56,W-32,28,8);
    trg.fillStyle(0x44AA44,0.3); trg.fillRoundedRect(18,rowY+58,W*0.5,12,4);
    this.add.text(W/2,rowY+72,'🤖  TRAIN vs BOT',{fontSize:'15px',fill:'#CCFFCC',fontFamily:'Arial',fontStyle:'bold',stroke:'#001100',strokeThickness:2}).setOrigin(0.5).setDepth(13).setInteractive({useHandCursor:true})
      .on('pointerdown',()=>{ this.cameras.main.fadeOut(250,0,0,0); this.cameras.main.once('camerafadeoutcomplete',()=>this.scene.start('CharSelect',{mode:'bot'})); });
  }

  // ── Nav bar ────────────────────────────────────────────────────────────────
  _drawNavBar() {
    const { W, H } = this;
    const navY=H-66;
    const ng=this.add.graphics().setDepth(14);
    ng.fillStyle(0x000000,0.88); ng.fillRect(0,navY,W,66);
    ng.lineStyle(1,0x1a3a2a,0.75); ng.lineBetween(0,navY,W,navY);
    const items=[{icon:'🏠',label:'HOME',x:W*0.10},{icon:'👥',label:'SOCIAL',x:W*0.30},{icon:'🏪',label:'SHOP',x:W*0.50},{icon:'📊',label:'STATS',x:W*0.70},{icon:'⚙️',label:'SETTINGS',x:W*0.90}];
    items.forEach(it=>{
      this.add.text(it.x,navY+17,it.icon,{fontSize:'22px'}).setOrigin(0.5).setDepth(15);
      this.add.text(it.x,navY+42,it.label,{fontSize:'8px',fill:'#556677',fontFamily:'Arial'}).setOrigin(0.5).setDepth(15);
    });
    const ag=this.add.graphics().setDepth(14);
    ag.fillStyle(0x44FF88,0.7); ag.fillRect(W*0.10-18,navY,36,3);
  }

  // ── Invite popup ───────────────────────────────────────────────────────────
  _buildInviteContainer() {
    const { W }=this;
    this._inviteCont=this.add.container(W/2,-120).setDepth(50);
    const bg=this.add.rectangle(0,0,320,90,0x0a1e2a,0.97).setStrokeStyle(2,0x44FF88);
    const title=this.add.text(0,-24,'⚔  BATTLE INVITATION',{fontSize:'13px',fill:'#FFD700',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0.5);
    this._inviteText=this.add.text(0,4,'',{fontSize:'13px',fill:'#FFFFFF',fontFamily:'Arial'}).setOrigin(0.5);
    const accept=this.add.text(-60,28,'[ ACCEPT ]',{fontSize:'12px',fill:'#44FF88',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0.5).setInteractive({useHandCursor:true}).on('pointerdown',()=>this._acceptInvite());
    const decline=this.add.text(60,28,'[ DECLINE ]',{fontSize:'12px',fill:'#FF4444',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0.5).setInteractive({useHandCursor:true}).on('pointerdown',()=>this._hideInvite());
    this._inviteCont.add([bg,title,this._inviteText,accept,decline]);
  }

  _onFriendInvite(d){ this._inviteData=d; this._inviteText.setText(d.fromUsername+' wants to play!'); this.tweens.add({targets:this._inviteCont,y:80,duration:400,ease:'Back.Out'}); }
  _hideInvite(){ this.tweens.add({targets:this._inviteCont,y:-120,duration:300,ease:'Back.In'}); }
  _acceptInvite(){ if(this._inviteData) socketManager.emit('accept_invite',{roomId:this._inviteData.roomId}); this._hideInvite(); }

  shutdown() {
    socketManager.offAll('friend_invite');
    this._hideInvite();
  }
}
