"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  PMREMGenerator,
  Spherical,
  Vector3,
  type MeshStandardMaterial,
  type PerspectiveCamera,
  type Scene,
  type WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { useCalm } from "@/lib/calm";
import { cn } from "@/lib/utils";
import { BUS_HEX, BUS_TEXT, LEFT, RIGHT, type Pin } from "./pins";
import {
  BOARD_L,
  BOARD_W,
  PITCH,
  ROW_X,
  makeModuleTextures,
  makePcbTextures,
  makeShieldTexture,
  pinZ,
} from "./pcbTextures";

type Hover = { side: "L" | "R"; i: number } | null;

const PIN_TIP_Y = 0.08; // pick on the top stub: the legs under the board are hidden from above

/* ─────────────────────────────── parts ── */

// rhythm of each bus while on screen: fraction of a cycle the pin glows
const PULSE: Partial<Record<NonNullable<Pin["bus"]>, [period: number, duty: number, phase: number]>> = {
  i2c: [0.5, 0.18, 0],
  uart: [1.7, 0.12, 0.3],
  sonar: [0.9, 0.08, 0.5],
  servo: [3.2, 0.2, 1.1],
  buzzer: [4.5, 0.1, 2.0],
};

function PinPost({ pin, x, z, active, animate }: { pin: Pin; x: number; z: number; active: boolean; animate: boolean }) {
  const mat = useRef<MeshStandardMaterial>(null);
  const glow = pin.bus && pin.bus !== "power" ? BUS_HEX[pin.bus] : "#fff2c8";
  const rhythm = pin.bus ? PULSE[pin.bus] : undefined;

  useFrame(({ clock }) => {
    if (!mat.current || active) return;
    if (!animate || !rhythm) {
      mat.current.emissiveIntensity = 0;
      return;
    }
    const [period, duty, phase] = rhythm;
    mat.current.emissiveIntensity = ((clock.elapsedTime + phase) % period) / period < duty ? 0.9 : 0;
  });

  return (
    // through-hole: short stub above the board, long leg below the header (breadboard side)
    <mesh position={[x, active ? -0.56 : -0.48, z]}>
      <boxGeometry args={[0.064, 1.16, 0.064]} />
      <meshStandardMaterial
        ref={mat}
        color={active ? glow : "#d6ad4f"}
        metalness={active ? 0.2 : 1}
        roughness={0.22}
        emissive={glow}
        emissiveIntensity={active ? 1.4 : 0}
      />
    </mesh>
  );
}

function Header({ side, pins, hover, animate }: { side: "L" | "R"; pins: Pin[]; hover: Hover; animate: boolean }) {
  const x = side === "L" ? -ROW_X : ROW_X;
  const mid = pinZ((pins.length - 1) / 2);
  return (
    <group>
      {/* plastic body under the board (male pins point down, like the real DevKit), notch per pin */}
      <mesh position={[x, -0.285, mid]}>
        <boxGeometry args={[0.25, 0.25, (pins.length - 1) * PITCH + 0.25]} />
        <meshStandardMaterial color="#141414" roughness={0.55} />
      </mesh>
      {pins.map((_, i) => (
        <mesh key={i} position={[x, -0.412, pinZ(i) + PITCH / 2]}>
          <boxGeometry args={[0.25, 0.006, 0.012]} />
          <meshStandardMaterial color="#050505" roughness={0.8} />
        </mesh>
      ))}
      {/* solder fillets on the top pads */}
      {pins.map((_, i) => (
        <mesh key={`s${i}`} position={[x, 0.03, pinZ(i)]}>
          <coneGeometry args={[0.07, 0.06, 12]} />
          <meshStandardMaterial color="#c9ccd0" metalness={1} roughness={0.25} />
        </mesh>
      ))}
      {pins.map((p, i) => (
        <PinPost
          key={`${side}${i}`}
          pin={p}
          x={x}
          z={pinZ(i)}
          active={hover?.side === side && hover.i === i}
          animate={animate}
        />
      ))}
    </group>
  );
}

