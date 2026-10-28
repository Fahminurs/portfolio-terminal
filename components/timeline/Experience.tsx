"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { experience, sections } from "@/content/data";
import { SectionHead } from "@/components/ui/SectionHead";
import { NoSignal } from "@/components/ui/NoSignal";
import { useCalm } from "@/lib/calm";
import { cn } from "@/lib/utils";

const s = sections[5];

// log levels, one hue per kind of entry — like syslog tags in a colored `tail -f`
const TAG_COLOR: Record<string, string> = {
  INTERN: "text-term-green",
  "STUDI INDEPENDEN": "text-term-cyan",
  ORG: "text-term-magenta",
};

/** `tail -f`: lines arrive from the bottom one by one the first time the log is seen (§5.7). */
export function Experience() {
  const ref = useRef<HTMLOListElement>(null);
  const seen = useInView(ref, { once: true, margin: "0px 0px -20% 0px" });
  const calm = useCalm();
  const show = seen || calm;

  return (
    <section id={s.id} aria-label="Experience" className="relative border-b border-line">
      <SectionHead n={s.n} label={s.label} cmd={s.cmd} title="Pengalaman" />
      <ol ref={ref} className="mt-8 border-t border-line">
        {experience.map((e, i) => (
          <motion.li
            key={e.title}
            initial={false}
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
            <NoSignal label="foto.jpg" className="hidden min-h-24 md:flex" />
          </motion.li>
        ))}
      </ol>
    </section>
  );
}
