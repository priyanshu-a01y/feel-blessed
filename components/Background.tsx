"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type MediaItem =
  | { type: "video"; src: string }
  | { type: "image"; src: string };

const MEDIA: MediaItem[] = [
  { type: "video", src: "/bg/1.mp4" },
  { type: "video", src: "/bg/4.mp4" },
  { type: "video", src: "/bg/5.mp4" },
  { type: "video", src: "/bg/6.mp4" },
  { type: "video", src: "/bg/7.mp4" },
  { type: "image", src: "/bg/2.jpg" },
  { type: "image", src: "/bg/3.jpg" },
];

const VIDEO_PLAYS = 2;
const IMAGE_HOLD_MS = 7000;
const FADE_MS = 1400;

export default function Background() {
  const videos = useRef<[HTMLVideoElement | null, HTMLVideoElement | null]>([null, null]);
  const images = useRef<[HTMLImageElement | null, HTMLImageElement | null]>([null, null]);

  const activeSlotRef = useRef<0 | 1>(0);
  const indexRef = useRef(0);
  const videoPlaysRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const transitionRef = useRef(false);

  const [visibleSlot, setVisibleSlot] = useState<0 | 1>(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clearSlot = useCallback((slot: 0 | 1) => {
    const video = videos.current[slot];
    const image = images.current[slot];

    if (video) {
      video.pause();
      video.removeAttribute("src");
      video.load();
    }

    if (image) {
      image.removeAttribute("src");
    }
  }, []);

  const loadIntoSlot = useCallback((slot: 0 | 1, item: MediaItem) => {
    const video = videos.current[slot];
    const image = images.current[slot];

    if (item.type === "video") {
      if (image) image.removeAttribute("src");
      if (!video) return;

      video.src = item.src;
      video.preload = "auto";
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.load();
      return;
    }

    if (video) {
      video.pause();
      video.removeAttribute("src");
      video.load();
    }

    if (image) {
      image.src = item.src;
      image.loading = "eager";
      image.decoding = "async";
    }
  }, []);

  const advance = useCallback(() => {
    if (transitionRef.current) return;

    transitionRef.current = true;
    clearTimer();

    const oldSlot = activeSlotRef.current;
    const nextSlot: 0 | 1 = oldSlot === 0 ? 1 : 0;
    const nextIndex = (indexRef.current + 1) % MEDIA.length;
    const nextItem = MEDIA[nextIndex];

    loadIntoSlot(nextSlot, nextItem);

    const startTransition = () => {
      setVisibleSlot(nextSlot);

      window.setTimeout(() => {
        clearSlot(oldSlot);
        activeSlotRef.current = nextSlot;
        indexRef.current = nextIndex;
        videoPlaysRef.current = 0;
        transitionRef.current = false;

        if (nextItem.type === "image") {
          timerRef.current = window.setTimeout(advance, IMAGE_HOLD_MS);
        }
      }, FADE_MS);
    };

    if (nextItem.type === "video") {
      const nextVideo = videos.current[nextSlot];
      if (!nextVideo) {
        transitionRef.current = false;
        return;
      }

      const onReady = () => {
        nextVideo.removeEventListener("canplay", onReady);
        void nextVideo.play().then(startTransition).catch(() => {
          transitionRef.current = false;
        });
      };

      if (nextVideo.readyState >= 3) {
        onReady();
      } else {
        nextVideo.addEventListener("canplay", onReady);
      }
    } else {
      const nextImage = images.current[nextSlot];
      if (!nextImage) {
        transitionRef.current = false;
        return;
      }

      if (nextImage.complete) {
        startTransition();
      } else {
        nextImage.addEventListener("load", startTransition, { once: true });
      }
    }
  }, [clearSlot, clearTimer, loadIntoSlot]);

  const handleEnded = useCallback(
    (slot: 0 | 1) => {
      if (slot !== activeSlotRef.current || transitionRef.current) return;

      videoPlaysRef.current += 1;

      if (videoPlaysRef.current < VIDEO_PLAYS) {
        const video = videos.current[slot];
        if (video) {
          video.currentTime = 0;
          void video.play().catch(() => {});
        }
        return;
      }

      advance();
    },
    [advance],
  );

  useEffect(() => {
    loadIntoSlot(0, MEDIA[0]);

    const video = videos.current[0];
    const start = () => void video?.play().catch(() => {});

    if (video) {
      if (video.readyState >= 3) start();
      else video.addEventListener("canplay", start, { once: true });
    }

    return () => {
      clearTimer();
      clearSlot(0);
      clearSlot(1);
    };
  }, [clearSlot, clearTimer, loadIntoSlot]);

  return (
    <div className="fb-background" aria-hidden="true">
      <video
        ref={(el) => { videos.current[0] = el; }}
        className={`fb-background-media ${visibleSlot === 0 ? "is-visible" : ""}`}
        muted
        playsInline
        preload="auto"
        onEnded={() => handleEnded(0)}
      />
      <img
        ref={(el) => { images.current[0] = el; }}
        className={`fb-background-media fb-background-image ${visibleSlot === 0 ? "is-visible" : ""}`}
        alt=""
        draggable={false}
      />

      <video
        ref={(el) => { videos.current[1] = el; }}
        className={`fb-background-media ${visibleSlot === 1 ? "is-visible" : ""}`}
        muted
        playsInline
        preload="auto"
        onEnded={() => handleEnded(1)}
      />
      <img
        ref={(el) => { images.current[1] = el; }}
        className={`fb-background-media fb-background-image ${visibleSlot === 1 ? "is-visible" : ""}`}
        alt=""
        draggable={false}
      />

      <div className="fb-background-overlay" />
    </div>
  );
}
