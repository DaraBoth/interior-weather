/**
 * ត្រាប់តាមសំឡេង — the sound imitation game.
 *
 * The player is given a sound to make, makes it into the microphone, and the
 * Ministry rates the attempt. A bad rating means they drink.
 *
 * The scoring is real. It measures loudness, how long they held it, and what
 * their pitch actually did, then compares that against what the prompt asked
 * for. Nothing here is random, because a game that fakes its judgement stops
 * being funny the second somebody notices.
 *
 * No recording is kept and nothing is uploaded. The analysis runs on samples in
 * memory and they are dropped when the round ends.
 */

export type Contour = "rise" | "fall" | "flat" | "wobble" | "any";

export type Prompt = {
  id: string;
  /** What to make, in Khmer. */
  km: string;
  /** The same, for the English side of the room. */
  en: string;
  /** A hint at how it should go. */
  hintKm: string;
  hintEn: string;
  want: {
    /** Shortest attempt that counts as trying, in ms. */
    minMs: number;
    /** Longest before it stops being the sound and becomes a siege. */
    maxMs: number;
    /** How committed it has to be, 0..1 of full scale. */
    loud: number;
    contour: Contour;
  };
};

/**
 * Sounds a Cambodian player can make in a room full of friends without
 * needing anything explained. Written for this game.
 */
export const PROMPTS: Prompt[] = [
  {
    id: "gecko",
    km: "ស្រែកដូចជីងចក់",
    en: "Call like a tokay gecko",
    hintKm: "ខ្លាំង ដាច់ៗ ម្តងហើយម្តងទៀត",
    hintEn: "Loud, barked, and repeated",
    want: { minMs: 900, maxMs: 4000, loud: 0.3, contour: "wobble" },
  },
  {
    id: "vendor",
    km: "ស្រែកលក់ដូចអ្នកលក់នៅផ្សារ",
    en: "Call out like a market seller",
    hintKm: "អូសវែង ឡើងខ្ពស់នៅចុង",
    hintEn: "Drawn out, lifting at the end",
    want: { minMs: 1200, maxMs: 5000, loud: 0.25, contour: "rise" },
  },
  {
    id: "drama",
    km: "យំដូចក្នុងរឿងភាគ",
    en: "Cry like a soap opera",
    hintKm: "ចាប់ផ្តើមខ្ពស់ រួចធ្លាក់ចុះយឺតៗ",
    hintEn: "Start high, fall away slowly",
    want: { minMs: 1500, maxMs: 6000, loud: 0.28, contour: "fall" },
  },
  {
    id: "moto",
    km: "ធ្វើសំឡេងម៉ូតូឡើងល្បឿន",
    en: "Rev a motorbike",
    hintKm: "ទាបទៅខ្ពស់ កុំដាច់",
    hintEn: "Low to high, do not break it",
    want: { minMs: 1000, maxMs: 4500, loud: 0.3, contour: "rise" },
  },
  {
    id: "rooster",
    km: "រងាវដូចមាន់ឈ្មោល",
    en: "Crow like a rooster",
    hintKm: "ខ្លាំង ហើយបត់នៅចុង",
    hintEn: "Loud, with a turn at the end",
    want: { minMs: 900, maxMs: 3500, loud: 0.35, contour: "wobble" },
  },
  {
    id: "mosquito",
    km: "ធ្វើសំឡេងមូសក្បែរត្រចៀក",
    en: "Be a mosquito near an ear",
    hintKm: "ស្តើង ខ្ពស់ និងឈឺចាប់",
    hintEn: "Thin, high, and upsetting",
    want: { minMs: 1200, maxMs: 5000, loud: 0.12, contour: "flat" },
  },
  {
    id: "karaoke",
    km: "ទាញសំឡេងវែងដូចច្រៀងខារ៉ាអូខេ",
    en: "Hold a karaoke note",
    hintKm: "មួយសំឡេង កុំញាប់ កុំដាច់",
    hintEn: "One note. No wobbling. No breathing.",
    want: { minMs: 2500, maxMs: 8000, loud: 0.22, contour: "flat" },
  },
  {
    id: "mum",
    km: "ហៅដូចម្តាយហៅពីខាងក្រៅផ្ទះ",
    en: "Call out like a mother from outside the house",
    hintKm: "វែង ខ្ពស់ ហើយគួរឱ្យខ្លាចបន្តិច",
    hintEn: "Long, high, and slightly frightening",
    want: { minMs: 1400, maxMs: 5000, loud: 0.3, contour: "rise" },
  },
  {
    id: "dog",
    km: "ព្រុសដូចឆ្កែវេលាម៉ោងពីរយប់",
    en: "Bark like a dog at 2am",
    hintKm: "ដាច់ៗ ច្រំដែល គ្មានហេតុផល",
    hintEn: "Short, repeated, for no reason",
    want: { minMs: 800, maxMs: 4000, loud: 0.32, contour: "wobble" },
  },
  {
    id: "surprise",
    km: "ស្រែកភ្ញាក់ផ្អើលដូចឃើញរឿងមិននឹកស្មាន",
    en: "Gasp like you saw something you should not have",
    hintKm: "ភ្លាមៗ ខ្លី និងខ្ពស់",
    hintEn: "Sudden, short, and high",
    want: { minMs: 400, maxMs: 2000, loud: 0.3, contour: "rise" },
  },
];

