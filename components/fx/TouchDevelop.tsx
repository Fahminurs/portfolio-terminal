"use client";

import { useEffect } from "react";
import { useCalm } from "@/lib/calm";

const HOLD_MS = 650; // finger down this long → fully developed
const SINK_MS = 420; // let go → back to dither
const DWELL_MS = 4000; // a fully developed photo stays this long after release (max 5 s asked)
const TAP_MS = 250; // a press on a dwelling card shorter than this is a tap (opens the gallery)
const STEPS = 12; // grows and shrinks in hard steps, like the rest of the site's scans
const SLOP = 10; // px of travel that means "this is a scroll", not a hold

/**
 * Touch (phones, tablets) twin of DitherReveal's hover: hold a card and the photo develops out
 * of the 1-bit dither from under the finger — a circle that grows in steps, with a progress ring
 * round the fingertip and a short buzz once it's whole. Let go early and it shrinks straight back
 * into the same spot, step by step, to dither; let go once it's whole and it stays up for
 * DWELL_MS with a draining bar along the bottom, then shrinks away (holding it again keeps it up).
 * A quick tap is left alone (it opens the gallery) and moving the finger cancels (it's a scroll).
 * Drives --rx / --ry / --rr on `.dither-reveal`; the CSS is under `(hover: none)` in globals.css.
 */
export function TouchDevelop() {
  const calm = useCalm();

  useEffect(() => {
    const touchUI = matchMedia("(hover: none)"); // checked per touch: a tablet can gain/lose a mouse
    const sinking = new WeakMap<HTMLElement, number>(); // card → its running shrink animation
    const dwelling = new WeakMap<HTMLElement, { id: number; bar: HTMLElement; r: number }>(); // card → its countdown
    let card: HTMLElement | null = null;
    let reopened = false; // this press landed on a photo that was already up
    let moved = false;
    let downAt = 0;
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

    // shrink back into the finger's spot in steps, then it's dither again
    const shrink = (el: HTMLElement, from: number, r: number) => {
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

    // fully developed and let go: leave the photo up for a moment with a draining countdown
    // bar along the bottom, then shrink it away
    const dwell = (el: HTMLElement, r: number) => {
      const bar = document.createElement("span");
      bar.className = "develop-timer";
      bar.style.setProperty("--dwell", `${DWELL_MS}ms`);
      el.append(bar);
      const id = window.setTimeout(() => {
        dwelling.delete(el);
        bar.remove();
        shrink(el, 1, r);
      }, DWELL_MS);
      dwelling.set(el, { id, bar, r });
    };

    // finger up / scrolled away
    const release = () => {
      if (!card) return;
      cancelAnimationFrame(raf);
      dropRing();
      const el = card;
      const from = p;
      const r = max;
      card = null;
      if (from >= 1) {
        // a quick tap on an already-open photo is still a tap: let it open the gallery
        swallowClick = !(reopened && performance.now() - downAt < TAP_MS && !moved);
        dwell(el, r);
        return;
      }
      if (from > 0.2) swallowClick = true;
      shrink(el, from, r);
    };

    const down = (e: PointerEvent) => {
      if (e.pointerType === "mouse" || !touchUI.matches) return;
      const el = (e.target as Element | null)?.closest<HTMLElement>(".dither-reveal");
      if (!el) return;
      downAt = performance.now();
      moved = false;
      const open = dwelling.get(el);
      if (open) {
        // already showing: holding it keeps it up, the countdown starts over on release
        clearTimeout(open.id);
        open.bar.remove();
        dwelling.delete(el);
        card = el;
        sx = e.clientX;
        sy = e.clientY;
        p = 1;
        max = open.r;
        reopened = true;
        return;
      }
      reopened = false;
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
      if (card && Math.hypot(e.clientX - sx, e.clientY - sy) > SLOP) {
        moved = true;
        release();
      }
    };
    const up = () => release();

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
