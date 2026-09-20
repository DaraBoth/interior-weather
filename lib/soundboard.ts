/**
 * The sound the Ministry plays before it asks you to copy it.
 *
 * Every clip here is synthesised at runtime from the same numbers the scorer
 * measures: a prompt's contour, its loudness target and the middle of its
 * duration window become the reference's pitch envelope, its gain and its
 * length. So "copy what you just heard" and "hit these targets" are the same
 * instruction, which they were not when the prompt was only a line of text.
 *
 * Nothing is downloaded. The obvious way to do this would be meme clips off
 * YouTube, but those are somebody's recording and this ships as an installable
 * app. Synthesis has no such problem, costs no bytes, and works on a phone with
 * no signal at a table. What it cannot do is sound like a specific person,
 * which is what the pass-the-phone mode is for: there the reference is a real
 * voice, recorded by whoever is holding the phone.
 */

import type { Contour, Prompt } from "./mimic";

let AC: AudioContext | null = null;

function ctx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!AC) {
    const C =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    AC = new C();
  }
  if (AC.state === "suspended") void AC.resume();
  return AC;
}

/** Where a sound sits before the contour moves it, in Hz. */
type Voice = {
  base: number;
  /** oscillator blend: how much of the buzzy one */
  saw: number;
  /** breath: band-passed noise mixed in */
  noise: number;
  /** vibrato depth in semitones, 0 for none */
  vib: number;
  vibHz: number;
  /** how many separate barks/calls the sound is made of */
  pulses: number;
};

const VOICES: Record<string, Voice> = {
  gecko:    { base: 300, saw: 0.8, noise: 0.35, vib: 0,    vibHz: 0,  pulses: 4 },
  vendor:   { base: 260, saw: 0.6, noise: 0.08, vib: 0.35, vibHz: 5,  pulses: 1 },
  drama:    { base: 420, saw: 0.35, noise: 0.05, vib: 0.7, vibHz: 6,  pulses: 1 },
  moto:     { base: 70,  saw: 1.0, noise: 0.22, vib: 0.1,  vibHz: 22, pulses: 1 },
  rooster:  { base: 380, saw: 0.75, noise: 0.18, vib: 0.3, vibHz: 9,  pulses: 3 },
  mosquito: { base: 620, saw: 0.15, noise: 0.03, vib: 0.25, vibHz: 14, pulses: 1 },
  karaoke:  { base: 330, saw: 0.4, noise: 0.03, vib: 0.18, vibHz: 5,  pulses: 1 },
  mum:      { base: 300, saw: 0.5, noise: 0.06, vib: 0.3,  vibHz: 5,  pulses: 2 },
  dog:      { base: 190, saw: 0.9, noise: 0.45, vib: 0,    vibHz: 0,  pulses: 3 },
  surprise: { base: 340, saw: 0.45, noise: 0.12, vib: 0.2, vibHz: 8,  pulses: 1 },
};

const FALLBACK: Voice = { base: 300, saw: 0.5, noise: 0.1, vib: 0.2, vibHz: 6, pulses: 1 };

/** The pitch path a contour describes, as multiples of the base, start to end. */
function path(c: Contour): number[] {
  switch (c) {
    case "rise":   return [0.78, 0.9, 1.05, 1.3, 1.45];
    case "fall":   return [1.45, 1.25, 1.0, 0.82, 0.7];
    case "flat":   return [1, 1.01, 0.99, 1.01, 1];
    case "wobble": return [1, 1.32, 0.82, 1.28, 0.88];
    default:       return [1, 1.05, 0.98, 1.04, 1];
  }
}

