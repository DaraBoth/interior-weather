"use client";

/**
 * THE WHEEL — weighted segments, real momentum, and a peg that clicks as it passes.
 *
 * Two sources of truth:
 *   MINISTRY  the built-in twelve, deliberately unequally weighted.
 *   YOUR OWN  whatever you type. Names, forfeits, who is buying the next round.
 *             Equal odds, because weighting your friends would be rude.
 *
 * Custom entries persist per device so you do not retype them every round.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { WHEEL_SEGMENTS, WHEEL_NOTES, type Segment } from "@/lib/games";
import { beep, fanfare, trombone } from "@/lib/audio";
import { verdict } from "@/lib/celebrate";

const TAU = Math.PI * 2;
const STORE = "miw:wheel";

/* colours cycle so a custom wheel still looks like it belongs in the building */
const TONES = ["#c8342b", "#e8a317", "#4c9a56", "#4a6fa5", "#8e5aa8", "#8e876f", "#b8763a", "#3f8f8a"];

type Mode = "ministry" | "custom";

export default function Wheel() {
  const cvRef = useRef<HTMLCanvasElement | null>(null);
  const angleRef = useRef(0);
  const velRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastSegRef = useRef(-1);

  const [mode, setMode] = useState<Mode>("ministry");
  const [custom, setCustom] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<Segment | null>(null);
  const [spins, setSpins] = useState(0);

  /* ---------------- persistence ---------------- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) {
        const d = JSON.parse(raw);
        if (Array.isArray(d?.entries)) setCustom(d.entries);
        if (d?.mode === "custom" && Array.isArray(d?.entries) && d.entries.length >= 2) {
          setMode("custom");
        }
      }
    } catch { /* private window: the wheel still works, it just forgets */ }
  }, []);

  const persist = useCallback((entries: string[], m: Mode) => {
    try { localStorage.setItem(STORE, JSON.stringify({ entries, mode: m })); } catch {}
  }, []);

  /* ---------------- the active slice list ---------------- */
  const slices: Segment[] = useMemo(() => {
    if (mode === "custom" && custom.length >= 2) {
      return custom.map((label, i) => ({ label, weight: 1, tone: TONES[i % TONES.length] }));
    }
    // weight expands into repeated slices, so "You drink" genuinely comes up more
    return WHEEL_SEGMENTS.flatMap((s) => Array.from({ length: s.weight }, () => s));
  }, [mode, custom]);

  const slicesRef = useRef<Segment[]>(slices);
  useEffect(() => { slicesRef.current = slices; }, [slices]);

  /* ---------------- drawing ---------------- */
  const draw = useCallback(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = cv.clientWidth;
    if (!size) return;
    if (cv.width !== Math.round(size * dpr)) {
      cv.width = Math.round(size * dpr);
      cv.height = Math.round(size * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 12;
    const list = slicesRef.current;
    const step = TAU / list.length;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angleRef.current);

    list.forEach((seg, i) => {
      const a0 = i * step;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, a0, a0 + step);
      ctx.closePath();
      ctx.fillStyle = seg.tone;
      ctx.fill();
      ctx.strokeStyle = "rgba(27,29,24,.55)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.rotate(a0 + step / 2);
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      const light = seg.tone === "#dcd6c4" || seg.tone === "#e8a317" || seg.tone === "#8e876f";
      ctx.fillStyle = light ? "#241f0e" : "#f4f1e8";
      // shrink the type as the wheel gets busier, and clip anything absurd
      const fs = Math.max(9, Math.min(size * 0.038, (r * step) * 0.62));
      ctx.font = `700 ${fs}px Oswald, Impact, sans-serif`;
      let label = seg.label.toUpperCase();
      const maxW = r - 26;
      while (label.length > 3 && ctx.measureText(label).width > maxW) {
        label = label.slice(0, -1);
      }
      if (label !== seg.label.toUpperCase()) label = label.trimEnd() + "…";
      ctx.fillText(label, r - 14, 0);
      ctx.restore();
    });

    ctx.restore();

    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.09, 0, TAU);
    ctx.fillStyle = "#4a4e4a";
    ctx.fill();
    ctx.strokeStyle = "#2e332c";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - 13, 2);
    ctx.lineTo(cx + 13, 2);
    ctx.lineTo(cx, 30);
    ctx.closePath();
    ctx.fillStyle = "#e8a317";
    ctx.fill();
    ctx.strokeStyle = "#241f0e";
    ctx.lineWidth = 3;
    ctx.stroke();
  }, []);

  const currentIndex = useCallback(() => {
    const list = slicesRef.current;
    const step = TAU / list.length;
    const a = ((-Math.PI / 2 - angleRef.current) % TAU + TAU) % TAU;
    return Math.floor(a / step) % list.length;
  }, []);

  const tickLoop = useCallback(() => {
    angleRef.current = (angleRef.current + velRef.current) % TAU;
    velRef.current *= 0.991;

    const idx = currentIndex();
    if (idx !== lastSegRef.current) {
      lastSegRef.current = idx;
      if (velRef.current > 0.004) beep(1400 - Math.min(700, velRef.current * 900), 0.018, "square");
    }
    draw();

    if (velRef.current < 0.0018) {
      velRef.current = 0;
      setSpinning(false);
      const seg = slicesRef.current[currentIndex()];
      setResult(seg);
      const kind = seg.label === "Nobody drinks" || seg.label === "Immunity";
      if (kind) fanfare(); else trombone();
      verdict(
        seg.label,
        WHEEL_NOTES[seg.label] ?? "the wheel has spoken",
        kind ? "#4c9a56" : seg.tone,
      );
      return;
    }
    rafRef.current = requestAnimationFrame(tickLoop);
  }, [currentIndex, draw]);

  const spin = () => {
    if (spinning || slices.length < 2) return;
    setResult(null);
    setSpinning(true);
    setSpins((n) => n + 1);
    velRef.current = 0.34 + Math.random() * 0.22;
    lastSegRef.current = -1;
    rafRef.current = requestAnimationFrame(tickLoop);
  };

  useEffect(() => {
    draw();
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [draw, slices]);

  /* ---------------- custom entries ---------------- */
  const add = () => {
    const t = draft.trim().slice(0, 28);
    if (!t) return;
    if (custom.some((c) => c.toLowerCase() === t.toLowerCase())) {
      setDraft("");
      return;
    }
    const next = [...custom, t].slice(0, 24);
    setCustom(next);
    setDraft("");
    persist(next, mode);
    beep(880, 0.05);
  };

  const remove = (i: number) => {
    const next = custom.filter((_, j) => j !== i);
    setCustom(next);
    persist(next, next.length >= 2 ? mode : "ministry");
    if (next.length < 2 && mode === "custom") setMode("ministry");
    beep(400, 0.05);
  };

  const switchTo = (m: Mode) => {
    if (m === "custom" && custom.length < 2) return;
    setMode(m);
    setResult(null);
    persist(custom, m);
    beep(620, 0.07);
  };

  const usingCustom = mode === "custom" && custom.length >= 2;

  return (
    <div className="wrap">
      <div className="machine">
        <span className="screw tl" /><span className="screw tr" />
        <span className="screw bl" /><span className="screw br" />

        <div className="plate">
          <div>
            <div className="mk">Office of Random Allocation · Apparatus 2</div>
            <h1>The Wheel</h1>
          </div>
          <div className="cert">
            {usingCustom ? "RUNNING YOUR OWN LIST" : "OUTCOMES ARE WEIGHTED"}<br />
            THE WHEEL IS NOT YOUR FRIEND<br />
            SPINS {String(spins).padStart(3, "0")}
          </div>
        </div>

        <div className="readout">
          <p className="rd-line">
            {spinning ? "THE WHEEL IS DECIDING…" : result ? result.label.toUpperCase() : "SPIN IT."}
          </p>
          <p className="rd-sub">
            {result && !spinning
              ? (WHEEL_NOTES[result.label] ?? "THE WHEEL HAS SPOKEN. YOU WROTE THIS ONE YOURSELF.")
              : usingCustom
              ? `YOUR LIST · ${custom.length} OUTCOMES · EQUAL ODDS`
              : "OUTCOMES ARE NOT EQUALLY LIKELY. THIS IS DELIBERATE."}
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <canvas
            ref={cvRef}
            onClick={spin}
            style={{
              width: "min(92vw, 460px)", aspectRatio: "1",
              cursor: spinning ? "default" : "pointer",
              filter: "drop-shadow(0 12px 26px rgba(0,0,0,.5))",
            }}
          />
        </div>

        <div className="grid" style={{ marginTop: 14 }}>
          <div className="cell s12">
            <button className="btn amber wide big" onClick={spin} disabled={spinning}>
              {spinning ? "Spinning…" : "Spin the wheel"}
            </button>
          </div>

          {/* ---- which list ---- */}
          <div className="cell s12" style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
            <button
              className={mode === "ministry" ? "btn amber" : "btn"}
              style={{ flex: 1, minWidth: 150 }}
              onClick={() => switchTo("ministry")}
            >
              Ministry standard
            </button>
            <button
              className={usingCustom ? "btn amber" : "btn"}
              style={{ flex: 1, minWidth: 150 }}
              onClick={() => switchTo("custom")}
              disabled={custom.length < 2}
            >
              Your own {custom.length ? `(${custom.length})` : ""}
            </button>
          </div>

          {/* ---- the editor ---- */}
          <div className="cell s12">
            <span className="cap">Your own outcomes</span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input
                className="field"
                style={{ flex: 1, minWidth: 180 }}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
                placeholder="a name, a forfeit, anything"
                maxLength={28}
              />
              <button className="btn" onClick={add} disabled={!draft.trim()}>Add</button>
            </div>

            {custom.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 4 }}>
                {custom.map((c, i) => (
                  <button
                    key={`${c}-${i}`}
                    onClick={() => remove(i)}
                    title="Remove"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 8,
                      background: TONES[i % TONES.length],
                      color: TONES[i % TONES.length] === "#e8a317" || TONES[i % TONES.length] === "#8e876f" ? "#241f0e" : "#f4f1e8",
                      border: "2px solid rgba(27,29,24,.45)", borderRadius: 999,
                      padding: "7px 12px", cursor: "pointer",
                      fontFamily: "var(--f-label)", fontSize: 13, fontWeight: 600,
                      letterSpacing: ".04em",
                    }}
                  >
                    {c}
                    <span style={{ opacity: 0.75, fontWeight: 700 }}>×</span>
                  </button>
                ))}
              </div>
            )}

            <div className="tiny">
              {custom.length === 0
                ? "Add at least two and the wheel will run your list instead. Tap a chip to remove it."
                : custom.length < 2
                ? "One more and you can switch to your own list."
                : "Tap a chip to remove it. Your list is saved on this device only."}
            </div>

            {custom.length > 0 && (
              <button
                className="btn"
                style={{ alignSelf: "flex-start" }}
                onClick={() => { setCustom([]); setMode("ministry"); persist([], "ministry"); trombone(); }}
              >
                Clear the list
              </button>
            )}
          </div>
        </div>

        <div className="footplate">
          <span>
            {usingCustom
              ? "YOUR LIST RUNS ON EQUAL ODDS · WEIGHTING YOUR FRIENDS WOULD BE RUDE"
              : "APPARATUS 2 · CALIBRATED ONCE, IN 1983, BADLY"}
          </span>
          <span>NO REFUNDS</span>
        </div>
      </div>
    </div>
  );
}
