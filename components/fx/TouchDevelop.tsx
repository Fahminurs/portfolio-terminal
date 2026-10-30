"use client";

import { useEffect } from "react";
import { useCalm } from "@/lib/calm";

const HOLD_MS = 650; // finger down this long → fully developed
const SINK_MS = 420; // let go → back to dither
const STEPS = 12; // grows and shrinks in hard steps, like the rest of the site's scans
const SLOP = 10; // px of travel that means "this is a scroll", not a hold

/**
 * Touch (phones, tablets) twin of DitherReveal's hover: hold a card and the photo develops out
 * of the 1-bit dither from under the finger — a circle that grows in steps, with a progress ring
 * round the fingertip and a short buzz once it's whole. It's only developed while held: let go
 * (at any point) and it shrinks back into the same spot, step by step, to dither. A quick tap is
 * left alone (it opens the gallery) and moving the finger cancels (it's a scroll).
 * Drives --rx / --ry / --rr on `.dither-reveal`; the CSS is under `(hover: none)` in globals.css.
 */
export function TouchDevelop() {
  const calm = useCalm();

  useEffect(() => {
    const touchUI = matchMedia("(hover: none)"); // checked per touch: a tablet can gain/lose a mouse
    const sinking = new WeakMap<HTMLElement, number>(); // card → its running shrink animation
    let card: HTMLElement | null = null;
    let ring: HTMLElement | null = null;
    let raf = 0;
    let sx = 0;
    let sy = 0;
    let max = 0;
    let p = 0;
    let swallowClick = false;

    const dropRing = () => {
      ring?.remove();
      ring = null;
    };

    // fully developed while still held: the ring has done its job; buzz once
    const whole = () => {
      dropRing();
      navigator.vibrate?.(12);
      swallowClick = true; // the release after a hold isn't a tap
    };

    // let go / scrolled: shrink back into the finger's spot in steps, then it's dither again
    const sink = () => {
      if (!card) return;
      cancelAnimationFrame(raf);
      dropRing();
      const el = card;
      const from = p;
      const r = max;
      card = null;
      if (from > 0.2) swallowClick = true;
      if (calm || from <= 0) {
        el.style.setProperty("--rr", "0px");
        delete el.dataset.holding;
        return;
      }
      const t0 = performance.now();
      const dur = SINK_MS * from;
      const back = (now: number) => {
        const k = Math.max(0, Math.floor((1 - (now - t0) / dur) * STEPS) / STEPS);
        el.style.setProperty("--rr", `${from * k * r}px`);
        if (k > 0) sinking.set(el, requestAnimationFrame(back));
        else {
          sinking.delete(el);
          delete el.dataset.holding;
        }
      };
      sinking.set(el, requestAnimationFrame(back));
    };

    const down = (e: PointerEvent) => {
      if (e.pointerType === "mouse" || !touchUI.matches) return;
      const el = (e.target as Element | null)?.closest<HTMLElement>(".dither-reveal");
      if (!el) return;
      const still = sinking.get(el);
      if (still) {
        cancelAnimationFrame(still);
        sinking.delete(el);
      }
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
      const t0 = performance.now();
      const grow = (now: number) => {
        if (card !== el) return;
        const t = (now - t0) / HOLD_MS;
        p = calm ? (t >= 1 ? 1 : 0) : Math.min(1, Math.ceil(t * STEPS) / STEPS);
        el.style.setProperty("--rr", `${p * max}px`);
        ring?.style.setProperty("--p", String(Math.min(1, t)));
        if (p >= 1) whole();
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

    document.addEventListener("pointerdown", down, { passive: true });
    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerup", up);
    document.addEventListener("pointercancel", up);
    document.addEventListener("click", click, true);
    document.addEventListener("contextmenu", menu);
    return () => {
      cancelAnimationFrame(raf);
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
