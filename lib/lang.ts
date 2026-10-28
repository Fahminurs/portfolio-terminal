// Language → ANSI hue, one per family (like linguist colors, but from the terminal palette).
// First match wins; unknown tech stays uncolored rather than getting a random hue.
const LANGS: [RegExp, string][] = [
  [/c\+\+|arduino|esp32|\bc\b/i, "text-term-cyan"],
  [/python|flask|fastapi|yolo|paddle/i, "text-term-blue"],
  [/javascript|typescript|node|express|next|react|html/i, "text-term-yellow"],
  [/php|laravel/i, "text-term-magenta"],
  [/java\b|swing/i, "text-term-red"],
  [/flutter|dart/i, "text-term-green"],
];

export function langColor(lang: string | null | undefined) {
  if (!lang) return "text-fg-3";
  return LANGS.find(([re]) => re.test(lang))?.[1] ?? "text-fg-3";
}
