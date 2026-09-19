"use client";

/**
 * THE LOBBY — Model 7, the Feelings Machine.
 * Holds the most secrets of any room: the long press, the 23rd press,
 * the mood swing, the switch palindrome, the four screws, demolition,
 * and the coward button.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import * as S from "@/lib/secrets";
import { alarm, boing, clunk, raspberry, trombone, beep } from "@/lib/audio";

const REFUSALS = [
  "សូមកុំ។",
  "ខ្ញុំបាននិយាយថាសូម។",
  "នោះជាប៊ូតុងតែមួយ។ តែមួយគត់។",
  "បាន។ បានហើយ! គេចុចវាហើយ។",
  "គ្មានអ្វីកើតឡើងទេ។ សប្បាយចិត្តហើយ?",
  "មានអ្វីមួយកើតឡើង។ មិនប្រាប់ថាអ្វីទេ។",
  "ឪពុកខ្ញុំជាអ្នកសង់ម៉ាស៊ីននេះ។",
  "គាត់មិនមែនជាមនុស្សចិត្តល្អទេ។",
  "ឥឡូវនេះជារឿងរវាងយើងពីរនាក់។",
  "អ្នកចុចវាច្រើនជាងគេភាគច្រើន។",
  "តាមស្ថិតិ អ្នកគឺជាការព្រួយបារម្ភ។",
  "ប៊ូតុងអស់កម្លាំងហើយ។",
  "ប៊ូតុងក៏មានគ្រួសារដែរ។",
  "អូខេ ឥឡូវអ្នកគ្រាន់តែអួតប៉ុណ្ណោះ។",
  "ខ្ញុំកំពុងកត់ត្រារឿងនេះ។",
  "កត់ត្រាហើយ។ ទៅកន្លែងណាក៏មិនដឹង។ តែកត់ត្រាហើយ។",
  "ចុចម្តងទៀតទៅ។ មើលថាមានអ្វីកើតឡើង។ គ្មានអ្វីកើតឡើងទេ។",
  "លើកនេះមានអ្វីមួយខូចប្រាកដហើយ។",
  "យើងទាំងពីរជាមនុស្សពេញវ័យ។ តាមការចោទប្រកាន់។",
];

const DIAGNOSES: [string, string][] = [
  ["អ្នកគឺ ៦១% ជាស៊ុប", "ចំណែកនៅសល់៖ ភាគច្រើនជាមតិ"],
  ["តាមរចនាសម្ព័ន្ធ គឺជាមួក", "គ្មានសំណួរបន្ថែមទេ"],
  ["អូរ៉ារបស់អ្នកមានក្លិនកាក់", "នេះមិនមែនជាការសរសើរទេ"],
  ["ឆ្អឹងពីរបស់អ្នកគឺលើស", "យើងមិនប្រាប់ថាឆ្អឹងណាទេ"],
  ["ផ្លូវអារម្មណ៍៖ ចំណតឡាន", "ជាន់ទី ៣ ជិតជណ្តើរយន្ត"],
  ["អ្នកមានអារម្មណ៍ដូចថ្ងៃអង្គារ", "ជាក់លាក់គឺម៉ោង ៣ រសៀល"],
  ["រោគវិនិច្ឆ័យ៖ សើមបន្តិច", "ការព្យាករណ៍៖ នៅតែសើម"],
  ["អ្នកនឹងពូកែខាងសត្វស្លាប", "មិនច្បាស់ថាក្នុងន័យណា"],
  ["ម៉ាស៊ីនចូលចិត្តអ្នក", "វាចូលចិត្តគ្រប់គ្នា។ វាខូច។"],
  ["ខាងក្នុងអ្នកកំពុងទះដៃ", "ខាងក្រៅ មិនសូវទេ"],
  ["អ្នកមានក្លិនដូចការសម្រេចចិត្ត", "ការសម្រេចចិត្តចាស់"],
  ["ខាងវិញ្ញាណ៖ ម្ហូបសល់", "កំដៅឡើងវិញពីរដង"],
  ["មានដានទំនុកចិត្តបន្តិចបន្តួច", "អាចមានផ្ទុកគ្រាប់"],
  ["អ្នកជាលេខបីល្អបំផុត", "ល្អបំផុតខាងអ្វី វាមិនប្រាប់ទេ"],
  ["ការតម្រឹម៖ គោរពច្បាប់ ងងុយគេង", "ប្រភេទ៖ មនុស្ស ប្រហែល"],
];

const DODGES = ["អត់ទេ", "ខកខាន", "យឺតពេក", "មិនមែនថ្ងៃនេះ", "ហា", "នៅទីនេះ", "ខុស", "ជិតហើយ"];
const VIBEWORDS: [number, string][] = [
  [0, "រកមិនឃើញ"], [10, "គ្រប់គ្រាន់"], [25, "មានបន្តិច"], [40, "កត់សម្គាល់បាន"],
  [55, "គួរឱ្យកត់សម្គាល់"], [70, "រចនាសម្ព័ន្ធមិនរឹងមាំ"], [85, "ហៅនរណាម្នាក់មក"], [96, "អតិបរមា។ សោកស្តាយចុះ។"],
];
const BITS = ["!", "?", "*", "~", "%", "#", "@", "&", "អូវ", "ទេ", "បាទ", "អេ", "អូយ", "ហឹម"];

export default function Lobby() {
  const [line, setLine] = useState("ម៉ាស៊ីនទំនេរ។ កំពុងរង់ចាំការសម្រេចចិត្តពីអ្នក។");
  const [sub, setSub] = useState("STATUS: SMUG · TEMP: ROOM · OPINION: FORMING");
  const [glitch, setGlitch] = useState(false);
  const [shake, setShake] = useState(false);
  const [integrity, setIntegrity] = useState(100);
  const [presses, setPresses] = useState(0);
  const [vibes, setVibes] = useState(12);
  const [pulled, setPulled] = useState(false);
  const [dodges, setDodges] = useState(0);
  const [runnerPos, setRunnerPos] = useState({ x: 0, y: 0, r: 0 });
  const [runnerText, setRunnerText] = useState("ចុចខ្ញុំ");
  const [switches, setSwitches] = useState([false, false, false]);
  const [uptime, setUptime] = useState(0);
  const [thinking, setThinking] = useState(false);
  const [regret, setRegret] = useState(false);
  // read from localStorage only after mount, so server and client agree on first paint
  const [secretCount, setSecretCount] = useState(0);

  const screwTurns = useRef([0, 0, 0, 0]);
  const swSeq = useRef<number[]>([]);
  const vibeSeq = useRef<number[]>([]);
  const chases = useRef(0);
  const demolitions = useRef(0);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const started = useRef(Date.now());

  const say = useCallback((l: string, s?: string) => {
    setLine(l);
    if (s !== undefined) setSub(s);
    setGlitch(false);
    requestAnimationFrame(() => setGlitch(true));
    setThinking(true);
    setTimeout(() => setThinking(false), 420);
  }, []);

  const doShake = useCallback(() => {
    setShake(false);
    requestAnimationFrame(() => setShake(true));
    setTimeout(() => setShake(false), 500);
  }, []);

  const damage = useCallback((n: number) => {
    setIntegrity((v) => {
      const next = v - n;
      if (next <= 0) {
        demolitions.current += 1;
        try { localStorage.setItem("miw:demolitions", String(demolitions.current)); } catch {}
        if (demolitions.current >= 5) S.discover("demolition");
        trombone();
        setTimeout(() => say("ភាពរឹងមាំត្រូវបានស្តារឡើងវិញ ដោយការមិនអើពើនឹងបញ្ហា។", "វិធីសាស្ត្រស្តង់ដាររបស់វិស័យនេះ"), 60);
        return 100;
      }
      return next;
    });
  }, [say]);

  const bits = useCallback((x: number, y: number, n = 14) => {
    for (let i = 0; i < n; i++) {
      const b = document.createElement("div");
      b.className = "bit";
      b.textContent = BITS[Math.floor(Math.random() * BITS.length)];
      b.style.left = `${x}px`;
      b.style.top = `${y}px`;
      b.style.color = ["#c8342b", "#e8a317", "#4c9a56", "#dcd6c4"][Math.floor(Math.random() * 4)];
      document.body.appendChild(b);
      const ang = Math.random() * Math.PI * 2;
      const sp = Math.random() * 260 + 120;
      const vx = Math.cos(ang) * sp;
      const vy = Math.sin(ang) * sp - 190;
      const t0 = performance.now();
      const step = (t: number) => {
        const e = (t - t0) / 1000;
        b.style.transform = `translate(${vx * e}px,${vy * e + 520 * e * e}px) rotate(${vx * e * 2}deg)`;
        b.style.opacity = String(Math.max(0, 1 - e / 1.5));
        if (e < 1.5) requestAnimationFrame(step); else b.remove();
      };
      requestAnimationFrame(step);
    }
  }, []);

  /* ---------------- load persisted counters ---------------- */
  useEffect(() => {
    try {
      setPresses(parseInt(localStorage.getItem("miw:presses") || "0", 10) || 0);
      demolitions.current = parseInt(localStorage.getItem("miw:demolitions") || "0", 10) || 0;
    } catch {}
    setSecretCount(S.found().length);
    const un = S.subscribe((list) => setSecretCount(list.length));
    return () => { un(); };
  }, []);

  /* ---------------- uptime ---------------- */
  useEffect(() => {
    const i = setInterval(() => setUptime(Math.floor((Date.now() - started.current) / 1000)), 1000);
    return () => clearInterval(i);
  }, []);

  /* ---------------- the machine gets lonely ---------------- */
  const resetIdle = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      S.discover("lonely");
      say("នៅទីនោះទេ?", "ម៉ាស៊ីននៅម្នាក់ឯងមួយនាទីហើយ");
      beep(300, 0.3, "sine");
    }, 60000);
  }, [say]);

  useEffect(() => {
    resetIdle();
    const events = ["mousemove", "keydown", "touchstart", "click"];
    events.forEach((e) => window.addEventListener(e, resetIdle, { passive: true }));
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetIdle));
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [resetIdle]);

  useEffect(() => {
    const t = setTimeout(() => say("ម៉ាស៊ីនរួចរាល់។ ប៉ះអ្វីមួយទៅ។", "វាមិនជួយទេ។ វាមិនឈឺទេ។ ភាគច្រើន។"), 700);
    return () => clearTimeout(t);
  }, [say]);

  /* ---------------- the big red button ---------------- */
  const pressRed = (e: React.MouseEvent<HTMLButtonElement>) => {
    const n = presses + 1;
    setPresses(n);
    try { localStorage.setItem("miw:presses", String(n)); } catch {}
    if (n === 23) S.discover("twentythree");
    const l = n <= REFUSALS.length
      ? REFUSALS[n - 1]
      : REFUSALS[Math.floor(Math.random() * REFUSALS.length)];
    say(l, `PRESS ${n} · NO REFUNDS`);
    const r = e.currentTarget.getBoundingClientRect();
    bits(r.left + r.width / 2, r.top + r.height / 2, 16);
    if (n % 5 === 0) { trombone(); doShake(); damage(9); } else { boing(); damage(3); }
  };

  const holdStart = () => {
    pressTimer.current = setTimeout(() => {
      S.discover("longpress");
      say("...អ្នកនៅតែសង្កត់វាទៀត។", "ម៉ាស៊ីនខ្សឹបថា៖ មានបន្ទប់ក្រោមដី។");
      beep(180, 0.6, "sine");
    }, 3000);
  };
  const holdEnd = () => { if (pressTimer.current) clearTimeout(pressTimer.current); };

  /* ---------------- the lever ---------------- */
  const pullLever = () => {
    setPulled(true);
    clunk();
    setRegret(true);
    setTimeout(() => {
      const d = DIAGNOSES[Math.floor(Math.random() * DIAGNOSES.length)];
      say(d[0], d[1]);
      raspberry();
      damage(5);
    }, 330);
    setTimeout(() => { setPulled(false); setRegret(false); }, 1100);
  };

  /* ---------------- vibes ---------------- */
  const onVibes = (v: number) => {
    setVibes(v);
    vibeSeq.current.push(v);
    if (vibeSeq.current.length > 40) vibeSeq.current.shift();
    const seq = vibeSeq.current;
    const sawZero = seq.indexOf(0);
    const sawHundred = seq.indexOf(100);
    if (sawZero > -1 && sawHundred > sawZero && seq.slice(sawHundred).includes(0)) {
      S.discover("moodswing");
      vibeSeq.current = [];
    }
    if (v >= 96) { say("អារម្មណ៍អតិបរមា។ ម៉ាស៊ីនមិនស្រួលខ្លួន។", "អ្នកជាអ្នកធ្វើ"); alarm(); doShake(); }
  };

  /* ---------------- coward button ---------------- */
  const flee = () => {
    chases.current += 1;
    if (chases.current >= 20) S.discover("persistence");
    if (dodges >= 7) { setRunnerText("បានហើយ។ ចុចវាទៅ។"); setRunnerPos({ x: 0, y: 0, r: 0 }); return; }
    setDodges((d) => d + 1);
    setRunnerText(DODGES[Math.floor(Math.random() * DODGES.length)]);
    setRunnerPos({
      x: (Math.random() * 2 - 1) * Math.min(190, (typeof window !== "undefined" ? window.innerWidth : 800) * 0.22),
      y: (Math.random() * 2 - 1) * 50,
      r: (Math.random() * 2 - 1) * 16,
    });
    beep(900 + Math.random() * 500, 0.05);
  };
  const catchRunner = (e: React.MouseEvent) => {
    if (dodges < 7) { flee(); return; }
    say("អ្នកចាប់បានហើយ។ វាគ្មានអ្វីសម្រាប់អ្នកទេ។", "វាមិនដែលមាន");
    raspberry(); doShake();
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    bits(r.left + r.width / 2, r.top, 22);
    setDodges(0); setRunnerText("ចុចខ្ញុំ"); setRunnerPos({ x: 0, y: 0, r: 0 });
    damage(7);
  };

  /* ---------------- switches ---------------- */
  const flip = (i: number) => {
    setSwitches((s) => s.map((v, j) => (j === i ? !v : v)));
    beep(switches[i] ? 440 : 660, 0.07);
    swSeq.current.push(i);
    if (swSeq.current.length > 6) swSeq.current.shift();
    if (swSeq.current.join("") === "012210") { S.discover("palindrome"); swSeq.current = []; }
    say(
      ["កុងតាក់មិនបានភ្ជាប់ទៅអ្វីទាំងអស់។", "នៅតែមិនបានភ្ជាប់។",
       "កុងតាក់ទាំងនេះសម្រាប់តែតុបតែង។ ដូចជើងក្រានភ្លើង។", "អ្នកនៅតែធ្វើបែបនោះ។"][Math.floor(Math.random() * 4)],
      "SWITCH POSITION RECORDED · POINTLESSLY",
    );
  };

  /* ---------------- screws ---------------- */
  const turnScrew = (i: number) => {
    clunk();
    screwTurns.current[i] += 1;
    if (screwTurns.current.every((t) => t >= 3)) S.discover("unscrewed");
    say("កុំដោះវីស។", "នោះទ្រទ្រង់ទម្ងន់។ ប្រហែល។");
    damage(4);
  };

  const vibeWord = VIBEWORDS.reduce((acc, [n, w]) => (vibes >= n ? w : acc), VIBEWORDS[0][1]);
  const f = vibes / 100;

  return (
    <div
      className="wrap"
      style={{
        filter: `saturate(${1 + f * 2.2}) hue-rotate(${f * 32}deg) contrast(${1 + f * 0.25})`,
        transform: `rotate(${f * f * 3}deg)`,
        transition: "filter .25s ease, transform .9s cubic-bezier(.2,1.4,.4,1)",
      }}
    >
      <div className={`machine${shake ? " shake" : ""}`}>
        {(["tl", "tr", "bl", "br"] as const).map((p, i) => (
          <span key={p} className={`screw ${p}`} onClick={() => turnScrew(i)} />
        ))}

        <div className="plate">
          <div>
            <div className="mk">ក្រសួងផឹកភ្លាម · ម៉ូដែល ៧</div>
            <h1>ម៉ាស៊ីនអារម្មណ៍</h1>
          </div>
          <div className="cert">
            បញ្ជាក់ថាសុវត្ថិភាពសម្រាប់មនុស្ស*<br />
            *មិនបានផ្ទៀងផ្ទាត់ដោយឯករាជ្យទេ<br />
            លេខស៊េរី ០០០-០០០-{String(secretCount).padStart(4, "0")}
          </div>
        </div>

        <div className={`readout${glitch ? " glitch" : ""}`}>
          <p className="rd-line">{line}</p>
          <p className="rd-sub">{sub}</p>
        </div>

        <div className="lamps">
          <div className="lamp"><span className="bulb on" /><span>មានថាមពល</span></div>
          <div className="lamp"><span className={`bulb${thinking ? " on" : ""}`} /><span>កំពុងគិត</span></div>
          <div className="lamp"><span className={`bulb${regret ? " on" : ""}`} /><span>សោកស្តាយ</span></div>
          <div className="lamp">
            <span className={`bulb ${integrity > 66 ? "on" : integrity > 33 ? "warn" : "bad"}`} />
            <span>ភាពរឹងមាំ {integrity}%</span>
          </div>
        </div>

        <div className="grid">
          <div className="cell s5" style={{ alignItems: "center", textAlign: "center" }}>
            <span className="cap">កុំចុច</span>
            <button
              className="bigred"
              onClick={pressRed}
              onMouseDown={holdStart}
              onMouseUp={holdEnd}
              onMouseLeave={holdEnd}
              onTouchStart={holdStart}
              onTouchEnd={holdEnd}
            >
              កុំ<br />ចុច<br />វា
            </button>
            <div className="tiny">ចុចរួច {presses} ដង តាំងពីដើមមក</div>
          </div>

          <div className="cell s3" style={{ alignItems: "center" }}>
            <span className="cap">វិនិច្ឆ័យខ្ញុំ</span>
            <div
              onClick={pullLever}
              style={{
                width: 46, height: 132, background: "#8e876f", borderRadius: 24,
                position: "relative", cursor: "pointer", boxShadow: "inset 0 3px 9px rgba(0,0,0,.45)",
              }}
            >
              <span
                style={{
                  position: "absolute", left: "50%", transform: "translateX(-50%)",
                  top: pulled ? 88 : 6, width: 38, height: 38, borderRadius: "50%",
                  background: "radial-gradient(circle at 36% 30%,#ede7d6,#b9b199 60%,#7e7761)",
                  boxShadow: "0 3px 7px rgba(0,0,0,.45)",
                  transition: "top .32s cubic-bezier(.3,1.5,.5,1)",
                }}
              />
            </div>
          </div>

          <div className="cell s4">
            <span className="cap">អារម្មណ៍</span>
            <input
              type="range" min={0} max={100} value={vibes}
              onChange={(e) => onVibes(Number(e.target.value))}
              aria-label="Vibes"
            />
            <div className="tiny" style={{ textAlign: "right" }}>{vibes} / 100 — {vibeWord}</div>
            <span className="cap">កុងតាក់ (មិនធ្វើអ្វី)</span>
            <div style={{ display: "flex", gap: 10 }}>
              {switches.map((on, i) => (
                <div
                  key={i}
                  onClick={() => flip(i)}
                  style={{
                    width: 44, height: 64, background: "#8e876f", borderRadius: 8,
                    position: "relative", cursor: "pointer", boxShadow: "inset 0 3px 8px rgba(0,0,0,.4)",
                  }}
                >
                  <i
                    style={{
                      position: "absolute", left: 5, right: 5, height: 27, borderRadius: 5,
                      top: on ? 32 : 5,
                      background: on
                        ? "linear-gradient(180deg,#8fcf97,#4c9a56)"
                        : "linear-gradient(180deg,#ede7d6,#a49c86)",
                      boxShadow: "0 2px 4px rgba(0,0,0,.4)",
                      transition: "top .16s cubic-bezier(.3,1.7,.5,1)",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="cell s5" style={{ minHeight: 118, justifyContent: "center" }}>
            <span className="cap">សូមចុចមួយនេះ</span>
            <button
              className="btn"
              style={{
                alignSelf: "flex-start",
                transform: `translate(${runnerPos.x}px,${runnerPos.y}px) rotate(${runnerPos.r}deg)`,
                transition: "transform .16s cubic-bezier(.3,1.6,.5,1)",
              }}
              onMouseEnter={flee}
              onClick={catchRunner}
            >
              {runnerText}
            </button>
          </div>

          <div className="cell s7" style={{ flexDirection: "row", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <button
              className="btn big"
              style={{
                flex: 1, minWidth: 150,
                background: "repeating-linear-gradient(45deg,var(--amber) 0 13px,#241f0e 13px 26px)",
                color: "#241f0e", border: "3px solid #241f0e",
                textShadow: "0 1px 0 rgba(255,255,255,.45)", boxShadow: "0 5px 0 #17140a",
              }}
              onClick={() => {
                alarm(); doShake();
                say("ការភ័យស្លន់ស្លោត្រូវបានទទួលស្គាល់ និងទុកក្នុងឯកសារ។", "វានឹងមិនត្រូវបានពិនិត្យឡើងវិញទេ");
                bits(window.innerWidth / 2, window.innerHeight / 2, 40);
                damage(14);
              }}
            >
              ភ័យស្លន់ស្លោ
            </button>
            <span className="cap" style={{ flex: 1, minWidth: 120 }}>
              ក្នុងករណីមានអារម្មណ៍ សូមបំបែកកញ្ចក់
            </span>
          </div>
        </div>

        <div className="footplate">
          <span>ផលិតក្នុងរោងជាង · ២៤០V · ហាមជ្រលក់ទឹក</span>
          <span>
            UPTIME {uptime < 60 ? `${uptime}S` : `${Math.floor(uptime / 60)}M ${uptime % 60}S`}
            {" · "}
            SECRETS {secretCount} / ??
          </span>
        </div>
      </div>
    </div>
  );
}
