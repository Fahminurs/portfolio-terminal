"use client";

import { profile, sections } from "@/content/data";
import { cn, scrollToId } from "@/lib/utils";
import { useShell } from "./ShellProvider";

export function Titlebar() {
  const { setPaletteOpen } = useShell();
  return (
    <div className="sticky top-0 z-40 flex h-9 print:hidden items-center justify-between border-b border-line bg-bg/95 px-4 text-[11px] text-fg-2 md:px-8">
      <div className="flex items-center gap-1.5" aria-hidden>
        <span className="size-2.5 rounded-full border border-line-2" />
        <span className="size-2.5 rounded-full border border-line-2" />
        <span className="size-2.5 rounded-full border border-line-2" />
      </div>
      <button
        onClick={() => setPaletteOpen(true)}
        className="hidden items-center gap-2 text-fg-3 transition-colors hover:text-fg-2 md:flex"
      >
        <span className="text-fg-2">guest@fahmi</span>: ~/portfolio — zsh
        <kbd className="border border-line px-1.5 py-px text-[10px] text-fg-3">/</kbd>
      </button>
      <nav aria-label="Social" className="flex items-center gap-1">
        {profile.socials.map((s) => (
          <a
            key={s.short}
            href={s.href}
            target="_blank"
            rel="noreferrer"
            className="border border-line px-2 py-1.5 text-[10px] text-fg-2 sm:py-0.5 transition-colors hover:border-accent hover:text-accent"
          >
            <span className="text-fg-3">{s.short}</span>
            <span className="ml-1.5 hidden sm:inline">{s.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}

/** Desktop vertical pane switcher — successor of the wireframe's sidebar. */
export function PaneNav() {
  const { active } = useShell();
  return (
    <aside className="sticky top-0 hidden h-dvh print:hidden flex-col items-center justify-between border-r border-line bg-bg py-5 md:flex">
      <a
        href="#index"
        className="font-display text-[13px] tracking-[0.15em] text-fg [writing-mode:vertical-rl] rotate-180"
      >
        FAHMI<span className="text-accent">.</span>DEV
      </a>
      <nav aria-label="Sections" className="flex flex-col items-center gap-1">
        {sections.map((s) => {
          const on = active === s.id;
          return (
            <button
              key={s.id}
              onClick={() => scrollToId(s.id)}
              aria-current={on ? "true" : undefined}
              title={`${s.n} — ${s.label}`}
              className={cn(
                "group relative flex w-14 flex-col items-center py-2 text-[10px] transition-colors",
                on ? "text-accent" : "text-fg-3 hover:text-fg",
              )}
            >
              <span
                className={cn(
                  "absolute left-0 top-1/2 h-5 w-px -translate-y-1/2 bg-accent transition-opacity",
                  on ? "opacity-100" : "opacity-0",
                )}
              />
              <span className="tabular-nums">{s.n}</span>
              {/* always visible on touch tablets (no hover); hover-reveal on laptop */}
              <span className="mt-1 text-[8.5px] tracking-wider opacity-70 transition-opacity group-hover:opacity-100 group-aria-[current]:opacity-100 xl:opacity-0">
                {s.label.slice(0, 4)}
              </span>
            </button>
          );
        })}
      </nav>
      <span className="size-1.5 rounded-full bg-ok pulse-dot" title="online" />
    </aside>
  );
}
