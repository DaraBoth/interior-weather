"use client";

/**
 * Registers the service worker and says so once, in the building's own voice.
 *
 * The notice appears only the first time a device finishes caching, because a
 * party tool that nags about its own infrastructure is worse than one that says
 * nothing at all.
 */

import { useEffect, useState } from "react";

const SEEN = "miw:offline-notice";

export default function OfflineReady() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    let cancelled = false;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");

        // already controlling this page: nothing new to announce
        if (navigator.serviceWorker.controller) return;

        const worker = reg.installing ?? reg.waiting;
        if (!worker) return;

        worker.addEventListener("statechange", () => {
          if (worker.state !== "activated" || cancelled) return;
          try {
            if (localStorage.getItem(SEEN)) return;
            localStorage.setItem(SEEN, "1");
          } catch {
            /* a private window simply sees it every time */
          }
          setReady(true);
          setTimeout(() => setReady(false), 6000);
        });
      } catch {
        /* no service worker is not a failure worth showing anyone */
      }
    };

    // registering after load keeps the worker off the critical path
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) return null;

  return (
    <div
      role="status"
      style={{
        position: "fixed",
        left: "50%",
        bottom: 18,
        transform: "translateX(-50%)",
        zIndex: 94,
        maxWidth: "min(92vw, 460px)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 16px",
        background: "#2f322c",
        border: "1px solid #575c53",
        borderRadius: 8,
        boxShadow: "0 10px 30px rgba(0,0,0,.55)",
        fontFamily: "var(--f-read)",
        fontSize: 12,
        lineHeight: 1.6,
        color: "#c9c2ae",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 8,
          background: "#4c9a56",
          flex: "0 0 auto",
        }}
      />
      <span>
        អគារនេះដំណើរការដោយគ្មានអ៊ីនធឺណិតបានហើយ។ ក្រសួងមិនទទួលខុសត្រូវចំពោះអ្វីដែលកើតឡើងបន្ទាប់ទេ។
      </span>
    </div>
  );
}
