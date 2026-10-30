import { ShellProvider } from "@/components/shell/ShellProvider";
import { BootSequence } from "@/components/shell/BootSequence";
import { PaneNav, Titlebar } from "@/components/shell/Chrome";
import { Statusline } from "@/components/shell/Statusline";
import { CommandPalette } from "@/components/shell/CommandPalette";
import { KeyHelp } from "@/components/shell/KeyHelp";
import { RevealObserver } from "@/components/fx/RevealObserver";
import { TouchDevelop } from "@/components/fx/TouchDevelop";
import { Hero } from "@/components/hero/Hero";
import { ResumePanel } from "@/components/hero/ResumePanel";
import { About } from "@/components/about/About";
import { Projects } from "@/components/projects/Projects";
import { Archive } from "@/components/archive/Archive";
import { Education } from "@/components/timeline/Education";
import { Experience } from "@/components/timeline/Experience";
import { Records } from "@/components/records/Records";
import { Contact } from "@/components/contact/Contact";
import { profile } from "@/content/data";

export default function Home() {
  return (
    <ShellProvider>
      <BootSequence />
      <div className="grid md:grid-cols-[56px_minmax(0,1fr)] print:block">
        <PaneNav />
        <div className="min-w-0 pb-10 xl:pb-7">
          <Titlebar />
          <main>
            <Hero />
            <ResumePanel />
            <About />
            <Projects />
            <Archive />
            <Education />
            <Experience />
            <Records />
            <Contact />
          </main>
          <footer className="flex flex-wrap justify-between gap-2 border-t border-line px-4 py-6 text-[10px] text-fg-3 md:px-8">
            <span>© 2026 — build v1.0</span>
            <span>
              {profile.first} {profile.last}
            </span>
          </footer>
        </div>
      </div>
      <Statusline />
      <CommandPalette />
      <KeyHelp />
      <RevealObserver />
      <TouchDevelop />
    </ShellProvider>
  );
}
