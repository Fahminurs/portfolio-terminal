"use client";

import { useEffect, useRef, useState } from "react";
import { useCalm } from "@/lib/calm";
import { useVisits } from "@/lib/visits";
import { play } from "@/lib/sfx";

const GLYPHS = "!<>-_\\/[]{}=+*^?#01ABCDEF";

type Props = {
  text: string;
  className?: string;
  /** "mount" runs once on load, "view" runs every time it scrolls back into view */
  trigger?: "mount" | "view";
  speed?: number;
};

/**
 * Decrypt effect (inspired by React Bits DecryptedText): characters resolve left → right
 * from hex/ASCII noise. Screen readers always get the real text.
 */
export function DecryptedText({ text, className, trigger = "mount", speed = 28 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const { visits } = useVisits(ref, "0px 0px -15% 0px");
  const reduce = useCalm();
  const [out, setOut] = useState(text);

  // mount → a single run; view → one run per visit
  const run = trigger === "mount" ? 1 : visits;

  useEffect(() => {
    if (!run || reduce) return;
    let frame = 0;
    const total = text.length;
    const id = window.setInterval(() => {
      frame++;
      const revealed = Math.floor(frame / 2);
      if (frame % 2 === 0 && text[revealed - 1] !== " ") play("decrypt", 0, true);
      setOut(
        text
          .split("")
          .map((ch, i) => {
            if (ch === " " || i < revealed) return ch;
            return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          })
          .join(""),
      );
      if (revealed >= total) {
        window.clearInterval(id);
        setOut(text);
      }
    }, speed);
    return () => window.clearInterval(id);
  }, [run, reduce, text, speed]);

  return (
    <span ref={ref} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>{out}</span>
    </span>
  );
}
