"use client";

/**
 * BUREAU OF SOUND — you hear a sound, you make that sound, the Ministry decides
 * whether that was good enough. Below the pass mark, you drink.
 *
 * Two modes, and the difference between them is whose voice you are copying.
 *
 *   ក្រសួងធ្វើសំឡេង — the Ministry synthesises the sound and plays it at you.
 *   Scored against the prompt's written targets, which the reference was built
 *   from, so "copy what you heard" and "hit these numbers" are one instruction
 *   rather than two.
 *
 *   ត្រាប់តាមគ្នា — somebody at the table records themselves, the phone goes
 *   round, and the next player has to be them. Scored against that actual
 *   recording: length, the rhythm of the loudness, and whether the pitch
 *   travelled the same way. This is the one that gets people shouting, and it
 *   is the only way to put a real human voice in here without shipping
 *   somebody else's recording.
 *
 * The microphone never leaves the device. Features are computed frame by frame
 * in memory, the recording lives in a blob URL that is revoked on the next
 * turn, and nothing is uploaded or written to disk.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  PROMPTS,
  PASS_MARK,
  detectPitch,
  scoreAttempt,
  scoreAgainst,
  medianHz,
  type Prompt,
  type Sample,
  type Score,
} from "@/lib/mimic";
import { playReference } from "@/lib/soundboard";
import { beep, clunk, fanfare, trombone, raspberry } from "@/lib/audio";
import { verdict } from "@/lib/celebrate";

type Mode = "ministry" | "human";
/** idle: no mic. armed: ready. playing: the reference is sounding.
 *  listening: capturing. handover: pass the phone. scored: verdict up. */
type Phase = "idle" | "armed" | "playing" | "listening" | "handover" | "scored";
/** In human mode, whose turn this is: setting the sound, or copying it. */
type Turn = "set" | "copy";

const FRAME = 1024;
const EMPTY: Sample = { rms: [], hz: [], stepMs: 0 };

