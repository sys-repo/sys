import { type t, pkg, Pkg } from '../common.ts';
export * from '../common.ts';

/**
 * Libs:
 */
export { Crdt } from '@sys/driver-automerge/ui';

/**
 * Constants:
 */
const name = 'CanvasCell';
export const DEFAULTS = { name, displayName: Pkg.toString(pkg, name) } as const;
export const D = DEFAULTS;
