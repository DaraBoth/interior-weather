"use client";

/**
 * THE SELECTION CHAMBER
 *
 * Type a forfeit, point the camera at the room, and the Ministry decides who
 * is doing it. Two ways to find the candidates:
 *
 *   AUTO   the browser's built-in FaceDetector, where it exists (Chrome and
 *          most Android). No model download, so nothing to wait for on party wifi.
 *   MANUAL everyone taps their own face on screen. Works in every browser,
 *          and is honestly more reliable in a dark room full of people.
 *
 * The video never leaves the device. There is no upload, no canvas export, no
 * network call of any kind on this page. The stream is stopped on unmount.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import * as S from "@/lib/secrets";
import { beep, fanfare, tick, trombone } from "@/lib/audio";
import { verdict } from "@/lib/celebrate";
import { getDetector, describeTier, type Tier } from "@/lib/faces";

type Box = { x: number; y: number; w: number; h: number; id: number };

const FORFEIT_SUGGESTIONS = [
  "ផឹក ២ កែវ",
  "និទានរឿងគួរឱ្យខ្មាស",
  "រុញដី ១០ ដង",
  "កុំផ្ញើសារទៅគូចាស់សោះ។ ល្អណាស់។",
  "និយាយតែជាសំណួរ ៥ នាទី",
  "ទុកឱ្យក្រុមជ្រើសបទចម្រៀងបន្ទាប់របស់អ្នក",
];

const SUSPENSE = [
  "កំពុងស្កេនបន្ទប់",
  "កំពុងវាស់កំហុស",
  "កំពុងពិគ្រោះជាមួយបណ្ណសារ",
  "កំពុងថ្លឹងឥរិយាបថកន្លងមក",
  "កំពុងមិនអើពើនឹងការតវ៉ារបស់អ្នក",
  "កំពុងផ្ទៀងផ្ទាត់អារម្មណ៍",
];

export default function SelectionChamber() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const detectorRef = useRef<Awaited<ReturnType<typeof getDetector>> | null>(null);

  const [forfeit, setForfeit] = useState("ផឹក ២ កែវ");
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [live, setLive] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [tier, setTier] = useState<Tier | null>(null);
  const [loadingModel, setLoadingModel] = useState(true);
  const [manual, setManual] = useState(false);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [marks, setMarks] = useState<Box[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [highlight, setHighlight] = useState<number | null>(null);
  const [chosen, setChosen] = useState<number | null>(null);
  const [status, setStatus] = useState("បន្ទប់ទំនេរ។ ដាក់ឈ្មោះការផាកពិន័យ។");

  const candidates = manual ? marks : boxes;

  /* ---------------- camera ---------------- */
  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setLive(false);
  }, []);

  const start = useCallback(async () => {
    setErr(null);
    stop();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setLive(true);
      setStatus("CHAMBER LIVE. THE MINISTRY IS WATCHING.");
      beep(700, 0.1);
    } catch (e: any) {
      const name = e?.name || "";
      setErr(
        name === "NotAllowedError"
          ? "ការអនុញ្ញាតកាមេរ៉ាត្រូវបានបដិសេធ។ ក្រសួងគោរពរឿងនេះ ហើយខកចិត្ត។"
          : name === "NotFoundError"
          ? "រកមិនឃើញកាមេរ៉ាទេ។ ប្រើរបៀបដោយដៃ៖ គ្រប់គ្នាចុចលើមុខខ្លួនឯង។"
          : "កាមេរ៉ាប្រើមិនបាននៅទីនេះ។ របៀបដោយដៃនៅតែដំណើរការ។",
      );
      setManual(true);
    }
  }, [facing, stop]);

  useEffect(() => () => stop(), [stop]);

  /* ---------------- pick the best detector this browser can manage ---------------- */
  useEffect(() => {
    let alive = true;
    getDetector().then((d) => {
      if (!alive) return;
      detectorRef.current = d;
      setTier(d.tier);
      setLoadingModel(false);
      if (d.tier === "none") setManual(true);
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    // capture once so TypeScript can narrow it inside the async closure
    const det = detectorRef.current;
    if (!live || manual || !det || det.tier === "none") return;
    let alive = true;
    let last = 0;

    const loop = async (t: number) => {
      if (!alive) return;
      const v = videoRef.current;
      if (t - last > 220 && v && v.readyState >= 2) {
        last = t;
        try {
          const faces = await det.detect(v);
          if (alive) setBoxes(faces.map((f, i) => ({ id: i, ...f })));
        } catch {
          /* a failed frame is not worth reporting; the next one usually works */
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { alive = false; if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    // tier is a dependency so the loop starts as soon as the model finishes loading
  }, [live, manual, tier]);

  /* ---------------- manual markers ---------------- */
  const addMark = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!manual || spinning) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    setMarks((m) => [...m, { id: Date.now(), x: x - 9, y: y - 12, w: 18, h: 24 }]);
    beep(880, 0.05);
  };

  /* ---------------- the selection ---------------- */
  const select = () => {
    if (candidates.length === 0) {
      setStatus("គ្មាននរណានៅទីនេះទេ។ ក្រសួងមិនអាចដាក់ទោសភាពទទេបានទេ។");
      trombone();
      return;
    }
    setSpinning(true);
    setChosen(null);
    let n = 0;
    const total = 22 + Math.floor(Math.random() * 12);
    const step = () => {
      const i = Math.floor(Math.random() * candidates.length);
      setHighlight(i);
      setStatus(SUSPENSE[Math.floor(n / 5) % SUSPENSE.length]);
      tick();
      n++;
      if (n < total) {
        setTimeout(step, 60 + n * 9);
      } else {
        const winner = Math.floor(Math.random() * candidates.length);
        setHighlight(winner);
        setChosen(winner);
        setSpinning(false);
        setStatus("ក្រសួងបានសម្រេចហើយ។");
        fanfare();
        verdict("ត្រូវបានជ្រើស", forfeit || "តាមបញ្ជាក្រសួង", "#e8a317");
        S.discover("chosen");
      }
    };
    step();
  };

  const reset = () => { setChosen(null); setHighlight(null); setMarks([]); setStatus("បន្ទប់រួចរាល់។"); };

  return (
    <div className="wrap">
      <div className="machine">
        <span className="screw tl" /><span className="screw tr" />
        <span className="screw bl" /><span className="screw br" />

        <div className="plate">
          <div>
            <div className="mk">នាយកដ្ឋានជ្រើសរើស · បន្ទប់ទី ១</div>
            <h1>តើនឹងជានរណា</h1>
          </div>
          <div className="cert">
            គ្មានអ្វីចេញពីឧបករណ៍នេះទេ<br />
            គ្មានការផ្ទុកឡើង · គ្មានការថត · គ្មានម៉ាស៊ីនមេ<br />
            ក្រសួងមិនចាប់អារម្មណ៍នឹងមុខអ្នកទេ
          </div>
        </div>

        <div className="readout">
          <p className="rd-line">{status}</p>
          <p className="rd-sub">
            CANDIDATES: {candidates.length} · MODE: {manual ? "MANUAL" : loadingModel ? "LOADING DETECTOR…" : describeTier(tier ?? "none")}
          </p>
        </div>

        <div className="grid" style={{ marginBottom: 16 }}>
          <div className="cell s12">
            <span className="cap">ការផាកពិន័យ</span>
            <input
              className="field"
              value={forfeit}
              onChange={(e) => setForfeit(e.target.value)}
              placeholder="ផឹក ២ កែវ"
              maxLength={90}
            />
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {FORFEIT_SUGGESTIONS.map((f) => (
                <button
                  key={f}
                  className="btn"
                  style={{ fontSize: 10.5, padding: "7px 11px", letterSpacing: ".06em" }}
                  onClick={() => { setForfeit(f); beep(560, 0.05); }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ------------- the viewport ------------- */}
        <div
          ref={wrapRef}
          onClick={addMark}
          className="viewport"
          style={{ cursor: manual && live ? "crosshair" : "default" }}
        >
          <video
            ref={videoRef}
            playsInline
            muted
            style={{
              width: "100%", height: "100%", objectFit: "cover",
              transform: facing === "user" ? "scaleX(-1)" : "none",
              display: live ? "block" : "none",
            }}
          />

          {!live && (
            <div style={{
              position: "absolute", inset: 0, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 14, padding: 20, textAlign: "center",
            }}>
              <div className="mono" style={{ color: "#7de88a", fontSize: 13, maxWidth: 420, lineHeight: 1.7 }}>
                {err ?? "បន្ទប់នេះត្រូវការមើលឃើញបន្ទប់របស់អ្នក។ កាមេរ៉ារបស់អ្នកនៅលើឧបករណ៍នេះ — គ្មានការផ្ទុកឡើង គ្មានការថត គ្មានម៉ាស៊ីនមេ។"}
              </div>
              <button className="btn amber big" onClick={start}>បើកបន្ទប់</button>
            </div>
          )}

          {/* candidate boxes */}
          {live && candidates.map((b, i) => {
            const isHi = highlight === i;
            const isWin = chosen === i;
            return (
              <div
                key={b.id}
                style={{
                  position: "absolute",
                  left: `${facing === "user" && !manual ? 100 - b.x - b.w : b.x}%`,
                  top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%`,
                  border: `3px solid ${isWin ? "#e8a317" : isHi ? "#7de88a" : "rgba(255,255,255,.55)"}`,
                  borderRadius: 8,
                  boxShadow: isWin ? "0 0 0 5px rgba(232,163,23,.35), 0 0 40px rgba(232,163,23,.7)" : "none",
                  transition: "border-color .08s, box-shadow .2s",
                  pointerEvents: "none",
                }}
              >
                {isWin && (
                  <div style={{
                    position: "absolute", left: "50%", top: -34, transform: "translateX(-50%)",
                    background: "#e8a317", color: "#241f0e", fontFamily: "var(--f-label)",
                    fontWeight: 700, fontSize: 13, letterSpacing: ".12em", padding: "5px 12px",
                    borderRadius: 5, whiteSpace: "nowrap", textTransform: "uppercase",
                  }}>
                    អ្នក
                  </div>
                )}
              </div>
            );
          })}

          {live && manual && marks.length === 0 && (
            <div style={{
              position: "absolute", left: 0, right: 0, bottom: 12, textAlign: "center",
              fontFamily: "var(--f-read)", fontSize: 12, color: "#7de88a",
              textShadow: "0 2px 8px #000",
            }}>
              គ្រប់គ្នាចុចលើមុខខ្លួនឯងនៅលើអេក្រង់
            </div>
          )}
        </div>

        {/* ------------- verdict ------------- */}
        {chosen !== null && (
          <div style={{
            marginTop: 16, padding: "18px 20px", background: "var(--amber)",
            border: "3px solid #241f0e", borderRadius: 10, textAlign: "center",
          }}>
            <div className="mk" style={{ color: "#241f0e" }}>តាមបញ្ជាក្រសួង</div>
            <div style={{
              fontSize: "clamp(20px,5vw,34px)", fontWeight: 700, textTransform: "uppercase",
              lineHeight: 1.05, marginTop: 6, color: "#241f0e",
            }}>
              អ្នកនៅក្នុងប្រអប់ត្រូវ {forfeit || "សម្រេចដោយខ្លួនឯង"}
            </div>
            <div className="mono" style={{ fontSize: 11, marginTop: 8, color: "#5c4a12" }}>
              ការប្តឹងឧទ្ធរណ៍អាចដាក់តាមទម្រង់ ២៧-ខ ហើយនឹងមិនមានអ្នកអានទេ
            </div>
          </div>
        )}

        {/* ------------- controls ------------- */}
        <div className="grid" style={{ marginTop: 16 }}>
          <div className="cell s12" style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            <button className="btn amber big" style={{ flex: 2, minWidth: 180 }} onClick={select} disabled={!live || spinning}>
              {spinning ? "កំពុងសម្រេច…" : "ជ្រើសរើសនរណាម្នាក់"}
            </button>
            <button className="btn" style={{ flex: 1, minWidth: 120 }} onClick={() => { setFacing((f) => (f === "user" ? "environment" : "user")); if (live) setTimeout(start, 60); }}>
              {facing === "user" ? "Front" : "Back"} camera
            </button>
            <button className="btn" style={{ flex: 1, minWidth: 120 }} onClick={() => { setManual((m) => !m); setChosen(null); setHighlight(null); }}>
              {manual ? "របៀបស្វ័យប្រវត្តិ" : "របៀបដោយដៃ"}
            </button>
            <button className="btn" style={{ flex: 1, minWidth: 100 }} onClick={reset}>សម្អាត</button>
            {live && <button className="btn red" style={{ flex: 1, minWidth: 100 }} onClick={stop}>បិទ</button>}
          </div>
        </div>

        <div className="footplate">
          <span>ដំណើរការទាំងអស់នៅលើឧបករណ៍ · គ្មានអ្វីផ្ទុកឡើង ឬរក្សាទុកទេ</span>
          <span>
            {loadingModel ? "PREPARING DETECTOR…" : describeTier(tier ?? "none")}
          </span>
        </div>
      </div>
    </div>
  );
}
