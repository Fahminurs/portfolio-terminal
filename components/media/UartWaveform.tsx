import { TuiWindow } from "@/components/ui/TuiWindow";

type Props = {
  /** exact line the server writes, e.g. "MASUK:BERHASIL|D 123 DX|14:30:00" */
  command: string;
  baud: number;
  /** how many leading bytes to draw */
  bytes?: number;
  source: string;
  on?: "bg" | "surface";
};

const BIT = 22; // px per bit
const IDLE = 2; // idle bits drawn before/after
const HI = 18;
const LO = 50;

/** 8N1 frame: start(0), d0..d7 LSB-first, stop(1). */
function frame(byte: number) {
  return [0, ...Array.from({ length: 8 }, (_, i) => (byte >> i) & 1), 1];
}

/**
 * UART timing diagram drawn from the real command string (§6.7-B). Rendered on the server
 * as inline SVG so it follows the theme tokens and ships no JS.
 */
export function UartWaveform({ command, baud, bytes = 3, source, on }: Props) {
  const chars = [...command.slice(0, bytes)];
  const levels = [
    ...Array(IDLE).fill(1),
    ...chars.flatMap((c) => frame(c.charCodeAt(0))),
    ...Array(IDLE).fill(1),
  ] as number[];
  const width = levels.length * BIT;
  const bitUs = (1e6 / baud).toFixed(2);

  let d = `M0 ${levels[0] ? HI : LO}`;
  levels.forEach((v, i) => {
    const y = v ? HI : LO;
    d += ` V${y} H${(i + 1) * BIT}`;
  });

  return (
    <TuiWindow on={on} title={<>uart.tx — {baud} 8N1</>} right={source}>
      <p className="px-3 pt-1 text-[10px] text-fg-3">
        <span className="text-fg-2">TX</span> laptop → esp32 · 1 bit = {bitUs} µs
      </p>
      <div className="overflow-x-auto px-3 py-3">
        <svg
          viewBox={`0 0 ${width} 92`}
          width={width}
          height={92}
          role="img"
          aria-label={`UART frame for the first ${chars.length} bytes of "${command}"`}
          className="block max-w-none font-mono"
        >
          {chars.map((c, b) => {
            const x0 = (IDLE + b * 10) * BIT;
            const code = c.charCodeAt(0);
            return (
              <g key={b}>
                <rect x={x0} y={8} width={BIT} height={50} fill="var(--color-raised)" />
                <rect x={x0 + 9 * BIT} y={8} width={BIT} height={50} fill="var(--color-raised)" />
                <line x1={x0} x2={x0} y1={4} y2={62} stroke="var(--color-line-2)" strokeDasharray="2 3" />
                <text x={x0 + 5 * BIT} y={6} textAnchor="middle" fontSize={10} fill="var(--color-term-yellow)">
                  &apos;{c}&apos; 0x{code.toString(16).toUpperCase().padStart(2, "0")}
                </text>
                {["S", "0", "1", "2", "3", "4", "5", "6", "7", "P"].map((t, i) => (
                  <text
                    key={i}
                    x={x0 + i * BIT + BIT / 2}
                    y={76}
                    textAnchor="middle"
                    fontSize={9}
                    fill={i === 0 ? "var(--color-term-red)" : i === 9 ? "var(--color-term-green)" : "var(--color-term-cyan)"}
                  >
                    {t}
                  </text>
                ))}
              </g>
            );
          })}
          <path d={d} fill="none" stroke="var(--color-fg)" strokeWidth={1.5} />
          <text x={0} y={90} fontSize={9} fill="var(--color-fg-3)">
            idle=1 · <tspan fill="var(--color-term-red)">S</tspan>=start(0) ·{" "}
            <tspan fill="var(--color-term-cyan)">0–7</tspan> LSB first ·{" "}
            <tspan fill="var(--color-term-green)">P</tspan>=stop(1)
          </text>
        </svg>
      </div>
      <p className="border-t border-line px-3 py-1.5 text-[11px] text-fg-2">
        <span className="text-fg-3">payload: </span>
        {command}
        <span className="text-fg-3">\n</span>
      </p>
    </TuiWindow>
  );
}
