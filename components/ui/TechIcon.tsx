import {
  siArduino,
  siCplusplus,
  siDocker,
  siEspressif,
  siExpress,
  siFastapi,
  siFirebase,
  siFlutter,
  siGooglegemini,
  siJavascript,
  siLaravel,
  siMongodb,
  siMysql,
  siNextdotjs,
  siNodedotjs,
  siOpenjdk,
  siPhp,
  siPostgresql,
  siPython,
  siReact,
  siSupabase,
  siUltralytics,
  type SimpleIcon,
} from "simple-icons";
import { cn } from "@/lib/utils";

// Simple Icons (CC0). Java has no entry (Oracle brand rules) → OpenJDK, the reference implementation.
const ICONS: Record<string, SimpleIcon> = {
  "C / C++": siCplusplus,
  "Arduino/C++": siArduino,
  Arduino: siArduino,
  ESP32: siEspressif,
  JavaScript: siJavascript,
  "Node.js": siNodedotjs,
  PHP: siPhp,
  Java: siOpenjdk,
  Express: siExpress,
  "Express.js": siExpress,
  Laravel: siLaravel,
  React: siReact,
  "Next.js": siNextdotjs,
  Flutter: siFlutter,
  MySQL: siMysql,
  PostgreSQL: siPostgresql,
  Firebase: siFirebase,
  Supabase: siSupabase,
  MongoDB: siMongodb,
  FastAPI: siFastapi,
  Python: siPython,
  YOLOv8: siUltralytics,
  "Gemini API": siGooglegemini,
  Docker: siDocker,
};

// no brand exists for these — a terminal glyph, never an invented logo
const GLYPHS: Record<string, string> = {
  IoT: "⌁",
  "IoT API": "⌁",
  "Computer Vision": "◉",
  "RAG / AI": "∑",
  "LSTM / AI": "∑",
  PaddleOCR: "▤",
  VL53L1X: "◎",
  "HC-SR04": "◎",
  HTTPClient: "⇄",
};

/** Monochrome tech logo in currentColor (so it follows the ANSI language hue). */
export function TechIcon({ name, className }: { name: string; className?: string }) {
  const icon = ICONS[name];
  if (icon)
    return (
      <svg viewBox="0 0 24 24" aria-hidden className={cn("size-3 shrink-0 fill-current", className)}>
        <path d={icon.path} />
      </svg>
    );
  return (
    <span aria-hidden className={cn("inline-block w-3 shrink-0 text-center leading-none", className)}>
      {GLYPHS[name] ?? name[0]}
    </span>
  );
}
