"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Figure, Project } from "@/content/data";
import { useCalm } from "@/lib/calm";
import { langColor } from "@/lib/lang";
import { cn } from "@/lib/utils";
import { TechIcon } from "@/components/ui/TechIcon";

export type Man = Pick<Project, "slug" | "title" | "category" | "period" | "summary" | "stack" | "repo"> & {
  gallery: Figure[];
};

const BAYER = [
  [0, 32, 8, 40, 2, 34, 10, 42], [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38], [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41], [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37], [63, 31, 55, 23, 61, 29, 53, 21],
];
const CELL = 5; // css px per dither cell
const STEPS = 14; // hard steps, like the rest of the site's scan-ins
const DUR = 460;
const BAND = 0.15; // width of the amber scan front

const hex = (s: string) => {
  const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})/i.exec(s.trim());
  return m ? [1, 2, 3].map((k) => parseInt(m[k], 16)) : [255, 181, 71];
};

/**
 * Slide projector on a canvas. A slide change is a 1-bit scan: an amber Bayer-dithered
 * front sweeps across the stage (left→right going forward, right→left going back) and the
 * next figure is "developed" behind it — the same 1-bit → photo idea as DitherReveal.
 */
function createProjector(canvas: HTMLCanvasElement, stage: HTMLElement, srcs: string[]) {
  const ctx = canvas.getContext("2d")!;
  const imgs = srcs.map((src) => {
    const im = new window.Image();
    im.decoding = "async";
    im.src = src;
    return im;
  });
  const ready = imgs.map((im) => im.decode().catch(() => undefined));
  const n = srcs.length;
  const mk = () => document.createElement("canvas");
  const from = mk(), to = mk(), layer = mk(), mask = mk(), front = mk();
  let W = 0, H = 0, dpr = 1, cur = -1, raf = 0;

  const fit = (c: HTMLCanvasElement, im?: HTMLImageElement) => {
    c.width = W;
    c.height = H;
    const g = c.getContext("2d")!;
    if (!im?.naturalWidth) return;
    const pad = 14 * dpr;
    const s = Math.min((W - 2 * pad) / im.naturalWidth, (H - 2 * pad) / im.naturalHeight);
    const w = im.naturalWidth * s, h = im.naturalHeight * s;
    g.imageSmoothingQuality = "high";
    g.drawImage(im, (W - w) / 2, (H - h) / 2, w, h);
  };

  const settle = () => {
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(to, 0, 0);
  };

  const resize = () => {
    const r = stage.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = canvas.width = Math.max(1, Math.round(r.width * dpr));
    H = canvas.height = Math.max(1, Math.round(r.height * dpr));
    if (cur < 0) return;
    cancelAnimationFrame(raf);
    fit(to, imgs[cur]);
    settle();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(stage);
  resize();

  async function show(i: number, calm: boolean) {
    if (i === cur) return;
    const dir = cur < 0 || (i - cur + n) % n <= n / 2 ? 1 : -1;
    cur = i;
    await ready[i];
    if (cur !== i) return; // a newer slide was asked for while this one decoded
    cancelAnimationFrame(raf);
    from.width = W;
    from.height = H;
    from.getContext("2d")!.drawImage(canvas, 0, 0);
    fit(to, imgs[i]);
    if (calm) return settle();

    const cw = Math.ceil(W / (CELL * dpr)), ch = Math.ceil(H / (CELL * dpr));
    const v = new Float32Array(cw * ch);
    for (let y = 0; y < ch; y++)
      for (let x = 0; x < cw; x++) {
        const xn = cw > 1 ? x / (cw - 1) : 0;
        v[y * cw + x] = (dir > 0 ? xn : 1 - xn) * 0.7 + (BAYER[y % 8][x % 8] / 64) * 0.3;
      }
    mask.width = front.width = cw;
    mask.height = front.height = ch;
    layer.width = W;
    layer.height = H;
    const mg = mask.getContext("2d")!, fg = front.getContext("2d")!, lg = layer.getContext("2d")!;
    const md = mg.createImageData(cw, ch), fd = fg.createImageData(cw, ch);
    const [r, g, b] = hex(getComputedStyle(document.documentElement).getPropertyValue("--accent"));
    const t0 = performance.now();

    const frame = (now: number) => {
      const p = Math.min(1, (now - t0) / DUR);
      const t = (Math.ceil(p * STEPS) / STEPS) * (1 + BAND);
      for (let k = 0; k < v.length; k++) {
        const shown = v[k] < t - BAND;
        md.data[k * 4 + 3] = shown ? 255 : 0;
        const o = k * 4;
        fd.data[o] = r;
        fd.data[o + 1] = g;
        fd.data[o + 2] = b;
        fd.data[o + 3] = !shown && v[k] < t ? 255 : 0;
      }
      mg.putImageData(md, 0, 0);
      fg.putImageData(fd, 0, 0);

      lg.globalCompositeOperation = "copy";
      lg.drawImage(to, 0, 0);
      lg.globalCompositeOperation = "destination-in";
      lg.imageSmoothingEnabled = false;
      lg.drawImage(mask, 0, 0, W, H);

      ctx.imageSmoothingEnabled = false;
      ctx.globalCompositeOperation = "copy";
      ctx.drawImage(from, 0, 0);
      ctx.globalCompositeOperation = "destination-out";
      ctx.drawImage(mask, 0, 0, W, H);
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(layer, 0, 0);
      ctx.drawImage(front, 0, 0, W, H);

      if (p < 1) raf = requestAnimationFrame(frame);
      else settle();
    };
    raf = requestAnimationFrame(frame);
  }

  return {
    show,
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
    },
  };
}

