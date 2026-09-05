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

type Box = { x: number; y: number; w: number; h: number; id: number };

const FORFEIT_SUGGESTIONS = [
  "drink 2 glasses",
  "tell an embarrassing story",
  "do 10 push-ups",
  "text your ex nothing at all. well done.",
  "speak only in questions for 5 minutes",
  "let the group pick your next song",
];

const SUSPENSE = [
  "SCANNING THE ROOM",
  "MEASURING GUILT",
  "CONSULTING THE ARCHIVE",
  "WEIGHING PAST BEHAVIOUR",
  "IGNORING YOUR PROTESTS",
  "CROSS-REFERENCING VIBES",
];

export default function SelectionChamber() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const detectorRef = useRef<any>(null);

  const [forfeit, setForfeit] = useState("drink 2 glasses");
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [live, setLive] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [autoOK, setAutoOK] = useState<boolean | null>(null);
  const [manual, setManual] = useState(false);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [marks, setMarks] = useState<Box[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [highlight, setHighlight] = useState<number | null>(null);
  const [chosen, setChosen] = useState<number | null>(null);
  const [status, setStatus] = useState("CHAMBER IDLE. NAME THE FORFEIT.");

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
          ? "Camera permission refused. The Ministry respects this and is disappointed."
          : name === "NotFoundError"
          ? "No camera found. Use manual mode: everyone taps their own face."
          : "Camera unavailable here. Manual mode still works.",
      );
      setManual(true);
    }
  }, [facing, stop]);

  useEffect(() => () => stop(), [stop]);

  /* ---------------- face detection, where the browser offers it ---------------- */
  useEffect(() => {
    const FD = (window as any).FaceDetector;
    if (!FD) { setAutoOK(false); return; }
    try {
      detectorRef.current = new FD({ fastMode: true, maxDetectedFaces: 12 });
      setAutoOK(true);
    } catch {
      setAutoOK(false);
    }
  }, []);

  useEffect(() => {
    if (!live || manual || !detectorRef.current || !videoRef.current) return;
    let alive = true;
    let last = 0;

    const loop = async (t: number) => {
      if (!alive) return;
      if (t - last > 220 && videoRef.current && videoRef.current.readyState >= 2) {
        last = t;
        try {
          const faces = await detectorRef.current.detect(videoRef.current);
          const vw = videoRef.current.videoWidth || 1;
          const vh = videoRef.current.videoHeight || 1;
          setBoxes(
            faces.map((f: any, i: number) => ({
              id: i,
              x: (f.boundingBox.x / vw) * 100,
              y: (f.boundingBox.y / vh) * 100,
              w: (f.boundingBox.width / vw) * 100,
              h: (f.boundingBox.height / vh) * 100,
            })),
          );
        } catch {
          /* a failed frame is not worth reporting; the next one usually works */
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { alive = false; if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [live, manual]);

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
      setStatus("NOBODY IS HERE. THE MINISTRY CANNOT PUNISH A VOID.");
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
        setStatus("THE MINISTRY HAS DECIDED.");
        fanfare();
        S.discover("chosen");
      }
    };
    step();
  };

  const reset = () => { setChosen(null); setHighlight(null); setMarks([]); setStatus("CHAMBER READY."); };

  return (
    <div className="wrap">
      <div className="machine">
        <span className="screw tl" /><span className="screw tr" />
        <span className="screw bl" /><span className="screw br" />

        <div className="plate">
          <div>
            <div className="mk">Department of Selection · Chamber 1</div>
            <h1>Who Is It Going To Be</h1>
          </div>
          <div className="cert">
            NOTHING LEAVES THIS DEVICE<br />
            no upload · no recording · no server<br />
            THE MINISTRY IS NOT INTERESTED IN YOUR FACE
          </div>
        </div>

        <div className="readout">
          <p className="rd-line">{status}</p>
          <p className="rd-sub">
            CANDIDATES: {candidates.length} · MODE: {manual ? "MANUAL" : autoOK ? "AUTOMATIC" : "MANUAL (NO DETECTOR)"}
          </p>
        </div>

        <div className="grid" style={{ marginBottom: 16 }}>
          <div className="cell" style={{ gridColumn: "span 12" }}>
            <span className="cap">The forfeit</span>
            <input
              className="field"
              value={forfeit}
              onChange={(e) => setForfeit(e.target.value)}
              placeholder="drink 2 glasses"
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
          style={{
            position: "relative", width: "100%", aspectRatio: "4 / 3",
            background: "#0d100c", borderRadius: 10, overflow: "hidden",
            border: "3px solid #2e332c", boxShadow: "inset 0 3px 18px rgba(0,0,0,.8)",
            cursor: manual && live ? "crosshair" : "default",
          }}
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
                {err ?? "The chamber needs to see the room. Your camera stays on this device — no upload, no recording, no server."}
              </div>
              <button className="btn amber big" onClick={start}>Open the chamber</button>
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
                    You
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
              EVERYONE TAP YOUR OWN FACE ON THE SCREEN
            </div>
          )}
        </div>

        {/* ------------- verdict ------------- */}
        {chosen !== null && (
          <div style={{
            marginTop: 16, padding: "18px 20px", background: "var(--amber)",
            border: "3px solid #241f0e", borderRadius: 10, textAlign: "center",
          }}>
            <div className="mk" style={{ color: "#241f0e" }}>By order of the Ministry</div>
            <div style={{
              fontSize: "clamp(20px,5vw,34px)", fontWeight: 700, textTransform: "uppercase",
              lineHeight: 1.05, marginTop: 6, color: "#241f0e",
            }}>
              The one in the box must {forfeit || "decide for themselves"}
            </div>
            <div className="mono" style={{ fontSize: 11, marginTop: 8, color: "#5c4a12" }}>
              APPEALS MAY BE SUBMITTED VIA FORM 27-B AND WILL NOT BE READ
            </div>
          </div>
        )}

        {/* ------------- controls ------------- */}
        <div className="grid" style={{ marginTop: 16 }}>
          <div className="cell" style={{ gridColumn: "span 12", flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            <button className="btn amber big" style={{ flex: 2, minWidth: 180 }} onClick={select} disabled={!live || spinning}>
              {spinning ? "Deciding…" : "Choose someone"}
            </button>
            <button className="btn" style={{ flex: 1, minWidth: 120 }} onClick={() => { setFacing((f) => (f === "user" ? "environment" : "user")); if (live) setTimeout(start, 60); }}>
              {facing === "user" ? "Front" : "Back"} camera
            </button>
            <button className="btn" style={{ flex: 1, minWidth: 120 }} onClick={() => { setManual((m) => !m); setChosen(null); setHighlight(null); }}>
              {manual ? "Auto mode" : "Manual mode"}
            </button>
            <button className="btn" style={{ flex: 1, minWidth: 100 }} onClick={reset}>Clear</button>
            {live && <button className="btn red" style={{ flex: 1, minWidth: 100 }} onClick={stop}>Close</button>}
          </div>
        </div>

        <div className="footplate">
          <span>ALL PROCESSING IS LOCAL · NOTHING IS UPLOADED OR STORED</span>
          <span>
            {autoOK === false ? "NO FACE DETECTOR IN THIS BROWSER — MANUAL MODE" : "DETECTOR AVAILABLE"}
          </span>
        </div>
      </div>
    </div>
  );
}
