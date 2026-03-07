import { type t } from '../common.ts';

export * from '../common.ts';

/**
 * Constants
 */
export const D = {
  idPrefix: 'tree-content-',
  initialState: { phase: 'idle' } satisfies Pick<t.TreeContentController.State, 'phase'>,
};
export const DEFAULTS = D;
