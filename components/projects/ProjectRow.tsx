"use client";

import { useEffect, useId, useState } from "react";
import type { Project } from "@/content/data";
import { cn, OPEN_PROJECT_EVENT } from "@/lib/utils";

type Props = {
  project: Project;
  index: number;
  media: React.ReactNode;
  /** server-rendered expand body; absent → row isn't expandable */
  details?: React.ReactNode;
};

function StatusBadge({ status }: { status: Project["status"] }) {
  if (!status) return null;
  if (status.kind === "progress")
    return (
      <span className="flex items-center gap-1.5 border border-warn/50 px-1.5 py-px text-[10px] text-warn">
        <span className="size-1.5 rounded-full bg-warn pulse-dot" /> IN PROGRESS
      </span>
    );
  if (status.kind === "skripsi")
    return <span className="border border-line-2 px-1.5 py-px text-[10px] text-fg-2">SKRIPSI</span>;
  return (
    <span className="border-[3px] border-double border-accent px-1.5 text-[10px] font-bold text-accent">
      {status.place === 2 ? "II" : "III"} PLACE
    </span>
  );
}

export function ProjectRow({ project: p, index, media, details }: Props) {
  const [open, setOpen] = useState(false);
  const bodyId = useId();

  // `open <slug>` from the command palette
  useEffect(() => {
    const on = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== p.slug) return;
      if (details) setOpen(true);
      document.getElementById(`p-${p.slug}`)?.scrollIntoView({ block: "start" });
    };
    window.addEventListener(OPEN_PROJECT_EVENT, on);
    return () => window.removeEventListener(OPEN_PROJECT_EVENT, on);
  }, [p.slug, details]);

  const flip = index % 2 === 1;

  return (
    // last row: the section's own border-b closes it — a second line would sit above the next pane label
    <article id={`p-${p.slug}`} className="border-b border-line last:border-b-0">
      <div className={cn("grid md:grid-cols-[340px_1fr]", flip && "md:grid-cols-[1fr_340px]")}>
        <div className={cn("p-4 md:p-6 print:hidden", flip && "md:order-2")}>{media}</div>
        <div className={cn("flex flex-col gap-3 border-line p-4 md:p-6", flip ? "md:border-r" : "md:border-l")}>
          <div className="flex flex-wrap items-center gap-2 text-[10px] text-fg-3">
            <span className="tabular-nums text-accent">{String(index + 1).padStart(2, "0")}</span>
            <span>{p.category}</span>
            <StatusBadge status={p.status} />
          </div>
          <h3 className="font-display text-[22px] leading-tight text-fg">{p.title}</h3>
          <p className="text-[11px] text-fg-3">{p.period}</p>
          <p className="max-w-[62ch] font-prose text-[14px] leading-[1.65] text-fg-2">{p.summary}</p>
          <ul className="flex flex-wrap gap-1.5" aria-label="Stack">
            {p.stack.map((s) => (
              <li key={s} className="border border-line px-1.5 py-px text-[10.5px] text-fg-2">
                <span className="text-fg-3">{s[0]}·</span>
                {s}
              </li>
            ))}
          </ul>
          <div className="mt-auto flex flex-wrap gap-2 pt-2 text-[11.5px]">
            {details && (
              <button
                onClick={() => setOpen(!open)}
                aria-expanded={open}
                aria-controls={bodyId}
                className="border border-line-2 px-3 py-1.5 text-fg-2 transition-colors hover:border-accent hover:text-accent"
              >
                <span className="text-fg-3">$ </span>
                {open ? "collapse" : `inspect ${p.slug}`}
              </button>
            )}
            {p.repo && (
              <a
                href={p.repo}
                target="_blank"
                rel="noreferrer"
                className="border border-line px-3 py-1.5 text-fg-3 transition-colors hover:border-fg-2 hover:text-fg"
              >
                View Repo ↗
              </a>
            )}
          </div>
        </div>
      </div>
      {details && (
        <div id={bodyId} hidden={!open} className="border-t border-dashed border-line-2 bg-surface px-4 py-5 md:px-6">
          {details}
        </div>
      )}
    </article>
  );
}
