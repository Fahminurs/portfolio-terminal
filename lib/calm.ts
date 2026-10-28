"use client";

import { useSyncExternalStore } from "react";

const REDUCE = "(prefers-reduced-motion: reduce)";

function subscribe(cb: () => void) {
  const mq = window.matchMedia(REDUCE);
  const mo = new MutationObserver(cb);
  mq.addEventListener("change", cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-plain"] });
  return () => {
    mq.removeEventListener("change", cb);
    mo.disconnect();
  };
}

function snapshot() {
  return !!document.documentElement.dataset.plain || window.matchMedia(REDUCE).matches;
}

/** true when effects must be skipped: OS reduced-motion OR `plain` mode (§5.12). */
export function useCalm() {
  return useSyncExternalStore(subscribe, snapshot, () => false);
}
