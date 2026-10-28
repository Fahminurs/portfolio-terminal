"use client";

import "asciinema-player/dist/bundle/asciinema-player.css";
import { useEffect, useRef } from "react";
import { useCalm } from "@/lib/calm";
import { NoSignal } from "@/components/ui/NoSignal";

type Props = {
  /** /casts/*.cast — real `asciinema rec` output only (§6.7-A) */
  src?: string;
  label: string;
  cols?: number;
  rows?: number;
};

/** asciinema recording, loaded only when scrolled near. Missing cast → [ no signal ]. */
export function CastPlayer({ src, label, cols = 100, rows = 22 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const calm = useCalm();

  useEffect(() => {
    const el = ref.current;
    if (!src || !el) return;
    let player: { dispose(): void } | undefined;
    let cancelled = false;
    const io = new IntersectionObserver(
      async ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const { create } = await import("asciinema-player");
        if (cancelled) return;
        player = create(src, el, {
          cols,
          rows,
          autoPlay: !calm,
          idleTimeLimit: 1,
          theme: "fahmi",
          fit: "width",
          poster: "npt:0:2",
          terminalFontFamily: "var(--font-jetbrains), monospace",
          controls: "auto",
        });
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => {
      cancelled = true;
      io.disconnect();
      player?.dispose();
    };
  }, [src, cols, rows, calm]);

  if (!src)
    return <NoSignal label={label} reason="rekaman asciinema belum ada — lihat PRD §11.7" />;

  return (
    <figure className="border border-line bg-bg">
      <figcaption className="border-b border-line px-3 py-1.5 text-[10px] text-fg-3">
        <span className="text-fg-2">$ asciinema play</span> {label}
      </figcaption>
      <div ref={ref} className="min-h-40" />
    </figure>
  );
}
