"use client";

import { useEffect, useState } from "react";
import { Prompt } from "@/components/ui/Prompt";

const LINES: [string, string][] = [
  ["OK", "mounted /dev/esp32s3 (xtensa lx7 @ 240MHz)"],
  ["OK", "uart0 configured @ 115200 baud"],
  ["OK", "i2c bus: tca9548a → 3× vl53l1x online"],
  ["OK", "loaded yolov8n.pt + paddleocr (anpr)"],
  ["OK", "supabase: connection pool ready"],
  ["OK", "portfolio.service — 8 projects, 27 repos"],
];

/** Once-per-session boot log. Hidden pre-paint via html[data-booted] when already seen. */
export function BootSequence() {
  const [shown, setShown] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (document.documentElement.dataset.booted) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- already booted this session
      setDone(true);
      return;
    }
    let i = 0;
    const finish = () => {
      sessionStorage.setItem("fahmi:booted", "1");
      setDone(true);
      window.setTimeout(() => (document.documentElement.dataset.booted = "1"), 260);
    };
    const id = window.setInterval(() => {
      i++;
      setShown(i);
      if (i > LINES.length) {
        window.clearInterval(id);
        finish();
      }
    }, 170);
    const skip = () => {
      window.clearInterval(id);
      finish();
    };
    window.addEventListener("keydown", skip, { once: true });
    window.addEventListener("pointerdown", skip, { once: true });
    return () => {
      window.clearInterval(id);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="boot-screen fixed inset-0 print:hidden z-[70] flex items-end bg-bg p-6 text-[12px] leading-relaxed transition-opacity duration-200 md:p-10"
      style={{ opacity: done ? 0 : 1, pointerEvents: done ? "none" : "auto" }}
    >
      <div className="w-full max-w-xl">
        {LINES.slice(0, shown).map(([s, t]) => (
          <div key={t} className="text-fg-2">
            [ <span className="text-ok">{s}</span> ] {t}
          </div>
        ))}
        <div className="mt-2 text-fg">
          <Prompt />
          <span className="cursor-block" />
        </div>
        <div className="mt-6 text-[10px] text-fg-3">press any key to skip</div>
      </div>
    </div>
  );
}
