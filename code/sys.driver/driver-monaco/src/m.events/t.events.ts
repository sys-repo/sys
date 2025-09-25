import type { t } from './common.ts';
export type * from './t.Bus.ts';

type IPosition = t.Monaco.I.IPosition;
type IRange = t.Monaco.I.IRange;
type Base = {
  readonly trigger: 'editor' | 'crdt';
  readonly path: t.ObjectPath;
};

/**
 * Events (CRDT-centric): text + marks
 */
export type EditorEvent =
  | EditorEventCrdtText
  | EditorEventCrdtMarks
  | EditorEventCursorPath
  | EditorChangeFoldingArea
  | EditorEventYaml;

/** Fires when CRDT text changes (and is reflected in the editor). */
export type EditorEventCrdtText = Base & {
  readonly kind: 'crdt:text';
  readonly change: { readonly before: string; readonly after: string };
};

/** Fires when CRDT mark ranges change (folds are a view of these). */
export type EditorEventCrdtMarks = Base & {
  readonly kind: 'crdt:marks';
  readonly change: { readonly before: IRange[]; readonly after: IRange[] };
};

/** Event information about the current cursor/path. */
export type EditorEventCursorPath = {
  readonly kind: 'cursor-path';
  readonly path: t.ObjectPath;
  readonly cursor?: { readonly position: IPosition; readonly offset: t.Index };
  readonly word?: IRange;
};

/** Event information about the change. */
export type EditorChangeFoldingArea = {
  readonly kind: 'folding-area';
  readonly areas: IRange[];
};

/** Event information about a yaml change. */
export type EditorEventYaml = {
  readonly kind: 'yaml';
  readonly yaml: t.EditorYaml;
};
