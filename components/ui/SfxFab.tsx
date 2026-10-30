"use client";

import { useEffect, useRef, useState } from "react";
import { VOL_STEPS, setSfxOn, setSfxVolume, sfxOn, sfxVolume, useSfxOn, useSfxVolume } from "@/lib/sfx";
import { useCalm } from "@/lib/calm";
import { cn } from "@/lib/utils";

const HOLD_MS = 380; // touch: hold the button this long and the slider comes up under the finger
const LINGER_MS = 1400; // touch: the slider stays this long after the finger lifts

/**
 * Volume as a floating button, bottom-right above the statusline. The pixel speaker shows the
 * level (0–3 waves, or crossed out when muted); a click / tap mutes and unmutes.
 * The slider is a column of 10 cells above it: with a mouse it opens on hover (drag or scroll
 * along it); on a phone, hold the button and slide the finger up and down, let go to set.
 * Keys from anywhere: m mutes, - / = step the volume. Hidden in calm mode (sound is off there).
 */
export function SfxFab() {
  const on = useSfxOn();
  const vol = useSfxVolume();
  const calm = useCalm();
  const [open, setOpen] = useState(false);
  const cells = useRef<HTMLSpanElement>(null);
  const shut = useRef(0);
  const press = useRef<{ id: number; timer: number; held: boolean } | null>(null);
  const swallow = useRef(false); // the click that ends a hold isn't a tap
  const muted = !on || vol === 0;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.ctrlKey || e.metaKey || e.altKey || document.querySelector("dialog[open]")) return;
      if (e.key === "m") toggle();
      else if (e.key === "-") setSfxVolume(sfxVolume() - 1);
      else if (e.key === "=" || e.key === "+") setSfxVolume(sfxVolume() + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // the wheel needs a non-passive listener to keep the page from scrolling under it
  useEffect(() => {
    const el = cells.current?.parentElement;
    if (!el || !open) return;
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      setSfxVolume(sfxVolume() + (e.deltaY < 0 ? 1 : -1));
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => el.removeEventListener("wheel", wheel);
  }, [open]);

  if (calm) return null;

  // the cell under the pointer, counted from the bottom; below the bottom cell is mute
  const at = (y: number) => {
    const r = cells.current!.getBoundingClientRect();
    return Math.ceil(((r.bottom - y) / r.height) * VOL_STEPS);
  };
  const show = () => {
    clearTimeout(shut.current);
    setOpen(true);
  };
  const hide = (ms: number) => {
    clearTimeout(shut.current);
    shut.current = window.setTimeout(() => setOpen(false), ms);
  };

  return (
    <div
      className="fixed bottom-14 right-4 z-40 flex flex-col items-center print:hidden xl:bottom-10"
      onPointerEnter={(e) => e.pointerType === "mouse" && show()}
      onPointerLeave={(e) => e.pointerType === "mouse" && hide(250)}
      onFocus={show}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && hide(0)}
    >
      {/* slider: a column of cells, loudest at the top */}
      <div
        role="slider"
        tabIndex={open ? 0 : -1}
        aria-label="volume suara"
        aria-orientation="vertical"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={vol * 10}
        aria-valuetext={vol === 0 ? "mute" : `${vol * 10}%`}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          setSfxVolume(at(e.clientY));
        }}
        onPointerMove={(e) => e.currentTarget.hasPointerCapture(e.pointerId) && setSfxVolume(at(e.clientY))}
        onKeyDown={(e) => {
          const d = e.key === "ArrowUp" || e.key === "ArrowRight" ? 1 : e.key === "ArrowDown" || e.key === "ArrowLeft" ? -1 : 0;
          if (e.key === "Home") setSfxVolume(0);
          else if (e.key === "End") setSfxVolume(VOL_STEPS);
          else if (!d) return;
          else setSfxVolume(vol + d);
          e.preventDefault();
        }}
        className={cn(
          "mb-2 flex cursor-ns-resize touch-none select-none flex-col items-center gap-1.5 border border-line-2 bg-surface px-2 pb-2 pt-1.5 text-[10px] tabular-nums text-fg-3 transition-[opacity,transform] duration-150",
          open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0",
        )}
      >
        <span aria-hidden className="w-[4ch] text-center">
          {muted ? "mute" : vol * 10}
        </span>
        <span ref={cells} aria-hidden className="flex flex-col-reverse gap-px">
          {Array.from({ length: VOL_STEPS }, (_, i) => (
            <span
              key={i}
              className={cn("h-[5px] w-4", i < vol && on ? (i >= 8 ? "bg-err" : "bg-accent") : "bg-line-2")}
            />
          ))}
        </span>
      </div>

      <button
        aria-label={muted ? "nyalakan suara" : "matikan suara"}
        aria-pressed={!muted}
        title={muted ? "nyalakan suara (m)" : "matikan suara (m) · tahan untuk atur volume"}
        onPointerDown={(e) => {
          if (e.pointerType === "mouse") return;
          // touch: a hold brings the slider up under the finger, then the same finger drags it
          const id = e.pointerId;
          e.currentTarget.setPointerCapture(id);
          press.current = {
            id,
            held: false,
            timer: window.setTimeout(() => {
              if (press.current) press.current.held = true;
              navigator.vibrate?.(8);
              show();
            }, HOLD_MS),
          };
        }}
        onPointerMove={(e) => {
          if (press.current?.held && press.current.id === e.pointerId) setSfxVolume(at(e.clientY));
        }}
        onPointerUp={() => {
          const p = press.current;
          press.current = null;
          if (!p) return;
          clearTimeout(p.timer);
          if (p.held) {
            swallow.current = true;
            hide(LINGER_MS);
          }
        }}
        onPointerCancel={() => {
          if (press.current) clearTimeout(press.current.timer);
          press.current = null;
        }}
        onContextMenu={(e) => e.preventDefault()}
        onClick={() => {
          if (swallow.current) return void (swallow.current = false);
          toggle();
        }}
        className={cn(
          "grid size-11 touch-none select-none place-items-center border bg-surface transition-colors",
          muted ? "border-line-2 text-fg-3 hover:text-fg-2" : "border-accent text-accent hover:bg-accent hover:text-bg",
        )}
      >
        <Speaker level={muted ? -1 : vol >= 7 ? 3 : vol >= 4 ? 2 : 1} />
      </button>
    </div>
  );
}

