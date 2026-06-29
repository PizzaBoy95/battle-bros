import * as THREE from 'three';

class ThreeManager {
  constructor() {
    this._renderer = null;
    this._scene    = null;
    this._camera   = null;
    this._raf      = null;
    this._t        = 0;
    this._container = null;
    this._onResize  = null;
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  init(containerEl) {
    if (this._renderer) this.destroy();
    this._container = containerEl;
    this._t = 0;

    // Renderer
    this._renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this._renderer.shadowMap.enabled = true;
    this._renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
    const el = this._renderer.domElement;
    el.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;';
    containerEl.appendChild(el);

    // Scene + fog
    this._scene = new THREE.Scene();
    this._scene.background = new THREE.Color(0x0b4335);
    this._scene.fog = new THREE.Fog(0x0b4335, 16, 38);

    // Camera
    this._camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    this._camera.position.set(0, 5.5, 14);
    this._camera.lookAt(0, 3, 0);

    // Lights
    const sun = new THREE.DirectionalLight(0xfff5e0, 1.4);
    sun.position.set(6, 12, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far  = 40;
    sun.shadow.camera.left   = -10;
    sun.shadow.camera.right  = 10;
    sun.shadow.camera.top    = 10;
    sun.shadow.camera.bottom = -5;
    this._scene.add(sun);
    this._scene.add(new THREE.AmbientLight(0x9ab8cc, 0.5));

    // Warm fill from below (castle glow)
    const fill = new THREE.PointLight(0x2244aa, 1.2, 20);
    fill.position.set(0, 1, 4);
    this._scene.add(fill);

    this._buildScene();
    this._resize();

    this._onResize = () => this._resize();
    window.addEventListener('resize', this._onResize);

    this.animate();
  }

  destroy() {
    if (this._raf)       { cancelAnimationFrame(this._raf); this._raf = null; }
    if (this._onResize)  { window.removeEventListener('resize', this._onResize); this._onResize = null; }
    if (this._renderer) {
      if (this._renderer.domElement.parentNode)
        this._renderer.domElement.parentNode.removeChild(this._renderer.domElement);
      this._renderer.dispose();
      this._renderer = null;
    }
    this._scene  = null;
    this._camera = null;
  }

  animate() {
    this._raf = requestAnimationFrame(() => this.animate());
    this._t += 0.004;

    // Gentle orbit
    const radius = 14 + Math.sin(this._t * 0.25) * 1.5;
    this._camera.position.x = Math.sin(this._t * 0.35) * 2.2;
    this._camera.position.z = radius;
    this._camera.position.y = 5.0 + Math.sin(this._t * 0.18) * 0.7;
    this._camera.lookAt(0, 3, 0);

    // Animate banner
    if (this._banner) {
      this._banner.rotation.y = Math.sin(this._t * 1.8) * 0.06;
    }

    this._renderer.render(this._scene, this._camera);
  }

  // ── Private ────────────────────────────────────────────────────────────────
  _resize() {
    if (!this._renderer || !this._container) return;
    const w = this._container.clientWidth;
    const h = this._container.clientHeight;
    this._renderer.setSize(w, h);
    if (this._camera) {
      this._camera.aspect = w / h;
      this._camera.updateProjectionMatrix();
    }
  }

  _buildScene() {
    const stoneTex  = this._stoneTexture();
    const stoneMat  = new THREE.MeshLambertMaterial({ map: stoneTex });
    const darkMat   = new THREE.MeshLambertMaterial({ map: stoneTex, color: 0x999999 });
    const blueMat   = new THREE.MeshLambertMaterial({ color: 0x1a3a8a });
    const darkBlueMat = new THREE.MeshLambertMaterial({ color: 0x122266 });
    const goldMat   = new THREE.MeshLambertMaterial({ color: 0xFFD700, emissive: 0x886600, emissiveIntensity: 0.3 });
    const redGem    = new THREE.MeshLambertMaterial({ color: 0xFF1100, emissive: 0x880000, emissiveIntensity: 0.5 });

    // ── Ground ─────────────────────────────────────────────────────────────
    const ground = new THREE.Mesh(
      new THREE.CylinderGeometry(8, 8, 0.25, 40),
      new THREE.MeshLambertMaterial({ color: 0x1c6b28 })
    );
    ground.receiveShadow = true;
    this._scene.add(ground);

    // Moat ring
    const moat = new THREE.Mesh(
      new THREE.RingGeometry(5.2, 7.0, 40),
      new THREE.MeshLambertMaterial({ color: 0x1044aa, side: THREE.DoubleSide })
    );
    moat.rotation.x = -Math.PI / 2;
    moat.position.y = 0.14;
    this._scene.add(moat);

    // Platform
    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(5.0, 5.0, 0.5, 40),
      new THREE.MeshLambertMaterial({ color: 0x6e6055 })
    );
    platform.position.y = 0.38;
    platform.receiveShadow = true;
    this._scene.add(platform);

    // ── Curtain walls ──────────────────────────────────────────────────────
    for (const xSign of [-1, 1]) {
      const wallCenter = xSign * 1.95;
      const wall = new THREE.Mesh(new THREE.BoxGeometry(1.9, 2.2, 1.1), stoneMat);
      wall.position.set(wallCenter, 1.75, 0);
      wall.castShadow = true; wall.receiveShadow = true;
      this._scene.add(wall);
      // Wall merlon tops
      for (let m = -1; m <= 1; m += 2) {
        const merlon = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 1.1), stoneMat);
        merlon.position.set(wallCenter + m * 0.55, 3.08, 0);
        this._scene.add(merlon);
      }
    }

