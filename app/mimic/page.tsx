"use client";

/**
 * BUREAU OF SOUND — the Ministry gives you a noise to make, you make it, it
 * decides whether that was good enough. Below the pass mark, you drink.
 *
 * The microphone never leaves the device. Audio is analysed frame by frame in
 * memory and discarded when the round ends; nothing is recorded, saved or sent.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  PROMPTS,
  PASS_MARK,
  detectPitch,
  scoreAttempt,
  medianHz,
  type Prompt,
  type Sample,
  type Score,
} from "@/lib/mimic";
import { beep, clunk, fanfare, trombone, raspberry } from "@/lib/audio";
import { verdict } from "@/lib/celebrate";

type Phase = "idle" | "armed" | "listening" | "scored";

const FRAME = 1024;

export default function Mimic() {
  const [prompt, setPrompt] = useState<Prompt>(PROMPTS[0]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [err, setErr] = useState<string | null>(null);
  const [level, setLevel] = useState(0);
  const [score, setScore] = useState<Score | null>(null);
  const [hz, setHz] = useState(0);
  const [round, setRound] = useState(0);
  const [best, setBest] = useState(0);
  const [showRules, setShowRules] = useState(true);

  const streamRef = useRef<MediaStream | null>(null);
  const acRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const sample = useRef<Sample>({ rms: [], hz: [], stepMs: 0 });
  const startedAt = useRef(0);

  useEffect(() => {
    setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
    try {
      setBest(parseInt(localStorage.getItem("miw:mimic") || "0", 10) || 0);
    } catch {
      /* private window, no history to keep */
    }
  }, []);

  const stopAll = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    acRef.current?.close().catch(() => {});
    acRef.current = null;
    analyserRef.current = null;
  }, []);

  useEffect(() => stopAll, [stopAll]);

  /* ---------------- microphone ---------------- */
  const arm = async () => {
    setErr(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          // the raw voice is the point, so leave it alone
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      streamRef.current = stream;
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ac = new AC();
      acRef.current = ac;
      const src = ac.createMediaStreamSource(stream);
      const an = ac.createAnalyser();
      an.fftSize = FRAME * 2;
      src.connect(an);
      analyserRef.current = an;
      setPhase("armed");
      beep(660, 0.05);
    } catch (e) {
      const name = (e as { name?: string })?.name;
      setErr(
        name === "NotAllowedError"
          ? "មីក្រូហ្វូនត្រូវបានបដិសេធ។ ហ្គេមនេះត្រូវការឮអ្នក ដូច្នេះវាដំណើរការមិនបានទេ។"
          : name === "NotFoundError"
            ? "រកមិនឃើញមីក្រូហ្វូនទេ។"
            : "មីក្រូហ្វូនប្រើមិនបាននៅទីនេះទេ។",
      );
    }
  };

  /* ---------------- the round ---------------- */
  const listen = () => {
    const an = analyserRef.current;
    const ac = acRef.current;
    if (!an || !ac) return;

    sample.current = { rms: [], hz: [], stepMs: (FRAME / ac.sampleRate) * 1000 };
    startedAt.current = performance.now();
    setScore(null);
    setPhase("listening");
    clunk();

    const buf = new Float32Array(an.fftSize);
    const tick = () => {
      an.getFloatTimeDomainData(buf);

      let sum = 0;
      for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
      const rms = Math.sqrt(sum / buf.length);

      sample.current.rms.push(rms);
      sample.current.hz.push(rms > 0.01 ? detectPitch(buf, ac.sampleRate) : 0);
      setLevel(rms);

      // a hard ceiling, so a held note cannot run forever
      if (performance.now() - startedAt.current > 9000) {
        finish();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const finish = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setLevel(0);

    const s = scoreAttempt(sample.current, prompt);
    setScore(s);
    setHz(medianHz(sample.current));
    setPhase("scored");
    setRound((r) => r + 1);
    setShowRules(false);

    if (s.total > best) {
      setBest(s.total);
      try {
        localStorage.setItem("miw:mimic", String(s.total));
      } catch {
        /* nothing to keep */
      }
    }

    if (s.verdict === "pass") {
      fanfare();
      verdict("ឆ្លងកាត់", s.noteKm, "#4c9a56");
    } else {
      if (s.total < 20) raspberry();
      else trombone();
      verdict("ផឹក", s.noteKm, "#c8342b");
    }

    // the samples have done their job
    sample.current = { rms: [], hz: [], stepMs: sample.current.stepMs };
  };

  const next = () => {
    let p = prompt;
    while (p.id === prompt.id && PROMPTS.length > 1) {
      p = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
    }
    setPrompt(p);
    setScore(null);
    setPhase(streamRef.current ? "armed" : "idle");
    beep(520, 0.05);
  };

  const meter = Math.min(100, Math.round(level * 320));

  return (
    <div className="wrap">
      <div className="machine">
        <span className="screw tl" />
        <span className="screw tr" />
        <span className="screw bl" />
        <span className="screw br" />

        <div className="plate">
          <div>
            <div className="mk">ការិយាល័យសំឡេង · បន្ទប់ស្តាប់ទី ១</div>
            <h1>ត្រាប់តាមសំឡេង</h1>
          </div>
          <div className="cert">
            គ្មានអ្វីចេញពីឧបករណ៍នេះទេ
            <br />
            គ្មានការថត គ្មានការរក្សាទុក
            <br />
            វគ្គទី {String(round).padStart(3, "0")}
          </div>
        </div>

        <div className="readout">
          <p className="rd-line" lang="km">
            {phase === "listening"
              ? "ក្រសួងកំពុងស្តាប់…"
              : phase === "scored" && score
                ? `${score.total} / 100`
                : prompt.km}
          </p>
          <p className="rd-sub" lang="km">
            {phase === "scored" && score
              ? score.noteKm
              : phase === "listening"
                ? "បញ្ចេញសំឡេងឥឡូវនេះ"
                : prompt.hintKm}
          </p>
        </div>

        {/* level meter: honest, it is the real RMS */}
        <div
          style={{
            height: 26,
            background: "#8e876f",
            borderRadius: 6,
            overflow: "hidden",
            boxShadow: "inset 0 3px 8px rgba(0,0,0,.45)",
            margin: "14px 0 4px",
          }}
        >
          <div
            style={{
              width: `${meter}%`,
              height: "100%",
              background:
                meter > 75
                  ? "repeating-linear-gradient(45deg,#c8342b 0 10px,#8e211a 10px 20px)"
                  : "repeating-linear-gradient(45deg,var(--amber) 0 12px,#c98d10 12px 24px)",
              transition: "width .06s linear",
            }}
          />
        </div>
        <div className="tiny" style={{ textAlign: "center" }} lang="km">
          កម្រិតសំឡេង {meter}% {hz > 0 && phase === "scored" ? `· ${hz} Hz` : ""}
        </div>

        {err && (
          <div className="tiny" style={{ textAlign: "center", marginTop: 10 }} lang="km">
            {err}
          </div>
        )}

        <div className="grid" style={{ marginTop: 16 }}>
          <div className="cell s6">
            <span className="cap" lang="km">
              ជំហានទី ១
            </span>
            {phase === "idle" ? (
              <button className="btn amber wide big" onClick={arm}>
                បើកមីក្រូហ្វូន
              </button>
            ) : (
              <button
                className="btn wide big"
                style={{ minHeight: 84, fontSize: 18 }}
                onMouseDown={listen}
                onMouseUp={finish}
                onMouseLeave={() => phase === "listening" && finish()}
                onTouchStart={(e) => {
                  e.preventDefault();
                  listen();
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  finish();
                }}
                disabled={phase === "listening" ? false : false}
              >
                {phase === "listening" ? "កំពុងស្តាប់… លែងដៃពេលចប់" : "សង្កត់ទុក រួចបញ្ចេញសំឡេង"}
              </button>
            )}
            <div className="tiny" lang="km">
              សង្កត់ប៊ូតុងទុក បញ្ចេញសំឡេង រួចលែងដៃ។
            </div>
          </div>

          <div className="cell s6">
            <span className="cap" lang="km">
              ជំហានទី ២
            </span>
            <button className="btn wide big" onClick={next}>
              សំឡេងបន្ទាប់
            </button>
            <div className="tiny" lang="km">
              ពិន្ទុក្រោម {PASS_MARK} ត្រូវផឹក។ ពិន្ទុល្អបំផុតរបស់អ្នក៖ {best}
            </div>
          </div>
        </div>

        {score && (
          <div className="grid" style={{ marginTop: 6 }}>
            {[
              { km: "ការប្តេជ្ញា", v: score.commitment },
              { km: "រយៈពេល", v: score.duration },
              { km: "ទម្រង់សំឡេង", v: score.shape },
            ].map((b) => (
              <div className="cell s4" key={b.km} style={{ textAlign: "center" }}>
                <span className="cap" lang="km">
                  {b.km}
                </span>
                <div
                  style={{
                    fontFamily: "var(--f-label)",
                    fontSize: 26,
                    color: b.v >= 60 ? "var(--green)" : "var(--red)",
                  }}
                >
                  {b.v}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* The rules sit under the game, not over it. On a phone this panel is
            taller than the screen, and putting it first pushed both the prompt
            and the record button below the fold: the player landed on
            instructions for a game they could not see. Collapsed once you have
            played a round, because nobody reads instructions twice. */}
        {showRules && (
          <div
            style={{
              background: "var(--cell)",
              border: "1px solid var(--panel-lo)",
              borderRadius: 8,
              padding: "14px 16px",
              margin: "16px 0 0",
            }}
          >
            <div
              className="cap"
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
              lang="km"
            >
              <span>របៀបលេង</span>
              <button
                type="button"
                onClick={() => setShowRules(false)}
                aria-label="បិទរបៀបលេង"
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "var(--f-read)",
                  fontSize: 12,
                  minHeight: 44,
                  padding: "0 6px",
                  color: "var(--ink-soft)",
                }}
              >
                បិទ ✕
              </button>
            </div>
            <ol
              lang="km"
              style={{
                margin: "10px 0 0",
                paddingLeft: "1.3em",
                fontFamily: "var(--f-km)",
                fontSize: 14,
                lineHeight: 1.95,
                color: "var(--ink-soft)",
              }}
            >
              <li>ក្រសួងប្រាប់សំឡេងមួយឱ្យអ្នកធ្វើ។</li>
              <li>សង្កត់ប៊ូតុងទុក រួចបញ្ចេញសំឡេងនោះឱ្យអស់ពីចិត្ត។ លែងដៃពេលចប់។</li>
              <li>
                ក្រសួងវាស់រឿង ៣ យ៉ាង៖ <b>ការប្តេជ្ញា</b> (ខ្លាំងប៉ុណ្ណា),
                <b> រយៈពេល</b> (យូរគ្រប់ទេ), និង <b>ទម្រង់សំឡេង</b> (ឡើង ចុះ ឬ នឹង)។
              </li>
              <li>
                ពិន្ទុ <b>{PASS_MARK} ឬលើស</b> គឺឆ្លងកាត់។ ទាបជាងនេះ អ្នក<b>ត្រូវផឹក</b>។
              </li>
              <li>បញ្ជូនទូរស័ព្ទទៅអ្នកបន្ទាប់ រួចចុច “សំឡេងបន្ទាប់”។</li>
            </ol>
            <p
              className="tiny"
              lang="km"
              style={{ marginTop: 10, lineHeight: 1.8 }}
            >
              សំឡេងរបស់អ្នកមិនចេញពីឧបករណ៍នេះទេ។ គ្មានការថត គ្មានការផ្ញើទៅណាទេ។
            </p>
          </div>
        )}

        {!showRules && (
          <button
            type="button"
            className="cap"
            onClick={() => setShowRules(true)}
            lang="km"
            style={{
              display: "block",
              width: "100%",
              marginTop: 16,
              minHeight: 44,
              textAlign: "left",
              cursor: "pointer",
              background: "var(--cell)",
              border: "1px solid var(--panel-lo)",
              borderRadius: 8,
              padding: "0 16px",
              color: "var(--ink-soft)",
            }}
          >
            របៀបលេង ⌄
          </button>
        )}

        <div className="foot">
          <span lang="km">
            ក្រសួងវិនិច្ឆ័យលើកម្រិតសំឡេង រយៈពេល និងសំឡេងឡើងចុះ · ការវិនិច្ឆ័យគឺចុងក្រោយ
          </span>
          <span lang="km">បន្ទប់ស្តាប់ទី ១</span>
        </div>
      </div>
    </div>
  );
}
