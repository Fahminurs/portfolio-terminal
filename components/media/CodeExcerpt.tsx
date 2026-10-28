import { codeToHtml, createCssVariablesTheme } from "shiki";
import type { CodeExcerpt as Excerpt } from "@/content/data";
import { TuiWindow } from "@/components/ui/TuiWindow";

const theme = createCssVariablesTheme({ name: "fahmi-term", variablePrefix: "--shiki-" });

// Shiki reads the clock internally; caching makes the output a build-time constant.
async function highlight(src: string, lang: string, from: number) {
  "use cache";
  return codeToHtml(src, {
    lang,
    theme,
    transformers: [
      {
        line(node, line) {
          node.properties["data-line"] = String(from + line - 1);
        },
      },
    ],
  });
}

/**
 * Real source excerpt, highlighted on the server (0 KB JS). Colors come from CSS vars in
 * globals.css so only the accent "lights up" (§2.1: one accent).
 */
export async function CodeExcerpt({ code, on }: { code: Excerpt; on?: "bg" | "surface" }) {
  const [from, to] = code.lines;
  const html = await highlight(code.src, code.lang, from);
  const source = (
    <a href={code.href} target="_blank" rel="noreferrer" className="hover:text-accent">
      {code.repo}@{code.sha} ↗
    </a>
  );

  return (
    <TuiWindow
      on={on}
      title={
        <>
          {code.path} <span className="text-fg-3">:{from}-{to}</span>
        </>
      }
      right={source}
    >
      <div
        className="code-excerpt overflow-x-auto pb-2 text-[11.5px] leading-[1.6]"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <p className="border-t border-line px-3 py-1.5 text-[10px] text-fg-3 sm:hidden">{source}</p>
    </TuiWindow>
  );
}
