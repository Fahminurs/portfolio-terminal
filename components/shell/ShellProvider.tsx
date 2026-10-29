"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { MotionConfig } from "motion/react";
import { sections, type SectionId } from "@/content/data";
import { scrollToId } from "@/lib/utils";
import { useCalm } from "@/lib/calm";

export type Theme = "amber" | "green" | "ice";

type ShellCtx = {
  active: SectionId;
  paletteOpen: boolean;
  setPaletteOpen: (v: boolean) => void;
  resumeOpen: boolean;
  setResumeOpen: (v: boolean) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  /** recruiter mode (§5.12): no boot/decrypt/typing/3D, same as reduced-motion */
  togglePlain: () => boolean;
};

const Ctx = createContext<ShellCtx | null>(null);

export function useShell() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useShell must be used inside <ShellProvider>");
  return c;
}

function isTyping(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null;
  return !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
}

export function ShellProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState<SectionId>("index");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [resumeOpen, setResumeOpenState] = useState(false);
  const [theme, setThemeState] = useState<Theme>("amber");

  useEffect(() => {
    const t = (localStorage.getItem("fahmi:theme") as Theme | null) ?? "amber";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync from storage after hydration
    setThemeState(t);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem("fahmi:theme", t);
    if (t === "amber") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = t;
  }, []);

  const togglePlain = useCallback(() => {
    const d = document.documentElement;
    const on = !d.dataset.plain;
    if (on) {
      d.dataset.plain = "1";
      localStorage.setItem("fahmi:plain", "1");
    } else {
      delete d.dataset.plain;
      localStorage.removeItem("fahmi:plain");
    }
    return on;
  }, []);

  const calm = useCalm();

  // the resume is a modal now: nothing to scroll to
  const setResumeOpen = useCallback((v: boolean) => setResumeOpenState(v), []);

  // scroll spy
  useEffect(() => {
    const els = sections
      .map((s) => document.getElementById(s.id))
      .filter((x): x is HTMLElement => !!x);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id as SectionId);
        }
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // global keybinds: "/" or Ctrl+K → prompt, 0–7 → jump to pane, q/Esc → close resume
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(!paletteOpen);
        return;
      }
      if (isTyping(e) || paletteOpen || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "/") {
        e.preventDefault();
        setPaletteOpen(true);
      } else if (/^[0-7]$/.test(e.key)) {
        const s = sections[Number(e.key)];
        if (s) scrollToId(s.id);
      } else if ((e.key === "q" || e.key === "Escape") && resumeOpen) {
        setResumeOpenState(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paletteOpen, resumeOpen]);

  return (
    <Ctx.Provider
      value={{ active, paletteOpen, setPaletteOpen, resumeOpen, setResumeOpen, theme, setTheme, togglePlain }}
    >
      <MotionConfig reducedMotion={calm ? "always" : "user"}>{children}</MotionConfig>
    </Ctx.Provider>
  );
}
