/**
 * zsh-style PS1 colored the way a default terminal would: user@host green, path blue,
 * `$` dim, command plain. One component so every prompt on the page agrees.
 */
export function Prompt({ path = "~" }: { path?: string }) {
  return (
    <span aria-hidden className="whitespace-nowrap">
      <span className="font-bold text-term-green">guest@fahmi</span>
      <span className="text-fg-3">:</span>
      <span className="text-term-blue">{path}</span>
      <span className="text-fg-3">$ </span>
    </span>
  );
}
