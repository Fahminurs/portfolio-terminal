// ESP32 DevKit (30-pin) header order, top (antenna end) → bottom (USB end).
// Functions are verbatim from ParkEasy_Alat main/config.h; unused pins have no `fn`.

export type Bus = "i2c" | "uart" | "servo" | "sonar" | "buzzer" | "power";

export type Pin = { name: string; fn?: string; bus?: Bus };

export const LEFT: Pin[] = [
  { name: "EN", fn: "reset (tombol EN)", bus: "power" },
  { name: "IO36" },
  { name: "IO39" },
  { name: "IO34" },
  { name: "IO35" },
  { name: "IO32" },
  { name: "IO33" },
  { name: "IO25", fn: "HC-SR04 ECHO2 — sensor gerbang keluar", bus: "sonar" },
  { name: "IO26", fn: "HC-SR04 TRIG2 — sensor gerbang keluar", bus: "sonar" },
  { name: "IO27", fn: "HC-SR04 ECHO1 — sensor gerbang masuk", bus: "sonar" },
  { name: "IO14", fn: "HC-SR04 TRIG1 — sensor gerbang masuk", bus: "sonar" },
  { name: "IO12", fn: "servo SG90 — palang gerbang keluar", bus: "servo" },
  { name: "IO13", fn: "servo SG90 — palang gerbang masuk", bus: "servo" },
  { name: "GND", bus: "power" },
  { name: "VIN", fn: "input 5 V", bus: "power" },
];

export const RIGHT: Pin[] = [
  { name: "IO23" },
  { name: "IO22", fn: "I2C SCL → TCA9548A (0x70)", bus: "i2c" },
  { name: "TX0", fn: "UART TX → ParkEasy AI server @115200", bus: "uart" },
  { name: "RX0", fn: "UART RX ← ParkEasy AI server @115200", bus: "uart" },
  { name: "IO21", fn: "I2C SDA → TCA9548A → 3× VL53L1X + 2× LCD", bus: "i2c" },
  { name: "IO19", fn: "buzzer — gerbang keluar", bus: "buzzer" },
  { name: "IO18", fn: "buzzer — gerbang masuk", bus: "buzzer" },
  { name: "IO5" },
  { name: "IO17" },
  { name: "IO16" },
  { name: "IO4" },
  { name: "IO2" },
  { name: "IO15" },
  { name: "GND", bus: "power" },
  { name: "3V3", fn: "output 3.3 V", bus: "power" },
];

/** Scene colors = the ANSI palette tokens (hex, since WebGL can't read CSS vars). */
export const BUS_HEX: Record<Bus, string> = {
  i2c: "#6fc5bf",
  uart: "#e8c267",
  servo: "#c49ad9",
  sonar: "#7fa9e0",
  buzzer: "#e57474",
  power: "#a29f93",
};

/** Matching Tailwind text classes for the HUD. */
export const BUS_TEXT: Record<Bus, string> = {
  i2c: "text-term-cyan",
  uart: "text-term-yellow",
  servo: "text-term-magenta",
  sonar: "text-term-blue",
  buzzer: "text-term-red",
  power: "text-fg-2",
};
