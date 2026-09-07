"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Media =
  | { kind: "video"; src: string }
  | { kind: "image"; src: string };

const MEDIA_SEQUENCE: Media[] = [
  { kind: "video", src: "/bg/upscaled-video.mp4" },
  { kind: "video", src: "/bg/stretching.mp4" },
  { kind: "video", src: "/bg/fall-outfit.mp4" },
  { kind: "image", src: "/bg/kainchi-dham.jpg" },
  { kind: "image", src: "/bg/baba.jpg" },
];

const FIRST_VIDEO_REPEATS = 8;
const IMAGE_DURATION_MS = 8000;

function nextPosition(position: number, firstVideoCount: number) {
  if (position === 0 && firstVideoCount < FIRST_VIDEO_REPEATS - 1) {
    return { position: 0, firstVideoCount: firstVideoCount + 1 };
  }

  if (position < MEDIA_SEQUENCE.length - 1) {
    return { position: position + 1, firstVideoCount };
  }

  return { position: 0, firstVideoCount: 0 };
}

export default function Background() {
  const [position, setPosition] = useState(0);
  const [firstVideoCount, setFirstVideoCount] = useState(0);
  const [ready, setReady] = useState(false);
  const imageTimerRef = useRef<number | null>(null);

  const advance = useCallback(() => {
    setReady(false);

    setPosition((currentPosition) => {
      const result = nextPosition(currentPosition, firstVideoCount);
      setFirstVideoCount(result.firstVideoCount);
      return result.position;
    });
  }, [firstVideoCount]);

  useEffect(() => {
    return () => {
      if (imageTimerRef.current !== null) {
        window.clearTimeout(imageTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (MEDIA_SEQUENCE[position].kind !== "image") {
      return;
    }

    if (!ready) {
      return;
    }

    imageTimerRef.current = window.setTimeout(
      advance,
      IMAGE_DURATION_MS,
    );

    return () => {
      if (imageTimerRef.current !== null) {
        window.clearTimeout(imageTimerRef.current);
        imageTimerRef.current = null;
      }
    };
  }, [position, ready, advance]);

  const media = MEDIA_SEQUENCE[position];

  return (
    <div className="fb-background" aria-hidden="true">
      {media.kind === "video" ? (
        <video
          key={media.src}
          className={`fb-background-media ${ready ? "is-ready" : ""}`}
          src={media.src}
          autoPlay
          muted
          playsInline
          preload="metadata"
          disablePictureInPicture
          controlsList="nodownload noplaybackrate"
          onCanPlay={() => setReady(true)}
          onEnded={advance}
          onError={advance}
        />
      ) : (
        <img
          key={media.src}
          className={`fb-background-media ${ready ? "is-ready" : ""}`}
          src={media.src}
          alt=""
          onLoad={() => setReady(true)}
          onError={advance}
        />
      )}

      <div className="fb-background-overlay" />
    </div>
  );
}
