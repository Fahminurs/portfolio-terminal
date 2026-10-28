import { education, sections } from "@/content/data";
import { SectionHead } from "@/components/ui/SectionHead";

const s = sections[4];

export function Education() {
  return (
    <section id={s.id} aria-label="Education" className="relative border-b border-line">
      <SectionHead n={s.n} label={s.label} cmd={s.cmd} title="Pendidikan" />
      <div className="mt-8 border-t border-line px-4 py-6 md:px-8">
        <ol className="flex flex-col gap-7">
          {education.map((e, i) => (
            <li key={e.years}>
              {i === 1 && (
                <p className="mb-6 text-[12px] text-fg-3">
                  # switched track: social science → computer engineering
                </p>
              )}
              <div className="grid gap-x-6 gap-y-1 md:grid-cols-[150px_1fr]">
                <span className="text-[12px] tabular-nums text-accent">
                  {e.years}
                  {e.note && <span className="ml-2 text-[10px] text-fg-3">({e.note})</span>}
                </span>
                <div>
                  <h3 className="text-[15px] font-bold text-fg">{e.title}</h3>
                  <p className="mt-0.5 text-[12px] text-fg-2">{e.org}</p>
                  <p className="mt-2 max-w-[62ch] font-prose text-[14px] leading-[1.65] text-fg-2">{e.desc}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
