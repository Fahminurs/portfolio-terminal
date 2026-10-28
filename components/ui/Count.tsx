"use client";

import NumberFlow from "@number-flow/react";
import { useEffect, useRef, useState } from "react";
import { useCalm } from "@/lib/calm";
import { useVisits } from "@/lib/visits";

type Props = { value: number; pad?: number; className?: string };

/** Odometer-style digits (§6.7-D). Rolls up from 0 on every visit; static when calm. */
export function Count({ value, pad = 2, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const { inView } = useVisits(ref, "0px");
  const calm = useCalm();
  const [printing, setPrinting] = useState(false);

  // off-screen counters sit at 0 between visits — never print them that way
  useEffect(() => {
    const on = () => setPrinting(true);
    const off = () => setPrinting(false);
    window.addEventListener("beforeprint", on);
    window.addEventListener("afterprint", off);
    return () => {
      window.removeEventListener("beforeprint", on);
      window.removeEventListener("afterprint", off);
    };
  }, []);

  return (
    <span ref={ref} className={className}>
      <NumberFlow
        value={inView || calm || printing ? value : 0}
        format={{ minimumIntegerDigits: pad, useGrouping: false }}
        animated={!calm}
      />
    </span>
  );
}
