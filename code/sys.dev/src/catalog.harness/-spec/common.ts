import { Pkg, pkg } from '../common.ts';
import { HarnessSchema } from '../mod.ts';

export * from '../common.ts';

/**
 * Constants:
 */
const name = HarnessSchema.$id ?? 'unnamed';
export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  STATE_KINDS: ['local-storage', 'crdt', '(none)'],
  STORAGE_KEY: {
    DEV: `dev:${name}.crdt`,
  },
} as const;
export const DEFAULTS = D;
