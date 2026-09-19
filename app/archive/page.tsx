"use client";

/**
 * THE ARCHIVE — floor -1, last updated 1997 and coping.
 * Also the only place in the building that will admit hints exist.
 */

import { useEffect, useState } from "react";
import * as S from "@/lib/secrets";
import { beep, clunk } from "@/lib/audio";

const RETRO = {
  page: {
    background:
      "repeating-conic-gradient(#0b1a4a 0% 25%, #122a6b 0% 50%) 50% / 34px 34px",
    color: "#ffff66",
    fontFamily: "'Comic Sans MS','Comic Sans',cursive,system-ui",
    padding: "18px 14px 40px",
    borderRadius: 10,
    border: "4px ridge #c0c0c0",
  } as React.CSSProperties,
  box: {
    background: "#000080",
    border: "3px outset #c0c0c0",
    padding: "14px 16px",
    margin: "14px 0",
  } as React.CSSProperties,
};

export default function Archive() {
  const [visitors, setVisitors] = useState(0);
  const [guest, setGuest] = useState("");
  const [book, setBook] = useState<string[]>([]);
  const [hints, setHints] = useState<ReturnType<typeof S.availableHints>>([]);
  const [foundCount, setFoundCount] = useState(0);

  useEffect(() => {
    let n = 0;
    try {
      n = parseInt(localStorage.getItem("miw:visitors") || "0", 10) || 0;
      n += 1;
      localStorage.setItem("miw:visitors", String(n));
      const raw = localStorage.getItem("miw:guestbook");
      if (raw) setBook(JSON.parse(raw));
    } catch {}
    setVisitors(1996 + n);
    setHints(S.availableHints());
    setFoundCount(S.found().length);
  }, []);

  const sign = () => {
    const t = guest.trim();
    if (!t) return;
    const entry = `${t} woz ere — ${new Date().toLocaleDateString()}`;
    const next = [entry, ...book].slice(0, 12);
    setBook(next);
    setGuest("");
    try { localStorage.setItem("miw:guestbook", JSON.stringify(next)); } catch {}
    clunk();
    S.discover("guestbook");
    setHints(S.availableHints());
    setFoundCount(S.found().length);
  };

  return (
    <div className="wrap">
      <div style={RETRO.page}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            fontSize: "clamp(24px,6vw,44px)", fontWeight: 700, color: "#ff00ff",
            textShadow: "2px 2px 0 #00ffff, 4px 4px 0 #000",
          }}>
            ~*~ បណ្ណសារក្រសួង ~*~
          </div>
          <div style={{ color: "#00ff00", fontSize: 15, marginTop: 6 }}>
            &lt;&lt;&lt; FLOOR -1 &middot; LAST UPDATED 14 MARCH 1997 &gt;&gt;&gt;
          </div>
          <div style={{ marginTop: 10, fontSize: 26 }}>
            <span style={{ animation: "pulse 1s infinite alternate" }}>🚧</span>
            <span style={{ color: "#ffff00", fontSize: 15, margin: "0 10px" }}>កំពុងសាងសង់</span>
            <span style={{ animation: "pulse 1s infinite alternate" }}>🚧</span>
          </div>
        </div>

        <div style={RETRO.box}>
          <div style={{ overflow: "hidden", whiteSpace: "nowrap" }}>
            <div style={{
              display: "inline-block", paddingLeft: "100%",
              animation: "scroll 18s linear infinite", color: "#00ff00", fontSize: 16,
            }}>
              សូមស្វាគមន៍មកកាន់គេហទំព័ររបស់ខ្ញុំ !!! ★ មើលបានល្អបំផុតក្នុង NETSCAPE NAVIGATOR ទំហំ 800x600 ★ សូមចុះហត្ថលេខាក្នុងសៀវភៅភ្ញៀវ ★ គេហទំព័រនេះសរសេរដោយដៃដោយមោទនភាព ★
            </div>
          </div>
        </div>

        <div style={RETRO.box}>
          <div style={{ color: "#00ffff", fontSize: 17, marginBottom: 8 }}>◆ VISITOR COUNTER ◆</div>
          <div style={{
            display: "inline-block", background: "#000", color: "#0f0",
            fontFamily: "monospace", fontSize: 26, padding: "6px 12px", border: "2px inset #808080",
            letterSpacing: 5,
          }}>
            {String(visitors).padStart(7, "0")}
          </div>
          <div style={{ fontSize: 12, marginTop: 6, color: "#ccc" }}>
            អ្នកជាភ្ញៀវលេខ {visitors}។ ឧបករណ៍រាប់មិនដែលត្រូវកំណត់ឡើងវិញទេ ហើយនឹងមិនដែលដែរ។
          </div>
        </div>

        {/* the hints, which is why anyone comes down here */}
        <div style={RETRO.box}>
          <div style={{ color: "#ff00ff", fontSize: 17, marginBottom: 4 }}>◆ បញ្ជីរបស់របរ ◆</div>
          <div style={{ fontSize: 13, color: "#ccc", marginBottom: 10 }}>
            ក្រសួងបដិសេធថាអគារនេះមានអាថ៌កំបាំង។ តែមានគេសរសេរបញ្ជីនេះយ៉ាងណាក៏ដោយ។
            You have found <b style={{ color: "#0f0" }}>{foundCount}</b>. More clues appear as you find more.
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {hints.map((h) => (
              <div
                key={h.id}
                style={{
                  background: h.got ? "#004400" : "#001040",
                  border: `2px solid ${h.got ? "#00ff00" : "#334488"}`,
                  padding: "8px 10px", fontSize: 13,
                  color: h.got ? "#00ff00" : "#8899cc",
                }}
              >
                <b>{h.got ? "★ " : "☆ "}{h.title}</b>
                <div style={{ fontSize: 12, marginTop: 2 }}>{h.hint}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={RETRO.box}>
          <div style={{ color: "#00ffff", fontSize: 17, marginBottom: 8 }}>◆ ចុះហត្ថលេខាក្នុងសៀវភៅភ្ញៀវ ◆</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              value={guest}
              onChange={(e) => setGuest(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") sign(); }}
              placeholder="ឈ្មោះរបស់អ្នកនៅទីនេះ"
              maxLength={28}
              style={{
                flex: 1, minWidth: 160, padding: "8px 10px", fontFamily: "inherit",
                fontSize: 16, border: "2px inset #808080", background: "#fff", color: "#000",
                userSelect: "text",
              }}
            />
            <button
              onClick={sign}
              style={{
                padding: "8px 16px", fontFamily: "inherit", fontSize: 14, cursor: "pointer",
                border: "3px outset #c0c0c0", background: "#c0c0c0", color: "#000",
              }}
            >
              SIGN IT
            </button>
          </div>
          <div style={{ marginTop: 10, display: "grid", gap: 4 }}>
            {book.length === 0 && <div style={{ fontSize: 13, color: "#ccc" }}>មិនទាន់មានធាតុណាទេ :(</div>}
            {book.map((b, i) => (
              <div key={i} style={{ fontSize: 13, color: "#ffff66" }}>» {b}</div>
            ))}
          </div>
        </div>

        <div style={{ ...RETRO.box, textAlign: "center" }}>
          <div style={{ color: "#00ff00", fontSize: 14 }}>
            [ <a href="/" style={{ color: "#00ffff", textDecoration: "underline" }}>ទំព័រដើម</a> ]
            [ <a href="/bored" style={{ color: "#00ffff", textDecoration: "underline" }}>តំណភ្ជាប់</a> ]
            [ <a href="/form" style={{ color: "#00ffff", textDecoration: "underline" }}>ទំនាក់ទំនង</a> ]
            [ <span
                onClick={() => { beep(300, 0.4, "sawtooth"); }}
                style={{ color: "#ff00ff", textDecoration: "underline", cursor: "pointer" }}
              >បើកតន្ត្រី</span> ]
          </div>
          <div style={{ fontSize: 12, color: "#888", marginTop: 10 }}>
            ទំព័រនេះជាសមាជិកនៃ WebRing ផឹកភ្លាម។
            <br />« prev &nbsp; random &nbsp; next »
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-100%); } }
      `}</style>
    </div>
  );
}
