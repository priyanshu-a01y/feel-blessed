"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Track = { src: string };

type Props = { tracks: Track[] };

const CROSSFADE_MS = 3000;
const DEFAULT_VOLUME = 0.82;

function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function shuffle(list: number[]) {
  const result = [...list];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function makeCycle(count: number, avoid: number) {
  const cycle = shuffle(
    Array.from({ length: count }, (_, index) => index).filter(
      (index) => index !== avoid,
    ),
  );
  return cycle;
}

function Icon({
  type,
}: {
  type: "prev" | "next" | "play" | "pause" | "volume" | "mute";
}) {
  if (type === "prev") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 5v14M18 6l-8 6 8 6V6Z" />
      </svg>
    );
  }

  if (type === "next") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18 5v14M6 6l8 6-8 6V6Z" />
      </svg>
    );
  }

  if (type === "play") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m8 5 11 7-11 7V5Z" />
      </svg>
    );
  }

  if (type === "pause") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 6v12M16 6v12" />
      </svg>
    );
  }

  if (type === "mute") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 9v6h4l5 4V5L8 9H4Z" />
        <path d="m17 9 4 6m0-6-4 6" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 9v6h4l5 4V5L8 9H4Z" />
      <path d="M16 9.5c1.3 1.4 1.3 3.6 0 5M19 7c2.5 2.8 2.5 7.2 0 10" />
    </svg>
  );
}

function Vinyl({ playing }: { playing: boolean }) {
  return (
    <div className={`fb-vinyl ${playing ? "is-playing" : ""}`} aria-hidden="true">
      <div className="fb-vinyl-disc">
        <span className="fb-vinyl-ring ring-one" />
        <span className="fb-vinyl-ring ring-two" />
        <span className="fb-vinyl-ring ring-three" />
        <span className="fb-vinyl-label">FB</span>
        <span className="fb-vinyl-hole" />
      </div>
    </div>
  );
}

