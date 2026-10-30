"use client";

import { useState } from "react";
import { projects, stackUses } from "@/content/data";
import { cn } from "@/lib/utils";
import { langColor } from "@/lib/lang";
import { TechIcon } from "@/components/ui/TechIcon";

/** Hover/focus a tag → rows in Projects that use it get marked (§5.3). */
function mark(tag: string | null) {
  document.querySelectorAll(".stack-hit").forEach((el) => el.classList.remove("stack-hit"));
  if (!tag) return;
  for (const slug of stackUses[tag] ?? []) document.getElementById(`p-${slug}`)?.classList.add("stack-hit");
}

function Branch({
  name,
  tags,
  last,
  picked,
  pick,
}: {
  name: string;
  tags: string[];
  last?: boolean;
  picked: string | null;
  pick: (t: string) => void;
}) {
  return (
    <div className="flex flex-col gap-y-1 sm:flex-row sm:items-start">
      <span className="shrink-0 whitespace-pre text-fg-3">
        {last ? "└── " : "├── "}
        <span className="font-bold text-term-blue">{name.padEnd(12)}</span>
      </span>
      <ul className="flex flex-wrap gap-1.5 pl-4 sm:pl-0">
        {tags.map((t) => {
          const n = stackUses[t]?.length ?? 0;
          const on = picked === t;
          return (
            <li key={t}>
              <button
                type="button"
                onMouseEnter={() => mark(t)}
                onMouseLeave={() => mark(picked)}
                onFocus={() => mark(t)}
                onBlur={() => mark(picked)}
                onClick={() => pick(t)}
                aria-pressed={on}
                title={n ? `dipakai di ${n} projek` : "hanya di repo archive"}
                className={cn(
                  "group flex items-center gap-1.5 border px-2 py-1.5 text-[11px] sm:px-1.5 sm:py-px transition-colors hover:border-accent hover:text-accent",
                  on ? "border-accent text-accent" : "border-line",
                  !on && (n ? "text-fg-2" : "text-fg-3"),
                )}
              >
                <TechIcon name={t} className={cn(on ? "text-accent" : langColor(t, ""), "group-hover:text-accent")} />
                {t}
                {n > 0 && <sup className="ml-0.5 text-[8px] text-fg-3">×{n}</sup>}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * A tapped (or clicked) tag answers like `grep -l`: the projects that use it, each a jump link.
 * Touch screens have no hover, so this is how they get the cross-link at all.
 */
function Hits({ tag }: { tag: string }) {
  const hits = (stackUses[tag] ?? []).map((slug) => projects.find((p) => p.slug === slug)).filter((p) => !!p);
  return (
    <p className="mt-1 text-[11px] leading-[1.7]" aria-live="polite">
      <span className="text-fg-3">$ grep -l {tag} ./projects</span>
      <br />
      <span className="text-accent">→ </span>
      {hits.length ? (
        hits.map((p, i) => (
          <span key={p.slug}>
            {i > 0 && <span className="text-fg-3"> · </span>}
            <a href={`#p-${p.slug}`} className="text-fg underline decoration-dotted underline-offset-4 hover:text-accent">
              {p.title}
            </a>
          </span>
        ))
      ) : (
        <span className="text-fg-3">tidak ada di projek — hanya di repo archive</span>
      )}
    </p>
  );
}

export function StackTree({ core, supporting }: { core: string[]; supporting: string[] }) {
  const [picked, setPicked] = useState<string | null>(null);
  const pick = (t: string) => {
    const next = picked === t ? null : t;
    setPicked(next);
    mark(next);
  };
  return (
    <div className="flex flex-col gap-2 text-[12px]">
      <span className="font-bold text-term-blue">stack/</span>
      <Branch name="core/" tags={core} picked={picked} pick={pick} />
      <Branch name="supporting/" tags={supporting} last picked={picked} pick={pick} />
      {picked ? (
        <Hits tag={picked} />
      ) : (
        <p className="mt-1 text-[10px] text-fg-3"># tap / hover sebuah tag → projek yang memakainya ditandai di [2] projects</p>
      )}
    </div>
  );
}