    // ── Guard towers ──────────────────────────────────────────────────────
    for (const xSign of [-1, 1]) {
      this._addTower(
        xSign * 3.25, 0, 0,
        1.3, 3.8,
        darkMat, darkBlueMat, null, false
      );
    }

    // ── King tower ─────────────────────────────────────────────────────────
    this._addTower(0, 0, 0, 1.9, 5.5, stoneMat, blueMat, goldMat, true, redGem);

    // ── Banner on king tower ───────────────────────────────────────────────
    const bannerTex = this._bannerTexture();
    this._banner = new THREE.Mesh(
      new THREE.PlaneGeometry(1.1, 1.65),
      new THREE.MeshLambertMaterial({ map: bannerTex, side: THREE.DoubleSide, transparent: false })
    );
    this._banner.position.set(0, 3.4, 0.97);
    this._scene.add(this._banner);

    // ── Stars ──────────────────────────────────────────────────────────────
    const starPositions = [];
    for (let i = 0; i < 280; i++) {
      starPositions.push(
        (Math.random() - 0.5) * 80,
        6 + Math.random() * 24,
        -4 - Math.random() * 28
      );
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    const stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.14, transparent: true, opacity: 0.85 })
    );
    this._scene.add(stars);

    // ── Ground glow (castle warmth) ────────────────────────────────────────
    const glow = new THREE.Mesh(
      new THREE.CircleGeometry(3.5, 32),
      new THREE.MeshBasicMaterial({ color: 0x2255bb, transparent: true, opacity: 0.22, side: THREE.DoubleSide })
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.66;
    this._scene.add(glow);
  }

  _addTower(x, y, z, width, height, bodyMat, roofMat, crownMat, isKing, gemMat) {
    const baseY = 0.63;

    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, width), bodyMat);
    body.position.set(x, baseY + height / 2, z);
    body.castShadow = true; body.receiveShadow = true;
    this._scene.add(body);

    // Battlements (4 corner merlons)
    const topY = baseY + height + 0.22;
    const hw = width * 0.33;
    const corners = [[-1,-1],[1,-1],[-1,1],[1,1]];
    for (const [cx, cz] of corners) {
      const merlon = new THREE.Mesh(
        new THREE.BoxGeometry(hw, 0.5, hw), bodyMat
      );
      merlon.position.set(x + cx * (width * 0.38), topY, z + cz * (width * 0.38));
      merlon.castShadow = true;
      this._scene.add(merlon);
    }
    // Side merlons (front/back and left/right fills)
    for (const [cx, cz] of [[0,-1],[0,1],[-1,0],[1,0]]) {
      const fill = new THREE.Mesh(
        new THREE.BoxGeometry(hw * 0.7, 0.28, hw * 0.7), bodyMat
      );
      fill.position.set(x + cx * (width * 0.38), topY - 0.11, z + cz * (width * 0.38));
      this._scene.add(fill);
    }

    // Roof cone
    const roofH = isKing ? 2.2 : 1.5;
    const roofR = width * 0.72;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(roofR, roofH, 8), roofMat);
    roof.position.set(x, topY + roofH / 2 + 0.18, z);
    roof.castShadow = true;
    this._scene.add(roof);

    if (crownMat && isKing) {
      // Gold crown band
      const crown = new THREE.Mesh(
        new THREE.CylinderGeometry(width * 0.55, width * 0.55, 0.22, 16),
        crownMat
      );
      crown.position.set(x, topY + roofH + 0.52, z);
      this._scene.add(crown);

      // 3 crown spires
      for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2;
        const spireH = i === 1 ? 0.85 : 0.62;
        const spire = new THREE.Mesh(new THREE.ConeGeometry(0.1, spireH, 4), crownMat);
        spire.position.set(
          x + Math.cos(angle) * width * 0.44,
          topY + roofH + 0.65 + spireH / 2,
          z + Math.sin(angle) * width * 0.44
        );
        this._scene.add(spire);

        // Gem on each spire
        if (gemMat) {
          const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.11), gemMat);
          gem.position.set(
            x + Math.cos(angle) * width * 0.44,
            topY + roofH + 0.65 + spireH + 0.1,
            z + Math.sin(angle) * width * 0.44
          );
          this._scene.add(gem);
        }
      }
    }
  }

  _stoneTexture() {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    const ctx = c.getContext('2d');

    // Base stone color
    ctx.fillStyle = '#8a8278';
    ctx.fillRect(0, 0, 256, 256);

    // Brick rows
    const bW = 32, bH = 16;
    for (let row = 0; row < 16; row++) {
      for (let col = 0; col < 10; col++) {
        const offset = (row % 2) * 16;
        const bx = (offset + col * bW) % 256;
        const by = row * bH;
        // Slight shade variation
        const v = 128 + Math.floor(Math.random() * 22) - 11;
        ctx.fillStyle = `rgb(${v},${v - 8},${v - 16})`;
        ctx.fillRect(bx + 1, by + 1, bW - 2, bH - 2);
        // Mortar lines
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(bx, by, bW, 1);
        ctx.fillRect(bx, by, 1, bH);
        // Edge highlight
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(bx + 1, by + 1, bW - 3, 2);
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    return tex;
  }

  _bannerTexture() {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 96;
    const ctx = c.getContext('2d');

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 64, 0);
    grad.addColorStop(0,   '#122266');
    grad.addColorStop(0.5, '#1a3a99');
    grad.addColorStop(1,   '#122266');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 96);

    // Gold diamond
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(32, 8); ctx.lineTo(58, 48); ctx.lineTo(32, 88); ctx.lineTo(6, 48);
    ctx.closePath(); ctx.fill();

    ctx.fillStyle = '#FFAA00';
    ctx.beginPath();
    ctx.moveTo(32, 20); ctx.lineTo(48, 48); ctx.lineTo(32, 76); ctx.lineTo(16, 48);
    ctx.closePath(); ctx.fill();

    // Center gem
    ctx.fillStyle = '#FF2200';
    ctx.beginPath(); ctx.arc(32, 48, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FF8866'; ctx.beginPath(); ctx.arc(29, 45, 3, 0, Math.PI * 2); ctx.fill();

    // Sheen
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(4, 0, 16, 96);

    return new THREE.CanvasTexture(c);
  }
}

export const threeManager = new ThreeManager();
