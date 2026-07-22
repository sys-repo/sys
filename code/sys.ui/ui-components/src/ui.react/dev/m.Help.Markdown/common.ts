import { Pkg, pkg, type t } from '../common.ts';

export * from '../common.ts';
export { Anchor } from '../../Anchor/mod.ts';
export { Chip } from '../../Chip/mod.ts';
export { ProseMarkdown } from '../../Prose.Markdown/mod.ts';

type P = t.DevHelpMarkdown.Props;

/**
 * Constants:
 */
const name = 'Dev.Help.Markdown';
export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  fontSize: 12,
  lineHeight: 1.45,
} as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
