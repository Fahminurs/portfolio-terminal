"use client";

import { useEffect } from "react";

const ROWS = "#projects article[id^='p-']";

function isTyping(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null;
  return !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
}

/**
 * TUI list cursor for Projects: j/k (or ↑/↓ while inside the list) moves a ▶ selection bar,
 * Enter opens the project's gallery. Mouse hover moves the cursor too. Renders nothing.
 */
export function ProjectCursor() {
  useEffect(() => {
    const rows = () => [...document.querySelectorAll<HTMLElement>(ROWS)];
    const current = () => rows().findIndex((r) => r.hasAttribute("data-cursor"));
    const set = (i: number, scroll: boolean) => {
      const all = rows();
      all.forEach((r) => r.removeAttribute("data-cursor"));
      const el = all[i];
      if (!el) return;
      el.setAttribute("data-cursor", "");
      if (scroll) el.scrollIntoView({ block: "nearest" });
    };

    const inList = () => {
      const r = document.getElementById("projects")?.getBoundingClientRect();
      return !!r && r.top < innerHeight * 0.6 && r.bottom > innerHeight * 0.3;
    };

    const nearest = () => {
      let best = 0;
      let d = Infinity;
      rows().forEach((r, i) => {
        const dist = Math.abs(r.getBoundingClientRect().top - 80);
        if (dist < d) [d, best] = [dist, i];
      });
      return best;
    };

    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e) || e.ctrlKey || e.metaKey || e.altKey) return;
      if (document.querySelector("[role=dialog]")) return;
      const k = e.key;
      const i = current();
      const down = k === "j" || (k === "ArrowDown" && i >= 0);
      const up = k === "k" || (k === "ArrowUp" && i >= 0);
      if (down || up) {
        // first press lands on the row nearest the viewport (or row 01 when outside the list)
        const next = i < 0 ? (inList() ? nearest() : 0) : i + (down ? 1 : -1);
        set(Math.max(0, Math.min(rows().length - 1, next)), true);
        e.preventDefault();
      } else if (k === "Enter" && i >= 0 && document.activeElement === document.body) {
        rows()[i].querySelector<HTMLButtonElement>("button[aria-haspopup=dialog]")?.click();
        e.preventDefault();
      } else if (k === "Escape" && i >= 0) {
        set(-1, false);
      }
    };

    const onOver = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const row = (e.target as HTMLElement).closest<HTMLElement>(ROWS);
      if (row && !row.hasAttribute("data-cursor")) set(rows().indexOf(row), false);
    };

    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerover", onOver);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerover", onOver);
    };
  }, []);

  return null;
}