function Chip({ p, s, legs }: { p: [number, number, number]; s: [number, number, number]; legs?: "qfn" | "sot223" }) {
  return (
    <group position={p}>
      <mesh>
        <boxGeometry args={s} />
        <meshStandardMaterial color="#121212" roughness={0.45} />
      </mesh>
      {legs === "qfn" &&
        [-1, 1].flatMap((side) =>
          [0, 1, 2, 3].map((k) => (
            <mesh key={`${side}${k}`} position={[side * (s[0] / 2 + 0.012), -s[1] / 2 + 0.01, -0.12 + k * 0.08]}>
              <boxGeometry args={[0.03, 0.02, 0.04]} />
              <meshStandardMaterial color="#c9c9c2" metalness={1} roughness={0.3} />
            </mesh>
          )),
        )}
      {legs === "sot223" && (
        <>
          <mesh position={[0, -s[1] / 2 + 0.015, -s[2] / 2 - 0.08]}>
            <boxGeometry args={[s[0] * 0.75, 0.025, 0.16]} />
            <meshStandardMaterial color="#c9c9c2" metalness={1} roughness={0.3} />
          </mesh>
          {[-1, 0, 1].map((k) => (
            <mesh key={k} position={[k * 0.15, -s[1] / 2 + 0.015, s[2] / 2 + 0.06]}>
              <boxGeometry args={[0.06, 0.025, 0.12]} />
              <meshStandardMaterial color="#c9c9c2" metalness={1} roughness={0.3} />
            </mesh>
          ))}
        </>
      )}
    </group>
  );
}

/** 0603 passives: resistors (black, white ends) and MLCC caps (tan) */
function Passive({ p, kind, rot = 0 }: { p: [number, number]; kind: "r" | "c"; rot?: number }) {
  return (
    <group position={[p[0], 0.035, p[1]]} rotation={[0, rot, 0]}>
      <mesh>
        <boxGeometry args={[0.16, 0.07, 0.08]} />
        <meshStandardMaterial color={kind === "r" ? "#161616" : "#b99a6b"} roughness={0.5} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.07, 0, 0]}>
          <boxGeometry args={[0.03, 0.075, 0.085]} />
          <meshStandardMaterial color="#d8d8d2" metalness={1} roughness={0.25} />
        </mesh>
      ))}
    </group>
  );
}