function noiseBuffer(a: AudioContext, seconds: number): AudioBuffer {
  const n = Math.max(1, Math.floor(a.sampleRate * seconds));
  const b = a.createBuffer(1, n, a.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

/**
 * Play the reference for a prompt. Resolves when it has finished, so the room
 * can hand the microphone over at exactly the right moment.
 */
export function playReference(p: Prompt): Promise<void> {
  const a = ctx();
  if (!a) return Promise.resolve();

  const v = VOICES[p.id] ?? FALLBACK;
  // the middle of the window the scorer will hold the player to
  const total = Math.min(4.5, (p.want.minMs + p.want.maxMs) / 2 / 1000);
  const t0 = a.currentTime + 0.06;

  const out = a.createGain();
  // want.loud is an RMS target; this is a peak, so it needs headroom above it
  out.gain.value = Math.min(0.55, p.want.loud * 1.6);
  out.connect(a.destination);

  const pts = path(p.want.contour);
  const pulses = v.pulses;
  // pulses share the window, with a gap between them
  const slot = total / pulses;
  const on = pulses === 1 ? slot : slot * 0.62;

  for (let k = 0; k < pulses; k++) {
    const start = t0 + k * slot;
    const end = start + on;

    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(1, start + Math.min(0.09, on * 0.22));
    g.gain.setValueAtTime(1, end - Math.min(0.14, on * 0.3));
    g.gain.exponentialRampToValueAtTime(0.0001, end);
    g.connect(out);

    // the two oscillators, blended
    const sine = a.createOscillator();
    sine.type = "sine";
    const saw = a.createOscillator();
    saw.type = "sawtooth";

    const gSine = a.createGain();
    gSine.gain.value = 1 - v.saw;
    const gSaw = a.createGain();
    gSaw.gain.value = v.saw;
    sine.connect(gSine).connect(g);
    saw.connect(gSaw).connect(g);

    // the contour, walked across this pulse. A multi-pulse sound walks the
    // whole path across all of its pulses, not once per pulse, so a rising
    // call still rises overall.
    const span = pulses === 1 ? [0, 1] : [k / pulses, (k + 1) / pulses];
    for (const osc of [sine, saw]) {
      osc.frequency.setValueAtTime(v.base * at(pts, span[0]), start);
      const steps = 8;
      for (let i = 1; i <= steps; i++) {
        const f = span[0] + ((span[1] - span[0]) * i) / steps;
        osc.frequency.exponentialRampToValueAtTime(
          Math.max(20, v.base * at(pts, f)),
          start + (on * i) / steps,
        );
      }
      osc.start(start);
      osc.stop(end + 0.02);
    }

    if (v.vib > 0) {
      const lfo = a.createOscillator();
      lfo.frequency.value = v.vibHz;
      const depth = a.createGain();
      // semitones to Hz, near the base
      depth.gain.value = v.base * (Math.pow(2, v.vib / 12) - 1);
      lfo.connect(depth);
      depth.connect(sine.frequency);
      depth.connect(saw.frequency);
      lfo.start(start);
      lfo.stop(end + 0.02);
    }

    if (v.noise > 0) {
      const src = a.createBufferSource();
      src.buffer = noiseBuffer(a, on + 0.05);
      const bp = a.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = v.base * 3;
      bp.Q.value = 1.1;
      const gn = a.createGain();
      gn.gain.value = v.noise;
      src.connect(bp).connect(gn).connect(g);
      src.start(start);
      src.stop(end + 0.02);
    }
  }

  const ms = (total + 0.25) * 1000;
  return new Promise((res) => setTimeout(res, ms));
}

/** Linear read of the contour path at 0..1. */
function at(pts: number[], f: number): number {
  const x = Math.max(0, Math.min(1, f)) * (pts.length - 1);
  const i = Math.floor(x);
  const j = Math.min(pts.length - 1, i + 1);
  return pts[i] + (pts[j] - pts[i]) * (x - i);
}

/** How long the reference for a prompt runs, in ms. Used to size the UI wait. */
export function referenceMs(p: Prompt): number {
  return Math.min(4.5, (p.want.minMs + p.want.maxMs) / 2 / 1000) * 1000 + 250;
}
