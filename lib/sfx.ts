"use client";

import { useSyncExternalStore } from "react";

/**
 * Terminal sound effects, synthesised on the fly with WebAudio (no audio files to fetch).
 * Quiet by design, only ever triggered by the page reacting to something, never an ambient loop.
 * Browsers only allow sound after a user gesture, so nothing plays before the first tap / key;
 * off in calm mode (plain / reduced motion) and behind a toggle (`fahmi:sfx` in localStorage).
 */

export type Sfx = "key" | "tick" | "ok" | "glitch" | "tracking" | "static" | "thunk" | "whole" | "err";

const KEY = "fahmi:sfx";
const CHANGE = "fahmi:sfx-change";
const VOLUME = 0.16;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
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
    master.gain.value = VOLUME;
    master.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

// first gesture unlocks audio for the rest of the visit
if (typeof window !== "undefined") {
  const unlock = () => {
    unlocked = true;
    if (sfxOn() && !calm()) audio();
  };
  window.addEventListener("pointerdown", unlock, { once: true, capture: true });
  window.addEventListener("keydown", unlock, { once: true, capture: true });
}

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

const can = () => unlocked && sfxOn() && !calm();

/** one-shot; `gap` ms throttles repeats of the same sound */
export function play(name: Sfx, gap = 0) {
  if (!can()) return;
  const now = performance.now();
  if (gap && now - (last.get(name) ?? 0) < gap) return;
  last.set(name, now);
  const c = audio();
  const t = c.currentTime + 0.005;
  switch (name) {
    case "key": // mechanical key: a dry click with a little body
      tone(c, t, 1900, 0.014, "square", 0.22, 1100);
      noise(c, t, 0.018, 0.18, "highpass", 3200);
      break;
    case "tick":
      tone(c, t, 2600, 0.008, "square", 0.08);
      break;
    case "ok":
      tone(c, t, 880, 0.06, "square", 0.14);
      tone(c, t + 0.07, 1320, 0.09, "square", 0.14);
      break;
    case "err":
      tone(c, t, 220, 0.12, "square", 0.16, 180);
      break;
    case "glitch":
      noise(c, t, 0.09, 0.3, "bandpass", 1400, 2.5);
      tone(c, t, 160, 0.09, "sawtooth", 0.1, 60);
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
export function hold(name: "print" | "develop", ms = 650): () => void {
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
