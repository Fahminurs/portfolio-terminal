"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useCalm } from "@/lib/calm";
import { cn } from "@/lib/utils";
import { AsciiProgress } from "@/components/fx/AsciiProgress";

// three.js stays out of the initial bundle — fetched only when the 3D view is shown
const Pcb3D = dynamic(() => import("./Pcb3D"), {
  ssr: false,
  loading: () => <ChunkLoading />,
});

/**
 * First half of the 3D loader, while the three.js chunk downloads. The browser doesn't report
 * a dynamic import's progress, so the bar creeps toward 55% (where Pcb3D's own log picks up).
 */
function ChunkLoading() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const t0 = performance.now();
    const id = window.setInterval(() => setP(0.55 * (1 - Math.exp(-(performance.now() - t0) / 900))), 90);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex h-[clamp(240px,64vw,340px)] items-center px-4">
      <AsciiProgress
        cmd="load esp32.3d"
        className="w-full max-w-[420px]"
        steps={[
          { label: "fetch three.js + r3f", done: false },
          { label: "webgl context", done: false },
          { label: "compile shaders", done: false },
          { label: "first frame", done: false },
        ]}
        progress={p}
      />
    </div>
  );
}

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

type View = "3d" | "pinout";

/**
 * `[3d] [pinout]` switch for VIEWPORT_01. 3D is the default where it can run; plain mode,
 * reduced motion or no WebGL fall back to the static pinout (also the SSR / loading state).
 */
export function ViewportSwitch({ pinout }: { pinout: React.ReactNode }) {
  const calm = useCalm();
  const [can3d, setCan3d] = useState(false);
  const [pick, setPick] = useState<View | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- WebGL probe needs the DOM
    setCan3d(hasWebGL());
  }, []);

  const view: View = !can3d ? "pinout" : (pick ?? (calm ? "pinout" : "3d"));

  return (
    <div>
      <div role="tablist" aria-label="Tampilan viewport" className="flex gap-1 px-3 pt-1 text-[10px]">
        {(["3d", "pinout"] as const).map((v) => (
          <button
            key={v}
            role="tab"
            aria-selected={view === v}
            disabled={v === "3d" && !can3d}
            onClick={() => setPick(v)}
            className={cn(
              "px-1.5 py-0.5 disabled:opacity-30",
              view === v ? "bg-fg font-bold text-bg" : "text-fg-3 hover:text-fg-2",
            )}
          >
            {v === "3d" ? "3d viewer" : "pinout"}
          </button>
        ))}
      </div>
      {view === "3d" ? <Pcb3D /> : pinout}
    </div>
  );
}
