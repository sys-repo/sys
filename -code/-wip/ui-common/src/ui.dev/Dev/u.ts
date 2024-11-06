import type { t } from '../common.ts';

/**
 * Helper for looking up a spec within a set of imports.
 */
export function find(specs: t.SpecImports, match: (key: string) => boolean) {
  const ns = Object.keys(specs).find(match);
  const spec = ns ? specs[ns] : undefined;
  return { ns, spec } as const;
}
