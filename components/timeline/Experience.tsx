"use client";

import { motion } from "motion/react";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { experience, sections } from "@/content/data";
import { SectionHead } from "@/components/ui/SectionHead";
import { DitherReveal } from "@/components/fx/DitherReveal";
import { DocPrinter } from "@/components/hero/ResumePanel";
import { useCalm } from "@/lib/calm";
import { useVisits } from "@/lib/visits";
import { cn } from "@/lib/utils";

const s = sections[5];

// log levels, one hue per kind of entry — like syslog tags in a colored `tail -f`
const TAG_COLOR: Record<string, string> = {
  INTERN: "text-term-green",
  "STUDI INDEPENDEN": "text-term-cyan",
  ORG: "text-term-magenta",
};

/**
 * `tail -f`: lines arrive from the bottom one by one every time the log comes into view (§5.7).
 * Each line's proof (certificate, internship grades) sits beside it as a dithered card — on phones
 * too, under the text — and goes through the same dot-matrix printer as the CV: every page, zoomable.
 */
function DocCard({ doc, alt }: { doc: (typeof experience)[number]["doc"]; alt: string }) {
  const [open, setOpen] = useState(false);
  const n = doc.pages.length;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={`Buka ${doc.title} (${n} halaman)`}
        className="man-trigger group relative block w-full max-w-sm cursor-zoom-in text-left md:max-w-none"
      >
        <DitherReveal src={doc.card} dither={doc.dither} alt={alt} label={doc.file} focusable={false} className="aspect-[4/3] w-full" />
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-2 right-2 z-10 border border-line-2 bg-bg px-1.5 py-px text-[10px] text-fg-3 transition-colors group-hover:border-accent group-hover:text-accent group-focus-visible:border-accent group-focus-visible:text-accent"
        >
          lpr · {n} hal ↵
        </span>
      </button>
      {open && createPortal(<DocPrinter doc={doc} onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}

export function Experience() {
  const ref = useRef<HTMLOListElement>(null);
  const { visits } = useVisits(ref, "0px 0px -20% 0px");
  const calm = useCalm();
  const show = visits > 0 || calm;

  return (
    <section id={s.id} aria-label="Experience" className="relative border-b border-line">
      <SectionHead n={s.n} label={s.label} cmd={s.cmd} title="Pengalaman" />
      <ol ref={ref} className="mt-8 border-t border-line">
        {experience.map((e, i) => (
          <motion.li
            // new key per visit → remount from the hidden state, so the tail replays
            key={`${e.title}-${visits}`}
            initial={show && !calm ? { opacity: 0, y: 14 } : false}
            animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
            transition={{ duration: 0.22, delay: calm ? 0 : (experience.length - 1 - i) * 0.18, ease: [0.2, 0.8, 0.2, 1] }}
            className="grid gap-4 border-b border-line px-4 py-6 last:border-0 md:grid-cols-[120px_1fr_180px] md:px-8"
          >
            <div className="text-[12px] tabular-nums">
              <span className="block text-fg">{e.ts[0]}</span>
              <span className="text-fg-3">{e.ts[1]}</span>
            </div>
            <div>
              <p className={cn("text-[11px] font-bold", TAG_COLOR[e.tag] ?? "text-fg-2")}>
                [{e.tag}]
                {i === 0 && <span aria-hidden className="cursor-block ml-2 !h-[0.9em] !w-[0.5em]" />}
              </p>
              <h3 className="mt-1 text-[15px] font-bold text-fg">{e.title}</h3>
              <p className="mt-0.5 text-[12px] text-fg-2">{e.org}</p>
              <p className="mt-2 max-w-[62ch] font-prose text-[14px] leading-[1.65] text-fg-2">{e.desc}</p>
            </div>
            <DocCard doc={e.doc} alt={`${e.title} — ${e.org}`} />
          </motion.li>
        ))}
      </ol>
    </section>
  );
}