/* ------------------------------------------------------------------ analysis */

export type Sample = {
  /** RMS level per frame, 0..1. */
  rms: number[];
  /** Detected pitch per frame in Hz, 0 where there was none. */
  hz: number[];
  /** Frame interval in ms. */
  stepMs: number;
  /**
   * How long the take actually ran, measured off the clock.
   *
   * Not frames x stepMs. Frames arrive on requestAnimationFrame, roughly every
   * 16.7ms, while stepMs is the analyser's window at 21.3ms: multiplying the
   * two overstated every hold by about a quarter, and any difference in frame
   * rate between two takes showed up as a length difference that was not there.
   */
  ms?: number;
};

export type Score = {
  total: number; // 0..100
  commitment: number; // did they actually make a noise
  duration: number; // did they hold it as asked
  shape: number; // did the pitch do what the prompt wanted
  verdict: "pass" | "drink";
  noteKm: string;
  noteEn: string;
};

/** Autocorrelation pitch detection. Good enough for a voice, cheap to run. */
export function detectPitch(buf: Float32Array, sampleRate: number): number {
  const n = buf.length;
  let rms = 0;
  for (let i = 0; i < n; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / n);
  if (rms < 0.008) return 0; // silence

  // trim the quiet head and tail so correlation is not dragged down by them
  const thresh = 0.2;
  let a = 0;
  let b = n - 1;
  while (a < n / 2 && Math.abs(buf[a]) < thresh) a++;
  while (b > n / 2 && Math.abs(buf[b]) < thresh) b--;
  const seg = buf.slice(a, b);
  const m = seg.length;
  if (m < 64) return 0;

  const c = new Float32Array(m).fill(0);
  for (let lag = 0; lag < m; lag++) {
    for (let i = 0; i < m - lag; i++) c[lag] += seg[i] * seg[i + lag];
  }

  // skip the zero-lag peak, then take the first real maximum
  let d = 0;
  while (d < m - 1 && c[d] > c[d + 1]) d++;
  let best = -1;
  let bestVal = -1;
  for (let i = d; i < m; i++) {
    if (c[i] > bestVal) {
      bestVal = c[i];
      best = i;
    }
  }
  if (best <= 0) return 0;

  // parabolic interpolation around the peak for sub-sample accuracy
  const x0 = best > 0 ? c[best - 1] : c[best];
  const x1 = c[best];
  const x2 = best + 1 < m ? c[best + 1] : c[best];
  const den = 2 * (2 * x1 - x2 - x0);
  const shift = den !== 0 ? (x2 - x0) / den : 0;
  const period = best + shift;
  const hz = sampleRate / period;

  // a human voice, generously bounded
  return hz > 60 && hz < 1600 ? hz : 0;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/**
 * Below this RMS nobody made a sound, whatever else the numbers say.
 *
 * It matters because the pitch detector is happy to report a confident 249 Hz
 * from room tone, and a track of near-identical spurious readings looks like a
 * perfectly steady note to anything measuring shape. Every feature that reads
 * pitch has to be gated on this, or silence scores well on contour.
 */
const VOICE_FLOOR = 0.012;

/** Pitch readings from frames that were actually loud enough to believe. */
function audibleHz(s: Sample): number[] {
  return s.hz.filter((h, i) => h > 0 && (s.rms[i] ?? 0) >= VOICE_FLOOR);
}

/** The loudest sustained quarter of a take, rather than one lucky spike. */
function sustainedPeak(rms: number[]): number {
  if (rms.length === 0) return 0;
  const sorted = [...rms].sort((a, b) => b - a);
  const top = sorted.slice(0, Math.max(1, Math.floor(rms.length * 0.25)));
  return top.reduce((a, b) => a + b, 0) / top.length;
}

/**
 * How much of the score a take has earned the right to keep.
 *
 * Commitment used to be one weighted term among four, which meant a silent
 * round still collected full marks for length and contour and passed on those
 * alone. It is a multiplier instead: make no sound, keep none of it. Full
 * credit from a third of the reference's loudness upward, tapering below.
 */
function credit(commitment: number): number {
  return clamp01(commitment / 0.45);
}

/** Median of the non-zero values, which ignores unvoiced frames. */
function medianVoiced(hz: number[]): number {
  const v = hz.filter((x) => x > 0).sort((a, b) => a - b);
  return v.length ? v[Math.floor(v.length / 2)] : 0;
}

/**
 * Does the pitch track do what the prompt asked? Returns 0..1.
 * Compares the first third against the last third, which is robust to the
 * scrappy edges of a real recording.
 */
function shapeMatch(hz: number[], want: Contour): number {
  const voiced = hz.filter((x) => x > 0);
  // Too little to read: score it as unknown-and-unearned rather than as a
  // partial match, which is what let a silent take keep a contour mark.
  if (voiced.length < 6) return 0;

  const third = Math.max(2, Math.floor(voiced.length / 3));
  const head = voiced.slice(0, third);
  const tail = voiced.slice(-third);
  const avg = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
  const h = avg(head);
  const t = avg(tail);
  const ratio = t / h; // >1 rising, <1 falling

  // how much it moves around, as a fraction of its own average
  const mean = avg(voiced);
  const sd = Math.sqrt(avg(voiced.map((x) => (x - mean) ** 2)));
  const jitter = mean > 0 ? sd / mean : 0;

  switch (want) {
    case "rise":
      return clamp01((ratio - 1) / 0.35);
    case "fall":
      return clamp01((1 - ratio) / 0.3);
    case "flat":
      // steady means small movement in both direction and jitter
      return clamp01(1 - Math.abs(ratio - 1) / 0.3) * clamp01(1 - jitter / 0.28);
    case "wobble":
      return clamp01(jitter / 0.22);
    default:
      return 0.7;
  }
}

const NOTES: { min: number; km: string; en: string }[] = [
  { min: 90, km: "ក្រសួងមានការចាប់អារម្មណ៍។ រឿងនេះកម្រណាស់។", en: "The Ministry is impressed. This is rare." },
  { min: 75, km: "ទទួលយកបាន។ អ្នករួចខ្លួនហើយ។", en: "Acceptable. You are free to go." },
  { min: 60, km: "ស្ទើរតែបាន។ ក្រសួងនឹងមិននិយាយអ្វីទេ។", en: "Nearly. The Ministry will say nothing." },
  { min: 40, km: "ខ្សោយ។ សូមផឹកមួយកែវ។", en: "Weak. Drink one." },
  { min: 20, km: "ក្រសួងបានឮអ្វីមួយ។ មិនដឹងជាអ្វីទេ។", en: "The Ministry heard something. It is not sure what." },
  { min: 0, km: "គ្មានអ្វីសោះ។ ផឹកទៅ។", en: "Nothing at all. Drink." },
];

/** The pass mark. Below this, somebody drinks. */
export const PASS_MARK = 60;

export function scoreAttempt(s: Sample, p: Prompt): Score {
  const heldMs = s.ms ?? s.rms.length * s.stepMs;

  // commitment: the loudest sustained stretch, not a single spike
  const peakish = sustainedPeak(s.rms);
  const commitment = clamp01(peakish / p.want.loud);

  // duration: full marks inside the window, tapering outside it
  let duration: number;
  if (heldMs < p.want.minMs) duration = clamp01(heldMs / p.want.minMs);
  else if (heldMs > p.want.maxMs) duration = clamp01(1 - (heldMs - p.want.maxMs) / p.want.maxMs);
  else duration = 1;

  // only frames loud enough to believe get a say in the contour
  const shape = peakish >= VOICE_FLOOR ? shapeMatch(audibleHz(s), p.want.contour) : 0;

  // A silent round cannot be rescued by a lucky pitch reading: credit() scales
  // the whole thing by how much of a sound there actually was.
  const c = credit(commitment);
  const total = Math.round(100 * (commitment * 0.4 + duration * 0.25 + shape * 0.35) * c);

  const note = NOTES.find((n) => total >= n.min) ?? NOTES[NOTES.length - 1];

  return {
    total,
    // Commitment is the raw measurement; the other two are shown after credit,
    // so the three bars are the marks actually granted rather than marks the
    // total then quietly took back. A near-silent take used to read "shape 57"
    // next to a score of 24.
    commitment: Math.round(commitment * 100),
    duration: Math.round(duration * c * 100),
    shape: Math.round(shape * c * 100),
    verdict: total >= PASS_MARK ? "pass" : "drink",
    noteKm: note.km,
    noteEn: note.en,
  };
}

export function medianHz(s: Sample): number {
  return Math.round(medianVoiced(s.hz));
}

/* ------------------------------------------------- copying a real voice */

/**
 * Score an attempt against a recording of somebody else, rather than against a
 * prompt's written targets. This is what the pass-the-phone mode runs on: one
 * player makes a noise, the next has to be that person.
 *
 * Everything is compared in relative terms. Pitch is converted to semitones
 * away from each speaker's own median, so a low voice copying a high one is
 * judged on whether it moved the same way, not on whether it landed on the
 * same notes — otherwise the game would just be a test of who has a similar
 * larynx to whoever went first.
 */

/** Resample a series to n points by averaging each bucket. Empty in, empty out. */
function resample(v: number[], n: number): number[] {
  if (v.length === 0) return [];
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = Math.floor((i * v.length) / n);
    const b = Math.max(a + 1, Math.floor(((i + 1) * v.length) / n));
    let s = 0;
    for (let k = a; k < b; k++) s += v[k];
    out.push(s / (b - a));
  }
  return out;
}

