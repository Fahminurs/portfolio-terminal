"use client";

import { useEffect, useRef } from "react";
import { VOL_STEPS, setSfxOn, setSfxVolume, sfxOn, sfxVolume, useSfxOn, useSfxVolume } from "@/lib/sfx";
import { useCalm } from "@/lib/calm";
import { cn } from "@/lib/utils";

/**
 * `snd on/off` in the titlebar (`m` toggles it too) and next to it a volume meter in block cells:
 * click or drag along it, scroll the wheel over it, or use ←/→ when it's focused; `-` / `=` work
 * from anywhere. Sound is off anyway in calm mode.
 */
export function SfxToggle() {
  const on = useSfxOn();
  const calm = useCalm();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.ctrlKey || e.metaKey || e.altKey || document.querySelector("dialog[open]")) return;
      if (e.key === "m") setSfxOn(!sfxOn());
      else if (e.key === "-") setSfxVolume(sfxVolume() - 1);
      else if (e.key === "=" || e.key === "+") setSfxVolume(sfxVolume() + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const live = on && !calm;
  return (
    <div className="ml-2 flex shrink-0 items-center gap-1.5">
      <button
      onClick={() => setSfxOn(!on)}
      aria-pressed={live}
      disabled={calm}
      title={calm ? "suara mati di mode tenang" : "suara efek (m)"}
      className={cn(
        "flex shrink-0 items-center gap-1 whitespace-nowrap border px-1.5 py-px text-[10px] transition-colors disabled:opacity-40",
        live ? "border-accent text-accent" : "border-line text-fg-3 hover:text-fg-2",
      )}
    >
      <span aria-hidden>{live ? "♪" : "×"}</span>snd {live ? "on" : "off"}
      </button>
      <VolumeMeter disabled={!live} />
    </div>
  );
}

/** `▮▮▮▮▮▮▯▯▯▯ 60` — a 10-cell volume slider that reads like a VU meter */
function VolumeMeter({ disabled }: { disabled: boolean }) {
  const vol = useSfxVolume();
  const track = useRef<HTMLSpanElement>(null);
  const cells = useRef<HTMLSpanElement>(null);

  // the wheel needs a non-passive listener to keep the page from scrolling under it
  useEffect(() => {
    const el = track.current;
    if (!el || disabled) return;
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      setSfxVolume(sfxVolume() + (e.deltaY < 0 ? 1 : -1));
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => el.removeEventListener("wheel", wheel);
  }, [disabled]);

  // the cell under the pointer; left of the first cell is mute
  const at = (x: number) => {
    const r = cells.current!.getBoundingClientRect();
    return Math.ceil(((x - r.left) / r.width) * VOL_STEPS);
  };

  return (
    <span
      ref={track}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label="volume suara"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={vol * 10}
      aria-valuetext={`${vol * 10}%`}
      aria-disabled={disabled}
      title="volume (scroll / ←→ / - =)"
      onPointerDown={(e) => {
        if (disabled) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        setSfxVolume(at(e.clientX));
      }}
      onPointerMove={(e) => {
        if (!disabled && e.currentTarget.hasPointerCapture(e.pointerId)) setSfxVolume(at(e.clientX));
      }}
      onKeyDown={(e) => {
        if (disabled) return;
        const d = e.key === "ArrowRight" || e.key === "ArrowUp" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -1 : 0;
        if (e.key === "Home") setSfxVolume(0);
        else if (e.key === "End") setSfxVolume(VOL_STEPS);
        else if (!d) return;
        else setSfxVolume(vol + d);
        e.preventDefault();
      }}
      className={cn(
        "flex cursor-ew-resize touch-none select-none items-center gap-1 py-1 text-[10px] tabular-nums outline-offset-2",
        disabled ? "pointer-events-none opacity-40" : "text-fg-2",
      )}
    >
      <span ref={cells} aria-hidden className="flex gap-px">
        {Array.from({ length: VOL_STEPS }, (_, i) => (
          <span key={i} className={cn("h-2.5 w-[3px]", i < vol ? (i >= 8 ? "bg-err" : "bg-accent") : "bg-line-2")} />
        ))}
      </span>
      <span aria-hidden className="mr-3 w-[4ch] text-fg-3">
        {vol === 0 ? "mute" : vol * 10}
      </span>
    </span>
  );
}
