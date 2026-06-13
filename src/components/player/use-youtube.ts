"use client";

import { useEffect, useRef, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<void> | null = null;

function loadApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT && window.YT.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<void>((resolve) => {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    document.head.appendChild(tag);
  });
  return apiPromise;
}

/** Controla un reproductor de YouTube embebido en `elementId`. */
export function useYouTube(elementId: string, videoId: string | null) {
  const playerRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!videoId) return;
    let cancelled = false;

    loadApi().then(() => {
      if (cancelled) return;
      playerRef.current = new window.YT.Player(elementId, {
        videoId,
        playerVars: { playsinline: 1, rel: 0, modestbranding: 1 },
        events: {
          onReady: () => !cancelled && setReady(true),
          onStateChange: (e: any) => {
            // 1 = playing, 2 = paused, 0 = ended
            setIsPlaying(e.data === 1);
          },
        },
      });
    });

    return () => {
      cancelled = true;
      try {
        playerRef.current?.destroy?.();
      } catch {
        /* noop */
      }
      playerRef.current = null;
    };
  }, [elementId, videoId]);

  const play = () => playerRef.current?.playVideo?.();
  const pause = () => playerRef.current?.pauseVideo?.();
  const toggle = () => (isPlaying ? pause() : play());
  const getTime = () => playerRef.current?.getCurrentTime?.() ?? 0;
  const getDuration = () => playerRef.current?.getDuration?.() ?? 0;
  const seekTo = (s: number) => playerRef.current?.seekTo?.(s, true);

  return { ready, isPlaying, play, pause, toggle, getTime, getDuration, seekTo };
}
