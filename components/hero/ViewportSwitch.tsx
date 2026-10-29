"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useCalm } from "@/lib/calm";
import { cn } from "@/lib/utils";

// three.js stays out of the initial bundle — fetched only when the 3D view is shown
const Pcb3D = dynamic(() => import("./Pcb3D"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[clamp(240px,64vw,340px)] items-center justify-center text-[11px] text-fg-3">
      [ loading esp32.3d<span className="cursor-block ml-1 !h-[0.9em] !w-[0.5em]" /> ]
    </div>
  ),
});

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
