// Procedural music via Web Audio API
// 3 tracks: Battle Hymn (menu), Ember Rush (map1 battle), Frost Crown (map2/overtime)

class AudioSystem {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.currentTrack = null;
    this.currentTrackName = null;
    this.oscillators = [];
    this.intervals = [];
    this.sfxEnabled = true;
    this.musicEnabled = true;
    this.volume = 0.35;
  }

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn('[Audio] Web Audio API not available', e);
    }
  }

  resume() {
    this.ctx?.resume();
  }

  setMusicEnabled(v) { this.musicEnabled = v; if (!v) this.stopMusic(); }
  setSfxEnabled(v)   { this.sfxEnabled = v; }
  setVolume(v)       { this.volume = v; if (this.masterGain) this.masterGain.gain.value = v; }

  // ── Note utilities ────────────────────────────────────────────────────────
  _noteHz(semitones, octave = 4) {
    return 440 * Math.pow(2, (semitones - 9) / 12 + (octave - 4));
  }

  _osc(type, freq, gainVal, startTime, duration, pan = 0) {
    if (!this.ctx) return null;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const panner = this.ctx.createStereoPanner();

    osc.type = type;
    osc.frequency.value = freq;
    panner.pan.value = pan;

    g.gain.setValueAtTime(0, startTime);
    g.gain.linearRampToValueAtTime(gainVal, startTime + 0.02);
    g.gain.setValueAtTime(gainVal, startTime + duration - 0.05);
    g.gain.linearRampToValueAtTime(0, startTime + duration);

    osc.connect(g); g.connect(panner); panner.connect(this.masterGain);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
    return osc;
  }

  _noise(gainVal, startTime, duration) {
    if (!this.ctx) return;
    const bufSize = this.ctx.sampleRate * duration;
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const g = this.ctx.createGain();
    const f = this.ctx.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = 3000;
    g.gain.setValueAtTime(gainVal, startTime);
    g.gain.linearRampToValueAtTime(0, startTime + duration * 0.3);
    src.connect(f); f.connect(g); g.connect(this.masterGain);
    src.start(startTime);
  }

  // ── Track 1: Battle Hymn (C Major, 120 BPM) ──────────────────────────────
  _playBattleHymn() {
    if (!this.musicEnabled || !this.ctx) return;
    const now = this.ctx.currentTime + 0.1;
    const bpm = 120;
    const beat = 60 / bpm;
    const bar = beat * 4;

    // C Major scale: C D E F G A B
    // Semitones from A4: C=3, D=5, E=7, F=8, G=10, A=12, B=14 (relative to A3=-9)
    const C4 = this._noteHz(3, 4), D4 = this._noteHz(5, 4), E4 = this._noteHz(7, 4);
    const G4 = this._noteHz(10, 4), A4 = this._noteHz(0, 4), C5 = this._noteHz(3, 5);
    const E5 = this._noteHz(7, 5), G5 = this._noteHz(10, 5);
    const C3 = this._noteHz(3, 3), G3 = this._noteHz(10, 3), F3 = this._noteHz(8, 3);
    const Am3 = this._noteHz(0, 3);

    // Melody: heroic 8-bar phrase
    const melody = [
      [C5, 1], [E5, 0.5], [G5, 0.5], [E5, 1], [C5, 0.5], [D4, 0.5],
      [E4, 1], [G4, 1], [A4, 0.5], [G4, 0.5],
      [C5, 2],
      [G5, 0.5], [E5, 0.5], [C5, 0.5], [E5, 0.5], [G4, 2],
      [A4, 1], [G4, 0.5], [E4, 0.5], [C4, 2],
      [D4, 0.5], [E4, 0.5], [G4, 1], [E4, 0.5], [D4, 0.5],
      [C4, 3], [G3, 1],
      [C4, 1]
    ];

    let t = now;
    for (const [freq, dur] of melody) {
      this._osc('square', freq, 0.08, t, dur * beat, 0);
      t += dur * beat;
    }

    // Bass line
    const bass = [[C3,1],[C3,1],[G3,1],[G3,1],[F3,1],[F3,1],[C3,2]];
    let tb = now;
    for (const [f, d] of bass) {
      this._osc('triangle', f, 0.12, tb, d * beat);
      tb += d * beat;
    }

    // Snare rhythm
    for (let b = 0; b < 8; b++) {
      this._noise(0.15, now + b * bar + beat, 0.08);
      this._noise(0.15, now + b * bar + beat * 3, 0.08);
    }

    // Schedule loop
    const duration = t - now + 0.1;
    const id = setTimeout(() => { if (this.currentTrackName === 'battle_hymn') this._playBattleHymn(); }, duration * 1000);
    this.intervals.push(id);
  }

  // ── Track 2: Ember Rush (D Minor, 150 BPM) ───────────────────────────────
  _playEmberRush() {
    if (!this.musicEnabled || !this.ctx) return;
    const now = this.ctx.currentTime + 0.1;
    const bpm = 150;
    const beat = 60 / bpm;

    const D4 = this._noteHz(5, 4), F4 = this._noteHz(8, 4), A4 = this._noteHz(0, 5);
    const C5 = this._noteHz(3, 5), D5 = this._noteHz(5, 5), E5 = this._noteHz(7, 5);
    const Bf4 = this._noteHz(11, 4), G4 = this._noteHz(10, 4);
    const D3 = this._noteHz(5, 3), A3 = this._noteHz(0, 4), F3 = this._noteHz(8, 3);
    const C3 = this._noteHz(3, 3);

    // Aggressive arpeggiated lead
    const lead = [
      D5,F4,A4,D5, C5,E5,G4,C5, Bf4,D4,F4,Bf4, A4,C5,E5,A4,
      D5,F4,A4,D5, C5,E5,G4,C5, Bf4,D4,F4,C5, A4,A4,D5,D5
    ];
    lead.forEach((f, i) => this._osc('sawtooth', f, 0.06, now + i * beat * 0.5, beat * 0.45, i % 2 === 0 ? -0.3 : 0.3));

    // Heavy pulse bass (sawtooth)
    const bass = [[D3,2],[A3,2],[F3,2],[C3,2],[D3,2],[A3,2],[Bf4/2,2],[A3,2]];
    let tb = now;
    for (const [f, d] of bass) {
      this._osc('sawtooth', f, 0.18, tb, d * beat - 0.05);
      tb += d * beat;
    }

    // Driving kick pattern
    for (let i = 0; i < 32; i++) {
      if (i % 4 === 0 || i % 4 === 2) {
        this._osc('sine', 60, 0.3, now + i * beat * 0.5, 0.1);
      }
      if (i % 8 === 4) this._noise(0.2, now + i * beat * 0.5, 0.06);
    }

    const duration = beat * 16 + 0.1;
    const id = setTimeout(() => { if (this.currentTrackName === 'ember_rush') this._playEmberRush(); }, duration * 1000);
    this.intervals.push(id);
  }

  // ── Track 3: Frost Crown (A Minor, 140 BPM → 160 during overtime) ────────
  _playFrostCrown(overtime = false) {
    if (!this.musicEnabled || !this.ctx) return;
    const now = this.ctx.currentTime + 0.1;
    const bpm = overtime ? 160 : 140;
    const beat = 60 / bpm;

    const A4 = this._noteHz(0, 5), C5 = this._noteHz(3, 5), E5 = this._noteHz(7, 5);
    const G5 = this._noteHz(10, 5), B4 = this._noteHz(2, 5), D5 = this._noteHz(5, 5);
    const F5 = this._noteHz(8, 5), A5 = this._noteHz(0, 6);
    const A3 = this._noteHz(0, 4), E3 = this._noteHz(7, 3), C3 = this._noteHz(3, 3);
    const G3 = this._noteHz(10, 3);

    // Bell-tone lead (sine) — icy feel
    const bellMelody = [
      [A4, 1], [C5, 0.5], [E5, 0.5], [A5, 1], [G5, 0.5], [E5, 0.5],
      [F5, 1], [D5, 1], [C5, 2],
      [E5, 1], [G5, 0.5], [A5, 0.5], [G5, 1], [F5, 0.5], [E5, 0.5],
      [A4, 3], [A4, 1]
    ];
    let t = now;
    for (const [f, d] of bellMelody) {
      this._osc('sine', f, 0.09, t, d * beat, Math.sin(t * 2) * 0.4);
      // Add octave down shimmer
      this._osc('sine', f / 2, 0.04, t, d * beat);
      t += d * beat;
    }

    // Rising pad (triangle)
    const pad = [[A3,4],[C3,4],[E3,4],[G3,4]];
    let tp = now;
    for (const [f, d] of pad) {
      this._osc('triangle', f, 0.07, tp, d * beat - 0.1);
      tp += d * beat;
    }

    // Syncopated hi-hat + snare
    for (let i = 0; i < 16; i++) {
      this._noise(overtime ? 0.18 : 0.12, now + i * beat * 0.5, 0.05);
    }
    for (let i = 0; i < 4; i++) {
      this._noise(0.2, now + (i * 4 + 2) * beat * 0.5, 0.08); // snare on 3
    }

    const duration = t - now + 0.1;
    const isOT = this.currentTrackName === 'frost_crown_overtime';
    const id = setTimeout(() => {
      if (this.currentTrackName === 'frost_crown' || isOT) this._playFrostCrown(isOT);
    }, duration * 1000);
    this.intervals.push(id);
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  playTrack(name) {
    if (!this.ctx) this.init();
    if (this.currentTrackName === name) return;
    this.stopMusic();
    this.currentTrackName = name;

    this.ctx?.resume();

    if (name === 'battle_hymn') this._playBattleHymn();
    else if (name === 'ember_rush') this._playEmberRush();
    else if (name === 'frost_crown') this._playFrostCrown(false);
    else if (name === 'frost_crown_overtime') this._playFrostCrown(true);
  }

  stopMusic() {
    this.currentTrackName = null;
    this.intervals.forEach(clearTimeout);
    this.intervals = [];
  }

  // ── Sound Effects ──────────────────────────────────────────────────────────
  playDeploy() {
    if (!this.sfxEnabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    this._osc('sine', 440, 0.15, now, 0.05);
    this._osc('sine', 660, 0.10, now + 0.05, 0.08);
  }

  playHit() {
    if (!this.sfxEnabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    this._osc('sawtooth', 150, 0.12, now, 0.04);
    this._noise(0.2, now, 0.04);
  }

  playTowerHit() {
    if (!this.sfxEnabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    this._osc('square', 80, 0.2, now, 0.15);
    this._osc('sine', 120, 0.1, now + 0.05, 0.12);
  }

  playTowerDestroyed() {
    if (!this.sfxEnabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      this._osc('sawtooth', 100 + i * 30, 0.2, now + i * 0.1, 0.3);
    }
    this._noise(0.4, now, 0.3);
    this._noise(0.3, now + 0.2, 0.4);
  }

  playWin() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.stopMusic();
    const now = this.ctx.currentTime;
    const fanfare = [[523, 0.1], [659, 0.1], [784, 0.15], [1047, 0.4]];
    let t = now;
    for (const [f, d] of fanfare) {
      this._osc('square', f, 0.15, t, d);
      t += d + 0.02;
    }
  }

  playLose() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.stopMusic();
    const now = this.ctx.currentTime;
    const sad = [[523, 0.15], [466, 0.15], [415, 0.15], [370, 0.5]];
    let t = now;
    for (const [f, d] of sad) {
      this._osc('triangle', f, 0.12, t, d);
      t += d + 0.02;
    }
  }

  playOvertime() {
    if (!this.sfxEnabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    this._osc('sine', 880, 0.15, now, 0.1);
    this._osc('sine', 1100, 0.12, now + 0.12, 0.12);
    this._osc('sine', 880, 0.10, now + 0.26, 0.2);
  }

  playLootOpen() {
    if (!this.sfxEnabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 8; i++) {
      this._osc('sine', 300 + i * 80, 0.1, now + i * 0.04, 0.06);
    }
  }

  playClick() {
    if (!this.sfxEnabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    this._osc('sine', 800, 0.08, now, 0.04);
  }
}

export const audioSystem = new AudioSystem();
