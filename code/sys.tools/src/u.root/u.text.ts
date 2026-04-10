/**
 * Root-local text helpers.
 *
 * Keep these tiny and local; importing package-wide std text helpers here would
 * pull that surface into the first root menu render.
 */

/** Remove leading/trailing newlines without importing package-wide text/std helpers. */
export function trimEdgeNewlines(text: string) {
  return text.replace(/^\n+|\n+$/g, '');
}

/** Minimal local dedent for root startup text blocks. */
export function dedent(text: string) {
  const lines = text.replace(/\r\n?/g, '\n').replace(/^\n/, '').split('\n');
  const indents = lines
    .filter((line) => line.trim().length > 0)
    .map((line) => line.match(/^[ \t]*/)?.[0].length ?? 0);
  const min = indents.length ? Math.min(...indents) : 0;
  const out = lines.map((line) => line.slice(Math.min(min, line.length)));
  if (out.at(-1) === '') out.pop();
  return out.join('\n');
}
