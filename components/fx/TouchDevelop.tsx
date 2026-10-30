"use client";

import { useEffect } from "react";
import { useCalm } from "@/lib/calm";

const HOLD_MS = 650; // finger down this long → fully developed
const STEPS = 12; // grows in hard steps, like the rest of the site's scans
const SLOP = 10; // px of travel that means "this is a scroll", not a hold

/**
 * Touch (phones, tablets) twin of DitherReveal's hover: hold a card and the photo develops out
 * of the 1-bit dither from under the finger — a circle that grows in steps, with a progress ring
 * round the fingertip. Hold to the end: it stays developed (with a short buzz); let go early: it
 * sinks back. A quick tap is left alone (it opens the gallery), moving the finger cancels (it's a
 * scroll), and a card that leaves the screen goes back to dither so it can be developed again.
 * Drives --rx / --ry / --rr on `.dither-reveal`; the CSS is under `(hover: none)` in globals.css.
 */
export function TouchDevelop() {
  const calm = useCalm();

  useEffect(() => {
    const touchUI = matchMedia("(hover: none)"); // checked per touch: a tablet can gain/lose a mouse
    let card: HTMLElement | null = null;
    let ring: HTMLElement | null = null;
    let raf = 0;
    let sx = 0;
    let sy = 0;
    let max = 0;
    let p = 0;
    let swallowClick = false;

    const radius = (v: number) => card?.style.setProperty("--rr", `${v * max}px`);
    const dropRing = () => {
      ring?.remove();
      ring = null;
    };

    const finish = () => {
      if (!card) return;
      cancelAnimationFrame(raf);
      dropRing();
      card.dataset.developed = "";
      delete card.dataset.holding;
      navigator.vibrate?.(12);
      swallowClick = true; // the release after a hold isn't a tap
      card = null;
    };

    const sink = () => {
      if (!card) return;
      cancelAnimationFrame(raf);
      dropRing();
      const el = card;
      const from = p;
      card = null;
      if (from > 0.2) swallowClick = true;
      const t0 = performance.now();
      const back = (now: number) => {
        const k = Math.max(0, 1 - (now - t0) / 180);
        el.style.setProperty("--rr", `${from * k * max}px`);
        if (k > 0) requestAnimationFrame(back);
        else delete el.dataset.holding;
      };
      requestAnimationFrame(back);
    };

    const down = (e: PointerEvent) => {
      if (e.pointerType === "mouse" || !touchUI.matches) return;
      const el = (e.target as Element | null)?.closest<HTMLElement>(".dither-reveal");
      if (!el || el.hasAttribute("data-developed")) return;
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      card = el;
      sx = e.clientX;
      sy = e.clientY;
      p = 0;
      max = Math.hypot(Math.max(x, r.width - x), Math.max(y, r.height - y)) + 2;
      el.style.setProperty("--rx", `${x}px`);
      el.style.setProperty("--ry", `${y}px`);
      el.style.setProperty("--rr", "0px");
      el.dataset.holding = "";
      ring = document.createElement("span");
      ring.className = "develop-ring";
      ring.style.left = `${x}px`;
      ring.style.top = `${y}px`;
      el.append(ring);
      if (calm) {
        raf = window.setTimeout(finish, HOLD_MS) as unknown as number;
        return;
      }
      const t0 = performance.now();
      const grow = (now: number) => {
        if (!card) return;
        p = Math.min(1, Math.ceil(((now - t0) / HOLD_MS) * STEPS) / STEPS);
        radius(p);
        ring?.style.setProperty("--p", String(p));
        if (p >= 1) finish();
        else raf = requestAnimationFrame(grow);
      };
      raf = requestAnimationFrame(grow);
    };

    const move = (e: PointerEvent) => {
      if (card && Math.hypot(e.clientX - sx, e.clientY - sy) > SLOP) sink();
    };
    const up = () => sink();

    // a hold must not also count as a tap (which would open the gallery) or pop the image menu
    const click = (e: MouseEvent) => {
      if (!swallowClick) return;
      swallowClick = false;
      e.preventDefault();
      e.stopPropagation();
    };
    const menu = (e: Event) => {
      if ((e.target as Element | null)?.closest(".dither-reveal")) e.preventDefault();
    };

    // back to dither once a developed card is fully off screen, so it can be developed again
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) if (!en.isIntersecting) delete (en.target as HTMLElement).dataset.developed;
    });
    const seen = new WeakSet<Element>();
    const watch = () =>
      document.querySelectorAll(".dither-reveal").forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        io.observe(el);
      });
    watch();
    const mo = new MutationObserver(watch);
    mo.observe(document.body, { childList: true, subtree: true });

    document.addEventListener("pointerdown", down, { passive: true });
    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerup", up);
    document.addEventListener("pointercancel", up);
    document.addEventListener("click", click, true);
    document.addEventListener("contextmenu", menu);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      mo.disconnect();
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
      document.removeEventListener("pointercancel", up);
      document.removeEventListener("click", click, true);
      document.removeEventListener("contextmenu", menu);
    };
  }, [calm]);

  return null;
}