export default function Mimic() {
  const [mode, setMode] = useState<Mode>("ministry");
  const [prompt, setPrompt] = useState<Prompt>(PROMPTS[0]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [turn, setTurn] = useState<Turn>("set");
  const [err, setErr] = useState<string | null>(null);
  const [level, setLevel] = useState(0);
  const [score, setScore] = useState<Score | null>(null);
  const [hz, setHz] = useState(0);
  const [round, setRound] = useState(0);
  const [best, setBest] = useState(0);
  const [showRules, setShowRules] = useState(true);
  const [heard, setHeard] = useState(false);
  const [refUrl, setRefUrl] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const acRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const sample = useRef<Sample>(EMPTY);
  const startedAt = useRef(0);

  /* what the player before you set, in human mode */
  const refSample = useRef<Sample>(EMPTY);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<BlobPart[]>([]);
  const playerRef = useRef<HTMLAudioElement | null>(null);

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

  /* one blob URL per recording, so the one it replaced has to go */
  useEffect(() => {
    return () => {
      if (refUrl) URL.revokeObjectURL(refUrl);
    };
  }, [refUrl]);

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

  /* ---------------- hearing the thing you have to copy ---------------- */
  const hear = async () => {
    if (phase === "listening" || phase === "playing") return;
    setPhase("playing");

    if (mode === "ministry") {
      await playReference(prompt);
    } else if (refUrl) {
      const el = playerRef.current;
      if (el) {
        el.currentTime = 0;
        await el.play().catch(() => {});
        await new Promise<void>((res) => {
          const done = () => {
            el.removeEventListener("ended", done);
            res();
          };
          el.addEventListener("ended", done);
          // a blob that never fires `ended` must not strand the room
          setTimeout(done, 11000);
        });
      }
    }

    setHeard(true);
    setPhase("armed");
  };

  /* ---------------- the round ---------------- */
  const listen = () => {
    const an = analyserRef.current;
    const ac = acRef.current;
    if (!an || !ac || phase === "playing") return;

    sample.current = { rms: [], hz: [], stepMs: (FRAME / ac.sampleRate) * 1000 };
    startedAt.current = performance.now();
    setScore(null);
    setPhase("listening");
    clunk();

    // In human mode the take being set has to be playable back, not only
    // measured, so it is recorded properly alongside the analysis.
    if (mode === "human" && turn === "set" && streamRef.current) {
      try {
        chunks.current = [];
        const rec = new MediaRecorder(streamRef.current);
        rec.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.current.push(e.data);
        };
        rec.onstop = () => {
          const blob = new Blob(chunks.current, { type: rec.mimeType || "audio/webm" });
          setRefUrl((old) => {
            if (old) URL.revokeObjectURL(old);
            return URL.createObjectURL(blob);
          });
        };
        rec.start();
        recRef.current = rec;
      } catch {
        // no MediaRecorder here: the mode still scores, it just cannot replay
        recRef.current = null;
      }
    }

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

  const keep = (total: number) => {
    if (total <= best) return;
    setBest(total);
    try {
      localStorage.setItem("miw:mimic", String(total));
    } catch {
      /* nothing to keep */
    }
  };

  const announce = (s: Score) => {
    if (s.verdict === "pass") {
      fanfare();
      verdict("ឆ្លងកាត់", s.noteKm, "#4c9a56");
    } else {
      if (s.total < 20) raspberry();
      else trombone();
      verdict("ផឹក", s.noteKm, "#c8342b");
    }
  };

  const finish = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setLevel(0);
    setShowRules(false);

    // off the clock, not off the frame count
    sample.current.ms = performance.now() - startedAt.current;

    if (recRef.current && recRef.current.state !== "inactive") {
      recRef.current.stop();
      recRef.current = null;
    }

    // Setting the sound is not an attempt at anything, so it is not scored.
    // It is kept, and the phone goes round.
    if (mode === "human" && turn === "set") {
      refSample.current = sample.current;
      sample.current = { ...EMPTY, stepMs: refSample.current.stepMs };
      setHeard(false);
      setPhase("handover");
      beep(760, 0.07);
      return;
    }

    const s =
      mode === "human"
        ? scoreAgainst(sample.current, refSample.current)
        : scoreAttempt(sample.current, prompt);

    setScore(s);
    setHz(medianHz(sample.current));
    setPhase("scored");
    setRound((r) => r + 1);
    keep(s.total);
    announce(s);

    // the samples have done their job
    sample.current = { ...EMPTY, stepMs: sample.current.stepMs };
  };

  /* ---------------- moving on ---------------- */
  const next = () => {
    if (mode === "human") {
      // whoever just copied sets the next one
      refSample.current = EMPTY;
      setRefUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return null;
      });
      setTurn("set");
    } else {
      let p = prompt;
      while (p.id === prompt.id && PROMPTS.length > 1) {
        p = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
      }
      setPrompt(p);
    }
    setScore(null);
    setHeard(false);
    setPhase(streamRef.current ? "armed" : "idle");
    beep(520, 0.05);
  };

  const switchMode = (m: Mode) => {
    if (m === mode) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    refSample.current = EMPTY;
    setRefUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
    setMode(m);
    setTurn("set");
    setScore(null);
    setHeard(false);
    setLevel(0);
    setPhase(streamRef.current ? "armed" : "idle");
    beep(600, 0.05);
  };

  const meter = Math.min(100, Math.round(level * 320));

  /* in human mode only the second player copies anything */
  const canCopy = mode === "ministry" || turn === "copy";

  const headline =
    phase === "listening"
      ? "ក្រសួងកំពុងស្តាប់…"
      : phase === "playing"
        ? "ស្តាប់ឱ្យច្បាស់…"
        : phase === "handover"
          ? "ប្រគល់ទូរស័ព្ទទៅអ្នកបន្ទាប់"
          : phase === "scored" && score
            ? `${score.total} / 100`
            : mode === "human"
              ? turn === "set"
                ? "ថតសំឡេងរបស់អ្នក"
                : "ធ្វើសំឡេងនោះឱ្យដូច"
              : prompt.km;

  const subline =
    phase === "scored" && score
      ? score.noteKm
      : phase === "listening"
        ? "បញ្ចេញសំឡេងឥឡូវនេះ"
        : phase === "playing"
          ? "កុំធ្វើតាមនៅឡើយ"
          : phase === "handover"
            ? "កុំឱ្យអ្នកបន្ទាប់ឃើញអេក្រង់មុនពេល"
            : mode === "human"
              ? turn === "set"
                ? "សំឡេងអ្វីក៏បាន។ អ្នកបន្ទាប់ត្រូវធ្វើឱ្យដូចអ្នក។"
                : "ស្តាប់មុន រួចសឹមធ្វើតាម"
              : prompt.hintKm;

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
            គ្មានការផ្ញើ គ្មានការរក្សាទុក
            <br />
            វគ្គទី {String(round).padStart(3, "0")}
          </div>
        </div>

        {/* whose voice you are copying */}
        <div className="modebar" role="group" aria-label="របៀបលេង">
          <button
            type="button"
            className={`modebtn${mode === "ministry" ? " on" : ""}`}
            onClick={() => switchMode("ministry")}
            aria-pressed={mode === "ministry"}
            lang="km"
          >
            ក្រសួងធ្វើសំឡេង
          </button>
          <button
            type="button"
            className={`modebtn${mode === "human" ? " on" : ""}`}
            onClick={() => switchMode("human")}
            aria-pressed={mode === "human"}
            lang="km"
          >
            ត្រាប់តាមគ្នា
          </button>
        </div>

        <div className="readout">
          <p className="rd-line" lang="km">
            {headline}
          </p>
          <p className="rd-sub" lang="km">
            {subline}
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

        {/* the take the next player has to be. Never shown, only heard. */}
        <audio ref={playerRef} src={refUrl ?? undefined} preload="auto" hidden />

        {phase === "handover" ? (
          <div className="grid" style={{ marginTop: 16 }}>
            <div className="cell s12">
              <span className="cap" lang="km">
                បញ្ជូនបន្ត
              </span>
              <button
                className="btn amber wide big"
                style={{ minHeight: 84, fontSize: 18 }}
                onClick={() => {
                  setTurn("copy");
                  setPhase("armed");
                  beep(600, 0.05);
                }}
                lang="km"
              >
                ខ្ញុំជាអ្នកបន្ទាប់
              </button>
              <div className="tiny" lang="km">
                ប្រគល់ទូរស័ព្ទទៅអ្នកបន្ទាប់សិន រួចសឹមចុចប៊ូតុងនេះ។
              </div>
            </div>
          </div>
        ) : (
          <div className="grid" style={{ marginTop: 16 }}>
            <div className="cell s6">
              <span className="cap" lang="km">
                ជំហានទី ១
              </span>
              {phase === "idle" ? (
                <button className="btn amber wide big" onClick={arm} lang="km">
                  បើកមីក្រូហ្វូន
                </button>
              ) : canCopy ? (
                <button
                  className="btn amber wide big"
                  onClick={hear}
                  disabled={phase === "playing" || (mode === "human" && !refUrl)}
                  lang="km"
                >
                  {phase === "playing"
                    ? "កំពុងចាក់…"
                    : heard
                      ? "ស្តាប់ម្តងទៀត"
                      : "▶ ស្តាប់សំឡេង"}
                </button>
              ) : (
                <div className="tiny" lang="km" style={{ padding: "12px 0" }}>
                  អ្នកជាអ្នកដាក់សំឡេង។ មិនបាច់ស្តាប់អ្វីទេ។
                </div>
              )}
              <div className="tiny" lang="km">
                {canCopy
                  ? "ស្តាប់សំឡេងគោលមុន រួចសឹមធ្វើតាម។"
                  : "ធ្វើសំឡេងអ្វីមួយឱ្យអ្នកបន្ទាប់ត្រាប់តាម។"}
              </div>
            </div>

            <div className="cell s6">
              <span className="cap" lang="km">
                ជំហានទី ២
              </span>
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
                lang="km"
              >
                {phase === "listening"
                  ? "កំពុងស្តាប់… លែងដៃពេលចប់"
                  : canCopy
                    ? "សង្កត់ទុក រួចធ្វើតាម"
                    : "សង្កត់ទុក រួចថតសំឡេង"}
              </button>
              <div className="tiny" lang="km">
                សង្កត់ប៊ូតុងទុក បញ្ចេញសំឡេង រួចលែងដៃ។
              </div>
            </div>
          </div>
        )}

        {score && (
          <>
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

            <div className="grid" style={{ marginTop: 6 }}>
              <div className="cell s12">
                <button className="btn wide big" onClick={next} lang="km">
                  {mode === "human" ? "វេនបន្ទាប់" : "សំឡេងបន្ទាប់"}
                </button>
                <div className="tiny" lang="km">
                  ពិន្ទុក្រោម {PASS_MARK} ត្រូវផឹក។ ពិន្ទុល្អបំផុតរបស់អ្នក៖ {best}
                </div>
              </div>
            </div>
          </>
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
              <li>
                <b>ក្រសួងធ្វើសំឡេង</b>៖ ចុច “ស្តាប់សំឡេង” ក្រសួងនឹងធ្វើសំឡេងឱ្យឮ។
                បន្ទាប់មកសង្កត់ប៊ូតុងទុក រួចធ្វើឱ្យដូច។
              </li>
              <li>
                <b>ត្រាប់តាមគ្នា</b>៖ អ្នកម្នាក់ថតសំឡេងខ្លួនឯងសិន បញ្ជូនទូរស័ព្ទបន្ត
                អ្នកបន្ទាប់ស្តាប់ រួចត្រូវធ្វើឱ្យដូចអ្នកនោះ។
              </li>
              <li>
                ក្រសួងវាស់រឿង ៣ យ៉ាង៖ <b>ការប្តេជ្ញា</b> (ខ្លាំងប៉ុណ្ណា),
                <b> រយៈពេល</b> (យូរគ្រប់ទេ), និង <b>ទម្រង់សំឡេង</b> (ឡើង ចុះ ឬ នឹង)។
              </li>
              <li>
                ពិន្ទុ <b>{PASS_MARK} ឬលើស</b> គឺឆ្លងកាត់។ ទាបជាងនេះ អ្នក<b>ត្រូវផឹក</b>។
              </li>
            </ol>
            <p className="tiny" lang="km" style={{ marginTop: 10, lineHeight: 1.8 }}>
              សំឡេងរបស់អ្នកមិនចេញពីឧបករណ៍នេះទេ។ ការថតនៅតែក្នុងទូរស័ព្ទ
              ហើយរលាយបាត់នៅវេនបន្ទាប់។
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
