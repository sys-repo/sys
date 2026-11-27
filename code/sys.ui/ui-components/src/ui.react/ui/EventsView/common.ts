import { Pkg, pkg, type t } from '../common.ts';

export * from '../common.ts';
export type * as t from './t.internal.ts';

/**
 * Constants:
 */
const name = 'EventsView';
export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  mode: 'count' satisfies t.EventsView.Mode,
  emptyOpacity: 0.5 satisfies t.Percent,
} as const;
