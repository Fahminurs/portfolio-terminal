"use client";

import { useEffect, useRef, useState } from "react";
import { useCalm } from "@/lib/calm";
import { play, whenSettled } from "@/lib/sfx";

/**
 * The machine on the other end has a bad signal. One place for the ambient interference:
 * - `.glitch` headings tear into red/cyan slices when they come into view, and now and then at random
 * - every so often the picture loses tracking: the page judders with a tape hum
 * - scrolling very fast tears the headings (html[data-tear])
 * - a tap / click spits a few phosphor pixels where it landed
 * - left idle, the carrier drops: a burst of static and a line from the kernel, then it reattaches
 * Visuals live in globals.css under "signal fx"; everything is off in calm / reduced motion.
 */

const IDLE_MS = 40_000;
const IDLE_MAX = 2; // per visit — after that it leaves you alone
const GHOST_LINES = [
  ["[kernel] carrier lost on /dev/tty0", "[kernel] carrier reattached — someone is still reading"],
  ["[tty0] input idle 40s", "[tty0] … still there? ok."],
  ["[sig] SIGHUP from remote host", "[sig] ignored. session kept alive."],
];

const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** restart a CSS animation hung off a data attribute */
function pulse(el: Element, attr: string, ms: number) {
  el.removeAttribute(attr);
  void (el as HTMLElement).offsetWidth;
  el.setAttribute(attr, "");
  window.setTimeout(() => el.removeAttribute(attr), ms);
}

export function SignalFx() {
  const calm = useCalm();
  const stat = useRef<HTMLDivElement>(null);
  const [ghost, setGhost] = useState<string | null>(null);

  useEffect(() => {
    if (calm) return;
    const html = document.documentElement;
    const timers = new Set<number>();
    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
    };

    // --- glitch headings: on entering view, plus random bursts on what's visible -----------
    const visible = new Set<Element>();
    const settling = new Set<() => void>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            if (!visible.has(e.target)) {
              const el = e.target;
              settling.add(
                whenSettled(() => {
                  if (visible.has(el))
                    later(() => {
                      pulse(el, "data-glitch", 420);
                      play("glitch", 150);
                    }, rand(150, 500));
                }),
              );
            }
            visible.add(e.target);
          } else visible.delete(e.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    const seen = new WeakSet<Element>();
    const watch = () =>
      document.querySelectorAll(".glitch").forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        io.observe(el);
      });
    watch();
    const mo = new MutationObserver(watch);
    mo.observe(document.body, { childList: true, subtree: true });

    const burst = () => {
      if (!document.hidden && visible.size) {
        const list = [...visible];
        pulse(list[Math.floor(Math.random() * list.length)], "data-glitch", 320);
        play("glitch", 150);
      }
      later(burst, rand(4000, 11000));
    };
    later(burst, rand(3000, 6000));

    // --- lost tracking: judder ----------------------------------------------------------------
    const roll = () => {
      if (!document.hidden) {
        pulse(html, "data-tracking", 950);
        play("tracking");
      }
      later(roll, rand(9000, 22000));
    };
    later(roll, rand(5000, 9000));

    // --- scroll-speed tear ----------------------------------------------------------------
    let lastY = window.scrollY;
    let lastT = performance.now();
    let tearOff = 0;
    const onScroll = () => {
      const now = performance.now();
      const v = Math.abs(window.scrollY - lastY) / Math.max(1, now - lastT); // px/ms
      lastY = window.scrollY;
      lastT = now;
      if (v > 3.2) {
        html.dataset.tear = "";
        clearTimeout(tearOff);
        tearOff = window.setTimeout(() => delete html.dataset.tear, 160);
      }
    };

    // --- phosphor spit on tap / click (a tap, not the start of a scroll) -------------------
    let px = 0;
    let py = 0;
    let pt = 0;
    const onDown = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      pt = performance.now();
    };
    const onUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - px, e.clientY - py) > 8 || performance.now() - pt > 450) return;
      const t = e.target instanceof Element ? e.target : null;
      if (t?.closest("input, textarea, select, canvas, [contenteditable]")) return;
      const b = document.createElement("div");
      b.className = "signal-spit";
      b.style.left = `${e.clientX}px`;
      b.style.top = `${e.clientY}px`;
      for (let i = 0; i < 8; i++) {
        const s = document.createElement("i");
        const a = (i / 8) * Math.PI * 2 + rand(-0.3, 0.3);
        const d = rand(14, 30);
        s.style.setProperty("--dx", `${Math.cos(a) * d}px`);
        s.style.setProperty("--dy", `${Math.sin(a) * d}px`);
        b.append(s);
      }
      document.body.append(b);
      play(t?.closest("a, button, [role=button], summary, label") ? "click" : "key", 30);
      later(() => b.remove(), 420);
    };

    // --- idle: the carrier drops --------------------------------------------------------------
    let idle = 0;
    let fired = 0;
    const arm = () => {
      clearTimeout(idle);
      if (fired >= IDLE_MAX) return;
      idle = window.setTimeout(() => {
        if (document.hidden || document.querySelector("dialog[open]")) return arm();
        fired++;
        const [lost, back] = GHOST_LINES[Math.floor(Math.random() * GHOST_LINES.length)];
        if (stat.current) pulse(stat.current, "data-run", 760);
        play("static");
        setGhost(lost);
        later(() => {
          setGhost(back);
          play("ok");
        }, 1900);
        later(() => setGhost(null), 4600);
        arm();
      }, IDLE_MS);
    };
    const wake = () => arm();
    // keyboard: a dry key click for typing and shortcuts
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.length === 1 || e.key === "Enter" || e.key === "Backspace") play("key", 25);
    };
    arm();

    // --- pointer over live things: buttons are live wires (an electric arc), a link just blips
    let over: Element | null = null;
    const onOver = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const live = e.target instanceof Element ? e.target.closest("a, button, [role=button], summary, .glitch-hover") : null;
      if (live === over) return;
      over = live;
      if (live) play(live.matches("button, [role=button], .glitch-hover") ? "zap" : "hover", 45);
    };

    // --- any dialog closing powers down like a CRT (close doesn't bubble: catch it on the way down)
    const onClose = (e: Event) => {
      if (e.target instanceof HTMLDialogElement) play("off", 200);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerdown", wake, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("keydown", wake);
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("close", onClose, true);
    return () => {
      io.disconnect();
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("close", onClose, true);
      mo.disconnect();
      timers.forEach(clearTimeout);
      settling.forEach((cancel) => cancel());
      clearTimeout(tearOff);
      clearTimeout(idle);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", wake);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("keydown", wake);
      window.removeEventListener("keydown", onKey);
      delete html.dataset.tear;
      delete html.dataset.tracking;
    };
  }, [calm]);

  if (calm) return null;
  return (
    <div aria-hidden className="print:hidden">
      <div className="signal-crt" />
      <div ref={stat} className="signal-static" />
      {ghost && (
        <p className="signal-ghost" key={ghost}>
          {ghost}
        </p>
      )}
    </div>
  );
}
