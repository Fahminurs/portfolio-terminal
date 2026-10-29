// Procedural PCB textures (drawn on <canvas> at runtime — no image files to 404).
// Board space: x ∈ [-1.4, 1.4], z ∈ [-2.8, 2.8] (cm); canvas y=0 is the antenna end (z = -2.8).

import { CanvasTexture, SRGBColorSpace, LinearSRGBColorSpace } from "three";
import { LEFT, RIGHT } from "./pins";

export const BOARD_W = 2.8;
export const BOARD_L = 5.6;
export const PITCH = 0.254;
export const PIN_Z0 = -1.6;
export const ROW_X = 1.2;
export const pinZ = (i: number) => PIN_Z0 + i * PITCH;

const MASK = "#14532f"; // KiCad-style green soldermask
const COPPER = "#2a7a49"; // copper under mask reads lighter
const GOLD = "#d2a64c"; // ENIG pads
const SILK = "#efeee6";

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!] as const;
}

function tex(c: HTMLCanvasElement, color = true) {
  const t = new CanvasTexture(c);
  t.colorSpace = color ? SRGBColorSpace : LinearSRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** subtle grain so flat colors catch light like real mask / metal */
function grain(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number) {
  const img = ctx.getImageData(0, 0, w, h);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * amount;
    img.data[i] += n;
    img.data[i + 1] += n;
    img.data[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
}

/* ─────────────────────────────── main PCB ── */

export function makePcbTextures() {
  const W = 1024;
  const H = 2048;
  const S = W / BOARD_W; // px per cm
  const X = (x: number) => (x + BOARD_W / 2) * S;
  const Z = (z: number) => (z + BOARD_L / 2) * S;

  const [c, g] = canvas(W, H); // albedo
  const [mc, m] = canvas(W, H); // metalness: white = bare gold
  m.fillStyle = "#000";
  m.fillRect(0, 0, W, H);

  g.fillStyle = MASK;
  g.fillRect(0, 0, W, H);
  grain(g, W, H, 10);

  // copper traces under the mask
  const trace = (pts: [number, number][], width = 0.035) => {
    g.strokeStyle = COPPER;
    g.lineWidth = width * S;
    g.lineJoin = "round";
    g.lineCap = "round";
    g.beginPath();
    pts.forEach(([x, z], i) => (i ? g.lineTo(X(x), Z(z)) : g.moveTo(X(x), Z(z))));
    g.stroke();
  };
  // header pins alongside the module → module edge pads
  for (let i = 0; i < 6; i++) {
    trace([[-ROW_X, pinZ(i)], [-0.9, pinZ(i)]]);
    trace([[ROW_X, pinZ(i)], [0.9, pinZ(i)]]);
  }
  // lower pins fan in to the module's bottom castellations (45° jogs, like a real layout)
  for (let i = 6; i < 13; i++) {
    const k = i - 6;
    const lx = -0.78 + k * 0.1;
    const rx = 0.78 - k * 0.1;
    const zj = -0.12 + k * 0.03;
    trace([[-ROW_X, pinZ(i)], [-1.0 + k * 0.02, pinZ(i)], [lx, zj + 0.15], [lx, -0.25]]);
    trace([[ROW_X, pinZ(i)], [1.0 - k * 0.02, pinZ(i)], [rx, zj + 0.15], [rx, -0.25]]);
  }
  // TX0 / RX0 → CP2102 USB-UART bridge (true on the DevKit), USB D+/D- → CP2102
  trace([[ROW_X, pinZ(2)], [1.02, pinZ(2)], [1.02, 0.95], [0.62, 1.1]], 0.03);
  trace([[ROW_X, pinZ(3)], [1.08, pinZ(3)], [1.08, 1.0], [0.68, 1.18]], 0.03);
  trace([[0.06, 2.4], [0.06, 1.8], [0.38, 1.5]], 0.03);
  trace([[-0.06, 2.4], [-0.06, 1.75], [0.3, 1.45]], 0.03);
  // power: VIN → AMS1117 → 3V3 rail
  trace([[-ROW_X, pinZ(14)], [-0.75, pinZ(14)], [-0.55, 1.5]], 0.07);
  trace([[-0.3, 1.3], [0.1, 0.6], [0.95, 0.6], [ROW_X, pinZ(14)]], 0.06);
  // tented vias
  for (const [x, z] of [[-0.6, 0.3], [0.3, 0.75], [0.95, 0.45], [-0.95, 0.6], [0.2, 1.95], [-0.4, 2.1]] as const) {
    g.fillStyle = COPPER;
    g.beginPath();
    g.arc(X(x), Z(z), 0.045 * S, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#0f3f23";
    g.beginPath();
    g.arc(X(x), Z(z), 0.02 * S, 0, Math.PI * 2);
    g.fill();
  }

  // exposed gold: through-hole header pads (square = pin 1), mounting holes, SMD pads
  const pad = (x: number, z: number, square: boolean) => {
    const r = 0.075 * S;
    for (const ctx of [g, m]) {
      ctx.fillStyle = ctx === g ? GOLD : "#fff";
      if (square) ctx.fillRect(X(x) - r, Z(z) - r, r * 2, r * 2);
      else {
        ctx.beginPath();
        ctx.arc(X(x), Z(z), r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };
  for (let i = 0; i < 15; i++) {
    pad(-ROW_X, pinZ(i), i === 0);
    pad(ROW_X, pinZ(i), i === 0);
  }
  for (const [x, z] of [[-1.1, -2.5], [1.1, -2.5], [-1.1, 2.5], [1.1, 2.5]] as const) {
    for (const ctx of [g, m]) {
      ctx.strokeStyle = ctx === g ? GOLD : "#fff";
      ctx.lineWidth = 0.06 * S;
      ctx.beginPath();
      ctx.arc(X(x), Z(z), 0.13 * S, 0, Math.PI * 2);
      ctx.stroke();
    }
    g.fillStyle = "#0b0c0a";
    g.beginPath();
    g.arc(X(x), Z(z), 0.095 * S, 0, Math.PI * 2);
    g.fill();
  }

  // silkscreen
  g.fillStyle = SILK;
  g.strokeStyle = SILK;
  g.lineWidth = 0.018 * S;
  g.strokeRect(0.06 * S, 0.06 * S, W - 0.12 * S, H - 0.12 * S);
  for (const x of [-ROW_X, ROW_X]) {
    g.strokeRect(X(x) - 0.14 * S, Z(pinZ(0)) - 0.14 * S, 0.28 * S, (14 * PITCH + 0.28) * S);
  }
  g.font = `600 ${Math.round(0.085 * S)}px ui-monospace, Menlo, Consolas, monospace`;
  g.textBaseline = "middle";
  LEFT.forEach((p, i) => {
    g.textAlign = "left";
    g.fillText(p.name, X(-1.02), Z(pinZ(i)));
  });
  RIGHT.forEach((p, i) => {
    g.textAlign = "right";
    g.fillText(p.name, X(1.02), Z(pinZ(i)));
  });
  g.textAlign = "center";
  g.font = `700 ${Math.round(0.12 * S)}px ui-monospace, Menlo, Consolas, monospace`;
  g.fillText("ESP32 DEVKIT V1", X(0), Z(0.32));
  g.font = `600 ${Math.round(0.08 * S)}px ui-monospace, Menlo, Consolas, monospace`;
  g.fillText("EN", X(-0.85), Z(1.98));
  g.fillText("BOOT", X(0.85), Z(1.98));
  g.fillText("U2", X(0.45), Z(0.92));
  g.fillText("U3", X(-0.45), Z(0.98));
  g.fillText("PWR", X(-0.55), Z(1.86));
  g.fillText("IO2", X(0.55), Z(1.86));
  g.textAlign = "right";
  g.font = `500 ${Math.round(0.06 * S)}px ui-monospace, Menlo, Consolas, monospace`;
  g.fillText("rev 1.0 · fahmi.dev", X(1.3), Z(2.72));
  // component courtyards
  for (const [x, z, w, l] of [
    [0.45, 1.25, 0.6, 0.6],
    [-0.45, 1.3, 0.7, 0.55],
  ] as const) {
    g.strokeRect(X(x - w / 2), Z(z - l / 2), w * S, l * S);
  }

  return { map: tex(c), metalnessMap: tex(mc, false) };
}

/* ─────────────────────────────── WROOM module board (antenna end) ── */

export function makeModuleTextures() {
  // module board 1.8 × 2.5 cm
  const S = 320;
  const W = Math.round(1.8 * S);
  const H = Math.round(2.5 * S);
  const [c, g] = canvas(W, H);
  const [mc, m] = canvas(W, H);
  m.fillStyle = "#000";
  m.fillRect(0, 0, W, H);
  g.fillStyle = "#151816";
  g.fillRect(0, 0, W, H);
  grain(g, W, H, 8);

  // PCB meander antenna
  for (const ctx of [g, m]) {
    ctx.strokeStyle = ctx === g ? GOLD : "#fff";
    ctx.lineWidth = 0.035 * S;
    ctx.lineJoin = "miter";
    ctx.beginPath();
    const top = 0.12 * S;
    const left = 0.2 * S;
    const right = W - 0.2 * S;
    ctx.moveTo(right, 0.85 * S);
    let y = top;
    ctx.lineTo(right, top);
    for (let k = 0; k < 6; k++) {
      ctx.lineTo(k % 2 ? right : left, y);
      y += 0.11 * S;
      ctx.lineTo(k % 2 ? right : left, y);
    }
    ctx.stroke();
  }
  // castellated edge pads
  for (const ctx of [g, m]) {
    ctx.fillStyle = ctx === g ? GOLD : "#fff";
    for (let i = 0; i < 14; i++) {
      const y = H - 0.15 * S - i * 0.11 * S;
      if (y < 1.05 * S) break;
      ctx.fillRect(0, y - 0.03 * S, 0.08 * S, 0.06 * S);
      ctx.fillRect(W - 0.08 * S, y - 0.03 * S, 0.08 * S, 0.06 * S);
    }
  }
  return { map: tex(c), metalnessMap: tex(mc, false) };
}

/* ─────────────────────────────── RF shield can ── */

export function makeShieldTexture() {
  const N = 640;
  const [c, g] = canvas(N, N);
  g.fillStyle = "#c8c8c2";
  g.fillRect(0, 0, N, N);
  // brushed metal
  for (let y = 0; y < N; y += 2) {
    g.fillStyle = `rgba(255,255,255,${Math.random() * 0.07})`;
    g.fillRect(0, y, N, 1);
    g.fillStyle = `rgba(0,0,0,${Math.random() * 0.05})`;
    g.fillRect(0, y + 1, N, 1);
  }
  // laser-etched marking
  g.fillStyle = "#6f6f6a";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = "700 46px ui-monospace, Menlo, Consolas, monospace";
  g.fillText("ESP32-WROOM-32", N / 2, N * 0.36);
  g.font = "500 28px ui-monospace, Menlo, Consolas, monospace";
  g.fillText("Wi-Fi · BT · BLE  240MHz", N / 2, N * 0.47);
  // 2D code block
  const cell = 9;
  const ox = N / 2 - cell * 6;
  const oy = N * 0.58;
  for (let y = 0; y < 12; y++)
    for (let x = 0; x < 12; x++)
      if ((x * 7 + y * 13 + x * y) % 3 === 0 || x === 0 || y === 0 || x === 11 || y === 11)
        g.fillRect(ox + x * cell, oy + y * cell, cell - 1, cell - 1);
  return tex(c);
}
