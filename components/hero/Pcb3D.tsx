"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  EquirectangularReflectionMapping,
  Vector3,
  type Camera,
  type MeshStandardMaterial,
  type Scene,
  type WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GradientEquirectTexture, WebGLPathTracer } from "three-gpu-pathtracer";
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

export type Mode = "opengl" | "raytrace";
type Hover = { side: "L" | "R"; i: number } | null;

const MAX_SAMPLES = 360;
const PIN_TIP_Y = 0.08; // pick on the top stub: the legs under the board are hidden from above

/* ─────────────────────────────── parts ── */

// rhythm of each bus while idle (opengl mode only): fraction of a cycle the pin glows
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

      {/* LEDs: PWR (red, steady) and IO2 (blue, blinks in opengl mode) */}
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

/* ─────────────────────────────── renderer: opengl ↔ raytrace ── */

type Status = { mode: Mode; samples: number; compiling: boolean; info: string };

function makeEnvironment() {
  // procedural studio sky: bright top, dark floor — no HDR file to fetch
  const t = new GradientEquirectTexture(256);
  t.topColor.set("#ffffff");
  t.bottomColor.set("#2b302a");
  t.exponent = 1.6;
  t.update();
  t.mapping = EquirectangularReflectionMapping;
  return t;
}

/** Imperative three.js setup (controls, path tracer, environment). Returns a disposer. */
function createStage(
  gl: WebGLRenderer,
  scene: Scene,
  camera: Camera,
  env: GradientEquirectTexture,
  touch: boolean,
) {
  scene.environment = env;
  scene.environmentIntensity = 0.95;

  const controls = new OrbitControls(camera, gl.domElement);
  controls.target.set(0, -0.2, 0.1);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.minPolarAngle = 0.25;
  controls.maxPolarAngle = 1.3;
  controls.autoRotateSpeed = 0.9;
  if (touch) {
    // keep the page scrollable on phones: the board turns by itself, taps still pick pins
    controls.enabled = false;
    gl.domElement.style.touchAction = "pan-y";
  }

  const tracer = new WebGLPathTracer(gl);
  tracer.tiles.set(2, 2);
  tracer.bounces = 5;
  tracer.filterGlossyFactor = 0.5;
  tracer.minSamples = 3;
  tracer.fadeDuration = 350;
  tracer.renderDelay = 60;
  tracer.renderScale = 1;

  const onChange = () => tracer.updateCamera();
  controls.addEventListener("change", onChange);

  return {
    controls,
    tracer,
    dispose() {
      controls.removeEventListener("change", onChange);
      controls.dispose();
      tracer.dispose();
      scene.environment = null;
    },
  };
}

function Stage({
  mode,
  hover,
  setHover,
  touch,
  report,
}: {
  mode: Mode;
  hover: Hover;
  setHover: (h: Hover) => void;
  touch: boolean;
  report: (s: Status) => void;
}) {
  const { gl, scene, camera, size } = useThree();
  const [env] = useState(makeEnvironment);
  const ctrl = useRef<OrbitControls | null>(null);
  const pt = useRef<WebGLPathTracer | null>(null);
  const dirty = useRef(true);
  const last = useRef(0);

  // controls + path tracer + environment, created once per renderer
  useEffect(() => {
    const stage = createStage(gl, scene, camera, env, touch);
    ctrl.current = stage.controls;
    pt.current = stage.tracer;
    return () => {
      stage.dispose();
      ctrl.current = null;
      pt.current = null;
    };
  }, [gl, scene, camera, env, touch]);

  // any change to what's on screen → rebuild the path-traced scene (tiny board: a few ms)
  useEffect(() => {
    dirty.current = true;
  }, [mode, hover]);

  useEffect(() => {
    if (ctrl.current) ctrl.current.autoRotate = mode === "opengl" && !hover;
  }, [mode, hover]);

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
    el.addEventListener("pointermove", move);
    el.addEventListener("click", tap);
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("click", tap);
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointerleave", leave);
    };
  }, [gl, camera, setHover]);

  useFrame((_, dt) => {
    ctrl.current?.update(dt);
    const tracer = pt.current;
    const cam = camera.position;
    const rot = ((Math.atan2(cam.x, cam.z) * 180) / Math.PI + 360) % 360;
    const info = `X ${cam.x.toFixed(2)}  Y ${cam.y.toFixed(2)}  Z ${cam.z.toFixed(2)}  ROT ${rot.toFixed(0).padStart(3, "0")}°`;

    if (mode === "opengl" || !tracer) {
      gl.render(scene, camera);
    } else {
      if (dirty.current) {
        scene.updateMatrixWorld(true);
        tracer.setScene(scene, camera);
        dirty.current = false;
      }
      // converged → stop drawing; the canvas keeps the last frame
      if (tracer.samples < MAX_SAMPLES) tracer.renderSample();
    }

    const now = performance.now();
    if (now - last.current > 120) {
      last.current = now;
      // `isCompiling` exists at runtime (WebGLPathTracer.js) but is missing from the package's .d.ts
      const compiling = !!(tracer as (WebGLPathTracer & { isCompiling?: boolean }) | null)?.isCompiling;
      report({ mode, samples: tracer ? Math.floor(tracer.samples) : 0, compiling, info });
    }
  }, 1);

  // keep the aspect right when the panel resizes
  useEffect(() => {
    pt.current?.updateCamera();
  }, [size]);

  return <Board hover={hover} animate={mode === "opengl"} />;
}

