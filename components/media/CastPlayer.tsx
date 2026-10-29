"use client";

import "asciinema-player/dist/bundle/asciinema-player.css";
import { useEffect, useRef } from "react";
import { useCalm } from "@/lib/calm";
import { NoSignal } from "@/components/ui/NoSignal";
import { TuiWindow } from "@/components/ui/TuiWindow";

type Props = {
  /** /casts/*.cast — real `asciinema rec` output only (§6.7-A) */
  src?: string;
  label: string;
  cols?: number;
  rows?: number;
  on?: "bg" | "surface";
};

/** asciinema recording, loaded only when scrolled near. Missing cast → [ no signal ]. */
/** cols/rows default to the recording's own header size */
export function CastPlayer({ src, label, cols, rows, on }: Props) {
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
    <TuiWindow on={on} title={<>asciinema play {label}</>}>
      <div ref={ref} className="min-h-40" />
    </TuiWindow>
  );
}
