import { Pkg, pkg } from '../common.ts';

export * from '../common.ts';

/**
 * Constants:
 */
const name = 'EventsView';
export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
} as const;
