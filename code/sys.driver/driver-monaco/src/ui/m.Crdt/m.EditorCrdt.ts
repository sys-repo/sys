import type { t } from './common.ts';
import { bind } from './u.bind.ts';
import { useBinding } from './use.Binding.ts';

/**
 * Tools for binding between a Monaco editor and
 * an immutable CRDT document interface.
 */
export const EditorCrdt: t.EditorCrdtLib = {
  bind,
  useBinding,
};
