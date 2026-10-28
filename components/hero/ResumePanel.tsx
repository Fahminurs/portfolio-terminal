"use client";

import { AnimatePresence, motion } from "motion/react";
import { useShell } from "@/components/shell/ShellProvider";
import { NoSignal } from "@/components/ui/NoSignal";

/** Drop public/resume.pdf in and set this; until then the pager shows [ no signal ]. */
const RESUME_SRC: string | null = null;

/** `less resume.pdf` — slide-down pager under the hero, not a modal (§5.2). q / Esc closes. */
export function ResumePanel() {
  const { resumeOpen, setResumeOpen } = useShell();
  return (
    <AnimatePresence initial={false}>
      {resumeOpen && (
        <motion.section
          id="resume"
          aria-label="Resume"
          initial={{ height: 0 }}
          animate={{ height: "auto" }}
          exit={{ height: 0 }}
          transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
          className="overflow-hidden border-b border-line bg-surface print:hidden"
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-1.5 text-[11px] md:px-8">
            <span className="text-fg-2">
              resume.pdf <span className="text-fg-3">— less (press q to close)</span>
            </span>
            <button onClick={() => setResumeOpen(false)} className="text-fg-3 hover:text-accent">
              [q] close
            </button>
          </div>
          <div className="p-4 md:p-8">
            {RESUME_SRC ? (
              <iframe
                src={`${RESUME_SRC}#toolbar=0&navpanes=0`}
                title="Resume Fahmi Nursafaat"
                className="h-[78vh] w-full border border-line bg-bg"
              />
            ) : (
              <NoSignal label="resume.pdf" reason="file PDF belum ada — taruh di public/resume.pdf" className="h-64" />
            )}
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
