import figlet from "figlet";
import ansiRegular from "figlet/importable-fonts/ANSI Regular.js";
import Link from "next/link";
import { Suspense } from "react";
import { sections } from "@/content/data";
import { RequestPath } from "@/components/ui/RequestPath";

figlet.parseFont("ANSI Regular", ansiRegular);
// solid blocks, no shadow glyphs → reads as "404" even at small sizes.
// rendered on the server at build time — figlet never reaches the client
const BANNER = figlet.textSync("404", { font: "ANSI Regular" }).trimEnd().split("\n");
// draw each █ as an SVG cell (1×2, the shape of a terminal cell) so glyph metrics can't smear it
const COLS = Math.max(...BANNER.map((r) => r.length));
const CELLS = BANNER.flatMap((row, y) => [...row].flatMap((c, x) => (c === "█" ? [[x, y]] : [])));

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center gap-7 px-4 py-16 text-[12px] md:px-8">
      <div>
        <p className="text-fg-2">
          <span className="text-fg-3">guest@fahmi:~$ </span>cd{" "}
          <Suspense fallback="…">
            <RequestPath />
          </Suspense>
        </p>
        <p className="mt-1 text-err">zsh: no such file or directory</p>
      </div>

      <div className="flex flex-col gap-3">
        <svg
          aria-hidden
          viewBox={`0 0 ${COLS} ${BANNER.length * 2}`}
          className="h-auto w-[220px] fill-accent sm:w-[300px]"
          shapeRendering="crispEdges"
        >
          {CELLS.map(([x, y]) => (
            <rect key={`${x}-${y}`} x={x} y={y * 2} width={0.92} height={1.84} />
          ))}
        </svg>
        <h1 className="font-display text-[22px] uppercase tracking-[0.04em] text-fg sm:text-[26px]">
          Halaman tidak ditemukan
        </h1>
        <p className="max-w-[46ch] font-prose text-[14px] leading-[1.65] text-fg-2">
          Path ini tidak ada di portofolio. Pilih salah satu direktori di bawah, atau kembali ke{" "}
          <Link href="/" className="text-accent underline underline-offset-2">
            halaman utama
          </Link>
          .
        </p>
      </div>

      <div>
        <p className="text-fg-2">
          <span className="text-fg-3">guest@fahmi:~$ </span>ls /
        </p>
        <ul className="mt-2 grid gap-1">
          {sections.map((s) => (
            <li key={s.id}>
              <Link href={`/#${s.id}`} className="group text-fg-2 hover:text-accent">
                <span className="text-fg-3">drwxr-xr-x  {s.n}  </span>
                <span className="group-hover:underline">{s.label}/</span>
                <span className="hidden text-fg-3 sm:inline">  # {s.cmd}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-fg-2">
        <span className="text-fg-3">guest@fahmi:~$ </span>
        <span className="cursor-block" />
      </p>
    </main>
  );
}
