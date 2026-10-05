/** Browser syntax floor pinned for equivalent development and production transforms. */
export const BROWSER_SYNTAX_TARGETS = Object.freeze(
  [
    'chrome111',
    'edge111',
    'firefox114',
    'safari16.4',
    'ios16.4',
  ] as const,
);

/** Return one mutable target array for a Vite/OXC configuration boundary. */
export function browserSyntaxTargets() {
  return [...BROWSER_SYNTAX_TARGETS];
}
