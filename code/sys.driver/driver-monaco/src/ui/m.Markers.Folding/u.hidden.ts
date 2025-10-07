import type { t } from './common.ts';

/**
 * Return all folded regions, independent of scroll position.
 */
export const getHiddenAreas = (editor: t.Monaco.Editor): t.Monaco.I.IRange[] => {
  const vm = wrangle.viewModel(editor);
  return vm?.getHiddenAreas?.() ?? [];
};

/**
 * Atomically replace all folded regions.
 */
export function setHiddenAreas(editor: t.Monaco.Editor, areas: t.Monaco.I.IRange[]) {
  const vm = wrangle.viewModel(editor);
  if (!vm || typeof vm.setHiddenAreas !== 'function') return;
  vm.setHiddenAreas(areas);
}

/**
 * Helpers:
 */
const wrangle = {
  editor(editor: t.Monaco.Editor) {
    return editor as unknown as { _getViewModel?: () => any };
  },
  viewModel(editor: t.Monaco.Editor) {
    // NB: _getViewModel may be missing, or it may return null during teardown.
    return wrangle.editor(editor)._getViewModel?.() ?? null;
  },
} as const;
