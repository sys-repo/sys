import type { t } from './common.ts';
import { bind } from './u.bind.ts';
import { useBinding } from './use.Binding.ts';
import { useFoldMarks } from './use.FoldMarks.ts';

/**
 * Tools for binding between a Monaco editor and
 * an immutable CRDT document interface.
 */
export const EditorCrdt: t.EditorCrdtLib = {
  bind,
  useBinding,
  useFoldMarks,
};
