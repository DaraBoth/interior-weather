"use client";

/** DEPARTMENT OF WAITING — deliberately, gloriously tedious. */

import { useEffect, useRef, useState } from "react";
import { beep, trombone } from "@/lib/audio";

const FACTS = [
  "កៅអីការិយាល័យជាមធ្យមធ្វើដំណើរប្រាំបីម៉ាយក្នុងមួយឆ្នាំ ដោយមិនចេញពីបន្ទប់។",
  "មានពាក្យសម្រាប់ក្លិនភ្លៀង។ តែគ្មានពាក្យសម្រាប់ក្លិនម៉ាស៊ីនបោះពុម្ពទេ។",
  "នៅកន្លែងណាមួយ ម៉ាស៊ីនហ្វាក់មួយនៅតែទទួលសារ។",
  "រាល់ជួរតម្រង់មានមនុស្សម្នាក់ដែលដឹងថាមានរឿងអ្វី។ វាមិនដែលជាអ្នកទេ។",
  "ឆ្នាំងដែលគេឈរមើលពុះក្នុងល្បឿនដដែល។ គ្រាន់តែអារម្មណ៍អាក្រក់ជាង។",
  "ក្រសួងមិនដែលឡើងទៅជាន់ទីបួនសូម្បីតែម្តងទេ។",
  "ច្រករបៀងវែងជាងមុន ៤% ក្រោយម៉ោង ៦ ល្ងាច។ រឿងនេះវាស់មិនបាន តែវាពិត។",
  "គ្មាននរណាធ្លាប់ប្រើគ្រឹមលាបដៃអស់មួយបំពង់ទេ។",
  "ថតទីបីរាប់ចុះមានរបស់ដូចគ្នា នៅគ្រប់អគារទាំងអស់លើផែនដី។",
  "ពេលវេលាដែលចំណាយរើសរឿងមើល ត្រូវរាប់ថាបានមើលរួចហើយ។",
  "បើអ្នកឈរស្ងៀមបានយូរល្មម អគារនឹងចាត់ទុកអ្នកជាគ្រឿងសង្ហារិម។",
  "ជណ្តើរយន្តមួយក្នុងចំណោមនោះទៅជាន់មួយ ដែលមិនមាននៅលើប៊ូតុងណាទេ។",
  "ដើមឈើនៅកន្លែងទទួលភ្ញៀវរស់បានយូរជាងប្រធានបួននាក់។",
  "គ្រឿងដេរក្រដាសគ្រប់គ្រឿងគឺខ្ចីពីកន្លែងផ្សេង។",
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
            <div className="mk">នាយកដ្ឋានរង់ចាំ · ជាន់ទី ១</div>
            <h1>សូមរង់ចាំ</h1>
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
            <span className="cap">កំពុងដំណើរការ</span>
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
            <span className="cap">កំពុងបម្រើលេខ</span>
            <div style={{ fontSize: 58, fontWeight: 700, lineHeight: 1 }}>{serving.toLocaleString()}</div>
            <div className="tiny">សំបុត្ររបស់អ្នក៖ {ticket.toLocaleString()}</div>
            <div className="tiny">លំដាប់ក្នុងជួរ៖ {(ticket - serving).toLocaleString()}</div>
          </div>

          <div className="cell s6" style={{ textAlign: "center" }}>
            <span className="cap">ការប្រកួតឈរស្ងៀម</span>
            <div style={{ fontSize: 58, fontWeight: 700, lineHeight: 1 }}>{stillness}s</div>
            <div className="tiny">DO NOT MOVE. DO NOT SCROLL. DO NOT BREATHE ON THE MOUSE.</div>
            <div className="tiny">ល្អបំផុតលើកនេះ៖ {bestStill} វិនាទី</div>
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
          <span>នាយកដ្ឋានរង់ចាំមិនដែលបិទទេ</span>
          <span>ហើយក៏មិនដែលបើកដែរ</span>
        </div>
      </div>
    </div>
  );
}
