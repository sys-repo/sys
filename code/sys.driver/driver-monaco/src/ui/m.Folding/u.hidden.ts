import { type t } from './common.ts';

/**
 * Return *all* folded regions, independent of scroll position.
 *
 * NOTE: Uses the internal view-model API (`_getViewModel().getHiddenAreas()`),
 *       which has been stable since Monaco 0.21 (2021-03) but is not public.
 *       If that ever changes swap the implementation here only.
 */
export const getHiddenAreas = (
  editor: t.Monaco.Editor, // ← concrete type alias, not interface
): t.Monaco.I.IRange[] => {
  const vm = (editor as any)._getViewModel?.();
  return vm?.getHiddenAreas?.() ?? [];
};