export default function MusicPlayer({ tracks }: Props) {
  const aRef = useRef<HTMLAudioElement | null>(null);
  const bRef = useRef<HTMLAudioElement | null>(null);

  const activeRef = useRef<"A" | "B">("A");
  const indexRef = useRef(0);
  const playingRef = useRef(false);
  const volumeRef = useRef(DEFAULT_VOLUME);
  const mutedRef = useRef(false);

  const queueRef = useRef<number[]>([]);
  const cursorRef = useRef(0);
  const historyRef = useRef<number[]>([]);
  const switchingRef = useRef(false);
  const crossfadeStartedRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const transitionTokenRef = useRef(0);

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);

  const getActive = useCallback(() => {
    return activeRef.current === "A" ? aRef.current : bRef.current;
  }, []);

  const getInactive = useCallback(() => {
    return activeRef.current === "A" ? bRef.current : aRef.current;
  }, []);

  const outputVolume = useCallback(() => {
    return mutedRef.current ? 0 : volumeRef.current;
  }, []);

  const setVolume = useCallback((audio: HTMLAudioElement | null, value: number) => {
    if (!audio) return;
    audio.muted = false;
    audio.volume = Math.max(0, Math.min(1, value));
  }, []);

  const refillQueue = useCallback((avoid: number) => {
    queueRef.current = makeCycle(tracks.length, avoid);
    cursorRef.current = 0;
  }, [tracks.length]);

  const nextIndex = useCallback(() => {
    if (tracks.length < 2) return tracks.length === 1 ? 0 : -1;

    if (cursorRef.current >= queueRef.current.length) {
      refillQueue(indexRef.current);
    }

    return queueRef.current[cursorRef.current++] ?? -1;
  }, [refillQueue, tracks.length]);

  const stopFade = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const cleanupAudio = useCallback((audio: HTMLAudioElement | null) => {
    if (!audio) return;
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
  }, []);

  const loadTrack = useCallback(
    async (trackIndex: number, shouldPlay: boolean) => {
      const audio = getActive();
      if (!audio || !tracks[trackIndex]) return false;

      stopFade();
      transitionTokenRef.current += 1;
      switchingRef.current = true;
      crossfadeStartedRef.current = false;

      audio.pause();
      audio.src = tracks[trackIndex].src;
      audio.preload = "auto";
      audio.currentTime = 0;
      setVolume(audio, outputVolume());
      audio.load();

      indexRef.current = trackIndex;
      setIndex(trackIndex);
      setCurrentTime(0);
      setDuration(0);

      try {
        if (shouldPlay) {
          await audio.play();
          playingRef.current = true;
          setPlaying(true);
        } else {
          playingRef.current = false;
          setPlaying(false);
        }
        return true;
      } catch {
        playingRef.current = false;
        setPlaying(false);
        return false;
      } finally {
        switchingRef.current = false;
      }
    },
    [getActive, outputVolume, setVolume, stopFade, tracks],
  );

  const crossfade = useCallback(
    async (targetIndex: number) => {
      const current = getActive();
      const incoming = getInactive();

      if (
        !current ||
        !incoming ||
        !tracks[targetIndex] ||
        targetIndex === indexRef.current ||
        switchingRef.current
      ) {
        return false;
      }

      switchingRef.current = true;
      crossfadeStartedRef.current = true;
      stopFade();

      const token = ++transitionTokenRef.current;
      incoming.pause();
      incoming.src = tracks[targetIndex].src;
      incoming.preload = "auto";
      incoming.currentTime = 0;
      setVolume(incoming, 0);
      incoming.load();

      try {
        await incoming.play();
      } catch {
        cleanupAudio(incoming);
        switchingRef.current = false;
        return false;
      }

      if (token !== transitionTokenRef.current) {
        cleanupAudio(incoming);
        switchingRef.current = false;
        return false;
      }

      const targetVolume = outputVolume();
      const start = performance.now();

      await new Promise<void>((resolve) => {
        const frame = (now: number) => {
          if (token !== transitionTokenRef.current) {
            setVolume(incoming, 0);
            resolve();
            return;
          }

          const progress = Math.min(1, (now - start) / CROSSFADE_MS);
          setVolume(current, targetVolume * (1 - progress));
          setVolume(incoming, targetVolume * progress);

          if (progress >= 1) {
            resolve();
            return;
          }

          rafRef.current = requestAnimationFrame(frame);
        };

        rafRef.current = requestAnimationFrame(frame);
      });

      if (token !== transitionTokenRef.current) {
        switchingRef.current = false;
        return false;
      }

      stopFade();
      cleanupAudio(current);

      activeRef.current = activeRef.current === "A" ? "B" : "A";
      indexRef.current = targetIndex;
      setIndex(targetIndex);
      setCurrentTime(0);
      setDuration(Number.isFinite(incoming.duration) ? incoming.duration : 0);
      playingRef.current = true;
      setPlaying(true);
      crossfadeStartedRef.current = false;
      switchingRef.current = false;
      return true;
    },
    [
      cleanupAudio,
      getActive,
      getInactive,
      outputVolume,
      setVolume,
      stopFade,
      tracks,
    ],
  );

  const goNext = useCallback(
    async (fade = true) => {
      if (switchingRef.current || !tracks.length) return;

      const maxAttempts = Math.max(1, tracks.length);
      let attempts = 0;

      while (attempts < maxAttempts) {
        attempts += 1;

        const target = nextIndex();
        if (target < 0) return;

        historyRef.current.push(indexRef.current);

        const ok =
          fade && playingRef.current
            ? await crossfade(target)
            : await loadTrack(target, playingRef.current);

        if (ok) return;

        // A bad/missing file should not trap the player.
        queueRef.current = queueRef.current.filter(
          (item) => item !== target,
        );

        if (switchingRef.current) return;
      }
    },
    [crossfade, loadTrack, nextIndex, tracks.length],
  );

  const previous = useCallback(async () => {
    const audio = getActive();
    if (!audio || switchingRef.current || !tracks.length) return;

    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    const target = historyRef.current.pop();
    if (target === undefined) {
      audio.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    queueRef.current = [indexRef.current, ...queueRef.current.slice(cursorRef.current)];
    cursorRef.current = 0;

    if (playingRef.current) {
      await crossfade(target);
    } else {
      await loadTrack(target, false);
    }
  }, [crossfade, getActive, loadTrack, tracks.length]);

  const togglePlay = useCallback(async () => {
    const audio = getActive();
    if (!audio || switchingRef.current) return;

    try {
      if (audio.paused) {
        setVolume(audio, outputVolume());
        await audio.play();
        playingRef.current = true;
        setPlaying(true);
      } else {
        audio.pause();
        playingRef.current = false;
        setPlaying(false);
      }
    } catch {
      setPlaying(false);
      playingRef.current = false;
    }
  }, [getActive, outputVolume, setVolume]);

  const seek = useCallback((value: number) => {
    const audio = getActive();
    if (!audio || !Number.isFinite(value)) return;

    const safe = Math.max(
      0,
      Math.min(value, Number.isFinite(audio.duration) ? audio.duration : value),
    );

    audio.currentTime = safe;
    setCurrentTime(safe);
  }, [getActive]);

  const toggleMute = useCallback(() => {
    mutedRef.current = !mutedRef.current;
    setMuted(mutedRef.current);

    const value = outputVolume();
    setVolume(aRef.current, value);
    setVolume(bRef.current, value);
  }, [outputVolume, setVolume]);

  useEffect(() => {
    if (!tracks.length) return;

    const a = aRef.current;
    const b = bRef.current;
    if (!a || !b) return;

    // The first song is intentionally random.
    const first = Math.floor(Math.random() * tracks.length);
    indexRef.current = first;
    setIndex(first);
    refillQueue(first);

    a.src = tracks[first].src;
    a.preload = "auto";
    setVolume(a, outputVolume());
    a.load();

    const timeUpdate = () => {
      const audio = activeRef.current === "A" ? a : b;
      if (!audio) return;

      setCurrentTime(audio.currentTime);

      // Start the true crossfade before the hard end.
      if (
        playingRef.current &&
        !switchingRef.current &&
        !crossfadeStartedRef.current &&
        Number.isFinite(audio.duration) &&
        audio.duration > CROSSFADE_MS / 1000 + 1 &&
        audio.duration - audio.currentTime <= CROSSFADE_MS / 1000
      ) {
        crossfadeStartedRef.current = true;
        void goNext(true);
      }
    };

    const metadata = () => {
      const audio = activeRef.current === "A" ? a : b;
      if (audio && Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const ended = () => {
      if (!switchingRef.current && !crossfadeStartedRef.current) {
        void goNext(true);
      }
    };

    const error = () => {
      if (!switchingRef.current) {
        crossfadeStartedRef.current = false;
        void goNext(false);
      }
    };

    for (const audio of [a, b]) {
      audio.addEventListener("timeupdate", timeUpdate);
      audio.addEventListener("loadedmetadata", metadata);
      audio.addEventListener("durationchange", metadata);
      audio.addEventListener("ended", ended);
      audio.addEventListener("error", error);
    }

    return () => {
      transitionTokenRef.current += 1;
      stopFade();

      for (const audio of [a, b]) {
        audio.removeEventListener("timeupdate", timeUpdate);
        audio.removeEventListener("loadedmetadata", metadata);
        audio.removeEventListener("durationchange", metadata);
        audio.removeEventListener("ended", ended);
        audio.removeEventListener("error", error);
        cleanupAudio(audio);
      }
    };
  }, [cleanupAudio, goNext, outputVolume, refillQueue, setVolume, stopFade, tracks]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      ) return;

      const audio = getActive();
      if (!audio) return;

      if (event.code === "Space") {
        event.preventDefault();
        void togglePlay();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        seek(Math.max(0, audio.currentTime - 5));
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        seek(
          Number.isFinite(audio.duration)
            ? Math.min(audio.duration, audio.currentTime + 5)
            : audio.currentTime + 5,
        );
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [getActive, seek, togglePlay]);

  if (!tracks.length) return null;

  const progress =
    duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  return (
    <div className="fb-player" role="region" aria-label="Feel Blessed music player">
      <audio ref={aRef} preload="metadata" aria-hidden="true" />
      <audio ref={bRef} preload="metadata" aria-hidden="true" />

      <Vinyl playing={playing} />

      <div className="fb-player-main">
        <div className="fb-progress-row">
          <span>{formatTime(currentTime)}</span>
          <input
            className="fb-seek"
            type="range"
            min={0}
            max={duration > 0 ? duration : 1}
            step={0.1}
            value={duration > 0 ? Math.min(currentTime, duration) : 0}
            onChange={(event) => seek(Number(event.target.value))}
            style={{ ["--fb-progress" as string]: `${progress}%` }}
            aria-label="Seek through song"
          />
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="fb-controls">
        <button
          type="button"
          className="fb-control"
          onClick={() => void previous()}
          aria-label="Previous song"
        >
          <Icon type="prev" />
        </button>

        <button
          type="button"
          className="fb-play"
          onClick={() => void togglePlay()}
          aria-label={playing ? "Pause" : "Play"}
        >
          <Icon type={playing ? "pause" : "play"} />
        </button>

        <button
          type="button"
          className="fb-control"
          onClick={() => void goNext(true)}
          aria-label="Next song"
        >
          <Icon type="next" />
        </button>

        <button
          type="button"
          className={`fb-volume ${muted ? "is-muted" : ""}`}
          onClick={toggleMute}
          aria-label={muted ? "Unmute" : "Mute"}
        >
          <Icon type={muted ? "mute" : "volume"} />
        </button>
      </div>
    </div>
  );
}
