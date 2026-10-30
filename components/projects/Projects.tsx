import { projects, sections, type Project } from "@/content/data";
import { SectionHead } from "@/components/ui/SectionHead";
import { Count } from "@/components/ui/Count";
import { NoSignal } from "@/components/ui/NoSignal";
import { DitherReveal } from "@/components/fx/DitherReveal";
import { LoopVideo } from "@/components/fx/LoopVideo";
import { ProjectRow } from "./ProjectRow";
import { ProjectCursor } from "./ProjectCursor";
import { ManTrigger } from "./ManViewer";

const s = sections[2];

function Media({ p }: { p: Project }) {
  if (p.media.kind === "image" && p.media.src && p.gallery?.length) {
    const { slug, title, category, period, summary, stack, repo, gallery } = p;
    return (
      <ManTrigger man={{ slug, title, category, period, summary, stack, repo, gallery }}>
        {p.media.teaser ? (
          <LoopVideo
            src={p.media.teaser.src}
            poster={p.media.src}
            label={p.media.label}
            cta={p.media.teaser.cta}
            className="aspect-video md:aspect-[4/3]"
          />
        ) : (
          <DitherReveal
            src={p.media.src}
            dither={p.media.dither}
            alt={p.title}
            label={p.media.label}
            focusable={false}
            className="aspect-video md:aspect-[4/3]"
          />
        )}
      </ManTrigger>
    );
  }
  if (p.media.kind === "image")
    return (
      <DitherReveal
        src={p.media.src}
        dither={p.media.dither}
        alt={p.title}
        label={p.media.label}
        className="aspect-video md:aspect-[4/3]"
      />
    );
  return <NoSignal label={p.media.label} reason="video demo belum ada" className="aspect-video md:aspect-[4/3]" />;
}

export function Projects() {
  return (
    <section id={s.id} aria-label="Projects" className="relative border-b border-line">
      <SectionHead
        n={s.n}
        label={s.label}
        cmd={s.cmd}
        title="Projek"
        right={
          <span>
            TOTAL: <Count value={projects.length} className="text-fg" />
          </span>
        }
      />
      <ProjectCursor />
      <div className="mt-8 border-t border-line">
        {projects.map((p, i) => (
          <ProjectRow key={p.slug} project={p} index={i} media={<Media p={p} />} />
        ))}
      </div>
    </section>
  );
}
