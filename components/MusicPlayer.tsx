"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type Track = {
  src: string;
};

type Props = {
  tracks: Track[];
};

const CROSSFADE_MS = 3000;
const PRELOAD_AHEAD_SECONDS = 8;

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);

  return `${minutes}:${remaining.toString().padStart(2, "0")}`;
}

function shuffleExcept(count: number, excluded: number) {
  const values = Array.from({ length: count }, (_, index) => index).filter(
    (index) => index !== excluded,
  );

  for (let index = values.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [values[index], values[randomIndex]] = [
      values[randomIndex],
      values[index],
    ];
  }

  return values;
}

function Vinyl({ playing }: { playing: boolean }) {
  return (
    <div className={`fb-vinyl ${playing ? "is-playing" : ""}`}>
      <div className="fb-vinyl-disc">
        <span className="fb-vinyl-ring ring-one" />
        <span className="fb-vinyl-ring ring-two" />
        <span className="fb-vinyl-ring ring-three" />
        <span className="fb-vinyl-label">
          <span>SITA</span>
          <small>RAM</small>
        </span>
        <span className="fb-vinyl-hole" />
      </div>
    </div>
  );
}

function PreviousIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 5v14" />
      <path d="m18 6-8 6 8 6V6Z" />
    </svg>
  );
}

function NextIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 5v14" />
      <path d="m6 6 8 6-8 6V6Z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m8 5 11 7-11 7V5Z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 6v12" />
      <path d="M16 6v12" />
    </svg>
  );
}

function VolumeIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 9v6h4l5 4V5L8 9H4Z" />
      {muted ? (
        <>
          <path d="m17 9 4 6" />
          <path d="m21 9-4 6" />
        </>
      ) : (
        <>
          <path d="M16 9.5c1.3 1.4 1.3 3.6 0 5" />
          <path d="M19 7c2.5 2.8 2.5 7.2 0 10" />
        </>
      )}
    </svg>
  );
}

