import { cn } from "@/lib/utils";

type Ansi = "blue" | "magenta" | "cyan";

// static class strings so Tailwind sees them
const TONE: Record<Ansi, { seg: string; hover: string }> = {
  blue: { seg: "bg-term-blue", hover: "hover:border-term-blue hover:text-term-blue focus-visible:border-term-blue" },
  magenta: { seg: "bg-term-magenta", hover: "hover:border-term-magenta hover:text-term-magenta focus-visible:border-term-magenta" },
  cyan: { seg: "bg-term-cyan", hover: "hover:border-term-cyan hover:text-term-cyan focus-visible:border-term-cyan" },
};

type Props = {
  social: { short: string; label: string; href: string; ansi: string };
  /** hide the label below `sm` (titlebar) */
  compact?: boolean;
  suffix?: string;
  className?: string;
};

/** `ls --color`-style link: the short code is a reverse-video ANSI segment, the label stays neutral. */
export function SocialLink({ social: s, compact, suffix, className }: Props) {
  const tone = TONE[s.ansi as Ansi] ?? TONE.cyan;
  return (
    <a
      href={s.href}
      target="_blank"
      rel="noreferrer"
      className={cn("flex items-stretch border border-line text-fg-2 transition-colors", tone.hover, className)}
    >
      <span className={cn("flex items-center px-1.5 font-bold text-bg", tone.seg)}>{s.short}</span>
      <span className={cn("flex items-center px-1.5", compact && "hidden sm:flex")}>
        {s.label}
        {suffix}
      </span>
    </a>
  );
}
