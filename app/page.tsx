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
  "PLEASE DO NOT.",
  "I SAID PLEASE.",
  "THAT IS THE ONE BUTTON. THE ONE.",
  "FINE. FINE! IT IS PRESSED.",
  "NOTHING HAPPENED. HAPPY?",
  "SOMETHING HAPPENED. NOT TELLING YOU WHAT.",
  "MY FATHER BUILT THIS MACHINE.",
  "HE WAS NOT A KIND MAN.",
  "THIS IS BETWEEN US NOW.",
  "YOU HAVE PRESSED IT MORE THAN MOST.",
  "STATISTICALLY YOU ARE A CONCERN.",
  "THE BUTTON IS TIRED.",
  "THE BUTTON HAS A FAMILY.",
  "OK NOW YOU ARE JUST SHOWING OFF.",
  "I AM LOGGING THIS.",
  "LOGGED. TO NOWHERE. BUT LOGGED.",
  "PRESS IT AGAIN. SEE WHAT HAPPENS. NOTHING HAPPENS.",
  "SOMETHING DEFINITELY BROKE THAT TIME.",
  "WE ARE BOTH ADULTS HERE. ALLEGEDLY.",
];

const DIAGNOSES: [string, string][] = [
  ["YOU ARE 61% SOUP", "REMAINDER: MOSTLY OPINIONS"],
  ["STRUCTURALLY, A HAT", "NO FURTHER QUESTIONS"],
  ["YOUR AURA SMELLS OF PENNIES", "THIS IS NOT A COMPLIMENT"],
  ["TWO OF YOUR BONES ARE SURPLUS", "WE WILL NOT SAY WHICH"],
  ["EMOTIONALLY: A CAR PARK", "LEVEL 3, NEAR THE LIFTS"],
  ["YOU HAVE THE VIBE OF A TUESDAY", "SPECIFICALLY 3PM"],
  ["DIAGNOSIS: SLIGHTLY DAMP", "PROGNOSIS: STILL DAMP"],
  ["YOU WOULD BE GOOD AT BIRDS", "UNCLEAR IN WHAT SENSE"],
  ["THE MACHINE LIKES YOU", "IT LIKES EVERYONE. IT IS BROKEN."],
  ["INTERNALLY YOU ARE APPLAUDING", "EXTERNALLY, LESS SO"],
  ["YOU SMELL LIKE A DECISION", "AN OLD ONE"],
  ["SPIRITUALLY: A LEFTOVER", "REHEATED TWICE"],
  ["CONTAINS TRACES OF CONFIDENCE", "MAY CONTAIN NUTS"],
  ["YOU ARE THE THIRD BEST", "OF WHAT, IT WILL NOT SAY"],
  ["ALIGNMENT: LAWFUL SLEEPY", "CLASS: PERSON, PROBABLY"],
];

const DODGES = ["NOPE", "MISSED", "TOO SLOW", "NOT TODAY", "HA", "OVER HERE", "WRONG", "ALMOST"];
const VIBEWORDS: [number, string][] = [
  [0, "NONE DETECTED"], [10, "ADEQUATE"], [25, "MILDLY PRESENT"], [40, "NOTICEABLE"],
  [55, "CONSIDERABLE"], [70, "STRUCTURALLY UNSOUND"], [85, "CALL SOMEONE"], [96, "MAXIMUM. REGRET IT."],
];
const BITS = ["!", "?", "*", "~", "%", "#", "@", "&", "WOO", "NO", "YES", "EH", "OW", "HM"];

