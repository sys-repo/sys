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
  lines: { min: 1, max: 1 } satisfies t.EditorPrompt.Lines,
  overflow: 'scroll' satisfies t.EditorPrompt.Overflow,
  submitOn: 'enter:modified' satisfies t.EditorPrompt.SubmitTrigger,
} as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
