"use client";

import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useEffect, useState } from "react";
import { repoFilters, REPO_TOTAL, type Repo, type RepoCat } from "@/content/data";
import { scrollToId, cn } from "@/lib/utils";
import { useCalm } from "@/lib/calm";

type Cat = "all" | RepoCat;
const ids = repoFilters.map((f) => f.id);

/** Ruler-style dial (ported from the wireframe, §5.5) + 2-col repo grid. Synced to ?cat=. */
export function RepoGrid({ repos }: { repos: Repo[] }) {
  const calm = useCalm();
  const [cat, setCat] = useState<Cat>("all");

  useEffect(() => {
    const q = new URLSearchParams(location.search).get("cat") as Cat | null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read URL after hydration
    if (q && ids.includes(q)) setCat(q);
  }, []);

  const choose = (c: Cat) => {
    setCat(c);
    const url = new URL(location.href);
    if (c === "all") url.searchParams.delete("cat");
    else url.searchParams.set("cat", c);
    history.replaceState(null, "", url);
  };

  const count = (c: Cat) => (c === "all" ? repos.length : repos.filter((r) => r.cats.includes(c)).length);
  const shown = cat === "all" ? repos : repos.filter((r) => r.cats.includes(cat));
  const spring = calm ? { duration: 0 } : { type: "spring" as const, stiffness: 420, damping: 34 };

  const onKey = (e: React.KeyboardEvent) => {
    const i = ids.indexOf(cat);
    if (e.key === "ArrowRight") choose(ids[Math.min(i + 1, ids.length - 1)]);
    else if (e.key === "ArrowLeft") choose(ids[Math.max(i - 1, 0)]);
    else return;
    e.preventDefault();
  };

  return (
    <div>
      <div className="px-4 pt-6 md:px-8">
        <p className="mb-3 text-center text-[11px] text-fg-3 wf:text-left">
          {cat === "all" ? (
            <>
              <span className="text-fg-2">git log --repos</span> → {repos.length} shown / {REPO_TOTAL} total
            </>
          ) : (
            <>
              <span className="text-fg-2">grep -c &quot;{cat}&quot;</span> → <span className="text-accent">{shown.length}</span>
            </>
          )}
        </p>
        <p className="mb-3 text-center text-[10px] uppercase tracking-[0.06em] text-fg-3 wf:mb-5 wf:text-left">
          Select category — klik tick untuk filter
        </p>
        {/* ≥1280px: ruler dial. Below (phone + tablet): centered wrapping chips, as in the wireframe */}
        <LayoutGroup>
          <div
            role="radiogroup"
            aria-label="Filter kategori repo"
            onKeyDown={onKey}
            className="flex flex-wrap justify-center gap-2 wf:flex-nowrap wf:justify-start wf:gap-0 wf:border-b-2 wf:border-line-2"
          >
            {repoFilters.map((f) => {
              const on = f.id === cat;
              const n = count(f.id);
              return (
                <button
                  key={f.id}
                  role="radio"
                  aria-checked={on}
                  tabIndex={on ? 0 : -1}
                  disabled={n === 0}
                  onClick={() => choose(f.id)}
                  className={cn(
                    "group relative flex items-baseline gap-1.5 border px-3 py-2 text-[11px] transition-colors disabled:opacity-30",
                    "wf:flex-1 wf:flex-col wf:items-center wf:gap-0 wf:border-0 wf:px-0 wf:pb-2 wf:pt-5 wf:text-[10.5px]",
                    on
                      ? "border-accent bg-accent text-bg wf:bg-transparent"
                      : "border-line-2 text-fg-2 hover:border-fg-2 hover:text-fg",
                  )}
                >
                  {on && (
                    <motion.span
                      layoutId="dial-pointer"
                      transition={spring}
                      aria-hidden
                      className="absolute top-0 hidden h-0 w-0 border-x-[5px] border-t-[7px] border-x-transparent border-t-accent wf:block"
                    />
                  )}
                  <span className={cn(on && "font-bold wf:text-accent", !on && "wf:text-fg-2 wf:group-hover:text-fg")}>
                    {f.label}
                  </span>
                  <span className={cn("tabular-nums", on ? "opacity-70 wf:text-fg-3 wf:opacity-100" : "text-fg-3", "wf:mt-0.5")}>
                    {n}
                  </span>
                  <span
                    aria-hidden
                    className={cn(
                      "absolute -bottom-0.5 hidden w-px bg-line-2 transition-all wf:block",
                      on ? "h-3 w-0.5 bg-accent" : "h-1.5",
                    )}
                  />
                </button>
              );
            })}
          </div>
        </LayoutGroup>
      </div>

      <motion.ul layout={!calm} className="mt-6 grid grid-cols-2 border-t border-line">
        <AnimatePresence initial={false} mode="popLayout">
          {shown.map((r, i) => (
            <motion.li
              key={r.name}
              layout={!calm}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: calm ? 0 : 0.18 }}
              className={cn(
                "flex min-w-0 flex-col gap-2 border-b border-line p-3 wf:p-4 wf:px-8",
                i % 2 === 0 && "border-r",
                i === shown.length - 1 && i % 2 === 0 && "col-span-2 border-r-0",
                // filtered view has no "+N repos" row, so the bottom row must not double the section border
                cat !== "all" && i >= shown.length - (shown.length % 2 || 2) && "border-b-0",
              )}
            >
              <h3 className="truncate text-[11px] font-bold text-fg wf:text-[13px]">{r.name}</h3>
              <p className="font-prose text-[11.5px] leading-[1.55] text-fg-2 wf:text-[13px] wf:leading-[1.6]">{r.desc}</p>
              {/* ≤850px: meta row + full-width action, stacked (wireframe repo-footer) */}
              <div className="mt-auto flex flex-col gap-2 text-[10px] wf:flex-row wf:items-center wf:justify-between wf:text-[10.5px]">
                <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <span className="border border-line px-1.5 text-fg-3 wf:border-0 wf:px-0">{r.lang ?? "—"}</span>
                  <span
                    title={r.estimated ? "perkiraan" : undefined}
                    className={cn("text-fg-3", r.estimated && "underline decoration-dashed underline-offset-2")}
                  >
                    {r.date}
                  </span>
                </span>
                <span className="flex flex-col gap-1.5 wf:flex-row wf:gap-3">
                  {r.inProjects && (
                    <button
                      onClick={() => scrollToId("projects")}
                      className="border border-line py-2 text-fg-3 hover:border-accent hover:text-accent wf:border-0 wf:py-0"
                    >
                      ↑ Lihat di Projek
                    </button>
                  )}
                  {r.href ? (
                    <a
                      href={r.href}
                      target="_blank"
                      rel="noreferrer"
                      className="border border-line-2 py-2 text-center text-fg-2 hover:border-accent hover:text-accent wf:border-0 wf:py-0"
                    >
                      View Repo ↗
                    </a>
                  ) : (
                    <span className="border border-dashed border-err/60 py-2 text-center text-err wf:px-1.5 wf:py-0">
                      PRIVATE
                    </span>
                  )}
                </span>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
        {cat === "all" && (
          <li className="col-span-full p-4 text-center text-[11px] text-fg-3 md:px-8">
            + {REPO_TOTAL - repos.length} repositories lainnya —{" "}
            <a href="https://github.com/Fahminurs?tab=repositories" target="_blank" rel="noreferrer" className="inline-block py-1.5 text-fg-2 hover:text-accent">
              github.com/Fahminurs ↗
            </a>
          </li>
        )}
      </motion.ul>
    </div>
  );
}
