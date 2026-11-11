import { Pkg, pkg } from '../common.ts';

export * from '../common.ts';

/**
 * Constants:
 */
const name = 'Passkey';
export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  debug: false,
  spinner: { width: 24, height: 3 },
  sections: { actions: true, status: true, context: true },
  pendingReason: 'Operation in progress',
  layout: { kind: 'spaced', columnGap: 12, rowGap: 4, align: 'start' },
} as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
