"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const BACKGROUNDS = [
  "/bg/upscaled-video.mp4",
  "/bg/stretching.mp4",
  "/bg/fall-outfit.mp4",
  "/bg/kainchi-dham.jpg",
  "/bg/baba.jpg",
];

const FIRST_VIDEO_REPEAT_COUNT = 8;

function createSequence() {
  return [
    ...Array.from(
      { length: FIRST_VIDEO_REPEAT_COUNT },
      () => BACKGROUNDS[0]
    ),
    ...BACKGROUNDS.slice(1),
  ];
}

export default function Background() {
  const sequenceRef = useRef(createSequence());
  const indexRef = useRef(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [source, setSource] = useState(sequenceRef.current[0]);

  const isVideo = source.toLowerCase().endsWith(".mp4");

  const playVideo = useCallback(() => {
    const video = videoRef.current;

    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    void video.play().catch(() => { });
  }, []);

  const nextBackground = useCallback(() => {
    indexRef.current =
      (indexRef.current + 1) % sequenceRef.current.length;

    setSource(sequenceRef.current[indexRef.current]);
  }, []);

  useEffect(() => {
    if (!isVideo) return;

    const video = videoRef.current;

    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.loop = false;

    const handleEnded = () => {
      nextBackground();
    };

    const handleError = () => {
      nextBackground();
    };

    const handleCanPlay = () => {
      playVideo();
    };

    video.addEventListener("ended", handleEnded);
    video.addEventListener("error", handleError);
    video.addEventListener("canplay", handleCanPlay);

    playVideo();

    return () => {
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("error", handleError);
      video.removeEventListener("canplay", handleCanPlay);
    };
  }, [isVideo, nextBackground, playVideo, source]);

  useEffect(() => {
    if (!isVideo) return;

    const timer = window.setInterval(() => {
      const video = videoRef.current;

      if (!video) return;

      if (video.paused && !video.ended) {
        playVideo();
      }
    }, 2000);

    return () => {
      window.clearInterval(timer);
    };
  }, [isVideo, playVideo]);

  return (
    <div className="fb-background" aria-hidden="true">
      {isVideo ? (
        <video
          ref={videoRef}
          key={source}
          src={source}
          autoPlay
          muted
          playsInline
          preload="auto"
          controls={false}
          disablePictureInPicture
        />
      ) : (
        <img
          src={source}
          alt=""
          draggable={false}
        />
      )}

      <div className="fb-background-overlay" />
    </div>
  );
}