"use client";

import { useEffect, useRef } from "react";
import { play } from "@/lib/sfx";
import { cn } from "@/lib/utils";

export type Step = { label: string; done: boolean };

const WIDTH = 24; // bar cells

/** `[########............] 37%` — a terminal progress bar */
export function bar(p: number, width = WIDTH) {
  const n = Math.round(Math.min(1, Math.max(0, p)) * width);
  return `[${"#".repeat(n)}${".".repeat(width - n)}] ${String(Math.round(p * 100)).padStart(3, " ")}%`;
}

/**
 * A loader that reads like a terminal job: the command, one dotted line per real step with
 * `ok` once it's done (or a spinner while it isn't), and an ASCII bar. Ticks as the bar moves
 * and beeps when it's all done (lib/sfx — silent until the visitor has interacted).
 */
export function AsciiProgress({
  cmd,
  steps,
  progress,
  className,
}: {
  cmd: string;
  steps: Step[];
  progress: number;
  className?: string;
}) {
  const cells = Math.round(progress * WIDTH);
  const lastCells = useRef(cells);
  useEffect(() => {
    if (cells === lastCells.current) return;
    lastCells.current = cells;
    if (cells >= WIDTH) play("ok");
    else play("tick", 40);
  }, [cells]);

  const active = steps.findIndex((s) => !s.done);
  return (
    <div role="status" aria-live="polite" className={cn("font-mono text-[11px] leading-[1.65] text-fg-3", className)}>
      <p>
        <span className="text-ok">$</span> <span className="text-fg-2">{cmd}</span>
      </p>
      {steps.map((s, i) => (
        <p key={s.label} className="flex gap-2 whitespace-nowrap">
          <span className="min-w-0 truncate">
            {"  "}
            {s.label}
          </span>
          <span aria-hidden className="flex-1 overflow-hidden text-line-2">
            {".".repeat(40)}
          </span>
          {s.done ? (
            <span className="text-ok">ok</span>
          ) : i === active ? (
            <span className="ascii-spin text-accent" aria-label="sedang berjalan" />
          ) : (
            <span className="text-fg-3">--</span>
          )}
        </p>
      ))}
      <p className="mt-1 whitespace-pre text-accent">{bar(progress)}</p>
    </div>
  );
}
