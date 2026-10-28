"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { achievements, sections } from "@/content/data";
import { SectionHead } from "@/components/ui/SectionHead";
import { cn } from "@/lib/utils";
import { useCalm } from "@/lib/calm";

const s = sections[6];
const TILT = [-1.5, 1, -1];

function CaseCard({ a, i }: { a: (typeof achievements)[number]; i: number }) {
  const ref = useRef<HTMLElement>(null);
  const calm = useCalm();

  // hover tilt, max 6°, no glow (§5.8)
  const onMove = (e: React.PointerEvent) => {
    if (calm || e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    ref.current.style.transform = `perspective(700px) rotate(${TILT[i]}deg) rotateY(${x * 12}deg) rotateX(${-y * 12}deg)`;
  };
  const reset = () => ref.current && (ref.current.style.transform = `rotate(${TILT[i]}deg)`);

  return (
    <article
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      style={{ transform: `rotate(${TILT[i]}deg)` }}
      className={cn(
        "relative flex flex-col gap-3 border p-5 transition-transform duration-150",
        a.inverted ? "border-fg bg-fg text-bg" : "border-line-2 bg-surface text-fg",
      )}
    >
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "case-flag py-0.5 pl-3.5 pr-2 text-[10px] font-bold",
            a.inverted ? "bg-bg text-fg" : "bg-accent text-bg",
          )}
        >
          {a.caseNo}
        </span>
        <span
          aria-label={a.seal === "★" ? "penghargaan" : `juara ${a.seal === "II" ? 2 : 3}`}
          className={cn(
            "grid size-11 place-items-center border-[3px] border-double font-display text-[15px]",
            a.inverted ? "border-bg" : "border-accent text-accent",
          )}
        >
          {a.seal}
        </span>
      </div>
      <p className={cn("text-[10px] uppercase tracking-wide", a.inverted ? "opacity-60" : "text-fg-3")}>
        {a.category}
      </p>
      <h3 className="font-display text-[19px] leading-tight">{a.title}</h3>
      <p className={cn("font-prose text-[13.5px] leading-[1.6]", a.inverted ? "opacity-80" : "text-fg-2")}>
        {a.desc}
      </p>
      <div
        className={cn(
          "mt-auto flex justify-between border-t border-dashed pt-3 text-[10px]",
          a.inverted ? "border-bg/40" : "border-line-2",
        )}
      >
        <span className={a.inverted ? "font-bold" : "text-ok"}>STATUS: VERIFIED</span>
        <span className={a.inverted ? "" : "text-fg-3"}>{a.year}</span>
      </div>
    </article>
  );
}

/** Evidence board: HQ node, dashed strings drawn in when seen, three tilted case files. */
export function Records() {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, margin: "0px 0px -25% 0px" });
  const calm = useCalm();
  const draw = seen || calm;

  return (
    <section id={s.id} aria-label="Achievements" className="relative border-b border-line">
      <SectionHead n={s.n} label={s.label} cmd={s.cmd} title="Records" count={`${achievements.length} CASES`} />
      <div ref={ref} className="relative mt-8 border-t border-line px-4 pb-12 pt-6 md:px-8">
        <div className="relative z-10 mx-auto w-fit border border-line-2 bg-bg px-4 py-2 text-center text-[11px]">
          <span className="text-accent">HQ</span>
          <span className="block text-[9px] text-fg-3">evidence board — fahmi</span>
        </div>

        <svg
          aria-hidden
          viewBox="0 0 300 40"
          preserveAspectRatio="none"
          className="hidden h-14 w-full lg:block"
        >
          {[50, 150, 250].map((x, i) => {
            const d = `M150 0 C150 22 ${x} 14 ${x} 40`;
            return (
              <g key={x}>
                {/* the dashes stay dashed; a solid mask stroke is what gets "drawn" */}
                <mask id={`string-${i}`} maskUnits="userSpaceOnUse">
                  <motion.path
                    d={d}
                    fill="none"
                    stroke="#fff"
                    strokeWidth={6}
                    initial={false}
                    animate={{ pathLength: draw ? 1 : 0 }}
                    transition={{ duration: calm ? 0 : 0.6, delay: calm ? 0 : i * 0.12, ease: [0.2, 0.8, 0.2, 1] }}
                  />
                </mask>
                <path
                  d={d}
                  mask={`url(#string-${i})`}
                  fill="none"
                  stroke="var(--color-line-2)"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            );
          })}
        </svg>
        <div className="mx-auto mt-6 grid max-w-xl gap-8 lg:mt-0 lg:max-w-none lg:grid-cols-3 lg:gap-6">
          {achievements.map((a, i) => (
            <CaseCard key={a.caseNo} a={a} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
