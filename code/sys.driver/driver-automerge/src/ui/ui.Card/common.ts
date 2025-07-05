import { pkg, Pkg } from '../common.ts';

export * from '../common.ts';
export { DocumentId } from '../ui.DocumentId/mod.ts';
export { Repo } from '../ui.Repo/mod.ts';

/**
 * Constants:
 */
const name = 'Crdt.Card';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name, false),
} as const;
export const D = DEFAULTS;