function Board({ hover, animate }: { hover: Hover; animate: boolean }) {
  const [pcb] = useState(makePcbTextures);
  const [mod] = useState(makeModuleTextures);
  const [shield] = useState(makeShieldTexture);
  const blue = useRef<MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    if (blue.current) blue.current.emissiveIntensity = animate && Math.sin(clock.elapsedTime * Math.PI) < 0 ? 0.05 : 2.2;
  });

  return (
    <group>
      {/* FR4 core + soldermask top */}
      <mesh position={[0, -0.08, 0]}>
        <boxGeometry args={[BOARD_W, 0.16, BOARD_L]} />
        <meshStandardMaterial color="#174a2c" roughness={0.6} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0015, 0]}>
        <planeGeometry args={[BOARD_W, BOARD_L]} />
        <meshStandardMaterial map={pcb.map} metalnessMap={pcb.metalnessMap} metalness={1} roughness={0.38} />
      </mesh>

      {/* ESP32-WROOM-32: module board + RF shield can */}
      <mesh position={[0, 0.045, -1.5]}>
        <boxGeometry args={[1.8, 0.08, 2.5]} />
        <meshStandardMaterial color="#121412" roughness={0.5} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0865, -1.5]}>
        <planeGeometry args={[1.8, 2.5]} />
        <meshStandardMaterial map={mod.map} metalnessMap={mod.metalnessMap} metalness={1} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.25, -1.0]}>
        <boxGeometry args={[1.62, 0.32, 1.62]} />
        <meshStandardMaterial color="#bdbdb6" metalness={1} roughness={0.32} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.4105, -1.0]}>
        <planeGeometry args={[1.6, 1.6]} />
        <meshStandardMaterial map={shield} metalness={1} roughness={0.36} />
      </mesh>

      {/* CP2102 (QFN) + AMS1117 (SOT-223) */}
      <Chip p={[0.45, 0.06, 1.25]} s={[0.42, 0.1, 0.42]} legs="qfn" />
      <Chip p={[-0.45, 0.085, 1.28]} s={[0.55, 0.13, 0.35]} legs="sot223" />

      {/* passives around the power / USB section */}
      <Passive p={[-0.95, 0.95]} kind="c" />
      <Passive p={[-0.95, 1.15]} kind="c" />
      <Passive p={[0.05, 1.05]} kind="r" rot={Math.PI / 2} />
      <Passive p={[0.12, 1.55]} kind="c" rot={Math.PI / 2} />
      <Passive p={[0.95, 1.55]} kind="r" />
      <Passive p={[-0.2, 2.0]} kind="r" />
      <Passive p={[0.25, 2.05]} kind="r" />
      <Passive p={[-0.9, -0.05]} kind="c" />
      <Passive p={[0.9, -0.05]} kind="c" />

      {/* EN / BOOT tactile switches */}
      {[-0.85, 0.85].map((x) => (
        <group key={x} position={[x, 0, 2.25]}>
          <mesh position={[0, 0.08, 0]}>
            <boxGeometry args={[0.42, 0.16, 0.34]} />
            <meshStandardMaterial color="#cfcfc8" metalness={1} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.1, 24]} />
            <meshStandardMaterial color="#1c1c1c" roughness={0.6} />
          </mesh>
        </group>
      ))}

      {/* micro-USB receptacle */}
      <group position={[0, 0.15, 2.58]}>
        <mesh>
          <boxGeometry args={[0.8, 0.28, 0.55]} />
          <meshStandardMaterial color="#d2d2cc" metalness={1} roughness={0.22} />
        </mesh>
        <mesh position={[0, 0.01, 0.276]}>
          <boxGeometry args={[0.62, 0.14, 0.01]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.9} />
        </mesh>
      </group>

      {/* LEDs: PWR (red, steady) and IO2 (blue, blinks) */}
      <mesh position={[-0.55, 0.04, 2.05]}>
        <boxGeometry args={[0.12, 0.06, 0.08]} />
        <meshStandardMaterial color="#ff5a52" emissive="#ff3b30" emissiveIntensity={2.2} roughness={0.3} />
      </mesh>
      <mesh position={[0.55, 0.04, 2.05]}>
        <boxGeometry args={[0.12, 0.06, 0.08]} />
        <meshStandardMaterial ref={blue} color="#5aa8ff" emissive="#2f8cff" emissiveIntensity={2.2} roughness={0.3} />
      </mesh>

      <Header side="L" pins={LEFT} hover={hover} animate={animate} />
      <Header side="R" pins={RIGHT} hover={hover} animate={animate} />
    </group>
  );
}


/* ─────────────────────────────── renderer (realtime only — light on any GPU) ── */

// opening shot: low three-quarter view from the antenna side, headers hanging below
const VIEW_DIR = new Vector3(-7.4, 3.4, -1.7).normalize();
const TARGET = new Vector3(0, -0.25, 0);
const MIN_DIST = 3.2;
const MAX_DIST = 24;
const FIT_W = 6.6; // world width that must fit across the frame (board + perspective margin)
const FRAME_PAD = 1.25; // opening shot sits a little back from a tight fit: room to drift and breathe

type ViewApi = { zoom: (f: number) => void; reset: () => void };

/** default viewing distance: the whole board fits the current aspect ratio, with padding */
function fitDistance(camera: PerspectiveCamera) {
  const tan = Math.tan((camera.fov * Math.PI) / 360);
  return Math.min(MAX_DIST - 4, FRAME_PAD * Math.max(8, FIT_W / (2 * tan * camera.aspect)));
}

const RESUME_MS = 3500; // idle time after the visitor lets go before the camera drifts again

/**
 * Idle camera drift: orbit, tilt and distance each follow two incommensurate sines with random
 * phases, so the path never visibly repeats. Eases in from wherever the camera is, pauses while
 * the visitor drags / zooms.
 */
