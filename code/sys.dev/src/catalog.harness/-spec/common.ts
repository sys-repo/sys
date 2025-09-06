import { Pkg, pkg } from '../common.ts';
import { HarnessSchema } from '../mod.ts';

export * from '../common.ts';
export { Crdt } from '../../ui/-test.ui.ts';

/**
 * Constants:
 */
const name = HarnessSchema.$id ?? 'unnamed';
const displayName = Pkg.toString(pkg, name, false);
export const D = {
  name,
  displayName,
  STATE_KINDS: ['local-storage', 'crdt', '(none)'],
  STORAGE_KEY: {
    DEV: {
      LOCAL: `dev:${displayName}`,
      CRDT: `dev:${displayName}.crdt`,
    },
  },
} as const;
export const DEFAULTS = D;
