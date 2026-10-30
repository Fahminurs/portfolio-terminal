"use client";

import { useSyncExternalStore } from "react";

/**
 * Terminal sound effects, synthesised on the fly with WebAudio (no audio files to fetch).
 * Loud on purpose (the visitor asked for it), only ever triggered by the page reacting to something, never an ambient loop.
 * Browsers only allow sound after a user gesture, so nothing plays before the first tap / key;
 * off in calm mode (plain / reduced motion) and behind a toggle (`fahmi:sfx` in localStorage).
 */

export type Sfx =
  | "key"
  | "tick"
  | "ok"
  | "err"
  | "glitch"
  | "tear"
  | "hover"
  | "charge"
  | "click"
  | "tracking"
  | "static"
  | "thunk"
  | "off"
  | "slide"
  | "blip"
  | "probe"
  | "whole"
  | "sink"
  | "decrypt";

const KEY = "fahmi:sfx";
const CHANGE = "fahmi:sfx-change";
const VOL_KEY = "fahmi:vol";
const DRIVE = 7; // into a soft clipper + limiter: as loud as the speaker goes, no digital clipping
export const VOL_STEPS = 10; // the volume knob clicks in tenths
const VOL_DEFAULT = 8; // 80% until the visitor sets their own (kept in localStorage across reloads)

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let output: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
let unlocked = false;
const last = new Map<string, number>();

const calm = () =>
  typeof document !== "undefined" &&
  (!!document.documentElement.dataset.plain || matchMedia("(prefers-reduced-motion: reduce)").matches);

export function sfxOn() {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

export function setSfxOn(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {}
  window.dispatchEvent(new Event(CHANGE));
  if (on) {
    unlocked = true; // the toggle click itself is a gesture
    play("ok");
  }
}

/** volume level in steps, 0…VOL_STEPS */
export function sfxVolume() {
  try {
    const v = Number(localStorage.getItem(VOL_KEY));
    return localStorage.getItem(VOL_KEY) === null || !Number.isFinite(v) ? VOL_DEFAULT : Math.max(0, Math.min(VOL_STEPS, Math.round(v)));
  } catch {
    return VOL_DEFAULT;
  }
}

// ears hear loudness roughly logarithmically: square the level so each step sounds even
const gainFor = (step: number) => (step / VOL_STEPS) ** 2;

export function setSfxVolume(step: number) {
  const v = Math.max(0, Math.min(VOL_STEPS, Math.round(step)));
  if (v === sfxVolume()) return;
  try {
    localStorage.setItem(VOL_KEY, String(v));
  } catch {}
  if (ctx && output) output.gain.setTargetAtTime(gainFor(v), ctx.currentTime, 0.015);
  window.dispatchEvent(new Event(CHANGE));
  unlocked = true; // turning the knob is a gesture
  play("tick"); // so you hear the new level
}

/** React view of the volume */
export function useSfxVolume() {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener(CHANGE, cb);
      return () => window.removeEventListener(CHANGE, cb);
    },
    sfxVolume,
    () => VOL_DEFAULT,
  );
}

/** React view of the toggle */
export function useSfxOn() {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener(CHANGE, cb);
      return () => window.removeEventListener(CHANGE, cb);
    },
    sfxOn,
    () => true,
  );
}

function audio() {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = DRIVE;
    // soft clip: short blips get fat instead of thin, and nothing can exceed full scale
    const clip = ctx.createWaveShaper();
    const curve = new Float32Array(1024);
    for (let i = 0; i < curve.length; i++) curve[i] = Math.tanh(((i / (curve.length - 1)) * 2 - 1) * 2.2);
    clip.curve = curve;
    clip.oversample = "2x";
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -0.3;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.002;
    limiter.release.value = 0.08;
    output = ctx.createGain();
    output.gain.value = gainFor(sfxVolume());
    master.connect(clip).connect(limiter).connect(output).connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

// first gesture unlocks audio. A phone's touch only counts as one on pointerup / touchend / click,
// not pointerdown, so keep listening on all of them until the context is actually running.
const GESTURES = ["pointerdown", "pointerup", "touchend", "click", "keydown"] as const;
/** call from inside a user gesture handler */
export function unlockSfx() {
  unlocked = true;
  if (!sfxOn() || calm()) return;
  const c = audio();
  if (c.state === "running") GESTURES.forEach((g) => window.removeEventListener(g, unlockSfx, true));
}
if (typeof window !== "undefined") GESTURES.forEach((g) => window.addEventListener(g, unlockSfx, true));

function tone(c: AudioContext, at: number, f0: number, dur: number, type: OscillatorType, gain: number, f1 = f0) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, at);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), at + dur);
  g.gain.setValueAtTime(gain, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(master!);
  o.start(at);
  o.stop(at + dur + 0.02);
}

function noise(c: AudioContext, at: number, dur: number, gain: number, type: BiquadFilterType, freq: number, q = 1) {
  const s = c.createBufferSource();
  s.buffer = noiseBuf;
  s.loop = true;
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  s.connect(f).connect(g).connect(master!);
  s.start(at, Math.random() * 0.5);
  s.stop(at + dur + 0.02);
}

