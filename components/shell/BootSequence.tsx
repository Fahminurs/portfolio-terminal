"use client";

import { useEffect, useState } from "react";
import { Prompt } from "@/components/ui/Prompt";
import { play, setSfxOn, unlockSfx } from "@/lib/sfx";

const LINES: [string, string][] = [
  ["OK", "mounted /dev/esp32s3 (xtensa lx7 @ 240MHz)"],
  ["OK", "uart0 configured @ 115200 baud"],
  ["OK", "i2c bus: tca9548a → 3× vl53l1x online"],
  ["OK", "loaded yolov8n.pt + paddleocr (anpr)"],
  ["OK", "supabase: connection pool ready"],
  ["OK", "portfolio.service — 8 projects, 27 repos"],
];

/**
 * Boot log that waits at a login prompt. Browsers keep a page silent until the visitor touches it,
 * so the page holds here for one key / tap: that gesture unlocks the sound, and every glitch and
 * typed line after it plays with audio from the very first one. Shown on every load while sound
 * is on (the log itself only plays out once per session); skipped pre-paint via html[data-booted]
 * in plain mode, reduced motion, or once the visitor chose to go in without sound.
 */
export function BootSequence() {
  const [shown, setShown] = useState(0);
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (document.documentElement.dataset.booted) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- nothing to boot
      setDone(true);
      return;
    }
    const seen = sessionStorage.getItem("fahmi:booted");
    let i = seen ? LINES.length + 1 : 0;
    setShown(i);
    const id = window.setInterval(() => {
      if (i > LINES.length) {
        window.clearInterval(id);
        setReady(true);
        return;
      }
      i++;
      setShown(i);
    }, seen ? 0 : 170);

    const finish = (sound: boolean) => {
      window.clearInterval(id);
      off();
      sessionStorage.setItem("fahmi:booted", "1");
      if (sound) {
        unlockSfx();
        play("thunk");
        window.setTimeout(() => play("glitch"), 180);
      } else setSfxOn(false);
      setShown(LINES.length + 1);
      setDone(true);
      window.setTimeout(() => (document.documentElement.dataset.booted = "1"), 260);
    };
    // pointerup, not pointerdown: on a phone only the lift counts as a gesture that may start audio
    const enter = (e: Event) => {
      if (e instanceof KeyboardEvent && (e.ctrlKey || e.metaKey || e.altKey || e.key === "Tab")) return;
      finish(!(e.target instanceof Element && e.target.closest("[data-mute]")));
    };
    const off = () => {
      window.removeEventListener("keydown", enter);
      window.removeEventListener("pointerup", enter);
    };
    window.addEventListener("keydown", enter);
    window.addEventListener("pointerup", enter);
    return () => {
      window.clearInterval(id);
      off();
    };
  }, []);

  return (
    <div
      aria-hidden
      className="boot-screen fixed inset-0 print:hidden z-[70] flex cursor-pointer items-end bg-bg p-6 text-[12px] leading-relaxed transition-opacity duration-200 md:p-10"
      style={{ opacity: done ? 0 : 1, pointerEvents: done ? "none" : "auto" }}
    >
      <div className="w-full max-w-xl">
        {LINES.slice(0, shown).map(([s, t]) => (
          <div key={t} className="text-fg-2">
            [ <span className="text-ok">{s}</span> ] {t}
          </div>
        ))}
        {ready ? (
          <>
            <div className="mt-3 text-fg-2">
              [ <span className="text-accent">..</span> ] audio: pcm0 armed — menunggu sinyal dari tty
            </div>
            <div className="boot-enter mt-4 text-[13px] text-fg">
              <span className="text-accent">&gt;</span> ketuk layar / tekan tombol apa saja untuk masuk
              <span className="cursor-block ml-1" />
            </div>
            <button data-mute className="mt-5 text-[10px] text-fg-3 underline-offset-4 hover:text-fg-2 hover:underline">
              masuk tanpa suara
            </button>
          </>
        ) : (
          <div className="mt-2 text-fg">
            <Prompt />
            <span className="cursor-block" />
          </div>
        )}
      </div>
    </div>
  );
}
