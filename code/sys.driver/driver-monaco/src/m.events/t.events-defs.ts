import type { t } from './common.ts';
export type * from './t.Bus.ts';

type IPosition = t.Monaco.I.IPosition;
type IRange = t.Monaco.I.IRange;
type Trigger = 'editor' | 'crdt';

/**
 * Events (CRDT-centric): text + marks
 */
export type EditorEvent =
  | EventDebug
  | EventText
  | EventMarks
  | EventYamlCursorPath
  | EventEditorFolding
  | EventEditorFoldingReady
  | EventYaml;

export type EventDebug = {
  readonly kind: 'editor:debug';
  readonly msg?: string;
  readonly source?: string;
};

/** Fires when CRDT text changes (and is reflected in the editor). */
export type EventText = {
  readonly kind: 'editor:text';
  readonly trigger: Trigger;
  readonly path: t.ObjectPath;
  readonly change: { readonly before: string; readonly after: string };
};

/** Fires when CRDT mark ranges change (folds are a view of these). */
export type EventMarks = {
  readonly kind: 'editor:marks';
  readonly trigger: Trigger;
  readonly path: t.ObjectPath;
  readonly change: { readonly before: IRange[]; readonly after: IRange[] };
};

/**
 * Code Folding Events
 */
export type EventEditorFoldingReady = {
  readonly kind: 'editor:folding.ready';
  readonly areas: IRange[];
};
export type EventEditorFolding = {
  readonly kind: 'editor:folding';
  readonly trigger: Trigger;
  readonly areas: IRange[];
};

/**
 * YAML Editor Events
 */
export type EventYaml = {
  readonly kind: 'editor:yaml:change';
  readonly yaml: t.EditorYaml;
};

export type EventYamlCursorPath = {
  readonly kind: 'editor:yaml:cursor.path';
  readonly path: t.ObjectPath;
  readonly cursor?: { readonly position: IPosition; readonly offset: t.Index };
  readonly word?: IRange;
};
