import { cn } from "@/lib/utils";

type Props = {
  title: React.ReactNode;
  /** right side of the top border, e.g. a source link */
  right?: React.ReactNode;
  /** background behind the border titles — must match what the window sits on */
  on?: "bg" | "surface";
  className?: string;
  children: React.ReactNode;
};

/**
 * ncurses-style window: 1px frame with the title cut into the top border
 * (`┌─ title ──── [■] ┐`). Used for every "figure" so panes read as TUI windows.
 */
export function TuiWindow({ title, right, on = "bg", className, children }: Props) {
  return (
    <figure
      className={cn("tui-win relative mt-2 min-w-0 border border-line-2", on === "surface" ? "bg-surface" : "bg-bg", className)}
      style={{ "--tui-bg": on === "surface" ? "var(--color-surface)" : "var(--color-bg)" } as React.CSSProperties}
    >
      <figcaption className="tui-title left-3 max-w-[calc(100%-5rem)] truncate text-fg-2">
        <span aria-hidden className="text-fg-3">┤ </span>
        {title}
        <span aria-hidden className="text-fg-3"> ├</span>
      </figcaption>
      {right ? (
        <span className="tui-title right-3 hidden text-fg-3 sm:block">{right}</span>
      ) : (
        <span aria-hidden className="tui-title right-3 text-fg-3">
          [<span className="text-accent">■</span>]
        </span>
      )}
      <div className="pt-2">{children}</div>
    </figure>
  );
}
