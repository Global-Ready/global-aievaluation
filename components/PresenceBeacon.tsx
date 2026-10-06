"use client";

import { useEffect } from "react";

const HEARTBEAT_MS = 60_000;

function getSessionId(): string | null {
  try {
    const existing = window.localStorage.getItem("gr-session-id");
    if (existing) return existing;
    const id = crypto.randomUUID();
    window.localStorage.setItem("gr-session-id", id);
    return id;
  } catch {
    return null;
  }
}

// Keeps this browser counted as a "live viewer" on the admin metrics page.
// Only pings while the tab is visible, so background tabs don't inflate it.
export default function PresenceBeacon() {
  useEffect(() => {
    const sessionId = getSessionId();
    if (!sessionId) return;

    const beat = () => {
      if (document.visibilityState !== "visible") return;
      fetch("/api/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
        keepalive: true,
      }).catch(() => {});
    };

    beat();
    const interval = window.setInterval(beat, HEARTBEAT_MS);
    document.addEventListener("visibilitychange", beat);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", beat);
    };
  }, []);

  return null;
}
