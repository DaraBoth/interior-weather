"use client";

/** RECREATION WING — three games of no value whatsoever. */

import { useCallback, useEffect, useRef, useState } from "react";
import { beep, boing, fanfare, raspberry, trombone } from "@/lib/audio";

const MOLE_FACES = ["●", "◆", "▲", "★", "✦", "■"];
const LIES = [
  "នោះមិនលឿនទេ។",
  "អណ្តើកមួយធ្វើបានល្អជាងនេះកាលពីព្រឹក។",
  "តាមស្ថិតិ មធ្យម។ គួរឱ្យសោកស្តាយណាស់។",
  "ម៉ាស៊ីនធ្លាប់ឃើញអាក្រក់ជាងនេះ។ តែមិនញឹកញាប់ទេ។",
  "ល្អគួរឱ្យសង្ស័យ។ យើងកំពុងពិនិត្យវីដេអូឡើងវិញ។",
  "ល្បឿនប្រតិកម្មនោះត្រូវបានរាយការណ៍ហើយ។",
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
      setRxLie("លឿនពេក។ ក្រសួងឃើញហើយ។");
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
            <div className="mk">ស្លាបកម្សាន្ត · ជាន់ទី ១</div>
            <h1>ហ្គេមគ្មានតម្លៃ</h1>
          </div>
          <div className="cert">
            RECREATION IS PERMITTED<br />
            BETWEEN THE HOURS OF ALWAYS<br />
            AND ALSO ALWAYS
          </div>
        </div>

        <div className="grid">
          {/* whack */}
          <div className="cell s6">
            <span className="cap">វាយរបស់ទាំងនោះ</span>
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
              {playing ? "កំពុងលេង" : "ចាប់ផ្តើម"}
            </button>
          </div>

          {/* endurance */}
          <div className="cell s6">
            <span className="cap">សង្កត់វាទុក។ នោះហើយជាហ្គេមទាំងមូល។</span>
            <button
              className="btn red wide big"
              style={{ minHeight: 96 }}
              onMouseDown={beginHold} onMouseUp={endHold} onMouseLeave={endHold}
              onTouchStart={beginHold} onTouchEnd={endHold}
            >
              Hold
            </button>
            <div className="tiny">
              លើកនេះ {(holdMs / 1000).toFixed(2)} វិ · ល្អបំផុតផ្ទាល់ខ្លួន {(best / 1000).toFixed(2)} វិ
            </div>
            <div className="tiny">
              The record is stored on this device only, so it is between you and the machine.
            </div>
          </div>

          {/* reaction */}
          <div className="cell s12">
            <span className="cap">ការសាកល្បងប្រតិកម្ម (លទ្ធផលមិនធានាថាពិតទេ)</span>
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
              {rxState === "idle" && "ចុចដើម្បីចាប់ផ្តើម"}
              {rxState === "wait" && "រង់ចាំពណ៌បៃតង…"}
              {rxState === "go" && "ឥឡូវ"}
              {rxState === "done" && `${rxMs}ms — ${rxLie}`}
            </button>
          </div>
        </div>

        <div className="footplate">
          <span>គ្មានរង្វាន់ · គ្មានតារាងចំណាត់ថ្នាក់ · គ្មានន័យ</span>
          <span>ស្លាបកម្សាន្ត</span>
        </div>
      </div>
    </div>
  );
}
