"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { resume } from "@/content/data";
import { useShell } from "@/components/shell/ShellProvider";
import { useCalm } from "@/lib/calm";

const LINE = 20; // px — one printed line; the green bars are 3 lines tall
const PAGE_LINES = 66; // a continuous-form page
const FEED_MS = 2200;

/** `lpr resume`: print only the paper (white, no bars or sprockets) — see `html[data-print-resume]` in globals.css */
export function printResume() {
  const html = document.documentElement;
  html.dataset.printResume = "1";
  const done = () => {
    delete html.dataset.printResume;
    window.removeEventListener("afterprint", done);
  };
  window.addEventListener("afterprint", done);
  window.print();
}

function Head({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mt-[20px] flex items-center gap-3 font-bold tracking-[0.18em]">
      {children}
      <span aria-hidden className="h-0 flex-1 border-b-2 border-dotted border-current opacity-40" />
    </h3>
  );
}

function Row({ when, what, where, note }: { when: string; what: string; where?: string; note?: string }) {
  return (
    <li className="grid grid-cols-[minmax(0,1fr)] sm:grid-cols-[9.5rem_minmax(0,1fr)] sm:gap-x-4">
      <span className="resume-dim tabular-nums">{when}</span>
      <div>
        <p className="font-bold">
          {what}
          {where && <span className="resume-dim font-normal"> — {where}</span>}
        </p>
        {note && <p className="font-prose text-[12.5px]">{note}</p>}
      </div>
    </li>
  );
}

