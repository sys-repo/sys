import { type t, pkg, Pkg } from '../common.ts';

export * from '../common.ts';
export { MonacoEditor } from '../ui.MonacoEditor/mod.ts';

type P = t.MonacoNotes.Props;

/**
 * Constants:
 */
const name = 'Monaco.Notes';
export const D = { name, displayName: Pkg.toString(pkg, name, false) } as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
