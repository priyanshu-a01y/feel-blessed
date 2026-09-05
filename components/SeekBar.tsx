"use client";

import {
  useCallback,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { formatTime } from "@/lib/tracks";

type Props = {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  compact?: boolean;
};

export default function SeekBar({
  currentTime,
  duration,
  onSeek,
  compact = false,
}: Props) {
  const [dragging, setDragging] = useState(false);
  const [dragValue, setDragValue] = useState(0);

  const safeDuration =
    Number.isFinite(duration) && duration > 0
      ? duration
      : 0;

  const safeCurrentTime =
    Number.isFinite(currentTime) && currentTime >= 0
      ? Math.min(currentTime, safeDuration || currentTime)
      : 0;

  const displayedTime = dragging
    ? dragValue
    : safeCurrentTime;

  const progress =
    safeDuration > 0
      ? Math.min(
        100,
        Math.max(
          0,
          (displayedTime / safeDuration) * 100,
        ),
      )
      : 0;

  const timeFromClientX = useCallback(
    (clientX: number) => {
      const element =
        document.getElementById("fb-seek-track");

      if (!element || safeDuration <= 0) {
        return 0;
      }

      const rect =
        element.getBoundingClientRect();

      if (rect.width <= 0) {
        return 0;
      }

      const ratio = Math.max(
        0,
        Math.min(
          1,
          (clientX - rect.left) / rect.width,
        ),
      );

      return ratio * safeDuration;
    },
    [safeDuration],
  );

  const handlePointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    if (safeDuration <= 0) {
      return;
    }

    event.preventDefault();

    event.currentTarget.setPointerCapture(
      event.pointerId,
    );

    const time = timeFromClientX(
      event.clientX,
    );

    setDragging(true);
    setDragValue(time);
  };

  const handlePointerMove = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    if (
      !dragging ||
      safeDuration <= 0
    ) {
      return;
    }

    const time = timeFromClientX(
      event.clientX,
    );

    setDragValue(time);
  };

  const handlePointerUp = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    if (
      !dragging ||
      safeDuration <= 0
    ) {
      return;
    }

    const time = timeFromClientX(
      event.clientX,
    );

    onSeek(time);

    setDragging(false);

    if (
      event.currentTarget.hasPointerCapture(
        event.pointerId,
      )
    ) {
      event.currentTarget.releasePointerCapture(
        event.pointerId,
      );
    }
  };

  const handlePointerCancel = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    setDragging(false);

    if (
      event.currentTarget.hasPointerCapture(
        event.pointerId,
      )
    ) {
      event.currentTarget.releasePointerCapture(
        event.pointerId,
      );
    }
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
  ) => {
    if (safeDuration <= 0) {
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();

      onSeek(
        Math.max(
          0,
          safeCurrentTime - 5,
        ),
      );
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();

      onSeek(
        Math.min(
          safeDuration,
          safeCurrentTime + 5,
        ),
      );
    }

    if (event.key === "Home") {
      event.preventDefault();
      onSeek(0);
    }

    if (event.key === "End") {
      event.preventDefault();
      onSeek(safeDuration);
    }
  };

  return (
    <div
      className={`flex w-full flex-col ${compact
          ? "gap-0.5"
          : "gap-1"
        }`}
    >
      <div
        id="fb-seek-track"
        className="group relative h-[3px] w-full cursor-pointer touch-none rounded-full bg-white/15"
        onPointerDown={
          handlePointerDown
        }
        onPointerMove={
          handlePointerMove
        }
        onPointerUp={
          handlePointerUp
        }
        onPointerCancel={
          handlePointerCancel
        }
        role="slider"
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={
          Math.floor(safeDuration)
        }
        aria-valuenow={Math.floor(
          displayedTime,
        )}
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {/* Progress */}
        <div
          className="pointer-events-none absolute left-0 top-0 h-full rounded-full bg-white/60"
          style={{
            width: `${progress}%`,
          }}
        />

        {/* Handle */}
        <div
          className={`pointer-events-none absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_1px_5px_rgba(0,0,0,0.35)] transition-opacity duration-150 ${dragging
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
            }`}
          style={{
            left: `${progress}%`,
          }}
        />
      </div>

      {/* Time */}
      <div className="flex justify-between text-[10px] font-light tabular-nums tracking-wide text-white/40">
        <span>
          {formatTime(displayedTime)}
        </span>

        <span>
          {formatTime(safeDuration)}
        </span>
      </div>
    </div>
  );
}