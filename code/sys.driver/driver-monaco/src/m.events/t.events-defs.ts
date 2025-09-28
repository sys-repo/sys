import type { t } from './common.ts';

type IPosition = t.Monaco.I.IPosition;
type IRange = t.Monaco.I.IRange;
type Trigger = 'editor' | 'crdt';

/**
 * Events (CRDT-centric): text + marks
 */
export type EditorEvent = EventDebug | EventCrdt | EventYaml;

/** Generic debug event (helper). */
export type EventDebug = {
  readonly kind: 'editor:debug';
  readonly msg?: string;
  readonly source?: string;
};

/**
 * CRDT/Editor Events
 */
export type EventCrdt = EventCrdtText | EventCrdtMarks | EventCrdtFolding;

/** Fires when CRDT text changes (and is reflected in the editor). */
export type EventCrdtText = {
  readonly kind: 'editor:crdt:text';
  readonly trigger: Trigger;
  readonly path: t.ObjectPath;
  readonly change: { readonly before: string; readonly after: string };
};

/** Fires when CRDT mark ranges change (folds are a view of these). */
export type EventCrdtMarks = {
  readonly kind: 'editor:crdt:marks';
  readonly trigger: Trigger;
  readonly path: t.ObjectPath;
  readonly change: { readonly before: IRange[]; readonly after: IRange[] };
};

/**
 * Code Folding Events
 */
export type EventCrdtFolding = EventCrdtFoldingReady | EventCrdtFoldingChange;
export type EventCrdtFoldingReady = {
  readonly kind: 'editor:crdt:folding:ready';
  readonly areas: IRange[];
};
export type EventCrdtFoldingChange = {
  readonly kind: 'editor:crdt:folding:change';
  readonly trigger: Trigger;
  readonly areas: IRange[];
};

/**
 * YAML Editor Events
 */
export type EventYaml = EventYamlChange | EventYamlChangeCursorPath;
export type EventYamlChange = {
  readonly kind: 'editor:yaml:change';
  readonly yaml: t.EditorYaml;
};
export type EventYamlChangeCursorPath = {
  readonly kind: 'editor:yaml:change:cursor.path';
  readonly path: t.ObjectPath;
  readonly cursor?: { readonly position: IPosition; readonly offset: t.Index };
  readonly word?: IRange;
};
