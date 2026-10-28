"use client";

import { stackUses } from "@/content/data";
import { cn } from "@/lib/utils";

/** Hover/focus a tag → rows in Projects that use it get marked (§5.3). */
function mark(tag: string | null) {
  document.querySelectorAll(".stack-hit").forEach((el) => el.classList.remove("stack-hit"));
  if (!tag) return;
  for (const slug of stackUses[tag] ?? []) document.getElementById(`p-${slug}`)?.classList.add("stack-hit");
}

function Branch({ name, tags, last }: { name: string; tags: string[]; last?: boolean }) {
  return (
    <div className="flex flex-col gap-y-1 sm:flex-row sm:items-start">
      <span className="shrink-0 whitespace-pre text-fg-3">
        {last ? "└── " : "├── "}
        <span className="font-bold text-term-blue">{name.padEnd(12)}</span>
      </span>
      <ul className="flex flex-wrap gap-1.5 pl-4 sm:pl-0">
        {tags.map((t) => {
          const n = stackUses[t]?.length ?? 0;
          return (
            <li key={t}>
              <button
                type="button"
                onMouseEnter={() => mark(t)}
                onMouseLeave={() => mark(null)}
                onFocus={() => mark(t)}
                onBlur={() => mark(null)}
                title={n ? `dipakai di ${n} projek` : "hanya di repo archive"}
                className={cn(
                  "border border-line px-2 py-1.5 text-[11px] sm:px-1.5 sm:py-px transition-colors hover:border-accent hover:text-accent",
                  n ? "text-fg-2" : "text-fg-3",
                )}
              >
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

export function StackTree({ core, supporting }: { core: string[]; supporting: string[] }) {
  return (
    <div className="flex flex-col gap-2 text-[12px]">
      <span className="font-bold text-term-blue">stack/</span>
      <Branch name="core/" tags={core} />
      <Branch name="supporting/" tags={supporting} last />
      <p className="mt-1 text-[10px] text-fg-3"># hover sebuah tag → projek yang memakainya ditandai di [2] projects</p>
    </div>
  );
}
