// Static ASCII fallback (§6.1) — also what mobile / reduced-motion get once the 3D view
// lands in M3. Pin map is verbatim from ParkEasy_Alat main/config.h.
const BOARD = String.raw`
                    ┌──────────────────┐
              EN ───┤ ┌──────────────┐ ├─── IO23
            IO36 ───┤ │ ESP32-WROOM  │ ├─── IO22 ── SCL ┐
            IO39 ───┤ │   240 MHz    │ ├─── TX0  ── UART│115200
            IO34 ───┤ └──────────────┘ ├─── RX0  ── UART│
            IO35 ───┤                  ├─── IO21 ── SDA ┴ TCA9548A
            IO32 ───┤                  ├─── IO19 ── BUZZER OUT
            IO33 ───┤                  ├─── IO18 ── BUZZER IN
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

export function BoardViewport() {
  return (
    <figure className="relative border border-line bg-surface print:hidden">
      <figcaption className="flex justify-between border-b border-line px-3 py-1.5 text-[10px] text-fg-3">
        <span>
          VIEWPORT_01 — <span className="text-fg-2">esp32.pinout</span>
        </span>
        <span>static · 3D in M3</span>
      </figcaption>
      <pre
        aria-hidden
        className="overflow-x-auto px-3 py-3 text-[9.5px] leading-[1.2] text-fg-2 sm:text-[10.5px]"
      >
        {BOARD}
      </pre>
      <p className="sr-only">
        Pinout ESP32 ParkEasy: servo di IO13 dan IO12, buzzer di IO18 dan IO19, HC-SR04 di IO14/27 dan
        IO26/25, I2C SDA IO21 dan SCL IO22 ke multiplexer TCA9548A, UART 115200 baud ke server AI.
      </p>
      <table className="w-full border-t border-line text-left text-[10px]">
        <caption className="sr-only">TCA9548A I2C channels</caption>
        <tbody>
          {BUS.map(([ch, dev, addr]) => (
            <tr key={ch} className="border-b border-line last:border-0">
              <td className="px-3 py-1 text-accent">{ch}</td>
              <td className="py-1 text-fg-2">{dev}</td>
              <td className="px-3 py-1 text-right text-fg-3">{addr}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
