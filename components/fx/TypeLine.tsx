"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";
import { useCalm } from "@/lib/calm";

type Props = {
  text: string;
  className?: string;
  delay?: number;
  cps?: number; // characters per second
  cursor?: boolean;
};

/** Types a single line once it scrolls into view (inspired by React Bits TextType). */
export function TypeLine({ text, className, delay = 0, cps = 40, cursor = false }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useCalm();
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- instant reveal for reduced motion
      setN(text.length);
      return;
    }
    let i = 0;
    let id = 0;
    const t = window.setTimeout(() => {
      id = window.setInterval(() => {
        i++;
        setN(i);
        if (i >= text.length) window.clearInterval(id);
      }, 1000 / cps);
    }, delay);
    return () => {
      window.clearTimeout(t);
      window.clearInterval(id);
    };
  }, [inView, reduce, text, delay, cps]);

  return (
    <span ref={ref} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>{text.slice(0, n)}</span>
      {cursor && <span aria-hidden className="cursor-block ml-1" />}
    </span>
  );
}
