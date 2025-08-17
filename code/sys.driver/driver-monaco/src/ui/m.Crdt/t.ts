import type { t } from './common.ts';
export type * from './t.Bind.ts';
export type * from './t.Link.ts';

/**
 * Tools for binding between a Monaco editor and
 * an immutable CRDT document interface.
 */
export type EditorCrdtLib = Readonly<{
  bind: t.EditorCrdtBind;
  useBinding: t.UseEditorCrdtBinding;
  Link: t.EditorCrdtLinkLib;
}>;
