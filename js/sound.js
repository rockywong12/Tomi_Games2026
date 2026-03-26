// sound.js - Web Audio API: 20 unique per-level soundtracks + SFX

const Sound = {
  ctx: null,
  musicGain: null,
  musicInterval: null,
  currentLevelId: 0,
  muted: false,

  init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { console.warn('Web Audio not supported.'); }
  },

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },

  // ─── Low-level helpers ────────────────────────────────────────────────────
  _tone(type, f0, f1, dur, vol, delay) {
    if (!this.ctx || this.muted) return;
    const t0   = this.ctx.currentTime + (delay || 0);
    const osc  = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(f0, t0);
    if (f1 && f1 !== f0) osc.frequency.exponentialRampToValueAtTime(f1, t0 + dur * 0.9);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.start(t0); osc.stop(t0 + dur + 0.01);
  },

  // ─── SFX ────────────────────────────────────────────────────────────────────
  jump()        { this.resume(); this._tone('square',   340, 680,  0.13, 0.12); },
  doubleJump()  { this.resume(); this._tone('square',   480, 960,  0.11, 0.10); this._tone('square', 600, 1200, 0.09, 0.08, 0.07); },
  death()       { this.resume(); this._tone('sawtooth', 440, 55,   0.50, 0.18); this._tone('square', 220, 35,   0.35, 0.10, 0.08); this._tone('square', 150, 150, 0.06, 0.25); },
  levelComplete(){ this.resume();
    [{ f:523,d:0.00 },{ f:659,d:0.11 },{ f:784,d:0.22 },{ f:1047,d:0.33 }]
    .forEach(n => this._tone('sine', n.f, n.f, 0.32, 0.18, n.d)); },

  // ─── 20 unique level themes ──────────────────────────────────────────────────
  /*
    Each theme: { bpm, wave, scale[], melody[], bass[], bassScale[], vol }
    melody[] = indices into scale (or -1 for rest)
    bass[]   = indices into bassScale (or -1 for rest)
    Melody plays at 8th-note intervals; bass plays at half-note intervals.
  */
  _themes: [
    // 1 Sweet Start — C major, upbeat, triangle
    { bpm:120, wave:'triangle', vol:0.07,
      scale:[523,587,659,698,784,880,988,1047],
      melody:[0,2,4,2,0,4,2,4,0,2,4,7,4,2,0,-1],
      bass:[0,-1,4,-1,0,-1,2,-1], bassScale:[261,330,392,349] },

    // 2 Gummy Way — G major, bouncy, square
    { bpm:126, wave:'square', vol:0.05,
      scale:[392,440,494,523,587,659,740,784],
      melody:[0,-1,2,4,-1,2,5,4,2,-1,0,2,4,5,4,-1],
      bass:[0,-1,2,-1,3,-1,0,-1], bassScale:[196,247,294,262] },

    // 3 Lollipop Lane — A major, whimsical, sine
    { bpm:114, wave:'sine', vol:0.08,
      scale:[440,494,554,587,659,740,831,880],
      melody:[0,2,4,5,4,2,0,-1,1,3,5,7,5,3,1,-1],
      bass:[0,-1,3,-1,4,-1,0,-1], bassScale:[220,277,330,294] },

    // 4 Caramel Crunch — D major, energetic, triangle
    { bpm:132, wave:'triangle', vol:0.07,
      scale:[587,659,740,784,880,988,1109,1175],
      melody:[0,2,4,2,5,4,2,0,0,3,5,7,5,3,0,-1],
      bass:[0,-1,2,-1,4,-1,2,-1], bassScale:[294,370,440,392] },

    // 5 Sugar Rush — E major, fast frenzy, sawtooth (soft)
    { bpm:145, wave:'triangle', vol:0.06,
      scale:[659,740,830,880,988,1109,1245,1319],
      melody:[0,2,4,0,2,4,5,4,0,2,4,7,5,4,2,0],
      bass:[0,-1,4,-1,3,-1,4,-1], bassScale:[330,415,494,440] },

    // 6 Launchpad — C minor, tense, square
    { bpm:130, wave:'square', vol:0.05,
      scale:[523,554,622,659,740,784,880,932],
      melody:[0,-1,2,3,-1,2,0,-1,1,3,5,-1,3,1,0,-1],
      bass:[0,-1,3,-1,5,-1,0,-1], bassScale:[261,311,392,349] },

    // 7 Asteroid Belt — B-flat minor, mysterious, triangle
    { bpm:128, wave:'triangle', vol:0.06,
      scale:[466,523,554,622,698,740,831,932],
      melody:[0,2,-1,4,2,-1,0,2,3,5,-1,3,1,-1,0,-1],
      bass:[0,-1,2,-1,5,-1,3,-1], bassScale:[233,294,349,311] },

    // 8 Nebula Run — D minor, flowing arpeggios, sine
    { bpm:122, wave:'sine', vol:0.08,
      scale:[587,622,698,784,831,932,1047,1109],
      melody:[0,2,4,5,4,2,0,2,1,3,5,7,5,3,1,-1],
      bass:[0,-1,4,-1,3,-1,2,-1], bassScale:[294,349,440,392] },

    // 9 Galaxy Trail — F# minor, dreamy, triangle
    { bpm:118, wave:'triangle', vol:0.07,
      scale:[370,415,466,494,554,622,698,740],
      melody:[0,-1,3,5,-1,3,0,-1,2,4,7,-1,4,2,0,-1],
      bass:[0,-1,3,-1,5,-1,0,-1], bassScale:[185,220,277,247] },

    // 10 Warp Speed — A minor, intense, sawtooth (soft)
    { bpm:155, wave:'triangle', vol:0.05,
      scale:[440,494,523,587,659,698,784,880],
      melody:[0,2,0,4,0,2,4,-1,0,3,0,5,3,2,0,-1],
      bass:[0,-1,4,-1,5,-1,3,-1], bassScale:[220,294,330,277] },

    // 11 Coral Coast — C major, calm surf, sine
    { bpm:108, wave:'sine', vol:0.08,
      scale:[523,587,659,698,784,880,988,1047],
      melody:[0,2,4,5,7,5,4,2,0,2,4,5,4,2,0,-1],
      bass:[0,-1,4,-1,0,-1,3,-1], bassScale:[261,330,392,349] },

    // 12 Kelp Forest — G minor, swaying, triangle
    { bpm:112, wave:'triangle', vol:0.07,
      scale:[392,440,466,523,587,622,698,784],
      melody:[0,2,3,5,3,2,0,-1,0,2,3,5,7,5,3,-1],
      bass:[0,-1,3,-1,5,-1,2,-1], bassScale:[196,233,294,261] },

    // 13 Underwater Caves — E-flat minor, echo-like, sine
    { bpm:100, wave:'sine', vol:0.09,
      scale:[622,659,740,784,880,932,1047,1109],
      melody:[0,-1,2,4,-1,2,5,-1,0,3,-1,5,3,-1,0,-1],
      bass:[0,-1,3,-1,5,-1,2,-1], bassScale:[311,349,440,392] },

    // 14 Abyss — C# minor, dark, triangle
    { bpm:95, wave:'triangle', vol:0.08,
      scale:[554,587,659,740,784,880,932,1047],
      melody:[0,-1,-1,3,2,-1,0,-1,1,-1,5,3,-1,1,0,-1],
      bass:[0,-1,-1,-1,3,-1,-1,-1], bassScale:[277,311,370,330] },

    // 15 Tsunami — D minor, building wave, square (soft)
    { bpm:140, wave:'triangle', vol:0.06,
      scale:[587,622,698,784,831,932,1047,1109],
      melody:[0,2,4,5,4,2,0,2,3,5,7,5,3,2,0,-1],
      bass:[0,-1,4,-1,0,-1,5,-1], bassScale:[294,349,440,415] },

    // 16 Lava Fields — A minor, driving, square
    { bpm:135, wave:'square', vol:0.05,
      scale:[440,494,523,587,659,698,784,880],
      melody:[0,2,0,3,0,2,3,-1,0,2,4,3,2,0,-1,-1],
      bass:[0,-1,3,-1,5,-1,0,-1], bassScale:[220,277,330,294] },

    // 17 Magma Surge — E minor, aggressive, triangle
    { bpm:148, wave:'triangle', vol:0.06,
      scale:[659,740,784,880,988,1047,1175,1319],
      melody:[0,2,0,4,2,0,4,2,0,3,5,3,0,3,5,-1],
      bass:[0,-1,4,-1,3,-1,4,-1], bassScale:[330,415,440,392] },

    // 18 Eruption — D minor, eruptive bursts, sawtooth (soft)
    { bpm:152, wave:'triangle', vol:0.05,
      scale:[587,659,698,784,880,932,1047,1175],
      melody:[0,3,0,5,3,0,5,3,0,4,7,4,0,4,7,-1],
      bass:[0,-1,5,-1,3,-1,5,-1], bassScale:[294,370,440,392] },

    // 19 Inferno — F# minor, relentless, square
    { bpm:158, wave:'square', vol:0.04,
      scale:[740,784,880,988,1047,1175,1319,1397],
      melody:[0,2,4,2,5,4,2,0,0,3,5,7,5,3,2,0],
      bass:[0,-1,4,-1,5,-1,3,-1], bassScale:[370,440,494,466] },

    // 20 Final Flame — B minor, epic climax, triangle+bass
    { bpm:165, wave:'triangle', vol:0.06,
      scale:[494,554,587,659,740,784,880,988],
      melody:[0,2,4,7,4,2,0,2,1,3,5,7,5,3,1,0],
      bass:[0,-1,4,-1,7,-1,5,-1], bassScale:[247,294,370,330] },
  ],

  // ─── Start music for a specific level ────────────────────────────────────────
  startMusic(levelId) {
    if (this.currentLevelId === levelId && this.musicInterval) return;
    this.stopMusic();
    this.currentLevelId = levelId;
    if (!this.ctx || this.muted) return;
    this.resume();

    const theme   = this._themes[Math.min(levelId - 1, 19)];
    const beatMs  = (60000 / theme.bpm) / 2;   // 8th-note duration
    const halfMs  = beatMs * 4;                  // half-note for bass
    let melStep   = 0;
    let bassStep  = 0;

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = theme.vol;
    this.musicGain.connect(this.ctx.destination);

    const self = this;

    // Melody ticker (8th notes)
    this.musicInterval = setInterval(() => {
      if (!self.ctx || !self.musicGain || self.muted) return;
      const idx = theme.melody[melStep % theme.melody.length];
      if (idx >= 0) {
        try {
          const osc = self.ctx.createOscillator();
          const g   = self.ctx.createGain();
          osc.connect(g); g.connect(self.musicGain);
          osc.type = theme.wave;
          osc.frequency.value = theme.scale[idx % theme.scale.length];
          const t = self.ctx.currentTime;
          g.gain.setValueAtTime(0.45, t);
          g.gain.exponentialRampToValueAtTime(0.0001, t + (beatMs / 1000) * 0.82);
          osc.start(t); osc.stop(t + (beatMs / 1000) * 0.88);
        } catch (e) {}
      }
      melStep++;
    }, beatMs);

    // Bass ticker (half notes) — runs alongside melody
    this._bassInterval = setInterval(() => {
      if (!self.ctx || !self.musicGain || self.muted) return;
      const idx = theme.bass[bassStep % theme.bass.length];
      if (idx >= 0 && theme.bassScale) {
        try {
          const osc = self.ctx.createOscillator();
          const g   = self.ctx.createGain();
          osc.connect(g); g.connect(self.musicGain);
          osc.type = 'sine';
          osc.frequency.value = theme.bassScale[idx % theme.bassScale.length];
          const t = self.ctx.currentTime;
          g.gain.setValueAtTime(0.55, t);
          g.gain.exponentialRampToValueAtTime(0.0001, t + (halfMs / 1000) * 0.75);
          osc.start(t); osc.stop(t + (halfMs / 1000) * 0.80);
        } catch (e) {}
      }
      bassStep++;
    }, halfMs);
  },

  stopMusic() {
    if (this.musicInterval)  { clearInterval(this.musicInterval);  this.musicInterval  = null; }
    if (this._bassInterval)  { clearInterval(this._bassInterval);  this._bassInterval  = null; }
    if (this.musicGain && this.ctx) {
      try { this.musicGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.12); } catch(e) {}
      this.musicGain = null;
    }
    this.currentLevelId = 0;
  },

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) this.stopMusic();
    return this.muted;
  }
};