/** Pearson correlation, mapped from -1..1 onto 0..1. */
function correlate(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 3) return 0;
  const mean = (x: number[]) => x.reduce((s, v) => s + v, 0) / x.length;
  const ma = mean(a.slice(0, n));
  const mb = mean(b.slice(0, n));
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < n; i++) {
    const x = a[i] - ma;
    const y = b[i] - mb;
    num += x * y;
    da += x * x;
    db += y * y;
  }
  if (da === 0 || db === 0) return 0.5; // both flat: they agree, weakly
  return clamp01((num / Math.sqrt(da * db) + 1) / 2);
}

/** Voiced pitch as semitones from the speaker's own median. */
function semitoneTrack(s: Sample): number[] {
  const hz = audibleHz(s);
  const med = medianVoiced(hz);
  if (med <= 0) return [];
  return hz.map((h) => 12 * Math.log2(h / med));
}

const COPY_NOTES: { min: number; km: string; en: string }[] = [
  { min: 90, km: "ក្រសួងមិនអាចបែងចែកអ្នកពីម្ចាស់ដើមបានទេ។", en: "The Ministry cannot tell you two apart." },
  { min: 75, km: "ដូចគ្នាណាស់។ អ្នករួចខ្លួន។", en: "Close enough. You are free to go." },
  { min: 60, km: "ស្ទើរតែដូច។ ក្រសួងនឹងមិននិយាយអ្វីទេ។", en: "Nearly. The Ministry will say nothing." },
  { min: 40, km: "មិនដូចទេ។ សូមផឹកមួយកែវ។", en: "Not them. Drink one." },
  { min: 20, km: "អ្នកធ្វើសំឡេងផ្សេងទាំងស្រុង។ ផឹកទៅ។", en: "You made a different sound entirely. Drink." },
  { min: 0, km: "គ្មានអ្វីសោះ។ ផឹកទៅ។", en: "Nothing at all. Drink." },
];

