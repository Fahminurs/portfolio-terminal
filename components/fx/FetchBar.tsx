"use client";

import { useEffect, useState } from "react";
import { bar } from "./AsciiProgress";
import { play } from "@/lib/sfx";
import { cn } from "@/lib/utils";

const kb = (n: number) => (n / 1024).toFixed(1);

/**
 * Streams `src` once to show real byte progress, then gets out of the way — the actual <img> /
 * canvas loads from the HTTP cache. Falls back to a creeping bar when there's no content-length.
 */
function useFetchProgress(src: string) {
  // mount it with key={src} — a new file gets a fresh bar
  const [state, setState] = useState({ got: 0, total: 0, done: false });

  useEffect(() => {
    const ctl = new AbortController();
    (async () => {
      try {
        const res = await fetch(src, { signal: ctl.signal });
        const total = Number(res.headers.get("content-length")) || 0;
        if (!res.body) {
          await res.arrayBuffer();
          setState({ got: total, total, done: true });
          return;
        }
        const reader = res.body.getReader();
        let got = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          got += value.byteLength;
          setState({ got, total, done: false });
        }
        setState({ got, total: total || got, done: true });
      } catch {
        if (!ctl.signal.aborted) setState({ got: 0, total: 0, done: true });
      }
    })();
    return () => ctl.abort();
  }, [src]);

  return state;
}

/**
 * `$ fetch 02.webp  [#####.......]  34.2/61.0 KB` — a one-line terminal download over media
 * while it loads. `ready` lets the caller hold the bar until its own element can show the file.
 */
export function FetchBar({ src, ready = true, className }: { src: string; ready?: boolean; className?: string }) {
  const { got, total, done } = useFetchProgress(src);
  const p = done ? 1 : total ? got / total : Math.min(0.9, got / 400_000);
  const show = !(done && ready);

  useEffect(() => {
    if (done) play("tick");
  }, [done]);

  if (!show) return null;
  const name = src.split("/").pop();
  return (
    <p
      role="status"
      aria-live="polite"
      className={cn("pointer-events-none whitespace-pre border border-line bg-bg/90 px-2 py-0.5 font-mono text-[10px] text-fg-3", className)}
    >
      <span className="text-ok">$</span> fetch {name}
      {"  "}
      <span className="text-accent">{bar(p, 14)}</span>
      {"  "}
      {total ? `${kb(got)}/${kb(total)} KB` : `${kb(got)} KB`}
    </p>
  );
}

/** Same bar for a <video>: how much of it is buffered, until it can play. */
export function BufferBar({ video, className }: { video: HTMLVideoElement | null; className?: string }) {
  const [p, setP] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!video) return;
    const measure = () => {
      if (video.readyState >= 3) setReady(true);
      const d = video.duration;
      if (d && video.buffered.length) setP(Math.min(1, video.buffered.end(video.buffered.length - 1) / d));
    };
    measure();
    const evs = ["progress", "loadeddata", "canplay", "canplaythrough"];
    evs.forEach((e) => video.addEventListener(e, measure));
    return () => evs.forEach((e) => video.removeEventListener(e, measure));
  }, [video]);

  if (ready) return null;
  return (
    <p className={cn("pointer-events-none whitespace-pre border border-line bg-bg/90 px-2 py-0.5 font-mono text-[10px] text-fg-3", className)}>
      <span className="text-ok">$</span> buffering <span className="text-accent">{bar(p, 14)}</span>
    </p>
  );
}