type Projector = ReturnType<typeof createProjector>;

/**
 * Stage edge = the neighbouring figure peeking in. At rest a thin 1-bit amber sliver of its
 * leading edge; on hover/focus the rail opens in hard steps to show more of it plus the key
 * and number. Clicking sends the scan in from this side.
 */
function Peek({ side, k, fig, onGo }: { side: "prev" | "next"; k: number; fig: Figure; onGo: () => void }) {
  const next = side === "next";
  const num = String(k + 1).padStart(2, "0");
  const mask = {
    maskImage: `url(${fig.thumb})`,
    WebkitMaskImage: `url(${fig.thumb})`,
    maskSize: "auto 100%",
    WebkitMaskSize: "auto 100%",
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    // next shows its left edge coming in, prev its right edge leaving
    maskPosition: next ? "left center" : "right center",
    WebkitMaskPosition: next ? "left center" : "right center",
  };
  return (
    <button
      onClick={onGo}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      aria-label={`${next ? "Berikutnya" : "Sebelumnya"}: gambar ${k + 1}, ${fig.caption}`}
      title={fig.caption}
      className={cn(
        "group/peek absolute inset-y-[18%] z-10 flex items-center",
        next ? "right-0 flex-row-reverse" : "left-0",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "peek-rail relative h-full w-3.5 overflow-hidden border-line-2 bg-bg transition-[width] duration-200 ease-[steps(6,end)] group-hover/peek:w-28 group-focus-visible/peek:w-28",
          next ? "border-l" : "border-r",
        )}
      >
        <span className="absolute inset-y-1 inset-x-0 bg-accent" style={mask} />
      </span>
      <span
        aria-hidden
        className={cn(
          "peek-label flex flex-col items-center gap-1 border border-line-2 bg-bg px-0.5 py-1.5 text-[10px] leading-none text-fg-3 transition-colors [writing-mode:vertical-rl] group-hover/peek:border-accent group-hover/peek:text-accent group-focus-visible/peek:border-accent group-focus-visible/peek:text-accent",
          !next && "rotate-180",
        )}
      >
        {next ? `l ▸ ${num}` : `h ◂ ${num}`}
      </span>
    </button>
  );
}

