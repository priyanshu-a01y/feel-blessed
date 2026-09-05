"use client";

import { useEffect, useState } from "react";

function formatLocalTime(date: Date) {
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function TopBar() {
  const [time, setTime] = useState("");
  const [listeners] = useState(() => 100 + Math.floor(Math.random() * 80));

  useEffect(() => {
    const tick = () => setTime(formatLocalTime(new Date()));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <header
      className="pointer-events-none fixed left-0 right-0 top-0 z-20 flex items-start justify-between"
      style={{
        paddingTop: "max(0.75rem, env(safe-area-inset-top))",
        paddingLeft: "max(1rem, env(safe-area-inset-left))",
        paddingRight: "max(1rem, env(safe-area-inset-right))",
      }}
    >
      <div className="pointer-events-auto text-[11px] font-light tracking-[0.18em] text-white/50 tabular-nums sm:text-xs">
        {time || "—"}
      </div>

      <div className="pointer-events-none flex items-center gap-1.5 text-[11px] font-light tracking-[0.12em] text-white/40 sm:text-xs">
        <span
          className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400/70"
          style={{ boxShadow: "0 0 6px rgba(52,211,153,0.45)" }}
        />
        <span>{listeners} listeners</span>
      </div>

      <div className="pointer-events-auto flex items-center gap-3 text-white/35">
        <span className="text-[11px] font-light tracking-[0.2em] sm:text-xs" title="Feel Blessed">
          ✦
        </span>
      </div>
    </header>
  );
}
