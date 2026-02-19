import { type t, pkg, Pkg } from '../common.ts';

export * from '../common.ts';

/**
 * Constants:
 */
const name = 'EditorPrompt';
export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  lineCount: 1,
  enterPolicy: {
    onEnter: 'newline',
    onModifiedEnter: 'newline',
  } satisfies t.EditorPrompt.EnterPolicy,
} as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
