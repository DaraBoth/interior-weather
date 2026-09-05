/**
 * The payoff moment.
 *
 * Shared by every game that produces a verdict, so a result always feels like
 * the building did something rather than just changing some text. Palette-matched
 * to the Ministry: enamel, lemon, signal red, no rainbow.
 *
 * Everything draws on one throwaway canvas above the page and cleans itself up.
 */

const PALETTE = ["#e8a317", "#c8342b", "#4c9a56", "#dcd6c4", "#4a6fa5", "#ffdf6b"];
const GLYPHS = ["■", "▲", "●", "★", "✦", "▮"];

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let running = false;

type Bit = {
  x: number; y: number; vx: number; vy: number;
  rot: number; vrot: number; size: number;
  color: string; glyph: string; life: number; born: number;
};

let bits: Bit[] = [];

function ensureCanvas(): CanvasRenderingContext2D | null {
  if (typeof window === "undefined") return null;
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.style.cssText =
      "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:95";
    document.body.appendChild(canvas);
    ctx = canvas.getContext("2d");
  }
  if (!canvas || !ctx) return null;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (canvas.width !== Math.round(w * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

function loop() {
  const c = ensureCanvas();
  if (!c || !canvas) { running = false; return; }
  const now = performance.now();
  const w = window.innerWidth;
  const h = window.innerHeight;
  c.clearRect(0, 0, w, h);

  bits = bits.filter((b) => now - b.born < b.life);

  for (const b of bits) {
    const t = (now - b.born) / 1000;
    const age = (now - b.born) / b.life;
    const x = b.x + b.vx * t;
    const y = b.y + b.vy * t + 900 * t * t * 0.5;
    c.save();
    c.translate(x, y);
    c.rotate(b.rot + b.vrot * t);
    c.globalAlpha = Math.max(0, 1 - age * age);
    c.fillStyle = b.color;
    c.font = `700 ${b.size}px Oswald, Impact, sans-serif`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(b.glyph, 0, 0);
    c.restore();
  }

  if (bits.length) {
    requestAnimationFrame(loop);
  } else {
    running = false;
    c.clearRect(0, 0, w, h);
  }
}

function spawn(list: Bit[]) {
  if (typeof window === "undefined") return;
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;
  bits = bits.concat(list).slice(-400);
  if (!running) {
    running = true;
    requestAnimationFrame(loop);
  }
}

/** A burst from one point. Use for a single winner. */
export function burst(x: number, y: number, count = 60) {
  const now = performance.now();
  const list: Bit[] = [];
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 220 + Math.random() * 460;
    list.push({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 260,
      rot: Math.random() * 6.28,
      vrot: (Math.random() - 0.5) * 12,
      size: 12 + Math.random() * 20,
      color: PALETTE[(Math.random() * PALETTE.length) | 0],
      glyph: GLYPHS[(Math.random() * GLYPHS.length) | 0],
      life: 1300 + Math.random() * 900,
      born: now,
    });
  }
  spawn(list);
}

/** Rains from the top edge. Use when the whole room is involved. */
export function rain(count = 90) {
  if (typeof window === "undefined") return;
  const now = performance.now();
  const w = window.innerWidth;
  const list: Bit[] = [];
  for (let i = 0; i < count; i++) {
    list.push({
      x: Math.random() * w,
      y: -30 - Math.random() * 200,
      vx: (Math.random() - 0.5) * 90,
      vy: 120 + Math.random() * 220,
      rot: Math.random() * 6.28,
      vrot: (Math.random() - 0.5) * 8,
      size: 12 + Math.random() * 18,
      color: PALETTE[(Math.random() * PALETTE.length) | 0],
      glyph: GLYPHS[(Math.random() * GLYPHS.length) | 0],
      life: 2200 + Math.random() * 1200,
      born: now,
    });
  }
  spawn(list);
}

/** A single hard flash of colour over the page. */
export function flash(color = "#e8a317", ms = 180) {
  if (typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const el = document.createElement("div");
  el.style.cssText =
    `position:fixed;inset:0;background:${color};opacity:.72;pointer-events:none;z-index:94;` +
    `transition:opacity ${ms}ms ease-out`;
  document.body.appendChild(el);
  requestAnimationFrame(() => { el.style.opacity = "0"; });
  setTimeout(() => el.remove(), ms + 90);
}

/**
 * The official stamp. Slams down over the page, rotated, like a rubber stamp
 * hitting a form. This is the Ministry's signature move.
 */
export function stamp(text: string, sub?: string, tone = "#c8342b") {
  if (typeof window === "undefined") return;
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const el = document.createElement("div");
  el.setAttribute("role", "status");
  el.style.cssText =
    "position:fixed;left:50%;top:44%;z-index:96;pointer-events:none;" +
    "display:flex;flex-direction:column;align-items:center;gap:6px;" +
    `border:6px solid ${tone};color:${tone};border-radius:10px;` +
    "padding:14px 26px;background:rgba(15,17,13,.9);" +
    "font-family:Oswald,Impact,sans-serif;font-weight:700;text-transform:uppercase;" +
    "letter-spacing:.06em;text-align:center;max-width:88vw;" +
    `box-shadow:0 0 0 3px rgba(0,0,0,.5), 0 22px 60px rgba(0,0,0,.6);` +
    (reduced
      ? "transform:translate(-50%,-50%) rotate(-6deg);opacity:1;"
      : "transform:translate(-50%,-50%) scale(3.4) rotate(-24deg);opacity:0;" +
        "transition:transform .34s cubic-bezier(.2,1.5,.4,1), opacity .18s ease-out;");

  const big = document.createElement("div");
  big.style.cssText = "font-size:clamp(26px,7vw,54px);line-height:1;";
  big.textContent = text;
  el.appendChild(big);

  if (sub) {
    const s = document.createElement("div");
    s.style.cssText =
      "font-family:'Courier Prime',monospace;font-weight:400;font-size:12px;" +
      "letter-spacing:.12em;opacity:.85;text-transform:uppercase;";
    s.textContent = sub;
    el.appendChild(s);
  }

  document.body.appendChild(el);

  if (!reduced) {
    requestAnimationFrame(() => {
      el.style.transform = "translate(-50%,-50%) scale(1) rotate(-8deg)";
      el.style.opacity = "1";
    });
  }

  setTimeout(() => {
    el.style.transition = "opacity .45s ease, transform .45s ease";
    el.style.opacity = "0";
    el.style.transform = "translate(-50%,-58%) scale(.94) rotate(-8deg)";
    setTimeout(() => el.remove(), 500);
  }, 1700);
}

/** The full package: flash, stamp, and confetti from the middle. */
export function verdict(text: string, sub?: string, tone = "#c8342b") {
  flash(tone, 200);
  stamp(text, sub, tone);
  if (typeof window !== "undefined") {
    burst(window.innerWidth / 2, window.innerHeight * 0.44, 70);
    setTimeout(() => rain(50), 220);
  }
}
