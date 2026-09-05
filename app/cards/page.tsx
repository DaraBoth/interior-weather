"use client";

/**
 * HIGHER OR LOWER — Bureau of Probability, Window 3.
 *
 * Cards are dealt WITHOUT replacement from a real 52-card shoe, and the exact
 * odds are printed above the buttons. That turns a coin-flip into an actual
 * decision: late in the shoe, someone paying attention will beat someone who is
 * not, which is the whole reason to keep playing.
 *
 * A tie is not a loss and not a win. Everyone drinks. The Ministry likes ties.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as S from "@/lib/secrets";
import { beep, clunk, fanfare, raspberry, trombone } from "@/lib/audio";
import { verdict, burst } from "@/lib/celebrate";

type Suit = "S" | "H" | "D" | "C";
type Card = { rank: number; suit: Suit };

const SUIT_GLYPH: Record<Suit, string> = { S: "♠", H: "♥", D: "♦", C: "♣" };
const RANK_LABEL: Record<number, string> = {
  11: "J", 12: "Q", 13: "K", 14: "A",
};
const label = (r: number) => RANK_LABEL[r] ?? String(r);
const isRed = (s: Suit) => s === "H" || s === "D";

function freshDeck(): Card[] {
  const d: Card[] = [];
  (["S", "H", "D", "C"] as Suit[]).forEach((suit) => {
    for (let r = 2; r <= 14; r++) d.push({ rank: r, suit });
  });
  // Fisher-Yates, so the shuffle is actually uniform
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

const SMUG = [
  "The Bureau had calculated this.",
  "A predictable outcome, statistically.",
  "The cards are not personal. They are simply correct.",
  "This has been filed.",
  "The Bureau is not surprised.",
  "Probability remains undefeated.",
];

export default function Cards() {
  const [deck, setDeck] = useState<Card[]>([]);
  const [current, setCurrent] = useState<Card | null>(null);
  const [next, setNext] = useState<Card | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [busy, setBusy] = useState(false);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [status, setStatus] = useState("PLACE A GUESS. THE BUREAU IS WATCHING.");
  const [sub, setSub] = useState("HIGHER OR LOWER · TIES ARE EVERYBODY'S PROBLEM");
  const cardRef = useRef<HTMLDivElement | null>(null);

  /* ---------------- shoe ---------------- */
  const newShoe = useCallback((quiet = false) => {
    const d = freshDeck();
    const first = d.pop()!;
    setDeck(d);
    setCurrent(first);
    setNext(null);
    setFlipped(false);
    if (!quiet) {
      setStatus("FRESH SHOE. FIFTY-ONE CARDS REMAIN.");
      setSub("THE BUREAU HAS RESET THE ODDS IN YOUR FAVOUR. BRIEFLY.");
      clunk();
    }
  }, []);

  useEffect(() => {
    newShoe(true);
    try { setBest(parseInt(localStorage.getItem("miw:cardstreak") || "0", 10) || 0); } catch {}
  }, [newShoe]);

  /* ---------------- the printed odds ---------------- */
  const odds = useMemo(() => {
    if (!current || deck.length === 0) return null;
    let hi = 0, lo = 0, eq = 0;
    for (const c of deck) {
      if (c.rank > current.rank) hi++;
      else if (c.rank < current.rank) lo++;
      else eq++;
    }
    return { hi, lo, eq, total: deck.length };
  }, [current, deck]);

  /* ---------------- a guess ---------------- */
  const guess = (dir: "higher" | "lower") => {
    if (busy || !current || deck.length === 0) return;
    setBusy(true);
    beep(700, 0.06);

    const d = [...deck];
    const drawn = d.pop()!;
    setNext(drawn);
    setFlipped(true);

    window.setTimeout(() => {
      const won = dir === "higher" ? drawn.rank > current.rank : drawn.rank < current.rank;
      const tie = drawn.rank === current.rank;

      if (tie) {
        setStatus("A TIE. EVERYBODY DRINKS.");
        setSub("THE BUREAU CONSIDERS THIS THE BEST POSSIBLE OUTCOME.");
        trombone();
        verdict("Everybody", "a tie. the bureau is delighted.", "#e8a317");
      } else if (won) {
        const s = streak + 1;
        setStreak(s);
        if (s > best) {
          setBest(s);
          try { localStorage.setItem("miw:cardstreak", String(s)); } catch {}
        }
        if (s === 7) S.discover("cardsharp");
        setStatus(`CORRECT. STREAK OF ${s}.`);
        setSub("HAND OUT ONE DRINK. THE BUREAU PERMITS IT.");
        beep(880, 0.09, "triangle");
        if (s % 5 === 0) {
          fanfare();
          verdict(`Streak ${s}`, "the bureau is reluctantly impressed", "#4c9a56");
        } else if (cardRef.current) {
          const r = cardRef.current.getBoundingClientRect();
          burst(r.left + r.width / 2, r.top + r.height / 2, 26);
        }
      } else {
        setStatus("WRONG. DRINK.");
        setSub(SMUG[Math.floor(Math.random() * SMUG.length)]);
        raspberry();
        verdict("Drink", `you said ${dir}`, "#c8342b");
        setStreak(0);
      }

      // the drawn card becomes the new face-up card
      window.setTimeout(() => {
        setCurrent(drawn);
        setFlipped(false);
        setDeck(d);
        setBusy(false);
        if (d.length === 0) {
          setStatus("THE SHOE IS EMPTY. THAT IS ALL FIFTY-TWO.");
          setSub("DEAL A FRESH SHOE TO CONTINUE.");
        }
        // only clear the back face once the card has finished turning back
        window.setTimeout(() => setNext(null), 640);
      }, 900);
    }, 620);
  };

  return (
    <div className="wrap">
      <div className="machine">
        <span className="screw tl" /><span className="screw tr" />
        <span className="screw bl" /><span className="screw br" />

        <div className="plate">
          <div>
            <div className="mk">Bureau of Probability · Window 3</div>
            <h1>Higher Or Lower</h1>
          </div>
          <div className="cert">
            DEALT WITHOUT REPLACEMENT<br />
            THE ODDS ARE PRINTED. USE THEM.<br />
            STREAK {String(streak).padStart(2, "0")} · BEST {String(best).padStart(2, "0")}
          </div>
        </div>

        <div className="readout">
          <p className="rd-line">{status}</p>
          <p className="rd-sub">{sub}</p>
        </div>

        {/* ---------------- the card ---------------- */}
        <div style={{ display: "flex", justifyContent: "center", perspective: "1200px" }}>
          <div
            ref={cardRef}
            style={{
              width: "min(58vw, 220px)", aspectRatio: "5 / 7",
              position: "relative", transformStyle: "preserve-3d",
              transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
              transition: "transform .62s cubic-bezier(.3,1.1,.4,1)",
            }}
          >
            {/* face up */}
            <CardFace card={current} hidden={false} />
            {/* the card being turned over */}
            <div style={{ position: "absolute", inset: 0, transform: "rotateY(180deg)", backfaceVisibility: "hidden" }}>
              <CardFace card={next} hidden={false} />
            </div>
          </div>
        </div>

        {odds && (
          <div className="tiny" style={{ textAlign: "center", marginTop: 14 }}>
            OF {odds.total} CARDS LEFT: {odds.hi} HIGHER · {odds.lo} LOWER · {odds.eq} EQUAL
          </div>
        )}

        <div className="grid" style={{ marginTop: 14 }}>
          <div className="cell s6">
            <button
              className="btn wide big"
              style={{ minHeight: 84, fontSize: 20 }}
              onClick={() => guess("lower")}
              disabled={busy || deck.length === 0}
            >
              ▼ Lower
            </button>
            {odds && (
              <div className="tiny" style={{ textAlign: "center" }}>
                {odds.total ? Math.round((odds.lo / odds.total) * 100) : 0}% chance
              </div>
            )}
          </div>
          <div className="cell s6">
            <button
              className="btn amber wide big"
              style={{ minHeight: 84, fontSize: 20 }}
              onClick={() => guess("higher")}
              disabled={busy || deck.length === 0}
            >
              ▲ Higher
            </button>
            {odds && (
              <div className="tiny" style={{ textAlign: "center" }}>
                {odds.total ? Math.round((odds.hi / odds.total) * 100) : 0}% chance
              </div>
            )}
          </div>

          <div className="cell s12" style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
            <button
              className="btn"
              style={{ flex: 1, minWidth: 150 }}
              onClick={() => { newShoe(); setStreak(0); }}
              disabled={busy}
            >
              Fresh shoe
            </button>
            <span className="cap" style={{ flex: 2, minWidth: 160 }}>
              Wrong guess and you drink. A tie and everyone does. Pass the phone after each turn.
            </span>
          </div>
        </div>

        <div className="footplate">
          <span>ACE IS HIGH · THE SHOE IS NEVER RESHUFFLED MID-GAME</span>
          <span>WINDOW 3</span>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- card face */
function CardFace({ card, hidden }: { card: Card | null; hidden: boolean }) {
  if (!card || hidden) {
    return (
      <div style={{
        position: "absolute", inset: 0, borderRadius: 12, backfaceVisibility: "hidden",
        background: "repeating-linear-gradient(45deg,#4a4e4a 0 9px,#3a3e3a 9px 18px)",
        border: "3px solid #2e332c", boxShadow: "0 10px 26px rgba(0,0,0,.5)",
      }} />
    );
  }
  const red = isRed(card.suit);
  const tone = red ? "#c8342b" : "#1b1d18";
  return (
    <div style={{
      position: "absolute", inset: 0, borderRadius: 12, backfaceVisibility: "hidden",
      background: "linear-gradient(160deg,#fbf9f2,#ece7d8)",
      border: "3px solid #2e332c", boxShadow: "0 10px 26px rgba(0,0,0,.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <span style={{
        position: "absolute", top: 8, left: 11, fontFamily: "var(--f-label)",
        fontWeight: 700, fontSize: 20, color: tone, lineHeight: 1,
      }}>
        {label(card.rank)}<br />{SUIT_GLYPH[card.suit]}
      </span>
      <span style={{ fontSize: "clamp(46px,13vw,86px)", color: tone, lineHeight: 1 }}>
        {SUIT_GLYPH[card.suit]}
      </span>
      <span style={{
        position: "absolute", bottom: 8, right: 11, fontFamily: "var(--f-label)",
        fontWeight: 700, fontSize: 20, color: tone, lineHeight: 1,
        transform: "rotate(180deg)", textAlign: "center",
      }}>
        {label(card.rank)}<br />{SUIT_GLYPH[card.suit]}
      </span>
    </div>
  );
}