export default function Lobby() {
  const [line, setLine] = useState("MACHINE IDLE. AWAITING A DECISION FROM YOU.");
  const [sub, setSub] = useState("STATUS: SMUG · TEMP: ROOM · OPINION: FORMING");
  const [glitch, setGlitch] = useState(false);
  const [shake, setShake] = useState(false);
  const [integrity, setIntegrity] = useState(100);
  const [presses, setPresses] = useState(0);
  const [vibes, setVibes] = useState(12);
  const [pulled, setPulled] = useState(false);
  const [dodges, setDodges] = useState(0);
  const [runnerPos, setRunnerPos] = useState({ x: 0, y: 0, r: 0 });
  const [runnerText, setRunnerText] = useState("Click me");
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
        setTimeout(() => say("INTEGRITY RESTORED BY IGNORING THE PROBLEM.", "THE INDUSTRY STANDARD APPROACH"), 60);
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
      say("STILL THERE?", "THE MACHINE HAS BEEN ALONE FOR A MINUTE");
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
    const t = setTimeout(() => say("MACHINE READY. TOUCH SOMETHING.", "IT WILL NOT HELP. IT WILL NOT HURT. MOSTLY."), 700);
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
      say("...you are still holding it.", "THE MACHINE WHISPERS: THERE IS A BASEMENT.");
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
    if (v >= 96) { say("MAXIMUM VIBES. THE MACHINE IS UNWELL.", "YOU DID THIS"); alarm(); doShake(); }
  };

  /* ---------------- coward button ---------------- */
  const flee = () => {
    chases.current += 1;
    if (chases.current >= 20) S.discover("persistence");
    if (dodges >= 7) { setRunnerText("fine. click it."); setRunnerPos({ x: 0, y: 0, r: 0 }); return; }
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
    say("YOU CAUGHT IT. IT HAS NOTHING FOR YOU.", "IT NEVER DID");
    raspberry(); doShake();
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    bits(r.left + r.width / 2, r.top, 22);
    setDodges(0); setRunnerText("Click me"); setRunnerPos({ x: 0, y: 0, r: 0 });
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
      ["SWITCH IS NOT CONNECTED TO ANYTHING.", "STILL NOT CONNECTED.",
       "THE SWITCHES ARE DECORATIVE. LIKE A FIREPLACE.", "YOU KEEP DOING THAT."][Math.floor(Math.random() * 4)],
      "SWITCH POSITION RECORDED · POINTLESSLY",
    );
  };

  /* ---------------- screws ---------------- */
  const turnScrew = (i: number) => {
    clunk();
    screwTurns.current[i] += 1;
    if (screwTurns.current.every((t) => t >= 3)) S.discover("unscrewed");
    say("DO NOT UNDO THE SCREWS.", "THAT IS LOAD BEARING. PROBABLY.");
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
            <div className="mk">Ministry of Interior Weather · Model 7</div>
            <h1>The Feelings Machine</h1>
          </div>
          <div className="cert">
            CERTIFIED SAFE FOR HUMANS*<br />
            *not independently verified<br />
            SERIAL 000-000-{String(secretCount).padStart(4, "0")}
          </div>
        </div>

        <div className={`readout${glitch ? " glitch" : ""}`}>
          <p className="rd-line">{line}</p>
          <p className="rd-sub">{sub}</p>
        </div>

        <div className="lamps">
          <div className="lamp"><span className="bulb on" /><span>Powered</span></div>
          <div className="lamp"><span className={`bulb${thinking ? " on" : ""}`} /><span>Thinking</span></div>
          <div className="lamp"><span className={`bulb${regret ? " on" : ""}`} /><span>Regret</span></div>
          <div className="lamp">
            <span className={`bulb ${integrity > 66 ? "on" : integrity > 33 ? "warn" : "bad"}`} />
            <span>Integrity {integrity}%</span>
          </div>
        </div>

        <div className="grid">
          <div className="cell s5" style={{ alignItems: "center", textAlign: "center" }}>
            <span className="cap">Do not press</span>
            <button
              className="bigred"
              onClick={pressRed}
              onMouseDown={holdStart}
              onMouseUp={holdEnd}
              onMouseLeave={holdEnd}
              onTouchStart={holdStart}
              onTouchEnd={holdEnd}
            >
              Do<br />not<br />press
            </button>
            <div className="tiny">PRESSED {presses} TIMES, EVER</div>
          </div>

          <div className="cell s3" style={{ alignItems: "center" }}>
            <span className="cap">Diagnose me</span>
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
            <span className="cap">Vibes</span>
            <input
              type="range" min={0} max={100} value={vibes}
              onChange={(e) => onVibes(Number(e.target.value))}
              aria-label="Vibes"
            />
            <div className="tiny" style={{ textAlign: "right" }}>{vibes} / 100 — {vibeWord}</div>
            <span className="cap">Switches (do nothing)</span>
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
            <span className="cap">Please click this one</span>
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
                say("PANIC ACKNOWLEDGED AND FILED.", "IT WILL BE REVIEWED NEVER");
                bits(window.innerWidth / 2, window.innerHeight / 2, 40);
                damage(14);
              }}
            >
              Panic
            </button>
            <span className="cap" style={{ flex: 1, minWidth: 120 }}>
              In case of feelings, break glass
            </span>
          </div>
        </div>

        <div className="footplate">
          <span>MADE IN A SHED · 240V · DO NOT IMMERSE</span>
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
