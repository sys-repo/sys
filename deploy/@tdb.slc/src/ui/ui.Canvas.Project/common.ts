import { pkg, Pkg } from '../common.ts';
export * from '../common.ts';

/**
 * Libs:
 */
export { Crdt } from '@sys/driver-automerge/web/ui';
export { TextPanel } from '@sys/driver-prosemirror';

/**
 * Constants:
 */
const name = 'Canvas.Project';
export const DEFAULTS = { name, displayName: Pkg.toString(pkg, name, false) } as const;
export const D = DEFAULTS;
