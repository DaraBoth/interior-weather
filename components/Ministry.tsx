"use client";

/**
 * The building itself: corridor nav, the bulletins that interrupt you, the
 * discovery toast, and the secrets that can be triggered from any room
 * (Konami, typing SOUP, the console confession, the right-click menu).
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { pickBulletin } from "@/lib/bulletins";
import * as S from "@/lib/secrets";
import { chime, beep } from "@/lib/audio";

const ROOMS: { href: string; label: string }[] = [
  { href: "/", label: "Lobby" },
  { href: "/bomb", label: "Bomb" },
  { href: "/wheel", label: "Wheel" },
  { href: "/paranoia", label: "Paranoia" },
  { href: "/freeze", label: "Freeze" },
  { href: "/pick", label: "Who Drinks" },
  { href: "/drink", label: "Rules" },
  { href: "/fun", label: "Arcade" },
  { href: "/bored", label: "Waiting" },
  { href: "/form", label: "Form 27-B" },
  { href: "/archive", label: "Archive" },
];

const KONAMI = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a",
];

export default function Ministry({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [bulletin, setBulletin] = useState<string | null>(null);
  const [toast, setToast] = useState<{ title: string; sub: string } | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const konami = useRef<string[]>([]);
  const typed = useRef("");

  /* ---------------- discovery toast ---------------- */
  const announce = useCallback((id: S.SecretId) => {
    const s = S.SECRETS[id];
    if (!s) return;
    chime();
    setToast({ title: s.title, sub: `DISCOVERY ${S.found().length} OF ??` });
    setTimeout(() => setToast(null), 4200);
  }, []);

  useEffect(() => {
    const un = S.subscribe((_list, just) => {
      if (just) announce(just);
    });
    return () => { un(); };
  }, [announce]);

  /* ---------------- room tracking + time secrets ---------------- */
  useEffect(() => {
    S.recordVisit(pathname);
    S.checkTimeSecrets();
  }, [pathname]);

  /* ---------------- bulletins ---------------- */
  useEffect(() => {
    let alive = true;
    const schedule = () => {
      // somewhere between 45 and 110 seconds, so it never feels metronomic
      const wait = 45000 + Math.random() * 65000;
      return setTimeout(() => {
        if (!alive) return;
        setBulletin(pickBulletin());
        beep(660, 0.06);
        setTimeout(() => alive && setBulletin(null), 9000);
        timer = schedule();
      }, wait);
    };
    let timer = schedule();
    return () => { alive = false; clearTimeout(timer); };
  }, []);

  /* ---------------- keyboard secrets ---------------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA");

      // Konami
      konami.current.push(e.key);
      if (konami.current.length > KONAMI.length) konami.current.shift();
      if (KONAMI.every((k, i) => konami.current[i]?.toLowerCase() === k.toLowerCase())) {
        S.discover("konami");
        konami.current = [];
      }

      // typing a word out loud, anywhere
      if (!typing && e.key.length === 1) {
        typed.current = (typed.current + e.key).toLowerCase().slice(-12);
        if (typed.current.includes("soup")) { S.discover("soup"); typed.current = ""; }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ---------------- the console knows a command ---------------- */
  useEffect(() => {
    const w = window as unknown as Record<string, unknown>;
    w.machine = {
      confess() {
        S.discover("confess");
        return "The machine confesses: none of the switches are connected. It is sorry. It is not sorry.";
      },
      secrets() {
        return `${S.found().length} found of ??. Hints are in the Archive, floor -1.`;
      },
      reset() {
        S.resetEverything();
        return "Everything forgotten. Reload.";
      },
    };
    // eslint-disable-next-line no-console
    console.log(
      "%cMINISTRY OF INTERIOR WEATHER",
      "background:#e8a317;color:#241f0e;font-weight:700;padding:4px 10px;font-size:13px",
    );
    // eslint-disable-next-line no-console
    console.log("%cSomeone has left a terminal open. Try: machine.confess()", "color:#7de88a;font-family:monospace");
    return () => { delete w.machine; };
  }, []);

  /* ---------------- unauthorised right-click menu ---------------- */
  useEffect(() => {
    const onCtx = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      e.preventDefault();
      S.discover("rightclick");
      setMenu({ x: Math.min(e.clientX, window.innerWidth - 210), y: e.clientY });
    };
    const close = () => setMenu(null);
    window.addEventListener("contextmenu", onCtx);
    window.addEventListener("click", close);
    return () => {
      window.removeEventListener("contextmenu", onCtx);
      window.removeEventListener("click", close);
    };
  }, []);

  return (
    <div className="shell">
      <nav className="corridor">
        {ROOMS.map((r) => (
          <Link key={r.href} href={r.href} className={pathname === r.href ? "on" : ""}>
            {r.label}
          </Link>
        ))}
        <span className="floor">FLOOR 1 &middot; LIFT OUT OF ORDER</span>
      </nav>

      {children}

      {menu && (
        <div
          style={{
            position: "fixed", left: menu.x, top: menu.y, zIndex: 90,
            background: "#2f322c", border: "1px solid #575c53", borderRadius: 6,
            padding: 6, width: 200, boxShadow: "0 10px 30px rgba(0,0,0,.6)",
            fontFamily: "var(--f-read)", fontSize: 12, color: "#c9c2ae",
          }}
        >
          {[
            "Inspect (denied)",
            "Reload (why)",
            "Save Page As... (no)",
            "Apologise to the machine",
            "View Source of Anxiety",
          ].map((t) => (
            <div key={t} style={{ padding: "7px 9px", borderRadius: 4, cursor: "pointer" }}>
              {t}
            </div>
          ))}
        </div>
      )}

      <div className={`bulletin${bulletin ? " up" : ""}`}>
        <span>{bulletin ?? ""}</span>
        <button onClick={() => setBulletin(null)}>Noted</button>
      </div>

      <div className={`toast${toast ? " up" : ""}`}>
        {toast ? (
          <>
            DISCOVERED: {toast.title}
            <small>{toast.sub}</small>
          </>
        ) : null}
      </div>
    </div>
  );
}
