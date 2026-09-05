"use client";

/**
 * THE BOMB — pass-the-phone panic.
 *
 * A category appears, a fuse starts, you say an answer and pass it on. The fuse
 * length is random inside a band so nobody can count it down, and the ticking
 * accelerates so the tension is audible rather than just displayed.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { BOMB_CATEGORIES } from "@/lib/games";
import { alarm, beep, trombone, fanfare } from "@/lib/audio";

type Phase = "idle" | "armed" | "blown";

export default function Bomb() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [category, setCategory] = useState(BOMB_CATEGORIES[0]);
  const [passes, setPasses] = useState(0);
  const [heat, setHeat] = useState(0); // 0..1, drives colour and tick rate
  const [round, setRound] = useState(0);

  const fuseMs = useRef(0);
  const startedAt = useRef(0);
  const rafRef = useRef<number | null>(null);
  const nextTick = useRef(0);

  const stopLoop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  const arm = useCallback(() => {
    setCategory(BOMB_CATEGORIES[Math.floor(Math.random() * BOMB_CATEGORIES.length)]);
    setPasses(0);
    setHeat(0);
    setPhase("armed");
    setRound((r) => r + 1);
    // 18 to 55 seconds. Long enough to get going, short enough to stay tense.
    fuseMs.current = 18000 + Math.random() * 37000;
    startedAt.current = performance.now();
    nextTick.current = 0;
    beep(520, 0.12);
  }, []);

  useEffect(() => {
    if (phase !== "armed") return;

    const loop = (t: number) => {
      const elapsed = t - startedAt.current;
      const p = Math.min(1, elapsed / fuseMs.current);
      setHeat(p);

      // ticks speed up from roughly 1/sec to 8/sec as the fuse burns down
      const interval = 900 - 780 * Math.pow(p, 1.7);
      if (elapsed > nextTick.current) {
        nextTick.current = elapsed + interval;
        beep(760 + p * 700, 0.028, "square");
      }

      if (p >= 1) {
        setPhase("blown");
        alarm();
        setTimeout(trombone, 500);
        if (navigator.vibrate) { try { navigator.vibrate([220, 90, 220, 90, 420]); } catch {} }
        return;
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return stopLoop;
  }, [phase, stopLoop]);

  useEffect(() => stopLoop, [stopLoop]);

  const pass = () => {
    if (phase !== "armed") return;
    setPasses((n) => n + 1);
    beep(1150, 0.05, "triangle");
  };

  const bg =
    phase === "blown"
      ? "#c8342b"
      : phase === "armed"
      ? `rgb(${Math.round(30 + heat * 170)},${Math.round(36 - heat * 20)},${Math.round(32 - heat * 20)})`
      : "#101a10";

  return (
    <div className="wrap">
      <div className="machine">
        <span className="screw tl" /><span className="screw tr" />
        <span className="screw bl" /><span className="screw br" />

        <div className="plate">
          <div>
            <div className="mk">Department of Sudden Urgency · Device 4</div>
            <h1>The Bomb</h1>
          </div>
          <div className="cert">
            PASS IT. DO NOT HOLD IT.<br />
            FUSE LENGTH IS RANDOMISED<br />
            ROUND {String(round).padStart(3, "0")}
          </div>
        </div>

        {/* the device itself: one enormous tap target */}
        <button
          onClick={phase === "armed" ? pass : arm}
          style={{
            width: "100%", border: "3px solid #2e332c", borderRadius: 12,
            background: bg, color: "#eaf5ea", cursor: "pointer",
            minHeight: "min(52vh, 420px)", padding: "26px 20px",
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: 16, textAlign: "center",
            fontFamily: "var(--f-label)",
            transition: phase === "armed" ? "background .18s linear" : "background .4s ease",
            boxShadow: "inset 0 4px 22px rgba(0,0,0,.6)",
            animation: phase === "blown" ? "shake .45s cubic-bezier(.36,.07,.19,.97)" : "none",
          }}
        >
          {phase === "idle" && (
            <>
              <div className="mono" style={{ fontSize: 12, letterSpacing: ".2em", opacity: 0.75 }}>
                DEVICE SAFE
              </div>
              <div style={{ fontSize: "clamp(28px,7vw,54px)", fontWeight: 700, textTransform: "uppercase", lineHeight: 1 }}>
                Arm the bomb
              </div>
              <div className="mono" style={{ fontSize: 13, opacity: 0.8, maxWidth: 460, lineHeight: 1.7 }}>
                A category appears. Say one answer, tap, pass the phone.
                Whoever is holding it when it goes off drinks.
              </div>
            </>
          )}

          {phase === "armed" && (
            <>
              <div className="mono" style={{ fontSize: 12, letterSpacing: ".2em", opacity: 0.8 }}>
                CATEGORY
              </div>
              <div style={{ fontSize: "clamp(24px,6vw,46px)", fontWeight: 700, textTransform: "uppercase", lineHeight: 1.05, textWrap: "balance" }}>
                {category}
              </div>
              <div className="mono" style={{ fontSize: 15, opacity: 0.9 }}>
                TAP AND PASS · {passes} passed
              </div>
              <div style={{ width: "82%", height: 10, background: "rgba(0,0,0,.45)", borderRadius: 6, overflow: "hidden" }}>
                <div style={{
                  width: `${(1 - heat) * 100}%`, height: "100%",
                  background: heat > 0.75 ? "#ffdf6b" : "#e8a317",
                  transition: "width .12s linear",
                }} />
              </div>
            </>
          )}

          {phase === "blown" && (
            <>
              <div style={{ fontSize: "clamp(40px,12vw,96px)", fontWeight: 700, lineHeight: 0.9 }}>
                BOOM
              </div>
              <div style={{ fontSize: "clamp(18px,4.4vw,30px)", fontWeight: 700, textTransform: "uppercase" }}>
                You are holding it
              </div>
              <div className="mono" style={{ fontSize: 13, opacity: 0.9 }}>
                {passes} passes before you · tap to arm it again
              </div>
            </>
          )}
        </button>

        <div className="grid" style={{ marginTop: 14 }}>
          <div className="cell s6">
            <span className="cap">Change the subject</span>
            <button
              className="btn wide"
              onClick={() => {
                setCategory(BOMB_CATEGORIES[Math.floor(Math.random() * BOMB_CATEGORIES.length)]);
                beep(640, 0.06);
              }}
            >
              New category
            </button>
            <div className="tiny">Allowed at any time. The fuse keeps burning.</div>
          </div>
          <div className="cell s6">
            <span className="cap">Cowardice</span>
            <button
              className="btn red wide"
              onClick={() => { setPhase("idle"); setHeat(0); fanfare(); }}
              disabled={phase !== "armed"}
            >
              Defuse
            </button>
            <div className="tiny">Everyone will see you do this.</div>
          </div>
        </div>

        <div className="footplate">
          <span>FUSE IS RANDOM BETWEEN 18 AND 55 SECONDS · COUNTING IS FUTILE</span>
          <span>DEVICE 4</span>
        </div>
      </div>
    </div>
  );
}
