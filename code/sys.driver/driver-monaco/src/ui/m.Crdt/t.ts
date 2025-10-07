import type { t } from './common.ts';
export type * from './t.bind.ts';
export type * from './t.link.ts';

/**
 * Tools for binding between a Monaco editor and
 * an immutable CRDT document interface.
 */
export type EditorCrdtLib = {
  readonly bind: t.EditorCrdtBind;
  readonly useBinding: t.UseEditorCrdtBinding;
  readonly Link: t.EditorCrdtLinkLib;
};