function createDrift(camera: PerspectiveCamera, controls: OrbitControls) {
  const wave = (amp: [number, number], freq: [number, number]) => {
    const p = [Math.random() * Math.PI * 2, Math.random() * Math.PI * 2];
    // minus the value at t=0 → every wave starts at 0, so the drift begins exactly at the current view
    return (t: number) =>
      amp[0] * (Math.sin(freq[0] * t + p[0]) - Math.sin(p[0])) + amp[1] * (Math.sin(freq[1] * t + p[1]) - Math.sin(p[1]));
  };
  const orbit = wave([0.9, 0.45], [0.11, 0.29]);
  const tilt = wave([0.16, 0.08], [0.15, 0.37]);
  const dist = wave([0.05, 0.03], [0.09, 0.23]);
  const base = new Spherical();
  const s = new Spherical();
  const v = new Vector3();
  let t = 0;
  let live = false;
  let held = false;
  let moved = false;
  let resumeAt = 0;

  // A touch that turns into a page scroll also fires start/end — only a real drag (the pointer
  // actually travelled) or a ctrl-wheel zoom earns the RESUME_MS pause; anything else lets the
  // drift carry straight on. (The controls' own "change" can't tell: the drift fires it too.)
  const el = controls.domElement as HTMLElement;
  let sx = 0;
  let sy = 0;
  const grab = () => {
    moved = true;
    live = false;
  };
  const down = (e: PointerEvent) => {
    sx = e.clientX;
    sy = e.clientY;
  };
  const drag = (e: PointerEvent) => {
    if (held && !moved && Math.hypot(e.clientX - sx, e.clientY - sy) > 6) grab();
  };
  const zoomWheel = (e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) grab();
  };
  const hold = () => {
    held = true;
    moved = false;
  };
  const release = () => {
    held = false;
    if (moved) resumeAt = performance.now() + RESUME_MS;
  };
  el.addEventListener("pointerdown", down);
  el.addEventListener("pointermove", drag);
  el.addEventListener("wheel", zoomWheel, { passive: true });
  controls.addEventListener("start", hold);
  controls.addEventListener("end", release);

  return {
    /** start over from the current view (after the zoom / reset buttons) */
    rebase() {
      live = false;
    },
    /** advance one frame; true when it moved the camera */
    step(dt: number, paused: boolean) {
      if (paused || (held && moved) || performance.now() < resumeAt) {
        live = false;
        return false;
      }
      if (!live) {
        base.setFromVector3(v.copy(camera.position).sub(controls.target));
        t = 0;
        live = true;
      }
      t += Math.min(dt, 0.1);
      const e = Math.min(1, t / 4);
      const k = e * e * (3 - 2 * e); // smoothstep ease-in over the first 4 s
      s.set(
        base.radius * (1 + k * dist(t)),
        Math.min(1.4, Math.max(0.45, base.phi + k * tilt(t))),
        base.theta + k * orbit(t),
      );
      camera.position.setFromSpherical(s).add(controls.target);
      return true;
    },
    dispose() {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", drag);
      el.removeEventListener("wheel", zoomWheel);
      controls.removeEventListener("start", hold);
      controls.removeEventListener("end", release);
    },
  };
}

/** Imperative three.js setup (controls + studio environment). Returns a disposer. */
function createStage(gl: WebGLRenderer, scene: Scene, camera: PerspectiveCamera, touch: boolean, redraw: () => void) {
  // procedural studio reflections for the metal parts — no HDR file to fetch
  const pmrem = new PMREMGenerator(gl);
  const room = new RoomEnvironment();
  const env = pmrem.fromScene(room, 0.04).texture;
  room.dispose();
  pmrem.dispose();
  scene.environment = env;
  scene.environmentIntensity = 0.55;

  const controls = new OrbitControls(camera, gl.domElement);
  controls.target.copy(TARGET);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.zoomToCursor = !touch;
  controls.minDistance = MIN_DIST;
  controls.maxDistance = MAX_DIST;
  controls.minPolarAngle = 0.2;
  controls.maxPolarAngle = 1.75; // a little below the board edge, to see the header legs
  // phones: horizontal drag turns, vertical drag still scrolls the page, pinch zooms
  if (touch) gl.domElement.style.touchAction = "pan-y";
  controls.addEventListener("change", redraw);
  // a plain wheel scrolls the page past the viewer (it used to zoom and freeze the drift);
  // ctrl/⌘ + wheel — which is also what a trackpad pinch sends — still zooms
  const wheel = (e: WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) e.stopImmediatePropagation();
  };
  gl.domElement.addEventListener("wheel", wheel, { capture: true });

  const drift = createDrift(camera, controls);

  const reset = () => {
    camera.position.copy(VIEW_DIR).multiplyScalar(fitDistance(camera)).add(TARGET);
    controls.target.copy(TARGET);
    controls.update();
    drift.rebase();
  };
  const zoom = (f: number) => {
    const d = camera.position.distanceTo(controls.target);
    const next = Math.min(MAX_DIST, Math.max(MIN_DIST, d * f));
    camera.position.sub(controls.target).setLength(next).add(controls.target);
    controls.update();
    drift.rebase();
  };
  reset();

  return {
    controls,
    drift,
    api: { zoom, reset } satisfies ViewApi,
    dispose() {
      drift.dispose();
      gl.domElement.removeEventListener("wheel", wheel, { capture: true });
      controls.removeEventListener("change", redraw);
      controls.dispose();
      env.dispose();
      scene.environment = null;
    },
  };
}

