/**
 * Procedural audio engine using the Web Audio API.
 * Generates all SFX and chiptune music without external files.
 * Browsers require a user gesture before AudioContext can run —
 * call resume() from a pointer/keyboard handler before playing.
 */

// Frequencies for musical notes
const N = {
  G2: 98.00,
  C3: 130.81, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00,
  C4: 261.63, E4: 329.63, G4: 392.00, A4: 440.00,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.00,
  C6: 1046.50,
};

// 16-beat melody (8th notes at 120 BPM) and matching 8-beat bass
const MELODY = [N.C5, N.E5, N.G5, N.A5, N.G5, N.E5, N.C5, N.G4,
                N.C5, N.E5, N.G5, N.A5, N.G5, N.A5, N.G5, N.E5];
const BASS   = [N.C3, N.G3, N.F3, N.G3, N.C3, N.G3, N.A3, N.G3];

const TEMPO       = 120;       // BPM
const BEAT_S      = 60 / TEMPO; // seconds per quarter note
const NOTE_S      = BEAT_S / 2; // 8th note duration
const LOOKAHEAD   = 0.12;      // schedule this many seconds ahead
const TICK_MS     = 40;        // scheduler tick interval (ms)

export default class ProceduralAudio {
  constructor() {
    this._ac         = null;
    this._masterGain = null;
    this._musicGain  = null;
    this._ticker     = null;
    this._beat       = 0;
    this._nextTime   = 0;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  resume() {
    const ac = this._ctx();
    if (ac.state === 'suspended') ac.resume();
  }

  destroy() {
    this.stopMusic();
    if (this._ac) { this._ac.close(); this._ac = null; }
  }

  // ── SFX ──────────────────────────────────────────────────────────────────

  playJump() {
    // Quick rising blip
    this._tone('square', 180, 380, 0.08, 0.12, 0.18);
  }

  playCollect() {
    // Short ascending arpeggio: C E G
    const ac = this._ctx();
    const t  = ac.currentTime;
    [N.C5, N.E5, N.G5].forEach((freq, i) => {
      this._note(ac, freq, 'square', 0.18, t + i * 0.06, 0.06);
    });
  }

  playDie() {
    // Descending sawtooth crash
    this._tone('sawtooth', 420, 60, 0.45, 0.55, 0.22);
  }

  playComplete() {
    // Happy rising arpeggio: C E G C
    const ac = this._ctx();
    const t  = ac.currentTime;
    [N.C5, N.E5, N.G5, N.C6].forEach((freq, i) => {
      this._note(ac, freq, 'square', 0.22, t + i * 0.1, 0.12);
    });
  }

  // ── Music ─────────────────────────────────────────────────────────────────

  startMusic() {
    if (this._ticker) return;
    const ac = this._ctx();

    this._musicGain = ac.createGain();
    this._musicGain.gain.value = 0.1;
    this._musicGain.connect(this._masterGain);

    this._beat     = 0;
    this._nextTime = ac.currentTime + 0.05;
    this._ticker   = setInterval(() => this._tick(), TICK_MS);
  }

  stopMusic() {
    if (this._ticker) { clearInterval(this._ticker); this._ticker = null; }
    if (this._musicGain && this._ac) {
      this._musicGain.gain.setTargetAtTime(0, this._ac.currentTime, 0.08);
    }
  }

  // ── Internal helpers ──────────────────────────────────────────────────────

  _ctx() {
    if (!this._ac) {
      this._ac = new (window.AudioContext || window.webkitAudioContext)();
      this._masterGain = this._ac.createGain();
      this._masterGain.gain.value = 1;
      this._masterGain.connect(this._ac.destination);
    }
    return this._ac;
  }

  _tick() {
    if (!this._ac || !this._musicGain) return;
    const ac = this._ac;
    while (this._nextTime < ac.currentTime + LOOKAHEAD) {
      const b = this._beat;

      // Melody — every beat
      this._musicNote(ac, MELODY[b % 16], 'square',   0.55, this._nextTime, NOTE_S * 0.85);

      // Bass — every 2nd beat (quarter note pace)
      if (b % 2 === 0) {
        this._musicNote(ac, BASS[(b / 2) % 8], 'triangle', 0.9, this._nextTime, NOTE_S * 1.8);
      }

      this._nextTime += NOTE_S;
      this._beat++;
    }
  }

  _musicNote(ac, freq, type, gainScale, t, dur) {
    const osc = ac.createOscillator();
    const g   = ac.createGain();
    osc.type            = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gainScale, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g);
    g.connect(this._musicGain);
    osc.start(t);
    osc.stop(t + dur + 0.01);
  }

  // One-shot SFX tone with frequency sweep
  _tone(type, freqStart, freqEnd, sweepDur, totalDur, volume) {
    const ac  = this._ctx();
    const t   = ac.currentTime;
    const osc = ac.createOscillator();
    const g   = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, t);
    osc.frequency.exponentialRampToValueAtTime(freqEnd, t + sweepDur);
    g.gain.setValueAtTime(volume, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + totalDur);
    osc.connect(g);
    g.connect(this._masterGain);
    osc.start(t);
    osc.stop(t + totalDur + 0.01);
  }

  // Single note for arpeggios
  _note(ac, freq, type, volume, t, dur) {
    const osc = ac.createOscillator();
    const g   = ac.createGain();
    osc.type            = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(volume, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g);
    g.connect(this._masterGain);
    osc.start(t);
    osc.stop(t + dur + 0.01);
  }
}
