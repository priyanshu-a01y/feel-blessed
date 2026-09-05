"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export type EngineTrack = {
  src: string;
};

const CROSSFADE_MS = 3000;
const CROSSFADE_SECONDS = CROSSFADE_MS / 1000;

export function useAudioEngine(
  tracks: EngineTrack[],
) {
  const audioRef =
    useRef<HTMLAudioElement | null>(null);

  const nextAudioRef =
    useRef<HTMLAudioElement | null>(null);

  const indexRef =
    useRef(0);

  const queueRef =
    useRef<number[]>([]);

  const queuePositionRef =
    useRef(-1);

  const historyRef =
    useRef<number[]>([]);

  const playingRef =
    useRef(false);

  const switchingRef =
    useRef(false);

  const volumeRef =
    useRef(0.85);

  const mutedRef =
    useRef(false);

  const fadeTimerRef =
    useRef<number | null>(null);

  const fadeStartedRef =
    useRef(false);

  const [currentIndex, setCurrentIndex] =
    useState(0);

  const [isPlaying, setIsPlaying] =
    useState(false);

  const [isMuted, setIsMuted] =
    useState(false);

  const [volume, setVolumeState] =
    useState(0.85);

  const [currentTime, setCurrentTime] =
    useState(0);

  const [duration, setDuration] =
    useState(0);

  /*
   * ========================================================
   * SAFE VOLUME
   * ========================================================
   */

  const getActualVolume = useCallback(() => {
    return mutedRef.current
      ? 0
      : volumeRef.current;
  }, []);

  const applyAudioVolume =
    useCallback(() => {
      const value =
        getActualVolume();

      if (audioRef.current) {
        audioRef.current.volume =
          value;
      }

      if (nextAudioRef.current) {
        nextAudioRef.current.volume =
          value;
      }
    }, [getActualVolume]);

  const setVolume = useCallback(
    (value: number) => {
      const safeValue =
        Number.isFinite(value)
          ? Math.max(
            0,
            Math.min(1, value),
          )
          : volumeRef.current;

      volumeRef.current =
        safeValue;

      if (safeValue > 0) {
        mutedRef.current = false;
        setIsMuted(false);
      } else {
        mutedRef.current = true;
        setIsMuted(true);
      }

      setVolumeState(
        safeValue,
      );

      /*
       * IMPORTANT:
       * Only volume changes here.
       *
       * No play()
       * No pause()
       * No index change
       * No queue change
       * No seek
       */
      applyAudioVolume();
    },
    [applyAudioVolume],
  );

  const toggleMute =
    useCallback(() => {
      const newMuted =
        !mutedRef.current;

      mutedRef.current =
        newMuted;

      setIsMuted(
        newMuted,
      );

      /*
       * IMPORTANT:
       * Mute/unmute ONLY changes
       * the audio volume.
       */
      applyAudioVolume();
    }, [applyAudioVolume]);

  /*
   * ========================================================
   * SHUFFLE
   * ========================================================
   */

  const createShuffleQueue =
    useCallback(
      (currentIndex: number) => {
        const indexes =
          tracks.map(
            (_, index) => index,
          );

        /*
         * Fisher-Yates shuffle
         */
        for (
          let i =
            indexes.length - 1;
          i > 0;
          i--
        ) {
          const randomIndex =
            Math.floor(
              Math.random() *
              (i + 1),
            );

          [
            indexes[i],
            indexes[randomIndex],
          ] = [
              indexes[randomIndex],
              indexes[i],
            ];
        }

        /*
         * Current track cannot be
         * the first item of a new cycle.
         */
        if (
          indexes.length > 1 &&
          indexes[0] === currentIndex
        ) {
          const swapIndex =
            indexes.findIndex(
              (index) =>
                index !==
                currentIndex,
            );

          if (swapIndex > 0) {
            [
              indexes[0],
              indexes[swapIndex],
            ] = [
                indexes[swapIndex],
                indexes[0],
              ];
          }
        }

        return indexes;
      },
      [tracks],
    );

  const getNextIndex =
    useCallback(() => {
      if (tracks.length === 0) {
        return -1;
      }

      /*
       * Create first queue.
       */
      if (
        queueRef.current.length === 0
      ) {
        queueRef.current =
          createShuffleQueue(
            indexRef.current,
          );

        queuePositionRef.current =
          -1;
      }

      /*
       * Move forward.
       */
      queuePositionRef.current++;

      /*
       * New shuffle cycle.
       */
      if (
        queuePositionRef.current >=
        queueRef.current.length
      ) {
        queueRef.current =
          createShuffleQueue(
            indexRef.current,
          );

        queuePositionRef.current =
          0;
      }

      let nextIndex =
        queueRef.current[
        queuePositionRef.current
        ];

      /*
       * Absolute protection against
       * immediate repeat.
       */
      if (
        nextIndex ===
        indexRef.current &&
        tracks.length > 1
      ) {
        const candidates =
          tracks
            .map(
              (_, index) => index,
            )
            .filter(
              (index) =>
                index !==
                indexRef.current,
            );

        nextIndex =
          candidates[
          Math.floor(
            Math.random() *
            candidates.length,
          )
          ];
      }

      return nextIndex;
    }, [
      tracks,
      createShuffleQueue,
    ]);

  /*
   * ========================================================
   * FADE CLEANUP
   * ========================================================
   */

  const stopFade =
    useCallback(() => {
      if (
        fadeTimerRef.current !== null
      ) {
        window.clearInterval(
          fadeTimerRef.current,
        );

        fadeTimerRef.current =
          null;
      }

      fadeStartedRef.current =
        false;
    }, []);

  /*
   * ========================================================
   * FINISH SWITCH
   * ========================================================
   */

  const finishSwitch =
    useCallback(
      (
        currentAudio: HTMLAudioElement,
        nextAudio: HTMLAudioElement,
        nextIndex: number,
      ) => {
        stopFade();

        currentAudio.pause();

        currentAudio.currentTime =
          0;

        /*
         * Remove old source completely.
         */
        currentAudio.removeAttribute(
          "src",
        );

        currentAudio.load();

        nextAudio.volume =
          getActualVolume();

        audioRef.current =
          nextAudio;

        nextAudioRef.current =
          null;

        indexRef.current =
          nextIndex;

        setCurrentIndex(
          nextIndex,
        );

        setCurrentTime(
          nextAudio.currentTime,
        );

        if (
          Number.isFinite(
            nextAudio.duration,
          )
        ) {
          setDuration(
            nextAudio.duration,
          );
        }

        playingRef.current =
          true;

        setIsPlaying(true);

        switchingRef.current =
          false;
      },
      [
        stopFade,
        getActualVolume,
      ],
    );

  /*
   * ========================================================
   * CROSSFADE
   * ========================================================
   */

  const crossfadeTo =
    useCallback(
      async (nextIndex: number) => {
        const current =
          audioRef.current;

        if (
          !current ||
          !tracks[nextIndex] ||
          switchingRef.current ||
          nextIndex ===
          indexRef.current
        ) {
          return;
        }

        switchingRef.current =
          true;

        stopFade();

        const nextAudio =
          new Audio(
            tracks[nextIndex].src,
          );

        nextAudio.preload =
          "auto";

        nextAudio.volume = 0;

        nextAudio.muted = false;

        nextAudioRef.current =
          nextAudio;

        try {
          await nextAudio.play();
        } catch {
          nextAudioRef.current =
            null;

          switchingRef.current =
            false;

          return;
        }

        const targetVolume =
          getActualVolume();

        const startTime =
          performance.now();

        fadeStartedRef.current =
          true;

        fadeTimerRef.current =
          window.setInterval(() => {
            const elapsed =
              performance.now() -
              startTime;

            const progress =
              Math.min(
                1,
                elapsed /
                CROSSFADE_MS,
              );

            /*
             * Current fades OUT.
             */
            current.volume =
              targetVolume *
              (1 - progress);

            /*
             * Next fades IN.
             */
            nextAudio.volume =
              targetVolume *
              progress;

            if (progress >= 1) {
              finishSwitch(
                current,
                nextAudio,
                nextIndex,
              );
            }
          }, 30);
      },
      [
        tracks,
        stopFade,
        getActualVolume,
        finishSwitch,
      ],
    );

  /*
   * ========================================================
   * LOAD WITHOUT CROSSFADE
   * ========================================================
   */

  const loadTrack =
    useCallback(
      async (
        trackIndex: number,
        autoplay: boolean,
      ) => {
        if (
          !tracks[trackIndex] ||
          !audioRef.current
        ) {
          return false;
        }

        stopFade();

        switchingRef.current =
          true;

        const audio =
          audioRef.current;

        audio.pause();

        audio.src =
          tracks[trackIndex].src;

        audio.currentTime =
          0;

        audio.volume =
          getActualVolume();

        audio.load();

        indexRef.current =
          trackIndex;

        setCurrentIndex(
          trackIndex,
        );

        setCurrentTime(0);
        setDuration(0);

        if (autoplay) {
          try {
            await audio.play();

            playingRef.current =
              true;

            setIsPlaying(true);
          } catch {
            playingRef.current =
              false;

            setIsPlaying(false);
          }
        }

        switchingRef.current =
          false;

        return true;
      },
      [
        tracks,
        stopFade,
        getActualVolume,
      ],
    );

  /*
   * ========================================================
   * NEXT
   * ========================================================
   */

  const next =
    useCallback(() => {
      if (
        switchingRef.current ||
        tracks.length === 0
      ) {
        return;
      }

      const nextIndex =
        getNextIndex();

      if (nextIndex < 0) {
        return;
      }

      historyRef.current.push(
        indexRef.current,
      );

      if (
        playingRef.current
      ) {
        void crossfadeTo(
          nextIndex,
        );
      } else {
        void loadTrack(
          nextIndex,
          false,
        );
      }
    }, [
      tracks.length,
      getNextIndex,
      crossfadeTo,
      loadTrack,
    ]);

  /*
   * ========================================================
   * PREVIOUS
   * ========================================================
   */

  const previous =
    useCallback(() => {
      const audio =
        audioRef.current;

      if (
        !audio ||
        tracks.length === 0 ||
        switchingRef.current
      ) {
        return;
      }

      /*
       * Standard music-player behaviour:
       * if already > 3 seconds,
       * restart current track.
       */
      if (
        audio.currentTime > 3
      ) {
        audio.currentTime = 0;
        setCurrentTime(0);
        return;
      }

      /*
       * Use actual playback history.
       */
      let previousIndex =
        historyRef.current.pop();

      if (
        previousIndex ===
        undefined ||
        previousIndex ===
        indexRef.current
      ) {
        const candidates =
          tracks
            .map(
              (_, index) => index,
            )
            .filter(
              (index) =>
                index !==
                indexRef.current,
            );

        if (
          candidates.length === 0
        ) {
          return;
        }

        previousIndex =
          candidates[
          Math.floor(
            Math.random() *
            candidates.length,
          )
          ];
      }

      void loadTrack(
        previousIndex,
        playingRef.current,
      );
    }, [
      tracks,
      loadTrack,
    ]);

  /*
   * ========================================================
   * PLAY / PAUSE
   * ========================================================
   */

  const togglePlay =
    useCallback(async () => {
      const audio =
        audioRef.current;

      if (!audio) {
        return;
      }

      try {
        if (audio.paused) {
          await audio.play();

          playingRef.current =
            true;

          setIsPlaying(true);
        } else {
          audio.pause();

          playingRef.current =
            false;

          setIsPlaying(false);
        }
      } catch {
        playingRef.current =
          false;

        setIsPlaying(false);
      }
    }, []);

  /*
   * ========================================================
   * SEEK
   * ========================================================
   */

  const seek =
    useCallback(
      (value: number) => {
        const audio =
          audioRef.current;

        if (
          !audio ||
          !Number.isFinite(value)
        ) {
          return;
        }

        const max =
          Number.isFinite(
            audio.duration,
          )
            ? audio.duration
            : value;

        const safeValue =
          Math.max(
            0,
            Math.min(
              value,
              max,
            ),
          );

        try {
          audio.currentTime =
            safeValue;
        } catch {
          return;
        }

        setCurrentTime(
          safeValue,
        );
      },
      [],
    );

  /*
   * ========================================================
   * TIME UPDATE
   *
   * Crossfade starts BEFORE the
   * current track reaches the end.
   * ========================================================
   */

  const handleTimeUpdate =
    useCallback(() => {
      const audio =
        audioRef.current;

      if (!audio) {
        return;
      }

      const time =
        audio.currentTime;

      const total =
        audio.duration;

      setCurrentTime(time);

      if (
        !Number.isFinite(total) ||
        total <= 0
      ) {
        return;
      }

      /*
       * Start crossfade during the
       * final 3 seconds.
       */
      if (
        playingRef.current &&
        !switchingRef.current &&
        !fadeStartedRef.current &&
        total - time <=
        CROSSFADE_SECONDS
      ) {
        const nextIndex =
          getNextIndex();

        if (
          nextIndex >= 0 &&
          nextIndex !==
          indexRef.current
        ) {
          historyRef.current.push(
            indexRef.current,
          );

          void crossfadeTo(
            nextIndex,
          );
        }
      }
    }, [
      getNextIndex,
      crossfadeTo,
    ]);

  const handleMetadata =
    useCallback(() => {
      const audio =
        audioRef.current;

      if (!audio) {
        return;
      }

      if (
        Number.isFinite(
          audio.duration,
        )
      ) {
        setDuration(
          audio.duration,
        );
      }
    }, []);

  const handleEnded =
    useCallback(() => {
      /*
       * Normally crossfade has
       * already started.
       *
       * This is only a fallback.
       */
      if (
        switchingRef.current ||
        fadeStartedRef.current
      ) {
        return;
      }

      next();
    }, [next]);

  /*
   * ========================================================
   * INITIALIZE AUDIO
   * ========================================================
   */

  useEffect(() => {
    if (
      tracks.length === 0
    ) {
      return;
    }

    const audio =
      new Audio();

    audio.preload =
      "auto";

    audio.volume =
      volumeRef.current;

    audio.src =
      tracks[0].src;

    audioRef.current =
      audio;

    indexRef.current = 0;

    queueRef.current =
      createShuffleQueue(0);

    queuePositionRef.current =
      -1;

    historyRef.current = [];

    playingRef.current =
      false;

    switchingRef.current =
      false;

    fadeStartedRef.current =
      false;

    setCurrentIndex(0);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    audio.addEventListener(
      "timeupdate",
      handleTimeUpdate,
    );

    audio.addEventListener(
      "loadedmetadata",
      handleMetadata,
    );

    audio.addEventListener(
      "ended",
      handleEnded,
    );

    return () => {
      stopFade();

      switchingRef.current =
        true;

      audio.pause();

      audio.removeEventListener(
        "timeupdate",
        handleTimeUpdate,
      );

      audio.removeEventListener(
        "loadedmetadata",
        handleMetadata,
      );

      audio.removeEventListener(
        "ended",
        handleEnded,
      );

      audio.src = "";

      const nextAudio =
        nextAudioRef.current;

      if (nextAudio) {
        nextAudio.pause();
        nextAudio.src = "";
      }

      nextAudioRef.current =
        null;

      audioRef.current =
        null;

      playingRef.current =
        false;
    };
  }, [
    tracks,
    createShuffleQueue,
    handleTimeUpdate,
    handleMetadata,
    handleEnded,
    stopFade,
  ]);

  /*
   * ========================================================
   * KEYBOARD
   * ========================================================
   */

  useEffect(() => {
    const handleKeyboard =
      (event: KeyboardEvent) => {
        const target =
          event.target as HTMLElement | null;

        if (
          target?.tagName ===
          "INPUT" ||
          target?.tagName ===
          "TEXTAREA" ||
          target?.isContentEditable
        ) {
          return;
        }

        if (
          event.code ===
          "Space"
        ) {
          event.preventDefault();
          void togglePlay();
        }

        if (
          event.key ===
          "ArrowRight"
        ) {
          event.preventDefault();
          next();
        }

        if (
          event.key ===
          "ArrowLeft"
        ) {
          event.preventDefault();
          previous();
        }
      };

    window.addEventListener(
      "keydown",
      handleKeyboard,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyboard,
      );
    };
  }, [
    togglePlay,
    next,
    previous,
  ]);

  return {
    currentIndex,

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

    CROSSFADE_MS,
  };
}