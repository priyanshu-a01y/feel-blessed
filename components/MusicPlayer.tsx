"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAudioEngine } from "@/lib/useAudioEngine";

type Track = {
  src: string;
  title?: string;
  artist?: string;
};

type Props = {
  tracks: Track[];
};

function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) {
    return "0:00";
  }

  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function IconPrevious() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 5v14M18 6l-8 6 8 6V6Z" />
    </svg>
  );
}

function IconNext() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 5v14M6 6l8 6-8 6V6Z" />
    </svg>
  );
}

function IconPlay() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m9 5 10 7-10 7V5Z" />
    </svg>
  );
}

function IconPause() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5v14M16 5v14" />
    </svg>
  );
}

function IconVolume({ muted }: { muted: boolean }) {
  if (muted) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 10v4h4l5 4V6l-5 4H5Z" />
        <path d="m18 9 3 3m0-3-3 3" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 10v4h4l5 4V6l-5 4H5Z" />
      <path d="M18 9.5a4 4 0 0 1 0 5M20 7a7 7 0 0 1 0 10" />
    </svg>
  );
}

export default function MusicPlayer({ tracks }: Props) {
  const {
    isPlaying,
    isMuted,
    volume,
    currentTime,
    duration,
    togglePlay,
    next,
    previous,
    seek,
    setVolume,
    toggleMute,
  } = useAudioEngine(tracks);

  const [showVolume, setShowVolume] = useState(false);
  const volumeTimer = useRef<number | null>(null);

  const progress = useMemo(() => {
    if (!duration || !Number.isFinite(duration)) {
      return 0;
    }

    return Math.min(
      100,
      Math.max(0, (currentTime / duration) * 100)
    );
  }, [currentTime, duration]);

  useEffect(() => {
    return () => {
      if (volumeTimer.current !== null) {
        window.clearTimeout(volumeTimer.current);
      }
    };
  }, []);

  if (!tracks.length) {
    return null;
  }

  const revealVolume = () => {
    setShowVolume(true);

    if (volumeTimer.current !== null) {
      window.clearTimeout(volumeTimer.current);
    }

    volumeTimer.current = window.setTimeout(() => {
      setShowVolume(false);
    }, 3500);
  };

  const handleSeek = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    seek(Number(event.target.value));
  };

  const handleVolume = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setVolume(Number(event.target.value));
  };

  return (
    <div className="fb-player">
      <div className="fb-player-vinyl" aria-hidden="true">
        <div className="fb-vinyl-groove groove-one" />
        <div className="fb-vinyl-groove groove-two" />
        <div className="fb-vinyl-groove groove-three" />

        <div className="fb-vinyl-label">
          <span>SITA</span>
          <span>RAM</span>
        </div>

        <div className="fb-vinyl-hole" />
      </div>

      <div className="fb-player-main">
        <div className="fb-player-progress">
          <input
            type="range"
            min="0"
            max={duration || 0}
            step="0.01"
            value={Math.min(currentTime, duration || 0)}
            onChange={handleSeek}
            aria-label="Seek through music"
            style={{
              background: `linear-gradient(
                to right,
                rgba(255,255,255,.82) 0%,
                rgba(255,255,255,.82) ${progress}%,
                rgba(255,255,255,.14) ${progress}%,
                rgba(255,255,255,.14) 100%
              )`,
            }}
          />
        </div>

        <div className="fb-player-bottom">
          <span className="fb-player-time">
            {formatTime(currentTime)}
          </span>

          <div className="fb-player-controls">
            <button
              type="button"
              className="fb-control"
              onClick={previous}
              aria-label="Previous track"
            >
              <IconPrevious />
            </button>

            <button
              type="button"
              className="fb-play"
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause music" : "Play music"}
            >
              {isPlaying ? <IconPause /> : <IconPlay />}
            </button>

            <button
              type="button"
              className="fb-control"
              onClick={next}
              aria-label="Next track"
            >
              <IconNext />
            </button>

            <div className="fb-volume-wrap">
              {showVolume && (
                <div className="fb-volume-popover">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolume}
                    aria-label="Volume"
                  />
                </div>
              )}

              <button
                type="button"
                className="fb-control fb-volume-button"
                onClick={() => {
                  revealVolume();
                  toggleMute();
                }}
                onMouseEnter={() => setShowVolume(true)}
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                <IconVolume muted={isMuted} />
              </button>
            </div>
          </div>

          <span className="fb-player-time">
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}