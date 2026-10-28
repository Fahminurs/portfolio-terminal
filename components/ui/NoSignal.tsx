import { cn } from "@/lib/utils";

type Props = {
  /** chip in the corner, e.g. "video_demo.mp4" */
  label?: string;
  /** one line on what's missing — shown, not hidden (honest placeholder, §11.5) */
  reason?: string;
  className?: string;
};

/** Placeholder for media/data that doesn't exist yet. Never stock or AI imagery. */
export function NoSignal({ label, reason, className }: Props) {
  return (
    <div
      role="img"
      aria-label={`${label ?? "media"}: no signal${reason ? ` — ${reason}` : ""}`}
      className={cn("no-signal relative flex min-h-28 items-center justify-center border border-line", className)}
    >
      {label && (
        <span className="absolute left-2 top-2 border border-line bg-bg px-1.5 py-px text-[10px] text-fg-3">
          {label}
        </span>
      )}
      <div className="text-center">
        <p className="text-[12px] tracking-[0.2em] text-fg-2">[ no signal ]</p>
        {reason && <p className="mt-1 px-4 text-[10px] text-fg-3">{reason}</p>}
      </div>
    </div>
  );
}