export default function MusicPlayer({ tracks }: Props) {
  const deckARef = useRef<HTMLAudioElement | null>(null);
  const deckBRef = useRef<HTMLAudioElement | null>(null);
  const activeDeckRef = useRef<"A" | "B">("A");

  const indexRef = useRef(0);
  const playingRef = useRef(false);
  const volumeRef = useRef(0.82);
  const mutedRef = useRef(false);

  const queueRef = useRef<number[]>([]);
  const queueCursorRef = useRef(0);
  const historyRef = useRef<number[]>([]);

  const transitionRef = useRef(false);
  const transitionTokenRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.82);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [started, setStarted] = useState(false);

  const stopFade = useCallback(() => {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const actualVolume = useCallback(() => {
    return mutedRef.current ? 0 : volumeRef.current;
  }, []);

  const setDeckVolume = useCallback(
    (deck: HTMLAudioElement | null, value: number) => {
      if (!deck) return;
      deck.muted = false;
      deck.volume = Math.max(0, Math.min(1, value));
    },
    [],
  );

  const buildQueue = useCallback(
    (excluded: number) => {
      queueRef.current = shuffleExcept(tracks.length, excluded);
      queueCursorRef.current = 0;
    },
    [tracks.length],
  );

  const takeNextFromQueue = useCallback(() => {
    if (tracks.length === 0) return -1;

    if (
      queueCursorRef.current >= queueRef.current.length ||
      queueRef.current.length === 0
    ) {
      buildQueue(indexRef.current);
    }

    return queueRef.current[queueCursorRef.current++] ?? -1;
  }, [buildQueue, tracks.length]);

  const setCurrent = useCallback((index: number) => {
    indexRef.current = index;
    setCurrentIndex(index);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const activeDeck = useCallback(() => {
    return activeDeckRef.current === "A"
      ? deckARef.current
      : deckBRef.current;
  }, []);

  const inactiveDeck = useCallback(() => {
    return activeDeckRef.current === "A"
      ? deckBRef.current
      : deckARef.current;
  }, []);

  const commitDeck = useCallback(
    (nextDeck: "A" | "B", nextIndex: number) => {
      activeDeckRef.current = nextDeck;
      setCurrent(nextIndex);

      const oldDeck = nextDeck === "A" ? deckBRef.current : deckARef.current;

      if (oldDeck) {
        oldDeck.pause();
        oldDeck.removeAttribute("src");
        oldDeck.load();
      }

      setDeckVolume(
        nextDeck === "A" ? deckARef.current : deckBRef.current,
        actualVolume(),
      );

      playingRef.current = true;
      setIsPlaying(true);
    },
    [actualVolume, setCurrent, setDeckVolume],
  );

  const directLoad = useCallback(
    async (nextIndex: number, shouldPlay: boolean) => {
      const deck = activeDeck();
      if (!deck || !tracks[nextIndex]) return false;

      stopFade();
      transitionTokenRef.current += 1;
      transitionRef.current = true;

      deck.pause();
      deck.src = tracks[nextIndex].src;
      deck.preload = "auto";
      deck.currentTime = 0;
      setDeckVolume(deck, actualVolume());
      deck.load();

      setCurrent(nextIndex);

      try {
        if (shouldPlay) {
          await deck.play();
          playingRef.current = true;
          setIsPlaying(true);
        } else {
          playingRef.current = false;
          setIsPlaying(false);
        }
        return true;
      } catch {
        playingRef.current = false;
        setIsPlaying(false);
        return false;
      } finally {
        transitionRef.current = false;
      }
    },
    [
      activeDeck,
      actualVolume,
      setCurrent,
      setDeckVolume,
      stopFade,
      tracks,
    ],
  );

  const crossfadeTo = useCallback(
    async (nextIndex: number) => {
      const current = activeDeck();
      const next = inactiveDeck();

      if (
        !current ||
        !next ||
        !tracks[nextIndex] ||
        transitionRef.current ||
        nextIndex === indexRef.current
      ) {
        return false;
      }

      stopFade();
      transitionRef.current = true;
      const token = ++transitionTokenRef.current;

      next.pause();
      next.src = tracks[nextIndex].src;
      next.preload = "auto";
      next.currentTime = 0;
      setDeckVolume(next, 0);
      next.load();

      try {
        await next.play();
      } catch {
        next.removeAttribute("src");
        next.load();
        transitionRef.current = false;
        return false;
      }

      if (token !== transitionTokenRef.current) {
        next.pause();
        transitionRef.current = false;
        return false;
      }

      const startVolume = actualVolume();
      const startedAt = performance.now();

      await new Promise<void>((resolve) => {
        const step = (now: number) => {
          if (token !== transitionTokenRef.current) {
            setDeckVolume(next, 0);
            resolve();
            return;
          }

          const progress = Math.min(
            1,
            (now - startedAt) / CROSSFADE_MS,
          );

          setDeckVolume(current, startVolume * (1 - progress));
          setDeckVolume(next, startVolume * progress);

          if (progress >= 1) {
            resolve();
            return;
          }

          rafRef.current = window.requestAnimationFrame(step);
        };

        rafRef.current = window.requestAnimationFrame(step);
      });

      if (token !== transitionTokenRef.current) {
        transitionRef.current = false;
        return false;
      }

      stopFade();
      current.pause();
      current.removeAttribute("src");
      current.load();

      commitDeck(activeDeckRef.current === "A" ? "B" : "A", nextIndex);
      transitionRef.current = false;
      return true;
    },
    [
      activeDeck,
      actualVolume,
      commitDeck,
      inactiveDeck,
      setDeckVolume,
      stopFade,
      tracks,
    ],
  );

  const nextTrack = useCallback(
    async (crossfade = true) => {
      if (!tracks.length || transitionRef.current) return;

      const nextIndex = takeNextFromQueue();
      if (nextIndex < 0) return;

      historyRef.current.push(indexRef.current);

      const success =
        crossfade && playingRef.current
          ? await crossfadeTo(nextIndex)
          : await directLoad(nextIndex, playingRef.current);

      if (!success) {
        queueRef.current = queueRef.current.filter(
          (index) => index !== nextIndex,
        );
        if (tracks.length > 1) {
          await nextTrack(false);
        }
      }
    },
    [
      crossfadeTo,
      directLoad,
      takeNextFromQueue,
      tracks.length,
    ],
  );

  const previousTrack = useCallback(async () => {
    const current = activeDeck();

    if (!current || !tracks.length || transitionRef.current) return;

    if (current.currentTime > 3) {
      current.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    const previousIndex = historyRef.current.pop();

    if (
      previousIndex === undefined ||
      previousIndex === indexRef.current
    ) {
      current.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    queueRef.current = [
      indexRef.current,
      ...queueRef.current.slice(queueCursorRef.current),
    ];
    queueCursorRef.current = 0;

    await crossfadeTo(previousIndex);
  }, [activeDeck, crossfadeTo, tracks.length]);

  const togglePlay = useCallback(async () => {
    const deck = activeDeck();
    if (!deck || transitionRef.current) return;

    try {
      if (deck.paused) {
        setDeckVolume(deck, actualVolume());
        await deck.play();
        playingRef.current = true;
        setIsPlaying(true);
        setStarted(true);
      } else {
        deck.pause();
        playingRef.current = false;
        setIsPlaying(false);
      }
    } catch {
      playingRef.current = false;
      setIsPlaying(false);
    }
  }, [activeDeck, actualVolume, setDeckVolume]);

  const seek = useCallback(
    (value: number) => {
      const deck = activeDeck();
      if (!deck || !Number.isFinite(value)) return;

      const safe = Math.max(
        0,
        Math.min(value, Number.isFinite(deck.duration) ? deck.duration : value),
      );

      deck.currentTime = safe;
      setCurrentTime(safe);
    },
    [activeDeck],
  );

  const changeVolume = useCallback(
    (value: number) => {
      const safe = Math.max(0, Math.min(1, value));

      volumeRef.current = safe;
      mutedRef.current = safe === 0;

      setVolume(safe);
      setIsMuted(safe === 0);

      setDeckVolume(deckARef.current, mutedRef.current ? 0 : safe);
      setDeckVolume(deckBRef.current, mutedRef.current ? 0 : safe);
    },
    [setDeckVolume],
  );

  const toggleMute = useCallback(() => {
    const nextMuted = !mutedRef.current;

    mutedRef.current = nextMuted;
    setIsMuted(nextMuted);

    const value = nextMuted ? 0 : volumeRef.current;

    setDeckVolume(deckARef.current, value);
    setDeckVolume(deckBRef.current, value);
  }, [setDeckVolume]);

  useEffect(() => {
    if (!tracks.length) return;

    const deckA = deckARef.current;
    const deckB = deckBRef.current;

    if (!deckA || !deckB) return;

    buildQueue(0);

    deckA.preload = "metadata";
    deckB.preload = "metadata";

    deckA.src = tracks[0].src;
    deckA.volume = volumeRef.current;
    deckA.muted = false;
    deckA.load();

    const handleTimeUpdate = () => {
      if (activeDeckRef.current === "A") {
        setCurrentTime(deckA.currentTime);
      } else {
        setCurrentTime(deckB.currentTime);
      }
    };

    const handleMetadata = () => {
      const deck = activeDeckRef.current === "A" ? deckA : deckB;
      setDuration(Number.isFinite(deck.duration) ? deck.duration : 0);
    };

    const handleEnded = () => {
      if (!transitionRef.current) {
        void nextTrack(true);
      }
    };

    const handleError = () => {
      if (!transitionRef.current) {
        void nextTrack(false);
      }
    };

    deckA.addEventListener("timeupdate", handleTimeUpdate);
    deckB.addEventListener("timeupdate", handleTimeUpdate);
    deckA.addEventListener("loadedmetadata", handleMetadata);
    deckB.addEventListener("loadedmetadata", handleMetadata);
    deckA.addEventListener("ended", handleEnded);
    deckB.addEventListener("ended", handleEnded);
    deckA.addEventListener("error", handleError);
    deckB.addEventListener("error", handleError);

    return () => {
      deckA.removeEventListener("timeupdate", handleTimeUpdate);
      deckB.removeEventListener("timeupdate", handleTimeUpdate);
      deckA.removeEventListener("loadedmetadata", handleMetadata);
      deckB.removeEventListener("loadedmetadata", handleMetadata);
      deckA.removeEventListener("ended", handleEnded);
      deckB.removeEventListener("ended", handleEnded);
      deckA.removeEventListener("error", handleError);
      deckB.removeEventListener("error", handleError);

      transitionTokenRef.current += 1;
      stopFade();
      deckA.pause();
      deckB.pause();
      deckA.removeAttribute("src");
      deckB.removeAttribute("src");
      deckA.load();
      deckB.load();
    };
  }, [buildQueue, nextTrack, stopFade, tracks]);

  useEffect(() => {
    const deck = activeDeck();
    if (!deck) return;

    const maybePreload = () => {
      if (
        deck.duration > 0 &&
        deck.currentTime > 0 &&
        deck.duration - deck.currentTime <= PRELOAD_AHEAD_SECONDS &&
        !transitionRef.current
      ) {
        const nextIndex = queueRef.current[queueCursorRef.current];
        const nextDeck = inactiveDeck();

        if (nextIndex !== undefined && nextDeck && nextDeck.src === "") {
          nextDeck.preload = "auto";
          nextDeck.src = tracks[nextIndex].src;
          nextDeck.load();
        }
      }
    };

    deck.addEventListener("timeupdate", maybePreload);

    return () => {
      deck.removeEventListener("timeupdate", maybePreload);
    };
  }, [activeDeck, inactiveDeck, tracks]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;

      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        void togglePlay();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        void nextTrack(true);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        void previousTrack();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextTrack, previousTrack, togglePlay]);

  if (!tracks.length) {
    return null;
  }

  const progress =
    duration > 0
      ? Math.min(100, Math.max(0, (currentTime / duration) * 100))
      : 0;

  return (
    <>
      <audio ref={deckARef} aria-hidden="true" />
      <audio ref={deckBRef} aria-hidden="true" />

      <div
        className="fb-player"
        role="region"
        aria-label="Feel Blessed music player"
      >
        <Vinyl playing={isPlaying} />

        <div className="fb-player-main">
          <div className="fb-progress-row">
            <span>{formatTime(currentTime)}</span>

            <input
              className="fb-seek"
              type="range"
              min={0}
              max={duration > 0 ? duration : 1}
              step={0.1}
              value={Math.min(currentTime, duration > 0 ? duration : 1)}
              onChange={(event) => seek(Number(event.target.value))}
              style={{
                ["--fb-progress" as string]: `${progress}%`,
              }}
              aria-label="Seek"
            />

            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="fb-controls">
          <button
            type="button"
            className="fb-control"
            onClick={() => void previousTrack()}
            aria-label="Previous song"
          >
            <PreviousIcon />
          </button>

          <button
            type="button"
            className="fb-play"
            onClick={() => void togglePlay()}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>

          <button
            type="button"
            className="fb-control"
            onClick={() => void nextTrack(true)}
            aria-label="Next song"
          >
            <NextIcon />
          </button>

          <button
            type="button"
            className={`fb-volume ${isMuted ? "is-muted" : ""}`}
            onClick={toggleMute}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            <VolumeIcon muted={isMuted} />
          </button>
        </div>
      </div>

      {!started && (
        <button
          type="button"
          className="fb-start-hint"
          onClick={() => void togglePlay()}
          aria-label="Start listening"
        >
          <span>●</span>
          TAP TO LISTEN
        </button>
      )}
    </>
  );
}
