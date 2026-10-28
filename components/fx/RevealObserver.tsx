"use client";

import { useEffect } from "react";
import { isBooted, onBooted } from "@/lib/visits";

const STEP_MS = 70;
const MAX_STAGGER = 5;

/**
 * Prints `[data-reveal]` blocks (CSS scan-in) every time they enter the viewport. A block is
 * re-armed only once it is well outside the viewport (20% margin), so scrolling slowly across
 * an edge never makes it flicker. Blocks entering together are staggered like printed lines.
 */
export function RevealObserver() {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.revealReady = "1";

    const show = new IntersectionObserver(
      (entries) => {
        if (!isBooted()) return; // re-checked below once the boot log lifts
        let n = 0;
        for (const e of entries) {
          const el = e.target as HTMLElement;
          if (!e.isIntersecting || el.hasAttribute("data-shown")) continue;
          el.style.setProperty("--reveal-delay", `${Math.min(n++, MAX_STAGGER) * STEP_MS}ms`);
          el.dataset.shown = "";
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );

    // fully out (with margin) → hide again so the next visit prints it anew
    const rearm = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (!e.isIntersecting) (e.target as HTMLElement).removeAttribute("data-shown");
      },
      { rootMargin: "20% 0px 20% 0px" },
    );

    const seen = new WeakSet<Element>();
    const watch = () =>
      document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        show.observe(el);
        rearm.observe(el);
      });
    watch();
    // blocks mounted later (e.g. after a filter) still get picked up
    const mo = new MutationObserver(watch);
    mo.observe(document.body, { childList: true, subtree: true });

    // blocks already on screen under the boot log: re-observe so the IO reports them fresh
    const stop = onBooted(() =>
      document.querySelectorAll("[data-reveal]:not([data-shown])").forEach((el) => {
        show.unobserve(el);
        show.observe(el);
      }),
    );

    return () => {
      show.disconnect();
      rearm.disconnect();
      mo.disconnect();
      stop();
    };
  }, []);

  return null;
}
