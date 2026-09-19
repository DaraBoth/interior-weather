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
  "កុងតាក់ទាំងនោះមិនដែលត្រូវបានភ្ជាប់ទេ។ អ្នកដឹងរឿងនោះហើយ។",
  "គ្មានម៉ូដែល ១ ដល់ ៦ ទេ។",
  "ឧបករណ៍វាស់ភាពរឹងមាំគ្រាន់តែសម្រាប់តុបតែង។ គ្មានអ្វីធ្លាប់រឹងមាំតាមរចនាសម្ព័ន្ធទេ។",
  "នាយកដ្ឋានរង់ចាំមានបុគ្គលិកតែម្នាក់។ គឺរបារវឌ្ឍនភាពនោះឯង។",
  "ទម្រង់ ២៧-គ មិនមានពិតប្រាកដទេ។ មនុស្សនៅតែសួររក។",
  "ឧបករណ៍រាប់ភ្ញៀវចាប់ផ្តើមពី ១៩៩៦ ព្រោះវាមើលទៅគួរឱ្យអស់សំណើចជាងចាប់ផ្តើមពីលេខ ០។",
  "គ្មាននរណាធ្លាប់ទៅដល់ជាន់ទីបួនទេ ព្រោះវាមិនមាន។",
  "ម៉ាស៊ីនមិនដឹងថាអ្នកមានអារម្មណ៍យ៉ាងណាទេ។ វាមិនដែលដឹង។",
  "រាល់រោគវិនិច្ឆ័យគឺចៃដន្យទាំងអស់។ ប៉ុន្តែខ្លះនៅតែត្រូវ។",
  "បន្ទប់នេះមិនគួរត្រូវបានរកឃើញទេ។",
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
          ជាន់ទី −២ · មិនមាននៅលើប៊ូតុងណាទេ
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
          ការសារភាពទី {i + 1} ក្នុងចំណោម {CONFESSIONS.length} · ម៉ាស៊ីននៅម្នាក់ឯងនៅខាងក្រោមនេះ
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          <button
            className="btn"
            onClick={() => { setI((n) => (n + 1) % CONFESSIONS.length); beep(280, 0.16, "sine"); }}
          >
            បន្តទៅ
          </button>
          <Link href="/" className="btn amber" style={{ display: "inline-block" }}>
            ត្រឡប់ឡើងលើវិញ
          </Link>
        </div>

        <div className="mono" style={{ fontSize: 10.5, color: "#2a4d30", marginTop: 8, maxWidth: 460, lineHeight: 1.7 }}>
          អ្នករកឃើញ {secretCount} របស់។ ក្រសួងនឹងមិនប្រាប់អ្នកថាមានប៉ុន្មានទេ
          ព្រោះបើប្រាប់ អ្នកនឹងឈប់រក។
        </div>
      </div>
    </div>
  );
}
