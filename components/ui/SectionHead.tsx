import { DecryptedText } from "@/components/fx/DecryptedText";
import { TypeLine } from "@/components/fx/TypeLine";
import { cn } from "@/lib/utils";
import { Prompt } from "./Prompt";

type Props = {
  n: number;
  label: string;
  cmd: string;
  title: string;
  count?: string;
  right?: React.ReactNode;
  className?: string;
  /** static head (no typing / decrypt) — for the ~30% of sections kept calm on purpose */
  still?: boolean;
};

/** Pane label (tmux-style, replaces wireframe FIG tab) + prompt line + section title. */
export function SectionHead({ n, label, cmd, title, count, right, className, still }: Props) {
  return (
    <header className={cn("relative", className)}>
      <span className="absolute -top-px left-0 border border-t-0 border-line bg-bg px-2.5 py-0.5 text-[10px] tracking-wide text-fg-3 md:left-8">
        <span className="text-accent">[{n}]</span> {label}
      </span>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 px-4 pt-12 md:px-8">
        <div>
          <p className="mb-2 text-[11px] text-fg-3">
            <Prompt />
            {still ? <span className="text-fg">{cmd}</span> : <TypeLine text={cmd} cps={38} className="text-fg" />}
          </p>
          <h2 className="flex items-center gap-3 font-display text-[22px] uppercase tracking-[0.04em] text-fg md:text-[26px]">
            {still ? title : <DecryptedText text={title} trigger="view" />}
            {count && (
              <span className="bg-fg px-1.5 py-px font-mono text-[10px] tracking-normal text-bg">
                {count}
              </span>
            )}
          </h2>
        </div>
        {right && <div className="text-[11px] text-fg-3">{right}</div>}
      </div>
    </header>
  );
}
