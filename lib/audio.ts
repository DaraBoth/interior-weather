/**
 * Every sound in this building is synthesised at runtime.
 * Nothing is downloaded, so nothing can fail to load on bad party wifi,
 * and there is no loop seam to hear.
 */

let AC: AudioContext | null = null;
let muted = false;

function ctx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!AC) {
    const C = window.AudioContext || (window as any).webkitAudioContext;
    if (!C) return null;
    AC = new C();
  }
  if (AC.state === "suspended") void AC.resume();
  return AC;
}

export function setMuted(v: boolean) {
  muted = v;
}
export function isMuted() {
  return muted;
}

function shape(gain: GainNode, peak: number, dur: number) {
  const a = ctx();
  if (!a) return;
  gain.gain.setValueAtTime(0.0001, a.currentTime);
  gain.gain.exponentialRampToValueAtTime(peak, a.currentTime + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
}

export function beep(freq = 880, dur = 0.09, type: OscillatorType = "square") {
  const a = ctx();
  if (!a || muted) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.value = freq;
  shape(g, 0.12, dur);
  o.connect(g);
  g.connect(a.destination);
  o.start();
  o.stop(a.currentTime + dur + 0.02);
}

export function boing() {
  const a = ctx();
  if (!a || muted) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(680, a.currentTime);
  o.frequency.exponentialRampToValueAtTime(90, a.currentTime + 0.42);
  const lfo = a.createOscillator();
  const lg = a.createGain();
  lfo.frequency.value = 17;
  lg.gain.value = 45;
  lfo.connect(lg);
  lg.connect(o.frequency);
  lfo.start();
  shape(g, 0.32, 0.45);
  o.connect(g);
  g.connect(a.destination);
  o.start();
  o.stop(a.currentTime + 0.5);
  lfo.stop(a.currentTime + 0.5);
}

/** the machine's honest opinion of you */
export function raspberry() {
  const a = ctx();
  if (!a || muted) return;
  const o = a.createOscillator();
  const g = a.createGain();
  const f = a.createBiquadFilter();
  o.type = "sawtooth";
  o.frequency.setValueAtTime(112, a.currentTime);
  o.frequency.linearRampToValueAtTime(58, a.currentTime + 0.34);
  const w = a.createOscillator();
  const wg = a.createGain();
  w.frequency.value = 26;
  wg.gain.value = 34;
  w.connect(wg);
  wg.connect(o.frequency);
  w.start();
  f.type = "lowpass";
  f.frequency.value = 760;
  shape(g, 0.32, 0.36);
  o.connect(f);
  f.connect(g);
  g.connect(a.destination);
  o.start();
  o.stop(a.currentTime + 0.4);
  w.stop(a.currentTime + 0.4);
}

export function clunk() {
  const a = ctx();
  if (!a || muted) return;
  const len = a.sampleRate * 0.14;
  const b = a.createBuffer(1, len, a.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  const s = a.createBufferSource();
  s.buffer = b;
  const f = a.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = 420;
  const g = a.createGain();
  g.gain.value = 0.45;
  s.connect(f);
  f.connect(g);
  g.connect(a.destination);
  s.start();
}

/** for your worst decisions */
export function trombone() {
  const a = ctx();
  if (!a || muted) return;
  const steps = [392, 349, 311, 262];
  const t = a.currentTime;
  steps.forEach((fr, i) => {
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(fr, t + i * 0.19);
    const f = a.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 1100;
    g.gain.setValueAtTime(0.0001, t + i * 0.19);
    g.gain.exponentialRampToValueAtTime(0.2, t + i * 0.19 + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.19 + 0.2);
    o.connect(f);
    f.connect(g);
    g.connect(a.destination);
    o.start(t + i * 0.19);
    o.stop(t + i * 0.19 + 0.22);
  });
}

export function alarm() {
  for (let i = 0; i < 4; i++) {
    setTimeout(() => beep(i % 2 ? 520 : 760, 0.12), i * 160);
  }
}

/** ascending arpeggio, for the moment someone is chosen */
export function fanfare() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((n, i) => setTimeout(() => beep(n, 0.16, "triangle"), i * 110));
}

/** the tension while the chamber scans */
export function tick() {
  beep(1200, 0.03, "square");
}

/** something has been discovered */
export function chime() {
  const notes = [784, 1047, 1319];
  notes.forEach((n, i) => setTimeout(() => beep(n, 0.22, "sine"), i * 90));
}
