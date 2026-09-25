import type { t } from './common.ts';

/** Keep aliases distinct when matching decisions to manifest entries, as the manifest loader does. */
export function entryKey(entry: t.EsmDeps.Entry): string {
  return `${entry.module.registry}:${entry.module.name}:${entry.module.alias}`;
}