/** mute / unmute; unmuting at volume 0 brings it back to half */
function toggle() {
  if (sfxOn() && sfxVolume() > 0) return setSfxOn(false);
  if (sfxVolume() === 0) setSfxVolume(VOL_STEPS / 2);
  setSfxOn(true);
}

/** a 1-bit speaker: 0–3 waves, or a cross when muted (level -1) */
function Speaker({ level }: { level: number }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="size-5" shapeRendering="crispEdges" fill="currentColor">
      <path d="M1 6h3v4H1zM4 5h1v6H4zM5 4h1v8H5zM6 3h1v10H6zM7 2h1v12H7z" />
      {level === -1 ? (
        <path d="M10 5h1v1h-1zM11 6h1v1h-1zM12 7h1v2h-1zM13 6h1v1h-1zM14 5h1v1h-1zM11 9h1v1h-1zM10 10h1v1h-1zM13 9h1v1h-1zM14 10h1v1h-1z" />
      ) : (
        <>
          {level >= 1 && <path d="M9 6h1v4H9z" />}
          {level >= 2 && <path d="M11 5h1v1h-1zM12 6h1v4h-1zM11 10h1v1h-1z" />}
          {level >= 3 && <path d="M13 3h1v1h-1zM14 4h1v8h-1zM13 12h1v1h-1z" />}
        </>
      )}
    </svg>
  );
}
