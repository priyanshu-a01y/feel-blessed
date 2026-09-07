"use client";

import { useEffect, useState } from "react";
import { createClient, type RealtimeChannel } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function stablePresenceKey() {
  const storageKey = "feel-blessed-presence-id";
  const existing = window.localStorage.getItem(storageKey);
  if (existing) return existing;

  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  window.localStorage.setItem(storageKey, id);
  return id;
}

function countMembers(channel: RealtimeChannel) {
  const state = channel.presenceState<{ online: boolean }>();
  const unique = new Set<string>();

  Object.entries(state).forEach(([key, presences]) => {
    if (key) unique.add(key);
    presences.forEach(() => undefined);
  });

  return unique.size;
}

export default function LivePresence() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!url || !anonKey) return;

    const supabase = createClient(url, anonKey);
    const channel = supabase.channel("feel-blessed-live", {
      config: {
        presence: {
          key: stablePresenceKey(),
        },
      },
    });

    let alive = true;

    const refresh = () => {
      if (alive) setCount(countMembers(channel));
    };

    channel
      .on("presence", { event: "sync" }, refresh)
      .on("presence", { event: "join" }, refresh)
      .on("presence", { event: "leave" }, refresh)
      .subscribe(async (status) => {
        if (status !== "SUBSCRIBED") return;

        await channel.track({
          online: true,
          online_at: new Date().toISOString(),
        });

        refresh();
      });

    return () => {
      alive = false;
      void channel.untrack();
      void supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="fb-live" aria-label="Live listeners">
      <span className="fb-live-pulse" aria-hidden="true" />
      <span className="fb-live-word">LIVE</span>
      {count !== null && (
        <span className="fb-live-count">
          {count} {count === 1 ? "listener" : "listeners"}
        </span>
      )}
    </div>
  );
}