/** The paper itself: real text on a green-bar continuous form. */
function Paper() {
  return (
    <article className="resume-ink px-4 py-[20px] text-[12px] leading-[20px] sm:px-10">
      <header>
        <p className="resume-dim text-[11px]">CURRICULUM VITAE · lpr -P lpt1 resume</p>
        <h2 className="font-display text-[30px] leading-[40px] tracking-wide sm:text-[36px]">{resume.name}</h2>
        <p className="font-bold">{resume.role}</p>
        <ul className="mt-[20px] grid gap-x-6 sm:grid-cols-2">
          {resume.contact.map((c) => (
            <li key={c.k} className="flex gap-2">
              <span className="resume-dim w-16 shrink-0">{c.k}</span>
              {c.href ? (
                <a href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="truncate underline decoration-dotted underline-offset-4">
                  {c.v}
                </a>
              ) : (
                <span>{c.v}</span>
              )}
            </li>
          ))}
        </ul>
      </header>

      <Head>PROFIL</Head>
      <p className="font-prose text-[12.5px]">{resume.summary}</p>

      <Head>PENDIDIKAN</Head>
      <ul>{resume.education.map((e) => <Row key={e.where} {...e} />)}</ul>

      <Head>PENGALAMAN</Head>
      <ul>{resume.experience.map((e) => <Row key={e.what} {...e} />)}</ul>

      <Head>PROYEK</Head>
      <ul>
        {resume.projects.map((p) => (
          <li key={p.name} className="grid grid-cols-[minmax(0,1fr)] sm:grid-cols-[9.5rem_minmax(0,1fr)] sm:gap-x-4">
            <span className="resume-dim tabular-nums">{p.when}</span>
            <div>
              <p>
                <span className="font-bold">{p.name}</span> <span className="resume-dim">[{p.stack}]</span>
              </p>
              <p className="font-prose text-[12.5px]">{p.note}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="resume-dim sm:pl-[calc(9.5rem+1rem)]">lainnya: {resume.more}</p>

      <Head>PENGHARGAAN</Head>
      <ul>{resume.awards.map((a) => <Row key={a.what} {...a} />)}</ul>

      <Head>SERTIFIKASI</Head>
      <ul>
        {resume.certs.map((c) => (
          <li key={c.org} className="grid grid-cols-[minmax(0,1fr)] sm:grid-cols-[9.5rem_minmax(0,1fr)] sm:gap-x-4">
            <span className="font-bold">{c.org}</span>
            <span className="font-prose text-[12.5px]">{c.what}</span>
          </li>
        ))}
      </ul>

      <Head>KEAHLIAN</Head>
      <ul>
        {resume.skills.map((s) => (
          <li key={s.k} className="grid grid-cols-[minmax(0,1fr)] sm:grid-cols-[9.5rem_minmax(0,1fr)] sm:gap-x-4">
            <span className="resume-dim">{s.k}</span>
            <span>{s.v}</span>
          </li>
        ))}
      </ul>

      <p className="resume-dim mt-[20px] text-center text-[11px]">— end of job · {resume.name.toLowerCase()} —</p>
    </article>
  );
}

/**
 * `lpr resume` — not a PDF viewer: the CV comes out of a dot-matrix printer on green-bar
 * continuous-form paper, line by line, with the print head riding the edge. Real, selectable
 * text; [p] prints just the paper as a clean CV, [q] / Esc closes (§5.2: a panel under the hero, not a modal).
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
          className="overflow-hidden border-b border-line bg-surface print:overflow-visible print:border-0 print:bg-transparent"
        >
          <Printer onClose={() => setResumeOpen(false)} />
        </motion.section>
      )}
    </AnimatePresence>
  );
}

function Printer({ onClose }: { onClose: () => void }) {
  const calm = useCalm();
  const paper = useRef<HTMLDivElement>(null);
  const [fed, setFed] = useState(0); // 0..1 of the paper printed so far
  const [lines, setLines] = useState(0);

  useEffect(() => {
    const el = paper.current!;
    const total = Math.max(1, Math.round(el.scrollHeight / LINE));
    let raf = 0;
    const t0 = performance.now();
    const step = (now: number) => {
      // whole lines only: the head advances a line at a time, like the real thing
      const p = calm ? 1 : Math.min(1, Math.floor(((now - t0) / FEED_MS) * total) / total);
      setLines(total);
      setFed(p);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [calm]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (document.querySelector("dialog[open]")) return;
      if (e.key === "p" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        printResume();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const done = fed >= 1;
  const pages = Math.max(1, Math.ceil(lines / PAGE_LINES));

  return (
    <>
      {/* printer front panel */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-line px-4 py-1.5 text-[11px] md:px-8 print:hidden">
        <span className="flex items-center gap-2 text-fg-2">
          <span aria-hidden className={done ? "size-1.5 rounded-full bg-ok" : "size-1.5 rounded-full bg-warn pulse-dot"} />
          LPT1 <span className="text-fg-3">▸ lpr resume</span>
          <span className="tabular-nums text-fg-3" aria-live="polite">
            {done ? `ready · ${pages} halaman · ${lines} baris` : `printing… ${Math.round(fed * 100)}%`}
          </span>
        </span>
        <span className="flex items-center gap-3">
          <button onClick={printResume} className="text-fg-3 transition-colors hover:text-accent">
            [<span className="text-accent">p</span>] cetak / PDF
          </button>
          <button onClick={onClose} className="text-fg-3 transition-colors hover:text-accent">
            [<span className="text-accent">q</span>] tutup
          </button>
        </span>
      </div>

      <div className="px-2 pb-8 pt-4 sm:px-4 md:px-8 print:p-0">
        <div className="mx-auto max-w-[860px]">
          {/* the slot the paper comes out of */}
          <div aria-hidden className="resume-slot mx-1 h-3 rounded-t-sm border border-b-0 border-line-2 bg-raised print:hidden" />
          <div className="relative">
            <div
              ref={paper}
              id="resume-paper"
              className="resume-paper"
              style={{ clipPath: done ? undefined : `inset(0 0 ${(1 - fed) * 100}% 0)` }}
            >
              <Paper />
            </div>
            {!done && (
              <div
                aria-hidden
                className="resume-head pointer-events-none absolute inset-x-0 print:hidden"
                style={{ top: `calc(${fed * 100}% - 6px)` }}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
