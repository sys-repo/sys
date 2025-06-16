import { pkg, Pkg } from '../common.ts';

export { Crdt, Input, TextEditor } from '@sys/driver-automerge/ui';
export * from '../common.ts';

/**
 * Constants:
 */
const name = 'Editor.Canvas';
export const DEFAULTS = { name, displayName: Pkg.toString(pkg, name) } as const;
export const D = DEFAULTS;
