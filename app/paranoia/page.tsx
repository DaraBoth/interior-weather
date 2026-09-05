"use client";

/**
 * PARANOIA — the quietest game here and reliably the loudest moment of the night.
 *
 * One person reads a question privately, whispers it to their neighbour, and the
 * neighbour answers OUT LOUD without anyone else hearing the question. Then a coin
 * decides whether the room ever finds out what was asked.
 *
 * The question is hold-to-read rather than tap-to-reveal, so a phone lying on a
 * table never accidentally shows it to the whole room.
 */

import { useEffect, useRef, useState } from "react";
import { PARANOIA_QUESTIONS } from "@/lib/games";
import { beep, chime, clunk, raspberry } from "@/lib/audio";

type Stage = "ready" | "reading" | "answered" | "flipped";

export default function Paranoia() {
  const [stage, setStage] = useState<Stage>("ready");
  const [question, setQuestion] = useState("");
  const [holding, setHolding] = useState(false);
  const [revealed, setRevealed] = useState<boolean | null>(null);
  const [flipping, setFlipping] = useState(false);
  const [round, setRound] = useState(0);
  const pool = useRef<string[]>([]);

  const nextQuestion = () => {
    if (pool.current.length === 0) {
      pool.current = [...PARANOIA_QUESTIONS].sort(() => Math.random() - 0.5);
    }
    const q = pool.current.pop()!;
    setQuestion(q);
    setStage("reading");
    setRevealed(null);
    setRound((r) => r + 1);
    clunk();
  };

  const flip = () => {
    if (flipping) return;
    setFlipping(true);
    setStage("answered");
    let n = 0;
    const spin = () => {
      setRevealed(Math.random() < 0.5);
      beep(600 + Math.random() * 500, 0.03);
      n++;
      if (n < 14) setTimeout(spin, 70 + n * 12);
      else {
        const out = Math.random() < 0.5;
        setRevealed(out);
        setFlipping(false);
        setStage("flipped");
        if (out) chime(); else raspberry();
      }
    };
    spin();
  };

  /* releasing the phone should always hide the question, even if the pointer
     leaves the button in an odd way */
  useEffect(() => {
    const release = () => setHolding(false);
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    window.addEventListener("blur", release);
    return () => {
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      window.removeEventListener("blur", release);
    };
  }, []);

  return (
    <div className="wrap">
      <div className="machine">
        <span className="screw tl" /><span className="screw tr" />
        <span className="screw bl" /><span className="screw br" />

        <div className="plate">
          <div>
            <div className="mk">Bureau of Whispers · Protocol P</div>
            <h1>Paranoia</h1>
          </div>
          <div className="cert">
            READ IT PRIVATELY<br />
            WHISPER IT ONCE<br />
            ROUND {String(round).padStart(3, "0")}
          </div>
        </div>

        <div className="readout">
          <p className="rd-line">
            {stage === "ready" && "TAKE THE PHONE. NOBODY ELSE LOOKS."}
            {stage === "reading" && "HOLD TO READ. WHISPER IT TO THE PERSON ON YOUR LEFT."}
            {stage === "answered" && "THE COIN IS DECIDING…"}
            {stage === "flipped" && (revealed ? "THE QUESTION IS REVEALED." : "THE QUESTION DIES HERE.")}
          </p>
          <p className="rd-sub">
            PROTOCOL P · THE ANSWER IS ALWAYS SAID OUT LOUD · THE QUESTION USUALLY IS NOT
          </p>
        </div>

        {/* the private card */}
        <button
          onPointerDown={() => { if (stage === "reading") { setHolding(true); beep(880, 0.04); } }}
          onContextMenu={(e) => e.preventDefault()}
          disabled={stage !== "reading"}
          style={{
            width: "100%", minHeight: "min(34vh, 260px)", borderRadius: 12,
            border: "3px solid #2e332c", cursor: stage === "reading" ? "pointer" : "default",
            background: holding ? "#101a10" : "#8e876f",
            color: holding ? "var(--screen-txt)" : "#4b4638",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 14, padding: "24px 20px", textAlign: "center",
            fontFamily: holding ? "var(--f-read)" : "var(--f-label)",
            transition: "background .12s, color .12s",
            boxShadow: "inset 0 4px 20px rgba(0,0,0,.5)",
          }}
        >
          {stage === "reading" && !holding && (
            <>
              <div style={{ fontSize: "clamp(20px,5vw,34px)", fontWeight: 700, textTransform: "uppercase", lineHeight: 1.1 }}>
                Hold to read
              </div>
              <div className="mono" style={{ fontSize: 12.5, opacity: 0.85, maxWidth: 380, lineHeight: 1.7 }}>
                Shield the screen. Let go and it disappears.
              </div>
            </>
          )}
          {stage === "reading" && holding && (
            <div style={{ fontSize: "clamp(18px,4.6vw,30px)", fontWeight: 700, lineHeight: 1.45, textWrap: "balance" }}>
              {question}
            </div>
          )}
          {stage !== "reading" && (
            <div className="mono" style={{ fontSize: 13, opacity: 0.8, maxWidth: 400, lineHeight: 1.8 }}>
              {stage === "ready"
                ? "Press Deal a question below."
                : revealed === null
                ? "Flipping…"
                : revealed
                ? question
                : "Sealed. Only two people will ever know what was asked."}
            </div>
          )}
        </button>

        <div className="grid" style={{ marginTop: 14 }}>
          <div className="cell s6">
            <span className="cap">Step one</span>
            <button className="btn amber wide big" onClick={nextQuestion} disabled={flipping}>
              {stage === "ready" ? "Deal a question" : "Next question"}
            </button>
            <div className="tiny">Read it privately, whisper it to one person, they answer out loud.</div>
          </div>
          <div className="cell s6">
            <span className="cap">Step two</span>
            <button className="btn wide big" onClick={flip} disabled={stage !== "reading" || flipping}>
              {flipping ? "Flipping…" : "Flip the coin"}
            </button>
            <div className="tiny">Heads and the room learns the question. Tails and it stays buried.</div>
          </div>
        </div>

        <div className="footplate">
          <span>THE BUREAU KEEPS NO RECORD · THE BUREAU IS LYING</span>
          <span>PROTOCOL P</span>
        </div>
      </div>
    </div>
  );
}
