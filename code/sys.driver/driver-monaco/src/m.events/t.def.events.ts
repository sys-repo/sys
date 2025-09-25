import type { t } from './common.ts';
export type * from './t.Bus.ts';

type IPosition = t.Monaco.I.IPosition;
type IRange = t.Monaco.I.IRange;
type Trigger = 'editor' | 'crdt';

/**
 * Events (CRDT-centric): text + marks
 */
export type EditorEvent = EventText | EventMarks | EventCursorPath | EventEditorFolding | EventYaml;

/** Fires when CRDT text changes (and is reflected in the editor). */
export type EventText = {
  readonly kind: 'text';
  readonly trigger: Trigger;
  readonly path: t.ObjectPath;
  readonly change: { readonly before: string; readonly after: string };
};

/** Fires when CRDT mark ranges change (folds are a view of these). */
export type EventMarks = {
  readonly kind: 'marks';
  readonly trigger: Trigger;
  readonly path: t.ObjectPath;
  readonly change: { readonly before: IRange[]; readonly after: IRange[] };
};

export type EventCursorPath = {
  readonly kind: 'cursor-path';
  readonly path: t.ObjectPath;
  readonly cursor?: { readonly position: IPosition; readonly offset: t.Index };
  readonly word?: IRange;
};

export type EventEditorFolding = {
  readonly kind: 'editor:folding';
  readonly areas: IRange[];
  readonly initial?: boolean;
};

export type EventYaml = {
  readonly kind: 'yaml';
  readonly yaml: t.EditorYaml;
};
