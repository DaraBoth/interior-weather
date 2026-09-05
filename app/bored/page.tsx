"use client";

/** DEPARTMENT OF WAITING — deliberately, gloriously tedious. */

import { useEffect, useRef, useState } from "react";
import { beep, trombone } from "@/lib/audio";

const FACTS = [
  "The average office chair travels eight miles a year without leaving the room.",
  "There is a word for the smell of rain. There is no word for the smell of a printer.",
  "Somewhere, a fax machine is still receiving.",
  "Every queue has exactly one person who knows what is going on. It is never you.",
  "A watched pot boils at the same rate. It simply feels worse.",
  "The Ministry has never once been to the fourth floor.",
  "Corridors get 4% longer after 6pm. This is not measurable but it is true.",
  "Nobody has ever finished a whole tube of hand cream.",
  "The third drawer down contains the same objects in every building on Earth.",
  "Time spent choosing something to watch counts as having watched it.",
  "If you stand still long enough, the building considers you furniture.",
  "One of the lifts goes to a floor that does not appear on any button.",
  "The plant in reception has outlived four managers.",
  "Every stapler is on loan from somewhere else.",
];

export default function Waiting() {
  const [progress, setProgress] = useState(0);
  const [ticket] = useState(() => 91000 + Math.floor(Math.random() * 900));
  const [serving, setServing] = useState(4182);
  const [stillness, setStillness] = useState(0);
  const [bestStill, setBestStill] = useState(0);
  const [factIdx, setFactIdx] = useState(0);
  const lastMove = useRef(Date.now());

  /* a progress bar that will never, ever finish */
  useEffect(() => {
    const i = setInterval(() => {
      setProgress((p) => {
        if (p >= 99) { trombone(); return 3 + Math.random() * 12; }
        const remaining = 99 - p;
        return p + Math.max(0.06, remaining * 0.012);
      });
    }, 220);
    return () => clearInterval(i);
  }, []);

  /* the queue moves, but not for you */
  useEffect(() => {
    const i = setInterval(() => {
      setServing((s) => (Math.random() < 0.75 ? s + 1 : s - 1));
      beep(420, 0.03);
    }, 4200);
    return () => clearInterval(i);
  }, []);

  /* stillness contest */
  useEffect(() => {
    const move = () => { lastMove.current = Date.now(); };
    ["mousemove", "keydown", "touchstart", "scroll", "click"].forEach((e) =>
      window.addEventListener(e, move, { passive: true }),
    );
    const i = setInterval(() => {
      const s = Math.floor((Date.now() - lastMove.current) / 1000);
      setStillness(s);
      setBestStill((b) => (s > b ? s : b));
    }, 250);
    return () => {
      ["mousemove", "keydown", "touchstart", "scroll", "click"].forEach((e) =>
        window.removeEventListener(e, move),
      );
      clearInterval(i);
    };
  }, []);

  useEffect(() => {
    const i = setInterval(() => setFactIdx((f) => (f + 1) % FACTS.length), 9000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="wrap">
      <div className="machine">
        <span className="screw tl" /><span className="screw tr" />
        <span className="screw bl" /><span className="screw br" />

        <div className="plate">
          <div>
            <div className="mk">Department of Waiting · Floor 1</div>
            <h1>Please Wait</h1>
          </div>
          <div className="cert">
            YOUR PATIENCE IS NOTED<br />
            AND WILL NOT BE REWARDED<br />
            NO APPOINTMENTS AVAILABLE
          </div>
        </div>

        <div className="readout">
          <p className="rd-line">{FACTS[factIdx]}</p>
          <p className="rd-sub">DEPARTMENTAL FACT {factIdx + 1} OF {FACTS.length} · UNVERIFIED</p>
        </div>

        <div className="grid">
          <div className="cell s12">
            <span className="cap">Processing</span>
            <div style={{
              height: 30, background: "#8e876f", borderRadius: 6, overflow: "hidden",
              boxShadow: "inset 0 3px 8px rgba(0,0,0,.45)",
            }}>
              <div style={{
                width: `${progress}%`, height: "100%",
                background: "repeating-linear-gradient(45deg,var(--amber) 0 12px,#c98d10 12px 24px)",
                transition: "width .25s linear",
              }} />
            </div>
            <div className="tiny">{progress.toFixed(1)}% · ESTIMATED TIME REMAINING: YES</div>
          </div>

          <div className="cell s6" style={{ textAlign: "center" }}>
            <span className="cap">Now serving</span>
            <div style={{ fontSize: 58, fontWeight: 700, lineHeight: 1 }}>{serving.toLocaleString()}</div>
            <div className="tiny">YOUR TICKET: {ticket.toLocaleString()}</div>
            <div className="tiny">POSITION IN QUEUE: {(ticket - serving).toLocaleString()}</div>
          </div>

          <div className="cell s6" style={{ textAlign: "center" }}>
            <span className="cap">Stillness contest</span>
            <div style={{ fontSize: 58, fontWeight: 700, lineHeight: 1 }}>{stillness}s</div>
            <div className="tiny">DO NOT MOVE. DO NOT SCROLL. DO NOT BREATHE ON THE MOUSE.</div>
            <div className="tiny">BEST THIS SESSION: {bestStill}s</div>
          </div>

          <div className="cell s12">
            <span className="cap">Assistance</span>
            <button className="btn wide" onClick={() => { trombone(); setServing((s) => s - 3); }}>
              Request assistance
            </button>
            <div className="tiny">Requesting assistance moves you three places backwards. This is policy.</div>
          </div>
        </div>

        <div className="footplate">
          <span>THE DEPARTMENT OF WAITING HAS NEVER CLOSED</span>
          <span>NOR HAS IT EVER OPENED</span>
        </div>
      </div>
    </div>
  );
}
