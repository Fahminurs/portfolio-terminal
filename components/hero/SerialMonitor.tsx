"use client";

import { useEffect, useRef, useState } from "react";
import { useCalm } from "@/lib/calm";
import { cn } from "@/lib/utils";

type Dir = "tx" | "rx";

// One gate cycle, in the exact line format of ParkEasy_Alat main/uart_handler.h and
// ParkEasy_AI gate_server.py (send_uart). The plate is the firmware's own example plate.
const SCRIPT: [Dir, string][] = [
  ["tx", "ANIM_KAMERA:MASUK"],
  ["tx", "ANIM_DATABASE:MASUK"],
  ["tx", "MASUK:BERHASIL|D 123 DX|{time}"],
  ["rx", "MASUK:SELESAI|D 123 DX"],
  ["tx", "ANIM_KAMERA:KELUAR"],
  ["tx", "KELUAR:BELUM_BAYAR|D 123 DX|5000"],
  ["tx", "ANIM_KAMERA:KELUAR"],
  ["tx", "KELUAR:BERHASIL|D 123 DX"],
  ["rx", "KELUAR:SELESAI|D 123 DX"],
];

const KEEP = 4;
const EVERY_MS = 1700;

type Line = { id: number; dir: Dir; text: string; ts: string };

const clock = () =>
  new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  }).format(new Date());

/**
 * Live-looking `screen /dev/ttyUSB0 115200`: replays one ParkEasy gate cycle line by line,
 * with TX/RX activity LEDs. Runs only while on screen; calm mode shows a still snapshot.
 */
export function SerialMonitor() {
  const ref = useRef<HTMLDivElement>(null);
  const calm = useCalm();
  const [lines, setLines] = useState<Line[]>([]);
  const [led, setLed] = useState<Dir | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let step = 0;
    let id = 0;
    let ledT = 0;

    const push = () => {
      const [dir, raw] = SCRIPT[step % SCRIPT.length];
      const ts = clock();
      const n = step++;
      setLines((l) => [...l, { id: n, dir, text: raw.replace("{time}", ts), ts }].slice(-KEEP));
      setLed(dir);
      window.clearTimeout(ledT);
      ledT = window.setTimeout(() => setLed(null), 180);
    };

    if (calm) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- static snapshot, no timers
      setLines(
        SCRIPT.slice(0, KEEP).map(([dir, raw], i) => ({ id: i, dir, text: raw.replace("{time}", "14:30:00"), ts: "14:30:0" + i })),
      );
      return;
    }

    const io = new IntersectionObserver(([e]) => {
      window.clearInterval(id);
      if (e.isIntersecting && !document.hidden) {
        push();
        id = window.setInterval(push, EVERY_MS);
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearInterval(id);
      window.clearTimeout(ledT);
    };
  }, [calm]);

  return (
    <div ref={ref} className="border-t border-line">
      <div className="flex items-center justify-between px-3 py-1 text-[10px] text-fg-3">
        <span>
          <span className="text-fg-2">screen</span> /dev/ttyUSB0 <span className="text-term-yellow">115200</span>
        </span>
        <span className="flex items-center gap-3" aria-hidden>
          <span className="flex items-center gap-1">
            <span className={cn("size-1.5", led === "tx" ? "bg-term-yellow" : "bg-line-2")} />
            TX
          </span>
          <span className="flex items-center gap-1">
            <span className={cn("size-1.5", led === "rx" ? "bg-term-cyan" : "bg-line-2")} />
            RX
          </span>
        </span>
      </div>
      <ol
        aria-label="Replay log UART ParkEasy"
        className="h-[5.6rem] overflow-hidden px-3 pb-2 text-[10px] leading-[1.4]"
      >
        {lines.map((l) => (
          <li key={l.id} className="serial-line flex gap-2 whitespace-nowrap">
            <span className="text-fg-3">{l.ts}</span>
            <span className={l.dir === "tx" ? "text-term-yellow" : "text-term-cyan"}>
              {l.dir === "tx" ? "→ esp32" : "← esp32"}
            </span>
            <span className="truncate text-fg-2">{l.text}</span>
          </li>
        ))}
      </ol>
      <p className="border-t border-line px-3 py-1 text-right text-[9px] text-fg-3">
        replay · format dari main/uart_handler.h
      </p>
    </div>
  );
}
