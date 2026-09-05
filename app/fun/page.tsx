"use client";

/** RECREATION WING — three games of no value whatsoever. */

import { useCallback, useEffect, useRef, useState } from "react";
import { beep, boing, fanfare, raspberry, trombone } from "@/lib/audio";

const MOLE_FACES = ["●", "◆", "▲", "★", "✦", "■"];
const LIES = [
  "That was not fast.",
  "A tortoise did better this morning.",
  "Statistically average. Devastating.",
  "The machine has seen worse. Not often.",
  "Suspiciously good. We are reviewing the footage.",
  "That reaction time has been reported.",
];

export default function Recreation() {
  /* ---------------- whack ---------------- */
  const [holes, setHoles] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);

  useEffect(() => {
    if (!playing) return;
    const spawn = setInterval(() => {
      setHoles((h) => {
        const next = new Set(h);
        if (next.size > 3) next.delete([...next][0]);
        next.add(Math.floor(Math.random() * 9));
        return [...next];
      });
    }, 620);
    const clock = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => { clearInterval(spawn); clearInterval(clock); };
  }, [playing]);

  useEffect(() => {
    if (playing && timeLeft <= 0) {
      setPlaying(false);
      setHoles([]);
      if (score > 12) fanfare(); else trombone();
    }
  }, [playing, timeLeft, score]);

  const whack = (i: number) => {
    if (!playing) return;
    if (holes.includes(i)) {
      setScore((s) => s + 1);
      setHoles((h) => h.filter((x) => x !== i));
      beep(700 + Math.random() * 400, 0.06);
    } else {
      setMisses((m) => m + 1);
      raspberry();
    }
  };

  /* ---------------- endurance ---------------- */
  const [holdMs, setHoldMs] = useState(0);
  const [best, setBest] = useState(0);
  const holdStart = useRef(0);
  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    try { setBest(parseInt(localStorage.getItem("miw:hold") || "0", 10) || 0); } catch {}
  }, []);

  const beginHold = () => {
    holdStart.current = Date.now();
    holdTimer.current = setInterval(() => setHoldMs(Date.now() - holdStart.current), 60);
  };
  const endHold = () => {
    if (holdTimer.current) clearInterval(holdTimer.current);
    holdTimer.current = null;
    const ms = Date.now() - holdStart.current;
    setHoldMs(ms);
    if (ms > best) {
      setBest(ms);
      try { localStorage.setItem("miw:hold", String(ms)); } catch {}
      fanfare();
    } else {
      boing();
    }
  };

  /* ---------------- reaction, dishonestly reported ---------------- */
  const [rxState, setRxState] = useState<"idle" | "wait" | "go" | "done">("idle");
  const [rxMs, setRxMs] = useState(0);
  const [rxLie, setRxLie] = useState("");
  const rxStart = useRef(0);
  const rxTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rxBegin = useCallback(() => {
    setRxState("wait");
    rxTimer.current = setTimeout(() => {
      rxStart.current = Date.now();
      setRxState("go");
      beep(900, 0.1);
    }, 1200 + Math.random() * 2800);
  }, []);

  const rxClick = () => {
    if (rxState === "idle" || rxState === "done") { rxBegin(); return; }
    if (rxState === "wait") {
      if (rxTimer.current) clearTimeout(rxTimer.current);
      setRxState("done");
      setRxMs(0);
      setRxLie("Too early. The Ministry saw that.");
      raspberry();
      return;
    }
    const ms = Date.now() - rxStart.current;
    setRxMs(ms);
    setRxLie(LIES[Math.floor(Math.random() * LIES.length)]);
    setRxState("done");
    beep(600, 0.08);
  };

  useEffect(() => () => { if (rxTimer.current) clearTimeout(rxTimer.current); }, []);

  return (
    <div className="wrap">
      <div className="machine">
        <span className="screw tl" /><span className="screw tr" />
        <span className="screw bl" /><span className="screw br" />

        <div className="plate">
          <div>
            <div className="mk">Recreation Wing · Floor 1</div>
            <h1>Games Of No Value</h1>
          </div>
          <div className="cert">
            RECREATION IS PERMITTED<br />
            BETWEEN THE HOURS OF ALWAYS<br />
            AND ALSO ALWAYS
          </div>
        </div>

        <div className="grid">
          {/* whack */}
          <div className="cell" style={{ gridColumn: "span 6" }}>
            <span className="cap">Hit the things</span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
              {Array.from({ length: 9 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => whack(i)}
                  style={{
                    aspectRatio: "1", border: "none", borderRadius: 8, cursor: "pointer",
                    background: holes.includes(i) ? "var(--red)" : "#8e876f",
                    color: "#fff", fontSize: 26, fontFamily: "var(--f-label)",
                    boxShadow: "inset 0 3px 8px rgba(0,0,0,.4)",
                    transition: "background .09s",
                  }}
                >
                  {holes.includes(i) ? MOLE_FACES[i % MOLE_FACES.length] : ""}
                </button>
              ))}
            </div>
            <div className="tiny">HIT {score} · MISSED {misses} · {playing ? `${timeLeft}s LEFT` : "READY"}</div>
            <button
              className="btn amber wide"
              onClick={() => { setScore(0); setMisses(0); setTimeLeft(20); setPlaying(true); beep(520, 0.1); }}
              disabled={playing}
            >
              {playing ? "In progress" : "Begin"}
            </button>
          </div>

          {/* endurance */}
          <div className="cell" style={{ gridColumn: "span 6" }}>
            <span className="cap">Hold this. That is the whole game.</span>
            <button
              className="btn red wide big"
              style={{ minHeight: 96 }}
              onMouseDown={beginHold} onMouseUp={endHold} onMouseLeave={endHold}
              onTouchStart={beginHold} onTouchEnd={endHold}
            >
              Hold
            </button>
            <div className="tiny">
              THIS ATTEMPT {(holdMs / 1000).toFixed(2)}s · PERSONAL BEST {(best / 1000).toFixed(2)}s
            </div>
            <div className="tiny">
              The record is stored on this device only, so it is between you and the machine.
            </div>
          </div>

          {/* reaction */}
          <div className="cell" style={{ gridColumn: "span 12" }}>
            <span className="cap">Reaction test (results not guaranteed to be true)</span>
            <button
              onClick={rxClick}
              style={{
                border: "none", borderRadius: 10, cursor: "pointer", minHeight: 120,
                fontFamily: "var(--f-label)", fontSize: 22, letterSpacing: ".1em",
                textTransform: "uppercase", color: "#fff",
                background:
                  rxState === "go" ? "var(--green)"
                  : rxState === "wait" ? "var(--red)"
                  : "var(--steel)",
                transition: "background .1s",
              }}
            >
              {rxState === "idle" && "Click to begin"}
              {rxState === "wait" && "Wait for green…"}
              {rxState === "go" && "NOW"}
              {rxState === "done" && `${rxMs}ms — ${rxLie}`}
            </button>
          </div>
        </div>

        <div className="footplate">
          <span>NO PRIZES · NO LEADERBOARD · NO POINT</span>
          <span>RECREATION WING</span>
        </div>
      </div>
    </div>
  );
}
