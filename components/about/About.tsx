import { about, sections } from "@/content/data";
import { SectionHead } from "@/components/ui/SectionHead";
import { DitherReveal } from "@/components/fx/DitherReveal";
import { StackTree } from "./StackTree";
import { Prompt } from "@/components/ui/Prompt";

const s = sections[1];

export function About() {
  return (
    <section id={s.id} aria-label="About" className="relative border-b border-line">
      <SectionHead n={s.n} label={s.label} cmd={s.cmd} title="About" />
      <div className="mt-8 grid border-t border-line md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:grid-cols-[minmax(0,1fr)_minmax(0,2.25fr)_minmax(0,1.55fr)]">
        <div className="border-line p-4 md:border-r md:p-8">
          <div className="mx-auto max-w-[240px] md:sticky md:top-14 md:max-w-none">
            <DitherReveal alt="Foto Fahmi Nursafaat" label="portrait.dither.png" className="aspect-[4/5]" />
            <p className="mt-2 text-[10px] text-fg-3">FIG.01 — portrait.dither.png</p>
          </div>
        </div>

        <div className="flex flex-col gap-5 border-t border-line p-4 md:border-t-0 md:p-8 lg:border-r">
          <blockquote className="font-display text-[22px] leading-[1.3] text-fg md:text-[26px]">
            <span className="text-accent">&gt; </span>
            {about.quote}
          </blockquote>
          {about.paragraphs.map((p) => (
            <p key={p.slice(0, 24)} className="max-w-[64ch] font-prose text-[15px] leading-[1.65] text-fg-2">
              {p}
            </p>
          ))}
        </div>

        <div className="border-t border-line p-4 md:col-span-2 md:p-8 lg:col-span-1 lg:border-t-0">
          <p className="mb-4 text-[11px] text-fg-3">
            <span className="text-fg-2">Engineering Approach</span> — ./pipeline.sh
          </p>
          <ol className="grid gap-y-0 md:grid-cols-3 md:gap-x-6 lg:grid-cols-1">
            {about.approach.map((a, i) => (
              <li key={a.n} className="relative border-l border-line pb-6 pl-5 last:pb-0 md:pb-0 lg:pb-6 lg:last:pb-0">
                <span className="absolute -left-[4px] top-1 size-[7px] bg-accent" />
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[13px] font-bold text-fg">
                    <span className="text-fg-3">{a.n} </span>
                    {a.t}
                  </span>
                  <span className="text-[10px] text-ok">exit 0</span>
                </div>
                <p className="mt-1 font-prose text-[13px] leading-[1.6] text-fg-2">{a.d}</p>
                {i < about.approach.length - 1 && (
                  <span aria-hidden className="mt-2 block text-[10px] text-fg-3 md:hidden lg:block">
                    │ pipe →
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="border-t border-line p-4 md:px-8 md:py-6">
        <p className="mb-3 text-[11px] text-fg-3">
          <Prompt />
          <span className="text-fg">tree stack/</span>
        </p>
        <StackTree core={about.stack.core} supporting={about.stack.supporting} />
      </div>
    </section>
  );
}
