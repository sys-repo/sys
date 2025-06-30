import { pkg, Pkg } from '../common.ts';

export { Crdt } from '../../-platforms/-browser/mod.ts';
export * from '../common.ts';

/**
 * Constants:
 */
const name = 'Repo';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  syncEnabled: true,
  silent: false,
} as const;
export const D = DEFAULTS;

export const STORAGE_KEY = {
  DEV: {
    SPEC: `dev:${D.name}`,
    SUBJECT: `dev:${D.name}.subject`,
  },
} as const;
