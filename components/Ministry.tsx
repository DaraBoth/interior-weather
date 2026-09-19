"use client";

/**
 * The building itself: the room bar and full-screen menu, the bulletins that
 * discovery toast, and the secrets that can be triggered from any room
 * (Konami, typing SOUP, the console confession, the right-click menu).
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { pickBulletin } from "@/lib/bulletins";
import * as S from "@/lib/secrets";
import { chime, beep } from "@/lib/audio";

const ROOMS: { href: string; label: string; note: string }[] = [
  { href: "/",         label: "កន្លែងទទួលភ្ញៀវ", note: "ម៉ាស៊ីនអារម្មណ៍ និងប៊ូតុងក្រហម" },
  { href: "/bomb",     label: "គ្រាប់បែក",        note: "និយាយ បញ្ជូនបន្ត កុំឱ្យផ្ទុះដាក់ខ្លួន" },
  { href: "/wheel",    label: "កង់មូល",           note: "បង្វិល រួចទទួលយកផលវិបាក" },
  { href: "/paranoia", label: "ការសង្ស័យ",        note: "សំណួរខ្សឹប ចម្លើយឮៗ" },
  { href: "/freeze",   label: "កក",               note: "កុំកម្រើក កាមេរ៉ាកំពុងមើល" },
  { href: "/cards",    label: "ធំ ឬ តូច",         note: "ទាយបៀ ខុសគឺផឹក" },
  { href: "/pick",     label: "នរណាផឹក",          note: "បន្ទប់ជ្រើសរើសមនុស្សម្នាក់" },
  { href: "/mimic",    label: "ត្រាប់តាមសំឡេង",   note: "បញ្ចេញសំឡេង យើងឱ្យពិន្ទុ" },
  { href: "/drink",    label: "ច្បាប់",           note: "ច្បាប់ ការសារភាព និងការប្រកួត" },
  { href: "/fun",      label: "ល្បែង",            note: "ហ្គេមតូចៗគ្មានតម្លៃ" },
  { href: "/bored",    label: "ការរង់ចាំ",        note: "នាយកដ្ឋានរង់ចាំ" },
  { href: "/form",     label: "ទម្រង់ ២៧-ខ",      note: "ពាក្យសុំដាក់ពាក្យ" },
  { href: "/archive",  label: "បណ្ណសារ",          note: "ជាន់ទី -១ តម្រុយនៅទីនេះ" },
];

const KONAMI = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a",
];

export default function Ministry({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const here = ROOMS.find((r) => r.href === pathname);
  const [bulletin, setBulletin] = useState<string | null>(null);
  const [toast, setToast] = useState<{ title: string; sub: string } | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [open, setOpen] = useState(false);
  const konami = useRef<string[]>([]);
  const typed = useRef("");

  /* ---------------- discovery toast ---------------- */
  const announce = useCallback((id: S.SecretId) => {
    const s = S.SECRETS[id];
    if (!s) return;
    chime();
    setToast({ title: s.title, sub: `រកឃើញ ${S.found().length} ក្នុងចំណោម ??` });
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
    setOpen(false);
  }, [pathname]);

  /* ---------------- the menu is a screen, so treat it like one ----------------
     Escape closes it, and the room behind it stops scrolling while it is up.
     Without the scroll lock a phone scrolls the page under the overlay and the
     player comes back to a room they did not leave where they left it. */
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); beep(420, 0.05); }
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onEsc);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onEsc);
    };
  }, [open]);

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
        return "ម៉ាស៊ីនសារភាព៖ គ្មានកុងតាក់ណាមួយត្រូវបានភ្ជាប់ទេ។ វាសោកស្តាយ។ វាមិនសោកស្តាយទេ។";
      },
      secrets() {
        return `រកឃើញ ${S.found().length} ក្នុងចំណោម ??។ តម្រុយនៅក្នុងបណ្ណសារ ជាន់ទី -១។`;
      },
      reset() {
        S.resetEverything();
        return "ភ្លេចអស់ហើយ។ សូមផ្ទុកឡើងវិញ។";
      },
    };
    // eslint-disable-next-line no-console
    console.log(
      "%cក្រសួងផឹកភ្លាម",
      "background:#e8a317;color:#241f0e;font-weight:700;padding:4px 10px;font-size:13px",
    );
    // eslint-disable-next-line no-console
    console.log("%cមានគេបើកកុំព្យូទ័រចោល។ សាកល្បង៖ machine.confess()", "color:#7de88a;font-family:monospace");
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
      {/* In a room: one small button, so the game gets the screen. */}
      <nav className="roombar">
        <button
          type="button"
          className="menubtn"
          onClick={() => { setOpen(true); beep(560, 0.05); }}
          aria-label="បើកម៉ឺនុយ"
        >
          <span aria-hidden="true">☰</span> ម៉ឺនុយ
        </button>
        <span className="roomname">{here?.label ?? "ផឹកភ្លាម"}</span>
        <span className="floor">ជាន់ទី ១</span>
      </nav>

      {/* The whole building, as one screen you step out to. */}
      {open && (
        <div className="menuscreen" role="dialog" aria-modal="true" aria-label="ម៉ឺនុយ">
          <div className="menuhead">
            <div>
              <div className="mk">ក្រសួងផឹកភ្លាម</div>
              <h2>ជ្រើសរើសបន្ទប់</h2>
            </div>
            <button
              type="button"
              className="menuclose"
              onClick={() => { setOpen(false); beep(420, 0.05); }}
              aria-label="បិទ"
            >
              ✕
            </button>
          </div>

          <div className="menugrid">
            {ROOMS.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                className={`menucard${pathname === r.href ? " on" : ""}`}
                onClick={() => setOpen(false)}
              >
                <span className="menulabel">{r.label}</span>
                <span className="menunote">{r.note}</span>
              </Link>
            ))}
          </div>

          <p className="menufoot">ជណ្តើរយន្តខូច · សូមប្រើជណ្តើរ</p>
        </div>
      )}

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
            "ពិនិត្យ (បដិសេធ)",
            "ផ្ទុកឡើងវិញ (ធ្វើអី)",
            "រក្សាទុកទំព័រជា... (ទេ)",
            "សុំទោសម៉ាស៊ីន",
            "មើលប្រភពនៃការថប់បារម្ភ",
          ].map((t) => (
            <div key={t} style={{ padding: "7px 9px", borderRadius: 4, cursor: "pointer" }}>
              {t}
            </div>
          ))}
        </div>
      )}

      <div className={`bulletin${bulletin ? " up" : ""}`}>
        <span>{bulletin ?? ""}</span>
        <button onClick={() => setBulletin(null)}>ទទួលស្គាល់</button>
      </div>

      <div className={`toast${toast ? " up" : ""}`}>
        {toast ? (
          <>
            រកឃើញ៖ {toast.title}
            <small>{toast.sub}</small>
          </>
        ) : null}
      </div>
    </div>
  );
}
