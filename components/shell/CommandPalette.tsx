"use client";

import { Command } from "cmdk";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { profile, projects, sections } from "@/content/data";
import { OPEN_PROJECT_EVENT, scrollToId } from "@/lib/utils";
import { useShell, type Theme } from "./ShellProvider";
import { KEYS_EVENT } from "./KeyHelp";
import { printResume } from "@/components/hero/ResumePanel";

type Line = { kind: "in" | "out" | "err"; text: string };

type Item = { value: string; hint: string };

const HELP = [
  "help                 daftar command",
  "ls                   daftar section",
  "cd <section|0-7>     lompat ke section",
  "open <project>       buka proyek (eduviana, parkeasy-ai, …)",
  "less resume.pdf      buka resume",
  "lpr resume           cetak / simpan PDF versi CV",
  "plain                mode tenang: tanpa animasi & efek",
  "keys                 bantuan keyboard (atau tekan ?)",
  "whoami               siapa saya",
  "github               buka profil GitHub",
  "theme <amber|green|ice>",
  "clear                bersihkan output",
  "exit                 tutup prompt",
];

export function CommandPalette() {
  const { paletteOpen, setPaletteOpen, setResumeOpen, setTheme, togglePlain } = useShell();
  const [q, setQ] = useState("");
  const [log, setLog] = useState<Line[]>([
    { kind: "out", text: "type 'help' — ↑↓ pilih, enter jalankan, esc tutup" },
  ]);
  const [history, setHistory] = useState<string[]>([]);
  const histIdx = useRef(-1);
  const logRef = useRef<HTMLDivElement>(null);

  const items: Item[] = useMemo(
    () => [
      { value: "help", hint: "daftar command" },
      ...sections.map((s) => ({ value: `cd ${s.label}`, hint: `${s.n} — ${s.cmd}` })),
      ...projects.map((p) => ({ value: `open ${p.slug}`, hint: p.title })),
      { value: "less resume.pdf", hint: "resume viewer" },
      { value: "lpr resume", hint: "print → CV" },
      { value: "plain", hint: "toggle mode tenang" },
      { value: "keys", hint: "bantuan keyboard" },
      { value: "whoami", hint: "" },
      { value: "github", hint: "github.com/Fahminurs" },
      { value: "theme amber", hint: "default" },
      { value: "theme green", hint: "" },
      { value: "theme ice", hint: "" },
      { value: "sudo hire-me", hint: "" },
      { value: "clear", hint: "" },
    ],
    [],
  );

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [log]);

  const close = () => {
    setPaletteOpen(false);
    setQ("");
    histIdx.current = -1;
  };

  const run = (raw: string) => {
    const input = raw.trim();
    if (!input) return;
    setHistory((h) => [input, ...h.filter((x) => x !== input)].slice(0, 30));
    histIdx.current = -1;
    setQ("");
    const [cmd, ...args] = input.split(/\s+/);
    const arg = args.join(" ").toLowerCase();
    const out: Line[] = [{ kind: "in", text: input }];
    const print = (text: string, kind: Line["kind"] = "out") => out.push({ kind, text });

    switch (cmd.toLowerCase()) {
      case "help":
        HELP.forEach((l) => print(l));
        break;
      case "ls":
        sections.forEach((s) => print(`drwxr-xr-x  ${s.n}  ${s.label.padEnd(10)} ${s.cmd}`));
        break;
      case "cd": {
        const target = sections.find((s) => s.label === arg || String(s.n) === arg || s.id === arg);
        if (!arg || arg === "~" || arg === "/") {
          scrollToId("index");
          close();
        } else if (target) {
          scrollToId(target.id);
          close();
        } else print(`cd: no such section: ${arg}`, "err");
        break;
      }
      case "open": {
        const p = projects.find((x) => x.slug === arg || x.title.toLowerCase() === arg);
        if (p) {
          window.dispatchEvent(new CustomEvent(OPEN_PROJECT_EVENT, { detail: p.slug }));
          close();
        } else print(`open: project not found: ${arg || "(empty)"} — try 'ls ./projects' via 'cd projects'`, "err");
        break;
      }
      case "less":
      case "cat":
        if (arg.startsWith("resume")) {
          setResumeOpen(true);
          close();
        } else print(`${cmd}: ${arg || "(empty)"}: No such file`, "err");
        break;
      case "lpr":
        if (arg.startsWith("resume")) {
          close();
          setResumeOpen(true);
          window.setTimeout(printResume, 400); // let the paper mount first
        } else print(`lpr: ${arg || "(empty)"}: No such file — try 'lpr resume'`, "err");
        break;
      case "keys":
        close();
        window.setTimeout(() => window.dispatchEvent(new Event(KEYS_EVENT)), 120);
        return;
      case "plain":
        print(togglePlain() ? "plain mode: on — effects off. run 'plain' again to restore" : "plain mode: off");
        break;
      case "whoami":
        print(`${profile.first.toLowerCase()} ${profile.last.toLowerCase()} — ${profile.role.toLowerCase()}, ${profile.geo.city.toLowerCase()}`);
        break;
      case "github":
        window.open(profile.github, "_blank", "noopener");
        print("opening github.com/Fahminurs …");
        break;
      case "theme":
        if (["amber", "green", "ice"].includes(arg)) {
          setTheme(arg as Theme);
          print(`theme → ${arg}`);
        } else print("usage: theme <amber|green|ice>", "err");
        break;
      case "sudo":
        if (arg === "hire-me") {
          print("[sudo] password for guest: ********");
          print("access granted. redirecting to ./contact");
          window.setTimeout(() => {
            scrollToId("contact");
            close();
          }, 700);
        } else print("guest is not in the sudoers file. This incident will be reported.", "err");
        break;
      case "clear":
        setLog([]);
        return;
      case "exit":
        close();
        return;
      default:
        print(`zsh: command not found: ${cmd} — try 'help'`, "err");
    }
    setLog((l) => [...l, ...out].slice(-120));
  };

  const matches = items.filter((i) => i.value.includes(q.trim().toLowerCase()));

  return (
    <AnimatePresence>
      {paletteOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center bg-bg/80 px-3 pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          onMouseDown={(e) => e.target === e.currentTarget && close()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command prompt"
            className="tui-shadow relative w-full max-w-2xl border-[3px] border-double border-line-2 bg-surface"
            style={{ "--tui-bg": "var(--color-surface)" } as React.CSSProperties}
            initial={{ y: 8 }}
            animate={{ y: 0 }}
            exit={{ y: 8 }}
            transition={{ duration: 0.16, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <span className="tui-title left-1/2 -translate-x-1/2 text-fg-2">
              ╡ <span className="text-accent">⌕</span> cari / command ╞
            </span>
            <div className="flex items-center justify-between border-b border-line px-3 pb-1.5 pt-2.5 text-[10px] text-fg-3">
              <span>guest@fahmi: ~ — interactive</span>
              <span>
                <kbd className="text-fg-2">↑↓</kbd> pilih · <kbd className="text-fg-2">tab</kbd> lengkapi ·{" "}
                <kbd className="text-fg-2">esc</kbd> tutup
              </span>
            </div>

            <div ref={logRef} className="max-h-56 overflow-y-auto px-3 py-2 text-[12px] leading-relaxed">
              {log.map((l, i) => (
                <div
                  key={i}
                  className={
                    l.kind === "in" ? "text-fg" : l.kind === "err" ? "text-err" : "whitespace-pre text-fg-2"
                  }
                >
                  {l.kind === "in" && <span className="text-accent">$ </span>}
                  {l.text}
                </div>
              ))}
            </div>

            <Command
              label="Command prompt"
              loop
              filter={(value, search) => (value.includes(search.trim().toLowerCase()) ? 1 : 0)}
              className="border-t border-line"
            >
              <div className="flex items-center gap-2 px-3">
                <span className="text-[13px] text-accent">$</span>
                <Command.Input
                  autoFocus
                  value={q}
                  onValueChange={(v) => {
                    setQ(v);
                    histIdx.current = -1;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      e.preventDefault();
                      close();
                    } else if (e.key === "Enter" && matches.length === 0) {
                      e.preventDefault();
                      run(q);
                    } else if (e.key === "Tab") {
                      e.preventDefault();
                      if (matches[0]) setQ(matches[0].value);
                    } else if (e.key === "ArrowUp" && (q === "" || histIdx.current >= 0) && history.length) {
                      e.preventDefault();
                      histIdx.current = Math.min(histIdx.current + 1, history.length - 1);
                      setQ(history[histIdx.current]);
                    }
                  }}
                  placeholder="cari bab, projek, atau ketik help…"
                  spellCheck={false}
                  className="h-11 w-full bg-transparent text-[13px] text-fg caret-accent outline-none placeholder:text-fg-3"
                />
              </div>
              <Command.List className="max-h-60 overflow-y-auto border-t border-line py-1 text-[12px]">
                <Command.Empty className="px-3 py-2 text-fg-3">
                  enter → jalankan <span className="text-fg-2">{q}</span>
                </Command.Empty>
                {items.map((i) => (
                  <Command.Item
                    key={i.value}
                    value={i.value}
                    onSelect={run}
                    className="group flex cursor-pointer items-center justify-between px-3 py-1.5 text-fg-2 data-[selected=true]:bg-accent data-[selected=true]:text-bg"
                  >
                    <span>
                      <span className="text-fg-3 group-data-[selected=true]:text-bg">
                        <span className="group-data-[selected=true]:hidden">{"  "}</span>
                        <span className="hidden group-data-[selected=true]:inline">▶ </span>
                      </span>
                      {i.value}
                    </span>
                    <span className="text-[10px] text-fg-3 group-data-[selected=true]:text-bg/70">{i.hint}</span>
                  </Command.Item>
                ))}
              </Command.List>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
