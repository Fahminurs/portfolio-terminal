import { projects, sections, type Project } from "@/content/data";
import { SectionHead } from "@/components/ui/SectionHead";
import { Count } from "@/components/ui/Count";
import { NoSignal } from "@/components/ui/NoSignal";
import { DitherReveal } from "@/components/fx/DitherReveal";
import { CastPlayer } from "@/components/media/CastPlayer";
import { CodeExcerpt } from "@/components/media/CodeExcerpt";
import { UartWaveform } from "@/components/media/UartWaveform";
import { ProjectRow } from "./ProjectRow";
import { ProjectCursor } from "./ProjectCursor";
import { ManTrigger } from "./ManViewer";

const s = sections[2];
const PARKEASY = new Set(["parkeasy-ai", "parkeasy-alat"]);

function Media({ p }: { p: Project }) {
  if (p.media.kind === "image" && p.media.src && p.gallery?.length) {
    const { slug, title, category, period, summary, stack, repo, gallery } = p;
    return (
      <ManTrigger man={{ slug, title, category, period, summary, stack, repo, gallery }}>
        <DitherReveal
          src={p.media.src}
          dither={p.media.dither}
          alt={p.title}
          label={p.media.label}
          focusable={false}
          className="aspect-video md:aspect-[4/3]"
        />
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

function Block({ cmd, children }: { cmd: string; children: React.ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col gap-2">
      <p className="text-[11px] text-fg-3">
        <span className="text-accent">›</span> {cmd}
      </p>
      {children}
    </section>
  );
}

/** Expand order is fixed by PRD §5.4: recording → waveform → code. */
function Details({ p }: { p: Project }) {
  const hasCast = PARKEASY.has(p.slug);
  if (!hasCast && !p.uart && !p.code) return null;
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      {hasCast && (
        <Block cmd={p.slug === "parkeasy-alat" ? "idf.py monitor" : "python gate_server.py"}>
          <CastPlayer src={p.cast} label={`${p.slug}.cast`} on="surface" />
        </Block>
      )}
      {p.uart && (
        <Block cmd="logic-analyzer --channel TX --decode uart">
          <UartWaveform command={p.uart.command} baud={p.uart.baud} source={p.uart.source} on="surface" />
        </Block>
      )}
      {p.code && (
        <Block cmd={`cat ${p.code.path}`}>
          <CodeExcerpt code={p.code} on="surface" />
        </Block>
      )}
    </div>
  );
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
        {projects.map((p, i) => {
          const details = Details({ p });
          return (
            <ProjectRow key={p.slug} project={p} index={i} media={<Media p={p} />} details={details ?? undefined} />
          );
        })}
      </div>
    </section>
  );
}
