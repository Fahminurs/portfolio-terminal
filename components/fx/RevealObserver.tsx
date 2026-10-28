"use client";

import { useEffect } from "react";

const STEP_MS = 70;
const MAX_STAGGER = 5;

/**
 * Marks `[data-reveal]` blocks as shown the first time they enter the viewport; CSS does the
 * scan-in. Blocks entering together are staggered like lines printed one after another.
 */
export function RevealObserver() {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.revealReady = "1";

    const io = new IntersectionObserver(
      (entries) => {
        let n = 0;
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          el.style.setProperty("--reveal-delay", `${Math.min(n++, MAX_STAGGER) * STEP_MS}ms`);
          el.dataset.shown = "";
          io.unobserve(el);
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );

    const watch = (scope: ParentNode) =>
      scope.querySelectorAll<HTMLElement>("[data-reveal]:not([data-shown])").forEach((el) => io.observe(el));
    watch(document);
    // blocks mounted later (e.g. after a filter) still get picked up
    const mo = new MutationObserver(() => watch(document));
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}
