import type { t } from './common.ts';
export type * from './t.binding.ts';

/**
 * Tools for binding between a Monaco editor and
 * an immutable CRDT document interface.
 */
export type EditorCrdtLib = Readonly<{
  bind: t.EditorCrdtBind;
  useBinding: t.UseEditorCrdtBinding;
}>;