/* ─────────────────────────────── viewport chrome ── */

export default function Pcb3D() {
  const wrap = useRef<HTMLDivElement>(null);
  const readout = useRef<HTMLSpanElement>(null);
  const status = useRef<HTMLSpanElement>(null);
  const [hover, setHover] = useState<Hover>(null);
  const [running, setRunning] = useState(true);
  // client-only component (loaded with ssr:false), so window is available in initializers
  const [touch] = useState(() => matchMedia("(pointer: coarse)").matches);
  // raytracing by default on desktop; phones start in realtime (they can opt in)
  const [mode, setMode] = useState<Mode>(() => (touch || innerWidth < 768 ? "opengl" : "raytrace"));

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

  // per-frame status goes straight to our own DOM nodes, not through React state
  const report = useCallback((s: Status) => {
    if (readout.current) readout.current.textContent = s.info;
    if (!status.current) return;
    if (s.mode === "opengl") status.current.textContent = "opengl · realtime";
    else if (s.compiling) status.current.textContent = "raytracing · compiling shaders…";
    else {
      const n = Math.min(s.samples, MAX_SAMPLES);
      const filled = Math.round((n / MAX_SAMPLES) * 10);
      status.current.textContent = `raytracing [${"#".repeat(filled)}${"-".repeat(10 - filled)}] ${n}/${MAX_SAMPLES} spp${n >= MAX_SAMPLES ? " · done" : ""}`;
    }
  }, []);

  const pin = hover ? (hover.side === "L" ? LEFT : RIGHT)[hover.i] : null;

  return (
    <div ref={wrap}>
      <div className={cn("relative h-[clamp(240px,64vw,340px)] w-full", pin ? "cursor-pointer" : !touch && "cursor-grab")}>
        <Canvas
          frameloop={running ? "always" : "never"}
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true, preserveDrawingBuffer: false }}
          camera={{ position: [4.6, 5.2, 5.4], fov: 28, near: 0.1, far: 60 }}
          style={{ position: "absolute", inset: 0 }}
          aria-label="Model 3D board ESP32 ParkEasy"
        >
          <directionalLight position={[3, 7, 2]} intensity={1.6} />
          <Stage mode={mode} hover={hover} setHover={setHover} touch={touch} report={report} />
        </Canvas>

        {/* KiCad-like render switch */}
        <div className="absolute right-2 top-2 flex text-[10px]" role="radiogroup" aria-label="Mode render">
          {(
            [
              ["opengl", "OpenGL"],
              ["raytrace", "Raytracing"],
            ] as const
          ).map(([m, label]) => (
            <button
              key={m}
              role="radio"
              aria-checked={mode === m}
              onClick={() => setMode(m)}
              className={cn(
                "border border-line-2 px-2 py-1 first:border-r-0",
                mode === m ? "bg-fg font-bold text-bg" : "bg-bg/80 text-fg-2 hover:text-fg",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* HUD — selected pin, colored by its bus */}
        <div className="pointer-events-none absolute left-2 top-2 max-w-[60%] text-[10px] leading-snug">
          {pin ? (
            <p className="bg-bg/85 px-1.5 py-0.5">
              <span className={cn("font-bold", pin.bus ? BUS_TEXT[pin.bus] : "text-fg")}>{pin.name}</span>
              <span className="text-fg-2"> — {pin.fn ?? "tidak dipakai di ParkEasy"}</span>
            </p>
          ) : (
            <p className="bg-bg/60 px-1.5 py-0.5 text-fg-3">{touch ? "tap pin untuk detail" : "drag untuk putar · hover pin"}</p>
          )}
        </div>
      </div>
      <p className="flex flex-wrap justify-between gap-x-3 border-t border-line px-3 py-1 text-[10px] tabular-nums text-fg-3">
        <span ref={status}>opengl · realtime</span>
        <span ref={readout} className="hidden sm:inline">
          X 0.00 Y 0.00 Z 0.00 ROT 000°
        </span>
      </p>
    </div>
  );
}
