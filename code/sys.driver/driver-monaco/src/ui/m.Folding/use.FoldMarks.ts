import { useEffect } from 'react';

import { Obj, type t } from './common.ts';
import { bindFoldMarks } from './u.bind.ts';

/**
 * React hook that keeps Monaco fold regions ⇄ CRDT "fold" marks in sync.
 * Thin wrapper over the pure `bindFoldSync` function.
 */
export const useFoldMarks: t.UseFoldMarks = (args) => {
  const { editor, doc, path, enabled = true } = args;

  /**
   * Effect:
   */
  useEffect(() => {
    if (!enabled || !editor || !doc || !path?.length) return;

    // NB: binder expects hidden-members; cast is fine for runtime editor.
    const life = bindFoldMarks({ editor, doc, path, enabled });

    return life.dispose;
  }, [enabled, editor, doc?.id, doc?.instance, Obj.hash(path)]);
};
