"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

export const KEYS_EVENT = "fahmi:keys";

const KEYS: [string, string][] = [
  ["/  ·  Ctrl K", "cari & jalankan command"],
  ["0 – 7", "lompat ke bab"],
  ["j / k", "pindah projek (▶ kursor)"],
  ["Enter", "inspect projek terpilih"],
  ["← / →", "geser filter Archive (saat fokus)"],
  ["Tab · ↑ ↓", "lengkapi / riwayat di prompt"],
  ["q · Esc", "tutup dialog, resume, kursor"],
  ["?", "tampilkan bantuan ini"],
];

function isTyping(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null;
  return !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
}

/** `?` → keybinding cheat-sheet as a Turbo-Vision-style dialog (§5.11). */
export function KeyHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e)) return;
      if (e.key === "?") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (open && (e.key === "Escape" || e.key === "q")) setOpen(false);
    };
    const onEvent = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(KEYS_EVENT, onEvent);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(KEYS_EVENT, onEvent);
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-bg/80 px-4 print:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Bantuan keyboard"
            className="tui-shadow relative w-full max-w-md border-[3px] border-double border-line-2 bg-surface px-5 pb-4 pt-6 text-[12px]"
            style={{ "--tui-bg": "var(--color-surface)" } as React.CSSProperties}
          >
            <span className="tui-title left-1/2 -translate-x-1/2 text-fg-2">
              ╡ <span className="text-accent">?</span> bantuan keyboard ╞
            </span>
            <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2">
              {KEYS.map(([k, d]) => (
                <div key={k} className="contents">
                  <dt className="whitespace-nowrap text-accent">{k}</dt>
                  <dd className="text-fg-2">{d}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-5 flex justify-center">
              <button
                autoFocus
                onClick={() => setOpen(false)}
                className="tui-sel px-4 py-1 font-bold"
              >
                [ OK ]
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
