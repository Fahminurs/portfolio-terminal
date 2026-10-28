"use client";

import { useState } from "react";
import { profile, sections } from "@/content/data";
import { SectionHead } from "@/components/ui/SectionHead";
import { useCalm } from "@/lib/calm";
import { cn } from "@/lib/utils";

const s = sections[7];

type Line = { bar: number; text: string; tone?: "ok" | "err" };
const bar = (n: number, fail = false) =>
  `[${"#".repeat(n)}${(fail ? "x" : "-").repeat(10 - n)}]`;

const FIELDS = [
  { name: "name", flag: "--name", type: "text", auto: "name", max: 80 },
  { name: "email", flag: "--email", type: "email", auto: "email", max: 120 },
] as const;

export function Contact() {
  const calm = useCalm();
  const [log, setLog] = useState<Line[]>([]);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const push = (l: Line) => setLog((x) => [...x, l]);
  const wait = (ms: number) => new Promise((r) => setTimeout(r, calm ? 0 : ms));

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setBusy(true);
    setFailed(false);
    setLog([]);
    push({ bar: 4, text: "validating flags" });
    await wait(260);
    push({ bar: 8, text: "POST /api/contact" });
    let status = 0;
    let error = "";
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      status = res.status;
      if (!res.ok) error = (await res.json().catch(() => ({}))).error ?? res.statusText;
    } catch {
      error = "network unreachable";
    }
    await wait(200);
    if (!error) {
      push({ bar: 10, text: `${status} OK — message delivered. exit 0`, tone: "ok" });
      form.reset();
    } else {
      push({ bar: 4, text: `${status || "ERR"} — ${error}. exit 1`, tone: "err" });
      setFailed(true);
    }
    setBusy(false);
  }

  return (
    <section id={s.id} aria-label="Contact" className="relative">
      <SectionHead n={s.n} label={s.label} cmd={s.cmd} title="Contact" />
      <div className="mt-8 grid border-t border-line lg:grid-cols-[1fr_1.2fr]">
        <div className="flex flex-col justify-between gap-6 border-line p-4 md:p-8 lg:border-r">
          <p className="font-display text-[40px] leading-[0.95] text-fg md:text-[56px]">
            LET&apos;S BUILD
            <br />
            SOMETHING<span className="text-accent">.</span>
          </p>
          <p className="max-w-[40ch] font-prose text-[14px] leading-[1.65] text-fg-2">
            Terbuka untuk posisi full-time, magang, atau kolaborasi proyek software dan embedded. Pesan
            masuk langsung ke inbox saya.
          </p>
          <ul className="flex flex-wrap gap-2 text-[11px]">
            {profile.socials.map((x) => (
              <li key={x.short}>
                <a
                  href={x.href}
                  target="_blank"
                  rel="noreferrer"
                  className="border border-line px-2 py-1 text-fg-2 hover:border-accent hover:text-accent"
                >
                  <span className="text-fg-3">{x.short} </span>
                  {x.label} ↗
                </a>
              </li>
            ))}
          </ul>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col p-4 text-[12.5px] md:p-8">
          <p className="mb-4 text-[11px] text-fg-3">
            guest@fahmi:~$ <span className="text-fg-2">send --to fahmi \</span>
          </p>
          {FIELDS.map((f) => (
            <label key={f.name} className="term-field grid items-center border-b border-line sm:grid-cols-[130px_1fr]">
              <span className="pt-2 text-accent sm:pt-0">{f.flag}</span>
              <input
                name={f.name}
                type={f.type}
                required
                maxLength={f.max}
                autoComplete={f.auto}
                spellCheck={false}
                className="h-10 w-full bg-transparent text-fg caret-accent outline-none placeholder:text-fg-3"
                placeholder={f.name === "email" ? "nama@domain.com" : '"Nama kamu"'}
              />
            </label>
          ))}
          <label className="term-field grid border-b border-line sm:grid-cols-[130px_1fr]">
            <span className="pt-2.5 text-accent">--message</span>
            <textarea
              name="message"
              required
              minLength={10}
              maxLength={4000}
              rows={5}
              className="w-full resize-y bg-transparent py-2.5 text-fg caret-accent outline-none placeholder:text-fg-3"
              placeholder='"Halo Fahmi, ..."'
            />
          </label>
          {/* honeypot */}
          <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

          <button
            type="submit"
            disabled={busy}
            className="mt-6 w-fit border border-accent bg-accent px-4 py-2.5 font-bold text-bg transition-colors hover:bg-transparent hover:text-accent disabled:opacity-50"
          >
            <span className="opacity-60">$ </span>
            {busy ? "executing…" : "execute →"}
          </button>

          <div aria-live="polite" className="mt-5 min-h-16 text-[12px] leading-relaxed">
            {log.map((l, i) => (
              <div
                key={i}
                className={cn(l.tone === "ok" ? "text-ok" : l.tone === "err" ? "text-err" : "text-fg-2")}
              >
                {bar(l.bar, l.tone === "err")} {l.text}
              </div>
            ))}
            {failed && (
              <p className="mt-2 text-fg-3">
                # fallback: kirim pesan lewat{" "}
                <a href={profile.socials[0].href} target="_blank" rel="noreferrer" className="text-fg-2 underline">
                  LinkedIn
                </a>{" "}
                atau{" "}
                <a href={profile.github} target="_blank" rel="noreferrer" className="text-fg-2 underline">
                  GitHub
                </a>
              </p>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
