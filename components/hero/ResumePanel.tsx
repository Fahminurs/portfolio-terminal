"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { resumeDoc } from "@/content/data";
import { useShell } from "@/components/shell/ShellProvider";
import { useCalm } from "@/lib/calm";
import { hold, play } from "@/lib/sfx";

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
 * `view-resume` / `lpr resume`: the real CV goes through a dot-matrix printer, in a modal. Each
 * page sits on continuous-form paper (sprocket strips, perforation between pages) and is laid down
 * band by band by a head that sweeps both ways; the sheet scrolls along with the head like paper
 * feeding out. [f] form-feeds to the end, [d] downloads the original PDF, [q] / Esc closes.
 */
export function ResumePanel() {
  const { resumeOpen, setResumeOpen } = useShell();
  if (!resumeOpen) return null;
  return createPortal(<Printer onClose={() => setResumeOpen(false)} />, document.body);
}

function Printer({ onClose }: { onClose: () => void }) {
  const calm = useCalm();
  const n = resumeDoc.pages.length;
  const [t, setT] = useState(calm ? n : 0); // pages printed so far, 0..n
  const skip = useRef(false);
  const follow = useRef(true); // the sheet tracks the head until the reader scrolls it themselves
  const dialog = useRef<HTMLDialogElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const download = useRef<HTMLAnchorElement>(null);
  const done = t >= n;

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const html = document.documentElement;
    const overflow = html.style.overflow;
    dialog.current?.showModal();
    play("thunk");
    html.style.overflow = "hidden";
    return () => {
      play("off", 200);
      html.style.overflow = overflow;
      opener?.focus({ preventScroll: true });
    };
  }, []);

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

  // the head buzzes while it prints; a beep when the job is done
  useEffect(() => {
    if (done) return;
    const stop = hold("print");
    return () => {
      stop();
      play("ok");
    };
  }, [done]);

  // paper feed: keep the band being printed a little below the middle of the view
  useEffect(() => {
    const el = sheet.current;
    if (!el || done || !follow.current) return;
    const head = el.querySelector<HTMLElement>(".resume-head");
    if (!head) return;
    const y = head.getBoundingClientRect().top - el.getBoundingClientRect().top + el.scrollTop;
    el.scrollTop = Math.max(0, y - el.clientHeight * 0.6);
  }, [t, done]);

  // keys belong to the printer while it's open (shell digits, "/", "?" stay out)
  useEffect(() => {
    const ff = () => (skip.current = true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Tab" || e.ctrlKey || e.metaKey || e.altKey) return;
      e.stopImmediatePropagation();
      if (e.key === "f") ff();
      else if (e.key === "d") download.current?.click();
      else if (e.key === "q" || e.key === "Escape") onClose();
      else return;
      e.preventDefault();
    };
    window.addEventListener(RESUME_FF_EVENT, ff);
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener(RESUME_FF_EVENT, ff);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [onClose]);

  const page = Math.min(n, Math.floor(t) + 1);

  return (
    <dialog
      ref={dialog}
      id="resume"
      aria-label="Resume Fahmi Nursafaat"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      className="man fixed inset-0 m-auto h-[min(85dvh,760px)] max-h-none w-[calc(100vw-16px)] max-w-none overflow-visible bg-transparent p-0 text-fg md:h-[min(80vh,760px)] md:w-[min(900px,94vw)]"
    >
      <div
        className="man-frame tui-shadow relative flex h-full flex-col border-[3px] border-double border-line-2 bg-surface"
        style={{ "--tui-bg": "var(--color-surface)" } as React.CSSProperties}
      >
        <span className="tui-title left-3 max-w-[calc(100%-7rem)] truncate text-fg-2">
          ╡ <span className="text-accent">lpr</span> {resumeDoc.file} ╞
        </span>
        <span className="tui-title right-3">
          <button autoFocus onClick={onClose} className="text-fg-3 transition-colors hover:text-accent">
            [<span className="text-accent">q</span>] tutup
          </button>
        </span>

        {/* printer front panel */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-line px-4 pb-2 pt-3.5 text-[11px]">
          <span className="flex min-w-0 items-center gap-2 text-fg-2">
            <span aria-hidden className={done ? "size-1.5 shrink-0 rounded-full bg-ok" : "size-1.5 shrink-0 rounded-full bg-warn pulse-dot"} />
            LPT1
            <span className="shrink-0 tabular-nums text-fg-3" aria-live="polite">
              {done ? `ready · ${n} halaman` : `printing hal ${page}/${n} · ${Math.round((t / n) * 100)}%`}
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
          </span>
        </div>

        {/* the sheet, scrolling along as it feeds */}
        <div
          ref={sheet}
          className="min-h-0 flex-1 overflow-y-auto bg-bg px-2 pb-8 sm:px-6"
          onWheel={() => (follow.current = false)}
          onTouchStart={() => (follow.current = false)}
        >
          <div className="mx-auto max-w-[820px]">
            {/* the slot the paper comes out of */}
            <div aria-hidden className="resume-slot sticky top-0 z-10 mx-1 h-3 rounded-b-sm border border-t-0 border-line-2 bg-raised" />
            <div className="flex flex-col">
              {resumeDoc.pages.map((p, i) => (
                <Page key={p.src} {...p} n={i + 1} t={t - i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}
