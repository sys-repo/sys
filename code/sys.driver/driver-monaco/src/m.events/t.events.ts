import type { t } from './common.ts';
export type * from './t.Bus.ts';

type IRange = t.Monaco.I.IRange;
type Base = {
  readonly trigger: 'editor' | 'crdt';
  readonly path: t.ObjectPath;
};

/**
 * Events (CRDT-centric): text + marks
 */
export type EditorEvent =
  | EditorEventText
  | EditorEventMarks
  | EditorEventTextReady
  | EditorEventMarksReady
  | EditorEventCursorPath
  | EditorChangeFoldingArea
  | EditorEventYaml;

/** Fires when CRDT text changes (and is reflected in the editor). */
export type EditorEventText = Base & {
  readonly kind: 'text';
  readonly change: { readonly before: string; readonly after: string };
};

/** Fires when CRDT mark ranges change (folds are a view of these). */
export type EditorEventMarks = Base & {
  readonly kind: 'marks';
  readonly change: { readonly before: IRange[]; readonly after: IRange[] };
};

/** One-shot pulse when initial text is seeded and streams are live. */
export type EditorEventTextReady = {
  readonly kind: 'text:ready';
  readonly path: t.ObjectPath;
};

/** One-shot pulse when initial marks are applied (editor reflects CRDT). */
export type EditorEventMarksReady = {
  readonly kind: 'marks:ready';
  readonly path: t.ObjectPath;
};

/** Event information about the current cursor/path. */
export type EditorEventCursorPath = {
  readonly kind: 'cursor-path';
  readonly path: t.ObjectPath;
  readonly cursor?: Readonly<{ position: t.Monaco.I.IPosition; offset: t.Index }>;
  readonly word?: t.Monaco.I.IRange;
};

/** Event information about the change. */
export type EditorChangeFoldingArea = {
  readonly kind: 'folding-area';
  readonly areas: t.Monaco.I.IRange[];
};

/** Event information about a yaml change. */
export type EditorEventYaml = {
  readonly kind: 'yaml';
  readonly yaml: t.EditorYaml;
};