function Stage({
  hover,
  setHover,
  touch,
  running,
  wander,
  report,
  bind,
}: {
  hover: Hover;
  setHover: (h: Hover) => void;
  touch: boolean;
  running: boolean;
  wander: boolean;
  report: (info: string) => void;
  bind: (api: ViewApi | null) => void;
}) {
  const { gl, scene, camera, size, invalidate } = useThree();
  const ctrl = useRef<OrbitControls | null>(null);
  const drift = useRef<ReturnType<typeof createDrift> | null>(null);
  const api = useRef<ViewApi | null>(null);
  const last = useRef(0);

  useEffect(() => {
    const stage = createStage(gl, scene, camera as PerspectiveCamera, touch, invalidate);
    ctrl.current = stage.controls;
    drift.current = stage.drift;
    api.current = stage.api;
    bind(stage.api);
    return () => {
      stage.dispose();
      ctrl.current = null;
      drift.current = null;
      api.current = null;
      bind(null);
    };
  }, [gl, scene, camera, touch, invalidate, bind]);

  // re-frame the board when the panel changes width (phone rotate, sidebar breakpoints). Not on
  // `size` itself: R3F measures with scroll tracking, so its top/left — and on phones the height,
  // as the address bar slides — change on every scroll, which snapped the camera back home.
  const width = size.width;
  useEffect(() => {
    if (width) api.current?.reset();
  }, [width]);

  // frames are drawn on demand; the pin/LED blink only needs ~12 fps
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => invalidate(), 83);
    return () => clearInterval(id);
  }, [running, invalidate]);

  // screen-space pin picking: nearest pin tip within 18px of the pointer
  useEffect(() => {
    const el = gl.domElement;
    const v = new Vector3();
    let down = false;
    const pick = (e: PointerEvent | MouseEvent) => {
      const r = el.getBoundingClientRect();
      const px = e.clientX - r.left;
      const py = e.clientY - r.top;
      let best: Hover = null;
      let bestD = 18 * 18;
      for (const [side, pins, x] of [["L", LEFT, -ROW_X], ["R", RIGHT, ROW_X]] as const) {
        pins.forEach((_, i) => {
          v.set(x, PIN_TIP_Y, pinZ(i)).project(camera);
          const sx = ((v.x + 1) / 2) * r.width;
          const sy = ((1 - v.y) / 2) * r.height;
          const d = (sx - px) ** 2 + (sy - py) ** 2;
          if (d < bestD) [bestD, best] = [d, { side, i }];
        });
      }
      return best as Hover;
    };
    const move = (e: PointerEvent) => {
      if (down || e.pointerType !== "mouse") return;
      setHover(pick(e));
    };
    const tap = (e: MouseEvent) => setHover(pick(e));
    const onDown = () => (down = true);
    const onUp = () => (down = false);
    const leave = () => {
      if (!down) setHover(null);
    };
    // scrolling moves the board out from under a still cursor without a pointermove,
    // which would leave a pin "hovered" and the drift held; let go of it instead
    window.addEventListener("scroll", leave, { passive: true });
    el.addEventListener("pointermove", move);
    el.addEventListener("click", tap);
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    el.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("scroll", leave);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("click", tap);
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointerleave", leave);
    };
  }, [gl, camera, setHover]);

  useFrame((_, dt) => {
    const c = ctrl.current;
    // idle drift holds still while a pin is being read, so the HUD target doesn't slide away
    const drifting = drift.current?.step(dt, !wander || !running || !!hover) ?? false;
    // drifting, or damping still settling → keep drawing at full rate
    if (c?.update(dt) || drifting) invalidate();
    gl.render(scene, camera);

    const now = performance.now();
    if (c && now - last.current > 120) {
      last.current = now;
      const cam = camera.position;
      const rot = ((Math.atan2(cam.x, cam.z) * 180) / Math.PI + 360) % 360;
      const zoom = fitDistance(camera as PerspectiveCamera) / cam.distanceTo(c.target);
      report(`zoom ${zoom.toFixed(1)}×  ROT ${rot.toFixed(0).padStart(3, "0")}°`);
    }
  }, 1);

  return <Board hover={hover} animate={running} />;
}

