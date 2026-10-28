"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Counts "visits": +1 each time the element enters the viewport after having been well
 * outside it (20% margin) — same rule as RevealObserver, so every replayed effect agrees.
 * 0 = never seen yet. Also returns whether it is currently in view.
 */
export function useVisits(ref: RefObject<Element | null>, enterMargin = "0px 0px -8% 0px") {
  const [visits, setVisits] = useState(0);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let armed = true;
    const show = new IntersectionObserver(
      ([e]) => {
        setInView(e.isIntersecting);
        if (e.isIntersecting && armed) {
          armed = false;
          setVisits((v) => v + 1);
        }
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
    return () => {
      show.disconnect();
      rearm.disconnect();
    };
  }, [ref, enterMargin]);

  return { visits, inView };
}
