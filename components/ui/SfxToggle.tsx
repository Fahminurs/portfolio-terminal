"use client";

import { useEffect } from "react";
import { setSfxOn, sfxOn, useSfxOn } from "@/lib/sfx";
import { useCalm } from "@/lib/calm";
import { cn } from "@/lib/utils";

/** `snd on/off` in the titlebar; `m` toggles it too. Sound is off anyway in calm mode. */
export function SfxToggle() {
  const on = useSfxOn();
  const calm = useCalm();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "m" && !e.ctrlKey && !e.metaKey && !e.altKey && !document.querySelector("dialog[open]")) setSfxOn(!sfxOn());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const live = on && !calm;
  return (
    <button
      onClick={() => setSfxOn(!on)}
      aria-pressed={live}
      disabled={calm}
      title={calm ? "suara mati di mode tenang" : "suara efek (m)"}
      className={cn(
        "ml-2 flex items-center gap-1 border px-1.5 py-px text-[10px] transition-colors disabled:opacity-40",
        live ? "border-accent text-accent" : "border-line text-fg-3 hover:text-fg-2",
      )}
    >
      <span aria-hidden>{live ? "♪" : "×"}</span>snd {live ? "on" : "off"}
    </button>
  );
}