/* ─────────────────────────────── viewport chrome ── */

export default function Pcb3D() {
  const wrap = useRef<HTMLDivElement>(null);
  const readout = useRef<HTMLSpanElement>(null);
  const view = useRef<ViewApi | null>(null);
  const [hover, setHover] = useState<Hover>(null);
  const [running, setRunning] = useState(true);
  const calm = useCalm(); // plain mode / reduced motion: the camera stays where it's put
  // client-only component (loaded with ssr:false), so window is available in initializers
  const [touch] = useState(() => matchMedia("(pointer: coarse)").matches);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    let visible = true;
    const sync = () => setRunning(visible && !document.hidden);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      sync();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  // per-frame readout goes straight to our own DOM node, not through React state
  const report = useCallback((info: string) => {
    if (readout.current) readout.current.textContent = info;
  }, []);
  const bind = useCallback((api: ViewApi | null) => {
    view.current = api;
  }, []);

  const pin = hover ? (hover.side === "L" ? LEFT : RIGHT)[hover.i] : null;
  const tool = "border border-line-2 bg-bg/80 px-2 py-1 text-fg-2 hover:text-fg -ml-px first:ml-0";

  return (
    <div ref={wrap}>
      <div className={cn("relative h-[clamp(240px,64vw,340px)] w-full", pin ? "cursor-pointer" : !touch && "cursor-grab")}>
        <Canvas
          frameloop={running ? "demand" : "never"}
          dpr={[1, touch ? 1.25 : 1.5]}
          gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
          camera={{ position: [-7.4, 2.9, -1.7], fov: 28, near: 0.1, far: 60 }}
          style={{ position: "absolute", inset: 0 }}
          aria-label="Model 3D board ESP32 ParkEasy"
        >
          <directionalLight position={[-3, 7, -2]} intensity={1.5} />
          <directionalLight position={[4, 3, 5]} intensity={0.35} />
          <Stage
            hover={hover}
            setHover={setHover}
            touch={touch}
            running={running}
            wander={!calm}
            report={report}
            bind={bind}
          />
        </Canvas>

        {/* zoom tools */}
        <div className="absolute right-2 top-2 flex text-[11px] leading-none" role="toolbar" aria-label="Zoom">
          <button className={tool} onClick={() => view.current?.zoom(0.8)} aria-label="Zoom in">
            +
          </button>
          <button className={tool} onClick={() => view.current?.zoom(1.25)} aria-label="Zoom out">
            −
          </button>
          <button className={tool} onClick={() => view.current?.reset()} aria-label="Reset tampilan">
            reset
          </button>
        </div>

        {/* HUD — selected pin, colored by its bus */}
        <div className="pointer-events-none absolute left-2 top-2 max-w-[60%] text-[10px] leading-snug">
          {pin ? (
            <p className="bg-bg/85 px-1.5 py-0.5">
              <span className={cn("font-bold", pin.bus ? BUS_TEXT[pin.bus] : "text-fg")}>{pin.name}</span>
              <span className="text-fg-2"> — {pin.fn ?? "tidak dipakai di ParkEasy"}</span>
            </p>
          ) : (
            <p className="bg-bg/60 px-1.5 py-0.5 text-fg-3">
              {touch ? "geser putar · cubit zoom · tap pin" : "drag putar · ctrl+scroll zoom · hover pin"}
            </p>
          )}
        </div>
      </div>
      <p className="flex flex-wrap justify-between gap-x-3 border-t border-line px-3 py-1 text-[10px] tabular-nums text-fg-3">
        <span>realtime · esp32 devkit v1</span>
        <span ref={readout}>zoom 1.0× ROT 000°</span>
      </p>
    </div>
  );
}
