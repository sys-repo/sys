import { pkg, Pkg } from '../common.ts';

export * from '../common.ts';
export { Files } from '../../@sys/ui/ui.Files/mod.ts';

/**
 * Constants:
 */
const name = 'AppShell';
export const D = { name, displayName: Pkg.toString(pkg, name, false) } as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
