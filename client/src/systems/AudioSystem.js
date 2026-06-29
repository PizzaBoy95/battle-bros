// Procedural audio via Web Audio API
// Peaceful main menu, energetic battle tracks, rich SFX

class AudioSystem {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.reverbNode = null;
    this.currentTrackName = null;
    this.intervals = [];
    this.musicEnabled = true;
    this.sfxEnabled = true;
    this.volume = 0.4;
  }

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);
      this.reverbNode = this._buildReverb(2.2, 0.3);
    } catch (e) { console.warn('[Audio] unavailable', e); }
  }

  resume() { this.ctx?.resume(); }
  setVolume(v) { this.volume = v; if (this.masterGain) this.masterGain.gain.value = v; }
  setMusicEnabled(v) { this.musicEnabled = v; if (!v) this.stopMusic(); }
  setSfxEnabled(v) { this.sfxEnabled = v; }

  // ── Convolution reverb (makes everything sound spacious and warm) ──────────
  _buildReverb(decaySec, wetGain) {
    if (!this.ctx) return null;
    const len = Math.round(this.ctx.sampleRate * decaySec);
    const buf = this.ctx.createBuffer(2, len, this.ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++)
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
    }
    const conv = this.ctx.createConvolver();
    conv.buffer = buf;
    const wet = this.ctx.createGain();
    wet.gain.value = wetGain;
    conv.connect(wet);
    wet.connect(this.masterGain);
    return conv;          // nodes connect here for wet signal
  }

  // ── Core note player ──────────────────────────────────────────────────────
  _note(freq, start, dur, vol = 0.07, type = 'sine', wet = true) {
    if (!this.ctx) return;
    const osc  = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const att  = Math.min(0.1, dur * 0.2);
    const rel  = Math.min(0.3, dur * 0.35);
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(vol, start + att);
    gain.gain.setValueAtTime(vol, start + dur - rel);
    gain.gain.linearRampToValueAtTime(0, start + dur);
    osc.connect(gain);
    gain.connect(this.masterGain);
    if (wet && this.reverbNode) gain.connect(this.reverbNode);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  }

  _noise(vol, start, dur, hipass = 2400) {
    if (!this.ctx) return;
    const len = Math.ceil(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const flt = this.ctx.createBiquadFilter();
    flt.type = 'highpass'; flt.frequency.value = hipass;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, start);
    gain.gain.linearRampToValueAtTime(0, start + dur * 0.4);
    src.connect(flt); flt.connect(gain); gain.connect(this.masterGain);
    src.start(start); src.stop(start + dur);
  }

  // ── TRACK 1: Battle Hymn — peaceful, pentatonic, 76 BPM ──────────────────
  // D major pentatonic: D F# A B  (always harmonious, gentle)
  _playBattleHymn() {
    if (!this.musicEnabled || !this.ctx) return;
    const now = this.ctx.currentTime + 0.05;
    const Q   = 60 / 76 / 2;   // eighth note @ 76 BPM

    // Frequencies — D major pentatonic across 3 octaves
    const [D2,A2]         = [73.42, 110.00];
    const [D3,Fs3,A3,B3]  = [146.83, 184.99, 220.00, 246.94];
    const [D4,Fs4,A4,B4]  = [293.66, 369.99, 440.00, 493.88];
    const [D5,Fs5,A5]     = [587.33, 739.99, 880.00];

    // Flowing 8-bar melody (sine, very smooth)
    const mel = [
      [D4,3*Q],[Fs4,Q],[A4,2*Q],[B4,2*Q],
      [A4,3*Q],[Fs4,Q],[D4,4*Q],
      [Fs4,2*Q],[A4,Q],[B4,Q],[D5,2*Q],[A4,2*Q],
      [Fs4,3*Q],[D4,Q],[A3,4*Q],
      [A4,2*Q],[D5,Q],[Fs5,Q],[A5,2*Q],[Fs5,2*Q],
      [D5,3*Q],[A4,Q],[Fs4,4*Q],
      [B4,2*Q],[A4,Q],[Fs4,Q],[D4,2*Q],[A3,2*Q],
      [D4,6*Q],[D4,2*Q],
    ];
    let t = now;
    for (const [f,d] of mel) { this._note(f, t, d, 0.055, 'sine'); t += d; }

    // Second voice (harmony a third below, quieter)
    const harm = [
      [A3,3*Q],[D4,Q],[Fs4,2*Q],[A4,2*Q],
      [Fs4,3*Q],[D4,Q],[A3,4*Q],
      [D4,2*Q],[Fs4,4*Q],[D4,2*Q],
      [A3,3*Q],[Fs3,Q],[D3,4*Q],
      [Fs4,2*Q],[A4,4*Q],[Fs4,2*Q],
      [D4,3*Q],[A3,Q],[Fs3,4*Q],
      [A3,2*Q],[Fs3,Q],[D3,Q],[A2,2*Q],[D3,2*Q],
      [D3,6*Q],[D3,2*Q],
    ];
    let th = now;
    for (const [f,d] of harm) { this._note(f, th, d, 0.030, 'triangle'); th += d; }

    // Soft sustained chord pad (triangle, very quiet, long attacks)
    const pad = [[D2,A2,D3], [A2,Fs3,A3], [D2,A2,D3], [A2,B3,Fs3]];
    const padDur = 8 * Q;
    let tp = now;
    for (const chord of pad) {
      for (const f of chord) {
        const osc  = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle'; osc.frequency.value = f;
        gain.gain.setValueAtTime(0, tp);
        gain.gain.linearRampToValueAtTime(0.022, tp + padDur * 0.4);
        gain.gain.linearRampToValueAtTime(0, tp + padDur);
        osc.connect(gain);
        gain.connect(this.masterGain);
        if (this.reverbNode) gain.connect(this.reverbNode);
        osc.start(tp); osc.stop(tp + padDur + 0.1);
      }
      tp += padDur;
    }

    const total = t - now + 0.5;
    this.intervals.push(setTimeout(() => {
      if (this.currentTrackName === 'battle_hymn') this._playBattleHymn();
    }, total * 1000));
  }

  // ── TRACK 2: Ember Rush — A minor pentatonic, 138 BPM, energetic ─────────
  _playEmberRush() {
    if (!this.musicEnabled || !this.ctx) return;
    const now  = this.ctx.currentTime + 0.05;
    const Q    = 60 / 138 / 2;

    const [A2,E3,A3]      = [110.00, 164.81, 220.00];
    const [A4,C5,E5,G5]   = [440.00, 523.25, 659.26, 783.99];
    const [A5,C6]         = [880.00, 1046.50];

    // Driving 4-bar arpeggio lead
    const lead = [
      A4,C5,E5,A5, G5,E5,C5,A4, C5,E5,G5,C6, A5,G5,E5,C5,
      A4,E5,A5,E5, C5,G5,C6,G5, E5,A5,E5,A4, A4,A4,A4,A5
    ];
    lead.forEach((f,i) => this._note(f, now + i*Q, Q*0.85, 0.055, 'triangle'));

    // Counter-melody
    const ctr = [A3,C5/2,E3,A3, A3,E3,A2,E3, A3,A3,A3,E3, A3,A2,E3,A2];
    ctr.forEach((f,i) => this._note(f, now + i*Q*2, Q*1.9, 0.035, 'sine'));

    // Punchy bass
    const bass = [[A2,2*Q],[E3,2*Q],[A2,2*Q],[E3,Q],[A2,Q],
                  [A2,2*Q],[E3,2*Q],[A2,4*Q]];
    let tb = now;
    for (const [f,d] of bass) { this._note(f, tb, d, 0.10, 'sine', false); tb += d; }

    // Kick (sine thump) + snare (noise)
    for (let i = 0; i < 32; i++) {
      if (i % 4 === 0) {
        this._note(55, now + i*Q, Q*0.4, 0.22, 'sine', false);
        const osc2 = this.ctx.createOscillator();
        const g2   = this.ctx.createGain();
        osc2.type = 'sine'; osc2.frequency.setValueAtTime(80, now + i*Q);
        osc2.frequency.linearRampToValueAtTime(40, now + i*Q + 0.1);
        g2.gain.setValueAtTime(0.22, now + i*Q);
        g2.gain.linearRampToValueAtTime(0, now + i*Q + 0.1);
        osc2.connect(g2); g2.connect(this.masterGain);
        osc2.start(now + i*Q); osc2.stop(now + i*Q + 0.12);
      }
      if (i % 8 === 4) this._noise(0.12, now + i*Q, 0.06, 2800);
      if (i % 2 === 0) this._noise(0.025, now + i*Q, 0.025, 6000);
    }

    const total = 32*Q + 0.5;
    this.intervals.push(setTimeout(() => {
      if (this.currentTrackName === 'ember_rush') this._playEmberRush();
    }, total * 1000));
  }

  // ── TRACK 3: Frost Crown — D minor pentatonic, 124 BPM, atmospheric ───────
  _playFrostCrown(overtime = false) {
    if (!this.musicEnabled || !this.ctx) return;
    const now = this.ctx.currentTime + 0.05;
    const Q   = 60 / (overtime ? 148 : 124) / 2;

    const [D3,F3,A3,C4]  = [146.83, 174.61, 220.00, 261.63];
    const [D4,F4,A4,C5]  = [293.66, 349.23, 440.00, 523.25];
    const [D5,F5,A5]     = [587.33, 698.46, 880.00];

    // Bell-like melody (sine — icy crystal sound)
    const mel = overtime ? [
      D5,A4,F4,D4, A4,F4,D4,A3, F4,C5,A4,F4, D5,A4,F5,D5,
      A5,F5,D5,A4, F5,D5,A4,F4, D5,C5,A4,D4, A4,F4,D4,D4
    ] : [
      D4,F4,A4,D5, A4,F4,D4,A3, F4,A4,C5,F5, D5,C5,A4,F4,
      A4,D5,F5,A5, F5,D5,A4,F4, D4,A4,D5,A5, D5,A4,F4,D4
    ];
    mel.forEach((f,i) => this._note(f, now + i*Q, Q*0.88, 0.058, 'sine'));

    // Sub-octave shimmer
    mel.forEach((f,i) => this._note(f/2, now + i*Q, Q*0.85, 0.022, 'sine'));

    // Driving eighth-note bass
    const bassNotes = [D3,A3,F3,C4, D3,A3,D3,A3];
    bassNotes.forEach((f,i) => this._note(f, now + i*4*Q, 3.5*Q, 0.09, 'sine', false));

    // Hi-hat + snare pattern
    for (let i = 0; i < 32; i++) {
      this._noise(overtime ? 0.048 : 0.030, now + i*Q, 0.025, 7000);
      if (i % 8 === 4) this._noise(overtime ? 0.14 : 0.10, now + i*Q, 0.07, 2500);
      if (i % 16 === 0 || i % 16 === 8) {
        this._note(48, now + i*Q, 0.12, 0.20, 'sine', false);
      }
    }

    const total = 32*Q + 0.5;
    this.intervals.push(setTimeout(() => {
      if (this.currentTrackName === 'frost_crown' || this.currentTrackName === 'frost_crown_overtime')
        this._playFrostCrown(overtime || this.currentTrackName === 'frost_crown_overtime');
    }, total * 1000));
  }

  // ── Public track API ──────────────────────────────────────────────────────
  playTrack(name) {
    if (!this.ctx) this.init();
    if (this.currentTrackName === name) return;
    this.stopMusic();
    this.currentTrackName = name;
    this.ctx?.resume();
    if (name === 'battle_hymn')           this._playBattleHymn();
    else if (name === 'ember_rush')       this._playEmberRush();
    else if (name === 'frost_crown')      this._playFrostCrown(false);
    else if (name === 'frost_crown_overtime') this._playFrostCrown(true);
  }

  stopMusic() {
    this.currentTrackName = null;
    this.intervals.forEach(clearTimeout);
    this.intervals = [];
  }

  // ── Sound Effects ─────────────────────────────────────────────────────────
  playClick() {
    if (!this.sfxEnabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    this._note(1200, now, 0.035, 0.06, 'sine', false);
    this._note(900,  now + 0.018, 0.03, 0.04, 'sine', false);
  }

  playDeploy() {
    if (!this.sfxEnabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    // Rising whoosh + thud
    const osc  = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.linearRampToValueAtTime(600, now + 0.08);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.10);
    osc.connect(gain); gain.connect(this.masterGain);
    osc.start(now); osc.stop(now + 0.12);
    this._noise(0.12, now + 0.06, 0.06, 1200);
  }

  playHit() {
    if (!this.sfxEnabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    this._note(180, now, 0.06, 0.10, 'sine', false);
    this._noise(0.10, now, 0.04, 1800);
  }

  playTowerHit() {
    if (!this.sfxEnabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    this._note(90,  now, 0.18, 0.18, 'sine', false);
    this._note(140, now + 0.04, 0.12, 0.10, 'sine', false);
  }

  playTowerDestroyed() {
    if (!this.sfxEnabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    // Dramatic boom + rumble
    for (let i = 0; i < 3; i++) {
      this._note(60 + i * 20, now + i * 0.08, 0.4, 0.20, 'sine', false);
    }
    this._noise(0.35, now, 0.25, 400);
    this._noise(0.22, now + 0.2, 0.5, 200);
  }

  playWin() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.stopMusic();
    const now = this.ctx.currentTime;
    const fanf = [[523.25,0.08],[659.26,0.08],[783.99,0.10],[1046.50,0.06],[1318.5,0.45]];
    let t = now;
    for (const [f,d] of fanf) { this._note(f, t, d, 0.13, 'triangle'); t += d + 0.015; }
  }

  playLose() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.stopMusic();
    const now = this.ctx.currentTime;
    const sad = [[523.25,0.18],[466.16,0.18],[415.30,0.18],[370.00,0.6]];
    let t = now;
    for (const [f,d] of sad) { this._note(f, t, d, 0.10, 'triangle'); t += d + 0.02; }
  }

  playOvertime() {
    if (!this.sfxEnabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    this._note(880, now, 0.12, 0.14, 'sine');
    this._note(1100, now + 0.13, 0.12, 0.12, 'sine');
    this._note(880, now + 0.28, 0.22, 0.10, 'sine');
  }

  playLootOpen() {
    if (!this.sfxEnabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [293.66, 369.99, 440, 587.33, 739.99, 880, 1046.5, 1318.5];
    notes.forEach((f,i) => this._note(f, now + i * 0.038, 0.12, 0.07, 'sine'));
  }
}

export const audioSystem = new AudioSystem();
