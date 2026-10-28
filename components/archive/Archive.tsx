import { repos, REPO_TOTAL, sections } from "@/content/data";
import { SectionHead } from "@/components/ui/SectionHead";
import { Count } from "@/components/ui/Count";
import { RepoGrid } from "./RepoGrid";

const s = sections[3];

export function Archive() {
  return (
    <section id={s.id} aria-label="Archive" className="relative border-b border-line">
      <SectionHead
        n={s.n}
        label={s.label}
        cmd={s.cmd}
        title="All Repositories"
        count={`TOTAL: ${REPO_TOTAL}`}
        right={
          <span>
            git@github.com:Fahminurs — <Count value={repos.length} className="text-fg" /> shown /{" "}
            <Count value={REPO_TOTAL} className="text-fg" /> total
          </span>
        }
      />
      <RepoGrid repos={repos} />
    </section>
  );
}
