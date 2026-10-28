"use client";

import NumberFlow from "@number-flow/react";
import { useInView } from "motion/react";
import { useRef } from "react";
import { useCalm } from "@/lib/calm";

type Props = { value: number; pad?: number; className?: string };

/** Odometer-style digits (§6.7-D). Rolls once from 0 when first seen; static when calm. */
export function Count({ value, pad = 2, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true });
  const calm = useCalm();
  return (
    <span ref={ref} className={className}>
      <NumberFlow
        value={seen || calm ? value : 0}
        format={{ minimumIntegerDigits: pad, useGrouping: false }}
        animated={!calm}
      />
    </span>
  );
}