export function scoreAgainst(attempt: Sample, ref: Sample): Score {
  const aMs = attempt.ms ?? attempt.rms.length * attempt.stepMs;
  const rMs = ref.ms ?? ref.rms.length * ref.stepMs;

  // length: how close the two are, as a ratio that does not care which is longer
  const duration = rMs > 0 && aMs > 0 ? clamp01(1 - Math.abs(Math.log2(aMs / rMs)) / 1.4) : 0;

  // the shape of the loudness over time, each normalised to its own peak, so
  // a quiet room and a loud one are judged on rhythm rather than volume
  const N = 24;
  const norm = (v: number[]) => {
    const peak = Math.max(...v, 1e-6);
    return v.map((x) => x / peak);
  };
  const envelope = correlate(norm(resample(attempt.rms, N)), norm(resample(ref.rms, N)));

  const peakish = sustainedPeak(attempt.rms);
  const refPeak = sustainedPeak(ref.rms);

  // did the pitch travel the same way. Both sides have to be audible before
  // this means anything; room tone correlates beautifully with room tone.
  const at = semitoneTrack(attempt);
  const rt = semitoneTrack(ref);
  const shape =
    peakish >= VOICE_FLOOR && at.length >= 6 && rt.length >= 6
      ? correlate(resample(at, N), resample(rt, N))
      : 0;

  // relative to whoever went first, but with an absolute floor under it, so
  // two people sitting in silence do not impersonate each other perfectly
  const commitment = clamp01(peakish / Math.max(VOICE_FLOOR * 2.5, refPeak * 0.75));

  const c = credit(commitment);
  const total = Math.round(
    100 * (commitment * 0.2 + duration * 0.2 + envelope * 0.2 + shape * 0.4) * c,
  );

  const note = COPY_NOTES.find((n) => total >= n.min) ?? COPY_NOTES[COPY_NOTES.length - 1];

  return {
    total,
    commitment: Math.round(commitment * 100),
    duration: Math.round(duration * c * 100),
    shape: Math.round(shape * c * 100),
    verdict: total >= PASS_MARK ? "pass" : "drink",
    noteKm: note.km,
    noteEn: note.en,
  };
}
