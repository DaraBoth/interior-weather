"use client";

/**
 * THE WHEEL — weighted segments, real momentum, and a peg that clicks as it passes.
 * Drawn on canvas because it is a generative graphic that has to spin smoothly.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { WHEEL_SEGMENTS, WHEEL_NOTES, type Segment } from "@/lib/games";
import { beep, fanfare, trombone } from "@/lib/audio";

const TAU = Math.PI * 2;

export default function Wheel() {
  const cvRef = useRef<HTMLCanvasElement | null>(null);
  const angleRef = useRef(0);
  const velRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastSegRef = useRef(-1);

  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<Segment | null>(null);
  const [spins, setSpins] = useState(0);

  /* segments expanded by weight, so "You drink" genuinely comes up more often */
  const slices = useRef<Segment[]>(
    WHEEL_SEGMENTS.flatMap((s) => Array.from({ length: s.weight }, () => s)),
  );

  const draw = useCallback(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = cv.clientWidth;
    if (cv.width !== size * dpr) {
      cv.width = size * dpr;
      cv.height = size * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 12;
    const list = slices.current;
    const step = TAU / list.length;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angleRef.current);

    list.forEach((seg, i) => {
      const a0 = i * step;
      const a1 = a0 + step;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, a0, a1);
      ctx.closePath();
      ctx.fillStyle = seg.tone;
      ctx.fill();
      ctx.strokeStyle = "rgba(27,29,24,.55)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // label
      ctx.save();
      ctx.rotate(a0 + step / 2);
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillStyle = seg.tone === "#dcd6c4" || seg.tone === "#e8a317" ? "#241f0e" : "#f4f1e8";
      ctx.font = `700 ${Math.max(11, size * 0.036)}px Oswald, Impact, sans-serif`;
      ctx.fillText(seg.label.toUpperCase(), r - 14, 0);
      ctx.restore();
    });

    ctx.restore();

    // hub
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.09, 0, TAU);
    ctx.fillStyle = "#4a4e4a";
    ctx.fill();
    ctx.strokeStyle = "#2e332c";
    ctx.lineWidth = 4;
    ctx.stroke();

    // pointer at the top
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

  /** which slice is under the pointer (which sits at the top, -90 degrees) */
  const currentIndex = useCallback(() => {
    const list = slices.current;
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
      const seg = slices.current[currentIndex()];
      setResult(seg);
      if (seg.label === "Nobody drinks" || seg.label === "Immunity") fanfare();
      else trombone();
      return;
    }
    rafRef.current = requestAnimationFrame(tickLoop);
  }, [currentIndex, draw]);

  const spin = () => {
    if (spinning) return;
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
  }, [draw]);

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
            OUTCOMES ARE WEIGHTED<br />
            THE WHEEL IS NOT YOUR FRIEND<br />
            SPINS {String(spins).padStart(3, "0")}
          </div>
        </div>

        <div className="readout">
          <p className="rd-line">
            {spinning ? "THE WHEEL IS DECIDING…" : result ? result.label.toUpperCase() : "SPIN IT."}
          </p>
          <p className="rd-sub">
            {result && !spinning ? WHEEL_NOTES[result.label] : "OUTCOMES ARE NOT EQUALLY LIKELY. THIS IS DELIBERATE."}
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <canvas
            ref={cvRef}
            onClick={spin}
            style={{
              width: "min(92vw, 460px)", aspectRatio: "1", cursor: spinning ? "default" : "pointer",
              filter: "drop-shadow(0 12px 26px rgba(0,0,0,.5))",
            }}
          />
        </div>

        <div className="grid" style={{ marginTop: 14 }}>
          <div className="cell s12">
            <button className="btn amber wide big" onClick={spin} disabled={spinning}>
              {spinning ? "Spinning…" : "Spin the wheel"}
            </button>
            <div className="tiny">
              You can also just tap the wheel. Twelve outcomes, weighted: &ldquo;You drink&rdquo; and
              &ldquo;Pick someone&rdquo; are the most likely, &ldquo;Immunity&rdquo; and &ldquo;Waterfall&rdquo; the least.
            </div>
          </div>
        </div>

        <div className="footplate">
          <span>APPARATUS 2 · CALIBRATED ONCE, IN 1983, BADLY</span>
          <span>NO REFUNDS</span>
        </div>
      </div>
    </div>
  );
}
