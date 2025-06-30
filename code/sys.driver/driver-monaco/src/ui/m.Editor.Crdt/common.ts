import { pkg, Pkg } from '../common.ts';

export * as A from '@automerge/automerge/next';
export * from '../common.ts';

/**
 * Constants:
 */
const name = 'CodeEditor.Crdt';
export const DEFAULTS = { name, displayName: Pkg.toString(pkg, name, false) } as const;
export const D = DEFAULTS;