/**
 * Digital breakup: a run of tiny slices, each a random square pitch or a band of noise, hard cut
 * end to end like a buffer skipping. Every call is different.
 */
/**
 * Electricity: a 100 Hz transformer buzz and a high sizzle, both flickering on and off as the
 * contact makes and breaks, with sharp crackles of spark on top.
 */
function arc(c: AudioContext, at: number, dur: number, gain: number) {
  const g = c.createGain();
  g.connect(master!);
  // the flicker: the circuit makes and breaks every 8–30 ms
  g.gain.setValueAtTime(0, at);
  for (let t = at; t < at + dur; t += 0.008 + Math.random() * 0.022)
    g.gain.setValueAtTime(Math.random() < 0.65 ? gain * (0.5 + Math.random() * 0.5) : 0, t);
  g.gain.setValueAtTime(0, at + dur);

  const hum = c.createOscillator();
  hum.type = "sawtooth";
  hum.frequency.value = 100;
  const humAmp = c.createGain();
  humAmp.gain.value = 0.5;
  hum.connect(humAmp).connect(g);
  const sizzle = c.createBufferSource();
  sizzle.buffer = noiseBuf;
  sizzle.loop = true;
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 4500;
  sizzle.connect(hp).connect(g);
  hum.start(at);
  sizzle.start(at, Math.random() * 0.5);
  hum.stop(at + dur + 0.02);
  sizzle.stop(at + dur + 0.02);

  // sparks: dry cracks scattered across the arc
  const sparks = 5 + Math.floor(Math.random() * 7);
  for (let i = 0; i < sparks; i++)
    noise(c, at + Math.random() * dur, 0.004 + Math.random() * 0.006, gain * 2, "bandpass", 2000 + Math.random() * 6000, 0.8);
}

function stutter(c: AudioContext, at: number, slices: number, gain: number, low = 120, high = 3200) {
  let t = at;
  for (let i = 0; i < slices; i++) {
    const d = 0.012 + Math.random() * 0.03;
    const f = low * (high / low) ** Math.random();
    if (Math.random() < 0.55) tone(c, t, f, d, "square", gain * (0.6 + Math.random() * 0.4), f * (0.5 + Math.random()));
    else noise(c, t, d, gain * 1.6, "bandpass", f, 3 + Math.random() * 6);
    t += d + (Math.random() < 0.3 ? 0.012 : 0); // the odd dropout between slices
  }
  return t;
}

// scrolling is silent. A section title doesn't play its load-in (typing, decrypt, glitch) while the
// page is moving either: it waits until the scroll stops with the title on screen (whenSettled)
const SCROLL_QUIET_MS = 350;
let scrolledAt = -Infinity;
if (typeof window !== "undefined")
  window.addEventListener("scroll", () => (scrolledAt = performance.now()), { passive: true }); // the page, not inner scrollers
const scrolling = () => performance.now() - scrolledAt < SCROLL_QUIET_MS;

/** runs `cb` once the page has stopped scrolling (right away if it isn't). Returns a cancel. */
export function whenSettled(cb: () => void) {
  let id = 0;
  const check = () => {
    const wait = SCROLL_QUIET_MS - (performance.now() - scrolledAt);
    if (wait <= 0) cb();
    else id = window.setTimeout(check, wait + 20);
  };
  check();
  return () => clearTimeout(id);
}

/** is any of `el` inside the viewport right now */
export function onScreen(el: Element | null) {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.top < window.innerHeight;
}

const can = () => unlocked && sfxOn() && !calm();

