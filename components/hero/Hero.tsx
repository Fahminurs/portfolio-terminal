"use client";

import { useEffect, useState } from "react";
import { profile } from "@/content/data";
import { DecryptedText } from "@/components/fx/DecryptedText";
import { TypeLine } from "@/components/fx/TypeLine";
import { useShell } from "@/components/shell/ShellProvider";
import { scrollToId } from "@/lib/utils";
import { BoardViewport } from "./BoardViewport";
import { Prompt } from "@/components/ui/Prompt";

export function Hero() {
  const { resumeOpen, setResumeOpen } = useShell();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const on = () => window.scrollY > 24 && setScrolled(true);
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <section
      id="index"
      aria-label="Intro"
      className="relative flex min-h-[calc(100dvh-36px-28px)] flex-col border-b border-line"
    >
      <span className="absolute -top-px left-4 border border-t-0 border-line bg-bg px-2.5 py-0.5 text-[10px] tracking-wide text-fg-3 md:left-8">
        <span className="text-accent">[0]</span> index
      </span>

      <div className="flex flex-1 flex-col justify-center px-4 pb-6 pt-14 md:px-8">
        <p className="mb-8 text-[12px] text-fg-2">
          <Prompt />
          <TypeLine text="whoami" delay={300} cps={14} cursor />
        </p>

        <div className="grid grid-cols-[minmax(0,1fr)] items-center gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-12">
          <div className="flex min-w-0 flex-col gap-5">
            <span className="w-fit border border-line-2 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-fg-2">
              {profile.role}
            </span>

            <h1 className="font-display text-[44px] leading-[0.95] tracking-[-0.01em] text-fg sm:text-[64px] xl:text-[80px]">
              <DecryptedText text={profile.first} speed={34} trigger="view" />
              <span className="block pl-[14%]">
                <DecryptedText text={profile.last} speed={30} trigger="view" />
                <span className="text-accent">_</span>
              </span>
            </h1>

            <p className="max-w-[42ch] font-prose text-[15px] leading-relaxed text-fg-2">
              {profile.tagline}
            </p>

            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => scrollToId("projects")}
                className="border border-accent bg-accent px-4 py-2.5 text-[12.5px] font-bold text-bg transition-colors hover:bg-transparent hover:text-accent"
              >
                <span className="opacity-60">$ </span>view-projects
              </button>
              <button
                onClick={() => setResumeOpen(!resumeOpen)}
                aria-expanded={resumeOpen}
                aria-controls="resume"
                className="border border-line-2 px-4 py-2.5 text-[12.5px] text-fg-2 transition-colors hover:border-fg-2 hover:text-fg"
              >
                <span className="opacity-50">$ </span>
                {resumeOpen ? "close-resume" : "view-resume"}
              </button>
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-1 text-[10.5px] text-fg-3">
              <span className="font-bold text-fg-2">GEO —</span>
              <span>
                {profile.geo.lat} / {profile.geo.lng}
              </span>
              <span>{profile.geo.city}</span>
            </div>

            <div className="mt-3 flex items-start gap-3 border-t border-line pt-4">
              <span aria-hidden className="mt-[5px] text-[10px] leading-none text-fg-3">├──┤</span>
              <span className="text-[10px] uppercase tracking-wide text-fg-3">
                SCOPE — {profile.scope}
              </span>
            </div>
          </div>

          <BoardViewport />
        </div>

        <div
          className="mt-8 text-center text-[10px] text-fg-3 transition-opacity duration-300"
          style={{ opacity: scrolled ? 0 : 1 }}
          aria-hidden
        >
          scroll
          <span className="mt-1 block animate-bounce">↓</span>
        </div>
      </div>

      <dl className="grid grid-cols-2 border-t border-line md:grid-cols-4">
        {profile.status.map((s, i) => (
          <div
            key={s.k}
            className={`border-line px-4 py-3 md:px-6 ${i % 2 === 0 ? "border-r" : ""} ${i < 2 ? "border-b md:border-b-0" : ""} ${i === 1 ? "md:border-r" : ""}`}
          >
            <dt className="text-[10px] text-fg-3">{s.k}</dt>
            <dd
              className={`mt-0.5 flex items-center gap-2 text-[13px] font-bold ${s.tone === "ok" ? "text-ok" : "text-fg"}`}
            >
              {s.tone === "ok" && <span className="size-1.5 rounded-full bg-ok pulse-dot" />}
              {s.v}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
