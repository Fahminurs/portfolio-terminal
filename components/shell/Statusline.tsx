"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { sections } from "@/content/data";
import { cn, scrollToId } from "@/lib/utils";
import { useCalm } from "@/lib/calm";
import { Prompt } from "@/components/ui/Prompt";
import { useShell } from "./ShellProvider";

function useClockWIB() {
  const [t, setT] = useState("--:--");
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Jakarta",
    });
    const tick = () => setT(fmt.format(new Date()).replace(".", ":"));
    tick();
    const id = window.setInterval(tick, 15_000);
    return () => window.clearInterval(id);
  }, []);
  return t;
}

function useScrollPct() {
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setP(max > 0 ? Math.round((window.scrollY / max) * 100) : 0);
      });
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
  }, []);
  return p;
}

/**
 * tmux-style statusline, fixed to the bottom. Laptop: full tab strip. Phone + tablet: a
 * "§ n/7 label — semua bab" button that opens a sheet listing every section.
 */
export function Statusline() {
  const { active, setPaletteOpen, togglePlain } = useShell();
  const calm = useCalm();
  const clock = useClockWIB();
  const pct = useScrollPct();
  const tabsRef = useRef<HTMLDivElement>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSheetOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheetOpen]);

  // keep the active tab visible on mobile
  useEffect(() => {
    const el = tabsRef.current?.querySelector<HTMLElement>(`[data-pane="${active}"]`);
    el?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [active]);

  const current = sections.find((s) => s.id === active) ?? sections[0];

  return (
    <>
      <AnimatePresence>
        {sheetOpen && (
          <motion.div
            key="sheet-backdrop"
            className="fixed inset-0 z-40 bg-bg/70 xl:hidden print:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            onClick={() => setSheetOpen(false)}
          />
        )}
        {sheetOpen && (
          <motion.nav
            key="sheet"
            id="section-sheet"
            aria-label="Daftar bab"
            className="fixed inset-x-0 bottom-10 z-50 max-h-[70dvh] overflow-y-auto border-t border-line-2 bg-surface xl:hidden print:hidden"
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={{ duration: 0.16, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <p className="flex justify-between border-b border-line px-4 py-2 text-[11px] text-fg-3">
              <span>
                <Prompt />
                <span className="text-fg">ls ~/portfolio</span>
              </span>
              <span>{sections.length} bab</span>
            </p>
            <ul>
              {sections.map((s) => {
                const on = s.id === active;
                return (
                  <li key={s.id}>
                    <button
                      onClick={() => {
                        setSheetOpen(false);
                        scrollToId(s.id);
                      }}
                      aria-current={on ? "true" : undefined}
                      className={cn(
                        "flex min-h-11 w-full items-center gap-3 border-b border-line px-4 text-left text-[13px]",
                        on ? "tui-sel" : "text-fg-2 active:bg-raised",
                      )}
                    >
                      <span className={cn("w-6 tabular-nums", on ? "" : "text-fg-3")}>{on ? `▶${s.n}` : ` ${s.n}`}</span>
                      <span className="flex-1">
                        {s.label}
                        {on && "*"}
                      </span>
                      <span className={cn("hidden truncate text-[11px] sm:inline", on ? "opacity-70" : "text-fg-3")}># {s.cmd}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>

    <div className="fixed inset-x-0 bottom-0 z-50 flex h-10 items-stretch border-t border-line bg-surface text-[11px] xl:h-7 print:hidden">
      <button
        onClick={() => setPaletteOpen(true)}
        className="flex shrink-0 items-center gap-1.5 bg-accent px-3 font-bold text-bg"
        aria-label="Cari & jalankan command"
        title="Cari section, projek, atau command"
      >
        <span aria-hidden className="text-[13px] leading-none">⌕</span>
        cari
        <kbd className="hidden border border-bg/40 px-1 text-[9px] font-normal xl:inline">Ctrl K</kbd>
      </button>

      {/* phone + tablet: one button that lists every section */}
      <button
        onClick={() => setSheetOpen(!sheetOpen)}
        aria-expanded={sheetOpen}
        aria-controls="section-sheet"
        className="flex min-w-0 flex-1 items-center gap-2 px-3 text-left xl:hidden"
      >
        <span className="text-fg-3">§</span>
        <span className="tabular-nums text-accent">
          {current.n}/{sections.length - 1}
        </span>
        <span className="truncate text-fg">{current.label}</span>
        <span className="ml-auto shrink-0 text-fg-3">
          semua bab <span aria-hidden>{sheetOpen ? "▾" : "▴"}</span>
        </span>
      </button>

      <div
        ref={tabsRef}
        className="scrollbar-none hidden min-w-0 flex-1 items-stretch overflow-x-auto xl:flex"
      >
        {sections.map((s) => (
          <button
            key={s.id}
            data-pane={s.id}
            onClick={() => scrollToId(s.id)}
            className={cn(
              "shrink-0 px-2.5 transition-colors",
              active === s.id ? "tui-sel" : "text-fg-3 hover:bg-raised hover:text-fg-2",
            )}
          >
            {s.n}:{s.label}
            {active === s.id && "*"}
          </button>
        ))}
      </div>
      <button
        onClick={togglePlain}
        aria-pressed={calm}
        title="mode tenang: tanpa animasi"
        className={cn("hidden shrink-0 border-l border-line px-2.5 sm:block", calm ? "text-accent" : "text-fg-3 hover:text-fg-2")}
      >
        [plain]
      </button>
      <div className="hidden shrink-0 items-center gap-3 px-3 text-fg-2 lg:flex">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-ok pulse-dot" />
          OPEN_TO_WORK
        </span>
        <span className="text-line-2">│</span>
        <span>BDG {clock} WIB</span>
        <span className="text-line-2">│</span>
        <span className="w-9 text-right tabular-nums">{pct}%</span>
      </div>
      <div className="flex shrink-0 items-center border-l border-line px-2 tabular-nums text-fg-3 lg:hidden">{pct}%</div>
    </div>
    </>
  );
}
