"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { resumeDoc } from "@/content/data";
import { useShell } from "@/components/shell/ShellProvider";
import { useCalm } from "@/lib/calm";

/** `less resume.pdf` fires this right after opening: show every page at once, no print run */
export const RESUME_FF_EVENT = "fahmi:resume-ff";

const PAGE_MS = 2600; // one page through the printer
const BANDS = 44; // passes of the head per page

/**
 * Where page `t` (0..1) has got to. The head prints in bands and is bidirectional like a real
 * dot-matrix: even bands sweep left → right, odd bands right → left.
 */
function pass(t: number) {
  const f = Math.min(1, Math.max(0, t)) * BANDS;
  const band = Math.min(BANDS - 1, Math.floor(f));
  const x = f >= BANDS ? 1 : f - band;
  const ltr = band % 2 === 0;
  return { band, head: ltr ? x : 1 - x, ltr, top: (band / BANDS) * 100, bottom: ((band + 1) / BANDS) * 100 };
}

/** Everything above the current band, plus the part of the band the head has already crossed. */
function clipFor(t: number) {
  if (t <= 0) return "inset(0 0 100% 0)";
  if (t >= 1) return undefined;
  const { head, ltr, top, bottom } = pass(t);
  const x = `${head * 100}%`;
  return ltr
    ? `polygon(0 0, 100% 0, 100% ${top}%, ${x} ${top}%, ${x} ${bottom}%, 0 ${bottom}%)`
    : `polygon(0 0, 100% 0, 100% ${bottom}%, ${x} ${bottom}%, ${x} ${top}%, 0 ${top}%)`;
}

function Page({ src, w, h, n, t }: { src: string; w: number; h: number; n: number; t: number }) {
  const printing = t > 0 && t < 1;
  const { head, top, bottom } = pass(t);
  return (
    <div className="resume-paper">
      <div className="relative bg-white" style={{ aspectRatio: `${w} / ${h}` }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- a fixed rendered page; clip-path drives the reveal */}
        <img
          src={src}
          alt={`CV Fahmi Nursafaat — halaman ${n}`}
          width={w}
          height={h}
          className="absolute inset-0 size-full"
          style={{ clipPath: clipFor(t) }}
          draggable={false}
        />
        {printing && (
          <>
            {/* ribbon across the band being printed */}
            <div aria-hidden className="resume-ribbon" style={{ top: `${top}%`, height: `${bottom - top}%` }} />
            {/* the head itself, riding the ribbon */}
            <div aria-hidden className="resume-head" style={{ top: `${(top + bottom) / 2}%`, left: `${head * 100}%` }} />
          </>
        )}
      </div>
    </div>
  );
}

/**
 * `view-resume` / `lpr resume`: the real CV goes through a dot-matrix printer. Each page sits on
 * continuous-form paper (sprocket strips, perforation between pages) and the image is laid down
 * band by band by a head that sweeps both ways. [f] form-feeds to the end, [d] downloads the
 * original PDF, [q] / Esc closes. A panel under the hero, not a modal (§5.2).
 */
export function ResumePanel() {
  const { resumeOpen, setResumeOpen } = useShell();
  return (
    <AnimatePresence initial={false}>
      {resumeOpen && (
        <motion.section
          id="resume"
          aria-label="Resume"
          initial={{ height: 0 }}
          animate={{ height: "auto" }}
          exit={{ height: 0 }}
          transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
          className="overflow-hidden border-b border-line bg-surface print:hidden"
        >
          <Printer onClose={() => setResumeOpen(false)} />
        </motion.section>
      )}
    </AnimatePresence>
  );
}

function Printer({ onClose }: { onClose: () => void }) {
  const calm = useCalm();
  const n = resumeDoc.pages.length;
  const [t, setT] = useState(calm ? n : 0); // pages printed so far, 0..n
  const skip = useRef(false);
  const download = useRef<HTMLAnchorElement>(null);
  const done = t >= n;

  useEffect(() => {
    if (calm) return;
    let raf = 0;
    const t0 = performance.now();
    const step = (now: number) => {
      const v = skip.current ? n : Math.min(n, (now - t0) / PAGE_MS);
      setT(v);
      if (v < n) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [calm, n]);

  useEffect(() => {
    const ff = () => (skip.current = true);
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      if (document.querySelector("dialog[open]") || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "f") ff();
      else if (e.key === "d") download.current?.click();
      else return;
      e.preventDefault();
    };
    window.addEventListener(RESUME_FF_EVENT, ff);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(RESUME_FF_EVENT, ff);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const page = Math.min(n, Math.floor(t) + 1);

  return (
    <>
      {/* printer front panel */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-line px-4 py-1.5 text-[11px] md:px-8">
        <span className="flex min-w-0 items-center gap-2 text-fg-2">
          <span aria-hidden className={done ? "size-1.5 shrink-0 rounded-full bg-ok" : "size-1.5 shrink-0 rounded-full bg-warn pulse-dot"} />
          LPT1
          <span className="truncate text-fg-3">▸ lpr {resumeDoc.file}</span>
          <span className="shrink-0 tabular-nums text-fg-3" aria-live="polite">
            {done ? `· ready · ${n} halaman` : `· printing hal ${page}/${n} · ${Math.round((t / n) * 100)}%`}
          </span>
        </span>
        <span className="flex items-center gap-3">
          {!done && (
            <button onClick={() => (skip.current = true)} className="text-fg-3 transition-colors hover:text-accent">
              [<span className="text-accent">f</span>] form feed
            </button>
          )}
          <a ref={download} href={resumeDoc.pdf} download={resumeDoc.file} className="text-fg-3 transition-colors hover:text-accent">
            [<span className="text-accent">d</span>] unduh PDF
          </a>
          <button onClick={onClose} className="text-fg-3 transition-colors hover:text-accent">
            [<span className="text-accent">q</span>] tutup
          </button>
        </span>
      </div>

      <div className="px-2 pb-8 pt-4 sm:px-4 md:px-8">
        <div className="mx-auto max-w-[820px]">
          {/* the slot the paper comes out of */}
          <div aria-hidden className="resume-slot mx-1 h-3 rounded-t-sm border border-b-0 border-line-2 bg-raised" />
          <div className="flex flex-col">
            {resumeDoc.pages.map((p, i) => (
              <Page key={p.src} {...p} n={i + 1} t={t - i} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