const LINE_PX = 20; // man pane line-height, for the `less` line counter
const PULL_Q = 100; // px of pull that completes `:q ⏎`
const PULL_DEMO_KEY = "fahmi:man-pull-demo";
const PULL_DEMOS = 3;

function ManViewer({ man, start, onClose }: { man: Man; start: number; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const page = useRef<HTMLDivElement>(null);
  const projector = useRef<Projector | null>(null);
  const swipe = useRef<number | null>(null);
  const [i, setI] = useState(start);
  const [pos, setPos] = useState({ line: 1, total: 1, end: false });
  const calm = useCalm();
  const figs = man.gallery;
  const n = figs.length;
  const go = (d: number) => setI((v) => (v + d + n) % n);
  // every exit goes through history, so the phone's Back gesture closes the viewer instead of leaving the page
  // (a per-open token: history.state survives reloads, so a bare flag could be a stale one and Back would leave the page)
  const token = useRef<string | null>(null);
  const close = () => (token.current && history.state?.manViewer === token.current ? history.back() : onClose());
  const [pull, setPull] = useState(0);
  // the first few opens act the gesture out (frame dips, a ghost `:q ⏎` appears) so nobody has to read the hint
  const [demo, setDemo] = useState(() => {
    try {
      return Number(localStorage.getItem(PULL_DEMO_KEY) ?? 0) < PULL_DEMOS;
    } catch {
      return true;
    }
  });
  const pullFrom = useRef<number | null>(null);
  const typed = pull < 16 ? "" : pull < 50 ? ":" : pull < PULL_Q ? ":q" : ":q ⏎";

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const html = document.documentElement;
    const overflow = html.style.overflow;
    dialog.current?.showModal();
    html.style.overflow = "hidden";
    // ??= keeps one token across StrictMode's double effect run, so only one entry is pushed
    token.current ??= `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    if (history.state?.manViewer !== token.current) {
      history.pushState({ ...history.state, manViewer: token.current }, "");
      try {
        localStorage.setItem(PULL_DEMO_KEY, String(Number(localStorage.getItem(PULL_DEMO_KEY) ?? 0) + 1));
      } catch {}
    }
    return () => {
      html.style.overflow = overflow;
      opener?.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    window.addEventListener("popstate", onClose);
    return () => window.removeEventListener("popstate", onClose);
  }, [onClose]);

  useEffect(() => {
    const p = createProjector(canvas.current!, stage.current!, figs.map((f) => f.src));
    projector.current = p;
    return () => p.dispose();
  }, [figs]);

  useEffect(() => {
    projector.current?.show(i, calm);
  }, [i, calm]);

  // `less` statusline: line x/y (END)
  useEffect(() => {
    const el = page.current!;
    const measure = () =>
      setPos({
        line: Math.floor(el.scrollTop / LINE_PX) + 1,
        total: Math.max(1, Math.round(el.scrollHeight / LINE_PX)),
        end: el.scrollTop + el.clientHeight >= el.scrollHeight - 2,
      });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    el.addEventListener("scroll", measure, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", measure);
    };
  }, []);

  // keys belong to the viewer while it's open: shell digits, "/", "?" and j/k stay out
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Tab" || e.ctrlKey || e.metaKey || e.altKey) return;
      e.stopImmediatePropagation();
      const k = e.key;
      if (k === "ArrowRight" || k === "l") setI((v) => (v + 1) % n);
      else if (k === "ArrowLeft" || k === "h") setI((v) => (v - 1 + n) % n);
      else if (k === "Home") setI(0);
      else if (k === "End") setI(n - 1);
      else if (/^[1-9]$/.test(k) && Number(k) <= n) setI(Number(k) - 1);
      else if (k === "j" || k === "k") page.current?.scrollBy({ top: k === "j" ? LINE_PX * 3 : -LINE_PX * 3 });
      else if (k === "q" || k === "Escape") close();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  });

  const fig = figs[i];
  const num = (k: number) => String(k + 1).padStart(2, "0");
  const file = (f: Figure) => f.src.split("/").pop();
  const NAME = man.slug.toUpperCase();
  const repoName = man.repo?.replace(/^https:\/\/github\.com\/[^/]+\//, "").replace(/\/.*$/, "");

  return createPortal(
    <dialog
      ref={dialog}
      aria-label={`man ${man.slug}: ${man.title}`}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onMouseDown={(e) => e.target === e.currentTarget && close()}
      className="man fixed inset-0 m-auto h-[calc(100dvh-16px)] max-h-none w-[calc(100vw-16px)] max-w-none overflow-visible bg-transparent p-0 text-fg md:h-[min(88vh,780px)] md:w-[min(1180px,94vw)]"
    >
      <div
        className={cn(
          "man-frame tui-shadow relative flex h-full flex-col border-[3px] border-double border-line-2 bg-surface md:grid md:grid-cols-[minmax(0,1.75fr)_minmax(300px,1fr)] md:grid-rows-[auto_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]",
          demo && "man-demo",
        )}
        style={
          {
            "--tui-bg": "var(--color-surface)",
            transform: pull ? `translateY(${Math.min(pull, 180) * 0.5}px)` : undefined,
          } as React.CSSProperties
        }
      >
        <span className="tui-title left-3 text-fg-2">
          ╡ <span className="text-accent">man</span> 1 {man.slug} ╞
        </span>
        <span className="tui-title right-3">
          <button autoFocus onClick={close} className="text-fg-3 transition-colors hover:text-accent">
            [<span className="text-accent">q</span>] tutup
          </button>
        </span>

        {/* phone + tablet: pull the handle down and it types vim's quit, `:` → `:q` → `:q ⏎`; let go on ⏎ to leave */}
        <div
          className="relative flex shrink-0 touch-none select-none justify-center border-b border-line pb-2 pt-3 md:col-span-2 lg:hidden"
          onPointerDown={(e) => {
            setDemo(false);
            pullFrom.current = e.clientY;
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => pullFrom.current !== null && setPull(Math.max(0, e.clientY - pullFrom.current))}
          onPointerUp={() => {
            const quit = pull >= PULL_Q;
            pullFrom.current = null;
            setPull(0);
            if (quit) close();
          }}
          onPointerCancel={() => {
            pullFrom.current = null;
            setPull(0);
          }}
        >
          {typed ? (
            <span className="text-[12px] text-accent">
              {typed}
              {pull < PULL_Q && <span className="cursor-block ml-px" />}
              {pull >= PULL_Q && <span className="text-fg-2"> lepas untuk keluar</span>}
            </span>
          ) : (
            <>
              <span className="man-demo-hint flex items-center gap-2 text-[10.5px] text-fg-3">
                <span aria-hidden className="h-px w-6 bg-line-2" />
                <span aria-hidden className="man-chev inline-block text-accent">▾</span> tarik ke bawah untuk{" "}
                <span className="text-accent">:q</span>
                <span aria-hidden className="h-px w-6 bg-line-2" />
              </span>
              {/* the ghost half of the demo: what pulling types */}
              <span aria-hidden className="man-demo-ghost absolute inset-0 flex items-center opacity-0 justify-center text-[12px] text-accent">
                <span className="mr-2 text-fg-3">⇣</span>:q ⏎
              </span>
            </>
          )}
        </div>

        {/* projector */}
        <div className="flex min-h-0 min-w-0 shrink-0 flex-col border-b border-line-2 md:border-b-0 md:border-r">
          <div
            ref={stage}
            className="backdrop relative h-[38dvh] touch-pan-y select-none bg-bg md:h-auto md:min-h-0 md:flex-1"
            onPointerDown={(e) => (swipe.current = e.clientX)}
            onPointerUp={(e) => {
              const dx = swipe.current === null ? 0 : e.clientX - swipe.current;
              swipe.current = null;
              if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
            }}
          >
            <canvas ref={canvas} role="img" aria-label={fig.caption} className="absolute inset-0 size-full" />
            {fig.video && (
              // lands once the scan has developed its poster underneath
              <video
                key={fig.video}
                src={fig.video}
                poster={fig.src}
                controls
                playsInline
                autoPlay={!calm}
                preload="metadata"
                className="man-video absolute inset-0 size-full object-contain p-3.5"
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
              />
            )}
            <span className="absolute left-3 top-3 border border-line bg-bg px-1.5 py-px text-[10px] text-fg-3">
              FIG.<span className="text-accent">{num(i)}</span>
            </span>
            <span className="absolute right-3 top-3 text-[10px] tabular-nums text-fg-3">
              {num(i)}/{num(n - 1)}
            </span>
            {n > 1 && (
              <>
                <Peek side="prev" k={(i - 1 + n) % n} fig={figs[(i - 1 + n) % n]} onGo={() => go(-1)} />
                <Peek side="next" k={(i + 1) % n} fig={figs[(i + 1) % n]} onGo={() => go(1)} />
              </>
            )}
          </div>
          <div className="flex items-start gap-3 border-t border-line px-3 py-2.5 text-[11px]">
            <p className="min-w-0 flex-1 leading-[1.55]" aria-live="polite">
              <span className="text-accent">› </span>
              <span className="text-fg-3">{file(fig)} </span>
              <span className="font-prose text-[12.5px] text-fg-2">{fig.caption}</span>
            </p>
            {n > 1 && (
              <span className="flex shrink-0 gap-1">
                <button onClick={() => go(-1)} aria-label="Gambar sebelumnya" className="border border-line-2 px-2 py-0.5 text-fg-2 transition-colors hover:border-accent hover:text-accent">
                  ◂ h
                </button>
                <button onClick={() => go(1)} aria-label="Gambar berikutnya" className="border border-line-2 px-2 py-0.5 text-fg-2 transition-colors hover:border-accent hover:text-accent">
                  l ▸
                </button>
              </span>
            )}
          </div>
          {n > 1 && (
            <ol className="scrollbar-none flex gap-2 overflow-x-auto border-t border-line px-3 py-2.5" aria-label="Daftar gambar">
              {figs.map((f, k) => (
                <li key={f.src} className="shrink-0">
                  <button
                    onClick={() => setI(k)}
                    aria-label={`Gambar ${k + 1}: ${f.caption}`}
                    aria-current={k === i}
                    className={cn(
                      "relative block h-14 w-20 overflow-hidden border bg-bg transition-colors",
                      k === i ? "border-accent" : "border-line hover:border-line-2",
                    )}
                  >
                    {k === i ? (
                      <Image src={f.src} alt="" fill sizes="80px" className="object-contain p-1" />
                    ) : (
                      <span
                        aria-hidden
                        className="absolute inset-1 bg-accent opacity-70"
                        style={{
                          maskImage: `url(${f.thumb})`,
                          WebkitMaskImage: `url(${f.thumb})`,
                          maskSize: "contain",
                          WebkitMaskSize: "contain",
                          maskRepeat: "no-repeat",
                          WebkitMaskRepeat: "no-repeat",
                          maskPosition: "center",
                          WebkitMaskPosition: "center",
                        }}
                      />
                    )}
                    <span className={cn("absolute bottom-0 left-0 px-1 text-[9px]", k === i ? "tui-sel" : "bg-bg text-fg-3")}>
                      {num(k)}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* man page */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div ref={page} className="min-h-0 flex-1 overflow-y-auto px-4 pb-5 pt-5 text-[12px] leading-[20px] md:px-5">
            <p className="flex justify-between gap-2 overflow-hidden whitespace-nowrap text-fg-3">
              <span>{NAME}(1)</span>
              <span className="hidden xl:inline">Fahmi&apos;s Manual</span>
              <span>{NAME}(1)</span>
            </p>

            <h4 className="mt-5 font-bold text-fg">NAME</h4>
            <p className="pl-6 text-fg-2">
              <span className="text-accent">{man.slug}</span> — {man.category.toLowerCase()}
            </p>

            <h4 className="mt-5 font-bold text-fg">SYNOPSIS</h4>
            <p className="pl-6 text-fg-2">
              <span className="font-bold text-fg">{man.title}</span> <span className="text-fg-3">[</span>
              {man.period}
              <span className="text-fg-3">]</span>
            </p>

            <h4 className="mt-5 font-bold text-fg">DESCRIPTION</h4>
            <p className="pl-6 font-prose text-[13px] leading-[1.65] text-fg-2">{man.summary}</p>

            <h4 className="mt-5 font-bold text-fg">STACK</h4>
            <ul className="flex flex-wrap gap-1.5 pl-6 pt-1">
              {man.stack.map((s) => (
                <li key={s} className="flex items-center gap-1.5 border border-line px-1.5 text-[10.5px] leading-[18px] text-fg-2">
                  <TechIcon name={s} className={langColor(s, "text-fg-3")} />
                  {s}
                </li>
              ))}
            </ul>

            <h4 className="mt-5 font-bold text-fg">FIGURES</h4>
            <ol className="pl-4">
              {figs.map((f, k) => (
                <li key={f.src}>
                  <button
                    onClick={() => setI(k)}
                    className={cn(
                      "grid w-full grid-cols-[2.25rem_1fr] px-2 text-left transition-colors",
                      k === i ? "tui-sel" : "text-fg-2 hover:text-fg",
                    )}
                  >
                    <span className={k === i ? "" : "text-fg-3"}>{num(k)}</span>
                    <span>{f.caption}</span>
                  </button>
                </li>
              ))}
            </ol>

            {man.repo && (
              <>
                <h4 className="mt-5 font-bold text-fg">SEE ALSO</h4>
                <p className="pl-6">
                  <a href={man.repo} target="_blank" rel="noreferrer" className="text-accent underline-offset-4 hover:underline">
                    {repoName}(1) ↗
                  </a>
                </p>
              </>
            )}

            <p className="mt-6 flex justify-between text-fg-3">
              <span>fahmi.dev</span>
              <span>{NAME}(1)</span>
            </p>
          </div>
          <p className="tui-sel flex shrink-0 justify-between gap-3 px-2 text-[11px] leading-[20px]">
            <span className="truncate">
              Manual page {man.slug}(1) line {pos.line}/{pos.total}
              {pos.end && " (END)"}
            </span>
            <span className="hidden shrink-0 xl:inline">h/l · j/k · q</span>
            <button onClick={close} className="-mr-2 shrink-0 bg-bg px-2.5 font-bold text-accent">
              :q keluar
            </button>
          </p>
        </div>
      </div>
    </dialog>,
    document.body,
  );
}

/** The project's media becomes a button that opens `man <slug>`. */
export function ManTrigger({ man, children }: { man: Man; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const n = man.gallery.length;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={`Buka ${man.title}: ${n} gambar dan deskripsi`}
        className="man-trigger group relative block w-full cursor-zoom-in text-left"
      >
        {children}
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-2 right-2 z-10 border border-line-2 bg-bg px-1.5 py-px text-[10px] text-fg-3 transition-colors group-hover:border-accent group-hover:text-accent group-focus-visible:border-accent group-focus-visible:text-accent"
        >
          man {man.slug} · {String(n).padStart(2, "0")} fig ↵
        </span>
      </button>
      {open && <ManViewer man={man} start={0} onClose={() => setOpen(false)} />}
    </>
  );
}
