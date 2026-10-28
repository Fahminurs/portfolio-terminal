"use client";

import { useEffect, useState, type RefObject } from "react";

/** The boot log covers the page on first load — effects must not play underneath it. */
export const isBooted = () => !!document.documentElement.dataset.booted;

/** Calls `cb` once the boot screen is gone (immediately if it already is). Returns cleanup. */
export function onBooted(cb: () => void) {
  if (isBooted()) {
    cb();
    return () => {};
  }
  const mo = new MutationObserver(() => {
    if (!isBooted()) return;
    mo.disconnect();
    cb();
  });
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-booted"] });
  return () => mo.disconnect();
}

/**
 * Counts "visits": +1 each time the element enters the viewport after having been well
 * outside it (20% margin) — same rule as RevealObserver, so every replayed effect agrees.
 * Nothing counts while the boot screen is up. 0 = never seen yet.
 */
export function useVisits(ref: RefObject<Element | null>, enterMargin = "0px 0px -8% 0px") {
  const [visits, setVisits] = useState(0);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let armed = true;
    let visible = false;
    const visit = () => {
      if (visible && armed && isBooted()) {
        armed = false;
        setVisits((v) => v + 1);
      }
    };
    const show = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        setInView(e.isIntersecting);
        visit();
      },
      { rootMargin: enterMargin },
    );
    const rearm = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) armed = true;
      },
      { rootMargin: "20% 0px 20% 0px" },
    );
    show.observe(el);
    rearm.observe(el);
    // already on screen when the boot log lifts (e.g. the hero) → that's the first visit
    const stop = onBooted(visit);
    return () => {
      show.disconnect();
      rearm.disconnect();
      stop();
    };
  }, [ref, enterMargin]);

  return { visits, inView };
}
