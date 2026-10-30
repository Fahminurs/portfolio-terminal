"use client";

import { useEffect, useRef, useState } from "react";
import { useCalm } from "@/lib/calm";
import { useVisits } from "@/lib/visits";
import { onScreen, play, whenSettled } from "@/lib/sfx";

type Props = {
  text: string;
  className?: string;
  delay?: number;
  cps?: number; // characters per second
  cursor?: boolean;
};

/** Types a single line every time it scrolls back into view (inspired by React Bits TextType). */
export function TypeLine({ text, className, delay = 0, cps = 40, cursor = false }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const { visits } = useVisits(ref, "0px");
  const reduce = useCalm();
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!visits) return;
    if (reduce) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- instant reveal for reduced motion
      setN(text.length);
      return;
    }
    let i = 0;
    let id = 0;
    let t = 0;
    setN(0);
    const cancel = whenSettled(() => {
      if (!onScreen(ref.current)) return setN(text.length);
      t = window.setTimeout(() => {
        id = window.setInterval(() => {
          i++;
          setN(i);
          play("key", 30);
          if (i >= text.length) window.clearInterval(id);
        }, 1000 / cps);
      }, delay);
    });
    return () => {
      cancel();
      window.clearTimeout(t);
      window.clearInterval(id);
    };
  }, [visits, reduce, text, delay, cps]);

  return (
    <span ref={ref} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>{text.slice(0, n)}</span>
      {cursor && <span aria-hidden className="cursor-block ml-1" />}
    </span>
  );
}
