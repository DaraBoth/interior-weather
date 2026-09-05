"use client";

/**
 * THE BASEMENT — not in the corridor nav. You get here by being told,
 * by the machine, while holding the red button down for three seconds.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import * as S from "@/lib/secrets";
import { beep } from "@/lib/audio";

const CONFESSIONS = [
  "The switches were never connected. You knew that.",
  "There is no Model 1 through 6.",
  "The integrity meter is decorative. Nothing has ever been structurally sound.",
  "The Department of Waiting has one employee. It is the progress bar.",
  "Form 27-C genuinely does not exist. People still ask.",
  "The visitor counter starts at 1996 because it seemed funnier than starting at 0.",
  "Nobody has ever reached the fourth floor because there isn't one.",
  "The machine does not know how you are feeling. It never did.",
  "Every diagnosis is random. Some of them were still correct.",
  "This room was not supposed to be findable.",
];

export default function Basement() {
  const [i, setI] = useState(0);
  const [lightsOn, setLightsOn] = useState(false);
  const [secretCount, setSecretCount] = useState(0);

  useEffect(() => {
    S.discover("basement");
    setSecretCount(S.found().length);
    const t = setTimeout(() => setLightsOn(true), 900);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const iv = setInterval(() => setI((n) => (n + 1) % CONFESSIONS.length), 5200);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="wrap">
      <div
        style={{
          background: "#0b0d0a",
          border: "3px solid #1d211b",
          borderRadius: 14,
          padding: "44px 26px 40px",
          minHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: 22,
          opacity: lightsOn ? 1 : 0.25,
          transition: "opacity 1.4s ease",
        }}
      >
        <div className="mono" style={{ fontSize: 11, letterSpacing: ".28em", color: "#3f7a47" }}>
          FLOOR −2 · NOT ON ANY BUTTON
        </div>

        <div
          style={{
            fontFamily: "var(--f-read)",
            fontWeight: 700,
            fontSize: "clamp(16px,3.6vw,26px)",
            lineHeight: 1.7,
            color: "#7de88a",
            textShadow: "0 0 22px rgba(125,232,138,.35)",
            maxWidth: 620,
            minHeight: "5em",
          }}
        >
          {CONFESSIONS[i]}
        </div>

        <div className="mono" style={{ fontSize: 11, color: "#2f5c36" }}>
          CONFESSION {i + 1} OF {CONFESSIONS.length} · THE MACHINE IS ALONE DOWN HERE
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          <button
            className="btn"
            onClick={() => { setI((n) => (n + 1) % CONFESSIONS.length); beep(280, 0.16, "sine"); }}
          >
            Go on
          </button>
          <Link href="/" className="btn amber" style={{ display: "inline-block" }}>
            Back upstairs
          </Link>
        </div>

        <div className="mono" style={{ fontSize: 10.5, color: "#2a4d30", marginTop: 8, maxWidth: 460, lineHeight: 1.7 }}>
          You found {secretCount} things. The Ministry will not tell you how many there are,
          because then you would stop looking.
        </div>
      </div>
    </div>
  );
}
