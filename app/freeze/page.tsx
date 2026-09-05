"use client";

/**
 * FREEZE — the one that earns the camera.
 *
 * Everyone poses. The Ministry counts down, then measures how much each detected
 * face drifts over the hold. The one that moved most loses. If detection is not
 * available it falls back to picking at random after the same theatre, so the
 * game never simply refuses to run.
 *
 * Nothing is uploaded and no frame is retained. Only box coordinates are compared,
 * and they are discarded when the round ends.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { getDetector, describeTier, type Tier, type FaceBox } from "@/lib/faces";
import { FREEZE_TAUNTS } from "@/lib/games";
import { alarm, beep, fanfare, tick, trombone } from "@/lib/audio";

type Phase = "idle" | "countdown" | "holding" | "result";

export default function Freeze() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detRef = useRef<Awaited<ReturnType<typeof getDetector>> | null>(null);
  const rafRef = useRef<number | null>(null);
  const samples = useRef<Map<number, { first: FaceBox; drift: number; last: FaceBox }>>(new Map());

  const [tier, setTier] = useState<Tier | null>(null);
  const [live, setLive] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [count, setCount] = useState(3);
  const [boxes, setBoxes] = useState<(FaceBox & { id: number })[]>([]);
  const [loser, setLoser] = useState<number | null>(null);
  const [taunt, setTaunt] = useState("");
  const [status, setStatus] = useState("EVERYONE GET IN FRAME.");

  /* ---------------- detector ---------------- */
  useEffect(() => {
    let alive = true;
    getDetector().then((d) => {
      if (!alive) return;
      detRef.current = d;
      setTier(d.tier);
    });
    return () => { alive = false; };
  }, []);

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
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = s;
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play().catch(() => {});
      }
      setLive(true);
      setStatus("EVERYONE GET IN FRAME, THEN HOLD STILL.");
      beep(700, 0.1);
    } catch (e: any) {
      setErr(
        e?.name === "NotAllowedError"
          ? "Camera refused. Freeze needs to see you, so this one cannot run without it."
          : "No camera available here.",
      );
    }
  }, []);

  useEffect(() => () => stop(), [stop]);

  /* ---------------- live boxes ---------------- */
  useEffect(() => {
    const det = detRef.current;
    if (!live || !det || det.tier === "none") return;
    let alive = true;
    let last = 0;

    const loop = async (t: number) => {
      if (!alive) return;
      const v = videoRef.current;
      if (t - last > 160 && v && v.readyState >= 2) {
        last = t;
        try {
          const faces = await det.detect(v);
          if (!alive) return;
          const withIds = faces.map((f, i) => ({ ...f, id: i }));
          setBoxes(withIds);

          // during the hold, accumulate how far each face has drifted
          if (phase === "holding") {
            withIds.forEach((f) => {
              const prev = samples.current.get(f.id);
              if (!prev) {
                samples.current.set(f.id, { first: f, last: f, drift: 0 });
              } else {
                const dx = f.x - prev.last.x;
                const dy = f.y - prev.last.y;
                const dw = f.w - prev.last.w;
                samples.current.set(f.id, {
                  first: prev.first,
                  last: f,
                  drift: prev.drift + Math.hypot(dx, dy) + Math.abs(dw) * 0.5,
                });
              }
            });
          }
        } catch { /* a dropped frame is fine */ }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { alive = false; if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [live, tier, phase]);

  /* ---------------- the round ---------------- */
  const begin = () => {
    if (!live) return;
    samples.current.clear();
    setLoser(null);
    setPhase("countdown");
    setCount(3);
    setStatus("GET READY…");

    let n = 3;
    const step = () => {
      setCount(n);
      tick();
      n--;
      if (n >= 0) setTimeout(step, 800);
      else {
        setPhase("holding");
        setStatus("FREEZE. DO NOT MOVE.");
        alarm();
        setTimeout(finish, 4200);
      }
    };
    step();
  };

  const finish = () => {
    setPhase("result");
    const entries = [...samples.current.entries()];
    if (entries.length === 0) {
      // no detection, or nobody in frame: fall back to theatre and a coin
      setStatus("THE MINISTRY COULD NOT SEE ANYONE. IT HAS DECIDED ANYWAY.");
      setLoser(-1);
      trombone();
      return;
    }
    entries.sort((a, b) => b[1].drift - a[1].drift);
    const worst = entries[0][0];
    setLoser(worst);
    setTaunt(FREEZE_TAUNTS[Math.floor(Math.random() * FREEZE_TAUNTS.length)]);
    setStatus("THE MINISTRY SAW EVERYTHING.");
    fanfare();
  };

  return (
    <div className="wrap">
      <div className="machine">
        <span className="screw tl" /><span className="screw tr" />
        <span className="screw bl" /><span className="screw br" />

        <div className="plate">
          <div>
            <div className="mk">Bureau of Stillness · Observation 1</div>
            <h1>Freeze</h1>
          </div>
          <div className="cert">
            NOTHING LEAVES THIS DEVICE<br />
            only box positions are compared<br />
            NO FRAME IS EVER KEPT
          </div>
        </div>

        <div className="readout">
          <p className="rd-line">
            {phase === "countdown" ? `HOLD STILL IN ${count}…` : status}
          </p>
          <p className="rd-sub">
            FACES SEEN: {boxes.length} · {tier ? describeTier(tier) : "PREPARING DETECTOR…"}
          </p>
        </div>

        <div className="viewport">
          <video
            ref={videoRef}
            playsInline
            muted
            style={{
              width: "100%", height: "100%", objectFit: "cover",
              transform: "scaleX(-1)", display: live ? "block" : "none",
            }}
          />

          {!live && (
            <div style={{
              position: "absolute", inset: 0, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 14, padding: 20, textAlign: "center",
            }}>
              <div className="mono" style={{ color: "#7de88a", fontSize: 13, maxWidth: 420, lineHeight: 1.7 }}>
                {err ?? "Everyone poses. Whoever moves most during the freeze loses. Only box positions are compared, and nothing is uploaded or kept."}
              </div>
              <button className="btn amber big" onClick={start}>Open the camera</button>
            </div>
          )}

          {live && boxes.map((b) => {
            const isLoser = phase === "result" && loser === b.id;
            return (
              <div
                key={b.id}
                style={{
                  position: "absolute",
                  left: `${100 - b.x - b.w}%`, top: `${b.y}%`,
                  width: `${b.w}%`, height: `${b.h}%`,
                  border: `3px solid ${isLoser ? "#c8342b" : phase === "holding" ? "#7de88a" : "rgba(255,255,255,.55)"}`,
                  borderRadius: 8,
                  boxShadow: isLoser ? "0 0 0 5px rgba(200,52,43,.35), 0 0 40px rgba(200,52,43,.7)" : "none",
                  transition: "border-color .1s",
                  pointerEvents: "none",
                }}
              >
                {isLoser && (
                  <div style={{
                    position: "absolute", left: "50%", top: -32, transform: "translateX(-50%)",
                    background: "#c8342b", color: "#fff", fontFamily: "var(--f-label)",
                    fontWeight: 700, fontSize: 12.5, letterSpacing: ".1em", padding: "5px 11px",
                    borderRadius: 5, whiteSpace: "nowrap", textTransform: "uppercase",
                  }}>
                    {taunt}
                  </div>
                )}
              </div>
            );
          })}

          {phase === "countdown" && (
            <div style={{
              position: "absolute", inset: 0, display: "flex", alignItems: "center",
              justifyContent: "center", fontFamily: "var(--f-label)", fontWeight: 700,
              fontSize: "min(34vw, 200px)", color: "rgba(255,255,255,.85)",
              textShadow: "0 6px 40px rgba(0,0,0,.8)", pointerEvents: "none",
            }}>
              {count > 0 ? count : "FREEZE"}
            </div>
          )}
        </div>

        {phase === "result" && loser === -1 && (
          <div style={{
            marginTop: 14, padding: "16px 18px", background: "var(--amber)",
            border: "3px solid #241f0e", borderRadius: 10, textAlign: "center",
            color: "#241f0e", fontFamily: "var(--f-label)", fontWeight: 700,
            fontSize: "clamp(16px,4vw,26px)", textTransform: "uppercase",
          }}>
            Nobody was visible. Everybody drinks.
          </div>
        )}

        <div className="grid" style={{ marginTop: 14 }}>
          <div className="cell s12" style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            <button
              className="btn amber big"
              style={{ flex: 2, minWidth: 180 }}
              onClick={begin}
              disabled={!live || phase === "countdown" || phase === "holding"}
            >
              {phase === "holding" ? "Hold still…" : phase === "countdown" ? "Get ready…" : "Start a round"}
            </button>
            {live && (
              <button className="btn red" style={{ flex: 1, minWidth: 120 }} onClick={stop}>
                Close camera
              </button>
            )}
          </div>
        </div>

        <div className="footplate">
          <span>THE HOLD LASTS FOUR SECONDS · BLINKING IS PERMITTED, BARELY</span>
          <span>OBSERVATION 1</span>
        </div>
      </div>
    </div>
  );
}
