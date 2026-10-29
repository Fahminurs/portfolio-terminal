"use client";

import { useCalm } from "@/lib/calm";
import { cn } from "@/lib/utils";

type Props = {
  /** short muted loop shown in place */
  src: string;
  poster: string;
  label: string;
  /** e.g. "putar demo 4:15" — the full video opens on click */
  cta: string;
  className?: string;
};

/** Card media that is already moving: a silent teaser loop (poster only in calm mode). */
export function LoopVideo({ src, poster, label, cta, className }: Props) {
  const calm = useCalm();
  return (
    <div className={cn("relative aspect-[4/3] overflow-hidden border border-line bg-bg", className)}>
      <video
        key={String(calm)}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        autoPlay={!calm}
        preload={calm ? "none" : "auto"}
        aria-hidden
        className="absolute inset-0 size-full object-cover"
      />
      <span className="absolute left-2 top-2 border border-line bg-bg px-1.5 py-px text-[10px] text-fg-3">{label}</span>
      <span className="absolute inset-0 grid place-items-center">
        <span className="border border-accent bg-bg/85 px-2.5 py-1 text-[11px] text-accent transition-colors group-hover:bg-accent group-hover:text-bg">
          ▶ {cta}
        </span>
      </span>
    </div>
  );
}
