import { TuiWindow } from "@/components/ui/TuiWindow";
import { SerialMonitor } from "./SerialMonitor";

// Static ASCII fallback (§6.1) — also what mobile / reduced-motion get once the 3D view
// lands in M3. Pin map is verbatim from ParkEasy_Alat main/config.h.
const BOARD = String.raw`
                    ┌──────────────────┐
              EN ───┤ ┌──────────────┐ ├─── IO23
            IO36 ───┤ │ ESP32-WROOM  │ ├─── IO22 ─ SCL
            IO39 ───┤ │   240 MHz    │ ├─── TX0  ─ UART
            IO34 ───┤ └──────────────┘ ├─── RX0  ─ UART
            IO35 ───┤                  ├─── IO21 ─ SDA
            IO32 ───┤                  ├─── IO19 ─ BUZZER OUT
            IO33 ───┤                  ├─── IO18 ─ BUZZER IN
   ECHO2 ── IO25 ───┤                  ├─── IO5
   TRIG2 ── IO26 ───┤                  ├─── IO17
   ECHO1 ── IO27 ───┤                  ├─── IO16
   TRIG1 ── IO14 ───┤                  ├─── IO4
SERVO OUT ─ IO12 ───┤                  ├─── IO2
 SERVO IN ─ IO13 ───┤                  ├─── IO15
             GND ───┤                  ├─── GND
             VIN ───┤      [USB]       ├─── 3V3
                    └──────────────────┘`.replace(/^\n/, "");

const BUS = [
  ["ch0", "LCD 20x4 in", "0x27"],
  ["ch1", "LCD 20x4 out", "0x27"],
  ["ch2", "VL53L1X A1", "0x29"],
  ["ch3", "VL53L1X A2", "0x29"],
  ["ch4", "VL53L1X B1", "0x29"],
];

// one hue per bus, like a schematic legend
const NETS: [RegExp, string][] = [
  [/^(SCL|SDA|TCA9548A)$/, "text-term-cyan"],
  [/^(TX0|RX0|UART|115200)$/, "text-term-yellow"],
  [/^SERVO (IN|OUT)$/, "text-term-magenta"],
  [/^(TRIG|ECHO)\d$/, "text-term-blue"],
  [/^BUZZER (IN|OUT)$/, "text-term-red"],
  [/^(ESP32-WROOM|240 MHz)$/, "font-bold text-fg"],
  [/^[─│┤├┌┐└┘┴]+$/, "text-fg-3"],
];
const TOKEN =
  /(SERVO (?:IN|OUT)|BUZZER (?:IN|OUT)|240 MHz|ESP32-WROOM|TCA9548A|SCL|SDA|TX0|RX0|UART|115200|(?:TRIG|ECHO)\d|[─│┤├┌┐└┘┴]+)/;

function Line({ text }: { text: string }) {
  return (
    <>
      {text.split(TOKEN).map((part, i) => {
        const hit = NETS.find(([re]) => re.test(part));
        return hit ? (
          <span key={i} className={hit[1]}>
            {part}
          </span>
        ) : (
          part
        );
      })}
      {"\n"}
    </>
  );
}

export function BoardViewport() {
  return (
    <TuiWindow title={<>VIEWPORT_01 — esp32.pinout</>} className="print:hidden">
      {/* font scales with the window (container query) so the full pinout always fits:
          widest line measures 36.6em (every glyph, box drawing included, is 0.6em), so divide by 37.5 */}
      <div className="@container">
      <pre
        aria-hidden
        data-reveal
        className="overflow-x-auto px-3 py-3 text-[min(10.5px,calc((100cqw-24px)/37.5))] leading-[1.2] text-fg-2"
      >
        {BOARD.split("\n").map((l, i) => (
          <Line key={i} text={l} />
        ))}
      </pre>
      </div>
      <p className="sr-only">
        Pinout ESP32 ParkEasy: servo di IO13 dan IO12, buzzer di IO18 dan IO19, HC-SR04 di IO14/27 dan
        IO26/25, I2C SDA IO21 dan SCL IO22 ke multiplexer TCA9548A, UART 115200 baud ke server AI.
      </p>
      <table className="w-full border-t border-line text-left text-[10px]">
        <caption className="sr-only">TCA9548A I2C channels</caption>
        <tbody>
          {BUS.map(([ch, dev, addr]) => (
            <tr key={ch} className="border-b border-line last:border-0">
              <td className="px-3 py-1 text-term-cyan">{ch}</td>
              <td className="py-1 text-fg-2">{dev}</td>
              <td className="px-3 py-1 text-right text-term-yellow">{addr}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <SerialMonitor />
    </TuiWindow>
  );
}