/** one-shot; `gap` ms throttles repeats of the same sound */
export function play(name: Sfx, gap = 0) {
  if (!can() || scrolling()) return;
  const now = performance.now();
  if (gap && now - (last.get(name) ?? 0) < gap) return;
  last.set(name, now);
  const c = audio();
  const t = c.currentTime + 0.005;
  switch (name) {
    case "key": // mechanical key: a dry click with a little body
      tone(c, t, 1900, 0.025, "square", 0.25, 1100);
      noise(c, t, 0.018, 0.18, "highpass", 3200);
      break;
    case "tick":
      tone(c, t, 2600, 0.018, "square", 0.12);
      break;
    case "ok":
      tone(c, t, 880, 0.06, "square", 0.14);
      tone(c, t + 0.07, 1320, 0.09, "square", 0.14);
      break;
    case "err":
      tone(c, t, 220, 0.12, "square", 0.16, 180);
      break;
    case "glitch": // a heading tears: a skipping buffer over a low buzz
      stutter(c, t, 4 + Math.floor(Math.random() * 4), 0.32);
      tone(c, t, 90 + Math.random() * 60, 0.16, "sawtooth", 0.16, 45);
      break;
    case "tear": {
      // scrolled too fast: a longer, harsher breakup that drops away
      const end = stutter(c, t, 8 + Math.floor(Math.random() * 5), 0.38, 80, 4200);
      tone(c, t, 240, end - t + 0.05, "sawtooth", 0.2, 30);
      noise(c, end, 0.08, 0.3, "highpass", 2500);
      break;
    }
    case "hover": // the pointer lands on something live
      tone(c, t, 3400 + Math.random() * 400, 0.016, "square", 0.08);
      break;
    case "charge": // a glitchy button: the same blip as a link, then the wire arcs
      tone(c, t, 3400 + Math.random() * 400, 0.016, "square", 0.08);
      arc(c, t + 0.04, 0.16 + Math.random() * 0.1, 0.4);
      break;
    case "click": // a heavier relay click than a key
      tone(c, t, 420, 0.03, "square", 0.24, 140);
      noise(c, t, 0.02, 0.22, "highpass", 2200);
      tone(c, t + 0.035, 2400, 0.008, "square", 0.08);
      break;
    case "tracking": // a low tape-wobble hum rolling past
      tone(c, t, 62, 0.9, "sawtooth", 0.06, 48);
      noise(c, t, 0.9, 0.07, "lowpass", 500);
      break;
    case "static": // carrier lost: a wash of static, then the line beeps back
      noise(c, t, 0.75, 0.32, "highpass", 900);
      tone(c, t + 0.8, 1000, 0.12, "sine", 0.12);
      break;
    case "thunk": // CRT degauss as a modal comes up
      tone(c, t, 170, 0.28, "sine", 0.4, 42);
      noise(c, t, 0.12, 0.16, "lowpass", 700);
      break;
    case "off": // CRT switched off: the picture collapses to a dot with a falling whine
      tone(c, t, 1400, 0.32, "sine", 0.22, 60);
      noise(c, t, 0.05, 0.3, "lowpass", 1200);
      tone(c, t + 0.3, 60, 0.12, "sine", 0.25, 30);
      break;
    case "slide": // next figure: a scan sweeping across, stepped like the projector
      for (let i = 0; i < 6; i++) tone(c, t + i * 0.022, 500 * 1.45 ** i, 0.02, "square", 0.08);
      noise(c, t, 0.15, 0.12, "bandpass", 2600, 1.5);
      break;
    case "blip": // a new section scrolls in
      tone(c, t, 660, 0.03, "square", 0.08);
      tone(c, t + 0.04, 990, 0.04, "square", 0.07);
      break;
    case "probe": // a pin under the cursor: a multimeter beep
      tone(c, t, 1200 + Math.random() * 800, 0.045, "sine", 0.18);
      tone(c, t, 60, 0.04, "square", 0.05);
      break;
    case "sink": // the photo shrinks back into dither
      tone(c, t, 900, 0.3, "sine", 0.1, 240);
      break;
    case "decrypt": // a character locks in out of the noise: a teletype chirp, pitch all over
      tone(c, t, 1800 + Math.random() * 2400, 0.022, "square", 0.12, 900 + Math.random() * 600);
      break;
    case "whole":
      tone(c, t, 1320, 0.05, "square", 0.12);
      tone(c, t + 0.06, 1760, 0.08, "square", 0.12);
      break;
  }
}

/**
 * A sustained sound that runs until stopped (dot-matrix print head, a held press).
 * Returns the stopper; a no-op when sound is off.
 */
export function hold(name: "print" | "develop" | "servo", ms = 650): () => void {
  if (!can()) return () => {};
  const c = audio();
  const t = c.currentTime + 0.005;
  const out = c.createGain();
  out.connect(master!);
  const nodes: AudioScheduledSourceNode[] = [];
  if (name === "print") {
    // a buzzing head: a square carrier chopped by a fast square LFO
    const o = c.createOscillator();
    o.type = "square";
    o.frequency.value = 520;
    const chop = c.createOscillator();
    chop.type = "square";
    chop.frequency.value = 38;
    const depth = c.createGain();
    depth.gain.value = 0.5;
    const amp = c.createGain();
    amp.gain.value = 0.5;
    chop.connect(depth).connect(amp.gain);
    o.connect(amp).connect(out);
    out.gain.value = 0.07;
    nodes.push(o, chop);
  } else if (name === "servo") {
    // the board being turned by hand: a geared whine with a slow wobble
    const o = c.createOscillator();
    o.type = "sawtooth";
    o.frequency.value = 140;
    const wob = c.createOscillator();
    wob.frequency.value = 7;
    const wobDepth = c.createGain();
    wobDepth.gain.value = 18;
    wob.connect(wobDepth).connect(o.frequency);
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 900;
    o.connect(f).connect(out);
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(0.06, t + 0.08);
    nodes.push(o, wob);
  } else {
    // a rising tone while the photo develops under the finger
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(260, t);
    o.frequency.exponentialRampToValueAtTime(900, t + ms / 1000);
    o.connect(out);
    out.gain.value = 0.1;
    nodes.push(o);
  }
  nodes.forEach((n) => n.start(t));
  let stopped = false;
  return () => {
    if (stopped) return;
    stopped = true;
    const e = c.currentTime;
    out.gain.setTargetAtTime(0.0001, e, 0.02);
    nodes.forEach((n) => n.stop(e + 0.1));
  };
}
