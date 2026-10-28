"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";
import { useCalm } from "@/lib/calm";

const GLYPHS = "!<>-_\\/[]{}=+*^?#01ABCDEF";

type Props = {
  text: string;
  className?: string;
  /** "mount" runs once on load, "view" runs once when scrolled into view */
  trigger?: "mount" | "view";
  speed?: number;
};

/**
 * Decrypt effect (inspired by React Bits DecryptedText): characters resolve left → right
 * from hex/ASCII noise. Runs once. Screen readers always get the real text.
 */
export function DecryptedText({ text, className, trigger = "mount", speed = 28 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const reduce = useCalm();
  const [out, setOut] = useState(text);
  const ran = useRef(false);

  const go = trigger === "mount" || inView;

  useEffect(() => {
    if (!go || reduce || ran.current) return;
    ran.current = true;
    let frame = 0;
    const total = text.length;
    const id = window.setInterval(() => {
      frame++;
      const revealed = Math.floor(frame / 2);
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
  }, [go, reduce, text, speed]);

  return (
    <span ref={ref} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>{out}</span>
    </span>
  );
}
