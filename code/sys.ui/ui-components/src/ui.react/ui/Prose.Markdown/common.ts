import { Pkg, pkg, type t } from '../common.ts';

export * from '../common.ts';

type P = t.ProseMarkdown.Props;

/**
 * Constants:
 */
const name = 'Prose.Markdown';
export const D = { name, displayName: Pkg.toString(pkg, name, false) } as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
